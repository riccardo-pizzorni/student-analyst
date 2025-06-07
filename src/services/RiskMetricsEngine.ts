/**
 * RiskMetricsEngine - Motore di Calcolo Risk Metrics Finanziari
 * 
 * Questo motore implementa tutti i calcoli standard di risk metrics utilizzati
 * nell'analisi finanziaria professionale con precisione istituzionale.
 * 
 * Features:
 * - Historical volatility (std dev × √252)
 * - Downside deviation calculation
 * - Skewness e kurtosis analysis
 * - Rolling volatility (30/60/90 days)
 * - Advanced statistical measures
 * - Performance optimizations per large datasets
 */

interface RiskMetricsResult {
  volatility: number | null;
  annualizedVolatility: number | null;
  downsideDeviation: number | null;
  annualizedDownsideDeviation: number | null;
  skewness: number | null;
  kurtosis: number | null;
  excessKurtosis: number | null;
  sampleSize: number;
  confidenceLevel: number;
}

interface VolatilityResult {
  volatility: number;
  annualizedVolatility: number;
  sampleSize: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  interpretation: string;
}

interface DownsideRiskResult {
  downsideDeviation: number;
  annualizedDownsideDeviation: number;
  downsideObservations: number;
  downsideFrequency: number;
  targetReturn: number;
  semiVariance: number;
  interpretation: string;
}

interface DistributionMetrics {
  skewness: number | null;
  kurtosis: number | null;
  excessKurtosis: number | null;
  isNormal: boolean;
  jarqueBera: number | null;
  shapiroWilk: number | null;
  interpretation: {
    skewness: string;
    kurtosis: string;
    normality: string;
  };
}

interface RollingMetricsResult {
  values: number[];
  dates: string[];
  windowSize: number;
  mean: number | null;
  volatility: number | null;
  min: number | null;
  max: number | null;
  trend: {
    slope: number | null;
    direction: 'increasing' | 'decreasing' | 'stable';
    significance: number | null;
  };
  latest: number | null;
}

interface RiskMetricsConfig {
  annualizationFactor?: number; // Default: 252 for daily data
  targetReturn?: number; // For downside calculations
  confidenceLevel?: number; // For confidence intervals
  rollingWindows?: number[]; // Rolling window sizes
  validateInput?: boolean; // Perform input validation
  includeInterpretation?: boolean; // Include textual interpretations
}

class RiskMetricsEngine {
  private static instance: RiskMetricsEngine;
  private readonly DEFAULT_ANNUALIZATION_FACTOR = 252; // Trading days per year
  private readonly DEFAULT_CONFIDENCE_LEVEL = 0.95;
  private readonly MINIMUM_OBSERVATIONS = 2;

  constructor() {}

  public static getInstance(): RiskMetricsEngine {
    if (!RiskMetricsEngine.instance) {
      RiskMetricsEngine.instance = new RiskMetricsEngine();
    }
    return RiskMetricsEngine.instance;
  }

  /**
   * Calcola historical volatility (standard deviation annualizzata)
   */
  public calculateHistoricalVolatility(
    returns: (number | null)[],
    config: RiskMetricsConfig = {}
  ): VolatilityResult | null {
    console.log('📊 Calculating historical volatility...', { 
      returnsCount: returns.length, 
      config 
    });

    const startTime = performance.now();
    const { 
      annualizationFactor = this.DEFAULT_ANNUALIZATION_FACTOR,
      confidenceLevel = this.DEFAULT_CONFIDENCE_LEVEL,
      validateInput = true 
    } = config;

    try {
      // Validate input
      if (validateInput && (!returns || returns.length < this.MINIMUM_OBSERVATIONS)) {
        throw new Error(`Insufficient data: need at least ${this.MINIMUM_OBSERVATIONS} returns`);
      }

      // Filter valid returns
      const validReturns = returns.filter(r => r !== null && this.isValidReturn(r)) as number[];
      
      if (validReturns.length < this.MINIMUM_OBSERVATIONS) {
        throw new Error('Insufficient valid returns for volatility calculation');
      }

      // Calculate sample mean
      const mean = this.calculateMean(validReturns);

      // Calculate sample variance (unbiased estimator with N-1)
      const sumSquaredDeviations = validReturns.reduce((sum, ret) => {
        const deviation = ret - mean;
        return sum + (deviation * deviation);
      }, 0);

      const variance = sumSquaredDeviations / (validReturns.length - 1);
      const volatility = Math.sqrt(variance);
      
      // Annualize volatility
      const annualizedVolatility = volatility * Math.sqrt(annualizationFactor);

      // Calculate confidence interval
      const confidenceInterval = this.calculateVolatilityConfidenceInterval(
        volatility, validReturns.length, confidenceLevel
      );

      // Generate interpretation
      const interpretation = this.interpretVolatility(annualizedVolatility);

      const result: VolatilityResult = {
        volatility,
        annualizedVolatility,
        sampleSize: validReturns.length,
        confidenceInterval,
        interpretation
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Historical volatility calculated:', {
        volatility: (volatility * 100).toFixed(4) + '%',
        annualizedVolatility: (annualizedVolatility * 100).toFixed(2) + '%',
        sampleSize: validReturns.length,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating historical volatility:', error);
      return null;
    }
  }

  /**
   * Calcola downside deviation (volatilità dei ritorni negativi)
   */
  public calculateDownsideDeviation(
    returns: (number | null)[],
    config: RiskMetricsConfig = {}
  ): DownsideRiskResult | null {
    console.log('📉 Calculating downside deviation...', { 
      returnsCount: returns.length, 
      config 
    });

    const startTime = performance.now();
    const {
      targetReturn = 0.0,
      annualizationFactor = this.DEFAULT_ANNUALIZATION_FACTOR,
      validateInput = true
    } = config;

    try {
      // Validate input
      if (validateInput && (!returns || returns.length < this.MINIMUM_OBSERVATIONS)) {
        throw new Error(`Insufficient data: need at least ${this.MINIMUM_OBSERVATIONS} returns`);
      }

      // Filter valid returns
      const validReturns = returns.filter(r => r !== null && this.isValidReturn(r)) as number[];
      
      if (validReturns.length < this.MINIMUM_OBSERVATIONS) {
        throw new Error('Insufficient valid returns for downside deviation calculation');
      }

      // Calculate downside deviations (only negative returns relative to target)
      const downsideDeviations: number[] = [];
      let downsideObservations = 0;

      for (const ret of validReturns) {
        if (ret < targetReturn) {
          const downsideDeviation = ret - targetReturn;
          downsideDeviations.push(downsideDeviation);
          downsideObservations++;
        }
      }

      let downsideDeviation = 0;
      let semiVariance = 0;

      if (downsideObservations > 0) {
        // Calculate semi-variance (using total observations in denominator)
        const sumSquaredDownsideDeviations = downsideDeviations.reduce((sum, dev) => sum + (dev * dev), 0);
        semiVariance = sumSquaredDownsideDeviations / validReturns.length;
        downsideDeviation = Math.sqrt(semiVariance);
      }

      // Annualize downside deviation
      const annualizedDownsideDeviation = downsideDeviation * Math.sqrt(annualizationFactor);

      // Calculate downside frequency
      const downsideFrequency = downsideObservations / validReturns.length;

      // Generate interpretation
      const interpretation = this.interpretDownsideRisk(annualizedDownsideDeviation, downsideFrequency);

      const result: DownsideRiskResult = {
        downsideDeviation,
        annualizedDownsideDeviation,
        downsideObservations,
        downsideFrequency,
        targetReturn,
        semiVariance,
        interpretation
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Downside deviation calculated:', {
        downsideDeviation: (downsideDeviation * 100).toFixed(4) + '%',
        annualizedDownsideDeviation: (annualizedDownsideDeviation * 100).toFixed(2) + '%',
        downsideFrequency: (downsideFrequency * 100).toFixed(1) + '%',
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating downside deviation:', error);
      return null;
    }
  }

  /**
   * Calcola skewness (asimmetria della distribuzione)
   */
  public calculateSkewness(returns: (number | null)[]): number | null {
    console.log('📐 Calculating skewness...');

    try {
      const validReturns = returns.filter(r => r !== null && this.isValidReturn(r)) as number[];
      
      if (validReturns.length < 3) {
        console.warn('⚠️ Need at least 3 observations for skewness calculation');
        return null;
      }

      const n = validReturns.length;
      const mean = this.calculateMean(validReturns);
      
      // Calculate standard deviation
      const variance = validReturns.reduce((sum, ret) => {
        const deviation = ret - mean;
        return sum + (deviation * deviation);
      }, 0) / (n - 1);

      const stdDev = Math.sqrt(variance);

      if (stdDev === 0) {
        console.warn('⚠️ Cannot calculate skewness for constant values');
        return null;
      }

      // Calculate third moment
      const thirdMoment = validReturns.reduce((sum, ret) => {
        const standardizedValue = (ret - mean) / stdDev;
        return sum + Math.pow(standardizedValue, 3);
      }, 0) / n;

      // Sample skewness with bias correction
      const sampleSkewness = thirdMoment * (n * (n - 1)) / ((n - 2) * n);

      console.log('✅ Skewness calculated:', {
        skewness: sampleSkewness.toFixed(4),
        interpretation: this.interpretSkewness(sampleSkewness)
      });

      return sampleSkewness;

    } catch (error) {
      console.error('❌ Error calculating skewness:', error);
      return null;
    }
  }

  /**
   * Calcola kurtosis (curtosi - misura delle code grasse)
   */
  public calculateKurtosis(returns: (number | null)[]): { kurtosis: number | null; excessKurtosis: number | null } {
    console.log('📊 Calculating kurtosis...');

    try {
      const validReturns = returns.filter(r => r !== null && this.isValidReturn(r)) as number[];
      
      if (validReturns.length < 4) {
        console.warn('⚠️ Need at least 4 observations for kurtosis calculation');
        return { kurtosis: null, excessKurtosis: null };
      }

      const n = validReturns.length;
      const mean = this.calculateMean(validReturns);
      
      // Calculate standard deviation
      const variance = validReturns.reduce((sum, ret) => {
        const deviation = ret - mean;
        return sum + (deviation * deviation);
      }, 0) / (n - 1);

      const stdDev = Math.sqrt(variance);

      if (stdDev === 0) {
        console.warn('⚠️ Cannot calculate kurtosis for constant values');
        return { kurtosis: null, excessKurtosis: null };
      }

      // Calculate fourth moment
      const fourthMoment = validReturns.reduce((sum, ret) => {
        const standardizedValue = (ret - mean) / stdDev;
        return sum + Math.pow(standardizedValue, 4);
      }, 0) / n;

      // Excess kurtosis (subtract 3 for normal distribution baseline)
      const excessKurtosis = fourthMoment - 3.0;

      // Sample kurtosis with bias correction
      const biasCorrection = (n - 1) * ((n + 1) * fourthMoment - 3 * (n - 1)) / ((n - 2) * (n - 3));
      const sampleExcessKurtosis = biasCorrection - 3.0;

      console.log('✅ Kurtosis calculated:', {
        kurtosis: fourthMoment.toFixed(4),
        excessKurtosis: excessKurtosis.toFixed(4),
        interpretation: this.interpretKurtosis(excessKurtosis)
      });

      return { 
        kurtosis: fourthMoment, 
        excessKurtosis: sampleExcessKurtosis 
      };

    } catch (error) {
      console.error('❌ Error calculating kurtosis:', error);
      return { kurtosis: null, excessKurtosis: null };
    }
  }

  /**
   * Calcola rolling volatility per multiple window sizes
   */
  public calculateRollingVolatility(
    returns: (number | null)[],
    dates: string[],
    config: RiskMetricsConfig = {}
  ): Record<string, RollingMetricsResult> {
    console.log('🔄 Calculating rolling volatility...', { 
      returnsCount: returns.length,
      config 
    });

    const startTime = performance.now();
    const {
      rollingWindows = [30, 60, 90],
      annualizationFactor = this.DEFAULT_ANNUALIZATION_FACTOR
    } = config;

    const results: Record<string, RollingMetricsResult> = {};

    try {
      for (const windowSize of rollingWindows) {
        const rollingVolatilities: number[] = [];
        const rollingDates: string[] = [];

        // Check if we have enough data
        if (returns.length < windowSize) {
          results[`rolling_${windowSize}d`] = {
            values: [],
            dates: [],
            windowSize,
            mean: null,
            volatility: null,
            min: null,
            max: null,
            trend: { slope: null, direction: 'stable', significance: null },
            latest: null
          };
          continue;
        }

        // Calculate rolling volatility for each window
        for (let i = windowSize - 1; i < returns.length; i++) {
          const windowReturns = returns.slice(i - windowSize + 1, i + 1);
          
          // Calculate volatility for this window
          const windowVolatility = this.calculateHistoricalVolatility(windowReturns, {
            annualizationFactor,
            validateInput: false
          });

          if (windowVolatility && windowVolatility.annualizedVolatility !== null) {
            rollingVolatilities.push(windowVolatility.annualizedVolatility);
            if (dates && dates[i]) {
              rollingDates.push(dates[i]);
            }
          }
        }

        // Calculate rolling statistics
        const rollingStats = this.calculateRollingStatistics(rollingVolatilities);

        results[`rolling_${windowSize}d`] = {
          values: rollingVolatilities,
          dates: rollingDates,
          windowSize,
          ...rollingStats,
          latest: rollingVolatilities.length > 0 ? rollingVolatilities[rollingVolatilities.length - 1] : null
        };
      }

      const processingTime = performance.now() - startTime;
      console.log('✅ Rolling volatility calculated:', {
        windows: rollingWindows,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return results;

    } catch (error) {
      console.error('❌ Error calculating rolling volatility:', error);
      return {};
    }
  }

  /**
   * Calcola tutti i risk metrics in una singola chiamata
   */
  public calculateComprehensiveRiskMetrics(
    returns: (number | null)[],
    dates: string[],
    config: RiskMetricsConfig = {}
  ): {
    volatility: VolatilityResult | null;
    downsideRisk: DownsideRiskResult | null;
    distribution: DistributionMetrics;
    rollingMetrics: Record<string, RollingMetricsResult>;
    summary: RiskMetricsResult;
  } {
    console.log('🎯 Calculating comprehensive risk metrics...', { 
      returnsCount: returns.length 
    });

    const startTime = performance.now();

    try {
      // Calculate individual metrics
      const volatility = this.calculateHistoricalVolatility(returns, config);
      const downsideRisk = this.calculateDownsideDeviation(returns, config);
      const skewness = this.calculateSkewness(returns);
      const kurtosisResult = this.calculateKurtosis(returns);
      const rollingMetrics = this.calculateRollingVolatility(returns, dates, config);

      // Build distribution metrics
      const distribution: DistributionMetrics = {
        skewness,
        kurtosis: kurtosisResult.kurtosis,
        excessKurtosis: kurtosisResult.excessKurtosis,
        isNormal: this.testNormality(returns),
        jarqueBera: this.calculateJarqueBera(returns),
        shapiroWilk: null, // Could implement if needed
        interpretation: {
          skewness: skewness !== null ? this.interpretSkewness(skewness) : 'N/A',
          kurtosis: kurtosisResult.excessKurtosis !== null ? this.interpretKurtosis(kurtosisResult.excessKurtosis) : 'N/A',
          normality: this.interpretNormality(this.testNormality(returns))
        }
      };

      // Build summary
      const validReturns = returns.filter(r => r !== null && this.isValidReturn(r));
      const summary: RiskMetricsResult = {
        volatility: volatility?.volatility || null,
        annualizedVolatility: volatility?.annualizedVolatility || null,
        downsideDeviation: downsideRisk?.downsideDeviation || null,
        annualizedDownsideDeviation: downsideRisk?.annualizedDownsideDeviation || null,
        skewness,
        kurtosis: kurtosisResult.kurtosis,
        excessKurtosis: kurtosisResult.excessKurtosis,
        sampleSize: validReturns.length,
        confidenceLevel: config.confidenceLevel || this.DEFAULT_CONFIDENCE_LEVEL
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Comprehensive risk metrics calculated:', {
        processingTime: `${processingTime.toFixed(2)}ms`,
        metricsCalculated: Object.keys({ volatility, downsideRisk, distribution, rollingMetrics }).length
      });

      return {
        volatility,
        downsideRisk,
        distribution,
        rollingMetrics,
        summary
      };

    } catch (error) {
      console.error('❌ Error calculating comprehensive risk metrics:', error);
      throw error;
    }
  }

  /**
   * Utility methods
   */
  private isValidReturn(value: unknown): boolean {
    return typeof value === 'number' && isFinite(value) && !isNaN(value);
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[]): number | null {
    if (values.length < 2) return null;
    
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    
    return Math.sqrt(variance);
  }

  private calculateVolatilityConfidenceInterval(
    volatility: number, 
    sampleSize: number, 
    confidenceLevel: number
  ): { lower: number; upper: number; level: number } {
    // Chi-square confidence interval for volatility
    const alpha = 1 - confidenceLevel;
    const df = sampleSize - 1;
    
    // Simplified approximation for chi-square critical values
    const chiSquareUpper = df + Math.sqrt(2 * df) * this.normalInverse(1 - alpha / 2);
    const chiSquareLower = df - Math.sqrt(2 * df) * this.normalInverse(1 - alpha / 2);
    
    const lower = volatility * Math.sqrt(df / chiSquareUpper);
    const upper = volatility * Math.sqrt(df / chiSquareLower);
    
    return { lower, upper, level: confidenceLevel };
  }

  private normalInverse(p: number): number {
    // Approximation of inverse normal distribution
    // More accurate implementation would use proper statistical libraries
    if (p < 0.5) {
      return -this.normalInverse(1 - p);
    }
    
    const c0 = 2.515517;
    const c1 = 0.802853;
    const c2 = 0.010328;
    const d1 = 1.432788;
    const d2 = 0.189269;
    const d3 = 0.001308;
    
    const t = Math.sqrt(-2 * Math.log(1 - p));
    
    return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
  }

  private calculateRollingStatistics(values: number[]): {
    mean: number | null;
    volatility: number | null;
    min: number | null;
    max: number | null;
    trend: { slope: number | null; direction: 'increasing' | 'decreasing' | 'stable'; significance: number | null };
  } {
    if (values.length === 0) {
      return {
        mean: null,
        volatility: null,
        min: null,
        max: null,
        trend: { slope: null, direction: 'stable', significance: null }
      };
    }

    const mean = this.calculateMean(values);
    const volatility = this.calculateStandardDeviation(values);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Simple linear trend calculation
    const trend = this.calculateTrend(values);

    return { mean, volatility, min, max, trend };
  }

  private calculateTrend(values: number[]): { 
    slope: number | null; 
    direction: 'increasing' | 'decreasing' | 'stable'; 
    significance: number | null 
  } {
    if (values.length < 2) {
      return { slope: null, direction: 'stable', significance: null };
    }

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(slope) > 0.001) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    return { slope, direction, significance: null };
  }

  private testNormality(returns: (number | null)[]): boolean {
    const validReturns = returns.filter(r => r !== null && this.isValidReturn(r)) as number[];
    
    if (validReturns.length < 8) {
      return false; // Cannot reliably test normality with few observations
    }

    const skewness = this.calculateSkewness(returns);
    const kurtosisResult = this.calculateKurtosis(returns);

    if (skewness === null || kurtosisResult.excessKurtosis === null) {
      return false;
    }

    // Simple normality test based on skewness and kurtosis thresholds
    const skewnessThreshold = 2.0;
    const kurtosisThreshold = 3.0;

    return Math.abs(skewness) < skewnessThreshold && Math.abs(kurtosisResult.excessKurtosis) < kurtosisThreshold;
  }

  private calculateJarqueBera(returns: (number | null)[]): number | null {
    const validReturns = returns.filter(r => r !== null && this.isValidReturn(r)) as number[];
    
    if (validReturns.length < 4) {
      return null;
    }

    const skewness = this.calculateSkewness(returns);
    const kurtosisResult = this.calculateKurtosis(returns);

    if (skewness === null || kurtosisResult.excessKurtosis === null) {
      return null;
    }

    const n = validReturns.length;
    const jb = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosisResult.excessKurtosis, 2) / 4);

    return jb;
  }

