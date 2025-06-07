/**
 * STUDENT ANALYST - Intelligent Retry Manager
 * Advanced retry logic with exponential backoff and user feedback
 */

import { AlphaVantageError, StockData } from './AlphaVantageService';
import { errorHandlingService, ErrorContext, ErrorResolution } from './ErrorHandlingService';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  enableNotifications?: boolean;
  onProgress?: (progress: RetryProgress) => void;
  onError?: (error: AlphaVantageError, resolution: ErrorResolution) => void;
  onSuccess?: (data: StockData, attemptCount: number) => void;
}

export interface RetryProgress {
  attemptNumber: number;
  maxRetries: number;
  nextRetryIn?: number; // seconds
  status: 'RETRYING' | 'WAITING' | 'FAILED' | 'SUCCESS';
  message: string;
  canCancel: boolean;
}

export interface RetryState {
  isActive: boolean;
  currentAttempt: number;
  maxRetries: number;
  nextRetryTime?: number;
  operation: string;
  context: ErrorContext;
}

export class RetryManager {
  private static instance: RetryManager;
  
  // Active retry operations
  private activeRetries = new Map<string, RetryState>();
  
  // Retry timers for cleanup
  private retryTimers = new Map<string, NodeJS.Timeout>();
  
  private constructor() {}
  
