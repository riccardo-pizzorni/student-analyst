import axios, { AxiosError, AxiosResponse } from 'axios';
import { ErrorCodeHandler } from './errorCodeHandler';
import {
  NetworkResilienceConfig,
  NetworkResilienceService,
} from './networkResilienceService';

/**
 * Interface per i dati standard OHLCV (Open, High, Low, Close, Volume)
 * Rappresenta i dati di prezzo e volume per un singolo periodo temporale
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
 * Interface per i metadati della risposta Alpha Vantage
 * Contiene informazioni sul dataset restituito dall'API
 */
export interface AlphaVantageMetadata {
  information: string;
  symbol: string;
  lastRefreshed: string;
  interval?: string;
  outputSize?: string;
  timeZone: string;
}

/**
 * Interface per la risposta completa di Alpha Vantage
 * Combina i dati finanziari con i metadati
 */
export interface AlphaVantageResponse {
  data: OHLCVData[];
  metadata: AlphaVantageMetadata;
  success: boolean;
  source: 'alpha_vantage';
  requestTimestamp: string;
  cacheHit?: boolean;
}

/**
 * Enum per i timeframe supportati da Alpha Vantage
 * Definisce tutti gli intervalli temporali disponibili
 */
export enum AlphaVantageTimeframe {
  INTRADAY_1MIN = '1min',
  INTRADAY_5MIN = '5min',
  INTRADAY_15MIN = '15min',
  INTRADAY_30MIN = '30min',
  INTRADAY_60MIN = '60min',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * Enum per le funzioni API di Alpha Vantage
 * Mappa i timeframe alle funzioni API corrispondenti
 */
export enum AlphaVantageFunction {
  TIME_SERIES_INTRADAY = 'TIME_SERIES_INTRADAY',
  TIME_SERIES_DAILY = 'TIME_SERIES_DAILY',
  TIME_SERIES_DAILY_ADJUSTED = 'TIME_SERIES_DAILY_ADJUSTED',
  TIME_SERIES_WEEKLY = 'TIME_SERIES_WEEKLY',
  TIME_SERIES_WEEKLY_ADJUSTED = 'TIME_SERIES_WEEKLY_ADJUSTED',
  TIME_SERIES_MONTHLY = 'TIME_SERIES_MONTHLY',
  TIME_SERIES_MONTHLY_ADJUSTED = 'TIME_SERIES_MONTHLY_ADJUSTED',
  GLOBAL_QUOTE = 'GLOBAL_QUOTE',
  SYMBOL_SEARCH = 'SYMBOL_SEARCH',
}

/**
 * Enum per i tipi di errore specifici di Alpha Vantage
 * Categorizza gli errori più comuni dell'API
 */
export enum AlphaVantageErrorType {
  API_LIMIT_EXCEEDED = 'API_LIMIT_EXCEEDED',
  INVALID_SYMBOL = 'INVALID_SYMBOL',
  INVALID_FUNCTION = 'INVALID_FUNCTION',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_TIMEFRAME = 'INVALID_TIMEFRAME',
  NO_DATA_AVAILABLE = 'NO_DATA_AVAILABLE',
  MALFORMED_RESPONSE = 'MALFORMED_RESPONSE',
}

/**
 * Classe di errore personalizzata per Alpha Vantage
 * Estende Error con informazioni specifiche per debugging
 */
export class AlphaVantageError extends Error {
  public readonly type: AlphaVantageErrorType;
  public readonly originalError?: Error;
  public readonly response?: unknown;
  public readonly retryable: boolean;
  public readonly timestamp: string;

  constructor(
    type: AlphaVantageErrorType,
    message: string,
    originalError?: Error,
    response?: unknown,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AlphaVantageError';
    this.type = type;
    this.originalError = originalError;
    this.response = response;
    this.retryable = retryable;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Configurazione per il servizio Alpha Vantage
 */
export interface AlphaVantageConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  validateData: boolean;
  useAdjusted: boolean;
}

/**
 * Servizio principale per l'integrazione con Alpha Vantage API
 * Gestisce richieste, error handling, parsing e validazione dei dati finanziari
 */
export class AlphaVantageService {
  private readonly config: AlphaVantageConfig;
  private readonly cache: Map<
    string,
    { data: AlphaVantageResponse; timestamp: number }
  >;
  private readonly errorHandler: ErrorCodeHandler;
  private readonly resilienceService: NetworkResilienceService;

