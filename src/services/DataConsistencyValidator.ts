/**
 * STUDENT ANALYST - Data Consistency Validator
 * Professional validation system for financial data logical consistency
 */

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
  symbol?: string;
}

export interface ValidationError {
  id: string;
  type: 'ohlcinvalid' | 'volume_negative' | 'volume_zero' | 'date_sequence' | 'date_duplicate' | 'dateinvalid' | 'adjustmentinconsistent';
  severity: 'critical' | 'high' | 'medium' | 'low';
  date: string;
  symbol: string;
  field: string;
  value: number | string;
  expectedRange?: { min: number; max: number };
  description: string;
  explanation: string;
  recommendation: string;
  autoCorrectible: boolean;
  metadata: {
    ohlcValues?: { open: number; high: number; low: number; close: number };
    volumeValue?: number;
    dateIssue?: string;
    adjustmentRatio?: number;
    previousValue?: number | string;
  };
}

export interface ValidationResult {
  symbol: string;
  totalDataPoints: number;
  validDataPoints: number;
  invalidDataPoints: number;
  validationErrors: ValidationError[];
  summary: {
    ohlcErrors: number;
    volumeErrors: number;
    dateErrors: number;
    adjustmentErrors: number;
    criticalErrors: number;
    autoCorrectibleErrors: number;
  };
  qualityScore: number; // 0-100
  consistencyScore: number; // 0-100
  reliabilityScore: number; // 0-100
  overallScore: number; // 0-100
  lastValidationTime: string;
  performanceMetrics: {
    processingTimeMs: number;
    validationsPerSecond: number;
  };
}

export interface ValidationConfig {
  // OHLC validation settings
  enableOHLCValidation: boolean; // Default: true
  ohlcTolerancePercent: number; // Default: 0.01% tolerance for floating point errors
  
  // Volume validation settings
  enableVolumeValidation: boolean; // Default: true
  allowZeroVolume: boolean; // Default: false for most cases
  maxReasonableVolume: number; // Default: 1e12 (1 trillion shares)
  
  // Date validation settings
  enableDateSequenceValidation: boolean; // Default: true
  allowDuplicateDates: boolean; // Default: false
  maxDateGapDays: number; // Default: 10 trading days
  allowFutureDates: boolean; // Default: false
  
  // Adjustment validation settings
  enableAdjustmentValidation: boolean; // Default: true
  adjustmentTolerancePercent: number; // Default: 0.1%
  maxAdjustmentRatio: number; // Default: 0.1 (90% adjustment max)
  
  // General settings
  strictMode: boolean; // Default: false
  performanceMode: boolean; // Default: false
}

