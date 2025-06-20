/**
 * STUDENT ANALYST - Backend Monitoring Tests
 * Script per testare gli endpoint di monitoraggio del backend
 */

const http = require('http');
const https = require('https');

// Configurazione
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:10000';
const ALPHA_VANTAGE_TEST_URL =
  'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=demo';

// Colori per output console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

// Funzione per fare richieste HTTP
function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const request = client.get(url, response => {
      const responseTime = Date.now() - startTime;
      let data = '';

      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          responseTime,
          data,
          success: response.statusCode >= 200 && response.statusCode < 300,
        });
      });
    });

    request.on('error', error => {
      const responseTime = Date.now() - startTime;
      reject({
        error: error.message,
        responseTime,
        success: false,
      });
    });

    request.setTimeout(timeout, () => {
      request.destroy();
      const responseTime = Date.now() - startTime;
      reject({
        error: 'Request timeout',
        responseTime,
        success: false,
      });
    });
  });
}

// Test di un singolo endpoint
async function testEndpoint(name, url, expectedStatus = 200) {
  console.log(`${colors.blue}🔍 Testing ${name}...${colors.reset}`);

  try {
    const result = await makeRequest(url);

    if (result.success && result.statusCode === expectedStatus) {
      console.log(
        `${colors.green}✅ ${name}: OK (${result.responseTime}ms)${colors.reset}`
      );
      return {
        name,
        status: 'healthy',
        responseTime: result.responseTime,
        details: `HTTP ${result.statusCode}`,
      };
    } else {
      console.log(
        `${colors.yellow}⚠️  ${name}: Degraded - HTTP ${result.statusCode} (${result.responseTime}ms)${colors.reset}`
      );
      return {
        name,
        status: 'degraded',
        responseTime: result.responseTime,
        details: `HTTP ${result.statusCode}`,
      };
    }
  } catch (error) {
    console.log(
      `${colors.red}❌ ${name}: Down - ${error.error} (${error.responseTime}ms)${colors.reset}`
    );
    return {
      name,
      status: 'down',
      responseTime: error.responseTime,
      details: error.error,
    };
  }
}

// Test di performance per operazioni multiple
async function performanceTest() {
  console.log(
    `\n${colors.blue}📊 Performance Test - Multiple Requests${colors.reset}`
  );

  const startTime = Date.now();
  const requests = [];

  // Simula 10 richieste simultanee al backend
  for (let i = 0; i < 10; i++) {
    requests.push(makeRequest(`${BACKEND_URL}/api/test`).catch(e => e));
  }

  try {
    const results = await Promise.all(requests);
    const totalTime = Date.now() - startTime;

    const successful = results.filter(r => r.success).length;
    const avgResponseTime =
      results
        .filter(r => r.responseTime)
        .reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    console.log(`${colors.green}📈 Performance Results:${colors.reset}`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Successful requests: ${successful}/10`);
    console.log(`   Average response time: ${Math.round(avgResponseTime)}ms`);

    if (successful >= 8 && avgResponseTime < 1000) {
      console.log(`${colors.green}✅ Performance: Excellent${colors.reset}`);
    } else if (successful >= 6 && avgResponseTime < 2000) {
      console.log(`${colors.yellow}⚠️  Performance: Good${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Performance: Poor${colors.reset}`);
    }

    return {
      totalTime,
      successRate: (successful / 10) * 100,
      avgResponseTime: Math.round(avgResponseTime),
    };
  } catch (error) {
    console.log(
      `${colors.red}❌ Performance test failed: ${error.message}${colors.reset}`
    );
    return null;
  }
}

// Test principale
async function runMonitoringTests() {
  console.log(
    `${colors.blue}🔍 STUDENT ANALYST - Monitoring Health Check${colors.reset}`
  );
  console.log(
    `${colors.blue}============================================${colors.reset}\n`
  );

  const results = [];

  // Test dei servizi principali
  const tests = [
    ['Backend Health', `${BACKEND_URL}/health`],
    ['Backend API Test', `${BACKEND_URL}/api/test`],
    ['Backend Root', `${BACKEND_URL}/`],
    ['Alpha Vantage API', ALPHA_VANTAGE_TEST_URL],
  ];

  for (const [name, url] of tests) {
    const result = await testEndpoint(name, url);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Pausa tra i test
  }

  // Test di performance
  const performanceResult = await performanceTest();

  // Riepilogo finale
  console.log(`\n${colors.blue}📋 SUMMARY${colors.reset}`);
  console.log(`${colors.blue}=========${colors.reset}`);

  const healthyServices = results.filter(r => r.status === 'healthy').length;
  const totalServices = results.length;
  const overallHealth = (healthyServices / totalServices) * 100;

  console.log(`Overall Health: ${overallHealth.toFixed(1)}%`);
  console.log(`Services Status:`);

  results.forEach(result => {
    const statusIcon =
      result.status === 'healthy'
        ? '✅'
        : result.status === 'degraded'
          ? '⚠️'
          : '❌';
    const statusColor =
      result.status === 'healthy'
        ? colors.green
        : result.status === 'degraded'
          ? colors.yellow
          : colors.red;

    console.log(
      `  ${statusIcon} ${result.name}: ${statusColor}${result.status}${colors.reset} (${result.responseTime}ms)`
    );
  });

  if (performanceResult) {
    console.log(
      `\nPerformance: ${performanceResult.successRate}% success rate, ${performanceResult.avgResponseTime}ms avg`
    );
  }

  // Exit code basato sui risultati
  if (overallHealth >= 80) {
    console.log(`\n${colors.green}🎉 All systems operational!${colors.reset}`);
    process.exit(0);
  } else if (overallHealth >= 50) {
    console.log(`\n${colors.yellow}⚠️  Some services degraded${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.red}🚨 Critical issues detected${colors.reset}`);
    process.exit(2);
  }
}

// Esegui i test se il file viene chiamato direttamente
if (require.main === module) {
  runMonitoringTests().catch(error => {
    console.error(
      `${colors.red}❌ Monitoring test failed:${colors.reset}`,
      error
    );
    process.exit(3);
  });
}

module.exports = {
  runMonitoringTests,
  testEndpoint,
  performanceTest,
};
