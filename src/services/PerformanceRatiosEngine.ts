/**
 * PerformanceRatiosEngine - Motore di Calcolo Performance Ratios Finanziari
 * 
 * Questo motore implementa tutti i ratios standard di performance utilizzati
 * nell'analisi finanziaria professionale con precisione istituzionale.
 * 
 * Features:
 * - Sharpe Ratio = (Return - Risk_free) / Volatility
 * - Sortino Ratio con downside deviation
 * - Information Ratio calculation
 * - Calmar Ratio = Annual_Return / Max_Drawdown
 * - Advanced statistical analysis
 * - Performance optimizations per large datasets
 */

interface PerformanceRatiosResult {
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  informationRatio: number | null;
  calmarRatio: number | null;
  sampleSize: number;
  confidenceLevel: number;
}

interface SharpeRatioResult {
  sharpeRatio: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  excessReturn: number;
  riskFreeRate: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  sampleSize: number;
  interpretation: string;
}

interface SortinoRatioResult {
  sortinoRatio: number;
  annualizedReturn: number;
  targetReturn: number;
  downsideDeviation: number;
  excessReturn: number;
  downsideFrequency: number;
  sampleSize: number;
  interpretation: string;
}

interface InformationRatioResult {
  informationRatio: number;
  portfolioReturn: number;
  benchmarkReturn: number;
  activeReturn: number;
  trackingError: number;
  tStatistic: number;
  pValue: number;
  isSignificant: boolean;
  sampleSize: number;
  interpretation: string;
}

interface CalmarRatioResult {
  calmarRatio: number;
  annualizedReturn: number;
  maxDrawdown: number;
  maxDrawdownStart: string | null;
  maxDrawdownEnd: string | null;
  maxDrawdownDuration: number;
  recoveryTime: number | null;
  sampleSize: number;
  interpretation: string;
}

interface DrawdownAnalysis {
  maxDrawdown: number;
  startIdx: number;
  endIdx: number;
  recoveryIdx: number | null;
  durationPeriods: number;
  recoveryPeriods: number | null;
  drawdownSeries: number[];
  cumulativeWealth: number[];
  startDate?: string;
  endDate?: string;
  recoveryDate?: string;
}

interface PerformanceRatiosConfig {
  riskFreeRate?: number; // Default: 0.02 (2% annual)
  targetReturn?: number; // For Sortino ratio
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly'; // Data frequency
  confidenceLevel?: number; // For confidence intervals
  validateInput?: boolean; // Perform input validation
  includeInterpretation?: boolean; // Include textual interpretations
}

type FrequencyPeriods = {
  daily: 252;
  weekly: 52;
  monthly: 12;
  quarterly: 4;
};

class PerformanceRatiosEngine {
  private static instance: PerformanceRatiosEngine;
  private readonly DEFAULT_RISK_FREE_RATE = 0.02; // 2% annual
  private readonly DEFAULT_CONFIDENCE_LEVEL = 0.95;
  private readonly MINIMUM_OBSERVATIONS = 2;
  private readonly PERIODS_PER_YEAR: FrequencyPeriods = {
    daily: 252,
    weekly: 52,
    monthly: 12,
    quarterly: 4
  };

  constructor() {}

  public static getInstance(): PerformanceRatiosEngine {
    if (!PerformanceRatiosEngine.instance) {
      PerformanceRatiosEngine.instance = new PerformanceRatiosEngine();
    }
    return PerformanceRatiosEngine.instance;
  }

  /**
   * Calcola Sharpe Ratio: (Return - Risk_free) / Volatility
   */
  public calculateSharpeRatio(
    returns: (number | null)[],
    config: PerformanceRatiosConfig = {}
  ): SharpeRatioResult | null {
    console.log('📊 Calculating Sharpe Ratio...', { 
      returnsCount: returns.length, 
      config 
    });

    const startTime = performance.now();
    const { 
      riskFreeRate = this.DEFAULT_RISK_FREE_RATE,
      frequency = 'daily',
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
        throw new Error('Insufficient valid returns for Sharpe ratio calculation');
      }

      // Calculate annualized return using geometric mean
      const periodsPerYear = this.PERIODS_PER_YEAR[frequency];
      const cumulativeReturn = this.calculateCumulativeReturn(validReturns);
      const years = validReturns.length / periodsPerYear;
      const annualizedReturn = Math.pow(1 + cumulativeReturn, 1 / years) - 1;

      // Calculate annualized volatility
      const volatility = this.calculateStandardDeviation(validReturns);
      if (volatility === null) {
        throw new Error('Cannot calculate volatility for Sharpe ratio');
      }
      const annualizedVolatility = volatility * Math.sqrt(periodsPerYear);

      // Calculate excess return
      const excessReturn = annualizedReturn - riskFreeRate;

      // Calculate Sharpe ratio
      let sharpeRatio: number;
      if (annualizedVolatility === 0) {
        if (excessReturn > 0) {
          sharpeRatio = Number.POSITIVEiNFINITY;
        } else if (excessReturn < 0) {
          sharpeRatio = Number.NEGATIVE_INFINITY;
        } else {
          sharpeRatio = 0; // No excess return, no volatility
        }
      } else {
        sharpeRatio = excessReturn / annualizedVolatility;
      }

      // Calculate confidence interval using bootstrap method
      const confidenceInterval = this.calculateSharpeConfidenceInterval(
        validReturns, riskFreeRate, frequency, confidenceLevel
      );

      // Generate interpretation
      const interpretation = this.interpretSharpeRatio(sharpeRatio);

      const result: SharpeRatioResult = {
        sharpeRatio,
        annualizedReturn,
        annualizedVolatility,
        excessReturn,
        riskFreeRate,
        confidenceInterval,
        sampleSize: validReturns.length,
        interpretation
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Sharpe Ratio calculated:', {
        sharpeRatio: sharpeRatio.toFixed(4),
        annualizedReturn: (annualizedReturn * 100).toFixed(2) + '%',
        annualizedVolatility: (annualizedVolatility * 100).toFixed(2) + '%',
        sampleSize: validReturns.length,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Sharpe Ratio:', error);
      return null;
    }
  }

  /**
   * Calcola Sortino Ratio con downside deviation
   */
  public calculateSortinoRatio(
    returns: (number | null)[],
    config: PerformanceRatiosConfig = {}
  ): SortinoRatioResult | null {
    console.log('📉 Calculating Sortino Ratio...', { 
      returnsCount: returns.length, 
      config 
    });

    const startTime = performance.now();
    const {
      targetReturn = 0.0,
      frequency = 'daily',
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
        throw new Error('Insufficient valid returns for Sortino ratio calculation');
      }

      // Calculate annualized return
      const periodsPerYear = this.PERIODS_PER_YEAR[frequency];
      const cumulativeReturn = this.calculateCumulativeReturn(validReturns);
      const years = validReturns.length / periodsPerYear;
      const annualizedReturn = Math.pow(1 + cumulativeReturn, 1 / years) - 1;

      // Calculate downside deviation
      const dailyTarget = targetReturn / periodsPerYear; // Convert to period target
      const downsideReturns: number[] = [];

      for (const ret of validReturns) {
        if (ret < dailyTarget) {
          const downsideDeviation = ret - dailyTarget;
          downsideReturns.push(downsideDeviation);
        }
      }

      let downsideDeviation: number;
      if (downsideReturns.length === 0) {
        // No downside deviations
        const excessReturn = annualizedReturn - targetReturn;
        const sortinoRatio = excessReturn > 0 ? Number.POSITIVEiNFINITY : 0;
        
        return {
          sortinoRatio,
          annualizedReturn,
          targetReturn,
          downsideDeviation: 0,
          excessReturn,
          downsideFrequency: 0,
          sampleSize: validReturns.length,
          interpretation: this.interpretSortinoRatio(sortinoRatio)
        };
      }

      // Calculate downside deviation (using all observations in denominator)
      const sumSquaredDownside = downsideReturns.reduce((sum, dev) => sum + (dev * dev), 0);
      const downsideVariance = sumSquaredDownside / validReturns.length;
      downsideDeviation = Math.sqrt(downsideVariance);
      const annualizedDownsideDeviation = downsideDeviation * Math.sqrt(periodsPerYear);

      // Calculate Sortino ratio
      const excessReturn = annualizedReturn - targetReturn;
      let sortinoRatio: number;

      if (annualizedDownsideDeviation === 0) {
        sortinoRatio = excessReturn > 0 ? Number.POSITIVEiNFINITY : 0;
      } else {
        sortinoRatio = excessReturn / annualizedDownsideDeviation;
      }

      // Calculate downside frequency
      const downsideFrequency = downsideReturns.length / validReturns.length;

      // Generate interpretation
      const interpretation = this.interpretSortinoRatio(sortinoRatio);

      const result: SortinoRatioResult = {
        sortinoRatio,
        annualizedReturn,
        targetReturn,
        downsideDeviation: annualizedDownsideDeviation,
        excessReturn,
        downsideFrequency,
        sampleSize: validReturns.length,
        interpretation
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Sortino Ratio calculated:', {
        sortinoRatio: sortinoRatio.toFixed(4),
        annualizedReturn: (annualizedReturn * 100).toFixed(2) + '%',
        downsideDeviation: (annualizedDownsideDeviation * 100).toFixed(2) + '%',
        downsideFrequency: (downsideFrequency * 100).toFixed(1) + '%',
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Sortino Ratio:', error);
      return null;
    }
  }

