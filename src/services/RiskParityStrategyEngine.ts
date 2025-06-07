// ===================================================================
// RISK PARITY STRATEGY ENGINE
// Sistema avanzato per strategia Risk Parity con:
// - Equal risk contribution (ogni asset contribuisce lo stesso rischio)
// - Volatility-based weighting (pesi basati su volatilità inversa)
// - Dynamic rebalancing (ribilanciamento quando rischi si sbilanciano)
// - Risk budget monitoring (monitoraggio budget di rischio in tempo reale)
// ===================================================================

interface AssetData {
  symbol: string;
  returns: number[];
  expectedReturn: number;
  volatility: number;
  prices?: number[];
  dividendYield?: number;
  assetType?: string;
}

export interface RiskParityConfig {
  initialInvestment: number;
  rebalanceFrequency: 'monthly' | 'quarterly' | 'semi-annually';
  riskBudgetThreshold: number;
  volatilityLookback: number;
  transactionCosts: {
    fixedCostPerTrade: number;
    variableCostRate: number;
  };
  reinvestDividends: boolean;
  optimizationSettings: {
    maxIterations: number;
    tolerance: number;
    dampingFactor: number;
  };
  startDate?: string;
  endDate?: string;
}

export interface RiskParityPosition {
  symbol: string;
  targetWeight: number;
  currentWeight: number;
  targetRiskContribution: number;
  currentRiskContribution: number;
  riskBudgetDeviation: number;
  volatility: number;
  targetShares: number;
  currentShares: number;
  currentValue: number;
  needsRebalancing: boolean;
}

export interface RiskBudgetEvent {
  date: string;
  reason: 'scheduled' | 'risk_threshold' | 'volatility_update';
  portfolioValueBefore: number;
  portfolioValueAfter: number;
  totalTransactionCosts: number;
  costBreakdown: {
    fixedCosts: number;
    variableCosts: number;
    numberOfTrades: number;
  };
  riskContributions: {
    before: number[];
    after: number[];
    target: number;
  };
  volatilityUpdate: {
    oldVolatilities: number[];
    newVolatilities: number[];
  };
  maxRiskDeviation: number;
  optimizationDetails: {
    iterations: number;
    converged: boolean;
    finalTolerance: number;
  };
}

export interface RiskParityPerformance {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTransactionCosts: number;
  transactionCostImpact: number;
  rebalancingCount: number;
  avgRiskDeviationBeforeRebalancing: number;
  riskContributionStability: number;
  cumulativeReturns: number[];
  dailyReturns: number[];
  portfolioValues: number[];
  dividendIncome: number;
  finalValue: number;
  diversificationRatio: number;
  effectiveAssetCount: number;
  timeToMaxDrawdown?: number;
  recoveryTime?: number;
}

export interface RiskParityResult {
  strategy: 'RISK_PARITY';
  config: RiskParityConfig;
  positions: RiskParityPosition[];
  performance: RiskParityPerformance;
  riskBudgetHistory: RiskBudgetEvent[];
  timeline: {
    dates: string[];
    portfolioValues: number[];
    weights: number[][];
    riskContributions: number[][];
    volatilities: number[][];
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
    totalOptimizationIterations: number;
    optimizationSuccessRate: number;
  };
}

export class RiskParityStrategyEngine {
  private readonly DEFAULT_RISK_FREE_RATE = 0.02;
  private readonly DEFAULT_MAXiTERATIONS = 1000;
  private readonly DEFAULT_TOLERANCE = 1e-6;
  private readonly DEFAULT_DAMPING_FACTOR = 0.5;
  private readonly DEFAULT_VOLATILITY_LOOKBACK = 63;
  private readonly MIN_WEIGHT = 0.001;
  private readonly MAX_WEIGHT = 0.50;

