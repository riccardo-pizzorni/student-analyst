/**
 * STUDENT ANALYST - Unified Quality Dashboard
 * Interactive dashboard for comprehensive data quality assessment
 */

import React, { useState, useEffect } from 'react';
import './UnifiedQualityDashboard.css';

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  expectedScore: string;
  issues: string[];
}

interface MockQualityResult {
  symbol: string;
  overallScore: number;
  scoreGrade: string;
  scoreColor: string;
  confidence: number;
  reliability: string;
  breakdown: {
    missingDataScore: number;
    outlierScore: number;
    consistencyScore: number;
    missingDataWeight: number;
    outlierWeight: number;
    consistencyWeight: number;
    missingDataPenalty: number;
    outlierPenalty: number;
    consistencyPenalty: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    category: string;
    message: string;
    description: string;
    recommendation: string;
    impact: number;
    urgency: number;
  }>;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    autoCorrectableIssues: number;
    dataQualityStatus: string;
    readyForAnalysis: boolean;
    requiredActions: string[];
  };
  metrics: {
    processingTime: number;
    lastCalculated: string;
    dataPointsAnalyzed: number;
    coveragePeriod: string;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    priority: string;
  };
  benchmarks: {
    industryAverage: number;
    bestPractice: number;
    minimumAcceptable: number;
  };
}

