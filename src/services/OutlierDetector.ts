/**
 * STUDENT ANALYST - Outlier Detection System
 * Professional system for detecting anomalous values in financial time series data
 */

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol?: string;
}

export interface OutlierEvent {
  id: string;
  date: string;
  symbol: string;
  type: 'price_jump' | 'volume_spike' | 'statistical_outlier' | 'gap_move' | 'volatility_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1 confidence score
  value: number; // The outlier value
  expectedValue: number; // What the normal value should be
  deviationMagnitude: number; // How far from normal (sigma or percentage)
  description: string;
  explanation: string;
  recommendation: string;
  metadata: {
    priceChange?: number;
    priceChangePercent?: number;
    volumeRatio?: number;
    zScore?: number;
    threshold?: number;
    historicalMean?: number;
    historicalStd?: number;
  };
}

export interface OutlierAnalysis {
  symbol: string;
  totalDataPoints: number;
  outliersDetected: number;
  outlierPercentage: number;
  events: OutlierEvent[];
  summary: {
    priceJumps: number;
    volumeSpikes: number;
    statisticalOutliers: number;
    criticalEvents: number;
    avgConfidence: number;
  };
  riskScore: number; // 0-100, higher = more risky
  qualityScore: number; // 0-100, higher = better data quality
  lastAnalysisTime: string;
  performanceMetrics: {
    processingTimeMs: number;
    dataPointsPerSecond: number;
  };
}

export interface DetectionConfig {
  // Statistical outlier detection settings
  sigmaThreshold: number; // Default: 3.0
  rollingWindowSize: number; // Default: 30 days
  minDataPoints: number; // Default: 20

  // Price jump detection settings
  priceJumpThreshold: number; // Default: 20% (0.20)
  requireVolumeConfirmation: boolean; // Default: true
  volumeConfirmationMultiplier: number; // Default: 1.5x normal volume

  // Volume spike detection settings
  volumeSpikeThreshold: number; // Default: 3.0x normal volume
  volumeWindowSize: number; // Default: 20 days

  // General settings
  enablePriceJumpDetection: boolean; // Default: true
  enableVolumeSpikeDetection: boolean; // Default: true
  enableStatisticalOutlierDetection: boolean; // Default: true
  enableGapDetection: boolean; // Default: true

  // Risk and quality scoring
  outlierPenaltyWeight: number; // Default: 0.1
  confidenceThreshold: number; // Default: 0.7
}

class OutlierDetector {
  private config: DetectionConfig;
  private performanceMetrics: {
    totalAnalyses: number;
    totalProcessingTime: number;
    averageProcessingTime: number;
    lastAnalysisTime: number;
  };

  constructor(config: Partial<DetectionConfig> = {}) {
    this.config = {
      sigmaThreshold: 3.0,
      rollingWindowSize: 30,
      minDataPoints: 20,
      priceJumpThreshold: 0.20,
      requireVolumeConfirmation: true,
      volumeConfirmationMultiplier: 1.5,
      volumeSpikeThreshold: 3.0,
      volumeWindowSize: 20,
      enablePriceJumpDetection: true,
      enableVolumeSpikeDetection: true,
      enableStatisticalOutlierDetection: true,
      enableGapDetection: true,
      outlierPenaltyWeight: 0.1,
      confidenceThreshold: 0.7,
      ...config
    };

    this.performanceMetrics = {
      totalAnalyses: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      lastAnalysisTime: 0
    };
  }

