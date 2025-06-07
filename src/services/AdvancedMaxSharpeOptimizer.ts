/**
 * AdvancedMaxSharpeOptimizer - Ottimizzatore Avanzato Maximum Sharpe Portfolio
 */

interface OptimizationBounds {
  lower: number[];
  upper: number[];
}

interface OptimizationConstraints {
  bounds?: OptimizationBounds;
  sumConstraint?: number;
}

interface ConvergenceCriteria {
  maxIterations?: number;
  gradientTolerance?: number;
  functionTolerance?: number;
}

interface OptimizationResult {
  weights: number[];
  objectiveValue: number;
  iterations: number;
  converged: boolean;
  convergenceReason: string;
  gradientNorm: number;
  constraintViolation: number;
  computationTime: number;
  method: string;
}

type Vector = number[];
type Matrix = number[][];

class AdvancedMaxSharpeOptimizer {
  private static instance: AdvancedMaxSharpeOptimizer;
  
  private readonly DEFAULT_MAXiTERATIONS = 500;
  private readonly DEFAULT_GRADIENT_TOLERANCE = 1e-6;
  private readonly DEFAULT_FUNCTION_TOLERANCE = 1e-8;
  private readonly REGULARIZATION_FACTOR = 1e-6;

  constructor() {}

  public static getInstance(): AdvancedMaxSharpeOptimizer {
    if (!AdvancedMaxSharpeOptimizer.instance) {
      AdvancedMaxSharpeOptimizer.instance = new AdvancedMaxSharpeOptimizer();
    }
    return AdvancedMaxSharpeOptimizer.instance;
  }

  public optimizeMaxSharpePortfolio(
    expectedReturns: Vector,
    covarianceMatrix: Matrix,
    riskFreeRate: number = 0.02,
    constraints: OptimizationConstraints = {},
    convergenceCriteria: ConvergenceCriteria = {},
    method: string = 'numerical'
  ): OptimizationResult {
    console.log('🎯 Advanced Maximum Sharpe Portfolio Optimization...', {
      assets: expectedReturns.length,
      method,
      riskFreeRate: (riskFreeRate * 100).toFixed(2) + '%'
    });

    const startTime = performance.now();
    
    try {
      this.validateInputs(expectedReturns, covarianceMatrix, riskFreeRate);
      
      const problem = this.setupOptimizationProblem(
        expectedReturns, 
        covarianceMatrix, 
        riskFreeRate, 
        constraints
      );
      
      let result: OptimizationResult;
      
      if (method === 'analytical') {
        result = this.analyticalSolution(problem);
      } else {
        result = this.numericalOptimization(problem, convergenceCriteria);
      }
      
      const validatedResult = this.validateSolution(result, problem);
      validatedResult.computationTime = performance.now() - startTime;
      
      console.log('✅ Advanced Max Sharpe optimization completed:', {
        converged: validatedResult.converged,
        iterations: validatedResult.iterations,
        sharpeRatio: validatedResult.objectiveValue.toFixed(4),
        method: validatedResult.method,
        computationTime: `${validatedResult.computationTime.toFixed(2)}ms`
      });
      
      return validatedResult;
      
    } catch (error) {
      console.error('❌ Advanced Max Sharpe optimization failed:', error);
      throw error;
    }
  }

  private validateInputs(expectedReturns: Vector, covarianceMatrix: Matrix, riskFreeRate: number): void {
    if (expectedReturns.length < 2) {
      throw new Error('At least 2 assets required');
    }
    
    if (covarianceMatrix.length !== expectedReturns.length) {
      throw new Error('Covariance matrix dimension mismatch');
    }
    
    if (riskFreeRate < 0 || riskFreeRate > 1) {
      throw new Error('Risk-free rate must be between 0 and 1');
    }
  }

  private setupOptimizationProblem(
    expectedReturns: Vector,
    covarianceMatrix: Matrix,
    riskFreeRate: number,
    constraints: OptimizationConstraints
  ) {
    const n = expectedReturns.length;
    const regularizedCov = this.regularizeMatrix(covarianceMatrix);
    
    const defaultConstraints: OptimizationConstraints = {
      bounds: {
        lower: new Array(n).fill(0),
        upper: new Array(n).fill(1)
      },
      sumConstraint: 1.0,
      ...constraints
    };
    
    return {
      expectedReturns,
      covarianceMatrix: regularizedCov,
      riskFreeRate,
      constraints: defaultConstraints,
      dimension: n
    };
  }

