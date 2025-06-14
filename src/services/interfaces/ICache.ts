/**
 * STUDENT ANALYST - Cache Interfaces
 * Common interfaces for all cache implementations
 */


export interface ICacheConfiguration {
  maxEntries: number;
  maxMemoryUsage: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableCompression: boolean;
  compressionThreshold: number;
  evictionPolicy: 'lru' | 'expired';
}

export interface ICacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  currentEntries: number;
  maxEntries: number;
  lastCleanup: number;
  lastAccess: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  writeCount: number;
  deleteCount: number;
  compressionRatio: number;
  averageQueryTime: number;
  averageWriteTime: number;
  averageDeleteTime: number;
}

export interface IL1CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  currentEntries: number;
  maxEntries: number;
  lastCleanup: number;
  lastAccess: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  writeCount: number;
  deleteCount: number;
  compressionRatio: number;
  averageQueryTime: number;
  averageWriteTime: number;
  averageDeleteTime: number;
  errorCount: number;
  lastError: string | null;
  recoveryCount: number;
}

export interface IL2CacheStats extends ICacheStats {}
export interface IL3CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  currentEntries: number;
  maxEntries: number;
  lastCleanup: number;
  lastAccess: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  writeCount: number;
  deleteCount: number;
  compressionRatio: number;
  averageQueryTime: number;
  averageWriteTime: number;
  averageDeleteTime: number;
  errorCount: number;
  lastError: string | null;
  recoveryCount: number;
}

export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  getAllKeys(): Promise<string[]>;
  size(): Promise<number>;
  getStats(): Promise<ICacheStats>;
}

export interface IMemoryCacheL1 {
  initialize(): Promise<void>;
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
  remove(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
  getStats(): IL1CacheStats;
  getConfig(): ICacheConfiguration;
  updateConfig(config: Partial<ICacheConfiguration>): void;
}

export interface ILocalStorageCacheL2 {
  initialize(): Promise<void>;
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number, dataType?: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
  getStats(): IL2CacheStats;
  getConfig(): ICacheConfiguration;
  updateConfig(config: Partial<ICacheConfiguration>): void;
}

export interface IIndexedDBCacheL3 extends ICache {
  initialize(): Promise<void>;
  initializeConfig(): ICacheConfiguration;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  getStats(): Promise<IL3CacheStats>;
  getConfig(): ICacheConfiguration;
  updateConfig(config: Partial<ICacheConfiguration>): void;
}

export interface IAutomaticCleanupService { 
  initialize(): Promise<void>; 
  performLRUCleanup(layer: "L1" | "L2" | "L3", targetFreePercentage?: number): Promise<boolean>; 
  trackDataAccess(key: string, layer: "L1" | "L2" | "L3"): void; 
  shutdown(): void; 
}
