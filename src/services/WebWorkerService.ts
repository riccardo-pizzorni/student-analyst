/**
 * Web Worker Service
 * Manages communication with Web Workers for intensive matrix calculations
 */

export interface WebWorkerTask {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  progress: number;
  message: string;
  startTime: number;
  endTime?: number;
  result?: any;
  error?: any;
}

export interface ProgressCallback {
  (task: WebWorkerTask): void;
}

export interface MatrixOptimizationParams {
  assets: Array<{
    symbol: string;
    expectedReturn: number;
    returns: number[];
    volatility: number;
  }>;
  method: 'min_variance' | 'max_sharpe';
  constraints?: {
    minWeight?: number;
    maxWeight?: number;
    riskFreeRate?: number;
  };
  riskFreeRate?: number;
}

export interface EfficientFrontierParams {
  assets: Array<{
    symbol: string;
    expectedReturn: number;
    returns: number[];
    volatility: number;
  }>;
  numPoints?: number;
  constraints?: {
    minWeight?: number;
    maxWeight?: number;
  };
}

export interface MatrixInversionParams {
  matrix: number[][];
  regularization?: number;
}

export interface CovarianceMatrixParams {
  returns: number[][];
  method?: 'sample' | 'exponential';
}

class WebWorkerService {
  private worker: Worker | null = null;
  private tasks: Map<string, WebWorkerTask> = new Map();
  private progressCallbacks: Map<string, ProgressCallback> = new Map();
  private isWorkerReady = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the Web Worker
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise((resolve, reject) => {
      try {
        console.log('🔧 Initializing Web Worker for matrix operations...');
        
        // Create worker from public directory
        this.worker = new Worker('/workers/matrixWorker.js');
        
        // Set up message handler
        this.worker.onmessage = (event) => {
          this.handleWorkerMessage(event.data);
        };
        
        // Set up error handler
        this.worker.onerror = (error) => {
          console.error('❌ Web Worker error:', error);
          reject(new Error(`Web Worker initialization failed: ${error.message}`));
        };
        
        // Wait for worker ready signal
        const readyTimeout = setTimeout(() => {
          reject(new Error('Web Worker initialization timeout'));
        }, 5000);
        
        const readyHandler = (event: MessageEvent) => {
          if (event.data.type === 'WORKER_READY') {
            clearTimeout(readyTimeout);
            this.isWorkerReady = true;
            console.log('✅ Web Worker initialized successfully');
            resolve();
          }
        };
        
        this.worker.addEventListener('message', readyHandler, { once: true });
        
      } catch (error) {
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  /**
   * Handle messages from Web Worker
   */
  private handleWorkerMessage(data: any): void {
    const { type, taskId } = data;
    
    switch (type) {
      case 'WORKER_READY':
        this.isWorkerReady = true;
        break;
        
      case 'TASK_STARTED':
        this.handleTaskStarted(taskId, data);
        break;
        
      case 'PROGRESS_UPDATE':
        this.handleProgressUpdate(taskId, data);
        break;
        
      case 'TASK_COMPLETED':
        this.handleTaskCompleted(taskId, data);
        break;
        
      case 'TASKerror':
        this.handleTaskError(taskId, data);
        break;
        
      case 'TASK_CANCELLED':
        this.handleTaskCancelled(taskId, data);
        break;
    }
  }

  /**
   * Handle task started event
   */
  private handleTaskStarted(taskId: string, data: any): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'running';
      task.message = `Started: ${data.taskName}`;
      
      const callback = this.progressCallbacks.get(taskId);
      if (callback) {
        callback(task);
      }
    }
  }

  /**
   * Handle progress update
   */
  private handleProgressUpdate(taskId: string, data: any): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.progress = data.progress;
      task.message = data.message;
      
      const callback = this.progressCallbacks.get(taskId);
      if (callback) {
        callback(task);
      }
    }
  }

  /**
   * Handle task completion
   */
  private handleTaskCompleted(taskId: string, data: any): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.progress = 100;
      task.message = 'Task completed successfully';
      task.endTime = Date.now();
      task.result = data.result;
      
      const callback = this.progressCallbacks.get(taskId);
      if (callback) {
        callback(task);
      }
      
      // Clean up callback
      this.progressCallbacks.delete(taskId);
    }
  }

  /**
   * Handle task error
   */
  private handleTaskError(taskId: string, data: any): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'error';
      task.message = `Error: ${data.error.message}`;
      task.endTime = Date.now();
      task.error = data.error;
      
      const callback = this.progressCallbacks.get(taskId);
      if (callback) {
        callback(task);
      }
      
      // Clean up callback
      this.progressCallbacks.delete(taskId);
    }
  }

  /**
   * Handle task cancellation
   */
  private handleTaskCancelled(taskId: string, data: any): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'cancelled';
      task.message = 'Task was cancelled';
      task.endTime = Date.now();
      
      const callback = this.progressCallbacks.get(taskId);
      if (callback) {
        callback(task);
      }
      
      // Clean up callback
      this.progressCallbacks.delete(taskId);
    }
  }

  /**
   * Create a new task
   */
  private createTask(type: string): WebWorkerTask {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: WebWorkerTask = {
      id: taskId,
      type,
      status: 'pending',
      progress: 0,
      message: 'Task created',
      startTime: Date.now()
    };
    
    this.tasks.set(taskId, task);
    return task;
  }

  /**
   * Send message to worker
   */
  private sendToWorker(type: string, taskId: string, payload: any): void {
    if (!this.worker || !this.isWorkerReady) {
      throw new Error('Web Worker is not ready');
    }
    
    this.worker.postMessage({
      type,
      taskId,
      payload
    });
  }

  /**
   * Portfolio optimization using Web Worker
   */
  async optimizePortfolio(
    params: MatrixOptimizationParams,
    progressCallback?: ProgressCallback
  ): Promise<{
    weights: number[];
    metrics: {
      expectedReturn: number;
      volatility: number;
      sharpeRatio: number;
    };
    processingTime: number;
  }> {
    await this.initialize();
    
    const task = this.createTask('PORTFOLIO_OPTIMIZATION');
    
    if (progressCallback) {
      this.progressCallbacks.set(task.id, progressCallback);
    }
    
    return new Promise((resolve, reject) => {
      // Set up completion handler
      const completionCallback = (completedTask: WebWorkerTask) => {
        if (completedTask.status === 'completed') {
          resolve(completedTask.result);
        } else if (completedTask.status === 'error') {
          reject(new Error(completedTask.error?.message || 'Optimization failed'));
        }
      };
      
      // Wrap the user callback to handle completion
      const wrappedCallback = (task: WebWorkerTask) => {
        if (progressCallback) {
          progressCallback(task);
        }
        
        if (task.status === 'completed' || task.status === 'error') {
          completionCallback(task);
        }
      };
      
      this.progressCallbacks.set(task.id, wrappedCallback);
      
      // Send task to worker
      this.sendToWorker('PORTFOLIO_OPTIMIZATION', task.id, params);
    });
  }

  /**
   * Efficient frontier calculation using Web Worker
   */
  async calculateEfficientFrontier(
    params: EfficientFrontierParams,
    progressCallback?: ProgressCallback
  ): Promise<{
    frontierPoints: Array<{
      risk: number;
      return: number;
      weights: number[];
      sharpeRatio: number;
    }>;
    numPoints: number;
    processingTime: number;
  }> {
    await this.initialize();
    
    const task = this.createTask('EFFICIENT_FRONTIER');
    
    if (progressCallback) {
      this.progressCallbacks.set(task.id, progressCallback);
    }
    
    return new Promise((resolve, reject) => {
      const completionCallback = (completedTask: WebWorkerTask) => {
        if (completedTask.status === 'completed') {
          resolve(completedTask.result);
        } else if (completedTask.status === 'error') {
          reject(new Error(completedTask.error?.message || 'Efficient frontier calculation failed'));
        }
      };
      
      const wrappedCallback = (task: WebWorkerTask) => {
        if (progressCallback) {
          progressCallback(task);
        }
        
        if (task.status === 'completed' || task.status === 'error') {
          completionCallback(task);
        }
      };
      
      this.progressCallbacks.set(task.id, wrappedCallback);
      this.sendToWorker('EFFICIENT_FRONTIER', task.id, params);
    });
  }

  /**
   * Matrix inversion using Web Worker
   */
  async invertMatrix(
    params: MatrixInversionParams,
    progressCallback?: ProgressCallback
  ): Promise<{
    invertedMatrix: number[][];
    processingTime: number;
  }> {
    await this.initialize();
    
    const task = this.createTask('MATRIXiNVERT');
    
    if (progressCallback) {
      this.progressCallbacks.set(task.id, progressCallback);
    }
    
    return new Promise((resolve, reject) => {
      const completionCallback = (completedTask: WebWorkerTask) => {
        if (completedTask.status === 'completed') {
          resolve(completedTask.result);
        } else if (completedTask.status === 'error') {
          reject(new Error(completedTask.error?.message || 'Matrix inversion failed'));
        }
      };
      
      const wrappedCallback = (task: WebWorkerTask) => {
        if (progressCallback) {
          progressCallback(task);
        }
        
        if (task.status === 'completed' || task.status === 'error') {
          completionCallback(task);
        }
      };
      
      this.progressCallbacks.set(task.id, wrappedCallback);
      this.sendToWorker('MATRIXiNVERT', task.id, params);
    });
  }

  /**
   * Covariance matrix calculation using Web Worker
   */
  async calculateCovarianceMatrix(
    params: CovarianceMatrixParams,
    progressCallback?: ProgressCallback
  ): Promise<{
    covarianceMatrix: number[][];
    dimension: number;
    processingTime: number;
  }> {
    await this.initialize();
    
    const task = this.createTask('COVARIANCE_MATRIX');
    
    if (progressCallback) {
      this.progressCallbacks.set(task.id, progressCallback);
    }
    
    return new Promise((resolve, reject) => {
      const completionCallback = (completedTask: WebWorkerTask) => {
        if (completedTask.status === 'completed') {
          resolve(completedTask.result);
        } else if (completedTask.status === 'error') {
          reject(new Error(completedTask.error?.message || 'Covariance matrix calculation failed'));
        }
      };
      
      const wrappedCallback = (task: WebWorkerTask) => {
        if (progressCallback) {
          progressCallback(task);
        }
        
        if (task.status === 'completed' || task.status === 'error') {
          completionCallback(task);
        }
      };
      
      this.progressCallbacks.set(task.id, wrappedCallback);
      this.sendToWorker('COVARIANCE_MATRIX', task.id, params);
    });
  }

  /**
   * Cancel a running task
   */
  cancelTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'running') {
      this.sendToWorker('CANCEL_TASK', taskId, { taskId });
      task.status = 'cancelled';
    }
  }

  /**
   * Get task status
   */
  getTask(taskId: string): WebWorkerTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): WebWorkerTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Clean up completed tasks
   */
  cleanupTasks(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.endTime && (now - task.endTime) > maxAge) {
        this.tasks.delete(taskId);
        this.progressCallbacks.delete(taskId);
      }
    }
  }

  /**
   * Terminate the Web Worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isWorkerReady = false;
      this.initializationPromise = null;
    }
    
    this.tasks.clear();
    this.progressCallbacks.clear();
  }

  /**
   * Get worker statistics
   */
  getStatistics(): {
    totalTasks: number;
    completedTasks: number;
    errorTasks: number;
    runningTasks: number;
    averageProcessingTime: number;
    isWorkerReady: boolean;
  } {
    const allTasks = Array.from(this.tasks.values());
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const errorTasks = allTasks.filter(t => t.status === 'error');
    const runningTasks = allTasks.filter(t => t.status === 'running');
    
    const avgProcessingTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          return sum + (task.endTime! - task.startTime);
        }, 0) / completedTasks.length
      : 0;
    
    return {
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      errorTasks: errorTasks.length,
      runningTasks: runningTasks.length,
      averageProcessingTime: avgProcessingTime,
      isWorkerReady: this.isWorkerReady
    };
  }
}

// Export singleton instance
export const webWorkerService = new WebWorkerService();
