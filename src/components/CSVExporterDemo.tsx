/**
 * STUDENT ANALYST - CSV Exporter Demo
 * Interactive demonstration of CSV export capabilities
 */

import React, { useState, useEffect } from 'react';
import CSVExporter from './CSVExporter';
import './CSVExporterDemo.css';

// Generate mock financial data for demo
const generateMockPortfolioData = () => {
  const holdings = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 150,
      currentPrice: 182.52,
      totalValue: 27378,
      weight: 25.8,
      dayChange: -127.14,
      dayChangePercent: -0.0046,
      totalReturn: 3250.75,
      totalReturnPercent: 0.1348,
      sector: 'Technology',
      currency: 'USD'
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 200,
      currentPrice: 338.47,
      totalValue: 67694,
      weight: 63.8,
      dayChange: 1015.41,
      dayChangePercent: 0.0152,
      totalReturn: 8924.80,
      totalReturnPercent: 0.1518,
      sector: 'Technology',
      currency: 'USD'
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 50,
      currentPrice: 138.21,
      totalValue: 6910.5,
      weight: 6.5,
      dayChange: -103.58,
      dayChangePercent: -0.0148,
      totalReturn: 892.35,
      totalReturnPercent: 0.1482,
      sector: 'Technology',
      currency: 'USD'
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      shares: 25,
      currentPrice: 163.57,
      totalValue: 4089.25,
      weight: 3.9,
      dayChange: 81.79,
      dayChangePercent: 0.0204,
      totalReturn: -245.67,
      totalReturnPercent: -0.0567,
      sector: 'Consumer Discretionary',
      currency: 'USD'
    }
  ];

  // Generate historical data points
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
          high: price * (1 + Math.random() * 0.015),
          low: price * (1 - Math.random() * 0.015),
          close: price,
          volume: Math.floor(Math.random() * 10000000 + 1000000),
          adjustedClose: price
        });
      });
    }
  }

  // Generate returns data
  const returnsData = [];
  symbols.forEach(symbol => {
    const symbolHistorical = historicalData.filter(d => d.symbol === symbol);
    const holding = holdings.find(h => h.symbol === symbol);
    
    symbolHistorical.forEach((dataPoint, index) => {
      if (index > 0) {
        const prevPrice = symbolHistorical[index - 1].close;
        const dailyReturn = (dataPoint.close - prevPrice) / prevPrice;
        const cumulativeReturn = (dataPoint.close - symbolHistorical[0].close) / symbolHistorical[0].close;
        
        returnsData.push({
          date: dataPoint.date,
          symbol,
          price: dataPoint.close,
          dailyReturn,
          cumulativeReturn,
          portfolioWeight: holding?.weight || 0,
          weightedReturn: dailyReturn * (holding?.weight || 0) / 100
        });
      }
    });
  });

  const metadata = {
    exportDate: new Date().toISOString(),
    portfolioName: 'Technology Growth Portfolio',
    totalValue: holdings.reduce((sum, h) => sum + h.totalValue, 0),
    baseCurrency: 'USD',
    dataSource: 'Alpha Vantage / Yahoo Finance',
    analysisDate: new Date().toISOString(),
    riskMetrics: {
      beta: 1.15,
      sharpeRatio: 1.42,
      volatility: 0.223,
      var95: -0.042,
      maxDrawdown: -0.185
    },
    performanceMetrics: {
      totalReturn: 0.127,
      annualizedReturn: 0.134,
      ytdReturn: 0.089,
      monthlyReturn: 0.012
    }
  };

  return {
    holdings,
    historicalData,
    returnsData,
    metadata
  };
};

