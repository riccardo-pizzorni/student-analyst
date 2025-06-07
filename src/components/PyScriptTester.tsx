import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useApiNotifications } from './NotificationProvider';
import { pyScriptWrapper, CalculationEngine, PyScriptStatus } from '../utils/PyScriptWrapper';
import { generateSamplePortfolioData } from '../utils/FinancialCalculations';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  engine?: CalculationEngine;
  executionTime?: number;
  fallbackUsed?: boolean;
  error?: string;
  timestamp?: number;
}

export const PyScriptTester: React.FC = () => {
  const [pyScriptStatus, setPyScriptStatus] = useState<PyScriptStatus>(pyScriptWrapper.getStatus());
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [testData, setTestData] = useState(generateSamplePortfolioData());
  
  const { notifyApiError, notifyApiSuccess } = useApiNotifications();

  // Update PyScript status periodically
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setPyScriptStatus(pyScriptWrapper.getStatus());
    }, 1000);

    return () => clearInterval(statusInterval);
  }, []);

  const updateTestResult = (testName: string, updates: Partial<TestResult>) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === testName);
      if (existing) {
        return prev.map(r => r.name === testName ? { ...r, ...updates } : r);
      } else {
        return [...prev, { name: testName, status: 'pending', ...updates }];
      }
    });
  };

  const runPortfolioStatsTest = async (): Promise<void> => {
    const testName = 'Portfolio Statistics';
    updateTestResult(testName, { status: 'running', timestamp: Date.now() });
    
    try {
      const result = await pyScriptWrapper.calculatePortfolioStats(testData.returns);
      
      updateTestResult(testName, {
        status: 'success',
        engine: result.engine,
        executionTime: result.executionTime,
        fallbackUsed: result.fallbackUsed,
        error: result.error
      });
      
      notifyApiSuccess(
        `Portfolio stats test completed: ${result.engine} ${result.fallbackUsed ? '(fallback)' : ''} - ${result.executionTime}ms`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestResult(testName, {
        status: 'error',
        error: errorMessage
      });
      notifyApiError(new Error(errorMessage), 'Portfolio Stats Test');
    }
  };

  const runMonteCarloTest = async (): Promise<void> => {
    const testName = 'Monte Carlo Simulation';
    updateTestResult(testName, { status: 'running', timestamp: Date.now() });
    
    try {
      const result = await pyScriptWrapper.runMonteCarloSimulation(
        testData.initialPrice,
        0.1, // 10% expected return
        0.2, // 20% volatility
        30,  // 30 days
        500  // 500 simulations (faster for testing)
      );
      
      updateTestResult(testName, {
        status: 'success',
        engine: result.engine,
        executionTime: result.executionTime,
        fallbackUsed: result.fallbackUsed,
        error: result.error
      });
      
      notifyApiSuccess(
        `Monte Carlo test completed: ${result.engine} ${result.fallbackUsed ? '(fallback)' : ''} - ${result.executionTime}ms`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestResult(testName, {
        status: 'error',
        error: errorMessage
      });
      notifyApiError(new Error(errorMessage), 'Monte Carlo Test');
    }
  };

  const runErrorHandlingTest = async (): Promise<void> => {
    const testName = 'Error Handling';
    updateTestResult(testName, { status: 'running', timestamp: Date.now() });
    
    try {
      // Test with invalid data to trigger error handling
      const invalidReturns: number[] = [];
      
      try {
        await pyScriptWrapper.calculatePortfolioStats(invalidReturns);
        // Should not reach here
        updateTestResult(testName, {
          status: 'error',
          error: 'Test failed - no error was thrown for invalid data'
        });
      } catch (expectedError) {
        // This is expected behavior
        updateTestResult(testName, {
          status: 'success',
          engine: CalculationEngine.JAVASCRIPT,
          executionTime: 1,
          fallbackUsed: false,
          error: 'Successfully caught invalid input error'
        });
        
        notifyApiSuccess('Error handling test passed - invalid inputs properly rejected');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestResult(testName, {
        status: 'error',
        error: errorMessage
      });
      notifyApiError(new Error(errorMessage), 'Error Handling Test');
    }
  };

  const runPerformanceTest = async (): Promise<void> => {
    const testName = 'Performance Benchmark';
    updateTestResult(testName, { status: 'running', timestamp: Date.now() });
    
    try {
      const startTime = Date.now();
      
      // Run multiple calculations to test performance
      const promises = [
        pyScriptWrapper.calculatePortfolioStats(testData.returns),
        pyScriptWrapper.runMonteCarloSimulation(100, 0.1, 0.2, 15, 100)
      ];
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      const allWithinBenchmark = results.every(result => {
        const perfInfo = pyScriptWrapper.getPerformanceInfo(
          result.data.source === 'pyscript' ? 'portfolio_stats' : 'monte_carlo',
          result.engine,
          result.executionTime
        );
        return perfInfo.isWithinBenchmark;
      });
      
      updateTestResult(testName, {
        status: allWithinBenchmark ? 'success' : 'error',
        engine: results[0].engine,
        executionTime: totalTime,
        fallbackUsed: results.some(r => r.fallbackUsed),
        error: allWithinBenchmark ? undefined : 'Some calculations exceeded performance benchmarks'
      });
      
      if (allWithinBenchmark) {
        notifyApiSuccess(`Performance test passed - all calculations within benchmarks (${totalTime}ms total)`);
      } else {
        notifyApiError(new Error('Performance benchmarks not met'), 'Performance Test');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestResult(testName, {
        status: 'error',
        error: errorMessage
      });
      notifyApiError(new Error(errorMessage), 'Performance Test');
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    setTestResults([]); // Clear previous results
    
    try {
      await runPortfolioStatsTest();
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
      
      await runMonteCarloTest();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await runErrorHandlingTest();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await runPerformanceTest();
      
      notifyApiSuccess('All PyScript error handling tests completed');
    } catch (error) {
      notifyApiError(new Error('Test suite execution failed'), 'Test Suite');
    } finally {
      setIsRunningAll(false);
    }
  };

  const generateNewTestData = () => {
    setTestData(generateSamplePortfolioData());
    notifyApiSuccess('New test data generated');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getEngineIcon = (engine?: CalculationEngine, fallbackUsed?: boolean) => {
    if (fallbackUsed) return '🔄';
    switch (engine) {
      case CalculationEngine.PYSCRIPT: return '🐍';
      case CalculationEngine.JAVASCRIPT: return '⚡';
      default: return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          🧪 PyScript Error Handling Tester
        </h2>
        <p className="text-gray-600">
          Test PyScript calculations with automatic JavaScript fallback
        </p>
      </div>

      {/* PyScript Status */}
      <div className="bg-white p-4 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-3">🔍 System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg ${
            pyScriptStatus.isReady ? 'bg-green-50 border-green-200' : 
            pyScriptStatus.isAvailable ? 'bg-yellow-50 border-yellow-200' : 
            'bg-red-50 border-red-200'
          } border`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">PyScript</span>
              <span className="text-2xl">
                {pyScriptStatus.isReady ? '🐍✅' : 
                 pyScriptStatus.isAvailable ? '🐍⏳' : '🐍❌'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {pyScriptStatus.isReady ? 'Ready' : 
               pyScriptStatus.isAvailable ? 'Loading...' : 'Unavailable'}
            </p>
            {pyScriptStatus.error && (
              <p className="text-xs text-red-600 mt-1">{pyScriptStatus.error}</p>
            )}
          </div>
          
          <div className="p-3 rounded-lg bg-blue-50 border-blue-200 border">
            <div className="flex items-center justify-between">
              <span className="font-medium">JavaScript Fallback</span>
              <span className="text-2xl">⚡✅</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Always Ready</p>
          </div>
          
          <div className="p-3 rounded-lg bg-gray-50 border-gray-200 border">
            <div className="flex items-center justify-between">
              <span className="font-medium">Test Data</span>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {testData.returns.length} returns, {testData.prices.length} prices
            </p>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="bg-white p-4 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-3">🎮 Test Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button onClick={runPortfolioStatsTest} disabled={isRunningAll} variant="outline">
            📊 Portfolio Stats
          </Button>
          <Button onClick={runMonteCarloTest} disabled={isRunningAll} variant="outline">
            🎲 Monte Carlo
          </Button>
          <Button onClick={runErrorHandlingTest} disabled={isRunningAll} variant="outline">
            ⚠️ Error Handling
          </Button>
          <Button onClick={runPerformanceTest} disabled={isRunningAll} variant="outline">
            ⚡ Performance
          </Button>
          <Button onClick={generateNewTestData} disabled={isRunningAll} variant="outline">
            🔄 New Data
          </Button>
          <Button 
            onClick={runAllTests} 
            disabled={isRunningAll}
            className="md:col-span-1"
          >
            {isRunningAll ? '🔄 Running...' : '🚀 Run All Tests'}
          </Button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-3">📋 Test Results</h3>
          <div className="space-y-3">
            {testResults.map((result) => (
              <div key={index} className={`p-3 rounded-lg border ${
                result.status === 'success' ? 'bg-green-50 border-green-200' :
                result.status === 'error' ? 'bg-red-50 border-red-200' :
                result.status === 'running' ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(result.status)}</span>
                    <span className="font-medium">{result.name}</span>
                    {result.engine && (
                      <span className="text-xs bg-white px-2 py-1 rounded">
                        {getEngineIcon(result.engine, result.fallbackUsed)} {result.engine.toUpperCase()}
                        {result.fallbackUsed && ' (Fallback)'}
                      </span>
                    )}
                  </div>
                  {result.executionTime && (
                    <span className="text-sm text-gray-600">{result.executionTime}ms</span>
                  )}
                </div>
                {result.error && (
                  <p className="text-sm text-gray-600 mt-1">{result.error}</p>
                )}
                {result.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2 text-gray-800">📝 Test Information:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Portfolio Stats Test:</strong> Calculates mean return, volatility, and Sharpe ratio</li>
          <li>• <strong>Monte Carlo Test:</strong> Runs price simulation with 500 paths over 30 days</li>
          <li>• <strong>Error Handling Test:</strong> Verifies proper validation of invalid inputs</li>
          <li>• <strong>Performance Test:</strong> Checks if calculations meet benchmark requirements</li>
          <li>• All tests automatically fall back to JavaScript if PyScript fails</li>
          <li>• Performance benchmarks: Portfolio ≤100ms, Monte Carlo ≤500ms</li>
        </ul>
      </div>
    </div>
  );
}; 

