/**
 * MomentumStrategyEngine - Motore Strategia Momentum
 * 
 * Implementa la strategia momentum classica 12-1 mesi:
 * - Calcolo del momentum score (rendimenti 12-1 mesi)
 * - Sistema di ranking e selezione 
 * - Calcolo del turnover del portafoglio
 * - Performance attribution dettagliata
 * - Gestione costi di transazione
 * - Ribilanciamento dinamico
 * 
 * La strategia momentum si basa sul principio che gli asset che hanno 
 * performato bene continueranno a performare bene nel breve-medio termine.
 */

interface AssetData {
  symbol: string;
  name: string;
  prices: number[];
  returns: number[];
  dates: string[];
  dividendYield?: number;
  sector?: string;
  marketCap?: number;
}

interface MomentumConfig {
  // Core Settings
  initialInvestment: number;
  topPercentile: number; // Es. 0.2 per top 20%
  momentumLookback: number; // Mesi per calcolo momentum (default: 12)
  skipMonths: number; // Mesi da skippare (default: 1)
  
  // Rebalancing
  rebalanceFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  
  // Portfolio Construction
  equalWeight: boolean; // True = equal weight, False = momentum-weighted
  maxPositions?: number; // Limite massimo posizioni
  minMomentumScore?: number; // Score minimo per inclusione
  
  // Risk Management
  volatilityThreshold?: number; // Stop se volatility > threshold
  maxDrawdownThreshold?: number; // Stop se drawdown > threshold
  
  // Transaction Costs
  transactionCosts: {
    fixedCostPerTrade: number;
    variableCostRate: number; // % of trade value
  };
  
  // Advanced Options
  reinvestDividends: boolean;
  overlayFilters?: {
    minVolume?: number;
    minMarketCap?: number;
    excludeSectors?: string[];
  };
}

interface MomentumPosition {
  symbol: string;
  shares: number;
  initialValue: number;
  currentValue: number;
  weight: number;
  momentumScore: number;
  rank: number;
  dividendsReceived: number;
  totalReturn: number;
  isActive: boolean;
  entryDate: string;
  exitDate?: string;
  holdingPeriod: number; // Days
}

interface MomentumRebalancingEvent {
  date: string;
  reason: 'scheduled' | 'momentum_update' | 'risk_threshold';
  portfolioValue: number;
  additions: string[]; // New positions
  deletions: string[]; // Removed positions
  weightChanges: { symbol: string; oldWeight: number; newWeight: number; }[];
  transactionCosts: number;
  turnoverRate: number;
  numberOfTrades: number;
  momentumScores: { symbol: string; score: number; rank: number; }[];
  averageMomentumScore: number;
  momentum12m1m: number; // Portfolio momentum score
}

interface MomentumPerformance {
  // Core Returns
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  
  // Momentum-Specific Metrics
  averageMomentumScore: number;
  momentumConsistency: number; // How consistent momentum scores are
  turnoverRate: number; // Annual turnover rate
  averageHoldingPeriod: number; // Days
  
  // Portfolio Composition
  averagePositions: number;
  positionConcentration: number; // Herfindahl index
  sectorConcentration: { [sector: string]: number; };
  
  // Transaction Costs
  totalTransactionCosts: number;
  transactionCostImpact: number; // As % of returns
  costPerTrade: number;
  
  // Risk Metrics
  downside: number;
  upside: number;
  winRate: number; // % of positive periods
  bestMonth: number;
  worstMonth: number;
  
  // Time Series
  cumulativeReturns: number[];
  dailyReturns: number[];
  portfolioValues: number[];
  dividendIncome: number;
  finalValue: number;
  timeToMaxDrawdown: number;
  recoveryTime: number;
}

interface MomentumResult {
  strategy: 'MOMENTUM';
  config: MomentumConfig;
  positions: MomentumPosition[];
  performance: MomentumPerformance;
  rebalancingHistory: MomentumRebalancingEvent[];
  timeline: {
    dates: string[];
    portfolioValues: number[];
    weights: number[][];
    momentumScores: number[][];
    turnover: number[];
    dividends: number[];
    transactionCosts: number[];
  };
  metadata: {
    startDate: string;
    endDate: string;
    totalDays: number;
    rebalanceCount: number;
    processingTime: number;
    averageOptimizationTime: number;
    convergenceRate: number;
  };
}

interface MomentumScreeningResult {
  symbol: string;
  momentumScore: number;
  rank: number;
  returns12m: number;
  returns1m: number;
  volatility: number;
  volume?: number;
  marketCap?: number;
  sector?: string;
  includeInPortfolio: boolean;
  exclusionReason?: string;
}

