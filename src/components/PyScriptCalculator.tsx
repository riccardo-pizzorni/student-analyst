import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useApiNotifications } from './NotificationProvider';
import { pyScriptWrapper, CalculationEngine, CalculationResult } from '../utils/PyScriptWrapper';
import { PortfolioStats, MonteCarloResult, formatPercentage, formatCurrency } from '../utils/FinancialCalculations';

interface PerformanceInfo {
  isWithinBenchmark: boolean;
  benchmark: number;
  performance: 'excellent' | 'good' | 'slow' | 'very_slow';
}

export const PyScriptCalculator: React.FC = () => {
  const [pyScriptStatus, setPyScriptStatus] = useState(pyScriptWrapper.getStatus());
  const [isTestVisible, setIsTestVisible] = useState(false);
  const [calculationResults, setCalculationResults] = useState<CalculationResult<PortfolioStats> | null>(null);
  const [monteCarloResults, setMonteCarloResults] = useState<CalculationResult<MonteCarloResult> | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [performanceInfo, setPerformanceInfo] = useState<PerformanceInfo | null>(null);
  
  const { notifyApiError, notifyApiSuccess } = useApiNotifications();

  // Update PyScript status periodically
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setPyScriptStatus(pyScriptWrapper.getStatus());
    }, 2000);

    return () => clearInterval(statusInterval);
  }, []);

  // Cleanup PyScript wrapper on unmount
  useEffect(() => {
    return () => {
      pyScriptWrapper.cleanup();
    };
  }, []);

  const toggleTestVisibility = () => {
    setIsTestVisible(!isTestVisible);
    if (!isTestVisible) {
      const testDiv = document.getElementById('pyscript-test');
      if (testDiv) {
        testDiv.style.display = 'block';
      }
    } else {
      const testDiv = document.getElementById('pyscript-test');
      if (testDiv) {
        testDiv.style.display = 'none';
      }
    }
  };

  const runPortfolioCalculation = async () => {
    setIsCalculating(true);
    
    try {
      const result = await pyScriptWrapper.calculatePortfolioStats();
      setCalculationResults(result);
      
      // Get performance info
      const perfInfo = pyScriptWrapper.getPerformanceInfo(
        'portfolio_stats',
        result.engine,
        result.executionTime
      );
      setPerformanceInfo(perfInfo);
      
      // Show appropriate notification
      if (result.fallbackUsed) {
        notifyApiSuccess(
          `Portfolio analysis completed using JavaScript fallback (${result.executionTime}ms). ${
            result.error ? 'PyScript was unavailable.' : ''
          }`
        );
      } else {
        notifyApiSuccess(
          `Portfolio analysis completed using ${result.engine} (${result.executionTime}ms)`
        );
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';
      notifyApiError(new Error(errorMessage), 'Portfolio Analysis');
      console.error('Portfolio calculation failed:', (error));
    } finally {
      setIsCalculating(false);
    }
  };

  const runMonteCarloSimulation = async () => {
    setIsCalculating(true);
    
    try {
      // Use current portfolio stats if available for better Monte Carlo parameters
      const initialPrice = 100;
      const expectedReturn = calculationResults?.data.mean_return ? 
        calculationResults.data.mean_return / 100 : 0.1;
      const volatility = calculationResults?.data.volatility ? 
        calculationResults.data.volatility / 100 : 0.2;
      
      const result = await pyScriptWrapper.runMonteCarloSimulation(
        initialPrice,
        expectedReturn,
        volatility,
        30, // 30 days
        1000 // 1000 simulations
      );
      
      setMonteCarloResults(result);
      
      // Get performance info
      const perfInfo = pyScriptWrapper.getPerformanceInfo(
        'monte_carlo',
        result.engine,
        result.executionTime
      );
      setPerformanceInfo(perfInfo);
      
      // Show appropriate notification
      if (result.fallbackUsed) {
        notifyApiSuccess(
          `Monte Carlo simulation completed using JavaScript fallback (${result.executionTime}ms). ${
            result.error ? 'PyScript was unavailable.' : ''
          }`
        );
      } else {
        notifyApiSuccess(
          `Monte Carlo simulation completed using ${result.engine} (${result.executionTime}ms)`
        );
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown simulation error';
      notifyApiError(new Error(errorMessage), 'Monte Carlo Simulation');
      console.error('Monte Carlo simulation failed:', (error));
    } finally {
      setIsCalculating(false);
    }
  };

  const getEngineStatusColor = (engine: CalculationEngine | undefined) => {
    if (!engine) return 'bg-gray-100 text-gray-800';
    
    switch (engine) {
      case CalculationEngine.PYSCRIPT:
        return 'bg-green-100 text-green-800';
      case CalculationEngine.JAVASCRIPT:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEngineIcon = (engine: CalculationEngine | undefined, fallbackUsed?: boolean) => {
    if (fallbackUsed) return '🔄';
    
    switch (engine) {
      case CalculationEngine.PYSCRIPT:
        return '🐍';
      case CalculationEngine.JAVASCRIPT:
        return '⚡';
      default:
        return '🤖';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'slow':
        return 'text-yellow-600';
      case 'very_slow':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          🐍 PyScript Financial Calculator
        </h2>
        <p className="text-gray-600">
          Professional financial analysis powered by Python in your browser with JavaScript fallback
        </p>
        
        <div className="flex justify-center items-center space-x-4 flex-wrap gap-2">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            pyScriptStatus.isReady 
              ? 'bg-green-100 text-green-800' 
              : pyScriptStatus.isAvailable
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              pyScriptStatus.isReady ? 'bg-green-500' : 
              pyScriptStatus.isAvailable ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            {pyScriptStatus.isReady ? 'PyScript Ready' : 
             pyScriptStatus.isAvailable ? 'PyScript Loading...' : 'PyScript Unavailable'}
          </div>
          
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
            JavaScript Fallback Ready
          </div>
        </div>
        
        {pyScriptStatus.error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            PyScript Error: {pyScriptStatus.error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            📊 Portfolio Analysis
          </h3>
          
          <Button 
            onClick={runPortfolioCalculation}
            disabled={isCalculating}
            className="w-full mb-4"
          >
            {isCalculating ? 'Calculating...' : 'Run Portfolio Analysis'}
          </Button>
          
          {calculationResults && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Engine Used:</span>
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getEngineStatusColor(calculationResults.engine)}`}>
                  <span className="mr-1">{getEngineIcon(calculationResults.engine, calculationResults.fallbackUsed)}</span>
                  {calculationResults.engine.toUpperCase()}
                  {calculationResults.fallbackUsed && ' (Fallback)'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Return:</span>
                  <span className="font-medium">{formatPercentage(calculationResults.data.mean_return)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volatility:</span>
                  <span className="font-medium">{formatPercentage(calculationResults.data.volatility)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sharpe Ratio:</span>
                  <span className="font-medium">{calculationResults.data.sharpe_ratio.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Execution Time:</span>
                  <span className={`font-medium ${performanceInfo ? getPerformanceColor(performanceInfo.performance) : ''}`}>
                    {calculationResults.executionTime}ms
                    {performanceInfo && ` (${performanceInfo.performance})`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            🎲 Monte Carlo Simulation
          </h3>
          
          <Button 
            onClick={runMonteCarloSimulation}
            disabled={isCalculating || !calculationResults}
            className="w-full mb-4"
            variant="outline"
          >
            {isCalculating ? 'Simulating...' : 'Run Monte Carlo Simulation'}
          </Button>
          
          {!calculationResults && (
            <p className="text-sm text-gray-500 mb-4">
              Run portfolio analysis first to get optimal simulation parameters
            </p>
          )}
          
          {monteCarloResults && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Engine Used:</span>
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getEngineStatusColor(monteCarloResults.engine)}`}>
                  <span className="mr-1">{getEngineIcon(monteCarloResults.engine, monteCarloResults.fallbackUsed)}</span>
                  {monteCarloResults.engine.toUpperCase()}
                  {monteCarloResults.fallbackUsed && ' (Fallback)'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Price:</span>
                  <span className="font-medium">{formatCurrency(monteCarloResults.data.expected_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Range:</span>
                  <span className="font-medium">
                    {formatCurrency(monteCarloResults.data.min_price)} - {formatCurrency(monteCarloResults.data.max_price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">95% CI:</span>
                  <span className="font-medium">
                    {formatCurrency(monteCarloResults.data.confidenceinterval[0])} - {formatCurrency(monteCarloResults.data.confidenceinterval[1])}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Execution Time:</span>
                  <span className={`font-medium ${performanceInfo ? getPerformanceColor(performanceInfo.performance) : ''}`}>
                    {monteCarloResults.executionTime}ms
                    {performanceInfo && ` (${performanceInfo.performance})`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={toggleTestVisibility}
        >
          {isTestVisible ? 'Hide' : 'Show'} PyScript Console Output
        </Button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2 text-gray-800">📝 Calculation Notes:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Portfolio statistics calculated using {pyScriptStatus.isReady ? 'NumPy arrays (PyScript)' : 'JavaScript'} with automatic fallback</li>
          <li>• Monte Carlo simulation with 1,000 price paths over 30 days</li>
          <li>• Sharpe ratio computed as (return - risk_free_rate) / volatility</li>
          <li>• All calculations run client-side with no external dependencies</li>
          <li>• Performance benchmarks: Portfolio ≤100ms, Monte Carlo ≤500ms</li>
          {(calculationResults?.fallbackUsed || monteCarloResults?.fallbackUsed) && (
            <li className="text-blue-600">• JavaScript fallback used - calculations remain accurate but may be slower</li>
          )}
        </ul>
      </div>

      {/* Performance Information Panel */}
      {(calculationResults || monteCarloResults) && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-blue-900">⚡ Performance Information:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {calculationResults && (
              <div>
                <h5 className="font-medium text-blue-800">Portfolio Analysis:</h5>
                <ul className="text-blue-700 space-y-1 mt-1">
                  <li>• Engine: {calculationResults.engine.toUpperCase()}</li>
                  <li>• Time: {calculationResults.executionTime}ms</li>
                  <li>• Status: {calculationResults.fallbackUsed ? 'Fallback Used' : 'Primary Engine'}</li>
                </ul>
              </div>
            )}
            {monteCarloResults && (
              <div>
                <h5 className="font-medium text-blue-800">Monte Carlo Simulation:</h5>
                <ul className="text-blue-700 space-y-1 mt-1">
                  <li>• Engine: {monteCarloResults.engine.toUpperCase()}</li>
                  <li>• Time: {monteCarloResults.executionTime}ms</li>
                  <li>• Status: {monteCarloResults.fallbackUsed ? 'Fallback Used' : 'Primary Engine'}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

 

