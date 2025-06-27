import yahooFinance from 'yahoo-finance2';
import { ErrorCodeHandler } from './errorCodeHandler';
import {
  NetworkResilienceConfig,
  NetworkResilienceService,
} from './networkResilienceService';

/**
 * Interface per i dati standard OHLCV (Open, High, Low, Close, Volume)
 * Mantiene compatibilità con AlphaVantageService
 */
export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume: number;
  timestamp?: string;
}

/**
 * Interface per i metadati della risposta Yahoo Finance
 * Mantiene compatibilità con AlphaVantageService
 */
export interface YahooFinanceMetadata {
  symbol: string;
  lastRefreshed: string;
  dataPoints: number;
  source: 'yahoo_finance';
  timeZone: string;
}

/**
 * Interface per la risposta completa di Yahoo Finance
 * Mantiene compatibilità con AlphaVantageService
 */
export interface YahooFinanceResponse {
  data: OHLCVData[];
  metadata: YahooFinanceMetadata;
  success: boolean;
  source: 'yahoo_finance';
  requestTimestamp: string;
  cacheHit?: boolean;
}

/**
 * Enum per i timeframe supportati da Yahoo Finance
 * Mappa i timeframe di Yahoo Finance ai nostri standard
 */
export enum YahooFinanceTimeframe {
  '1d' = '1d',
  '5d' = '5d',
  '1mo' = '1mo',
  '3mo' = '3mo',
  '6mo' = '6mo',
  '1y' = '1y',
  '2y' = '2y',
  '5y' = '5y',
  '10y' = '10y',
  'ytd' = 'ytd',
  'max' = 'max',
}

/**
 * Enum per i tipi di errore specifici di Yahoo Finance
 */
export enum YahooFinanceErrorType {
  INVALID_SYMBOL = 'INVALID_SYMBOL',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  NO_DATA_AVAILABLE = 'NO_DATA_AVAILABLE',
  MALFORMED_RESPONSE = 'MALFORMED_RESPONSE',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
  MAX_RETRIES_REACHED = 'MAX_RETRIES_REACHED',
}

/**
 * Classe di errore personalizzata per Yahoo Finance
 * Mantiene compatibilità con AlphaVantageError
 */
export class YahooFinanceError extends Error {
  public readonly type: YahooFinanceErrorType;
  public readonly originalError?: Error;
  public readonly response?: unknown;
  public readonly retryable: boolean;
  public readonly timestamp: string;

  constructor(
    type: YahooFinanceErrorType,
    message: string,
    originalError?: Error,
    response?: unknown,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'YahooFinanceError';
    this.type = type;
    this.originalError = originalError;
    this.response = response;
    this.retryable = retryable;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Configurazione per il servizio Yahoo Finance
 */
export interface YahooFinanceConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  validateData: boolean;
  useAdjusted: boolean;
}

/**
 * Servizio principale per l'integrazione con Yahoo Finance API
 * Gestisce richieste, error handling, parsing e validazione dei dati finanziari
 * Mantiene compatibilità con AlphaVantageService
 */
export class YahooFinanceService {
  private readonly config: YahooFinanceConfig;
  private readonly cache: Map<
    string,
    { data: YahooFinanceResponse; timestamp: number }
  >;
  private readonly errorHandler: ErrorCodeHandler;
  private readonly resilienceService: NetworkResilienceService;

  constructor(config?: Partial<YahooFinanceConfig>) {
    this.config = {
      timeout: 30000, // 30 secondi
      retryAttempts: 3,
      retryDelay: 1000, // 1 secondo
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minuti per dati storici
      validateData: true,
      useAdjusted: true,
      ...config,
    };

    this.cache = new Map();
    this.errorHandler = ErrorCodeHandler.getInstance();

    // Inizializza servizio di resilienza di rete
    const resilienceConfig: NetworkResilienceConfig = {
      timeout: this.config.timeout,
      maxRetries: this.config.retryAttempts,
      baseDelay: this.config.retryDelay,
      maxDelay: 30000,
      backoffMultiplier: 2.0,
      jitter: true,
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        monitoringPeriod: 300000,
        halfOpenMaxCalls: 3,
        halfOpenSuccessThreshold: 2,
      },
      healthCheckInterval: 30000,
      enableFallback: true,
    };

    this.resilienceService =
      NetworkResilienceService.getInstance(resilienceConfig);

    // Log di debug per la chiave API (se presente)
    console.log('[DEBUG] Yahoo Finance Service initialized');
  }

  /**
   * Metodo principale per ottenere dati storici di un titolo
   * Mantiene compatibilità con AlphaVantageService.getStockData
   */
  public async getStockData(
    symbol: string,
    timeframe: YahooFinanceTimeframe,
    options?: {
      startDate?: string;
      endDate?: string;
      useCache?: boolean;
    }
  ): Promise<YahooFinanceResponse> {
    try {
      // Validazione input
      this.validateSymbol(symbol);
      this.validateTimeframe(timeframe);

      // Controllo cache
      if (this.config.cacheEnabled && options?.useCache !== false) {
        const cacheKey = this.generateCacheKey(symbol, timeframe, options);
        const cachedData = this.getCachedData(cacheKey, timeframe);
        if (cachedData) {
          return cachedData;
        }
      }

      // Fetch dati da Yahoo Finance
      const response = await this.makeApiCall(symbol, timeframe, options);

      // Cache dei dati
      if (this.config.cacheEnabled) {
        const cacheKey = this.generateCacheKey(symbol, timeframe, options);
        this.setCachedData(cacheKey, response, timeframe);
      }

      return response;
    } catch (error) {
      throw this.handleError(error, symbol, timeframe);
    }
  }

