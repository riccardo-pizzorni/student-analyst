import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AlternativeAllocationsEngine, type AssetData, type AllocationResult, type AllocationConstraints } from '@/services/AlternativeAllocationsEngine';

interface TestScenario {
  name: string;
  description: string;
  assets: AssetData[];
  constraints?: AllocationConstraints;
}

const AlternativeAllocationsTester: React.FC = () => {
  const [results, setResults] = useState<{
    equalWeight: AllocationResult | null;
    riskParity: AllocationResult | null;
    minimumCorrelation: AllocationResult | null;
    maxDiversification: AllocationResult | null;
  } | null>(null);
  
  const [selectedScenario, setSelectedScenario] = useState<string>('balanced');
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Genera dati sintetici per test
  const generateSyntheticReturns = (
    expectedReturn: number,
    volatility: number,
    correlation: number,
    baseReturns: number[]
  ): number[] => {
    return baseReturns.map((baseReturn) => {
      const randomComponent = (Math.random() - 0.5) * volatility * 2;
      const correlatedComponent = baseReturn * correlation;
      const independentComponent = (Math.random() - 0.5) * volatility * 2 * (1 - Math.abs(correlation));
      
      return expectedReturn + correlatedComponent + independentComponent + randomComponent;
    });
  };

  // Scenari di test
  const testScenarios: Record<string, TestScenario> = {
    balanced: {
      name: 'Portfolio Bilanciato',
      description: 'Mix di asset con rischio/rendimento bilanciato',
      assets: (() => {
        const baseReturns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.02);
        return [
          {
            symbol: 'STOCKS',
            name: 'Azioni Globali',
            expectedReturn: 0.08,
            volatility: 0.15,
            returns: generateSyntheticReturns(0.08, 0.15, 0.7, baseReturns)
          },
          {
            symbol: 'BONDS',
            name: 'Obbligazioni',
            expectedReturn: 0.04,
            volatility: 0.05,
            returns: generateSyntheticReturns(0.04, 0.05, -0.2, baseReturns)
          },
          {
            symbol: 'REITS',
            name: 'Immobiliare',
            expectedReturn: 0.06,
            volatility: 0.12,
            returns: generateSyntheticReturns(0.06, 0.12, 0.4, baseReturns)
          },
          {
            symbol: 'COMMOD',
            name: 'Commodities',
            expectedReturn: 0.05,
            volatility: 0.20,
            returns: generateSyntheticReturns(0.05, 0.20, 0.1, baseReturns)
          }
        ];
      })(),
      constraints: {
        minWeight: 0.05,
        maxWeight: 0.70,
        maxIterations: 500,
        tolerance: 1e-6
      }
    },
    
    aggressive: {
      name: 'Portfolio Aggressivo',
      description: 'Focus su crescita con alta volatilità',
      assets: (() => {
        const baseReturns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.03);
        return [
          {
            symbol: 'TECH',
            name: 'Tecnologia',
            expectedReturn: 0.12,
            volatility: 0.25,
            returns: generateSyntheticReturns(0.12, 0.25, 0.8, baseReturns)
          },
          {
            symbol: 'GROWTH',
            name: 'Growth Stocks',
            expectedReturn: 0.10,
            volatility: 0.22,
            returns: generateSyntheticReturns(0.10, 0.22, 0.75, baseReturns)
          },
          {
            symbol: 'EMRG',
            name: 'Mercati Emergenti',
            expectedReturn: 0.09,
            volatility: 0.28,
            returns: generateSyntheticReturns(0.09, 0.28, 0.6, baseReturns)
          },
          {
            symbol: 'CRYPTO',
            name: 'Crypto Proxy',
            expectedReturn: 0.15,
            volatility: 0.45,
            returns: generateSyntheticReturns(0.15, 0.45, 0.3, baseReturns)
          },
          {
            symbol: 'INNOV',
            name: 'Innovazione',
            expectedReturn: 0.11,
            volatility: 0.30,
            returns: generateSyntheticReturns(0.11, 0.30, 0.7, baseReturns)
          }
        ];
      })(),
      constraints: {
        minWeight: 0.10,
        maxWeight: 0.50,
        maxIterations: 800,
        tolerance: 1e-6
      }
    },
    
    conservative: {
      name: 'Portfolio Conservativo',
      description: 'Focus su stabilità e preservazione capitale',
      assets: (() => {
        const baseReturns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.01);
        return [
          {
            symbol: 'TBOND',
            name: 'Treasury Bonds',
            expectedReturn: 0.03,
            volatility: 0.03,
            returns: generateSyntheticReturns(0.03, 0.03, 0.2, baseReturns)
          },
          {
            symbol: 'CORP',
            name: 'Corporate Bonds',
            expectedReturn: 0.04,
            volatility: 0.06,
            returns: generateSyntheticReturns(0.04, 0.06, 0.4, baseReturns)
          },
          {
            symbol: 'UTIL',
            name: 'Utilities',
            expectedReturn: 0.05,
            volatility: 0.08,
            returns: generateSyntheticReturns(0.05, 0.08, -0.1, baseReturns)
          },
          {
            symbol: 'DIV',
            name: 'Dividend Stocks',
            expectedReturn: 0.06,
            volatility: 0.10,
            returns: generateSyntheticReturns(0.06, 0.10, 0.3, baseReturns)
          }
        ];
      })(),
      constraints: {
        minWeight: 0.15,
        maxWeight: 0.60,
        maxIterations: 300,
        tolerance: 1e-5
      }
    }
  };

  const runTest = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
    setResults(null);

    try {
      const scenario = testScenarios[selectedScenario];
      const engine = AlternativeAllocationsEngine.getInstance();
      
      console.log('🚀 Starting Alternative Allocations Test:', scenario.name);
      
      const testResults = engine.calculateAllStrategies(
        scenario.assets,
        scenario.constraints || {}
      );

      setResults(testResults);
      
      console.log('✅ Test completed successfully!');
      
    } catch (_err) {
      const errorMessage = _err instanceof Error ? _err.message : 'Errore sconosciuto';
      setError(errorMessage);
      console.error('❌ Test failed:', _err);
    } finally {
      setIsCalculating(false);
    }
  }, [selectedScenario]);

  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(2) + '%';
  };

  const formatNumber = (value: number): string => {
    return value.toFixed(4);
  };

  const renderAllocationResult = (title: string, result: AllocationResult | null, color: string) => {
    if (!result) return null;

    return (
      <div className={`border rounded-lg p-4 ${color}`}>
        <h4 className="font-semibold text-lg mb-3 flex items-center">
          {title}
          {result.metadata.optimizationSuccess ? (
            <span className="ml-2 text-green-600 text-sm">✅ Converged</span>
          ) : (
            <span className="ml-2 text-yellow-600 text-sm">⚠️ Max Iterations</span>
          )}
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600">Expected Return</div>
            <div className="font-mono text-lg">{formatPercentage(result.expectedReturn)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Volatility</div>
            <div className="font-mono text-lg">{formatPercentage(result.volatility)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Sharpe Ratio</div>
            <div className="font-mono text-lg">{formatNumber(result.sharpeRatio)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Processing Time</div>
            <div className="font-mono text-sm">{result.metadata.processingTime.toFixed(2)}ms</div>
          </div>
        </div>

        {result.diversificationRatio && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-600">Diversification Ratio</div>
              <div className="font-mono text-lg">{formatNumber(result.diversificationRatio)}</div>
            </div>
            {result.averageCorrelation && (
              <div>
                <div className="text-sm text-gray-600">Average Correlation</div>
                <div className="font-mono text-lg">{formatPercentage(result.averageCorrelation)}</div>
              </div>
            )}
          </div>
        )}

        {result.metadata.convergenceIterations && (
          <div className="mb-4">
            <div className="text-sm text-gray-600">Convergence Iterations</div>
            <div className="font-mono">{result.metadata.convergenceIterations}</div>
          </div>
        )}

        <div>
          <div className="text-sm text-gray-600 mb-2">Asset Allocation</div>
          <div className="space-y-2">
            {result.assets.map((asset, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm font-medium">{asset.symbol}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">{formatPercentage(asset.weight)}</span>
                  {asset.riskContribution && (
                    <span className="text-xs text-gray-500">
                      (Risk: {formatPercentage(asset.riskContribution)})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Alternative Allocations Engine Test
        </h1>
        <p className="text-lg text-gray-600">
          Test delle strategie alternative di allocazione portfolio
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scenario di Test
            </label>
            <select
              id="test-scenario-select"
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              aria-label="Test Scenario Selection"
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCalculating}
            >
              {Object.entries(testScenarios).map(([key, scenario]) => (
                <option key={key} value={key}>
                  {scenario.name} ({scenario.assets.length} assets)
                </option>
              ))}
            </select>
          </div>
          
          <Button
            onClick={runTest}
            disabled={isCalculating}
            className="px-6 py-2"
          >
            {isCalculating ? '🔄 Calculating...' : '🚀 Run Test'}
          </Button>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Scenario corrente:</h3>
          <p className="text-gray-600 text-sm">
            {testScenarios[selectedScenario].description}
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Assets: {testScenarios[selectedScenario].assets.map(a => a.symbol).join(', ')}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">❌ Errore durante il test</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {results && (
          <div>
            <h3 className="text-xl font-bold mb-6">📊 Risultati del Test</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {renderAllocationResult(
                '⚖️ Equal Weight (1/n)', 
                results.equalWeight, 
                'bg-blue-50 border-blue-200'
              )}
              
              {renderAllocationResult(
                '🎯 Risk Parity', 
                results.riskParity, 
                'bg-green-50 border-green-200'
              )}
              
              {renderAllocationResult(
                '🔄 Minimum Correlation', 
                results.minimumCorrelation, 
                'bg-purple-50 border-purple-200'
              )}
              
              {renderAllocationResult(
                '📈 Maximum Diversification', 
                results.maxDiversification, 
                'bg-orange-50 border-orange-200'
              )}
            </div>

            {/* Comparison Summary */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-lg mb-4">📈 Comparison Summary</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Strategy</th>
                      <th className="text-right py-2 px-4">Return</th>
                      <th className="text-right py-2 px-4">Volatility</th>
                      <th className="text-right py-2 px-4">Sharpe</th>
                      <th className="text-right py-2 px-4">Div. Ratio</th>
                      <th className="text-right py-2 px-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results).map(([key, result]) => {
                      if (!result) return null;
                      return (
                        <tr key={key} className="border-b">
                          <td className="py-2 px-4 font-medium">{result.strategy}</td>
                          <td className="text-right py-2 px-4 font-mono">
                            {formatPercentage(result.expectedReturn)}
                          </td>
                          <td className="text-right py-2 px-4 font-mono">
                            {formatPercentage(result.volatility)}
                          </td>
                          <td className="text-right py-2 px-4 font-mono">
                            {formatNumber(result.sharpeRatio)}
                          </td>
                          <td className="text-right py-2 px-4 font-mono">
                            {result.diversificationRatio ? formatNumber(result.diversificationRatio) : '-'}
                          </td>
                          <td className="text-right py-2 px-4 font-mono text-sm">
                            {result.metadata.processingTime.toFixed(2)}ms
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlternativeAllocationsTester;