const CSVExporterDemo: React.FC = () => {
  // Demo state
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exportHistory, setExportHistory] = useState<Array<{
    filename: string;
    type: string;
    timestamp: Date;
    size: string;
  }>>([]);

  // Demo scenarios
  const demoScenarios = {
    tech_growth: {
      name: 'Technology Growth Portfolio',
      description: 'High-growth tech stocks with strong performance metrics',
      icon: '🚀',
      holdings: 4,
      timeframe: '1 Year'
    },
    balanced: {
      name: 'Balanced Diversified Portfolio',
      description: 'Mixed allocation across sectors and asset classes',
      icon: '⚖️',
      holdings: 8,
      timeframe: '2 Years'
    },
    dividend: {
      name: 'Dividend Income Portfolio',
      description: 'High-dividend yield stocks for income generation',
      icon: '💰',
      holdings: 12,
      timeframe: '3 Years'
    },
    international: {
      name: 'Global Markets Portfolio',
      description: 'International exposure across developed markets',
      icon: '🌍',
      holdings: 15,
      timeframe: '5 Years'
    }
  };

  // Load demo data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulate data loading
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const data = generateMockPortfolioData();
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
      size: `${(Math.random() * 500 + 50).toFixed(1)} KB`
    };
    
    setExportHistory(prev => [newExport, ...prev.slice(0, 9)]);
  };

  // Change demo scenario
  const changeScenario = (scenarioKey: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const scenario = demoScenarios[scenarioKey as keyof typeof demoScenarios];
      const data = generateMockPortfolioData();
      
      // Modify data based on scenario
      data.metadata.portfolioName = scenario.name;
      
      setPortfolioData(data);
      setIsLoading(false);
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="csv-demo-loading">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
        </div>
        <h2>Loading Portfolio Data...</h2>
        <p>Generating realistic financial data for demonstration</p>
      </div>
    );
  }

  return (
    <div className="csv-exporter-demo">
      {/* Demo Header */}
      <div className="demo-header">
        <h1>📊 CSV Data Export System</h1>
        <p>Export your portfolio data to Excel-compatible CSV files</p>
        <div className="demo-badges">
          <span className="badge badge-feature">Portfolio Weights</span>
          <span className="badge badge-feature">Historical Data</span>
          <span className="badge badge-feature">Returns Analysis</span>
          <span className="badge badge-tech">Excel Compatible</span>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="scenario-selector">
        <h2>🎯 Demo Scenarios</h2>
        <div className="scenario-grid">
          {Object.entries(demoScenarios).map(([key, scenario]) => (
            <button
              key={key}
              className="scenario-card"
              onClick={() => changeScenario(key)}
            >
              <span className="scenario-icon">{scenario.icon}</span>
              <h3>{scenario.name}</h3>
              <p>{scenario.description}</p>
              <div className="scenario-stats">
                <span>{scenario.holdings} Holdings</span>
                <span>{scenario.timeframe} Data</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CSV Exporter */}
      {portfolioData && (
        <div className="exporter-section">
          <CSVExporter
            portfolioData={portfolioData}
            onExportComplete={handleExportComplete}
            className="demo-exporter"
          />
        </div>
      )}

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="export-history">
          <h2>📁 Export History</h2>
          <div className="history-list">
            {exportHistory.map((export_, index) => (
              <div key={index} className="history-item">
                <div className="history-icon">📄</div>
                <div className="history-info">
                  <div className="history-filename">{export_.filename}</div>
                  <div className="history-meta">
                    {export_.type} • {export_.timestamp.toLocaleTimeString()} • {export_.size}
                  </div>
                </div>
                <div className="history-status">✅ Exported</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Format Examples */}
      <div className="format-examples">
        <h2>📋 CSV Format Examples</h2>
        <div className="examples-grid">
          <div className="example-card">
            <h3>💼 Portfolio Weights</h3>
            <div className="example-content">
              <code>
                Symbol,Company Name,Shares,Current Price,Total Value,Portfolio Weight (%)<br/>
                AAPL,Apple Inc.,150,182.52,27378.00,25.80<br/>
                MSFT,Microsoft Corporation,200,338.47,67694.00,63.80
              </code>
            </div>
          </div>

          <div className="example-card">
            <h3>📈 Historical Data</h3>
            <div className="example-content">
              <code>
                Date,Symbol,Open,High,Low,Close,Volume,Adjusted Close<br/>
                2024-01-15,AAPL,185.20,187.45,184.30,186.75,45234567,186.75<br/>
                2024-01-15,MSFT,340.15,342.80,339.25,341.50,23456789,341.50
              </code>
            </div>
          </div>

          <div className="example-card">
            <h3>📊 Returns Series</h3>
            <div className="example-content">
              <code>
                Date,Symbol,Price,Daily Return (%),Cumulative Return (%)<br/>
                2024-01-15,AAPL,186.75,0.0045,0.1234<br/>
                2024-01-15,MSFT,341.50,-0.0012,0.0987
              </code>
            </div>
          </div>

          <div className="example-card">
            <h3>📋 Metadata</h3>
            <div className="example-content">
              <code>
                Export Information,<br/>
                Portfolio Name,Technology Growth Portfolio<br/>
                Total Portfolio Value,106071.75<br/>
                Risk Metrics,<br/>
                Beta,1.15<br/>
                Sharpe Ratio,1.42
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="integration-guide">
        <h2>🔧 Integration Guide</h2>
        <div className="guide-content">
          <div className="guide-section">
            <h3>📊 Excel Integration</h3>
            <ul>
              <li>Open exported CSV files directly in Microsoft Excel</li>
              <li>Data automatically formats into columns</li>
              <li>Use Excel's charting tools for visualization</li>
              <li>Create pivot tables for advanced analysis</li>
            </ul>
          </div>

          <div className="guide-section">
            <h3>🐍 Python Analysis</h3>
            <ul>
              <li>Import CSV files using pandas.read_csv()</li>
              <li>Portfolio weights for optimization algorithms</li>
              <li>Historical data for backtesting strategies</li>
              <li>Returns series for risk analysis</li>
            </ul>
          </div>

          <div className="guide-section">
            <h3>📈 R Statistical Analysis</h3>
            <ul>
              <li>Load data with read.csv() function</li>
              <li>Use quantmod for financial analysis</li>
              <li>PerformanceAnalytics for risk metrics</li>
              <li>Portfolio optimization with ROI package</li>
            </ul>
          </div>

          <div className="guide-section">
            <h3>🔄 Other Tools</h3>
            <ul>
              <li>Import into Google Sheets for collaboration</li>
              <li>Use with Tableau for data visualization</li>
              <li>Compatible with SPSS for statistical analysis</li>
              <li>Works with any CSV-compatible software</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="tech-specs">
        <h2>⚙️ Technical Specifications</h2>
        <div className="specs-grid">
          <div className="spec-item">
            <h4>📁 File Formats</h4>
            <ul>
              <li>CSV (Comma-Separated Values)</li>
              <li>UTF-8 and UTF-16 encoding</li>
              <li>Custom delimiters (comma, semicolon, tab)</li>
              <li>Excel-compatible formatting</li>
            </ul>
          </div>

          <div className="spec-item">
            <h4>📅 Date Formats</h4>
            <ul>
              <li>ISO 8601 (YYYY-MM-DD)</li>
              <li>US Format (MM/DD/YYYY)</li>
              <li>European Format (DD/MM/YYYY)</li>
              <li>Timezone-aware timestamps</li>
            </ul>
          </div>

          <div className="spec-item">
            <h4>🔢 Number Formats</h4>
            <ul>
              <li>Decimal notation (0.1234)</li>
              <li>Percentage notation (12.34%)</li>
              <li>Currency formatting ($1,234.56)</li>
              <li>Scientific notation support</li>
            </ul>
          </div>

          <div className="spec-item">
            <h4>🚀 Performance</h4>
            <ul>
              <li>Handles 100,000+ data points</li>
              <li>Client-side processing</li>
              <li>No server dependencies</li>
              <li>Optimized for large datasets</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVExporterDemo;

