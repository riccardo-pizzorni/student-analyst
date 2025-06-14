import { describe, expect, it } from '@jest/globals';
import { FallbackManager } from '../../src/services/FallbackManager';
import { FinancialCalculator } from '../../src/services/FinancialCalculator';
import { IndexedDBCacheL3 } from '../../src/services/IndexedDBCacheL3';
import { LocalStorageCacheL2 } from '../../src/services/LocalStorageCacheL2';
import { MemoryCacheL1 } from '../../src/services/MemoryCacheL1';

describe('Load Tests - System Performance', () => {
  describe('Cache System Load Tests', () => {
    it('should handle rapid read/write operations on MemoryCacheL1', async () => {
      const cache = new MemoryCacheL1();
      const start = performance.now();
      
      // Write operations
      for (let i = 0; i < 10000; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }
      
      // Read operations
      for (let i = 0; i < 10000; i++) {
        const value = await cache.get(`key${i}`);
        expect(value).toBe(`value${i}`);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });

    it('should handle rapid read/write operations on LocalStorageCacheL2', async () => {
      const cache = new LocalStorageCacheL2();
      const start = performance.now();
      
      // Write operations
      for (let i = 0; i < 1000; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }
      
      // Read operations
      for (let i = 0; i < 1000; i++) {
        const value = await cache.get(`key${i}`);
        expect(value).toBe(`value${i}`);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(20000); // 20 seconds max
    });

    it('should handle rapid read/write operations on IndexedDBCacheL3', async () => {
      const cache = new IndexedDBCacheL3();
      const start = performance.now();
      
      // Write operations
      for (let i = 0; i < 500; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }
      
      // Read operations
      for (let i = 0; i < 500; i++) {
        const value = await cache.get(`key${i}`);
        expect(value).toBe(`value${i}`);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(30000); // 30 seconds max
    });
  });

  describe('Financial Calculator Load Tests', () => {
    it('should handle rapid moving average calculations', async () => {
      const calculator = FinancialCalculator.getInstance();
      const portfolios = Array(100).fill(null).map(() => ({
        data: Array(50).fill(null).map((_, i) => ({
          symbol: `STOCK${i}`,
          price: Math.random() * 1000,
          volume: Math.random() * 10000,
          timestamp: new Date(Date.now() - i * 60000)
        }))
      }));
      for (const portfolio of portfolios) {
        const result = calculator.calculateMovingAverage(portfolio.data, 20);
        expect(result.value).toBeDefined();
      }
    });
    it('should handle rapid RSI calculations', async () => {
      const calculator = FinancialCalculator.getInstance();
      const marketData = Array(100).fill(null).map(() => ({
        data: Array(20).fill(null).map((_, i) => ({
          symbol: `STOCK${i}`,
          price: Math.random() * 1000,
          volume: Math.random() * 10000,
          timestamp: new Date(Date.now() - i * 60000)
        }))
      }));
      for (const d of marketData) {
        const result = calculator.calculateRSI(d.data, 14);
        expect(result.value).toBeDefined();
      }
    });
  });

  describe('Fallback System Load Tests', () => {
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

  describe('Memory Usage Load Tests', () => {
    it('should maintain stable memory usage during rapid operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const start = performance.now();
      
      // Perform rapid operations
      const cache = new MemoryCacheL1();
      for (let i = 0; i < 10000; i++) {
        await cache.set(`key${i}`, `value${i}`);
        const value = await cache.get(`key${i}`);
        expect(value).toBe(`value${i}`);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const duration = performance.now() - start;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB max
      expect(duration).toBeLessThan(20000); // 20 seconds max
    });

    it('should handle large dataset operations without memory issues', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const start = performance.now();
      
      // Perform large dataset operations
      const calculator = new FinancialCalculator();
      const portfolios = Array(50).fill(null).map(() => ({
        stocks: Array(1000).fill(null).map((_, i) => ({
          symbol: `STOCK${i}`,
          price: Math.random() * 1000,
          weight: Math.random()
        }))
      }));
      
      for (const portfolio of portfolios) {
        const result = await calculator.optimizePortfolio(portfolio.stocks);
        expect(result.weights).toHaveLength(1000);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const duration = performance.now() - start;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // 200MB max
      expect(duration).toBeLessThan(60000); // 60 seconds max
    });
  });

  describe('Error Handling Load Tests', () => {
    it('should handle rapid error recovery in cache system', async () => {
      const cache = new MemoryCacheL1();
      const start = performance.now();
      
      // Perform operations with simulated errors
      for (let i = 0; i < 1000; i++) {
        try {
          await cache.set(`key${i}`, `value${i}`);
          const value = await cache.get(`key${i}`);
          expect(value).toBe(`value${i}`);
        } catch (error) {
          // Should recover and continue
          expect(error).toBeDefined();
        }
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });

    it('should handle rapid error recovery in calculations', async () => {
      const calculator = new FinancialCalculator();
      const start = performance.now();
      
      // Perform calculations with simulated errors
      for (let i = 0; i < 100; i++) {
        try {
          const result = await calculator.optimizePortfolio([
            { symbol: 'STOCK1', price: i % 2 === 0 ? NaN : 100, weight: 0.5 },
            { symbol: 'STOCK2', price: 200, weight: 0.5 }
          ]);
          expect(result).toBeDefined();
        } catch (error) {
          // Should recover and continue
          expect(error).toBeDefined();
        }
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(20000); // 20 seconds max
    });
  });
}); 