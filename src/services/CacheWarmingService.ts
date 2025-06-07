/**
 * STUDENT ANALYST - Cache Warming Service
 * Intelligent preloading system for optimal cache performance
 */

import { cacheAnalyticsEngine, PredictiveInsights } from './CacheAnalyticsEngine';
import { cacheService } from './CacheService';

export interface WarmingTask {
  id: string;
  key: string;
  priority: 'high' | 'medium' | 'low';
  scheduledTime: number;
  estimatedBenefit: number;
  dataType: string;
  symbol?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  retryCount: number;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface WarmingConfiguration {
  enabled: boolean;
  maxConcurrentTasks: number;
  bandwidthThrottling: boolean;
  respectUserActivity: boolean;
  priorityWeights: {
    high: number;
    medium: number;
    low: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  constraints: {
    maxDailyWarming: number;
    quietHours: { start: number; end: number };
    minimumIdleTime: number; // ms of user inactivity before warming
  };
}

export interface WarmingStats {
  tasksCompleted: number;
  tasksFailed: number;
  totalTimeSaved: number;
  bandwidthUsed: number;
  hitRateImprovement: number;
  averageResponseTimeImprovement: number;
  lastWarmingSession: number;
  warmingEfficiency: number;
}

export class CacheWarmingService {
  private tasks: Map<string, WarmingTask> = new Map();
  private runningTasks: Set<string> = new Set();
  private config: WarmingConfiguration;
  private stats: WarmingStats;
  private userActivityTimer: number | null = null;
  private warmingInterval: number | null = null;
  private isUserActive = true;
  private lastUserActivity = Date.now();

  // Mock API functions (would be imported from actual API services)
  private apiMocks = {
    fetchStockData: async (symbol: string) => ({ symbol, price: Math.random() * 100, timestamp: Date.now() }),
    fetchFundamentals: async (symbol: string) => ({ symbol, pe: Math.random() * 30, timestamp: Date.now() }),
    fetchMarketData: async () => ({ market: 'SPY', price: Math.random() * 400, timestamp: Date.now() })
  };

  constructor() {
    this.config = this.getDefaultConfiguration();
    this.stats = this.initializeStats();
    this.setupUserActivityTracking();
    this.startWarmingLoop();
    this.setupInsightsListener();
  }

  private getDefaultConfiguration(): WarmingConfiguration {
    return {
      enabled: true,
      maxConcurrentTasks: 3,
      bandwidthThrottling: true,
      respectUserActivity: true,
      priorityWeights: {
        high: 1.0,
        medium: 0.6,
        low: 0.3
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      },
      constraints: {
        maxDailyWarming: 1000,
        quietHours: { start: 23, end: 6 }, // 11 PM to 6 AM
        minimumIdleTime: 30000 // 30 seconds
      }
    };
  }

  private initializeStats(): WarmingStats {
    return {
      tasksCompleted: 0,
      tasksFailed: 0,
      totalTimeSaved: 0,
      bandwidthUsed: 0,
      hitRateImprovement: 0,
      averageResponseTimeImprovement: 0,
      lastWarmingSession: 0,
      warmingEfficiency: 0
    };
  }

  /**
   * Schedule warming tasks based on predictive insights
   */
  scheduleWarmingTasks(insights: PredictiveInsights): void {
    if (!this.config.enabled) return;

    // Process likely next requests
    insights.likelyNextRequests.forEach(prediction => {
      const task: WarmingTask = {
        id: this.generateTaskId(),
        key: prediction.key,
        priority: prediction.priority,
        scheduledTime: prediction.suggestedPreloadTime,
        estimatedBenefit: prediction.probability,
        dataType: this.extractDataType(prediction.key),
        symbol: this.extractSymbol(prediction.key),
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now()
      };

      this.tasks.set(task.id, task);
    });

    // Process warming recommendations
    insights.warmingRecommendations.forEach(recommendation => {
      recommendation.symbols.forEach(symbol => {
        const key = `${recommendation.dataType}:${symbol}`;
        const task: WarmingTask = {
          id: this.generateTaskId(),
          key,
          priority: 'medium',
          scheduledTime: recommendation.timing,
          estimatedBenefit: 0.5, // Default benefit for recommendations
          dataType: recommendation.dataType,
          symbol,
          status: 'pending',
          retryCount: 0,
          createdAt: Date.now()
        };

        this.tasks.set(task.id, task);
      });
    });

    this.optimizeTaskQueue();
  }

  /**
   * Execute a warming task
   */
  private async executeWarmingTask(task: WarmingTask): Promise<void> {
    if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
      return; // Too many concurrent tasks
    }

    if (!this.canExecuteTask(task)) {
      return; // Constraints not met
    }

    this.runningTasks.add(task.id);
    task.status = 'running';

    try {
      const startTime = performance.now();
      
      // Determine appropriate API call based on data type
      const data = await this.fetchDataForTask(task);
      
      // Store in cache with appropriate TTL
      const ttl = this.getTTLForDataType(task.dataType);
      await cacheService.get(task.key, () => Promise.resolve(data), { ttl });
      
      const executionTime = performance.now() - startTime;
      
      // Update task status
      task.status = 'completed';
      task.completedAt = Date.now();
      
      // Update statistics
      this.updateStats(task, executionTime, true);
      
      console.log(`[Cache Warming] Successfully warmed cache for ${task.key} in ${executionTime.toFixed(2)}ms`);
      
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.retryCount++;
      
      this.updateStats(task, 0, false);
      
      console.warn(`[Cache Warming] Failed to warm cache for ${task.key}:`, error);
      
      // Schedule retry if within limits
      if (task.retryCount < this.config.retryPolicy.maxRetries) {
        task.scheduledTime = Date.now() + 
          (this.config.retryPolicy.initialDelay * Math.pow(this.config.retryPolicy.backoffMultiplier, task.retryCount));
        task.status = 'pending';
      }
      
    } finally {
      this.runningTasks.delete(task.id);
    }
  }

  private async fetchDataForTask(task: WarmingTask): Promise<any> {
    switch (task.dataType) {
      case 'stock-data':
        if (!task.symbol) throw new Error('Symbol required for stock data');
        return await this.apiMocks.fetchStockData(task.symbol);
      
      case 'fundamentals':
        if (!task.symbol) throw new Error('Symbol required for fundamentals');
        return await this.apiMocks.fetchFundamentals(task.symbol);
      
      case 'market-data':
        return await this.apiMocks.fetchMarketData();
      
      default:
        throw new Error(`Unknown data type: ${task.dataType}`);
    }
  }

  private getTTLForDataType(dataType: string): number {
    switch (dataType) {
      case 'stock-data': return 60 * 60 * 1000; // 1 hour
      case 'fundamentals': return 24 * 60 * 60 * 1000; // 24 hours
      case 'market-data': return 15 * 60 * 1000; // 15 minutes
      case 'analysis': return 30 * 60 * 1000; // 30 minutes
      default: return 60 * 60 * 1000; // Default 1 hour
    }
  }

  private canExecuteTask(task: WarmingTask): boolean {
    const now = Date.now();
    const currentHour = new Date(now).getHours();
    
    // Check if it's quiet hours
    if (this.isQuietHours(currentHour)) {
      return false;
    }
    
    // Check if user is active and we should respect that
    if (this.config.respectUserActivity && this.isUserActive) {
      return false;
    }
    
    // Check minimum idle time
    if ((now - this.lastUserActivity) < this.config.constraints.minimumIdleTime) {
      return false;
    }
    
    // Check daily warming limit
    if (this.getTodaysCompletedTasks() >= this.config.constraints.maxDailyWarming) {
      return false;
    }
    
    // Check if task is scheduled for execution
    if (task.scheduledTime > now) {
      return false;
    }
    
    return true;
  }

  private isQuietHours(hour: number): boolean {
    const { start, end } = this.config.constraints.quietHours;
    if (start > end) {
      // Overnight quiet hours (e.g., 23 to 6)
      return hour >= start || hour <= end;
    } else {
      // Same day quiet hours
      return hour >= start && hour <= end;
    }
  }

  private getTodaysCompletedTasks(): number {
    const today = new Date().toDateString();
    return Array.from(this.tasks.values())
      .filter(task => 
        task.status === 'completed' && 
        new Date(task.completedAt || 0).toDateString() === today
      ).length;
  }

  /**
   * Optimize task queue based on priority and constraints
   */
  private optimizeTaskQueue(): void {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => {
        // Sort by priority weight and estimated benefit
        const aPriority = this.config.priorityWeights[a.priority] * a.estimatedBenefit;
        const bPriority = this.config.priorityWeights[b.priority] * b.estimatedBenefit;
        return bPriority - aPriority;
      });

    // Remove old or low-value tasks if queue is too large
    const maxQueueSize = 100;
    if (pendingTasks.length > maxQueueSize) {
      const tasksToRemove = pendingTasks.slice(maxQueueSize);
      tasksToRemove.forEach(task => this.tasks.delete(task.id));
    }

    // Adjust scheduling based on bandwidth availability
    if (this.config.bandwidthThrottling) {
      this.adjustSchedulingForBandwidth(pendingTasks);
    }
  }

