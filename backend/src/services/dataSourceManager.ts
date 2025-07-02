import {
  AlphaVantageResponse,
  AlphaVantageService,
  AlphaVantageTimeframe,
} from './alphaVantageService';
import {
  YahooFinanceResponse,
  YahooFinanceService,
  YahooFinanceTimeframe,
} from './yahooFinanceService';

/**
 * Enum per le sorgenti dati disponibili
 */
export enum DataSource {
  YAHOO_FINANCE = 'yahoo_finance',
  ALPHA_VANTAGE = 'alpha_vantage',
}

/**
 * Interface per la configurazione del DataSourceManager
 */
export interface DataSourceManagerConfig {
  primarySource: DataSource;
  enableFallback: boolean;
  fallbackDelay: number;
  maxRetries: number;
  logFallbacks: boolean;
}

/**
 * Interface per la risposta unificata del DataSourceManager
 * Mantiene compatibilità con entrambi i servizi
 */
export interface UnifiedDataResponse {
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    adjustedClose?: number;
    volume: number;
    timestamp?: string;
  }>;
  metadata: {
    symbol: string;
    lastRefreshed: string;
    source: DataSource;
    dataPoints: number;
    timeZone: string;
  };
  success: boolean;
  source: DataSource;
  requestTimestamp: string;
  cacheHit?: boolean;
  fallbackUsed?: boolean;
}

/**
 * Interface per i parametri di richiesta unificati
 */
export interface UnifiedRequestParams {
  symbol: string;
  timeframe: string;
  startDate?: string;
  endDate?: string;
  useCache?: boolean;
}

/**
 * Classe per la gestione delle sorgenti dati
 * Coordina tra Yahoo Finance (primario) e Alpha Vantage (fallback)
 */
export class DataSourceManager {
  private readonly config: DataSourceManagerConfig;
  private readonly yahooService: YahooFinanceService;
  private readonly alphaVantageService: AlphaVantageService;
  private fallbackCount: Map<DataSource, number> = new Map();

  constructor(config?: Partial<DataSourceManagerConfig>) {
    this.config = {
      primarySource: DataSource.YAHOO_FINANCE,
      enableFallback: true,
      fallbackDelay: 1000,
      maxRetries: 3,
      logFallbacks: true,
      ...config,
    };

    this.yahooService = new YahooFinanceService();
    this.alphaVantageService = new AlphaVantageService();

    // Inizializza contatori fallback
    this.fallbackCount.set(DataSource.YAHOO_FINANCE, 0);
    this.fallbackCount.set(DataSource.ALPHA_VANTAGE, 0);

    console.log(
      `[INFO] DataSourceManager initialized with primary source: ${this.config.primarySource}`
    );
  }

  /**
   * Metodo principale per ottenere dati storici
   * Gestisce automaticamente il fallback tra sorgenti
   */
  public async getStockData(
    symbol: string,
    timeframe: string,
    options?: {
      startDate?: string;
      endDate?: string;
      useCache?: boolean;
      forceSource?: DataSource;
    }
  ): Promise<UnifiedDataResponse> {
    const requestParams: UnifiedRequestParams = {
      symbol,
      timeframe,
      startDate: options?.startDate,
      endDate: options?.endDate,
      useCache: options?.useCache,
    };

    // Se viene forzata una sorgente specifica
    if (options?.forceSource) {
      return this.fetchFromSource(options.forceSource, requestParams);
    }

    // Prova prima la sorgente primaria
    try {
      const primaryResponse = await this.fetchFromSource(
        this.config.primarySource,
        requestParams
      );

      if (this.config.logFallbacks) {
        console.log(
          `[INFO] Successfully fetched data for ${symbol} from ${this.config.primarySource}`
        );
      }

      return primaryResponse;
    } catch (error) {
      console.warn(
        `[WARN] Primary source (${this.config.primarySource}) failed for ${symbol}:`,
        error
      );

      // Se il fallback è abilitato, prova la sorgente secondaria
      if (this.config.enableFallback) {
        const fallbackSource = this.getFallbackSource();

        try {
          // Delay prima del fallback per evitare sovraccarico
          await this.delay(this.config.fallbackDelay);

          const fallbackResponse = await this.fetchFromSource(
            fallbackSource,
            requestParams
          );

          // Incrementa contatore fallback
          this.incrementFallbackCount(fallbackSource);

          if (this.config.logFallbacks) {
            console.log(
              `[INFO] Fallback to ${fallbackSource} successful for ${symbol}`
            );
          }

          return {
            ...fallbackResponse,
            fallbackUsed: true,
          };
        } catch (fallbackError) {
          console.error(
            `[ERROR] Both primary and fallback sources failed for ${symbol}:`,
            fallbackError
          );
          throw this.createUnifiedError(error, fallbackError, symbol);
        }
      } else {
        throw this.createUnifiedError(error, undefined, symbol);
      }
    }
  }