  constructor(config?: Partial<AlphaVantageConfig>) {
    this.config = {
      baseUrl: process.env.BACKEND_URL || 'http://localhost:10000',
      timeout: 30000, // 30 secondi
      retryAttempts: 3,
      retryDelay: 1000, // 1 secondo
      cacheEnabled: true,
      cacheTTL: 60000, // 1 minuto per dati intraday
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
  }

  /**
   * Funzione principale per ottenere dati azionari
   * Punto di accesso unificato per tutti i timeframe
   */
  public async getStockData(
    symbol: string,
    timeframe: AlphaVantageTimeframe,
    options?: {
      outputSize?: 'compact' | 'full';
      adjusted?: boolean;
      month?: string;
      useCache?: boolean;
    }
  ): Promise<AlphaVantageResponse> {
    try {
      // Validazione input
      this.validateSymbol(symbol);
      this.validateTimeframe(timeframe);

      // Generazione chiave cache
      const cacheKey = this.generateCacheKey(symbol, timeframe, options);

      // Controllo cache
      if (options?.useCache !== false && this.config.cacheEnabled) {
        const cachedData = this.getCachedData(cacheKey, timeframe);
        if (cachedData) {
          return { ...cachedData, cacheHit: true };
        }
      }

      // Chiamata API con retry logic
      const response = await this.makeApiCall(symbol, timeframe, options);

      // Caching della risposta
      if (this.config.cacheEnabled) {
        this.setCachedData(cacheKey, response, timeframe);
      }

      return response;
    } catch (error) {
      throw this.handleError(error, symbol, timeframe);
    }
  }

  /**
   * Validazione del simbolo azionario
   */
  private validateSymbol(symbol: string): void {
    if (!symbol || typeof symbol !== 'string') {
      throw new AlphaVantageError(
        AlphaVantageErrorType.INVALID_SYMBOL,
        'Symbol deve essere una stringa non vuota'
      );
    }

    // Regex per simboli azionari validi (letters, numbers, dots, hyphens)
    const symbolPattern = /^[A-Za-z0-9.-]+$/;
    if (!symbolPattern.test(symbol)) {
      throw new AlphaVantageError(
        AlphaVantageErrorType.INVALID_SYMBOL,
        `Simbolo "${symbol}" contiene caratteri non validi. Utilizzare solo lettere, numeri, punti e trattini`
      );
    }

    if (symbol.length > 10) {
      throw new AlphaVantageError(
        AlphaVantageErrorType.INVALID_SYMBOL,
        `Simbolo "${symbol}" troppo lungo. Massimo 10 caratteri`
      );
    }
  }

  /**
   * Validazione del timeframe
   */
  private validateTimeframe(timeframe: AlphaVantageTimeframe): void {
    if (!Object.values(AlphaVantageTimeframe).includes(timeframe)) {
      throw new AlphaVantageError(
        AlphaVantageErrorType.INVALID_TIMEFRAME,
        `Timeframe "${timeframe}" non supportato. Valori supportati: ${Object.values(AlphaVantageTimeframe).join(', ')}`
      );
    }
  }

  /**
   * Esecuzione della chiamata API con retry logic
   */
  private async makeApiCall(
    symbol: string,
    timeframe: AlphaVantageTimeframe,
    options?: Record<string, unknown>
  ): Promise<AlphaVantageResponse> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.executeApiRequest(
          symbol,
          timeframe,
          options
        );
        return response;
      } catch (error) {
        lastError = error as Error;

        // Non fare retry per alcuni tipi di errore
        if (error instanceof AlphaVantageError && !error.retryable) {
          throw error;
        }

        // Delay prima del retry
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Esecuzione effettiva della richiesta HTTP
   */
  private async executeApiRequest(
    symbol: string,
    timeframe: AlphaVantageTimeframe,
    options?: Record<string, unknown>
  ): Promise<AlphaVantageResponse> {
    try {
      // Determina la funzione API da utilizzare
      const apiFunction = this.getApiFunction(
        timeframe,
        typeof options?.adjusted === 'boolean' ? options.adjusted : undefined
      );

      // Costruisce i parametri della richiesta
      const params = this.buildRequestParams(
        apiFunction,
        symbol,
        timeframe,
        options
      );

      // Esegue la richiesta tramite il nostro proxy API sicuro
      const url = `${this.config.baseUrl}/api/v1/alpha-vantage`;

      const axiosResponse: AxiosResponse = await axios.get(url, {
        params,
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'StudentAnalyst/1.0',
          Accept: 'application/json',
        },
      });

      // Verifica response status
      if (axiosResponse.status !== 200) {
        throw new AlphaVantageError(
          AlphaVantageErrorType.NETWORK_ERROR,
          `HTTP Error: ${axiosResponse.status} - ${axiosResponse.statusText}`,
          undefined,
          axiosResponse.data,
          true
        );
      }

      // Parse e validazione della risposta
      const parsedResponse = this.parseApiResponse(
        axiosResponse.data,
        timeframe
      );

      return parsedResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return this.handleAxiosError(error);
      }
      throw error;
    }
  }

