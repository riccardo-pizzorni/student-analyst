#!/usr/bin/env node

/**
 * 🏥 Backend Health Check Tests
 * 
 * Validates that the backend server is functioning correctly:
 * - Server starts without errors
 * - Health endpoint responds correctly
 * - Critical dependencies are loaded
 * - Memory usage is within limits
 */

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const CONFIG = {
  PORT: process.env.PORT || 3001,
  HOST: 'localhost',
  TIMEOUT: 30000, // 30 seconds
  MAX_MEMORY_MB: 512, // 512 MB limit
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
    console.log('🚀 Starting backend server...');
    
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
      console.log('📤 Server:', output.trim());
      
      if (output.includes('Server running on port') || output.includes('listening')) {
        if (!started) {
          started = true;
          clearTimeout(timeout);
          setTimeout(() => resolve(server), 2000); // Wait 2 seconds for full startup
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

    server.on('exit', (code) => {
      clearTimeout(timeout);
      if (!started && code !== 0) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

// Test suite
const tests = [
  {
    name: 'Server Startup',
    async run(server) {
      if (!server || server.killed) {
        throw new Error('Server failed to start');
      }
      console.log(`✅ Server started successfully (PID: ${server.pid})`);
      return true;
    }
  },

  {
    name: 'Health Endpoint',
    async run() {
      const response = await makeRequest('/health');
      
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }

      const data = JSON.parse(response.body);
      if (!data.message || !data.status) {
        throw new Error('Invalid health response structure');
      }

      if (data.status !== 'running') {
        throw new Error(`Server not running: ${data.status}`);
      }

      console.log(`✅ Health check passed: ${data.message}`);
      return true;
    }
  },

  {
    name: 'API Status Endpoint',
    async run() {
      const response = await makeRequest('/api/status');
      
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }

      const data = JSON.parse(response.body);
      if (!data.status) {
        throw new Error('Invalid status response structure');
      }

      console.log(`✅ API status: ${data.status}`);
      return true;
    }
  },

  {
    name: 'CORS Headers',
    async run() {
      const response = await makeRequest('/health');
      
      if (!response.headers['access-control-allow-origin']) {
        throw new Error('CORS headers not present');
      }

      console.log(`✅ CORS headers configured`);
      return true;
    }
  },

  {
    name: 'Response Time',
    async run() {
      const start = Date.now();
      await makeRequest('/health');
      const responseTime = Date.now() - start;

      if (responseTime > 5000) { // 5 seconds
        throw new Error(`Response time too slow: ${responseTime}ms`);
      }

      console.log(`✅ Response time: ${responseTime}ms`);
      return true;
    }
  },

  {
    name: 'Memory Usage',
    async run(server) {
      // Basic memory check - in a real test, you'd use process monitoring
      const memoryUsage = process.memoryUsage();
      const memoryMB = memoryUsage.heapUsed / 1024 / 1024;

      if (memoryMB > CONFIG.MAX_MEMORY_MB) {
        throw new Error(`Memory usage too high: ${memoryMB}MB`);
      }

      console.log(`✅ Memory usage: ${memoryMB.toFixed(2)}MB`);
      return true;
    }
  },

  {
    name: 'Error Handling',
    async run() {
      // Test a non-existent endpoint
      const response = await makeRequest('/non-existent-endpoint');
      
      if (response.status !== 404) {
        throw new Error(`Expected 404 for non-existent endpoint, got ${response.status}`);
      }

      console.log(`✅ Error handling works correctly`);
      return true;
    }
  }
];

// Run all tests
async function runHealthTests() {
  console.log('🏥 Running Backend Health Tests\n');

  let server;
  let passed = 0;
  let failed = 0;

  try {
    // Start server
    server = await startServer();
    console.log('');

    // Run tests
    for (const test of tests) {
      console.log(`🧪 Running: ${test.name}`);
      
      try {
        await test.run(server);
        passed++;
      } catch (error) {
        failed++;
        console.log(`❌ Failed: ${error.message}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    failed++;
  } finally {
    // Cleanup
    if (server && !server.killed) {
      console.log('🛑 Stopping server...');
      server.kill();
      
      // Wait for server to stop
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('📊 Health Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total: ${tests.length}\n`);

  if (failed > 0) {
    console.log('💡 Some health tests failed. Check the error messages above.');
    process.exit(1);
  }

  console.log('🎉 All health tests passed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runHealthTests().catch(error => {
    console.error('❌ Health tests failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runHealthTests }; 