/**
 * OptimizationConstraintsEngine - Sistema Avanzato Vincoli di Ottimizzazione
 * 
 * Implementa un sistema professionale di vincoli per l'ottimizzazione portfolio:
 * - Weight bounds (limiti peso 0-25%)
 * - Long-only constraints (solo posizioni lunghe)
 * - Sector concentration limits (max 40% per settore)
 * - Transaction costs consideration (costi realistici)
 */

export interface AssetData {
  symbol: string;
  name: string;
  expectedReturn: number;
  volatility: number;
  returns: number[];
  sector?: string;
  marketCap?: number;
  assetType?: 'STOCK' | 'ETF' | 'BOND' | 'COMMODITY';
}

export interface ExtendedConstraints {
  // Weight bounds
  minWeight?: number;           // Default: 0.0 (long-only)
  maxWeight?: number;           // Default: 0.25 (25% max per asset)
  sumWeights?: number;          // Default: 1.0 (100% invested)
  
  // Sector constraints
  maxSectorConcentration?: number; // Default: 0.40 (40% max per sector)
  sectorLimits?: Record<string, number>; // Custom limits per sector
  
  // Transaction costs
  includeTransactionCosts?: boolean; // Default: true
  fixedTransactionCost?: number;     // Default: 4.95 USD per trade
  variableTransactionCost?: number;  // Default: 0.005 (0.5% of trade value)
  
  // Advanced constraints
  minDiversification?: number;       // Minimum number of assets
  maxConcentration?: number;         // Max weight in top N assets
  turnoverLimit?: number;           // Max portfolio turnover vs current
  
  // Constraint priorities (when conflicts arise)
  constraintPriority?: ConstraintPriority;
}

export interface ConstraintPriority {
  sumWeights: number;      // Priority 1-10 (10 = highest)
  weightBounds: number;    // Priority 1-10
  sectorLimits: number;    // Priority 1-10
  diversification: number; // Priority 1-10
}

export interface ConstraintValidationResult {
  isValid: boolean;
  violations: ConstraintViolation[];
  adjustedWeights: number[];
  originalWeights: number[];
  adjustmentSummary: {
    totalAdjustment: number;
    affectedAssets: number;
    relaxedConstraints: string[];
  };
}

export interface ConstraintViolation {
  type: 'WEIGHT_BOUND' | 'SECTOR_CONCENTRATION' | 'SUM_WEIGHTS' | 'DIVERSIFICATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  violatingAssets: string[];
  currentValue: number;
  limitValue: number;
  suggestedAction: string;
}

export interface TransactionCostAnalysis {
  totalTransactionCosts: number;
  costBreakdown: {
    fixedCosts: number;
    variableCosts: number;
    numberOfTrades: number;
  };
  netReturn: number;
  costImpactPercent: number;
  recommendations: string[];
}

export interface SectorAllocation {
  sector: string;
  totalWeight: number;
  assets: {
    symbol: string;
    weight: number;
    contribution: number;
  }[];
  concentration: number;
  withinLimits: boolean;
}