  /**
   * Determina la funzione API Alpha Vantage da utilizzare
   */
  private getApiFunction(
    timeframe: AlphaVantageTimeframe,
    useAdjusted?: boolean
  ): AlphaVantageFunction {
    // Sposto dichiarazioni fuori dai case
    let apiFunction: AlphaVantageFunction;
    switch (timeframe) {
      case AlphaVantageTimeframe.INTRADAY_1MIN:
      case AlphaVantageTimeframe.INTRADAY_5MIN:
      case AlphaVantageTimeframe.INTRADAY_15MIN:
      case AlphaVantageTimeframe.INTRADAY_30MIN:
      case AlphaVantageTimeframe.INTRADAY_60MIN:
        apiFunction = AlphaVantageFunction.TIME_SERIES_INTRADAY;
        break;
      case AlphaVantageTimeframe.DAILY:
        apiFunction = useAdjusted
          ? AlphaVantageFunction.TIME_SERIES_DAILY_ADJUSTED
          : AlphaVantageFunction.TIME_SERIES_DAILY;
        break;
      case AlphaVantageTimeframe.WEEKLY:
        apiFunction = useAdjusted
          ? AlphaVantageFunction.TIME_SERIES_WEEKLY_ADJUSTED
          : AlphaVantageFunction.TIME_SERIES_WEEKLY;
        break;
      case AlphaVantageTimeframe.MONTHLY:
        apiFunction = useAdjusted
          ? AlphaVantageFunction.TIME_SERIES_MONTHLY_ADJUSTED
          : AlphaVantageFunction.TIME_SERIES_MONTHLY;
        break;
      default:
        throw new AlphaVantageError(
          AlphaVantageErrorType.INVALID_TIMEFRAME,
          `Timeframe non supportato: ${timeframe}`
        );
    }
    return apiFunction;
  }

  /**
   * Costruisce i parametri della richiesta API
   */
  private buildRequestParams(
    apiFunction: AlphaVantageFunction,
    symbol: string,
    timeframe: AlphaVantageTimeframe,
    options?: Record<string, unknown>
  ): Record<string, string> {
    const params: Record<string, string> = {
      function: apiFunction,
      symbol: symbol.toUpperCase(),
      datatype: 'json',
    };

    // Parametri specifici per intraday
    if (apiFunction === AlphaVantageFunction.TIME_SERIES_INTRADAY) {
      params.interval = timeframe;
      params.adjusted = 'true';
      params.extended_hours = 'true';

      if (options?.month) {
        params.month = typeof options.month === 'string' ? options.month : '';
      }
    }

    // Output size
    if (options?.outputSize) {
      params.outputsize =
        typeof options.outputSize === 'string' ? options.outputSize : 'compact';
    }

    return params;
  }