  private interpretVolatility(annualizedVolatility: number): string {
    const vol = annualizedVolatility * 100;
    
    if (vol < 10) return 'Low volatility - Conservative investment';
    if (vol < 20) return 'Moderate volatility - Balanced risk profile';
    if (vol < 30) return 'High volatility - Aggressive investment';
    return 'Very high volatility - Speculative investment';
  }

  private interpretDownsideRisk(downsideDeviation: number, frequency: number): string {
    const dd = downsideDeviation * 100;
    const freq = frequency * 100;
    
    if (dd < 5 && freq < 30) return 'Low downside risk - Stable downside protection';
    if (dd < 15 && freq < 50) return 'Moderate downside risk - Acceptable loss profile';
    return 'High downside risk - Significant loss potential';
  }

  private interpretSkewness(skewness: number): string {
    if (skewness > 0.5) return 'Positive skew - More frequent small losses, rare large gains';
    if (skewness < -0.5) return 'Negative skew - More frequent small gains, rare large losses';
    return 'Symmetric distribution - Balanced gain/loss profile';
  }

  private interpretKurtosis(excessKurtosis: number): string {
    if (excessKurtosis > 1) return 'High kurtosis - Fat tails, extreme events more likely';
    if (excessKurtosis < -1) return 'Low kurtosis - Thin tails, extreme events less likely';
    return 'Normal kurtosis - Standard tail risk profile';
  }

  private interpretNormality(isNormal: boolean): string {
    return isNormal 
      ? 'Distribution appears normal - Standard risk models applicable'
      : 'Distribution is non-normal - Consider advanced risk models';
  }
}

// Export singleton instance
export const riskMetricsEngine = RiskMetricsEngine.getInstance();
export default RiskMetricsEngine;

// Export types
export type {
  RiskMetricsResult,
  VolatilityResult,
  DownsideRiskResult,
  DistributionMetrics,
  RollingMetricsResult,
  RiskMetricsConfig
}; 
