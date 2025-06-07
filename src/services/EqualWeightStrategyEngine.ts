// Define AssetData interface locally since it's not available in imports
interface AssetData {
  symbol: string;
  returns: number[];
  expectedReturn: number;
  volatility: number;
  prices?: number[];
  dividendYield?: number;
  assetType?: string;
}

// ===================================================================
// EQUAL WEIGHT STRATEGY ENGINE
// Sistema per strategia Equal Weight con ribilanciamento mensile
//
// A differenza del Buy & Hold, questa strategia:
// - Ribilancia ATTIVAMENTE ogni mese per mantenere pesi uguali
// - Calcola i costi di transazione per ogni ribilanciamento
// - Monitora il "drift" dei pesi dal target
// - Usa soglie intelligenti per decidere quando ribilanciare
// ===================================================================

export interface EqualWeightConfig {
  initialInvestment: number;
  rebalanceFrequency: 'monthly' | 'quarterly' | 'semi-annually';
  rebalanceThreshold: number; // Minimum drift % to trigger rebalancing
  transactionCosts: {
    fixedCostPerTrade: number;    // Fixed cost per trade (e.g., $4.95)
    variableCostRate: number;     // Variable cost as % of trade value
  };
  reinvestDividends: boolean;
  startDate?: string;
  endDate?: string;
}

export interface EqualWeightPosition {
  symbol: string;
  targetWeight: number;
  currentWeight: number;
  targetShares: number;
  currentShares: number;
  currentValue: number;
  drift: number; // How far from target weight
  needsRebalancing: boolean;
}

export interface RebalancingEvent {
  date: string;
  reason: 'scheduled' | 'threshold' | 'dividend';
  portfolioValueBefore: number;
  portfolioValueAfter: number;
  totalTransactionCosts: number;
  costBreakdown: {
    fixedCosts: number;
    variableCosts: number;
    numberOfTrades: number;
  };
  weightDrifts: number[]; // Drift of each asset before rebalancing
  maxDrift: number;
  positions: {
    symbol: string;
    oldShares: number;
    newShares: number;
    tradedValue: number;
  }[];
}

export interface EqualWeightPerformance {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTransactionCosts: number;
  transactionCostImpact: number; // % impact on returns
  rebalancingCount: number;
  avgDriftBeforeRebalancing: number;
  cumulativeReturns: number[];
  dailyReturns: number[];
  portfolioValues: number[];
  dividendIncome: number;
  finalValue: number;
  timeToMaxDrawdown?: number;
  recoveryTime?: number;
}

export interface EqualWeightResult {
  strategy: 'EQUAL_WEIGHT';
  config: EqualWeightConfig;
  positions: EqualWeightPosition[];
  performance: EqualWeightPerformance;
  rebalancingHistory: RebalancingEvent[];
  timeline: {
    dates: string[];
    portfolioValues: number[];
    weights: number[][];
    dividends: number[];
    transactionCosts: number[];
  };
  metadata: {
    startDate: string;
    endDate: string;
    totalDays: number;
    rebalancingDays: number[];
    processingTime: number;
    avgDaysPerRebalancing: number;
  };
}

export class EqualWeightStrategyEngine {
  private readonly DEFAULT_RISK_FREE_RATE = 0.02;
  private readonly DEFAULT_FIXED_COST = 4.95; // $4.95 per trade
  private readonly DEFAULT_VARIABLE_COST = 0.005; // 0.5%
  private readonly DEFAULT_REBALANCE_THRESHOLD = 0.05; // 5% drift threshold

