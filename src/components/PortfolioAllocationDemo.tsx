import React, { useState, useMemo } from 'react';
import PortfolioAllocation from './PortfolioAllocation';
import './PortfolioAllocationDemo.css';

interface AssetAllocation {
  symbol: string;
  name: string;
  weight: number;
  value: number;
  sector?: string;
}

interface PortfolioData {
  assets: AssetAllocation[];
  totalValue: number;
  portfolioName: string;
  lastUpdated: string;
}

const PortfolioAllocationDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  // Sample portfolio data
  const samplePortfolios = useMemo((): PortfolioData[] => {
    const conservative: PortfolioData = {
      portfolioName: 'Conservative Portfolio',
      totalValue: 100000,
      lastUpdated: new Date().toISOString(),
      assets: [
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 0.4, value: 40000, sector: 'Fixed Income' },
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 0.25, value: 25000, sector: 'Equity' },
        { symbol: 'VTIAX', name: 'Vanguard Total International Stock Index', weight: 0.15, value: 15000, sector: 'International' },
        { symbol: 'VTEB', name: 'Vanguard Tax-Exempt Bond ETF', weight: 0.1, value: 10000, sector: 'Municipal Bonds' },
        { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', weight: 0.05, value: 5000, sector: 'REIT' },
        { symbol: 'IAU', name: 'iShares Gold Trust', weight: 0.05, value: 5000, sector: 'Commodities' }
      ]
    };

    const balanced: PortfolioData = {
      portfolioName: 'Balanced Growth Portfolio',
      totalValue: 250000,
      lastUpdated: new Date().toISOString(),
      assets: [
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 0.35, value: 87500, sector: 'Equity' },
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 0.25, value: 62500, sector: 'Fixed Income' },
        { symbol: 'VTIAX', name: 'Vanguard Total International Stock Index', weight: 0.2, value: 50000, sector: 'International' },
        { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', weight: 0.08, value: 20000, sector: 'REIT' },
        { symbol: 'VWO', name: 'Vanguard Emerging Markets ETF', weight: 0.07, value: 17500, sector: 'Emerging Markets' },
        { symbol: 'IAU', name: 'iShares Gold Trust', weight: 0.05, value: 12500, sector: 'Commodities' }
      ]
    };

    const aggressive: PortfolioData = {
      portfolioName: 'Aggressive Growth Portfolio',
      totalValue: 500000,
      lastUpdated: new Date().toISOString(),
      assets: [
        { symbol: 'QQQ', name: 'Invesco QQQ Trust ETF', weight: 0.3, value: 150000, sector: 'Technology' },
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 0.25, value: 125000, sector: 'Equity' },
        { symbol: 'VTIAX', name: 'Vanguard Total International Stock Index', weight: 0.2, value: 100000, sector: 'International' },
        { symbol: 'VWO', name: 'Vanguard Emerging Markets ETF', weight: 0.15, value: 75000, sector: 'Emerging Markets' },
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 0.05, value: 25000, sector: 'Fixed Income' },
        { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', weight: 0.05, value: 25000, sector: 'REIT' }
      ]
    };

    switch (selectedScenario) {
      case 'conservative':
        return [conservative];
      case 'balanced':
        return [balanced];
      case 'aggressive':
        return [aggressive];
      default:
        return [conservative, balanced, aggressive];
    }
  }, [selectedScenario]);

  return (
    <div className="portfolio-allocation-demo">
      <div className="demo-header">
        <h2>📊 Portfolio Allocation Visualization Demo</h2>
        <p>
          Explore different portfolio allocation strategies with interactive pie charts and detailed breakdowns.
          This tool helps visualize how your investments are distributed across different assets and sectors.
        </p>
      </div>

      <div className="demo-controls">
        <div className="scenario-selector">
          <h4>📈 Portfolio Strategy</h4>
          <div className="scenario-buttons">
            <button
              className={selectedScenario === 'conservative' ? 'active' : ''}
              onClick={() => setSelectedScenario('conservative')}
            >
              🛡️ Conservative
            </button>
            <button
              className={selectedScenario === 'balanced' ? 'active' : ''}
              onClick={() => setSelectedScenario('balanced')}
            >
              ⚖️ Balanced
            </button>
            <button
              className={selectedScenario === 'aggressive' ? 'active' : ''}
              onClick={() => setSelectedScenario('aggressive')}
            >
              🚀 Aggressive
            </button>
          </div>
        </div>

        <div className="strategy-description">
          {selectedScenario === 'conservative' && (
            <div className="strategy-info">
              <h5>🛡️ Conservative Strategy</h5>
              <p>Focus on capital preservation with 40% bonds, lower risk tolerance, and stable income generation.</p>
              <ul>
                <li>Low volatility and risk</li>
                <li>Steady income from bonds</li>
                <li>Limited growth potential</li>
              </ul>
            </div>
          )}
          
          {selectedScenario === 'balanced' && (
            <div className="strategy-info">
              <h5>⚖️ Balanced Strategy</h5>
              <p>Balanced approach with 60% stocks and 40% bonds/alternatives for moderate growth and income.</p>
              <ul>
                <li>Moderate risk and return</li>
                <li>Diversified across asset classes</li>
                <li>Good for long-term growth</li>
              </ul>
            </div>
          )}
          
          {selectedScenario === 'aggressive' && (
            <div className="strategy-info">
              <h5>🚀 Aggressive Strategy</h5>
              <p>Growth-focused with 90% stocks, higher risk tolerance, and maximum growth potential.</p>
              <ul>
                <li>High growth potential</li>
                <li>Higher volatility and risk</li>
                <li>Technology and emerging markets focus</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="demo-features">
        <h4>✨ Interactive Features</h4>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">🥧</span>
            <div className="feature-content">
              <h5>Pie & Doughnut Charts</h5>
              <p>Switch between pie and doughnut chart styles for different visualization preferences.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <div className="feature-content">
              <h5>Interactive Tooltips</h5>
              <p>Hover over chart segments or legend items to see detailed asset information.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📸</span>
            <div className="feature-content">
              <h5>Export Charts</h5>
              <p>Export your portfolio allocation charts as PNG or SVG files for reports.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <div className="feature-content">
              <h5>Portfolio Statistics</h5>
              <p>View key metrics like concentration, largest positions, and total values.</p>
            </div>
          </div>
        </div>
      </div>

      <PortfolioAllocation 
        portfolios={samplePortfolios}
        className="demo-allocation"
      />

      <div className="demo-explanation">
        <h4>💡 Understanding Portfolio Allocation</h4>
        <div className="explanation-content">
          <div className="explanation-section">
            <h5>🎯 Why Asset Allocation Matters</h5>
            <p>
              Asset allocation is one of the most important decisions in investing. It determines how your 
              portfolio will perform across different market conditions and helps manage risk while pursuing returns.
            </p>
          </div>
          
          <div className="explanation-section">
            <h5>📈 Reading the Charts</h5>
            <ul>
              <li><strong>Slice Size:</strong> Represents the percentage weight of each asset</li>
              <li><strong>Colors:</strong> Different colors help distinguish between assets</li>
              <li><strong>Hover Effects:</strong> Interactive tooltips show exact values and percentages</li>
              <li><strong>Legend:</strong> Lists all assets with their symbols and allocations</li>
            </ul>
          </div>
          
          <div className="explanation-section">
            <h5>⚖️ Risk vs Return Trade-offs</h5>
            <p>
              Conservative portfolios prioritize capital preservation, balanced portfolios seek moderate 
              growth with manageable risk, while aggressive portfolios pursue maximum growth with higher volatility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioAllocationDemo; 

