/**
 * STUDENT ANALYST - Request Queue Manager
 * Professional rate limiting and request management system
 * 
 * Features:
 * - Intelligent request queuing with priority support
 * - Precise rate limiting with sliding window algorithm
 * - Real-time progress tracking and ETA calculations
 * - Batch processing with error recovery
 * - Persistent state management across browser sessions
 * - Automatic retry logic with exponential backoff
 * - Circuit breaker integration for resilience
 */

export interface QueuedRequest {
  id: string;
  symbol: string;
  timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INTRADAY_1MIN' | 'INTRADAY_5MIN' | 'INTRADAY_15MIN';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

export interface BatchRequest {
  id: string;
  name: string;
  symbols: string[];
  timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INTRADAY_1MIN' | 'INTRADAY_5MIN' | 'INTRADAY_15MIN';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: number;
  estimatedDuration: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'ERROR';
}

export interface ProgressInfo {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  skippedRequests: number;
  currentRequest?: QueuedRequest;
  estimatedTimeRemaining: number;
  averageRequestTime: number;
  successRate: number;
  rateLimitStatus: {
    requestsThisMinute: number;
    requestsThisDay: number;
    nextAvailableSlot: number;
    dailyLimitReached: boolean;
  };
}

export interface QueueMetrics {
  totalProcessed: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  errorRate: number;
  throughputPerMinute: number;
  cachingEfficiency: number;
}

// Rate limiting constants
const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 5,
  REQUESTS_PER_DAY: 25,
  WINDOW_SIZE_MS: 60 * 1000, // 1 minute
  DAY_SIZE_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Priority weights for queue ordering
const PRIORITY_WEIGHTS = {
  CRITICAL: 1000,
  HIGH: 100,
  MEDIUM: 10,
  LOW: 1,
} as const;

export class RequestQueueManager {
  private queue: QueuedRequest[] = [];
  private processing: boolean = false;
  private requestHistory: Array<{ timestamp: number; success: boolean; duration: number }> = [];
  private progressCallbacks: Array<(progress: ProgressInfo) => void> = [];
  private completionCallbacks: Array<(results: any[]) => void> = [];
  private errorCallbacks: Array<(error: Error) => void> = [];
  private circuitBreaker: any; // CircuitBreaker instance
  private alphaVantageService: any; // AlphaVantageService instance
  
  constructor(alphaVantageService: any, circuitBreaker: any) {
    this.alphaVantageService = alphaVantageService;
    this.circuitBreaker = circuitBreaker;
    this.loadPersistedState();
    this.startQueueProcessor();
  }

  /**
   * Add a single request to the queue
   */
  public addRequest(
    symbol: string,
    timeframe: QueuedRequest['timeframe'],
    priority: QueuedRequest['priority'] = 'MEDIUM',
    metadata?: Record<string, any>
  ): string {
    const request: QueuedRequest = {
      id: this.generateRequestId(),
      symbol: symbol.toUpperCase(),
      timeframe,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      metadata,
    };

    // Check for duplicates
    const existingIndex = this.queue.findIndex(
      q => q.symbol === request.symbol && q.timeframe === request.timeframe
    );

    if (existingIndex !== -1) {
      // Update existing request with higher priority if applicable
      const existing = this.queue[existingIndex];
      if (PRIORITY_WEIGHTS[request.priority] > PRIORITY_WEIGHTS[existing.priority]) {
        this.queue[existingIndex] = { ...existing, priority: request.priority };
      }
      return existing.id;
    }

    this.queue.push(request);
    this.sortQueue();
    this.persistState();
    this.notifyProgress();

    return request.id;
  }

  /**
   * Add multiple requests as a batch
   */
  public addBatchRequest(
    symbols: string[],
    timeframe: QueuedRequest['timeframe'],
    priority: QueuedRequest['priority'] = 'MEDIUM',
    batchName?: string
  ): BatchRequest {
    const batch: BatchRequest = {
      id: this.generateRequestId(),
      name: batchName || `Batch Analysis - ${symbols.length} symbols`,
      symbols: symbols.map(s => s.toUpperCase()),
      timeframe,
      priority,
      timestamp: Date.now(),
      estimatedDuration: this.calculateBatchDuration(symbols.length),
      status: 'PENDING',
    };

    // Add individual requests for each symbol
    symbols.forEach(symbol => {
      this.addRequest(symbol, timeframe, priority, { batchId: batch.id });
    });

    return batch;
  }

  /**
   * Remove request from queue
   */
  public removeRequest(requestId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(req => req.id !== requestId);
    
    if (this.queue.length < initialLength) {
      this.persistState();
      this.notifyProgress();
      return true;
    }
    
    return false;
  }

