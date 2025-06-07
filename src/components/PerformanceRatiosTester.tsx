/**
 * PerformanceRatiosTester - Componente di Test per Performance Ratios Engine
 * 
 * Interface professionale per testare e validare tutti i calcoli di performance ratios
 * con dati di mercato reali e simulati.
 */

// import React, { useState, useEffect, useMemo } from 'react'; // Unused import
import { performanceRatiosEngine } from '../services/PerformanceRatiosEngine';
import { returnsCalculationEngine } from '../services/ReturnsCalculationEngine';
import type { 
  SharpeRatioResult, 
  SortinoRatioResult, 
  InformationRatioResult,
  CalmarRatioResult,
  PerformanceRatiosConfig 
} from '../services/PerformanceRatiosEngine';

interface TestResult {
  testName: string;
  symbol: string;
  sharpe: SharpeRatioResult | null;
  sortino: SortinoRatioResult | null;
  information: InformationRatioResult | null;
  calmar: CalmarRatioResult | null;
  processingTime: number;
  dataPoints: number;
  success: boolean;
  error?: string;
}

interface MarketDataPoint {
  date: string;
  price: number;
}

const PerformanceRatiosTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('comprehensive');
  const [testSymbol, setTestSymbol] = useState<string>('AAPL');
  const [dataPoints, setDataPoints] = useState<number>(252);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(2.0);
  const [targetReturn, setTargetReturn] = useState<number>(0);
  const [includeBenchmark, setIncludeBenchmark] = useState<boolean>(true);
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

  // Generate benchmark data (market index simulation)
  const generateBenchmarkData = (points: number): MarketDataPoint[] => {
    return generateSyntheticData(points, 0.015, 0.0003); // Lower vol, slightly higher drift
  };

  // Generate test data with different characteristics
  const getTestData = useMemo(() => {
    const testSets = {
      highSharpe: generateSyntheticData(dataPoints, 0.012, 0.0008), // Low vol, high return
      lowSharpe: generateSyntheticData(dataPoints, 0.035, 0.0002), // High vol, low return
      negativeSharpe: generateSyntheticData(dataPoints, 0.025, -0.0003), // Negative returns
      highSortino: generateHighSortinoData(dataPoints),
      lowSortino: generateLowSortinoData(dataPoints),
      highInformation: generateHighInformationData(dataPoints),
      lowInformation: generateLowInformationData(dataPoints),
      highCalmar: generateHighCalmarData(dataPoints),
      lowCalmar: generateLowCalmarData(dataPoints),
      balanced: generateSyntheticData(dataPoints, 0.018, 0.0005)
    };

    return testSets;
  }, [dataPoints]);

  function generateHighSortinoData(points: number): MarketDataPoint[] {
    const data: MarketDataPoint[] = [];
    let price = 100;
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < points; i++) {
      // Generate returns with positive skew (few large gains, many small losses)
      const random = Math.random();
      let returnValue: number;
      
      if (random < 0.15) {
        // 15% chance of large positive return
        returnValue = 0.03 + Math.random() * 0.04;
      } else {
        // 85% chance of small negative or neutral return
        returnValue = -Math.random() * 0.01;
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

  function generateLowSortinoData(points: number): MarketDataPoint[] {
    const data: MarketDataPoint[] = [];
    let price = 100;
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < points; i++) {
      // Generate returns with negative skew (many large losses, few small gains)
      const random = Math.random();
      let returnValue: number;
      
      if (random < 0.2) {
        // 20% chance of large negative return
        returnValue = -0.04 - Math.random() * 0.03;
      } else {
        // 80% chance of small positive return
        returnValue = Math.random() * 0.008;
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

  function generateHighInformationData(points: number): MarketDataPoint[] {
    // Generate data that consistently outperforms benchmark
    const benchmarkData = generateBenchmarkData(points);
    const data: MarketDataPoint[] = [];
    
    for (let i = 0; i < points; i++) {
      const benchmarkPrice = benchmarkData[i].price;
      // Add consistent alpha with some noise
      const alpha = 0.0005 + (Math.random() - 0.5) * 0.0002;
      const price = benchmarkPrice * (1 + alpha);
      
      data.push({
        date: benchmarkData[i].date,
        price: Math.max(price, 0.01)
      });
    }

    return data;
  }

  function generateLowInformationData(points: number): MarketDataPoint[] {
    // Generate data that underperforms benchmark
    const benchmarkData = generateBenchmarkData(points);
    const data: MarketDataPoint[] = [];
    
    for (let i = 0; i < points; i++) {
      const benchmarkPrice = benchmarkData[i].price;
      // Add negative alpha with high tracking error
      const alpha = -0.0003 + (Math.random() - 0.5) * 0.001;
      const price = benchmarkPrice * (1 + alpha);
      
      data.push({
        date: benchmarkData[i].date,
        price: Math.max(price, 0.01)
      });
    }

    return data;
  }

  function generateHighCalmarData(points: number): MarketDataPoint[] {
    // Generate data with steady growth and small drawdowns
    const data: MarketDataPoint[] = [];
    let price = 100;
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < points; i++) {
      // Steady upward trend with occasional small dips
      const trend = 0.0006;
      const noise = (Math.random() - 0.5) * 0.008;
      const returnValue = trend + noise;
      
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

  function generateLowCalmarData(points: number): MarketDataPoint[] {
    // Generate data with large drawdowns
    const data: MarketDataPoint[] = [];
    let price = 100;
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < points; i++) {
      // Include major crash periods
      let returnValue: number;
      
      if (i > points * 0.3 && i < points * 0.4) {
        // Crash period
        returnValue = -0.02 - Math.random() * 0.03;
      } else if (i > points * 0.7 && i < points * 0.75) {
        // Another crash period
        returnValue = -0.015 - Math.random() * 0.02;
      } else {
        // Normal periods
        returnValue = (Math.random() - 0.5) * 0.02 + 0.0003;
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

  const runPerformanceRatiosTest = async (
    testName: string,
    priceData: MarketDataPoint[],
    benchmarkData: MarketDataPoint[] | null,
    symbol: string
  ): Promise<TestResult> => {
    console.log(`🧪 Running performance ratios test: ${testName} for ${symbol}`);
    
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

      // Calculate benchmark returns if provided
      let benchmarkReturns: (number | null)[] | undefined;
      if (benchmarkData && includeBenchmark) {
        const benchmarkPoints = benchmarkData.map(d => ({ date: d.date, price: d.price }));
        const benchmarkResult = returnsCalculationEngine.calculateSimpleReturns(benchmarkPoints, {
          validateResults: true
        });
        
        if (benchmarkResult.values && benchmarkResult.count > 0) {
          benchmarkReturns = benchmarkResult.values;
        }
      }

      // Configure performance ratios calculation
      const config: PerformanceRatiosConfig = {
        riskFreeRate: riskFreeRate / 100, // Convert percentage to decimal
        targetReturn: targetReturn / 100, // Convert percentage to decimal
        frequency: 'daily',
        validateInput: true,
        includeInterpretation: true
      };

      // Calculate comprehensive performance ratios
      const ratios = performanceRatiosEngine.calculateComprehensivePerformanceRatios(
        returnsResult.values,
        dates,
        benchmarkReturns,
        config
      );

      const processingTime = performance.now() - startTime;

      const result: TestResult = {
        testName,
        symbol,
        sharpe: ratios.sharpe,
        sortino: ratios.sortino,
        information: ratios.information,
        calmar: ratios.calmar,
        processingTime,
        dataPoints: pricePoints.length,
        success: true
      };

      console.log(`✅ Performance ratios test completed: ${testName}`, {
        processingTime: `${processingTime.toFixed(2)}ms`,
        dataPoints: pricePoints.length
      });

      return result;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      
      console.error(`❌ Performance ratios test failed: ${testName}`, (error));
      
      return {
        testName,
        symbol,
        sharpe: null,
        sortino: null,
        information: null,
        calmar: null,
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
          { name: 'High Sharpe Test', data: getTestData.highSharpe, symbol: `${testSymbol}_HighSharpe` },
          { name: 'Low Sharpe Test', data: getTestData.lowSharpe, symbol: `${testSymbol}_LowSharpe` },
          { name: 'Negative Sharpe Test', data: getTestData.negativeSharpe, symbol: `${testSymbol}_NegSharpe` },
          { name: 'High Sortino Test', data: getTestData.highSortino, symbol: `${testSymbol}_HighSortino` },
          { name: 'Low Sortino Test', data: getTestData.lowSortino, symbol: `${testSymbol}_LowSortino` },
          { name: 'High Information Test', data: getTestData.highInformation, symbol: `${testSymbol}_HighInfo` },
          { name: 'Low Information Test', data: getTestData.lowInformation, symbol: `${testSymbol}_LowInfo` },
          { name: 'High Calmar Test', data: getTestData.highCalmar, symbol: `${testSymbol}_HighCalmar` },
          { name: 'Low Calmar Test', data: getTestData.lowCalmar, symbol: `${testSymbol}_LowCalmar` },
          { name: 'Balanced Test', data: getTestData.balanced, symbol: `${testSymbol}_Balanced` }
        ];

        for (const scenario of testScenarios) {
          const benchmarkData = includeBenchmark ? generateBenchmarkData(dataPoints) : null;
          const result = await runPerformanceRatiosTest(scenario.name, scenario.data, benchmarkData, scenario.symbol);
          testResults.push(result);
        }
      } else {
        // Run single test
        const testData = getTestData[selectedTest as keyof typeof getTestData];
        if (testData) {
          const benchmarkData = includeBenchmark ? generateBenchmarkData(dataPoints) : null;
          const result = await runPerformanceRatiosTest(
            `${selectedTest} Test`,
            testData,
            benchmarkData,
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

  const formatRatio = (value: number | null): string => {
    if (value === null) return 'N/A';
    if (!isFinite(value)) return value > 0 ? '∞' : '-∞';
    return value.toFixed(4);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Performance Ratios Testing Engine</h1>
        <p className="text-gray-600 mb-6">
          Professional testing interface for Sharpe, Sortino, Information, and Calmar ratios calculations.
        </p>

        {/* Test Configuration */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Scenario</label>
              <select
                value={selectedTest}
                onChange={(_e) => setSelectedTest(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
              >
                <option value="comprehensive">Comprehensive (All Scenarios)</option>
                <option value="highSharpe">High Sharpe Ratio</option>
                <option value="lowSharpe">Low Sharpe Ratio</option>
                <option value="negativeSharpe">Negative Sharpe Ratio</option>
                <option value="highSortino">High Sortino Ratio</option>
                <option value="lowSortino">Low Sortino Ratio</option>
                <option value="highInformation">High Information Ratio</option>
                <option value="lowInformation">Low Information Ratio</option>
                <option value="highCalmar">High Calmar Ratio</option>
                <option value="lowCalmar">Low Calmar Ratio</option>
                <option value="balanced">Balanced Portfolio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Symbol</label>
              <input
                type="text"
                value={testSymbol}
                onChange={(_e) => setTestSymbol(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
                placeholder="e.g., AAPL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Points</label>
              <input
                type="number"
                value={dataPoints}
                onChange={(_e) => setDataPoints(Math.max(30, parseInt(e.target.value) || 252))}
                min="30"
                max="2520"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk-Free Rate (%)</label>
              <input
                type="number"
                value={riskFreeRate}
                onChange={(_e) => setRiskFreeRate(parseFloat(e.target.value) || 2.0)}
                step="0.1"
                min="0"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
                placeholder="2.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Return (%)</label>
              <input
                type="number"
                value={targetReturn}
                onChange={(_e) => setTargetReturn(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
                placeholder="0.0"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeBenchmark"
                checked={includeBenchmark}
                onChange={(_e) => setIncludeBenchmark(e.target.checked)}
                className="mr-2"
                disabled={isRunning}
              />
              <label htmlFor="includeBenchmark" className="text-sm font-medium text-gray-700">
                Include Benchmark (Information Ratio)
              </label>
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
            {isRunning ? '🧪 Running Tests...' : '🚀 Run Performance Ratios Tests'}
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
            
            {testResults.map((result) => (
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
                    {/* Sharpe Ratio */}
                    {result.sharpe && (
                      <div className="bg-white rounded p-4">
                        <h4 className="font-semibold mb-3">📊 Sharpe Ratio Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Sharpe Ratio:</span>
                            <span className="font-mono font-bold">{formatRatio(result.sharpe.sharpeRatio)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annualized Return:</span>
                            <span className="font-mono">{formatPercentage(result.sharpe.annualizedReturn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annualized Volatility:</span>
                            <span className="font-mono">{formatPercentage(result.sharpe.annualizedVolatility)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Excess Return:</span>
                            <span className="font-mono">{formatPercentage(result.sharpe.excessReturn)}</span>
                          </div>
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            {result.sharpe.interpretation}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sortino Ratio */}
                    {result.sortino && (
                      <div className="bg-white rounded p-4">
                        <h4 className="font-semibold mb-3">📉 Sortino Ratio Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Sortino Ratio:</span>
                            <span className="font-mono font-bold">{formatRatio(result.sortino.sortinoRatio)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annualized Return:</span>
                            <span className="font-mono">{formatPercentage(result.sortino.annualizedReturn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Downside Deviation:</span>
                            <span className="font-mono">{formatPercentage(result.sortino.downsideDeviation)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Downside Frequency:</span>
                            <span className="font-mono">{formatPercentage(result.sortino.downsideFrequency)}</span>
                          </div>
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            {result.sortino.interpretation}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Information Ratio */}
                    {result.information && (
                      <div className="bg-white rounded p-4">
                        <h4 className="font-semibold mb-3">📈 Information Ratio Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Information Ratio:</span>
                            <span className="font-mono font-bold">{formatRatio(result.information.informationRatio)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Portfolio Return:</span>
                            <span className="font-mono">{formatPercentage(result.information.portfolioReturn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Benchmark Return:</span>
                            <span className="font-mono">{formatPercentage(result.information.benchmarkReturn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Active Return:</span>
                            <span className="font-mono">{formatPercentage(result.information.activeReturn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tracking Error:</span>
                            <span className="font-mono">{formatPercentage(result.information.trackingError)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Statistical Significance:</span>
                            <span className={`font-medium ${result.information.isSignificant ? 'text-green-600' : 'text-red-600'}`}>
                              {result.information.isSignificant ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            {result.information.interpretation}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Calmar Ratio */}
                    {result.calmar && (
                      <div className="bg-white rounded p-4">
                        <h4 className="font-semibold mb-3">📊 Calmar Ratio Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Calmar Ratio:</span>
                            <span className="font-mono font-bold">{formatRatio(result.calmar.calmarRatio)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annualized Return:</span>
                            <span className="font-mono">{formatPercentage(result.calmar.annualizedReturn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max Drawdown:</span>
                            <span className="font-mono">{formatPercentage(result.calmar.maxDrawdown)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Drawdown Duration:</span>
                            <span className="font-mono">{result.calmar.maxDrawdownDuration} days</span>
                          </div>
                          {result.calmar.recoveryTime && (
                            <div className="flex justify-between">
                              <span>Recovery Time:</span>
                              <span className="font-mono">{result.calmar.recoveryTime} days</span>
                            </div>
                          )}
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            {result.calmar.interpretation}
                          </div>
                        </div>
                      </div>
                    )}
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
            <p><strong>1.</strong> Select a test scenario or run comprehensive tests to evaluate all performance characteristics</p>
            <p><strong>2.</strong> Configure test parameters: symbol, data points, risk-free rate, and target return</p>
            <p><strong>3.</strong> Enable benchmark comparison for Information Ratio calculation</p>
            <p><strong>4.</strong> Run tests to calculate Sharpe, Sortino, Information, and Calmar ratios</p>
            <p><strong>5.</strong> Review results including interpretations and statistical significance</p>
            <p><strong>6.</strong> Compare different scenarios to understand performance behavior across market conditions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceRatiosTester;

