/**
 * STUDENT ANALYST - Standardized Data Models
 * Universal format for all financial data regardless of source
 */

// Core price point data structure
export interface NormalizedPricePoint {
  // Date in ISO 8601 format (YYYY-MM-DD) in UTC timezone
  date: string;
  
  // All prices in USD, split-adjusted unless specified otherwise
  open: number;
  high: number;
  low: number;
  close: number;
  
  // Raw (unadjusted) prices for reference
  rawOpen?: number;
  rawHigh?: number;
  rawLow?: number;
  rawClose?: number;
  
  // Volume in individual shares (not thousands or millions)
  volume: number;
  
  // Calculated fields
  adjustedClose?: number;
  splitCoefficient?: number; // 1.0 = no split, 2.0 = 2:1 split, etc.
  dividendAmount?: number;   // Dividend amount on this date if any
  
  // Quality metrics
  isAdjusted: boolean;
  hasAnomalies: boolean;
  validationFlags: string[];
  
  // Market information
  marketOpen: boolean;
  tradingHalted?: boolean;
}

export interface NormalizedDataset {
  // Identification
  symbol: string;
  exchange?: string;
  currency: string; // ISO currency code (USD, EUR, etc.)
  
  // Data classification
  timeframe: StandardTimeframe;
  dataType: 'EQUITY' | 'INDEX' | 'ETF' | 'CRYPTO' | 'FOREX';
  
  // The actual data points, sorted by date (newest first)
  data: NormalizedPricePoint[];
  
  // Comprehensive metadata
  metadata: NormalizedMetadata;
  
  // Quality and validation info
  quality: DataQuality;
  
  // Processing information
  processing: ProcessingInfo;
}

export type StandardTimeframe = 
  | 'REAL_TIME'     // Live prices
  | 'INTRADAY_1M'   // 1-minute bars
  | 'INTRADAY_5M'   // 5-minute bars  
  | 'INTRADAY_15M'  // 15-minute bars
  | 'INTRADAY_1H'   // 1-hour bars
  | 'DAILY'         // End-of-day data
  | 'WEEKLY'        // End-of-week data
  | 'MONTHLY'       // End-of-month data
  | 'QUARTERLY'     // End-of-quarter data
  | 'YEARLY';       // End-of-year data

export interface NormalizedMetadata {
  // Source information
  dataSource: DataSource;
  dataProvider: string;
  
  // Time information
  lastRefreshed: string;    // ISO timestamp
  timezone: string;         // e.g., "America/New_York", "UTC"
  marketHours: {
    open: string;           // e.g., "09:30"
    close: string;          // e.g., "16:00"
    timezone: string;
  };
  
  // Coverage information
  startDate: string;        // ISO date
  endDate: string;          // ISO date
  totalDataPoints: number;
  
  // Corporate actions detected
  corporateActions: CorporateAction[];
  
  // Data freshness
  ageInMinutes: number;
  isStale: boolean;         // True if data is too old for timeframe
}

export interface DataQuality {
  // Overall quality score (0-100)
  qualityScore: number;
  
  // Validation results
  hasIncompleteData: boolean;
  hasPriceAnomalies: boolean;
  hasVolumeAnomalies: boolean;
  hasDateGaps: boolean;
  
  // Specific issues found
  anomalies: DataAnomaly[];
  missingDataRanges: DateRange[];
  
  // Confidence levels
  priceConfidence: number;   // 0-100
  volumeConfidence: number;  // 0-100
  dateConfidence: number;    // 0-100
}

export interface ProcessingInfo {
  // Processing timestamps
  retrievedAt: string;      // When raw data was fetched
  processedAt: string;      // When transformation was completed
  processingDuration: number; // Milliseconds
  
  // Transformation details
  transformationsApplied: string[];
  adjustmentsApplied: string[];
  
  // Cache information
  cacheKey?: string;
  cacheTTL?: number;        // Seconds
  
  // Performance metrics
  recordsProcessed: number;
  recordsFiltered: number;
  recordsValidated: number;
}

export type DataSource = 
  | 'ALPHA_VANTAGE'
  | 'YAHOO_FINANCE' 
  | 'IEX_CLOUD'
  | 'FINNHUB'
  | 'QUANDL'
  | 'MANUAL'
  | 'CALCULATED';

export interface CorporateAction {
  date: string;             // ISO date
  type: 'SPLIT' | 'DIVIDEND' | 'MERGER' | 'SPINOFF' | 'RIGHTS_ISSUE';
  description: string;
  ratio?: number;           // For splits: 2.0 for 2:1 split
  amount?: number;          // For dividends: amount per share
  currency?: string;
  adjustmentFactor: number; // Applied to historical prices
}