  public calculateRiskParityStrategy(
    assets: AssetData[],
    config: RiskParityConfig
  ): RiskParityResult | null {
    console.log('🎯 Calculating Risk Parity Strategy...', {
      assets: assets.length,
      initialInvestment: config.initialInvestment,
      rebalanceFrequency: config.rebalanceFrequency,
      riskBudgetThreshold: (config.riskBudgetThreshold * 100).toFixed(1) + '%'
    });

    const startTime = Date.now();

    try {
      this.validateInputs(assets, config);
      const initialPositions = this.initializeRiskParityPositions(assets, config.initialInvestment, config);
      const simulation = this.simulateRiskParityStrategy(assets, initialPositions, config);
      const performance = this.calculatePerformanceMetrics(
        simulation.portfolioValues,
        simulation.dailyReturns,
        simulation.dividendIncome,
        simulation.totalTransactionCosts,
        config.initialInvestment,
        simulation.riskBudgetHistory,
        simulation.weights
      );

      const finalPositions = this.calculateFinalPositions(initialPositions, simulation, assets, config);

      const result: RiskParityResult = {
        strategy: 'RISK_PARITY',
        config,
        positions: finalPositions,
        performance,
        riskBudgetHistory: simulation.riskBudgetHistory,
        timeline: {
          dates: simulation.dates,
          portfolioValues: simulation.portfolioValues,
          weights: simulation.weights,
          riskContributions: simulation.riskContributions,
          volatilities: simulation.volatilities,
          dividends: simulation.dividends,
          transactionCosts: simulation.transactionCosts
        },
        metadata: {
          startDate: simulation.dates[0],
          endDate: simulation.dates[simulation.dates.length - 1],
          totalDays: simulation.dates.length,
          rebalancingDays: simulation.riskBudgetHistory.map((_) => 
            this.getRebalancingDay(index, config.rebalanceFrequency)
          ),
          processingTime: Date.now() - startTime,
          avgDaysPerRebalancing: simulation.dates.length / Math.max(simulation.riskBudgetHistory.length, 1),
          totalOptimizationIterations: simulation.totalOptimizationIterations,
          optimizationSuccessRate: simulation.optimizationSuccessRate
        }
      };

      console.log('✅ Risk Parity Strategy calculated:', {
        totalReturn: (performance.totalReturn * 100).toFixed(2) + '%',
        volatility: (performance.volatility * 100).toFixed(2) + '%',
        rebalancingCount: performance.rebalancingCount,
        diversificationRatio: performance.diversificationRatio.toFixed(3),
        processingTime: `${result.metadata.processingTime}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Risk Parity Strategy:', error);
      return null;
    }
  }

  private validateInputs(assets: AssetData[], config: RiskParityConfig): void {
    if (!assets || assets.length < 2) {
      throw new Error('Risk Parity requires at least 2 assets');
    }
    if (config.initialInvestment <= 0) {
      throw new Error('Initial investment must be positive');
    }
  }

  private initializeRiskParityPositions(
    assets: AssetData[],
    initialInvestment: number,
    config: RiskParityConfig
  ): Array<{
    symbol: string;
    targetShares: number;
    currentShares: number;
    initialValue: number;
    dividendsReceived: number;
  }> {
    const initialWeights = this.calculateRiskParityWeights(assets, config);
    
    return assets.map((asset) => {
      const initialValue = initialInvestment * initialWeights[index];
      const initialPrice = asset.prices?.[0] || 100;
      const targetShares = initialValue / initialPrice;

      return {
        symbol: asset.symbol,
        targetShares,
        currentShares: targetShares,
        initialValue,
        dividendsReceived: 0
      };
    });
  }

  private calculateRiskParityWeights(
    assets: AssetData[],
    config: RiskParityConfig,
    lookbackStart?: number
  ): number[] {
    const n = assets.length;
    const volatilities = assets.map(asset => 
      this.calculateRollingVolatility(asset.returns, config.volatilityLookback, lookbackStart)
    );

    const weights = this.calculateInverseVolatilityWeights(volatilities);
    const covarianceMatrix = this.calculateCovarianceMatrix(assets, config.volatilityLookback, lookbackStart);
    const optimization = this.optimizeRiskParity(weights, covarianceMatrix, config.optimizationSettings);

    return optimization.weights;
  }

  private calculateRollingVolatility(returns: number[], lookback: number, startIndex?: number): number {
    const start = startIndex || returns.length - lookback;
    const end = startIndex ? startIndex + lookback : returns.length;
    const relevantReturns = returns.slice(Math.max(0, start), end);

    if (relevantReturns.length === 0) return 0.01;

    const mean = relevantReturns.reduce((sum, ret) => sum + ret, 0) / relevantReturns.length;
    const variance = relevantReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (relevantReturns.length - 1);
    
    return Math.sqrt(Math.max(variance, 1e-8)) * Math.sqrt(252);
  }

  private calculateInverseVolatilityWeights(volatilities: number[]): number[] {
    const inverseVols = volatilities.map(vol => 1 / Math.max(vol, 0.01));
    const sumInverseVols = inverseVols.reduce((sum, iv) => sum + iv, 0);
    
    return inverseVols.map(iv => Math.max(this.MIN_WEIGHT, Math.min(this.MAX_WEIGHT, iv / sumInverseVols)));
  }

  private calculateCovarianceMatrix(
    assets: AssetData[],
    lookback: number,
    startIndex?: number
  ): number[][] {
    const n = assets.length;
    const covMatrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          const vol = this.calculateRollingVolatility(assets[i].returns, lookback, startIndex);
          covMatrix[i][j] = vol * vol / 252;
        } else {
          covMatrix[i][j] = this.calculateCovariance(
            assets[i].returns,
            assets[j].returns,
            lookback,
            startIndex
          );
        }
      }
    }

    return covMatrix;
  }

  private calculateCovariance(
    returns1: number[],
    returns2: number[],
    lookback: number,
    startIndex?: number
  ): number {
    const start = startIndex || Math.max(returns1.length, returns2.length) - lookback;
    const end = startIndex ? startIndex + lookback : Math.min(returns1.length, returns2.length);
    
    const slice1 = returns1.slice(Math.max(0, start), end);
    const slice2 = returns2.slice(Math.max(0, start), end);
    
    const minLength = Math.min(slice1.length, slice2.length);
    if (minLength === 0) return 0;

    const returns1Slice = slice1.slice(-minLength);
    const returns2Slice = slice2.slice(-minLength);

    const mean1 = returns1Slice.reduce((sum, ret) => sum + ret, 0) / minLength;
    const mean2 = returns2Slice.reduce((sum, ret) => sum + ret, 0) / minLength;

    const covariance = returns1Slice.reduce((sum, ret1, index) => {
      const ret2 = returns2Slice[index];
      return sum + (ret1 - mean1) * (ret2 - mean2);
    }, 0) / (minLength - 1);

    return covariance;
  }

  private optimizeRiskParity(
    initialWeights: number[],
    covarianceMatrix: number[][],
    settings: RiskParityConfig['optimizationSettings']
  ): {
    weights: number[];
    iterations: number;
    converged: boolean;
    finalTolerance: number;
  } {
    let weights = [...initialWeights];
    const n = weights.length;
    const targetRiskContribution = 1 / n;
    let converged = false;
    let iteration = 0;

    for (iteration = 0; iteration < settings.maxIterations; iteration++) {
      const riskContributions = this.calculateRiskContributions(weights, covarianceMatrix);
      
      const adjustments = riskContributions.map(rc => 
        Math.pow(targetRiskContribution / Math.max(rc, 1e-10), settings.dampingFactor)
      );
      
      const newWeights = weights.map((w) => w * adjustments[i]);
      const sumWeights = newWeights.reduce((sum, w) => sum + w, 0);
      const normalizedWeights = newWeights.map(w => 
        Math.max(this.MIN_WEIGHT, Math.min(this.MAX_WEIGHT, w / sumWeights))
      );
      
      const finalSum = normalizedWeights.reduce((sum, w) => sum + w, 0);
      const finalWeights = normalizedWeights.map(w => w / finalSum);
      
      const maxChange = Math.max(...weights.map((w) => Math.abs(w - finalWeights[i])));
      if (maxChange < settings.tolerance) {
        converged = true;
        weights = finalWeights;
        break;
      }
      
      weights = finalWeights;
    }

    return {
      weights,
      iterations: iteration,
      converged,
      finalTolerance: converged ? 0 : Math.max(...weights.map((w) => Math.abs(w - initialWeights[i])))
    };
  }

  private calculateRiskContributions(weights: number[], covarianceMatrix: number[][]): number[] {
    const portfolioVariance = this.calculatePortfolioVariance(weights, covarianceMatrix);
    
    if (portfolioVariance <= 0) {
      return weights.map(() => 1 / weights.length);
    }

    const marginalContributions = this.multiplyMatrixVector(covarianceMatrix, weights);
    
    return weights.map((w) => (w * marginalContributions[i]) / portfolioVariance);
  }

  private calculatePortfolioVariance(weights: number[], covarianceMatrix: number[][]): number {
    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * covarianceMatrix[i][j];
      }
    }
    return Math.max(variance, 1e-16);
  }

  private multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => 
      row.reduce((sum, val, index) => sum + val * vector[index], 0)
    );
  }

  private simulateRiskParityStrategy(
    assets: AssetData[],
    initialPositions: any[],
    config: RiskParityConfig
  ): {
    dates: string[];
    portfolioValues: number[];
    dailyReturns: number[];
    dividendIncome: number;
    totalTransactionCosts: number;
    weights: number[][];
    riskContributions: number[][];
    volatilities: number[][];
    dividends: number[];
    transactionCosts: number[];
    riskBudgetHistory: RiskBudgetEvent[];
    totalOptimizationIterations: number;
    optimizationSuccessRate: number;
  } {
    const maxLength = Math.max(...assets.map(asset => asset.returns.length));
    const dates = this.generateDateRange(maxLength);
    const portfolioValues: number[] = [];
    const dailyReturns: number[] = [];
    const weights: number[][] = [];
    const riskContributions: number[][] = [];
    const volatilities: number[][] = [];
    const dividends: number[] = [];
    const transactionCosts: number[] = [];
    const riskBudgetHistory: RiskBudgetEvent[] = [];
    
    let totalDividendIncome = 0;
    let totalTransactionCosts = 0;
    let totalOptimizationIterations = 0;
    let successfulOptimizations = 0;

    const positions = [...initialPositions];
    const n = assets.length;
    const targetRiskContribution = 1 / n;

    for (let day = 0; day < maxLength; day++) {
      let dailyPortfolioValue = config.initialInvestment;
      let dailyDividends = 0;
      let dailyTransactionCosts = 0;

      if (day > 0) {
        const marketReturn = this.calculateMarketReturn(assets, day);
        dailyPortfolioValue = portfolioValues[day - 1] * (1 + marketReturn);
      }

      const currentWeights: number[] = [];
      const currentVolatilities: number[] = [];
      
      assets.forEach((asset, assetIndex) => {
        if (day < asset.returns.length) {
          const currentPrice = asset.prices?.[day] || this.calculatePriceFromReturns(asset.returns, day, 100);
          const shares = positions[assetIndex].currentShares;
          const assetValue = shares * currentPrice;
          const weight = dailyPortfolioValue > 0 ? assetValue / dailyPortfolioValue : 0;
          
          currentWeights.push(weight);
          
          const vol = this.calculateRollingVolatility(asset.returns, config.volatilityLookback, day - config.volatilityLookback);
          currentVolatilities.push(vol);

          if (day > 0 && day % 63 === 0 && asset.dividendYield && config.reinvestDividends) {
            const quarterlyDividend = (asset.dividendYield / 4) * currentPrice * shares;
            dailyDividends += quarterlyDividend;
            totalDividendIncome += quarterlyDividend;
            positions[assetIndex].dividendsReceived += quarterlyDividend;
          }
        } else {
          currentWeights.push(0);
          currentVolatilities.push(0);
        }
      });

      const covMatrix = this.calculateCovarianceMatrix(assets, config.volatilityLookback, day - config.volatilityLookback);
      const currentRiskContributions = this.calculateRiskContributions(currentWeights, covMatrix);

      const riskDeviations = currentRiskContributions.map(rc => Math.abs(rc - targetRiskContribution));
      const maxRiskDeviation = Math.max(...riskDeviations);

      portfolioValues.push(dailyPortfolioValue);
      weights.push(currentWeights);
      riskContributions.push(currentRiskContributions);
      volatilities.push(currentVolatilities);
      dividends.push(dailyDividends);

      const shouldRebalanceScheduled = this.shouldRebalanceOnSchedule(day, config.rebalanceFrequency);
      const needsRiskRebalancing = maxRiskDeviation > config.riskBudgetThreshold;
      
      if ((shouldRebalanceScheduled || needsRiskRebalancing) && day > config.volatilityLookback) {
        const rebalancingEvent = this.executeRiskParityRebalancing(
          positions,
          assets,
          dailyPortfolioValue,
          day,
          config,
          currentRiskContributions,
          currentVolatilities,
          shouldRebalanceScheduled ? 'scheduled' : 'risk_threshold'
        );

        if (rebalancingEvent) {
          riskBudgetHistory.push(rebalancingEvent);
          dailyTransactionCosts = rebalancingEvent.totalTransactionCosts;
          totalTransactionCosts += dailyTransactionCosts;
          totalOptimizationIterations += rebalancingEvent.optimizationDetails.iterations;
          
          if (rebalancingEvent.optimizationDetails.converged) {
            successfulOptimizations++;
          }
          
          dailyPortfolioValue -= dailyTransactionCosts;
          portfolioValues[day] = dailyPortfolioValue;
        }
      }

      transactionCosts.push(dailyTransactionCosts);

      if (day > 0 && portfolioValues[day - 1] > 0) {
        const dailyReturn = (dailyPortfolioValue - portfolioValues[day - 1]) / portfolioValues[day - 1];
        dailyReturns.push(dailyReturn);
      }
    }

    const optimizationSuccessRate = riskBudgetHistory.length > 0 ? 
      successfulOptimizations / riskBudgetHistory.length : 1;

    return {
      dates,
      portfolioValues,
      dailyReturns,
      dividendIncome: totalDividendIncome,
      totalTransactionCosts,
      weights,
      riskContributions,
      volatilities,
      dividends,
      transactionCosts,
      riskBudgetHistory,
      totalOptimizationIterations,
      optimizationSuccessRate
    };
  }

  private executeRiskParityRebalancing(
    positions: any[],
    assets: AssetData[],
    portfolioValue: number,
    day: number,
    config: RiskParityConfig,
    currentRiskContributions: number[],
    currentVolatilities: number[],
    reason: 'scheduled' | 'risk_threshold' | 'volatility_update'
  ): RiskBudgetEvent | null {
    if (portfolioValue <= 0) return null;

    const newWeights = this.calculateRiskParityWeights(assets, config, day - config.volatilityLookback);
    const covMatrix = this.calculateCovarianceMatrix(assets, config.volatilityLookback, day - config.volatilityLookback);
    const optimization = this.optimizeRiskParity(newWeights, covMatrix, config.optimizationSettings);
    const finalWeights = optimization.weights;
    const newRiskContributions = this.calculateRiskContributions(finalWeights, covMatrix);

    let fixedCosts = 0;
    let variableCosts = 0;
    let numberOfTrades = 0;

    positions.forEach((position, index) => {
      const asset = assets[index];
      if (day < asset.returns.length) {
        const currentPrice = asset.prices?.[day] || this.calculatePriceFromReturns(asset.returns, day, 100);
        const currentValue = position.currentShares * currentPrice;
        const currentWeight = currentValue / portfolioValue;
        const targetWeight = finalWeights[index];
        const weightChange = Math.abs(targetWeight - currentWeight);
        
        if (weightChange > 0.005) {
          numberOfTrades++;
          fixedCosts += config.transactionCosts.fixedCostPerTrade;
          
          const tradedValue = portfolioValue * weightChange;
          variableCosts += tradedValue * config.transactionCosts.variableCostRate;
        }

        const targetValue = portfolioValue * targetWeight;
        const targetShares = targetValue / currentPrice;
        position.currentShares = targetShares;
        position.targetShares = targetShares;
      }
    });

    const totalTransactionCosts = fixedCosts + variableCosts;
    const targetRiskContribution = 1 / assets.length;
    const maxRiskDeviation = Math.max(...currentRiskContributions.map(rc => 
      Math.abs(rc - targetRiskContribution)
    ));

    const oldVolatilities = assets.map(asset => 
      this.calculateRollingVolatility(asset.returns, config.volatilityLookback, day - config.volatilityLookback - 1)
    );

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
      riskContributions: {
        before: [...currentRiskContributions],
        after: [...newRiskContributions],
        target: targetRiskContribution
      },
      volatilityUpdate: {
        oldVolatilities,
        newVolatilities: [...currentVolatilities]
      },
      maxRiskDeviation,
      optimizationDetails: {
        iterations: optimization.iterations,
        converged: optimization.converged,
        finalTolerance: optimization.finalTolerance
      }
    };
  }

  private calculatePerformanceMetrics(
    portfolioValues: number[],
    dailyReturns: number[],
    dividendIncome: number,
    totalTransactionCosts: number,
    initialInvestment: number,
    riskBudgetHistory: RiskBudgetEvent[],
    weights: number[][]
  ): RiskParityPerformance {
    const finalValue = portfolioValues[portfolioValues.length - 1];
    const totalReturn = (finalValue - initialInvestment) / initialInvestment;
    
    const numberOfYears = portfolioValues.length / 252;
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / numberOfYears) - 1;
    
    const volatility = this.calculateStandardDeviation(dailyReturns) * Math.sqrt(252);
    const sharpeRatio = volatility > 0 ? (annualizedReturn - this.DEFAULT_RISK_FREE_RATE) / volatility : 0;
    
    const { maxDrawdown, timeToMaxDrawdown, recoveryTime } = this.calculateDrawdownMetrics(portfolioValues);
    
    const cumulativeReturns = portfolioValues.map(value => (value - initialInvestment) / initialInvestment);
    
    const transactionCostImpact = totalTransactionCosts / initialInvestment;
    const riskContributionStability = this.calculateRiskContributionStability(riskBudgetHistory);
    const { diversificationRatio, effectiveAssetCount } = this.calculateDiversificationMetrics(weights);
    
    const avgRiskDeviationBeforeRebalancing = riskBudgetHistory.length > 0 
      ? riskBudgetHistory.reduce((sum, event) => sum + event.maxRiskDeviation, 0) / riskBudgetHistory.length
      : 0;

    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      totalTransactionCosts,
      transactionCostImpact,
      rebalancingCount: riskBudgetHistory.length,
      avgRiskDeviationBeforeRebalancing,
      riskContributionStability,
      cumulativeReturns,
      dailyReturns,
      portfolioValues,
      dividendIncome,
      finalValue,
      diversificationRatio,
      effectiveAssetCount,
      timeToMaxDrawdown,
      recoveryTime
    };
  }

  private calculateRiskContributionStability(riskBudgetHistory: RiskBudgetEvent[]): number {
    if (riskBudgetHistory.length === 0) return 1;

    const deviations = riskBudgetHistory.map(event => event.maxRiskDeviation);
    const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    
    return Math.max(0, 1 - avgDeviation * 10);
  }

  private calculateDiversificationMetrics(weights: number[][]): {
    diversificationRatio: number;
    effectiveAssetCount: number;
  } {
    if (weights.length === 0) return { diversificationRatio: 1, effectiveAssetCount: 1 };

    const avgWeights = weights[0].map((_) => 
      weights.reduce((sum, w) => sum + w[i], 0) / weights.length
    );

    const effectiveAssetCount = 1 / avgWeights.reduce((sum, w) => sum + w * w, 0);
    const diversificationRatio = Math.sqrt(avgWeights.length) / Math.sqrt(effectiveAssetCount);

    return { diversificationRatio, effectiveAssetCount };
  }

  private calculateFinalPositions(
    initialPositions: any[],
    simulation: any,
    assets: AssetData[],
    config: RiskParityConfig
  ): RiskParityPosition[] {
    const n = assets.length;
    const targetRiskContribution = 1 / n;
    const finalPortfolioValue = simulation.portfolioValues[simulation.portfolioValues.length - 1];
    const finalWeights = simulation.weights[simulation.weights.length - 1];
    const finalRiskContributions = simulation.riskContributions[simulation.riskContributions.length - 1];
    const finalVolatilities = simulation.volatilities[simulation.volatilities.length - 1];

    return initialPositions.map((position) => {
      const asset = assets[index];
      const currentWeight = finalWeights[index] || 0;
      const currentRiskContribution = finalRiskContributions[index] || 0;
      const riskBudgetDeviation = Math.abs(currentRiskContribution - targetRiskContribution);
      const needsRebalancing = riskBudgetDeviation > config.riskBudgetThreshold;
      
      const finalPrice = asset.prices?.[asset.prices.length - 1] || 100;
      const currentValue = position.currentShares * finalPrice;
      const targetValue = finalPortfolioValue * currentWeight;

      return {
        symbol: position.symbol,
        targetWeight: currentWeight,
        currentWeight,
        targetRiskContribution,
        currentRiskContribution,
        riskBudgetDeviation,
        volatility: finalVolatilities[index] || 0,
        targetShares: targetValue / finalPrice,
        currentShares: position.currentShares,
        currentValue,
        needsRebalancing
      };
    });
  }

  // Utility methods
  private shouldRebalanceOnSchedule(day: number, frequency: string): boolean {
    switch (frequency) {
      case 'monthly': return day > 0 && day % 21 === 0;
      case 'quarterly': return day > 0 && day % 63 === 0;
      case 'semi-annually': return day > 0 && day % 126 === 0;
      default: return false;
    }
  }

  private getRebalancingDay(index: number, frequency: string): number {
    switch (frequency) {
      case 'monthly': return (index + 1) * 21;
      case 'quarterly': return (index + 1) * 63;
      case 'semi-annually': return (index + 1) * 126;
      default: return 0;
    }
  }

  private calculateMarketReturn(assets: AssetData[], day: number): number {
    const assetReturns = assets.map(asset => 
      day < asset.returns.length ? asset.returns[day] : 0
    );
    return assetReturns.reduce((sum, ret) => sum + ret, 0) / assets.length;
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
    if (values.length === 0) return 0;
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
