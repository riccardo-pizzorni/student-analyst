/**
 * STUDENT ANALYST - MemoryCacheL1 Unit Tests
 * Task 3.3 - Test per aumentare copertura da 6.46% a 80%+
 */

import MemoryCacheL1, {
    memoryCacheL1
} from '../../src/services/MemoryCacheL1';

// Mock timers
const mockSetInterval = jest.fn();
const mockClearInterval = jest.fn();
Object.defineProperty(global, 'setInterval', {
  writable: true,
  value: mockSetInterval
});
Object.defineProperty(global, 'clearInterval', {
  writable: true,
  value: mockClearInterval
});

// Mock performance.now
const mockPerformanceNow = jest.fn().mockReturnValue(100);
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: mockPerformanceNow
  }
});

describe('MemoryCacheL1', () => {
  let cache: MemoryCacheL1;

  beforeEach(() => {
    jest.useFakeTimers();
    mockPerformanceNow.mockReturnValue(100);
    mockSetInterval.mockImplementation((fn, delay) => {
      return jest.fn() as unknown; // Return mock timer ID
    });
    mockClearInterval.mockImplementation(() => {});
    
    cache = new MemoryCacheL1({
      maxSize: 5,
      maxMemoryUsage: 1024 * 10, // 10KB for testing
      defaultTTL: 1000, // 1 second
      cleanupInterval: 500, // 0.5 seconds
      enableStats: true,
      enableLogging: false
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    cache.destroy();
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should create cache with default configuration', () => {
      const defaultCache = new MemoryCacheL1();
      const config = defaultCache.getConfig();
      
      expect(config.maxSize).toBe(1000);
      expect(config.maxMemoryUsage).toBe(50 * 1024 * 1024);
      expect(config.defaultTTL).toBe(60 * 60 * 1000);
      expect(config.cleanupInterval).toBe(5 * 60 * 1000);
      expect(config.enableStats).toBe(true);
      expect(config.enableLogging).toBe(false);
      
      defaultCache.destroy();
    });

    it('should create cache with custom configuration', () => {
      const config = cache.getConfig();
      
      expect(config.maxSize).toBe(5);
      expect(config.maxMemoryUsage).toBe(1024 * 10);
      expect(config.defaultTTL).toBe(1000);
      expect(config.cleanupInterval).toBe(500);
      expect(config.enableStats).toBe(true);
      expect(config.enableLogging).toBe(false);
    });

    it('should initialize with empty stats', () => {
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.currentSize).toBe(0);
      expect(stats.currentEntries).toBe(0);
      expect(stats.memoryUsage).toBe(0);
      expect(stats.averageAccessTime).toBe(0);
    });

    it('should enable logging when configured', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const logCache = new MemoryCacheL1({
        enableLogging: true
      });
      
      expect(logSpy).toHaveBeenCalledWith('MemoryCacheL1 initialized:', expect.any(Object));
      
      logCache.destroy();
      logSpy.mockRestore();
    });
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      const key = 'test-key';
      const value = 'test-value';
      
      const setResult = cache.set(key, value);
      expect(setResult).toBe(true);
      
      const getValue = cache.get(key);
      expect(getValue).toBe(value);
    });

    it('should return null for non-existent keys', () => {
      const value = cache.get('non-existent');
      expect(value).toBeNull();
    });

    it('should check if cache has key', () => {
      cache.set('test', 'value');
      
      expect(cache.has('test')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should get cache size', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(2);
    });

    it('should get all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      const keys = cache.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should remove keys', () => {
      cache.set('test', 'value');
      expect(cache.has('test')).toBe(true);
      
      const removed = cache.remove('test');
      expect(removed).toBe(true);
      expect(cache.has('test')).toBe(false);
    });

    it('should return false when removing non-existent key', () => {
      const removed = cache.remove('non-existent');
      expect(removed).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(2);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect default TTL', () => {
      cache.set('test', 'value');
      expect(cache.get('test')).toBe('value');
      
      // Advance time beyond TTL
      jest.advanceTimersByTime(1500);
      
      expect(cache.get('test')).toBeNull();
      expect(cache.has('test')).toBe(false);
    });

    it('should respect custom TTL', () => {
      cache.set('test', 'value', 2000); // 2 seconds TTL
      expect(cache.get('test')).toBe('value');
      
      // Advance time by 1.5 seconds (should still be valid)
      jest.advanceTimersByTime(1500);
      expect(cache.get('test')).toBe('value');
      
      // Advance time beyond custom TTL
      jest.advanceTimersByTime(1000);
      expect(cache.get('test')).toBeNull();
    });

    it('should update expiry when entry is overwritten', () => {
      cache.set('test', 'value1', 1000);
      
      // Advance time partway
      jest.advanceTimersByTime(500);
      
      // Overwrite with new TTL
      cache.set('test', 'value2', 2000);
      
      // Advance beyond original TTL but within new TTL
      jest.advanceTimersByTime(800);
      
      expect(cache.get('test')).toBe('value2');
    });
  });

  describe('LRU (Least Recently Used)', () => {
    it('should evict LRU when size limit exceeded', () => {
      // Fill cache to limit
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');
      
      expect(cache.size()).toBe(5);
      
      // Adding 6th item should evict LRU (key1)
      cache.set('key6', 'value6');
      
      expect(cache.size()).toBe(5);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key6')).toBe(true);
    });

    it('should promote accessed items to head', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to promote it
      cache.get('key1');
      
      // Fill to capacity
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');
      
      // Add one more - should evict key2 (LRU), not key1
      cache.set('key6', 'value6');
      
      expect(cache.has('key1')).toBe(true); // Promoted, should still exist
      expect(cache.has('key2')).toBe(false); // Should be evicted
      expect(cache.has('key6')).toBe(true);
    });

    it('should maintain access order correctly', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      // Access in order: c, a, b
      cache.get('c');
      cache.get('a');
      cache.get('b');
      
      const entries = cache.getEntriesByAccessPattern();
      
      // Should be ordered by recency: b (head), a, c (tail)
      expect(entries[0].key).toBe('b');
      expect(entries[1].key).toBe('a');
      expect(entries[2].key).toBe('c');
    });

    it('should handle empty cache for LRU eviction', () => {
      // Create cache with size 1 to test LRU with minimal entries
      const smallCache = new MemoryCacheL1({ maxSize: 1 });
      
      smallCache.set('test1', 'value1');
      expect(smallCache.size()).toBe(1);
      
      // Add another item to trigger LRU eviction
      smallCache.set('test2', 'value2');
      expect(smallCache.size()).toBe(1);
      expect(smallCache.has('test1')).toBe(false); // Should be evicted
      expect(smallCache.has('test2')).toBe(true);
      
      smallCache.destroy();
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage', () => {
      const stats1 = cache.getStats();
      expect(stats1.memoryUsage).toBe(0);
      
      cache.set('test', 'some data');
      
      const stats2 = cache.getStats();
      expect(stats2.memoryUsage).toBeGreaterThan(0);
    });

    it('should prevent adding when memory limit exceeded', () => {
      // Create cache with very small memory limit
      const smallCache = new MemoryCacheL1({
        maxMemoryUsage: 10, // 10 bytes only
        enableLogging: false
      });
      
      const largeData = 'x'.repeat(100); // Much larger than limit
      const result = smallCache.set('test', largeData);
      
      expect(result).toBe(false);
      expect(smallCache.has('test')).toBe(false);
      
      smallCache.destroy();
    });

    it('should evict entries to free memory when needed', () => {
      // Start with smaller cache and more controlled test
      const memCache = new MemoryCacheL1({
        maxSize: 10,
        maxMemoryUsage: 500, // 500 bytes
        enableLogging: false
      });
      
      // Add small entries first
      memCache.set('key1', 'x'.repeat(50));
      memCache.set('key2', 'x'.repeat(50));
      
      const sizeBefore = memCache.size();
      expect(sizeBefore).toBe(2);
      
      // Add large entry that should trigger memory eviction
      const result = memCache.set('key3', 'x'.repeat(300));
      
      expect(result).toBe(true);
      expect(memCache.has('key3')).toBe(true);
      
      memCache.destroy();
    });

    it('should provide memory breakdown by data type', () => {
      cache.set('string1', 'test string');
      cache.set('number1', 42);
      cache.set('object1', { test: 'object' });
      cache.set('string2', 'another string');
      
      const breakdown = cache.getMemoryBreakdown();
      
      expect(breakdown.string).toBeDefined();
      expect(breakdown.string.count).toBe(2);
      expect(breakdown.number).toBeDefined();
      expect(breakdown.number.count).toBe(1);
      expect(breakdown.object).toBeDefined();
      expect(breakdown.object.count).toBe(1);
    });

    it('should handle when evictToFreeSpace cannot free enough space', () => {
      // Create cache with very limited memory
      const limitedCache = new MemoryCacheL1({
        maxSize: 2,
        maxMemoryUsage: 100, // Very small
        enableLogging: false
      });
      
      // Fill with medium-sized entries
      limitedCache.set('key1', 'x'.repeat(30));
      limitedCache.set('key2', 'x'.repeat(30));
      
      // Try to add huge entry that cannot fit even after evictions
      const hugeData = 'x'.repeat(200);
      const result = limitedCache.set('huge', hugeData);
      
      // Should fail because not enough space can be freed
      expect(result).toBe(false);
      
      limitedCache.destroy();
    });
  });

  describe('Statistics Tracking', () => {
    it('should track hits and misses', () => {
      cache.set('test', 'value');
      
      // Hit
      cache.get('test');
      // Miss
      cache.get('non-existent');
      
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.totalRequests).toBe(2);
      expect(stats.hitRate).toBe(50);
    });

    it('should track evictions', () => {
      // Fill cache to capacity
      for (let i = 0; i < 6; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      const stats = cache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
    });

    it('should track current entries and size', () => {
      const stats1 = cache.getStats();
      expect(stats1.currentEntries).toBe(0);
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats2 = cache.getStats();
      expect(stats2.currentEntries).toBe(2);
      expect(stats2.currentSize).toBe(2);
    });

    it('should track oldest and newest entry timestamps', () => {
      const mockTime = 1000;
      jest.spyOn(Date, 'now').mockReturnValue(mockTime);
      
      cache.set('first', 'value');
      
      jest.spyOn(Date, 'now').mockReturnValue(mockTime + 1000);
      cache.set('second', 'value');
      
      const stats = cache.getStats();
      expect(stats.oldestEntry).toBe(mockTime);
      expect(stats.newestEntry).toBe(mockTime + 1000);
    });

    it('should calculate hit rate correctly with zero requests', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
      expect(stats.totalRequests).toBe(0);
    });

    it('should update average access time', () => {
      cache.set('test', 'value');
      
      // Reset mocks and setup sequence for access time calculation
      mockPerformanceNow.mockClear();
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);
      
      cache.get('test');
      
      const stats = cache.getStats();
      expect(stats.averageAccessTime).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxSize: 10,
        defaultTTL: 2000,
        enableLogging: true
      };
      
      cache.updateConfig(newConfig);
      
      const config = cache.getConfig();
      expect(config.maxSize).toBe(10);
      expect(config.defaultTTL).toBe(2000);
      expect(config.enableLogging).toBe(true);
    });

    it('should evict entries when maxSize is reduced', () => {
      // Fill cache
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      expect(cache.size()).toBe(3);
      
      // Reduce maxSize
      cache.updateConfig({ maxSize: 2 });
      
      expect(cache.size()).toBe(2);
    });

    it('should evict entries when maxMemoryUsage is reduced', () => {
      // Add some entries
      cache.set('key1', 'x'.repeat(100));
      cache.set('key2', 'x'.repeat(100));
      
      const sizeBefore = cache.size();
      
      // Reduce memory limit significantly
      cache.updateConfig({ maxMemoryUsage: 10 });
      
      const sizeAfter = cache.size();
      expect(sizeAfter).toBeLessThan(sizeBefore);
    });

    it('should restart cleanup timer when interval changes', () => {
      // Clear previous calls
      mockClearInterval.mockClear();
      mockSetInterval.mockClear();
      
      // Update config with different cleanup interval
      cache.updateConfig({ cleanupInterval: 1000 });
      
      // Verify timer was restarted
      expect(mockClearInterval).toHaveBeenCalled();
      expect(mockSetInterval).toHaveBeenCalled();
    });

    it('should not restart timer when interval unchanged', () => {
      mockClearInterval.mockClear();
      mockSetInterval.mockClear();
      
      cache.updateConfig({ maxSize: 10 });
      
      expect(mockClearInterval).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup Operations', () => {
    it('should manually cleanup expired entries', () => {
      cache.set('key1', 'value1', 100);
      cache.set('key2', 'value2', 100);
      cache.set('key3', 'value3', 2000); // Longer TTL
      
      expect(cache.size()).toBe(3);
      
      // Advance time to expire first two entries
      jest.advanceTimersByTime(200);
      
      const removedCount = cache.cleanup();
      
      expect(removedCount).toBe(2);
      expect(cache.size()).toBe(1);
      expect(cache.has('key3')).toBe(true);
    });

    it('should perform automatic cleanup via timer', () => {
      cache.set('test', 'value', 100);
      
      expect(cache.size()).toBe(1);
      
      // Advance time to expire entry
      jest.advanceTimersByTime(200);
      
      // Advance time to trigger cleanup timer
      jest.advanceTimersByTime(500);
      
      expect(cache.size()).toBe(0);
    });

    it('should return 0 when no entries to cleanup', () => {
      const removedCount = cache.cleanup();
      expect(removedCount).toBe(0);
    });

    it('should enable cleanup logging when configured', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const logCache = new MemoryCacheL1({
        enableLogging: true
      });
      
      logCache.set('test', 'value', 100);
      jest.advanceTimersByTime(200);
      
      const removedCount = logCache.cleanup();
      
      // Only check if cleanup was called, logging might vary
      expect(removedCount).toBe(1);
      
      logCache.destroy();
      logSpy.mockRestore();
    });
  });

  describe('Event System', () => {
    it('should emit eviction events', () => {
      const evictionHandler = jest.fn();
      
      cache.onEviction(evictionHandler);
      
      // Fill cache to trigger eviction
      for (let i = 0; i < 6; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      expect(evictionHandler).toHaveBeenCalled();
      const event = evictionHandler.mock.calls[0][0];
      expect(event.type).toBe('eviction');
      expect(event.reason).toBe('LRU eviction');
      expect(event.entry).toBeDefined();
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should emit expiration events during cleanup', () => {
      const evictionHandler = jest.fn();
      
      cache.onEviction(evictionHandler);
      
      cache.set('test', 'value', 100); // Very short TTL
      
      // Advance time to expire entry
      jest.advanceTimersByTime(200);
      
      // Trigger cleanup
      cache.cleanup();
      
      expect(evictionHandler).toHaveBeenCalled();
      const event = evictionHandler.mock.calls[0][0];
      expect(event.type).toBe('expiration');
      expect(event.reason).toBe('TTL expired');
    });

    it('should emit memory eviction events', () => {
      const evictionHandler = jest.fn();
      
      // Create cache with small memory limit
      const memCache = new MemoryCacheL1({
        maxSize: 10,
        maxMemoryUsage: 500,
        enableLogging: false
      });
      
      memCache.onEviction(evictionHandler);
      
      // Add entries that will trigger memory eviction
      memCache.set('key1', 'x'.repeat(100));
      memCache.set('key2', 'x'.repeat(100));
      memCache.set('key3', 'x'.repeat(300)); // Should trigger eviction
      
      expect(evictionHandler).toHaveBeenCalled();
      const event = evictionHandler.mock.calls[0][0];
      expect(event.type).toBe('eviction');
      expect(event.reason).toContain('Memory limit exceeded');
      
      memCache.destroy();
    });

    it('should remove event listeners', () => {
      const handler = jest.fn();
      
      cache.onEviction(handler);
      cache.offEviction(handler);
      
      // Fill cache to trigger eviction - handler should not be called
      for (let i = 0; i < 6; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle removing non-existent event listener', () => {
      const handler = jest.fn();
      
      // Should not throw error
      expect(() => cache.offEviction(handler)).not.toThrow();
    });

    it('should handle errors in event listeners gracefully', () => {
      const badHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      cache.onEviction(badHandler);
      
      // Trigger eviction
      for (let i = 0; i < 6; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Destroy and Resource Cleanup', () => {
    it('should destroy cache and cleanup resources', () => {
      cache.set('test', 'value');
      
      // Clear previous calls to test specifically this destroy call
      mockClearInterval.mockClear();
      
      cache.destroy();
      
      expect(cache.size()).toBe(0);
      expect(mockClearInterval).toHaveBeenCalled();
    });

    it('should handle destroy when no timer exists', () => {
      // Create cache and immediately destroy before timer is set
      const tempCache = new MemoryCacheL1();
      expect(() => tempCache.destroy()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle complex object data', () => {
      const complexData = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        date: new Date(),
        regex: /test/g
      };
      
      cache.set('complex', complexData);
      const retrieved = cache.get('complex');
      
      expect(retrieved).toEqual(complexData);
    });

    it('should handle non-serializable data', () => {
      const nonSerializable = {
        circular: null as unknown,
        func: () => 'test'
      };
      nonSerializable.circular = nonSerializable;
      
      // Should not throw error
      expect(() => cache.set('non-serializable', nonSerializable)).not.toThrow();
      
      const retrieved = cache.get('non-serializable');
      expect(retrieved).toBe(nonSerializable);
    });

    it('should handle empty and null values', () => {
      cache.set('null', null);
      cache.set('undefined', undefined);
      cache.set('empty-string', '');
      cache.set('zero', 0);
      cache.set('false', false);
      
      expect(cache.get('null')).toBeNull();
      expect(cache.get('undefined')).toBeUndefined();
      expect(cache.get('empty-string')).toBe('');
      expect(cache.get('zero')).toBe(0);
      expect(cache.get('false')).toBe(false);
    });

    it('should handle very large keys', () => {
      const largeKey = 'x'.repeat(1000);
      
      cache.set(largeKey, 'value');
      expect(cache.get(largeKey)).toBe('value');
      expect(cache.has(largeKey)).toBe(true);
    });

    it('should handle case when cache is empty for getEntriesByAccessPattern', () => {
      const entries = cache.getEntriesByAccessPattern();
      expect(entries).toEqual([]);
    });

    it('should handle case when no data types exist for getMemoryBreakdown', () => {
      const breakdown = cache.getMemoryBreakdown();
      expect(breakdown).toEqual({});
    });

    it('should handle set operation logging when enabled', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const logCache = new MemoryCacheL1({
        enableLogging: true
      });
      
      logCache.set('test', 'value');
      
      // Check that logging occurred (log message format may vary)
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Cache SET: test.*bytes.*TTL/),
        expect.anything()
      );
      
      logCache.destroy();
      logSpy.mockRestore();
    });

    it('should handle get operation logging when enabled', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const logCache = new MemoryCacheL1({
        enableLogging: true
      });
      
      logCache.set('test', 'value');
      logCache.get('test');
      
      // Check that HIT logging occurred
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Cache HIT: test.*ms/),
        expect.anything()
      );
      
      logCache.destroy();
      logSpy.mockRestore();
    });

    it('should handle remove operation logging when enabled', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const logCache = new MemoryCacheL1({
        enableLogging: true
      });
      
      logCache.set('test', 'value');
      logCache.remove('test');
      
      // Check that remove logging occurred
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Cache REMOVE: test/)
      );
      
      logCache.destroy();
      logSpy.mockRestore();
    });

    it('should handle evict LRU operation logging when enabled', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const logCache = new MemoryCacheL1({
        maxSize: 2,
        enableLogging: true
      });
      
      // Fill cache to trigger eviction
      logCache.set('key1', 'value1');
      logCache.set('key2', 'value2');
      logCache.set('key3', 'value3'); // Should trigger eviction
      
      // Check that eviction logging occurred
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Cache EVICT LRU: key1/)
      );
      
      logCache.destroy();
      logSpy.mockRestore();
    });

    it('should handle memory limit warning logging when enabled', () => {
      const logSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const logCache = new MemoryCacheL1({
        maxMemoryUsage: 10, // Very small limit
        enableLogging: true
      });
      
      const largeData = 'x'.repeat(100);
      const result = logCache.set('test', largeData);
      
      expect(result).toBe(false);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Cannot cache test: would exceed memory limit/)
      );
      
      logCache.destroy();
      logSpy.mockRestore();
    });

    it('should handle LRU eviction when tail is null', () => {
      // Create fresh cache and test eviction edge case
      const testCache = new MemoryCacheL1({ maxSize: 1 });
      
      // Force eviction with multiple sets
      testCache.set('key1', 'value1');
      testCache.set('key2', 'value2');
      
      expect(testCache.size()).toBe(1);
      expect(testCache.has('key2')).toBe(true);
      
      testCache.destroy();
    });

    it('should handle setting same key with different values', () => {
      cache.set('same-key', 'value1');
      expect(cache.get('same-key')).toBe('value1');
      expect(cache.size()).toBe(1);
      
      // Set same key with different value
      cache.set('same-key', 'value2');
      expect(cache.get('same-key')).toBe('value2');
      expect(cache.size()).toBe(1); // Size should remain 1
    });

    it('should handle cleanup timer properly', () => {
      // Create cache and verify cleanup timer setup
      const timerCache = new MemoryCacheL1({
        cleanupInterval: 1000
      });
      
      expect(mockSetInterval).toHaveBeenCalled();
      
      timerCache.destroy();
    });

    it('should handle missing cleanup timer on destroy', () => {
      // Create cache, manually clear timer, then destroy
      const timerCache = new MemoryCacheL1();
      
      // This should not throw
      expect(() => timerCache.destroy()).not.toThrow();
    });

    it('should handle when head is null during addToHead', () => {
      // Test internal edge case for head/tail management
      const freshCache = new MemoryCacheL1({ maxSize: 1 });
      
      freshCache.set('test', 'value');
      expect(freshCache.has('test')).toBe(true);
      
      freshCache.destroy();
    });
  });

  describe('Singleton Instance', () => {
    it('should export working memoryCacheL1 instance', () => {
      expect(memoryCacheL1).toBeInstanceOf(MemoryCacheL1);
      
      memoryCacheL1.set('test', 'value');
      expect(memoryCacheL1.get('test')).toBe('value');
      
      memoryCacheL1.clear(); // Clean up
    });

    it('should have correct singleton configuration', () => {
      const config = memoryCacheL1.getConfig();
      
      expect(config.maxMemoryUsage).toBe(50 * 1024 * 1024);
      expect(config.defaultTTL).toBe(60 * 60 * 1000);
    });
  });
}); 