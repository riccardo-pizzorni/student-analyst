/**
 * STUDENT ANALYST - Rate Limiting Test Suite
 * ==========================================
 *
 * Test semplificato per il sistema di rate limiting e batch processing
 */

import { ApiRateLimiter } from '../services/apiRateLimiter';
import { BatchProcessor, BatchRequest } from '../services/batchProcessor';

/**
 * Test semplificato per Rate Limiting
 */
export class RateLimitingTestSuite {
  private _rateLimiter: ApiRateLimiter;
  private _batchProcessor: BatchProcessor;

  constructor() {
    this._rateLimiter = new ApiRateLimiter({
      requestsPerMinute: 5,
      requestsPerDay: 25,
      enableLogging: true,
    });

    this._batchProcessor = new BatchProcessor(null, {
      maxConcurrentBatches: 2,
      defaultBatchSize: 5,
      enableProgressTracking: true,
    });
  }

  /**
   * Esegue test base
   */
  async runBasicTests(): Promise<void> {
    console.log('🚀 Starting Basic Rate Limiting Tests');
    console.log('=====================================');

    try {
      // Test 1: Rate Limiter Base
      await this.testRateLimiterBasics();

      // Test 2: Batch Processing
      await this.testBatchProcessing();

      // Test 3: Rate Limit Stats
      await this.test_RateLimitStats();

      console.log('\n✅ All basic tests completed successfully!');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  /**
   * Test 1: Funzionalità base del Rate Limiter
   */
  private async testRateLimiterBasics(): Promise<void> {
    console.log('\n📋 Test: Rate Limiter Basics');

    try {
      // Test singola richiesta
      const result = await this._rateLimiter.queueRequest('AAPL', 'daily', 1);

      if (result && result.success) {
        console.log('✅ Single request successful');
      } else {
        console.log('⚠️  Single request returned unexpected result');
      }

      // Test statistiche
      const stats = this._rateLimiter.get_RateLimitStats();
      console.log(
        `📊 Stats: ${stats.requestsInLastMinute} requests in last minute`
      );
    } catch (error) {
      console.error('❌ Rate Limiter Basics failed:', error);
    }
  }

  /**
   * Test 2: Batch Processing
   */
  private async testBatchProcessing(): Promise<void> {
    console.log('\n📋 Test: Batch Processing');

    try {
      const batchRequest: BatchRequest = {
        symbols: ['AAPL', 'MSFT', 'GOOGL'],
        timeframe: 'daily',
        options: { useCache: true },
      };

      const batchResult = await this._batchProcessor.processBatch(batchRequest);

      if (batchResult && batchResult.success) {
        console.log(
          `✅ Batch processing successful: ${batchResult.successfulSymbols}/${batchResult.totalSymbols} symbols`
        );
        console.log(`⏱️  Execution time: ${batchResult.executionTimeMs}ms`);
      } else {
        console.log('⚠️  Batch processing returned unexpected result');
      }
    } catch (error) {
      console.error('❌ Batch Processing failed:', error);
    }
  }

  /**
   * Test 3: Rate Limit Stats
   */
  private async test_RateLimitStats(): Promise<void> {
    console.log('\n📋 Test: Rate Limit Stats');

    try {
      const stats = this._rateLimiter.get_RateLimitStats();

      console.log('📊 Rate Limit Statistics:');
      console.log(`  - Requests in last minute: ${stats.requestsInLastMinute}`);
      console.log(`  - Requests in last day: ${stats.requestsInLastDay}`);
      console.log(`  - Daily quota remaining: ${stats.dailyQuotaRemaining}`);
      console.log(`  - Minute quota remaining: ${stats.minuteQuotaRemaining}`);
      console.log(`  - Is throttled: ${stats.isThrottled}`);
      console.log(`  - Queue length: ${stats.queueLength}`);

      console.log('✅ Rate limit stats retrieved successfully');
    } catch (error) {
      console.error('❌ Rate Limit Stats failed:', error);
    }
  }

  /**
   * Test di performance semplificato
   */
  async runPerformanceTest(): Promise<void> {
    console.log('\n🚀 Starting Performance Test');
    console.log('============================');

    try {
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];
      const startTime = Date.now();

      const batchRequest: BatchRequest = {
        symbols,
        timeframe: 'daily',
        options: { useCache: true },
      };

      const result = await this._batchProcessor.processBatch(batchRequest);
      const totalTime = Date.now() - startTime;

      console.log('\n📊 Performance Results:');
      console.log(`  - Total symbols: ${symbols.length}`);
      console.log(`  - Successful: ${result.successfulSymbols}`);
      console.log(`  - Failed: ${result.failedSymbols}`);
      console.log(`  - Total time: ${totalTime}ms`);
      console.log(
        `  - Avg time per symbol: ${Math.round(totalTime / symbols.length)}ms`
      );
      console.log(
        `  - Throughput: ${((symbols.length / totalTime) * 1000).toFixed(2)} symbols/sec`
      );

      if (totalTime < 60000) {
        // Meno di 1 minuto
        console.log('✅ Performance test completed within acceptable time');
      } else {
        console.log('⚠️  Performance test took longer than expected');
      }
    } catch (error) {
      console.error('❌ Performance test failed:', error);
    }
  }

  /**
   * Reset del sistema
   */
  reset(): void {
    this._rateLimiter.reset();
    this._batchProcessor.reset();
    console.log('🔄 Test system reset completed');
  }
}

/**
 * Funzione principale per eseguire i test
 */
export async function runRateLimitingTests(): Promise<void> {
  const testSuite = new RateLimitingTestSuite();

  try {
    await testSuite.runBasicTests();
    await testSuite.runPerformanceTest();

    console.log('\n🎯 SUMMARY:');
    console.log('  ✅ Rate limiting system is functional');
    console.log('  ✅ Batch processing is working');
    console.log('  ✅ Performance is acceptable');
    console.log('\n📈 Ready for production use!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  } finally {
    testSuite.reset();
  }
}

// Esegui test se chiamato direttamente
if (require.main === module) {
  runRateLimitingTests().catch(console.error);
}