  /**
   * Main analysis function - detects outliers in financial time series data
   */
  async analyzeOutliers(data: PriceData[]): Promise<OutlierAnalysis> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!data || data.length === 0) {
        throw new Error('No data provided for outlier analysis');
      }

      if (data.length < this.config.minDataPoints) {
        throw new Error(`Insufficient data points. Need at least ${this.config.minDataPoints}, got ${data.length}`);
      }

      const symbol = data[0]?.symbol || 'UNKNOWN';

      // Sort data by date
      const sortedData = [...data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const events: OutlierEvent[] = [];

      // Run different outlier detection algorithms
      if (this.config.enablePriceJumpDetection) {
        events.push(...this.detectPriceJumps(sortedData));
      }

      if (this.config.enableVolumeSpikeDetection) {
        events.push(...this.detectVolumeSpikes(sortedData));
      }

      if (this.config.enableStatisticalOutlierDetection) {
        events.push(...this.detectStatisticalOutliers(sortedData));
      }

      if (this.config.enableGapDetection) {
        events.push(...this.detectGaps(sortedData));
      }

      // Sort events by date and remove duplicates
      const uniqueEvents = this.deduplicateEvents(events);
      uniqueEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate summary statistics
      const summary = this.calculateSummary(uniqueEvents);
      const riskScore = this.calculateRiskScore(uniqueEvents, sortedData.length);
      const qualityScore = this.calculateQualityScore(uniqueEvents, sortedData.length);

      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(processingTime);

      return {
        symbol,
        totalDataPoints: sortedData.length,
        outliersDetected: uniqueEvents.length,
        outlierPercentage: (uniqueEvents.length / sortedData.length) * 100,
        events: uniqueEvents,
        summary,
        riskScore,
        qualityScore,
        lastAnalysisTime: new Date().toISOString(),
        performanceMetrics: {
          processingTimeMs: processingTime,
          dataPointsPerSecond: Math.round(sortedData.length / (processingTime / 1000))
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Error in outlier analysis:', error);
      
      throw new Error(
        `Outlier analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Detect significant price jumps (>20% single day moves)
   */
  private detectPriceJumps(data: PriceData[]): OutlierEvent[] {
    const events: OutlierEvent[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      const priceChange = current.close - previous.close;
      const priceChangePercent = Math.abs(priceChange / previous.close);
      
      if (priceChangePercent >= this.config.priceJumpThreshold) {
        // Check volume confirmation if required
        let volumeConfirmed = true;
        let volumeRatio = 1;
        
        if (this.config.requireVolumeConfirmation) {
          const avgVolume = this.calculateAverageVolume(data, i, this.config.volumeWindowSize);
          volumeRatio = current.volume / avgVolume;
          volumeConfirmed = volumeRatio >= this.config.volumeConfirmationMultiplier;
        }
        
        if (volumeConfirmed) {
          const severity = this.calculatePriceJumpSeverity(priceChangePercent, volumeRatio);
          const confidence = this.calculatePriceJumpConfidence(priceChangePercent, volumeRatio);
          
          events.push({
            id: `price_jump_${current.symbol || 'UNKNOWN'}_${current.date}`,
            date: current.date,
            symbol: current.symbol || 'UNKNOWN',
            type: 'price_jump',
            severity,
            confidence,
            value: current.close,
            expectedValue: previous.close,
            deviationMagnitude: priceChangePercent,
            description: `Price ${priceChange > 0 ? 'jump' : 'drop'} of ${(priceChangePercent * 100).toFixed(1)}%`,
            explanation: `Detected ${priceChange > 0 ? 'significant price increase' : 'significant price decrease'} of ${(priceChangePercent * 100).toFixed(1)}% in a single trading day${volumeRatio > this.config.volumeConfirmationMultiplier ? ` with ${volumeRatio.toFixed(1)}x normal volume` : ''}.`,
            recommendation: this.getPriceJumpRecommendation(priceChange, priceChangePercent, volumeRatio),
            metadata: {
              priceChange,
              priceChangePercent,
              volumeRatio,
              threshold: this.config.priceJumpThreshold
            }
          });
        }
      }
    }
    
    return events;
  }

  /**
   * Detect volume spikes (significantly higher than normal volume)
   */
  private detectVolumeSpikes(data: PriceData[]): OutlierEvent[] {
    const events: OutlierEvent[] = [];
    
    for (let i = this.config.volumeWindowSize; i < data.length; i++) {
      const current = data[i];
      const avgVolume = this.calculateAverageVolume(data, i, this.config.volumeWindowSize);
      const volumeRatio = current.volume / avgVolume;
      
      if (volumeRatio >= this.config.volumeSpikeThreshold) {
        const severity = this.calculateVolumeSeverity(volumeRatio);
        const confidence = this.calculateVolumeConfidence(volumeRatio, avgVolume);
        
        events.push({
          id: `volume_spike_${current.symbol || 'UNKNOWN'}_${current.date}`,
          date: current.date,
          symbol: current.symbol || 'UNKNOWN',
          type: 'volume_spike',
          severity,
          confidence,
          value: current.volume,
          expectedValue: avgVolume,
          deviationMagnitude: volumeRatio,
          description: `Volume spike: ${volumeRatio.toFixed(1)}x normal volume`,
          explanation: `Detected unusual trading activity with volume ${volumeRatio.toFixed(1)} times higher than the ${this.config.volumeWindowSize}-day average.`,
          recommendation: this.getVolumeSpikeRecommendation(volumeRatio),
          metadata: {
            volumeRatio,
            historicalMean: avgVolume,
            threshold: this.config.volumeSpikeThreshold
          }
        });
      }
    }
    
    return events;
  }

  /**
   * Detect statistical outliers using 3-sigma rule
   */
  private detectStatisticalOutliers(data: PriceData[]): OutlierEvent[] {
    const events: OutlierEvent[] = [];
    
    // Analyze price returns for statistical outliers
    const returns = this.calculateReturns(data);
    
    for (let i = this.config.rollingWindowSize; i < returns.length; i++) {
      const currentReturn = returns[i];
      const window = returns.slice(i - this.config.rollingWindowSize, i);
      
      const mean = this.calculateMean(window);
      const std = this.calculateStandardDeviation(window, mean);
      const zScore = Math.abs((currentReturn - mean) / std);
      
      if (zScore >= this.config.sigmaThreshold) {
        const severity = this.calculateStatisticalSeverity(zScore);
        const confidence = this.calculateStatisticalConfidence(zScore, window.length);
        
        events.push({
          id: `statistical_outlier_${data[i + 1].symbol || 'UNKNOWN'}_${data[i + 1].date}`,
          date: data[i + 1].date,
          symbol: data[i + 1].symbol || 'UNKNOWN',
          type: 'statistical_outlier',
          severity,
          confidence,
          value: currentReturn,
          expectedValue: mean,
          deviationMagnitude: zScore,
          description: `Statistical outlier: ${zScore.toFixed(1)}σ from mean`,
          explanation: `Detected return of ${(currentReturn * 100).toFixed(2)}% that is ${zScore.toFixed(1)} standard deviations from the rolling ${this.config.rollingWindowSize}-day mean.`,
          recommendation: this.getStatisticalOutlierRecommendation(zScore, currentReturn),
          metadata: {
            zScore,
            historicalMean: mean,
            historicalStd: std,
            threshold: this.config.sigmaThreshold
          }
        });
      }
    }
    
    return events;
  }

  /**
   * Detect overnight gaps (significant price changes between close and next open)
   */
  private detectGaps(data: PriceData[]): OutlierEvent[] {
    const events: OutlierEvent[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      const gapSize = Math.abs(current.open - previous.close) / previous.close;
      
      if (gapSize >= this.config.priceJumpThreshold) {
        const severity = this.calculateGapSeverity(gapSize);
        const confidence = this.calculateGapConfidence(gapSize);
        
        events.push({
          id: `gap_move_${current.symbol || 'UNKNOWN'}_${current.date}`,
          date: current.date,
          symbol: current.symbol || 'UNKNOWN',
          type: 'gap_move',
          severity,
          confidence,
          value: current.open,
          expectedValue: previous.close,
          deviationMagnitude: gapSize,
          description: `Overnight gap: ${(gapSize * 100).toFixed(1)}%`,
          explanation: `Detected significant overnight price gap of ${(gapSize * 100).toFixed(1)}% between previous close and current open.`,
          recommendation: this.getGapRecommendation(gapSize, current.open > previous.close),
          metadata: {
            priceChangePercent: gapSize,
            threshold: this.config.priceJumpThreshold
          }
        });
      }
    }
    
    return events;
  }

  /**
   * Helper functions for calculations
   */
  private calculateAverageVolume(data: PriceData[], currentIndex: number, windowSize: number): number {
    const startIndex = Math.max(0, currentIndex - windowSize);
    const endIndex = currentIndex;
    const window = data.slice(startIndex, endIndex);
    
    return window.reduce((sum, item) => sum + item.volume, 0) / window.length;
  }

  private calculateReturns(data: PriceData[]): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      const return_ = (current.close - previous.close) / previous.close;
      returns.push(return_);
    }
    
    return returns;
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[], mean?: number): number {
    const avg = mean ?? this.calculateMean(values);
    const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Severity calculation functions
   */
  private calculatePriceJumpSeverity(priceChangePercent: number, volumeRatio: number): 'low' | 'medium' | 'high' | 'critical' {
    const magnitude = priceChangePercent + (volumeRatio - 1) * 0.1;
    
    if (magnitude >= 0.5) return 'critical';
    if (magnitude >= 0.35) return 'high';
    if (magnitude >= 0.25) return 'medium';
    return 'low';
  }

  private calculateVolumeSeverity(volumeRatio: number): 'low' | 'medium' | 'high' | 'critical' {
    if (volumeRatio >= 10) return 'critical';
    if (volumeRatio >= 6) return 'high';
    if (volumeRatio >= 4) return 'medium';
    return 'low';
  }

  private calculateStatisticalSeverity(zScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore >= 5) return 'critical';
    if (zScore >= 4) return 'high';
    if (zScore >= 3.5) return 'medium';
    return 'low';
  }

  private calculateGapSeverity(gapSize: number): 'low' | 'medium' | 'high' | 'critical' {
    if (gapSize >= 0.4) return 'critical';
    if (gapSize >= 0.3) return 'high';
    if (gapSize >= 0.25) return 'medium';
    return 'low';
  }

  /**
   * Confidence calculation functions
   */
  private calculatePriceJumpConfidence(priceChangePercent: number, volumeRatio: number): number {
    const baseConfidence = Math.min(priceChangePercent / 0.5, 1);
    const volumeBonus = Math.min((volumeRatio - 1) * 0.1, 0.3);
    return Math.min(baseConfidence + volumeBonus, 1);
  }

  private calculateVolumeConfidence(volumeRatio: number, avgVolume: number): number {
    const baseConfidence = Math.min(volumeRatio / 10, 1);
    const volumeBonus = avgVolume > 1000 ? 0.1 : 0; // Higher confidence for liquid stocks
    return Math.min(baseConfidence + volumeBonus, 1);
  }

  private calculateStatisticalConfidence(zScore: number, sampleSize: number): number {
    const baseConfidence = Math.min(zScore / 5, 1);
    const sampleBonus = Math.min(sampleSize / 100, 0.2);
    return Math.min(baseConfidence + sampleBonus, 1);
  }

  private calculateGapConfidence(gapSize: number): number {
    return Math.min(gapSize / 0.5, 1);
  }

  /**
   * Recommendation functions
   */
  private getPriceJumpRecommendation(priceChange: number, priceChangePercent: number, volumeRatio: number): string {
    const direction = priceChange > 0 ? 'upward' : 'downward';
    const volumeNote = volumeRatio > 2 ? ' with high volume confirmation' : '';
    
    if (priceChangePercent > 0.3) {
      return `CRITICAL: Investigate immediately. This ${direction} move${volumeNote} may indicate significant news or events affecting the asset.`;
    } else if (priceChangePercent > 0.25) {
      return `HIGH: Monitor closely. This ${direction} movement${volumeNote} requires attention and potential position adjustment.`;
    } else {
      return `MEDIUM: Review fundamentals. This ${direction} move${volumeNote} may present trading opportunities.`;
    }
  }

  private getVolumeSpikeRecommendation(volumeRatio: number): string {
    if (volumeRatio > 8) {
      return 'CRITICAL: Exceptional trading activity detected. Check for news, earnings, or major corporate events.';
    } else if (volumeRatio > 5) {
      return 'HIGH: Significant trading interest. Monitor for potential breakout or news-driven moves.';
    } else {
      return 'MEDIUM: Increased trading activity. Consider investigating underlying reasons for volume increase.';
    }
  }

  private getStatisticalOutlierRecommendation(zScore: number, return_: number): string {
    const direction = return_ > 0 ? 'positive' : 'negative';
    
    if (zScore > 4) {
      return `CRITICAL: Extremely unusual ${direction} return detected. This is statistically very rare and requires immediate investigation.`;
    } else if (zScore > 3.5) {
      return `HIGH: Highly unusual ${direction} return. Consider if this represents a new trend or temporary anomaly.`;
    } else {
      return `MEDIUM: Unusual ${direction} return detected. Monitor for continuation or reversion to mean.`;
    }
  }

  private getGapRecommendation(gapSize: number, isUpGap: boolean): string {
    const direction = isUpGap ? 'up' : 'down';
    
    if (gapSize > 0.3) {
      return `CRITICAL: Large overnight gap ${direction}. Check for after-hours news, earnings, or significant events.`;
    } else if (gapSize > 0.25) {
      return `HIGH: Significant gap ${direction}. Monitor for gap fill or continuation of move.`;
    } else {
      return `MEDIUM: Notable gap ${direction}. Consider trading opportunities around gap levels.`;
    }
  }

  /**
   * Summary and scoring functions
   */
  private calculateSummary(events: OutlierEvent[]) {
    return {
      priceJumps: events.filter(e => e.type === 'price_jump').length,
      volumeSpikes: events.filter(e => e.type === 'volume_spike').length,
      statisticalOutliers: events.filter(e => e.type === 'statistical_outlier').length,
      criticalEvents: events.filter(e => e.severity === 'critical').length,
      avgConfidence: events.length > 0 ? 
        events.reduce((sum, _e) => sum + e.confidence, 0) / events.length : 0
    };
  }

  private calculateRiskScore(events: OutlierEvent[], totalDataPoints: number): number {
    if (events.length === 0) return 0;
    
    const outlierRate = events.length / totalDataPoints;
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const avgConfidence = events.reduce((sum, _e) => sum + e.confidence, 0) / events.length;
    
    const baseScore = outlierRate * 100;
    const criticalBonus = (criticalEvents / events.length) * 30;
    const confidenceWeight = avgConfidence * 20;
    
    return Math.min(Math.round(baseScore + criticalBonus + confidenceWeight), 100);
  }

  private calculateQualityScore(events: OutlierEvent[], totalDataPoints: number): number {
    const outlierRate = events.length / totalDataPoints;
    const dataErrorEvents = events.filter(e => 
      e.confidence < this.config.confidenceThreshold || 
      e.severity === 'critical'
    ).length;
    
    const baseScore = 100 - (outlierRate * 100);
    const errorPenalty = (dataErrorEvents / totalDataPoints) * 200;
    
    return Math.max(0, Math.round(baseScore - errorPenalty));
  }

  private deduplicateEvents(events: OutlierEvent[]): OutlierEvent[] {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = `${event.date}_${event.symbol}_${event.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private updatePerformanceMetrics(processingTime: number): void {
    this.performanceMetrics.totalAnalyses++;
    this.performanceMetrics.totalProcessingTime += processingTime;
    this.performanceMetrics.lastAnalysisTime = processingTime;
    this.performanceMetrics.averageProcessingTime = 
      this.performanceMetrics.totalProcessingTime / this.performanceMetrics.totalAnalyses;
  }

  /**
   * Public utility methods
   */
  getConfiguration(): DetectionConfig {
    return { ...this.config };
  }

  updateConfiguration(newConfig: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  reset(): void {
    this.performanceMetrics = {
      totalAnalyses: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      lastAnalysisTime: 0
    };
  }
}

// Export singleton instance
export const outlierDetector = new OutlierDetector();

// Export class for testing
export default OutlierDetector; 
