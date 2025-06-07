/**
 * MomentumStrategyTester - Componente per test Strategia Momentum
 * 
 * Interfaccia utente professionale per testare la strategia momentum 12-1 mesi
 * con controlli interattivi e visualizzazione dettagliata delle performance.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { MomentumStrategyEngine } from '../services/MomentumStrategyEngine';

interface MomentumConfig {
  initialInvestment: number;
  topPercentile: number;
  momentumLookback: number;
  skipMonths: number;
  rebalanceFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  equalWeight: boolean;
  maxPositions?: number;
  minMomentumScore?: number;
  volatilityThreshold?: number;
  maxDrawdownThreshold?: number;
  transactionCosts: {
    fixedCostPerTrade: number;
    variableCostRate: number;
  };
  reinvestDividends: boolean;
}

interface AssetData {
  symbol: string;
  name: string;
  prices: number[];
  returns: number[];
  dates: string[];
  dividendYield?: number;
  sector?: string;
  marketCap?: number;
}

export const MomentumStrategyTester: React.FC = () => {
  // Configuration state
  const [config, setConfig] = useState<MomentumConfig>({
    initialInvestment: 100000,
    topPercentile: 0.3,
    momentumLookback: 12,
    skipMonths: 1,
    rebalanceFrequency: 'quarterly',
    equalWeight: true,
    maxPositions: 10,
    minMomentumScore: -0.5,
    volatilityThreshold: 0.4,
    maxDrawdownThreshold: 0.3,
    transactionCosts: {
      fixedCostPerTrade: 5.0,
      variableCostRate: 0.001
    },
    reinvestDividends: true
  });

  const [results, setResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample portfolio data
  const sampleAssets: AssetData[] = useMemo(() => {
    const generateReturns = (meanReturn: number, volatility: number, trend: number = 0): number[] => {
      const returns: number[] = [];
      for (let i = 0; i < 756; i++) { // ~3 years of daily data
        const momentum = trend * Math.exp(-i / 252); // Fading momentum effect
        const randomReturn = (Math.random() - 0.5) * volatility * 2 + meanReturn / 252 + momentum / 252;
        returns.push(randomReturn);
      }
      return returns;
    };

    const generatePrices = (returns: number[], startPrice: number = 100): number[] => {
      const prices = [startPrice];
      for (let i = 0; i < returns.length; i++) {
        prices.push(prices[prices.length - 1] * (1 + returns[i]));
      }
      return prices;
    };

    const generateDates = (count: number): string[] => {
      const dates: string[] = [];
      const startDate = new Date(2021, 0, 1);
      for (let i = 0; i < count; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      return dates;
    };

    return [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        returns: generateReturns(0.15, 0.25, 0.1), // Strong momentum
        prices: generatePrices(generateReturns(0.15, 0.25, 0.1), 150),
        dates: generateDates(756),
        dividendYield: 0.006,
        sector: 'Technology',
        marketCap: 3000000000000
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        returns: generateReturns(0.12, 0.28, 0.08), // Good momentum
        prices: generatePrices(generateReturns(0.12, 0.28, 0.08), 2800),
        dates: generateDates(756),
        dividendYield: 0.0,
        sector: 'Technology',
        marketCap: 1800000000000
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        returns: generateReturns(0.14, 0.24, 0.06), // Steady momentum
        prices: generatePrices(generateReturns(0.14, 0.24, 0.06), 330),
        dates: generateDates(756),
        dividendYield: 0.008,
        sector: 'Technology',
        marketCap: 2800000000000
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        returns: generateReturns(0.10, 0.32, 0.04), // Moderate momentum
        prices: generatePrices(generateReturns(0.10, 0.32, 0.04), 3300),
        dates: generateDates(756),
        dividendYield: 0.0,
        sector: 'Consumer Discretionary',
        marketCap: 1700000000000
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        returns: generateReturns(0.08, 0.45, 0.02), // Low recent momentum, high volatility
        prices: generatePrices(generateReturns(0.08, 0.45, 0.02), 800),
        dates: generateDates(756),
        dividendYield: 0.0,
        sector: 'Consumer Discretionary',
        marketCap: 800000000000
      },
      {
        symbol: 'JPM',
        name: 'JPMorgan Chase & Co.',
        returns: generateReturns(0.07, 0.22, -0.02), // Slight negative momentum
        prices: generatePrices(generateReturns(0.07, 0.22, -0.02), 150),
        dates: generateDates(756),
        dividendYield: 0.025,
        sector: 'Financials',
        marketCap: 450000000000
      },
      {
        symbol: 'JNJ',
        name: 'Johnson & Johnson',
        returns: generateReturns(0.06, 0.15, -0.01), // Low momentum, defensive
        prices: generatePrices(generateReturns(0.06, 0.15, -0.01), 170),
        dates: generateDates(756),
        dividendYield: 0.027,
        sector: 'Healthcare',
        marketCap: 450000000000
      },
      {
        symbol: 'BND',
        name: 'Vanguard Total Bond Market ETF',
        returns: generateReturns(0.02, 0.08, -0.03), // Negative momentum in bonds
        prices: generatePrices(generateReturns(0.02, 0.08, -0.03), 85),
        dates: generateDates(756),
        dividendYield: 0.022,
        sector: 'Bonds',
        marketCap: 300000000000
      }
    ];
  }, []);

  const calculateMomentumStrategy = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
    setResults(null);

    try {
      const engine = MomentumStrategyEngine.getInstance();
      const result = engine.calculateMomentumStrategy(sampleAssets, config);

      if (result) {
        setResults(result);
        console.log('✅ Momentum Strategy Results:', result);
      } else {
        setError('Failed to calculate momentum strategy');
      }
    } catch (_err) {
      console.error('❌ Error calculating momentum strategy:', _err);
      setError(_err instanceof Error ? _err.message : 'Unknown error occurred');
    } finally {
      setIsCalculating(false);
    }
  }, [sampleAssets, config]);

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTransactionCostChange = (field: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      transactionCosts: {
        ...prev.transactionCosts,
        [field]: value
      }
    }));
  };

  // Helper functions for formatting
  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(2) + '%';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toFixed(decimals);
  };

  const formatRatio = (value: number): string => {
    if (Math.abs(value) > 1000) return value > 0 ? '∞' : '-∞';
    return value.toFixed(3);
  };

  const getPerformanceColor = (value: number): string => {
    if (value > 0.05) return 'text-green-600';
    if (value < -0.05) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMomentumColor = (score: number): string => {
    if (score > 0.1) return 'text-green-600';
    if (score < -0.1) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🚀 Momentum Strategy Tester
        </h1>
        <p className="text-lg text-gray-600">
          Test the classic 12-1 month momentum strategy with ranking, selection logic, and turnover analysis
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Strategy Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">💰 Investment Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Investment
              </label>
              <input
                id="initial-investment-momentum"
                type="number"
                min="1000"
                max="10000000"
                step="1000"
                value={config.initialInvestment}
                onChange={(e) => handleConfigChange('initialInvestment', Number(e.target.value))}
                aria-label="Initial Investment Amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Top Percentile ({formatPercentage(config.topPercentile)})
              </label>
              <input
                id="top-percentile"
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={config.topPercentile}
                onChange={(e) => handleConfigChange('topPercentile', Number(e.target.value))}
                aria-label={`Top Percentile: ${formatPercentage(config.topPercentile)}`}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                Select top {formatPercentage(config.topPercentile)} momentum stocks
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Positions
              </label>
              <input
                id="max-positions"
                type="number"
                min="3"
                max="20"
                value={config.maxPositions}
                onChange={(e) => handleConfigChange('maxPositions', Number(e.target.value))}
                aria-label="Maximum Number of Positions"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Momentum Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">📈 Momentum Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Momentum Lookback (Months)
              </label>
              <input
                id="momentum-lookback"
                type="number"
                min="6"
                max="24"
                value={config.momentumLookback}
                onChange={(e) => handleConfigChange('momentumLookback', Number(e.target.value))}
                aria-label="Momentum Lookback Period in Months"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skip Months (Recent)
              </label>
              <input
                id="skip-months"
                type="number"
                min="0"
                max="3"
                value={config.skipMonths}
                onChange={(e) => handleConfigChange('skipMonths', Number(e.target.value))}
                aria-label="Skip Recent Months"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rebalance Frequency
              </label>
              <select
                id="rebalance-frequency-momentum"
                value={config.rebalanceFrequency}
                onChange={(e) => handleConfigChange('rebalanceFrequency', e.target.value)}
                aria-label="Rebalance Frequency"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi-annual">Semi-Annual</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="equalWeight"
                checked={config.equalWeight}
                onChange={(e) => handleConfigChange('equalWeight', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="equalWeight" className="text-sm text-gray-700">
                Equal Weight Portfolio
              </label>
            </div>
          </div>

          {/* Risk & Cost Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">⚖️ Risk & Costs</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Momentum Score
              </label>
              <input
                id="min-momentum-score"
                type="number"
                min="-1"
                max="0"
                step="0.1"
                value={config.minMomentumScore}
                onChange={(e) => handleConfigChange('minMomentumScore', Number(e.target.value))}
                aria-label="Minimum Momentum Score"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixed Cost per Trade ($)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                id="fixed-cost-per-trade"
                aria-label="Fixed Cost per Trade"
                placeholder="Enter fixed cost per trade"
                value={config.transactionCosts.fixedCostPerTrade}
                onChange={(e) => handleTransactionCostChange('fixedCostPerTrade', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variable Cost Rate ({formatPercentage(config.transactionCosts.variableCostRate)})
              </label>
              <input
                id="variable-cost-rate"
                type="range"
                min="0"
                max="0.01"
                step="0.0001"
                value={config.transactionCosts.variableCostRate}
                onChange={(e) => handleTransactionCostChange('variableCostRate', Number(e.target.value))}
                aria-label={`Variable Cost Rate: ${formatPercentage(config.transactionCosts.variableCostRate)}`}
                className="w-full"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="reinvestDividends"
                checked={config.reinvestDividends}
                onChange={(e) => handleConfigChange('reinvestDividends', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="reinvestDividends" className="text-sm text-gray-700">
                Reinvest Dividends
              </label>
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <div className="mt-6 text-center">
          <button
            onClick={calculateMomentumStrategy}
            disabled={isCalculating}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating ? '🔄 Calculating...' : '🚀 Calculate Momentum Strategy'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {(error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-2">❌</span>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
              <p className="text-red-700">{(error)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          {/* Performance Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📊 Momentum Strategy Performance
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${getPerformanceColor(results.performance.totalReturn)}`}>
                  {formatPercentage(results.performance.totalReturn)}
                </div>
                <div className="text-sm text-gray-600">Total Return</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${getPerformanceColor(results.performance.annualizedReturn)}`}>
                  {formatPercentage(results.performance.annualizedReturn)}
                </div>
                <div className="text-sm text-gray-600">Annualized Return</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPercentage(results.performance.volatility)}
                </div>
                <div className="text-sm text-gray-600">Volatility</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${getPerformanceColor(results.performance.sharpeRatio)}`}>
                  {formatRatio(results.performance.sharpeRatio)}
                </div>
                <div className="text-sm text-gray-600">Sharpe Ratio</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-red-600">
                  {formatPercentage(Math.abs(results.performance.maxDrawdown))}
                </div>
                <div className="text-sm text-gray-600">Max Drawdown</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className={`text-xl font-bold ${getMomentumColor(results.performance.averageMomentumScore)}`}>
                  {formatPercentage(results.performance.averageMomentumScore)}
                </div>
                <div className="text-sm text-gray-600">Avg Momentum Score</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-orange-600">
                  {formatPercentage(results.performance.turnoverRate)}
                </div>
                <div className="text-sm text-gray-600">Annual Turnover</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-purple-600">
                  {formatNumber(results.performance.averagePositions, 1)}
                </div>
                <div className="text-sm text-gray-600">Avg Positions</div>
              </div>
            </div>
          </div>

          {/* Momentum Analysis */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🏃‍♂️ Momentum Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-green-600">
                  {formatNumber(results.performance.momentumConsistency, 2)}
                </div>
                <div className="text-sm text-gray-600">Momentum Consistency</div>
                <div className="text-xs text-gray-500 mt-1">Higher = more stable</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-blue-600">
                  {formatNumber(results.performance.averageHoldingPeriod, 0)} days
                </div>
                <div className="text-sm text-gray-600">Avg Holding Period</div>
                <div className="text-xs text-gray-500 mt-1">Position duration</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-purple-600">
                  {formatPercentage(results.performance.winRate)}
                </div>
                <div className="text-sm text-gray-600">Win Rate</div>
                <div className="text-xs text-gray-500 mt-1">% of positive periods</div>
              </div>
            </div>
          </div>

          {/* Transaction Cost Analysis */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">💸 Transaction Cost Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(results.performance.totalTransactionCosts)}
                </div>
                <div className="text-sm text-gray-600">Total Transaction Costs</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-orange-600">
                  {formatPercentage(results.performance.transactionCostImpact)}
                </div>
                <div className="text-sm text-gray-600">Cost Impact</div>
                <div className="text-xs text-gray-500 mt-1">As % of returns</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-yellow-600">
                  {formatCurrency(results.performance.costPerTrade)}
                </div>
                <div className="text-sm text-gray-600">Cost per Trade</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-blue-600">
                  {results.metadata.rebalanceCount}
                </div>
                <div className="text-sm text-gray-600">Total Rebalances</div>
              </div>
            </div>
          </div>

          {/* Current Positions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">💼 Current Portfolio Positions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Symbol</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">Weight</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">Momentum Score</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">Rank</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">Current Value</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">Total Return</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">Holding Period</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.positions.filter((p: any) => p.isActive || p.weight > 0.001).map((position: any) => (
                    <tr key={position.symbol} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{position.symbol}</td>
                      <td className="px-4 py-2 text-center">{formatPercentage(position.weight)}</td>
                      <td className={`px-4 py-2 text-center font-medium ${getMomentumColor(position.momentumScore)}`}>
                        {formatPercentage(position.momentumScore)}
                      </td>
                      <td className="px-4 py-2 text-center">#{position.rank}</td>
                      <td className="px-4 py-2 text-center">{formatCurrency(position.currentValue)}</td>
                      <td className={`px-4 py-2 text-center font-medium ${getPerformanceColor(position.totalReturn)}`}>
                        {formatPercentage(position.totalReturn)}
                      </td>
                      <td className="px-4 py-2 text-center">{position.holdingPeriod} days</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          position.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {position.isActive ? 'Active' : 'Closed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rebalancing History (Last 10 events) */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🔄 Recent Rebalancing Events</h3>
            <div className="space-y-4">
              {results.rebalancingHistory.slice(-5).reverse().map((event: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-gray-900">{event.date}</div>
                    <div className="text-sm text-gray-600">
                      Reason: <span className="font-medium">{event.reason}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Portfolio Value:</span> {formatCurrency(event.portfolioValue)}
                    </div>
                    <div>
                      <span className="font-medium">Turnover:</span> {formatPercentage(event.turnoverRate)}
                    </div>
                    <div>
                      <span className="font-medium">Transaction Costs:</span> {formatCurrency(event.transactionCosts)}
                    </div>
                    <div>
                      <span className="font-medium">Avg Momentum:</span> {formatPercentage(event.averageMomentumScore)}
                    </div>
                  </div>
                  
                  {(event.additions.length > 0 || event.deletions.length > 0) && (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {event.additions.length > 0 && (
                        <div>
                          <span className="font-medium text-green-600">Added:</span> {event.additions.join(', ')}
                        </div>
                      )}
                      {event.deletions.length > 0 && (
                        <div>
                          <span className="font-medium text-red-600">Removed:</span> {event.deletions.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sample Portfolio Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Sample Portfolio Information</h3>
            <p className="text-blue-800 text-sm mb-2">
              This test uses a sample portfolio of {sampleAssets.length} assets with simulated data:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-700">
              {sampleAssets.map(asset => (
                <div key={asset.symbol} className="flex justify-between">
                  <span className="font-medium">{asset.symbol}:</span>
                  <span>{asset.sector}</span>
                </div>
              ))}
            </div>
            <p className="text-blue-600 text-xs mt-2">
              💡 Returns are simulated with different momentum characteristics to demonstrate the strategy's selection logic.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MomentumStrategyTester;


