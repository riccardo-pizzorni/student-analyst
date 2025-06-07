/**
 * STUDENT ANALYST - Tablet Layout Demo
 * Comprehensive demo showcasing tablet optimization features
 */

import React, { useState, useCallback, useMemo } from 'react';
import TabletLayout from './TabletLayout';
import TabletChartInteractions from './TabletChartInteractions';
import './TabletLayoutDemo.css';

interface DemoStep {
  id: number;
  title: string;
  description: string;
  mainContent: React.ReactNode;
  secondaryContent?: React.ReactNode;
  sidebarContent: React.ReactNode;
}

const TabletLayoutDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [exportCount, setExportCount] = useState(0);

  // Sample financial data
  const portfolioData = useMemo(() => ({
    totalValue: 125840.50,
    dailyChange: 2340.75,
    changePercent: 1.89,
    assets: [
      { symbol: 'AAPL', value: 45230.20, weight: 35.9, change: 2.4 },
      { symbol: 'MSFT', value: 32150.75, weight: 25.5, change: 1.8 },
      { symbol: 'GOOGL', value: 18920.30, weight: 15.0, change: -0.5 },
      { symbol: 'AMZN', value: 15680.45, weight: 12.5, change: 3.2 },
      { symbol: 'TSLA', value: 13858.80, weight: 11.1, change: -1.2 }
    ],
    riskMetrics: {
      volatility: 18.5,
      sharpeRatio: 1.42,
      maxDrawdown: -12.3,
      beta: 1.05
    }
  }), []);

  // Handle chart export
  const handleChartExport = useCallback((chartType: string) => {
    setExportCount(prev => prev + 1);
    console.log(`Exporting ${chartType} chart...`);
    setTimeout(() => {
      alert(`${chartType} chart exported successfully! (Demo simulation)`);
    }, 1000);
  }, []);

  // Handle chart interactions
  const handleChartReset = useCallback(() => {
    console.log('Resetting chart view...');
  }, []);

  const handleZoom = useCallback((scale: number) => {
    console.log(`Chart zoom: ${Math.round(scale * 100)}%`);
  }, []);

  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    console.log(`Chart pan: ${deltaX}, ${deltaY}`);
  }, []);

  // Demo steps configuration
  const demoSteps: DemoStep[] = useMemo(() => [
    {
      id: 1,
      title: "Portfolio Overview",
      description: "Complete financial portfolio summary with tablet-optimized 2-column layout",
      mainContent: (
        <div className="demo-main-content">
          <div className="portfolio-summary">
            <div className="summary-header">
              <h2>Portfolio Summary</h2>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Value</span>
                  <span className="stat-value">${portfolioData.totalValue.toLocaleString()}</span>
                </div>
                <div className="stat-item positive">
                  <span className="stat-label">Daily Change</span>
                  <span className="stat-value">+${portfolioData.dailyChange.toLocaleString()} ({portfolioData.changePercent}%)</span>
                </div>
              </div>
            </div>
            
            <TabletChartInteractions
              title="Portfolio Allocation"
              subtitle="Asset distribution by market value"
              onExport={() => handleChartExport('Portfolio Allocation')}
              onReset={handleChartReset}
              onZoom={handleZoom}
              onPan={handlePan}
            >
              <div className="demo-chart pie-chart">
                <div className="chart-segments">
                  {portfolioData.assets.map((asset, index) => (
                    <div key={asset.symbol} className={`segment segment-${index + 1}`}>
                      <div className="segment-label">
                        <strong>{asset.symbol}</strong>
                        <span>{asset.weight}%</span>
                      </div>
                      <div className="segment-value">${asset.value.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabletChartInteractions>
          </div>
        </div>
      ),
      secondaryContent: (
        <div className="demo-secondary-content">
          <div className="quick-stats">
            <h3>Quick Stats</h3>
            <div className="stats-grid">
              <div className="quick-stat">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <span className="stat-title">Assets</span>
                  <span className="stat-number">{portfolioData.assets.length}</span>
                </div>
              </div>
              <div className="quick-stat">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <span className="stat-title">Exports</span>
                  <span className="stat-number">{exportCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      sidebarContent: (
        <div className="demo-sidebar">
          <div className="portfolio-assets">
            <h3>Portfolio Assets</h3>
            <div className="asset-list">
              {portfolioData.assets.map((asset) => (
                <div key={asset.symbol} className="asset-item">
                  <div className="asset-symbol">{asset.symbol}</div>
                  <div className="asset-details">
                    <div className="asset-value">${asset.value.toLocaleString()}</div>
                    <div className={`asset-change ${asset.change >= 0 ? 'positive' : 'negative'}`}>
                      {asset.change >= 0 ? '+' : ''}{asset.change}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Risk Analysis",
      description: "Advanced risk metrics with interactive touch-enabled charts",
      mainContent: (
        <div className="demo-main-content">
          <div className="risk-analysis">
            <h2>Risk Analysis Dashboard</h2>
            
            <TabletChartInteractions
              title="Risk Metrics"
              subtitle="Touch to explore different risk factors"
              onExport={() => handleChartExport('Risk Analysis')}
              onReset={handleChartReset}
              onZoom={handleZoom}
              onPan={handlePan}
            >
              <div className="demo-chart risk-chart">
                <div className="risk-metrics-display">
                  <div className="metric-card">
                    <span className="metric-label">Volatility</span>
                    <span className="metric-value">{portfolioData.riskMetrics.volatility}%</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Sharpe Ratio</span>
                    <span className="metric-value">{portfolioData.riskMetrics.sharpeRatio}</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Max Drawdown</span>
                    <span className="metric-value">{portfolioData.riskMetrics.maxDrawdown}%</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Beta</span>
                    <span className="metric-value">{portfolioData.riskMetrics.beta}</span>
                  </div>
                </div>
              </div>
            </TabletChartInteractions>
          </div>
        </div>
      ),
      sidebarContent: (
        <div className="demo-sidebar">
          <div className="risk-breakdown">
            <h3>Risk Breakdown</h3>
            <div className="risk-items">
              <div className="risk-item">
                <span className="risk-label">Portfolio Risk</span>
                <span className="risk-status high">High</span>
              </div>
              <div className="risk-item">
                <span className="risk-label">Market Risk</span>
                <span className="risk-status medium">Medium</span>
              </div>
              <div className="risk-item">
                <span className="risk-label">Liquidity Risk</span>
                <span className="risk-status low">Low</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ], [portfolioData, exportCount, handleChartExport, handleChartReset, handleZoom, handlePan]);

  const currentStepData = demoSteps.find(step => step.id === currentStep) || demoSteps[0];

  const headerContent = (
    <div className="demo-header-content">
      <span className="demo-badge">TABLET DEMO</span>
    </div>
  );

  return (
    <div className="tablet-layout-demo">
      <TabletLayout
        currentStep={currentStep}
        totalSteps={demoSteps.length}
        onStepChange={setCurrentStep}
        headerContent={headerContent}
        sidebarContent={currentStepData.sidebarContent}
        secondaryContent={currentStepData.secondaryContent}
        className="demo-layout"
      >
        <div className="demo-step-content">
          <div className="step-header">
            <h1>{currentStepData.title}</h1>
            <p className="step-description">{currentStepData.description}</p>
          </div>
          {currentStepData.mainContent}
        </div>
      </TabletLayout>
    </div>
  );
};

export default TabletLayoutDemo; 