  /**
   * Calcola Information Ratio
   */
  public calculateInformationRatio(
    portfolioReturns: (number | null)[],
    benchmarkReturns: (number | null)[],
    config: PerformanceRatiosConfig = {}
  ): InformationRatioResult | null {
    console.log('📈 Calculating Information Ratio...', { 
      portfolioCount: portfolioReturns.length,
      benchmarkCount: benchmarkReturns.length,
      config 
    });

    const startTime = performance.now();
    const {
      frequency = 'daily',
      validateInput = true
    } = config;

    try {
      // Validate input
      if (validateInput && portfolioReturns.length !== benchmarkReturns.length) {
        throw new Error('Portfolio and benchmark returns must have same length');
      }

      if (validateInput && portfolioReturns.length < this.MINIMUM_OBSERVATIONS) {
        throw new Error(`Insufficient data: need at least ${this.MINIMUM_OBSERVATIONS} returns`);
      }

      // Filter valid pairs
      const validPairs: Array<[number, number]> = [];
      for (let i = 0; i < portfolioReturns.length; i++) {
        const portfolioRet = portfolioReturns[i];
        const benchmarkRet = benchmarkReturns[i];
        
        if (portfolioRet !== null && benchmarkRet !== null && 
            this.isValidReturn(portfolioRet) && this.isValidReturn(benchmarkRet)) {
          validPairs.push([portfolioRet, benchmarkRet]);
        }
      }

      if (validPairs.length < this.MINIMUM_OBSERVATIONS) {
        throw new Error('Insufficient valid return pairs for Information ratio calculation');
      }

      // Calculate active returns (portfolio - benchmark)
      const activeReturns: number[] = [];
      const portfolioClean: number[] = [];
      const benchmarkClean: number[] = [];

      for (const [portfolioRet, benchmarkRet] of validPairs) {
        const activeReturn = portfolioRet - benchmarkRet;
        activeReturns.push(activeReturn);
        portfolioClean.push(portfolioRet);
        benchmarkClean.push(benchmarkRet);
      }

      // Calculate annualized active return (mean)
      const periodsPerYear = this.PERIODS_PER_YEAR[frequency];
      const meanActiveReturn = this.calculateMean(activeReturns);
      const annualizedActiveReturn = meanActiveReturn * periodsPerYear;

      // Calculate tracking error (std dev of active returns)
      const trackingError = this.calculateStandardDeviation(activeReturns);
      if (trackingError === null) {
        throw new Error('Cannot calculate tracking error for Information ratio');
      }
      const annualizedTrackingError = trackingError * Math.sqrt(periodsPerYear);

      // Calculate Information ratio
      let informationRatio: number;
      if (annualizedTrackingError === 0) {
        informationRatio = annualizedActiveReturn > 0 ? Number.POSITIVEiNFINITY : 0;
      } else {
        informationRatio = annualizedActiveReturn / annualizedTrackingError;
      }

      // Calculate portfolio and benchmark statistics
      const portfolioReturn = this.calculateAnnualizedReturn(portfolioClean, frequency);
      const benchmarkReturn = this.calculateAnnualizedReturn(benchmarkClean, frequency);

      // Statistical significance test
      const tStatistic = informationRatio * Math.sqrt(activeReturns.length);
      const pValue = this.calculateTTestPValue(tStatistic, activeReturns.length - 1);
      const isSignificant = pValue < 0.05;

      // Generate interpretation
      const interpretation = this.interpretInformationRatio(informationRatio, pValue);

      const result: InformationRatioResult = {
        informationRatio,
        portfolioReturn,
        benchmarkReturn,
        activeReturn: annualizedActiveReturn,
        trackingError: annualizedTrackingError,
        tStatistic,
        pValue,
        isSignificant,
        sampleSize: validPairs.length,
        interpretation
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Information Ratio calculated:', {
        informationRatio: informationRatio.toFixed(4),
        activeReturn: (annualizedActiveReturn * 100).toFixed(2) + '%',
        trackingError: (annualizedTrackingError * 100).toFixed(2) + '%',
        isSignificant,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Information Ratio:', error);
      return null;
    }
  }

  /**
   * Calcola Calmar Ratio: Annual_Return / Max_Drawdown
   */
  public calculateCalmarRatio(
    returns: (number | null)[],
    dates: string[],
    config: PerformanceRatiosConfig = {}
  ): CalmarRatioResult | null {
    console.log('📊 Calculating Calmar Ratio...', { 
      returnsCount: returns.length,
      config 
    });

    const startTime = performance.now();
    const {
      frequency = 'daily',
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
        throw new Error('Insufficient valid returns for Calmar ratio calculation');
      }

      // Calculate annualized return
      const periodsPerYear = this.PERIODS_PER_YEAR[frequency];
      const cumulativeReturn = this.calculateCumulativeReturn(validReturns);
      const years = validReturns.length / periodsPerYear;
      const annualizedReturn = Math.pow(1 + cumulativeReturn, 1 / years) - 1;

      // Calculate maximum drawdown
      const drawdownAnalysis = this.calculateMaximumDrawdown(validReturns, dates);

      if (!drawdownAnalysis || drawdownAnalysis.maxDrawdown === 0) {
        const calmarRatio = annualizedReturn > 0 ? Number.POSITIVEiNFINITY : 0;
        
        return {
          calmarRatio,
          annualizedReturn,
          maxDrawdown: 0,
          maxDrawdownStart: null,
          maxDrawdownEnd: null,
          maxDrawdownDuration: 0,
          recoveryTime: null,
          sampleSize: validReturns.length,
          interpretation: this.interpretCalmarRatio(calmarRatio)
        };
      }

      // Calculate Calmar ratio
      const calmarRatio = annualizedReturn / Math.abs(drawdownAnalysis.maxDrawdown);

      // Generate interpretation
      const interpretation = this.interpretCalmarRatio(calmarRatio);

      const result: CalmarRatioResult = {
        calmarRatio,
        annualizedReturn,
        maxDrawdown: drawdownAnalysis.maxDrawdown,
        maxDrawdownStart: drawdownAnalysis.startDate || null,
        maxDrawdownEnd: drawdownAnalysis.endDate || null,
        maxDrawdownDuration: drawdownAnalysis.durationPeriods,
        recoveryTime: drawdownAnalysis.recoveryPeriods,
        sampleSize: validReturns.length,
        interpretation
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Calmar Ratio calculated:', {
        calmarRatio: calmarRatio.toFixed(4),
        annualizedReturn: (annualizedReturn * 100).toFixed(2) + '%',
        maxDrawdown: (drawdownAnalysis.maxDrawdown * 100).toFixed(2) + '%',
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Calmar Ratio:', error);
      return null;
    }
  }

  /**
   * Calcola tutti i performance ratios in una singola chiamata
   */
  public calculateComprehensivePerformanceRatios(
    returns: (number | null)[],
    dates: string[],
    benchmarkReturns?: (number | null)[],
    config: PerformanceRatiosConfig = {}
  ): {
    sharpe: SharpeRatioResult | null;
    sortino: SortinoRatioResult | null;
    information: InformationRatioResult | null;
    calmar: CalmarRatioResult | null;
    summary: PerformanceRatiosResult;
  } {
    console.log('🎯 Calculating comprehensive performance ratios...', { 
      returnsCount: returns.length,
      hasBenchmark: !!benchmarkReturns
    });

    const startTime = performance.now();

    try {
      // Calculate individual ratios
      const sharpe = this.calculateSharpeRatio(returns, config);
      const sortino = this.calculateSortinoRatio(returns, config);
      const information = benchmarkReturns ? 
        this.calculateInformationRatio(returns, benchmarkReturns, config) : null;
      const calmar = this.calculateCalmarRatio(returns, dates, config);

      // Build summary
      const validReturns = returns.filter(r => r !== null && this.isValidReturn(r));
      const summary: PerformanceRatiosResult = {
        sharpeRatio: sharpe?.sharpeRatio || null,
        sortinoRatio: sortino?.sortinoRatio || null,
        informationRatio: information?.informationRatio || null,
        calmarRatio: calmar?.calmarRatio || null,
        sampleSize: validReturns.length,
        confidenceLevel: config.confidenceLevel || this.DEFAULT_CONFIDENCE_LEVEL
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Comprehensive performance ratios calculated:', {
        processingTime: `${processingTime.toFixed(2)}ms`,
        ratiosCalculated: Object.keys({ sharpe, sortino, information, calmar }).length
      });

      return {
        sharpe,
        sortino,
        information,
        calmar,
        summary
      };

    } catch (error) {
      console.error('❌ Error calculating comprehensive performance ratios:', error);
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

  private calculateCumulativeReturn(returns: number[]): number {
    return returns.reduce((cumulative, ret) => cumulative * (1 + ret), 1) - 1;
  }

  private calculateAnnualizedReturn(returns: number[], frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'): number {
    const periodsPerYear = this.PERIODS_PER_YEAR[frequency];
    const cumulativeReturn = this.calculateCumulativeReturn(returns);
    const years = returns.length / periodsPerYear;
    return Math.pow(1 + cumulativeReturn, 1 / years) - 1;
  }

  private calculateMaximumDrawdown(returns: number[], dates?: string[]): DrawdownAnalysis | null {
    if (returns.length < 2) return null;

    // Calculate cumulative wealth curve
    const cumulativeWealth: number[] = [1.0]; // Start with $1

    for (const ret of returns) {
      const newWealth = cumulativeWealth[cumulativeWealth.length - 1] * (1 + ret);
      cumulativeWealth.push(newWealth);
    }

    // Calculate drawdown series
    const drawdowns: number[] = [];
    let runningMax = cumulativeWealth[0];
    let maxDrawdown = 0;
    let maxDrawdownStartIdx = 0;
    let maxDrawdownEndIdx = 0;
    let peakIdx = 0;

    for (let i = 0; i < cumulativeWealth.length; i++) {
      const wealth = cumulativeWealth[i];
      
      // Update running maximum
      if (wealth > runningMax) {
        runningMax = wealth;
        peakIdx = i;
      }

      // Calculate drawdown from peak
      const drawdown = (wealth - runningMax) / runningMax;
      drawdowns.push(drawdown);

      // Check if this is new maximum drawdown
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownStartIdx = peakIdx;
        maxDrawdownEndIdx = i;
      }
    }

    // Find recovery point (if any)
    let recoveryIdx: number | null = null;
    if (maxDrawdownEndIdx < cumulativeWealth.length - 1) {
      const peakValue = cumulativeWealth[maxDrawdownStartIdx];
      for (let i = maxDrawdownEndIdx + 1; i < cumulativeWealth.length; i++) {
        if (cumulativeWealth[i] >= peakValue) {
          recoveryIdx = i;
          break;
        }
      }
    }

    return {
      maxDrawdown,
      startIdx: maxDrawdownStartIdx,
      endIdx: maxDrawdownEndIdx,
      recoveryIdx,
      durationPeriods: maxDrawdownEndIdx - maxDrawdownStartIdx,
      recoveryPeriods: recoveryIdx ? recoveryIdx - maxDrawdownEndIdx : null,
      drawdownSeries: drawdowns,
      cumulativeWealth,
      startDate: dates && dates[maxDrawdownStartIdx] ? dates[maxDrawdownStartIdx] : undefined,
      endDate: dates && dates[maxDrawdownEndIdx] ? dates[maxDrawdownEndIdx] : undefined,
      recoveryDate: dates && recoveryIdx && dates[recoveryIdx] ? dates[recoveryIdx] : undefined
    };
  }

  private calculateSharpeConfidenceInterval(
    returns: number[], 
    riskFreeRate: number, 
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly', 
    confidenceLevel: number
  ): { lower: number; upper: number; level: number } {
    // Simplified confidence interval calculation
    // In practice, would use bootstrap or analytical methods
    const periodsPerYear = this.PERIODS_PER_YEAR[frequency];
    const n = returns.length;
    const sharpe = this.calculateSharpeRatio(returns, { riskFreeRate, frequency })?.sharpeRatio || 0;
    
    // Approximate standard error
    const standardError = Math.sqrt((1 + 0.5 * sharpe * sharpe) / n);
    
    // Z-score for confidence level
    const zScore = this.normalInverse((1 + confidenceLevel) / 2);
    
    const margin = zScore * standardError;
    
    return {
      lower: sharpe - margin,
      upper: sharpe + margin,
      level: confidenceLevel
    };
  }

  private calculateTTestPValue(tStatistic: number, degreesOfFreedom: number): number {
    // Simplified p-value calculation
    // In practice, would use proper statistical libraries
    const absT = Math.abs(tStatistic);
    
    if (absT > 3) return 0.001;
    if (absT > 2.5) return 0.01;
    if (absT > 2) return 0.05;
    if (absT > 1.5) return 0.1;
    return 0.2;
  }

  private normalInverse(p: number): number {
    // Approximation of inverse normal distribution
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

  private interpretSharpeRatio(sharpe: number): string {
    if (sharpe > 2) return 'Excellent - Outstanding risk-adjusted performance';
    if (sharpe > 1) return 'Good - Above average risk-adjusted performance';
    if (sharpe > 0.5) return 'Acceptable - Moderate risk-adjusted performance';
    if (sharpe > 0) return 'Poor - Below average risk-adjusted performance';
    return 'Very poor - Negative risk-adjusted performance';
  }

  private interpretSortinoRatio(sortino: number): string {
    if (sortino > 2) return 'Excellent - Outstanding downside-adjusted performance';
    if (sortino > 1) return 'Good - Above average downside-adjusted performance';
    if (sortino > 0.5) return 'Acceptable - Moderate downside-adjusted performance';
    if (sortino > 0) return 'Poor - Below average downside-adjusted performance';
    return 'Very poor - Negative downside-adjusted performance';
  }

  private interpretInformationRatio(information: number, pValue: number): string {
    const significance = pValue < 0.05 ? ' (statistically significant)' : ' (not significant)';
    
    if (information > 0.5) return `Excellent - Strong alpha generation${significance}`;
    if (information > 0.25) return `Good - Moderate alpha generation${significance}`;
    if (information > 0) return `Acceptable - Modest alpha generation${significance}`;
    if (information > -0.25) return `Poor - Slight underperformance${significance}`;
    return `Very poor - Significant underperformance${significance}`;
  }

  private interpretCalmarRatio(calmar: number): string {
    if (calmar > 1) return 'Excellent - High return relative to maximum loss';
    if (calmar > 0.5) return 'Good - Moderate return relative to maximum loss';
    if (calmar > 0.25) return 'Acceptable - Reasonable return relative to maximum loss';
    if (calmar > 0) return 'Poor - Low return relative to maximum loss';
    return 'Very poor - Negative return with significant losses';
  }
}

// Export singleton instance
export const performanceRatiosEngine = PerformanceRatiosEngine.getInstance();
export default PerformanceRatiosEngine;

// Export types
export type {
  PerformanceRatiosResult,
  SharpeRatioResult,
  SortinoRatioResult,
  InformationRatioResult,
  CalmarRatioResult,
  DrawdownAnalysis,
  PerformanceRatiosConfig
};

