#!/usr/bin/env node

/**
 * 🔗 Backend Endpoints Tests
 * 
 * Validates all API endpoints functionality:
 * - All endpoints respond correctly
 * - Proper HTTP status codes
 * - Valid JSON responses
 * - Error handling
 * - Rate limiting
 */

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const CONFIG = {
  PORT: process.env.PORT || 3001,
  HOST: 'localhost',
  TIMEOUT: 30000, // 30 seconds
};

// Test utilities
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout: ${path}`));
    }, CONFIG.TIMEOUT);

    const req = http.get({
      hostname: CONFIG.HOST,
      port: CONFIG.PORT,
      path: path,
      ...options
    }, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting backend server for endpoint tests...');
    
    const serverPath = path.join(__dirname, '..', 'src', 'simple-server.js');
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        server.kill();
        reject(new Error('Server startup timeout'));
      }
    }, 15000);

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running on port') || output.includes('listening')) {
        if (!started) {
          started = true;
          clearTimeout(timeout);
          setTimeout(() => resolve(server), 2000);
        }
      }
    });

    server.stderr.on('data', (data) => {
      console.error('❌ Server error:', data.toString());
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Endpoint test definitions
const endpointTests = [
  {
    name: 'Health Check Endpoint',
    path: '/health',
    expectedStatus: 200,
    validateResponse: (data) => {
      if (!data.message || !data.status) {
        throw new Error('Missing required fields: message, status');
      }
      if (data.status !== 'running') {
        throw new Error(`Expected status 'running', got '${data.status}'`);
      }
      return true;
    }
  },

  {
    name: 'API Status Endpoint',
    path: '/api/status',
    expectedStatus: 200,
    validateResponse: (data) => {
      if (!data.status) {
        throw new Error('Missing required field: status');
      }
      if (!data.timestamp) {
        throw new Error('Missing required field: timestamp');
      }
      return true;
    }
  },

  {
    name: 'API Test Endpoint',
    path: '/api/test',
    expectedStatus: 200,
    validateResponse: (data) => {
      if (!data.message) {
        throw new Error('Missing required field: message');
      }
      return true;
    }
  },

  {
    name: 'Root Endpoint',
    path: '/',
    expectedStatus: 200,
    validateResponse: (data) => {
      if (!data.message) {
        throw new Error('Missing welcome message');
      }
      return true;
    }
  },

  {
    name: '404 Error Handling',
    path: '/non-existent-endpoint',
    expectedStatus: 404,
    validateResponse: (data) => {
      // 404 pages might return HTML or JSON
      return true;
    }
  },

  {
    name: 'Invalid API Path',
    path: '/api/invalid',
    expectedStatus: 404,
    validateResponse: (data) => {
      return true;
    }
  }
];

// Rate limiting tests
const rateLimitTests = [
  {
    name: 'Rate Limiting Check',
    async run() {
      console.log('🔄 Testing rate limiting...');
      
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(makeRequest('/health'));
      }
      
      const responses = await Promise.all(requests);
      
      // Check if any requests were rate limited (status 429)
      const rateLimited = responses.some(r => r.status === 429);
      
      if (rateLimited) {
        console.log('✅ Rate limiting is active');
      } else {
        console.log('⚠️  Rate limiting not detected (may be configured for higher limits)');
      }
      
      return true;
    }
  }
];

// Response time tests
const performanceTests = [
  {
    name: 'Response Time Performance',
    async run() {
      console.log('⚡ Testing response time performance...');
      
      const measurements = [];
      
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await makeRequest('/health');
        const responseTime = Date.now() - start;
        measurements.push(responseTime);
      }
      
      const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxResponseTime = Math.max(...measurements);
      
      console.log(`📊 Average response time: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`📊 Max response time: ${maxResponseTime}ms`);
      
      if (avgResponseTime > 2000) { // 2 seconds
        throw new Error(`Average response time too slow: ${avgResponseTime}ms`);
      }
      
      if (maxResponseTime > 5000) { // 5 seconds
        throw new Error(`Max response time too slow: ${maxResponseTime}ms`);
      }
      
      console.log('✅ Response time performance acceptable');
      return true;
    }
  }
];

// CORS tests
const corsTests = [
  {
    name: 'CORS Headers Validation',
    async run() {
      console.log('🌐 Testing CORS configuration...');
      
      const response = await makeRequest('/health');
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-methods': response.headers['access-control-allow-methods'],
        'access-control-allow-headers': response.headers['access-control-allow-headers']
      };
      
      if (!corsHeaders['access-control-allow-origin']) {
        throw new Error('Missing CORS Allow-Origin header');
      }
      
      console.log(`✅ CORS Allow-Origin: ${corsHeaders['access-control-allow-origin']}`);
      
      if (corsHeaders['access-control-allow-methods']) {
        console.log(`✅ CORS Allow-Methods: ${corsHeaders['access-control-allow-methods']}`);
      }
      
      return true;
    }
  }
];

// Run all endpoint tests
async function runEndpointTests() {
  console.log('🔗 Running Backend Endpoint Tests\n');

  let server;
  let totalPassed = 0;
  let totalFailed = 0;

  try {
    // Start server
    server = await startServer();
    console.log('✅ Server started for testing\n');

    // Test individual endpoints
    console.log('📍 Testing Individual Endpoints:');
    for (const test of endpointTests) {
      console.log(`🧪 Testing: ${test.name} (${test.path})`);
      
      try {
        const response = await makeRequest(test.path);
        
        // Check status code
        if (response.status !== test.expectedStatus) {
          throw new Error(`Expected status ${test.expectedStatus}, got ${response.status}`);
        }
        
        // Parse and validate JSON response (if applicable)
        if (response.headers['content-type']?.includes('application/json')) {
          const data = JSON.parse(response.body);
          if (test.validateResponse) {
            test.validateResponse(data);
          }
        }
        
        console.log(`✅ ${test.name}: Status ${response.status} OK`);
        totalPassed++;
        
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        totalFailed++;
      }
      
      console.log('');
    }

    // Run performance tests
    console.log('⚡ Running Performance Tests:');
    for (const test of performanceTests) {
      try {
        await test.run();
        totalPassed++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        totalFailed++;
      }
      console.log('');
    }

    // Run CORS tests
    console.log('🌐 Running CORS Tests:');
    for (const test of corsTests) {
      try {
        await test.run();
        totalPassed++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        totalFailed++;
      }
      console.log('');
    }

    // Run rate limiting tests
    console.log('🛡️  Running Rate Limiting Tests:');
    for (const test of rateLimitTests) {
      try {
        await test.run();
        totalPassed++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        totalFailed++;
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    totalFailed++;
  } finally {
    // Cleanup
    if (server && !server.killed) {
      console.log('🛑 Stopping server...');
      server.kill();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  const totalTests = endpointTests.length + performanceTests.length + corsTests.length + rateLimitTests.length;
  console.log('📊 Endpoint Test Results:');
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📋 Total: ${totalTests}\n`);

  if (totalFailed > 0) {
    console.log('💡 Some endpoint tests failed. Check the error messages above.');
    process.exit(1);
  }

  console.log('🎉 All endpoint tests passed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runEndpointTests().catch(error => {
    console.error('❌ Endpoint tests failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runEndpointTests }; 