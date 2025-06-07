/**
 * STUDENT ANALYST - API Testing Demo
 * Interactive demonstration of API testing capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import APITesting from './APITesting';
import './APITestingDemo.css';

interface TestHistory {
  timestamp: Date;
  totalTests: number;
  successful: number;
  failed: number;
  avgResponseTime: number;
  provider: 'alpha_vantage' | 'yahoo_finance';
  testType: string;
}

interface APIHealth {
  provider: 'alpha_vantage' | 'yahoo_finance';
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  avgResponseTime: number;
  requestsToday: number;
  errorRate: number;
  lastCheck: Date;
}

const APITestingDemo: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'testing' | 'monitoring' | 'history' | 'docs'>('testing');
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [apiHealth, setApiHealth] = useState<APIHealth[]>([
    {
      provider: 'alpha_vantage',
      status: 'operational',
      uptime: 99.8,
      avgResponseTime: 1240,
      requestsToday: 47,
      errorRate: 0.8,
      lastCheck: new Date()
    },
    {
      provider: 'yahoo_finance',
      status: 'operational',
      uptime: 99.9,
      avgResponseTime: 890,
      requestsToday: 23,
      errorRate: 0.2,
      lastCheck: new Date()
    }
  ]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Auto-refresh API health status
  useEffect(() => {
    const interval = setInterval(() => {
      setApiHealth(prev => prev.map(api => ({
        ...api,
        avgResponseTime: api.avgResponseTime + (Math.random() - 0.5) * 100,
        requestsToday: api.requestsToday + Math.floor(Math.random() * 3),
        lastCheck: new Date()
      })));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle test completion
  const handleTestComplete = useCallback((results: any[]) => {
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.length - successful;
    const avgResponseTime = results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / Math.max(1, results.filter(r => r.responseTime).length);

    const newHistory: TestHistory = {
      timestamp: new Date(),
      totalTests: results.length,
      successful,
      failed,
      avgResponseTime: Math.round(avgResponseTime),
      provider: results[0]?.provider || 'alpha_vantage',
      testType: 'comprehensive'
    };

    setTestHistory(prev => [newHistory, ...prev.slice(0, 49)]); // Keep last 50 entries
  }, []);

  // Mock test scenarios
  const testScenarios = [
    {
      id: 'daily_prices',
      name: 'Daily Stock Prices',
      description: 'Test retrieval of daily OHLCV data for major stocks',
      apiCalls: 5,
      expectedTime: '2-3 seconds',
      dataPoints: '100-500 per symbol',
      coverage: ['Alpha Vantage TIME_SERIES_DAILY', 'Yahoo Finance historical data'],
      riskLevel: 'low'
    },
    {
      id: 'realtime_quotes',
      name: 'Real-time Quotes',
      description: 'Test real-time price feed and market status',
      apiCalls: 10,
      expectedTime: '1-2 seconds',
      dataPoints: '1 per symbol',
      coverage: ['Alpha Vantage GLOBAL_QUOTE', 'Yahoo Finance quote'],
      riskLevel: 'medium'
    },
    {
      id: 'bulk_data',
      name: 'Bulk Data Retrieval',
      description: 'Test multiple symbol data fetching with rate limiting',
      apiCalls: 25,
      expectedTime: '8-15 seconds',
      dataPoints: '2500+ total',
      coverage: ['Batch requests', 'Rate limit handling', 'Error recovery'],
      riskLevel: 'high'
    },
    {
      id: 'error_recovery',
      name: 'Error Recovery',
      description: 'Test fallback mechanisms and error handling',
      apiCalls: 15,
      expectedTime: '5-8 seconds',
      dataPoints: 'Variable',
      coverage: ['Invalid symbols', 'Network errors', 'Rate limits', 'Timeouts'],
      riskLevel: 'high'
    }
  ];

  // API documentation sections
  const apiDocs = [
    {
      provider: 'Alpha Vantage',
      icon: '🅰️',
      baseURL: 'https://www.alphavantage.co/query',
      keyFeatures: [
        'Free tier: 5 calls/minute, 500 calls/day',
        'Real-time and historical stock data',
        'Technical indicators',
        'Cryptocurrency and forex data',
        'Company fundamentals'
      ],
      endpoints: [
        {
          name: 'TIME_SERIES_DAILY',
          function: 'Daily stock prices (OHLCV)',
          parameters: 'symbol, outputsize, datatype',
          example: 'function=TIME_SERIES_DAILY&symbol=AAPL&apikey=demo'
        },
        {
          name: 'GLOBAL_QUOTE',
          function: 'Real-time stock quote',
          parameters: 'symbol, datatype',
          example: 'function=GLOBAL_QUOTE&symbol=AAPL&apikey=demo'
        },
        {
          name: 'OVERVIEW',
          function: 'Company overview and fundamentals',
          parameters: 'symbol',
          example: 'function=OVERVIEW&symbol=AAPL&apikey=demo'
        }
      ],
      rateLimits: {
        free: '5 calls/minute, 500 calls/day',
        premium: '75 calls/minute, 75,000 calls/day'
      },
      errorCodes: [
        { code: 'Invalid API call', description: 'Malformed request or missing parameters' },
        { code: 'Thank you for using Alpha Vantage', description: 'Rate limit exceeded' },
        { code: 'Invalid function', description: 'Unsupported API function' }
      ]
    },
    {
      provider: 'Yahoo Finance',
      icon: '🟡',
      baseURL: 'https://query1.finance.yahoo.com/v8/finance/chart',
      keyFeatures: [
        'No official rate limits (unofficial API)',
        'Real-time stock quotes',
        'Historical price data',
        'Market statistics',
        'Options data'
      ],
      endpoints: [
        {
          name: 'Chart Data',
          function: 'Historical price data with intervals',
          parameters: 'symbol, period1, period2, interval',
          example: '/v8/finance/chart/AAPL?period1=0&period2=9999999999&interval=1d'
        },
        {
          name: 'Quote',
          function: 'Current stock quote',
          parameters: 'symbols',
          example: '/v6/finance/quote?symbols=AAPL,MSFT,GOOGL'
        },
        {
          name: 'Spark',
          function: 'Mini chart data for sparklines',
          parameters: 'symbols, range',
          example: '/v8/finance/spark?symbols=AAPL&range=1d'
        }
      ],
      rateLimits: {
        unofficial: 'No official limits, but may be throttled',
        recommendation: 'Limit to 100-200 requests/minute'
      },
      errorCodes: [
        { code: 'Not Found', description: 'Symbol not found or delisted' },
        { code: 'Unauthorized', description: 'Request blocked or rate limited' },
        { code: 'Bad Request', description: 'Invalid parameters or malformed request' }
      ]
    }
  ];

  // Format time ago
  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'operational': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get risk level color
  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="api-testing-demo">
      {/* Demo Header */}
      <div className="demo-header">
        <div className="header-content">
          <h1>🔬 API Testing Laboratory</h1>
          <p>Comprehensive testing and monitoring system for financial data APIs</p>
        </div>
        
        <div className="status-indicators">
          {apiHealth.map(api => (
            <div key={api.provider} className="status-card">
              <div className="status-provider">
                {api.provider === 'alpha_vantage' ? '🅰️' : '🟡'} {api.provider.replace('_', ' ')}
              </div>
              <div 
                className="status-dot"
                style={{ backgroundColor: getStatusColor(api.status) }}
              />
              <div className="status-text">{api.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="demo-tabs">
        <button
          className={`tab ${activeTab === 'testing' ? 'active' : ''}`}
          onClick={() => setActiveTab('testing')}
        >
          <span className="tab-icon">🧪</span>
          API Testing
        </button>
        <button
          className={`tab ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <span className="tab-icon">📊</span>
          Monitoring
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="tab-icon">📋</span>
          Test History
        </button>
        <button
          className={`tab ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <span className="tab-icon">📚</span>
          Documentation
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'testing' && (
          <div className="testing-content">
            <APITesting onTestComplete={handleTestComplete} />
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="monitoring-content">
            {/* API Health Dashboard */}
            <div className="health-dashboard">
              <h2>📊 API Health Dashboard</h2>
              <div className="health-grid">
                {apiHealth.map(api => (
                  <div key={api.provider} className="health-card">
                    <div className="health-header">
                      <div className="provider-info">
                        <span className="provider-icon">
                          {api.provider === 'alpha_vantage' ? '🅰️' : '🟡'}
                        </span>
                        <span className="provider-name">
                          {api.provider.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div 
                        className={`health-status ${api.status}`}
                        style={{ color: getStatusColor(api.status) }}
                      >
                        {api.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="health-metrics">
                      <div className="metric">
                        <span className="metric-label">Uptime</span>
                        <span className="metric-value">{api.uptime.toFixed(1)}%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Avg Response</span>
                        <span className="metric-value">{Math.round(api.avgResponseTime)}ms</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Requests Today</span>
                        <span className="metric-value">{api.requestsToday}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Error Rate</span>
                        <span className="metric-value">{api.errorRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="health-footer">
                      <span className="last-check">
                        Last check: {timeAgo(api.lastCheck)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Scenarios */}
            <div className="test-scenarios">
              <h2>🎯 Test Scenarios</h2>
              <div className="scenarios-grid">
                {testScenarios.map(scenario => (
                  <div key={scenario.id} className="scenario-card">
                    <div className="scenario-header">
                      <h3>{scenario.name}</h3>
                      <div 
                        className={`risk-badge ${scenario.riskLevel}`}
                        style={{ backgroundColor: getRiskColor(scenario.riskLevel) }}
                      >
                        {scenario.riskLevel.toUpperCase()}
                      </div>
                    </div>
                    
                    <p className="scenario-description">{scenario.description}</p>
                    
                    <div className="scenario-details">
                      <div className="detail-row">
                        <span className="detail-label">API Calls:</span>
                        <span className="detail-value">{scenario.apiCalls}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Expected Time:</span>
                        <span className="detail-value">{scenario.expectedTime}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Data Points:</span>
                        <span className="detail-value">{scenario.dataPoints}</span>
                      </div>
                    </div>
                    
                    <div className="scenario-coverage">
                      <h4>Coverage:</h4>
                      <ul>
                        {scenario.coverage.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-content">
            <div className="history-header">
              <h2>📋 Test History</h2>
              <div className="history-stats">
                <div className="stat">
                  <span className="stat-value">{testHistory.length}</span>
                  <span className="stat-label">Total Runs</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {testHistory.length > 0 
                      ? ((testHistory.reduce((sum, h) => sum + h.successful, 0) / 
                          testHistory.reduce((sum, h) => sum + h.totalTests, 0)) * 100).toFixed(1)
                      : '0'}%
                  </span>
                  <span className="stat-label">Success Rate</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {testHistory.length > 0 
                      ? Math.round(testHistory.reduce((sum, h) => sum + h.avgResponseTime, 0) / testHistory.length)
                      : 0}ms
                  </span>
                  <span className="stat-label">Avg Response</span>
                </div>
              </div>
            </div>
            
            <div className="history-table">
              <div className="table-header">
                <div className="header-cell">Timestamp</div>
                <div className="header-cell">Provider</div>
                <div className="header-cell">Tests</div>
                <div className="header-cell">Success</div>
                <div className="header-cell">Failed</div>
                <div className="header-cell">Avg Time</div>
                <div className="header-cell">Success Rate</div>
              </div>
              
              {testHistory.map((entry, idx) => (
                <div key={idx} className="table-row">
                  <div className="table-cell">
                    {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="table-cell">
                    <span className="provider-badge">
                      {entry.provider === 'alpha_vantage' ? '🅰️' : '🟡'} 
                      {entry.provider.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="table-cell">{entry.totalTests}</div>
                  <div className="table-cell success">{entry.successful}</div>
                  <div className="table-cell failed">{entry.failed}</div>
                  <div className="table-cell">{entry.avgResponseTime}ms</div>
                  <div className="table-cell">
                    <span className={`rate-badge ${(entry.successful / entry.totalTests) > 0.8 ? 'good' : 'poor'}`}>
                      {((entry.successful / entry.totalTests) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              
              {testHistory.length === 0 && (
                <div className="empty-history">
                  <span className="empty-icon">📊</span>
                  <span className="empty-text">No test history yet. Run some tests to see results here.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="docs-content">
            <h2>📚 API Documentation</h2>
            
            {apiDocs.map((api, idx) => (
              <div key={idx} className="api-doc-section">
                <div className="doc-header">
                  <span className="doc-icon">{api.icon}</span>
                  <h3>{api.provider}</h3>
                  <a href={api.baseURL} target="_blank" rel="noopener noreferrer" className="doc-link">
                    {api.baseURL}
                  </a>
                </div>
                
                <div className="doc-features">
                  <h4>Key Features</h4>
                  <ul>
                    {api.keyFeatures.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="doc-endpoints">
                  <h4>API Endpoints</h4>
                  <div className="endpoints-grid">
                    {api.endpoints.map((endpoint, i) => (
                      <div key={i} className="endpoint-card">
                        <h5>{endpoint.name}</h5>
                        <p>{endpoint.function}</p>
                        <div className="endpoint-params">
                          <strong>Parameters:</strong> {endpoint.parameters}
                        </div>
                        <div className="endpoint-example">
                          <strong>Example:</strong>
                          <code>{endpoint.example}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="doc-limits">
                  <h4>Rate Limits</h4>
                  <div className="limits-info">
                    {Object.entries(api.rateLimits).map(([tier, limit]) => (
                      <div key={tier} className="limit-item">
                        <span className="limit-tier">{tier}:</span>
                        <span className="limit-value">{limit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="doc-errors">
                  <h4>Common Error Codes</h4>
                  <div className="errors-list">
                    {api.errorCodes.map((error, i) => (
                      <div key={i} className="error-item">
                        <code className="error-code">{error.code}</code>
                        <span className="error-description">{error.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Testing Best Practices */}
            <div className="best-practices">
              <h3>🎯 Testing Best Practices</h3>
              <div className="practices-grid">
                <div className="practice-card">
                  <h4>🚀 Performance Testing</h4>
                  <ul>
                    <li>Test with realistic data volumes</li>
                    <li>Monitor response times under load</li>
                    <li>Validate caching mechanisms</li>
                    <li>Test concurrent requests</li>
                  </ul>
                </div>
                <div className="practice-card">
                  <h4>🛡️ Error Handling</h4>
                  <ul>
                    <li>Test all known error scenarios</li>
                    <li>Validate fallback mechanisms</li>
                    <li>Test network timeout handling</li>
                    <li>Verify retry logic</li>
                  </ul>
                </div>
                <div className="practice-card">
                  <h4>⚡ Rate Limiting</h4>
                  <ul>
                    <li>Respect API rate limits</li>
                    <li>Implement proper throttling</li>
                    <li>Test rate limit recovery</li>
                    <li>Monitor usage patterns</li>
                  </ul>
                </div>
                <div className="practice-card">
                  <h4>📊 Monitoring</h4>
                  <ul>
                    <li>Track success/failure rates</li>
                    <li>Monitor response times</li>
                    <li>Log API usage patterns</li>
                    <li>Set up alerts for failures</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APITestingDemo;

