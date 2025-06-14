/**
 * STUDENT ANALYST - Local Storage Cache L2 Service
 * Local storage cache with LRU eviction and performance tracking
 */

import { ICacheConfiguration, IL2CacheStats, ILocalStorageCacheL2 } from './interfaces/ICache';

export interface L2CacheStats extends IL2CacheStats {
  errorCount: number;
  lastError: string | null;
  recoveryCount: number;
}

export interface L2CacheConfiguration extends ICacheConfiguration {}

export class LocalStorageCacheL2 implements ILocalStorageCacheL2 {
  private readonly OPERATION_TIMEOUT = 5000; // Increased to 5 seconds
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private readonly PREFIX = 'l2_cache_';
  private stats: L2CacheStats;
  private config: L2CacheConfiguration;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private operationQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor() {
    this.config = this.initializeConfig();
    this.stats = this.initializeStats();
    this.startCleanupTimer();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.operationQueue.length === 0) return;

    this.isProcessingQueue = true;
    try {
      while (this.operationQueue.length > 0) {
        const operation = this.operationQueue.shift();
        if (operation) {
          await operation();
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async queueOperation<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.operationQueue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private initializeConfig(): ICacheConfiguration {
    return {
      maxEntries: 1000,
      maxMemoryUsage: 5 * 1024 * 1024, // 5MB
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      enableCompression: false,
      compressionThreshold: 0,
      evictionPolicy: 'lru'
    };
  }

  private initializeStats(): L2CacheStats {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      memoryUsage: 0,
      currentEntries: 0,
      maxEntries: this.config.maxEntries,
      lastCleanup: Date.now(),
      lastAccess: Date.now(),
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      writeCount: 0,
      deleteCount: 0,
      compressionRatio: 1,
      averageQueryTime: 0,
      averageWriteTime: 0,
      averageDeleteTime: 0,
      errorCount: 0,
      lastError: null,
      recoveryCount: 0
    };
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(error => {
        console.error('Cleanup error:', error);
        this.stats.errorCount++;
        this.stats.lastError = error.message;
      });
    }, this.CLEANUP_INTERVAL);
  }

