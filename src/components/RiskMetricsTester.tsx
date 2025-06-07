/**
 * RiskMetricsTester - Componente di Test per Risk Metrics Engine
 * 
 * Interface professionale per testare e validare tutti i calcoli di risk metrics
 * con dati di mercato reali e simulati.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { riskMetricsEngine } from '../services/RiskMetricsEngine';
import { returnsCalculationEngine } from '../services/ReturnsCalculationEngine';
import type { 
  VolatilityResult, 
  DownsideRiskResult, 
  DistributionMetrics, 
  RollingMetricsResult,
  RiskMetricsConfig 
} from '../services/RiskMetricsEngine';

interface TestResult {
  testName: string;
  symbol: string;
  volatility: VolatilityResult | null;
  downsideRisk: DownsideRiskResult | null;
  distribution: DistributionMetrics;
  rollingMetrics: Record<string, RollingMetricsResult>;
  processingTime: number;
  dataPoints: number;
  success: boolean;
  error?: string;
}

interface MarketDataPoint {
  date: string;
  price: number;
}

const RiskMetricsTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('comprehensive');
  const [testSymbol, setTestSymbol] = useState<string>('AAPL');
  const [dataPoints, setDataPoints] = useState<number>(252);
  const [targetReturn, setTargetReturn] = useState<number>(0);
  const [rollingWindows, setRollingWindows] = useState<string>('30,60,90');
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    totalTests: number;
    successfulTests: number;
    averageProcessingTime: number;
    testStartTime: number | null;
  }>({
    totalTests: 0,
    successfulTests: 0,
    averageProcessingTime: 0,
    testStartTime: null
  });

  // Generate synthetic market data for testing
  const generateSyntheticData = (points: number, volatility: number = 0.02, drift: number = 0.0001): MarketDataPoint[] => {
    const data: MarketDataPoint[] = [];
    let price = 100; // Starting price
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < points; i++) {
      // Generate random return with specified volatility
      const randomReturn = (Math.random() - 0.5) * 2 * volatility + drift;
      price = price * (1 + randomReturn);
      
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i));
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(price, 0.01) // Prevent negative prices
      });
    }

    return data;
  };

  // Generate test data with different characteristics
  const getTestData = useMemo(() => {
    const testSets = {
      lowVolatility: generateSyntheticData(dataPoints, 0.01, 0.0002), // Low vol, positive drift
      highVolatility: generateSyntheticData(dataPoints, 0.04, 0.0001), // High vol
      negativeSkew: generateNegativeSkewData(dataPoints),
      positiveSkew: generatePositiveSkewData(dataPoints),
      highKurtosis: generateHighKurtosisData(dataPoints),
      trendingUp: generateTrendingData(dataPoints, 0.001),
      trendingDown: generateTrendingData(dataPoints, -0.001),
      sideways: generateSyntheticData(dataPoints, 0.015, 0)
    };

    return testSets;
  }, [dataPoints]);

  function generateNegativeSkewData(points: number): MarketDataPoint[] {
    const data: MarketDataPoint[] = [];
    let price = 100;
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < points; i++) {
      // Generate negatively skewed returns (frequent small gains, rare large losses)
      const random = Math.random();
      let returnValue: number;
      
      if (random < 0.1) {
        // 10% chance of large negative return
        returnValue = -0.05 - Math.random() * 0.05;
      } else {
        // 90% chance of small positive return
        returnValue = Math.random() * 0.02 + 0.001;
      }
      
      price = price * (1 + returnValue);
      
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i));
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(price, 0.01)
      });
    }

    return data;
  }

  function generatePositiveSkewData(points: number): MarketDataPoint[] {
    const data: MarketDataPoint[] = [];
    let price = 100;
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < points; i++) {
      // Generate positively skewed returns (frequent small losses, rare large gains)
      const random = Math.random();
      let returnValue: number;
      
      if (random < 0.1) {
        // 10% chance of large positive return
        returnValue = 0.05 + Math.random() * 0.05;
      } else {
        // 90% chance of small negative return
        returnValue = -Math.random() * 0.02 - 0.001;
      }
      
      price = price * (1 + returnValue);
      
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i));
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(price, 0.01)
      });
    }

    return data;
  }

  function generateHighKurtosisData(points: number): MarketDataPoint[] {
    const data: MarketDataPoint[] = [];
    let price = 100;
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < points; i++) {
      // Generate high kurtosis returns (fat tails)
      const random = Math.random();
      let returnValue: number;
      
      if (random < 0.05) {
        // 5% chance of extreme positive return
        returnValue = 0.08 + Math.random() * 0.04;
      } else if (random < 0.1) {
        // 5% chance of extreme negative return
        returnValue = -0.08 - Math.random() * 0.04;
      } else {
        // 90% chance of very small return (clustering around mean)
        returnValue = (Math.random() - 0.5) * 0.005;
      }
      
      price = price * (1 + returnValue);
      
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i));
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(price, 0.01)
      });
    }

    return data;
  }

  function generateTrendingData(points: number, trendRate: number): MarketDataPoint[] {
    const data: MarketDataPoint[] = [];
    let price = 100;
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < points; i++) {
      // Generate returns with consistent trend + noise
      const noise = (Math.random() - 0.5) * 0.02;
      const returnValue = trendRate + noise;
      
      price = price * (1 + returnValue);
      
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i));
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(price, 0.01)
      });
    }

    return data;
  }

  const runRiskMetricsTest = async (
    testName: string,
    priceData: MarketDataPoint[],
    symbol: string
  ): Promise<TestResult> => {
    console.log(`🧪 Running risk metrics test: ${testName} for ${symbol}`);
    
    const startTime = performance.now();
    
    try {
      // Calculate returns from prices
      const pricePoints = priceData.map(d => ({ date: d.date, price: d.price }));
      const dates = priceData.map(d => d.date);
      
      const returnsResult = returnsCalculationEngine.calculateSimpleReturns(pricePoints, {
        validateResults: true
      });

      if (!returnsResult.values || returnsResult.count === 0) {
        throw new Error('Failed to calculate returns');
      }

      // Configure risk metrics calculation
      const config: RiskMetricsConfig = {
        targetReturn: targetReturn / 100, // Convert percentage to decimal
        rollingWindows: rollingWindows.split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w)),
        validateInput: true,
        includeInterpretation: true
      };

      // Calculate comprehensive risk metrics
      const riskMetrics = riskMetricsEngine.calculateComprehensiveRiskMetrics(
        returnsResult.values,
        dates,
        config
      );

      const processingTime = performance.now() - startTime;

      const result: TestResult = {
        testName,
        symbol,
        volatility: riskMetrics.volatility,
        downsideRisk: riskMetrics.downsideRisk,
        distribution: riskMetrics.distribution,
        rollingMetrics: riskMetrics.rollingMetrics,
        processingTime,
        dataPoints: pricePoints.length,
        success: true
      };

      console.log(`✅ Risk metrics test completed: ${testName}`, {
        processingTime: `${processingTime.toFixed(2)}ms`,
        dataPoints: pricePoints.length
      });

      return result;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      
      console.error(`❌ Risk metrics test failed: ${testName}`, (error));
      
      return {
        testName,
        symbol,
        volatility: null,
        downsideRisk: null,
        distribution: {
          skewness: null,
          kurtosis: null,
          excessKurtosis: null,
          isNormal: false,
          jarqueBera: null,
          shapiroWilk: null,
          interpretation: {
            skewness: 'Error',
            kurtosis: 'Error',
            normality: 'Error'
          }
        },
        rollingMetrics: {},
        processingTime,
        dataPoints: priceData.length,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const runSelectedTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setPerformanceMetrics(prev => ({
      ...prev,
      testStartTime: Date.now()
    }));

    try {
      const testResults: TestResult[] = [];

      if (selectedTest === 'comprehensive') {
        // Run all test scenarios
        const testScenarios = [
          { name: 'Low Volatility Test', data: getTestData.lowVolatility, symbol: `${testSymbol}_LowVol` },
          { name: 'High Volatility Test', data: getTestData.highVolatility, symbol: `${testSymbol}_HighVol` },
          { name: 'Negative Skew Test', data: getTestData.negativeSkew, symbol: `${testSymbol}_NegSkew` },
          { name: 'Positive Skew Test', data: getTestData.positiveSkew, symbol: `${testSymbol}_PosSkew` },
          { name: 'High Kurtosis Test', data: getTestData.highKurtosis, symbol: `${testSymbol}_HighKurt` },
          { name: 'Trending Up Test', data: getTestData.trendingUp, symbol: `${testSymbol}_TrendUp` },
          { name: 'Trending Down Test', data: getTestData.trendingDown, symbol: `${testSymbol}_TrendDown` },
          { name: 'Sideways Test', data: getTestData.sideways, symbol: `${testSymbol}_Sideways` }
        ];

        for (const scenario of testScenarios) {
          const result = await runRiskMetricsTest(scenario.name, scenario.data, scenario.symbol);
          testResults.push(result);
        }
      } else {
        // Run single test
        const testData = getTestData[selectedTest as keyof typeof getTestData];
        if (testData) {
          const result = await runRiskMetricsTest(
            `${selectedTest} Test`,
            testData,
            `${testSymbol}_${selectedTest}`
          );
          testResults.push(result);
        }
      }

      // Update results and performance metrics
      setTestResults(testResults);
      
      const successfulTests = testResults.filter(r => r.success).length;
      const averageProcessingTime = testResults.reduce((sum, r) => sum + r.processingTime, 0) / testResults.length;
      
      setPerformanceMetrics(prev => ({
        totalTests: testResults.length,
        successfulTests,
        averageProcessingTime,
        testStartTime: prev.testStartTime
      }));

    } catch (error) {
      console.error('❌ Test execution failed:', (error));
    } finally {
      setIsRunning(false);
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
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Risk Metrics Testing Engine</h1>
        <p className="text-gray-600 mb-6">
          Professional testing interface for volatility, downside risk, distribution analysis, and rolling metrics calculations.
        </p>

        {/* Test Configuration */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="test-scenario-select" className="block text-sm font-medium text-gray-700 mb-2">Test Scenario</label>
              <select
                id="test-scenario-select"
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
              >
                <option value="comprehensive">Comprehensive (All Scenarios)</option>
                <option value="lowVolatility">Low Volatility</option>
                <option value="highVolatility">High Volatility</option>
                <option value="negativeSkew">Negative Skew</option>
                <option value="positiveSkew">Positive Skew</option>
                <option value="highKurtosis">High Kurtosis</option>
                <option value="trendingUp">Trending Up</option>
                <option value="trendingDown">Trending Down</option>
                <option value="sideways">Sideways Market</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Symbol</label>
              <input
                type="text"
                value={testSymbol}
                onChange={(e) => setTestSymbol(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
                placeholder="e.g., AAPL"
              />
            </div>

            <div>
              <label htmlFor="data-points-input" className="block text-sm font-medium text-gray-700 mb-2">Data Points</label>
              <input
                id="data-points-input"
                type="number"
                value={dataPoints}
                onChange={(e) => setDataPoints(Math.max(30, parseInt(e.target.value) || 252))}
                min="30"
                max="2520"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Return (%)</label>
              <input
                type="number"
                value={targetReturn}
                onChange={(e) => setTargetReturn(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rolling Windows (days)</label>
              <input
                type="text"
                value={rollingWindows}
                onChange={(e) => setRollingWindows(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
                placeholder="30,60,90"
              />
            </div>
          </div>

          <button
            onClick={runSelectedTest}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium ${
              isRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } transition-colors`}
          >
            {isRunning ? '🧪 Running Tests...' : '🚀 Run Risk Metrics Tests'}
          </button>
        </div>

        {/* Performance Metrics */}
        {performanceMetrics.totalTests > 0 && (
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{performanceMetrics.totalTests}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{performanceMetrics.successfulTests}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {performanceMetrics.averageProcessingTime.toFixed(1)}ms
                </div>
                <div className="text-sm text-gray-600">Avg Processing Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {((performanceMetrics.successfulTests / performanceMetrics.totalTests) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Test Results</h2>
            
            {testResults.map((result, index) => (
              <div key={index} className={`border rounded-lg p-6 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{result.testName}</h3>
                    <p className="text-sm text-gray-600">Symbol: {result.symbol} | Data Points: {result.dataPoints} | Processing Time: {result.processingTime.toFixed(2)}ms</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </div>
                </div>

                {result.error && (
                  <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
                    <p className="text-red-700 text-sm">{result.error}</p>
                  </div>
                )}

                {result.success && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Volatility Metrics */}
                    {result.volatility && (
                      <div className="bg-white rounded p-4">
                        <h4 className="font-semibold mb-3">📊 Volatility Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Daily Volatility:</span>
                            <span className="font-mono">{formatPercentage(result.volatility.volatility)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annualized Volatility:</span>
                            <span className="font-mono font-bold">{formatPercentage(result.volatility.annualizedVolatility)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sample Size:</span>
                            <span className="font-mono">{result.volatility.sampleSize}</span>
                          </div>
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            {result.volatility.interpretation}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Downside Risk */}
                    {result.downsideRisk && (
                      <div className="bg-white rounded p-4">
                        <h4 className="font-semibold mb-3">📉 Downside Risk Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Downside Deviation:</span>
                            <span className="font-mono">{formatPercentage(result.downsideRisk.downsideDeviation)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annualized DD:</span>
                            <span className="font-mono font-bold">{formatPercentage(result.downsideRisk.annualizedDownsideDeviation)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Downside Frequency:</span>
                            <span className="font-mono">{formatPercentage(result.downsideRisk.downsideFrequency)}</span>
                          </div>
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            {result.downsideRisk.interpretation}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Distribution Metrics */}
                    <div className="bg-white rounded p-4">
                      <h4 className="font-semibold mb-3">📐 Distribution Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Skewness:</span>
                          <span className="font-mono">{formatNumber(result.distribution.skewness)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Excess Kurtosis:</span>
                          <span className="font-mono">{formatNumber(result.distribution.excessKurtosis)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jarque-Bera:</span>
                          <span className="font-mono">{formatNumber(result.distribution.jarqueBera, 2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Normal Distribution:</span>
                          <span className={`font-medium ${result.distribution.isNormal ? 'text-green-600' : 'text-red-600'}`}>
                            {result.distribution.isNormal ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="p-2 bg-gray-50 rounded text-xs">
                            <strong>Skewness:</strong> {result.distribution.interpretation.skewness}
                          </div>
                          <div className="p-2 bg-gray-50 rounded text-xs">
                            <strong>Kurtosis:</strong> {result.distribution.interpretation.kurtosis}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rolling Metrics */}
                    <div className="bg-white rounded p-4">
                      <h4 className="font-semibold mb-3">🔄 Rolling Volatility</h4>
                      <div className="space-y-3 text-sm">
                        {Object.entries(result.rollingMetrics).map(([_key, rolling]) => (
                          <div key={key} className="border-b border-gray-100 pb-2">
                            <div className="font-medium text-gray-700 mb-1">
                              {key.replace('_', ' ').toUpperCase()}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span>Latest:</span>
                                <span className="font-mono">{formatPercentage(rolling.latest)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Mean:</span>
                                <span className="font-mono">{formatPercentage(rolling.mean)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Min:</span>
                                <span className="font-mono">{formatPercentage(rolling.min)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Max:</span>
                                <span className="font-mono">{formatPercentage(rolling.max)}</span>
                              </div>
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              Trend: <span className={`font-medium ${
                                rolling.trend.direction === 'increasing' ? 'text-red-600' : 
                                rolling.trend.direction === 'decreasing' ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {rolling.trend.direction}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">How to Use</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>1.</strong> Select a test scenario or run comprehensive tests to evaluate all risk characteristics</p>
            <p><strong>2.</strong> Configure test parameters: symbol, data points, target return, and rolling windows</p>
            <p><strong>3.</strong> Run tests to calculate volatility, downside risk, skewness, kurtosis, and rolling metrics</p>
            <p><strong>4.</strong> Review results including interpretations and performance metrics</p>
            <p><strong>5.</strong> Compare different scenarios to understand risk behavior across market conditions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMetricsTester;

