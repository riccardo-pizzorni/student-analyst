/**
 * STUDENT ANALYST - Memory Cache L1 Service
 * In-memory cache with LRU eviction policy, TTL management, and memory monitoring
 */

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number; // Time to live in milliseconds
  size: number; // Size in bytes
}

export interface CacheNode<T = any> {
  entry: CacheEntry<T>;
  prev: CacheNode<T> | null;
  next: CacheNode<T> | null;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  hitRate: number;
  currentSize: number;
  currentEntries: number;
  maxSize: number;
  memoryUsage: number; // in bytes
  maxMemoryUsage: number; // in bytes
  oldestEntry: number; // timestamp
  newestEntry: number; // timestamp
  averageAccessTime: number;
}

export interface CacheConfiguration {
  maxSize: number; // Maximum number of entries
  maxMemoryUsage: number; // Maximum memory usage in bytes (default 50MB)
  defaultTTL: number; // Default TTL in milliseconds (default 1 hour)
  cleanupInterval: number; // Cleanup interval in milliseconds (default 5 minutes)
  enableStats: boolean; // Enable detailed statistics
  enableLogging: boolean; // Enable debug logging
}

export interface CacheEvictionEvent<T = any> {
  type: 'eviction' | 'expiration' | 'manual';
  entry: CacheEntry<T>;
  reason: string;
  timestamp: number;
}

class MemoryCacheL1<T = any> {
  private cache = new Map<string, CacheNode<T>>();
  private head: CacheNode<T> | null = null;
  private tail: CacheNode<T> | null = null;
  private config: CacheConfiguration;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private evictionListeners: Array<(event: CacheEvictionEvent<T>) => void> = [];

  constructor(config: Partial<CacheConfiguration> = {}) {
    this.config = {
      maxSize: 1000, // Default max 1000 entries
      maxMemoryUsage: 50 * 1024 * 1024, // Default 50MB
      defaultTTL: 60 * 60 * 1000, // Default 1 hour
      cleanupInterval: 5 * 60 * 1000, // Default 5 minutes
      enableStats: true,
      enableLogging: false,
      ...config
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      hitRate: 0,
      currentSize: 0,
      currentEntries: 0,
      maxSize: this.config.maxSize,
      memoryUsage: 0,
      maxMemoryUsage: this.config.maxMemoryUsage,
      oldestEntry: 0,
      newestEntry: 0,
      averageAccessTime: 0
    };

    // Start cleanup timer
    this.startCleanupTimer();

    if (this.config.enableLogging) {
      console.log('MemoryCacheL1 initialized:', this.config);
    }
  }

  /**
   * Get value from cache with LRU promotion
   */
  get(key: string): T | null {
    const startTime = performance.now();
    this.stats.totalRequests++;

    const node = this.cache.get(key);
    
    if (!node) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry is expired
    if (this.isExpired(node.entry)) {
      this.remove(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    node.entry.accessCount++;
    node.entry.lastAccessed = Date.now();
    this.stats.hits++;

    // Move to head (most recently used)
    this.moveToHead(node);

    // Update performance stats
    const accessTime = performance.now() - startTime;
    this.updateAverageAccessTime(accessTime);
    this.updateHitRate();

    if (this.config.enableLogging) {
      console.log(`Cache HIT: ${key} (${accessTime.toFixed(2)}ms)`);
    }

    return node.entry.data;
  }

  /**
   * Set value in cache with TTL
   */
  set(key: string, data: T, ttl?: number): boolean {
    const entryTTL = ttl || this.config.defaultTTL;
    const size = this.calculateSize(data);
    const timestamp = Date.now();

    // Check if adding this entry would exceed memory limit
    if (this.stats.memoryUsage + size > this.config.maxMemoryUsage) {
      // Try to free up space
      const freedSpace = this.evictToFreeSpace(size);
      if (freedSpace < size) {
        if (this.config.enableLogging) {
          console.warn(`Cannot cache ${key}: would exceed memory limit`);
        }
        return false;
      }
    }

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.remove(key);
    }

    // Check size limit after memory check
    if (this.stats.currentEntries >= this.config.maxSize) {
      this.evictLRU();
    }

    // Create new entry
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp,
      accessCount: 1,
      lastAccessed: timestamp,
      ttl: entryTTL,
      size
    };

    const node: CacheNode<T> = {
      entry,
      prev: null,
      next: null
    };

    // Add to cache and linked list
    this.cache.set(key, node);
    this.addToHead(node);

    // Update statistics
    this.stats.currentEntries++;
    this.stats.currentSize++;
    this.stats.memoryUsage += size;
    this.updateTimestampStats(timestamp);

    if (this.config.enableLogging) {
      console.log(`Cache SET: ${key} (${size} bytes, TTL: ${entryTTL}ms)`);
    }

    return true;
  }

