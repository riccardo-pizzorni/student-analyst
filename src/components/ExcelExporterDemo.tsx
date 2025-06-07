/**
 * STUDENT ANALYST - Excel Exporter Demo
 * Interactive demonstration of Excel export capabilities
 */

import React, { useState, useEffect } from 'react';
import ExcelExporter from './ExcelExporter';
import './ExcelExporterDemo.css';

// Generate mock data for Excel export demo
const generateMockExcelData = () => {
  const holdings = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 200,
      currentPrice: 185.92,
      totalValue: 37184,
      weight: 28.5,
      dayChange: 256.80,
      dayChangePercent: 0.0140,
      totalReturn: 4892.40,
      totalReturnPercent: 0.1515,
      sector: 'Technology',
      currency: 'USD'
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 150,
      currentPrice: 415.26,
      totalValue: 62289,
      weight: 47.8,
      dayChange: -831.90,
      dayChangePercent: -0.0132,
      totalReturn: 8235.60,
      totalReturnPercent: 0.1523,
      sector: 'Technology',
      currency: 'USD'
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 75,
      currentPrice: 143.58,
      totalValue: 10768.5,
      weight: 8.3,
      dayChange: -215.25,
      dayChangePercent: -0.0196,
      totalReturn: 1538.25,
      totalReturnPercent: 0.1664,
      sector: 'Technology',
      currency: 'USD'
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      shares: 60,
      currentPrice: 875.28,
      totalValue: 52516.8,
      weight: 40.3,
      dayChange: 1575.84,
      dayChangePercent: 0.0310,
      totalReturn: 15754.80,
      totalReturnPercent: 0.4286,
      sector: 'Technology',
      currency: 'USD'
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      shares: 80,
      currentPrice: 208.91,
      totalValue: 16712.8,
      weight: 12.8,
      dayChange: 334.56,
      dayChangePercent: 0.0204,
      totalReturn: -1254.60,
      totalReturnPercent: -0.0699,
      sector: 'Consumer Discretionary',
      currency: 'USD'
    }
  ];

  // Generate historical data
  const historicalData = [];
  const symbols = holdings.map(h => h.symbol);
  const startDate = new Date('2023-01-01');
  const endDate = new Date();
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
      symbols.forEach(symbol => {
        const basePrice = holdings.find(h => h.symbol === symbol)?.currentPrice || 100;
        const volatility = Math.random() * 0.04 - 0.02; // ±2% daily volatility
        const price = basePrice * (1 + volatility);
        
        historicalData.push({
          date: d.toISOString().split('T')[0],
          symbol,
          open: price * (1 + Math.random() * 0.01 - 0.005),
          high: price * (1 + Math.random() * 0.02),
          low: price * (1 - Math.random() * 0.02),
          close: price,
          volume: Math.floor(Math.random() * 15000000 + 2000000),
          adjustedClose: price
        });
      });
    }
  }

  const metadata = {
    portfolioName: 'Tech Growth Excel Demo',
    totalValue: holdings.reduce((sum, h) => sum + h.totalValue, 0),
    baseCurrency: 'USD',
    exportDate: new Date().toISOString(),
    riskMetrics: {
      beta: 1.28,
      sharpeRatio: 1.65,
      volatility: 0.245,
      var95: -0.038,
      maxDrawdown: -0.192
    },
    performanceMetrics: {
      totalReturn: 0.156,
      annualizedReturn: 0.168,
      ytdReturn: 0.124,
      monthlyReturn: 0.018
    }
  };

  return {
    holdings,
    historicalData,
    metadata
  };
};

