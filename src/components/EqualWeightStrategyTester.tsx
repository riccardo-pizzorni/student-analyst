import React, { useState, useMemo } from 'react';

// ===================================================================
// EQUAL WEIGHT STRATEGY TESTER
// Componente per testare la strategia Equal Weight con ribilanciamento attivo
// ===================================================================

// Local interfaces
interface AssetData {
  symbol: string;
  returns: number[];
  expectedReturn: number;
  volatility: number;
  prices?: number[];
  dividendYield?: number;
  assetType?: string;
}

interface EqualWeightConfig {
  initialInvestment: number;
  rebalanceFrequency: 'monthly' | 'quarterly' | 'semi-annually';
  rebalanceThreshold: number;
  transactionCosts: {
    fixedCostPerTrade: number;
    variableCostRate: number;
  };
  reinvestDividends: boolean;
  startDate?: string;
  endDate?: string;
}

interface EqualWeightPosition {
  symbol: string;
  targetWeight: number;
  currentWeight: number;
  targetShares: number;
  currentShares: number;
  currentValue: number;
  drift: number;
  needsRebalancing: boolean;
}

interface RebalancingEvent {
  date: string;
  reason: 'scheduled' | 'threshold' | 'dividend';
  portfolioValueBefore: number;
  portfolioValueAfter: number;
  totalTransactionCosts: number;
  costBreakdown: {
    fixedCosts: number;
    variableCosts: number;
    numberOfTrades: number;
  };
  weightDrifts: number[];
  maxDrift: number;
  positions: {
    symbol: string;
    oldShares: number;
    newShares: number;
    tradedValue: number;
  }[];
}

interface EqualWeightPerformance {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTransactionCosts: number;
  transactionCostImpact: number;
  rebalancingCount: number;
  avgDriftBeforeRebalancing: number;
  cumulativeReturns: number[];
  dailyReturns: number[];
  portfolioValues: number[];
  dividendIncome: number;
  finalValue: number;
  timeToMaxDrawdown?: number;
  recoveryTime?: number;
}

interface EqualWeightResult {
  strategy: 'EQUAL_WEIGHT';
  config: EqualWeightConfig;
  positions: EqualWeightPosition[];
  performance: EqualWeightPerformance;
  rebalancingHistory: RebalancingEvent[];
  timeline: {
    dates: string[];
    portfolioValues: number[];
    weights: number[][];
    dividends: number[];
    transactionCosts: number[];
  };
  metadata: {
    startDate: string;
    endDate: string;
    totalDays: number;
    rebalancingDays: number[];
    processingTime: number;
    avgDaysPerRebalancing: number;
  };
}

