/**
 * STUDENT ANALYST - Correlation Heatmap Demo
 * Test component for correlation matrix visualization
 */

import React, { useState, useMemo } from 'react';
import CorrelationHeatmap from './CorrelationHeatmap';
import './CorrelationHeatmapDemo.css';

interface DemoAsset {
  symbol: string;
  name: string;
  returns: number[];
  sector?: string;
  category?: string;
}

const CorrelationHeatmapDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<'balanced' | 'tech-heavy' | 'diverse' | 'volatile'>('balanced');
  const [numberOfAssets, setNumberOfAssets] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showClustering, setShowClustering] = useState<boolean>(true);
  const [colorScheme, setColorScheme] = useState<'default' | 'red-green' | 'blue-red'>('default');

  // Generate realistic financial returns data
  const generateReturns = (length: number, volatility: number = 0.02, trend: number = 0.0001): number[] => {
    const returns: number[] = [];
    for (let i = 0; i < length; i++) {
      const randomComponent = (Math.random() - 0.5) * volatility;
      const trendComponent = trend * Math.sin(i * 0.1);
      const marketShock = i % 60 === 0 ? (Math.random() - 0.5) * 0.05 : 0; // Occasional market shock
      returns.push(randomComponent + trendComponent + marketShock);
    }
    return returns;
  };

  // Create sample asset data based on scenario
  const sampleAssets: DemoAsset[] = useMemo(() => {
    const baseAssets = [
      // Technology Sector
      { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology' },
      { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Technology' },
      
      // Financial Sector
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
      { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Financials' },
      { symbol: 'WFC', name: 'Wells Fargo & Co.', sector: 'Financials' },
      
      // Healthcare Sector
      { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
      { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
      { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare' },
      
      // Energy Sector
      { symbol: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energy' },
      { symbol: 'CVX', name: 'Chevron Corp.', sector: 'Energy' },
      
      // Consumer Goods
      { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Goods' },
      { symbol: 'KO', name: 'The Coca-Cola Co.', sector: 'Consumer Goods' },
      
      // Industrials
      { symbol: 'BA', name: 'The Boeing Co.', sector: 'Industrials' },
      { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials' },
      
      // Real Estate
      { symbol: 'AMT', name: 'American Tower Corp.', sector: 'Real Estate' },
      
      // Utilities
      { symbol: 'NEE', name: 'NextEra Energy Inc.', sector: 'Utilities' },
      
      // Materials
      { symbol: 'LIN', name: 'Linde plc', sector: 'Materials' }
    ];

    const selectedAssets = baseAssets.slice(0, numberOfAssets);
    const dataLength = 252; // One year of daily data

    return selectedAssets.map((asset, index) => {
      let volatility = 0.02;
      let trend = 0.0001;
      let correlation = 0;

      // Adjust parameters based on scenario
      switch (selectedScenario) {
        case 'tech-heavy':
          if (asset.sector === 'Technology') {
            volatility = 0.035; // Higher volatility for tech
            correlation = 0.7; // High correlation among tech stocks
          }
          break;
        case 'volatile':
          volatility = 0.04; // Higher volatility overall
          if (index % 2 === 0) {
            trend = -0.0005; // Some negative trends
          }
          break;
        case 'diverse':
          volatility = asset.sector === 'Energy' ? 0.04 : 0.02;
          break;
        case 'balanced':
        default:
          // Default parameters
          break;
      }

      // Generate correlated returns for same-sector assets
      let baseReturns = generateReturns(dataLength, volatility, trend);
      
      if (correlation > 0 && index > 0) {
        const previousAsset = selectedAssets[index - 1];
        if (previousAsset.sector === asset.sector) {
          // Add correlation with previous asset in same sector
          const correlatedComponent = baseReturns.map(r => r * correlation);
          baseReturns = baseReturns.map((r, i) => r + correlatedComponent[i] * 0.3);
        }
      }

      return {
        ...asset,
        returns: baseReturns
      };
    });
  }, [selectedScenario, numberOfAssets]);

  const handleError = (error: string) => {
    setErrorMessage(error);
    console.error('Correlation Heatmap Error:', error);
  };

  return (
    <div className="correlation-heatmap-demo">
      <div className="demo-header">
        <h2>🔗 Correlation Heatmap Testing Suite</h2>
        <p>Interactive testing environment for asset correlation analysis and visualization</p>
      </div>

      {/* Configuration Panel */}
      <div className="demo-configuration">
        <div className="config-section">
          <h3>📊 Test Scenario</h3>
          <div className="config-group">
            <label htmlFor="scenario-select">Market Scenario:</label>
            <select 
              id="scenario-select"
              value={selectedScenario} 
              onChange={(e) => setSelectedScenario(e.target.value as any)}
            >
              <option value="balanced">Balanced Portfolio</option>
              <option value="tech-heavy">Tech-Heavy Portfolio</option>
              <option value="diverse">Highly Diversified</option>
              <option value="volatile">High Volatility Market</option>
            </select>
          </div>

          <div className="config-group">
            <label htmlFor="assets-count">Number of Assets:</label>
            <select 
              id="assets-count"
              value={numberOfAssets} 
              onChange={(e) => setNumberOfAssets(parseInt(e.target.value))}
            >
              <option value={5}>5 Assets</option>
              <option value={10}>10 Assets</option>
              <option value={15}>15 Assets</option>
              <option value={20}>20 Assets</option>
            </select>
          </div>
        </div>

        <div className="config-section">
          <h3>🎨 Visualization Options</h3>
          <div className="config-group">
            <label>
              <input 
                type="checkbox" 
                checked={showClustering} 
                onChange={(e) => setShowClustering(e.target.checked)}
              />
              Enable Asset Clustering
            </label>
          </div>

          <div className="config-group">
            <label htmlFor="color-scheme-select">Color Scheme:</label>
            <select 
              id="color-scheme-select"
              value={colorScheme} 
              onChange={(e) => setColorScheme(e.target.value as any)}
            >
              <option value="default">Default (HSL)</option>
              <option value="red-green">Red-Green Scale</option>
              <option value="blue-red">Blue-Red Scale</option>
            </select>
          </div>
        </div>

        <div className="config-section">
          <h3>📈 Scenario Details</h3>
          <div className="scenario-info">
            {selectedScenario === 'balanced' && (
              <div className="scenario-description">
                <strong>Balanced Portfolio:</strong> Mix of sectors with moderate correlations and volatility.
                Expected average correlation: 0.3-0.5
              </div>
            )}
            {selectedScenario === 'tech-heavy' && (
              <div className="scenario-description">
                <strong>Tech-Heavy Portfolio:</strong> High concentration in technology stocks.
                Expected high correlation (0.6+) among tech assets, higher volatility.
              </div>
            )}
            {selectedScenario === 'diverse' && (
              <div className="scenario-description">
                <strong>Highly Diversified:</strong> Assets from different sectors with low correlations.
                Expected average correlation: 0.1-0.3, good diversification.
              </div>
            )}
            {selectedScenario === 'volatile' && (
              <div className="scenario-description">
                <strong>High Volatility Market:</strong> Increased volatility across all assets.
                Expected mixed correlations, higher risk metrics.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Asset Preview */}
      <div className="assets-preview">
        <h3>📋 Selected Assets ({sampleAssets.length})</h3>
        <div className="assets-grid">
          {sampleAssets.map((asset) => (
            <div key={asset.symbol} className="asset-card">
              <div className="asset-symbol">{asset.symbol}</div>
              <div className="asset-name">{asset.name}</div>
              <div className="asset-sector">{asset.sector}</div>
              <div className="asset-stats">
                <span>📊 {asset.returns.length} days</span>
                <span>📈 {(asset.returns.reduce((a, b) => a + b, 0) * 100).toFixed(2)}% avg</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {errorMessage && (
        <div className="error-message">
          <h4>❌ Analysis Error</h4>
          <p>{errorMessage}</p>
          <button onClick={() => setErrorMessage('')} className="dismiss-btn">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Heatmap Component */}
      <CorrelationHeatmap
        assets={sampleAssets}
        onError={handleError}
        showClustering={showClustering}
        colorScheme={colorScheme}
        className="demo-heatmap"
      />

      {/* Performance Information */}
      <div className="performance-info">
        <h3>⚡ Performance Information</h3>
        <div className="performance-grid">
          <div className="performance-item">
            <span className="performance-label">Assets Analyzed:</span>
            <span className="performance-value">{sampleAssets.length}</span>
          </div>
          <div className="performance-item">
            <span className="performance-label">Data Points per Asset:</span>
            <span className="performance-value">{sampleAssets[0]?.returns.length || 0}</span>
          </div>
          <div className="performance-item">
            <span className="performance-label">Total Calculations:</span>
            <span className="performance-value">{Math.pow(sampleAssets.length, 2)}</span>
          </div>
          <div className="performance-item">
            <span className="performance-label">Clustering:</span>
            <span className="performance-value">{showClustering ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="instructions-panel">
        <h3>💡 How to Use</h3>
        <div className="instructions-list">
          <div className="instruction-item">
            <strong>🎯 Hover over cells:</strong> See detailed correlation values and interpretations
          </div>
          <div className="instruction-item">
            <strong>👆 Click asset labels:</strong> Highlight correlations for specific assets
          </div>
          <div className="instruction-item">
            <strong>📊 Export data:</strong> Download correlation matrix as CSV or PNG image
          </div>
          <div className="instruction-item">
            <strong>🔄 Change sorting:</strong> Organize by clusters, alphabetical order, or original order
          </div>
          <div className="instruction-item">
            <strong>🎨 Color schemes:</strong> Choose between different visualization styles
          </div>
          <div className="instruction-item">
            <strong>📈 Clustering:</strong> View automatic grouping of similar assets by sector
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="technical-specs">
        <h3>⚙️ Technical Specifications</h3>
        <div className="specs-grid">
          <div className="spec-item">
            <span className="spec-label">Max Assets:</span>
            <span className="spec-value">100 (performance optimized)</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Min Data Points:</span>
            <span className="spec-value">30 (statistical reliability)</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Calculation Method:</span>
            <span className="spec-value">Pearson Correlation</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Processing Target:</span>
            <span className="spec-value">&lt;10 seconds for 100 assets</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Export Formats:</span>
            <span className="spec-value">CSV, PNG</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Clustering Algorithm:</span>
            <span className="spec-value">Sector-based grouping</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationHeatmapDemo; 