  /**
   * Fetch dati da una sorgente specifica
   */
  private async fetchFromSource(
    source: DataSource,
    params: UnifiedRequestParams
  ): Promise<UnifiedDataResponse> {
    switch (source) {
      case DataSource.YAHOO_FINANCE:
        return this.fetchFromYahooFinance(params);
      case DataSource.ALPHA_VANTAGE:
        return this.fetchFromAlphaVantage(params);
      default:
        throw new Error(`Unknown data source: ${source}`);
    }
  }

  /**
   * Fetch dati da Yahoo Finance
   */
  private async fetchFromYahooFinance(
    params: UnifiedRequestParams
  ): Promise<UnifiedDataResponse> {
    const yahooTimeframe = this.mapTimeframeToYahoo(params.timeframe);

    const response = await this.yahooService.getStockData(
      params.symbol,
      yahooTimeframe,
      {
        startDate: params.startDate,
        endDate: params.endDate,
        useCache: params.useCache,
      }
    );

    return this.convertYahooResponse(response);
  }

  /**
   * Fetch dati da Alpha Vantage
   */
  private async fetchFromAlphaVantage(
    params: UnifiedRequestParams
  ): Promise<UnifiedDataResponse> {
    const alphaVantageTimeframe = this.mapTimeframeToAlphaVantage(
      params.timeframe
    );

    const response = await this.alphaVantageService.getStockData(
      params.symbol,
      alphaVantageTimeframe,
      {
        outputSize: 'full',
        adjusted: true,
        useCache: params.useCache,
      }
    );

    return this.convertAlphaVantageResponse(response);
  }

  /**
   * Mappa timeframe string a Yahoo Finance timeframe
   */
  private mapTimeframeToYahoo(timeframe: string): YahooFinanceTimeframe {
    switch (timeframe.toLowerCase()) {
      case 'daily':
        // Per dati daily con date personalizzate, usiamo max per ottenere l'intervallo giornaliero
        return YahooFinanceTimeframe['max'];
      case 'weekly':
        return YahooFinanceTimeframe['max'];
      case 'monthly':
        return YahooFinanceTimeframe['max'];
      default:
        return YahooFinanceTimeframe['max'];
    }
  }

  /**
   * Mappa timeframe string a Alpha Vantage timeframe
   */
  private mapTimeframeToAlphaVantage(timeframe: string): AlphaVantageTimeframe {
    switch (timeframe.toLowerCase()) {
      case 'daily':
        return AlphaVantageTimeframe.DAILY;
      case 'weekly':
        return AlphaVantageTimeframe.WEEKLY;
      case 'monthly':
        return AlphaVantageTimeframe.MONTHLY;
      default:
        return AlphaVantageTimeframe.DAILY;
    }
  }

  /**
   * Converte risposta Yahoo Finance al formato unificato
   */
  private convertYahooResponse(
    response: YahooFinanceResponse
  ): UnifiedDataResponse {
    return {
      data: response.data,
      metadata: {
        symbol: response.metadata.symbol,
        lastRefreshed: response.metadata.lastRefreshed,
        source: DataSource.YAHOO_FINANCE,
        dataPoints: response.metadata.dataPoints,
        timeZone: response.metadata.timeZone,
      },
      success: response.success,
      source: DataSource.YAHOO_FINANCE,
      requestTimestamp: response.requestTimestamp,
      cacheHit: response.cacheHit,
    };
  }

