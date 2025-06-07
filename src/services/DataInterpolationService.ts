/**
 * STUDENT ANALYST - Data Interpolation Service
 * Advanced algorithms for handling missing financial data
 */

import type { StockDataPoint } from './DataConsistencyChecker';

export interface InterpolationConfig {
  method: 'linear' | 'cubic' | 'forward_fill' | 'backward_fill' | 'market_aware';
  maxGapDays: number; // Maximum gap to interpolate
  useVolumeAdjustment: boolean; // Adjust interpolation based on volume patterns
  preserveWeekends: boolean; // Skip weekends in interpolation
}

export interface InterpolationResult {
  interpolatedData: StockDataPoint[];
  interpolatedCount: number;
  gapsFound: Array<{
    start: string;
    end: string;
    days: number;
    method: string;
  }>;
  confidence: number; // 0-100 confidence in interpolated values
}

/**
 * Advanced data interpolation service for financial time series
 */
export class DataInterpolationService {
  private static instance: DataInterpolationService;
  
  private defaultConfig: InterpolationConfig = {
    method: 'linear',
    maxGapDays: 3,
    useVolumeAdjustment: true,
    preserveWeekends: true
  };

  private constructor() {}

  public static getInstance(): DataInterpolationService {
    if (!DataInterpolationService.instance) {
      DataInterpolationService.instance = new DataInterpolationService();
    }
    return DataInterpolationService.instance;
  }

  /**
   * Main interpolation method that fills missing data points
   */
  public interpolateData(
    data: StockDataPoint[],
    config: Partial<InterpolationConfig> = {}
  ): InterpolationResult {
    const fullConfig = { ...this.defaultConfig, ...config };
    
    console.log(`🔧 Starting data interpolation with method: ${fullConfig.method}`);
    
    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Find gaps in the data
    const gaps = this.findDataGaps(sortedData);
    
    // Filter gaps that are within interpolation limits
    const interpolableGaps = gaps.filter(gap => gap.days <= fullConfig.maxGapDays);
    
    if (interpolableGaps.length === 0) {
      return {
        interpolatedData: sortedData,
        interpolatedCount: 0,
        gapsFound: [],
        confidence: 100
      };
    }
    
    console.log(`📊 Found ${interpolableGaps.length} interpolable gaps`);
    
    // Perform interpolation based on selected method
    const result = this.performInterpolation(sortedData, interpolableGaps, fullConfig);
    
    return result;
  }

  /**
   * Find gaps in the time series data
   */
  private findDataGaps(data: StockDataPoint[]): Array<{
    start: string;
    end: string;
    days: number;
    startIndex: number;
    endIndex: number;
  }> {
    const gaps: Array<{
      start: string;
      end: string;
      days: number;
      startIndex: number;
      endIndex: number;
    }> = [];
    
    for (let i = 0; i < data.length - 1; i++) {
      const currentDate = new Date(data[i].date);
      const nextDate = new Date(data[i + 1].date);
      
      // Calculate business days between dates
      const daysDiff = this.calculateBusinessDays(currentDate, nextDate);
      
      if (daysDiff > 1) {
        gaps.push({
          start: data[i].date,
          end: data[i + 1].date,
          days: daysDiff - 1,
          startIndex: i,
          endIndex: i + 1
        });
      }
    }
    
    return gaps;
  }

  /**
   * Calculate business days between two dates
   */
  private calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      currentDate.setDate(currentDate.getDate() + 1);
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Perform interpolation based on the selected method
   */
  private performInterpolation(
    data: StockDataPoint[],
    gaps: Array<{
      start: string;
      end: string;
      days: number;
      startIndex: number;
      endIndex: number;
    }>,
    config: InterpolationConfig
  ): InterpolationResult {
    const interpolatedData = [...data];
    let interpolatedCount = 0;
    const processedGaps: Array<{
      start: string;
      end: string;
      days: number;
      method: string;
    }> = [];
    
    for (const gap of gaps) {
      const startPoint = data[gap.startIndex];
      const endPoint = data[gap.endIndex];
      
      const missingPoints = this.generateMissingPoints(
        startPoint,
        endPoint,
        config
      );
      
      // Insert missing points into the array
      interpolatedData.splice(gap.endIndex + interpolatedCount, 0, ...missingPoints);
      interpolatedCount += missingPoints.length;
      
      processedGaps.push({
        start: gap.start,
        end: gap.end,
        days: gap.days,
        method: config.method
      });
    }
    
    // Calculate confidence based on interpolation quality
    const confidence = this.calculateInterpolationConfidence(
      interpolatedCount,
      data.length,
      processedGaps
    );
    
    return {
      interpolatedData: interpolatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      interpolatedCount,
      gapsFound: processedGaps,
      confidence
    };
  }

