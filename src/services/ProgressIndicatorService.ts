/**
 * Universal Progress Indicator Service
 * Provides unified progress reporting, time estimation, and cancellation for all operations
 */

export interface ProgressUpdate {
  id: string;
  percentage: number;
  message: string;
  stage: string;
  startTime: number;
  lastUpdate: number;
  estimatedTimeRemaining?: number;
  canCancel: boolean;
  metadata?: Record<string, any>;
}

export interface ProgressSubscription {
  unsubscribe: () => void;
}

export type ProgressCallback = (update: ProgressUpdate) => void;

class ProgressIndicatorService {
  private activeOperations = new Map<string, ProgressUpdate>();
  private subscribers = new Map<string, Set<ProgressCallback>>();
  private globalSubscribers = new Set<ProgressCallback>();
  private operationStartTimes = new Map<string, number[]>();
  private cancellationCallbacks = new Map<string, () => void>();

  /**
   * Start a new progress operation
   */
  startOperation(
    id: string,
    initialMessage: string = 'Starting...',
    canCancel: boolean = true,
    metadata?: Record<string, any>
  ): void {
    const now = Date.now();
    
    const operation: ProgressUpdate = {
      id,
      percentage: 0,
      message: initialMessage,
      stage: 'initializing',
      startTime: now,
      lastUpdate: now,
      canCancel,
      metadata
    };

    this.activeOperations.set(id, operation);
    this.notifySubscribers(id, operation);
  }

  /**
   * Update progress for an operation
   */
  updateProgress(
    id: string,
    percentage: number,
    message?: string,
    stage?: string,
    metadata?: Record<string, any>
  ): void {
    const operation = this.activeOperations.get(id);
    if (!operation) return;

    const now = Date.now();
    const elapsed = now - operation.startTime;
    
    // Update operation
    operation.percentage = Math.min(100, Math.max(0, percentage));
    operation.lastUpdate = now;
    
    if (message) operation.message = message;
    if (stage) operation.stage = stage;
    if (metadata) operation.metadata = { ...operation.metadata, ...metadata };

    // Calculate estimated time remaining
    if (percentage > 0 && percentage < 100) {
      const estimatedTotal = (elapsed / percentage) * 100;
      operation.estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);
    }

