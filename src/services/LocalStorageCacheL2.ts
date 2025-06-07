/**
 * STUDENT ANALYST - LocalStorage Cache L2 Service
 * Persistent cache with compression, TTL management, and storage quota monitoring
 */

export interface L2CacheEntry {
  key: string;
  compressedData: string;
  originalSize: number;
  compressedSize: number;
  timestamp: number;
  lastAccessed: number;
  ttl: number;
  accessCount: number;
  compressionRatio: number;
  dataType: string;
}

export interface L2CacheStats {
  totalEntries: number;
  totalStorageUsed: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  quotaUsagePercent: number;
  hits: number;
  misses: number;
  evictions: number;
  compressionErrors: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface L2CacheConfig {
  maxStorageSize: number;
  defaultTTL: number;
  compressionThreshold: number;
  evictionThreshold: number;
  enableCompression: boolean;
  enableLogging: boolean;
}

class LocalStorageCacheL2 {
  private config: L2CacheConfig;
  private stats: L2CacheStats;
  private keyPrefix = 'student-analyst-l2';

  constructor(config: Partial<L2CacheConfig> = {}) {
    this.config = {
      maxStorageSize: 5 * 1024 * 1024, // 5MB
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      compressionThreshold: 1024, // 1KB minimum
      evictionThreshold: 0.9,
      enableCompression: true,
      enableLogging: false,
      ...config
    };

    this.stats = {
      totalEntries: 0,
      totalStorageUsed: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      averageCompressionRatio: 0,
      quotaUsagePercent: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      compressionErrors: 0,
      oldestEntry: 0,
      newestEntry: 0
    };

    this.loadStats();
    this.cleanupExpiredEntries();
  }

  get(key: string): unknown | null {
    const storageKey = this.getStorageKey(key);

    try {
      const entryData = localStorage.getItem(storageKey);
      if (!entryData) {
        this.stats.misses++;
        return null;
      }

      const entry: L2CacheEntry = JSON.parse(entryData);

      if (this.isExpired(entry)) {
        this.remove(key);
        this.stats.misses++;
        return null;
      }

      const decompressedData = this.decompressData(entry.compressedData);
      if (decompressedData === null) {
        this.remove(key);
        this.stats.misses++;
        return null;
      }

      entry.lastAccessed = Date.now();
      entry.accessCount++;
      localStorage.setItem(storageKey, JSON.stringify(entry));

      this.stats.hits++;
      
      if (this.config.enableLogging) {
        console.log(`L2 Cache HIT: ${key}`);
      }

      return decompressedData;
    } catch {
      this.stats.misses++;
      return null;
    }
  }

  set(key: string, data: unknown, ttl?: number, dataType?: string): boolean {
    const entryTTL = ttl || this.config.defaultTTL;
    const timestamp = Date.now();

    try {
      if (this.shouldEvict()) {
        this.performEviction();
      }

      const compressionResult = this.compressData(data);
      if (!compressionResult.success) {
        this.stats.compressionErrors++;
        return false;
      }

      const entry: L2CacheEntry = {
        key,
        compressedData: compressionResult.compressed,
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        timestamp,
        lastAccessed: timestamp,
        ttl: entryTTL,
        accessCount: 1,
        compressionRatio: compressionResult.ratio,
        dataType: dataType || 'unknown'
      };

      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(entry));

      this.updateStatsAfterSet(entry);
      this.saveStats();

      if (this.config.enableLogging) {
        console.log(`L2 Cache SET: ${key} (${compressionResult.ratio.toFixed(2)} ratio)`);
      }

      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): boolean {
    try {
      const storageKey = this.getStorageKey(key);
      const entryData = localStorage.getItem(storageKey);
      
      if (!entryData) {
        return false;
      }

      const entry: L2CacheEntry = JSON.parse(entryData);
      localStorage.removeItem(storageKey);

      this.updateStatsAfterRemove(entry);
      this.saveStats();

      return true;
    } catch {
      return false;
    }
  }

  has(key: string): boolean {
    try {
      const storageKey = this.getStorageKey(key);
      const entryData = localStorage.getItem(storageKey);
      
      if (!entryData) {
        return false;
      }

      const entry: L2CacheEntry = JSON.parse(entryData);
      if (this.isExpired(entry)) {
        this.remove(key);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    try {
      const keys = this.getAllCacheKeys();
      for (const storageKey of keys) {
        localStorage.removeItem(storageKey);
      }

      this.resetStats();
      this.saveStats();
    } catch {
      // Ignore errors
    }
  }

  keys(): string[] {
    try {
      const cacheKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix + ':')) {
          cacheKeys.push(key.substring(this.keyPrefix.length + 1));
        }
      }
      return cacheKeys;
    } catch {
      return [];
    }
  }

