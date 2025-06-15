import React, { useMemo, useState } from 'react';
import {
    PortfolioOptimizationEngine, type AssetData,
    type PortfolioConstraints,
    type PortfolioResult
} from '../services/PortfolioOptimizationEngine';

const PortfolioOptimizationTester: React.FC = () => {
  const [results, setResults] = useState<{
    minVariance?: PortfolioResult;
    maxSharpe?: PortfolioResult;
    processingTime?: number;
  }>({});

  // Genera dati di test sintetici
  function generateSyntheticReturns(length: number, expectedReturn: number, volatility: number): number[] {
    const returns: number[] = [];
    const dailyReturn = expectedReturn / 252;
    const dailyVol = volatility / Math.sqrt(252);
    
    for (let i = 0; i < length; i++) {
      const randomShock = (Math.random() - 0.5) * 2;
      const dayReturn = dailyReturn + dailyVol * randomShock;
      returns.push(dayReturn);
    }
    
    return returns;
  }

  const testAssets = useMemo((): AssetData[] => [
    {
      symbol: "STOCKS",
      name: "Stock Index",
      expectedReturn: 0.08,
      volatility: 0.15,
      returns: generateSyntheticReturns(252, 0.08, 0.15)
    },
    {
      symbol: "BONDS",
      name: "Bond Index", 
      expectedReturn: 0.04,
      volatility: 0.05,
      returns: generateSyntheticReturns(252, 0.04, 0.05)
    },
    {
      symbol: "REITS",
      name: "Real Estate",
      expectedReturn: 0.06,
      volatility: 0.18,
      returns: generateSyntheticReturns(252, 0.06, 0.18)
    }
  ], []);

  const constraints: PortfolioConstraints = {
    sumWeights: 1.0,
    minWeight: 0.0,
    maxWeight: 1.0
  };

  const runOptimization = async () => {
    const startTime = performance.now();

    try {
      console.log('🚀 Starting Portfolio Optimization Test...');

      const minVarianceResult = PortfolioOptimizationEngine.calculateMinimumVariancePortfolio(
        testAssets,
        constraints
      );

      const maxSharpeResult = PortfolioOptimizationEngine.calculateMaximumSharpePortfolio(
        testAssets,
        constraints
      );

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      setResults({
        minVariance: minVarianceResult || undefined,
        maxSharpe: maxSharpeResult || undefined,
        processingTime
      });

    } catch (error) {
      console.error('❌ Portfolio Optimization failed:', (error));
      setResults({});
    }
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatWeight = (weight: number): string => {
    return `${(weight * 100).toFixed(1)}%`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎯 Portfolio Optimization Tester
        </h1>
        <p className="text-gray-600 mb-6">
          Test del motore di ottimizzazione Markowitz per portfolio optimization.
        </p>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Test Assets ({testAssets.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testAssets.map((asset) => (
              <div key={asset.symbol} className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-900">{asset.symbol}</div>
                <div className="text-sm text-gray-600">{asset.name}</div>
                <div className="mt-2 space-y-1">
                  <div className="text-xs">
                    <span className="text-gray-500">Return:</span>
                    <span className="ml-1 font-medium text-green-600">
                      {formatPercentage(asset.expectedReturn)}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Risk:</span>
                    <span className="ml-1 font-medium text-red-600">
                      {formatPercentage(asset.volatility)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={runOptimization}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          🚀 Run Portfolio Optimization
        </button>
      </div>

      {(results.minVariance || results.maxSharpe) && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              📊 Optimization Results
            </h2>
            {results.processingTime && (
              <div className="text-sm text-gray-500">
                ⏱️ {results.processingTime.toFixed(2)}ms
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {results.minVariance && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  📉 Minimum Variance Portfolio
                </h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Expected Return:</span>
                    <span className="font-medium text-green-600">
                      {formatPercentage(results.minVariance.expectedReturn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Volatility:</span>
                    <span className="font-medium text-red-600">
                      {formatPercentage(results.minVariance.volatility)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Sharpe Ratio:</span>
                    <span className="font-medium text-purple-600">
                      {results.minVariance.sharpeRatio.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-blue-700 mb-2">
                    Allocation:
                  </div>
                  {results.minVariance.assets.map((asset) => (
                    <div key={asset.symbol} className="flex justify-between text-sm">
                      <span className="text-gray-700">{asset.symbol}:</span>
                      <span className="font-medium">
                        {formatWeight(asset.weight)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.maxSharpe && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  📈 Maximum Sharpe Portfolio
                </h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-green-700">Expected Return:</span>
                    <span className="font-medium text-green-600">
                      {formatPercentage(results.maxSharpe.expectedReturn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Volatility:</span>
                    <span className="font-medium text-red-600">
                      {formatPercentage(results.maxSharpe.volatility)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Sharpe Ratio:</span>
                    <span className="font-medium text-purple-600">
                      {results.maxSharpe.sharpeRatio.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-green-700 mb-2">
                    Allocation:
                  </div>
                  {results.maxSharpe.assets.map((asset) => (
                    <div key={asset.symbol} className="flex justify-between text-sm">
                      <span className="text-gray-700">{asset.symbol}:</span>
                      <span className="font-medium">
                        {formatWeight(asset.weight)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {results.processingTime && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ⚡ Performance Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {results.processingTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {testAssets.length}
              </div>
              <div className="text-sm text-gray-600">Assets Processed</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {results.processingTime < 1000 ? '✅' : '⚠️'}
              </div>
              <div className="text-sm text-gray-600">Performance</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioOptimizationTester;