class DataConsistencyValidator {
  private config: ValidationConfig;
  private performanceMetrics: {
    totalValidations: number;
    totalProcessingTime: number;
    averageProcessingTime: number;
    lastValidationTime: number;
  };

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      enableOHLCValidation: true,
      ohlcTolerancePercent: 0.01,
      enableVolumeValidation: true,
      allowZeroVolume: false,
      maxReasonableVolume: 1e12,
      enableDateSequenceValidation: true,
      allowDuplicateDates: false,
      maxDateGapDays: 10,
      allowFutureDates: false,
      enableAdjustmentValidation: true,
      adjustmentTolerancePercent: 0.1,
      maxAdjustmentRatio: 0.1,
      strictMode: false,
      performanceMode: false,
      ...config
    };

    this.performanceMetrics = {
      totalValidations: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      lastValidationTime: 0
    };
  }

  /**
   * Main validation function - validates financial data consistency
   */
  async validateDataConsistency(data: PriceData[]): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!data || data.length === 0) {
        throw new Error('No data provided for validation');
      }

      const symbol = data[0]?.symbol || 'UNKNOWN';

      // Sort data by date for proper sequence validation
      const sortedData = [...data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const errors: ValidationError[] = [];

      // Run different validation checks
      if (this.config.enableOHLCValidation) {
        errors.push(...this.validateOHLCConsistency(sortedData));
      }

      if (this.config.enableVolumeValidation) {
        errors.push(...this.validateVolumeConsistency(sortedData));
      }

      if (this.config.enableDateSequenceValidation) {
        errors.push(...this.validateDateSequence(sortedData));
      }

      if (this.config.enableAdjustmentValidation) {
        errors.push(...this.validateAdjustmentConsistency(sortedData));
      }

      // Remove duplicates and sort by severity
      const uniqueErrors = this.deduplicateErrors(errors);
      uniqueErrors.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));

      // Calculate quality metrics
      const summary = this.calculateSummary(uniqueErrors);
      const qualityScore = this.calculateQualityScore(uniqueErrors, sortedData.length);
      const consistencyScore = this.calculateConsistencyScore(uniqueErrors, sortedData.length);
      const reliabilityScore = this.calculateReliabilityScore(uniqueErrors, sortedData.length);
      const overallScore = this.calculateOverallScore(qualityScore, consistencyScore, reliabilityScore);

      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(processingTime);

      return {
        symbol,
        totalDataPoints: sortedData.length,
        validDataPoints: sortedData.length - uniqueErrors.filter(e => e.severity === 'critical').length,
        invalidDataPoints: uniqueErrors.filter(e => e.severity === 'critical').length,
        validationErrors: uniqueErrors,
        summary,
        qualityScore,
        consistencyScore,
        reliabilityScore,
        overallScore,
        lastValidationTime: new Date().toISOString(),
        performanceMetrics: {
          processingTimeMs: processingTime,
          validationsPerSecond: Math.round(sortedData.length / (processingTime / 1000))
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Error in data consistency validation:', error);
      
      throw new Error(
        `Data validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate OHLC consistency - Open ≤ High, Low ≤ Close, etc.
   */
  private validateOHLCConsistency(data: PriceData[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const tolerance = this.config.ohlcTolerancePercent / 100;

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const { open, high, low, close } = point;

      // Check if High is actually the highest
      if (high < Math.max(open, low, close) * (1 - tolerance)) {
        errors.push({
          id: `ohlc_highinvalid_${point.symbol || 'UNKNOWN'}_${point.date}`,
          type: 'ohlcinvalid',
          severity: 'critical',
          date: point.date,
          symbol: point.symbol || 'UNKNOWN',
          field: 'high',
          value: high,
          expectedRange: { min: Math.max(open, low, close), max: Infinity },
          description: `High price ${high} is lower than other OHLC values`,
          explanation: `High price must be >= max(Open, Low, Close). Current: High=${high}, Open=${open}, Low=${low}, Close=${close}`,
          recommendation: 'CRITICAL: Verify data source. This indicates corrupted price data that will cause calculation errors.',
          autoCorrectible: true,
          metadata: {
            ohlcValues: { open, high, low, close }
          }
        });
      }

      // Check if Low is actually the lowest
      if (low > Math.min(open, high, close) * (1 + tolerance)) {
        errors.push({
          id: `ohlc_lowinvalid_${point.symbol || 'UNKNOWN'}_${point.date}`,
          type: 'ohlcinvalid',
          severity: 'critical',
          date: point.date,
          symbol: point.symbol || 'UNKNOWN',
          field: 'low',
          value: low,
          expectedRange: { min: 0, max: Math.min(open, high, close) },
          description: `Low price ${low} is higher than other OHLC values`,
          explanation: `Low price must be <= min(Open, High, Close). Current: Low=${low}, Open=${open}, High=${high}, Close=${close}`,
          recommendation: 'CRITICAL: Verify data source. This indicates corrupted price data that will cause calculation errors.',
          autoCorrectible: true,
          metadata: {
            ohlcValues: { open, high, low, close }
          }
        });
      }

      // Check if Open is within High-Low range
      if (open < low * (1 - tolerance) || open > high * (1 + tolerance)) {
        errors.push({
          id: `ohlc_openinvalid_${point.symbol || 'UNKNOWN'}_${point.date}`,
          type: 'ohlcinvalid',
          severity: 'critical',
          date: point.date,
          symbol: point.symbol || 'UNKNOWN',
          field: 'open',
          value: open,
          expectedRange: { min: low, max: high },
          description: `Open price ${open} is outside High-Low range`,
          explanation: `Open price must be between Low and High. Current: Open=${open}, Low=${low}, High=${high}`,
          recommendation: 'CRITICAL: Verify data source. Open price cannot be outside the daily High-Low range.',
          autoCorrectible: true,
          metadata: {
            ohlcValues: { open, high, low, close }
          }
        });
      }

      // Check if Close is within High-Low range
      if (close < low * (1 - tolerance) || close > high * (1 + tolerance)) {
        errors.push({
          id: `ohlc_closeinvalid_${point.symbol || 'UNKNOWN'}_${point.date}`,
          type: 'ohlcinvalid',
          severity: 'critical',
          date: point.date,
          symbol: point.symbol || 'UNKNOWN',
          field: 'close',
          value: close,
          expectedRange: { min: low, max: high },
          description: `Close price ${close} is outside High-Low range`,
          explanation: `Close price must be between Low and High. Current: Close=${close}, Low=${low}, High=${high}`,
          recommendation: 'CRITICAL: Verify data source. Close price cannot be outside the daily High-Low range.',
          autoCorrectible: true,
          metadata: {
            ohlcValues: { open, high, low, close }
          }
        });
      }

      // Check for impossible price values (negative or zero)
      const prices = [open, high, low, close];
      const priceFields = ['open', 'high', 'low', 'close'];
      
      for (let j = 0; j < prices.length; j++) {
        if (prices[j] <= 0) {
          errors.push({
            id: `ohlc_negative_${priceFields[j]}_${point.symbol || 'UNKNOWN'}_${point.date}`,
            type: 'ohlcinvalid',
            severity: 'critical',
            date: point.date,
            symbol: point.symbol || 'UNKNOWN',
            field: priceFields[j],
            value: prices[j],
            expectedRange: { min: 0.01, max: Infinity },
            description: `${priceFields[j]} price ${prices[j]} is negative or zero`,
            explanation: `Stock prices cannot be negative or zero in normal trading conditions.`,
            recommendation: 'CRITICAL: This indicates severe data corruption. Remove or replace this data point.',
            autoCorrectible: false,
            metadata: {
              ohlcValues: { open, high, low, close }
            }
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate volume consistency - non-negative, reasonable values
   */
  private validateVolumeConsistency(data: PriceData[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const { volume } = point;

      // Check for negative volume
      if (volume < 0) {
        errors.push({
          id: `volume_negative_${point.symbol || 'UNKNOWN'}_${point.date}`,
          type: 'volume_negative',
          severity: 'critical',
          date: point.date,
          symbol: point.symbol || 'UNKNOWN',
          field: 'volume',
          value: volume,
          expectedRange: { min: 0, max: this.config.maxReasonableVolume },
          description: `Volume ${volume} is negative`,
          explanation: `Trading volume cannot be negative. This indicates data corruption or transmission error.`,
          recommendation: 'CRITICAL: Replace with 0 or interpolate from nearby valid data points.',
          autoCorrectible: true,
          metadata: {
            volumeValue: volume
          }
        });
      }

      // Check for zero volume (if not allowed)
      if (volume === 0 && !this.config.allowZeroVolume) {
        const { open, high, low, close } = point;
        const priceMovement = Math.abs(high - low) > 0 || open !== close;
        
        if (priceMovement) {
          errors.push({
            id: `volume_zero_suspicious_${point.symbol || 'UNKNOWN'}_${point.date}`,
            type: 'volume_zero',
            severity: 'medium',
            date: point.date,
            symbol: point.symbol || 'UNKNOWN',
            field: 'volume',
            value: volume,
            expectedRange: { min: 1, max: this.config.maxReasonableVolume },
            description: `Volume is zero but prices moved`,
            explanation: `Zero volume with price movement (H=${high}, L=${low}, O=${open}, C=${close}) is unusual and may indicate missing data.`,
            recommendation: 'MEDIUM: Verify if this was a trading halt or data feed issue. Consider interpolation.',
            autoCorrectible: true,
            metadata: {
              volumeValue: volume,
              ohlcValues: { open, high, low, close }
            }
          });
        }
      }

      // Check for unreasonably high volume
      if (volume > this.config.maxReasonableVolume) {
        errors.push({
          id: `volume_excessive_${point.symbol || 'UNKNOWN'}_${point.date}`,
          type: 'volume_negative',
          severity: 'high',
          date: point.date,
          symbol: point.symbol || 'UNKNOWN',
          field: 'volume',
          value: volume,
          expectedRange: { min: 0, max: this.config.maxReasonableVolume },
          description: `Volume ${volume.toLocaleString()} exceeds reasonable limits`,
          explanation: `Volume of ${volume.toLocaleString()} shares is extremely high and may indicate data transmission error or unit confusion.`,
          recommendation: 'HIGH: Verify data source and units. May need to divide by scaling factor.',
          autoCorrectible: false,
          metadata: {
            volumeValue: volume
          }
        });
      }
    }

    return errors;
  }

  /**
   * Validate date sequence - chronological order, no duplicates, valid dates
   */
  private validateDateSequence(data: PriceData[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const seenDates = new Set<string>();

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const currentDate = new Date(point.date);

      // Check for invalid dates
      if (isNaN(currentDate.getTime())) {
        errors.push({
          id: `dateinvalid_${point.symbol || 'UNKNOWN'}_${point.date}`,
          type: 'dateinvalid',
          severity: 'critical',
          date: point.date,
          symbol: point.symbol || 'UNKNOWN',
          field: 'date',
          value: point.date,
          description: `Invalid date format: ${point.date}`,
          explanation: `Date "${point.date}" cannot be parsed as a valid date.`,
          recommendation: 'CRITICAL: Fix date format or remove this data point.',
          autoCorrectible: false,
          metadata: {
            dateIssue: `Invalid date: ${point.date}`
          }
        });
        continue;
      }

      // Check for future dates (if not allowed)
      if (!this.config.allowFutureDates && currentDate > new Date()) {
        errors.push({
          id: `date_future_${point.symbol || 'UNKNOWN'}_${point.date}`,
          type: 'dateinvalid',
          severity: 'high',
          date: point.date,
          symbol: point.symbol || 'UNKNOWN',
          field: 'date',
          value: point.date,
          description: `Future date: ${point.date}`,
          explanation: `Date is in the future, which is unusual for historical stock data.`,
          recommendation: 'HIGH: Verify if this is expected (e.g., for futures) or remove if error.',
          autoCorrectible: false,
          metadata: {
            dateIssue: `Future date: ${point.date}`
          }
        });
      }

      // Check for duplicate dates (if not allowed)
      if (!this.config.allowDuplicateDates && seenDates.has(point.date)) {
        errors.push({
          id: `date_duplicate_${point.symbol || 'UNKNOWN'}_${point.date}`,
          type: 'date_duplicate',
          severity: 'high',
          date: point.date,
          symbol: point.symbol || 'UNKNOWN',
          field: 'date',
          value: point.date,
          description: `Duplicate date: ${point.date}`,
          explanation: `Date appears multiple times in dataset, which can cause calculation errors.`,
          recommendation: 'HIGH: Remove duplicate entries or merge if data is different.',
          autoCorrectible: true,
          metadata: {
            dateIssue: `Duplicate date: ${point.date}`
          }
        });
      }

      seenDates.add(point.date);

      // Check date sequence (for sorted data)
      if (i > 0) {
        const previousDate = new Date(data[i - 1].date);
        if (currentDate < previousDate) {
          errors.push({
            id: `date_sequence_${point.symbol || 'UNKNOWN'}_${point.date}`,
            type: 'date_sequence',
            severity: 'medium',
            date: point.date,
            symbol: point.symbol || 'UNKNOWN',
            field: 'date',
            value: point.date,
            description: `Date sequence error: ${point.date} before ${data[i - 1].date}`,
            explanation: `Dates are not in chronological order, which can affect time series analysis.`,
            recommendation: 'MEDIUM: Sort data chronologically or check for date format inconsistencies.',
            autoCorrectible: true,
            metadata: {
              dateIssue: `Out of sequence: ${point.date} vs ${data[i - 1].date}`,
              previousValue: data[i - 1].date
            }
          });
        }

        // Check for large gaps
        const daysDiff = Math.abs(currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > this.config.maxDateGapDays) {
          errors.push({
            id: `date_gap_${point.symbol || 'UNKNOWN'}_${point.date}`,
            type: 'date_sequence',
            severity: 'low',
            date: point.date,
            symbol: point.symbol || 'UNKNOWN',
            field: 'date',
            value: point.date,
            description: `Large date gap: ${Math.round(daysDiff)} days`,
            explanation: `Gap of ${Math.round(daysDiff)} days between ${data[i - 1].date} and ${point.date} may indicate missing data.`,
            recommendation: 'LOW: Consider if this gap is expected (holidays, market closure) or if data is missing.',
            autoCorrectible: false,
            metadata: {
              dateIssue: `Gap of ${Math.round(daysDiff)} days`,
              previousValue: data[i - 1].date
            }
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate adjustment consistency between adjusted and unadjusted prices
   */
  private validateAdjustmentConsistency(data: PriceData[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const tolerance = this.config.adjustmentTolerancePercent / 100;

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      
      if (point.adjustedClose === undefined) {
        continue; // Skip if no adjusted data
      }

      const { close, adjustedClose } = point;
      
      // Check for invalid adjusted values
      if (adjustedClose <= 0) {
        errors.push({
          id: `adjustmentinvalid_${point.symbol || 'UNKNOWN'}_${point.date}`,
          type: 'adjustmentinconsistent',
          severity: 'critical',
          date: point.date,
          symbol: point.symbol || 'UNKNOWN',
          field: 'adjustedClose',
          value: adjustedClose,
          expectedRange: { min: 0.01, max: Infinity },
          description: `Adjusted close ${adjustedClose} is negative or zero`,
          explanation: `Adjusted close price cannot be negative or zero.`,
          recommendation: 'CRITICAL: Fix adjusted price calculation or remove this data point.',
          autoCorrectible: false,
          metadata: {
            adjustmentRatio: adjustedClose / close
          }
        });
        continue;
      }

      const adjustmentRatio = adjustedClose / close;

      // Check for extreme adjustment ratios
      if (Math.abs(1 - adjustmentRatio) > this.config.maxAdjustmentRatio) {
        errors.push({
          id: `adjustment_extreme_${point.symbol || 'UNKNOWN'}_${point.date}`,
          type: 'adjustmentinconsistent',
          severity: 'high',
          date: point.date,
          symbol: point.symbol || 'UNKNOWN',
          field: 'adjustedClose',
          value: adjustedClose,
          description: `Extreme adjustment ratio: ${(adjustmentRatio * 100).toFixed(2)}%`,
          explanation: `Adjustment ratio of ${adjustmentRatio.toFixed(4)} (${((adjustmentRatio - 1) * 100).toFixed(2)}%) is unusually large.`,
          recommendation: 'HIGH: Verify if large corporate action (split, special dividend) occurred or if calculation error.',
          autoCorrectible: false,
          metadata: {
            adjustmentRatio,
            previousValue: close
          }
        });
      }

      // Check consistency with previous adjustment ratio
      if (i > 0 && data[i - 1].adjustedClose !== undefined) {
        const prevRatio = data[i - 1].adjustedClose! / data[i - 1].close;
        const ratioDiff = Math.abs(adjustmentRatio - prevRatio) / prevRatio;

        if (ratioDiff > tolerance && Math.abs(adjustmentRatio - prevRatio) > 0.001) {
          errors.push({
            id: `adjustmentinconsistent_${point.symbol || 'UNKNOWN'}_${point.date}`,
            type: 'adjustmentinconsistent',
            severity: 'medium',
            date: point.date,
            symbol: point.symbol || 'UNKNOWN',
            field: 'adjustedClose',
            value: adjustedClose,
            description: `Adjustment ratio changed: ${(adjustmentRatio * 100).toFixed(2)}% vs ${(prevRatio * 100).toFixed(2)}%`,
            explanation: `Adjustment ratio changed from ${prevRatio.toFixed(4)} to ${adjustmentRatio.toFixed(4)}, indicating possible corporate action.`,
            recommendation: 'MEDIUM: Verify if corporate action occurred. If not, check adjustment calculation.',
            autoCorrectible: false,
            metadata: {
              adjustmentRatio,
              previousValue: prevRatio
            }
          });
        }
      }
    }

    return errors;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(errors: ValidationError[]) {
    return {
      ohlcErrors: errors.filter(e => e.type === 'ohlcinvalid').length,
      volumeErrors: errors.filter(e => e.type.startsWith('volume_')).length,
      dateErrors: errors.filter(e => e.type.startsWith('date_')).length,
      adjustmentErrors: errors.filter(e => e.type === 'adjustmentinconsistent').length,
      criticalErrors: errors.filter(e => e.severity === 'critical').length,
      autoCorrectibleErrors: errors.filter(e => e.autoCorrectible).length
    };
  }

  /**
   * Calculate quality scores
   */
  private calculateQualityScore(errors: ValidationError[], totalDataPoints: number): number {
    if (totalDataPoints === 0) return 0;
    
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const highErrors = errors.filter(e => e.severity === 'high').length;
    const mediumErrors = errors.filter(e => e.severity === 'medium').length;
    const lowErrors = errors.filter(e => e.severity === 'low').length;

    const errorPenalty = (criticalErrors * 10 + highErrors * 5 + mediumErrors * 2 + lowErrors * 1) / totalDataPoints * 100;
    
    return Math.max(0, Math.round(100 - errorPenalty));
  }

  private calculateConsistencyScore(errors: ValidationError[], totalDataPoints: number): number {
    const consistencyErrors = errors.filter(e => 
      e.type === 'ohlcinvalid' || e.type === 'adjustmentinconsistent'
    ).length;
    
    const consistencyRate = 1 - (consistencyErrors / totalDataPoints);
    return Math.max(0, Math.round(consistencyRate * 100));
  }

  private calculateReliabilityScore(errors: ValidationError[], totalDataPoints: number): number {
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const reliabilityRate = 1 - (criticalErrors / totalDataPoints);
    return Math.max(0, Math.round(reliabilityRate * 100));
  }

  private calculateOverallScore(quality: number, consistency: number, reliability: number): number {
    // Weighted average: reliability is most important, then consistency, then quality
    return Math.round(reliability * 0.5 + consistency * 0.3 + quality * 0.2);
  }

  /**
   * Helper functions
   */
  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private deduplicateErrors(errors: ValidationError[]): ValidationError[] {
    const seen = new Set<string>();
    return errors.filter(error => {
      const key = `${error.date}_${error.symbol}_${error.type}_${error.field}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private updatePerformanceMetrics(processingTime: number): void {
    this.performanceMetrics.totalValidations++;
    this.performanceMetrics.totalProcessingTime += processingTime;
    this.performanceMetrics.lastValidationTime = processingTime;
    this.performanceMetrics.averageProcessingTime = 
      this.performanceMetrics.totalProcessingTime / this.performanceMetrics.totalValidations;
  }

  /**
   * Public utility methods
   */
  getConfiguration(): ValidationConfig {
    return { ...this.config };
  }

  updateConfiguration(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  reset(): void {
    this.performanceMetrics = {
      totalValidations: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      lastValidationTime: 0
    };
  }

  /**
   * Auto-correction capabilities
   */
  async autoCorrectErrors(data: PriceData[], errors: ValidationError[]): Promise<{
    correctedData: PriceData[];
    correctionLog: string[];
    successfulCorrections: number;
    failedCorrections: number;
  }> {
    const correctedData = [...data];
    const correctionLog: string[] = [];
    let successfulCorrections = 0;
    let failedCorrections = 0;

    const correctibleErrors = errors.filter(e => e.autoCorrectible);

    for (const error of correctibleErrors) {
      try {
        const dataIndex = correctedData.findIndex(d => d.date === error.date);
        if (dataIndex === -1) continue;

        const point = correctedData[dataIndex];

        switch (error.type) {
          case 'ohlcinvalid':
            this.correctOHLCError(point, error);
            correctionLog.push(`Corrected OHLC error for ${error.date}: ${error.field} adjusted`);
            successfulCorrections++;
            break;

          case 'volume_negative':
            point.volume = 0;
            correctionLog.push(`Corrected negative volume for ${error.date}: set to 0`);
            successfulCorrections++;
            break;

          case 'volume_zero':
            // Interpolate from nearby points if available
            const interpolatedVolume = this.interpolateVolume(correctedData, dataIndex);
            if (interpolatedVolume > 0) {
              point.volume = interpolatedVolume;
              correctionLog.push(`Corrected zero volume for ${error.date}: interpolated to ${interpolatedVolume}`);
              successfulCorrections++;
            } else {
              failedCorrections++;
            }
            break;

          case 'date_duplicate':
            // Remove duplicate (keep first occurrence)
            correctedData.splice(dataIndex, 1);
            correctionLog.push(`Removed duplicate date entry for ${error.date}`);
            successfulCorrections++;
            break;

          default:
            failedCorrections++;
        }
      } catch (correctionError) {
        failedCorrections++;
        correctionLog.push(`Failed to correct error for ${error.date}: ${correctionError}`);
      }
    }

    return {
      correctedData,
      correctionLog,
      successfulCorrections,
      failedCorrections
    };
  }

  private correctOHLCError(point: PriceData, error: ValidationError): void {
    const { open, high, low, close } = point;

    switch (error.field) {
      case 'high':
        // Set high to the maximum of all prices
        point.high = Math.max(open, low, close);
        break;

      case 'low':
        // Set low to the minimum of all prices
        point.low = Math.min(open, high, close);
        break;

      case 'open':
        // Set open to be within high-low range, closer to previous close if available
        point.open = Math.max(low, Math.min(high, open));
        break;

      case 'close':
        // Set close to be within high-low range
        point.close = Math.max(low, Math.min(high, close));
        break;
    }
  }

  private interpolateVolume(data: PriceData[], index: number): number {
    const windowSize = 5;
    let sum = 0;
    let count = 0;

    for (let i = Math.max(0, index - windowSize); i <= Math.min(data.length - 1, index + windowSize); i++) {
      if (i !== index && data[i].volume > 0) {
        sum += data[i].volume;
        count++;
      }
    }

    return count > 0 ? Math.round(sum / count) : 0;
  }
}

// Export singleton instance
export const dataConsistencyValidator = new DataConsistencyValidator();

// Export class for testing
export default DataConsistencyValidator; 
