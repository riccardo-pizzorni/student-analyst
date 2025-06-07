/**
 * STUDENT ANALYST - API Rate Limiter
 * =================================
 * 
 * Sistema intelligente di gestione rate limiting per Alpha Vantage API
 * Gestisce code, progress tracking, e batch processing rispettando i limiti:
 * - 5 richieste al minuto (free tier)
 * - 25 richieste al giorno (free tier)
 */

import { EventEmitter } from 'node:events';

/**
 * Configurazione rate limiter
 */
export interface RateLimiterConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
  windowSizeMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  batchSize: number;
  enableLogging: boolean;
}

/**
 * Richiesta in coda
 */
export interface QueuedRequest {
  id: string;
  symbol: string;
  timeframe: string;
  priority: number;
  timestamp: Date;
  retryCount: number;
  options?: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

/**
 * Stato del progresso
 */
export interface ProgressState {
  queueSize: number;
  completed: number;
  failed: number;
  total: number;
  percentage: number;
  estimatedTimeRemainingMs: number;
  currentRequest?: string;
  errors: Array<{ symbol: string; error: string; timestamp: Date }>;
  cacheHits: number;
  apiCalls: number;
}

/**
 * Statistiche rate limiting
 */
export interface RateLimitStats {
  requestsInLastMinute: number;
  requestsInLastDay: number;
  timeUntilNextSlot: number;
  dailyQuotaRemaining: number;
  minuteQuotaRemaining: number;
  isThrottled: boolean;
  totalRequestsMade: number;
  cacheHitRate: number;
  averageResponseTime: number;
  queueLength: number;
}

/**
 * Evento progresso
 */
export interface ProgressEvent {
  type: 'started' | 'progress' | 'completed' | 'error' | 'cancelled';
  batchId: string;
  progress: ProgressState;
  message?: string;
}

/**
 * Rate Limiter principale
 */
export class ApiRateLimiter extends EventEmitter {
  private config: RateLimiterConfig;
  private requestHistory: Date[] = [];
  private dailyRequestHistory: Date[] = [];
  private queue: QueuedRequest[] = [];
  private isProcessing: boolean = false;
  private currentBatchId?: string;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    super();
    
    this.config = {
      requestsPerMinute: 5, // Alpha Vantage free tier
      requestsPerDay: 25,   // Alpha Vantage free tier
      windowSizeMs: 60000,  // 1 minuto
      retryAttempts: 3,
      retryDelayMs: 1000,
      batchSize: 10,
      enableLogging: true,
      ...config
    };
  }

