/**
 * STUDENT ANALYST - Calculation Testing Demo Interface
 * Interactive demonstration of financial calculation validation system
 */

import React, { useState, useCallback, useMemo } from 'react';
import CalculationTesting from './CalculationTesting';
import './CalculationTestingDemo.css';

// Types
interface TestResult {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'failed' | 'warning';
  expected: number | string;
  actual: number | string;
  tolerance: number;
  duration: number;
  timestamp: Date;
  error?: string;
}

interface ValidationReport {
  id: string;
  timestamp: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  successRate: number;
  avgDuration: number;
  categories: {
    [key: string]: {
      total: number;
      passed: number;
      failed: number;
      warnings: number;
    };
  };
}

interface CalculationExample {
  id: string;
  name: string;
  description: string;
  formula: string;
  example: string;
  usage: string;
  notes: string[];
}

const CalculationTestingDemo: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'testing' | 'validation' | 'history' | 'documentation'>('testing');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [validationReports, setValidationReports] = useState<ValidationReport[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Handle test completion
  const handleTestComplete = useCallback((results: any[]) => {
    const formattedResults: TestResult[] = results.map(result => ({
      id: result.id,
      name: result.name,
      category: result.category,
      status: result.status,
      expected: result.expected,
      actual: result.actual,
      tolerance: result.tolerance,
      duration: result.duration || 0,
      timestamp: result.timestamp || new Date(),
      error: result.error
    }));

    setTestResults(formattedResults);

    // Create validation report
    const categories: { [key: string]: any } = {};
    const categoryTotals: { [key: string]: { total: number; passed: number; failed: number; warnings: number } } = {};

    formattedResults.forEach(result => {
      if (!categoryTotals[result.category]) {
        categoryTotals[result.category] = { total: 0, passed: 0, failed: 0, warnings: 0 };
      }
      categoryTotals[result.category].total++;
      if (result.status === 'passed') categoryTotals[result.category].passed++;
      else if (result.status === 'failed') categoryTotals[result.category].failed++;
      else if (result.status === 'warning') categoryTotals[result.category].warnings++;
    });

    const report: ValidationReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      totalTests: formattedResults.length,
      passedTests: formattedResults.filter(r => r.status === 'passed').length,
      failedTests: formattedResults.filter(r => r.status === 'failed').length,
      warningTests: formattedResults.filter(r => r.status === 'warning').length,
      successRate: (formattedResults.filter(r => r.status === 'passed').length / formattedResults.length) * 100,
      avgDuration: formattedResults.reduce((sum, r) => sum + r.duration, 0) / formattedResults.length,
      categories: categoryTotals
    };

    setValidationReports(prev => [report, ...prev].slice(0, 10)); // Keep last 10 reports
  }, []);

  // Calculation examples for documentation
  const calculationExamples: CalculationExample[] = [
    {
      id: 'simple_return',
      name: 'Simple Return',
      description: 'Calculate the percentage return of an investment over a period',
      formula: 'Return = (End Price - Start Price) / Start Price',
      example: 'Stock: $100 → $110\nReturn = (110 - 100) / 100 = 0.10 = 10%',
      usage: 'Used for measuring basic investment performance',
      notes: [
        'Most basic return calculation',
        'Does not account for compounding',
        'Good for single-period analysis'
      ]
    },
    {
      id: 'compound_return',
      name: 'Compound Return',
      description: 'Calculate returns accounting for reinvestment and compounding',
      formula: 'Compound Return = ∏(1 + Rᵢ) - 1',
      example: 'Returns: [5%, 3%, -2%, 4%]\nCompound = (1.05 × 1.03 × 0.98 × 1.04) - 1 = 10.4%',
      usage: 'Used for multi-period return analysis',
      notes: [
        'Accounts for compounding effects',
        'More accurate for long-term analysis',
        'Standard in portfolio management'
      ]
    },
    {
      id: 'sharpe_ratio',
      name: 'Sharpe Ratio',
      description: 'Measure risk-adjusted return performance',
      formula: 'Sharpe = (Portfolio Return - Risk-free Rate) / Portfolio Volatility',
      example: 'Portfolio: 12% return, 15% volatility, Risk-free: 2%\nSharpe = (0.12 - 0.02) / 0.15 = 0.67',
      usage: 'Compare risk-adjusted performance across investments',
      notes: [
        'Higher values indicate better risk-adjusted returns',
        'Values > 1.0 generally considered good',
        'Assumes normal distribution of returns'
      ]
    },
    {
      id: 'var',
      name: 'Value at Risk (VaR)',
      description: 'Estimate potential losses at a given confidence level',
      formula: 'VaR = Portfolio Value × Z-score × Volatility',
      example: '$1M portfolio, 95% confidence, 2% daily vol\nVaR = $1M × 1.65 × 0.02 = $33,000',
      usage: 'Risk management and regulatory compliance',
      notes: [
        '95% and 99% confidence levels most common',
        'Does not predict worst-case scenarios',
        'Assumes normal distribution'
      ]
    },
    {
      id: 'beta',
      name: 'Beta Coefficient',
      description: 'Measure systematic risk relative to market',
      formula: 'Beta = Covariance(Asset, Market) / Variance(Market)',
      example: 'Asset vol: 20%, Market vol: 15%, Correlation: 0.8\nBeta = 0.8 × (0.20 / 0.15) = 1.07',
      usage: 'Portfolio construction and risk assessment',
      notes: [
        'Beta = 1: Same risk as market',
        'Beta > 1: More volatile than market',
        'Beta < 1: Less volatile than market'
      ]
    },
    {
      id: 'portfolio_optimization',
      name: 'Portfolio Optimization',
      description: 'Find optimal asset weights for risk-return trade-off',
      formula: 'Min: wᵀΣw  Subject to: wᵀμ = μₚ, wᵀ1 = 1',
      example: 'Efficient Frontier optimization\nWeights: [40%, 35%, 25%]\nExpected Return: 9.5%, Risk: 12.3%',
      usage: 'Modern Portfolio Theory implementation',
      notes: [
        'Based on Markowitz theory',
        'Requires expected returns and covariance matrix',
        'Assumptions: normal returns, rational investors'
      ]
    }
  ];

  // Filter results by category
  const filteredResults = useMemo(() => {
    if (selectedCategory === 'all') return testResults;
    return testResults.filter(result => result.category === selectedCategory);
  }, [testResults, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(testResults.map(r => r.category));
    return ['all', ...Array.from(cats)];
  }, [testResults]);

  // Navigation tabs
  const tabs = [
    { id: 'testing' as const, label: 'Testing Laboratory', icon: '🧮' },
    { id: 'validation' as const, label: 'Validation Results', icon: '📊' },
    { id: 'history' as const, label: 'Test History', icon: '📈' },
    { id: 'documentation' as const, label: 'Mathematical Reference', icon: '📚' }
  ];

  return (
    <div className="calculation-testing-demo">
      {/* Demo Header */}
      <div className="demo-header">
        <div className="header-content">
          <h1>🧮 Calculation Testing System</h1>
          <p>Comprehensive validation and verification of financial calculations</p>
        </div>
        
        <div className="demo-stats">
          <div className="stat-item">
            <span className="stat-value">{testResults.length}</span>
            <span className="stat-label">Tests Run</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{validationReports.length}</span>
            <span className="stat-label">Reports</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {testResults.length > 0 
                ? ((testResults.filter(r => r.status === 'passed').length / testResults.length) * 100).toFixed(1)
                : '0'}%
            </span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="demo-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="demo-content">
        {activeTab === 'testing' && (
          <div className="testing-tab">
            <CalculationTesting onTestComplete={handleTestComplete} />
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="validation-tab">
            <div className="validation-header">
              <h2>📊 Validation Results</h2>
              <p>Detailed analysis of calculation accuracy and performance</p>
            </div>

            {testResults.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔬</div>
                <h3>No Test Results Available</h3>
                <p>Run tests in the Testing Laboratory to see validation results</p>
              </div>
            ) : (
              <>
                {/* Category Filter */}
                <div className="category-filter">
                  <span className="filter-label">Filter by Category:</span>
                  {categories.map(category => (
                    <button
                      key={category}
                      className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === 'all' ? 'All Categories' : 
                       category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>

                {/* Results Grid */}
                <div className="results-grid">
                  {filteredResults.map(result => (
                    <div key={result.id} className={`result-card ${result.status}`}>
                      <div className="result-header">
                        <div className="result-info">
                          <h4>{result.name}</h4>
                          <span className="result-category">
                            {result.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <div className={`result-status ${result.status}`}>
                          {result.status === 'passed' ? '✅' : 
                           result.status === 'failed' ? '❌' : '⚠️'}
                        </div>
                      </div>
                      
                      <div className="result-values">
                        <div className="value-row">
                          <span className="value-label">Expected:</span>
                          <span className="value-data">{
                            typeof result.expected === 'number' 
                              ? result.expected.toFixed(6) 
                              : result.expected
                          }</span>
                        </div>
                        <div className="value-row">
                          <span className="value-label">Actual:</span>
                          <span className="value-data">{
                            typeof result.actual === 'number' 
                              ? result.actual.toFixed(6) 
                              : result.actual
                          }</span>
                        </div>
                        <div className="value-row">
                          <span className="value-label">Tolerance:</span>
                          <span className="value-data">{result.tolerance}</span>
                        </div>
                        <div className="value-row">
                          <span className="value-label">Duration:</span>
                          <span className="value-data">{result.duration.toFixed(1)}ms</span>
                        </div>
                      </div>

                      {result.error && (
                        <div className="result-error">
                          <span className="error-icon">⚠️</span>
                          <span className="error-text">{result.error}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            <div className="history-header">
              <h2>📈 Test History</h2>
              <p>Historical tracking of validation reports and performance trends</p>
            </div>

            {validationReports.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Historical Data</h3>
                <p>Test reports will appear here after running validation tests</p>
              </div>
            ) : (
              <div className="history-timeline">
                {validationReports.map(report => (
                  <div key={report.id} className="timeline-item">
                    <div className="timeline-marker">
                      <div className={`marker-dot ${report.successRate >= 80 ? 'success' : report.successRate >= 60 ? 'warning' : 'error'}`} />
                    </div>
                    
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <h4>Validation Report</h4>
                        <span className="timeline-date">
                          {report.timestamp.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="timeline-stats">
                        <div className="timeline-stat">
                          <span className="stat-label">Tests:</span>
                          <span className="stat-value">{report.totalTests}</span>
                        </div>
                        <div className="timeline-stat">
                          <span className="stat-label">Passed:</span>
                          <span className="stat-value success">{report.passedTests}</span>
                        </div>
                        <div className="timeline-stat">
                          <span className="stat-label">Failed:</span>
                          <span className="stat-value error">{report.failedTests}</span>
                        </div>
                        <div className="timeline-stat">
                          <span className="stat-label">Warnings:</span>
                          <span className="stat-value warning">{report.warningTests}</span>
                        </div>
                        <div className="timeline-stat">
                          <span className="stat-label">Success Rate:</span>
                          <span className="stat-value">{report.successRate.toFixed(1)}%</span>
                        </div>
                        <div className="timeline-stat">
                          <span className="stat-label">Avg Duration:</span>
                          <span className="stat-value">{report.avgDuration.toFixed(1)}ms</span>
                        </div>
                      </div>
                      
                      <div className="timeline-categories">
                        <h5>Category Breakdown:</h5>
                        <div className="categories-grid">
                          {Object.entries(report.categories).map(([category, stats]) => (
                            <div key={category} className="category-card">
                              <span className="category-name">
                                {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <div className="category-stats">
                                <span className="success">{stats.passed}</span>
                                <span className="warning">{stats.warnings}</span>
                                <span className="error">{stats.failed}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documentation' && (
          <div className="documentation-tab">
            <div className="documentation-header">
              <h2>📚 Mathematical Reference</h2>
              <p>Comprehensive guide to financial calculations and formulas</p>
            </div>

            <div className="documentation-grid">
              {calculationExamples.map(example => (
                <div key={example.id} className="doc-card">
                  <div className="doc-header">
                    <h3>{example.name}</h3>
                    <p>{example.description}</p>
                  </div>
                  
                  <div className="doc-content">
                    <div className="doc-section">
                      <h4>📐 Formula</h4>
                      <div className="formula-box">
                        <code>{example.formula}</code>
                      </div>
                    </div>
                    
                    <div className="doc-section">
                      <h4>💡 Example</h4>
                      <div className="example-box">
                        <pre>{example.example}</pre>
                      </div>
                    </div>
                    
                    <div className="doc-section">
                      <h4>🎯 Usage</h4>
                      <p>{example.usage}</p>
                    </div>
                    
                    <div className="doc-section">
                      <h4>📝 Important Notes</h4>
                      <ul>
                        {example.notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Resources */}
            <div className="additional-resources">
              <h3>📖 Additional Resources</h3>
              <div className="resources-grid">
                <div className="resource-card">
                  <h4>📊 Risk Management</h4>
                  <ul>
                    <li>Value at Risk (VaR) calculations</li>
                    <li>Conditional Value at Risk (CVaR)</li>
                    <li>Maximum Drawdown analysis</li>
                    <li>Risk-adjusted return metrics</li>
                  </ul>
                </div>
                
                <div className="resource-card">
                  <h4>📈 Portfolio Theory</h4>
                  <ul>
                    <li>Modern Portfolio Theory (MPT)</li>
                    <li>Efficient Frontier construction</li>
                    <li>Capital Asset Pricing Model (CAPM)</li>
                    <li>Multi-factor models</li>
                  </ul>
                </div>
                
                <div className="resource-card">
                  <h4>⚡ Performance Analysis</h4>
                  <ul>
                    <li>Sharpe, Sortino, and Treynor ratios</li>
                    <li>Information ratio and tracking error</li>
                    <li>Alpha and beta calculations</li>
                    <li>Benchmark comparison methods</li>
                  </ul>
                </div>
                
                <div className="resource-card">
                  <h4>🔧 Implementation Notes</h4>
                  <ul>
                    <li>Numerical precision considerations</li>
                    <li>Edge case handling</li>
                    <li>Performance optimization</li>
                    <li>Validation best practices</li>
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

export default CalculationTestingDemo; 

