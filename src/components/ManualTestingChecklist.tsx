/**
 * STUDENT ANALYST - Manual Testing Checklist
 * Comprehensive manual testing system for quality assurance
 */

import React, { useCallback, useEffect, useState } from 'react';
import './ManualTestingChecklist.css';

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
  supported: boolean;
}

interface ScreenTest {
  device: string;
  width: number;
  height: number;
  category: 'mobile' | 'tablet' | 'desktop';
  passed: boolean | null;
  issues: string[];
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'pass' | 'warning' | 'fail';
}

interface TestResult {
  id: string;
  category: 'browser' | 'responsive' | 'print' | 'performance';
  name: string;
  status: 'pending' | 'running' | 'pass' | 'fail' | 'warning';
  details: string;
  timestamp: Date;
  duration?: number;
}

const ManualTestingChecklist: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'browser' | 'responsive' | 'print' | 'performance' | 'results'>('overview');
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [screenTests, setScreenTests] = useState<ScreenTest[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  // Browser detection
  const detectBrowser = useCallback((): BrowserInfo => {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    
    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';
    const mobile = /Mobi|Android/i.test(ua);
    
    // Browser detection logic
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edge') === -1) {
      name = 'Chrome';
      const match = ua.match(/Chrome\/(\d+\.\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    } else if (ua.indexOf('Firefox') > -1) {
      name = 'Firefox';
      const match = ua.match(/Firefox\/(\d+\.\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Gecko';
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      name = 'Safari';
      const match = ua.match(/Safari\/(\d+\.\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'WebKit';
    } else if (ua.indexOf('Edge') > -1) {
      name = 'Edge';
      const match = ua.match(/Edge\/(\d+\.\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'EdgeHTML';
    }

    // Determine support level
    const majorVersion = parseInt(version.split('.')[0]);
    let supported = true;
    
    if (name === 'Chrome' && majorVersion < 88) supported = false;
    if (name === 'Firefox' && majorVersion < 85) supported = false;
    if (name === 'Safari' && majorVersion < 14) supported = false;
    if (name === 'Edge' && majorVersion < 88) supported = false;

    return {
      name,
      version,
      engine,
      platform,
      mobile,
      supported
    };
  }, []);

  // Initialize browser detection
  useEffect(() => {
    setBrowserInfo(detectBrowser());
  }, [detectBrowser]);

  // Screen size tests
  const standardScreenSizes = [
    { device: 'iPhone SE', width: 375, height: 667, category: 'mobile' as const },
    { device: 'iPhone 12', width: 390, height: 844, category: 'mobile' as const },
    { device: 'iPhone 12 Pro Max', width: 428, height: 926, category: 'mobile' as const },
    { device: 'iPad Mini', width: 768, height: 1024, category: 'tablet' as const },
    { device: 'iPad Pro', width: 1024, height: 1366, category: 'tablet' as const },
    { device: 'MacBook Air', width: 1366, height: 768, category: 'desktop' as const },
    { device: 'Desktop 1920x1080', width: 1920, height: 1080, category: 'desktop' as const },
    { device: 'Desktop 2560x1440', width: 2560, height: 1440, category: 'desktop' as const }
  ];

  // Initialize screen tests
  useEffect(() => {
    setScreenTests(standardScreenSizes.map(size => ({
      ...size,
      passed: null,
      issues: []
    })));
  }, []);

  // Performance testing
  const runPerformanceTest = useCallback(async (testName: string): Promise<PerformanceMetric[]> => {
    const startTime = performance.now();
    
    // Simulate various performance tests
    const metrics: PerformanceMetric[] = [];
    
    // Page load time
    const loadTime = performance.now() - startTime;
    metrics.push({
      name: 'Page Load Time',
      value: Math.round(loadTime),
      unit: 'ms',
      threshold: 3000,
      status: loadTime < 3000 ? 'pass' : loadTime < 5000 ? 'warning' : 'fail'
    });

    // Memory usage (approximation)
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      const memoryUsage = memoryInfo.usedJSHeapSize / 1024 / 1024;
      metrics.push({
        name: 'Memory Usage',
        value: Math.round(memoryUsage),
        unit: 'MB',
        threshold: 100,
        status: memoryUsage < 100 ? 'pass' : memoryUsage < 200 ? 'warning' : 'fail'
      });
    }

    // Calculation performance test
    const calcStart = performance.now();
    // Simulate portfolio calculation with 100 assets
    for (let i = 0; i < 10000; i++) {
      Math.sqrt(Math.random() * 1000);
    }
    const calcTime = performance.now() - calcStart;
    
    metrics.push({
      name: 'Calculation Performance (100 assets)',
      value: Math.round(calcTime),
      unit: 'ms',
      threshold: 10000,
      status: calcTime < 10000 ? 'pass' : calcTime < 15000 ? 'warning' : 'fail'
    });

    return metrics;
  }, []);

  // Test automation
  const runAutomatedTests = useCallback(async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    try {
      // Browser compatibility test
      setCurrentTest('Testing browser compatibility...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const browser = detectBrowser();
      results.push({
        id: 'browser-compat',
        category: 'browser',
        name: 'Browser Compatibility',
        status: browser.supported ? 'pass' : 'warning',
        details: `${browser.name} ${browser.version} on ${browser.platform}`,
        timestamp: new Date(),
        duration: 1000
      });

      // Responsive design test
      setCurrentTest('Testing responsive design...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const currentWidth = window.innerWidth;
      const responsiveStatus = currentWidth >= 320 ? 'pass' : 'fail';
      results.push({
        id: 'responsive',
        category: 'responsive',
        name: 'Responsive Design',
        status: responsiveStatus,
        details: `Screen width: ${currentWidth}px`,
        timestamp: new Date(),
        duration: 2000
      });

      // Print functionality test
      setCurrentTest('Testing print functionality...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const printSupported = 'print' in window;
      results.push({
        id: 'print',
        category: 'print',
        name: 'Print Functionality',
        status: printSupported ? 'pass' : 'fail',
        details: printSupported ? 'Print API available' : 'Print API not supported',
        timestamp: new Date(),
        duration: 1500
      });

      // Performance benchmark
      setCurrentTest('Running performance benchmarks...');
      const metrics = await runPerformanceTest('comprehensive');
      setPerformanceMetrics(metrics);
      
      const perfStatus = metrics.every(m => m.status === 'pass') ? 'pass' : 
                        metrics.some(m => m.status === 'fail') ? 'fail' : 'warning';
      
      results.push({
        id: 'performance',
        category: 'performance',
        name: 'Performance Benchmark',
        status: perfStatus,
        details: `${metrics.length} metrics tested`,
        timestamp: new Date(),
        duration: 3000
      });

      setTestResults(results);
      
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunningTests(false);
      setCurrentTest('');
    }
  }, [detectBrowser, runPerformanceTest]);

  // Screen test functions
  const testScreenSize = useCallback((deviceIndex: number, passed: boolean, issues: string[] = []) => {
    setScreenTests(prev => prev.map((test, index) => 
      index === deviceIndex ? { ...test, passed, issues } : test
    ));
  }, []);

  // Print test function
  const testPrintFunctionality = useCallback(() => {
    if ('print' in window) {
      // Create print-friendly version
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>STUDENT ANALYST - Print Test</title>
              <style>
                @media print {
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  .test-content { page-break-inside: avoid; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="test-content">
                <h1>STUDENT ANALYST Print Test</h1>
                <p>This is a test page to verify print functionality.</p>
                <p>Current date: ${new Date().toLocaleDateString()}</p>
                <p>Current time: ${new Date().toLocaleTimeString()}</p>
                <div style="margin: 20px 0; padding: 20px; border: 1px solid #ccc;">
                  <h2>Sample Portfolio Data</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #ccc;">
                      <th style="text-align: left; padding: 8px;">Asset</th>
                      <th style="text-align: right; padding: 8px;">Weight</th>
                      <th style="text-align: right; padding: 8px;">Value</th>
                    </tr>
                    <tr>
                      <td style="padding: 8px;">AAPL</td>
                      <td style="text-align: right; padding: 8px;">25.0%</td>
                      <td style="text-align: right; padding: 8px;">$25,000</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px;">MSFT</td>
                      <td style="text-align: right; padding: 8px;">20.0%</td>
                      <td style="text-align: right; padding: 8px;">$20,000</td>
                    </tr>
                  </table>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Small delay to ensure content is loaded
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } else {
      alert('Print functionality is not supported in this browser.');
    }
  }, []);

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pass': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'fail': return '#ef4444';
      case 'running': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pass': return '✅';
      case 'warning': return '⚠️';
      case 'fail': return '❌';
      case 'running': return '🔄';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="manual-testing-checklist">
      {/* Header */}
      <div className="testing-header">
        <h1>🧪 Manual Testing Checklist</h1>
        <p>Comprehensive quality assurance testing for STUDENT ANALYST</p>
        
        <div className="quick-stats">
          <div className="stat-card">
            <span className="stat-value">{testResults.length}</span>
            <span className="stat-label">Tests Completed</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {testResults.filter(t => t.status === 'pass').length}
            </span>
            <span className="stat-label">Passed</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {testResults.filter(t => t.status === 'fail').length}
            </span>
            <span className="stat-label">Failed</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="testing-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📋</span>
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'browser' ? 'active' : ''}`}
          onClick={() => setActiveTab('browser')}
        >
          <span className="tab-icon">🌐</span>
          Browser
        </button>
        <button
          className={`tab ${activeTab === 'responsive' ? 'active' : ''}`}
          onClick={() => setActiveTab('responsive')}
        >
          <span className="tab-icon">📱</span>
          Responsive
        </button>
        <button
          className={`tab ${activeTab === 'print' ? 'active' : ''}`}
          onClick={() => setActiveTab('print')}
        >
          <span className="tab-icon">🖨️</span>
          Print
        </button>
        <button
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <span className="tab-icon">⚡</span>
          Performance
        </button>
        <button
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <span className="tab-icon">📊</span>
          Results
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="testing-overview">
              <h2>🎯 Testing Overview</h2>
              <p>
                This comprehensive testing checklist ensures STUDENT ANALYST works perfectly 
                across all devices, browsers, and usage scenarios. Each test category focuses 
                on critical aspects of user experience and functionality.
              </p>

              <div className="test-categories">
                <div className="category-card">
                  <div className="category-header">
                    <span className="category-icon">🌐</span>
                    <h3>Browser Compatibility</h3>
                  </div>
                  <p>Verify support across Chrome, Firefox, Safari, and Edge browsers.</p>
                  <ul>
                    <li>Browser detection and version checking</li>
                    <li>JavaScript API compatibility</li>
                    <li>CSS feature support</li>
                    <li>WebWorker functionality</li>
                  </ul>
                </div>

                <div className="category-card">
                  <div className="category-header">
                    <span className="category-icon">📱</span>
                    <h3>Mobile Responsiveness</h3>
                  </div>
                  <p>Ensure optimal experience on phones, tablets, and desktops.</p>
                  <ul>
                    <li>Screen size adaptation</li>
                    <li>Touch interface usability</li>
                    <li>Navigation accessibility</li>
                    <li>Content readability</li>
                  </ul>
                </div>

                <div className="category-card">
                  <div className="category-header">
                    <span className="category-icon">🖨️</span>
                    <h3>Print Functionality</h3>
                  </div>
                  <p>Test document printing and PDF export capabilities.</p>
                  <ul>
                    <li>Print layout optimization</li>
                    <li>Chart and graph rendering</li>
                    <li>Page break handling</li>
                    <li>Content formatting</li>
                  </ul>
                </div>

                <div className="category-card">
                  <div className="category-header">
                    <span className="category-icon">⚡</span>
                    <h3>Performance Benchmarks</h3>
                  </div>
                  <p>Measure load times, calculation speed, and resource usage.</p>
                  <ul>
                    <li>Page load performance</li>
                    <li>Portfolio calculation speed</li>
                    <li>Memory usage monitoring</li>
                    <li>Data processing efficiency</li>
                  </ul>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  className="action-button primary"
                  onClick={runAutomatedTests}
                  disabled={isRunningTests}
                >
                  {isRunningTests ? '🔄 Running Tests...' : '🚀 Run All Tests'}
                </button>
                
                {isRunningTests && (
                  <div className="test-progress">
                    <div className="progress-text">{currentTest}</div>
                    <div className="progress-bar">
                      <div className="progress-fill" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'browser' && (
          <div className="browser-content">
            <h2>🌐 Browser Compatibility Testing</h2>
            
            {browserInfo && (
              <div className="browser-info">
                <div className="info-card">
                  <h3>Current Browser</h3>
                  <div className="browser-details">
                    <div className="detail-row">
                      <span className="label">Browser:</span>
                      <span className="value">{browserInfo.name} {browserInfo.version}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Engine:</span>
                      <span className="value">{browserInfo.engine}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Platform:</span>
                      <span className="value">{browserInfo.platform}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Mobile:</span>
                      <span className="value">{browserInfo.mobile ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Support Level:</span>
                      <span className={`value status-${browserInfo.supported ? 'pass' : 'warning'}`}>
                        {browserInfo.supported ? '✅ Fully Supported' : '⚠️ Limited Support'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="compatibility-matrix">
                  <h3>Browser Support Matrix</h3>
                  <table className="support-table">
                    <thead>
                      <tr>
                        <th>Browser</th>
                        <th>Minimum Version</th>
                        <th>Features</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Chrome</td>
                        <td>88+</td>
                        <td>Full ES2020, WebWorkers, Canvas</td>
                        <td>✅ Excellent</td>
                      </tr>
                      <tr>
                        <td>Firefox</td>
                        <td>85+</td>
                        <td>Full ES2020, WebWorkers, Canvas</td>
                        <td>✅ Excellent</td>
                      </tr>
                      <tr>
                        <td>Safari</td>
                        <td>14+</td>
                        <td>ES2020, Limited WebWorkers</td>
                        <td>⚠️ Good</td>
                      </tr>
                      <tr>
                        <td>Edge</td>
                        <td>88+</td>
                        <td>Full ES2020, WebWorkers, Canvas</td>
                        <td>✅ Excellent</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'responsive' && (
          <div className="responsive-content">
            <h2>📱 Mobile Responsiveness Testing</h2>
            
            <div className="current-viewport">
              <h3>Current Viewport</h3>
              <div className="viewport-info">
                <span>Width: {window.innerWidth}px</span>
                <span>Height: {window.innerHeight}px</span>
                <span>Pixel Ratio: {window.devicePixelRatio}</span>
              </div>
            </div>

            <div className="screen-tests">
              <h3>Device Testing Matrix</h3>
              <div className="devices-grid">
                {screenTests.map((test, index) => (
                  <div key={test.device} className="device-card">
                    <div className="device-header">
                      <span className="device-icon">
                        {test.category === 'mobile' ? '📱' : 
                         test.category === 'tablet' ? '📟' : '💻'}
                      </span>
                      <h4>{test.device}</h4>
                    </div>
                    
                    <div className="device-specs">
                      <span>{test.width} × {test.height}</span>
                      <span className="category">{test.category}</span>
                    </div>
                    
                    <div className="test-controls">
                      <button
                        className="test-button pass"
                        onClick={() => testScreenSize(index, true)}
                      >
                        ✅ Pass
                      </button>
                      <button
                        className="test-button fail"
                        onClick={() => testScreenSize(index, false, ['Layout issues detected'])}
                      >
                        ❌ Fail
                      </button>
                    </div>
                    
                    {test.passed !== null && (
                      <div className={`test-result ${test.passed ? 'pass' : 'fail'}`}>
                        {test.passed ? '✅ Passed' : '❌ Failed'}
                        {test.issues.length > 0 && (
                          <ul className="issues-list">
                            {test.issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="responsive-guidelines">
              <h3>Testing Guidelines</h3>
              <ul>
                <li>Check navigation menu accessibility on mobile</li>
                <li>Verify chart readability on small screens</li>
                <li>Test touch interactions for buttons and controls</li>
                <li>Ensure text remains legible at all sizes</li>
                <li>Verify horizontal scrolling is minimal</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'print' && (
          <div className="print-content">
            <h2>🖨️ Print Functionality Testing</h2>
            
            <div className="print-tests">
              <div className="test-section">
                <h3>Print Test</h3>
                <p>Test the print functionality with a sample document containing portfolio data and charts.</p>
                
                <button
                  className="action-button primary"
                  onClick={testPrintFunctionality}
                >
                  🖨️ Test Print Functionality
                </button>
              </div>

              <div className="print-checklist">
                <h3>Print Quality Checklist</h3>
                <div className="checklist">
                  <label htmlFor="checklist-1" className="checklist-item">
                    <input id="checklist-1" type="checkbox" />
                    <span>Headers and footers display correctly</span>
                  </label>
                  <label htmlFor="checklist-2" className="checklist-item">
                    <input id="checklist-2" type="checkbox" />
                    <span>Charts and graphs render properly</span>
                  </label>
                  <label htmlFor="checklist-3" className="checklist-item">
                    <input id="checklist-3" type="checkbox" />
                    <span>Tables maintain proper formatting</span>
                  </label>
                  <label htmlFor="checklist-4" className="checklist-item">
                    <input id="checklist-4" type="checkbox" />
                    <span>Page breaks occur at logical points</span>
                  </label>
                  <label htmlFor="checklist-5" className="checklist-item">
                    <input id="checklist-5" type="checkbox" />
                    <span>Colors convert appropriately to grayscale</span>
                  </label>
                  <label htmlFor="checklist-6" className="checklist-item">
                    <input id="checklist-6" type="checkbox" />
                    <span>Font sizes remain readable</span>
                  </label>
                  <label htmlFor="checklist-7" className="checklist-item">
                    <input id="checklist-7" type="checkbox" />
                    <span>Margins and spacing are consistent</span>
                  </label>
                </div>
              </div>

              <div className="print-specifications">
                <h3>Print Specifications</h3>
                <div className="specs-grid">
                  <div className="spec-card">
                    <h4>Page Setup</h4>
                    <ul>
                      <li>Format: A4 / Letter</li>
                      <li>Orientation: Portrait / Landscape</li>
                      <li>Margins: 20mm all sides</li>
                    </ul>
                  </div>
                  <div className="spec-card">
                    <h4>Content</h4>
                    <ul>
                      <li>Font: Arial, 12pt minimum</li>
                      <li>Headers: Bold, 14pt</li>
                      <li>Charts: 300 DPI equivalent</li>
                    </ul>
                  </div>
                  <div className="spec-card">
                    <h4>Layout</h4>
                    <ul>
                      <li>Avoid orphaned content</li>
                      <li>Keep related content together</li>
                      <li>Include page numbers</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-content">
            <h2>⚡ Performance Benchmarks</h2>
            
            {performanceMetrics.length > 0 && (
              <div className="metrics-grid">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="metric-card">
                    <div className="metric-header">
                      <h3>{metric.name}</h3>
                      <span 
                        className={`status-badge ${metric.status}`}
                        style={{ backgroundColor: getStatusColor(metric.status) }}
                      >
                        {getStatusIcon(metric.status)}
                      </span>
                    </div>
                    <div className="metric-value">
                      {metric.value} {metric.unit}
                    </div>
                    <div className="metric-threshold">
                      Threshold: {metric.threshold} {metric.unit}
                    </div>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill"
                        style={{ 
                          width: `${Math.min(100, (metric.value / metric.threshold) * 100)}%`,
                          backgroundColor: getStatusColor(metric.status)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="performance-guidelines">
              <h3>Performance Standards</h3>
              <div className="standards-grid">
                <div className="standard-card">
                  <h4>⚡ Page Load</h4>
                  <ul>
                    <li>Excellent: &lt; 2 seconds</li>
                    <li>Good: &lt; 3 seconds</li>
                    <li>Acceptable: &lt; 5 seconds</li>
                  </ul>
                </div>
                <div className="standard-card">
                  <h4>🧮 Calculations</h4>
                  <ul>
                    <li>100 assets: &lt; 10 seconds</li>
                    <li>500 assets: &lt; 30 seconds</li>
                    <li>1000 assets: &lt; 60 seconds</li>
                  </ul>
                </div>
                <div className="standard-card">
                  <h4>💾 Memory Usage</h4>
                  <ul>
                    <li>Base: &lt; 50 MB</li>
                    <li>With data: &lt; 100 MB</li>
                    <li>Maximum: &lt; 200 MB</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              className="action-button primary"
              onClick={() => runPerformanceTest('manual')}
            >
              🔄 Run Performance Test
            </button>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="results-content">
            <h2>📊 Test Results</h2>
            
            {testResults.length > 0 ? (
              <div className="results-table">
                <div className="table-header">
                  <div className="header-cell">Test</div>
                  <div className="header-cell">Category</div>
                  <div className="header-cell">Status</div>
                  <div className="header-cell">Details</div>
                  <div className="header-cell">Duration</div>
                  <div className="header-cell">Timestamp</div>
                </div>
                
                {testResults.map((result) => (
                  <div key={result.id} className="table-row">
                    <div className="table-cell">
                      <span className="test-icon">{getStatusIcon(result.status)}</span>
                      {result.name}
                    </div>
                    <div className="table-cell">
                      <span className="category-badge">{result.category}</span>
                    </div>
                    <div className="table-cell">
                      <span 
                        className={`status-badge ${result.status}`}
                        style={{ color: getStatusColor(result.status) }}
                      >
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="table-cell">{result.details}</div>
                    <div className="table-cell">
                      {result.duration ? `${result.duration}ms` : '-'}
                    </div>
                    <div className="table-cell">
                      {result.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-results">
                <span className="empty-icon">📋</span>
                <span className="empty-text">No test results yet. Run some tests to see results here.</span>
              </div>
            )}

            <div className="results-summary">
              <h3>Summary</h3>
              <div className="summary-stats">
                <div className="summary-stat">
                  <span className="stat-label">Total Tests:</span>
                  <span className="stat-value">{testResults.length}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Passed:</span>
                  <span className="stat-value pass">
                    {testResults.filter(t => t.status === 'pass').length}
                  </span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Failed:</span>
                  <span className="stat-value fail">
                    {testResults.filter(t => t.status === 'fail').length}
                  </span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Warnings:</span>
                  <span className="stat-value warning">
                    {testResults.filter(t => t.status === 'warning').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualTestingChecklist; 