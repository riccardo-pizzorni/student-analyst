/**
 * AlternativeAllocationsEngine - Motore Strategie Alternative di Allocazione
 * 
 * Implementa strategie alternative di allocazione portfolio che spesso 
 * performano meglio dell'ottimizzazione tradizionale:
 * - Equal Weight (1/n)
 * - Risk Parity 
 * - Minimum Correlation
 * - Maximum Diversification Ratio
 */

interface AssetData {
  symbol: string;
  name: string;
  expectedReturn: number;
  volatility: number;
  returns: number[];
}

interface AllocationResult {
  strategy: 'EQUAL_WEIGHT' | 'RISK_PARITY' | 'MIN_CORRELATION' | 'MAX_DIVERSIFICATION';
  weights: number[];
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  diversificationRatio?: number;
  averageCorrelation?: number;
  assets: {
    symbol: string;
    weight: number;
    riskContribution?: number;
  }[];
  metadata: {
    processingTime: number;
    convergenceIterations?: number;
    optimizationSuccess: boolean;
  };
}

interface AllocationConstraints {
  minWeight?: number; // Default: 0.0
  maxWeight?: number; // Default: 1.0
  maxIterations?: number; // Default: 1000
  tolerance?: number; // Default: 1e-6
}

type Matrix = number[][];
type Vector = number[];

class AlternativeAllocationsEngine {
  private static instance: AlternativeAllocationsEngine;
  
  private readonly DEFAULT_TOLERANCE = 1e-6;
  private readonly DEFAULT_MAXiTERATIONS = 1000;
  private readonly DEFAULT_RISK_FREE_RATE = 0.02;

  constructor() {}

  public static getInstance(): AlternativeAllocationsEngine {
    if (!AlternativeAllocationsEngine.instance) {
      AlternativeAllocationsEngine.instance = new AlternativeAllocationsEngine();
    }
    return AlternativeAllocationsEngine.instance;
  }

