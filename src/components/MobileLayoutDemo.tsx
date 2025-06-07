/**
 * STUDENT ANALYST - Mobile Layout Demo
 * Demonstration of mobile-first design with financial analysis steps
 */

import React, { useState } from 'react';
import MobileLayout from './MobileLayout';
import MobileChartWrapper from './MobileChartWrapper';
import './MobileLayoutDemo.css';

interface DemoStep {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

const MobileLayoutDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // Demo data for charts
  const samplePortfolio = [
    { name: 'US Stocks', value: 40, color: '#3b82f6' },
    { name: 'International', value: 25, color: '#10b981' },
    { name: 'Bonds', value: 20, color: '#f59e0b' },
    { name: 'REITs', value: 10, color: '#ef4444' },
    { name: 'Cash', value: 5, color: '#6b7280' }
  ];

  const sampleMetrics = [
    { label: 'Total Return', value: '+12.5%', trend: 'up' },
    { label: 'Volatility', value: '14.2%', trend: 'stable' },
    { label: 'Sharpe Ratio', value: '0.88', trend: 'up' },
    { label: 'Max Drawdown', value: '-8.3%', trend: 'down' }
  ];

  // Simulate chart export
  const handleExportChart = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  // Simulate chart reset
  const handleResetChart = () => {
    setChartError(null);
  };

