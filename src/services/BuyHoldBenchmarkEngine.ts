/**
 * Buy & Hold Benchmark Engine
 * Implements the simplest investment strategy as a performance benchmark
 */

export interface AssetData {
  symbol: string;
  name: string;
  expectedReturn: number;
  volatility: number;
  returns: number[];
  dividendYield?: number;
  prices?: number[];
}

export interface BuyHoldConfig {
  initialInvestment: number;
  reinvestDividends: boolean;
  startDate?: string;
  endDate?: string;
  rebalanceFrequency?: 'never' | 'annually' | 'quarterly' | 'monthly';
  transactionCosts?: number; // percentage
}

export interface BuyHoldPosition {
  symbol: string;
  shares: number;
  currentValue: number;
  totalDividends: number;
  totalReturn: number;
  weight: number;
}

export interface BuyHoldPerformance {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  cumulativeReturns: number[];
  dailyReturns: number[];
  portfolioValues: number[];
  dividendIncome: number;
  finalValue: number;
  timeToMaxDrawdown: number;
  recoveryTime: number;
}

export interface BuyHoldResult {
  strategy: 'BUY_HOLD';
  config: BuyHoldConfig;
  positions: BuyHoldPosition[];
  performance: BuyHoldPerformance;
  timeline: {
    dates: string[];
    portfolioValues: number[];
    weights: number[][];
    dividends: number[];
  };
  metadata: {
    startDate: string;
    endDate: string;
    totalDays: number;
    processingTime: number;
    rebalanceCount: number;
  };
}

class BuyHoldBenchmarkEngine {
  private readonly DEFAULT_RISK_FREE_RATE = 0.02;
  private readonly DEFAULT_TRANSACTION_COST = 0.001; // 0.1%