  /**
   * Parsing e validazione della risposta Alpha Vantage
   */
  private parseApiResponse(
    responseData: Record<string, unknown>,
    timeframe: AlphaVantageTimeframe
  ): AlphaVantageResponse {
    try {
      // Verifica presenza di errori nell'API response
      this.checkForApiErrors(responseData);

      // Identifica le chiavi di dati e metadati
      const { dataKey, metadataKey } = this.identifyResponseKeys(
        responseData,
        timeframe
      );

      if (
        !dataKey ||
        !metadataKey ||
        !responseData[dataKey] ||
        !responseData[metadataKey]
      ) {
        throw new AlphaVantageError(
          AlphaVantageErrorType.MALFORMED_RESPONSE,
          `Risposta API malformata: chiavi mancanti ${String(dataKey)} o ${String(metadataKey)}`,
          undefined,
          responseData as Record<string, unknown>
        );
      }

      // Parsing dei metadati
      const metadata = this.parseMetadata(
        (responseData[metadataKey] ?? {}) as Record<string, unknown>
      );

      // Parsing dei dati OHLCV
      const ohlcvData = this.parseOHLCVData(
        (responseData[dataKey] ?? {}) as Record<string, unknown>,
        timeframe
      );

      // Validazione dati se abilitata
      if (this.config.validateData) {
        this.validateOHLCVData(ohlcvData);
      }

      return {
        data: ohlcvData,
        metadata,
        success: true,
        source: 'alpha_vantage',
        requestTimestamp: new Date().toISOString(),
        cacheHit: false,
      };
    } catch (error) {
      if (error instanceof AlphaVantageError) {
        throw error;
      }

      throw new AlphaVantageError(
        AlphaVantageErrorType.PARSING_ERROR,
        `Errore nel parsing della risposta: ${(error as Error).message}`,
        error as Error,
        responseData as Record<string, unknown>
      );
    }
  }

  /**
   * Verifica presenza di errori nella risposta API
   */
  private checkForApiErrors(responseData: Record<string, unknown>): void {
    // Controllo errore di rate limit
    if (responseData['Note'] && typeof responseData['Note'] === 'string') {
      const note = responseData['Note'];
      if (note.includes('rate limit') || note.includes('25 requests per day')) {
        throw new AlphaVantageError(
          AlphaVantageErrorType.API_LIMIT_EXCEEDED,
          'Limite giornaliero di 25 richieste Alpha Vantage raggiunto. Riprovare domani o considerare un piano premium.',
          undefined,
          responseData as Record<string, unknown>,
          false // Non retryable
        );
      }

      if (note.includes('Thank you for using Alpha Vantage')) {
        throw new AlphaVantageError(
          AlphaVantageErrorType.RATE_LIMIT,
          'Rate limit Alpha Vantage raggiunto. Riprovare tra qualche minuto.',
          undefined,
          responseData as Record<string, unknown>,
          true // Retryable
        );
      }
    }

    // Controllo errore generico in "Information"
    if (
      responseData['Information'] &&
      typeof responseData['Information'] === 'string'
    ) {
      const info = responseData['Information'];
      throw new AlphaVantageError(
        AlphaVantageErrorType.INVALID_SYMBOL,
        `Errore API Alpha Vantage: ${info}`,
        undefined,
        responseData as Record<string, unknown>,
        false
      );
    }

    // Controllo errore "Error Message"
    if (responseData['Error Message']) {
      throw new AlphaVantageError(
        AlphaVantageErrorType.INVALID_FUNCTION,
        `Errore funzione API: ${responseData['Error Message']}`,
        undefined,
        responseData as Record<string, unknown>,
        false
      );
    }
  }

  /**
   * Identifica le chiavi di dati e metadati nella risposta
   */
  private identifyResponseKeys(
    responseData: Record<string, unknown>,
    timeframe: AlphaVantageTimeframe
  ): { dataKey: string; metadataKey: string } {
    const keys = Object.keys(responseData);

    // Cerca la chiave dei metadati
    const metadataKey =
      keys.find(key => key.toLowerCase().includes('meta data')) || '';

    // Cerca la chiave dei dati time series
    let dataKey = '';

    if (timeframe.includes('min')) {
      dataKey =
        keys.find(key => key.includes('Time Series') && key.includes('min')) ||
        '';
    } else if (timeframe === 'daily') {
      dataKey = keys.find(key => key.includes('Time Series (Daily)')) || '';
    } else if (timeframe === 'weekly') {
      dataKey = keys.find(key => key.includes('Weekly')) || '';
    } else if (timeframe === 'monthly') {
      dataKey = keys.find(key => key.includes('Monthly')) || '';
    }

    if (!dataKey || !metadataKey) {
      throw new AlphaVantageError(
        AlphaVantageErrorType.MALFORMED_RESPONSE,
        `Impossibile identificare le chiavi di dati nella risposta. Chiavi disponibili: ${keys.join(', ')}`,
        undefined,
        responseData as Record<string, unknown>
      );
    }

    return { dataKey, metadataKey };
  }