  getStats(): L2CacheStats {
    this.updateCurrentStats();
    return { ...this.stats };
  }

  getStorageBreakdown(): { [dataType: string]: { count: number; originalSize: number; compressedSize: number } } {
    const breakdown: { [dataType: string]: { count: number; originalSize: number; compressedSize: number } } = {};

    try {
      const keys = this.getAllCacheKeys();
      for (const storageKey of keys) {
        const entryData = localStorage.getItem(storageKey);
        if (entryData) {
          const entry: L2CacheEntry = JSON.parse(entryData);
          const dataType = entry.dataType || 'unknown';

          if (!breakdown[dataType]) {
            breakdown[dataType] = { count: 0, originalSize: 0, compressedSize: 0 };
          }

          breakdown[dataType].count++;
          breakdown[dataType].originalSize += entry.originalSize;
          breakdown[dataType].compressedSize += entry.compressedSize;
        }
      }

      return breakdown;
    } catch {
      return {};
    }
  }

  cleanupExpiredEntries(): number {
    let removedCount = 0;

    try {
      const keys = this.getAllCacheKeys();
      for (const storageKey of keys) {
        const entryData = localStorage.getItem(storageKey);
        if (entryData) {
          const entry: L2CacheEntry = JSON.parse(entryData);
          if (this.isExpired(entry)) {
            localStorage.removeItem(storageKey);
            this.updateStatsAfterRemove(entry);
            removedCount++;
          }
        }
      }

      if (removedCount > 0) {
        this.saveStats();
      }

      return removedCount;
    } catch {
      return 0;
    }
  }

  // Private methods

  private compressData(data: unknown): { compressed: string; originalSize: number; compressedSize: number; ratio: number; success: boolean } {
    try {
      const jsonString = JSON.stringify(data);
      const originalSize = jsonString.length * 2;

      if (!this.config.enableCompression || originalSize < this.config.compressionThreshold) {
        return {
          compressed: jsonString,
          originalSize,
          compressedSize: originalSize,
          ratio: 1.0,
          success: true
        };
      }

      const compressed = this.simpleCompress(jsonString);
      const compressedSize = compressed.length * 2;

      return {
        compressed,
        originalSize,
        compressedSize,
        ratio: compressedSize / originalSize,
        success: true
      };
    } catch {
      return {
        compressed: '',
        originalSize: 0,
        compressedSize: 0,
        ratio: 1.0,
        success: false
      };
    }
  }

