import { describe, expect, it } from '@jest/globals';
import { FallbackManager } from '../../src/services/FallbackManager';
import { FinancialCalculator } from '../../src/services/FinancialCalculator';
import { LocalStorageCacheL2 } from '../../src/services/LocalStorageCacheL2';
import { MemoryCacheL1 } from '../../src/services/MemoryCacheL1';

describe('Memory Profiling Tests', () => {
  describe('Cache System Memory Profiling', () => {
    it('should profile memory usage of MemoryCacheL1', async () => {
      const cache = new MemoryCacheL1();
      const initialMemory = process.memoryUsage();
      
      // Fill cache with data
      for (let i = 0; i < 10000; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }
      
      const afterFillMemory = process.memoryUsage();
      const fillMemoryIncrease = afterFillMemory.heapUsed - initialMemory.heapUsed;
      
      // Clear cache
      await cache.clear();
      
      const afterClearMemory = process.memoryUsage();
      const clearMemoryDecrease = afterFillMemory.heapUsed - afterClearMemory.heapUsed;
      
      // Memory should be properly managed
      expect(fillMemoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB max
      expect(clearMemoryDecrease).toBeGreaterThan(fillMemoryIncrease * 0.8); // 80% recovery
    });

    it('should profile memory usage of LocalStorageCacheL2', async () => {
      const cache = new LocalStorageCacheL2();
      const initialMemory = process.memoryUsage();
      
      // Fill cache with data
      for (let i = 0; i < 1000; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }
      
      const afterFillMemory = process.memoryUsage();
      const fillMemoryIncrease = afterFillMemory.heapUsed - initialMemory.heapUsed;
      
      // Clear cache
      await cache.clear();
      
      const afterClearMemory = process.memoryUsage();
      const clearMemoryDecrease = afterFillMemory.heapUsed - afterClearMemory.heapUsed;
      
      // Memory should be properly managed
      expect(fillMemoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB max
      expect(clearMemoryDecrease).toBeGreaterThan(fillMemoryIncrease * 0.8); // 80% recovery
    });

    it.skip('should profile memory usage of IndexedDBCacheL3 (SKIPPED: jsdom limitation)', async () => {
      // Test disabilitato: IndexedDB non supportato in ambiente Jest/jsdom
    });
  });

  describe('Financial Calculator Memory Profiling', () => {
    it('should profile memory usage during moving average calculations', async () => {
      const calculator = FinancialCalculator.getInstance();
      const initialMemory = process.memoryUsage();
      const portfolio = {
        data: Array(1000).fill(null).map((_, i) => ({
          symbol: `STOCK${i}`,
          price: Math.random() * 1000,
          volume: Math.random() * 10000,
          timestamp: new Date(Date.now() - i * 60000)
        }))
      };
      const result = calculator.calculateMovingAverage(portfolio.data, 20);
      const afterOptimizationMemory = process.memoryUsage();
      const optimizationMemoryIncrease = afterOptimizationMemory.heapUsed - initialMemory.heapUsed;
      expect(optimizationMemoryIncrease).toBeLessThan(200 * 1024 * 1024);
      expect(result).toBeDefined();
    });
    it('should profile memory usage during RSI calculations', async () => {
      const calculator = FinancialCalculator.getInstance();
      const initialMemory = process.memoryUsage();
      const marketData = {
        data: Array(10000).fill(null).map((_, i) => ({
          symbol: `STOCK${i}`,
          price: Math.random() * 1000,
          volume: Math.random() * 10000,
          timestamp: new Date(Date.now() - i * 60000)
        }))
      };
      const result = calculator.calculateRSI(marketData.data, 14);
      const afterCalculationMemory = process.memoryUsage();
      const calculationMemoryIncrease = afterCalculationMemory.heapUsed - initialMemory.heapUsed;
      expect(calculationMemoryIncrease).toBeLessThan(100 * 1024 * 1024);
      expect(result).toBeDefined();
    });
  });

  describe('Fallback System Memory Profiling', () => {
    it('should profile memory usage during provider fallbacks', async () => {
      const fallback = FallbackManager.getInstance();
      fallback.registerProvider('p1', 'Provider1');
      fallback.registerProvider('p2', 'Provider2');
      for (let i = 0; i < 10; i++) {
        fallback.recordFailure('p1', 'Simulated failure');
        fallback.recordSuccess('p2');
      }
      const initialMemory = process.memoryUsage();
      const available = fallback.getAvailableProviders();
      const afterFallbackMemory = process.memoryUsage();
      const fallbackMemoryIncrease = afterFallbackMemory.heapUsed - initialMemory.heapUsed;
      expect(fallbackMemoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(available.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should detect memory leaks in cache operations', async () => {
      const cache = new MemoryCacheL1();
      const initialMemory = process.memoryUsage();
      
      // Perform operations that might cause leaks
      for (let i = 0; i < 1000; i++) {
        await cache.set(`key${i}`, `value${i}`);
        await cache.get(`key${i}`);
      }
      
      const afterOperationsMemory = process.memoryUsage();
      const memoryIncrease = afterOperationsMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory should not leak
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB max
    });

    it('should detect memory leaks in calculations', async () => {
      const calculator = FinancialCalculator.getInstance();
      const initialMemory = process.memoryUsage();
      for (let i = 0; i < 100; i++) {
        const portfolio = {
          data: Array(100).fill(null).map((_, i) => ({
            symbol: `STOCK${i}`,
            price: Math.random() * 1000,
            volume: Math.random() * 10000,
            timestamp: new Date(Date.now() - i * 60000)
          }))
        };
        calculator.calculateMovingAverage(portfolio.data, 20);
      }
      const afterCalculationsMemory = process.memoryUsage();
      const memoryIncrease = afterCalculationsMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Garbage Collection Behavior', () => {
    it('should verify garbage collection after cache operations', async () => {
      const cache = new MemoryCacheL1();
      const initialMemory = process.memoryUsage();
      
      // Fill cache
      for (let i = 0; i < 10000; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }
      
      const afterFillMemory = process.memoryUsage();
      
      // Clear cache
      await cache.clear();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const afterGCMemory = process.memoryUsage();
      const memoryRecovery = afterFillMemory.heapUsed - afterGCMemory.heapUsed;
      
      // Memory should be recovered
      expect(memoryRecovery).toBeGreaterThan(0);
    });

    it('should verify garbage collection after calculations', async () => {
      const calculator = FinancialCalculator.getInstance();
      const initialMemory = process.memoryUsage();
      for (let i = 0; i < 100; i++) {
        const portfolio = {
          data: Array(1000).fill(null).map((_, i) => ({
            symbol: `STOCK${i}`,
            price: Math.random() * 1000,
            volume: Math.random() * 10000,
            timestamp: new Date(Date.now() - i * 60000)
          }))
        };
        calculator.calculateMovingAverage(portfolio.data, 20);
      }
      const afterCalculationsMemory = process.memoryUsage();
      if (global.gc) {
        global.gc();
      }
      const afterGCMemory = process.memoryUsage();
      const memoryRecovery = afterCalculationsMemory.heapUsed - afterGCMemory.heapUsed;
      expect(memoryRecovery).toBeGreaterThan(0);
    });
  });
}); 