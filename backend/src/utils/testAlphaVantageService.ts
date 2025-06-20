/**
 * STUDENT ANALYST - Alpha Vantage Service Test Suite
 * =================================================
 *
 * Test completo per validare l'implementazione dell'AlphaVantageService
 * Include test per tutti i timeframe, error handling, cache, e validazione
 */

import {
  AlphaVantageError,
  AlphaVantageService,
  AlphaVantageTimeframe,
} from '../services/alphaVantageService';

/**
 * Configurazione test
 */
const TEST_CONFIG = {
  // Simboli di test (usa simboli reali per test completi)
  validSymbols: ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'],
  invalidSymbols: ['INVALID123', 'TOOLONG_SYMBOL', '!@#$%', ''],

  // Timeframe da testare
  timeframes: Object.values(AlphaVantage___timeframe),

  // Configurazione servizio per test
  serviceConfig: {
    baseUrl: process.env.BACKEND_URL || 'http://localhost:10000',
    timeout: 10000, // Timeout ridotto per test
    retryAttempts: 2,
    cacheEnabled: true,
    validateData: true,
  },
};

/**
 * Classe principale per i test
 */
export class AlphaVantageServiceTester {
  private service: AlphaVantageService;
  private testResults: Array<{
    testName: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    duration: number;
    error?: string;
    details?: unknown;
  }> = [];

  constructor() {
    this.service = new AlphaVantageService(TEST_CONFIG.serviceConfig);
  }

  /**
   * Esegue tutti i test
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Alpha Vantage Service Test Suite');
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
      // Test di base
      await this.testServiceInitialization();
      await this.testHealthCheck();
      await this.testValidation();

      // Test funzionalità principali
      await this.testGetStockDataDaily();
      await this.testGetStockDataIntraday();
      await this.testGetStockDataWeekly();
      await this.testGetStockDataMonthly();

      // Test error handling
      await this.testInvalidSymbols();
      await this.testInvalidTimeframes();
      await this.testNetworkErrors();

      // Test cache
      await this.testCacheFunctionality();

      // Test performance
      await this.testBatchRequests();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }

    const totalTime = Date.now() - startTime;
    this.printTestSummary(totalTime);
  }

  /**
   * Test inizializzazione servizio
   */
  private async testServiceInitialization(): Promise<void> {
    await this.runTest('Service Initialization', async () => {
      if (!this.service) {
        throw new Error('Service not initialized');
      }

      const health = await this.service.healthCheck();
      if (health.status !== 'healthy') {
        throw new Error('Service not healthy after initialization');
      }

      return { initialized: true, health };
    });
  }

  /**
   * Test health check
   */
  private async testHealthCheck(): Promise<void> {
    await this.runTest('Health Check', async () => {
      const health = await this.service.healthCheck();

      if (!health.status || !health.timestamp) {
        throw new Error('Invalid health check response');
      }

      return health;
    });
  }

  /**
   * Test validazione input
   */
  private async testValidation(): Promise<void> {
    await this.runTest('Input Validation - Valid Symbols', async () => {
      const results = [];

      for (const symbol of TEST_CONFIG.validSymbols) {
        const validation = this.service.validateRequest(
          symbol,
          AlphaVantageTimeframe.DAILY
        );
        if (!validation.valid) {
          throw new Error(
            `Valid symbol ${symbol} failed validation: ${validation.errors.join(', ')}`
          );
        }
        results.push({ symbol, valid: validation.valid });
      }

      return results;
    });

    await this.runTest('Input Validation - Invalid Symbols', async () => {
      const results = [];

      for (const symbol of TEST_CONFIG.invalidSymbols) {
        const validation = this.service.validateRequest(
          symbol,
          AlphaVantageTimeframe.DAILY
        );
        if (validation.valid) {
          throw new Error(`Invalid symbol ${symbol} passed validation`);
        }
        results.push({
          symbol,
          valid: validation.valid,
          errors: validation.errors,
        });
      }

      return results;
    });
  }