const UnifiedQualityDashboard: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('excellent_data');
  const [qualityResult, setQualityResult] = useState<MockQualityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo scenarios
  const scenarios: DemoScenario[] = [
    {
      id: 'excellent_data',
      name: '⭐ Excellent Quality',
      description: 'Perfect data with no quality issues',
      expectedScore: '95-100',
      issues: ['No issues expected']
    },
    {
      id: 'good_data',
      name: '✅ Good Quality',
      description: 'Minor issues that don\'t affect analysis',
      expectedScore: '80-94',
      issues: ['Small data gaps', 'Minor outliers']
    },
    {
      id: 'fair_data',
      name: '⚠️ Fair Quality',
      description: 'Moderate issues requiring attention',
      expectedScore: '60-79',
      issues: ['Missing data periods', 'Multiple outliers', 'Some inconsistencies']
    },
    {
      id: 'poor_data',
      name: '❌ Poor Quality',
      description: 'Significant issues affecting reliability',
      expectedScore: '30-59',
      issues: ['Large data gaps', 'Many outliers', 'Logic errors']
    },
    {
      id: 'unacceptable_data',
      name: '🚫 Unacceptable Quality',
      description: 'Critical issues making data unusable',
      expectedScore: '0-29',
      issues: ['Massive data corruption', 'Critical logic errors', 'Unreliable source']
    }
  ];

  // Mock quality analysis
  const runQualityAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const scenario = scenarios.find(s => s.id === selectedScenario);
      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock results based on scenario
      const mockResult = generateMockResult(scenario);
      setQualityResult(mockResult);

    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Quality analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock results
  const generateMockResult = (scenario: DemoScenario): MockQualityResult => {
    let baseScore = 95;
    let alerts: Array<{
      id: string;
      type: string;
      category: string;
      message: string;
      description: string;
      recommendation: string;
      impact: number;
      urgency: number;
    }> = [];
    let criticalIssues = 0;
    
    switch (scenario.id) {
      case 'excellent_data':
        baseScore = 97;
        break;
      case 'good_data':
        baseScore = 85;
        alerts = [{
          id: 'minor_gaps',
          type: 'low',
          category: 'missing_data',
          message: 'Minor data gaps detected',
          description: 'Small gaps in data that don\'t significantly impact analysis',
          recommendation: 'Monitor for pattern development',
          impact: 5,
          urgency: 30
        }];
        break;
      case 'fair_data':
        baseScore = 68;
        alerts = [
          {
            id: 'moderate_gaps',
            type: 'medium',
            category: 'missing_data',
            message: 'Moderate data gaps detected',
            description: 'Several missing data periods that may affect calculations',
            recommendation: 'Consider data interpolation or alternative sources',
            impact: 15,
            urgency: 60
          },
          {
            id: 'outliers_detected',
            type: 'medium',
            category: 'outliers',
            message: 'Multiple outliers detected',
            description: 'Several anomalous values requiring investigation',
            recommendation: 'Review outliers to distinguish errors from events',
            impact: 12,
            urgency: 50
          }
        ];
        break;
      case 'poor_data':
        baseScore = 42;
        criticalIssues = 1;
        alerts = [
          {
            id: 'large_gaps',
            type: 'high',
            category: 'missing_data',
            message: 'Large data gaps detected',
            description: 'Significant missing data periods affecting reliability',
            recommendation: 'Obtain additional data before proceeding',
            impact: 25,
            urgency: 80
          },
          {
            id: 'consistency(error)s',
            type: 'critical',
            category: 'consistency',
            message: 'Data consistency errors found',
            description: 'Logical inconsistencies that compromise data integrity',
            recommendation: 'Validate and correct data before use',
            impact: 35,
            urgency: 95
          }
        ];
        break;
      case 'unacceptable_data':
        baseScore = 18;
        criticalIssues = 3;
        alerts = [
          {
            id: 'massive_corruption',
            type: 'critical',
            category: 'overall',
            message: 'Massive data corruption detected',
            description: 'Widespread data integrity issues making analysis impossible',
            recommendation: 'Do not use this data - find alternative source',
            impact: 50,
            urgency: 100
          },
          {
            id: 'critical_logic(error)s',
            type: 'critical',
            category: 'consistency',
            message: 'Critical logic errors found',
            description: 'Fundamental mathematical inconsistencies in data',
            recommendation: 'Complete data validation and correction required',
            impact: 40,
            urgency: 100
          },
          {
            id: 'unreliable_source',
            type: 'critical',
            category: 'overall',
            message: 'Data source reliability compromised',
            description: 'Source appears to have systematic quality issues',
            recommendation: 'Switch to alternative data provider',
            impact: 45,
            urgency: 90
          }
        ];
        break;
    }

    const missingDataScore = Math.max(0, baseScore + Math.random() * 10 - 5);
    const outlierScore = Math.max(0, baseScore + Math.random() * 10 - 5);
    const consistencyScore = Math.max(0, baseScore + Math.random() * 10 - 5);

    return {
      symbol: scenario.id.toUpperCase(),
      overallScore: baseScore,
      scoreGrade: getScoreGrade(baseScore),
      scoreColor: getScoreColor(baseScore),
      confidence: Math.min(100, baseScore + 10),
      reliability: getReliabilityLevel(baseScore),
      breakdown: {
        missingDataScore: Math.round(missingDataScore),
        outlierScore: Math.round(outlierScore),
        consistencyScore: Math.round(consistencyScore),
        missingDataWeight: 0.30,
        outlierWeight: 0.20,
        consistencyWeight: 0.50,
        missingDataPenalty: Math.round((100 - missingDataScore) * 0.30),
        outlierPenalty: Math.round((100 - outlierScore) * 0.20),
        consistencyPenalty: Math.round((100 - consistencyScore) * 0.50)
      },
      alerts,
      summary: {
        totalIssues: alerts.length,
        criticalIssues,
        autoCorrectableIssues: Math.floor(alerts.length / 2),
        dataQualityStatus: getDataQualityStatus(baseScore),
        readyForAnalysis: baseScore >= 60 && criticalIssues === 0,
        requiredActions: criticalIssues > 0 ? ['Resolve critical issues'] : baseScore < 60 ? ['Improve data quality'] : []
      },
      metrics: {
        processingTime: Math.floor(Math.random() * 500) + 100,
        lastCalculated: new Date().toISOString(),
        dataPointsAnalyzed: Math.floor(Math.random() * 200) + 50,
        coveragePeriod: '2024-01-01 to 2024-12-31'
      },
      recommendations: {
        immediate: criticalIssues > 0 ? ['Stop using data', 'Investigate critical issues'] : [],
        shortTerm: baseScore < 80 ? ['Implement quality monitoring', 'Establish validation checkpoints'] : [],
        longTerm: ['Develop quality metrics dashboard', 'Implement trend monitoring'],
        priority: criticalIssues > 0 ? 'critical' : baseScore < 60 ? 'high' : 'medium'
      },
      benchmarks: {
        industryAverage: 75,
        bestPractice: 90,
        minimumAcceptable: 60
      }
    };
  };

  // Helper functions
  const getScoreGrade = (score: number): string => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    if (score >= 50) return 'orange';
    return 'red';
  };

  const getReliabilityLevel = (score: number): string => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 30) return 'poor';
    return 'unacceptable';
  };

  const getDataQualityStatus = (score: number): string => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'needs(i)mprovement';
    if (score >= 30) return 'poor';
    return 'unacceptable';
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-fair';
    return 'score-poor';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '❓';
    }
  };

  const getReliabilityIcon = (reliability: string) => {
    switch (reliability) {
      case 'excellent': return '⭐⭐⭐⭐⭐';
      case 'good': return '⭐⭐⭐⭐';
      case 'fair': return '⭐⭐⭐';
      case 'poor': return '⭐⭐';
      case 'unacceptable': return '⭐';
      default: return '❓';
    }
  };

  // Auto-run analysis when scenario changes
  useEffect(() => {
    runQualityAnalysis();
  }, [selectedScenario]);

  return (
    <div className="unified-quality-dashboard">
      <div className="dashboard-header">
        <h2>📊 Unified Data Quality Dashboard</h2>
        <p>Comprehensive assessment combining all quality checks into a single score</p>
      </div>

      {/* Scenario Selection */}
      <div className="scenario-section">
        <h3>Quality Test Scenarios</h3>
        <div className="scenario-grid">
          {scenarios.map(scenario => (
            <div
              key={scenario.id}
              className={`scenario-card ${selectedScenario === scenario.id ? 'selected' : ''}`}
              onClick={() => setSelectedScenario(scenario.id)}
            >
              <h4>{scenario.name}</h4>
              <p>{scenario.description}</p>
              <div className="scenario-details">
                <div className="expected-score">Score: {scenario.expectedScore}</div>
                <div className="expected-issues">
                  Issues: {scenario.issues.join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="loading-panel">
          <div className="loading-spinner">🔄</div>
          <p>Analyzing data quality across all dimensions...</p>
        </div>
      )}

      {error && (
        <div className="error-panel">
          <h3>❌ Analysis Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Results Dashboard */}
      {qualityResult && !loading && (
        <div className="results-dashboard">
          {/* Overall Quality Score */}
          <div className="main-score-section">
            <div className={`main-score-card ${getScoreColorClass(qualityResult.overallScore)}`}>
              <div className="score-header">
                <h3>Overall Data Quality Score</h3>
                <div className="reliability-indicator">
                  Reliability: {getReliabilityIcon(qualityResult.reliability)} {qualityResult.reliability}
                </div>
              </div>
              
              <div className="score-display">
                <div className="score-number">{qualityResult.overallScore}</div>
                <div className="score-denominator">/100</div>
                <div className="score-grade">Grade: {qualityResult.scoreGrade}</div>
              </div>
              
              <div className="score-bar">
                <div 
                  className={`score-fill ${qualityResult.scoreColor}`}
                  style={{ width: `${qualityResult.overallScore}%` }}
                ></div>
              </div>
              
              <div className="confidence-indicator">
                Confidence: {qualityResult.confidence}% | Ready for Analysis: {qualityResult.summary.readyForAnalysis ? '✅' : '❌'}
              </div>
            </div>
          </div>

          {/* Component Breakdown */}
          <div className="breakdown-section">
            <h3>Quality Component Breakdown</h3>
            <div className="breakdown-grid">
              <div className="component-card">
                <h4>📊 Missing Data</h4>
                <div className="component-score">{qualityResult.breakdown.missingDataScore}/100</div>
                <div className="component-weight">Weight: {(qualityResult.breakdown.missingDataWeight * 100).toFixed(0)}%</div>
                <div className="component-penalty">Penalty: -{qualityResult.breakdown.missingDataPenalty}</div>
              </div>
              
              <div className="component-card">
                <h4>🔍 Outlier Detection</h4>
                <div className="component-score">{qualityResult.breakdown.outlierScore}/100</div>
                <div className="component-weight">Weight: {(qualityResult.breakdown.outlierWeight * 100).toFixed(0)}%</div>
                <div className="component-penalty">Penalty: -{qualityResult.breakdown.outlierPenalty}</div>
              </div>
              
              <div className="component-card">
                <h4>🔧 Data Consistency</h4>
                <div className="component-score">{qualityResult.breakdown.consistencyScore}/100</div>
                <div className="component-weight">Weight: {(qualityResult.breakdown.consistencyWeight * 100).toFixed(0)}%</div>
                <div className="component-penalty">Penalty: -{qualityResult.breakdown.consistencyPenalty}</div>
              </div>
            </div>
          </div>

          {/* Quality Alerts */}
          {qualityResult.alerts.length > 0 && (
            <div className="alerts-section">
              <h3>Quality Alerts ({qualityResult.alerts.length})</h3>
              <div className="alerts-list">
                {qualityResult.alerts.map((alert) => (
                  <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                    <div className="alert-header">
                      <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                      <span className="alert-type">{alert.type.toUpperCase()}</span>
                      <span className="alert-category">{alert.category.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-description">{alert.description}</div>
                    <div className="alert-recommendation">
                      <strong>Recommendation:</strong> {alert.recommendation}
                    </div>
                    
                    <div className="alert-metrics">
                      <span>Impact: {alert.impact}%</span>
                      <span>Urgency: {alert.urgency}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="summary-section">
            <h3>Quality Summary</h3>
            <div className="summary-grid">
              <div className="summary-card">
                <h4>Data Status</h4>
                <div className="status-indicator">
                  <span className={`status-badge status-${qualityResult.summary.dataQualityStatus}`}>
                    {qualityResult.summary.dataQualityStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="summary-card">
                <h4>Issues Found</h4>
                <div className="issues-breakdown">
                  <div>Total: {qualityResult.summary.totalIssues}</div>
                  <div>Critical: {qualityResult.summary.criticalIssues}</div>
                  <div>Auto-fixable: {qualityResult.summary.autoCorrectableIssues}</div>
                </div>
              </div>
              
              <div className="summary-card">
                <h4>Required Actions</h4>
                <div className="actions-list">
                  {qualityResult.summary.requiredActions.map((action) => (
                    <div key={index} className="action-item">{action}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="recommendations-section">
            <h3>Improvement Recommendations</h3>
            <div className="recommendations-grid">
              <div className="recommendation-card">
                <h4>🚨 Immediate Actions</h4>
                <ul>
                  {qualityResult.recommendations.immediate.map((rec) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
              
              <div className="recommendation-card">
                <h4>📅 Short-term Improvements</h4>
                <ul>
                  {qualityResult.recommendations.shortTerm.map((rec) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
              
              <div className="recommendation-card">
                <h4>🎯 Long-term Strategy</h4>
                <ul>
                  {qualityResult.recommendations.longTerm.map((rec) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="priority-indicator">
              Priority Level: <span className={`priority-badge priority-${qualityResult.recommendations.priority}`}>
                {qualityResult.recommendations.priority.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="metrics-section">
            <h3>Analysis Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span>Processing Time:</span>
                <span>{qualityResult.metrics.processingTime}ms</span>
              </div>
              <div className="metric-item">
                <span>Data Points Analyzed:</span>
                <span>{qualityResult.metrics.dataPointsAnalyzed.toLocaleString()}</span>
              </div>
              <div className="metric-item">
                <span>Coverage Period:</span>
                <span>{qualityResult.metrics.coveragePeriod}</span>
              </div>
              <div className="metric-item">
                <span>Last Updated:</span>
                <span>{new Date(qualityResult.metrics.lastCalculated).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Benchmarks */}
          <div className="benchmarks-section">
            <h3>Industry Benchmarks</h3>
            <div className="benchmarks-chart">
              <div className="benchmark-item">
                <span>Your Score:</span>
                <div className="benchmark-bar">
                  <div 
                    className="benchmark-fill your-score"
                    style={{ width: `${qualityResult.overallScore}%` }}
                  ></div>
                </div>
                <span>{qualityResult.overallScore}</span>
              </div>
              
              <div className="benchmark-item">
                <span>Industry Average:</span>
                <div className="benchmark-bar">
                  <div 
                    className="benchmark-fill industry-average"
                    style={{ width: `${qualityResult.benchmarks.industryAverage}%` }}
                  ></div>
                </div>
                <span>{qualityResult.benchmarks.industryAverage}</span>
              </div>
              
              <div className="benchmark-item">
                <span>Best Practice:</span>
                <div className="benchmark-bar">
                  <div 
                    className="benchmark-fill best-practice"
                    style={{ width: `${qualityResult.benchmarks.bestPractice}%` }}
                  ></div>
                </div>
                <span>{qualityResult.benchmarks.bestPractice}</span>
              </div>
              
              <div className="benchmark-item">
                <span>Minimum Acceptable:</span>
                <div className="benchmark-bar">
                  <div 
                    className="benchmark-fill minimum-acceptable"
                    style={{ width: `${qualityResult.benchmarks.minimumAcceptable}%` }}
                  ></div>
                </div>
                <span>{qualityResult.benchmarks.minimumAcceptable}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Panel */}
      <div className="actions-panel">
        <button 
          onClick={runQualityAnalysis}
          disabled={loading}
          className="analyze-btn"
        >
          {loading ? '🔄 Analyzing...' : '📊 Run Quality Analysis'}
        </button>
        
        <div className="actions-info">
          <p>Performance target: &lt;10sec for 100 assets</p>
          <p>Current analysis: {qualityResult?.metrics.processingTime || 0}ms</p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedQualityDashboard; 

