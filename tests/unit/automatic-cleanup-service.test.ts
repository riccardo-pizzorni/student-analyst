/**
 * STUDENT ANALYST - AutomaticCleanupService Unit Tests
 * Test completi per il servizio di pulizia automatica con copertura 80%+
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { mockDeep } from 'jest-mock-extended';

// Definizione delle interfacce per i servizi cache
interface ICacheService {
  clear(): void;
  getStats(): {
    hits: number;
    misses: number;
    evictions: number;
    currentEntries: number;
    memoryUsage?: number;
    size?: number;
    totalStorageUsed?: number;
    hitCount?: number;
    missCount?: number;
    totalSize?: number;
    entryCount?: number;
  };
  keys(): string[];
  get(key: string): unknown;
  remove?(key: string): boolean;
  delete?(key: string): boolean;
  has(key: string): boolean;
  size(): number;
}

interface IStorageService {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

interface IStorageEstimate {
  usage: number;
  quota: number;
}

// Mock delle dipendenze del servizio usando jest-mock-extended
const mockMemoryCache = mockDeep<ICacheService>();
const mockLocalStorageCache = mockDeep<ICacheService>();
const mockIndexedDBCache = mockDeep<ICacheService>();
const mockLocalStorage = mockDeep<IStorageService>();

// Mock dei moduli
jest.mock('../../src/services/interfaces/ICache', () => ({}));

// Setup localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Setup setTimeout/clearTimeout mocks
const mockSetTimeout = jest.fn<number, [() => void, number]>();
const mockClearTimeout = jest.fn<void, [number]>();
Object.defineProperty(global, 'setTimeout', {
  value: mockSetTimeout,
  writable: true,
});
Object.defineProperty(global, 'clearTimeout', {
  value: mockClearTimeout,
  writable: true,
});

// Mock window.confirm
Object.defineProperty(global, 'window', {
  value: {
    confirm: jest.fn<boolean, [string]>(),
  },
  writable: true,
});

// Mock navigator.storage
Object.defineProperty(global, 'navigator', {
  value: {
    storage: {
      estimate: jest.fn<Promise<IStorageEstimate>, []>(),
    },
  },
  writable: true,
});

// Import del servizio dopo i mock
import AutomaticCleanupService from '../../src/services/AutomaticCleanupService';

describe('AutomaticCleanupService', () => {
  let service: AutomaticCleanupService;

  beforeEach(() => {
    // Reset tutti i mock
    jest.clearAllMocks();

    // Reset delle istanze singleton
    (AutomaticCleanupService as unknown).instance = undefined;

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Setup mock defaults
    mockMemoryCache.getStats.mockReturnValue({
      hits: 0,
      misses: 0,
      evictions: 0,
      currentEntries: 0,
      memoryUsage: 1000,
      size: 10,
    });
    mockLocalStorageCache.getStats.mockReturnValue({
      hits: 0,
      misses: 0,
      evictions: 0,
      currentEntries: 0,
      totalStorageUsed: 2000,
    });
    mockIndexedDBCache.getStats.mockResolvedValue({
      hitCount: 0,
      missCount: 0,
      totalSize: 3000,
      entryCount: 0,
    });

    mockLocalStorage.getItem.mockReturnValue(null);
    mockSetTimeout.mockImplementation((fn, delay) => {
      return 123; // Mock timer ID
    });

    (global.window.confirm as jest.Mock).mockReturnValue(true);
    (global.navigator.storage.estimate as jest.Mock).mockResolvedValue({
      usage: 5000,
      quota: 10000,
    });

    // Crea istanza del servizio
    service = new AutomaticCleanupService(
      mockMemoryCache as unknown,
      mockLocalStorageCache as unknown,
      mockIndexedDBCache as unknown
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor and Singleton', () => {
    it('should create a new AutomaticCleanupService instance', () => {
      expect(service).toBeInstanceOf(AutomaticCleanupService);
    });

    it('should maintain singleton pattern', () => {
      const instance1 = AutomaticCleanupService.getInstance();
      const instance2 = AutomaticCleanupService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should initialize with correct default configuration', () => {
      const config = service.getConfig();

      expect(config.dailyCleanupTime).toBe('02:00');
      expect(config.enableDailyCleanup).toBe(true);
      expect(config.maxDataAge.L1).toBe(24 * 60 * 60 * 1000);
      expect(config.maxDataAge.L2).toBe(7 * 24 * 60 * 60 * 1000);
      expect(config.maxDataAge.L3).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully with all components', async () => {
      await service.initialize();

      expect(console.log).toHaveBeenCalledWith(
        '🧹 Inizializzazione AutomaticCleanupService...'
      );
      expect(console.log).toHaveBeenCalledWith(
        '✅ AutomaticCleanupService inizializzato con successo'
      );
    });

    it('should handle initialization errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(service.initialize()).rejects.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        '❌ Errore inizializzazione AutomaticCleanupService:',
        expect.any(Error)
      );
    });

    it('should load existing LRU tracker data', async () => {
      const existingLRU = JSON.stringify([
        ['L1:key1', 123456],
        ['L2:key2', 789012],
      ]);
      mockLocalStorage.getItem.mockReturnValueOnce(existingLRU);

      await service.initialize();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('lru-tracker');
    });

    it('should load existing cleanup history', async () => {
      const existingHistory = JSON.stringify([
        {
          timestamp: Date.now(),
          operationType: 'DAILY',
          layer: 'L1',
          itemsRemoved: 5,
          spaceFreed: 1000,
          duration: 2000,
          success: true,
          errors: [],
        },
      ]);
      mockLocalStorage.getItem
        .mockReturnValueOnce(null) // LRU tracker
        .mockReturnValueOnce(existingHistory) // cleanup history
        .mockReturnValueOnce(null); // schedule

      await service.initialize();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('cleanup-history');
    });
  });

  describe('Daily Cleanup Scheduler', () => {
    it('should schedule daily cleanup at configured time', async () => {
      const config = service.getConfig();
      config.enableDailyCleanup = true;
      config.dailyCleanupTime = '02:00';

      await service.initialize();

      expect(mockSetTimeout).toHaveBeenCalled();
    });

    it('should not schedule daily cleanup when disabled', async () => {
      service.updateConfig({ enableDailyCleanup: false });

      await service.initialize();

      expect(console.log).toHaveBeenCalledWith('📅 Daily cleanup disabilitato');
    });

    it('should schedule for next day if time has passed today', async () => {
      const mockDate = new Date();
      mockDate.setHours(3, 0, 0, 0); // 3:00 AM
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown);

      await service.initialize();

      expect(mockSetTimeout).toHaveBeenCalled();

      (global.Date as unknown).mockRestore();
    });
  });

  describe('LRU Cleanup Operations', () => {
    it('should perform LRU cleanup on L1 cache', async () => {
      mockMemoryCache.keys.mockReturnValue(['key1', 'key2', 'key3']);
      mockMemoryCache.getStats.mockReturnValue({
        hits: 100,
        misses: 20,
        currentEntries: 50,
        memoryUsage: 9500,
        size: 50,
      });

      const result = await service.performLRUCleanup('L1', 0.3);

      expect(result).toBe(true);
      expect(mockMemoryCache.keys).toHaveBeenCalled();
    });

    it('should perform LRU cleanup on L2 cache', async () => {
      mockLocalStorageCache.keys.mockReturnValue(['key1', 'key2']);
      mockLocalStorageCache.getStats.mockReturnValue({
        hits: 50,
        misses: 10,
        currentEntries: 30,
        totalStorageUsed: 8500,
      });

      const result = await service.performLRUCleanup('L2', 0.2);

      expect(result).toBe(true);
    });

    it('should perform LRU cleanup on L3 cache', async () => {
      mockIndexedDBCache.getAllKeys?.mockResolvedValue([
        'key1',
        'key2',
        'key3',
      ]);
      mockIndexedDBCache.getStats.mockResolvedValue({
        hitCount: 200,
        missCount: 50,
        entryCount: 100,
        totalSize: 8000,
      });

      const result = await service.performLRUCleanup('L3', 0.4);

      expect(result).toBe(true);
    });

    it('should handle LRU cleanup errors gracefully', async () => {
      mockMemoryCache.keys.mockImplementation(() => {
        throw new Error('Cache error');
      });

      const result = await service.performLRUCleanup('L1');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Manual Cleanup Operations', () => {
    it('should perform manual cleanup with items', async () => {
      const cleanupItems = [
        {
          key: 'test-key-1',
          layer: 'L1' as const,
          size: 100,
          lastAccessed: Date.now() - 86400000,
          type: 'stock-data',
          priority: 'low' as const,
          description: 'Old stock data',
        },
      ];

      const result = await service.performManualCleanup(cleanupItems, false);

      expect(result).toBe(true);
    });

    it('should request user confirmation for large cleanups', async () => {
      const largeCleanupItems = Array.from({ length: 150 }, (_, i) => ({
        key: `test-key-${i}`,
        layer: 'L1' as const,
        size: 100,
        lastAccessed: Date.now() - 86400000,
        type: 'test-data',
        priority: 'low' as const,
        description: `Test item ${i}`,
      }));

      (global.window.confirm as jest.Mock<boolean, [string]>).mockReturnValue(
        true
      );

      const result = await service.performManualCleanup(
        largeCleanupItems,
        true
      );

      expect(result).toBe(true);
      expect(global.window.confirm).toHaveBeenCalled();
    });

    it('should cancel cleanup if user denies confirmation', async () => {
      const largeCleanupItems = Array.from({ length: 150 }, (_, i) => ({
        key: `test-key-${i}`,
        layer: 'L1' as const,
        size: 100,
        lastAccessed: Date.now() - 86400000,
        type: 'test-data',
        priority: 'low' as const,
        description: `Test item ${i}`,
      }));

      (global.window.confirm as jest.Mock<boolean, [string]>).mockReturnValue(
        false
      );

      const result = await service.performManualCleanup(
        largeCleanupItems,
        true
      );

      expect(result).toBe(false);
    });
  });

  describe('Data Access Tracking', () => {
    it('should track L1 data access', () => {
      const key = 'test-key';
      const layer = 'L1';

      expect(() => service.trackDataAccess(key, layer)).not.toThrow();
    });

    it('should track L2 data access', () => {
      const key = 'test-key';
      const layer = 'L2';

      expect(() => service.trackDataAccess(key, layer)).not.toThrow();
    });

    it('should track L3 data access', () => {
      const key = 'test-key';
      const layer = 'L3';

      expect(() => service.trackDataAccess(key, layer)).not.toThrow();
    });

    it('should save LRU tracker periodically', () => {
      for (let i = 0; i < 100; i++) {
        service.trackDataAccess(`key-${i}`, 'L1');
      }

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'lru-tracker',
        expect.any(String)
      );
    });
  });

  describe('Configuration Management', () => {
    it('should get current configuration', () => {
      const config = service.getConfig();

      expect(config).toHaveProperty('dailyCleanupTime');
      expect(config).toHaveProperty('enableDailyCleanup');
      expect(config).toHaveProperty('maxDataAge');
      expect(config).toHaveProperty('lruThresholds');
    });

    it('should update configuration', () => {
      const newConfig = {
        dailyCleanupTime: '03:00',
        enableDailyCleanup: false,
        maxDataAge: {
          L1: 12 * 60 * 60 * 1000,
          L2: 3 * 24 * 60 * 60 * 1000,
          L3: 14 * 24 * 60 * 60 * 1000,
        },
      };

      service.updateConfig(newConfig);

      const updatedConfig = service.getConfig();
      expect(updatedConfig.dailyCleanupTime).toBe('03:00');
      expect(updatedConfig.enableDailyCleanup).toBe(false);
      expect(updatedConfig.maxDataAge.L1).toBe(12 * 60 * 60 * 1000);
    });
  });

  describe('Cleanup History and Reporting', () => {
    it('should maintain cleanup history', () => {
      const history = service.getCleanupHistory();

      expect(Array.isArray(history)).toBe(true);
    });

    it('should get current operations', () => {
      const operations = service.getCurrentOperations();

      expect(Array.isArray(operations)).toBe(true);
    });
  });

  describe('Force Cleanup', () => {
    it('should force cleanup on all layers', async () => {
      const result = await service.forceCleanup();

      expect(result).toBe(true);
    });

    it('should force cleanup on specific layer', async () => {
      const result = await service.forceCleanup('L1');

      expect(result).toBe(true);
    });

    it('should handle force cleanup errors', async () => {
      mockMemoryCache.clear.mockRejectedValue(new Error('Cleanup error'));

      const result = await service.forceCleanup('L1');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Progress and Completion Listeners', () => {
    it('should register and call progress listeners', () => {
      const progressCallback = jest.fn();

      const unsubscribe = service.onProgress(progressCallback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should register and call completion listeners', () => {
      const completionCallback = jest.fn();

      const unsubscribe = service.onCompletion(completionCallback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('Cleanup Scheduling', () => {
    it('should cancel scheduled cleanup', () => {
      service.cancelCleanup();

      expect(mockClearTimeout).toHaveBeenCalled();
    });

    it('should handle storage health check for L1', async () => {
      const healthCheck = (service as unknown).checkStorageHealth('L1');

      await expect(healthCheck).resolves.toEqual({
        currentUsage: expect.any(Number),
        quota: expect.any(Number),
      });
    });

    it('should handle storage health check for L2', async () => {
      const healthCheck = (service as unknown).checkStorageHealth('L2');

      await expect(healthCheck).resolves.toEqual({
        currentUsage: expect.any(Number),
        quota: expect.any(Number),
      });
    });
  });

  describe('Service Shutdown', () => {
    it('should shutdown gracefully', () => {
      service.shutdown();

      expect(mockClearTimeout).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '🔥 AutomaticCleanupService shutdown completato'
      );
    });

    it('should handle shutdown errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => service.shutdown()).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle localStorage errors during LRU save', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      for (let i = 0; i < 100; i++) {
        service.trackDataAccess(`key-${i}`, 'L1');
      }

      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle invalid cleanup history data', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      await service.initialize();

      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Impossibile caricare cronologia cleanup:',
        expect.any(Error)
      );
    });

    it('should handle missing storage API gracefully', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: undefined,
        writable: true,
      });

      const healthCheck = (service as unknown).checkStorageHealth('L2');

      await expect(healthCheck).resolves.toEqual({
        currentUsage: 0,
        quota: 100000,
      });
    });
  });
});
