/**
 * ReturnsCalculationEngine - Motore di Calcolo Ritorni Finanziari
 * 
 * Questo motore implementa tutti i tipi standard di calcolo ritorni utilizzati
 * nell'analisi finanziaria professionale con massima precisione e performance.
 * 
 * Features:
 * - Simple returns: (P1-P0)/P0
 * - Log returns: ln(P1/P0)  
 * - Cumulative returns calculation
 * - Annualized returns with proper compounding
 * - Batch processing per large datasets
 * - Error handling robusto per real market data
 */

interface PricePoint {
  date: string;
  price: number;
  adjustedPrice?: number; // For dividend/split adjustments
  volume?: number;
}

interface ReturnsResult {
  values: (number | null)[];
  count: number;
  invalidCount: number;
  mean: number | null;
  volatility: number | null;
  min: number | null;
  max: number | null;
  startDate?: string;
  endDate?: string;
}

interface CumulativeReturnsResult extends ReturnsResult {
  totalReturn: number | null;
  finalValue: number;
  drawdownSeries: number[];
  maxDrawdown: number | null;
  maxDrawdownPeriod?: { start: string; end: string };
}

interface AnnualizedReturnsResult {
  annualizedReturn: number | null;
  method: 'compound' | 'arithmetic' | 'geometric';
  periodsPerYear: number;
  totalPeriods: number;
  years: number;
  volatility?: number | null;
}

interface BatchCalculationResult {
  results: Record<string, ReturnsResult | { error: true; message: string; symbol: string }>;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  processingTime: number;
}

interface CalculationConfig {
  period?: number; // Number of periods for calculation (default: 1)
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly'; // Data frequency
  adjustForDividends?: boolean; // Use adjusted prices
  handleMissingData?: 'skip' | 'interpolate' | 'error'; // Missing data strategy
  validateResults?: boolean; // Perform validation checks
  batchSize?: number; // Batch size for large datasets
}

type ReturnType = 'simple' | 'log' | 'cumulative' | 'annualized';

class ReturnsCalculationEngine {
  private static instance: ReturnsCalculationEngine;
  private readonly TRADING_DAYS_PER_YEAR = 252;
  private readonly WEEKS_PER_YEAR = 52;
  private readonly MONTHS_PER_YEAR = 12;
  private readonly QUARTERS_PER_YEAR = 4;

  constructor() {}

  public static getInstance(): ReturnsCalculationEngine {
    if (!ReturnsCalculationEngine.instance) {
      ReturnsCalculationEngine.instance = new ReturnsCalculationEngine();
    }
    return ReturnsCalculationEngine.instance;
  }