  public static getInstance(): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager();
    }
    return RetryManager.instance;
  }
  
  /**
   * Execute operation with intelligent retry logic
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options: RetryOptions = {}
  ): Promise<T> {
    const operationId = this.generateOperationId(context);
    
    const defaultOptions: Required<RetryOptions> = {
      maxRetries: 3,
      baseDelay: 1000,
      enableNotifications: true,
      onProgress: () => {},
      onError: () => {},
      onSuccess: () => {}
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    // Initialize retry state
    this.activeRetries.set(operationId, {
      isActive: true,
      currentAttempt: 1,
      maxRetries: finalOptions.maxRetries,
      operation: context.operation,
      context
    });
    
    try {
      return await this.executeAttempt(
        operation,
        operationId,
        context,
        finalOptions
      );
    } finally {
      this.cleanup(operationId);
    }
  }
  
  /**
   * Execute a single attempt with retry logic
   */
  private async executeAttempt<T>(
    operation: () => Promise<T>,
    operationId: string,
    context: ErrorContext,
    options: Required<RetryOptions>
  ): Promise<T> {
    const retryState = this.activeRetries.get(operationId);
    if (!retryState) {
      throw new Error('Retry state not found');
    }
    
         try {
       // Notify progress
      this.notifyProgress(operationId, options.onProgress, {
        attemptNumber: retryState.currentAttempt,
        maxRetries: retryState.maxRetries,
        status: 'RETRYING',
        message: retryState.currentAttempt === 1 
          ? `Executing ${context.operation}...`
          : `Retry attempt ${retryState.currentAttempt}/${retryState.maxRetries}...`,
        canCancel: true
      });
      
      // Execute operation
      const result = await operation();
      
      // Success - notify and return
      this.notifyProgress(operationId, options.onProgress, {
        attemptNumber: retryState.currentAttempt,
        maxRetries: retryState.maxRetries,
        status: 'SUCCESS',
        message: 'Operation completed successfully',
        canCancel: false
      });
      
      options.onSuccess(result as StockData, retryState.currentAttempt);
      return result;
      
    } catch (error) {
      return this.handleRetryError(
        error as AlphaVantageError,
        operationId,
        operation,
        context,
        options
      );
    }
  }
  
  /**
   * Handle retry error logic
   */
  private async handleRetryError<T>(
    error: AlphaVantageError,
    operationId: string,
    operation: () => Promise<T>,
    context: ErrorContext,
    options: Required<RetryOptions>
  ): Promise<T> {
    const retryState = this.activeRetries.get(operationId);
    if (!retryState) {
      throw error;
    }
    
    // Get error resolution from error handling service
    const currentContext = {
      ...context,
      attemptNumber: retryState.currentAttempt,
      maxRetries: retryState.maxRetries
    };
    
    const resolution = errorHandlingService.processError(error, currentContext);
    
    // Notify error
    options.onError(error, resolution);
    
    // Check if we should retry
    const shouldRetry = resolution.canRetry && 
                       retryState.currentAttempt < retryState.maxRetries &&
                       errorHandlingService.shouldRetry(error, currentContext);
    
    if (!shouldRetry) {
      // No more retries - notify failure and throw
      this.notifyProgress(operationId, options.onProgress, {
        attemptNumber: retryState.currentAttempt,
        maxRetries: retryState.maxRetries,
        status: 'FAILED',
        message: resolution.userMessage,
        canCancel: false
      });
      
      throw error;
    }
    
    // Calculate retry delay
    const strategy = errorHandlingService.getRetryStrategy(error.type);
    const retryDelay = strategy 
      ? errorHandlingService.calculateRetryDelay(strategy, retryState.currentAttempt)
      : (resolution.retryAfter || 5) * 1000;
    
    // Update retry state
    retryState.currentAttempt++;
    retryState.nextRetryTime = Date.now() + retryDelay;
    
    // Notify waiting status
    this.notifyProgress(operationId, options.onProgress, {
      attemptNumber: retryState.currentAttempt - 1,
      maxRetries: retryState.maxRetries,
      nextRetryIn: Math.ceil(retryDelay / 1000),
      status: 'WAITING',
      message: `${resolution.userMessage} Retrying in ${Math.ceil(retryDelay / 1000)} seconds...`,
      canCancel: true
    });
    
    // Schedule retry
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          const result = await this.executeAttempt(
            operation,
            operationId,
            context,
            options
          );
          resolve(result);
        } catch (retryError) {
          reject(retryError);
        }
      }, retryDelay);
      
      this.retryTimers.set(operationId, timer);
    });
  }
  
  /**
   * Cancel an active retry operation
   */
  public cancelRetry(operationId: string): boolean {
    const retryState = this.activeRetries.get(operationId);
    if (!retryState) {
      return false;
    }
    
    // Clear timer if exists
    const timer = this.retryTimers.get(operationId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(operationId);
    }
    
    // Remove from active retries
    this.activeRetries.delete(operationId);
    
    return true;
  }
  
  /**
   * Get all active retry operations
   */
  public getActiveRetries(): Array<{
    operationId: string;
    state: RetryState;
  }> {
    return Array.from(this.activeRetries.entries()).map(([id, state]) => ({
      operationId: id,
      state
    }));
  }
  
  /**
   * Get retry state for specific operation
   */
  public getRetryState(operationId: string): RetryState | null {
    return this.activeRetries.get(operationId) || null;
  }
  
  /**
   * Check if operation is currently being retried
   */
  public isRetrying(operationId: string): boolean {
    return this.activeRetries.has(operationId);
  }
  
  /**
   * Generate unique operation ID
   */
  private generateOperationId(context: ErrorContext): string {
    return `${context.operation}_${context.symbol || 'unknown'}_${context.timestamp}`;
  }
  
  /**
   * Notify progress callback with error handling
   */
  private notifyProgress(
    operationId: string,
    callback: (progress: RetryProgress) => void,
    progress: RetryProgress
  ): void {
    try {
      callback(progress);
    } catch (error) {
      console.warn(`Error in retry progress callback for ${operationId}:`, error);
    }
  }
  
  /**
   * Cleanup retry resources
   */
  private cleanup(operationId: string): void {
    // Clear timer
    const timer = this.retryTimers.get(operationId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(operationId);
    }
    
    // Remove from active retries
    this.activeRetries.delete(operationId);
  }
  
  /**
   * Clean up all active retries (useful for component unmount)
   */
  public cleanupAll(): void {
    // Clear all timers
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }
    
    // Clear all maps
    this.retryTimers.clear();
    this.activeRetries.clear();
  }
  
  /**
   * Get retry statistics
   */
  public getRetryStats(): {
    activeRetries: number;
    totalOperations: number;
    avgRetryCount: number;
  } {
    const activeRetries = this.activeRetries.size;
    const totalOperations = this.activeRetries.size;
    
    let totalRetries = 0;
    for (const state of this.activeRetries.values()) {
      totalRetries += state.currentAttempt;
    }
    
    return {
      activeRetries,
      totalOperations,
      avgRetryCount: totalOperations > 0 ? totalRetries / totalOperations : 0
    };
  }
}

// Export singleton instance
export const retryManager = RetryManager.getInstance();
export default RetryManager; 
