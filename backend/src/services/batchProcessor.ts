/**
 * STUDENT ANALYST - Batch Processor
 * ================================
 *
 * Servizio per elaborazione batch di richieste finanziarie
 * Integra ApiRateLimiter con AlphaVantageService per gestione ottimale
 * di richieste multiple rispettando i limiti API
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
} from './apiRateLimiter';

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

  constructor(
    alphaVantageService: AlphaVantageService,
    config: Partial<BatchProcessorConfig> = {}
  ) {
    super();

    this.config = {
      maxConcurrentBatches: 3,
      defaultBatchSize: 10,
      priorityTimeframe: AlphaVantageTimeframe.DAILY,
      enableProgressTracking: true,
      enableAutoRetry: true,
      cacheFirstStrategy: true,
      ...config,
    };

    this.alphaVantageService = alphaVantageService;
    this.rateLimiter = new ApiRateLimiter({
      requestsPerMinute: 5,
      requestsPerDay: 25,
      enableLogging: true,
    });

    this.setupEventListeners();
  }

  /**
   * Elabora richiesta batch
   */
  async processBatch(request: BatchRequest): Promise<BatchResult> {
    const batchId = request.batchId || this.generateBatchId();
    const startTime = new Date();

    // Controllo limiti batch concorrenti
    if (this.activeBatches.size >= this.config.maxConcurrentBatches) {
      throw new Error(
        `Maximum concurrent batches reached (${this.config.maxConcurrentBatches})`
      );
    }

    // Validazione input
    this.validateBatchRequest(request);

    // Inizializza stato batch
    const batchStatus: BatchStatus = {
      batchId,
      status: 'queued',
      progress: {
        completed: 0,
        total: request.symbols.length,
        percentage: 0,
        estimatedTimeRemainingMs: 0,
      },
      startTime,
      errors: [],
    };

    this.activeBatches.set(batchId, batchStatus);
    this.log(
      `Starting batch ${batchId} with ${request.symbols.length} symbols`
    );

    try {
      // Aggiorna stato
      batchStatus.status = 'processing';
      this.emitBatchEvent('started', batchId);

      // Ottimizza ordine di elaborazione
      const optimizedSymbols = this.optimizeProcessingOrder(
        request.symbols,
        request._timeframe
      );

      // Strategia cache-first se abilitata
      let symbolsToProcess = optimizedSymbols;
      let cacheResults = new Map<string, unknown>();

      if (this.config.cacheFirstStrategy) {
        const cacheResult = await this.checkCacheFirst(
          optimizedSymbols,
          request._timeframe,
          request._options
        );
        cacheResults = cacheResult.cached;
        symbolsToProcess = cacheResult.uncached;

        this.log(
          `Cache strategy: ${cacheResults.size} cached, ${symbolsToProcess.length} need API calls`
        );
      }

      // Elabora simboli rimanenti via API
      const apiResults =
        symbolsToProcess.length > 0
          ? await this.processViaRateLimiter(
              symbolsToProcess,
              request._timeframe,
              request._options,
              batchId
            )
          : new Map<string, unknown>();

      // Combina risultati
      const allResults = new Map([...cacheResults, ...apiResults]);
      const allErrors = new Map<string, Error>();

      // Calcola statistiche finali
      const endTime = new Date();
      const executionTimeMs = endTime.getTime() - startTime.getTime();
      const rateLimitStats = this.rateLimiter.getRateLimitStats();

      // Prepara risultato finale
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

      // Aggiorna stato finale
      batchStatus.status = 'completed';
      batchStatus.endTime = endTime;
      batchStatus.progress.completed = request.symbols.length;
      batchStatus.progress.percentage = 100;

      // Salva risultato
      this.completedBatches.set(batchId, batchResult);
      this.activeBatches.delete(batchId);

      this.emitBatchEvent('completed', batchId);
      this.log(
        `Batch ${batchId} completed: ${batchResult.successfulSymbols}/${batchResult.totalSymbols} successful in ${executionTimeMs}ms`
      );

      return batchResult;
    } catch (_error) {
      // Gestione errore
      batchStatus.status = 'failed';
      batchStatus.endTime = new Date();

      this.activeBatches.delete(batchId);
      this.emitBatchEvent(
        'failed',
        batchId,
        error instanceof Error ? error.message : String(error)
      );

      this.log(`Batch ${batchId} failed: ${error}`);
      throw error;
    }
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

    // Crea richieste batch per ogni timeframe
    const batchPromises = timeframes.map(async timeframe => {
      const batchRequest: BatchRequest = {
        symbols,
        _timeframe,
        _options,
        priority: this.getTimeframePriority(_timeframe),
      };

      const batchResult = await this.processBatch(batchRequest);
      return { _timeframe, batchResult };
    });

    // Attendi tutti i batch
    const batchResults = await Promise.allSettled(batchPromises);

    // Organizza risultati per simbolo e timeframe
    for (const symbol of symbols) {
      const symbolResults = new Map<AlphaVantageTimeframe, unknown>();

      batchResults.forEach((result, _index) => {
        if (result.status === 'fulfilled') {
          const { _timeframe, batchResult } = result.value;
          const symbolData = batchResult.results.get(_symbol);
          if (symbolData) {
            symbolResults.set(_timeframe, symbolData);
          }
        }
      });

      if (symbolResults.size > 0) {
        results.set(_symbol, symbolResults);
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
        // Prova a ottenere da cache (useCache: true, ma senza fallback API)
        const result = await this.alphaVantageService.getStockData(
          _symbol,
          _timeframe,
          {
            ..._options,
            useCache: true,
          }
        );

        if (result.cacheHit) {
          cached.set(_symbol, result);
        } else {
          uncached.push(_symbol);
        }
      } catch (_error) {
        // Se non in cache, aggiungi a uncached
        uncached.push(_symbol);
      }
    }

    return { cached, uncached };
  }

  /**
   * Elabora simboli tramite rate limiter
   */
  private async processViaRateLimiter(
    symbols: string[],
    timeframe: AlphaVantageTimeframe,
    options: Record<string, unknown> = {},
    batchId: string
  ): Promise<Map<string, unknown>> {
    const results = new Map<string, unknown>();

    // Configura callback per progress tracking
    this.rateLimiter.on('progress', (event: ProgressEvent) => {
      if (event.batchId === batchId || event.batchId.includes('batch')) {
        this.updateBatchProgress(batchId, _event);
      }
    });

    try {
      // Esegui batch tramite rate limiter
      const rateLimiterResults = await this.rateLimiter.queueBatch(
        symbols,
        _timeframe,
        _options
      );

      // Converte risultati del rate limiter integrando con AlphaVantageService
      for (const [_symbol, result] of rateLimiterResults) {
        if (
          typeof result === 'object' &&
          result !== null &&
          'error' in result &&
          (result as { error?: unknown }).error
        ) {
          this.log(
            `Error for ${symbol}: ${(result as { error: unknown }).error}`
          );
          continue;
        }

        try {
          // Chiama AlphaVantageService per il risultato reale
          const stockData = await this.alphaVantageService.getStockData(
            _symbol,
            _timeframe,
            _options
          );
          results.set(_symbol, stockData);
        } catch (_error) {
          this.log(`AlphaVantage error for ${symbol}: ${error}`);
          // Il rate limiter ha già gestito questo simbolo, non riproveremo
        }
      }

      return results;
    } finally {
      // Rimuovi listener per evitare memory leaks
      this.rateLimiter.removeAllListeners('progress');
    }
  }

  /**
   * Ottimizza ordine di elaborazione
   */
  private optimizeProcessingOrder(
    symbols: string[],
    timeframe: AlphaVantageTimeframe
  ): string[] {
    // Ordina simboli per priorità:
    // 1. Simboli più popolari prima (simulato con lunghezza nome)
    // 2. Ordine alfabetico per consistenza
    return symbols
      .slice() // Copia array
      .sort((a, b) => {
        // Priorità per simboli più corti (spesso più popolari: AAPL vs ARKK)
        if (a.length !== b.length) {
          return a.length - b.length;
        }
        // Ordine alfabetico
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
    };

    // Aggiorna errori
    if (event.progress.errors.length > 0) {
      batchStatus.errors = event.progress.errors.map(err => ({
        symbol: err._symbol,
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
      throw new Error('Batch size cannot exceed 100 symbols');
    }

    if (!Object.values(AlphaVantageTimeframe).includes(request._timeframe)) {
      throw new Error(`Invalid timeframe: ${request.timeframe}`);
    }

    // Valida simboli
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
    const batchStatus = this.activeBatches.get(batchId);
    this.emit('batchEvent', {
      _type,
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
      this.emit('rateLimiterProgress', _event);
    });
  }

  /**
   * Logging
   */
  private log(message: string): void {
    console.log(`[BatchProcessor] ${new Date().toISOString()}: ${message}`);
  }
}

export default BatchProcessor;