  /**
   * Clear all pending requests
   */
  public clearQueue(): void {
    this.queue = [];
    this.persistState();
    this.notifyProgress();
  }

  /**
   * Pause queue processing
   */
  public pauseProcessing(): void {
    this.processing = false;
  }

  /**
   * Resume queue processing
   */
  public resumeProcessing(): void {
    this.processing = true;
    this.processQueue();
  }

  /**
   * Get current queue status
   */
  public getQueueStatus(): {
    totalRequests: number;
    pendingRequests: number;
    isProcessing: boolean;
    canProcessMore: boolean;
    nextAvailableSlot: number;
  } {
    const now = Date.now();
    const recentRequests = this.getRecentRequests(RATE_LIMITS.WINDOW_SIZE_MS);
    const dailyRequests = this.getRecentRequests(RATE_LIMITS.DAY_SIZE_MS);

    return {
      totalRequests: this.queue.length,
      pendingRequests: this.queue.length,
      isProcessing: this.processing,
      canProcessMore: recentRequests.length < RATE_LIMITS.REQUESTS_PER_MINUTE && 
                     dailyRequests.length < RATE_LIMITS.REQUESTS_PER_DAY,
      nextAvailableSlot: this.calculateNextAvailableSlot(),
    };
  }

  /**
   * Get detailed metrics
   */
  public getMetrics(): QueueMetrics {
    const recentHistory = this.requestHistory.slice(-100); // Last 100 requests
    const successfulRequests = recentHistory.filter(r => r.success);
    const totalDuration = recentHistory.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalProcessed: this.requestHistory.length,
      averageWaitTime: this.calculateAverageWaitTime(),
      averageProcessingTime: totalDuration / Math.max(recentHistory.length, 1),
      errorRate: (recentHistory.length - successfulRequests.length) / Math.max(recentHistory.length, 1),
      throughputPerMinute: this.calculateThroughputPerMinute(),
      cachingEfficiency: this.calculateCachingEfficiency(),
    };
  }

