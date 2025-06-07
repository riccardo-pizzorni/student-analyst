/**
 * PortfolioOptimizationEngine - Motore di Ottimizzazione Portfolio Markowitz
 * 
 * Implementa la Modern Portfolio Theory di Harry Markowitz per costruire
 * portafogli ottimali che massimizzano il rendimento per un dato livello di rischio.
 */

interface AssetData {
  symbol: string;
  name: string;
  expectedReturn: number;
  volatility: number;
  returns: number[];
}

interface PortfolioConstraints {
  sumWeights?: number; // Default: 1.0
  minWeight?: number; // Default: 0.0
  maxWeight?: number; // Default: 1.0
}

interface PortfolioResult {
  weights: number[];
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  assets: {
    symbol: string;
    weight: number;
  }[];
}

interface EfficientFrontier {
  points: {
    risk: number;
    return: number;
    weights: number[];
    sharpeRatio: number;
  }[];
  minVariancePortfolio: PortfolioResult;
  maxSharpePortfolio: PortfolioResult;
}

type Matrix = number[][];
type Vector = number[];

class PortfolioOptimizationEngine {
  private static instance: PortfolioOptimizationEngine;
  
  private readonly DEFAULT_TOLERANCE = 1e-8;
  private readonly DEFAULT_REGULARIZATION = 1e-6;
  private readonly DEFAULT_RISK_FREE_RATE = 0.02;

  constructor() {}

  public static getInstance(): PortfolioOptimizationEngine {
    if (!PortfolioOptimizationEngine.instance) {
      PortfolioOptimizationEngine.instance = new PortfolioOptimizationEngine();
    }
    return PortfolioOptimizationEngine.instance;
  }