  /**
   * Generate missing data points between two known points
   */
  private generateMissingPoints(
    startPoint: StockDataPoint,
    endPoint: StockDataPoint,
    config: InterpolationConfig
  ): StockDataPoint[] {
    const missingPoints: StockDataPoint[] = [];
    
    const startDate = new Date(startPoint.date);
    const endDate = new Date(endPoint.date);
    const currentDate = new Date(startDate);
    
    // Generate dates for missing points
    const missingDates: Date[] = [];
    
    while (currentDate < endDate) {
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Skip weekends if configured
      if (config.preserveWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
        continue;
      }
      
      if (currentDate < endDate) {
        missingDates.push(new Date(currentDate));
      }
    }
    
    // Generate interpolated values based on method
    for (let i = 0; i < missingDates.length; i++) {
      const interpolatedPoint = this.interpolatePoint(
        startPoint,
        endPoint,
        i + 1,
        missingDates.length + 1,
        missingDates[i],
        config
      );
      
      missingPoints.push(interpolatedPoint);
    }
    
    return missingPoints;
  }

  /**
   * Interpolate a single data point
   */
  private interpolatePoint(
    startPoint: StockDataPoint,
    endPoint: StockDataPoint,
    position: number,
    totalSteps: number,
    date: Date,
    config: InterpolationConfig
  ): StockDataPoint {
    const ratio = position / totalSteps;
    
    switch (config.method) {
      case 'linear':
        return this.linearInterpolation(startPoint, endPoint, ratio, date);
      
      case 'cubic':
        return this.cubicInterpolation(startPoint, endPoint, ratio, date);
      
      case 'forward_fill':
        return this.forwardFillInterpolation(startPoint, date);
      
      case 'backward_fill':
        return this.backwardFillInterpolation(endPoint, date);
      
      case 'market_aware':
        return this.marketAwareInterpolation(startPoint, endPoint, ratio, date, config);
      
      default:
        return this.linearInterpolation(startPoint, endPoint, ratio, date);
    }
  }

  /**
   * Linear interpolation between two points
   */
  private linearInterpolation(
    startPoint: StockDataPoint,
    endPoint: StockDataPoint,
    ratio: number,
    date: Date
  ): StockDataPoint {
    return {
      date: date.toISOString().split('T')[0],
      open: startPoint.open + (endPoint.open - startPoint.open) * ratio,
      high: startPoint.high + (endPoint.high - startPoint.high) * ratio,
      low: startPoint.low + (endPoint.low - startPoint.low) * ratio,
      close: startPoint.close + (endPoint.close - startPoint.close) * ratio,
      volume: Math.round(startPoint.volume + (endPoint.volume - startPoint.volume) * ratio),
      source: 'interpolated'
    };
  }

  /**
   * Cubic interpolation for smoother curves
   */
  private cubicInterpolation(
    startPoint: StockDataPoint,
    endPoint: StockDataPoint,
    ratio: number,
    date: Date
  ): StockDataPoint {
    // Simplified cubic interpolation using smoothstep function
    const smoothRatio = ratio * ratio * (3 - 2 * ratio);
    
    return {
      date: date.toISOString().split('T')[0],
      open: startPoint.open + (endPoint.open - startPoint.open) * smoothRatio,
      high: startPoint.high + (endPoint.high - startPoint.high) * smoothRatio,
      low: startPoint.low + (endPoint.low - startPoint.low) * smoothRatio,
      close: startPoint.close + (endPoint.close - startPoint.close) * smoothRatio,
      volume: Math.round(startPoint.volume + (endPoint.volume - startPoint.volume) * smoothRatio),
      source: 'interpolated'
    };
  }

