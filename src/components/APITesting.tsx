/**
 * STUDENT ANALYST - API Testing System
 * Comprehensive testing suite for financial data APIs
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import './APITesting.css';

// API Test Types
type APIProvider = 'alpha_vantage' | 'yahoo_finance';
type TestType = 'basic' | 'stress' | 'error_simulation' | 'rate_limit';
type TestStatus = 'idle' | 'running' | 'success' | 'error' | 'timeout' | 'rate_limited';

interface APITest {
  id: string;
  provider: APIProvider;
  testType: TestType;
  symbol: string;
  status: TestStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  response?: any;
  error?: string;
  responseTime?: number;
  dataPoints?: number;
  size?: string;
}

interface RateLimitInfo {
  provider: APIProvider;
  requestsPerMinute: number;
  requestsPerDay: number;
  currentRequests: number;
  resetTime?: Date;
  isLimited: boolean;
}

interface APITestingProps {
  onTestComplete?: (results: APITest[]) => void;
}

// Mock API responses for testing without hitting real endpoints
const mockAPIResponses = {
  alpha_vantage: {
    success: {
      'Meta Data': {
        '1. Information': 'Daily Prices (open, high, low, close) and Volumes',
        '2. Symbol': 'AAPL',
        '3. Last Refreshed': '2024-01-15',
        '4. Output Size': 'Compact',
        '5. Time Zone': 'US/Eastern'
      },
      'Time Series (Daily)': {
        '2024-01-15': {
          '1. open': '185.56',
          '2. high': '186.40',
          '3. low': '184.35',
          '4. close': '185.92',
          '5. volume': '15420000'
        },
        '2024-01-12': {
          '1. open': '184.89',
          '2. high': '185.78',
          '3. low': '184.12',
          '4. close': '185.56',
          '5. volume': '14890000'
        }
      }
    },
    error: {
      'Error Message': 'Invalid API call. Please retry or visit the documentation for TIME_SERIES_DAILY'
    },
    rate_limit: {
      'Note': 'Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day.'
    }
  },
  yahoo_finance: {
    success: {
      chart: {
        result: [{
          meta: {
            currency: 'USD',
            symbol: 'AAPL',
            exchangeName: 'NMS',
            instrumentType: 'EQUITY',
            firstTradeDate: 345479400,
            regularMarketTime: 1705348800,
            gmtoffset: -18000,
            timezone: 'EST',
            exchangeTimezoneName: 'America/New_York',
            regularMarketPrice: 185.92,
            chartPreviousClose: 184.89
          },
          timestamp: [1705348800, 1705176000],
          indicators: {
            quote: [{
              open: [185.56, 184.89],
              high: [186.40, 185.78],
              low: [184.35, 184.12],
              close: [185.92, 185.56],
              volume: [15420000, 14890000]
            }]
          }
        }],
        error: null
      }
    },
    error: {
      chart: {
        result: null,
        error: {
          code: 'Not Found',
          description: 'No data found, symbol may be delisted'
        }
      }
    }
  }
};

const APITesting: React.FC<APITestingProps> = ({ onTestComplete }) => {
  // State management
  const [tests, setTests] = useState<APITest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [rateLimits, setRateLimits] = useState<RateLimitInfo[]>([
    {
      provider: 'alpha_vantage',
      requestsPerMinute: 5,
      requestsPerDay: 500,
      currentRequests: 0,
      isLimited: false
    },
    {
      provider: 'yahoo_finance',
      requestsPerMinute: 100,
      requestsPerDay: 10000,
      currentRequests: 0,
      isLimited: false
    }
  ]);
  const [testConfiguration, setTestConfiguration] = useState({
    enableRateLimit: true,
    enableErrorSimulation: true,
    timeoutMs: 10000,
    retryAttempts: 3,
    symbols: ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Test configurations
  const testSuites = [
    {
      id: 'basic_connectivity',
      name: 'Basic Connectivity',
      description: 'Test basic API connectivity and response format',
      tests: [
        { provider: 'alpha_vantage' as APIProvider, testType: 'basic' as TestType },
        { provider: 'yahoo_finance' as APIProvider, testType: 'basic' as TestType }
      ]
    },
    {
      id: 'error_handling',
      name: 'Error Handling',
      description: 'Test error scenarios and fallback mechanisms',
      tests: [
        { provider: 'alpha_vantage' as APIProvider, testType: 'error_simulation' as TestType },
        { provider: 'yahoo_finance' as APIProvider, testType: 'error_simulation' as TestType }
      ]
    },
    {
      id: 'rate_limiting',
      name: 'Rate Limiting',
      description: 'Verify rate limit handling and throttling',
      tests: [
        { provider: 'alpha_vantage' as APIProvider, testType: 'rate_limit' as TestType },
        { provider: 'yahoo_finance' as APIProvider, testType: 'rate_limit' as TestType }
      ]
    },
    {
      id: 'stress_testing',
      name: 'Stress Testing',
      description: 'Test with multiple simultaneous requests',
      tests: [
        { provider: 'alpha_vantage' as APIProvider, testType: 'stress' as TestType },
        { provider: 'yahoo_finance' as APIProvider, testType: 'stress' as TestType }
      ]
    }
  ];

  // Mock API call function
  const mockAPICall = useCallback(async (
    provider: APIProvider, 
    symbol: string, 
    testType: TestType,
    abortSignal?: AbortSignal
  ): Promise<any> => {
    // Simulate network delay
    const delay = Math.random() * 2000 + 500; // 500-2500ms
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, delay);
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Request aborted'));
        });
      }
    });

    // Simulate different scenarios based on test type
    switch (testType) {
      case 'error_simulation':
        if (Math.random() < 0.7) { // 70% chance of error
          throw new Error(provider === 'alpha_vantage' 
            ? 'API call limit reached' 
            : 'Symbol not found');
        }
        break;
      
      case 'rate_limit':
        const rateLimit = rateLimits.find(r => r.provider === provider);
        if (rateLimit && rateLimit.currentRequests >= rateLimit.requestsPerMinute) {
          throw new Error('Rate limit exceeded');
        }
        break;
      
      case 'stress':
        if (Math.random() < 0.3) { // 30% chance of timeout
          throw new Error('Request timeout');
        }
        break;
    }

    // Return mock success response
    const responses = mockAPIResponses[provider];
    return responses.success;
  }, [rateLimits]);

  // Update rate limit counters
  const updateRateLimit = useCallback((provider: APIProvider) => {
    setRateLimits(prev => prev.map(limit => 
      limit.provider === provider 
        ? { 
            ...limit, 
            currentRequests: limit.currentRequests + 1,
            isLimited: limit.currentRequests + 1 >= limit.requestsPerMinute
          }
        : limit
    ));
  }, []);

  // Reset rate limits (simulate time passing)
  const resetRateLimits = useCallback(() => {
    setRateLimits(prev => prev.map(limit => ({
      ...limit,
      currentRequests: 0,
      isLimited: false,
      resetTime: new Date(Date.now() + 60000) // Reset in 1 minute
    })));
  }, []);

  // Run individual test
  const runTest = useCallback(async (
    provider: APIProvider,
    testType: TestType,
    symbol: string
  ): Promise<APITest> => {
    const testId = `${provider}_${testType}_${symbol}_${Date.now()}`;
    const startTime = Date.now();

    const test: APITest = {
      id: testId,
      provider,
      testType,
      symbol,
      status: 'running',
      startTime
    };

    setTests(prev => [...prev, test]);
    setCurrentTest(testId);

    try {
      updateRateLimit(provider);
      
      const response = await mockAPICall(
        provider, 
        symbol, 
        testType, 
        abortControllerRef.current?.signal
      );

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Analyze response
      let dataPoints = 0;
      let size = '0KB';
      
      if (provider === 'alpha_vantage' && response['Time Series (Daily)']) {
        dataPoints = Object.keys(response['Time Series (Daily)']).length;
        size = `${Math.round(JSON.stringify(response).length / 1024)}KB`;
      } else if (provider === 'yahoo_finance' && response.chart?.result?.[0]) {
        dataPoints = response.chart.result[0].timestamp?.length || 0;
        size = `${Math.round(JSON.stringify(response).length / 1024)}KB`;
      }

      const completedTest: APITest = {
        ...test,
        status: 'success',
        endTime,
        duration,
        responseTime: duration,
        response,
        dataPoints,
        size
      };

      setTests(prev => prev.map(t => t.id === testId ? completedTest : t));
      return completedTest;

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      let status: TestStatus = 'error';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) status = 'timeout';
        if (error.message.includes('rate limit') || error.message.includes('limit reached')) status = 'rate_limited';
      }

      const failedTest: APITest = {
        ...test,
        status,
        endTime,
        duration,
        responseTime: duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setTests(prev => prev.map(t => t.id === testId ? failedTest : t));
      return failedTest;
    }
  }, [mockAPICall, updateRateLimit]);

  // Run test suite
  const runTestSuite = useCallback(async (suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    setIsRunning(true);
    abortControllerRef.current = new AbortController();

    const results: APITest[] = [];

    try {
      for (const testConfig of suite.tests) {
        for (const symbol of testConfiguration.symbols.slice(0, testConfig.testType === 'stress' ? 5 : 1)) {
          if (abortControllerRef.current.signal.aborted) break;
          
          const result = await runTest(testConfig.provider, testConfig.testType, symbol);
          results.push(result);

          // Add delay between requests to simulate real usage
          if (testConfiguration.enableRateLimit) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
      onTestComplete?.(results);
    }
  }, [runTest, testConfiguration, onTestComplete]);

  // Run all tests
  const runAllTests = useCallback(async () => {
    setTests([]);
    setIsRunning(true);
    
    for (const suite of testSuites) {
      if (abortControllerRef.current?.signal.aborted) break;
      await runTestSuite(suite.id);
    }
  }, [runTestSuite]);

  // Stop tests
  const stopTests = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
    setCurrentTest(null);
  }, []);

  // Clear test results
  const clearResults = useCallback(() => {
    setTests([]);
    setCurrentTest(null);
  }, []);

  // Calculate test statistics
  const testStats = useMemo(() => {
    const total = tests.length;
    const byStatus = tests.reduce((acc, test) => {
      acc[test.status] = (acc[test.status] || 0) + 1;
      return acc;
    }, {} as Record<TestStatus, number>);

    const successful = byStatus.success || 0;
    const failed = (byStatus.error || 0) + (byStatus.timeout || 0) + (byStatus.rate_limited || 0);
    const running = byStatus.running || 0;

    const avgResponseTime = tests
      .filter(t => t.responseTime)
      .reduce((sum, t) => sum + (t.responseTime || 0), 0) / Math.max(1, tests.filter(t => t.responseTime).length);

    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return {
      total,
      successful,
      failed,
      running,
      successRate,
      avgResponseTime: Math.round(avgResponseTime),
      byStatus,
      byProvider: tests.reduce((acc, test) => {
        acc[test.provider] = (acc[test.provider] || 0) + 1;
        return acc;
      }, {} as Record<APIProvider, number>)
    };
  }, [tests]);

  // Get status color
  const getStatusColor = (status: TestStatus): string => {
    switch (status) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'timeout': return '#f59e0b';
      case 'rate_limited': return '#8b5cf6';
      case 'running': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  // Get status icon
  const getStatusIcon = (status: TestStatus): string => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'timeout': return '⏱️';
      case 'rate_limited': return '🚫';
      case 'running': return '🔄';
      default: return '⚪';
    }
  };

  return (
    <div className="api-testing">
      {/* Testing Header */}
      <div className="testing-header">
        <div className="header-content">
          <h2>🔬 API Testing Laboratory</h2>
          <p>Comprehensive testing suite for financial data APIs</p>
        </div>
        
        <div className="testing-controls">
          <button
            className={`control-btn primary ${isRunning ? 'running' : ''}`}
            onClick={isRunning ? stopTests : runAllTests}
            disabled={false}
          >
            {isRunning ? (
              <>
                <span className="btn-icon spinning">⏹️</span>
                Stop Tests
              </>
            ) : (
              <>
                <span className="btn-icon">▶️</span>
                Run All Tests
              </>
            )}
          </button>
          
          <button
            className="control-btn secondary"
            onClick={clearResults}
            disabled={isRunning}
          >
            <span className="btn-icon">🗑️</span>
            Clear Results
          </button>
          
          <button
            className="control-btn secondary"
            onClick={resetRateLimits}
            disabled={isRunning}
          >
            <span className="btn-icon">🔄</span>
            Reset Limits
          </button>
        </div>
      </div>

      {/* Test Statistics */}
      <div className="test-statistics">
        <div className="stats-grid">
          <div className="stat-card total">
            <span className="stat-value">{testStats.total}</span>
            <span className="stat-label">Total Tests</span>
          </div>
          <div className="stat-card success">
            <span className="stat-value">{testStats.successful}</span>
            <span className="stat-label">Successful</span>
          </div>
          <div className="stat-card failed">
            <span className="stat-value">{testStats.failed}</span>
            <span className="stat-label">Failed</span>
          </div>
          <div className="stat-card rate">
            <span className="stat-value">{testStats.successRate.toFixed(1)}%</span>
            <span className="stat-label">Success Rate</span>
          </div>
          <div className="stat-card time">
            <span className="stat-value">{testStats.avgResponseTime}ms</span>
            <span className="stat-label">Avg Response</span>
          </div>
        </div>
      </div>

      {/* Rate Limit Status */}
      <div className="rate-limit-status">
        <h3>📊 Rate Limit Status</h3>
        <div className="rate-limits-grid">
          {rateLimits.map(limit => (
            <div key={limit.provider} className={`rate-limit-card ${limit.isLimited ? 'limited' : ''}`}>
              <div className="provider-name">
                {limit.provider === 'alpha_vantage' ? '🅰️ Alpha Vantage' : '🟡 Yahoo Finance'}
              </div>
              <div className="limit-info">
                <div className="limit-current">
                  {limit.currentRequests} / {limit.requestsPerMinute}
                </div>
                <div className="limit-label">requests/min</div>
              </div>
              <div className="limit-bar">
                <div 
                  className="limit-fill"
                  style={{ 
                    width: `${(limit.currentRequests / limit.requestsPerMinute) * 100}%`,
                    backgroundColor: limit.isLimited ? '#ef4444' : '#10b981'
                  }}
                />
              </div>
              {limit.isLimited && (
                <div className="limit-warning">
                  🚫 Rate limited
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Test Suites */}
      <div className="test-suites">
        <h3>🧪 Test Suites</h3>
        <div className="suites-grid">
          {testSuites.map(suite => (
            <div key={suite.id} className="test-suite-card">
              <div className="suite-header">
                <h4>{suite.name}</h4>
                <p>{suite.description}</p>
              </div>
              <div className="suite-tests">
                {suite.tests.map((test, idx) => (
                  <div key={idx} className="suite-test">
                    <span className="test-provider">
                      {test.provider === 'alpha_vantage' ? '🅰️' : '🟡'}
                    </span>
                    <span className="test-type">{test.testType.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
              <button
                className="suite-run-btn"
                onClick={() => runTestSuite(suite.id)}
                disabled={isRunning}
              >
                Run Suite
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      <div className="test-results">
        <h3>📋 Test Results</h3>
        {currentTest && (
          <div className="current-test">
            <span className="current-icon">🔄</span>
            Running test: {tests.find(t => t.id === currentTest)?.symbol} via {tests.find(t => t.id === currentTest)?.provider}
          </div>
        )}
        
        <div className="results-table">
          <div className="table-header">
            <div className="header-cell">Status</div>
            <div className="header-cell">Provider</div>
            <div className="header-cell">Symbol</div>
            <div className="header-cell">Test Type</div>
            <div className="header-cell">Response Time</div>
            <div className="header-cell">Data Points</div>
            <div className="header-cell">Size</div>
            <div className="header-cell">Details</div>
          </div>
          
          {tests.slice(-20).reverse().map(test => (
            <div key={test.id} className="table-row">
              <div className="table-cell status">
                <span 
                  className="status-indicator"
                  style={{ color: getStatusColor(test.status) }}
                >
                  {getStatusIcon(test.status)}
                </span>
                <span className="status-text">{test.status}</span>
              </div>
              <div className="table-cell">
                {test.provider === 'alpha_vantage' ? '🅰️ Alpha Vantage' : '🟡 Yahoo Finance'}
              </div>
              <div className="table-cell">{test.symbol}</div>
              <div className="table-cell">{test.testType.replace('_', ' ')}</div>
              <div className="table-cell">
                {test.responseTime ? `${test.responseTime}ms` : '-'}
              </div>
              <div className="table-cell">
                {test.dataPoints || '-'}
              </div>
              <div className="table-cell">
                {test.size || '-'}
              </div>
              <div className="table-cell">
                {test.error ? (
                  <span className="error-message" title={test.error}>
                    {test.error.substring(0, 30)}...
                  </span>
                ) : (
                  <span className="success-message">OK</span>
                )}
              </div>
            </div>
          ))}
          
          {tests.length === 0 && (
            <div className="empty-results">
              <span className="empty-icon">🔬</span>
              <span className="empty-text">No tests run yet. Click "Run All Tests" to begin.</span>
            </div>
          )}
        </div>
      </div>

      {/* Test Configuration */}
      <div className="test-configuration">
        <h3>⚙️ Test Configuration</h3>
        <div className="config-grid">
          <div className="config-section">
            <h4>Rate Limiting</h4>
            <label className="config-option">
              <input
                type="checkbox"
                checked={testConfiguration.enableRateLimit}
                onChange={(e) => setTestConfiguration(prev => ({
                  ...prev,
                  enableRateLimit: e.target.checked
                }))}
              />
              <span>Enable rate limit simulation</span>
            </label>
          </div>
          
          <div className="config-section">
            <h4>Error Simulation</h4>
            <label className="config-option">
              <input
                type="checkbox"
                checked={testConfiguration.enableErrorSimulation}
                onChange={(e) => setTestConfiguration(prev => ({
                  ...prev,
                  enableErrorSimulation: e.target.checked
                }))}
              />
              <span>Enable error scenario testing</span>
            </label>
          </div>
          
          <div className="config-section">
            <label htmlFor="timeout-input">
              <h4>Timeout</h4>
            </label>
            <input
              id="timeout-input"
              type="number"
              value={testConfiguration.timeoutMs}
              onChange={(e) => setTestConfiguration(prev => ({
                ...prev,
                timeoutMs: parseInt(e.target.value) || 10000
              }))}
              min="1000"
              max="30000"
              step="1000"
            />
            <span className="config-unit">ms</span>
          </div>
          
          <div className="config-section">
            <label htmlFor="retry-attempts-input">
              <h4>Retry Attempts</h4>
            </label>
            <input
              id="retry-attempts-input"
              type="number"
              value={testConfiguration.retryAttempts}
              onChange={(e) => setTestConfiguration(prev => ({
                ...prev,
                retryAttempts: parseInt(e.target.value) || 3
              }))}
              min="0"
              max="10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default APITesting;