  /**
   * Test dati daily
   */
  private async testGetStockDataDaily(): Promise<void> {
    await this.runTest('Get Stock Data - Daily', async () => {
      const symbol = TEST_CONFIG.validSymbols[0]; // AAPL

      const response = await this.service.getStockData(
        symbol,
        AlphaVantageTimeframe.DAILY,
        { outputSize: 'compact' }
      );

      this.validateStockDataResponse(
        response,
        symbol,
        AlphaVantageTimeframe.DAILY
      );

      return {
        symbol,
        dataPoints: response.data.length,
        source: response.source,
        cached: response.cacheHit,
      };
    });
  }

  /**
   * Test dati intraday
   */
  private async testGetStockDataIntraday(): Promise<void> {
    await this.runTest('Get Stock Data - Intraday 5min', async () => {
      const symbol = TEST_CONFIG.validSymbols[1]; // MSFT

      const response = await this.service.getStockData(
        symbol,
        AlphaVantageTimeframe.INTRADAY_5MIN,
        { outputSize: 'compact' }
      );

      this.validateStockDataResponse(
        response,
        symbol,
        AlphaVantageTimeframe.INTRADAY_5MIN
      );

      return {
        symbol,
        dataPoints: response.data.length,
        source: response.source,
        cached: response.cacheHit,
      };
    });
  }

  /**
   * Test dati weekly
   */
  private async testGetStockDataWeekly(): Promise<void> {
    await this.runTest('Get Stock Data - Weekly', async () => {
      const symbol = TEST_CONFIG.validSymbols[2]; // GOOGL

      const response = await this.service.getStockData(
        symbol,
        AlphaVantageTimeframe.WEEKLY,
        { outputSize: 'compact' }
      );

      this.validateStockDataResponse(
        response,
        symbol,
        AlphaVantageTimeframe.WEEKLY
      );

      return {
        symbol,
        dataPoints: response.data.length,
        source: response.source,
        cached: response.cacheHit,
      };
    });
  }

  /**
   * Test dati monthly
   */
  private async testGetStockDataMonthly(): Promise<void> {
    await this.runTest('Get Stock Data - Monthly', async () => {
      const symbol = TEST_CONFIG.validSymbols[3]; // TSLA

      const response = await this.service.getStockData(
        symbol,
        AlphaVantageTimeframe.MONTHLY,
        { outputSize: 'compact' }
      );

      this.validateStockDataResponse(
        response,
        symbol,
        AlphaVantageTimeframe.MONTHLY
      );

      return {
        symbol,
        dataPoints: response.data.length,
        source: response.source,
        cached: response.cacheHit,
      };
    });
  }

  /**
   * Test simboli non validi
   */
  private async testInvalidSymbols(): Promise<void> {
    await this.runTest('Error Handling - Invalid Symbols', async () => {
      const results = [];

      for (const invalidSymbol of TEST_CONFIG.invalidSymbols) {
        try {
          await this.service.getStockData(
            invalidSymbol,
            AlphaVantageTimeframe.DAILY
          );
          throw new Error(
            `Expected error for invalid symbol: ${invalidSymbol}`
          );
        } catch (error) {
          if (!(error instanceof AlphaVantageError)) {
            throw new Error(`Expected AlphaVantageError, got: ${error}`);
          }

          results.push({
            symbol: invalidSymbol,
            errorType: error.type,
            message: error.message,
          });
        }
      }

      return results;
    });
  }

  /**
   * Test timeframe non validi
   */
  private async testInvalidTimeframes(): Promise<void> {
    await this.runTest('Error Handling - Invalid Timeframes', async () => {
      const invalidTimeframes = ['invalid', '2min', 'hourly', 'yearly'];
      const results = [];

      for (const timeframe of invalidTimeframes) {
        try {
          await this.service.getStockData(
            TEST_CONFIG.validSymbols[0],
            timeframe as AlphaVantageTimeframe
          );
          throw new Error(`Expected error for invalid timeframe: ${timeframe}`);
        } catch (error) {
          if (!(error instanceof AlphaVantageError)) {
            throw new Error(`Expected AlphaVantageError, got: ${error}`);
          }

          results.push({
            timeframe,
            errorType: error.type,
            message: error.message,
          });
        }
      }

      return results;
    });
  }