  /**
   * Forward fill interpolation (use previous value)
   */
  private forwardFillInterpolation(
    startPoint: StockDataPoint,
    date: Date
  ): StockDataPoint {
    return {
      date: date.toISOString().split('T')[0],
      open: startPoint.close, // Open with previous close
      high: startPoint.close * 1.001, // Minimal variation
      low: startPoint.close * 0.999,
      close: startPoint.close,
      volume: Math.round(startPoint.volume * 0.8), // Reduced volume assumption
      source: 'interpolated'
    };
  }

  /**
   * Backward fill interpolation (use next value)
   */
  private backwardFillInterpolation(
    endPoint: StockDataPoint,
    date: Date
  ): StockDataPoint {
    return {
      date: date.toISOString().split('T')[0],
      open: endPoint.open,
      high: endPoint.open * 1.001,
      low: endPoint.open * 0.999,
      close: endPoint.open, // Close with next open
      volume: Math.round(endPoint.volume * 0.8),
      source: 'interpolated'
    };
  }

  /**
   * Market-aware interpolation considering volatility and volume
   */
  private marketAwareInterpolation(
    startPoint: StockDataPoint,
    endPoint: StockDataPoint,
    ratio: number,
    date: Date,
    config: InterpolationConfig
  ): StockDataPoint {
    // Calculate volatility factor
    const priceChange = Math.abs(endPoint.close - startPoint.close) / startPoint.close;
    const volatilityFactor = Math.min(priceChange * 10, 1); // Cap at 1
    
    // Adjust interpolation based on volatility
    let adjustedRatio = ratio;
    if (volatilityFactor > 0.1) {
      // For high volatility, use more gradual interpolation
      adjustedRatio = Math.pow(ratio, 1 + volatilityFactor);
    }
    
    // Volume adjustment
    let volumeRatio = ratio;
    if (config.useVolumeAdjustment) {
      const volumeChange = Math.abs(endPoint.volume - startPoint.volume) / startPoint.volume;
      if (volumeChange > 0.5) {
        // For high volume changes, interpolate more conservatively
        volumeRatio = Math.pow(ratio, 1.5);
      }
    }
    
    return {
      date: date.toISOString().split('T')[0],
      open: startPoint.open + (endPoint.open - startPoint.open) * adjustedRatio,
      high: startPoint.high + (endPoint.high - startPoint.high) * adjustedRatio,
      low: startPoint.low + (endPoint.low - startPoint.low) * adjustedRatio,
      close: startPoint.close + (endPoint.close - startPoint.close) * adjustedRatio,
      volume: Math.round(startPoint.volume + (endPoint.volume - startPoint.volume) * volumeRatio),
      source: 'interpolated'
    };
  }

  /**
   * Calculate confidence in interpolated values
   */
  private calculateInterpolationConfidence(
    interpolatedCount: number,
    originalCount: number,
    gaps: Array<{ days: number }>
  ): number {
    if (interpolatedCount === 0) return 100;
    
    // Base confidence decreases with interpolation ratio
    const interpolationRatio = interpolatedCount / (originalCount + interpolatedCount);
    let confidence = 100 - (interpolationRatio * 50);
    
    // Reduce confidence for large gaps
    const maxGapDays = Math.max(...gaps.map(g => g.days));
    confidence -= Math.max(0, (maxGapDays - 1) * 10);
    
    // Reduce confidence for many small gaps
    confidence -= gaps.length * 2;
    
    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * Update interpolation configuration
   */
  public updateConfig(newConfig: Partial<InterpolationConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): InterpolationConfig {
    return { ...this.defaultConfig };
  }
}

// Export singleton instance
export const dataInterpolationService = DataInterpolationService.getInstance();
export default DataInterpolationService; 
