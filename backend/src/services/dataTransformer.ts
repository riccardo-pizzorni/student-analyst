/**
 * Data Transformation Service per STUDENT ANALYST
 * 
 * Sistema di trasformazione universale che converte dati finanziari 
 * da diversi formati (Alpha Vantage, Yahoo Finance, etc.) in formato standard
 */

// ========== INTERFACCE STANDARD ==========

/**
 * Formato standard unificato per dati OHLCV
 * Tutti i dati vengono convertiti in questo formato
 */
export interface StandardOHLCVData {
  date: string;           // ISO format YYYY-MM-DD
  timestamp: string;      // ISO format YYYY-MM-DDTHH:MM:SS.sssZ
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number;  // Sempre presente, aggiustato per splits/dividendi
  volume: number;
  volumeNormalized: number; // Volume in unità standard (non K/M/B)
  source: string;         // 'alpha_vantage' | 'yahoo_finance' | etc.
  symbol: string;
  timeframe: string;      // '1min' | '5min' | 'daily' | etc.
  dataQuality: DataQualityFlags;
}

/**
 * Metadati standardizzati per response
 */
export interface StandardMetadata {
  symbol: string;
  source: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  timezone: string;
  lastRefreshed: string;
  dataCount: number;
  transformationTimestamp: string;
  splitAdjusted: boolean;
  dividendAdjusted: boolean;
  qualityScore: number; // 0-100
}

/**
 * Response standard completa
 */
export interface StandardFinancialResponse {
  data: StandardOHLCVData[];
  metadata: StandardMetadata;
  success: boolean;
  errors: TransformationError[];
  warnings: string[];
  performance: {
    processingTimeMs: number;
    recordsProcessed: number;
    recordsSkipped: number;
    cacheHit: boolean;
  };
}

/**
 * Flags di qualità dati
 */
export interface DataQualityFlags {
  hasGaps: boolean;
  suspiciousVolume: boolean;
  priceAnomalies: boolean;
  adjustedForSplits: boolean;
  validated: boolean;
  confidence: number; // 0-1
}

/**
 * Configurazione di trasformazione
 */
export interface TransformationConfig {
  enableSplitAdjustment: boolean;
  enableDividendAdjustment: boolean;
  enableVolumeNormalization: boolean;
  enableDataValidation: boolean;
  fillDataGaps: boolean;
  removeAnomalies: boolean;
  timezone: string;
  qualityThreshold: number; // 0-1, sotto questa soglia i dati vengono scartati
}

/**
 * Errore di trasformazione
 */
export interface TransformationError {
  type: 'PARSING_ERROR' | 'VALIDATION_ERROR' | 'FORMAT_ERROR' | 'DATA_QUALITY_ERROR';
  message: string;
  field?: string;
  originalValue?: unknown;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ========== ENUMS ==========

export enum SupportedDataSource {
  ALPHA_VANTAGE = 'alpha_vantage',
  YAHOO_FINANCE = 'yahoo_finance',
  IEX_CLOUD = 'iex_cloud',
  POLYGON = 'polygon',
  QUANDL = 'quandl'
}

export enum StandardTimeframe {
  MINUTE_1 = '1min',
  MINUTE_5 = '5min',
  MINUTE_15 = '15min',
  MINUTE_30 = '30min',
  HOUR_1 = '1hour',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// ========== CLASSE PRINCIPALE ==========

/**
 * Servizio principale di trasformazione dati
 * Coordina tutti i sotto-servizi per la standardizzazione completa
 */
export class DataTransformer {
  private readonly config: TransformationConfig;
  private readonly dateNormalizer: DateNormalizer;
  private readonly priceAdjuster: PriceAdjuster;
  private readonly volumeHandler: VolumeHandler;
  private readonly responseParser: ResponseParser;
  private readonly dataValidator: DataValidator;

  constructor(config?: Partial<TransformationConfig>) {
    this.config = {
      enableSplitAdjustment: true,
      enableDividendAdjustment: true,
      enableVolumeNormalization: true,
      enableDataValidation: true,
      fillDataGaps: false,
      removeAnomalies: true,
      timezone: 'America/New_York',
      qualityThreshold: 0.7,
      ...config
    };

    this.dateNormalizer = new DateNormalizer(this.config.timezone);
    this.priceAdjuster = new PriceAdjuster();
    this.volumeHandler = new VolumeHandler();
    this.responseParser = new ResponseParser();
    this.dataValidator = new DataValidator(this.config.qualityThreshold);
  }