  /**
   * Test errori di rete (simulati)
   */
  private async testNetworkErrors(): Promise<void> {
    await this.runTest('Error Handling - Network Errors', async () => {
      // Crea servizio con URL non valido per simulare errore di rete
      const faultyService = new AlphaVantageService({
        baseUrl: 'http://invalid-url-that-does-not-exist.com',
        timeout: 1000,
        retryAttempts: 1,
      });

      try {
        await faultyService.getStockData('AAPL', AlphaVantageTimeframe.DAILY);
        throw new Error('Expected network error');
      } catch (error) {
        if (!(error instanceof AlphaVantageError)) {
          throw new Error(`Expected AlphaVantageError, got: ${error}`);
        }

        return {
          errorType: error.type,
          retryable: error.retryable,
          message: error.message,
        };
      }
    });
  }

  /**
   * Test funzionalità cache
   */
  private async testCacheFunctionality(): Promise<void> {
    await this.runTest('Cache Functionality', async () => {
      const symbol = TEST_CONFIG.validSymbols[0];

      // Prima chiamata (dovrebbe andare in cache)
      const response1 = await this.service.getStockData(
        symbol,
        AlphaVantageTimeframe.DAILY,
        { useCache: true }
      );

      // Seconda chiamata (dovrebbe usare cache)
      const response2 = await this.service.getStockData(
        symbol,
        AlphaVantageTimeframe.DAILY,
        { useCache: true }
      );

      // Terza chiamata senza cache
      const response3 = await this.service.getStockData(
        symbol,
        AlphaVantageTimeframe.DAILY,
        { useCache: false }
      );

      return {
        firstCall: { cached: response1.cacheHit, source: response1.source },
        secondCall: { cached: response2.cacheHit, source: response2.source },
        thirdCall: { cached: response3.cacheHit, source: response3.source },
        cacheStats: this.service.getCacheStats(),
      };
    });
  }

  /**
   * Test richieste batch
   */
  private async testBatchRequests(): Promise<void> {
    await this.runTest('Batch Requests Performance', async () => {
      const symbols = TEST_CONFIG.validSymbols.slice(0, 3); // Primi 3 simboli
      const startTime = Date.now();

      const promises = symbols.map(symbol =>
        this.service.getStockData(symbol, AlphaVantageTimeframe.DAILY)
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        totalSymbols: symbols.length,
        successful,
        failed,
        totalTime: endTime - startTime,
        avgTimePerSymbol: (endTime - startTime) / symbols.length,
      };
    });
  }

