/**
 * STUDENT ANALYST - Outlier Detection Demo
 * Interactive demonstration of anomaly detection in financial data
 */

import React, { useState, useEffect } from 'react';
import { 
  outlierDetector, 
  type PriceData, 
  type OutlierAnalysis,
  type OutlierEvent,
  type DetectionConfig 
} from '../services/OutlierDetector';
import './OutlierDetectionDemo.css';

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  dataGenerator: () => PriceData[];
  expectedOutcome: string;
}

const OutlierDetectionDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('normal_market');
  const [analysis, setAnalysis] = useState<OutlierAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<DetectionConfig>(outlierDetector.getConfiguration());
  const [performanceMetrics, setPerformanceMetrics] = useState(
    outlierDetector.getPerformanceMetrics()
  );

  // Demo scenarios
  const scenarios: DemoScenario[] = [
    {
      id: 'normal_market',
      name: '📊 Normal Market Conditions',
      description: 'Stable market with normal volatility and volume',
      dataGenerator: () => generateNormalMarketData(),
      expectedOutcome: 'Low outliers, high quality score'
    },
    {
      id: 'price_jumps',
      name: '🚀 Price Jump Events',
      description: 'Market with significant price movements >20%',
      dataGenerator: () => generatePriceJumpData(),
      expectedOutcome: 'Price jump outliers detected'
    },
    {
      id: 'volume_spikes',
      name: '📈 Volume Spike Events',
      description: 'Normal prices with unusual trading volume',
      dataGenerator: () => generateVolumeSpikeData(),
      expectedOutcome: 'Volume spike outliers detected'
    },
    {
      id: 'statistical_outliers',
      name: '📉 Statistical Anomalies',
      description: 'Returns beyond 3-sigma statistical thresholds',
      dataGenerator: () => generateStatisticalOutlierData(),
      expectedOutcome: 'Statistical outliers via Z-score analysis'
    },
    {
      id: 'gap(event)s',
      name: '⚡ Gap Events',
      description: 'Overnight gaps between close and open prices',
      dataGenerator: () => generateGapEventData(),
      expectedOutcome: 'Gap movement outliers detected'
    },
    {
      id: 'mixed_anomalies',
      name: '🌪️ Mixed Anomaly Events',
      description: 'Combination of all outlier types',
      dataGenerator: () => generateMixedAnomalyData(),
      expectedOutcome: 'Multiple outlier types detected'
    }
  ];

  // Generate test data functions
  function generateNormalMarketData(): PriceData[] {
    const data: PriceData[] = [];
    let price = 100;
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < 60; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i));
      
      // Normal daily volatility ~1-2%
      const change = (Math.random() - 0.5) * 0.04 * price;
      price = Math.max(price + change, 10);
      
      const high = price * (1 + Math.random() * 0.02);
      const low = price * (1 - Math.random() * 0.02);
      const volume = 100000 + Math.random() * 50000;
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: price,
        high,
        low,
        close: price,
        volume,
        symbol: 'DEMO'
      });
    }
    
    return data;
  }

  function generatePriceJumpData(): PriceData[] {
    const normalData = generateNormalMarketData();
    
    // Add price jumps at specific points
    const jumpIndices = [15, 30, 45];
    
    jumpIndices.forEach(index => {
      if (index < normalData.length) {
        const current = normalData[index];
        const jumpMultiplier = 1 + (0.25 + Math.random() * 0.15); // 25-40% jump
        
        current.close *= jumpMultiplier;
        current.high = Math.max(current.high, current.close);
        current.volume *= 2 + Math.random() * 3; // 2-5x volume
        
        // Adjust subsequent prices
        for (let i = index + 1; i < normalData.length; i++) {
          normalData[i].open *= jumpMultiplier;
          normalData[i].high *= jumpMultiplier;
          normalData[i].low *= jumpMultiplier;
          normalData[i].close *= jumpMultiplier;
        }
      }
    });
    
    return normalData;
  }

  function generateVolumeSpikeData(): PriceData[] {
    const normalData = generateNormalMarketData();
    
    // Add volume spikes without major price changes
    const spikeIndices = [10, 25, 40, 55];
    
    spikeIndices.forEach(index => {
      if (index < normalData.length) {
        const current = normalData[index];
        current.volume *= 4 + Math.random() * 6; // 4-10x volume spike
        
        // Slight price movement due to volume
        const priceChange = (Math.random() - 0.5) * 0.1; // ±5% max
        current.close *= (1 + priceChange);
        current.high = Math.max(current.high, current.close);
        current.low = Math.min(current.low, current.close);
      }
    });
    
    return normalData;
  }

  function generateStatisticalOutlierData(): PriceData[] {
    const data: PriceData[] = [];
    let price = 100;
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < 60; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i));
      
      let change;
      // Add statistical outliers at specific points (beyond 3-sigma)
      if ([20, 35, 50].includes(i)) {
        // Generate extreme return (4-6 sigma events)
        const direction = Math.random() > 0.5 ? 1 : -1;
        change = direction * (0.08 + Math.random() * 0.05) * price; // 8-13% extreme move
      } else {
        // Normal distribution with 1-2% daily volatility
        change = (Math.random() - 0.5) * 0.04 * price;
      }
      
      price = Math.max(price + change, 10);
      
      const high = price * (1 + Math.random() * 0.02);
      const low = price * (1 - Math.random() * 0.02);
      const volume = 100000 + Math.random() * 50000;
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: price,
        high,
        low,
        close: price,
        volume,
        symbol: 'DEMO'
      });
    }
    
    return data;
  }

  function generateGapEventData(): PriceData[] {
    const normalData = generateNormalMarketData();
    
    // Add gap events (overnight price changes)
    const gapIndices = [12, 28, 44];
    
    gapIndices.forEach(index => {
      if (index < normalData.length - 1) {
        const current = normalData[index];
        const next = normalData[index + 1];
        
        // Create gap between close and next open
        const gapMultiplier = 1 + (Math.random() > 0.5 ? 1 : -1) * (0.22 + Math.random() * 0.08); // 22-30% gap
        
        next.open = current.close * gapMultiplier;
        next.close = next.open * (1 + (Math.random() - 0.5) * 0.02); // Small intraday move
        next.high = Math.max(next.open, next.close) * (1 + Math.random() * 0.01);
        next.low = Math.min(next.open, next.close) * (1 - Math.random() * 0.01);
        next.volume *= 1.5 + Math.random() * 1.5; // 1.5-3x volume
        
        // Adjust subsequent prices
        const priceAdjustment = next.close / current.close;
        for (let i = index + 2; i < normalData.length; i++) {
          normalData[i].open *= priceAdjustment;
          normalData[i].high *= priceAdjustment;
          normalData[i].low *= priceAdjustment;
          normalData[i].close *= priceAdjustment;
        }
      }
    });
    
    return normalData;
  }

  function generateMixedAnomalyData(): PriceData[] {
    const data: PriceData[] = [];
    let price = 100;
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < 80; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i));
      
      let change = (Math.random() - 0.5) * 0.04 * price; // Base volatility
      let volume = 100000 + Math.random() * 50000; // Base volume
      
      // Mix different types of anomalies
      if (i === 15) {
        // Price jump
        change = 0.28 * price;
        volume *= 4;
      } else if (i === 30) {
        // Statistical outlier
        change = -0.12 * price;
      } else if (i === 45) {
        // Volume spike only
        volume *= 8;
        change *= 0.5;
      } else if (i === 60) {
        // Gap event (will be handled in next iteration)
        change = -0.25 * price;
        volume *= 2;
      }
      
      price = Math.max(price + change, 10);
      
      const high = price * (1 + Math.random() * 0.02);
      const low = price * (1 - Math.random() * 0.02);
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: price,
        high,
        low,
        close: price,
        volume,
        symbol: 'DEMO'
      });
    }
    
    return data;
  }

  // Run analysis
  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const scenario = scenarios.find(s => s.id === selectedScenario);
      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // Update detector configuration
      outlierDetector.updateConfiguration(config);

      const testData = scenario.dataGenerator();
      const result = await outlierDetector.analyzeOutliers(testData);

      setAnalysis(result);
      setPerformanceMetrics(outlierDetector.getPerformanceMetrics());

    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run analysis when scenario or config changes
  useEffect(() => {
    runAnalysis();
  }, [selectedScenario]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price_jump': return '🚀';
      case 'volume_spike': return '📈';
      case 'statistical_outlier': return '📊';
      case 'gap_move': return '⚡';
      case 'volatility_spike': return '🌊';
      default: return '❓';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="outlier-detection-demo-container">
      <div className="outlier-detection-demo-header">
        <h2>🕵️ Outlier Detection System</h2>
        <p>Professional anomaly detection for financial time series data</p>
      </div>

      {/* Configuration Panel */}
      <div className="config-panel">
        <h3>Configuration & Test Scenarios</h3>
        
        <div className="config-row">
          <div className="config-group">
            <label htmlFor="scenario-select">Test Scenario:</label>
            <select
              id="scenario-select"
              value={selectedScenario}
              onChange={(_e) => setSelectedScenario(e.target.value)}
              className="scenario-select"
            >
              {scenarios.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </div>

          <div className="config-group">
            <label htmlFor="sigma-threshold">3-Sigma Threshold:</label>
            <input
              id="sigma-threshold"
              type="number"
              value={config.sigmaThreshold}
              onChange={(_e) => setConfig({...config, sigmaThreshold: Number(e.target.value)})}
              min="2"
              max="5"
              step="0.1"
              className="threshold-input"
            />
          </div>

          <div className="config-group">
            <label htmlFor="price-threshold">Price Jump Threshold (%):</label>
            <input
              id="price-threshold"
              type="number"
              value={config.priceJumpThreshold * 100}
              onChange={(_e) => setConfig({...config, priceJumpThreshold: Number(e.target.value) / 100})}
              min="10"
              max="50"
              className="threshold-input"
            />
          </div>
        </div>

        <div className="config-row">
          <div className="config-group">
            <label htmlFor="volume-threshold">Volume Spike Threshold (x):</label>
            <input
              id="volume-threshold"
              type="number"
              value={config.volumeSpikeThreshold}
              onChange={(_e) => setConfig({...config, volumeSpikeThreshold: Number(e.target.value)})}
              min="2"
              max="10"
              step="0.5"
              className="threshold-input"
            />
          </div>

          <div className="config-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.requireVolumeConfirmation}
                onChange={(_e) => setConfig({...config, requireVolumeConfirmation: e.target.checked})}
              />
              Require Volume Confirmation
            </label>
          </div>

          <div className="config-group">
            <button 
              onClick={() => {
                setConfig(outlierDetector.getConfiguration());
                runAnalysis();
              }}
              className="reset-config-btn"
            >
              🔄 Reset to Defaults
            </button>
          </div>
        </div>

        <div className="scenario-description">
          <strong>Expected:</strong> {scenarios.find(s => s.id === selectedScenario)?.expectedOutcome}
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="loading-panel">
          <div className="loading-spinner">🔄</div>
          <p>Analyzing outliers in financial data...</p>
        </div>
      )}

      {error && (
        <div className="error-panel">
          <h3>❌ Analysis Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Results Panel */}
      {analysis && !loading && (
        <div className="results-panel">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Outliers Detected</h4>
              <div className="metric-large">
                {analysis.outliersDetected}
              </div>
              <div className="metric-small">
                {analysis.outlierPercentage.toFixed(1)}% of data points
              </div>
            </div>

            <div className="summary-card">
              <h4>Risk Score</h4>
              <div className={`metric-large ${getRiskScoreColor(analysis.riskScore)}`}>
                {analysis.riskScore}/100
              </div>
              <div className="metric-small">
                {analysis.riskScore >= 70 ? 'High Risk' : 
                 analysis.riskScore >= 40 ? 'Medium Risk' : 'Low Risk'}
              </div>
            </div>

            <div className="summary-card">
              <h4>Data Quality</h4>
              <div className={`metric-large ${getQualityScoreColor(analysis.qualityScore)}`}>
                {analysis.qualityScore}/100
              </div>
              <div className="metric-small">
                {analysis.qualityScore >= 80 ? 'Excellent' : 
                 analysis.qualityScore >= 60 ? 'Good' : 'Poor'} quality
              </div>
            </div>

            <div className="summary-card">
              <h4>Critical Events</h4>
              <div className="metric-large text-red-600">
                {analysis.summary.criticalEvents}
              </div>
              <div className="metric-small">
                Require immediate attention
              </div>
            </div>
          </div>

          {/* Outlier Summary */}
          <div className="outlier-summary-panel">
            <h3>Outlier Summary</h3>
            <div className="outlier-summary-grid">
              <div className="summary-metric">
                <span className="metric-icon">🚀</span>
                <span className="metric-label">Price Jumps:</span>
                <span className="metric-value">{analysis.summary.priceJumps}</span>
              </div>
              <div className="summary-metric">
                <span className="metric-icon">📈</span>
                <span className="metric-label">Volume Spikes:</span>
                <span className="metric-value">{analysis.summary.volumeSpikes}</span>
              </div>
              <div className="summary-metric">
                <span className="metric-icon">📊</span>
                <span className="metric-label">Statistical Outliers:</span>
                <span className="metric-value">{analysis.summary.statisticalOutliers}</span>
              </div>
              <div className="summary-metric">
                <span className="metric-icon">🎯</span>
                <span className="metric-label">Avg Confidence:</span>
                <span className="metric-value">{(analysis.summary.avgConfidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Outlier Events */}
          {analysis.events.length > 0 && (
            <div className="events-panel">
              <h3>Detected Outlier Events ({analysis.events.length})</h3>
              <div className="events-list">
                {analysis.events.map((event) => (
                  <div key={event.id} className={`event-item ${event.severity}`}>
                    <div className="event-header">
                      <div className="event-type">
                        <span className="type-icon">{getTypeIcon(event.type)}</span>
                        <span className="type-name">{event.type.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <div className="event-meta">
                        <span className={`event-severity severity-${event.severity}`}>
                          {event.severity.toUpperCase()}
                        </span>
                        <span className="event-confidence">
                          {(event.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                    
                    <div className="event-details">
                      <div className="event-date">{event.date}</div>
                      <div className="event-description">{event.description}</div>
                    </div>
                    
                    <div className="event-explanation">
                      <strong>Analysis:</strong> {event.explanation}
                    </div>
                    
                    <div className="event-recommendation">
                      <strong>Recommendation:</strong> {event.recommendation}
                    </div>
                    
                    <div className="event-metadata">
                      <div className="metadata-grid">
                        <div className="metadata-item">
                          <span>Value:</span>
                          <span>{event.value.toFixed(2)}</span>
                        </div>
                        <div className="metadata-item">
                          <span>Expected:</span>
                          <span>{event.expectedValue.toFixed(2)}</span>
                        </div>
                        <div className="metadata-item">
                          <span>Deviation:</span>
                          <span>{event.deviationMagnitude.toFixed(2)}{event.type === 'statistical_outlier' ? 'σ' : event.type.includes('price') ? '%' : 'x'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="performance-panel">
            <h3>Performance Metrics</h3>
            <div className="performance-grid">
              <div className="performance-metric">
                <span>Processing Time:</span>
                <span>{analysis.performanceMetrics.processingTimeMs}ms</span>
              </div>
              <div className="performance-metric">
                <span>Data Points/Second:</span>
                <span>{analysis.performanceMetrics.dataPointsPerSecond.toLocaleString()}</span>
              </div>
              <div className="performance-metric">
                <span>Total Analyses:</span>
                <span>{performanceMetrics.totalAnalyses}</span>
              </div>
              <div className="performance-metric">
                <span>Average Time:</span>
                <span>{performanceMetrics.averageProcessingTime.toFixed(1)}ms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Panel */}
      <div className="actions-panel">
        <button 
          onClick={runAnalysis}
          disabled={loading}
          className="run-analysis-btn"
        >
          {loading ? '🔄 Analyzing...' : '🕵️ Run Outlier Detection'}
        </button>
        
        <div className="actions-info">
          <p>Performance target: &lt;10sec for 100 assets</p>
          <p>Current performance: {performanceMetrics.averageProcessingTime.toFixed(1)}ms average</p>
        </div>
      </div>
    </div>
  );
};

export default OutlierDetectionDemo; 