  /**
   * Validazione del simbolo ticker
   */
  private validateSymbol(symbol: string): void {
    if (!symbol || typeof symbol !== 'string') {
      throw new YahooFinanceError(
        YahooFinanceErrorType.INVALID_SYMBOL,
        'Symbol must be a non-empty string'
      );
    }

    if (symbol.length > 10) {
      throw new YahooFinanceError(
        YahooFinanceErrorType.INVALID_SYMBOL,
        'Symbol must be 10 characters or less'
      );
    }

    // Validazione formato simbolo (lettere, numeri, punti)
    if (!/^[A-Z0-9.]+$/.test(symbol.toUpperCase())) {
      throw new YahooFinanceError(
        YahooFinanceErrorType.INVALID_SYMBOL,
        'Symbol contains invalid characters'
      );
    }
  }

  /**
   * Validazione del timeframe
   */
  private validateTimeframe(timeframe: YahooFinanceTimeframe): void {
    if (!Object.values(YahooFinanceTimeframe).includes(timeframe)) {
      throw new YahooFinanceError(
        YahooFinanceErrorType.INVALID_RESPONSE,
        `Invalid timeframe: ${timeframe}`
      );
    }
  }

  /**
   * Chiamata API a Yahoo Finance
   */
  private async makeApiCall(
    symbol: string,
    timeframe: YahooFinanceTimeframe,
    options?: Record<string, unknown>
  ): Promise<YahooFinanceResponse> {
    const startTime = Date.now();

    try {
      // Preparazione parametri per Yahoo Finance
      const queryOptions: any = {
        period1: options?.startDate
          ? new Date(options.startDate as string)
          : undefined,
        period2: options?.endDate
          ? new Date(options.endDate as string)
          : undefined,
        interval: this.mapTimeframeToInterval(timeframe),
      };

      // Rimuovi parametri undefined
      Object.keys(queryOptions).forEach(key => {
        if (queryOptions[key] === undefined) {
          delete queryOptions[key];
        }
      });

      console.log(`[DEBUG] Yahoo Finance request for ${symbol}:`, queryOptions);

      // Chiamata a Yahoo Finance
      const result = await yahooFinance.historical(symbol, queryOptions);

      // Parsing della risposta
      const response = this.parseApiResponse(result, symbol, timeframe);

      console.log(
        `[DEBUG] Yahoo Finance response for ${symbol}: ${response.data.length} data points`
      );

      return response;
    } catch (error) {
      throw this.handleApiError(error, symbol, timeframe);
    }
  }

  /**
   * Mappa il timeframe ai parametri di Yahoo Finance
   */
  private mapTimeframeToInterval(timeframe: YahooFinanceTimeframe): string {
    switch (timeframe) {
      case YahooFinanceTimeframe['1d']:
      case YahooFinanceTimeframe['5d']:
        return '1m';
      case YahooFinanceTimeframe['1mo']:
      case YahooFinanceTimeframe['3mo']:
        return '5m';
      case YahooFinanceTimeframe['6mo']:
        return '15m';
      case YahooFinanceTimeframe['1y']:
      case YahooFinanceTimeframe['2y']:
      case YahooFinanceTimeframe['5y']:
      case YahooFinanceTimeframe['10y']:
      case YahooFinanceTimeframe['ytd']:
      case YahooFinanceTimeframe['max']:
        return '1d';
      default:
        return '1d';
    }
  }

  /**
   * Parsing della risposta di Yahoo Finance
   */
  private parseApiResponse(
    rawData: any[],
    symbol: string,
    timeframe: YahooFinanceTimeframe
  ): YahooFinanceResponse {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new YahooFinanceError(
        YahooFinanceErrorType.NO_DATA_AVAILABLE,
        `No data available for symbol ${symbol}`
      );
    }

    // Parsing dei dati OHLCV
    const ohlcvData: OHLCVData[] = rawData.map(item => ({
      date: new Date(item.date).toISOString().split('T')[0],
      open: Number(item.open) || 0,
      high: Number(item.high) || 0,
      low: Number(item.low) || 0,
      close: Number(item.close) || 0,
      adjustedClose: Number(item.adjClose) || Number(item.close) || 0,
      volume: Number(item.volume) || 0,
      timestamp: new Date(item.date).toISOString(),
    }));

    // Validazione dati
    if (this.config.validateData) {
      this.validateOHLCVData(ohlcvData);
    }

