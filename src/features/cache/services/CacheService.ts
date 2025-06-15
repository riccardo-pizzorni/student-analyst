/**
 * STUDENT ANALYST - Cache Service
 * Transparent caching layer for API services with Memory Cache L1 + LocalStorage L2 + IndexedDB L3 integration
 */

import { automaticCleanup } from '../../../services/AutomaticCleanupService';
import { cacheAnalytics } from '../../../services/CacheAnalyticsEngine';
import { cacheQualityService } from '../../../services/CacheQualityService';
import { storageMonitoring } from '../../../services/StorageMonitoringService';
import { indexedDBCacheL3, L3CacheStats } from './IndexedDBCacheL3';
import { L2CacheStats, localStorageCacheL2 } from './LocalStorageCacheL2';
import { CacheConfiguration, CacheStats, memoryCacheL1 } from './MemoryCacheL1';
import type { StorageHealth } from './StorageMonitoringService';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  forceRefresh?: boolean; // Skip cache and force API call
  enableCache?: boolean; // Enable/disable caching for this request
}

export interface CachedResponse<T> {
  data: T;
  fromCache: boolean;
  timestamp: number;
  cacheKey: string;
  ttl: number;
}

export interface CacheKeyOptions {
  prefix?: string;
  includeTimestamp?: boolean;
  includeParams?: boolean;
  customSuffix?: string;
}

class CacheService {
  private defaultTTL = 60 * 60 * 1000; // 1 hour default
  private keyPrefix = 'student-analyst';

  /**
   * Get data with three-layer caching support (L1+L2+L3)
   */
  async get<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CachedResponse<T>> {
    const {
      ttl = this.defaultTTL,
      forceRefresh = false,
      enableCache = true
    } = options;

    const cacheKey = this.generateCacheKey(key);

    // Check cache first (if enabled and not forcing refresh)
    if (enableCache && !forceRefresh) {
      // Layer 1: Memory Cache (fastest - <1ms)
      const startTime = performance.now();
      const l1Data = memoryCacheL1.get(cacheKey);
      if (l1Data !== null) {
        const responseTime = performance.now() - startTime;
        
        // Track analytics
        cacheAnalytics.trackCacheHit(cacheKey);
        
        // Check data quality
        cacheQualityService.checkDataQuality(cacheKey, l1Data).catch(error => {
          console.warn('Quality check failed for L1 data:', error);
        });
        
        return {
          data: l1Data,
          fromCache: true,
          timestamp: Date.now(),
          cacheKey,
          ttl
        };
      }

      // Layer 2: LocalStorage Cache (fast - <10ms)
      const l2Data = localStorageCacheL2.get(cacheKey) as T | null;
      if (l2Data !== null) {
        // Promote to L1 cache for faster future access
        memoryCacheL1.set(cacheKey, l2Data, ttl);
        // Remove from L2
        localStorageCacheL2.delete(cacheKey);
        return {
          data: l2Data,
          fromCache: true,
          timestamp: Date.now(),
          cacheKey,
          ttl
        };
      }

      // Layer 3: IndexedDB Cache (very fast - <50ms)
      const l3Data = await indexedDBCacheL3.get(cacheKey) as T | null;
      if (l3Data !== null) {
        // Promote to L2 and L1 caches for faster future access
        const l2TTL = this.getL2TTL(ttl);
        localStorageCacheL2.set(cacheKey, l3Data, l2TTL, this.getDataType(cacheKey));
        memoryCacheL1.set(cacheKey, l3Data, ttl);
        return {
          data: l3Data,
          fromCache: true,
          timestamp: Date.now(),
          cacheKey,
          ttl
        };
      }
    }

    // Fetch from API
    try {
      const data = await fetchFunction();
      
      // Cache the result in all three layers (if caching is enabled)
      if (enableCache) {
        memoryCacheL1.set(cacheKey, data, ttl);
        // Store in L2 with longer TTL for historical data
        const l2TTL = this.getL2TTL(ttl);
        localStorageCacheL2.set(cacheKey, data, l2TTL, this.getDataType(cacheKey));
        // Store in L3 with even longer TTL for long-term historical data
        const l3TTL = this.getL3TTL(ttl);
        await indexedDBCacheL3.set(cacheKey, data, l3TTL);
      }

      return {
        data,
        fromCache: false,
        timestamp: Date.now(),
        cacheKey,
        ttl
      };
    } catch (error) {
      // On error, try to return stale data from cache if available
      if (enableCache) {
        const staleData = await this.getStaleData<T>(cacheKey);
        if (staleData !== null) {
          console.warn(`API error, returning stale data for ${cacheKey}:`, error);
          return {
            data: staleData,
            fromCache: true,
            timestamp: Date.now(),
            cacheKey,
            ttl: 0 // Indicate stale data
          };
        }
      }
      
      throw error;
    }
  }

