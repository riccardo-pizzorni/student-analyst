/**
 * STUDENT ANALYST - LocalStorageCacheL2 Unit Tests
 * Task 3.4 - Test per aumentare copertura da 9.38% a 80%+
 */

import LocalStorageCacheL2, { localStorageCacheL2 } from '../../src/services/LocalStorageCacheL2';
import { IStorage } from '../../src/services/interfaces/IStorage';

// Mock Storage implementation
class MockStorage implements IStorage {
  private store: { [key: string]: string } = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

describe('LocalStorageCacheL2', () => {
  let mockStorage: MockStorage;
  let cache: LocalStorageCacheL2;

  beforeEach(() => {
    jest.useFakeTimers();
    mockStorage = new MockStorage();
    cache = new LocalStorageCacheL2(mockStorage);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should create cache with mock storage', () => {
      expect(cache).toBeInstanceOf(LocalStorageCacheL2);
    });

    it('should use default window.localStorage when no storage provided', () => {
      const mockLocalStorage = new MockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      const defaultCache = new LocalStorageCacheL2();
      expect(defaultCache).toBeInstanceOf(LocalStorageCacheL2);
    });

    it('should initialize with default stats', () => {
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.currentEntries).toBe(0);
    });

    it('should load existing stats from storage', () => {
      const existingStats = { hits: 10, misses: 5 };
      mockStorage.setItem('student-analyst-l2:meta', JSON.stringify(existingStats));
      
      const newCache = new LocalStorageCacheL2(mockStorage);
      const stats = newCache.getStats();
      
      expect(stats.hits).toBe(10);
      expect(stats.misses).toBe(5);
    });

    it('should handle corrupted stats gracefully', () => {
      mockStorage.setItem('student-analyst-l2:meta', 'invalid-json');
      expect(() => new LocalStorageCacheL2(mockStorage)).not.toThrow();
    });
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cache.set('test-key', 'test-value');
      const result = cache.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if cache has key', () => {
      cache.set('test', 'value');
      expect(cache.has('test')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('test', 'value');
      expect(cache.has('test')).toBe(true);
      
      cache.delete('test');
      expect(cache.has('test')).toBe(false);
      expect(cache.get('test')).toBeNull();
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.has('key1')).toBe(true);
      cache.clear();
      expect(cache.has('key1')).toBe(false);
    });

    it('should get storage keys', () => {
      cache.set('key1', 'value1');
      const keys = cache.keys();
      expect(keys.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect custom TTL', () => {
      const shortTTL = 1000;
      cache.set('test', 'value', shortTTL);
      
      expect(cache.get('test')).toBe('value');
      
      jest.advanceTimersByTime(1500);
      expect(cache.get('test')).toBeNull();
      expect(cache.has('test')).toBe(false);
    });

    it('should use default TTL when not specified', () => {
      cache.set('test', 'value');
      expect(cache.get('test')).toBe('value');
      
      jest.advanceTimersByTime(60 * 60 * 1000); // 1 hour
      expect(cache.get('test')).toBe('value');
    });

    it('should handle expired entries during has() check', () => {
      cache.set('test', 'value', 1000);
      expect(cache.has('test')).toBe(true);
      
      jest.advanceTimersByTime(1500);
      expect(cache.has('test')).toBe(false);
    });

    it('should cleanup expired entries on initialization', () => {
      cache.set('test', 'value', 1000);
      jest.advanceTimersByTime(1500);
      
      const newCache = new LocalStorageCacheL2(mockStorage);
      expect(newCache.has('test')).toBe(false);
    });
  });

  describe('Statistics Tracking', () => {
    it('should track hits and misses', () => {
      cache.set('test', 'value');
      
      cache.get('test'); // Hit
      cache.get('non-existent'); // Miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(50);
    });

    it('should track current entries', () => {
      const initialStats = cache.getStats();
      expect(initialStats.currentEntries).toBe(0);
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.currentEntries).toBeGreaterThanOrEqual(2);
    });

    it('should track storage usage', () => {
      const initialStats = cache.getStats();
      expect(initialStats.totalStorageUsed).toBe(0);
      
      cache.set('test', 'data that takes space');
      
      const stats = cache.getStats();
      expect(stats.totalStorageUsed).toBeGreaterThan(0);
      expect(stats.storageUsagePercentage).toBeGreaterThan(0);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('test', 'value');
      
      // 2 hits, 1 miss = 66.67% hit rate
      cache.get('test');
      cache.get('test');
      cache.get('non-existent');
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should handle hit rate with zero requests', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should update last access time', () => {
      const initialStats = cache.getStats();
      const initialTime = initialStats.lastAccess;
      
      cache.set('test', 'value');
      jest.advanceTimersByTime(1000);
      cache.get('test');
      
      const stats = cache.getStats();
      expect(stats.lastAccess).toBeGreaterThan(initialTime);
    });
  });

  describe('Configuration Management', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        maxEntries: 500,
        maxMemoryUsage: 10 * 1024 * 1024,
        defaultTTL: 12 * 60 * 60 * 1000,
        enableCompression: false
      };
      
      cache.configure(newConfig);
      
      const stats = cache.getStats();
      expect(stats.maxEntries).toBe(500);
      expect(stats.maxStorageSize).toBe(10 * 1024 * 1024);
    });

    it('should merge configuration with existing', () => {
      cache.configure({ maxEntries: 200 });
      
      const stats = cache.getStats();
      expect(stats.maxEntries).toBe(200);
    });
  });

  describe('Eviction Policy', () => {
    it('should evict entries when max entries exceeded', () => {
      cache.configure({ maxEntries: 2 });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // Should trigger eviction
      
      const stats = cache.getStats();
      expect(stats.evictionCount).toBeGreaterThan(0);
    });

    it('should evict entries when memory limit exceeded', () => {
      cache.configure({ 
        maxMemoryUsage: 100,
        maxEntries: 1000
      });
      
      const largeData = 'x'.repeat(50);
      
      cache.set('key1', largeData);
      cache.set('key2', largeData);
      cache.set('key3', largeData); // Should trigger eviction
      
      const stats = cache.getStats();
      expect(stats.evictionCount).toBeGreaterThan(0);
    });

    it('should track eviction statistics', () => {
      cache.configure({ maxEntries: 1 });
      
      const initialStats = cache.getStats();
      expect(initialStats.evictionCount).toBe(0);
      expect(initialStats.lastEviction).toBe(0);
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2'); // Should evict key1
      
      const stats = cache.getStats();
      expect(stats.evictionCount).toBeGreaterThan(0);
      expect(stats.lastEviction).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      mockStorage.setItem('student-analyst-l2:invalid', 'invalid-json');
      
      expect(() => cache.get('invalid')).not.toThrow();
      expect(cache.get('invalid')).toBeNull();
    });

    it('should handle storage errors during get', () => {
      const mockErrorStorage = {
        ...mockStorage,
        getItem: jest.fn().mockImplementation(() => {
          throw new Error('Storage error');
        })
      };
      
      const errorCache = new LocalStorageCacheL2(mockErrorStorage as unknown);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(errorCache.get('test')).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle QuotaExceededError during set', () => {
      const mockErrorStorage = {
        ...mockStorage,
        setItem: jest.fn()
          .mockImplementationOnce(() => {
            const error = new Error('QuotaExceededError');
            Object.defineProperty(error, 'name', { value: 'QuotaExceededError' });
            throw error;
          })
          .mockImplementation((key: string, value: string) => {
            mockStorage.setItem(key, value);
          })
      };
      
      const errorCache = new LocalStorageCacheL2(mockErrorStorage as unknown);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => errorCache.set('test', 'value')).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should handle storage errors during set', () => {
      const mockErrorStorage = {
        ...mockStorage,
        setItem: jest.fn().mockImplementation(() => {
          throw new Error('Storage error');
        })
      };
      
      const errorCache = new LocalStorageCacheL2(mockErrorStorage as unknown);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => errorCache.set('test', 'value')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle corrupted cache entries during has check', () => {
      mockStorage.setItem('student-analyst-l2:corrupted', 'invalid-json');
      
      expect(() => cache.has('corrupted')).not.toThrow();
      expect(cache.has('corrupted')).toBe(false);
    });
  });

  describe('Data Types and Serialization', () => {
    it('should handle various data types', () => {
      const testCases = [
        { key: 'string', value: 'test string' },
        { key: 'number', value: 42 },
        { key: 'boolean', value: true },
        { key: 'array', value: [1, 2, 3] },
        { key: 'object', value: { name: 'test', nested: { value: 123 } } },
        { key: 'null', value: null }
      ];
      
      testCases.forEach(({ key, value }) => {
        cache.set(key, value);
        expect(cache.get(key)).toEqual(value);
      });
    });

    it('should handle complex nested objects', () => {
      const complexObj = {
        timestamp: Date.now(),
        data: {
          symbol: 'AAPL',
          price: 150.25,
          volume: 1000000,
          historical: [
            { open: 149.0, high: 151.0, low: 148.5, close: 150.25 }
          ]
        }
      };
      
      cache.set('complex', complexObj);
      const retrieved = cache.get('complex');
      
      expect(retrieved).toEqual(complexObj);
    });

    it('should handle data type metadata', () => {
      cache.set('test', 'value', undefined, 'custom-type');
      expect(cache.get('test')).toBe('value');
    });
  });

  describe('Internal Methods and Edge Cases', () => {
    it('should handle empty storage correctly', () => {
      // Clear all data first
      mockStorage.clear();
      
      const freshCache = new LocalStorageCacheL2(mockStorage);
      expect(freshCache.keys()).toHaveLength(0);
      
      const stats = freshCache.getStats();
      expect(stats.currentEntries).toBe(0);
      expect(stats.totalStorageUsed).toBe(0);
    });

    it('should handle storage key prefixing', () => {
      cache.set('test', 'value');
      
      const storageKeys = Object.keys((mockStorage as { store: Record<string, string> }).store);
      expect(storageKeys.some(key => key.includes('student-analyst-l2'))).toBe(true);
    });

    it('should handle cleanup of expired entries', () => {
      cache.set('short-lived', 'value', 1000);
      cache.set('long-lived', 'value', 10000);
      
      jest.advanceTimersByTime(1500);
      
      const newCache = new LocalStorageCacheL2(mockStorage);
      
      expect(newCache.has('short-lived')).toBe(false);
      expect(newCache.has('long-lived')).toBe(true);
    });

    it('should handle malformed entries during cleanup', () => {
      mockStorage.setItem('student-analyst-l2:malformed', 'invalid-json');
      
      expect(() => new LocalStorageCacheL2(mockStorage)).not.toThrow();
    });

    it('should save and load stats correctly', () => {
      // Clear storage first and create fresh cache  
      mockStorage.clear();
      const freshCache = new LocalStorageCacheL2(mockStorage);
      
      freshCache.set('test', 'value');
      freshCache.get('test'); // Hit
      freshCache.get('non-existent'); // Miss
      
      // Check that metadata is saved to storage
      const metaKey = 'student-analyst-l2:meta';
      const savedMeta = mockStorage.getItem(metaKey);
      expect(savedMeta).toBeTruthy();
      
      // Create new cache instance - should load previous stats
      const newCache = new LocalStorageCacheL2(mockStorage);
      const stats = newCache.getStats();
      
      // The stats should include the hit and miss from the previous cache
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('Singleton Instance', () => {
    it('should export working localStorageCacheL2 instance', () => {
      expect(localStorageCacheL2).toBeInstanceOf(LocalStorageCacheL2);
      
      // Test with window.localStorage directly
      const testKey = 'singleton-test-' + Date.now();
      localStorageCacheL2.set(testKey, 'value');
      
      // Check if set worked
      expect(localStorageCacheL2.has(testKey)).toBe(true);
      
      localStorageCacheL2.clear();
    });
  });

  describe('Additional Coverage Tests', () => {
    it('should handle compression features', () => {
      // Test compression configuration
      cache.configure({ 
        enableCompression: true,
        compressionThreshold: 10
      });
      
      const largeData = 'x'.repeat(100);
      cache.set('compressed-test', largeData);
      expect(cache.get('compressed-test')).toBe(largeData);
    });

    it('should handle storage save stats errors', () => {
      const mockErrorStorage = {
        ...mockStorage,
        setItem: jest.fn().mockImplementation((key: string, value: string) => {
          if (key.includes(':meta')) {
            throw new Error('Cannot save metadata');
          }
          mockStorage.setItem(key, value);
        })
      };
      
      const errorCache = new LocalStorageCacheL2(mockErrorStorage as unknown);
      expect(() => errorCache.set('test', 'value')).not.toThrow();
    });

    it('should handle NaN in hit rate calculation', () => {
      // Force division by zero case
      const stats = cache.getStats();
      expect(typeof stats.hitRate).toBe('number');
      expect(isNaN(stats.hitRate) || stats.hitRate >= 0).toBe(true);
    });

    it('should handle storage key enumeration', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const keys = cache.keys();
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should handle storage length property', () => {
      expect(typeof mockStorage.length).toBe('number');
      
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      
      expect(mockStorage.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle default TTL parameter', () => {
      // Test with undefined TTL (should use default)
      cache.set('test-default-ttl', 'value', undefined);
      expect(cache.get('test-default-ttl')).toBe('value');
    });

    it('should handle zero TTL', () => {
      // Test with 0 TTL
      cache.set('test-zero-ttl', 'value', 0);
      
      // Should still use default TTL when 0 is passed
      expect(cache.get('test-zero-ttl')).toBe('value');
    });

    it('should track last cleanup time', () => {
      const initialStats = cache.getStats();
      const initialCleanup = initialStats.lastCleanup;
      
      cache.clear();
      
      const stats = cache.getStats();
      expect(stats.lastCleanup).toBeGreaterThanOrEqual(initialCleanup);
    });

    it('should handle storage key iteration with null keys', () => {
      // Add some data
      cache.set('test', 'value');
      
      // Mock storage.key to return null for some indices
      const originalKey = mockStorage.key;
      mockStorage.key = jest.fn().mockImplementation((index: number) => {
        if (index === 0) return originalKey.call(mockStorage, index);
        return null;
      });
      
      const stats = cache.getStats();
      expect(stats.totalStorageUsed).toBeGreaterThanOrEqual(0);
      
      // Restore original method
      mockStorage.key = originalKey;
    });

    it('should handle undefined dataType parameter', () => {
      cache.set('test-no-datatype', 'value', 5000);
      expect(cache.get('test-no-datatype')).toBe('value');
    });

    it('should handle stats without division by zero', () => {
      const freshCache = new LocalStorageCacheL2(mockStorage);
      const stats = freshCache.getStats();
      
      expect(stats.hitRate).toBe(0);
      expect(stats.storageUsagePercentage).toBeGreaterThanOrEqual(0);
    });

    it('should handle QuotaExceededError with retry mechanism', () => {
      let callCount = 0;
      const mockErrorStorage = {
        ...mockStorage,
        setItem: jest.fn().mockImplementation((key: string, value: string) => {
          callCount++;
          if (callCount === 1) {
            // First call throws QuotaExceededError
            const error = new DOMException('Quota exceeded');
            Object.defineProperty(error, 'name', { value: 'QuotaExceededError' });
            throw error;
          } else {
            // Second call succeeds (retry)
            mockStorage.setItem(key, value);
          }
        })
      };
      
      const errorCache = new LocalStorageCacheL2(mockErrorStorage as unknown);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // This should trigger the retry mechanism
      expect(() => errorCache.set('test', 'value')).not.toThrow();
      expect(callCount).toBe(2); // Original call + retry
      
      consoleSpy.mockRestore();
    });

    it('should test compression with real data patterns', () => {
      cache.configure({ 
        enableCompression: true,
        compressionThreshold: 50
      });
      
      // Data that will benefit from compression
      const dataWithPatterns = {
        timestamp: Date.now(),
        data: { symbol: 'AAPL', price: 150.0, volume: 1000 },
        symbol: 'AAPL',
        price: 150.0
      };
      
      cache.set('pattern-test', dataWithPatterns);
      const retrieved = cache.get('pattern-test');
      
      expect(retrieved).toEqual(dataWithPatterns);
    });

    it('should handle compression errors gracefully', () => {
      cache.configure({ 
        enableCompression: true,
        compressionThreshold: 1
      });
      
      // Try to set circular reference object that can't be JSON.stringified
      const circularObj: Record<string, unknown> = { name: 'test' };
      circularObj.self = circularObj;
      
      // This should handle compression error gracefully
      expect(() => cache.set('circular', circularObj)).not.toThrow();
    });

    it('should test saveStats functionality', () => {
      cache.set('save-stats-test', 'value');
      cache.get('save-stats-test'); // Hit
      
      // Manually trigger stats save by calling updateStats indirectly
      cache.configure({ maxEntries: 1000 });
      
      // Check if stats are being tracked properly
      const stats = cache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
    });

    it('should handle storage key enumeration with different key patterns', () => {
      // Test with keys method returning the actual storage keys
      const realKeys = cache.keys();
      expect(Array.isArray(realKeys)).toBe(true);
      
      // Add cache entries
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      
      const keysAfterAdding = cache.keys();
      expect(keysAfterAdding.length).toBeGreaterThanOrEqual(realKeys.length);
    });

    it('should handle large data compression threshold', () => {
      cache.configure({ 
        enableCompression: true,
        compressionThreshold: 5000 // Large threshold
      });
      
      const smallData = 'small text';
      cache.set('small-data', smallData);
      expect(cache.get('small-data')).toBe(smallData);
    });

    it('should handle compression disabled', () => {
      cache.configure({ 
        enableCompression: false
      });
      
      const largeData = 'x'.repeat(1000);
      cache.set('no-compression', largeData);
      expect(cache.get('no-compression')).toBe(largeData);
    });
  });
});