  private updateStats(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private updateQueryTime(time: number): void {
    this.stats.averageQueryTime = (this.stats.averageQueryTime * this.stats.hits + time) / (this.stats.hits + 1);
  }

  private updateWriteTime(time: number): void {
    this.stats.averageWriteTime = (this.stats.averageWriteTime * this.stats.writeCount + time) / (this.stats.writeCount + 1);
  }

  private updateDeleteTime(time: number): void {
    this.stats.averageDeleteTime = (this.stats.averageDeleteTime * this.stats.deleteCount + time) / (this.stats.deleteCount + 1);
  }

  private calculateSize(value: any): number {
    try {
      const str = JSON.stringify(value);
      return new Blob([str]).size;
    } catch (error) {
      console.error('Error calculating size:', error);
      return 0;
    }
  }

  private async shouldEvict(requiredSpace: number): Promise<boolean> {
    return this.stats.totalSize + requiredSpace > this.config.maxMemoryUsage ||
           this.stats.currentEntries >= this.config.maxEntries;
  }

  private async evict(requiredSpace: number): Promise<void> {
    if (await this.shouldEvict(requiredSpace)) {
      await this.evictLRU(requiredSpace);
    }
  }

  private async evictLRU(requiredSpace: number): Promise<void> {
    const entries = Object.entries(localStorage)
      .filter(([key]) => key.startsWith(this.PREFIX))
      .map(([key, value]) => {
        try {
          const entry = JSON.parse(value);
          return {
            key,
            value: entry.value,
            lastAccessed: entry.lastAccessed,
            size: this.calculateSize(entry.value)
          };
        } catch {
          return null;
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    let totalEvicted = 0;
    let entriesEvicted = 0;

    for (const entry of entries) {
      if (this.stats.totalSize + requiredSpace > this.config.maxMemoryUsage ||
          this.stats.currentEntries >= this.config.maxEntries) {
        localStorage.removeItem(entry.key);
        totalEvicted += entry.size;
        entriesEvicted++;
        this.stats.totalSize -= entry.size;
        this.stats.currentEntries--;
      } else {
        break;
      }
    }

    if (entriesEvicted > 0) {
      console.log(`Evicted ${entriesEvicted} entries, freed ${totalEvicted} bytes`);
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.cleanup();
      this.stats.lastAccess = Date.now();
      this.stats.recoveryCount++;
    } catch (error) {
      console.error('Error initializing cache:', error);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    const entries = Object.entries(localStorage)
      .filter(([key]) => key.startsWith(this.PREFIX))
      .map(([key, value]) => {
        try {
          const entry = JSON.parse(value);
          return {
            key,
            value: entry.value,
            expiry: entry.expiry,
            size: this.calculateSize(entry.value)
          };
        } catch {
          return null;
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    let cleanedEntries = 0;
    let cleanedSize = 0;

    for (const entry of entries) {
      if (entry.expiry < Date.now()) {
        localStorage.removeItem(entry.key);
        cleanedEntries++;
        cleanedSize += entry.size;
        this.stats.totalSize -= entry.size;
        this.stats.currentEntries--;
      }
    }

    if (cleanedEntries > 0) {
      console.log(`Cleaned ${cleanedEntries} expired entries, freed ${cleanedSize} bytes`);
    }

    this.stats.lastCleanup = Date.now();
    this.updateStats();
  }

  get<T>(key: string): T | null {
    const startTime = performance.now();
    try {
      const prefixedKey = this.PREFIX + key;
      const value = localStorage.getItem(prefixedKey);

      if (!value) {
        this.stats.misses++;
        this.stats.missCount++;
        this.updateStats();
        return null;
      }

      const entry = JSON.parse(value);
      if (entry.expiry < Date.now()) {
        localStorage.removeItem(prefixedKey);
        this.stats.misses++;
        this.stats.missCount++;
        this.updateStats();
        return null;
      }

      entry.lastAccessed = Date.now();
      localStorage.setItem(prefixedKey, JSON.stringify(entry));

      this.stats.hits++;
      this.stats.hitCount++;
      this.stats.lastAccess = Date.now();

      const queryTime = performance.now() - startTime;
      this.updateQueryTime(queryTime);
      this.updateStats();

      return entry.value as T;
    } catch (error) {
      console.error('Error getting value from cache:', error);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.updateStats();
      return null;
    }
  }

  set<T>(key: string, value: T, ttl?: number, dataType?: string): boolean {
    const startTime = performance.now();
    try {
      const prefixedKey = this.PREFIX + key;
      const size = this.calculateSize(value);
      const expiry = Date.now() + (ttl || this.config.defaultTTL);

      if (this.stats.totalSize + size > this.config.maxMemoryUsage ||
          this.stats.currentEntries >= this.config.maxEntries) {
        this.evict(size).catch(error => {
          console.error('Error during eviction:', error);
          this.stats.errorCount++;
          this.stats.lastError = error.message;
        });
      }

      const entry = {
        value,
        expiry,
        lastAccessed: Date.now(),
        size,
        dataType
      };

      localStorage.setItem(prefixedKey, JSON.stringify(entry));

      this.stats.totalSize += size;
      this.stats.currentEntries++;
      this.stats.writeCount++;
      this.stats.lastAccess = Date.now();

      const writeTime = performance.now() - startTime;
      this.updateWriteTime(writeTime);
      this.updateStats();

      return true;
    } catch (error) {
      console.error('Error setting value in cache:', error);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  delete(key: string): boolean {
    const startTime = performance.now();
    try {
      const prefixedKey = this.PREFIX + key;
      const value = localStorage.getItem(prefixedKey);

      if (!value) {
        return false;
      }

      const entry = JSON.parse(value);
      localStorage.removeItem(prefixedKey);

      this.stats.totalSize -= this.calculateSize(entry.value);
      this.stats.currentEntries--;
      this.stats.deleteCount++;
      this.stats.lastAccess = Date.now();

      const deleteTime = performance.now() - startTime;
      this.updateDeleteTime(deleteTime);
      this.updateStats();

      return true;
    } catch (error) {
      console.error('Error deleting value from cache:', error);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.PREFIX))
        .forEach(key => localStorage.removeItem(key));

      this.stats = this.initializeStats();
      this.stats.lastAccess = Date.now();
    } catch (error) {
      console.error('Error clearing cache:', error);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  has(key: string): boolean {
    try {
      const prefixedKey = this.PREFIX + key;
      const value = localStorage.getItem(prefixedKey);

      if (!value) {
        return false;
      }

      const entry = JSON.parse(value);
      if (entry.expiry < Date.now()) {
        localStorage.removeItem(prefixedKey);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking key in cache:', error);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  getStats(): L2CacheStats {
    return { ...this.stats };
  }

  getConfig(): L2CacheConfiguration {
    return { ...this.config };
  }

  updateConfig(config: Partial<L2CacheConfiguration>): void {
    this.config = { ...this.config, ...config };
    if (config.cleanupInterval) {
      this.startCleanupTimer();
    }
  }
}

export const localStorageCacheL2 = new LocalStorageCacheL2(); 