  /**
   * Equal Weight Portfolio (1/n)
   * La strategia più semplice ma spesso sorprendentemente efficace
   */
  public calculateEqualWeightPortfolio(
    assets: AssetData[],
    constraints: AllocationConstraints = {}
  ): AllocationResult | null {
    console.log('⚖️ Calculating Equal Weight Portfolio...', {
      assets: assets.length
    });

    const startTime = performance.now();

    try {
      const n = assets.length;
      const equalWeight = 1 / n;
      
      // Create equal weights
      let weights = new Array(n).fill(equalWeight);
      
      // Apply constraints if needed
      weights = this.applyConstraints(weights, constraints);

      // Calculate portfolio metrics
      const metrics = this.calculatePortfolioMetrics(assets, weights);

      const result: AllocationResult = {
        strategy: 'EQUAL_WEIGHT',
        weights,
        expectedReturn: metrics.expectedReturn,
        volatility: metrics.volatility,
        sharpeRatio: metrics.sharpeRatio,
        diversificationRatio: metrics.diversificationRatio,
        averageCorrelation: metrics.averageCorrelation,
        assets: assets.map((asset) => ({
          symbol: asset.symbol,
          weight: weights[i]
        })),
        metadata: {
          processingTime: performance.now() - startTime,
          optimizationSuccess: true
        }
      };

      console.log('✅ Equal Weight Portfolio calculated:', {
        volatility: (result.volatility * 100).toFixed(2) + '%',
        expectedReturn: (result.expectedReturn * 100).toFixed(2) + '%',
        sharpeRatio: result.sharpeRatio.toFixed(3),
        processingTime: `${result.metadata.processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Equal Weight Portfolio:', error);
      return null;
    }
  }

  /**
   * Risk Parity Portfolio
   * Ogni asset contribuisce allo stesso livello di rischio
   */
  public calculateRiskParityPortfolio(
    assets: AssetData[],
    constraints: AllocationConstraints = {}
  ): AllocationResult | null {
    console.log('🎯 Calculating Risk Parity Portfolio...', {
      assets: assets.length
    });

    const startTime = performance.now();

    try {
      // Calculate covariance matrix
      const covarianceMatrix = this.calculateCovarianceMatrix(assets);
      
      // Initialize with inverse volatility weights
      let weights = this.calculateInverseVolatilityWeights(assets);
      
      // Optimize for equal risk contribution using iterative algorithm
      const optimizationResult = this.optimizeRiskParity(
        weights, 
        covarianceMatrix, 
        constraints
      );
      
      weights = optimizationResult.weights;

      // Calculate portfolio metrics
      const metrics = this.calculatePortfolioMetrics(assets, weights);
      
      // Calculate risk contributions
      const riskContributions = this.calculateRiskContributions(
        weights, 
        covarianceMatrix
      );

      const result: AllocationResult = {
        strategy: 'RISK_PARITY',
        weights,
        expectedReturn: metrics.expectedReturn,
        volatility: metrics.volatility,
        sharpeRatio: metrics.sharpeRatio,
        diversificationRatio: metrics.diversificationRatio,
        averageCorrelation: metrics.averageCorrelation,
        assets: assets.map((asset) => ({
          symbol: asset.symbol,
          weight: weights[i],
          riskContribution: riskContributions[i]
        })),
        metadata: {
          processingTime: performance.now() - startTime,
          convergenceIterations: optimizationResult.iterations,
          optimizationSuccess: optimizationResult.converged
        }
      };

      console.log('✅ Risk Parity Portfolio calculated:', {
        volatility: (result.volatility * 100).toFixed(2) + '%',
        expectedReturn: (result.expectedReturn * 100).toFixed(2) + '%',
        sharpeRatio: result.sharpeRatio.toFixed(3),
        iterations: optimizationResult.iterations,
        processingTime: `${result.metadata.processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Risk Parity Portfolio:', error);
      return null;
    }
  }

  /**
   * Minimum Correlation Portfolio
   * Minimizza la correlazione media tra gli asset
   */
  public calculateMinimumCorrelationPortfolio(
    assets: AssetData[],
    constraints: AllocationConstraints = {}
  ): AllocationResult | null {
    console.log('🔄 Calculating Minimum Correlation Portfolio...', {
      assets: assets.length
    });

    const startTime = performance.now();

    try {
      // Calculate correlation matrix
      const correlationMatrix = this.calculateCorrelationMatrix(assets);
      
      // Optimize weights to minimize average correlation
      const optimizationResult = this.optimizeMinimumCorrelation(
        correlationMatrix,
        constraints
      );
      
      const weights = optimizationResult.weights;

      // Calculate portfolio metrics
      const metrics = this.calculatePortfolioMetrics(assets, weights);

      const result: AllocationResult = {
        strategy: 'MIN_CORRELATION',
        weights,
        expectedReturn: metrics.expectedReturn,
        volatility: metrics.volatility,
        sharpeRatio: metrics.sharpeRatio,
        diversificationRatio: metrics.diversificationRatio,
        averageCorrelation: metrics.averageCorrelation,
        assets: assets.map((asset) => ({
          symbol: asset.symbol,
          weight: weights[i]
        })),
        metadata: {
          processingTime: performance.now() - startTime,
          convergenceIterations: optimizationResult.iterations,
          optimizationSuccess: optimizationResult.converged
        }
      };

      console.log('✅ Minimum Correlation Portfolio calculated:', {
        volatility: (result.volatility * 100).toFixed(2) + '%',
        expectedReturn: (result.expectedReturn * 100).toFixed(2) + '%',
        sharpeRatio: result.sharpeRatio.toFixed(3),
        averageCorrelation: (result.averageCorrelation! * 100).toFixed(2) + '%',
        processingTime: `${result.metadata.processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Minimum Correlation Portfolio:', error);
      return null;
    }
  }

  /**
   * Maximum Diversification Ratio Portfolio
   * Massimizza il rapporto di diversificazione
   */
  public calculateMaxDiversificationPortfolio(
    assets: AssetData[],
    constraints: AllocationConstraints = {}
  ): AllocationResult | null {
    console.log('📈 Calculating Maximum Diversification Portfolio...', {
      assets: assets.length
    });

    const startTime = performance.now();

    try {
      // Calculate correlation matrix
      const correlationMatrix = this.calculateCorrelationMatrix(assets);
      const volatilities = assets.map(asset => asset.volatility);
      
      // Optimize weights to maximize diversification ratio
      const optimizationResult = this.optimizeMaxDiversification(
        volatilities,
        correlationMatrix,
        constraints
      );
      
      const weights = optimizationResult.weights;

      // Calculate portfolio metrics
      const metrics = this.calculatePortfolioMetrics(assets, weights);

      const result: AllocationResult = {
        strategy: 'MAX_DIVERSIFICATION',
        weights,
        expectedReturn: metrics.expectedReturn,
        volatility: metrics.volatility,
        sharpeRatio: metrics.sharpeRatio,
        diversificationRatio: metrics.diversificationRatio,
        averageCorrelation: metrics.averageCorrelation,
        assets: assets.map((asset) => ({
          symbol: asset.symbol,
          weight: weights[i]
        })),
        metadata: {
          processingTime: performance.now() - startTime,
          convergenceIterations: optimizationResult.iterations,
          optimizationSuccess: optimizationResult.converged
        }
      };

      console.log('✅ Maximum Diversification Portfolio calculated:', {
        volatility: (result.volatility * 100).toFixed(2) + '%',
        expectedReturn: (result.expectedReturn * 100).toFixed(2) + '%',
        sharpeRatio: result.sharpeRatio.toFixed(3),
        diversificationRatio: result.diversificationRatio!.toFixed(3),
        processingTime: `${result.metadata.processingTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error calculating Maximum Diversification Portfolio:', error);
      return null;
    }
  }

  /**
   * Calcola tutte le strategie alternative in parallelo
   */
  public calculateAllStrategies(
    assets: AssetData[],
    constraints: AllocationConstraints = {}
  ): {
    equalWeight: AllocationResult | null;
    riskParity: AllocationResult | null;
    minimumCorrelation: AllocationResult | null;
    maxDiversification: AllocationResult | null;
  } {
    console.log('🎯 Calculating all alternative allocation strategies...', {
      assets: assets.length
    });

    const startTime = performance.now();

    const results = {
      equalWeight: this.calculateEqualWeightPortfolio(assets, constraints),
      riskParity: this.calculateRiskParityPortfolio(assets, constraints),
      minimumCorrelation: this.calculateMinimumCorrelationPortfolio(assets, constraints),
      maxDiversification: this.calculateMaxDiversificationPortfolio(assets, constraints)
    };

    const totalTime = performance.now() - startTime;
    console.log('✅ All alternative strategies calculated:', {
      totalProcessingTime: `${totalTime.toFixed(2)}ms`
    });

    return results;
  }

  // PRIVATE HELPER METHODS

  /**
   * Calcola la matrice di covarianza
   */
  private calculateCovarianceMatrix(assets: AssetData[]): Matrix {
    const n = assets.length;
    const covMatrix: Matrix = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          covMatrix[i][j] = assets[i].volatility * assets[i].volatility;
        } else {
          covMatrix[i][j] = this.calculateCovariance(assets[i].returns, assets[j].returns);
        }
      }
    }

    return covMatrix;
  }

  /**
   * Calcola la matrice di correlazione
   */
  private calculateCorrelationMatrix(assets: AssetData[]): Matrix {
    const n = assets.length;
    const corrMatrix: Matrix = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          corrMatrix[i][j] = 1.0;
        } else {
          const cov = this.calculateCovariance(assets[i].returns, assets[j].returns);
          const correlation = cov / (assets[i].volatility * assets[j].volatility);
          corrMatrix[i][j] = Math.max(-0.99, Math.min(0.99, correlation));
        }
      }
    }

    return corrMatrix;
  }

