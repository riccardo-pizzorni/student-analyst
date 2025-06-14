export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  lastUpdated: Date;
}

export interface CacheQualityMetrics extends CacheMetrics {}

export interface CacheValidationResult {
  isValid: boolean;
  lastValidated: Date;
  metrics: CacheQualityMetrics;
  issues?: CacheIssue[];
}

export interface CacheIssue {
  type: 'HIT_RATE_BELOW_THRESHOLD' | 'MEMORY_USAGE_ABOVE_THRESHOLD' | 'CACHE_TOO_OLD';
  message: string;
} 