  private adjustSchedulingForBandwidth(tasks: WarmingTask[]): void {
    // Simple bandwidth-aware scheduling
    const baseDelay = 1000; // 1 second between tasks
    const now = Date.now();
    
    tasks.forEach((task, index) => {
      if (task.scheduledTime < now) {
        task.scheduledTime = now + (index * baseDelay);
      }
    });
  }

  /**
   * Main warming loop
   */
  private startWarmingLoop(): void {
    this.warmingInterval = window.setInterval(async () => {
      if (!this.config.enabled) return;

      const now = Date.now();
      const readyTasks = Array.from(this.tasks.values())
        .filter(task => 
          task.status === 'pending' && 
          task.scheduledTime <= now &&
          this.canExecuteTask(task)
        )
        .sort((a, b) => {
          const aPriority = this.config.priorityWeights[a.priority] * a.estimatedBenefit;
          const bPriority = this.config.priorityWeights[b.priority] * b.estimatedBenefit;
          return bPriority - aPriority;
        });

      // Execute tasks up to concurrent limit
      const tasksToExecute = readyTasks.slice(0, this.config.maxConcurrentTasks - this.runningTasks.size);
      
      for (const task of tasksToExecute) {
        this.executeWarmingTask(task).catch(error => {
          console.error('Error in warming task execution:', error);
        });
      }

      // Clean up old completed/failed tasks
      this.cleanupOldTasks();
      
    }, 5000); // Check every 5 seconds
  }

