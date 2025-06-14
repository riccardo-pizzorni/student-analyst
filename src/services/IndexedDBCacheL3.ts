/**
 * STUDENT ANALYST - IndexedDB Cache L3 Service
 * Persistent cache layer using IndexedDB with advanced eviction and statistics
 */

import { ICacheConfiguration, IIndexedDBCacheL3, IL3CacheStats } from './interfaces/ICache';

export interface L3CacheStats extends IL3CacheStats {}

export interface L3CacheConfiguration extends ICacheConfiguration {}

export class IndexedDBCacheL3 implements IIndexedDBCacheL3 {
  private readonly OPERATION_TIMEOUT = 10000; // Increased to 10 seconds
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private readonly DB_NAME = 'student-analyst-l3-cache';
  private readonly STORE_NAME = 'cache';
  private readonly VERSION = 1;
  private db: IDBDatabase | null = null;
  private stats: L3CacheStats;
  private config: L3CacheConfiguration;
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

  public initializeConfig(): ICacheConfiguration {
    return {
      maxEntries: 10000,
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      cleanupInterval: 60 * 1000, // 1 minute
      enableCompression: true,
      compressionThreshold: 1024, // 1KB
      evictionPolicy: 'lru'
    };
  }

  private initializeStats(): L3CacheStats {
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

  private async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Database open timeout'));
      }, this.OPERATION_TIMEOUT);

      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onerror = () => {
        clearTimeout(timeoutId);
        const error = new Error(`Failed to open database: ${request.error?.message}`);
        this.stats.errorCount++;
        this.stats.lastError = error.message;
        reject(error);
      };

      request.onsuccess = () => {
        clearTimeout(timeoutId);
        this.db = request.result;
        this.stats.recoveryCount++;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
          store.createIndex('expiry', 'expiry', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  private async evictLRU(requiredSpace: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('LRU eviction timeout'));
      }, this.OPERATION_TIMEOUT);

      if (!this.db) {
        clearTimeout(timeoutId);
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('lastAccessed');
      const request = index.openCursor();

      let totalEvicted = 0;
      let entriesEvicted = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (this.stats.totalSize + requiredSpace > this.config.maxMemoryUsage ||
              this.stats.currentEntries >= this.config.maxEntries) {
            const entry = cursor.value;
            const deleteRequest = store.delete(cursor.primaryKey);
            deleteRequest.onsuccess = () => {
              totalEvicted += entry.size;
              entriesEvicted++;
              this.stats.totalSize -= entry.size;
              this.stats.currentEntries--;
              cursor.continue();
            };
          } else {
            clearTimeout(timeoutId);
            resolve();
          }
        } else {
          clearTimeout(timeoutId);
          if (entriesEvicted > 0) {
            console.log(`Evicted ${entriesEvicted} entries, freed ${totalEvicted} bytes`);
          }
          resolve();
        }
      };

      request.onerror = () => {
        clearTimeout(timeoutId);
        const error = new Error('Failed to evict LRU entries');
        this.stats.errorCount++;
        this.stats.lastError = error.message;
        reject(error);
      };
    });
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

  async initialize(): Promise<void> {
    try {
      await this.openDatabase();
      await this.cleanup();
      this.stats.lastAccess = Date.now();
    } catch (error) {
      console.error('Error initializing cache:', error);
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Cleanup timeout'));
      }, this.OPERATION_TIMEOUT);

      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('expiry');
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));

      let cleanedEntries = 0;
      let cleanedSize = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value;
          const deleteRequest = store.delete(cursor.primaryKey);
          deleteRequest.onsuccess = () => {
            cleanedEntries++;
            cleanedSize += entry.size;
            this.stats.totalSize -= entry.size;
            this.stats.currentEntries--;
            cursor.continue();
          };
        } else {
          clearTimeout(timeoutId);
          if (cleanedEntries > 0) {
            console.log(`Cleaned ${cleanedEntries} expired entries, freed ${cleanedSize} bytes`);
          }
          this.stats.lastCleanup = Date.now();
          resolve();
        }
      };

      request.onerror = () => {
        clearTimeout(timeoutId);
        const error = new Error('Failed to clean expired entries');
        this.stats.errorCount++;
        this.stats.lastError = error.message;
        reject(error);
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    return this.queueOperation(async () => {
      const startTime = performance.now();
      try {
        if (!this.db) {
          await this.initialize();
        }

        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Get operation timeout'));
          }, this.OPERATION_TIMEOUT);

          const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
          const store = transaction.objectStore(this.STORE_NAME);
          const request = store.get(key);

          request.onsuccess = () => {
            clearTimeout(timeoutId);
            const entry = request.result;

            if (!entry) {
              this.stats.misses++;
              this.stats.missCount++;
              this.updateStats();
              resolve(null);
              return;
            }

            if (entry.expiry < Date.now()) {
              this.delete(key).then(() => {
                this.stats.misses++;
                this.stats.missCount++;
                this.updateStats();
                resolve(null);
              });
              return;
            }

            entry.lastAccessed = Date.now();
            store.put(entry);

            this.stats.hits++;
            this.stats.hitCount++;
            this.stats.lastAccess = Date.now();

            const queryTime = performance.now() - startTime;
            this.updateQueryTime(queryTime);
            this.updateStats();

            resolve(entry.value as T);
          };

          request.onerror = () => {
            clearTimeout(timeoutId);
            const error = new Error('Failed to get value from cache');
            this.stats.errorCount++;
            this.stats.lastError = error.message;
            this.updateStats();
            reject(error);
          };
        });
      } catch (error) {
        console.error('Error getting value from cache:', error);
        this.stats.errorCount++;
        this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
        this.updateStats();
        throw error;
      }
    });
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    return this.queueOperation(async () => {
      const startTime = performance.now();
      try {
        if (!this.db) {
          await this.initialize();
        }

        const size = this.calculateSize(value);
        const expiry = Date.now() + (ttl || this.config.defaultTTL);

        if (await this.shouldEvict(size)) {
          await this.evict(size);
        }

        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Set operation timeout'));
          }, this.OPERATION_TIMEOUT);

          const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          const entry = {
            key,
            value,
            expiry,
            lastAccessed: Date.now(),
            size
          };

          const request = store.put(entry);

          request.onsuccess = () => {
            clearTimeout(timeoutId);
            this.stats.totalSize += size;
            this.stats.currentEntries++;
            this.stats.writeCount++;
            this.stats.lastAccess = Date.now();

            const writeTime = performance.now() - startTime;
            this.updateWriteTime(writeTime);
            this.updateStats();

            resolve(true);
          };

          request.onerror = () => {
            clearTimeout(timeoutId);
            const error = new Error('Failed to set value in cache');
            this.stats.errorCount++;
            this.stats.lastError = error.message;
            reject(error);
          };
        });
      } catch (error) {
        console.error('Error setting value in cache:', error);
        this.stats.errorCount++;
        this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
        return false;
      }
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.queueOperation(async () => {
      const startTime = performance.now();
      try {
        if (!this.db) {
          await this.initialize();
        }

        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Delete operation timeout'));
          }, this.OPERATION_TIMEOUT);

          const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          const getRequest = store.get(key);

          getRequest.onsuccess = () => {
            const entry = getRequest.result;
            if (!entry) {
              clearTimeout(timeoutId);
              resolve(false);
              return;
            }

            const deleteRequest = store.delete(key);
            deleteRequest.onsuccess = () => {
              clearTimeout(timeoutId);
              this.stats.totalSize -= entry.size;
              this.stats.currentEntries--;
              this.stats.deleteCount++;
              this.stats.lastAccess = Date.now();

              const deleteTime = performance.now() - startTime;
              this.updateDeleteTime(deleteTime);
              this.updateStats();

              resolve(true);
            };

            deleteRequest.onerror = () => {
              clearTimeout(timeoutId);
              const error = new Error('Failed to delete value from cache');
              this.stats.errorCount++;
              this.stats.lastError = error.message;
              reject(error);
            };
          };

          getRequest.onerror = () => {
            clearTimeout(timeoutId);
            const error = new Error('Failed to get value for deletion');
            this.stats.errorCount++;
            this.stats.lastError = error.message;
            reject(error);
          };
        });
      } catch (error) {
        console.error('Error deleting value from cache:', error);
        this.stats.errorCount++;
        this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
        return false;
      }
    });
  }

  async clear(): Promise<void> {
    return this.queueOperation(async () => {
      try {
        if (!this.db) {
          await this.initialize();
        }

        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Clear operation timeout'));
          }, this.OPERATION_TIMEOUT);

          const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          const request = store.clear();

          request.onsuccess = () => {
            clearTimeout(timeoutId);
            this.stats = this.initializeStats();
            this.stats.lastAccess = Date.now();
            resolve();
          };

          request.onerror = () => {
            clearTimeout(timeoutId);
            const error = new Error('Failed to clear cache');
            this.stats.errorCount++;
            this.stats.lastError = error.message;
            reject(error);
          };
        });
      } catch (error) {
        console.error('Error clearing cache:', error);
        this.stats.errorCount++;
        this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
        throw error;
      }
    });
  }

  async has(key: string): Promise<boolean> {
    return this.queueOperation(async () => {
      try {
        if (!this.db) {
          await this.initialize();
        }

        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Has operation timeout'));
          }, this.OPERATION_TIMEOUT);

          const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
          const store = transaction.objectStore(this.STORE_NAME);
          const request = store.get(key);

          request.onsuccess = () => {
            clearTimeout(timeoutId);
            const entry = request.result;

            if (!entry) {
              resolve(false);
              return;
            }

            if (entry.expiry < Date.now()) {
              this.delete(key).then(() => resolve(false));
              return;
            }

            resolve(true);
          };

          request.onerror = () => {
            clearTimeout(timeoutId);
            const error = new Error('Failed to check key in cache');
            this.stats.errorCount++;
            this.stats.lastError = error.message;
            reject(error);
          };
        });
      } catch (error) {
        console.error('Error checking key in cache:', error);
        this.stats.errorCount++;
        this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
        return false;
      }
    });
  }

  async getStats(): Promise<L3CacheStats> {
    return { ...this.stats };
  }

  getConfig(): L3CacheConfiguration {
    return { ...this.config };
  }

  updateConfig(config: Partial<L3CacheConfiguration>): void {
    this.config = { ...this.config, ...config };
    if (config.cleanupInterval) {
      this.startCleanupTimer();
    }
  }

  async getAllKeys(): Promise<string[]> {
    return this.queueOperation(async () => {
      if (!this.db) {
        await this.initialize();
      }
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAllKeys();
        request.onsuccess = () => {
          resolve(request.result as string[]);
        };
        request.onerror = () => {
          reject(new Error('Failed to get all keys from cache'));
        };
      });
    });
  }

  async size(): Promise<number> {
    return this.queueOperation(async () => {
      if (!this.db) {
        await this.initialize();
      }
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.count();
        request.onsuccess = () => {
          resolve(request.result as number);
        };
        request.onerror = () => {
          reject(new Error('Failed to get cache size'));
        };
      });
    });
  }
}

export const indexedDBCacheL3 = new IndexedDBCacheL3();