  /**
   * Trasforma dati da qualsiasi fonte nel formato standard
   */
  public async transform(
    rawData: unknown,
    source: SupportedDataSource,
    symbol: string,
    timeframe: string
  ): Promise<StandardFinancialResponse> {
    const startTime = Date.now();
    const errors: TransformationError[] = [];
    const warnings: string[] = [];

    try {
      // 1. Parsing del formato originale
      const parsedData = this.responseParser.parse(rawData, source);
      
      // 2. Normalizzazione date
      const normalizedData = this.dateNormalizer.normalize(parsedData);
      
      // 3. Aggiustamento prezzi per splits/dividendi
      let adjustedData = normalizedData;
      if (this.config.enableSplitAdjustment) {
        adjustedData = await this.priceAdjuster.adjustForSplits(adjustedData, symbol);
      }
      
      // 4. Gestione volume
      const volumeProcessedData = this.config.enableVolumeNormalization
        ? this.volumeHandler.normalizeVolume(adjustedData)
        : adjustedData;
      
      // 5. Validazione qualità dati
      const validatedData = this.config.enableDataValidation
        ? this.dataValidator.validate(volumeProcessedData)
        : volumeProcessedData;
      
      // 6. Conversione al formato standard
      const standardData = this.convertToStandardFormat(
        validatedData,
        source,
        symbol,
        timeframe
      );
      
      // 7. Calcolo metriche finali
      const processingTime = Date.now() - startTime;
      const qualityScore = this.calculateQualityScore(standardData);
      
      const metadata: StandardMetadata = {
        symbol,
        source,
        timeframe,
        startDate: standardData.length > 0 ? standardData[standardData.length - 1].date : '',
        endDate: standardData.length > 0 ? standardData[0].date : '',
        timezone: this.config.timezone,
        lastRefreshed: new Date().toISOString(),
        dataCount: standardData.length,
        transformationTimestamp: new Date().toISOString(),
        splitAdjusted: this.config.enableSplitAdjustment,
        dividendAdjusted: this.config.enableDividendAdjustment,
        qualityScore
      };

      return {
        data: standardData,
        metadata,
        success: true,
        errors,
        warnings,
        performance: {
          processingTimeMs: processingTime,
          recordsProcessed: standardData.length,
          recordsSkipped: parsedData.length - standardData.length,
          cacheHit: false
        }
      };

    } catch (error) {
      errors.push({
        type: 'PARSING_ERROR',
        message: `Errore durante trasformazione: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
        severity: 'CRITICAL'
      });

      return {
        data: [],
        metadata: this.createErrorMetadata(symbol, source, timeframe),
        success: false,
        errors,
        warnings,
        performance: {
          processingTimeMs: Date.now() - startTime,
          recordsProcessed: 0,
          recordsSkipped: 0,
          cacheHit: false
        }
      };
    }
  }

  /**
   * Converte array di dati normalizzati nel formato standard
   */
  private convertToStandardFormat(
    data: unknown[],
    source: SupportedDataSource,
    symbol: string,
    timeframe: string
  ): StandardOHLCVData[] {
    return data.map(item => {
      const obj = item as Record<string, unknown>;
      return {
        date: obj.date as string,
        timestamp: obj.timestamp as string,
        open: obj.open as number,
        high: obj.high as number,
        low: obj.low as number,
        close: obj.close as number,
        adjustedClose: (obj.adjustedClose as number) || (obj.close as number),
        volume: obj.volume as number,
        volumeNormalized: (obj.volumeNormalized as number) || (obj.volume as number),
        source,
        symbol,
        timeframe,
        dataQuality: (obj.dataQuality as DataQualityFlags) || {
          hasGaps: false,
          suspiciousVolume: false,
          priceAnomalies: false,
          adjustedForSplits: this.config.enableSplitAdjustment,
          validated: this.config.enableDataValidation,
          confidence: 1.0
        }
      };
    });
  }

  /**
   * Calcola score di qualità complessivo dei dati
   */
  private calculateQualityScore(data: StandardOHLCVData[]): number {
    if (data.length === 0) return 0;

    const scores = data.map(item => item.dataQuality.confidence);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Penalizzazioni per problemi specifici
    const gapPenalty = data.filter(item => item.dataQuality.hasGaps).length / data.length * 0.2;
    const anomalyPenalty = data.filter(item => item.dataQuality.priceAnomalies).length / data.length * 0.3;
    
    return Math.max(0, Math.min(100, (average - gapPenalty - anomalyPenalty) * 100));
  }

  /**
   * Crea metadata di errore
   */
  private createErrorMetadata(symbol: string, source: string, timeframe: string): StandardMetadata {
    return {
      symbol,
      source,
      timeframe,
      startDate: '',
      endDate: '',
      timezone: this.config.timezone,
      lastRefreshed: new Date().toISOString(),
      dataCount: 0,
      transformationTimestamp: new Date().toISOString(),
      splitAdjusted: false,
      dividendAdjusted: false,
      qualityScore: 0
    };
  }

  /**
   * Ottieni statistiche di trasformazione
   */
  public getStats(): {
    config: TransformationConfig;
    supportedSources: SupportedDataSource[];
    supportedTimeframes: StandardTimeframe[];
  } {
    return {
      config: this.config,
      supportedSources: Object.values(SupportedDataSource),
      supportedTimeframes: Object.values(StandardTimeframe)
    };
  }

  /**
   * Aggiorna configurazione
   */
  public updateConfig(newConfig: Partial<TransformationConfig>): void {
    Object.assign(this.config, newConfig);
  }
}

// ========== IMPORT COMPONENTI REALI ==========

import { DateNormalizer } from './dateNormalizer';
import { PriceAdjuster } from './priceAdjuster';
import { ResponseParser } from './responseParser';
import { VolumeHandler } from './volumeHandler';

// ========== CLASSE DI SUPPORTO SEMPLIFICATA ==========

class DataValidator {
  constructor(private qualityThreshold: number) {}
  
  validate(data: unknown[]): unknown[] {
    // Validazione base per ora
    return data.filter(item => {
      if (!item || typeof item !== 'object') return false;
      const obj = item as Record<string, unknown>;
      return (
        typeof obj.open === 'number' &&
        typeof obj.high === 'number' &&
        typeof obj.low === 'number' &&
        typeof obj.close === 'number' &&
        (obj.open as number) > 0 &&
        (obj.high as number) > 0 &&
        (obj.low as number) > 0 &&
        (obj.close as number) > 0 &&
        (obj.high as number) >= Math.max(obj.open as number, obj.close as number) &&
        (obj.low as number) <= Math.min(obj.open as number, obj.close as number)
      );
    });
  }
} 