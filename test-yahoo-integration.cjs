const https = require('https');

const testYahooIntegration = async () => {
  const data = JSON.stringify({
    tickers: ['AAPL'],
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    frequency: 'daily',
  });

  const options = {
    hostname: 'student-analyst.onrender.com',
    port: 443,
    path: '/api/analysis',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let responseData = '';

      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          console.log('✅ Test Yahoo Finance Integration:');
          console.log('Status:', res.statusCode);
          console.log('Success:', parsedData.success);
          console.log(
            'Data Points:',
            parsedData.data?.historicalData?.length || 0
          );
          console.log('Source:', parsedData.metadata?.dataSources?.primary);
          console.log('Processing Time:', parsedData.metadata?.processingTime);
          resolve(parsedData);
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.log('Raw response:', responseData);
          reject(error);
        }
      });
    });

    req.on('error', error => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

// Test health check first
const testHealthCheck = async () => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'student-analyst.onrender.com',
        port: 443,
        path: '/health',
        method: 'GET',
      },
      res => {
        let responseData = '';

        res.on('data', chunk => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            console.log('✅ Health Check:');
            console.log('Status:', res.statusCode);
            console.log('Backend Status:', parsedData.status);
            console.log('Uptime:', parsedData.uptime);
            resolve(parsedData);
          } catch (error) {
            console.error('❌ Health check error:', error);
            reject(error);
          }
        });
      }
    );

    req.on('error', error => {
      console.error('❌ Health check request error:', error);
      reject(error);
    });

    req.end();
  });
};

// Run tests
const runTests = async () => {
  try {
    console.log('🚀 Testing Student Analyst Backend...\n');

    // Test health check
    await testHealthCheck();
    console.log('');

    // Test Yahoo Finance integration
    await testYahooIntegration();
    console.log('');

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

runTests();