  /**
   * Setup user activity tracking
   */
  private setupUserActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleUserActivity = () => {
      this.isUserActive = true;
      this.lastUserActivity = Date.now();
      
      // Clear existing timer
      if (this.userActivityTimer) {
        clearTimeout(this.userActivityTimer);
      }
      
      // Set user as inactive after 30 seconds of no activity
      this.userActivityTimer = window.setTimeout(() => {
        this.isUserActive = false;
      }, 30000);
    };

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Initial setup
    handleUserActivity();
  }

  /**
   * Setup listener for analytics insights
   */
  private setupInsightsListener(): void {
    window.addEventListener('cache-insights-updated', (event) => {
      const insights = (event as CustomEvent).detail as PredictiveInsights;
      this.scheduleWarmingTasks(insights);
    });
  }

  /**
   * Update statistics
   */
  private updateStats(task: WarmingTask, executionTime: number, success: boolean): void {
    if (success) {
      this.stats.tasksCompleted++;
      this.stats.totalTimeSaved += Math.max(0, 2000 - executionTime); // Assume API takes 2000ms
      this.stats.bandwidthUsed += 1024; // Estimate 1KB per request
      this.stats.lastWarmingSession = Date.now();
    } else {
      this.stats.tasksFailed++;
    }
    
    // Calculate efficiency
    const totalTasks = this.stats.tasksCompleted + this.stats.tasksFailed;
    this.stats.warmingEfficiency = totalTasks > 0 ? (this.stats.tasksCompleted / totalTasks) * 100 : 0;
  }

  /**
   * Clean up old tasks
   */
  private cleanupOldTasks(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [id, task] of this.tasks) {
      if ((task.status === 'completed' || task.status === 'failed') && 
          (now - task.createdAt) > maxAge) {
        this.tasks.delete(id);
      }
    }
  }

  // Public API methods

  /**
   * Get warming statistics
   */
  getStats(): WarmingStats {
    return { ...this.stats };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): WarmingConfiguration {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<WarmingConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current tasks status
   */
  getTasksStatus(): {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    total: number;
  } {
    const tasks = Array.from(this.tasks.values());
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      total: tasks.length
    };
  }

  /**
   * Manually trigger cache warming for specific data
   */
  warmCache(dataType: string, symbols?: string[], priority: 'high' | 'medium' | 'low' = 'medium'): void {
    const now = Date.now();
    
    if (symbols) {
      symbols.forEach(symbol => {
        const key = `${dataType}:${symbol}`;
        const task: WarmingTask = {
          id: this.generateTaskId(),
          key,
          priority,
          scheduledTime: now + 1000, // 1 second delay
          estimatedBenefit: 0.8, // High benefit for manual warming
          dataType,
          symbol,
          status: 'pending',
          retryCount: 0,
          createdAt: now
        };
        
        this.tasks.set(task.id, task);
      });
    } else {
      const key = dataType;
      const task: WarmingTask = {
        id: this.generateTaskId(),
        key,
        priority,
        scheduledTime: now + 1000,
        estimatedBenefit: 0.8,
        dataType,
        status: 'pending',
        retryCount: 0,
        createdAt: now
      };
      
      this.tasks.set(task.id, task);
    }
  }

  /**
   * Clear all pending warming tasks
   */
  clearPendingTasks(): void {
    for (const [id, task] of this.tasks) {
      if (task.status === 'pending') {
        this.tasks.delete(id);
      }
    }
  }

  // Utility methods
  private generateTaskId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private extractDataType(key: string): string {
    return key.split(':')[0] || 'unknown';
  }

  private extractSymbol(key: string): string | undefined {
    return key.split(':')[1];
  }

  /**
   * Dispose of the service
   */
  dispose(): void {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
    }
    
    if (this.userActivityTimer) {
      clearTimeout(this.userActivityTimer);
    }
    
    // Clear all running tasks
    this.runningTasks.clear();
    this.tasks.clear();
  }
}

// Export singleton instance
export const cacheWarmingService = new CacheWarmingService();