  /**
   * Calcola simple returns: (P1-P0)/P0
   */
  public calculateSimpleReturns(
    prices: PricePoint[],
    config: CalculationConfig = {}
  ): ReturnsResult {
    console.log('🧮 Calculating simple returns...', { count: prices.length, config });

    const startTime = performance.now();
    const { period = 1, adjustForDividends = true, validateResults = true } = config;

    try {
      // Validate input
      if (!prices || prices.length < period + 1) {
        throw new Error(`Insufficient data: need at least ${period + 1} price points`);
      }

      // Sort prices by date
      const sortedPrices = [...prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Extract price values
      const priceValues = sortedPrices.map(p => 
        adjustForDividends && p.adjustedPrice ? p.adjustedPrice : p.price
      );

      const returns: (number | null)[] = [];
      let validCount = 0;
      let invalidCount = 0;

      // Calculate simple returns
      for (let i = period; i < priceValues.length; i++) {
        const currentPrice = priceValues[i];
        const previousPrice = priceValues[i - period];

        // Handle invalid prices
        if (!this.isValidPrice(currentPrice) || !this.isValidPrice(previousPrice) || previousPrice <= 0) {
          returns.push(null);
          invalidCount++;
          continue;
        }

        // Simple return formula: (P1 - P0) / P0
        const simpleReturn = (currentPrice - previousPrice) / previousPrice;

        // Validate result
        if (this.isValidReturn(simpleReturn)) {
          returns.push(simpleReturn);
          validCount++;
        } else {
          returns.push(null);
          invalidCount++;
        }
      }

      // Calculate statistics
      const validReturns = returns.filter(r => r !== null) as number[];
      const mean = validReturns.length > 0 ? this.calculateMean(validReturns) : null;
      const volatility = validReturns.length > 1 ? this.calculateStandardDeviation(validReturns) : null;
      const min = validReturns.length > 0 ? Math.min(...validReturns) : null;
      const max = validReturns.length > 0 ? Math.max(...validReturns) : null;

      const result: ReturnsResult = {
        values: returns,
        count: validCount,
        invalidCount,
        mean,
        volatility,
        min,
        max,
        startDate: sortedPrices[period]?.date,
        endDate: sortedPrices[sortedPrices.length - 1]?.date
      };

      // Validate results if requested
      if (validateResults) {
        this.validateResults(result, 'simple');
      }

      const processingTime = performance.now() - startTime;
      console.log('✅ Simple returns calculated:', {
        validReturns: validCount,
        invalidReturns: invalidCount,
        mean: mean?.toFixed(4),
        volatility: volatility?.toFixed(4),
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating simple returns:', error);
      throw error;
    }
  }

  /**
   * Calcola log returns: ln(P1/P0)
   */
  public calculateLogReturns(
    prices: PricePoint[],
    config: CalculationConfig = {}
  ): ReturnsResult {
    console.log('📊 Calculating log returns...', { count: prices.length, config });

    const startTime = performance.now();
    const { period = 1, adjustForDividends = true, validateResults = true } = config;

    try {
      // Validate input
      if (!prices || prices.length < period + 1) {
        throw new Error(`Insufficient data: need at least ${period + 1} price points`);
      }

      // Sort prices by date
      const sortedPrices = [...prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Extract price values
      const priceValues = sortedPrices.map(p => 
        adjustForDividends && p.adjustedPrice ? p.adjustedPrice : p.price
      );

      const logReturns: (number | null)[] = [];
      let validCount = 0;
      let invalidCount = 0;

      // Calculate log returns
      for (let i = period; i < priceValues.length; i++) {
        const currentPrice = priceValues[i];
        const previousPrice = priceValues[i - period];

        // Handle invalid prices
        if (!this.isValidPrice(currentPrice) || !this.isValidPrice(previousPrice) || 
            currentPrice <= 0 || previousPrice <= 0) {
          logReturns.push(null);
          invalidCount++;
          continue;
        }

        try {
          // Log return formula: ln(P1 / P0)
          const logReturn = Math.log(currentPrice / previousPrice);

          // Validate result
          if (this.isValidReturn(logReturn)) {
            logReturns.push(logReturn);
            validCount++;
          } else {
            logReturns.push(null);
            invalidCount++;
          }
        } catch (mathError) {
          logReturns.push(null);
          invalidCount++;
        }
      }

      // Calculate statistics
      const validReturns = logReturns.filter(r => r !== null) as number[];
      const arithmeticMean = validReturns.length > 0 ? this.calculateMean(validReturns) : null;
      const volatility = validReturns.length > 1 ? this.calculateStandardDeviation(validReturns) : null;
      const min = validReturns.length > 0 ? Math.min(...validReturns) : null;
      const max = validReturns.length > 0 ? Math.max(...validReturns) : null;

      const result: ReturnsResult = {
        values: logReturns,
        count: validCount,
        invalidCount,
        mean: arithmeticMean,
        volatility,
        min,
        max,
        startDate: sortedPrices[period]?.date,
        endDate: sortedPrices[sortedPrices.length - 1]?.date
      };

      // Validate results if requested
      if (validateResults) {
        this.validateResults(result, 'log');
      }

      const processingTime = performance.now() - startTime;
      console.log('✅ Log returns calculated:', {
        validReturns: validCount,
        invalidReturns: invalidCount,
        arithmeticMean: arithmeticMean?.toFixed(4),
        volatility: volatility?.toFixed(4),
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating log returns:', error);
      throw error;
    }
  }

  /**
   * Calcola cumulative returns
   */
  public calculateCumulativeReturns(
    simpleReturns: (number | null)[],
    baseValue: number = 1.0,
    dates?: string[]
  ): CumulativeReturnsResult {
    console.log('📈 Calculating cumulative returns...', { 
      returnsCount: simpleReturns.length, 
      baseValue 
    });

    const startTime = performance.now();

    try {
      const cumulativeReturns: number[] = [baseValue];
      let currentCumulative = baseValue;
      let validReturns = 0;
      let invalidReturns = 0;

      // Calculate cumulative returns
      for (let i = 0; i < simpleReturns.length; i++) {
        const simpleReturn = simpleReturns[i];

        if (simpleReturn !== null && this.isValidReturn(simpleReturn)) {
          // Cumulative return: (1 + R1) * (1 + R2) * ... 
          currentCumulative = currentCumulative * (1 + simpleReturn);
          validReturns++;
        } else {
          invalidReturns++;
          // Keep previous cumulative value if return is invalid
        }

        cumulativeReturns.push(currentCumulative);
      }

      // Calculate total return
      const totalReturn = baseValue > 0 ? (currentCumulative - baseValue) / baseValue : null;

      // Calculate drawdown series
      const drawdownSeries = this.calculateDrawdownSeries(cumulativeReturns);
      const maxDrawdown = drawdownSeries.length > 0 ? Math.min(...drawdownSeries) : null;

      // Find max drawdown period
      let maxDrawdownPeriod: { start: string; end: string } | undefined;
      if (maxDrawdown !== null && dates && dates.length === drawdownSeries.length) {
        const maxDrawdownIndex = drawdownSeries.indexOf(maxDrawdown);
        if (maxDrawdownIndex >= 0) {
          // Find the peak before the drawdown
          let peakIndex = 0;
          for (let i = 0; i <= maxDrawdownIndex; i++) {
            if (cumulativeReturns[i] > cumulativeReturns[peakIndex]) {
              peakIndex = i;
            }
          }
          
          maxDrawdownPeriod = {
            start: dates[peakIndex] || '',
            end: dates[maxDrawdownIndex] || ''
          };
        }
      }

      // Calculate statistics
      const validCumulativeReturns = cumulativeReturns.slice(1); // Exclude base value
      const mean = this.calculateMean(validCumulativeReturns);
      const volatility = this.calculateStandardDeviation(validCumulativeReturns);
      const min = Math.min(...validCumulativeReturns);
      const max = Math.max(...validCumulativeReturns);

      const result: CumulativeReturnsResult = {
        values: cumulativeReturns.slice(1), // Exclude base value
        count: validReturns,
        invalidCount: invalidReturns,
        mean,
        volatility,
        min,
        max,
        totalReturn,
        finalValue: currentCumulative,
        drawdownSeries,
        maxDrawdown,
        maxDrawdownPeriod,
        startDate: dates?.[0],
        endDate: dates?.[dates.length - 1]
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Cumulative returns calculated:', {
        totalReturn: totalReturn?.toFixed(4),
        finalValue: currentCumulative.toFixed(4),
        maxDrawdown: maxDrawdown?.toFixed(4),
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating cumulative returns:', error);
      throw error;
    }
  }

  /**
   * Calcola annualized returns
   */
  public calculateAnnualizedReturns(
    returns: (number | null)[],
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    method: 'compound' | 'arithmetic' | 'geometric' = 'compound'
  ): AnnualizedReturnsResult {
    console.log('📅 Calculating annualized returns...', { 
      returnsCount: returns.length, 
      frequency, 
      method 
    });

    const startTime = performance.now();

    try {
      // Determine periods per year
      const periodsPerYear = this.getPeriodsPerYear(frequency);
      
      // Filter valid returns
      const validReturns = returns.filter(r => r !== null && this.isValidReturn(r)) as number[];
      
      if (validReturns.length === 0) {
        throw new Error('No valid returns for annualization');
      }

      const totalPeriods = validReturns.length;
      const years = totalPeriods / periodsPerYear;

      let annualizedReturn: number | null = null;
      let volatility: number | null = null;

      switch (method) {
        case 'compound':
          // Compound Annual Growth Rate (CAGR)
          if (years > 0) {
            const cumulativeReturn = this.calculateTotalCumulativeReturn(validReturns);
            if (cumulativeReturn !== null && (1 + cumulativeReturn) > 0) {
              annualizedReturn = Math.pow(1 + cumulativeReturn, 1 / years) - 1;
            }
          }
          break;

        case 'arithmetic':
          // Simple arithmetic annualization
          const arithmeticMean = this.calculateMean(validReturns);
          annualizedReturn = arithmeticMean * periodsPerYear;
          break;

        case 'geometric':
          // Geometric mean annualization
          const geometricMean = this.calculateGeometricMean(validReturns);
          if (geometricMean !== null) {
            annualizedReturn = Math.pow(1 + geometricMean, periodsPerYear) - 1;
          }
          break;
      }

      // Calculate annualized volatility
      const returnVolatility = this.calculateStandardDeviation(validReturns);
      if (returnVolatility !== null) {
        volatility = returnVolatility * Math.sqrt(periodsPerYear);
      }

      const result: AnnualizedReturnsResult = {
        annualizedReturn,
        method,
        periodsPerYear,
        totalPeriods,
        years,
        volatility
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Annualized returns calculated:', {
        annualizedReturn: annualizedReturn?.toFixed(4),
        volatility: volatility?.toFixed(4),
        years: years.toFixed(2),
        method,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating annualized returns:', error);
      throw error;
    }
  }

  /**
   * Batch processing per large datasets
   */
  public async calculateReturnsBatch(
    assetsData: Record<string, PricePoint[]>,
    returnType: ReturnType,
    config: CalculationConfig = {}
  ): Promise<BatchCalculationResult> {
    console.log('🔄 Starting batch returns calculation...', { 
      assets: Object.keys(assetsData).length, 
      returnType,
      config 
    });

    const startTime = performance.now();
    const { batchSize = 50 } = config;
    
    const results: Record<string, ReturnsResult | { error: true; message: string; symbol: string }> = {};
    const symbols = Object.keys(assetsData);
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process in batches
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batchSymbols = symbols.slice(i, i + batchSize);
        
        // Process current batch
        const batchPromises = batchSymbols.map(async (symbol) => {
          try {
            const prices = assetsData[symbol];
            let result: ReturnsResult | CumulativeReturnsResult | AnnualizedReturnsResult;

            switch (returnType) {
              case 'simple':
                result = this.calculateSimpleReturns(prices, config);
                break;
              case 'log':
                result = this.calculateLogReturns(prices, config);
                break;
              case 'cumulative':
                const simpleReturns = this.calculateSimpleReturns(prices, config);
                const dates = prices.map(p => p.date);
                result = this.calculateCumulativeReturns(simpleReturns.values, 1.0, dates);
                break;
              case 'annualized':
                const returnsForAnnual = this.calculateSimpleReturns(prices, config);
                const frequency = config.frequency || 'daily';
                result = this.calculateAnnualizedReturns(returnsForAnnual.values, frequency);
                break;
              default:
                throw new Error(`Unknown return type: ${returnType}`);
            }

            results[symbol] = result as ReturnsResult;
            successCount++;
            
          } catch (error) {
            results[symbol] = {
              error: true,
              message: error instanceof Error ? error.message : String(error),
              symbol
            };
            errorCount++;
          }
          
          processedCount++;
        });

        // Wait for batch completion
        await Promise.all(batchPromises);

        // Update progress
        const progress = (processedCount / symbols.length) * 100;
        console.log(`📊 Batch progress: ${progress.toFixed(1)}% (${processedCount}/${symbols.length})`);

        // Allow UI updates between batches
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      const processingTime = performance.now() - startTime;
      
      const batchResult: BatchCalculationResult = {
        results,
        totalProcessed: processedCount,
        successCount,
        errorCount,
        processingTime
      };

      console.log('✅ Batch calculation completed:', {
        totalAssets: symbols.length,
        successCount,
        errorCount,
        processingTime: `${processingTime.toFixed(2)}ms`,
        averageTimePerAsset: `${(processingTime / symbols.length).toFixed(2)}ms`
      });

      return batchResult;

    } catch (error) {
      console.error('❌ Error in batch calculation:', error);
      throw error;
    }
  }

  /**
   * Utility methods
   */
  private isValidPrice(price: number): boolean {
    return typeof price === 'number' && isFinite(price) && price > 0;
  }

  private isValidReturn(returnValue: number): boolean {
    return typeof returnValue === 'number' && isFinite(returnValue) && !isNaN(returnValue);
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[]): number | null {
    if (values.length < 2) return null;
    
    const mean = this.calculateMean(values);
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDifferences);
    
    return Math.sqrt(variance);
  }

  private calculateGeometricMean(values: number[]): number | null {
    if (values.length === 0) return null;
    
    try {
      // Convert to (1 + return) values
      const factors = values.map(r => 1 + r);
      
      // Check for negative or zero factors
      if (factors.some(f => f <= 0)) return null;
      
      // Calculate geometric mean
      const product = factors.reduce((prod, factor) => prod * factor, 1);
      const geometricMean = Math.pow(product, 1 / values.length) - 1;
      
      return this.isValidReturn(geometricMean) ? geometricMean : null;
    } catch {
      return null;
    }
  }

  private calculateTotalCumulativeReturn(returns: number[]): number | null {
    try {
      let cumulative = 1.0;
      for (const ret of returns) {
        cumulative *= (1 + ret);
      }
      return cumulative - 1;
    } catch {
      return null;
    }
  }

  private calculateDrawdownSeries(cumulativeReturns: number[]): number[] {
    const drawdowns: number[] = [];
    let peak = cumulativeReturns[0] || 0;

    for (const value of cumulativeReturns) {
      if (value > peak) {
        peak = value;
      }
      
      const drawdown = peak > 0 ? (value - peak) / peak : 0;
      drawdowns.push(drawdown);
    }

    return drawdowns;
  }

  private getPeriodsPerYear(frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'): number {
    switch (frequency) {
      case 'daily': return this.TRADING_DAYS_PER_YEAR;
      case 'weekly': return this.WEEKS_PER_YEAR;
      case 'monthly': return this.MONTHS_PER_YEAR;
      case 'quarterly': return this.QUARTERS_PER_YEAR;
      default: return this.TRADING_DAYS_PER_YEAR;
    }
  }

  private validateResults(result: ReturnsResult, type: string): void {
    // Basic validation checks
    if (result.count === 0) {
      console.warn(`⚠️ No valid ${type} returns calculated`);
    }

    if (result.invalidCount > result.count) {
      console.warn(`⚠️ More invalid than valid ${type} returns`);
    }

    // Check for extreme values
    if (result.min !== null && result.max !== null) {
      const range = result.max - result.min;
      if (range > 10) { // 1000% range seems extreme
        console.warn(`⚠️ Extreme ${type} return range detected: ${range.toFixed(2)}`);
      }
    }
  }
}

// Export singleton instance
export const returnsCalculationEngine = ReturnsCalculationEngine.getInstance();
export default ReturnsCalculationEngine;

// Export types
export type {
  PricePoint,
  ReturnsResult,
  CumulativeReturnsResult,
  AnnualizedReturnsResult,
  BatchCalculationResult,
  CalculationConfig,
  ReturnType
}; 