    this.activeOperations.set(id, operation);
    this.notifySubscribers(id, operation);
  }

  /**
   * Complete an operation
   */
  completeOperation(id: string, finalMessage: string = 'Completed'): void {
    const operation = this.activeOperations.get(id);
    if (!operation) return;

    operation.percentage = 100;
    operation.message = finalMessage;
    operation.stage = 'completed';
    operation.lastUpdate = Date.now();
    operation.estimatedTimeRemaining = 0;

    this.notifySubscribers(id, operation);
    
    // Clean up after a short delay
    setTimeout(() => {
      this.removeOperation(id);
    }, 2000);
  }

  /**
   * Mark operation as failed
   */
  failOperation(id: string, errorMessage: string): void {
    const operation = this.activeOperations.get(id);
    if (!operation) return;

    operation.message = `Error: ${errorMessage}`;
    operation.stage = 'error';
    operation.lastUpdate = Date.now();
    operation.estimatedTimeRemaining = 0;

    this.notifySubscribers(id, operation);
    
    // Clean up after a delay
    setTimeout(() => {
      this.removeOperation(id);
    }, 5000);
  }

  /**
   * Cancel an operation
   */
  cancelOperation(id: string): boolean {
    const operation = this.activeOperations.get(id);
    if (!operation || !operation.canCancel) return false;

    const cancelCallback = this.cancellationCallbacks.get(id);
    if (cancelCallback) {
      try {
        cancelCallback();
      } catch (error) {
        console.error('Error during cancellation:', error);
      }
    }

    operation.message = 'Cancelled by user';
    operation.stage = 'cancelled';
    operation.lastUpdate = Date.now();
    operation.estimatedTimeRemaining = 0;

    this.notifySubscribers(id, operation);
    
    setTimeout(() => {
      this.removeOperation(id);
    }, 1000);

    return true;
  }

  /**
   * Set cancellation callback for an operation
   */
  setCancellationCallback(id: string, callback: () => void): void {
    this.cancellationCallbacks.set(id, callback);
  }

  /**
   * Subscribe to progress updates for a specific operation
   */
  subscribe(id: string, callback: ProgressCallback): ProgressSubscription {
    if (!this.subscribers.has(id)) {
      this.subscribers.set(id, new Set());
    }
    
    this.subscribers.get(id)!.add(callback);

    // Immediately notify with current state if operation exists
    const operation = this.activeOperations.get(id);
    if (operation) {
      callback(operation);
    }

    return {
      unsubscribe: () => {
        const operationSubscribers = this.subscribers.get(id);
        if (operationSubscribers) {
          operationSubscribers.delete(callback);
          if (operationSubscribers.size === 0) {
            this.subscribers.delete(id);
          }
        }
      }
    };
  }

  /**
   * Subscribe to all progress updates
   */
  subscribeToAll(callback: ProgressCallback): ProgressSubscription {
    this.globalSubscribers.add(callback);

    // Notify about all current operations
    this.activeOperations.forEach(operation => {
      callback(operation);
    });

    return {
      unsubscribe: () => {
        this.globalSubscribers.delete(callback);
      }
    };
  }

  /**
   * Get current progress for an operation
   */
  getProgress(id: string): ProgressUpdate | undefined {
    return this.activeOperations.get(id);
  }

  /**
   * Get all active operations
   */
  getAllOperations(): ProgressUpdate[] {
    return Array.from(this.activeOperations.values());
  }

  /**
   * Check if an operation is active
   */
  isOperationActive(id: string): boolean {
    return this.activeOperations.has(id);
  }

  /**
   * Remove an operation from tracking
   */
  private removeOperation(id: string): void {
    this.activeOperations.delete(id);
    this.subscribers.delete(id);
    this.cancellationCallbacks.delete(id);
    this.operationStartTimes.delete(id);
  }

  /**
   * Notify subscribers about progress update
   */
  private notifySubscribers(id: string, operation: ProgressUpdate): void {
    // Notify operation-specific subscribers
    const operationSubscribers = this.subscribers.get(id);
    if (operationSubscribers) {
      operationSubscribers.forEach(callback => {
        try {
          callback(operation);
        } catch (error) {
          console.error('Error in progress callback:', error);
        }
      });
    }

    // Notify global subscribers
    this.globalSubscribers.forEach(callback => {
      try {
        callback(operation);
      } catch (error) {
        console.error('Error in global progress callback:', error);
      }
    });
  }

  /**
   * Record historical timing data for better estimates
   */
  recordOperationTiming(operationType: string, duration: number): void {
    if (!this.operationStartTimes.has(operationType)) {
      this.operationStartTimes.set(operationType, []);
    }
    
    const timings = this.operationStartTimes.get(operationType)!;
    timings.push(duration);
    
    // Keep only last 10 timings
    if (timings.length > 10) {
      timings.shift();
    }
  }

  /**
   * Get estimated duration for operation type
   */
  getEstimatedDuration(operationType: string): number | undefined {
    const timings = this.operationStartTimes.get(operationType);
    if (!timings || timings.length === 0) return undefined;

    // Return median of recent timings
    const sorted = [...timings].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Format time duration for display
   */
  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) return 'Less than 1 second';
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return remainingSeconds > 0 
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Clear all operations (useful for cleanup)
   */
  clearAll(): void {
    this.activeOperations.clear();
    this.subscribers.clear();
    this.cancellationCallbacks.clear();
  }
}

// Export singleton instance
export const progressIndicatorService = new ProgressIndicatorService(); 
