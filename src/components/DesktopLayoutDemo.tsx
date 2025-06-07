/**
 * STUDENT ANALYST - Desktop Layout Demo
 * Comprehensive demonstration of desktop features with realistic financial analysis
 */

import React, { useState, useCallback, useMemo } from 'react';
import DesktopLayout from './DesktopLayout';
import DesktopChartControls from './DesktopChartControls';
import './DesktopLayoutDemo.css';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  dividend: number;
}

interface PortfolioData {
  symbol: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  dayChange: number;
  totalReturn: number;
  allocation: number;
}

const DesktopLayoutDemo: React.FC = () => {
  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [chartType, setChartType] = useState('candlestick');
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [portfolioFilter, setPortfolioFilter] = useState('all');
  const [watchlistSort, setWatchlistSort] = useState('symbol');

  // Demo Financial Data
  const stockData: StockData[] = useMemo(() => [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 178.50,
      change: 2.15,
      changePercent: 1.22,
      volume: 45250000,
      marketCap: 2850000000000,
      pe: 28.5,
      dividend: 0.95
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 138.75,
      change: -1.25,
      changePercent: -0.89,
      volume: 28150000,
      marketCap: 1750000000000,
      pe: 24.8,
      dividend: 0.00
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 412.30,
      change: 5.80,
      changePercent: 1.43,
      volume: 22680000,
      marketCap: 3050000000000,
      pe: 32.1,
      dividend: 2.72
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 145.25,
      change: -0.75,
      changePercent: -0.51,
      volume: 35420000,
      marketCap: 1520000000000,
      pe: 55.2,
      dividend: 0.00
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 245.80,
      change: 8.45,
      changePercent: 3.56,
      volume: 85750000,
      marketCap: 780000000000,
      pe: 65.8,
      dividend: 0.00
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 875.60,
      change: 15.30,
      changePercent: 1.78,
      volume: 42680000,
      marketCap: 2150000000000,
      pe: 68.4,
      dividend: 0.16
    }
  ], []);

  const portfolioData: PortfolioData[] = useMemo(() => [
    {
      symbol: 'AAPL',
      shares: 100,
      avgCost: 165.25,
      currentPrice: 178.50,
      totalValue: 17850,
      dayChange: 215,
      totalReturn: 1325,
      allocation: 35.2
    },
    {
      symbol: 'MSFT',
      shares: 50,
      avgCost: 380.75,
      currentPrice: 412.30,
      totalValue: 20615,
      dayChange: 290,
      totalReturn: 1577.50,
      allocation: 40.6
    },
    {
      symbol: 'GOOGL',
      shares: 25,
      avgCost: 142.50,
      currentPrice: 138.75,
      totalValue: 3468.75,
      dayChange: -31.25,
      totalReturn: -93.75,
      allocation: 6.8
    },
    {
      symbol: 'NVDA',
      shares: 10,
      avgCost: 820.00,
      currentPrice: 875.60,
      totalValue: 8756,
      dayChange: 153,
      totalReturn: 556,
      allocation: 17.4
    }
  ], []);

  // Chart Data Generator
  const generateChartData = useCallback((symbol: string) => {
    const basePrice = stockData.find(s => s.symbol === symbol)?.price || 100;
    const data = [];
    
    for (let i = 0; i < 100; i++) {
      const variance = (Math.random() - 0.5) * 10;
      const price = basePrice + variance + (Math.sin(i / 10) * 5);
      data.push({
        date: new Date(Date.now() - (99 - i) * 24 * 60 * 60 * 1000),
        open: price - 2 + Math.random() * 4,
        high: price + Math.random() * 5,
        low: price - Math.random() * 5,
        close: price,
        volume: 1000000 + Math.random() * 50000000
      });
    }
    
    return data;
  }, [stockData]);

  // Handle export functionality
  const handleExport = useCallback((format: string) => {
    console.log(`Exporting chart as ${format}`);
    // In a real app, this would trigger actual export functionality
    alert(`Chart exported as ${format.toUpperCase()}!`);
  }, []);

  // Handle chart controls
  const handleZoom = useCallback((zoomLevel: number) => {
    console.log(`Zoom level: ${zoomLevel}`);
  }, []);

  const handlePan = useCallback((direction: string) => {
    console.log(`Pan direction: ${direction}`);
  }, []);

  const handleReset = useCallback(() => {
    console.log('Chart reset');
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  // Format number
  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  }, []);

  // Format market cap
  const formatMarketCap = useCallback((cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toFixed(2)}`;
  }, []);

  // Steps configuration
  const steps = [
    {
      id: 1,
      title: 'Portfolio Overview',
      description: 'Complete portfolio analysis with real-time data'
    },
    {
      id: 2,
      title: 'Advanced Charts',
      description: 'Professional charting with technical indicators'
    },
    {
      id: 3,
      title: 'Risk Analysis',
      description: 'Comprehensive risk assessment and optimization'
    },
    {
      id: 4,
      title: 'Market Research',
      description: 'Deep market analysis and stock screening'
    }
  ];

  // Sidebar Content
  const sidebarContent = (
    <div className="desktop-sidebar-content">
      {/* Navigation Menu */}
      <div className="sidebar-section">
        <h4 className="sidebar-section-title">🧭 Navigation</h4>
        <div className="nav-menu">
          {steps.map(step => (
            <button
              key={step.id}
              className={`nav-item ${currentStep === step.id ? 'active' : ''}`}
              onClick={() => setCurrentStep(step.id)}
            >
              <span className="nav-number">{step.id}</span>
              <div className="nav-content">
                <span className="nav-title">{step.title}</span>
                <span className="nav-description">{step.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="sidebar-section">
        <h4 className="sidebar-section-title">📊 Portfolio Summary</h4>
        <div className="quick-stats">
          <div className="stat-item">
            <span className="stat-label">Total Value</span>
            <span className="stat-value">
              {formatCurrency(portfolioData.reduce((sum, item) => sum + item.totalValue, 0))}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Day Change</span>
            <span className={`stat-value ${portfolioData.reduce((sum, item) => sum + item.dayChange, 0) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(portfolioData.reduce((sum, item) => sum + item.dayChange, 0))}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Return</span>
            <span className={`stat-value ${portfolioData.reduce((sum, item) => sum + item.totalReturn, 0) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(portfolioData.reduce((sum, item) => sum + item.totalReturn, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Watchlist */}
      <div className="sidebar-section">
        <h4 className="sidebar-section-title">👁️ Watchlist</h4>
        <div className="watchlist">
          {stockData.slice(0, 4).map(stock => (
            <button
              key={stock.symbol}
              className={`watchlist-item ${selectedStock === stock.symbol ? 'selected' : ''}`}
              onClick={() => setSelectedStock(stock.symbol)}
            >
              <div className="stock-info">
                <span className="stock-symbol">{stock.symbol}</span>
                <span className="stock-name">{stock.name}</span>
              </div>
              <div className="stock-price">
                <span className="price">{formatCurrency(stock.price)}</span>
                <span className={`change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="sidebar-section">
        <h4 className="sidebar-section-title">⚡ Quick Actions</h4>
        <div className="quick-actions">
          <button className="action-btn">📈 New Analysis</button>
          <button className="action-btn">📊 Add Chart</button>
          <button className="action-btn">💾 Export Data</button>
          <button className="action-btn">🔄 Refresh All</button>
        </div>
      </div>
    </div>
  );

  // Main Content based on current step
  const renderMainContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="portfolio-overview">
            <div className="overview-header">
              <h2>📈 Portfolio Overview</h2>
              <p>Complete analysis of your investment portfolio with real-time performance metrics</p>
            </div>

            <div className="portfolio-metrics">
              <div className="metric-card">
                <h3>Total Portfolio Value</h3>
                <div className="metric-value">
                  {formatCurrency(portfolioData.reduce((sum, item) => sum + item.totalValue, 0))}
                </div>
                <div className="metric-change positive">
                  +{formatCurrency(portfolioData.reduce((sum, item) => sum + item.dayChange, 0))} Today
                </div>
              </div>

              <div className="metric-card">
                <h3>Total Return</h3>
                <div className="metric-value">
                  {formatCurrency(portfolioData.reduce((sum, item) => sum + item.totalReturn, 0))}
                </div>
                <div className="metric-change positive">
                  +{((portfolioData.reduce((sum, item) => sum + item.totalReturn, 0) / portfolioData.reduce((sum, item) => sum + (item.shares * item.avgCost), 0)) * 100).toFixed(2)}%
                </div>
              </div>

              <div className="metric-card">
                <h3>Holdings</h3>
                <div className="metric-value">{portfolioData.length}</div>
                <div className="metric-change neutral">Assets</div>
              </div>
            </div>

            <div className="portfolio-table">
              <h3>📋 Holdings Breakdown</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Shares</th>
                      <th>Avg Cost</th>
                      <th>Current Price</th>
                      <th>Total Value</th>
                      <th>Day Change</th>
                      <th>Total Return</th>
                      <th>Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioData.map(holding => (
                      <tr key={holding.symbol}>
                        <td className="symbol-cell">
                          <strong>{holding.symbol}</strong>
                        </td>
                        <td>{holding.shares}</td>
                        <td>{formatCurrency(holding.avgCost)}</td>
                        <td>{formatCurrency(holding.currentPrice)}</td>
                        <td>{formatCurrency(holding.totalValue)}</td>
                        <td className={holding.dayChange >= 0 ? 'positive' : 'negative'}>
                          {formatCurrency(holding.dayChange)}
                        </td>
                        <td className={holding.totalReturn >= 0 ? 'positive' : 'negative'}>
                          {formatCurrency(holding.totalReturn)}
                        </td>
                        <td>{holding.allocation}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="advanced-charts">
            <div className="charts-header">
              <h2>📊 Advanced Charts</h2>
              <p>Professional charting tools with technical analysis capabilities</p>
            </div>

            <div className="chart-container">
              <div className="chart-main">
                <div className="chart-header">
                  <h3>📈 {selectedStock} - Price Chart</h3>
                  <div className="chart-info">
                    {stockData.find(s => s.symbol === selectedStock) && (
                      <>
                        <span className="current-price">
                          {formatCurrency(stockData.find(s => s.symbol === selectedStock)!.price)}
                        </span>
                        <span className={`price-change ${stockData.find(s => s.symbol === selectedStock)!.change >= 0 ? 'positive' : 'negative'}`}>
                          {stockData.find(s => s.symbol === selectedStock)!.change >= 0 ? '+' : ''}
                          {formatCurrency(stockData.find(s => s.symbol === selectedStock)!.change)} 
                          ({stockData.find(s => s.symbol === selectedStock)!.changePercent.toFixed(2)}%)
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="chart-placeholder">
                  <div className="chart-demo">
                    <canvas width="800" height="400" style={{ background: '#f8fafc', borderRadius: '8px' }}>
                      Your browser does not support the HTML5 canvas tag.
                    </canvas>
                    <div className="chart-overlay">
                      <p>📈 Interactive Chart Placeholder</p>
                      <p>Real implementation would show {chartType} chart for {selectedStock}</p>
                      <p>With technical indicators and drawing tools</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chart-controls">
                <DesktopChartControls
                  chartData={generateChartData(selectedStock)}
                  onDataChange={() => {}}
                  onExport={handleExport}
                  onZoom={handleZoom}
                  onPan={handlePan}
                  onReset={handleReset}
                  chartType={chartType}
                  onChartTypeChange={setChartType}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="risk-analysis">
            <div className="risk-header">
              <h2>⚠️ Risk Analysis</h2>
              <p>Comprehensive risk assessment and portfolio optimization tools</p>
            </div>

            <div className="risk-metrics">
              <div className="risk-card">
                <h3>Portfolio Beta</h3>
                <div className="risk-value">1.15</div>
                <div className="risk-description">15% more volatile than market</div>
              </div>

              <div className="risk-card">
                <h3>Sharpe Ratio</h3>
                <div className="risk-value">1.34</div>
                <div className="risk-description">Good risk-adjusted returns</div>
              </div>

              <div className="risk-card">
                <h3>Max Drawdown</h3>
                <div className="risk-value">-12.5%</div>
                <div className="risk-description">Largest peak-to-trough decline</div>
              </div>

              <div className="risk-card">
                <h3>VaR (95%)</h3>
                <div className="risk-value">-5.2%</div>
                <div className="risk-description">Daily loss not exceeded 95% of time</div>
              </div>
            </div>

            <div className="risk-breakdown">
              <h3>🎯 Risk Breakdown by Asset</h3>
              <div className="risk-table">
                <table>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Weight</th>
                      <th>Beta</th>
                      <th>Volatility</th>
                      <th>VaR Contribution</th>
                      <th>Risk Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioData.map(holding => (
                      <tr key={holding.symbol}>
                        <td><strong>{holding.symbol}</strong></td>
                        <td>{holding.allocation}%</td>
                        <td>{(Math.random() * 0.5 + 0.8).toFixed(2)}</td>
                        <td>{(Math.random() * 20 + 15).toFixed(1)}%</td>
                        <td>{(Math.random() * 2 + 0.5).toFixed(2)}%</td>
                        <td>
                          <span className={`risk-score ${Math.random() > 0.5 ? 'medium' : 'low'}`}>
                            {Math.random() > 0.5 ? 'Medium' : 'Low'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="market-research">
            <div className="research-header">
              <h2>🔍 Market Research</h2>
              <p>Deep market analysis and stock screening tools</p>
            </div>

            <div className="market-overview">
              <h3>📊 Market Overview</h3>
              <div className="market-grid">
                {stockData.map(stock => (
                  <div key={stock.symbol} className="stock-card">
                    <div className="stock-header">
                      <span className="stock-symbol">{stock.symbol}</span>
                      <span className={`stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="stock-name">{stock.name}</div>
                    <div className="stock-price">{formatCurrency(stock.price)}</div>
                    <div className="stock-metrics">
                      <div className="metric">
                        <span>Market Cap:</span>
                        <span>{formatMarketCap(stock.marketCap)}</span>
                      </div>
                      <div className="metric">
                        <span>P/E Ratio:</span>
                        <span>{stock.pe}</span>
                      </div>
                      <div className="metric">
                        <span>Volume:</span>
                        <span>{formatNumber(stock.volume)}</span>
                      </div>
                      <div className="metric">
                        <span>Dividend:</span>
                        <span>{stock.dividend > 0 ? `${stock.dividend}%` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a step to view content</div>;
    }
  };

  return (
    <DesktopLayout
      currentStep={currentStep}
      totalSteps={4}
      onStepChange={setCurrentStep}
      sidebarContent={sidebarContent}
      className="desktop-demo"
    >
      {renderMainContent()}
    </DesktopLayout>
  );
};

export default DesktopLayoutDemo; 

