import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { IndexedDBCacheL3 } from '../IndexedDBCacheL3';

describe('IndexedDBCacheL3', () => {
  let cache: IndexedDBCacheL3;
  let mockIndexedDB: {
    open: jest.Mock;
    deleteDatabase: jest.Mock;
  };

  beforeEach(async () => {
    // Mock di IndexedDB
    mockIndexedDB = {
      open: jest.fn(),
      deleteDatabase: jest.fn()
    };
    global.indexedDB = mockIndexedDB as any;

    // Mock della risposta di open
    const mockDB = {
      transaction: jest.fn(),
      objectStoreNames: {
        contains: jest.fn()
      },
      createObjectStore: jest.fn(),
      close: jest.fn()
    };

    const mockTransaction = {
      objectStore: jest.fn(),
      oncomplete: null,
      onerror: null
    };

    const mockStore = {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      createIndex: jest.fn(),
      index: jest.fn()
    };

    const mockIndex = {
      openCursor: jest.fn()
    };

    mockDB.transaction.mockReturnValue(mockTransaction);
    mockTransaction.objectStore.mockReturnValue(mockStore);
    mockStore.index.mockReturnValue(mockIndex);

    mockIndexedDB.open.mockImplementation((name, version) => {
      const request = {
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
        result: mockDB
      };

      setTimeout(() => {
        if (request.onupgradeneeded) {
          request.onupgradeneeded({ target: request } as any);
        }
        if (request.onsuccess) {
          request.onsuccess({ target: request } as any);
        }
      }, 0);

      return request;
    });

    cache = new IndexedDBCacheL3();
    await cache.initialize();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await cache.clear();
  });

  describe('Operazioni Base', () => {
    test('dovrebbe impostare e recuperare correttamente i valori', async () => {
      const testData = { id: 1, nome: 'test' };
      await cache.set('key1', testData);
      const result = await cache.get('key1');
      expect(result).toEqual(testData);
    });

    test('dovrebbe gestire correttamente valori null e undefined', async () => {
      await cache.set('nullKey', null);
      await cache.set('undefinedKey', undefined);
      expect(await cache.get('nullKey')).toBeNull();
      expect(await cache.get('undefinedKey')).toBeNull();
    });

    test('dovrebbe rimuovere correttamente i valori', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.has('key1')).toBe(true);
      await cache.delete('key1');
      expect(await cache.has('key1')).toBe(false);
    });

    test('dovrebbe cancellare tutti i valori', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.clear();
      const stats = await cache.getStats();
      expect(stats.currentEntries).toBe(0);
      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(false);
    });
  });

  describe('Gestione Memoria ed Evizione', () => {
    test('dovrebbe evictare le entries quando si supera il limite di memoria', async () => {
      const config = cache.getConfig();
      config.maxMemoryUsage = 1024; // 1KB
      cache.updateConfig(config);

      const largeValue = 'x'.repeat(512); // 512 bytes
      await cache.set('key1', largeValue);
      await cache.set('key2', largeValue);
      await cache.set('key3', largeValue);

      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(true);
      expect(await cache.has('key3')).toBe(true);

      const stats = await cache.getStats();
      expect(stats.currentEntries).toBe(2);
      expect(stats.totalSize).toBeLessThanOrEqual(config.maxMemoryUsage);
    });

    test('dovrebbe evictare le entries quando si supera il numero massimo di entries', async () => {
      const config = cache.getConfig();
      config.maxEntries = 2;
      cache.updateConfig(config);

      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(true);
      expect(await cache.has('key3')).toBe(true);

      const stats = await cache.getStats();
      expect(stats.currentEntries).toBe(2);
    });

    test('dovrebbe rispettare la politica LRU di evizione', async () => {
      const config = cache.getConfig();
      config.maxEntries = 2;
      cache.updateConfig(config);

      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      // Accedo a key1 per renderlo più recente
      await cache.get('key1');
      
      await cache.set('key3', 'value3');

      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('key2')).toBe(false);
      expect(await cache.has('key3')).toBe(true);
    });
  });

  describe('TTL e Scadenza', () => {
    test('dovrebbe rispettare il TTL delle entries', async () => {
      await cache.set('key1', 'value1', 100); // 100ms TTL
      expect(await cache.get('key1')).toBe('value1');
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(await cache.get('key1')).toBeNull();
    });
    test('dovrebbe gestire correttamente la pulizia delle entries scadute', async () => {
      await cache.set('key1', 'value1', 100);
      await cache.set('key2', 'value2', 200);
      await new Promise(resolve => setTimeout(resolve, 150));
      const stats = await cache.getStats();
      expect(stats.currentEntries).toBe(1);
      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(true);
    });
  });

  describe('Gestione Errori e Recovery', () => {
    test('dovrebbe gestire correttamente i riferimenti circolari', async () => {
      const circular: any = {};
      circular.self = circular;

      await cache.set('key1', circular);
      const stats = await cache.getStats();
      expect(stats.errorCount).toBe(1);
      expect(stats.lastError).not.toBeNull();
    });

    test('dovrebbe gestire correttamente i dati corrotti', async () => {
      const corruptedData = '{"invalid": json}';
      await cache.set('key1', corruptedData);

      expect(await cache.get('key1')).toBeNull();
      const stats = await cache.getStats();
      expect(stats.errorCount).toBeGreaterThan(0);
    });

    test('dovrebbe recuperare automaticamente dopo un errore', async () => {
      // Forzo un errore
      const circular: any = {};
      circular.self = circular;
      await cache.set('key1', circular);

      // Verifico che il sistema continui a funzionare
      await cache.set('key2', 'value2');
      expect(await cache.get('key2')).toBe('value2');

      const stats = await cache.getStats();
      expect(stats.recoveryCount).toBeGreaterThan(0);
    });
  });

  describe('Performance e Statistiche', () => {
    test('dovrebbe tracciare correttamente hits e misses', async () => {
      await cache.set('key1', 'value1');
      
      expect(await cache.get('key1')).toBe('value1');
      expect(await cache.get('key2')).toBeNull();

      const stats = await cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(50);
    });

    test('dovrebbe tracciare i tempi delle operazioni', async () => {
      const start = performance.now();
      
      await cache.set('key1', 'value1');
      await cache.get('key1');
      
      const stats = await cache.getStats();
      expect(stats.averageWriteTime).toBeGreaterThan(0);
      expect(stats.averageQueryTime).toBeGreaterThan(0);
    });

    test('dovrebbe mantenere le performance sotto carico', async () => {
      const start = performance.now();
      
      // Eseguo 100 operazioni
      for (let i = 0; i < 100; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }

      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(10000); // Dovrebbe completare entro 10 secondi
      
      const stats = await cache.getStats();
      expect(stats.errorCount).toBe(0);
    });
  });

  describe('Gestione Configurazione', () => {
    test('dovrebbe aggiornare correttamente la configurazione', async () => {
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

    test('dovrebbe mantenere una configurazione valida dopo gli aggiornamenti', async () => {
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

  describe('Coda Operazioni', () => {
    test('dovrebbe gestire correttamente la coda delle operazioni', async () => {
      const operations = [];
      for (let i = 0; i < 5; i++) {
        operations.push(cache.set(`key${i}`, `value${i}`));
      }

      await Promise.all(operations);
      
      for (let i = 0; i < 5; i++) {
        expect(await cache.has(`key${i}`)).toBe(true);
      }
    });

    test('dovrebbe gestire correttamente gli errori nella coda', async () => {
      const circular: any = {};
      circular.self = circular;

      await cache.set('key1', circular);
      await cache.set('key2', 'value2');

      expect(await cache.get('key2')).toBe('value2');
      const stats = await cache.getStats();
      expect(stats.errorCount).toBe(1);
    });
  });

  describe('Inizializzazione Database', () => {
    test('dovrebbe inizializzare correttamente il database', async () => {
      const newCache = new IndexedDBCacheL3();
      await newCache.initialize();
      
      const stats = await newCache.getStats();
      expect(stats.errorCount).toBe(0);
      expect(stats.recoveryCount).toBeGreaterThan(0);
    });

    test('dovrebbe gestire correttamente gli errori di inizializzazione', async () => {
      mockIndexedDB.open.mockImplementationOnce(() => {
        const request = {
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          error: new Error('Database error')
        };

        setTimeout(() => {
          if (request.onerror) {
            request.onerror({ target: request } as any);
          }
        }, 0);

        return request;
      });

      const newCache = new IndexedDBCacheL3();
      await expect(newCache.initialize()).rejects.toThrow();
      
      const stats = await newCache.getStats();
      expect(stats.errorCount).toBeGreaterThan(0);
    });
  });
}); 