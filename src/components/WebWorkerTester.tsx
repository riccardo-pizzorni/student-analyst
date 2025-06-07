import React, { useState, useEffect, useCallback } from 'react';
import { webWorkerService, WebWorkerTask, ProgressCallback } from '../services/WebWorkerService';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  assetCount: number;
  complexity: 'low' | 'medium' | 'high';
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'small_portfolio',
    name: 'Small Portfolio (10 assets)',
    description: 'Quick test with 10 assets - should complete in <1 second',
    assetCount: 10,
    complexity: 'low'
  },
  {
    id: 'medium_portfolio',
    name: 'Medium Portfolio (50 assets)',
    description: 'Moderate test with 50 assets - should complete in 2-5 seconds',
    assetCount: 50,
    complexity: 'medium'
  },
  {
    id: 'large_portfolio',
    name: 'Large Portfolio (100 assets)',
    description: 'Stress test with 100 assets - should complete in <10 seconds',
    assetCount: 100,
    complexity: 'high'
  },
  {
    id: 'efficient_frontier',
    name: 'Efficient Frontier (30 assets, 100 points)',
    description: 'Generate efficient frontier with 30 assets and 100 points',
    assetCount: 30,
    complexity: 'high'
  }
];

export const WebWorkerTester: React.FC = () => {
  const [workerReady, setWorkerReady] = useState(false);
  const [activeTasks, setActiveTasks] = useState<WebWorkerTask[]>([]);
  const [completedTests, setCompletedTests] = useState<Array<{
    scenario: string;
    duration: number;
    success: boolean;
    error?: string;
  }>>([]);
  const [workerStats, setWorkerStats] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize worker on component mount
  useEffect(() => {
    initializeWorker();
    
    // Cleanup on unmount
    return () => {
      webWorkerService.terminate();
    };
  }, []);

  // Update worker stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkerStats(webWorkerService.getStatistics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const initializeWorker = async () => {
    setIsInitializing(true);
    try {
      await webWorkerService.initialize();
      setWorkerReady(true);
      setWorkerStats(webWorkerService.getStatistics());
    } catch (error) {
      console.error('Failed to initialize Web Worker:', (error));
      setWorkerReady(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const generateMockAssets = (count: number) => {
    const assets = [];
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX', 'ORCL', 'CRM'];
    
    for (let i = 0; i < count; i++) {
      const symbol = i < symbols.length ? symbols[i] : `ASSET${i + 1}`;
      const expectedReturn = 0.05 + (Math.random() * 0.15); // 5-20% expected return
      const volatility = 0.10 + (Math.random() * 0.30); // 10-40% volatility
      
      // Generate random returns data
      const returns = [];
      for (let j = 0; j < 252; j++) { // 1 year of daily returns
        returns.push((Math.random() - 0.5) * volatility / Math.sqrt(252));
      }
      
      assets.push({
        symbol,
        expectedReturn,
        volatility,
        returns
      });
    }
    
    return assets;
  };

  const createProgressCallback = useCallback((): ProgressCallback => {
    return (task: WebWorkerTask) => {
      setActiveTasks(prev => {
        const index = prev.findIndex(t => t.id === task.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = task;
          return updated;
        } else {
          return [...prev, task];
        }
      });

      // Remove completed/error tasks after a delay
      if (task.status === 'completed' || task.status === 'error') {
        setTimeout(() => {
          setActiveTasks(prev => prev.filter(t => t.id !== task.id));
          
          // Add to completed tests
          if (task.type === 'PORTFOLIO_OPTIMIZATION' || task.type === 'EFFICIENT_FRONTIER') {
            setCompletedTests(prev => [...prev, {
              scenario: task.type,
              duration: task.endTime ? task.endTime - task.startTime : 0,
              success: task.status === 'completed',
              error: task.error?.message
            }]);
          }
        }, 3000);
      }
    };
  }, []);

  const runPortfolioOptimization = async (scenario: TestScenario, method: 'min_variance' | 'max_sharpe') => {
    if (!workerReady) {
      alert('Web Worker not ready');
      return;
    }

    try {
      const assets = generateMockAssets(scenario.assetCount);
      const progressCallback = createProgressCallback();

      console.log(`🚀 Starting ${method} optimization with ${scenario.assetCount} assets...`);

      const result = await webWorkerService.optimizePortfolio({
        assets,
        method,
        constraints: {
          minWeight: 0.0,
          maxWeight: 0.25
        },
        riskFreeRate: 0.02
      }, progressCallback);

      console.log('✅ Optimization completed:', {
        processingTime: `${result.processingTime.toFixed(2)}ms`,
        expectedReturn: `${(result.metrics.expectedReturn * 100).toFixed(2)}%`,
        volatility: `${(result.metrics.volatility * 100).toFixed(2)}%`,
        sharpeRatio: result.metrics.sharpeRatio.toFixed(3)
      });

    } catch (error) {
      console.error('❌ Optimization failed:', (error));
    }
  };

  const runEfficientFrontier = async () => {
    if (!workerReady) {
      alert('Web Worker not ready');
      return;
    }

    try {
      const assets = generateMockAssets(30);
      const progressCallback = createProgressCallback();

      console.log('🚀 Starting efficient frontier calculation...');

      const result = await webWorkerService.calculateEfficientFrontier({
        assets,
        numPoints: 100,
        constraints: {
          minWeight: 0.0,
          maxWeight: 0.25
        }
      }, progressCallback);

      console.log('✅ Efficient frontier completed:', {
        processingTime: `${result.processingTime.toFixed(2)}ms`,
        numPoints: result.numPoints,
        frontierRange: `Risk: ${(result.frontierPoints[0]?.risk * 100).toFixed(2)}% - ${(result.frontierPoints[result.frontierPoints.length - 1]?.risk * 100).toFixed(2)}%`
      });

    } catch (error) {
      console.error('❌ Efficient frontier failed:', (error));
    }
  };

  const runMatrixInversion = async () => {
    if (!workerReady) {
      alert('Web Worker not ready');
      return;
    }

    try {
      // Generate a random positive definite matrix
      const size = 20;
      const matrix = Array(size).fill(null).map(() => Array(size).fill(0));
      
      // Create symmetric positive definite matrix
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (i === j) {
            matrix[i][j] = 1 + Math.random(); // Diagonal dominance
          } else {
            const value = (Math.random() - 0.5) * 0.5;
            matrix[i][j] = value;
            matrix[j][i] = value; // Symmetric
          }
        }
      }

      const progressCallback = createProgressCallback();

      console.log('🚀 Starting matrix inversion...');

      const result = await webWorkerService.invertMatrix({
        matrix,
        regularization: 0.001
      }, progressCallback);

      console.log('✅ Matrix inversion completed:', {
        processingTime: `${result.processingTime.toFixed(2)}ms`,
        matrixSize: `${size}x${size}`
      });

    } catch (error) {
      console.error('❌ Matrix inversion failed:', (error));
    }
  };

  const clearCompletedTests = () => {
    setCompletedTests([]);
    webWorkerService.cleanupTasks();
  };

  const getComplexityBadgeColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ⚡ Web Workers Performance Tester
        </h2>
        <p className="text-gray-600 mb-6">
          Test matrix operations running in Web Workers with real-time progress reporting.
          This ensures UI remains responsive during intensive calculations.
        </p>

        {/* Worker Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Worker Status</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              workerReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isInitializing ? 'Initializing...' : workerReady ? 'Ready' : 'Not Ready'}
            </div>
          </div>

          {workerStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Tasks:</span>
                <div className="font-semibold">{workerStats.totalTasks}</div>
              </div>
              <div>
                <span className="text-gray-500">Completed:</span>
                <div className="font-semibold text-green-600">{workerStats.completedTasks}</div>
              </div>
              <div>
                <span className="text-gray-500">Errors:</span>
                <div className="font-semibold text-red-600">{workerStats.errorTasks}</div>
              </div>
              <div>
                <span className="text-gray-500">Running:</span>
                <div className="font-semibold text-blue-600">{workerStats.runningTasks}</div>
              </div>
              <div>
                <span className="text-gray-500">Avg Time:</span>
                <div className="font-semibold">{formatDuration(workerStats.averageProcessingTime)}</div>
              </div>
            </div>
          )}

          {!workerReady && !isInitializing && (
            <button
              onClick={initializeWorker}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Initialize Worker
            </button>
          )}
        </div>

        {/* Test Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {TEST_SCENARIOS.map((scenario) => (
            <div key={scenario.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{scenario.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityBadgeColor(scenario.complexity)}`}>
                  {scenario.complexity}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {scenario.id === 'efficient_frontier' ? (
                  <button
                    onClick={runEfficientFrontier}
                    disabled={!workerReady}
                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Run Frontier
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => runPortfolioOptimization(scenario, 'min_variance')}
                      disabled={!workerReady}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Min Variance
                    </button>
                    <button
                      onClick={() => runPortfolioOptimization(scenario, 'max_sharpe')}
                      disabled={!workerReady}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Max Sharpe
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Matrix Operations */}
        <div className="border rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Matrix Operations</h4>
          <p className="text-sm text-gray-600 mb-4">Test individual matrix operations</p>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={runMatrixInversion}
              disabled={!workerReady}
              className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Matrix Inversion (20×20)
            </button>
          </div>
        </div>

        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Tasks</h3>
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{task.type.replace('_', ' ')}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'error' ? 'bg-red-100 text-red-800' :
                      task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{task.message}</span>
                      <span className="font-medium">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {task.status === 'running' && (
                    <button
                      onClick={() => webWorkerService.cancelTask(task.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Cancel Task
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tests */}
        {completedTests.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Test Results</h3>
              <button
                onClick={clearCompletedTests}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Results
              </button>
            </div>
            
            <div className="space-y-2">
              {completedTests.slice(-10).reverse().map((test) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border-l-4 border-l-blue-500">
                  <div>
                    <span className="font-medium text-sm">{test.scenario.replace('_', ' ')}</span>
                    {test.error && (
                      <span className="text-red-600 text-xs ml-2">({test.error})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{formatDuration(test.duration)}</span>
                    <span className={`w-3 h-3 rounded-full ${test.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

