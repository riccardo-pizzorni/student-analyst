/**
 * STUDENT ANALYST - Memory Cache L1 Service
 * In-memory cache with LRU eviction and performance tracking
 */

import { ICacheConfiguration, IL1CacheStats, IMemoryCacheL1 } from './interfaces/ICache';

export interface CacheEntry<T> {
  value: T;
  expiry: number;
  lastAccessed: number;
  size: number;
  accessCount: number;
}

export interface CacheStats extends IL1CacheStats {
  errorCount: number;
  lastError: string | null;
  recoveryCount: number;
  operationTimeouts: number;
  evictionCount: number;
  totalEvictedSize: number;
  averageAccessCount: number;
  memoryPressureLevel: number;
}

export class MemoryCacheL1 implements IMemoryCacheL1 {
  private readonly OPERATION_TIMEOUT = 1000; // 1 second timeout
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private readonly MEMORY_PRESSURE_THRESHOLD = 0.8; // 80% memory usage threshold
  private cache: Map<string, CacheEntry<unknown>>;
  private stats: CacheStats;
  private config: ICacheConfiguration;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private operationTimeout: NodeJS.Timeout | null = null;
  private isEvicting: boolean = false;

  constructor() {
    this.config = this.initializeConfig();
    this.stats = this.initializeStats();
    this.cache = new Map();
    this.startCleanupTimer();
  }

  private initializeConfig(): ICacheConfiguration {
    return {
      maxEntries: 1000,
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      enableCompression: false,
      compressionThreshold: 0,
      evictionPolicy: 'lru'
    };
  }