  /**
   * Valida la risposta dei dati azionari
   */
  private validateStockDataResponse(
    response: {
      success: boolean;
      data: Array<{
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>;
      metadata: {
        symbol: string;
        timeframe: string;
        lastRefreshed: string;
        outputSize: string;
      };
      source: 'alpha_vantage' | 'cache';
      cacheHit: boolean;
    },
    symbol: string,
    timeframe: AlphaVantageTimeframe
  ): void {
    if (!response.success) {
      throw new Error('Response indicates failure');
    }

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid data format');
    }

    if (response.data.length === 0) {
      throw new Error('No data returned');
    }

    if (!response.metadata) {
      throw new Error('Missing metadata');
    }

    if (response.source !== 'alpha_vantage' && response.source !== 'cache') {
      throw new Error(`Invalid source: ${response.source}`);
    }

    // Valida struttura dati OHLCV
    const firstDataPoint = response.data[0];
    const requiredFields = ['date', 'open', 'high', 'low', 'close', 'volume'];

    for (const field of requiredFields) {
      if (!(field in firstDataPoint)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Valida tipi di dati
    if (typeof firstDataPoint.open !== 'number' || firstDataPoint.open <= 0) {
      throw new Error('Invalid open price');
    }

    if (typeof firstDataPoint.high !== 'number' || firstDataPoint.high <= 0) {
      throw new Error('Invalid high price');
    }

    if (typeof firstDataPoint.low !== 'number' || firstDataPoint.low <= 0) {
      throw new Error('Invalid low price');
    }

    if (typeof firstDataPoint.close !== 'number' || firstDataPoint.close <= 0) {
      throw new Error('Invalid close price');
    }

    if (
      typeof firstDataPoint.volume !== 'number' ||
      firstDataPoint.volume < 0
    ) {
      throw new Error('Invalid volume');
    }

    // Valida logica OHLC
    if (firstDataPoint.high < firstDataPoint.low) {
      throw new Error('High price is less than low price');
    }
  }

  /**
   * Esegue un singolo test
   */
  private async runTest(
    testName: string,
    testFunction: () => Promise<unknown>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`🔄 Running: ${testName}`);

      const result = await testFunction();
      const duration = Date.now() - startTime;

      this.testResults.push({
        testName,
        status: 'PASS',
        duration,
        details: result,
      });

      console.log(`✅ PASS: ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.testResults.push({
        testName,
        status: 'FAIL',
        duration,
        error: errorMessage,
      });

      console.log(`❌ FAIL: ${testName} (${duration}ms)`);
      console.log(`   Error: ${errorMessage}`);
    }
  }

  /**
   * Stampa il riassunto dei test
   */
  private printTestSummary(totalTime: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Average Time per Test: ${(totalTime / total).toFixed(1)}ms`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(test => {
          console.log(`  - ${test.testName}: ${test.error}`);
        });
    }

    console.log('\n📈 PERFORMANCE METRICS:');
    const avgDuration =
      this.testResults.reduce((sum, test) => sum + test.duration, 0) / total;
    const slowestTest = this.testResults.reduce((prev, current) =>
      prev.duration > current.duration ? prev : current
    );
    const fastestTest = this.testResults.reduce((prev, current) =>
      prev.duration < current.duration ? prev : current
    );

    console.log(`  Average Duration: ${avgDuration.toFixed(1)}ms`);
    console.log(
      `  Slowest Test: ${slowestTest.testName} (${slowestTest.duration}ms)`
    );
    console.log(
      `  Fastest Test: ${fastestTest.testName} (${fastestTest.duration}ms)`
    );

    // Cache stats
    const cacheStats = this.service.getCacheStats();
    console.log('\n💾 CACHE STATISTICS:');
    console.log(`  Cache Size: ${cacheStats.size} entries`);
    console.log(
      `  Cache Keys: ${cacheStats.keys.length > 0 ? cacheStats.keys.join(', ') : 'None'}`
    );

    console.log('\n🎯 RECOMMENDATIONS:');
    if (failed === 0) {
      console.log(
        '  ✅ All tests passed! Alpha Vantage Service is working correctly.'
      );
    } else {
      console.log(
        '  ⚠️  Some tests failed. Review the errors above and check:'
      );
      console.log('     - API key configuration');
      console.log('     - Network connectivity');
      console.log('     - Alpha Vantage service status');
    }

    if (avgDuration > 5000) {
      console.log(
        '  ⚡ Consider optimizing for better performance (avg > 5s per test)'
      );
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Ottiene i risultati dei test
   */
  getTestResults(): typeof this.testResults {
    return this.testResults;
  }
}

/**
 * Funzione di utilità per eseguire i test
 */
export async function runAlphaVantageTests(): Promise<void> {
  const tester = new AlphaVantageServiceTester();
  await tester.runAllTests();
}

/**
 * Esecuzione diretta se chiamato come script
 */
if (require.main === module) {
  runAlphaVantageTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}