  private decompressData(compressedData: string): unknown | null {
    try {
      let jsonString: string;
      if (compressedData.startsWith('COMP:')) {
        jsonString = this.simpleDecompress(compressedData.substring(5));
      } else {
        jsonString = compressedData;
      }

      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }

  private simpleCompress(data: string): string {
    const dict: { [key: string]: string } = {
      '"timestamp"': '"ts"',
      '"data"': '"d"',
      '"symbol"': '"s"',
      '"price"': '"p"',
      '"volume"': '"v"',
      '"open"': '"o"',
      '"high"': '"h"',
      '"low"': '"l"',
      '"close"': '"c"'
    };

    let compressed = data;
    for (const [original, replacement] of Object.entries(dict)) {
      compressed = compressed.replace(new RegExp(original, 'g'), replacement);
    }

    return 'COMP:' + compressed;
  }

  private simpleDecompress(data: string): string {
    const dict: { [key: string]: string } = {
      '"ts"': '"timestamp"',
      '"d"': '"data"',
      '"s"': '"symbol"',
      '"p"': '"price"',
      '"v"': '"volume"',
      '"o"': '"open"',
      '"h"': '"high"',
      '"l"': '"low"',
      '"c"': '"close"'
    };

    let decompressed = data;
    for (const [compressed, original] of Object.entries(dict)) {
      decompressed = decompressed.replace(new RegExp(compressed, 'g'), original);
    }

    return decompressed;
  }

  private isExpired(entry: L2CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private getStorageKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  private getAllCacheKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.keyPrefix + ':')) {
        keys.push(key);
      }
    }
    return keys;
  }

  private shouldEvict(): boolean {
    const usage = this.calculateCurrentUsage();
    return usage > this.config.maxStorageSize * this.config.evictionThreshold;
  }

  private performEviction(): void {
    try {
      const entries = this.getAllEntriesForEviction();
      const targetFree = this.config.maxStorageSize * 0.2; // Free 20%
      let freedSpace = 0;

      for (const { storageKey, entry } of entries) {
        if (freedSpace >= targetFree) break;

        const entrySize = JSON.stringify(entry).length * 2;
        localStorage.removeItem(storageKey);
        this.updateStatsAfterRemove(entry);
        this.stats.evictions++;
        freedSpace += entrySize;
      }

      this.saveStats();
    } catch {
      // Ignore errors
    }
  }

  private getAllEntriesForEviction(): Array<{ storageKey: string; entry: L2CacheEntry }> {
    const entries: Array<{ storageKey: string; entry: L2CacheEntry }> = [];

    try {
      const keys = this.getAllCacheKeys();
      for (const storageKey of keys) {
        const entryData = localStorage.getItem(storageKey);
        if (entryData) {
          const entry: L2CacheEntry = JSON.parse(entryData);
          entries.push({ storageKey, entry });
        }
      }

      entries.sort((a, b) => {
        const ageA = Date.now() - a.entry.lastAccessed;
        const ageB = Date.now() - b.entry.lastAccessed;
        return ageB - ageA; // Oldest first
      });

      return entries;
    } catch {
      return [];
    }
  }

  private calculateCurrentUsage(): number {
    let totalSize = 0;
    try {
      const keys = this.getAllCacheKeys();
      for (const storageKey of keys) {
        const entryData = localStorage.getItem(storageKey);
        if (entryData) {
          totalSize += entryData.length * 2;
        }
      }
    } catch {
      // Ignore errors
    }
    return totalSize;
  }

  private updateStatsAfterSet(entry: L2CacheEntry): void {
    this.stats.totalEntries++;
    this.stats.totalOriginalSize += entry.originalSize;
    this.stats.totalCompressedSize += entry.compressedSize;
    this.updateCompressionRatio();
    this.updateTimestampStats(entry.timestamp);
  }

  private updateStatsAfterRemove(entry: L2CacheEntry): void {
    this.stats.totalEntries = Math.max(0, this.stats.totalEntries - 1);
    this.stats.totalOriginalSize = Math.max(0, this.stats.totalOriginalSize - entry.originalSize);
    this.stats.totalCompressedSize = Math.max(0, this.stats.totalCompressedSize - entry.compressedSize);
    this.updateCompressionRatio();
  }

  private updateCompressionRatio(): void {
    this.stats.averageCompressionRatio = this.stats.totalOriginalSize > 0 
      ? this.stats.totalCompressedSize / this.stats.totalOriginalSize 
      : 0;
  }

  private updateTimestampStats(timestamp: number): void {
    if (this.stats.oldestEntry === 0 || timestamp < this.stats.oldestEntry) {
      this.stats.oldestEntry = timestamp;
    }
    if (timestamp > this.stats.newestEntry) {
      this.stats.newestEntry = timestamp;
    }
  }

  private updateCurrentStats(): void {
    this.stats.totalStorageUsed = this.calculateCurrentUsage();
    this.stats.quotaUsagePercent = (this.stats.totalStorageUsed / this.config.maxStorageSize) * 100;
  }

  private resetStats(): void {
    this.stats = {
      totalEntries: 0,
      totalStorageUsed: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      averageCompressionRatio: 0,
      quotaUsagePercent: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      compressionErrors: 0,
      oldestEntry: 0,
      newestEntry: 0
    };
  }

  private loadStats(): void {
    try {
      const metadata = localStorage.getItem(this.keyPrefix + ':meta');
      if (metadata) {
        this.stats = { ...this.stats, ...JSON.parse(metadata) };
      }
    } catch {
      // Ignore errors, use default stats
    }
  }

  private saveStats(): void {
    try {
      localStorage.setItem(this.keyPrefix + ':meta', JSON.stringify(this.stats));
    } catch {
      // Ignore errors
    }
  }
}

export const localStorageCacheL2 = new LocalStorageCacheL2({
  maxStorageSize: 5 * 1024 * 1024,
  defaultTTL: 24 * 60 * 60 * 1000,
  enableCompression: true,
  enableLogging: false
});

export default LocalStorageCacheL2; 
