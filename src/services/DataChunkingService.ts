/**
 * Data Chunking Service
 * Handles large datasets (>100 assets) by splitting them into manageable chunks
 * Provides progressive calculation display and memory usage monitoring
 */

import { webWorkerService, WebWorkerTask, ProgressCallback } from './WebWorkerService';

export interface ChunkingConfig {
  maxChunkSize: number;
  parallelChunks: number;
  progressReportingInterval: number;
  memoryThresholdMB: number;
}

export interface ChunkProgress {
  chunkIndex: number;
  totalChunks: number;
  chunkProgress: number;
  overallProgress: number;
  currentChunkSize: number;
  processedAssets: number;
  totalAssets: number;
  estimatedTimeRemaining: number;
  memoryUsageMB: number;
  stage: 'preparing' | 'processing' | 'merging' | 'completed';
  message: string;
}

export interface ChunkingResult {
  success: boolean;
  results: any[];
  totalProcessingTime: number;
  averageChunkTime: number;
  maxMemoryUsageMB: number;
  chunksProcessed: number;
  assetsProcessed: number;
}

export interface ChunkProgressCallback {
  (progress: ChunkProgress): void;
}

export interface AssetData {
  symbol: string;
  expectedReturn: number;
  returns: number[];
  volatility: number;
  sector?: string;
  marketCap?: number;
}

class DataChunkingService {
  private isProcessing = false;
  private currentOperation: string | null = null;
  private cancellationRequested = false;
  private startTime = 0;
  private chunkTimes: number[] = [];

  private readonly DEFAULT_CONFIG: ChunkingConfig = {
    maxChunkSize: 25,        // Maximum assets per chunk
    parallelChunks: 1,       // Number of chunks to process in parallel
    progressReportingInterval: 500, // Progress update interval in ms
    memoryThresholdMB: 512   // Memory threshold in MB
  };

  /**
   * Process large portfolio optimization with chunking
   */
  async optimizePortfolioChunked(
    assets: AssetData[],
    method: 'min_variance' | 'max_sharpe',
    constraints: any = {},
    config: Partial<ChunkingConfig> = {},
    progressCallback?: ChunkProgressCallback
  ): Promise<ChunkingResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    if (assets.length <= finalConfig.maxChunkSize) {
      // Small dataset, process normally
      return this.processSingleBatch(assets, method, constraints, progressCallback);
    }

