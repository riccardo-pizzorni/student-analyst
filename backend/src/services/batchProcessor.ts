/**
 * STUDENT ANALYST - Batch Processor
 * ================================
 *
 * Servizio per elaborazione batch di richieste finanziarie.
 * Integra ApiRateLimiter con AlphaVantageService per gestione ottimale
 * di richieste multiple rispettando i limiti API.
 */

import { EventEmitter } from 'events';
import {
  AlphaVantageService,
  AlphaVantageTimeframe,
} from './alphaVantageService';
import {
  ApiRateLimiter,
  ProgressEvent,
  RateLimitStats,
  RateLimiterConfig,
} from './apiRateLimiter';
import { ErrorCodeHandler } from './errorCodeHandler';

/**
 * Configurazione batch processor
 */
export interface BatchProcessorConfig {
  maxConcurrentBatches: number;
  defaultBatchSize: number;
  priorityTimeframe: AlphaVantageTimeframe;
  enableProgressTracking: boolean;
  enableAutoRetry: boolean;
  cacheFirstStrategy: boolean;
  enableLogging: boolean; // Aggiunto per coerenza
  rateLimiterConfig: Partial<RateLimiterConfig>;
}

/**
 * Richiesta batch
 */
export interface BatchRequest {
  symbols: string[];
  timeframe: AlphaVantageTimeframe;
  options?: {
    outputSize?: 'compact' | 'full';
    adjusted?: boolean;
    month?: string;
    useCache?: boolean;
  };
  priority?: number;
  batchId?: string;
}

/**
 * Risultato batch
 */
export interface BatchResult {
  batchId: string;
  success: boolean;
  totalSymbols: number;
  successfulSymbols: number;
  failedSymbols: number;
  cacheHits: number;
  apiCalls: number;
  executionTimeMs: number;
  results: Map<string, unknown>;
  errors: Map<string, Error>;
  rateLimitStats: RateLimitStats;
}

/**
 * Stato elaborazione batch
 */
export interface BatchStatus {
  batchId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    completed: number;
    total: number;
    percentage: number;
    currentSymbol?: string;
    estimatedTimeRemainingMs: number;
    failed: number;
  };
  startTime: Date;
  endTime?: Date;
  errors: Array<{ symbol: string; error: string }>;
}

/**
 * Processor per elaborazione batch ottimizzata
 */
export class BatchProcessor extends EventEmitter {
  private config: BatchProcessorConfig;
  private rateLimiter: ApiRateLimiter;
  private alphaVantageService: AlphaVantageService;
  private activeBatches: Map<string, BatchStatus> = new Map();
  private completedBatches: Map<string, BatchResult> = new Map();
  private errorHandler: ErrorCodeHandler;

  constructor(
    alphaVantageService: AlphaVantageService,
    config: Partial<BatchProcessorConfig> = {}
  ) {
    super();

    // Configurazione di default corretta
    this.config = {
      maxConcurrentBatches: 3,
      defaultBatchSize: 10,
      priorityTimeframe: AlphaVantageTimeframe.DAILY,
      enableProgressTracking: true,
      enableAutoRetry: true,
      cacheFirstStrategy: true,
      enableLogging: true,
      rateLimiterConfig: {
        requestsPerMinute: 5,
        requestsPerDay: 25,
        enableLogging: true,
      },
      ...config,
    };

    this.alphaVantageService = alphaVantageService;
    // Correzione: ApiRateLimiter accetta solo la sua configurazione
    this.rateLimiter = new ApiRateLimiter(this.config.rateLimiterConfig);
    this.errorHandler = ErrorCodeHandler.getInstance();
    this.setupEventListeners();
  }

