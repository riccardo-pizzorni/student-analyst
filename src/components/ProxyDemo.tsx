/**
 * STUDENT ANALYST - Proxy Demo Component
 * Interactive demo for testing CORS proxy functionality
 */

import React, { useState, useEffect } from 'react';
import { proxyService, type HealthStatus, type CacheStats } from '../services/ProxyService';
import './ProxyDemo.css';

interface TestResult {
  test: string;
  status: 'running' | 'success' | 'error';
  message: string;
  responseTime?: number;
  cached?: boolean;
  data?: unknown;
}

const ProxyDemo: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isServerRunning, setIsServerRunning] = useState<boolean | null>(null);
  const [testSymbol, setTestSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);

  // Check server status on component mount
  useEffect(() => {
    checkServerStatus();
    loadStats();
  }, []);

  const checkServerStatus = async () => {
    try {
      const isConnected = await proxyService.testConnection();
      setIsServerRunning(isConnected);
      
      if (isConnected) {
        const health = await proxyService.getHealth();
        setHealthStatus(health);
      }
    } catch (error) {
      setIsServerRunning(false);
      console.error('Server status check failed:', (error));
    }
  };

  const loadStats = async () => {
    try {
      if (isServerRunning) {
        const stats = await proxyService.getCacheStats();
        setCacheStats(stats);
      }
    } catch (error) {
      console.error('Failed to load cache stats:', (error));
    }
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const runTest = async (testName: string, testFn: () => Promise<unknown>) => {
    const startTime = Date.now();
    
    addTestResult({
      test: testName,
      status: 'running',
      message: 'Running test...'
    });

    try {
      const result = await testFn();
      const responseTime = Date.now() - startTime;
      
      addTestResult({
        test: testName,
        status: 'success',
        message: 'Test completed successfully',
        responseTime,
        cached: (result as { cached?: boolean })?.cached,
        data: result
      });

      // Refresh stats after successful test
      await loadStats();

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      
      addTestResult({
        test: testName,
        status: 'error',
        message,
        responseTime
      });
    }
  };

  const runAllTests = async () => {
    if (!isServerRunning) {
      alert('⚠️ Proxy server is not running. Please start the server first.');
      return;
    }

    setLoading(true);

    try {
      // Test 1: Health Check
      await runTest('Health Check', () => proxyService.getHealth());

      // Test 2: Single Quote
      await runTest(`Quote: ${testSymbol}`, () => proxyService.getQuote(testSymbol));

      // Test 3: Historical Data
      await runTest(`Historical: ${testSymbol}`, () => 
        proxyService.getHistoricalData(testSymbol, '1d', '5d')
      );

      // Test 4: Multiple Quotes
      await runTest('Multiple Quotes', () => 
        proxyService.getMultipleQuotes(['AAPL', 'GOOGL', 'MSFT'])
      );

      // Test 5: Search Symbols
      await runTest('Symbol Search', () => proxyService.searchSymbols('Apple'));

      // Test 6: Market Summary
      await runTest('Market Summary', () => proxyService.getMarketSummary());

    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      const result = await proxyService.clearCache();
      alert(`✅ Cache cleared successfully! ${result.keysCleared} keys removed.`);
      await loadStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Failed to clear cache: ${message}`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⭕';
    }
  };

  const formatBytes = (bytes: string) => {
    return bytes.replace(' MB', 'MB');
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="proxy-demo-container">
      <div className="proxy-demo-header">
        <h2>🌐 CORS Proxy Server Monitor</h2>
        <p>Real-time monitoring and testing of the Yahoo Finance proxy server</p>
      </div>

      {/* Server Status */}
      <div className="status-section">
        <div className="status-card">
          <h3>Server Status</h3>
          <div className="status-indicator">
            {isServerRunning === null ? (
              <span className="status-checking">🔍 Checking...</span>
            ) : isServerRunning ? (
              <span className="status-online">🟢 Online</span>
            ) : (
              <span className="status-offline">🔴 Offline</span>
            )}
          </div>
          
          {isServerRunning && (
            <div className="server-info">
              <p><strong>URL:</strong> {proxyService.getProxyUrl()}</p>
              <p><strong>Environment:</strong> {proxyService.isLocalhost() ? 'Development' : 'Production'}</p>
            </div>
          )}
          
          <button onClick={checkServerStatus} className="refresh-btn">
            🔄 Refresh Status
          </button>
        </div>

        {/* Health Status */}
        {healthStatus && (
          <div className="health-card">
            <h3>Health Metrics</h3>
            <div className="health-metrics">
              <div className="metric">
                <span className="label">Uptime:</span>
                <span className="value">{formatUptime(healthStatus.uptime)}</span>
              </div>
              <div className="metric">
                <span className="label">Memory Used:</span>
                <span className="value">{formatBytes(healthStatus.memory.used)}</span>
              </div>
              <div className="metric">
                <span className="label">Cache Hit Ratio:</span>
                <span className="value">{healthStatus.performance.cacheHitRatio}%</span>
              </div>
              <div className="metric">
                <span className="label">Success Rate:</span>
                <span className="value">{healthStatus.performance.successRate}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Cache Statistics */}
        {cacheStats && (
          <div className="cache-card">
            <h3>Cache Statistics</h3>
            <div className="cache-stats">
              <div className="stat-row">
                <span>Cached Items: <strong>{cacheStats.cache.keys}</strong></span>
                <span>Hit Ratio: <strong>{cacheStats.cache.hitRatio}%</strong></span>
              </div>
              <div className="stat-row">
                <span>Total Requests: <strong>{cacheStats.requests.total}</strong></span>
                <span>Cached Responses: <strong>{cacheStats.requests.cached}</strong></span>
              </div>
              <button onClick={clearCache} className="clear-cache-btn">
                🗑️ Clear Cache
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Testing Section */}
      <div className="testing-section">
        <div className="test-controls">
          <h3>API Testing</h3>
          <div className="test-input-group">
            <label htmlFor="test-symbol">Test Symbol:</label>
            <input
              id="test-symbol"
              type="text"
              value={testSymbol}
              onChange={(_e) => setTestSymbol(e.target.value.toUpperCase())}
              placeholder="AAPL"
              maxLength={10}
            />
          </div>
          
          <div className="test-buttons">
            <button 
              onClick={runAllTests} 
              disabled={loading || !isServerRunning}
              className="run-tests-btn"
            >
              {loading ? '🔄 Running Tests...' : '🚀 Run All Tests'}
            </button>
            
            <button 
              onClick={() => setTestResults([])}
              className="clear-results-btn"
            >
              🗑️ Clear Results
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="test-results">
          <h3>Test Results</h3>
          {testResults.length === 0 ? (
            <div className="no-results">
              <p>No test results yet. Click "Run All Tests" to start testing the proxy server.</p>
            </div>
          ) : (
            <div className="results-list">
              {testResults.map((result) => (
                <div key={index} className={`result-item ${result.status}`}>
                  <div className="result-header">
                    <span className="result-icon">{getStatusIcon(result.status)}</span>
                    <span className="result-test">{result.test}</span>
                    {result.responseTime && (
                      <span className="result-time">{result.responseTime}ms</span>
                    )}
                    {result.cached && (
                      <span className="cached-badge">📄 Cached</span>
                    )}
                  </div>
                  <div className="result-message">{result.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {!isServerRunning && (
        <div className="instructions-section">
          <h3>🚀 Getting Started</h3>
          <div className="instructions">
            <p>To start the proxy server:</p>
            <ol>
              <li>Open a terminal in the project directory</li>
              <li>Navigate to server folder: <code>cd server</code></li>
              <li>Install dependencies: <code>npm install</code></li>
              <li>Start server: <code>npm start</code></li>
              <li>Refresh this page to connect</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProxyDemo; 