  /**
   * Calculate Equal Weight Strategy performance with active rebalancing
   */
  public calculateEqualWeightStrategy(
    assets: AssetData[],
    config: EqualWeightConfig
  ): EqualWeightResult | null {
    console.log('⚖️ Calculating Equal Weight Strategy...', {
      assets: assets.length,
      initialInvestment: config.initialInvestment,
      rebalanceFrequency: config.rebalanceFrequency,
      rebalanceThreshold: (config.rebalanceThreshold * 100).toFixed(1) + '%'
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

      // Simulate the investment period with active rebalancing
      const simulation = this.simulateEqualWeightStrategy(
        assets,
        initialPositions,
        config
      );

      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics(
        simulation.portfolioValues,
        simulation.dailyReturns,
        simulation.dividendIncome,
        simulation.totalTransactionCosts,
        config.initialInvestment,
        simulation.rebalancingHistory
      );

      // Generate final positions
      const finalPositions = this.calculateFinalPositions(
        initialPositions,
        simulation,
        assets,
        config
      );

      const result: EqualWeightResult = {
        strategy: 'EQUAL_WEIGHT',
        config,
        positions: finalPositions,
        performance,
        rebalancingHistory: simulation.rebalancingHistory,
        timeline: {
          dates: simulation.dates,
          portfolioValues: simulation.portfolioValues,
          weights: simulation.weights,
          dividends: simulation.dividends,
          transactionCosts: simulation.transactionCosts
        },
        metadata: {
          startDate: simulation.dates[0],
          endDate: simulation.dates[simulation.dates.length - 1],
          totalDays: simulation.dates.length,
          rebalancingDays: simulation.rebalancingHistory.map((_) => 
            this.getRebalancingDay(index, config.rebalanceFrequency)
          ),
          processingTime: performance.now() - startTime,
          avgDaysPerRebalancing: simulation.dates.length / Math.max(simulation.rebalancingHistory.length, 1)
        }
      };

      console.log('✅ Equal Weight Strategy calculated:', {
        totalReturn: (performance.totalReturn * 100).toFixed(2) + '%',
        annualizedReturn: (performance.annualizedReturn * 100).toFixed(2) + '%',
        volatility: (performance.volatility * 100).toFixed(2) + '%',
        sharpeRatio: performance.sharpeRatio.toFixed(3),
        maxDrawdown: (performance.maxDrawdown * 100).toFixed(2) + '%',
        rebalancingCount: performance.rebalancingCount,
        totalTransactionCosts: performance.totalTransactionCosts.toFixed(2),
        transactionCostImpact: (performance.transactionCostImpact * 100).toFixed(2) + '%',
        processingTime: `${result.metadata.processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Equal Weight Strategy:', error);
      return null;
    }
  }

  /**
   * Compare Equal Weight strategy with Buy & Hold
   */
  public compareWithBuyHold(
    equalWeightResult: EqualWeightResult,
    buyHoldReturns: number[]
  ): {
    excessReturn: number;
    trackingError: number;
    informationRatio: number;
    rebalancingBenefit: number;
    costOfRebalancing: number;
    netAlpha: number;
    winRate: number;
    outperformancePeriods: number;
    totalPeriods: number;
  } {
    const ewReturns = equalWeightResult.performance.dailyReturns;
    const minLength = Math.min(ewReturns.length, buyHoldReturns.length);
    
    const ewSlice = ewReturns.slice(0, minLength);
    const bhSlice = buyHoldReturns.slice(0, minLength);

    // Calculate excess returns
    const excessReturns = ewSlice.map((ret) => ret - bhSlice[i]);
    
    // Excess return (mean of excess returns)
    const excessReturn = this.calculateMean(excessReturns);
    
    // Tracking error (std dev of excess returns)
    const trackingError = this.calculateStandardDeviation(excessReturns);
    
    // Information ratio
    const informationRatio = trackingError > 0 ? excessReturn / trackingError : 0;
    
    // Rebalancing benefit (gross alpha before costs)
    const grossExcessReturn = excessReturn + (equalWeightResult.performance.transactionCostImpact / 252);
    
    // Cost of rebalancing
    const costOfRebalancing = equalWeightResult.performance.transactionCostImpact;
    
    // Net alpha
    const netAlpha = excessReturn * 252; // Annualized
    
    // Win rate
    const outperformancePeriods = excessReturns.filter(ret => ret > 0).length;
    const winRate = outperformancePeriods / excessReturns.length;

    return {
      excessReturn: excessReturn * 252, // Annualized
      trackingError: trackingError * Math.sqrt(252), // Annualized
      informationRatio,
      rebalancingBenefit: grossExcessReturn * 252, // Annualized
      costOfRebalancing,
      netAlpha,
      winRate,
      outperformancePeriods,
      totalPeriods: excessReturns.length
    };
  }

  /**
   * Validate input parameters
   */
  private validateInputs(assets: AssetData[], config: EqualWeightConfig): void {
    if (!assets || assets.length === 0) {
      throw new Error('Assets array cannot be empty');
    }

    if (config.initialInvestment <= 0) {
      throw new Error('Initial investment must be positive');
    }

    if (config.rebalanceThreshold < 0 || config.rebalanceThreshold > 1) {
      throw new Error('Rebalance threshold must be between 0 and 1');
    }

    if (config.transactionCosts.fixedCostPerTrade < 0) {
      throw new Error('Fixed transaction cost cannot be negative');
    }

    if (config.transactionCosts.variableCostRate < 0 || config.transactionCosts.variableCostRate > 0.1) {
      throw new Error('Variable transaction cost rate must be between 0 and 10%');
    }

    // Validate that all assets have data
    assets.forEach((asset, index) => {
      if (!asset.returns || asset.returns.length === 0) {
        throw new Error(`Asset at index ${index} (${asset.symbol}) has no return data`);
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
    targetShares: number;
    currentShares: number;
    initialValue: number;
    dividendsReceived: number;
  }> {
    const targetWeight = 1 / assets.length;
    const initialValuePerAsset = initialInvestment * targetWeight;

    return assets.map(asset => {
      const initialPrice = asset.prices?.[0] || 100; // Use first price or default
      const targetShares = initialValuePerAsset / initialPrice;

      return {
        symbol: asset.symbol,
        targetShares,
        currentShares: targetShares,
        initialValue: initialValuePerAsset,
        dividendsReceived: 0
      };
    });
  }

  /**
   * Simulate Equal Weight strategy with active rebalancing
   */
  private simulateEqualWeightStrategy(
    assets: AssetData[],
    initialPositions: Array<{
      symbol: string;
      targetShares: number;
      currentShares: number;
      initialValue: number;
      dividendsReceived: number;
    }>,
    config: EqualWeightConfig
  ): {
    dates: string[];
    portfolioValues: number[];
    dailyReturns: number[];
    dividendIncome: number;
    totalTransactionCosts: number;
    weights: number[][];
    dividends: number[];
    transactionCosts: number[];
    rebalancingHistory: RebalancingEvent[];
  } {
    const maxLength = Math.max(...assets.map(asset => asset.returns.length));
    const dates = this.generateDateRange(maxLength);
    const portfolioValues: number[] = [];
    const dailyReturns: number[] = [];
    const weights: number[][] = [];
    const dividends: number[] = [];
    const transactionCosts: number[] = [];
    const rebalancingHistory: RebalancingEvent[] = [];
    
    let totalDividendIncome = 0;
    let totalTransactionCosts = 0;

    // Current positions (will be modified by rebalancing)
    const positions = [...initialPositions];
    const targetWeight = 1 / assets.length;

    for (let day = 0; day < maxLength; day++) {
      let dailyPortfolioValue = 0;
      const dailyWeights: number[] = [];
      let dailyDividends = 0;
      let dailyTransactionCosts = 0;

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
            positions[assetIndex].dividendsReceived += quarterlyDividend;
          }
        }
      });

      // Calculate current weights and drift
      const currentWeights: number[] = [];
      const drifts: number[] = [];
      let needsRebalancing = false;

      assets.forEach((asset, assetIndex) => {
        if (day < asset.returns.length) {
          const currentPrice = asset.prices?.[day] || this.calculatePriceFromReturns(asset.returns, day, 100);
          const shares = positions[assetIndex].currentShares;
          const assetValue = shares * currentPrice;
          const currentWeight = dailyPortfolioValue > 0 ? assetValue / dailyPortfolioValue : 0;
          const drift = Math.abs(currentWeight - targetWeight);

          currentWeights.push(currentWeight);
          drifts.push(drift);

          // Check if this asset needs rebalancing
          if (drift > config.rebalanceThreshold) {
            needsRebalancing = true;
          }
        } else {
          currentWeights.push(0);
          drifts.push(0);
        }
      });

      weights.push(currentWeights);
      portfolioValues.push(dailyPortfolioValue);
      dividends.push(dailyDividends);

      // Check for rebalancing
      const shouldRebalanceScheduled = this.shouldRebalanceOnSchedule(day, config.rebalanceFrequency);
      
      if ((shouldRebalanceScheduled || needsRebalancing) && day > 0) {
        const rebalancingEvent = this.executeRebalancing(
          positions,
          assets,
          dailyPortfolioValue,
          day,
          config,
          drifts,
          shouldRebalanceScheduled ? 'scheduled' : 'threshold'
        );

        if (rebalancingEvent) {
          rebalancingHistory.push(rebalancingEvent);
          dailyTransactionCosts = rebalancingEvent.totalTransactionCosts;
          totalTransactionCosts += dailyTransactionCosts;
          
          // Subtract transaction costs from portfolio value
          dailyPortfolioValue -= dailyTransactionCosts;
          portfolioValues[day] = dailyPortfolioValue;
        }
      }

      transactionCosts.push(dailyTransactionCosts);

      // Calculate daily return
      if (day > 0 && portfolioValues[day - 1] > 0) {
        const dailyReturn = (dailyPortfolioValue - portfolioValues[day - 1]) / portfolioValues[day - 1];
        dailyReturns.push(dailyReturn);
      }
    }

    return {
      dates,
      portfolioValues,
      dailyReturns,
      dividendIncome: totalDividendIncome,
      totalTransactionCosts,
      weights,
      dividends,
      transactionCosts,
      rebalancingHistory
    };
  }

  /**
   * Execute rebalancing and calculate transaction costs
   */
  private executeRebalancing(
    positions: any[],
    assets: AssetData[],
    portfolioValue: number,
    day: number,
    config: EqualWeightConfig,
    drifts: number[],
    reason: 'scheduled' | 'threshold' | 'dividend'
  ): RebalancingEvent | null {
    if (portfolioValue <= 0) return null;

    const targetWeight = 1 / assets.length;
    const targetValuePerAsset = portfolioValue * targetWeight;
    
    let fixedCosts = 0;
    let variableCosts = 0;
    let numberOfTrades = 0;
    const tradeDetails: { symbol: string; oldShares: number; newShares: number; tradedValue: number; }[] = [];

    // Calculate new positions and transaction costs
    positions.forEach((position, index) => {
      const asset = assets[index];
      if (day < asset.returns.length) {
        const currentPrice = asset.prices?.[day] || this.calculatePriceFromReturns(asset.returns, day, 100);
        const currentValue = position.currentShares * currentPrice;
        const targetShares = targetValuePerAsset / currentPrice;
        const shareDiff = Math.abs(targetShares - position.currentShares);
        const tradedValue = shareDiff * currentPrice;

        // Only count as trade if significant change (>$10 or >0.1% of portfolio)
        if (tradedValue > 10 && tradedValue > portfolioValue * 0.001) {
          numberOfTrades++;
          fixedCosts += config.transactionCosts.fixedCostPerTrade;
          variableCosts += tradedValue * config.transactionCosts.variableCostRate;

          tradeDetails.push({
            symbol: position.symbol,
            oldShares: position.currentShares,
            newShares: targetShares,
            tradedValue
          });
        }

        // Update position
        position.currentShares = targetShares;
        position.targetShares = targetShares;
      }
    });

    const totalTransactionCosts = fixedCosts + variableCosts;
    const maxDrift = Math.max(...drifts);

    return {
      date: this.formatDate(day),
      reason,
      portfolioValueBefore: portfolioValue,
      portfolioValueAfter: portfolioValue - totalTransactionCosts,
      totalTransactionCosts,
      costBreakdown: {
        fixedCosts,
        variableCosts,
        numberOfTrades
      },
      weightDrifts: [...drifts],
      maxDrift,
      positions: tradeDetails
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    portfolioValues: number[],
    dailyReturns: number[],
    dividendIncome: number,
    totalTransactionCosts: number,
    initialInvestment: number,
    rebalancingHistory: RebalancingEvent[]
  ): EqualWeightPerformance {
    const finalValue = portfolioValues[portfolioValues.length - 1];
    const totalReturn = (finalValue - initialInvestment) / initialInvestment;
    
    const numberOfYears = portfolioValues.length / 252;
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / numberOfYears) - 1;
    
    const volatility = this.calculateStandardDeviation(dailyReturns) * Math.sqrt(252);
    const sharpeRatio = volatility > 0 ? (annualizedReturn - this.DEFAULT_RISK_FREE_RATE) / volatility : 0;
    
    const { maxDrawdown, timeToMaxDrawdown, recoveryTime } = this.calculateDrawdownMetrics(portfolioValues);
    
    const cumulativeReturns = portfolioValues.map(value => (value - initialInvestment) / initialInvestment);
    
    const transactionCostImpact = totalTransactionCosts / initialInvestment;
    const avgDriftBeforeRebalancing = rebalancingHistory.length > 0 
      ? rebalancingHistory.reduce((sum, event) => sum + event.maxDrift, 0) / rebalancingHistory.length
      : 0;

    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      totalTransactionCosts,
      transactionCostImpact,
      rebalancingCount: rebalancingHistory.length,
      avgDriftBeforeRebalancing,
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
   * Calculate final positions with drift analysis
   */
  private calculateFinalPositions(
    initialPositions: any[],
    simulation: any,
    assets: AssetData[],
    config: EqualWeightConfig
  ): EqualWeightPosition[] {
    const targetWeight = 1 / assets.length;
    const finalPortfolioValue = simulation.portfolioValues[simulation.portfolioValues.length - 1];
    const finalWeights = simulation.weights[simulation.weights.length - 1];

    return initialPositions.map((position) => {
      const asset = assets[index];
      const currentWeight = finalWeights[index] || 0;
      const drift = Math.abs(currentWeight - targetWeight);
      const needsRebalancing = drift > config.rebalanceThreshold;
      
      const finalPrice = asset.prices?.[asset.prices.length - 1] || 100;
      const currentValue = position.currentShares * finalPrice;

      return {
        symbol: position.symbol,
        targetWeight,
        currentWeight,
        targetShares: (finalPortfolioValue * targetWeight) / finalPrice,
        currentShares: position.currentShares,
        currentValue,
        drift,
        needsRebalancing
      };
    });
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  private shouldRebalanceOnSchedule(day: number, frequency: string): boolean {
    switch (frequency) {
      case 'monthly':
        return day > 0 && day % 21 === 0; // ~21 trading days per month
      case 'quarterly':
        return day > 0 && day % 63 === 0; // ~63 trading days per quarter
      case 'semi-annually':
        return day > 0 && day % 126 === 0; // ~126 trading days per half year
      default:
        return false;
    }
  }

  private getRebalancingDay(index: number, frequency: string): number {
    switch (frequency) {
      case 'monthly':
        return (index + 1) * 21;
      case 'quarterly':
        return (index + 1) * 63;
      case 'semi-annually':
        return (index + 1) * 126;
      default:
        return 0;
    }
  }

  private calculatePriceFromReturns(returns: number[], day: number, initialPrice: number): number {
    let price = initialPrice;
    for (let i = 0; i < Math.min(day, returns.length); i++) {
      price *= (1 + returns[i]);
    }
    return price;
  }

  private generateDateRange(length: number): string[] {
    const dates: string[] = [];
    const startDate = new Date('2020-01-01');
    
    for (let i = 0; i < length; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  private formatDate(day: number): string {
    const startDate = new Date('2020-01-01');
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    return currentDate.toISOString().split('T')[0];
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateDrawdownMetrics(portfolioValues: number[]): {
    maxDrawdown: number;
    timeToMaxDrawdown?: number;
    recoveryTime?: number;
  } {
    let maxValue = portfolioValues[0];
    let maxDrawdown = 0;
    let timeToMaxDrawdown: number | undefined;
    let recoveryTime: number | undefined;
    let drawdownStartIndex = 0;
    let inDrawdown = false;

    for (let i = 1; i < portfolioValues.length; i++) {
      const currentValue = portfolioValues[i];
      
      if (currentValue > maxValue) {
        maxValue = currentValue;
        if (inDrawdown) {
          recoveryTime = i - drawdownStartIndex;
          inDrawdown = false;
        }
      } else {
        const drawdown = (maxValue - currentValue) / maxValue;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          timeToMaxDrawdown = i;
          if (!inDrawdown) {
            drawdownStartIndex = i;
            inDrawdown = true;
          }
        }
      }
    }

    return { maxDrawdown, timeToMaxDrawdown, recoveryTime };
  }
} 