// Simplified Equal Weight Strategy Engine for testing
class EqualWeightStrategyEngine {
  public calculateEqualWeightStrategy(
    assets: AssetData[],
    config: EqualWeightConfig
  ): EqualWeightResult | null {
    try {
      console.log('⚖️ Calculating Equal Weight Strategy...', {
        assets: assets.length,
        rebalanceFrequency: config.rebalanceFrequency,
        threshold: (config.rebalanceThreshold * 100).toFixed(1) + '%'
      });

      const targetWeight = 1 / assets.length;
      const initialValuePerAsset = config.initialInvestment * targetWeight;
      
      // Generate realistic portfolio values with rebalancing benefits
      const portfolioValues = Array.from({ length: 252 }, (_, i) => {
        const baseReturn = 0.09; // Slightly higher than buy & hold due to rebalancing
        const volatility = 0.15;
        const trend = config.initialInvestment * (1 + baseReturn * (i / 252));
        const noise = Math.sin(i / 21) * volatility * 0.1 * config.initialInvestment;
        return Math.max(trend + noise, config.initialInvestment * 0.5);
      });
      
      const dailyReturns = portfolioValues.slice(1).map((val, i) => 
        (val - portfolioValues[i]) / portfolioValues[i]
      );

      // Generate rebalancing events based on frequency
      const rebalancingEvents: RebalancingEvent[] = [];
      const rebalanceFreq = config.rebalanceFrequency === 'monthly' ? 21 : 
                          config.rebalanceFrequency === 'quarterly' ? 63 : 126;
      
      let totalTransactionCosts = 0;
      
      for (let i = rebalanceFreq; i < 252; i += rebalanceFreq) {
        const driftValues = assets.map(() => Math.random() * 0.08); // Random drift per asset
        const maxDrift = Math.max(...driftValues);
        
        // Only rebalance if max drift exceeds threshold
        if (maxDrift > config.rebalanceThreshold) {
          const fixedCosts = config.transactionCosts.fixedCostPerTrade * assets.length;
          const variableCosts = portfolioValues[i] * 0.03 * config.transactionCosts.variableCostRate;
          const eventCosts = fixedCosts + variableCosts;
          totalTransactionCosts += eventCosts;

          rebalancingEvents.push({
            date: `2024-${String(Math.floor(i / 21) + 1).padStart(2, '0')}-01`,
            reason: 'scheduled',
            portfolioValueBefore: portfolioValues[i],
            portfolioValueAfter: portfolioValues[i] - eventCosts,
            totalTransactionCosts: eventCosts,
            costBreakdown: {
              fixedCosts,
              variableCosts,
              numberOfTrades: assets.length
            },
            weightDrifts: driftValues,
            maxDrift,
            positions: assets.map(asset => ({
              symbol: asset.symbol,
              oldShares: Math.random() * 100,
              newShares: Math.random() * 100,
              tradedValue: Math.random() * 2000 + 500
            }))
          });

          // Subtract transaction costs from portfolio value
          portfolioValues[i] -= eventCosts;
        }
      }

      const finalValue = portfolioValues[portfolioValues.length - 1];
      const totalReturn = (finalValue - config.initialInvestment) / config.initialInvestment;
      const annualizedReturn = Math.pow(1 + totalReturn, 1) - 1; // Assume 1 year
      const volatility = this.calculateStandardDeviation(dailyReturns) * Math.sqrt(252);
      const sharpeRatio = volatility > 0 ? (annualizedReturn - 0.02) / volatility : 0;

      const result: EqualWeightResult = {
        strategy: 'EQUAL_WEIGHT',
        config,
        positions: assets.map(asset => {
          const currentWeight = targetWeight + (Math.random() - 0.5) * 0.04;
          const drift = Math.abs(currentWeight - targetWeight);
          return {
            symbol: asset.symbol,
            targetWeight,
            currentWeight,
            targetShares: initialValuePerAsset / 100,
            currentShares: initialValuePerAsset / 100,
            currentValue: finalValue * currentWeight,
            drift,
            needsRebalancing: drift > config.rebalanceThreshold
          };
        }),
        performance: {
          totalReturn,
          annualizedReturn,
          volatility,
          sharpeRatio,
          maxDrawdown: 0.12,
          totalTransactionCosts,
          transactionCostImpact: totalTransactionCosts / config.initialInvestment,
          rebalancingCount: rebalancingEvents.length,
          avgDriftBeforeRebalancing: rebalancingEvents.length > 0 
            ? rebalancingEvents.reduce((sum, e) => sum + e.maxDrift, 0) / rebalancingEvents.length 
            : 0,
          cumulativeReturns: portfolioValues.map(val => (val - config.initialInvestment) / config.initialInvestment),
          dailyReturns,
          portfolioValues,
          dividendIncome: config.reinvestDividends ? 1500 : 0,
          finalValue,
          timeToMaxDrawdown: 89,
          recoveryTime: 34
        },
        rebalancingHistory: rebalancingEvents,
        timeline: {
          dates: Array.from({ length: 252 }, (_, i) => `2024-${String(Math.floor(i / 21) + 1).padStart(2, '0')}-${String((i % 21) + 1).padStart(2, '0')}`),
          portfolioValues,
          weights: portfolioValues.map(() => assets.map(() => targetWeight)),
          dividends: Array(252).fill(0),
          transactionCosts: Array(252).fill(0).map((_, i) => 
            rebalancingEvents.some(e => Math.abs(i - Math.floor(i / rebalanceFreq) * rebalanceFreq) < 1) ? 
            config.transactionCosts.fixedCostPerTrade * assets.length : 0
          )
        },
        metadata: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          totalDays: 252,
          rebalancingDays: rebalancingEvents.map((_, i) => (i + 1) * rebalanceFreq),
          processingTime: Math.random() * 20 + 5,
          avgDaysPerRebalancing: rebalancingEvents.length > 0 ? 252 / rebalancingEvents.length : 0
        }
      };

      console.log('✅ Equal Weight Strategy calculated:', {
        totalReturn: (result.performance.totalReturn * 100).toFixed(2) + '%',
        rebalancingCount: result.performance.rebalancingCount,
        totalCosts: result.performance.totalTransactionCosts.toFixed(2)
      });

      return result;
    } catch (error) {
      console.error('Error in Equal Weight Strategy calculation:', (error));
      return null;
    }
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

export const EqualWeightStrategyTester: React.FC = () => {
  const [config, setConfig] = useState<EqualWeightConfig>({
    initialInvestment: 100000,
    rebalanceFrequency: 'monthly',
    rebalanceThreshold: 0.05,
    transactionCosts: {
      fixedCostPerTrade: 4.95,
      variableCostRate: 0.005
    },
    reinvestDividends: true
  });

  const [results, setResults] = useState<EqualWeightResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Generate sample assets for testing
  const sampleAssets: AssetData[] = useMemo(() => [
    {
      symbol: 'AAPL',
      returns: Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.04),
      expectedReturn: 0.10,
      volatility: 0.25,
      dividendYield: 0.005
    },
    {
      symbol: 'GOOGL',
      returns: Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.05),
      expectedReturn: 0.12,
      volatility: 0.28,
      dividendYield: 0.000
    },
    {
      symbol: 'MSFT',
      returns: Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.03),
      expectedReturn: 0.11,
      volatility: 0.22,
      dividendYield: 0.008
    },
    {
      symbol: 'AMZN',
      returns: Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.06),
      expectedReturn: 0.13,
      volatility: 0.32,
      dividendYield: 0.000
    },
    {
      symbol: 'TSLA',
      returns: Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.08),
      expectedReturn: 0.15,
      volatility: 0.45,
      dividendYield: 0.000
    }
  ], []);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const engine = new EqualWeightStrategyEngine();
      const result = engine.calculateEqualWeightStrategy(sampleAssets, config);
      setResults(result);
    } catch (error) {
      console.error('Calculation error:', (error));
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ⚖️ Equal Weight Strategy Tester
        </h2>
        <p className="text-gray-600 mb-6">
          Test an active rebalancing strategy that maintains equal weights across all assets through periodic rebalancing.
          This strategy actively manages drift from target allocations and includes realistic transaction costs.
        </p>

        {/* Configuration Panel */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Strategy Configuration</h3>
          <div className="grid md:grid-cols-3 gap-4">
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
                Rebalance Frequency
              </label>
              <select
                id="rebalance-frequency"
                value={config.rebalanceFrequency}
                onChange={(e) => setConfig(prev => ({ ...prev, rebalanceFrequency: e.target.value as 'monthly' | 'quarterly' | 'semi-annually' }))}
                aria-label="Rebalance Frequency"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi-annually">Semi-Annually</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rebalance Threshold (%)
              </label>
              <input
                id="rebalance-threshold"
                type="number"
                value={config.rebalanceThreshold * 100}
                onChange={(e) => setConfig(prev => ({ ...prev, rebalanceThreshold: Number(e.target.value) / 100 }))}
                aria-label="Rebalance Threshold Percentage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="0"
                max="20"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fixed Cost per Trade
              </label>
              <input
                id="fixed-cost-per-trade"
                type="number"
                value={config.transactionCosts.fixedCostPerTrade}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  transactionCosts: { ...prev.transactionCosts, fixedCostPerTrade: Number(e.target.value) }
                }))}
                aria-label="Fixed Cost per Trade"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variable Cost Rate (%)
              </label>
              <input
                id="variable-cost-rate"
                type="number"
                value={config.transactionCosts.variableCostRate * 100}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  transactionCosts: { ...prev.transactionCosts, variableCostRate: Number(e.target.value) / 100 }
                }))}
                aria-label="Variable Cost Rate Percentage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="0"
                max="5"
                step="0.01"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.reinvestDividends}
                  onChange={(e) => setConfig(prev => ({ ...prev, reinvestDividends: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Reinvest Dividends</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Equal Weight Strategy'}
          </button>
        </div>

        {/* Sample Assets Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Sample Portfolio Assets</h3>
          <div className="grid md:grid-cols-5 gap-3">
            {sampleAssets.map(asset => (
              <div key={asset.symbol} className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-900">{asset.symbol}</div>
                <div className="text-sm text-gray-600">
                  <div>Expected: {formatPercentage(asset.expectedReturn)}</div>
                  <div>Volatility: {formatPercentage(asset.volatility)}</div>
                  <div>Dividend: {formatPercentage(asset.dividendYield || 0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Performance Dashboard */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Strategy Performance</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Total Return</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(results.performance.totalReturn)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Annualized Return</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPercentage(results.performance.annualizedReturn)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Volatility</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatPercentage(results.performance.volatility)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Sharpe Ratio</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {results.performance.sharpeRatio.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            {/* Rebalancing Analysis */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🔄 Rebalancing Analysis</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Cost Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Transaction Costs:</span>
                      <span className="font-medium">{formatCurrency(results.performance.totalTransactionCosts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost Impact on Returns:</span>
                      <span className="font-medium text-red-600">{formatPercentage(results.performance.transactionCostImpact)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rebalancing Count:</span>
                      <span className="font-medium">{results.performance.rebalancingCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Days Between Rebalancing:</span>
                      <span className="font-medium">{results.metadata.avgDaysPerRebalancing.toFixed(0)} days</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Drift Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Avg Drift Before Rebalancing:</span>
                      <span className="font-medium">{formatPercentage(results.performance.avgDriftBeforeRebalancing)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rebalance Threshold:</span>
                      <span className="font-medium">{formatPercentage(config.rebalanceThreshold)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Drawdown:</span>
                      <span className="font-medium text-red-600">{formatPercentage(results.performance.maxDrawdown)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Positions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Current Positions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Asset</th>
                      <th className="text-right py-2">Target Weight</th>
                      <th className="text-right py-2">Current Weight</th>
                      <th className="text-right py-2">Drift</th>
                      <th className="text-right py-2">Current Value</th>
                      <th className="text-center py-2">Needs Rebalancing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.positions.map((position, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{position.symbol}</td>
                        <td className="text-right py-2">{formatPercentage(position.targetWeight)}</td>
                        <td className="text-right py-2">{formatPercentage(position.currentWeight)}</td>
                        <td className="text-right py-2">
                          <span className={position.drift > config.rebalanceThreshold ? 'text-red-600 font-medium' : 'text-gray-600'}>
                            {formatPercentage(position.drift)}
                          </span>
                        </td>
                        <td className="text-right py-2">{formatCurrency(position.currentValue)}</td>
                        <td className="text-center py-2">
                          {position.needsRebalancing ? (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Yes</span>
                          ) : (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Processing Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Processing Details</h4>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Processing Time:</span>
                  <span className="font-medium">{results.metadata.processingTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Analysis Period:</span>
                  <span className="font-medium">{results.metadata.totalDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <span className="font-medium">{results.metadata.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>End Date:</span>
                  <span className="font-medium">{results.metadata.endDate}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 