  /**
   * Calculate Buy & Hold benchmark performance
   */
  public calculateBuyHoldBenchmark(
    assets: AssetData[],
    config: BuyHoldConfig
  ): BuyHoldResult | null {
    console.log('📊 Calculating Buy & Hold Benchmark...', {
      assets: assets.length,
      initialInvestment: config.initialInvestment,
      reinvestDividends: config.reinvestDividends
    });

    const startTime = performance.now();

    try {
      // Validate inputs
      this.validateInputs(assets, config);

      // Initialize equal weight positions
      const initialPositions = this.initializeEqualWeightPositions(
        assets,
        config.initialInvestment
      );

      // Simulate the investment period
      const simulation = this.simulateInvestmentPeriod(
        assets,
        initialPositions,
        config
      );

      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics(
        simulation.portfolioValues,
        simulation.dailyReturns,
        simulation.dividendIncome,
        config.initialInvestment
      );

      // Generate final positions
      const finalPositions = this.calculateFinalPositions(
        initialPositions,
        simulation,
        assets
      );

      const result: BuyHoldResult = {
        strategy: 'BUY_HOLD',
        config,
        positions: finalPositions,
        performance,
        timeline: {
          dates: simulation.dates,
          portfolioValues: simulation.portfolioValues,
          weights: simulation.weights,
          dividends: simulation.dividends
        },
        metadata: {
          startDate: simulation.dates[0],
          endDate: simulation.dates[simulation.dates.length - 1],
          totalDays: simulation.dates.length,
          processingTime: performance.now() - startTime,
          rebalanceCount: simulation.rebalanceCount
        }
      };

      console.log('✅ Buy & Hold Benchmark calculated:', {
        totalReturn: (performance.totalReturn * 100).toFixed(2) + '%',
        annualizedReturn: (performance.annualizedReturn * 100).toFixed(2) + '%',
        volatility: (performance.volatility * 100).toFixed(2) + '%',
        sharpeRatio: performance.sharpeRatio.toFixed(3),
        maxDrawdown: (performance.maxDrawdown * 100).toFixed(2) + '%',
        finalValue: performance.finalValue.toFixed(2),
        processingTime: `${result.metadata.processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Buy & Hold Benchmark:', error);
      return null;
    }
  }

  /**
   * Compare strategy performance against Buy & Hold benchmark
   */
  public compareToBenchmark(
    strategyReturns: number[],
    benchmarkResult: BuyHoldResult
  ): {
    activeReturn: number;
    trackingError: number;
    informationRatio: number;
    alphaVsBenchmark: number;
    betaVsBenchmark: number;
    winRate: number;
    outperformancePeriods: number;
    totalPeriods: number;
  } {
    const benchmarkReturns = benchmarkResult.performance.dailyReturns;
    const minLength = Math.min(strategyReturns.length, benchmarkReturns.length);
    
    const strategySlice = strategyReturns.slice(0, minLength);
    const benchmarkSlice = benchmarkReturns.slice(0, minLength);

    // Calculate active returns
    const activeReturns = strategySlice.map((ret) => ret - benchmarkSlice[i]);
    
    // Active return (mean of active returns)
    const activeReturn = this.calculateMean(activeReturns);
    
    // Tracking error (std dev of active returns)
    const trackingError = this.calculateStandardDeviation(activeReturns);
    
    // Information ratio
    const informationRatio = trackingError > 0 ? activeReturn / trackingError : 0;
    
    // Alpha and Beta calculation
    const { alpha, beta } = this.calculateAlphaBeta(strategySlice, benchmarkSlice);
    
    // Win rate
    const outperformancePeriods = activeReturns.filter(ret => ret > 0).length;
    const winRate = outperformancePeriods / activeReturns.length;

    return {
      activeReturn: activeReturn * 252, // Annualized
      trackingError: trackingError * Math.sqrt(252), // Annualized
      informationRatio,
      alphaVsBenchmark: alpha * 252, // Annualized
      betaVsBenchmark: beta,
      winRate,
      outperformancePeriods,
      totalPeriods: activeReturns.length
    };
  }

  /**
   * Generate sample buy & hold data for testing
   */
  public generateSampleBuyHoldData(): AssetData[] {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
    const names = ['Apple Inc.', 'Alphabet Inc.', 'Microsoft Corp.', 'Amazon.com Inc.', 'Tesla Inc.'];
    
    return symbols.map((symbol) => {
      const returns = this.generateRandomReturns(252, 0.08 + Math.random() * 0.04, 0.15 + Math.random() * 0.10);
      const prices = this.generatePricesFromReturns(returns, 100 + Math.random() * 200);
      
      return {
        symbol,
        name: names[index],
        expectedReturn: this.calculateMean(returns),
        volatility: this.calculateStandardDeviation(returns),
        returns,
        dividendYield: 0.01 + Math.random() * 0.03, // 1-4% dividend yield
        prices
      };
    });
  }

  /**
   * Validate inputs
   */
  private validateInputs(assets: AssetData[], config: BuyHoldConfig): void {
    if (assets.length === 0) {
      throw new Error('At least one asset is required');
    }

    if (config.initialInvestment <= 0) {
      throw new Error('Initial investment must be positive');
    }

    if (config.transactionCosts && (config.transactionCosts < 0 || config.transactionCosts > 0.1)) {
      throw new Error('Transaction costs must be between 0 and 10%');
    }

    // Validate asset data
    assets.forEach((asset, index) => {
      if (!asset.symbol || !asset.returns || asset.returns.length === 0) {
        throw new Error(`Invalid data for asset ${index}: ${asset.symbol}`);
      }
    });
  }

  /**
   * Initialize equal weight positions
   */
  private initializeEqualWeightPositions(
    assets: AssetData[],
    initialInvestment: number
  ): Array<{
    symbol: string;
    initialShares: number;
    currentShares: number;
    initialValue: number;
    dividendsReceived: number;
  }> {
    const equalWeight = 1 / assets.length;
    const initialValuePerAsset = initialInvestment * equalWeight;

    return assets.map(asset => {
      const initialPrice = asset.prices?.[0] || 100; // Use first price or default
      const initialShares = initialValuePerAsset / initialPrice;

      return {
        symbol: asset.symbol,
        initialShares,
        currentShares: initialShares,
        initialValue: initialValuePerAsset,
        dividendsReceived: 0
      };
    });
  }

  /**
   * Simulate the investment period
   */
  private simulateInvestmentPeriod(
    assets: AssetData[],
    initialPositions: any[],
    config: BuyHoldConfig
  ): {
    dates: string[];
    portfolioValues: number[];
    dailyReturns: number[];
    dividendIncome: number;
    weights: number[][];
    dividends: number[];
    rebalanceCount: number;
  } {
    const maxLength = Math.max(...assets.map(asset => asset.returns.length));
    const dates = this.generateDateRange(maxLength);
    const portfolioValues: number[] = [];
    const dailyReturns: number[] = [];
    const weights: number[][] = [];
    const dividends: number[] = [];
    let totalDividendIncome = 0;
    let rebalanceCount = 0;

    // Current positions (will be modified for dividend reinvestment)
    const positions = [...initialPositions];

    for (let day = 0; day < maxLength; day++) {
      let dailyPortfolioValue = 0;
      const dailyWeights: number[] = [];
      let dailyDividends = 0;

      // Calculate portfolio value for this day
      assets.forEach((asset, assetIndex) => {
        if (day < asset.returns.length) {
          const currentPrice = asset.prices?.[day] || this.calculatePriceFromReturns(asset.returns, day, 100);
          const shares = positions[assetIndex].currentShares;
          const assetValue = shares * currentPrice;
          dailyPortfolioValue += assetValue;

          // Calculate dividend payment (assume quarterly dividends)
          if (day > 0 && day % 63 === 0 && asset.dividendYield && config.reinvestDividends) {
            const quarterlyDividend = (asset.dividendYield / 4) * currentPrice * shares;
            dailyDividends += quarterlyDividend;
            totalDividendIncome += quarterlyDividend;

            // Reinvest dividends
            const additionalShares = quarterlyDividend / currentPrice;
            positions[assetIndex].currentShares += additionalShares;
            positions[assetIndex].dividendsReceived += quarterlyDividend;
          }
        }
      });

      // Calculate weights
      assets.forEach((asset, assetIndex) => {
        if (day < asset.returns.length) {
          const currentPrice = asset.prices?.[day] || this.calculatePriceFromReturns(asset.returns, day, 100);
          const shares = positions[assetIndex].currentShares;
          const assetValue = shares * currentPrice;
          const weight = dailyPortfolioValue > 0 ? assetValue / dailyPortfolioValue : 0;
          dailyWeights.push(weight);
        } else {
          dailyWeights.push(0);
        }
      });

      portfolioValues.push(dailyPortfolioValue);
      weights.push(dailyWeights);
      dividends.push(dailyDividends);

      // Calculate daily return
      if (day > 0) {
        const dailyReturn = (dailyPortfolioValue - portfolioValues[day - 1]) / portfolioValues[day - 1];
        dailyReturns.push(dailyReturn);
      }

      // Check for rebalancing (if not 'never')
      if (config.rebalanceFrequency !== 'never' && this.shouldRebalance(day, config.rebalanceFrequency)) {
        this.rebalancePositions(positions, assets, dailyPortfolioValue, day);
        rebalanceCount++;
      }
    }

    return {
      dates,
      portfolioValues,
      dailyReturns,
      dividendIncome: totalDividendIncome,
      weights,
      dividends,
      rebalanceCount
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    portfolioValues: number[],
    dailyReturns: number[],
    dividendIncome: number,
    initialInvestment: number
  ): BuyHoldPerformance {
    const finalValue = portfolioValues[portfolioValues.length - 1];
    const totalReturn = (finalValue - initialInvestment) / initialInvestment;
    
    const numberOfYears = portfolioValues.length / 252;
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / numberOfYears) - 1;
    
    const volatility = this.calculateStandardDeviation(dailyReturns) * Math.sqrt(252);
    const sharpeRatio = volatility > 0 ? (annualizedReturn - this.DEFAULT_RISK_FREE_RATE) / volatility : 0;
    
    const { maxDrawdown, timeToMaxDrawdown, recoveryTime } = this.calculateDrawdownMetrics(portfolioValues);
    
    const cumulativeReturns = portfolioValues.map(value => (value - initialInvestment) / initialInvestment);

    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      cumulativeReturns,
      dailyReturns,
      portfolioValues,
      dividendIncome,
      finalValue,
      timeToMaxDrawdown,
      recoveryTime
    };
  }

  /**
   * Calculate final positions
   */
  private calculateFinalPositions(
    initialPositions: any[],
    simulation: any,
    assets: AssetData[]
  ): BuyHoldPosition[] {
    const finalValues = simulation.portfolioValues[simulation.portfolioValues.length - 1];
    const finalWeights = simulation.weights[simulation.weights.length - 1];

    return initialPositions.map((position) => {
      const asset = assets[index];
      const finalPrice = asset.prices?.[asset.prices.length - 1] || 100;
      const currentValue = position.currentShares * finalPrice;
      const totalReturn = (currentValue + position.dividendsReceived - position.initialValue) / position.initialValue;

      return {
        symbol: position.symbol,
        shares: position.currentShares,
        currentValue,
        totalDividends: position.dividendsReceived,
        totalReturn,
        weight: finalWeights[index] || 0
      };
    });
  }

  /**
   * Helper methods
   */
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private calculateAlphaBeta(strategyReturns: number[], benchmarkReturns: number[]): { alpha: number; beta: number } {
    const n = strategyReturns.length;
    const strategyMean = this.calculateMean(strategyReturns);
    const benchmarkMean = this.calculateMean(benchmarkReturns);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const strategyDiff = strategyReturns[i] - strategyMean;
      const benchmarkDiff = benchmarkReturns[i] - benchmarkMean;
      numerator += strategyDiff * benchmarkDiff;
      denominator += benchmarkDiff * benchmarkDiff;
    }

    const beta = denominator !== 0 ? numerator / denominator : 0;
    const alpha = strategyMean - beta * benchmarkMean;

    return { alpha, beta };
  }

  private calculateDrawdownMetrics(portfolioValues: number[]): {
    maxDrawdown: number;
    timeToMaxDrawdown: number;
    recoveryTime: number;
  } {
    let maxDrawdown = 0;
    let peak = portfolioValues[0];
    let timeToMaxDrawdown = 0;
    let recoveryTime = 0;
    let drawdownStart = 0;
    let isInDrawdown = false;

    for (let i = 1; i < portfolioValues.length; i++) {
      if (portfolioValues[i] > peak) {
        peak = portfolioValues[i];
        if (isInDrawdown) {
          recoveryTime = i - drawdownStart;
          isInDrawdown = false;
        }
      } else {
        const drawdown = (peak - portfolioValues[i]) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          timeToMaxDrawdown = i;
        }
        if (!isInDrawdown) {
          drawdownStart = i;
          isInDrawdown = true;
        }
      }
    }

    return { maxDrawdown, timeToMaxDrawdown, recoveryTime };
  }

  private generateRandomReturns(length: number, expectedReturn: number, volatility: number): number[] {
    const returns: number[] = [];
    const dailyReturn = expectedReturn / 252;
    const dailyVol = volatility / Math.sqrt(252);

    for (let i = 0; i < length; i++) {
      const randomShock = this.generateNormalRandom();
      const returnValue = dailyReturn + dailyVol * randomShock;
      returns.push(returnValue);
    }

    return returns;
  }

  private generateNormalRandom(): number {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  private generatePricesFromReturns(returns: number[], startPrice: number): number[] {
    const prices = [startPrice];
    for (let i = 0; i < returns.length; i++) {
      const newPrice = prices[i] * (1 + returns[i]);
      prices.push(newPrice);
    }
    return prices;
  }

  private calculatePriceFromReturns(returns: number[], day: number, startPrice: number): number {
    let price = startPrice;
    for (let i = 0; i <= day && i < returns.length; i++) {
      price *= (1 + returns[i]);
    }
    return price;
  }

  private generateDateRange(days: number): string[] {
    const dates: string[] = [];
    const startDate = new Date('2022-01-01');
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  private shouldRebalance(day: number, frequency: string): boolean {
    switch (frequency) {
      case 'annually': return day > 0 && day % 252 === 0;
      case 'quarterly': return day > 0 && day % 63 === 0;
      case 'monthly': return day > 0 && day % 21 === 0;
      default: return false;
    }
  }

  private rebalancePositions(positions: any[], assets: AssetData[], portfolioValue: number, day: number): void {
    // For Buy & Hold, we typically don't rebalance, but this method is here for completeness
    // In a true Buy & Hold strategy, rebalanceFrequency should be 'never'
    
    if (portfolioValue <= 0) return;

    const equalWeight = 1 / assets.length;
    const targetValuePerAsset = portfolioValue * equalWeight;

    positions.forEach((position, index) => {
      const asset = assets[index];
      if (day < asset.returns.length) {
        const currentPrice = asset.prices?.[day] || this.calculatePriceFromReturns(asset.returns, day, 100);
        const targetShares = targetValuePerAsset / currentPrice;
        position.currentShares = targetShares;
      }
    });
  }
}

// Export singleton instance
export const buyHoldBenchmarkEngine = new BuyHoldBenchmarkEngine(); 