// Comprehensive sector mapping database
const SECTOR_DATABASE: Record<string, string> = {
  // Technology
  'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'GOOG': 'Technology',
  'NVDA': 'Technology', 'META': 'Technology', 'AMD': 'Technology',
  'INTC': 'Technology', 'ORCL': 'Technology', 'CRM': 'Technology', 'ADBE': 'Technology',
  'AVGO': 'Technology', 'TXN': 'Technology', 'QCOM': 'Technology', 'IBM': 'Technology',
  
  // Financial Services
  'JPM': 'Financial Services', 'BAC': 'Financial Services', 'WFC': 'Financial Services',
  'GS': 'Financial Services', 'MS': 'Financial Services', 'C': 'Financial Services',
  'V': 'Financial Services', 'MA': 'Financial Services', 'PYPL': 'Financial Services',
  'AXP': 'Financial Services', 'BRK.B': 'Financial Services', 'SPGI': 'Financial Services',
  
  // Healthcare
  'JNJ': 'Healthcare', 'PFE': 'Healthcare', 'UNH': 'Healthcare', 'ABBV': 'Healthcare',
  'MRK': 'Healthcare', 'TMO': 'Healthcare', 'ABT': 'Healthcare', 'LLY': 'Healthcare',
  'DHR': 'Healthcare', 'BMY': 'Healthcare', 'AMGN': 'Healthcare', 'GILD': 'Healthcare',
  
  // Consumer Cyclical
  'AMZN': 'Consumer Cyclical', 'TSLA': 'Consumer Cyclical', 'HD': 'Consumer Cyclical',
  'MCD': 'Consumer Cyclical', 'NKE': 'Consumer Cyclical', 'SBUX': 'Consumer Cyclical',
  'TGT': 'Consumer Cyclical', 'LOW': 'Consumer Cyclical', 'TJX': 'Consumer Cyclical',
  
  // Consumer Defensive
  'WMT': 'Consumer Defensive', 'PG': 'Consumer Defensive', 'KO': 'Consumer Defensive',
  'PEP': 'Consumer Defensive', 'COST': 'Consumer Defensive', 'CL': 'Consumer Defensive',
  'WBA': 'Consumer Defensive', 'KR': 'Consumer Defensive', 'MDLZ': 'Consumer Defensive',
  
  // Energy
  'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'EOG': 'Energy',
  'SLB': 'Energy', 'MPC': 'Energy', 'PSX': 'Energy', 'VLO': 'Energy',
  
  // Industrials
  'BA': 'Industrials', 'CAT': 'Industrials', 'GE': 'Industrials', 'HON': 'Industrials',
  'UPS': 'Industrials', 'RTX': 'Industrials', 'LMT': 'Industrials', 'MMM': 'Industrials',
  
  // Utilities
  'NEE': 'Utilities', 'SO': 'Utilities', 'DUK': 'Utilities', 'D': 'Utilities',
  'AEP': 'Utilities', 'EXC': 'Utilities', 'XEL': 'Utilities', 'SRE': 'Utilities',
  
  // Real Estate
  'AMT': 'Real Estate', 'PLD': 'Real Estate', 'CCI': 'Real Estate', 'EQIX': 'Real Estate',
  'PSA': 'Real Estate', 'O': 'Real Estate', 'WELL': 'Real Estate', 'SPG': 'Real Estate',
  
  // Materials
  'LIN': 'Materials', 'APD': 'Materials', 'SHW': 'Materials', 'FCX': 'Materials',
  'NEM': 'Materials', 'DOW': 'Materials', 'DD': 'Materials', 'ECL': 'Materials',
  
  // Communication Services
  'CMCSA': 'Communication Services', 'VZ': 'Communication Services', 'T': 'Communication Services',
  'DIS': 'Communication Services', 'NFLX': 'Communication Services', 'TMUS': 'Communication Services'
};

// Transaction cost database per asset type
const TRANSACTION_COSTS: Record<string, { fixed: number; variable: number }> = {
  'STOCK': { fixed: 4.95, variable: 0.005 },    // $4.95 + 0.5%
  'ETF': { fixed: 0.00, variable: 0.003 },      // Often commission-free + 0.3%
  'BOND': { fixed: 10.00, variable: 0.010 },    // $10.00 + 1.0%
  'COMMODITY': { fixed: 7.50, variable: 0.008 } // $7.50 + 0.8%
};

export class OptimizationConstraintsEngine {
  private static instance: OptimizationConstraintsEngine;
  
  private readonly DEFAULT_MIN_WEIGHT = 0.0;    // Long-only
  private readonly DEFAULT_MAX_WEIGHT = 0.25;   // 25% max per asset
  private readonly DEFAULT_MAX_SECTOR = 0.40;   // 40% max per sector
  private readonly DEFAULT_TOLERANCE = 1e-8;

  constructor() {}

  public static getInstance(): OptimizationConstraintsEngine {
    if (!OptimizationConstraintsEngine.instance) {
      OptimizationConstraintsEngine.instance = new OptimizationConstraintsEngine();
    }
    return OptimizationConstraintsEngine.instance;
  }

