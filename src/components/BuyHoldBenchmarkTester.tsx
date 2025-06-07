/**
 * Buy & Hold Benchmark Tester
 * Comprehensive testing component for buy & hold strategy analysis
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { 
  buyHoldBenchmarkEngine, 
  BuyHoldResult, 
  BuyHoldConfig, 
  AssetData 
} from '../services/BuyHoldBenchmarkEngine';

interface TestResults {
  buyHoldResult?: BuyHoldResult;
  comparisonMetrics?: {
    activeReturn: number;
    trackingError: number;
    informationRatio: number;
    alphaVsBenchmark: number;
    betaVsBenchmark: number;
    winRate: number;
    outperformancePeriods: number;
    totalPeriods: number;
  };
  processingTime?: number;
}

export const BuyHoldBenchmarkTester: React.FC = () => {
  const [results, setResults] = useState<TestResults>({});
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState<BuyHoldConfig>({
    initialInvestment: 100000,
    reinvestDividends: true,
    rebalanceFrequency: 'never',
    transactionCosts: 0.001
  });
  const [testAssets, setTestAssets] = useState<AssetData[]>([]);
  const [selectedTestType, setSelectedTestType] = useState<'sample' | 'custom'>('sample');
  const [customStrategy, setCustomStrategy] = useState<number[]>([]);

  useEffect(() => {
    // Generate sample data on component mount
    generateSampleData();
  }, []);

  const generateSampleData = () => {
    const sampleAssets = buyHoldBenchmarkEngine.generateSampleBuyHoldData();
    setTestAssets(sampleAssets);
    console.log('🎲 Generated sample assets:', sampleAssets.map(a => a.symbol));
  };

  const runBuyHoldTest = async () => {
    if (testAssets.length === 0) {
      console.warn('No test assets available');
      return;
    }

    setIsRunning(true);
    const startTime = performance.now();

    try {
      console.log('🚀 Starting Buy & Hold Benchmark Test...');

      // Run Buy & Hold benchmark
      const buyHoldResult = buyHoldBenchmarkEngine.calculateBuyHoldBenchmark(
        testAssets,
        config
      );

      if (!buyHoldResult) {
        throw new Error('Failed to calculate Buy & Hold benchmark');
      }

      let comparisonMetrics;
      
      // If custom strategy is provided, compare it
      if (customStrategy.length > 0 && customStrategy.length >= buyHoldResult.performance.dailyReturns.length) {
        comparisonMetrics = buyHoldBenchmarkEngine.compareToBenchmark(
          customStrategy,
          buyHoldResult
        );
      }

      const processingTime = performance.now() - startTime;

      setResults({
        buyHoldResult,
        comparisonMetrics,
        processingTime
      });

      console.log('✅ Buy & Hold test completed successfully');

    } catch (error) {
      console.error('❌ Buy & Hold test failed:', (error));
      setResults({});
    } finally {
      setIsRunning(false);
    }
  };

  const generateRandomStrategy = () => {
    if (testAssets.length === 0) return;

    // Generate random daily returns for comparison
    const strategyReturns: number[] = [];
    const length = Math.max(...testAssets.map(asset => asset.returns.length));
    
    for (let i = 0; i < length; i++) {
      // Generate slightly more volatile returns with similar expected return
      const baseReturn = 0.0003; // ~8% annual
      const volatility = 0.025; // ~40% annual volatility
      const randomReturn = baseReturn + (Math.random() - 0.5) * volatility;
      strategyReturns.push(randomReturn);
    }

    setCustomStrategy(strategyReturns);
    console.log('🎲 Generated random strategy with', strategyReturns.length, 'returns');
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatRatio = (value: number): string => {
    return value.toFixed(3);
  };

  const getPerformanceColor = (value: number, threshold: number = 0): string => {
    return value >= threshold ? 'text-green-600' : 'text-red-600';
  };

  const getDrawdownSeverity = (maxDrawdown: number): { label: string; color: string } => {
    if (maxDrawdown < 0.05) return { label: 'Low', color: 'text-green-600' };
    if (maxDrawdown < 0.15) return { label: 'Moderate', color: 'text-yellow-600' };
    if (maxDrawdown < 0.30) return { label: 'High', color: 'text-orange-600' };
    return { label: 'Severe', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📊 Buy & Hold Benchmark Tester
        </h2>
        <p className="text-gray-600 mb-6">
          Test the simplest investment strategy: equal allocation across all assets with no rebalancing.
          This benchmark serves as the baseline for comparing sophisticated portfolio optimization strategies.
        </p>

        {/* Configuration Panel */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Configuration</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Investment
              </label>
              <input
                id="initial-investment"
                type="number"
                value={config.initialInvestment}
                onChange={(e) => setConfig(prev => ({ ...prev, initialInvestment: Number(e.target.value) }))}
                aria-label="Initial Investment Amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="1000"
                step="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Costs (%)
              </label>
              <input
                id="transaction-costs"
                type="number"
                value={config.transactionCosts! * 100}
                onChange={(e) => setConfig(prev => ({ ...prev, transactionCosts: Number(e.target.value) / 100 }))}
                aria-label="Transaction Costs Percentage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="0"
                max="5"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rebalancing Frequency
              </label>
              <select
                id="rebalance-frequency-buy-hold"
                value={config.rebalanceFrequency}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  rebalanceFrequency: e.target.value as any 
                }))}
                aria-label="Rebalancing Frequency"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="never">Never (True Buy & Hold)</option>
                <option value="annually">Annually</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="reinvest-dividends-buy-hold"
                type="checkbox"
                checked={config.reinvestDividends}
                onChange={(e) => setConfig(prev => ({ ...prev, reinvestDividends: e.target.checked }))}
                aria-label="Reinvest Dividends"
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                Reinvest Dividends
              </label>
            </div>
          </div>
        </div>

        {/* Asset Information */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testAssets.map(asset => (
              <div key={asset.symbol} className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-900">{asset.symbol}</div>
                <div className="text-sm text-gray-600">{asset.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Expected Return: {formatPercentage(asset.expectedReturn * 252)}
                </div>
                <div className="text-xs text-gray-500">
                  Volatility: {formatPercentage(asset.volatility * Math.sqrt(252))}
                </div>
                {asset.dividendYield && (
                  <div className="text-xs text-gray-500">
                    Dividend Yield: {formatPercentage(asset.dividendYield)}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 space-x-2">
            <Button onClick={generateSampleData} variant="outline" size="sm">
              Generate New Sample Data
            </Button>
            <Button onClick={generateRandomStrategy} variant="outline" size="sm">
              Generate Random Strategy for Comparison
            </Button>
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex space-x-4 mb-6">
          <Button 
            onClick={runBuyHoldTest}
            disabled={isRunning || testAssets.length === 0}
            className="flex-1"
          >
            {isRunning ? 'Running Buy & Hold Test...' : 'Run Buy & Hold Benchmark'}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {results.buyHoldResult && (
        <div className="space-y-6">
          {/* Performance Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📈 Buy & Hold Performance Summary
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${getPerformanceColor(results.buyHoldResult.performance.totalReturn)}`}>
                  {formatPercentage(results.buyHoldResult.performance.totalReturn)}
                </div>
                <div className="text-sm text-gray-600">Total Return</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${getPerformanceColor(results.buyHoldResult.performance.annualizedReturn)}`}>
                  {formatPercentage(results.buyHoldResult.performance.annualizedReturn)}
                </div>
                <div className="text-sm text-gray-600">Annualized Return</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPercentage(results.buyHoldResult.performance.volatility)}
                </div>
                <div className="text-sm text-gray-600">Volatility</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${getPerformanceColor(results.buyHoldResult.performance.sharpeRatio)}`}>
                  {formatRatio(results.buyHoldResult.performance.sharpeRatio)}
                </div>
                <div className="text-sm text-gray-600">Sharpe Ratio</div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Investment Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Initial Investment:</span>
                    <span className="font-medium">{formatCurrency(config.initialInvestment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Final Value:</span>
                    <span className="font-medium">{formatCurrency(results.buyHoldResult.performance.finalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dividend Income:</span>
                    <span className="font-medium">{formatCurrency(results.buyHoldResult.performance.dividendIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Investment Period:</span>
                    <span className="font-medium">{results.buyHoldResult.metadata.totalDays} days</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Risk Metrics</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Maximum Drawdown:</span>
                    <span className={`font-medium ${getDrawdownSeverity(results.buyHoldResult.performance.maxDrawdown).color}`}>
                      {formatPercentage(results.buyHoldResult.performance.maxDrawdown)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drawdown Severity:</span>
                    <span className={`font-medium ${getDrawdownSeverity(results.buyHoldResult.performance.maxDrawdown).color}`}>
                      {getDrawdownSeverity(results.buyHoldResult.performance.maxDrawdown).label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time to Max DD:</span>
                    <span className="font-medium">{results.buyHoldResult.performance.timeToMaxDrawdown} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recovery Time:</span>
                    <span className="font-medium">{results.buyHoldResult.performance.recoveryTime} days</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Strategy Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Rebalancing:</span>
                    <span className="font-medium">{results.buyHoldResult.config.rebalanceFrequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rebalance Count:</span>
                    <span className="font-medium">{results.buyHoldResult.metadata.rebalanceCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dividend Reinvestment:</span>
                    <span className="font-medium">{config.reinvestDividends ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction Costs:</span>
                    <span className="font-medium">{formatPercentage(config.transactionCosts!)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Final Asset Allocation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.buyHoldResult.positions.map(position => (
                <div key={position.symbol} className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-semibold text-gray-900">{position.symbol}</div>
                  <div className="space-y-1 text-sm mt-2">
                    <div className="flex justify-between">
                      <span>Weight:</span>
                      <span className="font-medium">{formatPercentage(position.weight)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Value:</span>
                      <span className="font-medium">{formatCurrency(position.currentValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shares:</span>
                      <span className="font-medium">{position.shares.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Return:</span>
                      <span className={`font-medium ${getPerformanceColor(position.totalReturn)}`}>
                        {formatPercentage(position.totalReturn)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dividends:</span>
                      <span className="font-medium">{formatCurrency(position.totalDividends)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy Comparison */}
          {results.comparisonMetrics && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">⚖️ Strategy vs Buy & Hold Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className={`text-xl font-bold ${getPerformanceColor(results.comparisonMetrics.activeReturn)}`}>
                    {formatPercentage(results.comparisonMetrics.activeReturn)}
                  </div>
                  <div className="text-sm text-gray-600">Active Return</div>
                  <div className="text-xs text-gray-500 mt-1">vs Buy & Hold</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {formatPercentage(results.comparisonMetrics.trackingError)}
                  </div>
                  <div className="text-sm text-gray-600">Tracking Error</div>
                  <div className="text-xs text-gray-500 mt-1">Volatility of active returns</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className={`text-xl font-bold ${getPerformanceColor(results.comparisonMetrics.informationRatio)}`}>
                    {formatRatio(results.comparisonMetrics.informationRatio)}
                  </div>
                  <div className="text-sm text-gray-600">Information Ratio</div>
                  <div className="text-xs text-gray-500 mt-1">Risk-adjusted active return</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className={`text-xl font-bold ${getPerformanceColor(results.comparisonMetrics.winRate, 0.5)}`}>
                    {formatPercentage(results.comparisonMetrics.winRate)}
                  </div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {results.comparisonMetrics.outperformancePeriods}/{results.comparisonMetrics.totalPeriods} periods
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Alpha & Beta Analysis</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Alpha vs Benchmark:</span>
                      <span className={`font-medium ${getPerformanceColor(results.comparisonMetrics.alphaVsBenchmark)}`}>
                        {formatPercentage(results.comparisonMetrics.alphaVsBenchmark)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Beta vs Benchmark:</span>
                      <span className="font-medium">{formatRatio(results.comparisonMetrics.betaVsBenchmark)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Outperformance Analysis</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Winning Periods:</span>
                      <span className="font-medium">{results.comparisonMetrics.outperformancePeriods}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Periods:</span>
                      <span className="font-medium">{results.comparisonMetrics.totalPeriods}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Stats */}
          {results.processingTime && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">⚡ Processing Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.processingTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-600">Total Processing Time</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {testAssets.length}
                  </div>
                  <div className="text-sm text-gray-600">Assets Processed</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {results.buyHoldResult.metadata.totalDays}
                  </div>
                  <div className="text-sm text-gray-600">Days Simulated</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.processingTime < 1000 ? '✅' : results.processingTime < 5000 ? '⚠️' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">Performance Rating</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuyHoldBenchmarkTester; 

