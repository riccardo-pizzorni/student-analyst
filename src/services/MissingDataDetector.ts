/**
 * STUDENT ANALYST - Missing Data Detector
 * Professional system for detecting and analyzing missing data in financial time series
 */

export interface TimeSeriesData {
  date: string;
  value: number | null;
  symbol?: string;
  field?: string;
}

export interface GapInfo {
  startDate: string;
  endDate: string;
  duration: number; // Number of missing business days
  type: 'natural' | 'anomalous'; // Natural (weekend/holiday) vs problematic
  severity: 'low' | 'medium' | 'high';
  impact: number; // Impact score 0-1
}

export interface MissingDataAnalysis {
  symbol: string;
  totalDataPoints: number;
  missingDataPoints: number;
  completenessPercentage: number;
  missingPercentage: number;
  gaps: GapInfo[];
  qualityScore: number; // 0-100
  warningLevel: 'none' | 'info' | 'warning' | 'critical';
  warningMessage: string;
  recommendation: string;
  businessDaysAnalyzed: number;
  businessDaysMissing: number;
  lastUpdated: string;
}

export interface InterpolationOption {
  id: string;
  name: string;
  description: string;
  complexity: 'simple' | 'medium' | 'advanced';
  accuracy: number; // 0-1 estimated accuracy
  performanceMs: number; // Estimated processing time
  suitableFor: string[];
  confidence: number; // 0-1 confidence score
}

export interface BusinessDayCalendar {
  holidays: string[]; // ISO date strings
  weekends: number[]; // 0=Sunday, 6=Saturday
  marketCode: string; // US, EU, UK, etc.
}

class MissingDataDetector {
  private businessCalendar: BusinessDayCalendar;
  private performanceMetrics: {
    totalAnalyses: number;
    averageProcessingTime: number;
    lastAnalysisTime: number;
  };

  constructor() {
    // Default US market calendar
    this.businessCalendar = {
      holidays: [
        '2024-01-01', '2024-01-15', '2024-02-19', '2024-03-29', 
        '2024-05-27', '2024-06-19', '2024-07-04', '2024-09-02',
        '2024-10-14', '2024-11-11', '2024-11-28', '2024-12-25'
      ],
      weekends: [0, 6], // Sunday and Saturday
      marketCode: 'US'
    };

    this.performanceMetrics = {
      totalAnalyses: 0,
      averageProcessingTime: 0,
      lastAnalysisTime: 0
    };
  }

  /**
   * Main analysis function - detects missing data and calculates statistics
   */
  async analyzeTimeSeries(
    data: TimeSeriesData[], 
    options: {
      warningThreshold?: number; // Default 20%
      includeWeekends?: boolean; // Default false
      analysisDepth?: 'basic' | 'detailed'; // Default detailed
    } = {}
  ): Promise<MissingDataAnalysis> {
    const startTime = Date.now();
    
    try {
      // Set defaults
      const {
        warningThreshold = 20,
        includeWeekends = false,
        analysisDepth = 'detailed'
      } = options;

      // Validate input
      if (!data || data.length === 0) {
        throw new Error('No data provided for analysis');
      }

      const symbol = data[0]?.symbol || 'UNKNOWN';
      
      // Sort data by date
      const sortedData = [...data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Generate expected date range
      const expectedDates = this.generateExpectedDates(
        sortedData[0].date,
        sortedData[sortedData.length - 1].date,
        includeWeekends
      );

      // Detect gaps
      const gaps = this.detectGaps(sortedData, expectedDates, analysisDepth);
      
      // Calculate statistics
      const totalExpected = expectedDates.length;
      const totalMissing = gaps.reduce((sum, gap) => sum + gap.duration, 0);
      const missingPercentage = (totalMissing / totalExpected) * 100;
      const completenessPercentage = 100 - missingPercentage;
      
      // Calculate quality score (weighted)
      const qualityScore = this.calculateQualityScore(
        completenessPercentage,
        gaps,
        sortedData.length
      );

      // Determine warning level and messages
      const { warningLevel, warningMessage, recommendation } = 
        this.generateWarnings(missingPercentage, gaps, warningThreshold);

      // Calculate business day metrics
      const businessDaysAnalyzed = this.countBusinessDays(
        sortedData[0].date,
        sortedData[sortedData.length - 1].date
      );
      
      const businessDaysMissing = gaps
        .filter(gap => gap.type === 'anomalous')
        .reduce((sum, gap) => sum + gap.duration, 0);

      const analysis: MissingDataAnalysis = {
        symbol,
        totalDataPoints: totalExpected,
        missingDataPoints: totalMissing,
        completenessPercentage: Math.round(completenessPercentage * 100) / 100,
        missingPercentage: Math.round(missingPercentage * 100) / 100,
        gaps,
        qualityScore: Math.round(qualityScore),
        warningLevel,
        warningMessage,
        recommendation,
        businessDaysAnalyzed,
        businessDaysMissing,
        lastUpdated: new Date().toISOString()
      };

      // Update performance metrics
      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(processingTime);

      return analysis;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Error in missing data analysis:', error);
      
      throw new Error(
        `Missing data analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Detect gaps in time series data
   */
  private detectGaps(
    data: TimeSeriesData[], 
    expectedDates: string[],
    depth: 'basic' | 'detailed'
  ): GapInfo[] {
    const gaps: GapInfo[] = [];
    const dataDateMap = new Map(data.map(d => [d.date, d]));
    
    let currentGap: {
      start: string;
      dates: string[];
      type: 'natural' | 'anomalous';
    } | null = null;

    for (const expectedDate of expectedDates) {
      const hasData = dataDateMap.has(expectedDate);
      const isBusinessDay = this.isBusinessDay(expectedDate);
      
      if (!hasData) {
        const gapType = isBusinessDay ? 'anomalous' : 'natural';
        
        if (!currentGap) {
          // Start new gap
          currentGap = {
            start: expectedDate,
            dates: [expectedDate],
            type: gapType
          };
        } else if (currentGap.type === gapType) {
          // Extend current gap
          currentGap.dates.push(expectedDate);
        } else {
          // Gap type changed, finalize current and start new
          gaps.push(this.finalizeGap(currentGap, depth));
          currentGap = {
            start: expectedDate,
            dates: [expectedDate],
            type: gapType
          };
        }
      } else {
        // Data exists, finalize any current gap
        if (currentGap) {
          gaps.push(this.finalizeGap(currentGap, depth));
          currentGap = null;
        }
      }
    }

    // Finalize any remaining gap
    if (currentGap) {
      gaps.push(this.finalizeGap(currentGap, depth));
    }

    return gaps.filter(gap => gap.duration > 0);
  }

  /**
   * Finalize gap information
   */
  private finalizeGap(
    gap: { start: string; dates: string[]; type: 'natural' | 'anomalous' },
    depth: 'basic' | 'detailed'
  ): GapInfo {
    const duration = gap.dates.length;
    const endDate = gap.dates[gap.dates.length - 1];
    
    // Calculate severity based on duration and type
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (gap.type === 'anomalous') {
      if (duration >= 5) severity = 'high';
      else if (duration >= 2) severity = 'medium';
    }
    
    // Calculate impact (0-1 scale)
    const impact = gap.type === 'anomalous' 
      ? Math.min(duration / 10, 1) // Anomalous gaps have higher impact
      : Math.min(duration / 20, 0.5); // Natural gaps have lower impact

    return {
      startDate: gap.start,
      endDate,
      duration,
      type: gap.type,
      severity,
      impact: Math.round(impact * 1000) / 1000
    };
  }

  /**
   * Generate expected dates for the time range
   */
  private generateExpectedDates(
    startDate: string, 
    endDate: string, 
    includeWeekends: boolean
  ): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      
      if (includeWeekends || this.isBusinessDay(dateStr)) {
        dates.push(dateStr);
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * Check if a date is a business day
   */
  private isBusinessDay(dateStr: string): boolean {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    
    // Check if it's a weekend
    if (this.businessCalendar.weekends.includes(dayOfWeek)) {
      return false;
    }
    
    // Check if it's a holiday
    if (this.businessCalendar.holidays.includes(dateStr)) {
      return false;
    }
    
    return true;
  }

  /**
   * Count business days in a date range
   */
  private countBusinessDays(startDate: string, endDate: string): number {
    const current = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (this.isBusinessDay(dateStr)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(
    completenessPercentage: number,
    gaps: GapInfo[],
    actualDataPoints: number
  ): number {
    // Base score from completeness
    let score = completenessPercentage;
    
    // Penalty for anomalous gaps
    const anomalousGaps = gaps.filter(gap => gap.type === 'anomalous');
    const gapPenalty = anomalousGaps.reduce((penalty, gap) => {
      return penalty + (gap.severity === 'high' ? 10 : gap.severity === 'medium' ? 5 : 2);
    }, 0);
    
    score = Math.max(0, score - gapPenalty);
    
    // Bonus for consistent data
    if (actualDataPoints > 100 && completenessPercentage > 95) {
      score = Math.min(100, score + 5);
    }
    
    return score;
  }

  /**
   * Generate warning messages and recommendations
   */
  private generateWarnings(
    missingPercentage: number,
    gaps: GapInfo[],
    threshold: number
  ): {
    warningLevel: 'none' | 'info' | 'warning' | 'critical';
    warningMessage: string;
    recommendation: string;
  } {
    const anomalousGaps = gaps.filter(gap => gap.type === 'anomalous');
    const highSeverityGaps = anomalousGaps.filter(gap => gap.severity === 'high');
    
    if (missingPercentage > threshold) {
      return {
        warningLevel: 'critical',
        warningMessage: `⚠️ CRITICAL: ${missingPercentage.toFixed(1)}% of data is missing (above ${threshold}% threshold). Analysis reliability is severely compromised.`,
        recommendation: 'Consider using a different data source, extending the time range, or applying advanced interpolation methods. Verify data quality before making investment decisions.'
      };
    }
    
    if (missingPercentage > threshold * 0.7 || highSeverityGaps.length > 0) {
      return {
        warningLevel: 'warning',
        warningMessage: `⚠️ WARNING: ${missingPercentage.toFixed(1)}% of data is missing. Some gaps detected in critical periods.`,
        recommendation: 'Review the identified gaps and consider interpolation options. Monitor data quality for upcoming analyses.'
      };
    }
    
    if (missingPercentage > threshold * 0.3 || anomalousGaps.length > 0) {
      return {
        warningLevel: 'info',
        warningMessage: `ℹ️ INFO: ${missingPercentage.toFixed(1)}% of data is missing. Overall data quality is acceptable.`,
        recommendation: 'Data quality is good. Minor gaps can be addressed with linear interpolation if needed.'
      };
    }
    
    return {
      warningLevel: 'none',
      warningMessage: `✅ EXCELLENT: Only ${missingPercentage.toFixed(1)}% of data is missing. High quality dataset.`,
      recommendation: 'Data quality is excellent. Proceed with confidence in your analyses.'
    };
  }

  /**
   * Get available interpolation options
   */
  getInterpolationOptions(): InterpolationOption[] {
    return [
      {
        id: 'linear',
        name: 'Linear Interpolation',
        description: 'Simple straight-line interpolation between known points',
        complexity: 'simple',
        accuracy: 0.7,
        performanceMs: 10,
        suitableFor: ['short gaps', 'stable trends'],
        confidence: 0.8
      },
      {
        id: 'cubic',
        name: 'Cubic Spline',
        description: 'Smooth curve interpolation using cubic polynomials',
        complexity: 'medium',
        accuracy: 0.85,
        performanceMs: 25,
        suitableFor: ['medium gaps', 'smooth data'],
        confidence: 0.75
      },
      {
        id: 'forward_fill',
        name: 'Forward Fill',
        description: 'Use the last known value to fill gaps',
        complexity: 'simple',
        accuracy: 0.6,
        performanceMs: 5,
        suitableFor: ['very short gaps', 'stable values'],
        confidence: 0.9
      },
      {
        id: 'backward_fill',
        name: 'Backward Fill',
        description: 'Use the next known value to fill gaps',
        complexity: 'simple',
        accuracy: 0.6,
        performanceMs: 5,
        suitableFor: ['very short gaps', 'stable values'],
        confidence: 0.9
      },
      {
        id: 'market_aware',
        name: 'Market-Aware Interpolation',
        description: 'Advanced interpolation considering market volatility and trends',
        complexity: 'advanced',
        accuracy: 0.9,
        performanceMs: 50,
        suitableFor: ['all gap types', 'financial data'],
        confidence: 0.85
      }
    ];
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(processingTime: number): void {
    this.performanceMetrics.totalAnalyses++;
    this.performanceMetrics.lastAnalysisTime = processingTime;
    
    // Calculate running average
    const total = this.performanceMetrics.totalAnalyses;
    const currentAvg = this.performanceMetrics.averageProcessingTime;
    this.performanceMetrics.averageProcessingTime = 
      ((currentAvg * (total - 1)) + processingTime) / total;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Update business calendar
   */
  updateBusinessCalendar(calendar: Partial<BusinessDayCalendar>): void {
    this.businessCalendar = { ...this.businessCalendar, ...calendar };
  }

  /**
   * Get current business calendar
   */
  getBusinessCalendar(): BusinessDayCalendar {
    return { ...this.businessCalendar };
  }
}

// Export singleton instance
export const missingDataDetector = new MissingDataDetector();

// Export class for testing
export default MissingDataDetector; 