  /**
   * Parsing dei metadati
   */
  private parseMetadata(
    metadataRaw: Record<string, unknown>
  ): AlphaVantageMetadata {
    const meta = metadataRaw as Record<string, string>;
    return {
      information:
        typeof meta['1. Information'] === 'string'
          ? meta['1. Information']
          : '',
      symbol: typeof meta['2. Symbol'] === 'string' ? meta['2. Symbol'] : '',
      lastRefreshed:
        typeof meta['3. Last Refreshed'] === 'string'
          ? meta['3. Last Refreshed']
          : '',
      interval:
        typeof meta['4. Interval'] === 'string'
          ? meta['4. Interval']
          : undefined,
      outputSize:
        typeof meta['5. Output Size'] === 'string'
          ? meta['5. Output Size']
          : undefined,
      timeZone:
        typeof meta['6. Time Zone'] === 'string'
          ? meta['6. Time Zone']
          : typeof meta['5. Time Zone'] === 'string'
            ? meta['5. Time Zone']
            : 'US/Eastern',
    };
  }

  /**
   * Parsing dei dati OHLCV
   */
  private parseOHLCVData(
    rawData: Record<string, unknown>,
    timeframe: AlphaVantageTimeframe
  ): OHLCVData[] {
    const data: OHLCVData[] = [];

    for (const [timestamp, values] of Object.entries(rawData)) {
      try {
        if (typeof values !== 'object' || values === null) continue;
        const v = values as Record<string, unknown>;
        const open =
          typeof v['1. open'] === 'string'
            ? parseFloat(v['1. open'] as string)
            : NaN;
        const high =
          typeof v['2. high'] === 'string'
            ? parseFloat(v['2. high'] as string)
            : NaN;
        const low =
          typeof v['3. low'] === 'string'
            ? parseFloat(v['3. low'] as string)
            : NaN;
        const close =
          typeof v['4. close'] === 'string'
            ? parseFloat(v['4. close'] as string)
            : NaN;
        const volume =
          typeof v['5. volume'] === 'string'
            ? parseInt(v['5. volume'] as string, 10)
            : NaN;
        const ohlcv: OHLCVData = {
          date: timestamp,
          open,
          high,
          low,
          close,
          volume,
        };
        if (typeof v['5. adjusted close'] === 'string') {
          ohlcv.adjustedClose = parseFloat(v['5. adjusted close'] as string);
        }
        if (timeframe.includes('min')) {
          ohlcv.timestamp = timestamp;
        }
        data.push(ohlcv);
      } catch {
        // skip row
      }
    }

    // Ordina per data (più recente prima)
    data.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return data;
  }

  /**
   * Validazione dei dati OHLCV
   */
  private validateOHLCVData(data: OHLCVData[]): void {
    if (!data || data.length === 0) {
      throw new AlphaVantageError(
        AlphaVantageErrorType.NO_DATA_AVAILABLE,
        'Nessun dato disponibile per il simbolo e timeframe richiesti'
      );
    }

    // Validazione dei singoli record
    for (const record of data) {
      if (
        record.open <= 0 ||
        record.high <= 0 ||
        record.low <= 0 ||
        record.close <= 0
      ) {
        throw new AlphaVantageError(
          AlphaVantageErrorType.PARSING_ERROR,
          `Dati di prezzo non validi per ${record.date}: prezzi devono essere positivi`
        );
      }

      if (record.high < record.low) {
        throw new AlphaVantageError(
          AlphaVantageErrorType.PARSING_ERROR,
          `Dati inconsistenti per ${record.date}: high (${record.high}) < low (${record.low})`
        );
      }

      if (record.close > record.high || record.close < record.low) {
        console.warn(
          `Possibile inconsistenza per ${record.date}: close fuori dal range high-low`
        );
      }

      if (record.volume < 0) {
        throw new AlphaVantageError(
          AlphaVantageErrorType.PARSING_ERROR,
          `Volume negativo per ${record.date}: ${record.volume}`
        );
      }
    }
  }