const ExcelExporterDemo: React.FC = () => {
  // Demo state
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exportHistory, setExportHistory] = useState<Array<{
    filename: string;
    type: string;
    timestamp: Date;
    size: string;
    sheets: number;
  }>>([]);
  const [activeTab, setActiveTab] = useState<'exporter' | 'examples' | 'guide'>('exporter');

  // Excel templates showcase
  const excelTemplates = {
    standard: {
      name: 'Standard Report',
      description: 'Essential portfolio data with basic formulas',
      icon: '📄',
      sheets: ['Summary', 'Holdings'],
      features: ['Basic calculations', 'Clean formatting', 'Essential metrics'],
      useCase: 'Regular portfolio reviews and client reporting'
    },
    professional: {
      name: 'Professional Report',
      description: 'Complete analysis with all advanced features',
      icon: '💼',
      sheets: ['Summary', 'Holdings', 'Historical Data', 'Analysis', 'Chart Data'],
      features: ['Advanced formulas', 'Multiple worksheets', 'Chart data sources'],
      useCase: 'Investment committee presentations and comprehensive analysis'
    },
    analyst_report: {
      name: 'Analyst Report',
      description: 'Investment bank style presentation',
      icon: '🎯',
      sheets: ['Executive Summary', 'Portfolio Analysis', 'Risk Assessment', 'Performance'],
      features: ['Executive summary', 'Risk analysis', 'Performance attribution'],
      useCase: 'Professional investment analysis and client proposals'
    },
    dashboard: {
      name: 'Interactive Dashboard',
      description: 'Excel dashboard with charts and controls',
      icon: '📊',
      sheets: ['Dashboard', 'Data', 'Charts', 'Controls', 'Settings'],
      features: ['Interactive charts', 'Control panels', 'Dynamic formulas'],
      useCase: 'Real-time portfolio monitoring and interactive presentations'
    }
  };

  // Load demo data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulate data loading
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const data = generateMockExcelData();
      setPortfolioData(data);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Handle export completion
  const handleExportComplete = (filename: string, type: string) => {
    const newExport = {
      filename,
      type,
      timestamp: new Date(),
      size: `${(Math.random() * 800 + 200).toFixed(1)} KB`,
      sheets: type.includes('dashboard') ? 5 : type.includes('professional') ? 5 : type.includes('analyst') ? 4 : 2
    };
    
    setExportHistory(prev => [newExport, ...prev.slice(0, 9)]);
  };

  if (isLoading) {
    return (
      <div className="excel-demo-loading">
        <div className="loading-animation">
          <div className="excel-icon">📊</div>
          <div className="loading-text">
            <h2>Preparing Excel Export Demo...</h2>
            <p>Generating multi-sheet workbooks with formulas and charts</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="excel-exporter-demo">
      {/* Demo Header */}
      <div className="demo-header">
        <h1>📊 Advanced Excel Export System</h1>
        <p>Create professional Excel workbooks with multiple sheets, formulas, and chart-ready data</p>
        <div className="demo-features">
          <span className="feature-badge">Multiple Sheets</span>
          <span className="feature-badge">Excel Formulas</span>
          <span className="feature-badge">Chart Data</span>
          <span className="feature-badge">Professional Templates</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="demo-tabs">
        <button 
          className={`tab-button ${activeTab === 'exporter' ? 'active' : ''}`}
          onClick={() => setActiveTab('exporter')}
        >
          📤 Export System
        </button>
        <button 
          className={`tab-button ${activeTab === 'examples' ? 'active' : ''}`}
          onClick={() => setActiveTab('examples')}
        >
          📋 Template Gallery
        </button>
        <button 
          className={`tab-button ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          📚 User Guide
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'exporter' && (
        <div className="tab-content">
          {/* Excel Exporter */}
          {portfolioData && (
            <div className="exporter-section">
              <ExcelExporter
                portfolioData={portfolioData}
                onExportComplete={handleExportComplete}
                className="demo-excel-exporter"
              />
            </div>
          )}

          {/* Export History */}
          {exportHistory.length > 0 && (
            <div className="export-history">
              <h2>📁 Export History</h2>
              <div className="history-grid">
                {exportHistory.map((export_, index) => (
                  <div key={index} className="history-card">
                    <div className="history-header">
                      <span className="history-icon">📄</span>
                      <div className="history-info">
                        <div className="history-filename">{export_.filename}</div>
                        <div className="history-meta">
                          {export_.type} • {export_.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="history-stats">
                      <span>📊 {export_.sheets} Sheets</span>
                      <span>💾 {export_.size}</span>
                      <span className="history-status">✅ Ready</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'examples' && (
        <div className="tab-content">
          {/* Template Gallery */}
          <div className="template-gallery">
            <h2>📋 Excel Template Gallery</h2>
            <p>Explore our professional Excel export templates designed for different use cases</p>
            
            <div className="gallery-grid">
              {Object.entries(excelTemplates).map(([key, template]) => (
                <div key={key} className="gallery-card">
                  <div className="gallery-header">
                    <span className="gallery-icon">{template.icon}</span>
                    <h3>{template.name}</h3>
                  </div>
                  
                  <p className="gallery-description">{template.description}</p>
                  
                  <div className="gallery-sheets">
                    <h4>📄 Worksheets Included:</h4>
                    <ul>
                      {template.sheets.map(sheet => (
                        <li key={sheet}>{sheet}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="gallery-features">
                    <h4>✨ Key Features:</h4>
                    <ul>
                      {template.features.map(feature => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="gallery-usecase">
                    <h4>🎯 Best For:</h4>
                    <p>{template.useCase}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Excel Features Showcase */}
          <div className="excel-features">
            <h2>🧮 Advanced Excel Features</h2>
            <div className="features-showcase">
              <div className="feature-demo">
                <h3>📊 Live Formulas</h3>
                <div className="formula-examples">
                  <div className="formula-item">
                    <code>=C2*D2</code>
                    <span>Calculate total value from shares × price</span>
                  </div>
                  <div className="formula-item">
                    <code>=SUM(E2:E6)</code>
                    <span>Portfolio total with auto-updating sum</span>
                  </div>
                  <div className="formula-item">
                    <code>=E2/$E$7</code>
                    <span>Portfolio weight percentage with absolute reference</span>
                  </div>
                </div>
              </div>

              <div className="feature-demo">
                <h3>📈 Chart Data Sources</h3>
                <div className="chart-examples">
                  <div className="chart-item">
                    <span className="chart-type">🥧 Pie Chart</span>
                    <span>Portfolio allocation by holding</span>
                  </div>
                  <div className="chart-item">
                    <span className="chart-type">📊 Bar Chart</span>
                    <span>Performance comparison across assets</span>
                  </div>
                  <div className="chart-item">
                    <span className="chart-type">📈 Line Chart</span>
                    <span>Historical price trends over time</span>
                  </div>
                </div>
              </div>

              <div className="feature-demo">
                <h3>🎨 Professional Formatting</h3>
                <div className="format-examples">
                  <div className="format-item">
                    <span className="format-label">Currency</span>
                    <span className="format-example">$1,234.56</span>
                  </div>
                  <div className="format-item">
                    <span className="format-label">Percentage</span>
                    <span className="format-example">12.34%</span>
                  </div>
                  <div className="format-item">
                    <span className="format-label">Date</span>
                    <span className="format-example">2024-01-15</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'guide' && (
        <div className="tab-content">
          {/* User Guide */}
          <div className="user-guide">
            <h2>📚 Excel Export User Guide</h2>
            
            <div className="guide-sections">
              <div className="guide-section">
                <h3>🚀 Getting Started</h3>
                <ol>
                  <li>Select your preferred export template</li>
                  <li>Configure export settings (date format, currency, etc.)</li>
                  <li>Click the export button to generate your Excel file</li>
                  <li>Open the downloaded file in Microsoft Excel</li>
                </ol>
              </div>

              <div className="guide-section">
                <h3>📊 Working with Excel Files</h3>
                <div className="guide-tips">
                  <div className="tip-item">
                    <h4>🧮 Using Formulas</h4>
                    <p>All calculations are live Excel formulas. Edit input values and totals update automatically.</p>
                  </div>
                  <div className="tip-item">
                    <h4>📈 Creating Charts</h4>
                    <p>Use the "Chart Data" sheet to create professional visualizations. Select data ranges and insert charts.</p>
                  </div>
                  <div className="tip-item">
                    <h4>🎨 Customizing Format</h4>
                    <p>Apply Excel's formatting tools to match your brand colors and style preferences.</p>
                  </div>
                </div>
              </div>

              <div className="guide-section">
                <h3>🔧 Advanced Features</h3>
                <div className="advanced-features">
                  <div className="advanced-item">
                    <h4>📄 Multiple Worksheets</h4>
                    <p>Navigate between Summary, Holdings, Historical Data, Analysis, and Chart Data sheets using the tabs at the bottom.</p>
                  </div>
                  <div className="advanced-item">
                    <h4>🔗 Sheet References</h4>
                    <p>Formulas automatically reference data across sheets (e.g., =Holdings!E2 references cell E2 in Holdings sheet).</p>
                  </div>
                  <div className="advanced-item">
                    <h4>📊 Pivot Tables</h4>
                    <p>Use Excel's Data &gt; Pivot Table feature with the exported data for advanced analysis and reporting.</p>
                  </div>
                </div>
              </div>

              <div className="guide-section">
                <h3>💡 Best Practices</h3>
                <div className="best-practices">
                  <div className="practice-item">
                    <span className="practice-icon">✅</span>
                    <span>Save a backup copy before making major modifications</span>
                  </div>
                  <div className="practice-item">
                    <span className="practice-icon">✅</span>
                    <span>Use "Protect Sheet" to prevent accidental formula changes</span>
                  </div>
                  <div className="practice-item">
                    <span className="practice-icon">✅</span>
                    <span>Enable automatic calculation (Formulas &gt; Calculation Options &gt; Automatic)</span>
                  </div>
                  <div className="practice-item">
                    <span className="practice-icon">✅</span>
                    <span>Use named ranges for important data areas for easier formula references</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compatibility Information */}
          <div className="compatibility-info">
            <h2>🔧 Software Compatibility</h2>
            <div className="compatibility-grid">
              <div className="compat-item">
                <h3>Microsoft Excel</h3>
                <p>Full compatibility with Excel 2016 and newer. All formulas and formatting preserved.</p>
                <span className="compat-status excellent">Excellent</span>
              </div>
              <div className="compat-item">
                <h3>Google Sheets</h3>
                <p>Good compatibility. Most formulas work, some advanced formatting may differ.</p>
                <span className="compat-status good">Good</span>
              </div>
              <div className="compat-item">
                <h3>LibreOffice Calc</h3>
                <p>Basic compatibility. Core functionality works, some Excel-specific features may not display.</p>
                <span className="compat-status basic">Basic</span>
              </div>
              <div className="compat-item">
                <h3>Numbers (macOS)</h3>
                <p>Limited compatibility. Can open files but complex formulas may need adjustment.</p>
                <span className="compat-status limited">Limited</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelExporterDemo;

