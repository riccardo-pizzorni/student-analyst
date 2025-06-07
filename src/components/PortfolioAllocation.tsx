import React, { useState, useMemo, useCallback, useRef } from 'react';
import './PortfolioAllocation.css';

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

interface PortfolioAllocationProps {
  portfolios: PortfolioData[];
  className?: string;
}

const PortfolioAllocation: React.FC<PortfolioAllocationProps> = ({ 
  portfolios, 
  className = '' 
}) => {
  const [selectedPortfolio, setSelectedPortfolio] = useState(0);
  const [hoveredAsset, setHoveredAsset] = useState<AssetAllocation | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'doughnut'>('pie');

  const pieChartRef = useRef<SVGSVGElement>(null);
  const CHART_SIZE = 400;
  const CHART_RADIUS = 150;
  const INNER_RADIUS = chartType === 'doughnut' ? 80 : 0;

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

  const currentPortfolio = portfolios[selectedPortfolio];
  const sortedAssets = currentPortfolio?.assets.sort((a, b) => b.weight - a.weight) || [];

  const pieChartData = useMemo(() => {
    if (!sortedAssets.length) return [];

    let currentAngle = -90;
    
    return sortedAssets.map((asset, index) => {
      const angle = asset.weight * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = CHART_SIZE / 2 + CHART_RADIUS * Math.cos(startRad);
      const y1 = CHART_SIZE / 2 + CHART_RADIUS * Math.sin(startRad);
      const x2 = CHART_SIZE / 2 + CHART_RADIUS * Math.cos(endRad);
      const y2 = CHART_SIZE / 2 + CHART_RADIUS * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      let pathData: string;
      if (INNER_RADIUS > 0) {
        const innerX1 = CHART_SIZE / 2 + INNER_RADIUS * Math.cos(startRad);
        const innerY1 = CHART_SIZE / 2 + INNER_RADIUS * Math.sin(startRad);
        const innerX2 = CHART_SIZE / 2 + INNER_RADIUS * Math.cos(endRad);
        const innerY2 = CHART_SIZE / 2 + INNER_RADIUS * Math.sin(endRad);
        
        pathData = [
          `M ${x1} ${y1}`,
          `A ${CHART_RADIUS} ${CHART_RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`,
          `L ${innerX2} ${innerY2}`,
          `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${innerX1} ${innerY1}`,
          'Z'
        ].join(' ');
      } else {
        pathData = [
          `M ${CHART_SIZE / 2} ${CHART_SIZE / 2}`,
          `L ${x1} ${y1}`,
          `A ${CHART_RADIUS} ${CHART_RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
      }

      currentAngle = endAngle;
      
      return {
        asset,
        pathData,
        color: colors[index % colors.length],
        index
      };
    });
  }, [sortedAssets, chartType]);

  const handleExport = useCallback(async (format: 'png' | 'svg') => {
    if (!pieChartRef.current) return;

    try {
      if (format === 'svg') {
        const svgData = new XMLSerializer().serializeToString(pieChartRef.current);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-allocation-${currentPortfolio?.portfolioName || 'portfolio'}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'png') {
        const canvas = document.createElement('canvas');
        canvas.width = CHART_SIZE;
        canvas.height = CHART_SIZE;
        const ctx = canvas.getContext('2d');
        
        const svgData = new XMLSerializer().serializeToString(pieChartRef.current);
        const img = new Image();
        
        img.onload = () => {
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `portfolio-allocation-${currentPortfolio?.portfolioName || 'portfolio'}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
          });
        };
        
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        img.src = svgUrl;
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [currentPortfolio]);

  if (!currentPortfolio) {
    return (
      <div className={`portfolio-allocation ${className}`}>
        <div className="no-data-panel">
          <h4>📊 No Portfolio Data</h4>
          <p>No portfolio allocation data available for visualization.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`portfolio-allocation ${className}`}>
      <div className="allocation-header">
        <h3>🥧 Portfolio Allocation Analysis</h3>
        <p>Interactive visualization of asset weights and distributions</p>
      </div>

      <div className="allocation-controls">
        <div className="control-group">
          <label htmlFor="portfolio-select">Portfolio:</label>
          <select
            id="portfolio-select"
            value={selectedPortfolio}
            onChange={(e) => setSelectedPortfolio(Number(e.target.value))}
          >
            {portfolios.map((portfolio, index) => (
              <option key={index} value={index}>
                {portfolio.portfolioName} (${portfolio.totalValue.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="chart-type">Chart Type:</label>
          <select
            id="chart-type"
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
          >
            <option value="pie">Pie Chart</option>
            <option value="doughnut">Doughnut Chart</option>
          </select>
        </div>

        <div className="export-controls">
          <button onClick={() => handleExport('png')}>📸 Export PNG</button>
          <button onClick={() => handleExport('svg')}>🎨 Export SVG</button>
        </div>
      </div>

      <div className="charts-container">
        <div className="pie-chart-section">
          <div className="chart-wrapper">
            <svg
              ref={pieChartRef}
              width={CHART_SIZE}
              height={CHART_SIZE}
              viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
              className="pie-chart"
            >
              <circle
                cx={CHART_SIZE / 2}
                cy={CHART_SIZE / 2}
                r={CHART_RADIUS + 5}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              {pieChartData.map((slice) => (
                <path
                  key={slice.asset.symbol}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="white"
                  strokeWidth="2"
                  className={`pie-slice ${hoveredAsset?.symbol === slice.asset.symbol ? 'hovered' : ''}`}
                  style={{
                    transition: 'all 300ms ease',
                    transformOrigin: `${CHART_SIZE / 2}px ${CHART_SIZE / 2}px`,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredAsset(slice.asset)}
                  onMouseLeave={() => setHoveredAsset(null)}
                />
              ))}

              {chartType === 'doughnut' && (
                <g className="center-text">
                  <text
                    x={CHART_SIZE / 2}
                    y={CHART_SIZE / 2 - 10}
                    textAnchor="middle"
                    className="center-title"
                  >
                    {currentPortfolio.portfolioName}
                  </text>
                  <text
                    x={CHART_SIZE / 2}
                    y={CHART_SIZE / 2 + 10}
                    textAnchor="middle"
                    className="center-value"
                  >
                    ${currentPortfolio.totalValue.toLocaleString()}
                  </text>
                </g>
              )}
            </svg>

            {hoveredAsset && (
              <div className="chart-tooltip">
                <div className="tooltip-content">
                  <div className="asset-info">
                    <strong>{hoveredAsset.symbol}</strong> - {hoveredAsset.name}
                  </div>
                  <div className="asset-metrics">
                    Weight: <strong>{(hoveredAsset.weight * 100).toFixed(1)}%</strong> |
                    Value: <strong>${hoveredAsset.value.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chart-legend">
            <h4>Asset Breakdown</h4>
            <div className="legend-items">
              {sortedAssets.map((asset, index) => (
                <div
                  key={asset.symbol}
                  className={`legend-item ${hoveredAsset?.symbol === asset.symbol ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredAsset(asset)}
                  onMouseLeave={() => setHoveredAsset(null)}
                >
                  <div
                    className="legend-color"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <div className="legend-info">
                    <div className="legend-symbol">{asset.symbol}</div>
                    <div className="legend-details">
                      {(asset.weight * 100).toFixed(1)}% • ${asset.value.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="allocation-stats">
        <h4>📊 Portfolio Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Assets:</span>
            <span className="stat-value">{currentPortfolio.assets.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Value:</span>
            <span className="stat-value">${currentPortfolio.totalValue.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Largest Position:</span>
            <span className="stat-value">
              {sortedAssets[0]?.symbol} ({(sortedAssets[0]?.weight * 100 || 0).toFixed(1)}%)
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Concentration:</span>
            <span className="stat-value">
              Top 3: {(sortedAssets.slice(0, 3).reduce((sum, asset) => sum + asset.weight, 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioAllocation; 