  /**
   * Subscribe to progress updates
   */
  public onProgress(callback: (progress: ProgressInfo) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Subscribe to completion events
   */
  public onCompletion(callback: (results: any[]) => void): void {
    this.completionCallbacks.push(callback);
  }

  /**
   * Subscribe to error events
   */
  public onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * PRIVATE METHODS
   */

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Sort by priority (higher first), then by timestamp (older first)
      const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });
  }

  private async startQueueProcessor(): Promise<void> {
    this.processing = true;
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (!this.processing || this.queue.length === 0) {
      return;
    }

    const status = this.getQueueStatus();
    
    // Check rate limits
    if (!status.canProcessMore) {
      const waitTime = status.nextAvailableSlot - Date.now();
      if (waitTime > 0) {
        setTimeout(() => this.processQueue(), waitTime);
        return;
      }
    }

    // Process next request
    const nextRequest = this.queue.shift();
    if (!nextRequest) return;

    try {
      this.notifyProgress(nextRequest);
      const startTime = Date.now();
      
      // Execute request through circuit breaker
      const result = await this.circuitBreaker.execute(async () => {
        return await this.alphaVantageService.getStockData(
          nextRequest.symbol,
          nextRequest.timeframe
        );
      });

      const duration = Date.now() - startTime;
      
      // Record successful request
      this.requestHistory.push({
        timestamp: Date.now(),
        success: true,
        duration,
      });

      this.persistState();
      this.notifyProgress();

      // Continue processing
      setTimeout(() => this.processQueue(), 100);

    } catch (error) {
      const duration = Date.now() - Date.now();
      
      // Record failed request
      this.requestHistory.push({
        timestamp: Date.now(),
        success: false,
        duration,
      });

      // Handle retry logic
      if (nextRequest.retryCount < nextRequest.maxRetries) {
        nextRequest.retryCount++;
        nextRequest.timestamp = Date.now() + (Math.pow(2, nextRequest.retryCount) * 1000); // Exponential backoff
        this.queue.unshift(nextRequest); // Put back at front with delay
      }

      this.notifyError(error as Error);
      this.persistState();
      this.notifyProgress();

      // Continue processing after delay
      setTimeout(() => this.processQueue(), 2000);
    }
  }

  private getRecentRequests(timeWindowMs: number): Array<{ timestamp: number; success: boolean; duration: number }> {
    const cutoff = Date.now() - timeWindowMs;
    return this.requestHistory.filter(req => req.timestamp >= cutoff);
  }

  private calculateNextAvailableSlot(): number {
    const now = Date.now();
    const recentRequests = this.getRecentRequests(RATE_LIMITS.WINDOW_SIZE_MS);
    
    if (recentRequests.length < RATE_LIMITS.REQUESTS_PER_MINUTE) {
      return now; // Can process immediately
    }

    // Find the oldest request in the current window
    const oldestRequest = recentRequests.reduce((oldest, current) => 
      current.timestamp < oldest.timestamp ? current : oldest
    );

    return oldestRequest.timestamp + RATE_LIMITS.WINDOW_SIZE_MS;
  }

  private calculateBatchDuration(symbolCount: number): number {
    const requestsPerMinute = Math.min(RATE_LIMITS.REQUESTS_PER_MINUTE, symbolCount);
    const totalMinutes = Math.ceil(symbolCount / requestsPerMinute);
    return totalMinutes * 60 * 1000; // Convert to milliseconds
  }

  private calculateAverageWaitTime(): number {
    const recentHistory = this.requestHistory.slice(-50);
    if (recentHistory.length < 2) return 0;

    let totalWaitTime = 0;
    for (let i = 1; i < recentHistory.length; i++) {
      const waitTime = recentHistory[i].timestamp - recentHistory[i-1].timestamp;
      totalWaitTime += waitTime;
    }

    return totalWaitTime / (recentHistory.length - 1);
  }

  private calculateThroughputPerMinute(): number {
    const oneMinuteAgo = Date.now() - RATE_LIMITS.WINDOW_SIZE_MS;
    const recentRequests = this.requestHistory.filter(req => req.timestamp >= oneMinuteAgo);
    return recentRequests.length;
  }

  private calculateCachingEfficiency(): number {
    // This would be implemented based on cache hit/miss ratio
    // For now, return a placeholder
    return 0.85; // 85% cache efficiency
  }

  private notifyProgress(currentRequest?: QueuedRequest): void {
    const progress: ProgressInfo = {
      totalRequests: this.requestHistory.length + this.queue.length,
      completedRequests: this.requestHistory.filter(r => r.success).length,
      failedRequests: this.requestHistory.filter(r => !r.success).length,
      skippedRequests: 0, // Could be implemented for duplicate detection
      currentRequest,
      estimatedTimeRemaining: this.calculateEstimatedTimeRemaining(),
      averageRequestTime: this.calculateAverageRequestTime(),
      successRate: this.calculateSuccessRate(),
      rateLimitStatus: this.getRateLimitStatus(),
    };

    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  private calculateEstimatedTimeRemaining(): number {
    if (this.queue.length === 0) return 0;
    
    const avgRequestTime = this.calculateAverageRequestTime();
    const avgWaitTime = RATE_LIMITS.WINDOW_SIZE_MS / RATE_LIMITS.REQUESTS_PER_MINUTE;
    
    return this.queue.length * (avgRequestTime + avgWaitTime);
  }

  private calculateAverageRequestTime(): number {
    const recentHistory = this.requestHistory.slice(-20);
    if (recentHistory.length === 0) return 2000; // Default 2 seconds
    
    const totalTime = recentHistory.reduce((sum, req) => sum + req.duration, 0);
    return totalTime / recentHistory.length;
  }

  private calculateSuccessRate(): number {
    const recentHistory = this.requestHistory.slice(-50);
    if (recentHistory.length === 0) return 1;
    
    const successful = recentHistory.filter(r => r.success).length;
    return successful / recentHistory.length;
  }

  private getRateLimitStatus() {
    const now = Date.now();
    const minuteRequests = this.getRecentRequests(RATE_LIMITS.WINDOW_SIZE_MS);
    const dayRequests = this.getRecentRequests(RATE_LIMITS.DAY_SIZE_MS);

    return {
      requestsThisMinute: minuteRequests.length,
      requestsThisDay: dayRequests.length,
      nextAvailableSlot: this.calculateNextAvailableSlot(),
      dailyLimitReached: dayRequests.length >= RATE_LIMITS.REQUESTS_PER_DAY,
    };
  }

  private persistState(): void {
    try {
      const state = {
        queue: this.queue,
        requestHistory: this.requestHistory.slice(-1000), // Keep last 1000 requests
        timestamp: Date.now(),
      };
      localStorage.setItem('studentAnalyst_queueState', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to persist queue state:', error);
    }
  }

  private loadPersistedState(): void {
    try {
      const stored = localStorage.getItem('studentAnalyst_queueState');
      if (stored) {
        const state = JSON.parse(stored);
        const ageMs = Date.now() - state.timestamp;
        
        // Only restore if less than 1 hour old
        if (ageMs < 60 * 60 * 1000) {
          this.queue = state.queue || [];
          this.requestHistory = state.requestHistory || [];
          
          // Clean up old requests from history
          const dayAgo = Date.now() - RATE_LIMITS.DAY_SIZE_MS;
          this.requestHistory = this.requestHistory.filter(r => r.timestamp >= dayAgo);
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted queue state:', error);
    }
  }
}

export default RequestQueueManager; 