  /**
   * Calcola la covarianza tra due serie di rendimenti
   */
  private calculateCovariance(x: Vector, y: Vector): number {
    const n = Math.min(x.length, y.length);
    const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

    let covariance = 0;
    for (let i = 0; i < n; i++) {
      covariance += (x[i] - meanX) * (y[i] - meanY);
    }

    return covariance / (n - 1);
  }

  /**
   * Calcola i pesi basati sulla volatilità inversa
   */
  private calculateInverseVolatilityWeights(assets: AssetData[]): Vector {
    const inverseVols = assets.map(asset => 1 / asset.volatility);
    const sumInverseVols = inverseVols.reduce((sum, val) => sum + val, 0);
    return inverseVols.map(val => val / sumInverseVols);
  }

  /**
   * Ottimizza per la Risk Parity usando algoritmo iterativo
   */
  private optimizeRiskParity(
    initialWeights: Vector,
    covarianceMatrix: Matrix,
    constraints: AllocationConstraints
  ): { weights: Vector; iterations: number; converged: boolean } {
    const maxIterations = constraints.maxIterations || this.DEFAULT_MAXiTERATIONS;
    const tolerance = constraints.tolerance || this.DEFAULT_TOLERANCE;
    
    let weights = [...initialWeights];
    let converged = false;
    let iteration = 0;

    for (iteration = 0; iteration < maxIterations; iteration++) {
      const riskContributions = this.calculateRiskContributions(weights, covarianceMatrix);
      const targetRiskContrib = 1 / weights.length;
      
      // Calcola l'aggiustamento dei pesi
      const adjustments = riskContributions.map(rc => 
        Math.sqrt(targetRiskContrib / Math.max(rc, 1e-8))
      );
      
      // Aggiorna i pesi
      const newWeights = weights.map((w) => w * adjustments[i]);
      const sumWeights = newWeights.reduce((sum, w) => sum + w, 0);
      const normalizedWeights = newWeights.map(w => w / sumWeights);
      
      // Applica i vincoli
      const constrainedWeights = this.applyConstraints(normalizedWeights, constraints);
      
      // Controlla la convergenza
      const maxChange = Math.max(...weights.map((w) => Math.abs(w - constrainedWeights[i])));
      if (maxChange < tolerance) {
        converged = true;
        weights = constrainedWeights;
        break;
      }
      
      weights = constrainedWeights;
    }

    return { weights, iterations: iteration, converged };
  }