  /**
   * Remove entry from cache
   */
  remove(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    // Remove from cache and linked list
    this.cache.delete(key);
    this.removeFromList(node);

    // Update statistics
    this.stats.currentEntries--;
    this.stats.currentSize--;
    this.stats.memoryUsage -= node.entry.size;

    if (this.config.enableLogging) {
      console.log(`Cache REMOVE: ${key}`);
    }

    return true;
  }

  /**
   * Check if cache has key and it's not expired
   */
  has(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    if (this.isExpired(node.entry)) {
      this.remove(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    
    // Reset statistics
    this.stats.currentEntries = 0;
    this.stats.currentSize = 0;
    this.stats.memoryUsage = 0;
    this.stats.oldestEntry = 0;
    this.stats.newestEntry = 0;

    if (this.config.enableLogging) {
      console.log('Cache CLEARED');
    }
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfiguration {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfiguration>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // If memory limit decreased, evict entries to meet new limit
    if (newConfig.maxMemoryUsage && newConfig.maxMemoryUsage < oldConfig.maxMemoryUsage) {
      const excessMemory = this.stats.memoryUsage - this.config.maxMemoryUsage;
      if (excessMemory > 0) {
        this.evictToFreeSpace(excessMemory);
      }
    }

    // If size limit decreased, evict entries
    if (newConfig.maxSize && newConfig.maxSize < this.stats.currentEntries) {
      const entriesToEvict = this.stats.currentEntries - newConfig.maxSize;
      for (let i = 0; i < entriesToEvict; i++) {
        this.evictLRU();
      }
    }

    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval && newConfig.cleanupInterval !== oldConfig.cleanupInterval) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }

    if (this.config.enableLogging) {
      console.log('Cache config updated:', this.config);
    }
  }

  /**
   * Add eviction event listener
   */
  onEviction(listener: (event: CacheEvictionEvent<T>) => void): void {
    this.evictionListeners.push(listener);
  }

  /**
   * Remove eviction event listener
   */
  offEviction(listener: (event: CacheEvictionEvent<T>) => void): void {
    const index = this.evictionListeners.indexOf(listener);
    if (index > -1) {
      this.evictionListeners.splice(index, 1);
    }
  }

  /**
   * Manually trigger cleanup of expired entries
   */
  cleanup(): number {
    const startTime = performance.now();
    let removedCount = 0;
    const currentTime = Date.now();

    // Iterate through all entries and remove expired ones
    for (const [key, node] of this.cache.entries()) {
      if (this.isExpired(node.entry)) {
        this.emitEvictionEvent({
          type: 'expiration',
          entry: node.entry,
          reason: 'TTL expired',
          timestamp: currentTime
        });
        
        this.remove(key);
        removedCount++;
      }
    }

    const cleanupTime = performance.now() - startTime;
    
    if (this.config.enableLogging && removedCount > 0) {
      console.log(`Cache cleanup: removed ${removedCount} expired entries (${cleanupTime.toFixed(2)}ms)`);
    }

    return removedCount;
  }

  /**
   * Get cache entries sorted by access pattern
   */
  getEntriesByAccessPattern(): CacheEntry<T>[] {
    const entries: CacheEntry<T>[] = [];
    let current = this.head;

    while (current) {
      entries.push({ ...current.entry });
      current = current.next;
    }

    return entries;
  }

  /**
   * Get memory usage breakdown
   */
  getMemoryBreakdown(): { [key: string]: { count: number; totalSize: number; averageSize: number } } {
    const breakdown: { [key: string]: { count: number; totalSize: number; averageSize: number } } = {};

    for (const [key, node] of this.cache.entries()) {
      const dataType = typeof node.entry.data;
      
      if (!breakdown[dataType]) {
        breakdown[dataType] = { count: 0, totalSize: 0, averageSize: 0 };
      }

      breakdown[dataType].count++;
      breakdown[dataType].totalSize += node.entry.size;
      breakdown[dataType].averageSize = breakdown[dataType].totalSize / breakdown[dataType].count;
    }

    return breakdown;
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
    this.evictionListeners = [];

    if (this.config.enableLogging) {
      console.log('Cache destroyed');
    }
  }

  // Private helper methods

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private calculateSize(data: T): number {
    try {
      // Rough estimate: JSON stringify and calculate UTF-16 byte size
      const jsonString = JSON.stringify(data);
      return jsonString.length * 2; // UTF-16 uses 2 bytes per character
    } catch (error) {
      // Fallback for non-serializable data
      return 1024; // Assume 1KB for complex objects
    }
  }

  private addToHead(node: CacheNode<T>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeFromList(node: CacheNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private moveToHead(node: CacheNode<T>): void {
    this.removeFromList(node);
    this.addToHead(node);
  }

  private evictLRU(): boolean {
    if (!this.tail) {
      return false;
    }

    const key = this.tail.entry.key;
    const entry = this.tail.entry;

    this.emitEvictionEvent({
      type: 'eviction',
      entry,
      reason: 'LRU eviction',
      timestamp: Date.now()
    });

    this.remove(key);
    this.stats.evictions++;

    if (this.config.enableLogging) {
      console.log(`Cache EVICT LRU: ${key}`);
    }

    return true;
  }

  private evictToFreeSpace(requiredSpace: number): number {
    let freedSpace = 0;
    
    while (freedSpace < requiredSpace && this.tail) {
      const entrySize = this.tail.entry.size;
      const key = this.tail.entry.key;
      const entry = this.tail.entry;

      this.emitEvictionEvent({
        type: 'eviction',
        entry,
        reason: `Memory limit exceeded, need ${requiredSpace} bytes`,
        timestamp: Date.now()
      });

      if (this.remove(key)) {
        freedSpace += entrySize;
        this.stats.evictions++;
      } else {
        break; // Safety net
      }
    }

    return freedSpace;
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
  }

  private updateAverageAccessTime(accessTime: number): void {
    const totalAccesses = this.stats.hits + this.stats.misses;
    this.stats.averageAccessTime = (
      (this.stats.averageAccessTime * (totalAccesses - 1)) + accessTime
    ) / totalAccesses;
  }

  private updateTimestampStats(timestamp: number): void {
    if (this.stats.oldestEntry === 0 || timestamp < this.stats.oldestEntry) {
      this.stats.oldestEntry = timestamp;
    }
    if (timestamp > this.stats.newestEntry) {
      this.stats.newestEntry = timestamp;
    }
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private emitEvictionEvent(event: CacheEvictionEvent<T>): void {
    for (const listener of this.evictionListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in eviction listener:', error);
      }
    }
  }
}

// Export singleton instance for global use
export const memoryCacheL1 = new MemoryCacheL1({
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  defaultTTL: 60 * 60 * 1000, // 1 hour
  enableLogging: process.env.NODE_ENV === 'development'
});

// Export class for custom instances
export default MemoryCacheL1; 