  /**
   * Gestione errori Axios
   */
  private handleAxiosError(error: AxiosError): never {
    if (error.response) {
      // Server ha risposto con status di errore
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401 || status === 403) {
        throw new AlphaVantageError(
          AlphaVantageErrorType.AUTHENTICATION_ERROR,
          `Errore di autenticazione: ${status}. Verificare la validità dell'API key`,
          error,
          data,
          false
        );
      }

      if (status >= 500) {
        throw new AlphaVantageError(
          AlphaVantageErrorType.NETWORK_ERROR,
          `Errore server Alpha Vantage: ${status}`,
          error,
          data,
          true // Retryable
        );
      }

      throw new AlphaVantageError(
        AlphaVantageErrorType.NETWORK_ERROR,
        `Errore HTTP: ${status} - ${error.message}`,
        error,
        data,
        false
      );
    } else if (error.request) {
      // Nessuna risposta ricevuta
      throw new AlphaVantageError(
        AlphaVantageErrorType.NETWORK_ERROR,
        'Nessuna risposta dal server Alpha Vantage. Verificare la connessione di rete',
        error,
        undefined,
        true // Retryable
      );
    } else {
      // Errore nella configurazione della richiesta
      throw new AlphaVantageError(
        AlphaVantageErrorType.NETWORK_ERROR,
        `Errore configurazione richiesta: ${error.message}`,
        error,
        undefined,
        false
      );
    }
  }

  /**
   * Gestione generale degli errori
   */
  private handleError(
    error: unknown,
    symbol: string,
    timeframe: AlphaVantageTimeframe
  ): AlphaVantageError {
    if (error instanceof AlphaVantageError) {
      return error;
    }

    return new AlphaVantageError(
      AlphaVantageErrorType.NETWORK_ERROR,
      `Errore inaspettato per ${symbol} (${timeframe}): ${(error as Error).message}`,
      error as Error,
      undefined,
      false
    );
  }

  /**
   * Cache management
   */
  private generateCacheKey(
    symbol: string,
    timeframe: AlphaVantageTimeframe,
    options?: Record<string, unknown>
  ): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${symbol}_${timeframe}_${optionsStr}`;
  }

  private getCachedData(
    cacheKey: string,
    timeframe: AlphaVantageTimeframe
  ): AlphaVantageResponse | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Determina TTL basato sul timeframe
    let ttl = this.config.cacheTTL;
    if (timeframe.includes('min')) {
      ttl = 60000; // 1 minuto per intraday
    } else if (timeframe === 'daily') {
      ttl = 300000; // 5 minuti per daily
    } else {
      ttl = 3600000; // 1 ora per weekly/monthly
    }

    const now = Date.now();
    if (now - cached.timestamp > ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  private setCachedData(
    cacheKey: string,
    data: AlphaVantageResponse,
    timeframe: AlphaVantageTimeframe
  ): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Cleanup cache se troppo grande
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Rimuovi il 20% più vecchio
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Utility per delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Metodi di utilità pubblici
   */

  /**
   * Verifica lo stato del servizio
   */
  public async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    cacheSize: number;
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cacheSize: this.cache.size,
    };
  }

  /**
   * Svuota la cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Ottieni statistiche della cache
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Valida una combinazione simbolo-timeframe senza fare la chiamata
   */
  public validateRequest(
    symbol: string,
    timeframe: AlphaVantageTimeframe
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.validateSymbol(symbol);
    } catch (error) {
      if (error instanceof AlphaVantageError) {
        errors.push(error.message);
      }
    }

    try {
      this.validateTimeframe(timeframe);
    } catch (error) {
      if (error instanceof AlphaVantageError) {
        errors.push(error.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