  private initializeStats(): CacheStats {
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
      recoveryCount: 0,
      operationTimeouts: 0,
      evictionCount: 0,
      totalEvictedSize: 0,
      averageAccessCount: 0,
      memoryPressureLevel: 0
    };
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(error => {
        this.stats.errorCount++;
        this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      });
    }, this.CLEANUP_INTERVAL);
  }

  public async cleanup(): Promise<void> {
    if (this.isEvicting) {
      return;
    }

    const now = Date.now();
    const timeoutId = setTimeout(() => {
      this.stats.operationTimeouts++;
      this.stats.lastError = 'Cleanup operation timed out';
    }, this.OPERATION_TIMEOUT);

    try {
      this.isEvicting = true;
      let cleanedEntries = 0;
      let cleanedSize = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiry < now) {
          this.cache.delete(key);
          cleanedEntries++;
          cleanedSize += entry.size;
          this.stats.totalSize -= entry.size;
          this.stats.currentEntries--;
          this.stats.evictionCount++;
          this.stats.totalEvictedSize += entry.size;
        }
      }

      this.stats.lastCleanup = now;
      this.updateMemoryPressure();
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      this.isEvicting = false;
    }
  }

  private updateStats(): void {
    try {
      const totalOperations = this.stats.hits + this.stats.misses;
      this.stats.hitRate = totalOperations > 0 ? this.stats.hits / totalOperations : 0;
      this.stats.memoryUsage = this.stats.totalSize;
      this.updateMemoryPressure();
    } catch (error) {
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private updateMemoryPressure(): void {
    const memoryUsage = this.stats.totalSize / this.config.maxMemoryUsage;
    this.stats.memoryPressureLevel = Math.min(1, Math.max(0, memoryUsage));
  }

  private calculateSize<T>(value: T): number {
    try {
      const str = JSON.stringify(value);
      if (typeof Buffer !== 'undefined' && Buffer.byteLength) {
        // Node.js
        return Buffer.byteLength(str, 'utf8');
      } else if (typeof Blob !== 'undefined') {
        // Browser
        return new Blob([str]).size;
      } else {
        // Fallback
        return str.length;
      }
    } catch (error) {
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      return 0;
    }
  }

  private updateQueryTime(time: number): void {
    this.stats.averageQueryTime = (this.stats.averageQueryTime * this.stats.hitCount + time) / (this.stats.hitCount + 1);
  }

  private updateWriteTime(time: number): void {
    this.stats.averageWriteTime = (this.stats.averageWriteTime * this.stats.writeCount + time) / (this.stats.writeCount + 1);
  }

  private updateDeleteTime(time: number): void {
    this.stats.averageDeleteTime = (this.stats.averageDeleteTime * this.stats.deleteCount + time) / (this.stats.deleteCount + 1);
  }

  private async shouldEvict(requiredSpace: number): Promise<boolean> {
    return this.stats.totalSize + requiredSpace > this.config.maxMemoryUsage ||
           this.stats.currentEntries >= this.config.maxEntries ||
           this.stats.memoryPressureLevel > this.MEMORY_PRESSURE_THRESHOLD;
  }

  private async evictLRU(requiredSpace: number): Promise<void> {
    if (this.isEvicting) {
      return;
    }

    try {
      this.isEvicting = true;
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => {
          // Consider both last access time and access count
          const scoreA = a.lastAccessed * (1 + a.accessCount / 100);
          const scoreB = b.lastAccessed * (1 + b.accessCount / 100);
          return scoreA - scoreB;
        });

      let totalEvicted = 0;
      let entriesEvicted = 0;

      for (const [key, entry] of entries) {
        let shouldEvict = false;
        if (requiredSpace > 0) {
          // Eviction per nuovo inserimento
          const freeSpace = this.config.maxMemoryUsage - (this.stats.totalSize - entry.size);
          const entriesAfter = this.stats.currentEntries - 1;
          shouldEvict = freeSpace < requiredSpace || entriesAfter >= this.config.maxEntries;
        } else {
          // Eviction post-inserimento: rientra nei limiti
          shouldEvict = this.stats.totalSize > this.config.maxMemoryUsage || this.stats.currentEntries > this.config.maxEntries;
        }
        if (!shouldEvict) {
          break;
        }
        // LOG: chiave rimossa e dimensione
        console.log(`[MemoryCacheL1][evictLRU] Rimuovo chiave: ${key}, size: ${entry.size}`);
        this.cache.delete(key);
        totalEvicted += entry.size;
        entriesEvicted++;
        this.stats.totalSize -= entry.size;
        this.stats.currentEntries--;
        this.stats.evictionCount++;
        this.stats.totalEvictedSize += entry.size;
      }

      if (entriesEvicted > 0) {
        this.updateMemoryPressure();
      }
      // LOG: stato finale
      console.log(`[MemoryCacheL1][evictLRU] Stato finale: currentEntries=${this.stats.currentEntries}, totalSize=${this.stats.totalSize}`);
    } finally {
      this.isEvicting = false;
    }
  }

  get<T>(key: string): T | null {
    const startTime = performance.now();
    const timeoutId = setTimeout(() => {
      this.stats.operationTimeouts++;
      this.stats.lastError = 'Get operation timed out';
    }, this.OPERATION_TIMEOUT);

    try {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined;

      if (!entry) {
        this.stats.misses++;
        this.stats.missCount++;
        this.updateStats();
        clearTimeout(timeoutId);
        return null;
      }

      if (entry.expiry < Date.now()) {
        this.cache.delete(key);
        this.stats.misses++;
        this.stats.missCount++;
        this.updateStats();
        clearTimeout(timeoutId);
        return null;
      }

      entry.lastAccessed = Date.now();
      entry.accessCount = (entry.accessCount || 0) + 1;
      this.cache.set(key, entry);

      this.stats.hits++;
      this.stats.hitCount++;
      this.stats.lastAccess = Date.now();
      this.stats.averageAccessCount = (this.stats.averageAccessCount * (this.stats.hitCount - 1) + entry.accessCount) / this.stats.hitCount;

      const queryTime = performance.now() - startTime;
      this.updateQueryTime(queryTime);
      this.updateStats();
      clearTimeout(timeoutId);

      if (typeof entry.value === 'undefined') {
        return null;
      }
      return entry.value;
    } catch (error) {
      clearTimeout(timeoutId);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const startTime = performance.now();
    const timeoutId = setTimeout(() => {
      this.stats.operationTimeouts++;
      this.stats.lastError = 'Set operation timed out';
    }, this.OPERATION_TIMEOUT);

    let hadError = false;
    try {
      const size = this.calculateSize(value);
      const expiry = Date.now() + (ttl || this.config.defaultTTL);

      if (await this.shouldEvict(size)) {
        await this.evictLRU(size);
      }

      const entry: CacheEntry<T> = {
        value,
        expiry,
        lastAccessed: Date.now(),
        size,
        accessCount: 0
      };

      this.cache.set(key, entry);

      this.stats.totalSize += size;
      this.stats.currentEntries++;
      this.stats.writeCount++;
      this.stats.lastAccess = Date.now();

      // Dopo l'inserimento, se la cache supera i limiti, chiamo nuovamente l'eviction
      if (this.stats.totalSize > this.config.maxMemoryUsage || this.stats.currentEntries > this.config.maxEntries) {
        await this.evictLRU(0);
      }

      if (hadError) {
        this.stats.recoveryCount++;
      }

      const writeTime = performance.now() - startTime;
      this.updateWriteTime(writeTime);
      this.updateStats();
      clearTimeout(timeoutId);

      return true;
    } catch (error) {
      clearTimeout(timeoutId);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      hadError = true;
      return false;
    }
  }

  remove(key: string): boolean {
    const startTime = performance.now();
    const timeoutId = setTimeout(() => {
      this.stats.operationTimeouts++;
      this.stats.lastError = 'Remove operation timed out';
    }, this.OPERATION_TIMEOUT);

    try {
      const entry = this.cache.get(key);

      if (!entry) {
        clearTimeout(timeoutId);
        return false;
      }

      this.cache.delete(key);

      this.stats.totalSize -= entry.size;
      this.stats.currentEntries--;
      this.stats.deleteCount++;
      this.stats.lastAccess = Date.now();

      const deleteTime = performance.now() - startTime;
      this.updateDeleteTime(deleteTime);
      this.updateStats();
      clearTimeout(timeoutId);

      return true;
    } catch (error) {
      clearTimeout(timeoutId);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  has(key: string): boolean {
    const timeoutId = setTimeout(() => {
      this.stats.operationTimeouts++;
      this.stats.lastError = 'Has operation timed out';
    }, this.OPERATION_TIMEOUT);

    try {
      const entry = this.cache.get(key);

      if (!entry) {
        clearTimeout(timeoutId);
        return false;
      }

      if (entry.expiry < Date.now()) {
        this.cache.delete(key);
        clearTimeout(timeoutId);
        return false;
      }

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      clearTimeout(timeoutId);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  clear(): void {
    const timeoutId = setTimeout(() => {
      this.stats.operationTimeouts++;
      this.stats.lastError = 'Clear operation timed out';
    }, this.OPERATION_TIMEOUT);

    try {
      this.cache.clear();
      this.stats = this.initializeStats();
      this.stats.lastAccess = Date.now();
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getConfig(): ICacheConfiguration {
    return { ...this.config };
  }

  updateConfig(config: Partial<ICacheConfiguration>): void {
    // Validazione valori minimi
    if (config.maxEntries !== undefined && config.maxEntries < 1) config.maxEntries = 1;
    if (config.maxMemoryUsage !== undefined && config.maxMemoryUsage < 1024) config.maxMemoryUsage = 1024;
    this.config = { ...this.config, ...config };
    this.stats.maxEntries = this.config.maxEntries;
    this.updateMemoryPressure();
  }

  async initialize(): Promise<void> {
    const timeoutId = setTimeout(() => {
      this.stats.operationTimeouts++;
      this.stats.lastError = 'Initialize operation timed out';
    }, this.OPERATION_TIMEOUT);

    try {
      await this.cleanup();
      this.stats.lastAccess = Date.now();
      this.stats.recoveryCount++;
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Destroys the cache, clears all entries and stats, and stops timers.
   * Compatibilità test/legacy.
   */
  public destroy(): void {
    this.cache.clear();
    this.stats = this.initializeStats();
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.operationTimeout) {
      clearTimeout(this.operationTimeout);
      this.operationTimeout = null;
    }
  }

  /**
   * Returns the number of entries in the cache.
   * Compatibilità test/legacy.
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Returns the list of keys in the cache.
   * Compatibilità test/legacy.
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Returns the entries ordered by accessCount (descending).
   * Compatibilità test/legacy.
   */
  public getEntriesByAccessPattern(): Array<{ key: string; accessCount: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, accessCount: entry.accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount);
  }
}

export const memoryCacheL1 = new MemoryCacheL1();

// Export class for custom instances
export default MemoryCacheL1; 