export interface DataAnomaly {
  type: 'PRICE_SPIKE' | 'VOLUME_SPIKE' | 'MISSING_DATA' | 'INVALID_OHLC' | 'DATE_GAP' | 'DUPLICATE_DATE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  date: string;
  description: string;
  originalValue?: number;
  suggestedValue?: number;
  autoFixed: boolean;
}

export interface DateRange {
  startDate: string;        // ISO date
  endDate: string;          // ISO date
  expectedRecords: number;
  missingRecords: number;
}

// Utility types for data manipulation
export interface PriceStatistics {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  medianPrice: number;
  volatility: number;       // Standard deviation
  priceChange: number;      // Absolute change from first to last
  priceChangePercent: number; // Percentage change
}

export interface VolumeStatistics {
  minVolume: number;
  maxVolume: number;
  avgVolume: number;
  medianVolume: number;
  totalVolume: number;
  volumeStdDev: number;
}

export interface DatasetStatistics {
  symbol: string;
  timeframe: StandardTimeframe;
  period: DateRange;
  
  price: PriceStatistics;
  volume: VolumeStatistics;
  
  // Data quality metrics
  completeness: number;     // 0-100 percentage
  reliability: number;      // 0-100 percentage
  dataPoints: number;
  
  // Market insights
  tradingDays: number;
  averageDailyVolume: number;
  mostActiveDay: string;
  highestVolumeDay: string;
}

// Type guards for runtime type checking
export function isNormalizedPricePoint(obj: unknown): obj is NormalizedPricePoint {
  return typeof obj === 'object' && obj !== null &&
         'date' in obj && typeof (obj as Record<string, unknown>).date === 'string' &&
         'open' in obj && typeof (obj as Record<string, unknown>).open === 'number' &&
         'high' in obj && typeof (obj as Record<string, unknown>).high === 'number' &&
         'low' in obj && typeof (obj as Record<string, unknown>).low === 'number' &&
         'close' in obj && typeof (obj as Record<string, unknown>).close === 'number' &&
         'volume' in obj && typeof (obj as Record<string, unknown>).volume === 'number' &&
         'isAdjusted' in obj && typeof (obj as Record<string, unknown>).isAdjusted === 'boolean' &&
         'hasAnomalies' in obj && typeof (obj as Record<string, unknown>).hasAnomalies === 'boolean' &&
         'validationFlags' in obj && Array.isArray((obj as Record<string, unknown>).validationFlags) &&
         'marketOpen' in obj && typeof (obj as Record<string, unknown>).marketOpen === 'boolean';
}

export function isNormalizedDataset(obj: unknown): obj is NormalizedDataset {
  return typeof obj === 'object' && obj !== null &&
         'symbol' in obj && typeof (obj as Record<string, unknown>).symbol === 'string' &&
         'currency' in obj && typeof (obj as Record<string, unknown>).currency === 'string' &&
         'timeframe' in obj && typeof (obj as Record<string, unknown>).timeframe === 'string' &&
         'dataType' in obj && typeof (obj as Record<string, unknown>).dataType === 'string' &&
         'data' in obj && Array.isArray((obj as Record<string, unknown>).data) &&
         ((obj as Record<string, unknown>).data as unknown[]).every(isNormalizedPricePoint) &&
         'metadata' in obj && typeof (obj as Record<string, unknown>).metadata === 'object' &&
         'quality' in obj && typeof (obj as Record<string, unknown>).quality === 'object' &&
         'processing' in obj && typeof (obj as Record<string, unknown>).processing === 'object';
}

// Constants for validation and processing
export const VALIDATION_CONSTANTS = {
  // Price validation
  MIN_PRICE: 0.01,          // Minimum valid price
  MAX_PRICE: 1000000,       // Maximum realistic price
  MAX_PRICE_CHANGE: 0.50,   // Maximum 50% change in a day (for spike detection)
  
  // Volume validation
  MIN_VOLUME: 0,            // Minimum volume (can be 0 for holidays)
  MAX_VOLUME_MULTIPLIER: 50, // Max volume vs average (for spike detection)
  
  // Date validation
  OLDEST_VALID_DATE: '1900-01-01',
  FUTURE_DATE_TOLERANCE_DAYS: 1, // Allow 1 day in future for timezone issues
  
  // Quality thresholds
  MIN_QUALITY_SCORE: 60,    // Below this is considered low quality
  HIGH_QUALITY_SCORE: 90,   // Above this is considered high quality
  
  // Data freshness (in minutes)
  REAL_TIME_FRESHNESS: 1,
  INTRADAY_FRESHNESS: 15,
  DAILY_FRESHNESS: 24 * 60, // 24 hours
  WEEKLY_FRESHNESS: 7 * 24 * 60, // 7 days
} as const;

export default NormalizedDataset; 