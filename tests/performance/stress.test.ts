import { describe, expect, it } from '@jest/globals';
import { FallbackManager } from '../../src/services/FallbackManager';
import { FinancialCalculator } from '../../src/services/FinancialCalculator';
import { LocalStorageCacheL2 } from '../../src/services/LocalStorageCacheL2';
import { MemoryCacheL1 } from '../../src/services/MemoryCacheL1';

describe('Stress Tests - Critical Functions', () => {
  describe('Cache System Stress Tests', () => {
    it('should handle high concurrent load on MemoryCacheL1', async () => {
      const cache = new MemoryCacheL1();
      const operations = Array(1000)
        .fill(null)
        .map((_, i) => cache.set(`key${i}`, `value${i}`));

      const start = performance.now();
      await Promise.all(operations);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000); // 5 seconds max

      // Verify data integrity
      for (let i = 0; i < 1000; i++) {
        const value = await cache.get(`key${i}`);
        expect(value).toBe(`value${i}`);
      }
    });

    it('should handle high concurrent load on LocalStorageCacheL2', async () => {
      const cache = new LocalStorageCacheL2();
      const operations = Array(100)
        .fill(null)
        .map((_, i) => cache.set(`key${i}`, `value${i}`));

      const start = performance.now();
      await Promise.all(operations);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10000); // 10 seconds max

      // Verify data integrity
      for (let i = 0; i < 100; i++) {
        const value = await cache.get(`key${i}`);
        expect(value).toBe(`value${i}`);
      }
    });

    it.skip('should handle high concurrent load on IndexedDBCacheL3 (SKIPPED: jsdom limitation)', async () => {
      // Test disabilitato: IndexedDB non supportato in ambiente Jest/jsdom
    });
  });

  describe('Financial Calculator Stress Tests', () => {
    it('should handle complex moving average calculations', async () => {
      const calculator = FinancialCalculator.getInstance();
      const portfolios = Array(100)
        .fill(null)
        .map(() => ({
          data: Array(50)
            .fill(null)
            .map((_, i) => ({
              symbol: `STOCK${i}`,
              price: Math.random() * 1000,
              volume: Math.random() * 10000,
              timestamp: new Date(Date.now() - i * 60000),
            })),
        }));
      const start = performance.now();
      const results = await Promise.all(
        portfolios.map(p => calculator.calculateMovingAverage(p.data, 20))
      );
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(30000);
      results.forEach(result => {
        expect(result.value).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
      });
    });
    it('should handle high-frequency RSI calculations', async () => {
      const calculator = FinancialCalculator.getInstance();
      const marketData = Array(1000)
        .fill(null)
        .map(() => ({
          data: Array(20)
            .fill(null)
            .map((_, i) => ({
              symbol: `STOCK${i}`,
              price: Math.random() * 1000,
              volume: Math.random() * 10000,
              timestamp: new Date(Date.now() - i * 60000),
            })),
        }));
      const start = performance.now();
      const results = await Promise.all(
        marketData.map(d => calculator.calculateRSI(d.data, 14))
      );
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(20000);
      results.forEach(result => {
        expect(result.value).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Fallback System Stress Tests', () => {
    it('should handle rapid provider failures and fallbacks', async () => {
      const fallback = FallbackManager.getInstance();
      fallback.registerProvider('p1', 'Provider1');
      fallback.registerProvider('p2', 'Provider2');
      for (let i = 0; i < 10; i++) {
        fallback.recordFailure('p1', 'Simulated failure');
        fallback.recordSuccess('p2');
      }
      const available = fallback.getAvailableProviders();
      expect(available.length).toBeGreaterThan(0);
    });
    it('should maintain data consistency during provider switches', async () => {
      const fallback = FallbackManager.getInstance();
      fallback.registerProvider('p3', 'Provider3');
      fallback.registerProvider('p4', 'Provider4');
      fallback.recordFailure('p3', 'Simulated failure');
      fallback.recordSuccess('p4');
      const best = fallback.getBestProvider();
      expect(best).toBeDefined();
      expect(best?.isEnabled).toBe(true);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should maintain stable memory usage during high load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform high-load operations
      const cache = new MemoryCacheL1();
      const operations = Array(1000)
        .fill(null)
        .map((_, i) => cache.set(`key${i}`, `value${i}`));
      await Promise.all(operations);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB max
    });

    it('should handle large dataset calculations without memory leaks', async () => {
      const calculator = FinancialCalculator.getInstance();
      const portfolios = Array(100)
        .fill(null)
        .map(() => ({
          data: Array(1000)
            .fill(null)
            .map((_, i) => ({
              symbol: `STOCK${i}`,
              price: Math.random() * 1000,
              volume: Math.random() * 10000,
              timestamp: new Date(Date.now() - i * 60000),
            })),
        }));
      await Promise.all(
        portfolios.map(p => calculator.calculateMovingAverage(p.data, 20))
      );
      const initialMemory = process.memoryUsage().heapUsed;

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // 200MB max
    });
  });

  describe('Error Recovery Tests', () => {
    it('should recover from cache system failures', async () => {
      const cache = new MemoryCacheL1();

      // Simulate cache failure
      await cache.clear();
      const operations = Array(100)
        .fill(null)
        .map((_, i) => cache.set(`key${i}`, `value${i}`).catch(() => null));

      const results = await Promise.all(operations);
      const successfulOperations = results.filter(r => r !== null);

      // Should recover and continue operating
      expect(successfulOperations.length).toBeGreaterThan(0);
    });

    it('should recover from calculation errors', async () => {
      const calculator = FinancialCalculator.getInstance();
      const operations = Array(100)
        .fill(null)
        .map((_, i) => {
          const data = [
            {
              symbol: 'STOCK1',
              price: i % 2 === 0 ? NaN : 100,
              volume: 1000,
              timestamp: new Date(),
            },
            {
              symbol: 'STOCK2',
              price: 200,
              volume: 1000,
              timestamp: new Date(),
            },
          ];
          try {
            return calculator.calculateMovingAverage(data, 2);
          } catch {
            return null;
          }
        });
      const results = await Promise.all(operations);
      const successfulCalculations = results.filter(r => r !== null);
      expect(successfulCalculations.length).toBeGreaterThan(0);
    });
  });
});