  private numericalOptimization(
    problem: {
      expectedReturns: Vector;
      covarianceMatrix: Matrix;
      riskFreeRate: number;
      constraints: OptimizationConstraints;
      dimension: number;
    },
    criteria: ConvergenceCriteria
  ): OptimizationResult {
    const { expectedReturns, covarianceMatrix, riskFreeRate, constraints, dimension } = problem;
    const maxIter = criteria.maxIterations || this.DEFAULT_MAXiTERATIONS;
    const gradTol = criteria.gradientTolerance || this.DEFAULT_GRADIENT_TOLERANCE;
    const funcTol = criteria.functionTolerance || this.DEFAULT_FUNCTION_TOLERANCE;
    
    let weights = new Array(dimension).fill(1 / dimension);
    let iteration = 0;
    let converged = false;
    let convergenceReason = 'Maximum iterations reached';
    
    let prevObjective = this.evaluateObjective(weights, expectedReturns, covarianceMatrix, riskFreeRate);
    const learningRate = 0.01;
    
    while (iteration < maxIter && !converged) {
      const gradient = this.computeGradient(weights, expectedReturns, covarianceMatrix, riskFreeRate);
      
      // Gradient ascent step (maximize Sharpe ratio)
      const newWeights = weights.map((w) => w + learningRate * gradient[i]);
      
      // Project onto constraints
      weights = this.projectOntoConstraints(newWeights, constraints);
      
      // Check convergence
      const currentObjective = this.evaluateObjective(weights, expectedReturns, covarianceMatrix, riskFreeRate);
      const gradientNorm = this.vectorNorm(gradient);
      const functionChange = Math.abs(currentObjective - prevObjective);
      
      if (gradientNorm < gradTol) {
        converged = true;
        convergenceReason = 'Gradient tolerance achieved';
      } else if (functionChange < funcTol) {
        converged = true;
        convergenceReason = 'Function tolerance achieved';
      }
      
      prevObjective = currentObjective;
      iteration++;
    }
    
    return {
      weights,
      objectiveValue: prevObjective,
      iterations: iteration,
      converged,
      convergenceReason,
      gradientNorm: this.vectorNorm(this.computeGradient(weights, expectedReturns, covarianceMatrix, riskFreeRate)),
      constraintViolation: this.computeConstraintViolation(weights, constraints),
      computationTime: 0,
      method: 'Numerical Optimization (Gradient Ascent)'
    };
  }

  private analyticalSolution(problem: {
    expectedReturns: Vector;
    covarianceMatrix: Matrix;
    riskFreeRate: number;
  }): OptimizationResult {
    const { expectedReturns, covarianceMatrix, riskFreeRate } = problem;
    
    try {
      const invCov = this.invertMatrix(covarianceMatrix);
      if (!invCov) {
        throw new Error('Cannot invert covariance matrix');
      }
      
      const excessReturns = expectedReturns.map((r: number) => r - riskFreeRate);
      const numerator = this.multiplyMatrixVector(invCov, excessReturns);
      const ones = new Array(expectedReturns.length).fill(1);
      const denominator = this.dotProduct(ones, numerator);
      
      if (Math.abs(denominator) < 1e-10) {
        throw new Error('Degenerate optimization problem');
      }
      
      const weights = numerator.map(w => w / denominator);
      
      return {
        weights,
        objectiveValue: this.evaluateObjective(weights, expectedReturns, covarianceMatrix, riskFreeRate),
        iterations: 1,
        converged: true,
        convergenceReason: 'Analytical solution',
        gradientNorm: 0,
        constraintViolation: 0,
        computationTime: 0,
        method: 'Analytical Solution'
      };
      
    } catch (error) {
      throw new Error(`Analytical solution failed: ${error}`);
    }
  }

  private evaluateObjective(
    weights: Vector,
    expectedReturns: Vector,
    covarianceMatrix: Matrix,
    riskFreeRate: number
  ): number {
    const portfolioReturn = this.dotProduct(weights, expectedReturns);
    const portfolioVariance = this.computePortfolioVariance(weights, covarianceMatrix);
    const portfolioVolatility = Math.sqrt(portfolioVariance);
    
    if (portfolioVolatility < 1e-10) {
      return -Infinity;
    }
    
    return (portfolioReturn - riskFreeRate) / portfolioVolatility;
  }

