/**
 * STUDENT ANALYST - Data Consistency Checker
 * Validates consistency between multiple financial data providers
 */

import { notificationManager } from './NotificationManager';

export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: 'alpha_vantage' | 'yahoo_finance' | 'interpolated';
}

export interface ConsistencyThresholds {
  priceDiscrepancyPercent: number; // Default: 5%
  volumeDiscrepancyPercent: number; // Default: 20%
  maxInterpolationGap: number; // Max days to interpolate: 3
  minimumDataPoints: number; // Minimum points for analysis: 10
}

export interface DiscrepancyResult {
  type: 'price' | 'volume' | 'missing_data' | 'date_alignment';
  severity: 'low' | 'medium' | 'high';
  date: string;
  symbol: string;
  alphaVantageValue?: number;
  yahooFinanceValue?: number;
  discrepancyPercent?: number;
  description: string;
  recommendation: string;
}

export interface QualityScore {
  overall: number; // 0-100
  consistency: number; // 0-100
  completeness: number; // 0-100
  freshness: number; // 0-100
  reliability: number; // 0-100
}

export interface ConsistencyReport {
  symbol: string;
  dateRange: {
    start: string;
    end: string;
  };
  dataPointsCompared: number;
  qualityScore: QualityScore;
  discrepancies: DiscrepancyResult[];
  interpolatedPoints: number;
  recommendedSource: 'alpha_vantage' | 'yahoo_finance' | 'merged';
  confidence: number; // 0-100
}

/**
 * Advanced data consistency checker for financial data validation
 */
export class DataConsistencyChecker {
  private static instance: DataConsistencyChecker;
  
  private thresholds: ConsistencyThresholds = {
    priceDiscrepancyPercent: 5.0,
    volumeDiscrepancyPercent: 20.0,
    maxInterpolationGap: 3,
    minimumDataPoints: 10
  };

  private constructor() {}

  public static getInstance(): DataConsistencyChecker {
    if (!DataConsistencyChecker.instance) {
      DataConsistencyChecker.instance = new DataConsistencyChecker();
    }
    return DataConsistencyChecker.instance;
  }