    return this.processLargeDataset(assets, method, constraints, finalConfig, progressCallback);
  }

  /**
   * Calculate efficient frontier with chunking for large datasets
   */
  async calculateEfficientFrontierChunked(
    assets: AssetData[],
    numPoints: number = 50,
    constraints: any = {},
    config: Partial<ChunkingConfig> = {},
    progressCallback?: ChunkProgressCallback
  ): Promise<ChunkingResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    if (assets.length <= finalConfig.maxChunkSize) {
      return this.processSingleFrontierBatch(assets, numPoints, constraints, progressCallback);
    }

    return this.processFrontierLargeDataset(assets, numPoints, constraints, finalConfig, progressCallback);
  }

  /**
   * Process large dataset with chunking strategy
   */
  private async processLargeDataset(
    assets: AssetData[],
    method: 'min_variance' | 'max_sharpe',
    constraints: any,
    config: ChunkingConfig,
    progressCallback?: ChunkProgressCallback
  ): Promise<ChunkingResult> {
    this.startOperation('Portfolio Optimization (Chunked)');
    
    try {
      // Phase 1: Prepare chunks
      this.reportProgress(progressCallback, {
        chunkIndex: 0,
        totalChunks: 0,
        chunkProgress: 0,
        overallProgress: 5,
        currentChunkSize: 0,
        processedAssets: 0,
        totalAssets: assets.length,
        estimatedTimeRemaining: 0,
        memoryUsageMB: this.getMemoryUsage(),
        stage: 'preparing',
        message: `Preparing to process ${assets.length} assets in chunks...`
      });

      const chunks = this.createChunks(assets, config.maxChunkSize);
      const totalChunks = chunks.length;

      console.log(`📊 Processing ${assets.length} assets in ${totalChunks} chunks (max ${config.maxChunkSize} per chunk)`);

      // Phase 2: Process chunks sequentially with progress tracking
      const chunkResults: any[] = [];
      let processedAssets = 0;

      for (let i = 0; i < chunks.length; i++) {
        if (this.cancellationRequested) {
          throw new Error('Operation cancelled by user');
        }

        const chunk = chunks[i];
        const chunkStartTime = performance.now();

        // Report chunk start
        this.reportProgress(progressCallback, {
          chunkIndex: i + 1,
          totalChunks,
          chunkProgress: 0,
          overallProgress: 10 + (i / totalChunks) * 70,
          currentChunkSize: chunk.length,
          processedAssets,
          totalAssets: assets.length,
          estimatedTimeRemaining: this.estimateTimeRemaining(i, totalChunks),
          memoryUsageMB: this.getMemoryUsage(),
          stage: 'processing',
          message: `Processing chunk ${i + 1}/${totalChunks} (${chunk.length} assets)...`
        });

        // Process chunk with individual progress tracking
        const chunkProgressCallback = (task: WebWorkerTask) => {
          this.reportProgress(progressCallback, {
            chunkIndex: i + 1,
            totalChunks,
            chunkProgress: task.progress,
            overallProgress: 10 + (i / totalChunks) * 70 + (task.progress / 100) * (70 / totalChunks),
            currentChunkSize: chunk.length,
            processedAssets,
            totalAssets: assets.length,
            estimatedTimeRemaining: this.estimateTimeRemaining(i, totalChunks),
            memoryUsageMB: this.getMemoryUsage(),
            stage: 'processing',
            message: `Chunk ${i + 1}/${totalChunks}: ${task.message}`
          });
        };

        const chunkResult = await webWorkerService.optimizePortfolio({
          assets: chunk,
          method,
          constraints
        }, chunkProgressCallback);

        const chunkTime = performance.now() - chunkStartTime;
        this.chunkTimes.push(chunkTime);
        chunkResults.push(chunkResult);
        processedAssets += chunk.length;

        // Memory cleanup between chunks
        if (this.getMemoryUsage() > config.memoryThresholdMB) {
          await this.performMemoryCleanup();
        }
      }

      // Phase 3: Merge results
      this.reportProgress(progressCallback, {
        chunkIndex: totalChunks,
        totalChunks,
        chunkProgress: 100,
        overallProgress: 85,
        currentChunkSize: 0,
        processedAssets: assets.length,
        totalAssets: assets.length,
        estimatedTimeRemaining: 0,
        memoryUsageMB: this.getMemoryUsage(),
        stage: 'merging',
        message: 'Merging chunk results...'
      });

      const mergedResult = this.mergeOptimizationResults(chunkResults, assets);

      // Phase 4: Complete
      this.reportProgress(progressCallback, {
        chunkIndex: totalChunks,
        totalChunks,
        chunkProgress: 100,
        overallProgress: 100,
        currentChunkSize: 0,
        processedAssets: assets.length,
        totalAssets: assets.length,
        estimatedTimeRemaining: 0,
        memoryUsageMB: this.getMemoryUsage(),
        stage: 'completed',
        message: 'Portfolio optimization completed successfully!'
      });

      return {
        success: true,
        results: [mergedResult],
        totalProcessingTime: this.getOperationTime(),
        averageChunkTime: this.chunkTimes.reduce((a, b) => a + b, 0) / this.chunkTimes.length,
        maxMemoryUsageMB: Math.max(...this.chunkTimes.map(() => this.getMemoryUsage())),
        chunksProcessed: totalChunks,
        assetsProcessed: assets.length
      };

    } catch (error) {
      console.error('❌ Chunked optimization failed:', error);
      throw error;
    } finally {
      this.endOperation();
    }
  }

  /**
   * Process efficient frontier for large datasets
   */
  private async processFrontierLargeDataset(
    assets: AssetData[],
    numPoints: number,
    constraints: any,
    config: ChunkingConfig,
    progressCallback?: ChunkProgressCallback
  ): Promise<ChunkingResult> {
    this.startOperation('Efficient Frontier (Chunked)');
    
    try {
      // For efficient frontier, we need to sample assets strategically
      const sampledAssets = this.strategicAssetSampling(assets, config.maxChunkSize);
      
      this.reportProgress(progressCallback, {
        chunkIndex: 1,
        totalChunks: 1,
        chunkProgress: 0,
        overallProgress: 10,
        currentChunkSize: sampledAssets.length,
        processedAssets: 0,
        totalAssets: assets.length,
        estimatedTimeRemaining: 0,
        memoryUsageMB: this.getMemoryUsage(),
        stage: 'processing',
        message: `Calculating efficient frontier with ${sampledAssets.length} representative assets...`
      });

      const frontierProgressCallback = (task: WebWorkerTask) => {
        this.reportProgress(progressCallback, {
          chunkIndex: 1,
          totalChunks: 1,
          chunkProgress: task.progress,
          overallProgress: 10 + (task.progress * 0.8),
          currentChunkSize: sampledAssets.length,
          processedAssets: Math.floor((task.progress / 100) * assets.length),
          totalAssets: assets.length,
          estimatedTimeRemaining: 0,
          memoryUsageMB: this.getMemoryUsage(),
          stage: 'processing',
          message: task.message
        });
      };

      const result = await webWorkerService.calculateEfficientFrontier({
        assets: sampledAssets,
        numPoints,
        constraints
      }, frontierProgressCallback);

      this.reportProgress(progressCallback, {
        chunkIndex: 1,
        totalChunks: 1,
        chunkProgress: 100,
        overallProgress: 100,
        currentChunkSize: sampledAssets.length,
        processedAssets: assets.length,
        totalAssets: assets.length,
        estimatedTimeRemaining: 0,
        memoryUsageMB: this.getMemoryUsage(),
        stage: 'completed',
        message: 'Efficient frontier completed!'
      });

      return {
        success: true,
        results: [result],
        totalProcessingTime: this.getOperationTime(),
        averageChunkTime: this.getOperationTime(),
        maxMemoryUsageMB: this.getMemoryUsage(),
        chunksProcessed: 1,
        assetsProcessed: assets.length
      };

    } catch (error) {
      console.error('❌ Chunked frontier calculation failed:', error);
      throw error;
    } finally {
      this.endOperation();
    }
  }

  /**
   * Process small dataset without chunking
   */
  private async processSingleBatch(
    assets: AssetData[],
    method: 'min_variance' | 'max_sharpe',
    constraints: any,
    progressCallback?: ChunkProgressCallback
  ): Promise<ChunkingResult> {
    this.startOperation('Portfolio Optimization (Single Batch)');

    try {
      const workerProgressCallback = (task: WebWorkerTask) => {
        this.reportProgress(progressCallback, {
          chunkIndex: 1,
          totalChunks: 1,
          chunkProgress: task.progress,
          overallProgress: task.progress,
          currentChunkSize: assets.length,
          processedAssets: Math.floor((task.progress / 100) * assets.length),
          totalAssets: assets.length,
          estimatedTimeRemaining: 0,
          memoryUsageMB: this.getMemoryUsage(),
          stage: 'processing',
          message: task.message
        });
      };

      const result = await webWorkerService.optimizePortfolio({
        assets,
        method,
        constraints
      }, workerProgressCallback);

      return {
        success: true,
        results: [result],
        totalProcessingTime: this.getOperationTime(),
        averageChunkTime: this.getOperationTime(),
        maxMemoryUsageMB: this.getMemoryUsage(),
        chunksProcessed: 1,
        assetsProcessed: assets.length
      };

    } finally {
      this.endOperation();
    }
  }

  /**
   * Process efficient frontier for small dataset
   */
  private async processSingleFrontierBatch(
    assets: AssetData[],
    numPoints: number,
    constraints: any,
    progressCallback?: ChunkProgressCallback
  ): Promise<ChunkingResult> {
    this.startOperation('Efficient Frontier (Single Batch)');

    try {
      const workerProgressCallback = (task: WebWorkerTask) => {
        this.reportProgress(progressCallback, {
          chunkIndex: 1,
          totalChunks: 1,
          chunkProgress: task.progress,
          overallProgress: task.progress,
          currentChunkSize: assets.length,
          processedAssets: Math.floor((task.progress / 100) * assets.length),
          totalAssets: assets.length,
          estimatedTimeRemaining: 0,
          memoryUsageMB: this.getMemoryUsage(),
          stage: 'processing',
          message: task.message
        });
      };

      const result = await webWorkerService.calculateEfficientFrontier({
        assets,
        numPoints,
        constraints
      }, workerProgressCallback);

      return {
        success: true,
        results: [result],
        totalProcessingTime: this.getOperationTime(),
        averageChunkTime: this.getOperationTime(),
        maxMemoryUsageMB: this.getMemoryUsage(),
        chunksProcessed: 1,
        assetsProcessed: assets.length
      };

    } finally {
      this.endOperation();
    }
  }

  /**
   * Create chunks from asset array
   */
  private createChunks(assets: AssetData[], maxChunkSize: number): AssetData[][] {
    const chunks: AssetData[][] = [];
    
    // Sort assets by market cap (if available) for better chunk distribution
    const sortedAssets = [...assets].sort((a, b) => {
      if (a.marketCap && b.marketCap) {
        return b.marketCap - a.marketCap; // Descending order
      }
      return 0;
    });

    for (let i = 0; i < sortedAssets.length; i += maxChunkSize) {
      chunks.push(sortedAssets.slice(i, i + maxChunkSize));
    }

    return chunks;
  }

  /**
   * Strategic asset sampling for efficient frontier
   */
  private strategicAssetSampling(assets: AssetData[], targetSize: number): AssetData[] {
    if (assets.length <= targetSize) {
      return assets;
    }

    // Sample across different sectors and risk profiles
    const sortedByReturn = [...assets].sort((a, b) => b.expectedReturn - a.expectedReturn);
    const sortedByVolatility = [...assets].sort((a, b) => a.volatility - b.volatility);
    
    const sampled = new Set<AssetData>();
    const step = Math.floor(assets.length / targetSize);

    // Sample high return assets
    for (let i = 0; i < Math.floor(targetSize / 3) && i < sortedByReturn.length; i += step || 1) {
      sampled.add(sortedByReturn[i]);
    }

    // Sample low volatility assets
    for (let i = 0; i < Math.floor(targetSize / 3) && i < sortedByVolatility.length; i += step || 1) {
      sampled.add(sortedByVolatility[i]);
    }

    // Sample remaining randomly
    const remaining = assets.filter(asset => !sampled.has(asset));
    while (sampled.size < targetSize && remaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      sampled.add(remaining.splice(randomIndex, 1)[0]);
    }

    return Array.from(sampled);
  }

  /**
   * Merge optimization results from multiple chunks
   */
  private mergeOptimizationResults(chunkResults: any[], originalAssets: AssetData[]): any {
    // For portfolio optimization, we need to combine weights properly
    const combinedWeights = new Array(originalAssets.length).fill(0);
    let totalWeight = 0;

    // Map chunk results back to original asset positions
    let assetIndex = 0;
    for (const chunkResult of chunkResults) {
      for (let i = 0; i < chunkResult.weights.length; i++) {
        combinedWeights[assetIndex] = chunkResult.weights[i];
        totalWeight += chunkResult.weights[i];
        assetIndex++;
      }
    }

    // Normalize weights to sum to 1
    if (totalWeight > 0) {
      for (let i = 0; i < combinedWeights.length; i++) {
        combinedWeights[i] /= totalWeight;
      }
    }

    // Calculate combined metrics
    const expectedReturn = combinedWeights.reduce((sum, weight, i) => {
      return sum + weight * originalAssets[i].expectedReturn;
    }, 0);

    // Simplified volatility calculation (would need full covariance matrix for exact calculation)
    const weightedVolatility = combinedWeights.reduce((sum, weight, i) => {
      return sum + Math.pow(weight * originalAssets[i].volatility, 2);
    }, 0);
    const volatility = Math.sqrt(weightedVolatility);

    const sharpeRatio = volatility > 0 ? (expectedReturn - 0.02) / volatility : 0;

    return {
      weights: combinedWeights,
      metrics: {
        expectedReturn,
        volatility,
        sharpeRatio
      },
      assets: originalAssets.map((asset) => ({
        symbol: asset.symbol,
        weight: combinedWeights[i]
      }))
    };
  }

  /**
   * Estimate time remaining based on chunk processing history
   */
  private estimateTimeRemaining(completedChunks: number, totalChunks: number): number {
    if (completedChunks === 0 || this.chunkTimes.length === 0) {
      return 0;
    }

    const averageChunkTime = this.chunkTimes.reduce((a, b) => a + b, 0) / this.chunkTimes.length;
    const remainingChunks = totalChunks - completedChunks;
    return (remainingChunks * averageChunkTime) / 1000; // Return in seconds
  }

  /**
   * Get current memory usage (simplified estimation)
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0; // Fallback if memory API not available
  }

  /**
   * Perform memory cleanup between chunks
   */
  private async performMemoryCleanup(): Promise<void> {
    // Force garbage collection if available
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
    
    // Small delay to allow cleanup
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Report progress to callback
   */
  private reportProgress(callback: ChunkProgressCallback | undefined, progress: ChunkProgress): void {
    if (callback) {
      callback(progress);
    }
  }

  /**
   * Cancel current operation
   */
  cancelOperation(): void {
    this.cancellationRequested = true;
    console.log('🛑 Chunking operation cancellation requested');
  }

  /**
   * Check if operation is currently running
   */
  isOperationRunning(): boolean {
    return this.isProcessing;
  }

  /**
   * Get current operation name
   */
  getCurrentOperation(): string | null {
    return this.currentOperation;
  }

  /**
   * Start operation tracking
   */
  private startOperation(operationName: string): void {
    this.isProcessing = true;
    this.currentOperation = operationName;
    this.cancellationRequested = false;
    this.startTime = performance.now();
    this.chunkTimes = [];
    console.log(`🚀 Starting chunked operation: ${operationName}`);
  }

  /**
   * End operation tracking
   */
  private endOperation(): void {
    this.isProcessing = false;
    this.currentOperation = null;
    this.cancellationRequested = false;
    const totalTime = this.getOperationTime();
    console.log(`✅ Chunked operation completed in ${totalTime.toFixed(2)}ms`);
  }

  /**
   * Get operation processing time
   */
  private getOperationTime(): number {
    return this.startTime ? performance.now() - this.startTime : 0;
  }
}

// Export singleton instance
export const dataChunkingService = new DataChunkingService();
