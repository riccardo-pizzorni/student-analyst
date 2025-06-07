/**
 * Algorithm Optimization Engine - Core Implementation
 * Provides memoization, caching, and optimized matrix operations
 */

export interface OptimizationMetrics {
  cacheHitRate: number;
  averageComputeTime: number;
  totalOperations: number;
  memoryUsage: number;
}

class AlgorithmOptimizationEngine {
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private memoizedResults: Map<string, unknown>;
  private metrics: OptimizationMetrics;
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor() {
    this.cache = new Map();
    this.memoizedResults = new Map();
    this.metrics = {
      cacheHitRate: 0,
      averageComputeTime: 0,
      totalOperations: 0,
      memoryUsage: 0
    };
  }

  /**
   * Optimized covariance matrix calculation with caching
   */
  async calculateOptimizedCovariance(returns: number[][]): Promise<number[][]> {
    const key = this.generateCacheKey('covariance', returns);
    
    const cached = this.getFromCache(key);
    if (cached) {
      this.recordCacheHit();
      return cached as number[][];
    }

    const startTime = performance.now();
    
    const n = returns.length;
    const covariance = Array(n).fill(null).map(() => Array(n).fill(0));
    
    // Pre-calculate means (optimization 1)
    const means = returns.map(series => 
      series.reduce((sum, val) => sum + val, 0) / series.length
    );

    const minLength = Math.min(...returns.map(r => r.length));
    
    // Use symmetry property (optimization 2)
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        let cov = 0;
        const meanI = means[i];
        const meanJ = means[j];
        
        for (let k = 0; k < minLength; k++) {
          cov += (returns[i][k] - meanI) * (returns[j][k] - meanJ);
        }
        
        cov /= (minLength - 1);
        covariance[i][j] = cov;
        covariance[j][i] = cov; // Use symmetry
      }
    }

    const computeTime = performance.now() - startTime;
    this.setCache(key, covariance);
    this.recordComputeTime(computeTime);

    return covariance;
  }

  /**
   * Memoized function wrapper
   */
  memoize<T>(fn: (...args: unknown[]) => T, ...args: unknown[]): T {
    const key = this.generateCacheKey('memo', args);
    
    if (this.memoizedResults.has(key)) {
      this.recordCacheHit();
      return this.memoizedResults.get(key) as T;
    }

    this.recordCacheMiss();
    const result = fn(...args);
    this.memoizedResults.set(key, result);
    
    return result;
  }

  // Private helper methods
  private generateCacheKey(operation: string, data: unknown): string {
    return `${operation}_${JSON.stringify(data).slice(0, 100)}`;
  }

  private getFromCache(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private recordCacheHit(): void {
    this.metrics.totalOperations++;
    this.metrics.cacheHitRate = (this.metrics.cacheHitRate * (this.metrics.totalOperations - 1) + 1) / this.metrics.totalOperations;
  }

  private recordCacheMiss(): void {
    this.metrics.totalOperations++;
    this.metrics.cacheHitRate = (this.metrics.cacheHitRate * (this.metrics.totalOperations - 1)) / this.metrics.totalOperations;
  }

  private recordComputeTime(time: number): void {
    const totalOps = this.metrics.totalOperations;
    this.metrics.averageComputeTime = (this.metrics.averageComputeTime * (totalOps - 1) + time) / totalOps;
  }

  getMetrics(): OptimizationMetrics {
    return { ...this.metrics };
  }

  clearCaches(): void {
    this.cache.clear();
    this.memoizedResults.clear();
  }
}

export default AlgorithmOptimizationEngine; 
