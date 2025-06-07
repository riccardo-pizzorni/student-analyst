/**
 * RiskMeasuresAdvancedEngine - Motore di Calcolo Misure di Rischio Avanzate
 * 
 * Questo motore implementa le misure di rischio più sofisticate utilizzate
 * nell'analisi finanziaria istituzionale per quantificare tail risk e risk exposure.
 * 
 * Features:
 * - Value at Risk (VaR) Historical e Parametric (95%, 99% confidence)
 * - Conditional VaR (Expected Shortfall) per tail risk
 * - Maximum Drawdown analysis avanzato
 * - Beta calculation vs market benchmark
 * - Statistical validation e backtesting
 */

interface VaRResult {
  var: number;
  confidenceLevel: number;
  method: 'Historical' | 'Parametric';
  sampleSize: number;
  interpretation: string;
  // Historical specific
  percentileUsed?: number;
  // Parametric specific
  meanReturn?: number;
  volatility?: number;
  zScore?: number;
  normalityTest?: {
    statistic: number;
    pValue: number;
    isNormal: boolean;
  };
  warning?: string;
}

interface ConditionalVaRResult {
  conditionalVar: number;
  var: number;
  confidenceLevel: number;
  tailFrequency: number;
  tailEvents: number;
  tailRiskRatio: number;
  method: string;
  interpretation: string;
}

interface MaximumDrawdownResult {
  maxDrawdown: number;
  maxDrawdownStart: string | null;
  maxDrawdownEnd: string | null;
  maxDrawdownDuration: number;
  recoveryTime: number | null;
  drawdownPeriods: DrawdownPeriod[];
  totalDrawdownPeriods: number;
  avgDrawdown: number;
  avgDuration: number;
  timeInDrawdown: number;
  interpretation: string;
}

interface DrawdownPeriod {
  startIdx: number;
  endIdx: number;
  peakValue: number;
  troughValue: number;
  drawdown: number;
  duration: number;
  peakDate?: string;
  troughDate?: string;
  recoveryDate?: string;
  ongoing: boolean;
}

interface BetaResult {
  beta: number;
  alpha: number;
  correlation: number;
  rSquared: number;
  trackingError: number;
  tStatisticBeta: number;
  tStatisticAlpha: number;
  pValueBeta: number;
  pValueAlpha: number;
  sampleSize: number;
  interpretation: string;
}

interface RiskMeasuresAdvancedConfig {
  confidenceLevel?: number; // Default: 0.95
  varMethod?: 'Historical' | 'Parametric' | 'Both'; // Default: 'Both'
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly'; // Data frequency
  validateInput?: boolean; // Perform input validation
  includeInterpretation?: boolean; // Include textual interpretations
}

interface ComprehensiveRiskResult {
  var95: VaRResult | null;
  var99: VaRResult | null;
  cvar95: ConditionalVaRResult | null;
  cvar99: ConditionalVaRResult | null;
  maxDrawdown: MaximumDrawdownResult | null;
  beta: BetaResult | null;
  summary: {
    riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
    dominantRisk: string;
    recommendations: string[];
  };
}

type FrequencyPeriods = {
  daily: 252;
  weekly: 52;
  monthly: 12;
  quarterly: 4;
};

class RiskMeasuresAdvancedEngine {
  private static instance: RiskMeasuresAdvancedEngine;
  private readonly DEFAULT_CONFIDENCE_LEVEL = 0.95;
  private readonly MINIMUM_OBSERVATIONS = 30;
  private readonly PERIODS_PER_YEAR: FrequencyPeriods = {
    daily: 252,
    weekly: 52,
    monthly: 12,
    quarterly: 4
  };

  constructor() {}

  public static getInstance(): RiskMeasuresAdvancedEngine {
    if (!RiskMeasuresAdvancedEngine.instance) {
      RiskMeasuresAdvancedEngine.instance = new RiskMeasuresAdvancedEngine();
    }
    return RiskMeasuresAdvancedEngine.instance;
  }