    // Metadati
    const metadata: YahooFinanceMetadata = {
      symbol: symbol.toUpperCase(),
      lastRefreshed: new Date().toISOString(),
      dataPoints: ohlcvData.length,
      source: 'yahoo_finance',
      timeZone: 'UTC',
    };

    return {
      data: ohlcvData,
      metadata,
      success: true,
      source: 'yahoo_finance',
      requestTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Validazione dei dati OHLCV
   */
  private validateOHLCVData(data: OHLCVData[]): void {
    if (!Array.isArray(data) || data.length === 0) {
      throw new YahooFinanceError(
        YahooFinanceErrorType.NO_DATA_AVAILABLE,
        'No data points available'
      );
    }

    for (let i = 0; i < data.length; i++) {
      const point = data[i];

      // Validazione prezzi
      if (
        point.open < 0 ||
        point.high < 0 ||
        point.low < 0 ||
        point.close < 0
      ) {
        throw new YahooFinanceError(
          YahooFinanceErrorType.MALFORMED_RESPONSE,
          `Negative price found at index ${i}`
        );
      }

      // Validazione logica prezzi
      if (
        point.high < point.low ||
        point.high < point.open ||
        point.high < point.close
      ) {
        throw new YahooFinanceError(
          YahooFinanceErrorType.MALFORMED_RESPONSE,
          `Invalid price relationship at index ${i}`
        );
      }

      // Validazione volume
      if (point.volume < 0) {
        throw new YahooFinanceError(
          YahooFinanceErrorType.MALFORMED_RESPONSE,
          `Negative volume found at index ${i}`
        );
      }

      // Validazione date
      if (!point.date || isNaN(Date.parse(point.date))) {
        throw new YahooFinanceError(
          YahooFinanceErrorType.MALFORMED_RESPONSE,
          `Invalid date at index ${i}`
        );
      }
    }
  }

  /**
   * Gestione errori API
   */
  private handleApiError(
    error: any,
    symbol: string,
    timeframe: YahooFinanceTimeframe
  ): YahooFinanceError {
    console.error(`[ERROR] Yahoo Finance API error for ${symbol}:`, error);

    if (error.message?.includes('No data found')) {
      return new YahooFinanceError(
        YahooFinanceErrorType.INVALID_SYMBOL,
        `Symbol ${symbol} not found or no data available`,
        error,
        undefined,
        false
      );
    }

    if (
      error.message?.includes('rate limit') ||
      error.message?.includes('too many requests')
    ) {
      return new YahooFinanceError(
        YahooFinanceErrorType.RATE_LIMIT,
        'Rate limit exceeded, please try again later',
        error,
        undefined,
        true
      );
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new YahooFinanceError(
        YahooFinanceErrorType.NETWORK_ERROR,
        'Network error, please check your connection',
        error,
        undefined,
        true
      );
    }

    return new YahooFinanceError(
      YahooFinanceErrorType.UNKNOWN,
      `Unexpected error: ${error.message || 'Unknown error'}`,
      error,
      undefined,
      false
    );
  }

  /**
   * Gestione errori generici
   */
  private handleError(
    error: unknown,
    symbol: string,
    timeframe: YahooFinanceTimeframe
  ): YahooFinanceError {
    if (error instanceof YahooFinanceError) {
      return error;
    }

    return new YahooFinanceError(
      YahooFinanceErrorType.UNKNOWN,
      `Unexpected error for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined,
      undefined,
      false
    );
  }

  /**
   * Generazione chiave cache
   */
  private generateCacheKey(
    symbol: string,
    timeframe: YahooFinanceTimeframe,
    options?: Record<string, unknown>
  ): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `yahoo_${symbol}_${timeframe}_${optionsStr}`;
  }

  /**
   * Recupero dati dalla cache
   */
  private getCachedData(
    cacheKey: string,
    timeframe: YahooFinanceTimeframe
  ): YahooFinanceResponse | null {
    if (!this.config.cacheEnabled) {
      return null;
    }

    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const cacheAge = now - cached.timestamp;

    if (cacheAge > this.config.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    return {
      ...cached.data,
      cacheHit: true,
    };
  }

  /**
   * Salvataggio dati in cache
   */
  private setCachedData(
    cacheKey: string,
    data: YahooFinanceResponse,
    timeframe: YahooFinanceTimeframe
  ): void {
    if (!this.config.cacheEnabled) {
      return;
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Pulizia cache se troppo grande
    if (this.cache.size > 1000) {
      const keys = Array.from(this.cache.keys());
      const oldestKey = keys[0];
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Delay per rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check del servizio
   */
  public async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    cacheSize: number;
  }> {
    try {
      // Test con un simbolo noto
      await this.getStockData('AAPL', YahooFinanceTimeframe['1mo'], {
        useCache: false,
      });

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        cacheSize: this.cache.size,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        cacheSize: this.cache.size,
      };
    }
  }

  /**
   * Pulizia cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Statistiche cache
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Validazione richiesta
   */
  public validateRequest(
    symbol: string,
    timeframe: YahooFinanceTimeframe
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.validateSymbol(symbol);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid symbol');
    }

    try {
      this.validateTimeframe(timeframe);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid timeframe');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