  /**
   * Main method to check consistency between two datasets
   */
  public async checkConsistency(
    alphaVantageData: StockDataPoint[],
    yahooFinanceData: StockDataPoint[],
    symbol: string
  ): Promise<ConsistencyReport> {
    const startTime = Date.now();
    
    console.log(`🔍 Starting consistency check for ${symbol}...`);
    
    // Step 1: Align date ranges
    const alignedData = this.alignDateRanges(alphaVantageData, yahooFinanceData);
    
    // Step 2: Detect discrepancies
    const discrepancies = this.detectDiscrepancies(
      alignedData.alphaVantage,
      alignedData.yahooFinance,
      symbol
    );
    
    // Step 3: Calculate quality scores
    const qualityScore = this.calculateQualityScore(
      alignedData.alphaVantage,
      alignedData.yahooFinance,
      discrepancies
    );
    
    // Step 4: Determine recommended source
    const recommendedSource = this.determineRecommendedSource(
      alignedData.alphaVantage,
      alignedData.yahooFinance,
      qualityScore,
      discrepancies
    );
    
    // Step 5: Handle interpolation for missing data
    const { interpolatedCount } = this.handleMissingData(
      alignedData.alphaVantage,
      alignedData.yahooFinance
    );
    
    const report: ConsistencyReport = {
      symbol,
      dateRange: {
        start: alignedData.dateRange.start,
        end: alignedData.dateRange.end
      },
      dataPointsCompared: Math.max(alignedData.alphaVantage.length, alignedData.yahooFinance.length),
      qualityScore,
      discrepancies,
      interpolatedPoints: interpolatedCount,
      recommendedSource,
      confidence: this.calculateConfidence(qualityScore, discrepancies)
    };
    
    // Show notifications for significant issues
    this.showConsistencyNotifications(report);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Consistency check completed for ${symbol} in ${processingTime}ms`);
    
    return report;
  }

  /**
   * Align date ranges between two datasets
   */
  private alignDateRanges(
    alphaData: StockDataPoint[],
    yahooData: StockDataPoint[]
  ): {
    alphaVantage: StockDataPoint[];
    yahooFinance: StockDataPoint[];
    dateRange: { start: string; end: string };
  } {
    // Convert to maps for easier lookup
    const alphaMap = new Map(alphaData.map(d => [d.date, d]));
    const yahooMap = new Map(yahooData.map(d => [d.date, d]));
    
    // Find common date range
    const allDates = Array.from(new Set([...alphaMap.keys(), ...yahooMap.keys()]))
      .sort();
    
    const startDate = allDates[0];
    const endDate = allDates[allDates.length - 1];
    
    // Create aligned arrays
    const alignedAlpha: StockDataPoint[] = [];
    const alignedYahoo: StockDataPoint[] = [];
    
    for (const date of allDates) {
      const alphaPoint = alphaMap.get(date);
      const yahooPoint = yahooMap.get(date);
      
      if (alphaPoint) alignedAlpha.push(alphaPoint);
      if (yahooPoint) alignedYahoo.push(yahooPoint);
    }
    
    return {
      alphaVantage: alignedAlpha,
      yahooFinance: alignedYahoo,
      dateRange: { start: startDate, end: endDate }
    };
  }

  /**
   * Detect discrepancies between aligned datasets
   */
  private detectDiscrepancies(
    alphaData: StockDataPoint[],
    yahooData: StockDataPoint[],
    symbol: string
  ): DiscrepancyResult[] {
    const discrepancies: DiscrepancyResult[] = [];
    
    // Create maps for easier comparison
    const alphaMap = new Map(alphaData.map(d => [d.date, d]));
    const yahooMap = new Map(yahooData.map(d => [d.date, d]));
    
    // Get all unique dates
    const allDates = Array.from(new Set([...alphaMap.keys(), ...yahooMap.keys()]))
      .sort();
    
    for (const date of allDates) {
      const alphaPoint = alphaMap.get(date);
      const yahooPoint = yahooMap.get(date);
      
      // Check for missing data
      if (!alphaPoint && yahooPoint) {
        discrepancies.push({
          type: 'missing_data',
          severity: 'medium',
          date,
          symbol,
          yahooFinanceValue: yahooPoint.close,
          description: `Alpha Vantage missing data for ${date}`,
          recommendation: 'Use Yahoo Finance data or interpolate from nearby Alpha Vantage points'
        });
        continue;
      }
      
      if (alphaPoint && !yahooPoint) {
        discrepancies.push({
          type: 'missing_data',
          severity: 'medium',
          date,
          symbol,
          alphaVantageValue: alphaPoint.close,
          description: `Yahoo Finance missing data for ${date}`,
          recommendation: 'Use Alpha Vantage data or interpolate from nearby Yahoo Finance points'
        });
        continue;
      }
      
      // If both exist, check for price discrepancies
      if (alphaPoint && yahooPoint) {
        const priceDiscrepancy = this.calculatePriceDiscrepancy(alphaPoint, yahooPoint);
        
        if (priceDiscrepancy.percent > this.thresholds.priceDiscrepancyPercent) {
          discrepancies.push({
            type: 'price',
            severity: priceDiscrepancy.percent > 10 ? 'high' : 'medium',
            date,
            symbol,
            alphaVantageValue: alphaPoint.close,
            yahooFinanceValue: yahooPoint.close,
            discrepancyPercent: priceDiscrepancy.percent,
            description: `Price discrepancy: Alpha Vantage $${alphaPoint.close.toFixed(2)} vs Yahoo Finance $${yahooPoint.close.toFixed(2)} (${priceDiscrepancy.percent.toFixed(1)}% difference)`,
            recommendation: priceDiscrepancy.percent > 10 
              ? 'Significant discrepancy - manually verify which source is correct'
              : 'Consider using weighted average or preferred source setting'
          });
        }
        
        // Check volume discrepancies
        const volumeDiscrepancy = this.calculateVolumeDiscrepancy(alphaPoint, yahooPoint);
        
        if (volumeDiscrepancy.percent > this.thresholds.volumeDiscrepancyPercent) {
          discrepancies.push({
            type: 'volume',
            severity: volumeDiscrepancy.percent > 50 ? 'high' : 'low',
            date,
            symbol,
            alphaVantageValue: alphaPoint.volume,
            yahooFinanceValue: yahooPoint.volume,
            discrepancyPercent: volumeDiscrepancy.percent,
            description: `Volume discrepancy: Alpha Vantage ${alphaPoint.volume.toLocaleString()} vs Yahoo Finance ${yahooPoint.volume.toLocaleString()} (${volumeDiscrepancy.percent.toFixed(1)}% difference)`,
            recommendation: 'Volume discrepancies are common between sources - use preferred source setting'
          });
        }
      }
    }
    
    return discrepancies;
  }

  /**
   * Calculate price discrepancy between two data points
   */
  private calculatePriceDiscrepancy(
    alphaPoint: StockDataPoint,
    yahooPoint: StockDataPoint
  ): { percent: number; absolute: number } {
    const avgPrice = (alphaPoint.close + yahooPoint.close) / 2;
    const absolute = Math.abs(alphaPoint.close - yahooPoint.close);
    const percent = (absolute / avgPrice) * 100;
    
    return { percent, absolute };
  }

  /**
   * Calculate volume discrepancy between two data points
   */
  private calculateVolumeDiscrepancy(
    alphaPoint: StockDataPoint,
    yahooPoint: StockDataPoint
  ): { percent: number; absolute: number } {
    if (alphaPoint.volume === 0 && yahooPoint.volume === 0) {
      return { percent: 0, absolute: 0 };
    }
    
    const avgVolume = (alphaPoint.volume + yahooPoint.volume) / 2;
    const absolute = Math.abs(alphaPoint.volume - yahooPoint.volume);
    const percent = avgVolume > 0 ? (absolute / avgVolume) * 100 : 0;
    
    return { percent, absolute };
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(
    alphaData: StockDataPoint[],
    yahooData: StockDataPoint[],
    discrepancies: DiscrepancyResult[]
  ): QualityScore {
    // Consistency score (based on discrepancies)
    const totalComparisons = Math.max(alphaData.length, yahooData.length);
    const highSeverityDiscrepancies = discrepancies.filter(d => d.severity === 'high').length;
    const mediumSeverityDiscrepancies = discrepancies.filter(d => d.severity === 'medium').length;
    
    const consistencyScore = Math.max(0, 100 - 
      (highSeverityDiscrepancies * 10) - 
      (mediumSeverityDiscrepancies * 3)
    );
    
    // Completeness score (based on data availability)
    const alphaCompleteness = totalComparisons > 0 ? (alphaData.length / totalComparisons) * 100 : 0;
    const yahooCompleteness = totalComparisons > 0 ? (yahooData.length / totalComparisons) * 100 : 0;
    const completenessScore = Math.max(alphaCompleteness, yahooCompleteness);
    
    // Freshness score (based on how recent the data is)
    const now = new Date();
    const latestDate = Math.max(
      alphaData.length > 0 ? new Date(alphaData[alphaData.length - 1].date).getTime() : 0,
      yahooData.length > 0 ? new Date(yahooData[yahooData.length - 1].date).getTime() : 0
    );
    
    const daysSinceUpdate = (now.getTime() - latestDate) / (1000 * 60 * 60 * 24);
    const freshnessScore = Math.max(0, 100 - (daysSinceUpdate * 5)); // 5 points per day old
    
    // Reliability score (based on data source track record)
    const reliabilityScore = Math.min(consistencyScore + 10, 100); // Bonus for consistency
    
    // Overall score (weighted average)
    const overallScore = (
      consistencyScore * 0.4 +
      completenessScore * 0.3 +
      freshnessScore * 0.2 +
      reliabilityScore * 0.1
    );
    
    return {
      overall: Math.round(overallScore),
      consistency: Math.round(consistencyScore),
      completeness: Math.round(completenessScore),
      freshness: Math.round(freshnessScore),
      reliability: Math.round(reliabilityScore)
    };
  }

  /**
   * Determine which source is recommended based on analysis
   */
  private determineRecommendedSource(
    alphaData: StockDataPoint[],
    yahooData: StockDataPoint[],
    qualityScore: QualityScore,
    discrepancies: DiscrepancyResult[]
  ): 'alpha_vantage' | 'yahoo_finance' | 'merged' {
    // Count discrepancies by source
    const alphaIssues = discrepancies.filter(d => d.alphaVantageValue === undefined).length;
    const yahooIssues = discrepancies.filter(d => d.yahooFinanceValue === undefined).length;
    
    // Compare completeness
    const alphaCompleteness = alphaData.length;
    const yahooCompleteness = yahooData.length;
    
    // If one source has significantly more data, prefer it
    if (alphaCompleteness > yahooCompleteness * 1.2) {
      return 'alpha_vantage';
    }
    
    if (yahooCompleteness > alphaCompleteness * 1.2) {
      return 'yahoo_finance';
    }
    
    // If data completeness is similar, prefer source with fewer issues
    if (alphaIssues < yahooIssues) {
      return 'alpha_vantage';
    }
    
    if (yahooIssues < alphaIssues) {
      return 'yahoo_finance';
    }
    
    // If both sources are equally good, recommend merging
    return 'merged';
  }

  /**
   * Handle missing data through interpolation
   */
  private handleMissingData(
    alphaData: StockDataPoint[],
    yahooData: StockDataPoint[]
  ): { interpolatedData: StockDataPoint[]; interpolatedCount: number } {
    // Combine and sort all data points
    const allData = [...alphaData, ...yahooData];
    const sortedData = allData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Remove duplicates (keep first occurrence)
    const uniqueData: StockDataPoint[] = [];
    const seenDates = new Set<string>();
    
    for (const point of sortedData) {
      if (!seenDates.has(point.date)) {
        uniqueData.push(point);
        seenDates.add(point.date);
      }
    }
    
    // Identify gaps that need interpolation
    const gaps: Array<{ startIndex: number; endIndex: number; days: number }> = [];
    
    for (let i = 0; i < uniqueData.length - 1; i++) {
      const currentDate = new Date(uniqueData[i].date);
      const nextDate = new Date(uniqueData[i + 1].date);
      
      // Calculate business days between dates
      const daysDiff = this.calculateBusinessDaysBetween(currentDate, nextDate);
      
      if (daysDiff > 1 && daysDiff <= this.thresholds.maxInterpolationGap) {
        gaps.push({
          startIndex: i,
          endIndex: i + 1,
          days: daysDiff - 1
        });
      }
    }
    
    if (gaps.length === 0) {
      return { interpolatedData: uniqueData, interpolatedCount: 0 };
    }
    
    // Apply interpolation for each gap
    const interpolatedData = [...uniqueData];
    let interpolatedCount = 0;
    
    for (const gap of gaps) {
      const startPoint = uniqueData[gap.startIndex];
      const endPoint = uniqueData[gap.endIndex];
      
      const interpolatedPoints = this.interpolateGap(startPoint, endPoint, gap.days);
      
      // Insert interpolated points
      const insertIndex = gap.endIndex + interpolatedCount;
      interpolatedData.splice(insertIndex, 0, ...interpolatedPoints);
      interpolatedCount += interpolatedPoints.length;
    }
    
    return { 
      interpolatedData: interpolatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), 
      interpolatedCount 
    };
  }

  /**
   * Calculate business days between two dates
   */
  private calculateBusinessDaysBetween(startDate: Date, endDate: Date): number {
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
   * Interpolate missing points in a gap
   */
  private interpolateGap(
    startPoint: StockDataPoint, 
    endPoint: StockDataPoint, 
    gapDays: number
  ): StockDataPoint[] {
    const interpolatedPoints: StockDataPoint[] = [];
    const startDate = new Date(startPoint.date);
    
    for (let i = 1; i <= gapDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        continue;
      }
      
      const ratio = i / (gapDays + 1);
      
      // Linear interpolation
      const interpolatedPoint: StockDataPoint = {
        date: currentDate.toISOString().split('T')[0],
        open: startPoint.open + (endPoint.open - startPoint.open) * ratio,
        high: startPoint.high + (endPoint.high - startPoint.high) * ratio,
        low: startPoint.low + (endPoint.low - startPoint.low) * ratio,
        close: startPoint.close + (endPoint.close - startPoint.close) * ratio,
        volume: Math.round(startPoint.volume + (endPoint.volume - startPoint.volume) * ratio),
        source: 'interpolated'
      };
      
      interpolatedPoints.push(interpolatedPoint);
    }
    
    return interpolatedPoints;
  }

  /**
   * Calculate confidence level for the consistency report
   */
  private calculateConfidence(
    qualityScore: QualityScore,
    discrepancies: DiscrepancyResult[]
  ): number {
    const highSeverityCount = discrepancies.filter(d => d.severity === 'high').length;
    
    // Start with quality score
    let confidence = qualityScore.overall;
    
    // Reduce confidence for high severity discrepancies
    confidence -= highSeverityCount * 15;
    
    // Ensure confidence is between 0 and 100
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Show notifications for significant consistency issues
   */
  private showConsistencyNotifications(report: ConsistencyReport): void {
    const highSeverityDiscrepancies = report.discrepancies.filter(d => d.severity === 'high');
    const mediumSeverityDiscrepancies = report.discrepancies.filter(d => d.severity === 'medium');
    
    // Show notification for high severity issues
    if (highSeverityDiscrepancies.length > 0) {
      notificationManager.showError(
        `⚠️ ${report.symbol}: Significant Data Discrepancies`,
        `Found ${highSeverityDiscrepancies.length} major inconsistencies between data sources. Manual review recommended.`,
        10000
      );
    } else if (mediumSeverityDiscrepancies.length > 3) {
      notificationManager.showWarning(
        `📊 ${report.symbol}: Data Quality Issues`,
        `Found ${mediumSeverityDiscrepancies.length} minor inconsistencies. Overall quality: ${report.qualityScore.overall}/100`,
        7000
      );
    } else if (report.qualityScore.overall >= 90) {
      notificationManager.showSuccess(
        `✅ ${report.symbol}: Excellent Data Quality`,
        `Sources are highly consistent. Quality score: ${report.qualityScore.overall}/100`,
        4000
      );
    }
  }

  /**
   * Update consistency thresholds
   */
  public updateThresholds(newThresholds: Partial<ConsistencyThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get current thresholds
   */
  public getThresholds(): ConsistencyThresholds {
    return { ...this.thresholds };
  }
}

// Export singleton instance
export const dataConsistencyChecker = DataConsistencyChecker.getInstance();
export default DataConsistencyChecker; 
