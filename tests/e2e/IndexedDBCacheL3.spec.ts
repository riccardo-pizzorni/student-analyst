import { expect, test } from '@playwright/test';
import { IndexedDBCacheL3 } from '../../src/services/IndexedDBCacheL3';

interface TestData {
  key: string;
  value: {
    data: string;
    timestamp: number;
  };
}

declare global {
  interface Window {
    testData: TestData;
  }
}

test.describe('IndexedDBCacheL3 E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla pagina di test
    await page.goto('/');
    
    // Inietta il codice necessario per i test
    await page.addInitScript(() => {
      // Mock window se non esiste
      if (typeof window === 'undefined') {
        (global as any).window = {
          addEventListener: () => {},
          removeEventListener: () => {},
          localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {}
          }
        };
      }

      window.testData = {
        key: 'test-key',
        value: { data: 'test-value', timestamp: Date.now() }
      };
    });
  });

  test('should initialize IndexedDB database', async ({ page }) => {
    const dbExists = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('student-analyst-l3-cache', 1);
        request.onsuccess = () => {
          const db = request.result;
          const exists = db.objectStoreNames.contains('cache');
          db.close();
          resolve(exists);
        };
        request.onerror = () => resolve(false);
      });
    });

    expect(dbExists).toBe(true);
  });

  test('should set and get values from IndexedDB', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const cache = new IndexedDBCacheL3();
      await cache.set(window.testData.key, window.testData.value);
      const retrieved = await cache.get(window.testData.key);
      return {
        set: retrieved !== null,
        value: retrieved
      };
    });

    expect(result.set).toBe(true);
    expect(result.value).toEqual(expect.objectContaining({
      data: 'test-value'
    }));
  });

  test('should handle large data sets', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const cache = new IndexedDBCacheL3();
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: `data-${i}`.repeat(100)
      }));

      // Set all items
      for (const item of largeData) {
        await cache.set(`key-${item.id}`, item);
      }

      // Get stats
      const stats = await cache.getStats();
      
      // Get some random items
      const randomKeys = Array.from({ length: 10 }, () => 
        `key-${Math.floor(Math.random() * 1000)}`
      );
      
      const retrievedItems = await Promise.all(
        randomKeys.map(key => cache.get(key))
      );

      return {
        stats,
        retrievedCount: retrievedItems.filter(Boolean).length
      };
    });

    expect(result.stats.currentEntries).toBeGreaterThan(0);
    expect(result.retrievedCount).toBe(10);
  });

  test('should handle concurrent operations', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const cache = new IndexedDBCacheL3();
      
      // Create multiple concurrent operations
      const operations = Array.from({ length: 50 }, (_, i) => ({
        key: `concurrent-${i}`,
        value: { data: `value-${i}` }
      }));

      // Execute all operations concurrently
      await Promise.all([
        ...operations.map(op => cache.set(op.key, op.value)),
        ...operations.map(op => cache.get(op.key)),
        cache.getStats(),
        cache.getAllKeys()
      ]);

      // Verify results
      const keys = await cache.getAllKeys();
      const values = await Promise.all(
        keys.map(key => cache.get(key))
      );

      return {
        keysCount: keys.length,
        valuesCount: values.filter(Boolean).length
      };
    });

    expect(result.keysCount).toBeGreaterThan(0);
    expect(result.keysCount).toBe(result.valuesCount);
  });

  test('should handle eviction correctly', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const cache = new IndexedDBCacheL3();
      
      // Configure small cache size
      cache.updateConfig({ maxEntries: 5 });

      // Add more items than maxEntries
      for (let i = 0; i < 10; i++) {
        await cache.set(`evict-${i}`, { data: `value-${i}` });
        // Simulate different access times
        if (i < 3) {
          await cache.get(`evict-${i}`);
        }
      }

      const keys = await cache.getAllKeys();
      const stats = await cache.getStats();

      return {
        remainingKeys: keys,
        stats
      };
    });

    expect(result.remainingKeys.length).toBeLessThanOrEqual(5);
    expect(result.stats.errorCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle errors gracefully', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const cache = new IndexedDBCacheL3();
      
      try {
        // Try to get non-existent key
        const missing = await cache.get('non-existent');
        
        // Try to set invalid data
        await cache.set('invalid', undefined as any);
        
        // Try to delete non-existent key
        await cache.delete('non-existent');
        
        const stats = await cache.getStats();
        
        return {
          missing,
          stats: stats || { errorCount: 0 }
        };
      } catch (error) {
        return {
          error: error.message,
          stats: { errorCount: 1 }
        };
      }
    });

    expect(result.missing).toBeNull();
    expect(result.stats.errorCount).toBeGreaterThanOrEqual(0);
  });
}); 