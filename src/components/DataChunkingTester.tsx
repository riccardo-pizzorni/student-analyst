/**
 * Data Chunking Tester Component
 * UI for testing large dataset chunking functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  dataChunkingService, 
  ChunkProgress, 
  ChunkingResult, 
  AssetData,
  ChunkingConfig 
} from '../services/DataChunkingService';

interface DataChunkingTesterProps {}

interface TestScenario {
  name: string;
  description: string;
  assetCount: number;
  method: 'min_variance' | 'max_sharpe';
  icon: string;
}

interface MemorySnapshot {
  timestamp: number;
  memoryUsageMB: number;
  stage: string;
}

const DataChunkingTester: React.FC<DataChunkingTesterProps> = () => {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress | null>(null);
  const [testResults, setTestResults] = useState<ChunkingResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [memorySnapshots, setMemorySnapshots] = useState<MemorySnapshot[]>([]);
  const [chunkingConfig, setChunkingConfig] = useState<ChunkingConfig>({
    maxChunkSize: 25,
    parallelChunks: 1,
    progressReportingInterval: 500,
    memoryThresholdMB: 512
  });

  const memoryMonitorRef = useRef<NodeJS.Timeout | null>(null);

  const testScenarios: TestScenario[] = [
    {
      name: 'Small Portfolio',
      description: '50 assets - Regular processing',
      assetCount: 50,
      method: 'min_variance',
      icon: '📊'
    },
    {
      name: 'Large Portfolio',
      description: '150 assets - Chunked processing',
      assetCount: 150,
      method: 'min_variance',
      icon: '🏢'
    },
    {
      name: 'Extra Large Portfolio',
      description: '300 assets - Advanced chunking',
      assetCount: 300,
      method: 'max_sharpe',
      icon: '🌆'
    },
    {
      name: 'Massive Portfolio',
      description: '500 assets - Stress test',
      assetCount: 500,
      method: 'min_variance',
      icon: '🚀'
    },
    {
      name: 'Efficient Frontier',
      description: '200 assets - Frontier calculation',
      assetCount: 200,
      method: 'max_sharpe',
      icon: '📈'
    }
  ];

  useEffect(() => {
    return () => {
      if (memoryMonitorRef.current) {
        clearInterval(memoryMonitorRef.current);
      }
    };
  }, []);

  /**
   * Generate synthetic asset data for testing
   */
  const generateTestAssets = (count: number): AssetData[] => {
    const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial'];
    const assets: AssetData[] = [];

    for (let i = 0; i < count; i++) {
      const volatility = 0.15 + Math.random() * 0.25; // 15-40% volatility
      const expectedReturn = 0.05 + Math.random() * 0.15; // 5-20% expected return
      
      // Generate realistic return series (252 trading days)
      const returns: number[] = [];
      for (let j = 0; j < 252; j++) {
        const dailyReturn = (expectedReturn / 252) + (volatility / Math.sqrt(252)) * (Math.random() - 0.5) * 2;
        returns.push(dailyReturn);
      }

      assets.push({
        symbol: `STOCK${i.toString().padStart(3, '0')}`,
        expectedReturn,
        returns,
        volatility,
        sector: sectors[Math.floor(Math.random() * sectors.length)],
        marketCap: Math.random() * 500000000000 // Random market cap up to 500B
      });
    }

    return assets;
  };

  /**
   * Start memory monitoring
   */
  const startMemoryMonitoring = () => {
    setMemorySnapshots([]);
    memoryMonitorRef.current = setInterval(() => {
      const memoryUsage = getMemoryUsage();
      if (memoryUsage > 0) {
        setMemorySnapshots(prev => [...prev, {
          timestamp: Date.now(),
          memoryUsageMB: memoryUsage,
          stage: chunkProgress?.stage || 'idle'
        }]);
      }
    }, 1000);
  };

  /**
   * Stop memory monitoring
   */
  const stopMemoryMonitoring = () => {
    if (memoryMonitorRef.current) {
      clearInterval(memoryMonitorRef.current);
      memoryMonitorRef.current = null;
    }
  };

  /**
   * Get memory usage (simplified)
   */
  const getMemoryUsage = (): number => {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  };

  /**
   * Handle test execution
   */
  const runTest = async (scenario: TestScenario) => {
    setIsTestRunning(true);
    setCurrentTest(scenario.name);
    setChunkProgress(null);
    setErrorMessage('');
    startMemoryMonitoring();

    try {
      console.log(`🧪 Starting ${scenario.name} test with ${scenario.assetCount} assets`);
      
      const assets = generateTestAssets(scenario.assetCount);
      const startTime = performance.now();

      const progressCallback = (progress: ChunkProgress) => {
        setChunkProgress(progress);
      };

      let result: ChunkingResult;

      if (scenario.name === 'Efficient Frontier') {
        result = await dataChunkingService.calculateEfficientFrontierChunked(
          assets,
          30, // 30 frontier points
          { minWeight: 0, maxWeight: 0.4 },
          chunkingConfig,
          progressCallback
        );
      } else {
        result = await dataChunkingService.optimizePortfolioChunked(
          assets,
          scenario.method,
          { minWeight: 0, maxWeight: 0.4 },
          chunkingConfig,
          progressCallback
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`✅ ${scenario.name} completed in ${totalTime.toFixed(2)}ms`);
      console.log(`📊 Result:`, result);

      setTestResults(prev => [...prev, {
        ...result,
        totalProcessingTime: totalTime
      }]);

    } catch (error: any) {
      console.error(`❌ ${scenario.name} failed:`, error);
      setErrorMessage(error.message);
    } finally {
      setIsTestRunning(false);
      setCurrentTest('');
      stopMemoryMonitoring();
    }
  };

  /**
   * Cancel current operation
   */
  const cancelOperation = () => {
    dataChunkingService.cancelOperation();
    setIsTestRunning(false);
    setCurrentTest('');
    setChunkProgress(null);
    stopMemoryMonitoring();
  };

  /**
   * Clear all results
   */
  const clearResults = () => {
    setTestResults([]);
    setMemorySnapshots([]);
    setErrorMessage('');
  };

  /**
   * Format time duration
   */
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  /**
   * Format memory size
   */
  const formatMemory = (mb: number): string => {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  /**
   * Get progress bar color based on stage
   */
  const getProgressColor = (stage: string): string => {
    switch (stage) {
      case 'preparing': return '#3b82f6'; // Blue
      case 'processing': return '#10b981'; // Green
      case 'merging': return '#f59e0b'; // Amber
      case 'completed': return '#059669'; // Emerald
      default: return '#6b7280'; // Gray
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            🔄 Data Chunking Performance Tester
          </h2>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
            Test large dataset processing with intelligent chunking
          </p>
        </div>

        {/* Configuration Panel */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>⚙️ Chunking Configuration</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Max Chunk Size
              </label>
              <input
                id="max-chunk-size"
                type="number"
                value={chunkingConfig.maxChunkSize}
                onChange={(e) => setChunkingConfig(prev => ({ ...prev, maxChunkSize: parseInt(e.target.value) }))}
                aria-label="Maximum Chunk Size"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                min="10"
                max="100"
                disabled={isTestRunning}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Memory Threshold (MB)
              </label>
              <input
                id="memory-threshold"
                type="number"
                value={chunkingConfig.memoryThresholdMB}
                onChange={(e) => setChunkingConfig(prev => ({ ...prev, memoryThresholdMB: parseInt(e.target.value) }))}
                aria-label="Memory Threshold in MB"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                min="256"
                max="2048"
                disabled={isTestRunning}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Progress Interval (ms)
              </label>
              <input
                id="progress-interval"
                type="number"
                value={chunkingConfig.progressReportingInterval}
                onChange={(e) => setChunkingConfig(prev => ({ ...prev, progressReportingInterval: parseInt(e.target.value) }))}
                aria-label="Progress Reporting Interval in milliseconds"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                min="100"
                max="2000"
                disabled={isTestRunning}
              />
            </div>
          </div>
        </div>

        {/* Test Scenarios */}
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>🧪 Test Scenarios</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '16px',
            marginBottom: '20px'
          }}>
            {testScenarios.map((scenario, index) => (
              <button
                key={index}
                onClick={() => runTest(scenario)}
                disabled={isTestRunning}
                style={{
                  padding: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: isTestRunning ? '#f3f4f6' : 'white',
                  cursor: isTestRunning ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  opacity: isTestRunning ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isTestRunning) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isTestRunning) {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{scenario.icon}</div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#111827' }}>
                  {scenario.name}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {scenario.description}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                  Method: {scenario.method === 'min_variance' ? 'Min Variance' : 'Max Sharpe'}
                </div>
              </button>
            ))}
          </div>

          {/* Control Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={cancelOperation}
              disabled={!isTestRunning}
              style={{
                padding: '10px 20px',
                backgroundColor: isTestRunning ? '#ef4444' : '#f3f4f6',
                color: isTestRunning ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '6px',
                cursor: isTestRunning ? 'pointer' : 'not-allowed',
                fontWeight: '500'
              }}
            >
              🛑 Cancel Operation
            </button>
            <button
              onClick={clearResults}
              disabled={isTestRunning}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: isTestRunning ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              🗑️ Clear Results
            </button>
          </div>
        </div>

        {/* Current Progress */}
        {isTestRunning && chunkProgress && (
          <div style={{ 
            padding: '20px', 
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>
              🔄 Processing: {currentTest}
            </h3>
            
            {/* Overall Progress */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Overall Progress
                </span>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {chunkProgress.overallProgress.toFixed(1)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div
                  style={{
                    width: `${chunkProgress.overallProgress}%`,
                    height: '100%',
                    backgroundColor: getProgressColor(chunkProgress.stage),
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* Chunk Progress */}
            {chunkProgress.totalChunks > 1 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    Chunk {chunkProgress.chunkIndex}/{chunkProgress.totalChunks}
                  </span>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {chunkProgress.chunkProgress.toFixed(1)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      width: `${chunkProgress.chunkProgress}%`,
                      height: '100%',
                      backgroundColor: '#10b981',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Progress Details */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'white', 
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Stage</div>
                <div style={{ fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>
                  {chunkProgress.stage}
                </div>
              </div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'white', 
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Assets Processed</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  {chunkProgress.processedAssets}/{chunkProgress.totalAssets}
                </div>
              </div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'white', 
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Memory Usage</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  {formatMemory(chunkProgress.memoryUsageMB)}
                </div>
              </div>
              {chunkProgress.estimatedTimeRemaining > 0 && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'white', 
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Time Remaining</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {formatDuration(chunkProgress.estimatedTimeRemaining * 1000)}
                  </div>
                </div>
              )}
            </div>

            {/* Current Message */}
            <div style={{
              padding: '12px',
              backgroundColor: '#dbeafe',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1e40af'
            }}>
              {chunkProgress.message}
            </div>
          </div>
        )}

        {/* Error Display */}
        {errorMessage && (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#fef2f2',
            borderTop: '1px solid #fecaca'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>❌ Error</h3>
            <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>
              {errorMessage}
            </p>
          </div>
        )}

        {/* Memory Usage Chart */}
        {memorySnapshots.length > 0 && (
          <div style={{ 
            padding: '20px', 
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>📊 Memory Usage Over Time</h3>
            <div style={{
              height: '200px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Simple memory usage visualization */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'end', 
                height: '100%',
                gap: '2px'
              }}>
                {memorySnapshots.slice(-50).map((snapshot, index) => {
                  const maxMemory = Math.max(...memorySnapshots.map(s => s.memoryUsageMB));
                  const height = (snapshot.memoryUsageMB / maxMemory) * 100;
                  return (
                    <div
                      key={index}
                      style={{
                        width: '4px',
                        height: `${height}%`,
                        backgroundColor: '#3b82f6',
                        opacity: 0.7
                      }}
                      title={`${formatMemory(snapshot.memoryUsageMB)} at ${new Date(snapshot.timestamp).toLocaleTimeString()}`}
                    />
                  );
                })}
              </div>
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Current: {formatMemory(memorySnapshots[memorySnapshots.length - 1]?.memoryUsageMB || 0)}
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {testResults.length > 0 && (
          <div style={{ 
            padding: '20px', 
            borderTop: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>📈 Test Results</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      Test
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      Assets
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      Chunks
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      Total Time
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      Avg Chunk Time
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      Max Memory
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        Test #{index + 1}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {result.assetsProcessed}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {result.chunksProcessed}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {formatDuration(result.totalProcessingTime)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {formatDuration(result.averageChunkTime)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {formatMemory(result.maxMemoryUsageMB)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ 
                          color: result.success ? '#059669' : '#dc2626',
                          fontWeight: '500'
                        }}>
                          {result.success ? '✅ Success' : '❌ Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataChunkingTester;

