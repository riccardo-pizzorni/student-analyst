/**
 * Matrix Operations Web Worker
 * Handles intensive mathematical calculations for portfolio optimization
 * without blocking the main UI thread
 */
class MatrixOperationsWorker {
  constructor() {
    this.isProcessing = false;
    this.currentTaskId = null;
    this.taskStartTime = null;
  }

  /**
   * Initialize worker and set up message handling
   */
  init() {
    self.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });

    // Send ready signal
    this.postMessage({
      type: 'WORKER_READY',
      timestamp: Date.now()
    });
  }

  /**
   * Handle incoming messages from main thread
   */
  async handleMessage(data) {
    const { type, taskId, payload } = data;

    try {
      switch (type) {
        case 'MATRIX_INVERT':
          await this.handleMatrixInvert(taskId, payload);
          break;
        
        case 'COVARIANCE_MATRIX':
          await this.handleCovarianceMatrix(taskId, payload);
          break;
        
        case 'PORTFOLIO_OPTIMIZATION':
          await this.handlePortfolioOptimization(taskId, payload);
          break;
        
        case 'MATRIX_MULTIPLY':
          await this.handleMatrixMultiply(taskId, payload);
          break;
        
        case 'EFFICIENT_FRONTIER':
          await this.handleEfficientFrontier(taskId, payload);
          break;
        
        case 'CANCEL_TASK':
          this.handleCancelTask(payload.taskId);
          break;
        
        default:
          this.postError(taskId, `Unknown task type: ${type}`);
      }
    } catch (error) {
      this.postError(taskId, error.message, error.stack);
    }
  }

  /**
   * Handle matrix inversion with progress reporting
   */
  async handleMatrixInvert(taskId, { matrix, regularization = 0.001 }) {
    this.startTask(taskId, 'Matrix Inversion');
    
    try {
      this.reportProgress(taskId, 10, 'Preparing matrix...');
      
      // Apply regularization
      const regularizedMatrix = this.regularizeMatrix(matrix, regularization);
      this.reportProgress(taskId, 30, 'Regularization applied...');
      
      // Perform Gaussian elimination
      const invertedMatrix = await this.invertMatrixWithProgress(taskId, regularizedMatrix);
      
      this.reportProgress(taskId, 100, 'Matrix inversion complete');
      
      this.postResult(taskId, {
        invertedMatrix,
        success: true,
        processingTime: this.getProcessingTime()
      });
    } catch (error) {
      this.postError(taskId, `Matrix inversion failed: ${error.message}`);
    }
  }

  /**
   * Handle covariance matrix calculation
   */
  async handleCovarianceMatrix(taskId, { returns, method = 'sample' }) {
    this.startTask(taskId, 'Covariance Matrix Calculation');
    
    try {
      const n = returns.length;
      this.reportProgress(taskId, 10, `Processing ${n} assets...`);
      
      const covarianceMatrix = await this.calculateCovarianceMatrixWithProgress(taskId, returns, method);
      
      this.reportProgress(taskId, 100, 'Covariance matrix complete');
      
      this.postResult(taskId, {
        covarianceMatrix,
        dimension: n,
        method,
        success: true,
        processingTime: this.getProcessingTime()
      });
    } catch (error) {
      this.postError(taskId, `Covariance calculation failed: ${error.message}`);
    }
  }

  /**
   * Handle full portfolio optimization
   */
  async handlePortfolioOptimization(taskId, { assets, method, constraints, riskFreeRate = 0.02 }) {
    this.startTask(taskId, 'Portfolio Optimization');
    
    try {
      this.reportProgress(taskId, 5, 'Extracting returns data...');
      
      const returns = assets.map(asset => asset.returns);
      const expectedReturns = assets.map(asset => asset.expectedReturn);
      
      this.reportProgress(taskId, 20, 'Calculating covariance matrix...');
      const covMatrix = await this.calculateCovarianceMatrixWithProgress(taskId, returns, 'sample', 20, 40);
      
      this.reportProgress(taskId, 60, 'Optimizing portfolio weights...');
      const weights = await this.optimizeWeightsWithProgress(taskId, expectedReturns, covMatrix, method, constraints, riskFreeRate, 60, 90);
      
      this.reportProgress(taskId, 95, 'Calculating portfolio metrics...');
      const metrics = this.calculatePortfolioMetrics(expectedReturns, covMatrix, weights, riskFreeRate);
      
      this.reportProgress(taskId, 100, 'Portfolio optimization complete');
      
      this.postResult(taskId, {
        weights,
        metrics,
        covarianceMatrix: covMatrix,
        success: true,
        processingTime: this.getProcessingTime()
      });
    } catch (error) {
      this.postError(taskId, `Portfolio optimization failed: ${error.message}`);
    }
  }

  /**
   * Handle efficient frontier calculation
   */
  async handleEfficientFrontier(taskId, { assets, numPoints = 50, constraints }) {
    this.startTask(taskId, 'Efficient Frontier Calculation');
    
    try {
      const returns = assets.map(asset => asset.returns);
      const expectedReturns = assets.map(asset => asset.expectedReturn);
      
      this.reportProgress(taskId, 10, 'Calculating covariance matrix...');
      const covMatrix = await this.calculateCovarianceMatrixWithProgress(taskId, returns, 'sample', 10, 30);
      
      this.reportProgress(taskId, 40, 'Generating frontier points...');
      const frontierPoints = await this.generateFrontierPointsWithProgress(taskId, expectedReturns, covMatrix, numPoints, constraints, 40, 95);
      
      this.reportProgress(taskId, 100, 'Efficient frontier complete');
      
      this.postResult(taskId, {
        frontierPoints,
        numPoints: frontierPoints.length,
        success: true,
        processingTime: this.getProcessingTime()
      });
    } catch (error) {
      this.postError(taskId, `Efficient frontier calculation failed: ${error.message}`);
    }
  }

  /**
   * Matrix inversion with progress reporting
   */
  async invertMatrixWithProgress(taskId, matrix) {
    const n = matrix.length;
    const augmented = matrix.map((row, i) => {
      const newRow = [...row];
      for (let j = 0; j < n; j++) {
        newRow.push(i === j ? 1 : 0);
      }
      return newRow;
    });

    // Gaussian elimination with progress updates
    for (let i = 0; i < n; i++) {
      // Check for cancellation
      if (!this.isProcessing) {
        throw new Error('Task cancelled');
      }

      // Progress update every 10% of iterations
      if (i % Math.max(1, Math.floor(n / 10)) === 0) {
        const progress = 30 + Math.floor((i / n) * 60);
        this.reportProgress(taskId, progress, `Processing row ${i + 1}/${n}...`);
        await this.sleep(1); // Allow other operations
      }

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
      if (Math.abs(augmented[i][i]) < 1e-12) {
        throw new Error('Matrix is singular or near-singular');
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
    const inverse = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        inverse[i][j] = augmented[i][n + j];
      }
    }

    return inverse;
  }

  /**
   * Calculate covariance matrix with progress reporting
   */
  async calculateCovarianceMatrixWithProgress(taskId, returns, method, startProgress = 0, endProgress = 100) {
    const n = returns.length;
    const covariance = Array(n).fill(null).map(() => Array(n).fill(0));
    
    const minLength = Math.min(...returns.map(r => r.length));
    const progressStep = Math.floor(n / 10) || 1;
    
    for (let i = 0; i < n; i++) {
      // Check for cancellation
      if (!this.isProcessing) {
        throw new Error('Task cancelled');
      }

      // Progress update
      if (i % progressStep === 0) {
        const progress = startProgress + Math.floor((i / n) * (endProgress - startProgress));
        this.reportProgress(taskId, progress, `Calculating covariance: ${i + 1}/${n} assets...`);
        await this.sleep(1);
      }

      for (let j = i; j < n; j++) {
        const returns1 = returns[i].slice(-minLength);
        const returns2 = returns[j].slice(-minLength);
        
        const cov = this.calculateCovariance(returns1, returns2);
        covariance[i][j] = cov;
        covariance[j][i] = cov; // Symmetric matrix
      }
    }
    
    return covariance;
  }

  /**
   * Optimize portfolio weights with progress reporting
   */
  async optimizeWeightsWithProgress(taskId, expectedReturns, covMatrix, method, constraints, riskFreeRate, startProgress, endProgress) {
    const n = expectedReturns.length;
    
    if (method === 'min_variance') {
      this.reportProgress(taskId, startProgress + 10, 'Inverting covariance matrix...');
      const invCov = await this.invertMatrixWithProgress(taskId, covMatrix);
      
      this.reportProgress(taskId, startProgress + 20, 'Calculating minimum variance weights...');
      const ones = Array(n).fill(1);
      const numerator = this.multiplyMatrixVector(invCov, ones);
      const denominator = this.dotProduct(ones, numerator);
      
      const weights = numerator.map(w => w / denominator);
      this.reportProgress(taskId, endProgress, 'Minimum variance optimization complete');
      
      return this.applyConstraints(weights, constraints);
      
    } else if (method === 'max_sharpe') {
      this.reportProgress(taskId, startProgress + 10, 'Inverting covariance matrix...');
      const invCov = await this.invertMatrixWithProgress(taskId, covMatrix);
      
      this.reportProgress(taskId, startProgress + 20, 'Calculating maximum Sharpe weights...');
      const excessReturns = expectedReturns.map(r => r - riskFreeRate);
      const numerator = this.multiplyMatrixVector(invCov, excessReturns);
      const ones = Array(n).fill(1);
      const denominator = this.dotProduct(ones, numerator);
      
      if (Math.abs(denominator) < 1e-10) {
        throw new Error('Degenerate optimization problem');
      }
      
      const weights = numerator.map(w => w / denominator);
      this.reportProgress(taskId, endProgress, 'Maximum Sharpe optimization complete');
      
      return this.applyConstraints(weights, constraints);
    }
    
    throw new Error(`Unsupported optimization method: ${method}`);
  }

  /**
   * Generate efficient frontier points with progress
   */
  async generateFrontierPointsWithProgress(taskId, expectedReturns, covMatrix, numPoints, constraints, startProgress, endProgress) {
    const points = [];
    const minReturn = Math.min(...expectedReturns);
    const maxReturn = Math.max(...expectedReturns);
    
    for (let i = 0; i < numPoints; i++) {
      // Check for cancellation
      if (!this.isProcessing) {
        throw new Error('Task cancelled');
      }

      const progress = startProgress + Math.floor((i / numPoints) * (endProgress - startProgress));
      this.reportProgress(taskId, progress, `Generating point ${i + 1}/${numPoints}...`);
      
      const targetReturn = minReturn + (maxReturn - minReturn) * i / (numPoints - 1);
      
      try {
        const weights = await this.optimizeForTargetReturn(expectedReturns, covMatrix, targetReturn, constraints);
        const metrics = this.calculatePortfolioMetrics(expectedReturns, covMatrix, weights, 0.02);
        
        points.push({
          risk: metrics.volatility,
          return: metrics.expectedReturn,
          weights,
          sharpeRatio: metrics.sharpeRatio
        });
      } catch (error) {
        // Skip problematic points
        continue;
      }
      
      await this.sleep(1);
    }
    
    return points.sort((a, b) => a.risk - b.risk);
  }

  /**
   * Utility methods
   */
  regularizeMatrix(matrix, lambda) {
    const n = matrix.length;
    const regularized = matrix.map(row => [...row]);
    
    for (let i = 0; i < n; i++) {
      regularized[i][i] += lambda;
    }
    
    return regularized;
  }

  calculateCovariance(x, y) {
    if (x.length !== y.length || x.length < 2) return 0;
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
    
    let covariance = 0;
    for (let i = 0; i < x.length; i++) {
      covariance += (x[i] - meanX) * (y[i] - meanY);
    }
    
    return covariance / (x.length - 1);
  }

  multiplyMatrixVector(matrix, vector) {
    const result = Array(matrix.length).fill(0);
    
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < vector.length; j++) {
        result[i] += matrix[i][j] * vector[j];
      }
    }
    
    return result;
  }

  dotProduct(a, b) {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  calculatePortfolioMetrics(expectedReturns, covMatrix, weights, riskFreeRate) {
    const expectedReturn = this.dotProduct(weights, expectedReturns);
    
    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * covMatrix[i][j];
      }
    }
    const volatility = Math.sqrt(Math.max(variance, 1e-16));
    
    const sharpeRatio = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;
    
    return { expectedReturn, volatility, sharpeRatio };
  }

  applyConstraints(weights, constraints = {}) {
    let constrainedWeights = [...weights];
    
    // Apply bounds
    if (constraints.minWeight !== undefined || constraints.maxWeight !== undefined) {
      const minW = constraints.minWeight || 0;
      const maxW = constraints.maxWeight || 1;
      
      constrainedWeights = constrainedWeights.map(w => Math.max(minW, Math.min(maxW, w)));
    }
    
    // Normalize to sum to 1
    const sum = constrainedWeights.reduce((s, w) => s + w, 0);
    if (sum > 0) {
      constrainedWeights = constrainedWeights.map(w => w / sum);
    }
    
    return constrainedWeights;
  }

  async optimizeForTargetReturn(expectedReturns, covMatrix, targetReturn, constraints) {
    // Simplified implementation for target return optimization
    // This would typically use Lagrange multipliers
    const n = expectedReturns.length;
    const weights = Array(n).fill(1 / n);
    return this.applyConstraints(weights, constraints);
  }

  /**
   * Task management methods
   */
  startTask(taskId, taskName) {
    this.isProcessing = true;
    this.currentTaskId = taskId;
    this.taskStartTime = performance.now();
    
    this.postMessage({
      type: 'TASK_STARTED',
      taskId,
      taskName,
      timestamp: Date.now()
    });
  }

  reportProgress(taskId, percentage, message) {
    if (!this.isProcessing || this.currentTaskId !== taskId) return;
    
    this.postMessage({
      type: 'PROGRESS_UPDATE',
      taskId,
      progress: Math.min(100, Math.max(0, percentage)),
      message,
      timestamp: Date.now()
    });
  }

  getProcessingTime() {
    return this.taskStartTime ? performance.now() - this.taskStartTime : 0;
  }

  postResult(taskId, result) {
    this.isProcessing = false;
    this.currentTaskId = null;
    
    this.postMessage({
      type: 'TASK_COMPLETED',
      taskId,
      result,
      timestamp: Date.now()
    });
  }

  postError(taskId, message, stack = null) {
    this.isProcessing = false;
    this.currentTaskId = null;
    
    this.postMessage({
      type: 'TASK_ERROR',
      taskId,
      error: {
        message,
        stack,
        timestamp: Date.now()
      }
    });
  }

  handleCancelTask(taskId) {
    if (this.currentTaskId === taskId) {
      this.isProcessing = false;
      this.currentTaskId = null;
      
      this.postMessage({
        type: 'TASK_CANCELLED',
        taskId,
        timestamp: Date.now()
      });
    }
  }

  postMessage(data) {
    self.postMessage(data);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize worker when script loads
const matrixWorker = new MatrixOperationsWorker();
matrixWorker.init(); 