  private computeGradient(
    weights: Vector,
    expectedReturns: Vector,
    covarianceMatrix: Matrix,
    riskFreeRate: number
  ): Vector {
    const n = weights.length;
    const gradient = new Array(n).fill(0);
    const epsilon = 1e-8;
    
    const baseObjective = this.evaluateObjective(weights, expectedReturns, covarianceMatrix, riskFreeRate);
    
    for (let i = 0; i < n; i++) {
      const perturbedWeights = [...weights];
      perturbedWeights[i] += epsilon;
      
      const perturbedObjective = this.evaluateObjective(perturbedWeights, expectedReturns, covarianceMatrix, riskFreeRate);
      gradient[i] = (perturbedObjective - baseObjective) / epsilon;
    }
    
    return gradient;
  }

  private projectOntoConstraints(weights: Vector, constraints: OptimizationConstraints): Vector {
    let projectedWeights = [...weights];
    
    // Apply bounds constraints
    if (constraints.bounds) {
      for (let i = 0; i < projectedWeights.length; i++) {
        projectedWeights[i] = Math.max(
          constraints.bounds.lower[i] || 0,
          Math.min(constraints.bounds.upper[i] || 1, projectedWeights[i])
        );
      }
    }
    
    // Apply sum constraint
    if (constraints.sumConstraint !== undefined) {
      const currentSum = projectedWeights.reduce((sum, w) => sum + w, 0);
      if (Math.abs(currentSum) > 1e-10) {
        projectedWeights = projectedWeights.map(w => w * constraints.sumConstraint! / currentSum);
      }
    }
    
    return projectedWeights;
  }

  private computeConstraintViolation(weights: Vector, constraints: OptimizationConstraints): number {
    let violation = 0;
    
    if (constraints.sumConstraint !== undefined) {
      const sum = weights.reduce((s, w) => s + w, 0);
      violation += Math.abs(sum - constraints.sumConstraint);
    }
    
    if (constraints.bounds) {
      for (let i = 0; i < weights.length; i++) {
        if (weights[i] < (constraints.bounds.lower[i] || 0)) {
          violation += (constraints.bounds.lower[i] || 0) - weights[i];
        }
        if (weights[i] > (constraints.bounds.upper[i] || 1)) {
          violation += weights[i] - (constraints.bounds.upper[i] || 1);
        }
      }
    }
    
    return violation;
  }

  private validateSolution(result: OptimizationResult, problem: any): OptimizationResult {
    const { constraints } = problem;
    
    result.weights = this.projectOntoConstraints(result.weights, constraints);
    
    result.objectiveValue = this.evaluateObjective(
      result.weights,
      problem.expectedReturns,
      problem.covarianceMatrix,
      problem.riskFreeRate
    );
    
    result.constraintViolation = this.computeConstraintViolation(result.weights, constraints);
    
    return result;
  }

  private regularizeMatrix(matrix: Matrix): Matrix {
    const n = matrix.length;
    const regularized: Matrix = matrix.map(row => [...row]);
    
    for (let i = 0; i < n; i++) {
      regularized[i][i] += this.REGULARIZATION_FACTOR;
    }
    
    return regularized;
  }

  private computePortfolioVariance(weights: Vector, covarianceMatrix: Matrix): number {
    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * covarianceMatrix[i][j];
      }
    }
    return Math.max(variance, 1e-16);
  }

  private vectorNorm(vector: Vector): number {
    return Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  }

  private dotProduct(a: Vector, b: Vector): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
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

  private invertMatrix(matrix: Matrix): Matrix | null {
    const n = matrix.length;
    
    const augmented: Matrix = matrix.map((row) => {
      const newRow = [...row];
      for (let j = 0; j < n; j++) {
        newRow.push(i === j ? 1 : 0);
      }
      return newRow;
    });
    
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      if (Math.abs(augmented[i][i]) < 1e-12) {
        return null;
      }
      
      const pivot = augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }
      
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }
    
    const inverse: Matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        inverse[i][j] = augmented[i][n + j];
      }
    }
    
    return inverse;
  }
}

export const advancedMaxSharpeOptimizer = AdvancedMaxSharpeOptimizer.getInstance();
export default AdvancedMaxSharpeOptimizer;

export type {
  OptimizationBounds,
  OptimizationConstraints,
  ConvergenceCriteria,
  OptimizationResult,
  Vector,
  Matrix
};
