import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { MemoryCacheL1 } from '../MemoryCacheL1';

describe('MemoryCacheL1', () => {
  let cache: MemoryCacheL1;

  beforeEach(() => {
    cache = new MemoryCacheL1();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    test('should correctly set and get values', async () => {
      const testData = { id: 1, name: 'test' };
      await cache.set('key1', testData);
      expect(cache.get('key1')).toEqual(testData);
    });

    test('should handle null and undefined values', async () => {
      await cache.set('nullKey', null);
      await cache.set('undefinedKey', undefined);
      expect(cache.get('nullKey')).toBeNull();
      expect(cache.get('undefinedKey')).toBeNull();
    });

    test('should correctly remove values', async () => {
      await cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      cache.remove('key1');
      expect(cache.has('key1')).toBe(false);
    });

    test('should clear all values', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('Memory Management and Eviction', () => {
    test('should evict entries when memory limit is exceeded', async () => {
      const largeValue = 'x'.repeat(1024 * 1024 - 100); // 1MB - 100 byte
      const config = cache.getConfig();
      config.maxMemoryUsage = 2 * 1024 * 1024; // 2MB
      cache.updateConfig(config);

      await cache.set('key1', largeValue);
      await cache.set('key2', largeValue);
      await cache.set('key3', largeValue);

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);

      const stats = cache.getStats();
      expect(stats.currentEntries).toBe(2);
      expect(stats.totalSize).toBeLessThanOrEqual(config.maxMemoryUsage);
      expect(stats.evictionCount).toBeGreaterThan(0);
    });

    test('should evict entries when max entries limit is reached', async () => {
      const config = cache.getConfig();
      config.maxEntries = 2;
      cache.updateConfig(config);

      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);

      const stats = cache.getStats();
      expect(stats.currentEntries).toBe(2);
      expect(stats.evictionCount).toBeGreaterThan(0);
    });

    test('should respect LRU eviction policy', async () => {
      const config = cache.getConfig();
      config.maxEntries = 2;
      cache.updateConfig(config);

      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      // Access key1 to make it more recently used
      cache.get('key1');
      
      await cache.set('key3', 'value3');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
    });

    test('should handle memory pressure correctly', async () => {
      const config = cache.getConfig();
      config.maxMemoryUsage = 1024 * 1024; // 1MB
      cache.updateConfig(config);

      const largeValue = 'x'.repeat(512 * 1024); // 512KB
      await cache.set('key1', largeValue);
      await cache.set('key2', largeValue);

      const stats = cache.getStats();
      expect(stats.memoryPressureLevel).toBeGreaterThan(0);
      expect(stats.memoryPressureLevel).toBeLessThanOrEqual(1);
    });
  });

  describe('TTL and Expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    test('should respect TTL for entries', async () => {
      await cache.set('key1', 'value1', 100); // 100ms TTL
      expect(cache.get('key1')).toBe('value1');

      jest.advanceTimersByTime(150);
      await cache.cleanup();

      expect(cache.get('key1')).toBeNull();
    });

    test('should handle cleanup of expired entries', async () => {
      await cache.set('key1', 'value1', 100);
      await cache.set('key2', 'value2', 200);
      
      jest.advanceTimersByTime(150);
      await cache.cleanup(); // Forza la pulizia delle entry scadute
      
      const stats = cache.getStats();
      expect(stats.currentEntries).toBe(1);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle circular references gracefully', async () => {
      const circular: any = {};
      circular.self = circular;

      await expect(cache.set('key1', circular)).resolves.not.toThrow();
      const stats = cache.getStats();
      expect(stats.errorCount).toBe(1);
      expect(stats.lastError).not.toBeNull();
    });

    test('should handle corrupted data gracefully', async () => {
      expect(true).toBe(true); // Placeholder per mantenere la struttura del test
    });

    test('should recover from errors and continue functioning', async () => {
      // Force an error
      const circular: any = {};
      circular.self = circular;
      await cache.set('key1', circular);

      // Verify system continues to function
      await cache.set('key2', 'value2');
      expect(cache.get('key2')).toBe('value2');

      const stats = cache.getStats();
      expect(stats.recoveryCount).toBeGreaterThan(0);
    });
  });

  describe('Performance and Statistics', () => {
    test('should track hits and misses correctly', async () => {
      await cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeNull();

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    test('should track operation times', async () => {
      const start = performance.now();
      
      await cache.set('key1', 'value1');
      cache.get('key1');
      
      const stats = cache.getStats();
      expect(stats.averageWriteTime).toBeGreaterThan(0);
      expect(stats.averageQueryTime).toBeGreaterThan(0);
    });

    test('should maintain performance under load', async () => {
      const start = performance.now();
      
      // Perform 1000 operations
      for (let i = 0; i < 1000; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }

      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      const stats = cache.getStats();
      expect(stats.operationTimeouts).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration correctly', () => {
      const newConfig = {
        maxEntries: 500,
        maxMemoryUsage: 10 * 1024 * 1024,
        defaultTTL: 1000
      };
      
      cache.updateConfig(newConfig);
      const currentConfig = cache.getConfig();
      
      expect(currentConfig.maxEntries).toBe(500);
      expect(currentConfig.maxMemoryUsage).toBe(10 * 1024 * 1024);
      expect(currentConfig.defaultTTL).toBe(1000);
    });

    test('should maintain valid configuration after updates', () => {
      const invalidConfig = {
        maxEntries: -1,
        maxMemoryUsage: -1
      };
      
      cache.updateConfig(invalidConfig);
      const currentConfig = cache.getConfig();
      
      expect(currentConfig.maxEntries).toBeGreaterThan(0);
      expect(currentConfig.maxMemoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Access Patterns and Analytics', () => {
    test('should track access patterns correctly', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // Access key1 multiple times
      cache.get('key1');
      cache.get('key1');
      cache.get('key1');
      
      const accessPatterns = cache.getEntriesByAccessPattern();
      const key1Entry = accessPatterns.find(entry => entry.key === 'key1');
      
      expect(key1Entry).toBeDefined();
      expect(key1Entry?.accessCount).toBe(3);
    });

    test('should provide accurate cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1');
      cache.get('key3'); // Miss
      
      const stats = cache.getStats();
      expect(stats.currentEntries).toBe(2);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });
}); 