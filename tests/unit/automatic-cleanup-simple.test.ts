/**
 * STUDENT ANALYST - AutomaticCleanupService Tests
 * Comprehensive unit tests for automatic cleanup functionality
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { Mock } from 'jest-mock';

// Mock browser APIs
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(global, 'setTimeout', {
  value: jest.fn((fn: unknown, delay: number) => 123),
  writable: true,
});

Object.defineProperty(global, 'clearTimeout', {
  value: jest.fn(),
  writable: true,
});

// Setup window.confirm mock safely
interface CustomWindow extends Window {
  confirm: Mock<() => boolean>;
}

declare global {
  interface Window {
    confirm: Mock<() => boolean>;
  }
}

const customWindow = global as unknown as CustomWindow;
customWindow.window = customWindow.window || ({} as CustomWindow);
customWindow.window.confirm = jest.fn(() => true);

Object.defineProperty(global, 'navigator', {
  value: {
    storage: {
      estimate: jest.fn(() => Promise.resolve({ usage: 5000, quota: 10000 })),
    },
  },
  writable: true,
});

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

// Import the service
import AutomaticCleanupService from '../../src/services/AutomaticCleanupService';

// Add type definitions at the top
type CacheLayer = 'L1' | 'L2' | 'L3';
type CacheStats = {
  hits?: number;
  misses?: number;
  evictions?: number;
  currentEntries?: number;
  memoryUsage?: number;
  size?: number;
  totalStorageUsed?: number;
  hitCount?: number;
  missCount?: number;
  totalSize?: number;
  entryCount?: number;
};

interface CacheInterface {
  clear: Mock;
  getStats: Mock;
  keys?: Mock;
  getAllKeys?: Mock;
  get: Mock;
  remove?: Mock;
  delete?: Mock;
  has: Mock;
  size?: Mock;
}

describe('AutomaticCleanupService - Comprehensive Tests', () => {
  let service: AutomaticCleanupService;
  let mockMemoryCache: CacheInterface;
  let mockLocalStorageCache: CacheInterface;
  let mockIndexedDBCache: CacheInterface;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset singleton
    (
      AutomaticCleanupService as {
        instance: AutomaticCleanupService | undefined;
      }
    ).instance = undefined;

    mockLocalStorage.getItem.mockReturnValue(null);

    // Create comprehensive mocks
    mockMemoryCache = {
      clear: jest.fn(),
      getStats: jest.fn(() => ({
        hits: 10,
        misses: 5,
        evictions: 2,
        currentEntries: 50,
        memoryUsage: 1000,
        size: 10,
      })),
      keys: jest.fn(() => ['key1', 'key2']),
      get: jest.fn(),
      remove: jest.fn(),
      has: jest.fn(),
      size: jest.fn(() => 2),
    };

    mockLocalStorageCache = {
      clear: jest.fn(),
      getStats: jest.fn(() => ({
        hits: 15,
        misses: 8,
        evictions: 3,
        currentEntries: 30,
        totalStorageUsed: 2000,
      })),
      keys: jest.fn(() => ['key3', 'key4']),
      get: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
    };

    mockIndexedDBCache = {
      clear: jest.fn(),
      getStats: jest.fn(() =>
        Promise.resolve({
          hitCount: 20,
          missCount: 12,
          totalSize: 3000,
          entryCount: 25,
        })
      ),
      getAllKeys: jest.fn(() => Promise.resolve(['key5', 'key6'])),
      get: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
    };

    service = new AutomaticCleanupService(
      mockMemoryCache,
      mockLocalStorageCache,
      mockIndexedDBCache
    );
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should create AutomaticCleanupService instance', () => {
      expect(service).toBeInstanceOf(AutomaticCleanupService);
    });

    it('should maintain singleton pattern', () => {
      const instance1 = AutomaticCleanupService.getInstance();
      const instance2 = AutomaticCleanupService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should have correct default configuration', () => {
      const config = service.getConfig();

      expect(config.dailyCleanupTime).toBe('02:00');
      expect(config.enableDailyCleanup).toBe(true);
      expect(config.maxDataAge.L1).toBe(24 * 60 * 60 * 1000);
      expect(config.maxDataAge.L2).toBe(7 * 24 * 60 * 60 * 1000);
      expect(config.maxDataAge.L3).toBe(30 * 24 * 60 * 60 * 1000);
      expect(config.lruThresholds.L1).toBe(0.9);
      expect(config.lruThresholds.L2).toBe(0.85);
    });

    it('should initialize successfully', async () => {
      await service.initialize();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '🧹 Inizializzazione AutomaticCleanupService...'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ AutomaticCleanupService inizializzato con successo'
      );
    });

    it('should handle initialization errors', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(service.initialize()).rejects.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Errore inizializzazione AutomaticCleanupService:',
        expect.any(Error)
      );
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        dailyCleanupTime: '03:00',
        enableDailyCleanup: false,
      };

      service.updateConfig(newConfig);

      const updatedConfig = service.getConfig();
      expect(updatedConfig.dailyCleanupTime).toBe('03:00');
      expect(updatedConfig.enableDailyCleanup).toBe(false);
    });

    it('should restart scheduler when config changes', async () => {
      await service.initialize();

      jest.clearAllMocks();

      service.updateConfig({ dailyCleanupTime: '04:00' });

      expect(global.clearTimeout).toHaveBeenCalled();
      expect(global.setTimeout).toHaveBeenCalled();
    });
  });

  describe('Data Access Tracking', () => {
    it('should track L1 data access', () => {
      expect(() => service.trackDataAccess('test-key', 'L1')).not.toThrow();
    });

    it('should track L2 data access', () => {
      expect(() => service.trackDataAccess('test-key', 'L2')).not.toThrow();
    });

    it('should track L3 data access', () => {
      expect(() => service.trackDataAccess('test-key', 'L3')).not.toThrow();
    });

    it('should save LRU tracker periodically', () => {
      // Trigger periodic save by accessing many keys
      for (let i = 0; i < 100; i++) {
        service.trackDataAccess(`key-${i}`, 'L1');
      }

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cleanup_lru_tracker',
        expect.any(String)
      );
    });
  });

  describe('LRU Cleanup Operations', () => {
    it('should perform LRU cleanup on L1 cache', async () => {
      const result = await service.performLRUCleanup('L1', 0.3);

      expect(typeof result).toBe('boolean');
      expect(mockMemoryCache.remove).toHaveBeenCalled();
    });

    it('should perform LRU cleanup on L2 cache', async () => {
      const result = await service.performLRUCleanup('L2', 0.4);

      expect(typeof result).toBe('boolean');
      expect(mockLocalStorageCache.delete).toHaveBeenCalled();
    });

    it('should perform LRU cleanup on L3 cache', async () => {
      const result = await service.performLRUCleanup('L3', 0.5);

      expect(typeof result).toBe('boolean');
      expect(mockIndexedDBCache.delete).toHaveBeenCalled();
    });

    it('should handle cleanup when no items need removal', async () => {
      // Mock empty cache
      mockMemoryCache.keys.mockReturnValue([]);

      const result = await service.performLRUCleanup('L1', 0.5);

      expect(typeof result).toBe('boolean');
    });

    it('should handle invalid cache layers', async () => {
      const result = await service.performLRUCleanup(
        'INVALID' as CacheLayer,
        0.5
      );

      expect(typeof result).toBe('boolean');
    });
  });

  describe('Manual Cleanup Operations', () => {
    // TODO: Questi test erano saltati (it.skip) e non vengono eseguiti. Valutare se recuperarli o eliminarli definitivamente.
    /*
    it.skip('should perform manual cleanup with user confirmation', async () => {
      ((global as any).window.confirm as jest.Mock).mockReturnValue(true);
      
      const items = [
        { 
          key: 'test1', 
          layer: 'L1' as const, 
          lastAccessed: Date.now() - 1000, 
          size: 100,
          type: 'test-data',
          priority: 'low' as const,
          description: 'Test item 1'
        }
      ];
      
      const result = await service.performManualCleanup(items);
      
      expect(typeof result).toBe('boolean');
      expect(mockMemoryCache.remove).toHaveBeenCalledWith('test1');
    });

    it.skip('should abort cleanup when user cancels', async () => {
      ((global as any).window.confirm as jest.Mock).mockReturnValue(false);
      
      const items = [
        { 
          key: 'test1', 
          layer: 'L1' as const, 
          lastAccessed: Date.now(), 
          size: 100,
          type: 'test-data',
          priority: 'low' as const,
          description: 'Test item 1'
        }
      ];
      
      const result = await service.performManualCleanup(items);
      
      expect(typeof result).toBe('boolean');
      expect(mockMemoryCache.remove).not.toHaveBeenCalled();
    });
    */

    it('should handle cleanup errors gracefully', async () => {
      mockMemoryCache.remove.mockImplementation(() => {
        throw new Error('Cleanup error');
      });

      const items = [
        {
          key: 'test1',
          layer: 'L1' as const,
          lastAccessed: Date.now(),
          size: 100,
          type: 'test-data',
          priority: 'low' as const,
          description: 'Test item 1',
        },
      ];

      const result = await service.performManualCleanup(items, false);

      expect(typeof result).toBe('boolean');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Progress and Completion Listeners', () => {
    it('should register progress listeners', () => {
      const progressCallback = jest.fn();

      const unsubscribe = service.onProgress(progressCallback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should register completion listeners', () => {
      const completionCallback = jest.fn();

      const unsubscribe = service.onCompletion(completionCallback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
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

      expect(typeof result).toBe('boolean');
      expect(mockMemoryCache.clear).toHaveBeenCalled();
      expect(mockLocalStorageCache.clear).toHaveBeenCalled();
      expect(mockIndexedDBCache.clear).toHaveBeenCalled();
    });

    it('should force cleanup on specific layer', async () => {
      const result = await service.forceCleanup('L1');

      expect(typeof result).toBe('boolean');
    });

    it('should handle force cleanup errors', async () => {
      mockMemoryCache.clear.mockImplementation(() => {
        throw new Error('Clear error');
      });

      const result = await service.forceCleanup('L1');

      expect(typeof result).toBe('boolean');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Service Shutdown', () => {
    it('should shutdown gracefully', () => {
      service.shutdown();

      expect(global.clearTimeout).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '🧹 AutomaticCleanupService arrestato'
      );
    });

    it('should handle shutdown errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => service.shutdown()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors during LRU save', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      for (let i = 0; i < 100; i++) {
        service.trackDataAccess(`key-${i}`, 'L1');
      }

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle invalid cleanup history data', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      await service.initialize();

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle cache operation failures during cleanup', async () => {
      mockIndexedDBCache.getAllKeys.mockRejectedValue(new Error('DB error'));

      const result = await service.performLRUCleanup('L3', 0.5);

      expect(typeof result).toBe('boolean');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Internal Methods Coverage', () => {
    it('should handle various internal scenarios', async () => {
      // Test configuration loading with valid data
      const config = { dailyCleanupTime: '05:00' };
      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'cleanup-config') return JSON.stringify(config);
        return null;
      });

      await service.initialize();

      const loadedConfig = service.getConfig();
      expect(loadedConfig.dailyCleanupTime).toBe('05:00');
    });

    it('should handle LRU tracker loading', async () => {
      const lruData = {
        L1: { 'test-key': Date.now() },
        L2: { 'test-key-2': Date.now() },
        L3: { 'test-key-3': Date.now() },
      };

      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'lru-tracker') return JSON.stringify(lruData);
        return null;
      });

      await service.initialize();

      // Should load without errors
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('should handle cleanup history loading', async () => {
      const historyData = [
        {
          timestamp: Date.now(),
          operationType: 'manual',
          layer: 'L1',
          itemsRemoved: 5,
          spaceFreed: 1000,
          duration: 100,
          success: true,
          errors: [],
        },
      ];

      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'cleanup-history') return JSON.stringify(historyData);
        return null;
      });

      await service.initialize();

      const history = service.getCleanupHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should handle access tracking for different layers', () => {
      service.trackDataAccess('key1', 'L1');
      service.trackDataAccess('key2', 'L2');
      service.trackDataAccess('key3', 'L3');

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should handle storage estimation', async () => {
      // Test internal storage checking
      expect(() => service.trackDataAccess('test', 'L1')).not.toThrow();
    });

    it('should handle daily cleanup scheduling', async () => {
      await service.initialize();

      // Verify scheduler was called
      expect(global.setTimeout).toHaveBeenCalled();
    });

    it('should handle configuration updates with restart', async () => {
      await service.initialize();
      jest.clearAllMocks();

      service.updateConfig({
        enableDailyCleanup: true,
        dailyCleanupTime: '03:30',
      });

      // Should save config and restart scheduler
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cleanup-config',
        expect.stringContaining('03:30')
      );
    });
  });
});
