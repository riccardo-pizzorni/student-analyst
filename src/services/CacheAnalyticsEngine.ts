/**
 * CacheAnalyticsEngine - Sistema di Analytics per Cache
 */

export interface ICacheAnalyticsEngine {
  trackCacheHit(key: string): void;
  trackCacheMiss(key: string): void;
  getMetrics(): CacheMetrics;
  reset(): void;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  lastAccessed: Record<string, number>;
}

export class CacheAnalyticsEngine implements ICacheAnalyticsEngine {
  private hits = 0;
  private misses = 0;
  private lastAccessed: Record<string, number> = {};

  trackCacheHit(key: string): void {
    this.hits++;
    this.lastAccessed[key] = Date.now();
  }

  trackCacheMiss(key: string): void {
    this.misses++;
  }

  getMetrics(): CacheMetrics {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;
    
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      totalRequests,
      lastAccessed: { ...this.lastAccessed }
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.lastAccessed = {};
  }
}

// Singleton export
export const cacheAnalytics = new CacheAnalyticsEngine();
export default CacheAnalyticsEngine;