  /**
   * Aggiunge richiesta singola alla coda
   */
  async queueRequest(
    symbol: string, 
    timeframe: string, 
    priority: number = 1,
    options?: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `${symbol}-${timeframe}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const queuedRequest: QueuedRequest = {
        id: requestId,
        symbol: symbol.toUpperCase(),
        timeframe,
        priority,
        timestamp: new Date(),
        retryCount: 0,
        options,
        resolve,
        reject
      };

      this.queue.push(queuedRequest);
      this.log(`Queued request for ${symbol} (${timeframe}). Queue size: ${this.queue.length}`);

      // Avvia elaborazione se non è già in corso
      if (!this.isProcessing) {
        this.startProcessing();
      }
    });
  }

  /**
   * Aggiunge batch di richieste alla coda
   */
  async queueBatch(
    symbols: string[], 
    timeframe: string, 
    options?: any
  ): Promise<Map<string, any>> {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.currentBatchId = batchId;

    this.log(`Starting batch processing for ${symbols.length} symbols`);

    const promises = symbols.map((symbol, index) => 
      this.queueRequest(symbol, timeframe, symbols.length - index, options)
    );

    try {
      const results = await Promise.allSettled(promises);
      const resultMap = new Map<string, any>();

      results.forEach((result, index) => {
        const symbol = symbols[index];
        if (result.status === 'fulfilled') {
          resultMap.set(symbol, result.value);
        } else {
          resultMap.set(symbol, { error: result.reason });
        }
      });

      this.log(`Batch processing completed. Success: ${results.filter(r => r.status === 'fulfilled').length}/${symbols.length}`);
      return resultMap;

    } catch (error) {
      throw error;
    } finally {
      this.currentBatchId = undefined;
    }
  }

  /**
   * Avvia elaborazione della coda
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.log('Started queue processing');

    try {
      while (this.queue.length > 0) {
        const request = this.queue.shift();
        if (!request) break;

        await this.processRequest(request);
      }
    } catch (error) {
      this.log(`Queue processing error: ${error}`);
    } finally {
      this.isProcessing = false;
      this.log('Queue processing completed');
    }
  }

  /**
   * Elabora una singola richiesta
   */
  private async processRequest(request: QueuedRequest): Promise<void> {
    const startTime = Date.now();

    try {
      // Controlla rate limits
      await this.enforceRateLimits();

      // Simula chiamata API (qui verrà integrato AlphaVantageService)
      const result = await this.makeApiCall(request);
      
      const responseTime = Date.now() - startTime;

      // Registra successo
      this.recordRequest();
      
      request.resolve(result);
      this.log(`Request completed for ${request.symbol} (${responseTime}ms)`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Gestione retry
      if (request.retryCount < this.config.retryAttempts) {
        request.retryCount++;
        this.log(`Retrying request for ${request.symbol} (attempt ${request.retryCount}/${this.config.retryAttempts})`);
        
        // Riaggiunge alla coda
        this.queue.unshift(request);
        
        await this.delay(this.config.retryDelayMs * request.retryCount);
        return;
      }

      request.reject(error);
      this.log(`Request failed for ${request.symbol}: ${errorMessage}`);
    }
  }

  /**
   * Applica rate limiting
   */
  private async enforceRateLimits(): Promise<void> {
    // Controlla limite giornaliero
    this.cleanupDailyHistory();
    if (this.dailyRequestHistory.length >= this.config.requestsPerDay) {
      throw new Error('Daily API quota exceeded');
    }

    // Controlla limite per minuto
    this.cleanupRequestHistory();
    if (this.requestHistory.length >= this.config.requestsPerMinute) {
      const oldestRequest = this.requestHistory[0];
      const timeToWait = 60000 - (Date.now() - oldestRequest.getTime());
      
      if (timeToWait > 0) {
        this.log(`Rate limiting: waiting ${timeToWait}ms before next request`);
        await this.delay(timeToWait);
      }
    }
  }

  /**
   * Simula chiamata API
   */
  private async makeApiCall(request: QueuedRequest): Promise<any> {
    await this.delay(100 + Math.random() * 500); // Simula latenza API

    // Simula risultato
    return {
      success: true,
      symbol: request.symbol,
      timeframe: request.timeframe,
      data: [],
      source: Math.random() > 0.3 ? 'alpha_vantage' : 'cache',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Registra una richiesta
   */
  private recordRequest(): void {
    const now = new Date();
    this.requestHistory.push(now);
    this.dailyRequestHistory.push(now);
  }

  /**
   * Pulisce cronologia richieste (ultimo minuto)
   */
  private cleanupRequestHistory(): void {
    const oneMinuteAgo = Date.now() - 60000;
    this.requestHistory = this.requestHistory.filter(req => req.getTime() > oneMinuteAgo);
  }

  /**
   * Pulisce cronologia richieste giornaliere
   */
  private cleanupDailyHistory(): void {
    const oneDayAgo = Date.now() - 86400000; // 24 ore
    this.dailyRequestHistory = this.dailyRequestHistory.filter(req => req.getTime() > oneDayAgo);
  }

  /**
   * Ottiene statistiche rate limiting
   */
  getRateLimitStats(): RateLimitStats {
    this.cleanupRequestHistory();
    this.cleanupDailyHistory();

    return {
      requestsInLastMinute: this.requestHistory.length,
      requestsInLastDay: this.dailyRequestHistory.length,
      timeUntilNextSlot: this.getTimeUntilNextSlot(),
      dailyQuotaRemaining: Math.max(0, this.config.requestsPerDay - this.dailyRequestHistory.length),
      minuteQuotaRemaining: Math.max(0, this.config.requestsPerMinute - this.requestHistory.length),
      isThrottled: this.requestHistory.length >= this.config.requestsPerMinute,
      totalRequestsMade: this.dailyRequestHistory.length,
      cacheHitRate: 0, // Placeholder
      averageResponseTime: 0, // Placeholder
      queueLength: this.queue.length
    };
  }

  /**
   * Calcola tempo di attesa per la prossima richiesta
   */
  private getTimeUntilNextSlot(): number {
    if (this.requestHistory.length < this.config.requestsPerMinute) {
      return 0;
    }

    const oldestRequest = this.requestHistory[0];
    const timeSinceOldest = Date.now() - oldestRequest.getTime();
    const timeToWait = 60000 - timeSinceOldest;

    return Math.max(0, timeToWait);
  }

  /**
   * Cancella tutte le richieste in coda
   */
  cancelAllRequests(): void {
    for (const request of this.queue) {
      request.reject(new Error('Request cancelled'));
    }
    this.queue = [];
    this.log('All pending requests cancelled');
  }

  /**
   * Reset completo del rate limiter
   */
  reset(): void {
    this.cancelAllRequests();
    this.requestHistory = [];
    this.dailyRequestHistory = [];
    this.isProcessing = false;
    this.currentBatchId = undefined;
    this.log('Rate limiter reset completed');
  }

  /**
   * Utility per delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logging condizionale
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[ApiRateLimiter] ${new Date().toISOString()}: ${message}`);
    }
  }
}

export default ApiRateLimiter; 