  /**
   * Valida e aggiusta i pesi del portafoglio secondo i vincoli
   */
  public validateAndAdjustWeights(
    assets: AssetData[],
    originalWeights: number[],
    constraints: ExtendedConstraints = {}
  ): ConstraintValidationResult {
    console.log('🎯 Validating and adjusting portfolio weights...', {
      assets: assets.length,
      constraints: Object.keys(constraints).length
    });

    const startTime = performance.now();

    try {
      // Step 1: Detect violations
      const violations = this.detectViolations(assets, originalWeights, constraints);
      
      // Step 2: Adjust weights with priority system
      const adjustedWeights = this.adjustWeightsWithPriority(
        assets,
        originalWeights,
        constraints,
        violations
      );
      
      // Step 3: Calculate adjustment summary
      const adjustmentSummary = this.calculateAdjustmentSummary(
        originalWeights,
        adjustedWeights,
        violations
      );

      const result: ConstraintValidationResult = {
        isValid: violations.length === 0,
        violations,
        adjustedWeights,
        originalWeights,
        adjustmentSummary
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Constraint validation completed:', {
        violations: violations.length,
        totalAdjustment: adjustmentSummary.totalAdjustment.toFixed(4),
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error in constraint validation:', error);
      return {
        isValid: false,
        violations: [{
          type: 'WEIGHT_BOUND',
          severity: 'CRITICAL',
          description: 'Constraint validation failed',
          violatingAssets: assets.map(a => a.symbol),
          currentValue: 0,
          limitValue: 0,
          suggestedAction: 'Review constraint parameters'
        }],
        adjustedWeights: originalWeights,
        originalWeights,
        adjustmentSummary: {
          totalAdjustment: 0,
          affectedAssets: 0,
          relaxedConstraints: []
        }
      };
    }
  }

  /**
   * Calcola i costi di transazione per un portafoglio
   */
  public calculateTransactionCosts(
    assets: AssetData[],
    weights: number[],
    currentWeights: number[] = [],
    portfolioValue: number = 100000, // Default $100k portfolio
    constraints: ExtendedConstraints = {}
  ): TransactionCostAnalysis {
    console.log('💰 Calculating transaction costs...', {
      portfolioValue: portfolioValue,
      assets: assets.length
    });

    const includeTransactionCosts = constraints.includeTransactionCosts ?? true;
    
    if (!includeTransactionCosts) {
      return {
        totalTransactionCosts: 0,
        costBreakdown: { fixedCosts: 0, variableCosts: 0, numberOfTrades: 0 },
        netReturn: 0,
        costImpactPercent: 0,
        recommendations: ['Transaction costs disabled by user']
      };
    }

    let totalFixedCosts = 0;
    let totalVariableCosts = 0;
    let numberOfTrades = 0;
    const recommendations: string[] = [];

    for (let i = 0; i < assets.length; i++) {
      const currentWeight = currentWeights[i] || 0;
      const targetWeight = weights[i];
      const weightChange = Math.abs(targetWeight - currentWeight);
      
      // Only count as trade if significant weight change (>0.1%)
      if (weightChange > 0.001) {
        numberOfTrades++;
        
        const assetType = assets[i].assetType || 'STOCK';
        const costs = TRANSACTION_COSTS[assetType] || TRANSACTION_COSTS['STOCK'];
        
        const tradeValue = portfolioValue * weightChange;
        
        totalFixedCosts += costs.fixed;
        totalVariableCosts += tradeValue * costs.variable;
      }
    }

    const totalTransactionCosts = totalFixedCosts + totalVariableCosts;
    const costImpactPercent = (totalTransactionCosts / portfolioValue) * 100;

    // Generate recommendations
    if (costImpactPercent > 2.0) {
      recommendations.push('High transaction costs (>2%) - consider fewer trades');
    }
    if (numberOfTrades > 20) {
      recommendations.push('Many trades detected - consider ETFs for diversification');
    }
    if (totalFixedCosts > totalVariableCosts) {
      recommendations.push('Fixed costs dominate - consider larger trade sizes');
    }

    return {
      totalTransactionCosts,
      costBreakdown: {
        fixedCosts: totalFixedCosts,
        variableCosts: totalVariableCosts,
        numberOfTrades
      },
      netReturn: -costImpactPercent / 100, // Negative impact on return
      costImpactPercent,
      recommendations
    };
  }

  /**
   * Analizza l'allocazione per settore
   */
  public analyzeSectorAllocation(
    assets: AssetData[],
    weights: number[],
    constraints: ExtendedConstraints = {}
  ): SectorAllocation[] {
    console.log('📊 Analyzing sector allocation...', {
      assets: assets.length
    });

    const maxSectorConcentration = constraints.maxSectorConcentration ?? this.DEFAULT_MAX_SECTOR;
    const sectorMap = new Map<string, { totalWeight: number; assets: { symbol: string; weight: number; contribution: number }[] }>();

    // Group assets by sector
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const weight = weights[i];
      const sector = this.getAssetSector(asset);

      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { totalWeight: 0, assets: [] });
      }