export class MomentumStrategyEngine {
  private static instance: MomentumStrategyEngine;
  
  private readonly DEFAULT_RISK_FREE_RATE = 0.02;
  private readonly TRADING_DAYS_PER_YEAR = 252;
  private readonly TRADING_DAYS_PER_MONTH = 21;

  constructor() {}

  public static getInstance(): MomentumStrategyEngine {
    if (!MomentumStrategyEngine.instance) {
      MomentumStrategyEngine.instance = new MomentumStrategyEngine();
    }
    return MomentumStrategyEngine.instance;
  }

  /**
   * Implementa la strategia momentum completa
   */
  public calculateMomentumStrategy(
    assets: AssetData[],
    config: MomentumConfig
  ): MomentumResult | null {
    console.log('🚀 Calculating Momentum Strategy...', {
      assets: assets.length,
      topPercentile: config.topPercentile,
      lookback: config.momentumLookback,
      skipMonths: config.skipMonths
    });

    const startTime = performance.now();

    try {
      // 1. Validate inputs
      this.validateInputs(assets, config);

      // 2. Screen assets using momentum criteria
      const screeningResults = this.screenAssetsByMomentum(assets, config);
      
      // 3. Initialize portfolio positions
      const initialPositions = this.initializePositions(screeningResults, config);
      
      // 4. Run momentum strategy simulation
      const simulation = this.simulateMomentumStrategy(
        assets, 
        initialPositions, 
        config
      );
      
      // 5. Calculate performance metrics
      const performance = this.calculatePerformanceMetrics(
        simulation.portfolioValues,
        simulation.dailyReturns,
        simulation.dividendIncome,
        simulation.totalTransactionCosts,
        config.initialInvestment,
        simulation.rebalancingHistory,
        simulation.weights,
        simulation.momentumScores
      );
      
      // 6. Calculate final positions
      const finalPositions = this.calculateFinalPositions(
        initialPositions,
        simulation,
        assets,
        config
      );

      const result: MomentumResult = {
        strategy: 'MOMENTUM',
        config,
        positions: finalPositions,
        performance,
        rebalancingHistory: simulation.rebalancingHistory,
        timeline: {
          dates: simulation.dates,
          portfolioValues: simulation.portfolioValues,
          weights: simulation.weights,
          momentumScores: simulation.momentumScores,
          turnover: simulation.turnover,
          dividends: simulation.dividends,
          transactionCosts: simulation.transactionCosts
        },
        metadata: {
          startDate: simulation.dates[0],
          endDate: simulation.dates[simulation.dates.length - 1],
          totalDays: simulation.dates.length,
          rebalanceCount: simulation.rebalancingHistory.length,
          processingTime: performance.now() - startTime,
          averageOptimizationTime: simulation.totalOptimizationTime / Math.max(simulation.rebalancingHistory.length, 1),
          convergenceRate: simulation.optimizationSuccessRate
        }
      };

      console.log('✅ Momentum Strategy calculated:', {
        totalReturn: (performance.totalReturn * 100).toFixed(2) + '%',
        annualizedReturn: (performance.annualizedReturn * 100).toFixed(2) + '%',
        volatility: (performance.volatility * 100).toFixed(2) + '%',
        sharpeRatio: performance.sharpeRatio.toFixed(3),
        turnoverRate: (performance.turnoverRate * 100).toFixed(2) + '%',
        avgMomentumScore: (performance.averageMomentumScore * 100).toFixed(2) + '%',
        avgPositions: performance.averagePositions.toFixed(1),
        transactionCostImpact: (performance.transactionCostImpact * 100).toFixed(2) + '%',
        processingTime: `${result.metadata.processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Momentum Strategy:', error);
      return null;
    }
  }

  /**
   * Screen assets using momentum criteria (12-1 month)
   */
  private screenAssetsByMomentum(
    assets: AssetData[],
    config: MomentumConfig
  ): MomentumScreeningResult[] {
    const momentumScores: MomentumScreeningResult[] = [];
    
    const lookbackDays = config.momentumLookback * this.TRADING_DAYS_PER_MONTH;
    const skipDays = config.skipMonths * this.TRADING_DAYS_PER_MONTH;

    assets.forEach(asset => {
      try {
        if (asset.returns.length < lookbackDays + skipDays) {
          return; // Skip if insufficient data
        }

        // Calculate 12-1 month momentum
        const endIndex = asset.returns.length - skipDays - 1;
        const startIndex = Math.max(0, endIndex - lookbackDays);
        
        if (startIndex >= endIndex) return;

        // Calculate momentum score (cumulative return over the period)
        let momentumScore = 0;
        for (let i = startIndex; i <= endIndex; i++) {
          momentumScore += asset.returns[i];
        }

        // Calculate 12-month and 1-month returns for analysis
        const returns12m = momentumScore;
        const returns1m = asset.returns.slice(-this.TRADING_DAYS_PER_MONTH).reduce((sum, ret) => sum + ret, 0);

        // Calculate volatility over momentum period
        const momentumReturns = asset.returns.slice(startIndex, endIndex + 1);
        const volatility = this.calculateStandardDeviation(momentumReturns) * Math.sqrt(this.TRADING_DAYS_PER_YEAR);

        let includeInPortfolio = true;
        let exclusionReason: string | undefined;

        // Apply filters
        if (config.minMomentumScore && momentumScore < config.minMomentumScore) {
          includeInPortfolio = false;
          exclusionReason = 'Below minimum momentum score';
        }

        if (config.overlayFilters?.excludeSectors?.includes(asset.sector || '')) {
          includeInPortfolio = false;
          exclusionReason = 'Sector excluded';
        }

        if (config.overlayFilters?.minMarketCap && (asset.marketCap || 0) < config.overlayFilters.minMarketCap) {
          includeInPortfolio = false;
          exclusionReason = 'Market cap too small';
        }

        momentumScores.push({
          symbol: asset.symbol,
          momentumScore,
          rank: 0, // Will be set after sorting
          returns12m,
          returns1m,
          volatility,
          volume: undefined, // Would need volume data
          marketCap: asset.marketCap,
          sector: asset.sector,
          includeInPortfolio,
          exclusionReason
        });

      } catch (error) {
        console.warn(`⚠️ Error calculating momentum for ${asset.symbol}:`, error);
      }
    });

    // Sort by momentum score (descending) and assign ranks
    momentumScores.sort((a, b) => b.momentumScore - a.momentumScore);
    momentumScores.forEach((result, index) => {
      result.rank = index + 1;
    });

    // Apply top percentile filter
    const topCount = Math.ceil(momentumScores.length * config.topPercentile);
    const maxPositions = config.maxPositions || topCount;
    const finalTopCount = Math.min(topCount, maxPositions);

    momentumScores.forEach((result, index) => {
      if (index >= finalTopCount) {
        result.includeInPortfolio = false;
        result.exclusionReason = result.exclusionReason || 'Not in top percentile';
      }
    });

    console.log('📊 Momentum Screening Results:', {
      totalAssets: assets.length,
      validAssets: momentumScores.length,
      selectedAssets: momentumScores.filter(r => r.includeInPortfolio).length,
      avgMomentumScore: (momentumScores.reduce((sum, r) => sum + r.momentumScore, 0) / momentumScores.length * 100).toFixed(2) + '%',
      topMomentumScore: (momentumScores[0]?.momentumScore * 100).toFixed(2) + '%',
      bottomMomentumScore: (momentumScores[momentumScores.length - 1]?.momentumScore * 100).toFixed(2) + '%'
    });

    return momentumScores;
  }

  /**
   * Initialize portfolio positions based on screening results
   */
  private initializePositions(
    screeningResults: MomentumScreeningResult[],
    config: MomentumConfig
  ): any[] {
    const selectedAssets = screeningResults.filter(result => result.includeInPortfolio);
    
    if (selectedAssets.length === 0) {
      throw new Error('No assets selected for momentum portfolio');
    }

    const positions: any[] = [];
    
    selectedAssets.forEach(assetResult => {
      let weight: number;
      
      if (config.equalWeight) {
        weight = 1 / selectedAssets.length;
      } else {
        // Momentum-weighted: weight proportional to momentum score
        const totalMomentumScore = selectedAssets.reduce((sum, a) => sum + Math.max(0, a.momentumScore), 0);
        weight = totalMomentumScore > 0 ? Math.max(0, assetResult.momentumScore) / totalMomentumScore : 0;
      }

      const initialValue = config.initialInvestment * weight;
      
      positions.push({
        symbol: assetResult.symbol,
        currentShares: 0, // Will be calculated during simulation
        targetShares: 0,
        initialValue,
        currentValue: initialValue,
        weight,
        momentumScore: assetResult.momentumScore,
        rank: assetResult.rank,
        dividendsReceived: 0,
        isActive: true,
        entryDate: '',
        holdingPeriod: 0
      });
    });

    console.log('💼 Initial Momentum Portfolio:', {
      positions: positions.length,
      avgWeight: (100 / positions.length).toFixed(2) + '%',
      totalWeight: positions.reduce((sum, p) => sum + p.weight, 0).toFixed(4),
      avgMomentumScore: (positions.reduce((sum, p) => sum + p.momentumScore, 0) / positions.length * 100).toFixed(2) + '%'
    });

    return positions;
  }

  /**
   * Simula la strategia momentum nel tempo
   */
  private simulateMomentumStrategy(
    assets: AssetData[],
    initialPositions: any[],
    config: MomentumConfig
  ): {
    dates: string[];
    portfolioValues: number[];
    dailyReturns: number[];
    dividendIncome: number;
    totalTransactionCosts: number;
    weights: number[][];
    momentumScores: number[][];
    turnover: number[];
    dividends: number[];
    transactionCosts: number[];
    rebalancingHistory: MomentumRebalancingEvent[];
    totalOptimizationTime: number;
    optimizationSuccessRate: number;
  } {
    const maxLength = Math.max(...assets.map(asset => asset.returns.length));
    const positions = [...initialPositions];
    
    const portfolioValues: number[] = [];
    const dailyReturns: number[] = [];
    const weights: number[][] = [];
    const momentumScores: number[][] = [];
    const turnover: number[] = [];
    const dividends: number[] = [];
    const transactionCosts: number[] = [];
    const dates: string[] = [];
    
    let totalDividendIncome = 0;
    let totalTransactionCosts = 0;
    let totalOptimizationTime = 0;
    let optimizationSuccessCount = 0;
    
    const rebalancingHistory: MomentumRebalancingEvent[] = [];
    
    // Get rebalance frequency in days
    const rebalanceFrequencyDays = this.getRebalanceFrequencyDays(config.rebalanceFrequency);
    let lastRebalanceDay = 0;

    for (let day = 0; day < maxLength; day++) {
      let dailyPortfolioValue = config.initialInvestment;
      let dailyDividends = 0;
      let dailyTransactionCosts = 0;
      let dailyTurnover = 0;

      // Calculate current date
      const currentDate = assets[0]?.dates?.[day] || `Day ${day + 1}`;
      dates.push(currentDate);

      // Calculate portfolio value based on returns
      if (day > 0) {
        const marketReturn = this.calculateWeightedPortfolioReturn(assets, positions, day);
        dailyPortfolioValue = portfolioValues[day - 1] * (1 + marketReturn);
        dailyReturns.push(marketReturn);
      } else {
        dailyReturns.push(0);
      }

      // Update positions and calculate weights
      const currentWeights: number[] = [];
      const currentMomentumScores: number[] = [];
      let totalValue = 0;

      positions.forEach((position, index) => {
        const asset = assets.find(a => a.symbol === position.symbol);
        if (asset && day < asset.returns.length) {
          const currentPrice = asset.prices?.[day] || this.calculatePriceFromReturns(asset.returns, day, 100);
          const shares = position.currentShares || 0;
          const assetValue = shares * currentPrice;
          totalValue += assetValue;
          position.currentValue = assetValue;
          position.holdingPeriod = day - (position.entryDay || 0);
        }
      });

      if (totalValue === 0) totalValue = dailyPortfolioValue;

      positions.forEach((position, index) => {
        const weight = totalValue > 0 ? position.currentValue / totalValue : 0;
        currentWeights.push(weight);
        currentMomentumScores.push(position.momentumScore || 0);
      });

      // Fill remaining weights with zeros for consistent matrix dimensions
      while (currentWeights.length < assets.length) {
        currentWeights.push(0);
        currentMomentumScores.push(0);
      }

      weights.push(currentWeights);
      momentumScores.push(currentMomentumScores);

      // Handle dividends (quarterly)
      if (day > 0 && day % 63 === 0 && config.reinvestDividends) {
        positions.forEach(position => {
          const asset = assets.find(a => a.symbol === position.symbol);
          if (asset && asset.dividendYield && position.currentShares > 0) {
            const currentPrice = asset.prices?.[day] || this.calculatePriceFromReturns(asset.returns, day, 100);
            const quarterlyDividend = (asset.dividendYield / 4) * currentPrice * position.currentShares;
            dailyDividends += quarterlyDividend;
            totalDividendIncome += quarterlyDividend;
            position.dividendsReceived += quarterlyDividend;
          }
        });
      }

      // Check if rebalancing is needed
      const shouldRebalance = this.shouldRebalance(day, lastRebalanceDay, rebalanceFrequencyDays, config);
      
      if (shouldRebalance) {
        const rebalanceStartTime = performance.now();
        
        const rebalancingEvent = this.executeMomentumRebalancing(
          positions,
          assets,
          dailyPortfolioValue,
          day,
          config,
          currentDate
        );
        
        if (rebalancingEvent) {
          rebalancingHistory.push(rebalancingEvent);
          dailyTransactionCosts += rebalancingEvent.transactionCosts;
          totalTransactionCosts += rebalancingEvent.transactionCosts;
          dailyTurnover = rebalancingEvent.turnoverRate;
          lastRebalanceDay = day;
          optimizationSuccessCount++;
        }
        
        totalOptimizationTime += performance.now() - rebalanceStartTime;
      }

      portfolioValues.push(dailyPortfolioValue);
      dividends.push(dailyDividends);
      transactionCosts.push(dailyTransactionCosts);
      turnover.push(dailyTurnover);
    }

    const optimizationSuccessRate = rebalancingHistory.length > 0 ? optimizationSuccessCount / rebalancingHistory.length : 1;

    return {
      dates,
      portfolioValues,
      dailyReturns,
      dividendIncome: totalDividendIncome,
      totalTransactionCosts,
      weights,
      momentumScores,
      turnover,
      dividends,
      transactionCosts,
      rebalancingHistory,
      totalOptimizationTime,
      optimizationSuccessRate
    };
  }

  /**
   * Execute momentum rebalancing
   */
  private executeMomentumRebalancing(
    positions: any[],
    assets: AssetData[],
    portfolioValue: number,
    day: number,
    config: MomentumConfig,
    currentDate: string
  ): MomentumRebalancingEvent | null {
    if (portfolioValue <= 0) return null;

    // Re-screen assets for new momentum rankings
    const screeningResults = this.screenAssetsByMomentum(assets, config);
    const selectedAssets = screeningResults.filter(r => r.includeInPortfolio);
    
    if (selectedAssets.length === 0) return null;

    // Track changes
    const oldSymbols = positions.filter(p => p.isActive).map(p => p.symbol);
    const newSymbols = selectedAssets.map(r => r.symbol);
    
    const additions = newSymbols.filter(s => !oldSymbols.includes(s));
    const deletions = oldSymbols.filter(s => !newSymbols.includes(s));
    
    // Calculate new weights
    const newWeights: { [symbol: string]: number } = {};
    selectedAssets.forEach(assetResult => {
      if (config.equalWeight) {
        newWeights[assetResult.symbol] = 1 / selectedAssets.length;
      } else {
        const totalMomentumScore = selectedAssets.reduce((sum, a) => sum + Math.max(0, a.momentumScore), 0);
        newWeights[assetResult.symbol] = totalMomentumScore > 0 ? Math.max(0, assetResult.momentumScore) / totalMomentumScore : 0;
      }
    });

    // Calculate transaction costs and turnover
    let fixedCosts = 0;
    let variableCosts = 0;
    let numberOfTrades = 0;
    let totalTurnover = 0;
    
    const weightChanges: { symbol: string; oldWeight: number; newWeight: number; }[] = [];

    // Update existing positions
    positions.forEach(position => {
      const oldWeight = position.weight || 0;
      const newWeight = newWeights[position.symbol] || 0;
      
      if (newWeight === 0) {
        // Position being closed
        position.isActive = false;
        position.exitDate = currentDate;
        numberOfTrades++;
        fixedCosts += config.transactionCosts.fixedCostPerTrade;
        const tradedValue = portfolioValue * oldWeight;
        variableCosts += tradedValue * config.transactionCosts.variableCostRate;
        totalTurnover += oldWeight;
      } else if (Math.abs(newWeight - oldWeight) > 0.005) {
        // Position being adjusted
        numberOfTrades++;
        fixedCosts += config.transactionCosts.fixedCostPerTrade;
        const tradedValue = portfolioValue * Math.abs(newWeight - oldWeight);
        variableCosts += tradedValue * config.transactionCosts.variableCostRate;
        totalTurnover += Math.abs(newWeight - oldWeight);
      }
      
      position.weight = newWeight;
      
      if (oldWeight !== newWeight) {
        weightChanges.push({
          symbol: position.symbol,
          oldWeight,
          newWeight
        });
      }
    });

    // Add new positions
    additions.forEach(symbol => {
      const asset = assets.find(a => a.symbol === symbol);
      const assetResult = selectedAssets.find(r => r.symbol === symbol);
      
      if (asset && assetResult) {
        const newWeight = newWeights[symbol];
        const initialValue = portfolioValue * newWeight;
        
        positions.push({
          symbol,
          currentShares: 0,
          targetShares: 0,
          initialValue,
          currentValue: initialValue,
          weight: newWeight,
          momentumScore: assetResult.momentumScore,
          rank: assetResult.rank,
          dividendsReceived: 0,
          isActive: true,
          entryDate: currentDate,
          entryDay: day,
          holdingPeriod: 0
        });
        
        numberOfTrades++;
        fixedCosts += config.transactionCosts.fixedCostPerTrade;
        const tradedValue = portfolioValue * newWeight;
        variableCosts += tradedValue * config.transactionCosts.variableCostRate;
        totalTurnover += newWeight;
        
        weightChanges.push({
          symbol,
          oldWeight: 0,
          newWeight
        });
      }
    });

    // Update shares for all active positions
    positions.filter(p => p.isActive).forEach(position => {
      const asset = assets.find(a => a.symbol === position.symbol);
      if (asset && day < asset.returns.length) {
        const currentPrice = asset.prices?.[day] || this.calculatePriceFromReturns(asset.returns, day, 100);
        const targetValue = portfolioValue * position.weight;
        const targetShares = currentPrice > 0 ? targetValue / currentPrice : 0;
        position.currentShares = targetShares;
        position.targetShares = targetShares;
      }
    });

    const totalCosts = fixedCosts + variableCosts;
    const averageMomentumScore = selectedAssets.reduce((sum, a) => sum + a.momentumScore, 0) / selectedAssets.length;
    
    // Calculate portfolio momentum score (weighted average)
    const momentum12m1m = selectedAssets.reduce((sum, a) => sum + a.momentumScore * newWeights[a.symbol], 0);

    return {
      date: currentDate,
      reason: 'scheduled',
      portfolioValue,
      additions,
      deletions,
      weightChanges,
      transactionCosts: totalCosts,
      turnoverRate: totalTurnover,
      numberOfTrades,
      momentumScores: selectedAssets.map(a => ({
        symbol: a.symbol,
        score: a.momentumScore,
        rank: a.rank
      })),
      averageMomentumScore,
      momentum12m1m
    };
  }

  /**
   * Check if rebalancing should occur
   */
  private shouldRebalance(
    currentDay: number, 
    lastRebalanceDay: number, 
    rebalanceFrequencyDays: number,
    config: MomentumConfig
  ): boolean {
    return (currentDay - lastRebalanceDay) >= rebalanceFrequencyDays;
  }

  /**
   * Get rebalance frequency in trading days
   */
  private getRebalanceFrequencyDays(frequency: string): number {
    switch (frequency) {
      case 'monthly': return this.TRADING_DAYS_PER_MONTH;
      case 'quarterly': return this.TRADING_DAYS_PER_MONTH * 3;
      case 'semi-annual': return this.TRADING_DAYS_PER_MONTH * 6;
      case 'annual': return this.TRADING_DAYS_PER_MONTH * 12;
      default: return this.TRADING_DAYS_PER_MONTH * 3; // Default to quarterly
    }
  }

  /**
   * Calculate weighted portfolio return for a given day
   */
  private calculateWeightedPortfolioReturn(assets: AssetData[], positions: any[], day: number): number {
    let portfolioReturn = 0;
    let totalWeight = 0;

    positions.filter(p => p.isActive).forEach(position => {
      const asset = assets.find(a => a.symbol === position.symbol);
      if (asset && day < asset.returns.length && position.weight > 0) {
        portfolioReturn += asset.returns[day] * position.weight;
        totalWeight += position.weight;
      }
    });

    return totalWeight > 0 ? portfolioReturn / totalWeight : 0;
  }

  /**
   * Calculate price from returns array
   */
  private calculatePriceFromReturns(returns: number[], day: number, basePrice: number): number {
    let price = basePrice;
    for (let i = 0; i <= Math.min(day, returns.length - 1); i++) {
      price *= (1 + returns[i]);
    }
    return price;
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
    rebalancingHistory: MomentumRebalancingEvent[],
    weights: number[][],
    momentumScores: number[][]
  ): MomentumPerformance {
    const finalValue = portfolioValues[portfolioValues.length - 1];
    const totalReturn = (finalValue - initialInvestment) / initialInvestment;
    
    const numberOfYears = portfolioValues.length / this.TRADING_DAYS_PER_YEAR;
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / numberOfYears) - 1;
    
    const volatility = this.calculateStandardDeviation(dailyReturns) * Math.sqrt(this.TRADING_DAYS_PER_YEAR);
    const sharpeRatio = volatility > 0 ? (annualizedReturn - this.DEFAULT_RISK_FREE_RATE) / volatility : 0;
    
    const { maxDrawdown, timeToMaxDrawdown, recoveryTime } = this.calculateDrawdownMetrics(portfolioValues);
    
    const cumulativeReturns = portfolioValues.map(value => (value - initialInvestment) / initialInvestment);
    
    // Momentum-specific metrics
    const averageMomentumScore = rebalancingHistory.length > 0 
      ? rebalancingHistory.reduce((sum, event) => sum + event.averageMomentumScore, 0) / rebalancingHistory.length
      : 0;
    
    const momentumConsistency = this.calculateMomentumConsistency(momentumScores);
    
    const turnoverRate = rebalancingHistory.length > 0 
      ? rebalancingHistory.reduce((sum, event) => sum + event.turnoverRate, 0) / rebalancingHistory.length * (this.TRADING_DAYS_PER_YEAR / this.getRebalanceFrequencyDays('quarterly'))
      : 0;
    
    const averageHoldingPeriod = this.calculateAverageHoldingPeriod(rebalancingHistory);
    const averagePositions = this.calculateAveragePositions(weights);
    const positionConcentration = this.calculatePositionConcentration(weights);
    
    const transactionCostImpact = totalTransactionCosts / initialInvestment;
    const costPerTrade = rebalancingHistory.reduce((sum, event) => sum + event.numberOfTrades, 0) > 0 
      ? totalTransactionCosts / rebalancingHistory.reduce((sum, event) => sum + event.numberOfTrades, 0)
      : 0;
    
    // Risk metrics
    const positiveReturns = dailyReturns.filter(r => r > 0);
    const negativeReturns = dailyReturns.filter(r => r < 0);
    
    const upside = positiveReturns.length > 0 ? this.calculateMean(positiveReturns) * this.TRADING_DAYS_PER_YEAR : 0;
    const downside = negativeReturns.length > 0 ? Math.abs(this.calculateMean(negativeReturns)) * this.TRADING_DAYS_PER_YEAR : 0;
    const winRate = positiveReturns.length / dailyReturns.length;
    
    const bestMonth = Math.max(...this.calculateMonthlyReturns(dailyReturns));
    const worstMonth = Math.min(...this.calculateMonthlyReturns(dailyReturns));

    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      averageMomentumScore,
      momentumConsistency,
      turnoverRate,
      averageHoldingPeriod,
      averagePositions,
      positionConcentration,
      sectorConcentration: {}, // Would need sector data
      totalTransactionCosts,
      transactionCostImpact,
      costPerTrade,
      downside,
      upside,
      winRate,
      bestMonth,
      worstMonth,
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
    assets: AssetData[],
    config: MomentumConfig
  ): MomentumPosition[] {
    return initialPositions.map(position => {
      const asset = assets.find(a => a.symbol === position.symbol);
      if (!asset) {
        return {
          symbol: position.symbol,
          shares: position.currentShares || 0,
          initialValue: position.initialValue,
          currentValue: position.currentValue || 0,
          weight: position.weight || 0,
          momentumScore: position.momentumScore || 0,
          rank: position.rank || 0,
          dividendsReceived: position.dividendsReceived || 0,
          totalReturn: 0,
          isActive: position.isActive || false,
          entryDate: position.entryDate || '',
          exitDate: position.exitDate,
          holdingPeriod: position.holdingPeriod || 0
        };
      }

      const totalReturn = position.currentValue > 0 
        ? (position.currentValue + position.dividendsReceived - position.initialValue) / position.initialValue
        : 0;

      return {
        symbol: position.symbol,
        shares: position.currentShares || 0,
        initialValue: position.initialValue,
        currentValue: position.currentValue || 0,
        weight: position.weight || 0,
        momentumScore: position.momentumScore || 0,
        rank: position.rank || 0,
        dividendsReceived: position.dividendsReceived || 0,
        totalReturn,
        isActive: position.isActive || false,
        entryDate: position.entryDate || '',
        exitDate: position.exitDate,
        holdingPeriod: position.holdingPeriod || 0
      };
    });
  }

  // Utility methods
  private validateInputs(assets: AssetData[], config: MomentumConfig): void {
    if (!assets || assets.length === 0) {
      throw new Error('No assets provided');
    }

    if (config.topPercentile <= 0 || config.topPercentile > 1) {
      throw new Error('topPercentile must be between 0 and 1');
    }

    if (config.initialInvestment <= 0) {
      throw new Error('initialInvestment must be positive');
    }

    const minDataPoints = config.momentumLookback * this.TRADING_DAYS_PER_MONTH + config.skipMonths * this.TRADING_DAYS_PER_MONTH;
    const validAssets = assets.filter(asset => asset.returns && asset.returns.length >= minDataPoints);
    
    if (validAssets.length === 0) {
      throw new Error(`No assets have sufficient data (need at least ${minDataPoints} data points)`);
    }
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    
    return Math.sqrt(variance);
  }

  private calculateMean(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculateDrawdownMetrics(portfolioValues: number[]): {
    maxDrawdown: number;
    timeToMaxDrawdown: number;
    recoveryTime: number;
  } {
    let maxDrawdown = 0;
    let timeToMaxDrawdown = 0;
    let recoveryTime = 0;
    let peak = portfolioValues[0];
    let maxDrawdownIndex = 0;

    for (let i = 1; i < portfolioValues.length; i++) {
      if (portfolioValues[i] > peak) {
        peak = portfolioValues[i];
      }
      
      const drawdown = (peak - portfolioValues[i]) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownIndex = i;
      }
    }

    // Find peak before max drawdown
    let peakIndex = 0;
    for (let i = 0; i <= maxDrawdownIndex; i++) {
      if (portfolioValues[i] > portfolioValues[peakIndex]) {
        peakIndex = i;
      }
    }
    
    timeToMaxDrawdown = maxDrawdownIndex - peakIndex;

    // Find recovery after max drawdown
    const peakValue = portfolioValues[peakIndex];
    for (let i = maxDrawdownIndex + 1; i < portfolioValues.length; i++) {
      if (portfolioValues[i] >= peakValue) {
        recoveryTime = i - maxDrawdownIndex;
        break;
      }
    }
    
    if (recoveryTime === 0 && maxDrawdownIndex < portfolioValues.length - 1) {
      recoveryTime = portfolioValues.length - 1 - maxDrawdownIndex; // Still recovering
    }

    return { maxDrawdown, timeToMaxDrawdown, recoveryTime };
  }

  private calculateMomentumConsistency(momentumScores: number[][]): number {
    if (momentumScores.length === 0) return 0;
    
    // Calculate standard deviation of average momentum scores over time
    const avgScores = momentumScores.map(scores => 
      scores.reduce((sum, score) => sum + score, 0) / Math.max(scores.length, 1)
    );
    
    const mean = this.calculateMean(avgScores);
    const std = this.calculateStandardDeviation(avgScores);
    
    return std > 0 ? mean / std : 0; // Higher is more consistent
  }

  private calculateAverageHoldingPeriod(rebalancingHistory: MomentumRebalancingEvent[]): number {
    if (rebalancingHistory.length <= 1) return 0;
    
    const periods = [];
    for (let i = 1; i < rebalancingHistory.length; i++) {
      // Approximate days between rebalancing events
      periods.push(63); // Assume quarterly rebalancing
    }
    
    return this.calculateMean(periods);
  }

  private calculateAveragePositions(weights: number[][]): number {
    if (weights.length === 0) return 0;
    
    const positionCounts = weights.map(weightArray => 
      weightArray.filter(w => w > 0.001).length // Count positions > 0.1%
    );
    
    return this.calculateMean(positionCounts);
  }

  private calculatePositionConcentration(weights: number[][]): number {
    if (weights.length === 0) return 0;
    
    // Calculate average Herfindahl index
    const herfindahlIndices = weights.map(weightArray => {
      const activeWeights = weightArray.filter(w => w > 0);
      return activeWeights.reduce((sum, w) => sum + (w * w), 0);
    });
    
    return this.calculateMean(herfindahlIndices);
  }

  private calculateMonthlyReturns(dailyReturns: number[]): number[] {
    const monthlyReturns = [];
    
    for (let i = 0; i < dailyReturns.length; i += this.TRADING_DAYS_PER_MONTH) {
      const monthReturns = dailyReturns.slice(i, i + this.TRADING_DAYS_PER_MONTH);
      if (monthReturns.length > 0) {
        // Calculate compound monthly return
        const monthlyReturn = monthReturns.reduce((product, ret) => product * (1 + ret), 1) - 1;
        monthlyReturns.push(monthlyReturn);
      }
    }
    
    return monthlyReturns;
  }
}

export default MomentumStrategyEngine;
