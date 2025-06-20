/**
 * STUDENT ANALYST - Cache Unit Tests
 * Tests for MemoryCacheL1, LocalStorageCacheL2, and IndexedDBCacheL3
 */

import { indexedDBCacheL3 } from '../../src/services/IndexedDBCacheL3';
import { localStorageCacheL2 } from '../../src/services/LocalStorageCacheL2';
import { memoryCacheL1 } from '../../src/services/MemoryCacheL1';

// Mock IDBRequest for testing
class MockIDBRequest {
  onsuccess: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onupgradeneeded: ((event: unknown) => void) | null = null;
  result: unknown = undefined;
  constructor(result: unknown) {
    setTimeout(() => {
      this.result = result;
      if (typeof this.onsuccess === 'function')
        this.onsuccess({ target: this });
    }, 1);
  }
}

describe('Cache System Tests', () => {
  beforeEach(() => {
    // Clear all caches before each test
    memoryCacheL1.clear();
    localStorageCacheL2.clear();
    indexedDBCacheL3.clear();
  });

  describe('Basic Operations', () => {
    it('should handle basic set/get operations', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      // Test L1
      await memoryCacheL1.set(key, value).then(() => {});
      const l1Result = memoryCacheL1.get(key) as typeof value;
      expect(l1Result).toEqual(value);

      // Test L2
      localStorageCacheL2.set(key, value);
      const l2Result = localStorageCacheL2.get(key) as typeof value;
      expect(l2Result).toEqual(value);

      // Test L3
      await indexedDBCacheL3.set(key, value).then(() => {});
      const l3Result = (await indexedDBCacheL3.get(key)) as typeof value;
      expect(l3Result).toEqual(value);
    });

    it('should handle null/undefined values', async () => {
      const key = 'test-key';

      // Test L1
      await memoryCacheL1.set(key, null).then(() => {});
      expect(memoryCacheL1.get(key)).toBeNull();

      // Test L2
      localStorageCacheL2.set(key, null);
      expect(localStorageCacheL2.get(key)).toBeNull();

      // Test L3
      await indexedDBCacheL3.set(key, null).then(() => {});
      expect(await indexedDBCacheL3.get(key)).toBeNull();
    });

    it('should handle complex objects with circular references', async () => {
      const key = 'test-key';
      const obj: Record<string, unknown> = { data: 'test' };
      obj.self = obj;

      // Test L1
      await memoryCacheL1.set(key, obj).then(() => {});
      const l1Result = memoryCacheL1.get(key) as typeof obj;
      expect(l1Result.data).toBe('test');
      expect(l1Result.self).toBe(l1Result);

      // Test L2
      localStorageCacheL2.set(key, obj);
      const l2Result = localStorageCacheL2.get(key) as typeof obj;
      expect(l2Result.data).toBe('test');
      expect(l2Result.self).toBe(l2Result);

      // Test L3
      await indexedDBCacheL3.set(key, obj).then(() => {});
      const l3Result = (await indexedDBCacheL3.get(key)) as typeof obj;
      expect(l3Result.data).toBe('test');
      expect(l3Result.self).toBe(l3Result);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage quota exceeded', async () => {
      const key = 'test-key';
      const largeValue = 'x'.repeat(10 * 1024 * 1024); // 10MB string

      // Mock localStorage quota exceeded
      const originalSetItem = window.localStorage.setItem;
      window.localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      // Test L2
      localStorageCacheL2.set(key, largeValue);
      expect(localStorageCacheL2.get(key)).toBeNull();

      // Restore localStorage
      window.localStorage.setItem = originalSetItem;

      // Test L1
      await memoryCacheL1.set(key, largeValue).then(() => {});
      expect(memoryCacheL1.get(key)).toBeNull();

      // Test L3
      await indexedDBCacheL3.set(key, largeValue).then(() => {});
      expect(await indexedDBCacheL3.get(key)).toBeNull();
    });

    it('should handle IndexedDB errors', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      // Mock IndexedDB error
      const originalOpen = window.indexedDB.open;
      window.indexedDB.open = jest.fn().mockImplementation(() => {
        const req = new MockIDBRequest(null);
        setTimeout(() => {
          if (typeof req.onerror === 'function') {
            req.onerror({ target: req });
          }
        }, 1);
        return req;
      });

      // Test L3
      await indexedDBCacheL3.set(key, value).then(() => {});
      expect(await indexedDBCacheL3.get(key)).toBeNull();

      // Restore IndexedDB
      window.indexedDB.open = originalOpen;
    });
  });

  describe('Cache Integration', () => {
    it('should handle concurrent operations across cache levels', async () => {
      const operations: Array<Promise<unknown>> = [];
      const key = 'test-key';
      const value = { data: 'test-value' };

      // Simulate concurrent operations across all cache levels
      for (let i = 0; i < 5; i++) {
        operations.push(
          memoryCacheL1.set(`${key}-${i}`, value).then(() => {}),
          new Promise<void>(resolve => {
            localStorageCacheL2.set(`${key}-${i}`, value);
            resolve();
          }),
          indexedDBCacheL3.set(`${key}-${i}`, value).then(() => {})
        );
      }

      await Promise.all(operations);

      // Verify data consistency
      for (let i = 0; i < 5; i++) {
        const l1Result = memoryCacheL1.get(`${key}-${i}`) as typeof value;
        const l2Result = localStorageCacheL2.get(`${key}-${i}`) as typeof value;
        const l3Result = (await indexedDBCacheL3.get(
          `${key}-${i}`
        )) as typeof value;

        expect(l1Result).toEqual(value);
        expect(l2Result).toEqual(value);
        expect(l3Result).toEqual(value);
      }
    });

    it('should recover from partial failures', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      // Simulate L2 failure
      const originalSet = localStorageCacheL2.set;
      localStorageCacheL2.set = () => {
        throw new Error('Simulated L2 failure');
      };

      // Operation should still succeed in L1 and L3
      await memoryCacheL1.set(key, value).then(() => {});
      await indexedDBCacheL3.set(key, value).then(() => {});

      // Restore L2
      localStorageCacheL2.set = originalSet;

      // Verify L1 and L3 data
      const l1Result = memoryCacheL1.get(key) as typeof value;
      const l3Result = (await indexedDBCacheL3.get(key)) as typeof value;
      expect(l1Result).toEqual(value);
      expect(l3Result).toEqual(value);

      // L2 should be empty
      const l2Result = localStorageCacheL2.get(key);
      expect(l2Result).toBeNull();
    });

    it('should handle cache invalidation across levels', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      // Set data in all caches
      await memoryCacheL1.set(key, value).then(() => {});
      localStorageCacheL2.set(key, value);
      await indexedDBCacheL3.set(key, value).then(() => {});

      // Invalidate in L1
      memoryCacheL1.remove(key);

      // Verify L1 is empty
      const l1Result = memoryCacheL1.get(key);
      expect(l1Result).toBeNull();

      // L2 and L3 should still have data
      const l2Result = localStorageCacheL2.get(key) as typeof value;
      const l3Result = (await indexedDBCacheL3.get(key)) as typeof value;
      expect(l2Result).toEqual(value);
      expect(l3Result).toEqual(value);
    });

    it('should handle cache compression and serialization', async () => {
      const key = 'test-key';
      const value = {
        data: 'test-value',
        nested: {
          array: [1, 2, 3],
          object: { a: 1, b: 2 },
        },
      };

      // Set complex data in all caches
      await memoryCacheL1.set(key, value).then(() => {});
      localStorageCacheL2.set(key, value);
      await indexedDBCacheL3.set(key, value).then(() => {});

      // Verify data integrity
      const l1Result = memoryCacheL1.get(key) as typeof value;
      const l2Result = localStorageCacheL2.get(key) as typeof value;
      const l3Result = (await indexedDBCacheL3.get(key)) as typeof value;

      expect(l1Result).toEqual(value);
      expect(l2Result).toEqual(value);
      expect(l3Result).toEqual(value);
    });

    it('should handle cache versioning and migrations', async () => {
      const key = 'test-key';
      const oldValue = { version: 1, data: 'old-value' };
      const newValue = { version: 2, data: 'new-value' };

      // Set old version data
      await memoryCacheL1.set(key, oldValue).then(() => {});
      localStorageCacheL2.set(key, oldValue);
      await indexedDBCacheL3.set(key, oldValue).then(() => {});

      // Update to new version
      await memoryCacheL1.set(key, newValue).then(() => {});
      localStorageCacheL2.set(key, newValue);
      await indexedDBCacheL3.set(key, newValue).then(() => {});

      // Verify new version data
      const l1Result = memoryCacheL1.get(key) as typeof newValue;
      const l2Result = localStorageCacheL2.get(key) as typeof newValue;
      const l3Result = (await indexedDBCacheL3.get(key)) as typeof newValue;

      expect(l1Result).toEqual(newValue);
      expect(l2Result).toEqual(newValue);
      expect(l3Result).toEqual(newValue);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large datasets efficiently', async () => {
      const numItems = 1000;
      const operations: Array<Promise<unknown>> = [];

      // Generate large dataset
      for (let i = 0; i < numItems; i++) {
        const key = `key-${i}`;
        const value = {
          id: i,
          data: 'x'.repeat(1000), // 1KB per item
          timestamp: Date.now(),
        };

        operations.push(
          memoryCacheL1.set(key, value).then(() => {}),
          new Promise<void>(resolve => {
            localStorageCacheL2.set(key, value);
            resolve();
          }),
          indexedDBCacheL3.set(key, value).then(() => {})
        );
      }

      // Measure set performance
      const setStart = performance.now();
      await Promise.all(operations);
      const setEnd = performance.now();
      const setTime = setEnd - setStart;

      // Measure get performance
      const getStart = performance.now();
      for (let i = 0; i < numItems; i++) {
        const key = `key-${i}`;
        memoryCacheL1.get(key);
        localStorageCacheL2.get(key);
        await indexedDBCacheL3.get(key);
      }
      const getEnd = performance.now();
      const getTime = getEnd - getStart;

      // Verify performance metrics
      expect(setTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(getTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify data integrity
      for (let i = 0; i < numItems; i++) {
        const key = `key-${i}`;
        const expectedValue = {
          id: i,
          data: 'x'.repeat(1000),
          timestamp: expect.any(Number),
        };

        const l1Result = memoryCacheL1.get(key) as typeof expectedValue;
        const l2Result = localStorageCacheL2.get(key) as typeof expectedValue;
        const l3Result = (await indexedDBCacheL3.get(
          key
        )) as typeof expectedValue;

        expect(l1Result).toMatchObject(expectedValue);
        expect(l2Result).toMatchObject(expectedValue);
        expect(l3Result).toMatchObject(expectedValue);
      }
    });
  });
});