  // Demo steps configuration
  const demoSteps: DemoStep[] = [
    {
      id: 1,
      title: "Portfolio Overview",
      description: "View your investment portfolio allocation and key metrics",
      component: (
        <div className="demo-step">
          <MobileChartWrapper
            title="Portfolio Allocation"
            subtitle="Current asset distribution"
            onExport={handleExportChart}
            onReset={handleResetChart}
            isLoading={isLoading}
          >
            <div className="portfolio-chart">
              <div className="pie-chart-demo">
                {samplePortfolio.map((asset, index) => (
                  <div 
                    key={index}
                    className="asset-slice"
                    style={{
                      '--slice-color': asset.color,
                      '--slice-percentage': `${asset.value}%`
                    } as React.CSSProperties}
                  >
                    <span className="asset-label">{asset.name}</span>
                    <span className="asset-value">{asset.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </MobileChartWrapper>

          <div className="metrics-grid">
            {sampleMetrics.map((metric, index) => (
              <div key={index} className="metric-card">
                <div className="metric-label">{metric.label}</div>
                <div className={`metric-value ${metric.trend}`}>
                  {metric.value}
                  <span className="trend-icon">
                    {metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Risk Analysis",
      description: "Analyze portfolio risk and correlation patterns",
      component: (
        <div className="demo-step">
          <MobileChartWrapper
            title="Risk Heatmap"
            subtitle="Asset correlation matrix"
            onExport={handleExportChart}
            onReset={handleResetChart}
          >
            <div className="heatmap-demo">
              <div className="heatmap-grid">
                {Array.from({ length: 25 }, (_, i) => (
                  <div 
                    key={i}
                    className="heatmap-cell"
                    style={{
                      '--correlation': Math.random(),
                      backgroundColor: `hsl(${200 + Math.random() * 60}, 70%, ${50 + Math.random() * 30}%)`
                    }}
                  />
                ))}
              </div>
            </div>
          </MobileChartWrapper>

          <div className="risk-summary">
            <h4>Risk Insights</h4>
            <ul className="insight-list">
              <li>📊 Moderate portfolio diversification</li>
              <li>⚖️ Balanced risk-return profile</li>
              <li>🔄 Low correlation between assets</li>
              <li>📈 Suitable for medium-term goals</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Performance Tracking",
      description: "Monitor investment performance over time",
      component: (
        <div className="demo-step">
          <MobileChartWrapper
            title="Performance Chart"
            subtitle="12-month trend analysis"
            onExport={handleExportChart}
            onReset={handleResetChart}
            error={chartError}
          >
            <div className="performance-chart">
              <div className="chart-line">
                {Array.from({ length: 12 }, (_, i) => (
                  <div 
                    key={i}
                    className="data-point"
                    style={{
                      '--height': `${30 + Math.random() * 40}%`,
                      '--month': i + 1
                    }}
                  />
                ))}
              </div>
            </div>
          </MobileChartWrapper>

          <div className="performance-stats">
            <div className="stat-row">
              <span>YTD Return:</span>
              <strong className="positive">+8.7%</strong>
            </div>
            <div className="stat-row">
              <span>Best Month:</span>
              <strong className="positive">+4.2%</strong>
            </div>
            <div className="stat-row">
              <span>Worst Month:</span>
              <strong className="negative">-2.1%</strong>
            </div>
            <div className="stat-row">
              <span>Avg Monthly:</span>
              <strong>+0.7%</strong>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Optimization",
      description: "Optimize portfolio for better risk-adjusted returns",
      component: (
        <div className="demo-step">
          <MobileChartWrapper
            title="Efficient Frontier"
            subtitle="Risk vs. return optimization"
            onExport={handleExportChart}
            onReset={handleResetChart}
          >
            <div className="frontier-chart">
              <div className="frontier-curve">
                {Array.from({ length: 20 }, (_, i) => (
                  <div 
                    key={i}
                    className="frontier-point"
                    style={{
                      '--x': `${10 + i * 4}%`,
                      '--y': `${90 - i * 3 - Math.random() * 10}%`
                    }}
                  />
                ))}
              </div>
              <div className="current-portfolio">
                <div className="portfolio-marker">Your Portfolio</div>
              </div>
            </div>
          </MobileChartWrapper>

          <div className="optimization-suggestions">
            <h4>💡 Optimization Suggestions</h4>
            <div className="suggestion-cards">
              <div className="suggestion-card">
                <div className="suggestion-icon">📈</div>
                <div className="suggestion-text">
                  <strong>Increase Equity</strong>
                  <span>Add 5% more stocks for higher returns</span>
                </div>
              </div>
              <div className="suggestion-card">
                <div className="suggestion-icon">🛡️</div>
                <div className="suggestion-text">
                  <strong>Add Bonds</strong>
                  <span>Reduce volatility with fixed income</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Generate sidebar content
  const sidebarContent = (
    <div className="demo-sidebar">
      <div className="sidebar-header">
        <h3>📱 Mobile Demo</h3>
        <p>Professional financial analysis on mobile devices</p>
      </div>
      
      <div className="step-list">
        {demoSteps.map((step) => (
          <button
            key={step.id}
            className={`step-item ${step.id === currentStep ? 'active' : ''} ${step.id < currentStep ? 'completed' : ''}`}
            onClick={() => setCurrentStep(step.id)}
          >
            <div className="step-number">
              {step.id < currentStep ? '✓' : step.id}
            </div>
            <div className="step-info">
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="demo-features">
        <h4>🌟 Mobile Features</h4>
        <ul>
          <li>✅ Collapsible sidebar</li>
          <li>✅ Touch-friendly buttons</li>
          <li>✅ Swipe navigation</li>
          <li>✅ Minimal chart interactions</li>
          <li>✅ Responsive design</li>
          <li>✅ Accessibility support</li>
        </ul>
      </div>
    </div>
  );

  const currentStepData = demoSteps.find(step => step.id === currentStep);

  return (
    <div className="mobile-layout-demo">
      <MobileLayout
        currentStep={currentStep}
        totalSteps={demoSteps.length}
        onStepChange={setCurrentStep}
        sidebarContent={sidebarContent}
        headerContent={
          <div className="header-actions">
            <button className="demo-action-btn">
              📱 Demo Mode
            </button>
          </div>
        }
      >
        <div className="step-content">
          <div className="step-header">
            <h2 className="step-title">{currentStepData?.title}</h2>
            <p className="step-description">{currentStepData?.description}</p>
          </div>
          
          <div className="step-body">
            {currentStepData?.component}
          </div>
        </div>
      </MobileLayout>
    </div>
  );
};

export default MobileLayoutDemo; 