  /**
   * Calcola il portfolio a varianza minima
   */
  public calculateMinimumVariancePortfolio(
    assets: AssetData[],
    constraints: PortfolioConstraints = {}
  ): PortfolioResult | null {
    console.log('📊 Calculating Minimum Variance Portfolio...', {
      assets: assets.length
    });

    const startTime = performance.now();

         try {
       // Prepare matrices
       const covarianceMatrix = this.calculateCovarianceMatrix(assets);
      
      // Apply regularization
      const regularizedCovariance = this.regularizeMatrix(covarianceMatrix, this.DEFAULT_REGULARIZATION);

      // Calculate minimum variance weights
      const weights = this.calculateMinVarWeights(regularizedCovariance);
      
      // Apply constraints
      const constrainedWeights = this.applyConstraints(weights, constraints);

      // Calculate portfolio metrics
      const portfolioMetrics = this.calculatePortfolioMetrics(
        assets,
        constrainedWeights,
        regularizedCovariance
      );

      const result: PortfolioResult = {
        weights: constrainedWeights,
        expectedReturn: portfolioMetrics.expectedReturn,
        volatility: portfolioMetrics.volatility,
        sharpeRatio: portfolioMetrics.sharpeRatio,
        assets: assets.map((asset) => ({
          symbol: asset.symbol,
          weight: constrainedWeights[i]
        }))
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Minimum Variance Portfolio calculated:', {
        volatility: (result.volatility * 100).toFixed(2) + '%',
        expectedReturn: (result.expectedReturn * 100).toFixed(2) + '%',
        sharpeRatio: result.sharpeRatio.toFixed(3),
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Minimum Variance Portfolio:', error);
      return null;
    }
  }

  /**
   * Calcola la Efficient Frontier
   */
  public calculateEfficientFrontier(
    assets: AssetData[],
    constraints: PortfolioConstraints = {}
  ): EfficientFrontier | null {
    console.log('🎯 Calculating Efficient Frontier...', {
      assets: assets.length
    });

    const startTime = performance.now();

    try {
      // Calculate minimum variance portfolio
      const minVarPortfolio = this.calculateMinimumVariancePortfolio(assets, constraints);
      if (!minVarPortfolio) {
        throw new Error('Cannot calculate minimum variance portfolio');
      }

      // Calculate maximum Sharpe portfolio
      const maxSharpePortfolio = this.calculateMaximumSharpePortfolio(assets, constraints);
      if (!maxSharpePortfolio) {
        throw new Error('Cannot calculate maximum Sharpe portfolio');
      }

      // Generate frontier points
      const frontierPoints = this.generateFrontierPoints(assets, constraints, 20);

      const result: EfficientFrontier = {
        points: frontierPoints,
        minVariancePortfolio: minVarPortfolio,
        maxSharpePortfolio: maxSharpePortfolio
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Efficient Frontier calculated:', {
        points: frontierPoints.length,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Efficient Frontier:', error);
      return null;
    }
  }

  /**
   * Calcola il portfolio con massimo Sharpe ratio
   */
  public calculateMaximumSharpePortfolio(
    assets: AssetData[],
    constraints: PortfolioConstraints = {}
  ): PortfolioResult | null {
    console.log('📊 Calculating Maximum Sharpe Portfolio...');

    const startTime = performance.now();

    try {
      const expectedReturns = assets.map(asset => asset.expectedReturn);
      const covarianceMatrix = this.calculateCovarianceMatrix(assets);
      const regularizedCovariance = this.regularizeMatrix(covarianceMatrix, this.DEFAULT_REGULARIZATION);

      // Calculate maximum Sharpe weights
      const weights = this.calculateMaxSharpeWeights(expectedReturns, regularizedCovariance);
      
      // Apply constraints
      const constrainedWeights = this.applyConstraints(weights, constraints);

      // Calculate portfolio metrics
      const portfolioMetrics = this.calculatePortfolioMetrics(
        assets,
        constrainedWeights,
        regularizedCovariance
      );

      const result: PortfolioResult = {
        weights: constrainedWeights,
        expectedReturn: portfolioMetrics.expectedReturn,
        volatility: portfolioMetrics.volatility,
        sharpeRatio: portfolioMetrics.sharpeRatio,
        assets: assets.map((asset) => ({
          symbol: asset.symbol,
          weight: constrainedWeights[i]
        }))
      };

      const processingTime = performance.now() - startTime;
      console.log('✅ Maximum Sharpe Portfolio calculated:', {
        sharpeRatio: result.sharpeRatio.toFixed(3),
        volatility: (result.volatility * 100).toFixed(2) + '%',
        expectedReturn: (result.expectedReturn * 100).toFixed(2) + '%',
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Maximum Sharpe Portfolio:', error);
      return null;
    }
  }

  // Private utility methods
  private calculateCovarianceMatrix(assets: AssetData[]): Matrix {
    const n = assets.length;
    const covariance: Matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    
    const minLength = Math.min(...assets.map(asset => asset.returns.length));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const returns1 = assets[i].returns.slice(-minLength);
        const returns2 = assets[j].returns.slice(-minLength);
        
        covariance[i][j] = this.calculateCovariance(returns1, returns2);
      }
    }
    
    return covariance;
  }

  private calculateCovariance(x: Vector, y: Vector): number {
    if (x.length !== y.length || x.length < 2) return 0;
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
    
    let covariance = 0;
    for (let i = 0; i < x.length; i++) {
      covariance += (x[i] - meanX) * (y[i] - meanY);
    }
    
    return covariance / (x.length - 1);
  }

  private regularizeMatrix(matrix: Matrix, lambda: number): Matrix {
    const n = matrix.length;
    const regularized: Matrix = matrix.map(row => [...row]);
    
    for (let i = 0; i < n; i++) {
      regularized[i][i] += lambda;
    }
    
    return regularized;
  }

  private calculateMinVarWeights(covarianceMatrix: Matrix): Vector {
    const n = covarianceMatrix.length;
    const invCovariance = this.invertMatrix(covarianceMatrix);
    
    if (!invCovariance) {
      throw new Error('Cannot invert covariance matrix');
    }
    
    const ones = Array(n).fill(1);
    const numerator = this.multiplyMatrixVector(invCovariance, ones);
    const denominator = this.dotProduct(ones, numerator);
    
    return numerator.map(w => w / denominator);
  }

  private calculateMaxSharpeWeights(expectedReturns: Vector, covarianceMatrix: Matrix): Vector {
    const invCovariance = this.invertMatrix(covarianceMatrix);
    
    if (!invCovariance) {
      throw new Error('Cannot invert covariance matrix');
    }
    
    const excessReturns = expectedReturns.map(r => r - this.DEFAULT_RISK_FREE_RATE);
    const numerator = this.multiplyMatrixVector(invCovariance, excessReturns);
    const ones = Array(expectedReturns.length).fill(1);
    const denominator = this.dotProduct(ones, numerator);
    
    if (Math.abs(denominator) < this.DEFAULT_TOLERANCE) {
      throw new Error('Degenerate optimization problem');
    }
    
    return numerator.map(w => w / denominator);
  }

  private invertMatrix(matrix: Matrix): Matrix | null {
    const n = matrix.length;
    
    // Create augmented matrix [A|I]
    const augmented: Matrix = matrix.map((row) => {
      const newRow = [...row];
      for (let j = 0; j < n; j++) {
        newRow.push(i === j ? 1 : 0);
      }
      return newRow;
    });
    
    // Gaussian elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Check for singularity
      if (Math.abs(augmented[i][i]) < this.DEFAULT_TOLERANCE) {
        return null;
      }
      
      // Scale pivot row
      const pivot = augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }
      
      // Eliminate column
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }
    
    // Extract inverse matrix
    const inverse: Matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        inverse[i][j] = augmented[i][n + j];
      }
    }
    
    return inverse;
  }

  private multiplyMatrixVector(matrix: Matrix, vector: Vector): Vector {
    const result: Vector = Array(matrix.length).fill(0);
    
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < vector.length; j++) {
        result[i] += matrix[i][j] * vector[j];
      }
    }
    
    return result;
  }

  private dotProduct(a: Vector, b: Vector): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private applyConstraints(weights: Vector, constraints: PortfolioConstraints): Vector {
    let constrainedWeights = [...weights];
    
    // Apply weight bounds
    const minWeight = constraints.minWeight || 0;
    const maxWeight = constraints.maxWeight || 1;
    
    constrainedWeights = constrainedWeights.map(w => Math.max(minWeight, Math.min(maxWeight, w)));
    
    // Normalize to sum constraint
    const targetSum = constraints.sumWeights || 1.0;
    const currentSum = constrainedWeights.reduce((sum, w) => sum + w, 0);
    
    if (Math.abs(currentSum) > this.DEFAULT_TOLERANCE) {
      constrainedWeights = constrainedWeights.map(w => w * targetSum / currentSum);
    }
    
    return constrainedWeights;
  }

  private calculatePortfolioMetrics(
    assets: AssetData[],
    weights: Vector,
    covarianceMatrix: Matrix
  ): {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  } {
    const expectedReturn = weights.reduce((sum, w, i) => sum + w * assets[i].expectedReturn, 0);
    
    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * covarianceMatrix[i][j];
      }
    }
    const volatility = Math.sqrt(variance);
    
    const sharpeRatio = volatility > 0 ? (expectedReturn - this.DEFAULT_RISK_FREE_RATE) / volatility : 0;
    
    return { expectedReturn, volatility, sharpeRatio };
  }

  private generateFrontierPoints(
    assets: AssetData[],
    constraints: PortfolioConstraints,
    numPoints: number
  ): EfficientFrontier['points'] {
    const points: EfficientFrontier['points'] = [];
    const expectedReturns = assets.map(asset => asset.expectedReturn);
    const minReturn = Math.min(...expectedReturns);
    const maxReturn = Math.max(...expectedReturns);
    
    for (let i = 0; i < numPoints; i++) {
      const targetReturn = minReturn + (maxReturn - minReturn) * i / (numPoints - 1);
      
      try {
        const weights = this.optimizeForTargetReturn(assets, targetReturn, constraints);
        const covarianceMatrix = this.calculateCovarianceMatrix(assets);
        const metrics = this.calculatePortfolioMetrics(assets, weights, covarianceMatrix);
        
        points.push({
          risk: metrics.volatility,
          return: metrics.expectedReturn,
          weights,
          sharpeRatio: metrics.sharpeRatio
        });
      } catch {
        continue;
      }
    }
    
    return points.sort((a, b) => a.risk - b.risk);
  }

  private optimizeForTargetReturn(
    assets: AssetData[],
    _targetReturn: number,
    constraints: PortfolioConstraints
  ): Vector {
    // Simplified: return equal weights for now
    const n = assets.length;
    const weights = Array(n).fill(1 / n);
    return this.applyConstraints(weights, constraints);
  }
}

// Export singleton instance
export const portfolioOptimizationEngine = PortfolioOptimizationEngine.getInstance();
export default PortfolioOptimizationEngine;

// Export types
export type {
  AssetData,
  PortfolioConstraints,
  PortfolioResult,
  EfficientFrontier,
  Matrix,
  Vector
};
