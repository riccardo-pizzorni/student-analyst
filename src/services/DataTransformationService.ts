/**
 * STUDENT ANALYST - Data Transformation Service
 * Converts raw financial data from various sources into standardized format
 */

import { 
  NormalizedDataset, 
  NormalizedPricePoint, 
  StandardTimeframe,
  DataQuality,
  ProcessingInfo,
  NormalizedMetadata,
  DataAnomaly,
  CorporateAction,
  DataSource,
  VALIDATION_CONSTANTS
} from '../models/StandardizedData';
import { StockData, StockDataPoint, Timeframe } from '../services/AlphaVantageService';

export interface TransformationOptions {
  // Data processing options
  adjustForSplits: boolean;
  adjustForDividends: boolean;
  detectAnomalies: boolean;
  validateData: boolean;
  
  // Quality control
  minQualityScore: number;
  allowPartialData: boolean;
  
  // Performance options
  enableCaching: boolean;
  batchSize?: number;
}

export interface TransformationResult {
  success: boolean;
  data?: NormalizedDataset;
  errors: string[];
  warnings: string[];
  processingTime: number;
  transformationSummary: {
    recordsProcessed: number;
    recordsFiltered: number;
    anomaliesDetected: number;
    adjustmentsApplied: number;
  };
}

export class DataTransformationService {
  private static instance: DataTransformationService;
  
  // Transformation statistics
  private totalTransformations = 0;
  private totalProcessingTime = 0;
  private errorCount = 0;
  
  // Cache for expensive operations
  private splitDetectionCache = new Map<string, CorporateAction[]>();
  private statisticsCache = new Map<string, unknown>();

  private constructor() {}

  public static getInstance(): DataTransformationService {
    if (!DataTransformationService.instance) {
      DataTransformationService.instance = new DataTransformationService();
    }
    return DataTransformationService.instance;
  }

