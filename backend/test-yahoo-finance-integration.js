#!/usr/bin/env node

/**
 * 🧪 Yahoo Finance Integration Test Suite
 * =======================================
 *
 * Test completo dell'integrazione Yahoo Finance nel backend Student Analyst
 * Verifica endpoint, fallback system, e gestione errori
 */

const http = require('http');

const CONFIG = {
  PORT: process.env.PORT || 10000,
  HOST: 'localhost',
  TIMEOUT: 30000, // 30 seconds for deep historical data
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

// Test definitions for Yahoo Finance integration
const yahooFinanceTests = [
  {
    name: 'Yahoo Finance - Single Ticker Deep Historical Data',
    path: '/api/financial/AAPL?timeframe=5y',
    expectedStatus: 200,
    validate: response => {
      if (!response.data.success) {
        throw new Error('Yahoo Finance request should return success true');
      }
      if (!response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('Yahoo Finance should return array of historical data');
      }
      if (response.data.data.length < 1000) {
        throw new Error(
          'Yahoo Finance should return at least 1000 data points for 5y'
        );
      }
      if (response.data.metadata.source !== 'yahoo_finance') {
        throw new Error('Data source should be yahoo_finance');
      }
      if (response.data.fallbackUsed) {
        throw new Error(
          'Should not use fallback for valid Yahoo Finance request'
        );
      }
      return true;
    },
  },
  {
    name: 'Yahoo Finance - Maximum Historical Data (15+ years)',
    path: '/api/financial/MSFT?timeframe=max',
    expectedStatus: 200,
    validate: response => {
      if (!response.data.success) {
        throw new Error(
          'Yahoo Finance max timeframe should return success true'
        );
      }
      if (!response.data.data || response.data.data.length < 3000) {
        throw new Error(
          'Yahoo Finance max timeframe should return 3000+ data points'
        );
      }
      if (response.data.metadata.dataPoints < 3000) {
        throw new Error('Metadata should indicate 3000+ data points');
      }
      return true;
    },
  },
  {
    name: 'Yahoo Finance - Batch Ticker Processing',
    path: '/api/financial/batch?symbols=AAPL,MSFT,GOOGL&timeframe=1y',
    expectedStatus: 200,
    validate: response => {
      if (!response.data.success) {
        throw new Error('Batch processing should return success true');
      }
      if (!response.data.results || !Array.isArray(response.data.results)) {
        throw new Error('Batch processing should return array of results');
      }
      if (response.data.results.length !== 3) {
        throw new Error(
          'Batch processing should return 3 results for 3 tickers'
        );
      }
      response.data.results.forEach(result => {
        if (!result.success) {
          throw new Error('All batch results should be successful');
        }
        if (result.metadata.source !== 'yahoo_finance') {
          throw new Error('All batch results should use Yahoo Finance');
        }
      });
      return true;
    },
  },
  {
    name: 'Yahoo Finance - Different Timeframes',
    path: '/api/financial/GOOGL?timeframe=1mo',
    expectedStatus: 200,
    validate: response => {
      if (!response.data.success) {
        throw new Error('1mo timeframe should return success true');
      }
      if (!response.data.data || response.data.data.length < 20) {
        throw new Error('1mo timeframe should return at least 20 data points');
      }
      return true;
    },
  },
  {
    name: 'Yahoo Finance - Invalid Symbol Handling',
    path: '/api/financial/INVALID999?timeframe=1y',
    expectedStatus: 400,
    validate: response => {
      if (!response.data.error) {
        throw new Error('Invalid symbol should return error');
      }
      if (
        !response.data.error.type ||
        response.data.error.type !== 'INVALID_SYMBOL'
      ) {
        throw new Error(
          'Invalid symbol should return INVALID_SYMBOL error type'
        );
      }
      return true;
    },
  },
  {
    name: 'Yahoo Finance - Fallback to Alpha Vantage (Simulated)',
    path: '/api/financial/TEST_FALLBACK?timeframe=1y',
    expectedStatus: 200,
    validate: response => {
      if (!response.data.success) {
        throw new Error('Fallback should return success true');
      }
      if (
        response.data.metadata.source === 'yahoo_finance' &&
        !response.data.fallbackUsed
      ) {
        // If Yahoo Finance worked, that's fine
        return true;
      }
      if (
        response.data.metadata.source === 'alpha_vantage' &&
        response.data.fallbackUsed
      ) {
        // If fallback was used, that's also fine
        return true;
      }
      throw new Error(
        'Response should indicate either Yahoo Finance success or Alpha Vantage fallback'
      );
    },
  },
  {
    name: 'Yahoo Finance - Data Source Health Check',
    path: '/api/health/datasources',
    expectedStatus: 200,
    validate: response => {
      if (!response.data.success) {
        throw new Error('Data source health check should return success true');
      }
      if (!response.data.sources || !response.data.sources.yahoo_finance) {
        throw new Error('Health check should include Yahoo Finance status');
      }
      if (!response.data.sources.alpha_vantage) {
        throw new Error('Health check should include Alpha Vantage status');
      }
      if (
        response.data.sources.yahoo_finance.status !== 'ok' &&
        response.data.sources.yahoo_finance.status !== 'error'
      ) {
        throw new Error('Yahoo Finance status should be ok or error');
      }
      return true;
    },
  },
  {
    name: 'Yahoo Finance - Performance Metrics',
    path: '/api/financial/AAPL?timeframe=1y&includeMetrics=true',
    expectedStatus: 200,
    validate: response => {
      if (!response.data.success) {
        throw new Error(
          'Performance metrics request should return success true'
        );
      }
      if (!response.data.performance) {
        throw new Error('Response should include performance metrics');
      }
      if (typeof response.data.performance.responseTime !== 'number') {
        throw new Error('Performance should include response time');
      }
      if (response.data.performance.responseTime > 30000) {
        throw new Error('Response time should be reasonable (< 30s)');
      }
      return true;
    },
  },
  {
    name: 'Yahoo Finance - Data Quality Validation',
    path: '/api/financial/TSLA?timeframe=6mo',
    expectedStatus: 200,
    validate: response => {
      if (!response.data.success) {
        throw new Error('Data quality validation should return success true');
      }
      if (!response.data.data || response.data.data.length === 0) {
        throw new Error('Should return historical data');
      }

      // Validate data structure
      const firstDataPoint = response.data.data[0];
      if (
        !firstDataPoint.date ||
        !firstDataPoint.open ||
        !firstDataPoint.high ||
        !firstDataPoint.low ||
        !firstDataPoint.close ||
        !firstDataPoint.volume
      ) {
        throw new Error('Data points should have all required fields');
      }

      // Validate data consistency
      response.data.data.forEach(point => {
        if (point.high < point.low) {
          throw new Error('High should be >= low');
        }
        if (
          point.open < 0 ||
          point.high < 0 ||
          point.low < 0 ||
          point.close < 0
        ) {
          throw new Error('Prices should be positive');
        }
        if (point.volume < 0) {
          throw new Error('Volume should be positive');
        }
      });

      return true;
    },
  },
  {
    name: 'Yahoo Finance - Error Handling and Retry',
    path: '/api/financial/ERROR_TEST?timeframe=1y',
    expectedStatus: 500,
    validate: response => {
      if (!response.data.error) {
        throw new Error('Error test should return error response');
      }
      if (!response.data.error.type) {
        throw new Error('Error should have type');
      }
      if (!response.data.error.message) {
        throw new Error('Error should have message');
      }
      return true;
    },
  },
];

// Run Yahoo Finance integration tests
async function runYahooFinanceTests() {
  console.log('🧪 Running Yahoo Finance Integration Test Suite\n');

  let passed = 0;
  let failed = 0;

  for (const test of yahooFinanceTests) {
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
  console.log('📊 Yahoo Finance Integration Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📋 Total: ${yahooFinanceTests.length}`);

  if (failed === 0) {
    console.log('\n🎉 All Yahoo Finance integration tests passed!');
    console.log('   ✅ Deep historical data (15+ years) working');
    console.log('   ✅ Batch ticker processing working');
    console.log('   ✅ Fallback system working');
    console.log('   ✅ Error handling working');
    console.log('   ✅ Performance metrics working');
    return true;
  } else {
    console.log('\n💡 Some Yahoo Finance integration tests failed.');
    console.log('   Check the error messages above for details.');
    return false;
  }
}

// Performance benchmark tests
async function runPerformanceBenchmarks() {
  console.log('\n🚀 Running Performance Benchmarks\n');

  const benchmarks = [
    {
      name: 'Single Ticker - 1 Year',
      path: '/api/financial/AAPL?timeframe=1y',
      maxTime: 10000, // 10 seconds
    },
    {
      name: 'Single Ticker - 5 Years',
      path: '/api/financial/MSFT?timeframe=5y',
      maxTime: 15000, // 15 seconds
    },
    {
      name: 'Single Ticker - Max Historical',
      path: '/api/financial/GOOGL?timeframe=max',
      maxTime: 30000, // 30 seconds
    },
    {
      name: 'Batch Processing - 3 Tickers',
      path: '/api/financial/batch?symbols=AAPL,MSFT,GOOGL&timeframe=1y',
      maxTime: 20000, // 20 seconds
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const benchmark of benchmarks) {
    try {
      console.log(`⏱️  Benchmarking: ${benchmark.name}`);

      const startTime = Date.now();
      const response = await makeRequest(benchmark.path);
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.status !== 200) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      if (duration > benchmark.maxTime) {
        throw new Error(
          `Performance threshold exceeded: ${duration}ms > ${benchmark.maxTime}ms`
        );
      }

      console.log(
        `   ✅ PASSED: ${duration}ms (threshold: ${benchmark.maxTime}ms)`
      );
      passed++;
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failed++;
    }
  }

  console.log('\n📊 Performance Benchmark Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📋 Total: ${benchmarks.length}`);

  return failed === 0;
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
  console.log('🎯 Yahoo Finance Integration Test Suite');
  console.log('=====================================\n');

  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  const integrationTestsPassed = await runYahooFinanceTests();
  const performanceTestsPassed = await runPerformanceBenchmarks();

  console.log('\n🎯 Final Results:');
  console.log(
    `   Integration Tests: ${integrationTestsPassed ? '✅ PASSED' : '❌ FAILED'}`
  );
  console.log(
    `   Performance Tests: ${performanceTestsPassed ? '✅ PASSED' : '❌ FAILED'}`
  );

  if (integrationTestsPassed && performanceTestsPassed) {
    console.log(
      '\n🎉 All tests passed! Yahoo Finance integration is working correctly.'
    );
    console.log('   ✅ Deep historical data available');
    console.log('   ✅ Batch processing working');
    console.log('   ✅ Fallback system operational');
    console.log('   ✅ Performance within acceptable limits');
    process.exit(0);
  } else {
    console.log('\n💡 Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test suite failed with error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runYahooFinanceTests,
  runPerformanceBenchmarks,
  checkServerHealth,
};
