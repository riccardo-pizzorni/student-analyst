#!/usr/bin/env node

/**
 * 🧪 Backend Complete Test Suite
 * ==============================
 *
 * Test completo del backend Student Analyst
 * Verifica tutti gli endpoint e funzionalità principali
 */

const http = require('http');

const CONFIG = {
  PORT: process.env.PORT || 10000,
  HOST: 'localhost',
  TIMEOUT: 10000,
};

// Utility per fare richieste HTTP
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout: ${path}`));
    }, CONFIG.TIMEOUT);

    const req = http.get(
      {
        hostname: CONFIG.HOST,
        port: CONFIG.PORT,
        path: path,
        ...options,
      },
      res => {
        clearTimeout(timeout);
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: jsonData,
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data,
            });
          }
        });
      }
    );

    req.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Test definitions
const tests = [
  {
    name: 'Health Check Endpoint',
    path: '/health',
    expectedStatus: 200,
    validate: response => {
      if (!response.data.status || response.data.status !== 'OK') {
        throw new Error('Health check should return status OK');
      }
      if (!response.data.timestamp) {
        throw new Error('Health check should include timestamp');
      }
      return true;
    },
  },
  {
    name: 'API Health Check',
    path: '/api/health',
    expectedStatus: 200,
    validate: response => {
      if (!response.data.success) {
        throw new Error('API health should return success true');
      }
      if (!response.data.services) {
        throw new Error('API health should include services info');
      }
      return true;
    },
  },
  {
    name: 'Timeframes Endpoint',
    path: '/api/timeframes',
    expectedStatus: 200,
    validate: response => {
      if (!response.data.success) {
        throw new Error('Timeframes should return success true');
      }
      if (
        !response.data.timeframes ||
        !Array.isArray(response.data.timeframes)
      ) {
        throw new Error('Timeframes should return array of timeframes');
      }
      if (response.data.timeframes.length === 0) {
        throw new Error('Timeframes array should not be empty');
      }
      return true;
    },
  },
  {
    name: '404 Error Handling',
    path: '/non-existent-endpoint',
    expectedStatus: 404,
    validate: response => {
      if (!response.data.error || response.data.error !== 'Not Found') {
        throw new Error('404 should return "Not Found" error');
      }
      return true;
    },
  },
];

// Run all tests
async function runTests() {
  console.log('🧪 Running Backend Complete Test Suite\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`   Endpoint: ${test.path}`);

      const response = await makeRequest(test.path);

      // Check status code
      if (response.status !== test.expectedStatus) {
        throw new Error(
          `Expected status ${test.expectedStatus}, got ${response.status}`
        );
      }

      // Run custom validation
      if (test.validate) {
        test.validate(response);
      }

      console.log(`   ✅ PASSED (${response.status})`);
      passed++;
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  // Summary
  console.log('📊 Test Results Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📋 Total: ${tests.length}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backend is working correctly.');
    process.exit(0);
  } else {
    console.log('\n💡 Some tests failed. Check the error messages above.');
    process.exit(1);
  }
}

// Check if server is running before starting tests
async function checkServerHealth() {
  try {
    await makeRequest('/health');
    console.log('✅ Server is running and responding');
    return true;
  } catch (error) {
    console.error('❌ Server is not running or not responding');
    console.error('   Make sure to start the server with: npm start');
    return false;
  }
}

// Main execution
async function main() {
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  await runTests();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runTests, makeRequest };