      const sectorData = sectorMap.get(sector)!;
      sectorData.totalWeight += weight;
      sectorData.assets.push({
        symbol: asset.symbol,
        weight,
        contribution: weight / (sectorData.totalWeight || 1) * 100
      });
    }

    // Convert to result format
    const result: SectorAllocation[] = [];
    for (const [sector, data] of sectorMap.entries()) {
      result.push({
        sector,
        totalWeight: data.totalWeight,
        assets: data.assets,
        concentration: data.totalWeight,
        withinLimits: data.totalWeight <= maxSectorConcentration
      });
    }

    // Sort by allocation size
    return result.sort((a, b) => b.totalWeight - a.totalWeight);
  }

  /**
   * Ottimizza i pesi considerando tutti i vincoli
   */
  public optimizeWithConstraints(
    assets: AssetData[],
    targetWeights: number[],
    constraints: ExtendedConstraints = {}
  ): number[] {
    console.log('🔧 Optimizing weights with constraints...', {
      assets: assets.length,
      constraintTypes: Object.keys(constraints).length
    });

    const startTime = performance.now();

    try {
      // Initialize with target weights
      let optimizedWeights = [...targetWeights];
      
      // Apply constraints in priority order
      optimizedWeights = this.applyWeightBounds(optimizedWeights, constraints);
      optimizedWeights = this.applySectorConstraints(assets, optimizedWeights, constraints);
      optimizedWeights = this.applyDiversificationConstraints(optimizedWeights, constraints);
      optimizedWeights = this.normalizeWeights(optimizedWeights, constraints);

      const processingTime = performance.now() - startTime;
      console.log('✅ Weight optimization completed:', {
        totalWeight: optimizedWeights.reduce((sum, w) => sum + w, 0).toFixed(4),
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return optimizedWeights;

    } catch (error) {
      console.error('❌ Error in weight optimization:', error);
      return this.createEqualWeights(assets.length);
    }
  }

  // Private helper methods

  private detectViolations(
    assets: AssetData[],
    weights: number[],
    constraints: ExtendedConstraints
  ): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];

    // Check weight bounds
    const minWeight = constraints.minWeight ?? this.DEFAULT_MIN_WEIGHT;
    const maxWeight = constraints.maxWeight ?? this.DEFAULT_MAX_WEIGHT;

    for (let i = 0; i < weights.length; i++) {
      if (weights[i] < minWeight) {
        violations.push({
          type: 'WEIGHT_BOUND',
          severity: 'HIGH',
          description: `Weight below minimum: ${assets[i].symbol}`,
          violatingAssets: [assets[i].symbol],
          currentValue: weights[i],
          limitValue: minWeight,
          suggestedAction: 'Increase weight or remove asset'
        });
      }
      
      if (weights[i] > maxWeight) {
        violations.push({
          type: 'WEIGHT_BOUND',
          severity: 'HIGH',
          description: `Weight above maximum: ${assets[i].symbol}`,
          violatingAssets: [assets[i].symbol],
          currentValue: weights[i],
          limitValue: maxWeight,
          suggestedAction: 'Reduce weight or increase limit'
        });
      }
    }

    // Check sector concentration
    const sectorAllocations = this.analyzeSectorAllocation(assets, weights, constraints);
    const maxSectorConcentration = constraints.maxSectorConcentration ?? this.DEFAULT_MAX_SECTOR;

    for (const allocation of sectorAllocations) {
      if (allocation.totalWeight > maxSectorConcentration) {
        violations.push({
          type: 'SECTOR_CONCENTRATION',
          severity: 'MEDIUM',
          description: `Sector over-concentration: ${allocation.sector}`,
          violatingAssets: allocation.assets.map(a => a.symbol),
          currentValue: allocation.totalWeight,
          limitValue: maxSectorConcentration,
          suggestedAction: 'Reduce sector allocation or diversify'
        });
      }
    }

    // Check sum weights
    const sumWeights = weights.reduce((sum, w) => sum + w, 0);
    const targetSum = constraints.sumWeights ?? 1.0;
    
    if (Math.abs(sumWeights - targetSum) > this.DEFAULT_TOLERANCE) {
      violations.push({
        type: 'SUM_WEIGHTS',
        severity: 'CRITICAL',
        description: 'Portfolio weights do not sum to target',
        violatingAssets: assets.map(a => a.symbol),
        currentValue: sumWeights,
        limitValue: targetSum,
        suggestedAction: 'Normalize weights to sum to 1.0'
      });
    }

    return violations;
  }

  private adjustWeightsWithPriority(
    assets: AssetData[],
    weights: number[],
    constraints: ExtendedConstraints,
    violations: ConstraintViolation[]
  ): number[] {
    let adjustedWeights = [...weights];

    // Priority 1: Critical violations (sum weights)
    const sumViolations = violations.filter(v => v.type === 'SUM_WEIGHTS');
    if (sumViolations.length > 0) {
      adjustedWeights = this.normalizeWeights(adjustedWeights, constraints);
    }

    // Priority 2: Weight bounds violations
    adjustedWeights = this.applyWeightBounds(adjustedWeights, constraints);

    // Priority 3: Sector concentration violations
    adjustedWeights = this.applySectorConstraints(assets, adjustedWeights, constraints);

    // Final normalization
    adjustedWeights = this.normalizeWeights(adjustedWeights, constraints);

    return adjustedWeights;
  }

  private applyWeightBounds(weights: number[], constraints: ExtendedConstraints): number[] {
    const minWeight = constraints.minWeight ?? this.DEFAULT_MIN_WEIGHT;
    const maxWeight = constraints.maxWeight ?? this.DEFAULT_MAX_WEIGHT;

    return weights.map(w => Math.max(minWeight, Math.min(maxWeight, w)));
  }

  private applySectorConstraints(
    assets: AssetData[],
    weights: number[],
    constraints: ExtendedConstraints
  ): number[] {
    const maxSectorConcentration = constraints.maxSectorConcentration ?? this.DEFAULT_MAX_SECTOR;
    const adjustedWeights = [...weights];

    // Group by sector
    const sectorMap = new Map<string, number[]>();
    for (let i = 0; i < assets.length; i++) {
      const sector = this.getAssetSector(assets[i]);
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, []);
      }
      sectorMap.get(sector)!.push(i);
    }

    // Adjust over-concentrated sectors
    for (const [sector, indices] of sectorMap.entries()) {
      const sectorWeight = indices.reduce((sum, i) => sum + adjustedWeights[i], 0);
      
      if (sectorWeight > maxSectorConcentration) {
        const scaleFactor = maxSectorConcentration / sectorWeight;
        for (const i of indices) {
          adjustedWeights[i] *= scaleFactor;
        }
      }
    }

    return adjustedWeights;
  }

  private applyDiversificationConstraints(
    weights: number[],
    constraints: ExtendedConstraints
  ): number[] {
    if (!constraints.minDiversification) {
      return weights;
    }

    // Count non-zero weights
    const nonZeroWeights = weights.filter(w => w > this.DEFAULT_TOLERANCE).length;
    
    if (nonZeroWeights < constraints.minDiversification) {
      // Force equal weights for minimum diversification
      return this.createEqualWeights(weights.length);
    }

    return weights;
  }

  private normalizeWeights(weights: number[], constraints: ExtendedConstraints): number[] {
    const targetSum = constraints.sumWeights ?? 1.0;
    const currentSum = weights.reduce((sum, w) => sum + w, 0);
    
    if (Math.abs(currentSum) < this.DEFAULT_TOLERANCE) {
      return this.createEqualWeights(weights.length);
    }
    
    return weights.map(w => w * targetSum / currentSum);
  }

  private createEqualWeights(numAssets: number): number[] {
    return Array(numAssets).fill(1 / numAssets);
  }

  private getAssetSector(asset: AssetData): string {
    // Check if sector is explicitly provided
    if (asset.sector) {
      return asset.sector;
    }

    // Look up in database
    const sector = SECTOR_DATABASE[asset.symbol.toUpperCase()];
    if (sector) {
      return sector;
    }

    // Try to infer from asset type or name
    if (asset.assetType === 'ETF') {
      return 'ETF/Diversified';
    }

    if (asset.assetType === 'BOND') {
      return 'Fixed Income';
    }

    if (asset.assetType === 'COMMODITY') {
      return 'Commodities';
    }

    // Default sector
    return 'Other';
  }

  private calculateAdjustmentSummary(
    originalWeights: number[],
    adjustedWeights: number[],
    violations: ConstraintViolation[]
  ): { totalAdjustment: number; affectedAssets: number; relaxedConstraints: string[] } {
    let totalAdjustment = 0;
    let affectedAssets = 0;

    for (let i = 0; i < originalWeights.length; i++) {
      const adjustment = Math.abs(adjustedWeights[i] - originalWeights[i]);
      totalAdjustment += adjustment;
      if (adjustment > this.DEFAULT_TOLERANCE) {
        affectedAssets++;
      }
    }

    const relaxedConstraints = violations
      .filter(v => v.severity === 'LOW' || v.severity === 'MEDIUM')
      .map(v => v.type);

    return {
      totalAdjustment,
      affectedAssets,
      relaxedConstraints: [...new Set(relaxedConstraints)]
    };
  }
}

// Export singleton instance
export const optimizationConstraintsEngine = OptimizationConstraintsEngine.getInstance();
export default OptimizationConstraintsEngine;
