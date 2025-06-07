/**
 * ReturnsCalculationTester - Componente Test per Returns Calculation Engine
 * 
 * Features:
 * - Test di tutti i tipi di calcolo ritorni
 * - Visualizzazione risultati con statistiche
 * - Performance testing
 * - Validazione accuracy calcoli
 */

import React, { useState, useEffect } from 'react';
import { 
  returnsCalculationEngine, 
  PricePoint, 
  ReturnsResult, 
  CumulativeReturnsResult,
  AnnualizedReturnsResult,
  BatchCalculationResult
} from '../services/ReturnsCalculationEngine';

const ReturnsCalculationTester: React.FC = () => {
  const [testData, setTestData] = useState<PricePoint[]>([]);
  const [simpleReturns, setSimpleReturns] = useState<ReturnsResult | null>(null);
  const [logReturns, setLogReturns] = useState<ReturnsResult | null>(null);
  const [cumulativeReturns, setCumulativeReturns] = useState<CumulativeReturnsResult | null>(null);
  const [annualizedReturns, setAnnualizedReturns] = useState<AnnualizedReturnsResult | null>(null);
  const [batchResults, setBatchResults] = useState<BatchCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    totalTime: number;
    averageTimePerCalculation: number;
    dataPoints: number;
    timePerDataPoint: number;
  } | null>(null);

  useEffect(() => {
    generateTestData();
  }, []);

  const generateTestData = () => {
    console.log('🎲 Generating test data...');
    
    // Generate realistic stock price data
    const data: PricePoint[] = [];
    const startDate = new Date('2023-01-01');
    const days = 252; // One trading year
    let currentPrice = 100; // Starting price
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Simple random walk with slight upward drift
      const dailyReturn = (Math.random() - 0.48) * 0.02; // -2% to +2% with slight positive bias
      currentPrice = currentPrice * (1 + dailyReturn);
      
      // Add some dividend adjustment (90% of the time same as price)
      const adjustedPrice = Math.random() > 0.1 ? currentPrice : currentPrice * 0.98;
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: currentPrice,
        adjustedPrice,
        volume: Math.floor(Math.random() * 1000000) + 100000
      });
    }
    
    setTestData(data);
    console.log('✅ Test data generated:', { 
      days: data.length, 
      startPrice: data[0].price.toFixed(2),
      endPrice: data[data.length - 1].price.toFixed(2)
    });
  };

  const runAllCalculations = async () => {
    if (testData.length === 0) return;
    
    setLoading(true);
    const startTime = performance.now();
    
    try {
      console.log('🧮 Running all returns calculations...');
      
      // Simple returns
      const simpleResult = returnsCalculationEngine.calculateSimpleReturns(testData);
      setSimpleReturns(simpleResult);
      
      // Log returns
      const logResult = returnsCalculationEngine.calculateLogReturns(testData);
      setLogReturns(logResult);
      
      // Cumulative returns
      const dates = testData.map(p => p.date);
      const cumulativeResult = returnsCalculationEngine.calculateCumulativeReturns(
        simpleResult.values, 1.0, dates
      );
      setCumulativeReturns(cumulativeResult);
      
      // Annualized returns
      const annualizedResult = returnsCalculationEngine.calculateAnnualizedReturns(
        simpleResult.values, 'daily', 'compound'
      );
      setAnnualizedReturns(annualizedResult);
      
      const totalTime = performance.now() - startTime;
      
      setPerformanceMetrics({
        totalTime,
        averageTimePerCalculation: totalTime / 4,
        dataPoints: testData.length,
        timePerDataPoint: totalTime / testData.length
      });
      
      console.log('✅ All calculations completed:', {
        totalTime: `${totalTime.toFixed(2)}ms`,
        dataPoints: testData.length
      });
      
    } catch (error) {
      console.error('❌ Error in calculations:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBatchTest = async () => {
    setLoading(true);
    
    try {
      console.log('🔄 Running batch calculation test...');
      
      // Create multiple assets data
      const assetsData: Record<string, PricePoint[]> = {};
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
      
      symbols.forEach(symbol => {
        // Generate different price series for each symbol
        const data: PricePoint[] = [];
        const startDate = new Date('2023-01-01');
        let currentPrice = 100 + Math.random() * 200;
        
        for (let i = 0; i < 252; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          
          const dailyReturn = (Math.random() - 0.5) * 0.03; // More volatile
          currentPrice = currentPrice * (1 + dailyReturn);
          
          data.push({
            date: date.toISOString().split('T')[0],
            price: currentPrice,
            adjustedPrice: currentPrice,
            volume: Math.floor(Math.random() * 1000000) + 100000
          });
        }
        
        assetsData[symbol] = data;
      });
      
      // Run batch calculation
      const batchResult = await returnsCalculationEngine.calculateReturnsBatch(
        assetsData, 'simple', { batchSize: 2 }
      );
      
      setBatchResults(batchResult);
      
      console.log('✅ Batch test completed:', batchResult);
      
    } catch (error) {
      console.error('❌ Error in batch test:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number | null): string => {
    if (value === null) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number | null, decimals: number = 4): string => {
    if (value === null) return 'N/A';
    return value.toFixed(decimals);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '28px', 
          fontWeight: '700',
          color: '#111827'
        }}>
          🧮 Returns Calculation Engine Tester
        </h1>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={generateTestData}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🎲 Generate New Data
          </button>
          
          <button
            onClick={runAllCalculations}
            disabled={loading || testData.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {loading ? '⏳ Computing...' : '🧮 Run All Calculations'}
          </button>
          
          <button
            onClick={runBatchTest}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#9CA3AF' : '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {loading ? '⏳ Processing...' : '🔄 Batch Test'}
          </button>
        </div>
      </div>

      {/* Test Data Info */}
      {testData.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB'
          }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
              📊 Test Dataset
            </h2>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3B82F6' }}>
                  {testData.length}
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>
                  Data Points
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981' }}>
                  ${testData[0]?.price.toFixed(2)}
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>
                  Start Price
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B' }}>
                  ${testData[testData.length - 1]?.price.toFixed(2)}
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>
                  End Price
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#8B5CF6' }}>
                  {testData.length > 0 ? 
                    formatPercentage((testData[testData.length - 1].price - testData[0].price) / testData[0].price)
                    : 'N/A'
                  }
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>
                  Total Return
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Simple Returns */}
        {simpleReturns && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                📈 Simple Returns
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                  Mean Daily Return
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#3B82F6' }}>
                  {formatPercentage(simpleReturns.mean)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                  Volatility (Std Dev)
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#EF4444' }}>
                  {formatPercentage(simpleReturns.volatility)}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '14px'
              }}>
                <div>
                  <div style={{ color: '#6B7280' }}>Valid Returns:</div>
                  <div style={{ fontWeight: '600' }}>{simpleReturns.count}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280' }}>Invalid:</div>
                  <div style={{ fontWeight: '600' }}>{simpleReturns.invalidCount}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280' }}>Min:</div>
                  <div style={{ fontWeight: '600' }}>{formatPercentage(simpleReturns.min)}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280' }}>Max:</div>
                  <div style={{ fontWeight: '600' }}>{formatPercentage(simpleReturns.max)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Log Returns */}
        {logReturns && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                📊 Log Returns
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                  Mean Log Return
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#10B981' }}>
                  {formatNumber(logReturns.mean)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                  Log Volatility
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#EF4444' }}>
                  {formatNumber(logReturns.volatility)}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '14px'
              }}>
                <div>
                  <div style={{ color: '#6B7280' }}>Valid Returns:</div>
                  <div style={{ fontWeight: '600' }}>{logReturns.count}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280' }}>Invalid:</div>
                  <div style={{ fontWeight: '600' }}>{logReturns.invalidCount}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280' }}>Min:</div>
                  <div style={{ fontWeight: '600' }}>{formatNumber(logReturns.min)}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280' }}>Max:</div>
                  <div style={{ fontWeight: '600' }}>{formatNumber(logReturns.max)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cumulative Returns */}
        {cumulativeReturns && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                📈 Cumulative Returns
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                  Total Return
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#F59E0B' }}>
                  {formatPercentage(cumulativeReturns.totalReturn)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                  Max Drawdown
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#EF4444' }}>
                  {formatPercentage(cumulativeReturns.maxDrawdown)}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '14px'
              }}>
                <div>
                  <div style={{ color: '#6B7280' }}>Final Value:</div>
                  <div style={{ fontWeight: '600' }}>{formatNumber(cumulativeReturns.finalValue, 2)}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280' }}>Data Points:</div>
                  <div style={{ fontWeight: '600' }}>{cumulativeReturns.values.length}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Annualized Returns */}
        {annualizedReturns && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                📅 Annualized Returns
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                  Annualized Return (CAGR)
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#8B5CF6' }}>
                  {formatPercentage(annualizedReturns.annualizedReturn)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                  Annualized Volatility
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#EF4444' }}>
                  {formatPercentage(annualizedReturns.volatility || null)}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '14px'
              }}>
                <div>
                  <div style={{ color: '#6B7280' }}>Method:</div>
                  <div style={{ fontWeight: '600' }}>{annualizedReturns.method}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280' }}>Years:</div>
                  <div style={{ fontWeight: '600' }}>{formatNumber(annualizedReturns.years, 2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              ⚡ Performance Metrics
            </h3>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#3B82F6' }}>
                  {performanceMetrics.totalTime.toFixed(2)}ms
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>
                  Total Time
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#10B981' }}>
                  {performanceMetrics.timePerDataPoint.toFixed(3)}ms
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>
                  Time per Data Point
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#F59E0B' }}>
                  {(performanceMetrics.dataPoints / (performanceMetrics.totalTime / 1000)).toFixed(0)}
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>
                  Data Points/Second
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Results */}
      {batchResults && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              🔄 Batch Processing Results
            </h3>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: '#F9FAFB',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#3B82F6' }}>
                  {batchResults.totalProcessed}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Total Processed
                </div>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: '#F9FAFB',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#10B981' }}>
                  {batchResults.successCount}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Successful
                </div>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: '#F9FAFB',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#EF4444' }}>
                  {batchResults.errorCount}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Errors
                </div>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: '#F9FAFB',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#F59E0B' }}>
                  {batchResults.processingTime.toFixed(0)}ms
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Processing Time
                </div>
              </div>
            </div>

            {/* Individual Results */}
            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Individual Asset Results:
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {Object.entries(batchResults.results).map(([symbol, result]) => (
                  <div key={symbol} style={{
                    padding: '12px',
                    backgroundColor: 'error' in result ? '#FEE2E2' : '#F0FDF4',
                    borderRadius: '6px',
                    border: `1px solid ${'error' in result ? '#FECACA' : '#BBF7D0'}`
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {symbol}
                    </div>
                    
                    {'error' in result ? (
                      <div style={{ fontSize: '12px', color: '#DC2626' }}>
                        Error: {result.message}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#059669' }}>
                        <div>Returns: {result.count}</div>
                        <div>Mean: {formatPercentage(result.mean)}</div>
                        <div>Vol: {formatPercentage(result.volatility)}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsCalculationTester; 