  /**
   * Calcola Value at Risk usando metodo Historical
   */
  public calculateHistoricalVaR(
    returns: (number | null)[],
    confidenceLevel: number = 0.95
  ): VaRResult | null {
    console.log('📊 Calculating Historical VaR...', { 
      returnsCount: returns.length, 
      confidenceLevel 
    });

    const startTime = performance.now();

    try {
      // Validate input
      const validReturns = returns.filter(r => r !== null && this.isValidReturn(r)) as number[];
      
      if (validReturns.length < this.MINIMUM_OBSERVATIONS) {
        throw new Error(`Insufficient data: need at least ${this.MINIMUM_OBSERVATIONS} returns for reliable VaR`);
      }

      // Sort returns in ascending order (worst to best)
      const sortedReturns = [...validReturns].sort((a, b) => a - b);

      // Calculate percentile for VaR
      const alpha = 1 - confidenceLevel; // e.g., 0.05 for 95% confidence
      
      // Use linear interpolation for percentile
      const position = alpha * (sortedReturns.length - 1);
      const lowerIndex = Math.floor(position);
      const upperIndex = Math.ceil(position);
      const weight = position - lowerIndex;

      let varPercentile: number;
      if (lowerIndex === upperIndex) {
        varPercentile = sortedReturns[lowerIndex];
      } else {
        varPercentile = (1 - weight) * sortedReturns[lowerIndex] + 
                       weight * sortedReturns[upperIndex];
      }

      // VaR is typically reported as positive number (loss)
      const historicalVar = -varPercentile;

      const result: VaRResult = {
        var: historicalVar,
        confidenceLevel,
        method: 'Historical',
        sampleSize: validReturns.length,
        percentileUsed: varPercentile,
        interpretation: this.interpretVaR(historicalVar, confidenceLevel)
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Historical VaR calculated:', {
        var: (historicalVar * 100).toFixed(2) + '%',
        confidenceLevel: (confidenceLevel * 100).toFixed(0) + '%',
        sampleSize: validReturns.length,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Historical VaR:', error);
      return null;
    }
  }

  /**
   * Calcola Value at Risk usando metodo Parametric (assume normalità)
   */
  public calculateParametricVaR(
    returns: (number | null)[],
    confidenceLevel: number = 0.95
  ): VaRResult | null {
    console.log('📊 Calculating Parametric VaR...', { 
      returnsCount: returns.length, 
      confidenceLevel 
    });

    const startTime = performance.now();

    try {
      // Validate input
      const validReturns = returns.filter(r => r !== null && this.isValidReturn(r)) as number[];
      
      if (validReturns.length < this.MINIMUM_OBSERVATIONS) {
        throw new Error(`Insufficient data: need at least ${this.MINIMUM_OBSERVATIONS} returns for reliable VaR`);
      }

      // Calculate mean and standard deviation
      const meanReturn = this.calculateMean(validReturns);
      const stdReturn = this.calculateStandardDeviation(validReturns);

      if (stdReturn === null || stdReturn === 0) {
        throw new Error('Cannot calculate VaR: zero volatility');
      }

      // Get Z-score for confidence level
      const alpha = 1 - confidenceLevel;
      const zScore = this.inverseNormalCDF(alpha); // e.g., -1.645 for 95%

      // Calculate parametric VaR
      // VaR = -(μ + σ * Z_α)
      const parametricVar = -(meanReturn + stdReturn * zScore);

      // Jarque-Bera test for normality assumption
      const normalityTest = this.jarqueBeraTest(validReturns);

      const result: VaRResult = {
        var: parametricVar,
        confidenceLevel,
        method: 'Parametric',
        sampleSize: validReturns.length,
        meanReturn,
        volatility: stdReturn,
        zScore,
        normalityTest,
        interpretation: this.interpretVaR(parametricVar, confidenceLevel),
        warning: this.getNormalityWarning(normalityTest.isNormal)
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Parametric VaR calculated:', {
        var: (parametricVar * 100).toFixed(2) + '%',
        confidenceLevel: (confidenceLevel * 100).toFixed(0) + '%',
        normalityValid: normalityTest.isNormal,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Parametric VaR:', error);
      return null;
    }
  }

  /**
   * Calcola Conditional VaR (Expected Shortfall)
   */
  public calculateConditionalVaR(
    returns: (number | null)[],
    confidenceLevel: number = 0.95
  ): ConditionalVaRResult | null {
    console.log('📊 Calculating Conditional VaR...', { 
      returnsCount: returns.length, 
      confidenceLevel 
    });

    const startTime = performance.now();

    try {
      // First calculate VaR
      const varResult = this.calculateHistoricalVaR(returns, confidenceLevel);
      
      if (!varResult || !varResult.percentileUsed) {
        throw new Error('Cannot calculate CVaR: VaR calculation failed');
      }

      const varThreshold = varResult.percentileUsed; // This is in return space (negative for losses)
      
      // Find all returns worse than VaR threshold
      const validReturns = returns.filter(r => r !== null && this.isValidReturn(r)) as number[];
      const tailReturns = validReturns.filter(ret => ret < varThreshold);

      let conditionalVar: number;
      let tailFrequency: number;

      if (tailReturns.length === 0) {
        // No tail events, CVaR equals VaR
        conditionalVar = varResult.var;
        tailFrequency = 0;
      } else {
        // Calculate mean of tail returns
        const meanTailLoss = this.calculateMean(tailReturns);
        conditionalVar = -meanTailLoss; // Convert to positive loss
        tailFrequency = tailReturns.length / validReturns.length;
      }

      // Calculate tail risk ratio
      const tailRiskRatio = varResult.var > 0 ? conditionalVar / varResult.var : 1;

      const result: ConditionalVaRResult = {
        conditionalVar,
        var: varResult.var,
        confidenceLevel,
        tailFrequency,
        tailEvents: tailReturns.length,
        tailRiskRatio,
        method: 'Historical',
        interpretation: this.interpretCVaR(conditionalVar, varResult.var, confidenceLevel)
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Conditional VaR calculated:', {
        cvar: (conditionalVar * 100).toFixed(2) + '%',
        var: (varResult.var * 100).toFixed(2) + '%',
        tailRiskRatio: tailRiskRatio.toFixed(2),
        tailEvents: tailReturns.length,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Conditional VaR:', error);
      return null;
    }
  }

  /**
   * Calcola Maximum Drawdown avanzato con analisi completa
   */
  public calculateAdvancedMaxDrawdown(
    returns: (number | null)[],
    dates: string[]
  ): MaximumDrawdownResult | null {
    console.log('📊 Calculating Advanced Maximum Drawdown...', { 
      returnsCount: returns.length 
    });

    const startTime = performance.now();

    try {
      const validReturns = returns.filter(r => r !== null && this.isValidReturn(r)) as number[];
      
      if (validReturns.length < 2) {
        throw new Error('Insufficient data for drawdown calculation');
      }

      // Calculate cumulative wealth curve
      const cumulativeWealth: number[] = [1.0];
      for (const returnValue of validReturns) {
        const newWealth = cumulativeWealth[cumulativeWealth.length - 1] * (1 + returnValue);
        cumulativeWealth.push(newWealth);
      }

      // Track all drawdown periods
      const drawdownPeriods: DrawdownPeriod[] = [];
      let currentDrawdown: Partial<DrawdownPeriod> | null = null;
      let runningMax = cumulativeWealth[0];
      let runningMaxIdx = 0;

      for (let i = 0; i < cumulativeWealth.length; i++) {
        const wealth = cumulativeWealth[i];

        // Update running maximum
        if (wealth > runningMax) {
          // End current drawdown if any
          if (currentDrawdown !== null) {
            const endIdx = i - 1;
            const troughValue = Math.min(...cumulativeWealth.slice(currentDrawdown.startIdx!, i));
            const troughIdx = cumulativeWealth.indexOf(troughValue);
            
            const completedDrawdown: DrawdownPeriod = {
              ...currentDrawdown as Required<DrawdownPeriod>,
              endIdx,
              troughValue,
              drawdown: (troughValue - currentDrawdown.peakValue!) / currentDrawdown.peakValue!,
              duration: endIdx - currentDrawdown.startIdx!,
              troughDate: dates && dates[troughIdx] ? dates[troughIdx] : undefined,
              recoveryDate: dates && dates[i] ? dates[i] : undefined,
              ongoing: false
            };
            
            drawdownPeriods.push(completedDrawdown);
            currentDrawdown = null;
          }

          runningMax = wealth;
          runningMaxIdx = i;
        } else if (wealth < runningMax) {
          // Start new drawdown if not already in one
          if (currentDrawdown === null) {
            currentDrawdown = {
              startIdx: runningMaxIdx,
              peakValue: runningMax,
              peakDate: dates && dates[runningMaxIdx] ? dates[runningMaxIdx] : undefined
            };
          }
        }
      }

      // Handle ongoing drawdown at end
      if (currentDrawdown !== null) {
        const endIdx = cumulativeWealth.length - 1;
        const troughValue = Math.min(...cumulativeWealth.slice(currentDrawdown.startIdx!));
        
        const ongoingDrawdown: DrawdownPeriod = {
          ...currentDrawdown as Required<DrawdownPeriod>,
          endIdx,
          troughValue,
          drawdown: (troughValue - currentDrawdown.peakValue!) / currentDrawdown.peakValue!,
          duration: endIdx - currentDrawdown.startIdx!,
          ongoing: true
        };
        
        drawdownPeriods.push(ongoingDrawdown);
      }

      // Calculate statistics
      if (drawdownPeriods.length === 0) {
        return {
          maxDrawdown: 0,
          maxDrawdownStart: null,
          maxDrawdownEnd: null,
          maxDrawdownDuration: 0,
          recoveryTime: null,
          drawdownPeriods: [],
          totalDrawdownPeriods: 0,
          avgDrawdown: 0,
          avgDuration: 0,
          timeInDrawdown: 0,
          interpretation: 'No drawdown periods detected - excellent performance consistency'
        };
      }

      const maxDrawdownPeriod = drawdownPeriods.reduce((min, current) => 
        current.drawdown < min.drawdown ? current : min
      );

      const avgDrawdown = this.calculateMean(drawdownPeriods.map(dd => dd.drawdown));
      const avgDuration = this.calculateMean(drawdownPeriods.map(dd => dd.duration));
      const totalDrawdownTime = drawdownPeriods.reduce((sum, dd) => sum + dd.duration, 0);
      const timeInDrawdown = totalDrawdownTime / cumulativeWealth.length;

      const result: MaximumDrawdownResult = {
        maxDrawdown: maxDrawdownPeriod.drawdown,
        maxDrawdownStart: maxDrawdownPeriod.peakDate || null,
        maxDrawdownEnd: maxDrawdownPeriod.troughDate || null,
        maxDrawdownDuration: maxDrawdownPeriod.duration,
        recoveryTime: maxDrawdownPeriod.ongoing ? null : 
          (maxDrawdownPeriod.recoveryDate ? maxDrawdownPeriod.duration : null),
        drawdownPeriods,
        totalDrawdownPeriods: drawdownPeriods.length,
        avgDrawdown,
        avgDuration,
        timeInDrawdown,
        interpretation: this.interpretDrawdown(maxDrawdownPeriod.drawdown, avgDuration)
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Advanced Maximum Drawdown calculated:', {
        maxDrawdown: (maxDrawdownPeriod.drawdown * 100).toFixed(2) + '%',
        duration: maxDrawdownPeriod.duration + ' periods',
        totalPeriods: drawdownPeriods.length,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Advanced Maximum Drawdown:', error);
      return null;
    }
  }

  /**
   * Calcola Beta vs market benchmark
   */
  public calculateBeta(
    assetReturns: (number | null)[],
    marketReturns: (number | null)[],
    config: { frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' } = {}
  ): BetaResult | null {
    console.log('📊 Calculating Beta vs Market...', { 
      assetCount: assetReturns.length,
      marketCount: marketReturns.length
    });

    const startTime = performance.now();
    const { frequency = 'daily' } = config;

    try {
      // Validate inputs
      if (assetReturns.length !== marketReturns.length) {
        throw new Error('Asset and market returns must have same length');
      }

      // Filter valid pairs
      const validPairs: Array<[number, number]> = [];
      for (let i = 0; i < assetReturns.length; i++) {
        const assetRet = assetReturns[i];
        const marketRet = marketReturns[i];
        
        if (assetRet !== null && marketRet !== null && 
            this.isValidReturn(assetRet) && this.isValidReturn(marketRet)) {
          validPairs.push([assetRet, marketRet]);
        }
      }

      if (validPairs.length < this.MINIMUM_OBSERVATIONS) {
        throw new Error(`Insufficient valid data: need at least ${this.MINIMUM_OBSERVATIONS} paired returns`);
      }

      // Extract clean arrays
      const assetClean = validPairs.map(pair => pair[0]);
      const marketClean = validPairs.map(pair => pair[1]);

      // Calculate covariance and variance
      const covariance = this.calculateCovariance(assetClean, marketClean);
      const marketVariance = this.calculateVariance(marketClean);

      if (marketVariance === 0) {
        throw new Error('Market has no variance - cannot calculate beta');
      }

      // Calculate beta
      const beta = covariance / marketVariance;

      // Calculate correlation and R-squared
      const correlation = this.calculateCorrelation(assetClean, marketClean);
      const rSquared = correlation * correlation;

      // Calculate alpha (intercept)
      const assetMean = this.calculateMean(assetClean);
      const marketMean = this.calculateMean(marketClean);
      const alpha = assetMean - beta * marketMean;

      // Annualize alpha based on frequency
      const periodsPerYear = this.PERIODS_PER_YEAR[frequency];
      const annualizedAlpha = alpha * periodsPerYear;

      // Calculate tracking error (residual volatility)
      const residuals: number[] = [];
      for (let i = 0; i < assetClean.length; i++) {
        const predictedReturn = alpha + beta * marketClean[i];
        const residual = assetClean[i] - predictedReturn;
        residuals.push(residual);
      }

      const trackingError = this.calculateStandardDeviation(residuals);
      if (trackingError === null) {
        throw new Error('Cannot calculate tracking error');
      }
      const annualizedTrackingError = trackingError * Math.sqrt(periodsPerYear);

      // Statistical significance tests
      const standardErrorBeta = trackingError / Math.sqrt(marketVariance * (validPairs.length - 2));
      const tStatisticBeta = beta / standardErrorBeta;
      const tStatisticAlpha = alpha / (trackingError / Math.sqrt(validPairs.length - 2));

      const pValueBeta = this.calculateTTestPValue(tStatisticBeta, validPairs.length - 2);
      const pValueAlpha = this.calculateTTestPValue(tStatisticAlpha, validPairs.length - 2);

      const result: BetaResult = {
        beta,
        alpha: annualizedAlpha,
        correlation,
        rSquared,
        trackingError: annualizedTrackingError,
        tStatisticBeta,
        tStatisticAlpha,
        pValueBeta,
        pValueAlpha,
        sampleSize: validPairs.length,
        interpretation: this.interpretBeta(beta, rSquared, pValueBeta)
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Beta calculated:', {
        beta: beta.toFixed(3),
        alpha: (annualizedAlpha * 100).toFixed(2) + '%',
        rSquared: (rSquared * 100).toFixed(1) + '%',
        significant: pValueBeta < 0.05,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Beta:', error);
      return null;
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

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = this.calculateMean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  }

  private calculateCovariance(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;
    
    const meanX = this.calculateMean(x);
    const meanY = this.calculateMean(y);
    
    let covariance = 0;
    for (let i = 0; i < x.length; i++) {
      covariance += (x[i] - meanX) * (y[i] - meanY);
    }
    
    return covariance / (x.length - 1);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const covariance = this.calculateCovariance(x, y);
    const stdX = this.calculateStandardDeviation(x);
    const stdY = this.calculateStandardDeviation(y);
    
    if (!stdX || !stdY || stdX === 0 || stdY === 0) return 0;
    
    return covariance / (stdX * stdY);
  }

  private inverseNormalCDF(p: number): number {
    // Approximation of inverse normal distribution
    if (p < 0.5) {
      return -this.inverseNormalCDF(1 - p);
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

  private jarqueBeraTest(returns: number[]): { statistic: number; pValue: number; isNormal: boolean } {
    // Simplified Jarque-Bera test for normality
    if (returns.length < 8) {
      return { statistic: 0, pValue: 1, isNormal: false };
    }

    const n = returns.length;
    const mean = this.calculateMean(returns);
    const std = this.calculateStandardDeviation(returns);
    
    if (!std || std === 0) {
      return { statistic: 0, pValue: 1, isNormal: false };
    }

    // Calculate skewness and kurtosis
    let skewness = 0;
    let kurtosis = 0;
    
    for (const ret of returns) {
      const standardized = (ret - mean) / std;
      skewness += Math.pow(standardized, 3);
      kurtosis += Math.pow(standardized, 4);
    }
    
    skewness = skewness / n;
    kurtosis = kurtosis / n - 3; // Excess kurtosis
    
    // Jarque-Bera statistic
    const jbStatistic = (n / 6) * (skewness * skewness + (kurtosis * kurtosis) / 4);
    
    // Approximation for p-value (chi-square with 2 df)
    const pValue = jbStatistic > 5.99 ? 0.01 : (jbStatistic > 4.61 ? 0.05 : 0.1);
    
    return {
      statistic: jbStatistic,
      pValue,
      isNormal: pValue > 0.05
    };
  }

  private calculateTTestPValue(tStatistic: number, _degreesOfFreedom: number): number {
    // Simplified p-value calculation
    const absT = Math.abs(tStatistic);
    
    if (absT > 3) return 0.001;
    if (absT > 2.5) return 0.01;
    if (absT > 2) return 0.05;
    if (absT > 1.5) return 0.1;
    return 0.2;
  }

  private interpretVaR(var95: number, confidenceLevel: number): string {
    const percentage = (var95 * 100).toFixed(1);
    const confidence = (confidenceLevel * 100).toFixed(0);
    
    if (var95 < 0.01) return `Very Low Risk - Maximum loss ${percentage}% (${confidence}% confidence)`;
    if (var95 < 0.03) return `Low Risk - Maximum loss ${percentage}% (${confidence}% confidence)`;
    if (var95 < 0.05) return `Moderate Risk - Maximum loss ${percentage}% (${confidence}% confidence)`;
    if (var95 < 0.10) return `High Risk - Maximum loss ${percentage}% (${confidence}% confidence)`;
    return `Very High Risk - Maximum loss ${percentage}% (${confidence}% confidence)`;
  }

  private interpretCVaR(cvar: number, var95: number, confidenceLevel: number): string {
    const cvarPercent = (cvar * 100).toFixed(1);
    const ratio = (cvar / var95).toFixed(1);
    
    return `Expected loss in worst ${100 - confidenceLevel * 100}% scenarios: ${cvarPercent}% (${ratio}x VaR)`;
  }

  private interpretDrawdown(maxDrawdown: number, _avgDuration: number): string {
    const percentage = (Math.abs(maxDrawdown) * 100).toFixed(1);
    
    if (Math.abs(maxDrawdown) < 0.05) return `Excellent stability - Maximum decline ${percentage}%`;
    if (Math.abs(maxDrawdown) < 0.10) return `Good stability - Maximum decline ${percentage}%`;
    if (Math.abs(maxDrawdown) < 0.20) return `Moderate volatility - Maximum decline ${percentage}%`;
    if (Math.abs(maxDrawdown) < 0.30) return `High volatility - Maximum decline ${percentage}%`;
    return `Very high volatility - Maximum decline ${percentage}%`;
  }

  private interpretBeta(beta: number, _rSquared: number, pValue: number): string {
    const significance = pValue < 0.05 ? ' (statistically significant)' : ' (not significant)';
    
    if (beta < 0.5) return `Defensive asset - Low market sensitivity (β=${beta.toFixed(2)})${significance}`;
    if (beta < 0.8) return `Moderately defensive - Below market volatility (β=${beta.toFixed(2)})${significance}`;
    if (beta < 1.2) return `Market-like - Similar to market volatility (β=${beta.toFixed(2)})${significance}`;
    if (beta < 1.5) return `Aggressive - Above market volatility (β=${beta.toFixed(2)})${significance}`;
    return `Very aggressive - High market sensitivity (β=${beta.toFixed(2)})${significance}`;
  }

  private getNormalityWarning(isNormal: boolean): string {
    if (!isNormal) {
      return 'Warning: Returns not normally distributed - Parametric VaR may underestimate risk';
    }
    return '';
  }

  /**
   * Calcola analisi completa di rischio avanzato
   */
  public calculateComprehensiveRiskAnalysis(
    returns: (number | null)[],
    dates: string[],
    marketReturns?: (number | null)[],
    config: RiskMeasuresAdvancedConfig = {}
  ): ComprehensiveRiskResult {
    console.log('🎯 Calculating comprehensive advanced risk analysis...', { 
      returnsCount: returns.length,
      hasMarket: !!marketReturns
    });

    const startTime = performance.now();

    try {
      // Calculate VaR at different confidence levels
      const var95 = this.calculateHistoricalVaR(returns, 0.95);
      const var99 = this.calculateHistoricalVaR(returns, 0.99);

      // Calculate Conditional VaR
      const cvar95 = this.calculateConditionalVaR(returns, 0.95);
      const cvar99 = this.calculateConditionalVaR(returns, 0.99);

      // Calculate Maximum Drawdown
      const maxDrawdown = this.calculateAdvancedMaxDrawdown(returns, dates);

      // Calculate Beta if market data provided
      const beta = marketReturns ? 
        this.calculateBeta(returns, marketReturns, { frequency: config.frequency }) : null;

      // Generate summary analysis
      const summary = this.generateRiskSummary({
        var95, var99, cvar95, cvar99, maxDrawdown, beta
      });

      const result: ComprehensiveRiskResult = {
        var95,
        var99,
        cvar95,
        cvar99,
        maxDrawdown,
        beta,
        summary
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Comprehensive risk analysis completed:', {
        processingTime: `${processingTime.toFixed(2)}ms`,
        riskLevel: summary.riskLevel
      });

      return result;

    } catch (error) {
      console.error('❌ Error in comprehensive risk analysis:', error);
      throw error;
    }
  }

  private generateRiskSummary(results: {
    var95: VaRResult | null;
    var99: VaRResult | null;
    cvar95: ConditionalVaRResult | null;
    cvar99: ConditionalVaRResult | null;
    maxDrawdown: MaximumDrawdownResult | null;
    beta: BetaResult | null;
  }): { riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High'; dominantRisk: string; recommendations: string[] } {
    
    const risks: number[] = [];
    if (results.var95) risks.push(results.var95.var);
    if (results.maxDrawdown) risks.push(Math.abs(results.maxDrawdown.maxDrawdown));
    
    const maxRisk = Math.max(...risks);
    
    let riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
    if (maxRisk < 0.03) riskLevel = 'Low';
    else if (maxRisk < 0.05) riskLevel = 'Moderate';
    else if (maxRisk < 0.10) riskLevel = 'High';
    else riskLevel = 'Very High';

    const dominantRisk = results.cvar95 && results.var95 && results.cvar95.tailRiskRatio > 1.5 ? 
      'Tail Risk' : 'Market Risk';

    const recommendations: string[] = [];
    if (riskLevel === 'Very High') recommendations.push('Consider position sizing reduction');
    if (results.beta && Math.abs(results.beta.beta) > 1.3) recommendations.push('High market sensitivity - monitor correlation');
    if (results.maxDrawdown && Math.abs(results.maxDrawdown.maxDrawdown) > 0.15) recommendations.push('Significant drawdown potential - stress test portfolio');

    return { riskLevel, dominantRisk, recommendations };
  }
}

// Export singleton instance
export const riskMeasuresAdvancedEngine = RiskMeasuresAdvancedEngine.getInstance();
export default RiskMeasuresAdvancedEngine;

// Export types
export type {
  VaRResult,
  ConditionalVaRResult,
  MaximumDrawdownResult,
  DrawdownPeriod,
  BetaResult,
  RiskMeasuresAdvancedConfig,
  ComprehensiveRiskResult
};