  /**
   * Main transformation method - converts Alpha Vantage data to normalized format
   */
  public async transformAlphaVantageData(
    rawData: StockData,
    options: Partial<TransformationOptions> = {}
  ): Promise<TransformationResult> {
    const startTime = Date.now();
    const result: TransformationResult = {
      success: false,
      errors: [],
      warnings: [],
      processingTime: 0,
      transformationSummary: {
        recordsProcessed: 0,
        recordsFiltered: 0,
        anomaliesDetected: 0,
        adjustmentsApplied: 0
      }
    };

    try {
      // Set default options
      const transformOptions: TransformationOptions = {
        adjustForSplits: true,
        adjustForDividends: true,
        detectAnomalies: true,
        validateData: true,
        minQualityScore: VALIDATION_CONSTANTS.MIN_QUALITY_SCORE,
        allowPartialData: true,
        enableCaching: true,
        ...options
      };

      // Validate input data
      const validationResult = this.validateInputData(rawData);
      if (!validationResult.isValid) {
        result.errors.push(...validationResult.errors);
        return result;
      }

      // Transform data points
      const transformedPoints = await this.transformDataPoints(
        rawData.data, 
        rawData.symbol
      );

      // Detect corporate actions if requested
      let corporateActions: CorporateAction[] = [];
      if (transformOptions.adjustForSplits || transformOptions.adjustForDividends) {
        corporateActions = await this.detectCorporateActions(transformedPoints, rawData.symbol);
        result.transformationSummary.adjustmentsApplied = corporateActions.length;
      }

      // Apply price adjustments
      if (corporateActions.length > 0) {
        this.applyPriceAdjustments(transformedPoints, corporateActions);
      }

      // Detect anomalies if requested
      let anomalies: DataAnomaly[] = [];
      if (transformOptions.detectAnomalies) {
        anomalies = this.detectDataAnomalies(transformedPoints);
        result.transformationSummary.anomaliesDetected = anomalies.length;
      }

      // Calculate data quality metrics
      const quality = this.calculateDataQuality(transformedPoints, anomalies);
      
      // Check if quality meets minimum requirements
      if (quality.qualityScore < transformOptions.minQualityScore && !transformOptions.allowPartialData) {
        result.errors.push(`Data quality score (${quality.qualityScore}) below minimum threshold (${transformOptions.minQualityScore})`);
        return result;
      }

      // Build metadata
      const metadata = this.buildMetadata(rawData, transformedPoints, corporateActions);
      
      // Build processing info
      const processing = this.buildProcessingInfo(startTime, transformedPoints.length, transformOptions);

      // Create final normalized dataset
      const normalizedDataset: NormalizedDataset = {
        symbol: rawData.symbol.toUpperCase(),
        currency: 'USD', // Alpha Vantage data is typically in USD
        timeframe: this.mapTimeframe(rawData.timeframe),
        dataType: this.detectDataType(rawData.symbol),
        data: transformedPoints,
        metadata,
        quality,
        processing
      };

      // Update statistics
      result.transformationSummary.recordsProcessed = rawData.data.length;
      result.transformationSummary.recordsFiltered = rawData.data.length - transformedPoints.length;

      result.success = true;
      result.data = normalizedDataset;
      
      if (quality.qualityScore < VALIDATION_CONSTANTS.HIGH_QUALITY_SCORE) {
        result.warnings.push(`Data quality could be improved (score: ${quality.qualityScore})`);
      }

      this.totalTransformations++;
      
    } catch (error) {
      this.errorCount++;
      result.errors.push(`Transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      result.processingTime = Date.now() - startTime;
      this.totalProcessingTime += result.processingTime;
    }

    return result;
  }

  /**
   * Transform individual data points from Alpha Vantage format to normalized format
   */
  private async transformDataPoints(
    rawPoints: StockDataPoint[],
    symbol: string
  ): Promise<NormalizedPricePoint[]> {
    const transformedPoints: NormalizedPricePoint[] = [];

    for (const point of rawPoints) {
      try {
        // Normalize date to ISO format in UTC
        const normalizedDate = this.normalizeDateString(point.date);
        
        // Validate date
        if (!this.isValidDate(normalizedDate)) {
          continue; // Skip invalid dates
        }

        // Check if market was open
        const marketOpen = this.isMarketOpen(normalizedDate, point);

        // Validate OHLC consistency
        const ohlcValid = this.validateOHLC(point);
        const validationFlags: string[] = [];
        
        if (!ohlcValid) {
          validationFlags.push('INVALID_OHLC');
        }

        // Convert volume to shares (detect if in thousands/millions)
        const normalizedVolume = this.normalizeVolume(point.volume);

        // Create normalized point
        const normalizedPoint: NormalizedPricePoint = {
          date: normalizedDate,
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
          volume: normalizedVolume,
          adjustedClose: point.adjustedClose,
          isAdjusted: false, // Will be set true if adjustments are applied
          hasAnomalies: false, // Will be determined by anomaly detection
          validationFlags,
          marketOpen
        };

        // Store raw prices for reference
        normalizedPoint.rawOpen = point.open;
        normalizedPoint.rawHigh = point.high;
        normalizedPoint.rawLow = point.low;
        normalizedPoint.rawClose = point.close;

        transformedPoints.push(normalizedPoint);
        
      } catch (error) {
        console.warn(`Failed to transform data point for ${symbol} on ${point.date}:`, error);
        continue; // Skip problematic points
      }
    }

    return transformedPoints.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Normalize date string to ISO 8601 format in UTC
   */
  private normalizeDateString(dateString: string): string {
    // Alpha Vantage typically returns dates in YYYY-MM-DD format
    // We need to ensure it's properly formatted and in UTC
    
    try {
      const date = new Date(dateString + 'T00:00:00.000Z'); // Force UTC
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD part only
    } catch {
      throw new Error(`Failed to normalize date: ${dateString}`);
    }
  }

  /**
   * Validate if a date string is valid and within acceptable range
   */
  private isValidDate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const oldestValid = new Date(VALIDATION_CONSTANTS.OLDEST_VALID_DATE);
      const futureLimit = new Date(now.getTime() + VALIDATION_CONSTANTS.FUTURE_DATE_TOLERANCE_DAYS * 24 * 60 * 60 * 1000);

      return date >= oldestValid && date <= futureLimit;
    } catch {
      return false;
    }
  }

  /**
   * Check if market was open on given date
   */
  private isMarketOpen(dateString: string, point: StockDataPoint): boolean {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    
    // Basic check: weekdays (Monday=1 to Friday=5)
    // Note: This doesn't account for holidays - could be enhanced
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    // If volume is 0, market was likely closed
    const hasVolume = point.volume > 0;
    
    return isWeekday && hasVolume;
  }

  /**
   * Validate OHLC price consistency
   */
  private validateOHLC(point: StockDataPoint): boolean {
    return (
      point.high >= point.low &&
      point.high >= point.open &&
      point.high >= point.close &&
      point.low <= point.open &&
      point.low <= point.close &&
      point.open > 0 &&
      point.high > 0 &&
      point.low > 0 &&
      point.close > 0
    );
  }

  /**
   * Normalize volume to individual shares
   */
  private normalizeVolume(volume: number): number {
    // Alpha Vantage typically returns volume in shares already
    // But sometimes it might be in thousands or millions
    // Heuristic: if volume is suspiciously low for a public stock, it might be in thousands
    
    if (volume < 100 && volume > 0) {
      // Likely in thousands
      return volume * 1000;
    }
    
    return Math.round(volume);
  }

  /**
   * Detect corporate actions from price and volume patterns
   */
  private async detectCorporateActions(
    dataPoints: NormalizedPricePoint[],
    symbol: string
  ): Promise<CorporateAction[]> {
    const cacheKey = `${symbol}_splits`;
    if (this.splitDetectionCache.has(cacheKey)) {
      return this.splitDetectionCache.get(cacheKey)!;
    }

    const actions: CorporateAction[] = [];
    
    // Sort by date (oldest first) for chronological analysis
    const sortedPoints = [...dataPoints].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (let i = 1; i < sortedPoints.length; i++) {
      const current = sortedPoints[i];
      const previous = sortedPoints[i - 1];
      
      // Look for stock splits: significant price drop with volume spike
      const priceRatio = previous.close / current.open;
      const volumeRatio = current.volume / previous.volume;
      
      // Common split ratios: 2:1, 3:1, 3:2, etc.
      const commonRatios = [2.0, 3.0, 1.5, 4.0, 5.0];
      
      for (const ratio of commonRatios) {
        if (Math.abs(priceRatio - ratio) < 0.1 && volumeRatio > 2.0) {
          const action: CorporateAction = {
            date: current.date,
            type: 'SPLIT',
            description: `${ratio}:1 stock split detected`,
            ratio,
            adjustmentFactor: 1 / ratio
          };
          actions.push(action);
          break;
        }
      }
    }

    this.splitDetectionCache.set(cacheKey, actions);
    return actions;
  }

  /**
   * Apply price adjustments for corporate actions
   */
  private applyPriceAdjustments(
    dataPoints: NormalizedPricePoint[],
    corporateActions: CorporateAction[]
  ): void {
    for (const action of corporateActions) {
      const actionDate = new Date(action.date);
      
      for (const point of dataPoints) {
        const pointDate = new Date(point.date);
        
        // Apply adjustment to all data points before the action date
        if (pointDate < actionDate && action.adjustmentFactor) {
          point.open *= action.adjustmentFactor;
          point.high *= action.adjustmentFactor;
          point.low *= action.adjustmentFactor;
          point.close *= action.adjustmentFactor;
          
          if (point.adjustedClose) {
            point.adjustedClose *= action.adjustmentFactor;
          }
          
          point.isAdjusted = true;
          point.splitCoefficient = action.ratio;
        }
      }
    }
  }

  /**
   * Detect data anomalies
   */
  private detectDataAnomalies(dataPoints: NormalizedPricePoint[]): DataAnomaly[] {
    const anomalies: DataAnomaly[] = [];
    
    if (dataPoints.length < 2) return anomalies;

    // Calculate average volume for comparison
    const avgVolume = dataPoints.reduce((sum, p) => sum + p.volume, 0) / dataPoints.length;

    for (let i = 0; i < dataPoints.length; i++) {
      const point = dataPoints[i];
      
      // Volume spike detection
      if (point.volume > avgVolume * VALIDATION_CONSTANTS.MAX_VOLUME_MULTIPLIER) {
        anomalies.push({
          type: 'VOLUME_SPIKE',
          severity: point.volume > avgVolume * 100 ? 'HIGH' : 'MEDIUM',
          date: point.date,
          description: `Volume ${Math.round(point.volume / avgVolume)}x above average`,
          originalValue: point.volume,
          autoFixed: false
        });
      }

      // Price spike detection (only if we have previous day)
      if (i > 0) {
        const prevPoint = dataPoints[i - 1];
        const priceChange = Math.abs(point.close - prevPoint.close) / prevPoint.close;
        
        if (priceChange > VALIDATION_CONSTANTS.MAX_PRICE_CHANGE) {
          anomalies.push({
            type: 'PRICE_SPIKE',
            severity: priceChange > 0.8 ? 'HIGH' : 'MEDIUM',
            date: point.date,
            description: `Price change ${(priceChange * 100).toFixed(1)}% from previous day`,
            originalValue: point.close,
            autoFixed: false
          });
        }
      }

      // Mark points with anomalies
      const pointAnomalies = anomalies.filter(a => a.date === point.date);
      if (pointAnomalies.length > 0) {
        point.hasAnomalies = true;
        point.validationFlags.push(...pointAnomalies.map(a => a.type));
      }
    }

    return anomalies;
  }

  /**
   * Calculate data quality metrics
   */
  private calculateDataQuality(
    dataPoints: NormalizedPricePoint[],
    anomalies: DataAnomaly[]
  ): DataQuality {
    const totalPoints = dataPoints.length;
    const anomalousPoints = dataPoints.filter(p => p.hasAnomalies).length;
    const invalidPoints = dataPoints.filter(p => p.validationFlags.length > 0).length;
    
    // Calculate quality score (0-100)
    let qualityScore = 100;
    qualityScore -= (anomalousPoints / totalPoints) * 30; // Anomalies reduce score
    qualityScore -= (invalidPoints / totalPoints) * 20;   // Validation issues reduce score
    qualityScore = Math.max(0, Math.min(100, qualityScore));

    return {
      qualityScore: Math.round(qualityScore),
      hasIncompleteData: false, // Could be enhanced to detect gaps
      hasPriceAnomalies: anomalies.some(a => a.type === 'PRICE_SPIKE'),
      hasVolumeAnomalies: anomalies.some(a => a.type === 'VOLUME_SPIKE'),
      hasDateGaps: false, // Could be enhanced to detect missing dates
      anomalies,
      missingDataRanges: [], // Could be enhanced
      priceConfidence: Math.max(70, qualityScore),
      volumeConfidence: Math.max(60, qualityScore - 10),
      dateConfidence: 95 // Alpha Vantage dates are typically reliable
    };
  }

  /**
   * Build metadata for the normalized dataset
   */
  private buildMetadata(
    rawData: StockData,
    transformedPoints: NormalizedPricePoint[],
    corporateActions: CorporateAction[]
  ): NormalizedMetadata {
    const now = new Date();
    const lastRefreshed = new Date(rawData.metadata.lastRefreshed);
    const ageInMinutes = (now.getTime() - lastRefreshed.getTime()) / (1000 * 60);

    return {
      dataSource: 'ALPHA_VANTAGE' as DataSource,
      dataProvider: 'Alpha Vantage Inc.',
      lastRefreshed: rawData.metadata.lastRefreshed,
      timezone: rawData.metadata.timeZone || 'US/Eastern',
      marketHours: {
        open: '09:30',
        close: '16:00',
        timezone: 'US/Eastern'
      },
      startDate: transformedPoints[transformedPoints.length - 1]?.date || '',
      endDate: transformedPoints[0]?.date || '',
      totalDataPoints: transformedPoints.length,
      corporateActions,
      ageInMinutes: Math.round(ageInMinutes),
      isStale: this.isDataStale(rawData.timeframe, ageInMinutes)
    };
  }

  /**
   * Build processing information
   */
  private buildProcessingInfo(
    startTime: number,
    recordCount: number,
    options: TransformationOptions
  ): ProcessingInfo {
    const now = new Date();
    const duration = Date.now() - startTime;

    const transformationsApplied: string[] = [];
    if (options.adjustForSplits) transformationsApplied.push('SPLIT_ADJUSTMENT');
    if (options.adjustForDividends) transformationsApplied.push('DIVIDEND_ADJUSTMENT');
    if (options.detectAnomalies) transformationsApplied.push('ANOMALY_DETECTION');
    if (options.validateData) transformationsApplied.push('DATA_VALIDATION');

    return {
      retrievedAt: now.toISOString(),
      processedAt: now.toISOString(),
      processingDuration: duration,
      transformationsApplied,
      adjustmentsApplied: transformationsApplied.filter(t => t.includes('ADJUSTMENT')),
      recordsProcessed: recordCount,
      recordsFiltered: 0, // Will be updated in main method
      recordsValidated: recordCount
    };
  }

  /**
   * Map Alpha Vantage timeframe to standard timeframe
   */
  private mapTimeframe(alphaVantageTimeframe: Timeframe): StandardTimeframe {
    const mapping: Record<Timeframe, StandardTimeframe> = {
      'DAILY': 'DAILY',
      'WEEKLY': 'WEEKLY',
      'MONTHLY': 'MONTHLY',
      'INTRADAY_1MIN': 'INTRADAY_1M',
      'INTRADAY_5MIN': 'INTRADAY_5M',
      'INTRADAY_15MIN': 'INTRADAY_15M'
    };
    
    return mapping[alphaVantageTimeframe] || 'DAILY';
  }

  /**
   * Detect data type based on symbol pattern
   */
  private detectDataType(symbol: string): 'EQUITY' | 'INDEX' | 'ETF' | 'CRYPTO' | 'FOREX' {
    const upperSymbol = symbol.toUpperCase();
    
    // Common index symbols
    if (['^GSPC', '^DJI', '^IXIC', 'SPY', 'QQQ', 'DIA'].includes(upperSymbol)) {
      return 'INDEX';
    }
    
    // Common ETF patterns
    if (upperSymbol.endsWith('ETF') || ['SPY', 'QQQ', 'IWM', 'VTI', 'VOO'].includes(upperSymbol)) {
      return 'ETF';
    }
    
    // Crypto patterns
    if (upperSymbol.includes('USD') || upperSymbol.includes('BTC') || upperSymbol.includes('ETH')) {
      return 'CRYPTO';
    }
    
    // Default to equity
    return 'EQUITY';
  }

  /**
   * Check if data is stale based on timeframe
   */
  private isDataStale(timeframe: Timeframe, ageInMinutes: number): boolean {
    const freshnessLimits = {
      'INTRADAY_1MIN': VALIDATION_CONSTANTS.REAL_TIME_FRESHNESS,
      'INTRADAY_5MIN': VALIDATION_CONSTANTS.INTRADAY_FRESHNESS,
      'INTRADAY_15MIN': VALIDATION_CONSTANTS.INTRADAY_FRESHNESS,
      'DAILY': VALIDATION_CONSTANTS.DAILY_FRESHNESS,
      'WEEKLY': VALIDATION_CONSTANTS.WEEKLY_FRESHNESS,
      'MONTHLY': VALIDATION_CONSTANTS.WEEKLY_FRESHNESS * 4
    };

    return ageInMinutes > (freshnessLimits[timeframe] || VALIDATION_CONSTANTS.DAILY_FRESHNESS);
  }

  /**
   * Validate input data structure
   */
  private validateInputData(rawData: StockData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rawData.symbol || rawData.symbol.trim().length === 0) {
      errors.push('Symbol is required');
    }

    if (!rawData.data || rawData.data.length === 0) {
      errors.push('No data points provided');
    }

    if (rawData.data && rawData.data.length > 0) {
      // Check if at least some data points are valid
      const validPoints = rawData.data.filter(point => 
        point.open > 0 && point.high > 0 && point.low > 0 && point.close > 0
      );
      
      if (validPoints.length === 0) {
        errors.push('No valid price data found');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get transformation statistics
   */
  public getStatistics(): {
    totalTransformations: number;
    averageProcessingTime: number;
    errorRate: number;
    successRate: number;
  } {
    const successRate = this.totalTransformations > 0 
      ? ((this.totalTransformations - this.errorCount) / this.totalTransformations) * 100 
      : 0;

    return {
      totalTransformations: this.totalTransformations,
      averageProcessingTime: this.totalTransformations > 0 
        ? this.totalProcessingTime / this.totalTransformations 
        : 0,
      errorRate: this.totalTransformations > 0 
        ? (this.errorCount / this.totalTransformations) * 100 
        : 0,
      successRate
    };
  }

  /**
   * Clear caches
   */
  public clearCaches(): void {
    this.splitDetectionCache.clear();
    this.statisticsCache.clear();
  }
}

// Export singleton instance
export const dataTransformationService = DataTransformationService.getInstance();
export default DataTransformationService; 