  /**
   * Calcola i contributi al rischio per ogni asset
   */
  private calculateRiskContributions(weights: Vector, covarianceMatrix: Matrix): Vector {
    const portfolioVariance = this.calculatePortfolioVariance(weights, covarianceMatrix);
    const marginalContributions = this.multiplyMatrixVector(covarianceMatrix, weights);
    
    return weights.map((w) => (w * marginalContributions[i]) / portfolioVariance);
  }

  /**
   * Calcola la varianza del portafoglio
   */
  private calculatePortfolioVariance(weights: Vector, covarianceMatrix: Matrix): number {
    const weightedCov = this.multiplyMatrixVector(covarianceMatrix, weights);
    return this.dotProduct(weights, weightedCov);
  }

  /**
   * Ottimizza per la correlazione minima
   */
  private optimizeMinimumCorrelation(
    correlationMatrix: Matrix,
    constraints: AllocationConstraints
  ): { weights: Vector; iterations: number; converged: boolean } {
    const n = correlationMatrix.length;
    const maxIterations = constraints.maxIterations || this.DEFAULT_MAXiTERATIONS;
    const tolerance = constraints.tolerance || this.DEFAULT_TOLERANCE;
    
    // Inizializza con pesi uguali
    let weights = new Array(n).fill(1 / n);
    let converged = false;
    let iteration = 0;

    for (iteration = 0; iteration < maxIterations; iteration++) {
      // Calcola il gradiente della correlazione media
      const gradient = this.calculateCorrelationGradient(weights, correlationMatrix);
      
      // Gradient descent step
      const stepSize = 0.01;
      const newWeights = weights.map((w) => w - stepSize * gradient[i]);
      
      // Normalizza e applica vincoli
      const sumWeights = Math.abs(newWeights.reduce((sum, w) => sum + w, 0));
      const normalizedWeights = newWeights.map(w => Math.abs(w) / sumWeights);
      const constrainedWeights = this.applyConstraints(normalizedWeights, constraints);
      
      // Controlla la convergenza
      const maxChange = Math.max(...weights.map((w) => Math.abs(w - constrainedWeights[i])));
      if (maxChange < tolerance) {
        converged = true;
        weights = constrainedWeights;
        break;
      }
      
      weights = constrainedWeights;
    }

    return { weights, iterations: iteration, converged };
  }