  /**
   * Cache stock price data
   */
  async cacheStockData<T>(
    symbol: string,
    interval: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CachedResponse<T>> {
    const key = `stock-data:${symbol}:${interval}`;
    const stockOptions = {
      ttl: 60 * 60 * 1000, // 1 hour for stock data
      ...options
    };

    return this.get(key, fetchFunction, stockOptions);
  }

  /**
   * Cache company fundamentals data
   */
  async cacheFundamentalsData<T>(
    symbol: string,
    dataType: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CachedResponse<T>> {
    const key = `fundamentals:${symbol}:${dataType}`;
    const fundamentalsOptions = {
      ttl: 24 * 60 * 60 * 1000, // 24 hours for fundamentals
      ...options
    };

    return this.get(key, fetchFunction, fundamentalsOptions);
  }

  /**
   * Cache market overview data
   */
  async cacheMarketData<T>(
    dataType: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CachedResponse<T>> {
    const key = `market:${dataType}`;
    const marketOptions = {
      ttl: 15 * 60 * 1000, // 15 minutes for market data
      ...options
    };

    return this.get(key, fetchFunction, marketOptions);
  }

  /**
   * Cache analysis results
   */
  async cacheAnalysisData<T>(
    analysisType: string,
    symbol: string,
    parameters: Record<string, unknown>,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CachedResponse<T>> {
    const paramHash = this.hashParameters(parameters);
    const key = `analysis:${analysisType}:${symbol}:${paramHash}`;
    const analysisOptions = {
      ttl: 30 * 60 * 1000, // 30 minutes for analysis
      ...options
    };

    return this.get(key, fetchFunction, analysisOptions);
  }

  /**
   * Get storage health information
   */
  async getStorageHealth(): Promise<StorageHealth> {
    return storageMonitoring.getStorageHealth();
  }

  /**
   * Initialize storage monitoring
   */
  async initializeStorageMonitoring(): Promise<void> {
    await storageMonitoring.initialize();
  }

  /**
   * Force storage health check
   */
  async forceStorageHealthCheck(): Promise<StorageHealth> {
    return await storageMonitoring.forceHealthCheck();
  }

  /**
   * Get combined L1 + L2 + L3 statistics with storage health
   */
  async getMultiLayerStats(): Promise<{
    l1: CacheStats;
    l2: L2CacheStats;
    l3: L3CacheStats;
    storageHealth: StorageHealth;
    combined: {
      totalHits: number;
      totalMisses: number;
      overallHitRate: number;
      totalMemoryUsed: number;
      totalStorageUsed: number;
      totalDatabaseSize: number;
    };
  }> {
    const l1Stats = memoryCacheL1.getStats();
    const l2Stats = localStorageCacheL2.getStats();
    const l3Stats = await indexedDBCacheL3.getStats();
    const storageHealth = storageMonitoring.getStorageHealth();

    return {
      l1: l1Stats,
      l2: l2Stats,
      l3: l3Stats,
      storageHealth,
      combined: {
        totalHits: l1Stats.hits + l2Stats.hits + l3Stats.hitCount,
        totalMisses: l1Stats.misses + l2Stats.misses + l3Stats.missCount,
        overallHitRate: ((l1Stats.hits + l2Stats.hits + l3Stats.hitCount) / Math.max(1, l1Stats.hits + l2Stats.hits + l3Stats.hitCount + l1Stats.misses + l2Stats.misses + l3Stats.missCount)) * 100,
        totalMemoryUsed: l1Stats.memoryUsage,
        totalStorageUsed: l2Stats.totalStorageUsed,
        totalDatabaseSize: l3Stats.totalSize
      }
    };
  }

  /**
   * Clear all three cache layers (L1, L2, L3)
   */
  async clearAll(): Promise<void> {
    memoryCacheL1.clear();
    localStorageCacheL2.clear();
    await indexedDBCacheL3.clear();
  }

  /**
   * Invalidate pattern in all three cache layers
   */
  async invalidatePatternMultiLayer(pattern: string): Promise<{ l1Removed: number; l2Removed: number; l3Removed: number; total: number }> {
    const l1Removed = this.invalidateByPattern(pattern);
    
    // Invalidate L2 cache
    const l2Keys = localStorageCacheL2.keys();
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let l2Removed = 0;

    for (const key of l2Keys) {
      if (regex.test(key)) {
        localStorageCacheL2.delete(key);
        l2Removed++;
      }
    }

         // L3 invalidation would require more complex implementation
     const l3Removed = 0;

    return {
      l1Removed,
      l2Removed,
      l3Removed,
      total: l1Removed + l2Removed + l3Removed
    };
  }

  // Private helper methods
  private async getStaleData<T>(cacheKey: string): Promise<T | null> {
    try {
      const l2Data = localStorageCacheL2.get(cacheKey) as T | null;
      if (l2Data !== null) return l2Data;
      
      return await indexedDBCacheL3.get(cacheKey) as T | null;
    } catch {
      return null;
    }
  }

  private getL2TTL(l1TTL: number): number {
    // L2 TTL is 5x L1 TTL for data up to 15 minutes
    if (l1TTL <= 15 * 60 * 1000) {
      return 5 * l1TTL;
    }
    // L2 TTL is 24 hours for data up to 1 hour
    if (l1TTL <= 60 * 60 * 1000) {
      return 24 * 60 * 60 * 1000;
    }
    // L2 TTL is 7 days for data over 1 hour
    return 7 * 24 * 60 * 60 * 1000;
  }

     private getL3TTL(_l1TTL: number): number {
     return 7 * 24 * 60 * 60 * 1000; // Always 7 days for L3
   }

  private getDataType(cacheKey: string): string {
    if (cacheKey.includes('stock-data')) return 'stock';
    if (cacheKey.includes('fundamentals')) return 'fundamentals';
    if (cacheKey.includes('market')) return 'market';
    if (cacheKey.includes('analysis')) return 'analysis';
    return 'general';
  }

  private invalidateByPattern(pattern: string): number {
    const keys = memoryCacheL1.keys();
    let removedCount = 0;

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of keys) {
      if (regex.test(key)) {
        if (memoryCacheL1.remove(key)) {
          removedCount++;
        }
      }
    }

    return removedCount;
  }

     private generateCacheKey(key: string, options: CacheKeyOptions = {}): string {
     const {
       prefix = this.keyPrefix,
       includeTimestamp = false,
       customSuffix = ''
     } = options;

    let cacheKey = `${prefix}:${key}`;

    if (includeTimestamp) {
      cacheKey += `:${Date.now()}`;
    }

    if (customSuffix) {
      cacheKey += `:${customSuffix}`;
    }

    return cacheKey;
  }

     private hashParameters(params: Record<string, unknown>): string {
     try {
       const sortedParams = this.sortObjectKeys(params);
       const paramString = JSON.stringify(sortedParams);
       return this.simpleHash(paramString);
     } catch {
       return 'hash-error';
     }
   }

     private sortObjectKeys(obj: unknown): unknown {
     if (typeof obj !== 'object' || obj === null) {
       return obj;
     }

     if (Array.isArray(obj)) {
       return obj.map(this.sortObjectKeys.bind(this));
     }

     const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
     const sortedObj: Record<string, unknown> = {};

     for (const key of sortedKeys) {
       sortedObj[key] = this.sortObjectKeys((obj as Record<string, unknown>)[key]);
     }

     return sortedObj;
   }

  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // Legacy methods for compatibility
  getStats(): CacheStats {
    return memoryCacheL1.getStats();
  }

  getConfig(): CacheConfiguration {
    return memoryCacheL1.getConfig();
  }

  updateConfig(config: Partial<CacheConfiguration>): void {
    memoryCacheL1.updateConfig(config);
  }

  clear(): void {
    memoryCacheL1.clear();
    localStorageCacheL2.clear();
    indexedDBCacheL3.clear();
  }

  async has(key: string): Promise<boolean> {
    const cacheKey = this.generateCacheKey(key);
    return memoryCacheL1.has(cacheKey) || 
           localStorageCacheL2.has(cacheKey) || 
           await indexedDBCacheL3.has(cacheKey);
  }

  set<T>(key: string, data: T, ttl?: number): boolean {
    const cacheKey = this.generateCacheKey(key);
    const success = memoryCacheL1.set(cacheKey, data, ttl);
    if (success) {
      const l2TTL = this.getL2TTL(ttl || this.defaultTTL);
      localStorageCacheL2.set(cacheKey, data, l2TTL, this.getDataType(cacheKey));
      indexedDBCacheL3.set(cacheKey, data, this.getL3TTL(ttl || this.defaultTTL));
    }
    return success;
  }

  remove(key: string): boolean {
    const cacheKey = this.generateCacheKey(key);
    const l1Removed = memoryCacheL1.remove(cacheKey);
    localStorageCacheL2.delete(cacheKey);
    indexedDBCacheL3.delete(cacheKey);
    return l1Removed;
  }

  /**
   * Initialize automatic cleanup system
   */
  async initializeAutomaticCleanup(): Promise<void> {
    try {
      await automaticCleanup.initialize();
      console.log('✅ Automatic cleanup system initialized');
    } catch (error) {
      console.error('❌ Error initializing automatic cleanup:', error);
      throw error;
    }
  }

  /**
   * Get automatic cleanup configuration
   */
  getCleanupConfig() {
    return automaticCleanup.getConfig();
  }

  /**
   * Update automatic cleanup configuration
   */
  updateCleanupConfig(config: Parameters<typeof automaticCleanup.updateConfig>[0]) {
    automaticCleanup.updateConfig(config);
  }

  /**
   * Get cleanup history
   */
  getCleanupHistory() {
    return automaticCleanup.getCleanupHistory();
  }

  /**
   * Get current cleanup operations
   */
  getCurrentCleanupOperations() {
    return automaticCleanup.getCurrentOperations();
  }

  /**
   * Force manual cleanup
   */
  async forceCleanup(layer?: 'L1' | 'L2' | 'L3'): Promise<boolean> {
    return automaticCleanup.forceCleanup(layer);
  }

  /**
   * Track data access for LRU algorithm
   */
  trackDataAccess(key: string, layer: 'L1' | 'L2' | 'L3'): void {
    automaticCleanup.trackDataAccess(key, layer);
  }

  /**
   * Register cleanup progress listener
   */
  onCleanupProgress(callback: Parameters<typeof automaticCleanup.onProgress>[0]) {
    return automaticCleanup.onProgress(callback);
  }

  /**
   * Register cleanup completion listener
   */
  onCleanupCompletion(callback: Parameters<typeof automaticCleanup.onCompletion>[0]) {
    return automaticCleanup.onCompletion(callback);
  }

  /**
   * Shutdown cleanup system
   */
  shutdownCleanup(): void {
    automaticCleanup.shutdown();
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export class for custom instances
export default CacheService; 
