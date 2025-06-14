/**
 * STUDENT ANALYST - CacheService Unit Tests
 * Test completi per il servizio principale di cache multi-layer
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock delle dipendenze dei servizi cache
const mockMemoryCacheL1 = {
  get: jest.fn<any>(),
  set: jest.fn<any>(),
  remove: jest.fn<any>(),
  clear: jest.fn<any>(),
  has: jest.fn<any>(),
  keys: jest.fn<any>(),
  getStats: jest.fn<any>(),
  getConfig: jest.fn<any>(),
  updateConfig: jest.fn<any>(),
  size: jest.fn<any>()
};

const mockLocalStorageCacheL2 = {
  get: jest.fn<any>(),
  set: jest.fn<any>(),
  delete: jest.fn<any>(),
  clear: jest.fn<any>(),
  keys: jest.fn<any>(),
  getStats: jest.fn<any>()
};

const mockIndexedDBCacheL3 = {
  get: jest.fn<any>(),
  set: jest.fn<any>(),
  delete: jest.fn<any>(),
  clear: jest.fn<any>(),
  getStats: jest.fn<any>()
};

const mockCacheAnalyticsEngine = {
  trackCacheHit: jest.fn<any>(),
  trackCacheMiss: jest.fn<any>(),
  getMetrics: jest.fn<any>(),
  reset: jest.fn<any>()
};

const mockCacheQualityService = {
  checkDataQuality: jest.fn<any>()
};

const mockStorageMonitoring = {
  getStorageHealth: jest.fn<any>(),
  initialize: jest.fn<any>(),
  forceHealthCheck: jest.fn<any>()
};

const mockAutomaticCleanup = {
  initialize: jest.fn<any>(),
  getConfig: jest.fn<any>(),
  updateConfig: jest.fn<any>(),
  getCleanupHistory: jest.fn<any>(),
  getCurrentOperations: jest.fn<any>(),
  forceCleanup: jest.fn<any>(),
  trackDataAccess: jest.fn<any>(),
  onProgress: jest.fn<any>(),
  onCompletion: jest.fn<any>(),
  shutdown: jest.fn<any>()
};

// Mock dei moduli
jest.mock('../../src/services/MemoryCacheL1', () => ({
  memoryCacheL1: mockMemoryCacheL1
}));

jest.mock('../../src/services/LocalStorageCacheL2', () => ({
  localStorageCacheL2: mockLocalStorageCacheL2
}));

jest.mock('../../src/services/IndexedDBCacheL3', () => ({
  indexedDBCacheL3: mockIndexedDBCacheL3
}));

jest.mock('../../src/services/CacheAnalyticsEngine', () => ({
  cacheAnalytics: mockCacheAnalyticsEngine
}));

jest.mock('../../src/services/CacheQualityService', () => ({
  cacheQualityService: mockCacheQualityService
}));

jest.mock('../../src/services/StorageMonitoringService', () => ({
  storageMonitoring: mockStorageMonitoring
}));

jest.mock('../../src/services/AutomaticCleanupService', () => ({
  automaticCleanup: mockAutomaticCleanup
}));

// Mock di performance.now()
const mockPerformanceNow = jest.fn<any>();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

// Import del servizio
import CacheService, { cacheService } from '../../src/services/CacheService';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService();
    jest.clearAllMocks();
    
    // Setup mock defaults
    mockPerformanceNow.mockReturnValue(100);
    mockMemoryCacheL1.get.mockReturnValue(null);
    mockLocalStorageCacheL2.get.mockReturnValue(null);
    mockIndexedDBCacheL3.get.mockResolvedValue(null);
    mockMemoryCacheL1.set.mockReturnValue(true);
    mockLocalStorageCacheL2.set.mockReturnValue(true);
    mockIndexedDBCacheL3.set.mockResolvedValue(true);
    mockCacheQualityService.checkDataQuality.mockResolvedValue(undefined);
    
    // Mock storage health
    mockStorageMonitoring.getStorageHealth.mockReturnValue({
      localStorage: { available: true, quota: 10000, used: 1000 },
      sessionStorage: { available: true, quota: 10000, used: 500 },
      indexedDB: { available: true, quota: 100000, used: 5000 }
    });
    
    // Mock stats
    mockMemoryCacheL1.getStats.mockReturnValue({
      hits: 0, misses: 0, evictions: 0, currentEntries: 0, 
      memoryUsage: 0, averageAccessTime: 0, size: 0, hitRate: 0
    });
    mockLocalStorageCacheL2.getStats.mockReturnValue({
      hits: 0, misses: 0, evictions: 0, currentEntries: 0,
      totalStorageUsed: 0, hitRate: 0, lastAccess: Date.now()
    });
    mockIndexedDBCacheL3.getStats.mockResolvedValue({
      hitCount: 0, missCount: 0, totalSize: 0, entryCount: 0,
      hitRate: 0, averageQueryTime: 0, lastAccess: Date.now()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create a new CacheService instance', () => {
      expect(service).toBeInstanceOf(CacheService);
    });

    it('should have correct default configuration', () => {
      const defaultTTL = (service as any).defaultTTL;
      const keyPrefix = (service as any).keyPrefix;
      
      expect(defaultTTL).toBe(60 * 60 * 1000); // 1 hour
      expect(keyPrefix).toBe('student-analyst');
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate correct cache keys with default prefix', () => {
      const generateCacheKey = (service as any).generateCacheKey.bind(service);
      const key = generateCacheKey('test-key');
      
      expect(key).toBe('student-analyst:test-key');
    });

    it('should generate cache keys with custom options', () => {
      const generateCacheKey = (service as any).generateCacheKey.bind(service);
      const key = generateCacheKey('test-key', {
        prefix: 'custom',
        includeTimestamp: true,
        customSuffix: 'suffix'
      });
      
      expect(key).toMatch(/^custom:test-key:\d+:suffix$/);
    });
  });

  describe('get() - Three Layer Caching', () => {
    const testKey = 'test-key';
    const testData = { message: 'test data' };
    const fetchFunction = jest.fn<() => Promise<any>>().mockResolvedValue(testData);

    it('should return data from L1 cache when available', async () => {
      mockMemoryCacheL1.get.mockReturnValue(testData);

      const result = await service.get(testKey, fetchFunction);

      expect(result).toEqual({
        data: testData,
        fromCache: true,
        timestamp: expect.any(Number),
        cacheKey: 'student-analyst:test-key',
        ttl: 60 * 60 * 1000
      });
      expect(mockCacheAnalyticsEngine.trackCacheHit).toHaveBeenCalled();
      expect(mockCacheQualityService.checkDataQuality).toHaveBeenCalled();
      expect(fetchFunction).not.toHaveBeenCalled();
    });

    it('should return data from L2 cache when L1 miss', async () => {
      mockMemoryCacheL1.get.mockReturnValue(null);
      mockLocalStorageCacheL2.get.mockReturnValue(testData);

      const result = await service.get(testKey, fetchFunction);

      expect(result).toEqual({
        data: testData,
        fromCache: true,
        timestamp: expect.any(Number),
        cacheKey: 'student-analyst:test-key',
        ttl: 60 * 60 * 1000
      });
      expect(mockMemoryCacheL1.set).toHaveBeenCalledWith('student-analyst:test-key', testData, 60 * 60 * 1000);
      expect(mockLocalStorageCacheL2.delete).toHaveBeenCalledWith('student-analyst:test-key');
    });

    it('should return data from L3 cache when L1 and L2 miss', async () => {
      mockMemoryCacheL1.get.mockReturnValue(null);
      mockLocalStorageCacheL2.get.mockReturnValue(null);
      mockIndexedDBCacheL3.get.mockResolvedValue(testData);

      const result = await service.get(testKey, fetchFunction);

      expect(result).toEqual({
        data: testData,
        fromCache: true,
        timestamp: expect.any(Number),
        cacheKey: 'student-analyst:test-key',
        ttl: 60 * 60 * 1000
      });
      expect(mockLocalStorageCacheL2.set).toHaveBeenCalled();
      expect(mockMemoryCacheL1.set).toHaveBeenCalled();
    });

    it('should fetch from API when all cache layers miss', async () => {
      mockMemoryCacheL1.get.mockReturnValue(null);
      mockLocalStorageCacheL2.get.mockReturnValue(null);
      mockIndexedDBCacheL3.get.mockResolvedValue(null);

      const result = await service.get(testKey, fetchFunction);

      expect(result).toEqual({
        data: testData,
        fromCache: false,
        timestamp: expect.any(Number),
        cacheKey: 'student-analyst:test-key',
        ttl: 60 * 60 * 1000
      });
      expect(fetchFunction).toHaveBeenCalled();
      expect(mockMemoryCacheL1.set).toHaveBeenCalled();
      expect(mockLocalStorageCacheL2.set).toHaveBeenCalled();
      expect(mockIndexedDBCacheL3.set).toHaveBeenCalled();
    });

    it('should handle API errors and return stale data from L2 cache', async () => {
      const apiError = new Error('API Error');
      const staleData = { message: 'stale data' };
      const failingFetch = jest.fn<() => Promise<any>>().mockRejectedValue(apiError);
      
      mockMemoryCacheL1.get.mockReturnValue(null);
      mockLocalStorageCacheL2.get
        .mockReturnValueOnce(null) // First call for regular cache check
        .mockReturnValueOnce(staleData); // Second call for stale data check
      mockIndexedDBCacheL3.get.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.get(testKey, failingFetch);

      expect(result).toEqual({
        data: staleData,
        fromCache: true,
        timestamp: expect.any(Number),
        cacheKey: 'student-analyst:test-key',
        ttl: 0 // Indicates stale data
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        `API error, returning stale data for student-analyst:test-key:`,
        apiError
      );

      consoleSpy.mockRestore();
    });

    it('should handle API errors and return stale data from L3 cache when L2 unavailable', async () => {
      const apiError = new Error('API Error');
      const staleData = { message: 'stale data from L3' };
      const failingFetch = jest.fn<() => Promise<any>>().mockRejectedValue(apiError);
      
      mockMemoryCacheL1.get.mockReturnValue(null);
      mockLocalStorageCacheL2.get.mockReturnValue(null);
      mockIndexedDBCacheL3.get
        .mockResolvedValueOnce(null) // First call for regular cache check
        .mockResolvedValueOnce(staleData); // Second call for stale data check

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.get(testKey, failingFetch);

      expect(result).toEqual({
        data: staleData,
        fromCache: true,
        timestamp: expect.any(Number),
        cacheKey: 'student-analyst:test-key',
        ttl: 0
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        `API error, returning stale data for student-analyst:test-key:`,
        apiError
      );

      consoleSpy.mockRestore();
    });

    it('should handle API errors and throw when no stale data available', async () => {
      const apiError = new Error('API Error');
      const failingFetch = jest.fn<() => Promise<any>>().mockRejectedValue(apiError);
      
      mockMemoryCacheL1.get.mockReturnValue(null);
      mockLocalStorageCacheL2.get.mockReturnValue(null);
      mockIndexedDBCacheL3.get.mockResolvedValue(null);

      await expect(service.get(testKey, failingFetch)).rejects.toThrow('API Error');
    });

    it('should handle cache quality check failures gracefully', async () => {
      const qualityError = new Error('Quality check failed');
      mockMemoryCacheL1.get.mockReturnValue(testData);
      mockCacheQualityService.checkDataQuality.mockRejectedValue(qualityError);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.get(testKey, fetchFunction);

      expect(result.data).toEqual(testData);
      expect(result.fromCache).toBe(true);
      
      // Wait for async quality check to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(consoleSpy).toHaveBeenCalledWith('Quality check failed for L1 data:', qualityError);

      consoleSpy.mockRestore();
    });

    it('should bypass cache when forceRefresh is true', async () => {
      mockMemoryCacheL1.get.mockReturnValue(testData);

      const result = await service.get(testKey, fetchFunction, { forceRefresh: true });

      expect(result.fromCache).toBe(false);
      expect(fetchFunction).toHaveBeenCalled();
      expect(mockMemoryCacheL1.get).not.toHaveBeenCalled();
    });

    it('should skip caching when enableCache is false', async () => {
      const result = await service.get(testKey, fetchFunction, { enableCache: false });

      expect(result.fromCache).toBe(false);
      expect(mockMemoryCacheL1.set).not.toHaveBeenCalled();
      expect(mockLocalStorageCacheL2.set).not.toHaveBeenCalled();
      expect(mockIndexedDBCacheL3.set).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling in getStaleData()', () => {
    it('should handle errors in getStaleData and return null', async () => {
      const getStaleData = (service as any).getStaleData.bind(service);
      
      mockLocalStorageCacheL2.get.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = await getStaleData('test-key');

      expect(result).toBeNull();
    });

    it('should handle errors in IndexedDB access during stale data retrieval', async () => {
      const getStaleData = (service as any).getStaleData.bind(service);
      
      mockLocalStorageCacheL2.get.mockReturnValue(null);
      mockIndexedDBCacheL3.get.mockRejectedValue(new Error('IndexedDB error'));

      const result = await getStaleData('test-key');

      expect(result).toBeNull();
    });
  });

  describe('Specialized Cache Methods', () => {
    const fetchFunction = jest.fn<() => Promise<any>>().mockResolvedValue({ data: 'test' });

    beforeEach(() => {
      mockMemoryCacheL1.get.mockReturnValue(null);
      mockLocalStorageCacheL2.get.mockReturnValue(null);
      mockIndexedDBCacheL3.get.mockResolvedValue(null);
    });

    it('should cache stock data with correct TTL and key', async () => {
      const result = await service.cacheStockData('AAPL', '1D', fetchFunction);

      expect(result.cacheKey).toBe('student-analyst:stock-data:AAPL:1D');
      expect(mockMemoryCacheL1.set).toHaveBeenCalledWith(
        'student-analyst:stock-data:AAPL:1D',
        { data: 'test' },
        60 * 60 * 1000 // 1 hour
      );
    });

    it('should cache fundamentals data with correct TTL and key', async () => {
      const result = await service.cacheFundamentalsData('AAPL', 'income', fetchFunction);

      expect(result.cacheKey).toBe('student-analyst:fundamentals:AAPL:income');
      expect(mockMemoryCacheL1.set).toHaveBeenCalledWith(
        'student-analyst:fundamentals:AAPL:income',
        { data: 'test' },
        24 * 60 * 60 * 1000 // 24 hours
      );
    });

    it('should cache market data with correct TTL and key', async () => {
      const result = await service.cacheMarketData('overview', fetchFunction);

      expect(result.cacheKey).toBe('student-analyst:market:overview');
      expect(mockMemoryCacheL1.set).toHaveBeenCalledWith(
        'student-analyst:market:overview',
        { data: 'test' },
        15 * 60 * 1000 // 15 minutes
      );
    });

    it('should cache analysis data with parameter hash', async () => {
      const parameters = { period: 30, metric: 'volatility' };
      const result = await service.cacheAnalysisData('risk', 'AAPL', parameters, fetchFunction);

      expect(result.cacheKey).toMatch(/^student-analyst:analysis:risk:AAPL:\w+$/);
    });

    it('should cache stock data with custom options', async () => {
      const customOptions = { ttl: 120 * 60 * 1000 }; // 2 hours
      
      await service.cacheStockData('GOOGL', '5m', fetchFunction, customOptions);

      expect(mockMemoryCacheL1.set).toHaveBeenCalledWith(
        'student-analyst:stock-data:GOOGL:5m',
        { data: 'test' },
        120 * 60 * 1000
      );
    });
  });

  describe('Storage Health and Monitoring', () => {
    it('should get storage health', async () => {
      const health = await service.getStorageHealth();

      expect(mockStorageMonitoring.getStorageHealth).toHaveBeenCalled();
      expect(health).toHaveProperty('localStorage');
      expect(health).toHaveProperty('sessionStorage');
      expect(health).toHaveProperty('indexedDB');
    });

    it('should initialize storage monitoring', async () => {
      await service.initializeStorageMonitoring();
      expect(mockStorageMonitoring.initialize).toHaveBeenCalled();
    });

    it('should force storage health check', async () => {
      await service.forceStorageHealthCheck();
      expect(mockStorageMonitoring.forceHealthCheck).toHaveBeenCalled();
    });
  });

  describe('Multi-Layer Statistics', () => {
    it('should get combined multi-layer statistics', async () => {
      const l1Stats = { hits: 10, misses: 5, memoryUsage: 1000 };
      const l2Stats = { hits: 8, misses: 3, totalStorageUsed: 2000 };
      const l3Stats = { hitCount: 5, missCount: 2, totalSize: 5000 };
      
      mockMemoryCacheL1.getStats.mockReturnValue(l1Stats);
      mockLocalStorageCacheL2.getStats.mockReturnValue(l2Stats);
      mockIndexedDBCacheL3.getStats.mockResolvedValue(l3Stats);

      const stats = await service.getMultiLayerStats();

      expect(stats).toHaveProperty('l1', l1Stats);
      expect(stats).toHaveProperty('l2', l2Stats);
      expect(stats).toHaveProperty('l3', l3Stats);
      expect(stats).toHaveProperty('storageHealth');
      expect(stats).toHaveProperty('combined');
      expect(stats.combined.totalHits).toBe(23); // 10 + 8 + 5
      expect(stats.combined.totalMisses).toBe(10); // 5 + 3 + 2
    });
  });

  describe('Cache Management Operations', () => {
    it('should clear all cache layers', async () => {
      await service.clearAll();

      expect(mockMemoryCacheL1.clear).toHaveBeenCalled();
      expect(mockLocalStorageCacheL2.clear).toHaveBeenCalled();
      expect(mockIndexedDBCacheL3.clear).toHaveBeenCalled();
    });

    it('should invalidate pattern across multiple layers', async () => {
      mockMemoryCacheL1.keys.mockReturnValue(['student-analyst:stock-data:AAPL', 'student-analyst:market:overview']);
      mockLocalStorageCacheL2.keys.mockReturnValue(['student-analyst:stock-data:GOOGL']);
      mockMemoryCacheL1.remove.mockReturnValue(true);

      const result = await service.invalidatePatternMultiLayer('stock-data');

      expect(result).toHaveProperty('l1Removed');
      expect(result).toHaveProperty('l2Removed');
      expect(result).toHaveProperty('l3Removed');
      expect(result).toHaveProperty('total');
    });
  });

  describe('Legacy Compatibility Methods', () => {
    it('should delegate getStats to L1 cache', () => {
      service.getStats();
      expect(mockMemoryCacheL1.getStats).toHaveBeenCalled();
    });

    it('should delegate getConfig to L1 cache', () => {
      service.getConfig();
      expect(mockMemoryCacheL1.getConfig).toHaveBeenCalled();
    });

    it('should delegate updateConfig to L1 cache', () => {
      const config = { maxSize: 500 };
      service.updateConfig(config);
      expect(mockMemoryCacheL1.updateConfig).toHaveBeenCalledWith(config);
    });

    it('should delegate clear to L1 cache', () => {
      service.clear();
      expect(mockMemoryCacheL1.clear).toHaveBeenCalled();
    });

    it('should check if key exists in L1 cache', () => {
      mockMemoryCacheL1.has.mockReturnValue(true);
      const result = service.has('test-key');
      
      expect(result).toBe(true);
      expect(mockMemoryCacheL1.has).toHaveBeenCalledWith('student-analyst:test-key');
    });

    it('should set data in L1 cache', () => {
      mockMemoryCacheL1.set.mockReturnValue(true);
      const result = service.set('test-key', 'test-data', 5000);
      
      expect(result).toBe(true);
      expect(mockMemoryCacheL1.set).toHaveBeenCalledWith('student-analyst:test-key', 'test-data', 5000);
    });

    it('should set data in L1 cache with default TTL', () => {
      mockMemoryCacheL1.set.mockReturnValue(true);
      const result = service.set('test-key', 'test-data');
      
      expect(result).toBe(true);
      expect(mockMemoryCacheL1.set).toHaveBeenCalledWith('student-analyst:test-key', 'test-data', 60 * 60 * 1000);
    });

    it('should remove data from L1 and L2 caches', () => {
      mockMemoryCacheL1.remove.mockReturnValue(true);
      const result = service.remove('test-key');
      
      expect(result).toBe(true);
      expect(mockLocalStorageCacheL2.delete).toHaveBeenCalledWith('student-analyst:test-key');
      expect(mockMemoryCacheL1.remove).toHaveBeenCalledWith('student-analyst:test-key');
    });
  });

  describe('Automatic Cleanup Integration', () => {
    it('should initialize automatic cleanup', async () => {
      mockAutomaticCleanup.initialize.mockResolvedValue(undefined);
      
      await service.initializeAutomaticCleanup();

      expect(mockAutomaticCleanup.initialize).toHaveBeenCalled();
    });

    it('should handle cleanup initialization errors', async () => {
      const error = new Error('Cleanup init failed');
      mockAutomaticCleanup.initialize.mockRejectedValue(error);
      
      await expect(service.initializeAutomaticCleanup()).rejects.toThrow('Cleanup init failed');
    });

    it('should get cleanup configuration', () => {
      const config = { interval: 10000 };
      mockAutomaticCleanup.getConfig.mockReturnValue(config);
      
      const result = service.getCleanupConfig();
      
      expect(mockAutomaticCleanup.getConfig).toHaveBeenCalled();
      expect(result).toBe(config);
    });

    it('should update cleanup configuration', () => {
      const config = { interval: 5000 };
      service.updateCleanupConfig(config);
      expect(mockAutomaticCleanup.updateConfig).toHaveBeenCalledWith(config);
    });

    it('should get cleanup history', () => {
      const history = [{ timestamp: Date.now(), cleaned: 10 }];
      mockAutomaticCleanup.getCleanupHistory.mockReturnValue(history);
      
      const result = service.getCleanupHistory();
      
      expect(mockAutomaticCleanup.getCleanupHistory).toHaveBeenCalled();
      expect(result).toBe(history);
    });

    it('should get current cleanup operations', () => {
      const operations = { running: true, progress: 50 };
      mockAutomaticCleanup.getCurrentOperations.mockReturnValue(operations);
      
      const result = service.getCurrentCleanupOperations();
      
      expect(mockAutomaticCleanup.getCurrentOperations).toHaveBeenCalled();
      expect(result).toBe(operations);
    });

    it('should force cleanup', async () => {
      mockAutomaticCleanup.forceCleanup.mockResolvedValue(true);
      
      const result = await service.forceCleanup('L1');

      expect(result).toBe(true);
      expect(mockAutomaticCleanup.forceCleanup).toHaveBeenCalledWith('L1');
    });

    it('should force cleanup without layer parameter', async () => {
      mockAutomaticCleanup.forceCleanup.mockResolvedValue(true);
      
      const result = await service.forceCleanup();

      expect(result).toBe(true);
      expect(mockAutomaticCleanup.forceCleanup).toHaveBeenCalledWith(undefined);
    });

    it('should track data access', () => {
      service.trackDataAccess('test-key', 'L2');
      expect(mockAutomaticCleanup.trackDataAccess).toHaveBeenCalledWith('test-key', 'L2');
    });

    it('should register cleanup progress listener', () => {
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      mockAutomaticCleanup.onProgress.mockReturnValue(unsubscribe);
      
      const result = service.onCleanupProgress(callback);
      
      expect(mockAutomaticCleanup.onProgress).toHaveBeenCalledWith(callback);
      expect(result).toBe(unsubscribe);
    });

    it('should register cleanup completion listener', () => {
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      mockAutomaticCleanup.onCompletion.mockReturnValue(unsubscribe);
      
      const result = service.onCleanupCompletion(callback);
      
      expect(mockAutomaticCleanup.onCompletion).toHaveBeenCalledWith(callback);
      expect(result).toBe(unsubscribe);
    });

    it('should shutdown cleanup', () => {
      service.shutdownCleanup();
      expect(mockAutomaticCleanup.shutdown).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('should calculate correct L2 TTL based on L1 TTL', () => {
      const getL2TTL = (service as any).getL2TTL.bind(service);
      
      expect(getL2TTL(10 * 60 * 1000)).toBe(50 * 60 * 1000); // 5x for ≤15 min
      expect(getL2TTL(30 * 60 * 1000)).toBe(24 * 60 * 60 * 1000); // 24 hours for ≤1 hour
      expect(getL2TTL(2 * 60 * 60 * 1000)).toBe(7 * 24 * 60 * 60 * 1000); // 7 days for >1 hour
    });

    it('should return correct L3 TTL', () => {
      const getL3TTL = (service as any).getL3TTL.bind(service);
      expect(getL3TTL(100)).toBe(7 * 24 * 60 * 60 * 1000); // Always 7 days
    });

    it('should determine correct data type from cache key', () => {
      const getDataType = (service as any).getDataType.bind(service);
      
      expect(getDataType('student-analyst:stock-data:AAPL')).toBe('stock');
      expect(getDataType('student-analyst:fundamentals:AAPL')).toBe('fundamentals');
      expect(getDataType('student-analyst:market:overview')).toBe('market');
      expect(getDataType('student-analyst:analysis:risk')).toBe('analysis');
      expect(getDataType('student-analyst:other:data')).toBe('general');
    });

    it('should hash parameters correctly', () => {
      const hashParameters = (service as any).hashParameters.bind(service);
      
      const params1 = { b: 2, a: 1 };
      const params2 = { a: 1, b: 2 };
      
      expect(hashParameters(params1)).toBe(hashParameters(params2));
    });

    it('should handle hash parameters errors', () => {
      const hashParameters = (service as any).hashParameters.bind(service);
      
      // Create circular reference
      const circular: any = { a: 1 };
      circular.self = circular;
      
      expect(hashParameters(circular)).toBe('hash-error');
    });

    it('should sort object keys recursively', () => {
      const sortObjectKeys = (service as any).sortObjectKeys.bind(service);
      
      const obj = { b: { d: 4, c: 3 }, a: [{ z: 26, y: 25 }] };
      const sorted = sortObjectKeys(obj);
      
      expect(Object.keys(sorted as any)).toEqual(['a', 'b']);
      expect(Object.keys((sorted as any).b)).toEqual(['c', 'd']);
    });

    it('should handle non-object values in sortObjectKeys', () => {
      const sortObjectKeys = (service as any).sortObjectKeys.bind(service);
      
      expect(sortObjectKeys(null)).toBe(null);
      expect(sortObjectKeys('string')).toBe('string');
      expect(sortObjectKeys(123)).toBe(123);
    });

    it('should generate simple hash for strings', () => {
      const simpleHash = (service as any).simpleHash.bind(service);
      
      const hash1 = simpleHash('test');
      const hash2 = simpleHash('test');
      const hash3 = simpleHash('different');
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(simpleHash('')).toBe('0');
    });

    it('should test stale data recovery', async () => {
      const getStaleData = (service as any).getStaleData.bind(service);
      const staleData = { message: 'stale' };
      
      mockLocalStorageCacheL2.get.mockReturnValue(staleData);
      
      const result = await getStaleData('test-key');
      
      expect(result).toEqual(staleData);
      expect(mockLocalStorageCacheL2.get).toHaveBeenCalledWith('test-key');
    });

    it('should test stale data from L3 when L2 empty', async () => {
      const getStaleData = (service as any).getStaleData.bind(service);
      const staleData = { message: 'stale from L3' };
      
      mockLocalStorageCacheL2.get.mockReturnValue(null);
      mockIndexedDBCacheL3.get.mockResolvedValue(staleData);
      
      const result = await getStaleData('test-key');
      
      expect(result).toEqual(staleData);
      expect(mockIndexedDBCacheL3.get).toHaveBeenCalledWith('test-key');
    });

    it('should handle stale data errors gracefully', async () => {
      const getStaleData = (service as any).getStaleData.bind(service);
      
      mockLocalStorageCacheL2.get.mockImplementation(() => {
        throw new Error('L2 error');
      });
      
      const result = await getStaleData('test-key');
      
      expect(result).toBe(null);
    });
  });

  describe('Private Helper Methods', () => {
    it('should calculate L2 TTL based on L1 TTL', () => {
      const getL2TTL = (service as any).getL2TTL.bind(service);
      
      // For L1 TTL <= 15 minutes, L2 TTL should be 5x L1 TTL
      const shortTTL = 10 * 60 * 1000; // 10 minutes
      expect(getL2TTL(shortTTL)).toBe(shortTTL * 5);
      
      // For L1 TTL <= 1 hour, L2 TTL should be 24 hours
      const mediumTTL = 30 * 60 * 1000; // 30 minutes
      expect(getL2TTL(mediumTTL)).toBe(24 * 60 * 60 * 1000);
      
      // For L1 TTL > 1 hour, L2 TTL should be 7 days
      const longTTL = 2 * 60 * 60 * 1000; // 2 hours
      expect(getL2TTL(longTTL)).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should calculate L3 TTL as fixed 7 days', () => {
      const getL3TTL = (service as any).getL3TTL.bind(service);
      const l1TTL = 60 * 60 * 1000; // 1 hour
      const l3TTL = getL3TTL(l1TTL);
      
      expect(l3TTL).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
    });

    it('should identify data type from cache key - stock data', () => {
      const getDataType = (service as any).getDataType.bind(service);
      
      expect(getDataType('stock-data:AAPL:1D')).toBe('stock');
      expect(getDataType('fundamentals:MSFT:overview')).toBe('fundamentals');
      expect(getDataType('market:overview')).toBe('market');
      expect(getDataType('analysis:momentum:TSLA:abc123')).toBe('analysis');
      expect(getDataType('unknown:key')).toBe('general');
    });

    it('should hash parameters correctly for consistent cache keys', () => {
      const hashParameters = (service as any).hashParameters.bind(service);
      const params = { symbol: 'AAPL', period: '1y', type: 'price' };
      
      const hash1 = hashParameters(params);
      const hash2 = hashParameters(params);
      const hash3 = hashParameters({ period: '1y', symbol: 'AAPL', type: 'price' }); // Different order
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBe(hash3); // Should be same due to key sorting
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should sort object keys recursively', () => {
      const sortObjectKeys = (service as any).sortObjectKeys.bind(service);
      const complexObj = {
        b: 2,
        a: {
          z: 1,
          x: { c: 3, a: 1 }
        }
      };
      
      const sorted = sortObjectKeys(complexObj);
      const keys = Object.keys(sorted);
      
      expect(keys).toEqual(['a', 'b']);
      expect(Object.keys((sorted as any).a)).toEqual(['x', 'z']);
      expect(Object.keys((sorted as any).a.x)).toEqual(['a', 'c']);
    });

    it('should generate simple hash from string', () => {
      const simpleHash = (service as any).simpleHash.bind(service);
      
      const hash1 = simpleHash('test string');
      const hash2 = simpleHash('test string');
      const hash3 = simpleHash('different string');
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(typeof hash1).toBe('string');
    });

    it('should invalidate cache entries by pattern', () => {
      const invalidateByPattern = (service as any).invalidateByPattern.bind(service);
      
      mockMemoryCacheL1.keys.mockReturnValue([
        'student-analyst:stock-data:AAPL:1D',
        'student-analyst:stock-data:MSFT:1H',
        'student-analyst:fundamentals:AAPL:overview',
        'student-analyst:market:overview'
      ]);
      mockMemoryCacheL1.remove.mockReturnValue(true);
      
      const removed = invalidateByPattern('stock-data.*');
      
      expect(removed).toBe(2);
      expect(mockMemoryCacheL1.remove).toHaveBeenCalledWith('student-analyst:stock-data:AAPL:1D');
      expect(mockMemoryCacheL1.remove).toHaveBeenCalledWith('student-analyst:stock-data:MSFT:1H');
    });
  });

  describe('Additional Edge Cases and Error Handling', () => {
    it('should handle cache key generation with all options', () => {
      const generateCacheKey = (service as any).generateCacheKey.bind(service);
      
      const key = generateCacheKey('test-key', {
        prefix: 'custom-prefix',
        includeTimestamp: true,
        includeParams: true,
        customSuffix: 'custom-suffix'
      });
      
      expect(key).toMatch(/^custom-prefix:test-key:\d+:custom-suffix$/);
    });

    it('should handle invalidatePatternMultiLayer with L3 limitations', async () => {
      mockMemoryCacheL1.keys.mockReturnValue(['test-key-1', 'test-key-2']);
      mockLocalStorageCacheL2.keys.mockReturnValue(['test-key-1', 'different-key']);
      mockMemoryCacheL1.remove.mockReturnValue(true);
      mockLocalStorageCacheL2.delete.mockReturnValue(true);
      
      const result = await service.invalidatePatternMultiLayer('test-key.*');
      
      expect(result).toEqual({
        l1Removed: 2,
        l2Removed: 1,
        l3Removed: 0, // L3 implementation limitation
        total: 3
      });
    });

    it('should handle complex parameter hashing with nested objects', () => {
      const hashParameters = (service as any).hashParameters.bind(service);
      
      const complexParams = {
        config: {
          nested: {
            value: 'test',
            number: 42
          },
          array: [1, 2, { key: 'value' }]
        },
        simple: 'string'
      };
      
      const hash = hashParameters(complexParams);
      
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle cache key generation with timestamp', () => {
      const generateCacheKey = (service as any).generateCacheKey.bind(service);
      
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 123456789) as jest.MockedFunction<typeof Date.now>;
      
      const key = generateCacheKey('test', { includeTimestamp: true });
      
      expect(key).toBe('student-analyst:test:123456789');
      
      Date.now = originalDateNow;
    });

    it('should handle multiple consecutive cache misses and hits', async () => {
      const testKey = 'multi-test-key';
      const testData = { value: 'test' };
      const fetchFunction = jest.fn<() => Promise<{ value: string }>>().mockResolvedValue(testData);

      // First call - all cache miss, should fetch
      mockMemoryCacheL1.get.mockReturnValue(null);
      mockLocalStorageCacheL2.get.mockReturnValue(null);
      mockIndexedDBCacheL3.get.mockResolvedValue(null);

      const result1 = await service.get(testKey, fetchFunction);
      expect(result1.fromCache).toBe(false);
      expect(fetchFunction).toHaveBeenCalledTimes(1);

      // Second call - L1 hit
      mockMemoryCacheL1.get.mockReturnValue(testData);
      
      const result2 = await service.get(testKey, fetchFunction);
      expect(result2.fromCache).toBe(true);
      expect(fetchFunction).toHaveBeenCalledTimes(1); // Should not fetch again
    });
  });

  describe('Singleton Instance', () => {
    it('should export singleton instance correctly', () => {
      expect(cacheService).toBeInstanceOf(CacheService);
      expect(cacheService).toBeDefined();
    });
  });
});