  /**
   * Elabora richiesta batch
   */
  async processBatch(request: BatchRequest): Promise<BatchResult> {
    const batchId = request.batchId || this.generateBatchId();
    const startTime = new Date();

    if (this.activeBatches.size >= this.config.maxConcurrentBatches) {
      throw new Error(
        `Maximum concurrent batches reached (${this.config.maxConcurrentBatches})`
      );
    }

    this.validateBatchRequest(request);

    const batchStatus: BatchStatus = {
      batchId,
      status: 'queued',
      progress: {
        completed: 0,
        total: request.symbols.length,
        percentage: 0,
        estimatedTimeRemainingMs: 0,
        failed: 0,
      },
      startTime,
      errors: [],
    };

    this.activeBatches.set(batchId, batchStatus);
    this.log(
      `Starting batch ${batchId} with ${request.symbols.length} symbols`
    );

    try {
      batchStatus.status = 'processing';
      this.emitBatchEvent('started', batchId);

      const optimizedSymbols = this.optimizeProcessingOrder(
        request.symbols,
        request.timeframe
      );

      let symbolsToProcess = optimizedSymbols;
      let cacheResults = new Map<string, unknown>();

      if (this.config.cacheFirstStrategy) {
        const cacheResult = await this.checkCacheFirst(
          optimizedSymbols,
          request.timeframe,
          request.options
        );
        cacheResults = cacheResult.cached;
        symbolsToProcess = cacheResult.uncached;
        this.log(
          `Cache strategy: ${cacheResults.size} cached, ${symbolsToProcess.length} need API calls`
        );
      }

      const { apiResults, apiErrors } =
        symbolsToProcess.length > 0
          ? await this.processViaApi(
              symbolsToProcess,
              request.timeframe,
              request.options,
              batchId
            )
          : {
              apiResults: new Map<string, unknown>(),
              apiErrors: new Map<string, Error>(),
            };

      const allResults = new Map([...cacheResults, ...apiResults]);
      const allErrors = new Map<string, Error>([...apiErrors]); // Aggiungiamo gli errori qui

      const endTime = new Date();
      const executionTimeMs = endTime.getTime() - startTime.getTime();
      const rateLimitStats = this.rateLimiter.getRateLimitStats();

      const batchResult: BatchResult = {
        batchId,
        success: allErrors.size === 0,
        totalSymbols: request.symbols.length,
        successfulSymbols: allResults.size,
        failedSymbols: allErrors.size,
        cacheHits: cacheResults.size,
        apiCalls: apiResults.size,
        executionTimeMs,
        results: allResults,
        errors: allErrors,
        rateLimitStats,
      };

      batchStatus.status = 'completed';
      batchStatus.endTime = endTime;
      batchStatus.progress.completed = request.symbols.length;
      batchStatus.progress.percentage = 100;

      this.completedBatches.set(batchId, batchResult);
      this.activeBatches.delete(batchId);

      this.emitBatchEvent('completed', batchId);
      this.log(
        `Batch ${batchId} completed: ${batchResult.successfulSymbols}/${batchResult.totalSymbols} successful in ${executionTimeMs}ms`
      );

      // CORREZIONE: Rimossi i blocchi if errati da qui

      return batchResult;
    } catch (error) {
      batchStatus.status = 'failed';
      batchStatus.endTime = new Date();
      this.activeBatches.delete(batchId);
      this.emitBatchEvent(
        'failed',
        batchId,
        error instanceof Error ? error.message : String(error)
      );
      this.log(`Batch ${batchId} failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Logica separata per le chiamate API, che non passa dal rate limiter ma direttamente al servizio AV
   */
  private async processViaApi(
    symbols: string[],
    timeframe: AlphaVantageTimeframe,
    options: Record<string, unknown> = {},
    batchId: string
  ): Promise<{
    apiResults: Map<string, unknown>;
    apiErrors: Map<string, Error>;
  }> {
    const apiResults = new Map<string, unknown>();
    const apiErrors = new Map<string, Error>();
    let completed = 0;
    const total = symbols.length;

    for (const symbol of symbols) {
      // Attende il permesso dal rate limiter
      await this.rateLimiter.enforceRateLimits();
      try {
        const stockData = await this.alphaVantageService.getStockData(
          symbol,
          timeframe,
          { ...options, useCache: false } // Forziamo la chiamata API
        );
        apiResults.set(symbol, stockData);
        this.rateLimiter.recordRequest(); // Registra la chiamata avvenuta con successo
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        apiErrors.set(symbol, err);
        this.log(`API call failed for ${symbol}: ${err.message}`);
      }
      completed++;
      // Aggiornamento progresso
      const progressEvent: ProgressEvent = {
        type: 'progress',
        batchId,
        progress: {
          completed,
          total,
          percentage: (completed / total) * 100,
          currentRequest: symbol,
          queueSize: total - completed,
          estimatedTimeRemainingMs: 0, // Semplificato
          errors: Array.from(apiErrors.entries()).map(([s, e]) => ({
            symbol: s,
            error: e.message,
            timestamp: new Date(),
          })),
          cacheHits: 0, // Non applicabile qui
          apiCalls: completed,
          failed: apiErrors.size,
        },
      };
      this.updateBatchProgress(batchId, progressEvent);
    }

    return { apiResults, apiErrors };
  }

  /**
   * Elabora simboli multipli con gestione intelligente delle priorità
   */
  async processMultipleSymbols(
    symbols: string[],
    timeframes: AlphaVantageTimeframe[],
    options?: Record<string, unknown>
  ): Promise<Map<string, Map<AlphaVantageTimeframe, unknown>>> {
    const results = new Map<string, Map<AlphaVantageTimeframe, unknown>>();

    const batchPromises = timeframes.map(async timeframe => {
      const batchRequest: BatchRequest = {
        symbols,
        timeframe,
        options,
        priority: this.getTimeframePriority(timeframe),
      };
      const batchResult = await this.processBatch(batchRequest);
      return { timeframe, batchResult };
    });

    const batchResults = await Promise.allSettled(batchPromises);

    for (const symbol of symbols) {
      const symbolResults = new Map<AlphaVantageTimeframe, unknown>();
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const { timeframe, batchResult } = result.value;
          const symbolData = batchResult.results.get(symbol);
          if (symbolData) {
            symbolResults.set(timeframe, symbolData);
          }
        }
      });
      if (symbolResults.size > 0) {
        results.set(symbol, symbolResults);
      }
    }
    return results;
  }

  /**
   * Controlla cache prima delle chiamate API
   */
  private async checkCacheFirst(
    symbols: string[],
    timeframe: AlphaVantageTimeframe,
    options?: Record<string, unknown>
  ): Promise<{ cached: Map<string, unknown>; uncached: string[] }> {
    const cached = new Map<string, unknown>();
    const uncached: string[] = [];

    for (const symbol of symbols) {
      try {
        const result = await this.alphaVantageService.getStockData(
          symbol,
          timeframe,
          {
            ...options,
            useCache: true,
          }
        );
        if (result && result.cacheHit) {
          cached.set(symbol, result.data);
        } else {
          uncached.push(symbol);
        }
      } catch (error) {
        uncached.push(symbol);
      }
    }
    return { cached, uncached };
  }

  /**
   * Ottimizza ordine di elaborazione
   */
  private optimizeProcessingOrder(
    symbols: string[],
    _timeframe: AlphaVantageTimeframe
  ): string[] {
    return symbols.slice().sort((a, b) => {
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      return a.localeCompare(b);
    });
  }

  /**
   * Aggiorna progresso batch
   */
  private updateBatchProgress(batchId: string, event: ProgressEvent): void {
    const batchStatus = this.activeBatches.get(batchId);
    if (!batchStatus) return;

    batchStatus.progress = {
      completed: event.progress.completed,
      total: event.progress.total,
      percentage: event.progress.percentage,
      currentSymbol: event.progress.currentRequest,
      estimatedTimeRemainingMs: event.progress.estimatedTimeRemainingMs,
      failed: event.progress.failed,
    };

    if (event.progress.errors.length > 0) {
      batchStatus.errors = event.progress.errors.map(err => ({
        symbol: err.symbol,
        error: err.error,
      }));
    }

    this.emitBatchEvent('progress', batchId);
  }

  /**
   * Ottiene priorità per timeframe
   */
  private getTimeframePriority(timeframe: AlphaVantageTimeframe): number {
    const priorities: Record<AlphaVantageTimeframe, number> = {
      [AlphaVantageTimeframe.INTRADAY_1MIN]: 10,
      [AlphaVantageTimeframe.INTRADAY_5MIN]: 9,
      [AlphaVantageTimeframe.INTRADAY_15MIN]: 8,
      [AlphaVantageTimeframe.INTRADAY_30MIN]: 7,
      [AlphaVantageTimeframe.INTRADAY_60MIN]: 6,
      [AlphaVantageTimeframe.DAILY]: 5,
      [AlphaVantageTimeframe.WEEKLY]: 3,
      [AlphaVantageTimeframe.MONTHLY]: 1,
    };
    return priorities[timeframe] || 1;
  }

  /**
   * Validazione richiesta batch
   */
  private validateBatchRequest(request: BatchRequest): void {
    if (!request.symbols || request.symbols.length === 0) {
      throw new Error('Batch request must contain at least one symbol');
    }
    if (request.symbols.length > 100) {
      this.log('Warning: Batch size exceeds 100 symbols, this may be slow.');
    }
    if (!Object.values(AlphaVantageTimeframe).includes(request.timeframe)) {
      throw new Error(`Invalid timeframe: ${request.timeframe}`);
    }
    for (const symbol of request.symbols) {
      if (!symbol || typeof symbol !== 'string' || symbol.length > 10) {
        throw new Error(`Invalid symbol: ${symbol}`);
      }
    }
  }

  /**
   * Genera ID batch
   */
  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Emette evento batch
   */
  private emitBatchEvent(
    type: 'started' | 'progress' | 'completed' | 'failed' | 'cancelled',
    batchId: string,
    message?: string
  ): void {
    const batchStatus =
      this.activeBatches.get(batchId) || this.completedBatches.get(batchId);
    this.emit('batchEvent', {
      type,
      batchId,
      status: batchStatus,
      message,
      timestamp: new Date(),
    });
  }

  /**
   * Ottiene stato batch
   */
  getBatchStatus(batchId: string): BatchStatus | undefined {
    return this.activeBatches.get(batchId);
  }

  /**
   * Ottiene risultato batch completato
   */
  getBatchResult(batchId: string): BatchResult | undefined {
    return this.completedBatches.get(batchId);
  }

  /**
   * Ottiene tutti i batch attivi
   */
  getActiveBatches(): Map<string, BatchStatus> {
    return new Map(this.activeBatches);
  }

  /**
   * Ottiene statistiche rate limiting
   */
  getRateLimitStats(): RateLimitStats {
    return this.rateLimiter.getRateLimitStats();
  }

  /**
   * Cancella batch attivo
   */
  cancelBatch(batchId: string): boolean {
    const batchStatus = this.activeBatches.get(batchId);
    if (!batchStatus) return false;

    batchStatus.status = 'cancelled';
    batchStatus.endTime = new Date();
    this.activeBatches.delete(batchId);
    this.emitBatchEvent('cancelled', batchId);
    this.log(`Batch ${batchId} cancelled`);
    return true;
  }

  /**
   * Cancella tutti i batch attivi
   */
  cancelAllBatches(): number {
    const cancelledCount = this.activeBatches.size;
    for (const batchId of this.activeBatches.keys()) {
      this.cancelBatch(batchId);
    }
    this.rateLimiter.cancelAllRequests();
    return cancelledCount;
  }

  /**
   * Reset completo del processor
   */
  reset(): void {
    this.cancelAllBatches();
    this.completedBatches.clear();
    this.rateLimiter.reset();
    this.log('Batch processor reset completed');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.rateLimiter.on('progress', (event: ProgressEvent) => {
      this.emit('rateLimiterProgress', event);
    });
  }

  /**
   * Logging
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[BatchProcessor] ${new Date().toISOString()}: ${message}`);
    }
  }
}

export default BatchProcessor;
