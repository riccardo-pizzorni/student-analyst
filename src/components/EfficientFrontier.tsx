/**
 * STUDENT ANALYST - Efficient Frontier Component
 * Professional visualization of risk-return optimization with interactive features
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import './EfficientFrontier.css';

// Types and Interfaces
interface PortfolioPoint {
  id: string;
  risk: number;
  return: number;
  weights: number[];
  sharpeRatio: number;
  volatility: number;
  expectedReturn: number;
  isOptimal?: boolean;
  isCurrent?: boolean;
  label?: string;
}

interface AssetData {
  symbol: string;
  name: string;
  expectedReturn: number;
  volatility: number;
  sector?: string;
}

interface EfficientFrontierData {
  portfolios: PortfolioPoint[];
  assets: AssetData[];
  correlationMatrix: number[][];
  frontierCurve: PortfolioPoint[];
  tangencyPortfolio: PortfolioPoint;
  minVariancePortfolio: PortfolioPoint;
  maxSharpePortfolio: PortfolioPoint;
  metadata: {
    calculationTime: number;
    portfolioCount: number;
    riskFreeRate: number;
    convergenceAchieved: boolean;
  };
}

interface EfficientFrontierProps {
  assets: AssetData[];
  correlationMatrix?: number[][];
  currentPortfolio?: number[];
  riskFreeRate?: number;
  constraints?: {
    minWeight?: number;
    maxWeight?: number;
    maxAssets?: number;
  };
  onPortfolioSelect?: (portfolio: PortfolioPoint) => void;
  onOptimalRegionFocus?: (region: { minRisk: number; maxRisk: number; minReturn: number; maxReturn: number }) => void;
  className?: string;
}

const EfficientFrontier: React.FC<EfficientFrontierProps> = ({
  assets,
  correlationMatrix,
  currentPortfolio,
  riskFreeRate = 0.02,
  constraints = {},
  onPortfolioSelect,
  onOptimalRegionFocus,
  className = ''
}) => {
  // State Management
  const [frontierData, setFrontierData] = useState<EfficientFrontierData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioPoint | null>(null);
  const [hoveredPortfolio, setHoveredPortfolio] = useState<PortfolioPoint | null>(null);
  const [showOptimalRegion, setShowOptimalRegion] = useState(true);
  const [viewMode, setViewMode] = useState<'full' | 'optimal' | 'zoom'>('full');

  // Refs and Constants
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const CHART_WIDTH = 800;
  const CHART_HEIGHT = 600;
  const MARGIN = { top: 40, right: 40, bottom: 60, left: 80 };
  const PLOT_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const PLOT_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  // Validation
  const validateInputs = useCallback((): boolean => {
    if (!assets || assets.length < 2) {
      setError('At least 2 assets are required for efficient frontier calculation');
      return false;
    }

    if (assets.length > 100) {
      setError('Maximum 100 assets supported for performance optimization');
      return false;
    }

    for (const asset of assets) {
      if (typeof asset.expectedReturn !== 'number' || typeof asset.volatility !== 'number') {
        setError('All assets must have valid expected return and volatility values');
        return false;
      }
      if (asset.volatility <= 0) {
        setError('Asset volatility must be positive');
        return false;
      }
    }

    setError(null);
    return true;
  }, [assets]);

  // Portfolio Calculations
  const calculatePortfolioMetrics = useCallback((weights: number[], corrMatrix: number[][]): {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  } => {
    const n = weights.length;
    
    // Expected Return
    const expectedReturn = weights.reduce((sum, weight, i) => sum + weight * assets[i].expectedReturn, 0);
    
    // Portfolio Variance
    let variance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        variance += weights[i] * weights[j] * assets[i].volatility * assets[j].volatility * corrMatrix[i][j];
      }
    }
    
    const volatility = Math.sqrt(Math.max(0, variance));
    const sharpeRatio = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;
    
    return { expectedReturn, volatility, sharpeRatio };
  }, [assets, riskFreeRate]);

  // Generate correlation matrix if not provided
  const generateCorrelationMatrix = useCallback((assetCount: number): number[][] => {
    if (correlationMatrix) return correlationMatrix;

    const matrix: number[][] = [];
    for (let i = 0; i < assetCount; i++) {
      matrix[i] = [];
      for (let j = 0; j < assetCount; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          const sameSector = assets[i].sector === assets[j].sector;
          const baseCorrelation = sameSector ? 0.3 : 0.1;
          const randomFactor = (Math.random() - 0.5) * 0.4;
          matrix[i][j] = Math.max(-0.8, Math.min(0.8, baseCorrelation + randomFactor));
          matrix[j][i] = matrix[i][j];
        }
      }
    }
    return matrix;
  }, [assets, correlationMatrix]);

  // Optimization algorithm
  const optimizePortfolio = useCallback((targetReturn: number, corrMatrix: number[][]): number[] | null => {
    const n = assets.length;
    const maxIterations = 1000;
    const tolerance = 1e-6;
    
    let weights = new Array(n).fill(1 / n);
    
    for (let iter = 0; iter < maxIterations; iter++) {
      const { volatility } = calculatePortfolioMetrics(weights, corrMatrix);
      
      const gradients = new Array(n).fill(0);
      const h = 1e-8;
      
      for (let i = 0; i < n; i++) {
        const weightsPlus = [...weights];
        weightsPlus[i] += h;
        const { volatility: volPlus } = calculatePortfolioMetrics(weightsPlus, corrMatrix);
        gradients[i] = (volPlus - volatility) / h;
      }
      
      const learningRate = 0.01;
      let newWeights = weights.map((w, i) => w - learningRate * gradients[i]);
      
      const sum = newWeights.reduce((s, w) => s + Math.max(0, w), 0);
      if (sum > 0) {
        newWeights = newWeights.map(w => Math.max(0, w) / sum);
      }
      
      const { minWeight = 0, maxWeight = 1 } = constraints;
      newWeights = newWeights.map(w => Math.max(minWeight, Math.min(maxWeight, w)));
      
      const constrainedSum = newWeights.reduce((s, w) => s + w, 0);
      if (constrainedSum > 0) {
        newWeights = newWeights.map(w => w / constrainedSum);
      }
      
      const weightChange = weights.reduce((sum, w, i) => sum + Math.abs(w - newWeights[i]), 0);
      weights = newWeights;
      
      if (weightChange < tolerance) break;
    }
    
    return weights;
  }, [assets, constraints, calculatePortfolioMetrics]);

  // Generate efficient frontier
  const generateEfficientFrontier = useCallback(async (): Promise<EfficientFrontierData> => {
    const startTime = performance.now();
    const n = assets.length;
    const corrMatrix = generateCorrelationMatrix(n);
    
    const minReturn = Math.min(...assets.map(a => a.expectedReturn));
    const maxReturn = Math.max(...assets.map(a => a.expectedReturn));
    const returnRange = maxReturn - minReturn;
    const numPoints = Math.min(50, n * 2);
    
    const frontierCurve: PortfolioPoint[] = [];
    const allPortfolios: PortfolioPoint[] = [];
    
    for (let i = 0; i < numPoints; i++) {
      const targetReturn = minReturn + (returnRange * i) / (numPoints - 1);
      const weights = optimizePortfolio(targetReturn, corrMatrix);
      
      if (weights) {
        const metrics = calculatePortfolioMetrics(weights, corrMatrix);
        const portfolio: PortfolioPoint = {
          id: `ef_${i}`,
          risk: metrics.volatility,
          return: metrics.expectedReturn,
          weights,
          sharpeRatio: metrics.sharpeRatio,
          volatility: metrics.volatility,
          expectedReturn: metrics.expectedReturn
        };
        
        frontierCurve.push(portfolio);
        allPortfolios.push(portfolio);
      }
    }
    
    const maxSharpePortfolio = frontierCurve.reduce((best, current) => 
      current.sharpeRatio > best.sharpeRatio ? current : best
    );
    
    const minVariancePortfolio = frontierCurve.reduce((best, current) => 
      current.volatility < best.volatility ? current : best
    );
    
    const tangencyPortfolio = { ...maxSharpePortfolio, isOptimal: true };
    
    if (currentPortfolio && currentPortfolio.length === n) {
      const currentMetrics = calculatePortfolioMetrics(currentPortfolio, corrMatrix);
      const currentPoint: PortfolioPoint = {
        id: 'current',
        risk: currentMetrics.volatility,
        return: currentMetrics.expectedReturn,
        weights: currentPortfolio,
        sharpeRatio: currentMetrics.sharpeRatio,
        volatility: currentMetrics.volatility,
        expectedReturn: currentMetrics.expectedReturn,
        isCurrent: true,
        label: 'Current Portfolio'
      };
      allPortfolios.push(currentPoint);
    }
    
    assets.forEach((asset, i) => {
      const weights = new Array(n).fill(0);
      weights[i] = 1;
      const assetPoint: PortfolioPoint = {
        id: `asset_${i}`,
        risk: asset.volatility,
        return: asset.expectedReturn,
        weights,
        sharpeRatio: (asset.expectedReturn - riskFreeRate) / asset.volatility,
        volatility: asset.volatility,
        expectedReturn: asset.expectedReturn,
        label: asset.symbol
      };
      allPortfolios.push(assetPoint);
    });
    
    const calculationTime = performance.now() - startTime;
    
    return {
      portfolios: allPortfolios,
      assets,
      correlationMatrix: corrMatrix,
      frontierCurve: frontierCurve.sort((a, b) => a.volatility - b.volatility),
      tangencyPortfolio,
      minVariancePortfolio,
      maxSharpePortfolio,
      metadata: {
        calculationTime,
        portfolioCount: allPortfolios.length,
        riskFreeRate,
        convergenceAchieved: true
      }
    };
  }, [assets, generateCorrelationMatrix, optimizePortfolio, calculatePortfolioMetrics, currentPortfolio, riskFreeRate]);

  // Chart scaling
  const getScales = useMemo(() => {
    if (!frontierData) return null;
    
    const allRisks = frontierData.portfolios.map(p => p.risk);
    const allReturns = frontierData.portfolios.map(p => p.return);
    
    const minRisk = Math.min(...allRisks);
    const maxRisk = Math.max(...allRisks);
    const minReturn = Math.min(...allReturns);
    const maxReturn = Math.max(...allReturns);
    
    const riskPadding = (maxRisk - minRisk) * 0.1;
    const returnPadding = (maxReturn - minReturn) * 0.1;
    
    return {
      xScale: (risk: number) => ((risk - minRisk + riskPadding) / (maxRisk - minRisk + 2 * riskPadding)) * PLOT_WIDTH,
      yScale: (ret: number) => PLOT_HEIGHT - ((ret - minReturn + returnPadding) / (maxReturn - minReturn + 2 * returnPadding)) * PLOT_HEIGHT,
      xMin: minRisk - riskPadding,
      xMax: maxRisk + riskPadding,
      yMin: minReturn - returnPadding,
      yMax: maxReturn + returnPadding
    };
  }, [frontierData]);

  // Event handlers
  const handlePortfolioClick = useCallback((portfolio: PortfolioPoint) => {
    setSelectedPortfolio(portfolio);
    onPortfolioSelect?.(portfolio);
  }, [onPortfolioSelect]);

  const handlePortfolioHover = useCallback((portfolio: PortfolioPoint | null) => {
    setHoveredPortfolio(portfolio);
  }, []);

  const handleZoomToOptimal = useCallback(() => {
    if (!frontierData || !getScales) return;
    
    const optimalPortfolios = frontierData.frontierCurve.slice(
      Math.floor(frontierData.frontierCurve.length * 0.3),
      Math.floor(frontierData.frontierCurve.length * 0.8)
    );
    
    const risks = optimalPortfolios.map(p => p.risk);
    const returns = optimalPortfolios.map(p => p.return);
    
    const region = {
      minRisk: Math.min(...risks),
      maxRisk: Math.max(...risks),
      minReturn: Math.min(...returns),
      maxReturn: Math.max(...returns)
    };
    
    setViewMode('optimal');
    onOptimalRegionFocus?.(region);
  }, [frontierData, getScales, onOptimalRegionFocus]);

  // Data loading
  useEffect(() => {
    const loadData = async () => {
      if (!validateInputs()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await generateEfficientFrontier();
        setFrontierData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to calculate efficient frontier';
        setError(errorMessage);
        console.error('Efficient Frontier calculation error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [validateInputs, generateEfficientFrontier]);

  // Export functions
  const exportData = useCallback((format: 'csv' | 'json') => {
    if (!frontierData) return;
    
    if (format === 'csv') {
      const csvContent = [
        'Risk,Return,Sharpe_Ratio,Type',
        ...frontierData.frontierCurve.map(p => 
          `${p.risk.toFixed(4)},${p.return.toFixed(4)},${p.sharpeRatio.toFixed(4)},Frontier`
        ),
        `${frontierData.tangencyPortfolio.risk.toFixed(4)},${frontierData.tangencyPortfolio.return.toFixed(4)},${frontierData.tangencyPortfolio.sharpeRatio.toFixed(4)},Tangency`
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'efficient_frontier.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [frontierData]);

  // Render states
  if (loading) {
    return (
      <div className={`efficient-frontier ${className}`} ref={containerRef}>
        <div className="efficient-frontier-header">
          <h3>📈 Efficient Frontier Analysis</h3>
          <p>Finding optimal risk-return combinations for your portfolio</p>
        </div>
        <div className="loading-panel">
          <div className="loading-spinner">⏳</div>
          <p>Calculating efficient frontier...</p>
          <div className="loading-progress">
            <div className="progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`efficient-frontier ${className}`} ref={containerRef}>
        <div className="efficient-frontier-header">
          <h3>📈 Efficient Frontier Analysis</h3>
          <p>Finding optimal risk-return combinations for your portfolio</p>
        </div>
        <div className="error-panel">
          <h4>⚠️ Calculation Error</h4>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry Analysis</button>
        </div>
      </div>
    );
  }

  if (!frontierData || !getScales) return null;

  return (
    <div className={`efficient-frontier ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="efficient-frontier-header">
        <h3>📈 Efficient Frontier Analysis</h3>
        <p>Interactive visualization of optimal risk-return combinations</p>
      </div>

      {/* Controls */}
      <div className="frontier-controls">
        <div className="control-group">
          <label htmlFor="view-mode-select">View Mode:</label>
          <select 
            id="view-mode-select"
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as any)}
          >
            <option value="full">Full View</option>
            <option value="optimal">Optimal Region</option>
            <option value="zoom">Custom Zoom</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>
            <input 
              type="checkbox" 
              checked={showOptimalRegion}
              onChange={(e) => setShowOptimalRegion(e.target.checked)}
            />
            Highlight Optimal Region
          </label>
        </div>

        <div className="export-controls">
          <button onClick={() => exportData('csv')}>📄 Export CSV</button>
          <button onClick={handleZoomToOptimal}>🎯 Zoom to Optimal</button>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <svg
          ref={svgRef}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        >
          {/* Chart Background */}
          <rect 
            x={MARGIN.left} 
            y={MARGIN.top} 
            width={PLOT_WIDTH} 
            height={PLOT_HEIGHT}
            fill="#f8fafc" 
            stroke="#e2e8f0"
          />
          
          {/* Grid Lines */}
          <g className="grid-lines">
            {Array.from({ length: 5 }, (_, i) => {
              const x = MARGIN.left + (PLOT_WIDTH * (i + 1)) / 6;
              const y = MARGIN.top + (PLOT_HEIGHT * (i + 1)) / 6;
              return (
                <g key={i}>
                  <line x1={x} y1={MARGIN.top} x2={x} y2={MARGIN.top + PLOT_HEIGHT} stroke="#e2e8f0" strokeDasharray="2,2" />
                  <line x1={MARGIN.left} y1={y} x2={MARGIN.left + PLOT_WIDTH} y2={y} stroke="#e2e8f0" strokeDasharray="2,2" />
                </g>
              );
            })}
          </g>

          {/* Efficient Frontier Curve */}
          <path
            d={`M ${frontierData.frontierCurve.map(p => 
              `${MARGIN.left + getScales.xScale(p.risk)},${MARGIN.top + getScales.yScale(p.return)}`
            ).join(' L ')}`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            className="frontier-curve"
          />

          {/* Optimal Region */}
          {showOptimalRegion && (
            <rect
              x={MARGIN.left + getScales.xScale(frontierData.minVariancePortfolio.risk)}
              y={MARGIN.top + getScales.yScale(frontierData.maxSharpePortfolio.return)}
              width={getScales.xScale(frontierData.maxSharpePortfolio.risk) - getScales.xScale(frontierData.minVariancePortfolio.risk)}
              height={getScales.yScale(frontierData.minVariancePortfolio.return) - getScales.yScale(frontierData.maxSharpePortfolio.return)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgba(59, 130, 246, 0.3)"
              strokeDasharray="5,5"
              className="optimal-region"
            />
          )}

          {/* Portfolio Points */}
          {frontierData.portfolios.map((portfolio) => (
            <circle
              key={portfolio.id}
              cx={MARGIN.left + getScales.xScale(portfolio.risk)}
              cy={MARGIN.top + getScales.yScale(portfolio.return)}
              r={portfolio.isOptimal ? 8 : portfolio.isCurrent ? 6 : 4}
              fill={
                portfolio.isOptimal ? '#10b981' :
                portfolio.isCurrent ? '#f59e0b' :
                portfolio.id.startsWith('asset_') ? '#6b7280' : '#3b82f6'
              }
              stroke={selectedPortfolio?.id === portfolio.id ? '#1f2937' : 'white'}
              strokeWidth={selectedPortfolio?.id === portfolio.id ? 3 : 1}
              className={`portfolio-point ${portfolio.isOptimal ? 'optimal' : ''} ${portfolio.isCurrent ? 'current' : ''}`}
              onClick={() => handlePortfolioClick(portfolio)}
              onMouseEnter={() => handlePortfolioHover(portfolio)}
              onMouseLeave={() => handlePortfolioHover(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}

          {/* Axes */}
          <g className="axes">
            <line x1={MARGIN.left} y1={MARGIN.top + PLOT_HEIGHT} x2={MARGIN.left + PLOT_WIDTH} y2={MARGIN.top + PLOT_HEIGHT} stroke="#374151" strokeWidth="2" />
            <text x={MARGIN.left + PLOT_WIDTH / 2} y={CHART_HEIGHT - 20} textAnchor="middle" className="axis-label">Risk (Volatility)</text>
            
            <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + PLOT_HEIGHT} stroke="#374151" strokeWidth="2" />
            <text x={20} y={MARGIN.top + PLOT_HEIGHT / 2} textAnchor="middle" className="axis-label" transform={`rotate(-90, 20, ${MARGIN.top + PLOT_HEIGHT / 2})`}>Expected Return</text>
          </g>

          {/* Legend */}
          <g className="legend" transform={`translate(${CHART_WIDTH - 180}, ${MARGIN.top + 20})`}>
            <rect x="-10" y="-10" width="170" height="120" fill="white" stroke="#e2e8f0" rx="4" />
            <circle cx="10" cy="10" r="4" fill="#3b82f6" />
            <text x="20" y="15" className="legend-text">Frontier Portfolio</text>
            <circle cx="10" cy="30" r="6" fill="#10b981" />
            <text x="20" y="35" className="legend-text">Optimal Portfolio</text>
            <circle cx="10" cy="50" r="4" fill="#f59e0b" />
            <text x="20" y="55" className="legend-text">Current Portfolio</text>
            <circle cx="10" cy="70" r="4" fill="#6b7280" />
            <text x="20" y="75" className="legend-text">Individual Asset</text>
            <line x1="5" y1="90" x2="15" y2="90" stroke="#3b82f6" strokeWidth="3" />
            <text x="20" y="95" className="legend-text">Efficient Frontier</text>
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredPortfolio && (
          <div
            className="frontier-tooltip"
            style={{
              position: 'absolute',
              left: `${getScales.xScale(hoveredPortfolio.risk) + MARGIN.left + 10}px`,
              top: `${getScales.yScale(hoveredPortfolio.return) + MARGIN.top - 10}px`,
              pointerEvents: 'none'
            }}
          >
            <div className="tooltip-content">
              <div className="portfolio-label">{hoveredPortfolio.label || `Portfolio ${hoveredPortfolio.id}`}</div>
              <div className="portfolio-metrics">
                Risk: <strong>{(hoveredPortfolio.risk * 100).toFixed(2)}%</strong> | 
                Return: <strong>{(hoveredPortfolio.return * 100).toFixed(2)}%</strong>
              </div>
              <div className="portfolio-metrics">
                Sharpe: <strong>{hoveredPortfolio.sharpeRatio.toFixed(3)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Panel */}
      <div className="statistics-panel">
        <h4>📊 Portfolio Analysis</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Portfolios:</span>
            <span className="stat-value">{frontierData.metadata.portfolioCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Calc Time:</span>
            <span className="stat-value">{Math.round(frontierData.metadata.calculationTime)}ms</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max Sharpe:</span>
            <span className="stat-value">{frontierData.maxSharpePortfolio.sharpeRatio.toFixed(3)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Min Risk:</span>
            <span className="stat-value">{(frontierData.minVariancePortfolio.volatility * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Selected Portfolio Details */}
      {selectedPortfolio && (
        <div className="selected-portfolio-panel">
          <h4>🎯 Selected Portfolio</h4>
          <div className="portfolio-details">
            <div className="detail-row">
              <span>Return:</span>
              <span>{(selectedPortfolio.expectedReturn * 100).toFixed(2)}%</span>
            </div>
            <div className="detail-row">
              <span>Risk:</span>
              <span>{(selectedPortfolio.volatility * 100).toFixed(2)}%</span>
            </div>
            <div className="detail-row">
              <span>Sharpe:</span>
              <span>{selectedPortfolio.sharpeRatio.toFixed(3)}</span>
            </div>
          </div>
          
          <div className="weight-allocation">
            <h5>Top Allocations:</h5>
            <div className="allocation-grid">
              {selectedPortfolio.weights
                .map((weight, i) => ({ weight, symbol: assets[i].symbol, index: i }))
                .filter(item => item.weight > 0.001)
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 5)
                .map((item) => (
                  <div key={item.index} className="allocation-item">
                    <span className="asset-symbol">{item.symbol}</span>
                    <span className="asset-weight">{(item.weight * 100).toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EfficientFrontier; 