  /**
   * Converte risposta Alpha Vantage al formato unificato
   */
  private convertAlphaVantageResponse(
    response: AlphaVantageResponse
  ): UnifiedDataResponse {
    return {
      data: response.data,
      metadata: {
        symbol: response.metadata.symbol,
        lastRefreshed: response.metadata.lastRefreshed,
        source: DataSource.ALPHA_VANTAGE,
        dataPoints: response.data.length,
        timeZone: response.metadata.timeZone,
      },
      success: response.success,
      source: DataSource.ALPHA_VANTAGE,
      requestTimestamp: response.requestTimestamp,
      cacheHit: response.cacheHit,
    };
  }

  /**
   * Ottiene la sorgente di fallback
   */
  private getFallbackSource(): DataSource {
    return this.config.primarySource === DataSource.YAHOO_FINANCE
      ? DataSource.ALPHA_VANTAGE
      : DataSource.YAHOO_FINANCE;
  }

  /**
   * Incrementa il contatore fallback per una sorgente
   */
  private incrementFallbackCount(source: DataSource): void {
    const currentCount = this.fallbackCount.get(source) || 0;
    this.fallbackCount.set(source, currentCount + 1);
  }

  /**
   * Crea un errore unificato
   */
  private createUnifiedError(
    primaryError: any,
    fallbackError: any,
    symbol: string
  ): Error {
    const primaryMessage =
      primaryError instanceof Error ? primaryError.message : 'Unknown error';
    const fallbackMessage =
      fallbackError instanceof Error ? fallbackError.message : 'Unknown error';

    return new Error(
      `Failed to fetch data for ${symbol}. Primary source error: ${primaryMessage}. Fallback source error: ${fallbackMessage}`
    );
  }

  /**
   * Delay per rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check di tutte le sorgenti
   */
  public async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    sources: {
      yahoo_finance: { status: string; responseTime?: number };
      alpha_vantage: { status: string; responseTime?: number };
    };
    fallbackStats: {
      yahoo_finance: number;
      alpha_vantage: number;
    };
  }> {
    const startTime = Date.now();

    // Test Yahoo Finance
    let yahooStatus = 'unknown';
    let yahooResponseTime: number | undefined;
    try {
      const yahooStart = Date.now();
      await this.yahooService.healthCheck();
      yahooResponseTime = Date.now() - yahooStart;
      yahooStatus = 'ok';
    } catch (error) {
      yahooStatus = 'error';
    }

    // Test Alpha Vantage
    let alphaVantageStatus = 'unknown';
    let alphaVantageResponseTime: number | undefined;
    try {
      const alphaStart = Date.now();
      await this.alphaVantageService.healthCheck();
      alphaVantageResponseTime = Date.now() - alphaStart;
      alphaVantageStatus = 'ok';
    } catch (error) {
      alphaVantageStatus = 'error';
    }

    const overallStatus =
      yahooStatus === 'ok' || alphaVantageStatus === 'ok' ? 'ok' : 'error';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      sources: {
        yahoo_finance: {
          status: yahooStatus,
          responseTime: yahooResponseTime,
        },
        alpha_vantage: {
          status: alphaVantageStatus,
          responseTime: alphaVantageResponseTime,
        },
      },
      fallbackStats: {
        yahoo_finance: this.fallbackCount.get(DataSource.YAHOO_FINANCE) || 0,
        alpha_vantage: this.fallbackCount.get(DataSource.ALPHA_VANTAGE) || 0,
      },
    };
  }

  /**
   * Ottiene statistiche di utilizzo
   */
  public getUsageStats(): {
    primarySource: DataSource;
    fallbackCounts: Map<DataSource, number>;
    config: DataSourceManagerConfig;
  } {
    return {
      primarySource: this.config.primarySource,
      fallbackCounts: new Map(this.fallbackCount),
      config: this.config,
    };
  }

  /**
   * Resetta i contatori fallback
   */
  public resetFallbackCounts(): void {
    this.fallbackCount.set(DataSource.YAHOO_FINANCE, 0);
    this.fallbackCount.set(DataSource.ALPHA_VANTAGE, 0);
  }

  /**
   * Cambia la sorgente primaria
   */
  public setPrimarySource(source: DataSource): void {
    this.config.primarySource = source;
    console.log(`[INFO] Primary source changed to: ${source}`);
  }

  /**
   * Abilita/disabilita il fallback
   */
  public setFallbackEnabled(enabled: boolean): void {
    this.config.enableFallback = enabled;
    console.log(`[INFO] Fallback ${enabled ? 'enabled' : 'disabled'}`);
  }
}
