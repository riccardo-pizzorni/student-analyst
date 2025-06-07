/**
 * STUDENT ANALYST - Missing Data Detection Demo
 * Interactive demonstration of gap detection and data quality analysis
 */

import React, { useState, useEffect } from 'react';
import './MissingDataDemo.css';
import { 
  missingDataDetector, 
  type TimeSeriesData, 
  type MissingDataAnalysis,
  type InterpolationOption 
} from '../services/MissingDataDetector';

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  dataGenerator: () => TimeSeriesData[];
  expectedOutcome: string;
}

const MissingDataDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('complete');
  const [analysis, setAnalysis] = useState<MissingDataAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customThreshold, setCustomThreshold] = useState(20);
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [interpolationOptions] = useState<InterpolationOption[]>(
    missingDataDetector.getInterpolationOptions()
  );
  const [performanceMetrics, setPerformanceMetrics] = useState(
    missingDataDetector.getPerformanceMetrics()
  );

  // Demo scenarios
  const scenarios: DemoScenario[] = [
    {
      id: 'complete',
      name: '✅ Complete Dataset',
      description: 'Perfect dataset with no missing data points',
      dataGenerator: () => generateCompleteData(),
      expectedOutcome: 'Quality Score: 100/100, No warnings'
    },
    {
      id: 'minor_gaps',
      name: 'ℹ️ Minor Gaps (5%)',
      description: 'Dataset with small gaps that are acceptable',
      dataGenerator: () => generateDataWithMinorGaps(),
      expectedOutcome: 'Quality Score: 90+/100, Info level'
    },
    {
      id: 'moderate_gaps',
      name: '⚠️ Moderate Gaps (15%)',
      description: 'Dataset with noticeable gaps requiring attention',
      dataGenerator: () => generateDataWithModerateGaps(),
      expectedOutcome: 'Quality Score: 70-85/100, Warning level'
    },
    {
      id: 'critical_gaps',
      name: '🚨 Critical Gaps (25%)',
      description: 'Dataset with unacceptable level of missing data',
      dataGenerator: () => generateDataWithCriticalGaps(),
      expectedOutcome: 'Quality Score: <70/100, Critical warning'
    },
    {
      id: 'weekend_test',
      name: '📅 Weekend Analysis',
      description: 'Test business day vs weekend gap detection',
      dataGenerator: () => generateWeekendTestData(),
      expectedOutcome: 'Natural gaps (weekends) vs Anomalous gaps'
    },
    {
      id: 'holiday_test',
      name: '🎄 Holiday Analysis',
      description: 'Test holiday gap detection and classification',
      dataGenerator: () => generateHolidayTestData(),
      expectedOutcome: 'Holiday gaps classified as natural'
    }
  ];

  // Generate test data functions
  function generateCompleteData(): TimeSeriesData[] {
    const data: TimeSeriesData[] = [];
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i));
      
      // Skip weekends for realistic financial data
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        data.push({
          date: date.toISOString().split('T')[0],
          value: 100 + Math.random() * 20,
          symbol: 'TEST',
          field: 'price'
        });
      }
    }
    
    return data;
  }

  function generateDataWithMinorGaps(): TimeSeriesData[] {
    const completeData = generateCompleteData();
    // Remove ~5% of data points randomly
    const gapsToCreate = Math.floor(completeData.length * 0.05);
    
    for (let i = 0; i < gapsToCreate; i++) {
      const randomIndex = Math.floor(Math.random() * completeData.length);
      completeData.splice(randomIndex, 1);
    }
    
    return completeData;
  }

  function generateDataWithModerateGaps(): TimeSeriesData[] {
    const completeData = generateCompleteData();
    // Remove ~15% of data points in clusters
    const gapsToCreate = Math.floor(completeData.length * 0.15);
    
    let removed = 0;
    while (removed < gapsToCreate && completeData.length > 0) {
      const randomIndex = Math.floor(Math.random() * (completeData.length - 2));
      // Remove 2-3 consecutive points to create realistic gaps
      const gapSize = Math.min(Math.random() > 0.5 ? 2 : 3, gapsToCreate - removed);
      
      for (let i = 0; i < gapSize && randomIndex < completeData.length; i++) {
        completeData.splice(randomIndex, 1);
        removed++;
      }
    }
    
    return completeData;
  }

  function generateDataWithCriticalGaps(): TimeSeriesData[] {
    const completeData = generateCompleteData();
    // Remove ~25% of data points in large clusters
    const gapsToCreate = Math.floor(completeData.length * 0.25);
    
    let removed = 0;
    while (removed < gapsToCreate && completeData.length > 0) {
      const randomIndex = Math.floor(Math.random() * (completeData.length - 4));
      // Remove 3-5 consecutive points to create large gaps
      const gapSize = Math.min(Math.floor(Math.random() * 3) + 3, gapsToCreate - removed);
      
      for (let i = 0; i < gapSize && randomIndex < completeData.length; i++) {
        completeData.splice(randomIndex, 1);
        removed++;
      }
    }
    
    return completeData;
  }

  function generateWeekendTestData(): TimeSeriesData[] {
    const data: TimeSeriesData[] = [];
    const startDate = new Date('2024-01-01'); // Monday
    
    // Generate 3 weeks of data including weekends
    for (let i = 0; i < 21; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i));
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: 100 + Math.random() * 20,
        symbol: 'WEEKEND_TEST',
        field: 'price'
      });
    }
    
    return data;
  }

  function generateHolidayTestData(): TimeSeriesData[] {
    const data: TimeSeriesData[] = [];
    const startDate = new Date('2024-12-20'); // Around Christmas
    
    for (let i = 0; i < 10; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i));
      
      // Skip Christmas Day (2024-12-25) to test holiday detection
      if (date.toISOString().split('T')[0] !== '2024-12-25') {
        data.push({
          date: date.toISOString().split('T')[0],
          value: 100 + Math.random() * 20,
          symbol: 'HOLIDAY_TEST',
          field: 'price'
        });
      }
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

      const testData = scenario.dataGenerator();
      
      const result = await missingDataDetector.analyzeTimeSeries(testData, {
        warningThreshold: customThreshold,
        includeWeekends,
        analysisDepth: 'detailed'
      });

      setAnalysis(result);
      setPerformanceMetrics(missingDataDetector.getPerformanceMetrics());

    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run analysis when scenario changes
  useEffect(() => {
    runAnalysis();
  }, [selectedScenario, customThreshold, includeWeekends]);

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'none': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="missing-data-demo-container">
      <div className="missing-data-demo-header">
        <h2>🔍 Missing Data Detection System</h2>
        <p>Professional gap detection and data quality analysis for financial time series</p>
      </div>

      {/* Configuration Panel */}
      <div className="config-panel">
        <h3>Configuration</h3>
        
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
            <label htmlFor="threshold-input">Warning Threshold (%):</label>
            <input
              id="threshold-input"
              type="number"
              value={customThreshold}
              onChange={(_e) => setCustomThreshold(Number(e.target.value))}
              min="1"
              max="50"
              className="threshold-input"
            />
          </div>

          <div className="config-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeWeekends}
                onChange={(_e) => setIncludeWeekends(e.target.checked)}
              />
              Include Weekends in Analysis
            </label>
          </div>
        </div>

        <div className="scenario-description">
          <strong>Expected:</strong> {scenarios.find(s => s.id === selectedScenario)?.expectedOutcome}
        </div>
      </div>

      {/* Results Panel */}
      {loading && (
        <div className="loading-panel">
          <div className="loading-spinner">🔄</div>
          <p>Analyzing time series data...</p>
        </div>
      )}

      {error && (
        <div className="error-panel">
          <h3>❌ Analysis Error</h3>
          <p>{error}</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="results-panel">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Data Completeness</h4>
              <div className="metric-large">
                {analysis.completenessPercentage.toFixed(1)}%
              </div>
              <div className="metric-small">
                {analysis.totalDataPoints - analysis.missingDataPoints} / {analysis.totalDataPoints} data points
              </div>
            </div>

            <div className="summary-card">
              <h4>Quality Score</h4>
              <div className={`metric-large ${getQualityScoreColor(analysis.qualityScore)}`}>
                {analysis.qualityScore}/100
              </div>
              <div className="metric-small">
                {analysis.qualityScore >= 90 ? 'Excellent' : 
                 analysis.qualityScore >= 70 ? 'Good' : 'Poor'} quality
              </div>
            </div>

            <div className="summary-card">
              <h4>Business Days</h4>
              <div className="metric-large">
                {analysis.businessDaysAnalyzed}
              </div>
              <div className="metric-small">
                {analysis.businessDaysMissing} anomalous gaps
              </div>
            </div>

            <div className="summary-card">
              <h4>Gaps Detected</h4>
              <div className="metric-large">
                {analysis.gaps.length}
              </div>
              <div className="metric-small">
                {analysis.gaps.filter(g => g.type === 'anomalous').length} problematic
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className={`warning-panel ${getWarningColor(analysis.warningLevel)}`}>
            <div className="warning-message">
              {analysis.warningMessage}
            </div>
            <div className="warning-recommendation">
              <strong>Recommendation:</strong> {analysis.recommendation}
            </div>
          </div>

          {/* Gap Details */}
          {analysis.gaps.length > 0 && (
            <div className="gaps-panel">
              <h3>Gap Analysis ({analysis.gaps.length} gaps detected)</h3>
              <div className="gaps-list">
                {analysis.gaps.map((gap) => (
                  <div key={index} className={`gap-item ${gap.type}`}>
                    <div className="gap-header">
                      <span className="gap-type">
                        {gap.type === 'natural' ? '📅' : '🚨'} {gap.type.toUpperCase()}
                      </span>
                      <span className={`gap-severity severity-${gap.severity}`}>
                        {gap.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="gap-details">
                      <div className="gap-date-range">
                        {gap.startDate} → {gap.endDate}
                      </div>
                      <div className="gap-duration">
                        Duration: {gap.duration} day{gap.duration !== 1 ? 's' : ''}
                      </div>
                      <div className="gap-impact">
                        Impact: {(gap.impact * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interpolation Options */}
          <div className="interpolation-panel">
            <h3>Available Interpolation Methods</h3>
            <div className="interpolation-grid">
              {interpolationOptions.map(option => (
                <div key={option.id} className="interpolation-option">
                  <div className="option-header">
                    <h4>{option.name}</h4>
                    <span className={`complexity complexity-${option.complexity}`}>
                      {option.complexity}
                    </span>
                  </div>
                  <p className="option-description">{option.description}</p>
                  <div className="option-metrics">
                    <div className="metric">
                      <span>Accuracy:</span>
                      <span>{(option.accuracy * 100).toFixed(0)}%</span>
                    </div>
                    <div className="metric">
                      <span>Speed:</span>
                      <span>{option.performanceMs}ms</span>
                    </div>
                    <div className="metric">
                      <span>Confidence:</span>
                      <span>{(option.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="option-suitable">
                    <strong>Best for:</strong> {option.suitableFor.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="performance-panel">
            <h3>Performance Metrics</h3>
            <div className="performance-grid">
              <div className="performance-metric">
                <span>Total Analyses:</span>
                <span>{performanceMetrics.totalAnalyses}</span>
              </div>
              <div className="performance-metric">
                <span>Last Analysis:</span>
                <span>{performanceMetrics.lastAnalysisTime}ms</span>
              </div>
              <div className="performance-metric">
                <span>Average Time:</span>
                <span>{performanceMetrics.averageProcessingTime.toFixed(1)}ms</span>
              </div>
              <div className="performance-metric">
                <span>Performance:</span>
                <span className={performanceMetrics.averageProcessingTime < 100 ? 'text-green-600' : 'text-yellow-600'}>
                  {performanceMetrics.averageProcessingTime < 100 ? '⚡ Fast' : '⏱️ Moderate'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Analysis Button */}
      <div className="actions-panel">
        <button 
          onClick={runAnalysis}
          disabled={loading}
          className="run-analysis-btn"
        >
          {loading ? '🔄 Analyzing...' : '🔍 Run Analysis'}
        </button>
        
        <div className="actions-info">
          <p>Analysis target: &lt;100ms for 1000+ data points</p>
          <p>Current performance: {performanceMetrics.averageProcessingTime.toFixed(1)}ms average</p>
        </div>
      </div>
    </div>
  );
};

export default MissingDataDemo; 