  /**
   * Calcola il gradiente della correlazione media
   */
  private calculateCorrelationGradient(weights: Vector, correlationMatrix: Matrix): Vector {
    const n = weights.length;
    const gradient = new Array(n).fill(0);
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          gradient[i] += 2 * weights[j] * correlationMatrix[i][j];
        }
      }
    }
    
    return gradient;
  }

  /**
   * Ottimizza per la massima diversificazione
   */
  private optimizeMaxDiversification(
    volatilities: Vector,
    correlationMatrix: Matrix,
    constraints: AllocationConstraints
  ): { weights: Vector; iterations: number; converged: boolean } {
    const n = volatilities.length;
    const maxIterations = constraints.maxIterations || this.DEFAULT_MAXiTERATIONS;
    const tolerance = constraints.tolerance || this.DEFAULT_TOLERANCE;
    
    // Inizializza con pesi proporzionali alla volatilità
    let weights = volatilities.map(vol => vol / volatilities.reduce((sum, v) => sum + v, 0));
    let converged = false;
    let iteration = 0;

    for (iteration = 0; iteration < maxIterations; iteration++) {
      // Calcola il gradiente del rapporto di diversificazione
      const gradient = this.calculateDiversificationGradient(weights, volatilities, correlationMatrix);
      
      // Gradient ascent step (massimizzazione)
      const stepSize = 0.01;
      const newWeights = weights.map((w) => w + stepSize * gradient[i]);
      
      // Normalizza e applica vincoli
      const sumWeights = Math.abs(newWeights.reduce((sum, w) => sum + w, 0));
      const normalizedWeights = newWeights.map(w => Math.abs(w) / sumWeights);
      const constrainedWeights = this.applyConstraints(normalizedWeights, constraints);
      
      // Controlla la convergenza
      const maxChange = Math.max(...weights.map((w) => Math.abs(w - constrainedWeights[i])));
      if (maxChange < tolerance) {
        converged = true;
        weights = constrainedWeights;
        break;
      }
      
      weights = constrainedWeights;
    }

    return { weights, iterations: iteration, converged };
  }

  /**
   * Calcola il gradiente del rapporto di diversificazione
   */
  private calculateDiversificationGradient(
    weights: Vector,
    volatilities: Vector,
    correlationMatrix: Matrix
  ): Vector {
    const n = weights.length;
    const gradient = new Array(n).fill(0);
    
    // Calcola la volatilità pesata
    const weightedVol = this.dotProduct(weights, volatilities);
    
    // Calcola la volatilità del portafoglio
    const portfolioVol = this.calculatePortfolioVolatility(weights, volatilities, correlationMatrix);
    
    // Calcola il gradiente
    for (let i = 0; i < n; i++) {
      // Derivata del numeratore
      const numeratorDerivative = volatilities[i];
      
      // Derivata del denominatore
      let denominatorDerivative = 0;
      for (let j = 0; j < n; j++) {
        denominatorDerivative += weights[j] * volatilities[i] * volatilities[j] * correlationMatrix[i][j];
      }
      denominatorDerivative /= portfolioVol;
      
      // Gradiente del rapporto
      gradient[i] = (numeratorDerivative * portfolioVol - weightedVol * denominatorDerivative) / 
                   (portfolioVol * portfolioVol);
    }
    
    return gradient;
  }

  /**
   * Calcola la volatilità del portafoglio dalla correlazione
   */
  private calculatePortfolioVolatility(
    weights: Vector,
    volatilities: Vector,
    correlationMatrix: Matrix
  ): number {
    let variance = 0;
    const n = weights.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        variance += weights[i] * weights[j] * volatilities[i] * volatilities[j] * correlationMatrix[i][j];
      }
    }
    
    return Math.sqrt(Math.max(0, variance));
  }

  /**
   * Applica i vincoli sui pesi
   */
  private applyConstraints(weights: Vector, constraints: AllocationConstraints): Vector {
    const minWeight = constraints.minWeight || 0.0;
    const maxWeight = constraints.maxWeight || 1.0;
    
    // Applica i limiti min/max
    let constrainedWeights = weights.map(w => Math.max(minWeight, Math.min(maxWeight, w)));
    
    // Rinormalizza per sommare a 1
    const sum = constrainedWeights.reduce((acc, w) => acc + w, 0);
    if (sum > 0) {
      constrainedWeights = constrainedWeights.map(w => w / sum);
    }
    
    return constrainedWeights;
  }

  /**
   * Calcola le metriche del portafoglio
   */
  private calculatePortfolioMetrics(assets: AssetData[], weights: Vector): {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    diversificationRatio: number;
    averageCorrelation: number;
  } {
    // Rendimento atteso
    const expectedReturn = this.dotProduct(
      weights, 
      assets.map(asset => asset.expectedReturn)
    );

    // Volatilità
    const covarianceMatrix = this.calculateCovarianceMatrix(assets);
    const portfolioVariance = this.calculatePortfolioVariance(weights, covarianceMatrix);
    const volatility = Math.sqrt(portfolioVariance);

    // Sharpe Ratio
    const sharpeRatio = (expectedReturn - this.DEFAULT_RISK_FREE_RATE) / volatility;

    // Diversification Ratio
    const individualVols = assets.map(asset => asset.volatility);
    const weightedAverageVol = this.dotProduct(weights, individualVols);
    const diversificationRatio = weightedAverageVol / volatility;

    // Average Correlation
    const correlationMatrix = this.calculateCorrelationMatrix(assets);
    let sumCorrelations = 0;
    let countCorrelations = 0;
    
    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        sumCorrelations += weights[i] * weights[j] * correlationMatrix[i][j];
        countCorrelations += weights[i] * weights[j];
      }
    }
    
    const averageCorrelation = countCorrelations > 0 ? sumCorrelations / countCorrelations : 0;

    return {
      expectedReturn,
      volatility,
      sharpeRatio,
      diversificationRatio,
      averageCorrelation
    };
  }

  /**
   * Moltiplicazione matrice-vettore
   */
  private multiplyMatrixVector(matrix: Matrix, vector: Vector): Vector {
    const result = new Array(matrix.length).fill(0);
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < vector.length; j++) {
        result[i] += matrix[i][j] * vector[j];
      }
    }
    return result;
  }

  /**
   * Prodotto scalare tra due vettori
   */
  private dotProduct(a: Vector, b: Vector): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }
}

export { AlternativeAllocationsEngine, type AssetData, type AllocationResult, type AllocationConstraints };
