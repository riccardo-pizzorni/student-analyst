/**
 * OUTLIER DETECTION SERVICE
 * Advanced financial data outlier detection and analysis
 */

interface FinancialDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
}

interface OutlierDetection {
  type: 'PRICE_SPIKE' | 'VOLUME_SPIKE' | 'STATISTICAL' | 'TRADING_RANGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dataPoint: FinancialDataPoint;
  confidence: number;
  description: string;
  suggestedAction: string;
}

interface OutlierDetectionConfig {
  priceThreshold: number;
  volumeThreshold: number;
  lookbackPeriod: number;
  confidenceThreshold: number;
  enableVolumeDetection: boolean;
  enablePriceDetection: boolean;
}

interface MetricStatistics {
  mean: number;
  stdDev: number;
  variance: number;
}

interface BaselineStatistics {
  open: MetricStatistics;
  high: MetricStatistics;
  low: MetricStatistics;
  close: MetricStatistics;
  volume: MetricStatistics;
  range: MetricStatistics;
}

interface OutlierDetectionReport {
  symbol: string;
  totalDataPoints: number;
  outliersDetected: number;
  severityDistribution: Record<string, number>;
  outliers: OutlierDetection[];
  executionTimeMs: number;
  confidence: number;
}

export class OutlierDetectionService {
  private config: OutlierDetectionConfig;

  constructor(config: Partial<OutlierDetectionConfig> = {}) {
    this.config = {
      priceThreshold: 2.5,
      volumeThreshold: 3.0,
      lookbackPeriod: 20,
      confidenceThreshold: 0.8,
      enableVolumeDetection: true,
      enablePriceDetection: true,
      ...config,
    };
  }

  async detectOutliers(
    data: FinancialDataPoint[],
    symbol: string,
  ): Promise<OutlierDetectionReport> {
    const startTime = Date.now();

    try {
      if (!data || data.length < this.config.lookbackPeriod) {
        throw new Error('Insufficient data for outlier detection');
      }

      const baselineStats = this.calculateBaselineStatistics(
        data,
        this.config.lookbackPeriod,
      );

      const outliers: OutlierDetection[] = [];

      if (this.config.enablePriceDetection) {
        outliers.push(...this.detectPriceSpikes(data, baselineStats));
      }

      if (this.config.enableVolumeDetection) {
        outliers.push(...this.detectVolumeSpikes(data, baselineStats));
      }

      const severityDistribution = outliers.reduce((acc, outlier) => {
        acc[outlier.severity] = (acc[outlier.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const report: OutlierDetectionReport = {
        symbol,
        totalDataPoints: data.length,
        outliersDetected: outliers.length,
        severityDistribution,
        outliers,
        executionTimeMs: Date.now() - startTime,
        confidence: this.calculateOverallConfidence(outliers),
      };

      console.log(
        `✅ Outlier detection completed for ${symbol} in ${Date.now() - startTime}ms`,
      );
      return report;
    } catch (error: unknown) {
      console.error(`❌ Outlier detection failed for ${symbol}:`, error);
      throw new Error(
        `Outlier detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private detectPriceSpikes(
    data: FinancialDataPoint[],
    baselineStats: BaselineStatistics,
  ): OutlierDetection[] {
    const outliers: OutlierDetection[] = [];

    for (const point of data) {
      const priceChange = Math.abs(point.close - point.open) / point.open;
      const threshold = this.config.priceThreshold * baselineStats.close.stdDev;

      if (priceChange > threshold) {
        outliers.push({
          type: 'PRICE_SPIKE',
          severity: this.calculateSeverity(priceChange, threshold),
          dataPoint: point,
          confidence: Math.min(priceChange / threshold, 1.0),
          description: `Price spike detected: ${(priceChange * 100).toFixed(2)}% change`,
          suggestedAction: 'Investigate news or events for this date',
        });
      }
    }

    return outliers;
  }

  private detectVolumeSpikes(
    data: FinancialDataPoint[],
    baselineStats: BaselineStatistics,
  ): OutlierDetection[] {
    const outliers: OutlierDetection[] = [];

    for (const point of data) {
      const volumeZScore = Math.abs(
        (point.volume - baselineStats.volume.mean) / baselineStats.volume.stdDev,
      );

      if (volumeZScore > this.config.volumeThreshold) {
        outliers.push({
          type: 'VOLUME_SPIKE',
          severity: this.calculateSeverity(volumeZScore, this.config.volumeThreshold),
          dataPoint: point,
          confidence: Math.min(volumeZScore / this.config.volumeThreshold, 1.0),
          description: `Volume spike detected: ${volumeZScore.toFixed(2)} standard deviations`,
          suggestedAction: 'Check for unusual trading activity or announcements',
        });
      }
    }

    return outliers;
  }

  private calculateBaselineStatistics(
    data: FinancialDataPoint[],
    lookbackPeriod: number,
  ): BaselineStatistics {
    const recentData = data.slice(-lookbackPeriod);

    return {
      open: this.calculateMetricStats(recentData.map((d) => d.open)),
      high: this.calculateMetricStats(recentData.map((d) => d.high)),
      low: this.calculateMetricStats(recentData.map((d) => d.low)),
      close: this.calculateMetricStats(recentData.map((d) => d.close)),
      volume: this.calculateMetricStats(recentData.map((d) => d.volume)),
      range: this.calculateMetricStats(
        recentData.map((d) => d.high - d.low),
      ),
    };
  }

  private calculateMetricStats(values: number[]): MetricStatistics {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev, variance };
  }

  private calculateSeverity(
    value: number,
    threshold: number,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const ratio = value / threshold;
    if (ratio >= 3) return 'CRITICAL';
    if (ratio >= 2) return 'HIGH';
    if (ratio >= 1.5) return 'MEDIUM';
    return 'LOW';
  }

  private calculateOverallConfidence(outliers: OutlierDetection[]): number {
    if (outliers.length === 0) return 1.0;
    
    const avgConfidence = outliers.reduce((sum, outlier) => sum + outlier.confidence, 0) / outliers.length;
    return Math.min(avgConfidence, 1.0);
  }
} 