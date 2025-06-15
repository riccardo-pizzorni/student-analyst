import { 
  PortfolioStats, 
  MonteCarloResult, 
  calculatePortfolioStatsJS, 
  runMonteCarloSimulationJS,
  generateSamplePortfolioData,
  validateCalculationInputs,
  isReasonableFinancialValue,
  PERFORMANCE_BENCHMARKS
} from './FinancialCalculations';

export enum CalculationEngine {
  PYSCRIPT = 'pyscript',
  JAVASCRIPT = 'javascript'
}

export interface PyScriptStatus {
  isAvailable: boolean;
  isReady: boolean;
  error?: string;
  lastCheck: number;
}

export interface CalculationResult<T> {
  data: T;
  engine: CalculationEngine;
  executionTime: number;
  fallbackUsed: boolean;
  error?: string;
}

export class PyScriptWrapper {
  private static instance: PyScriptWrapper;
  private status: PyScriptStatus = {
    isAvailable: false,
    isReady: false,
    lastCheck: 0
  };
  private checkInterval: number | null = null;
  private readonly CHECKiNTERVAL_MS = 5000; // Check every 5 seconds
  private readonly TIMEOUT_MS = 10000; // 10 second timeout for operations

  private constructor() {
    this.initializeStatusCheck();
  }

  static getInstance(): PyScriptWrapper {
    if (!PyScriptWrapper.instance) {
      PyScriptWrapper.instance = new PyScriptWrapper();
    }
    return PyScriptWrapper.instance;
  }

  /**
   * Initialize periodic status checking
   */
  private initializeStatusCheck(): void {
    this.checkPyScriptStatus();
    
    if (typeof window !== 'undefined') {
      this.checkInterval = window.setInterval(() => {
        this.checkPyScriptStatus();
      }, this.CHECKiNTERVAL_MS);
    }
  }

  /**
   * Check PyScript availability and readiness
   */
  private checkPyScriptStatus(): void {
    const now = Date.now();
    
    try {
      // Check if PyScript is available in the window object
      if (typeof window !== 'undefined' && window.pyscript) {
        // Check if PyScript interpreter is ready
        const isReady = this.isPyScriptInterpreterReady();
        
        this.status = {
          isAvailable: true,
          isReady,
          lastCheck: now
        };
      } else {
        this.status = {
          isAvailable: false,
          isReady: false,
          error: 'PyScript not found in window object',
          lastCheck: now
        };
      }
    } catch (error) {
      this.status = {
        isAvailable: false,
        isReady: false,
        error: error instanceof Error ? error.message : 'Unknown PyScript error',
        lastCheck: now
      };
    }
  }

  /**
   * Check if PyScript interpreter is ready to execute code
   */
  private isPyScriptInterpreterReady(): boolean {
    try {
      // Try to access PyScript interpreter
      if (window.pyscript && window.pyscript.interpreter) {
        return true;
      }
      
      // Alternative check: look for PyScript runtime elements
      const pyScriptElements = document.querySelectorAll('py-script, py-repl');
      return pyScriptElements.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get current PyScript status
   */
  getStatus(): PyScriptStatus {
    // Refresh status if it's been too long since last check
    const timeSinceLastCheck = Date.now() - this.status.lastCheck;
    if (timeSinceLastCheck > this.CHECKiNTERVAL_MS) {
      this.checkPyScriptStatus();
    }
    
    return { ...this.status };
  }

  /**
   * Execute PyScript code with timeout and error handling
   */
  private async executePyScriptCode(
    code: string, 
    timeout: number = this.TIMEOUT_MS
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`PyScript execution timed out after ${timeout}ms`));
      }, timeout);

      try {
        // Try to execute PyScript code
        if (!window.pyscript || !window.pyscript.interpreter) {
          throw new Error('PyScript interpreter not available');
        }

        // Execute the Python code
        const result = window.pyscript.interpreter.runPython(code);
        
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Calculate portfolio statistics with PyScript fallback to JavaScript
   */
  async calculatePortfolioStats(
    returns?: number[]
  ): Promise<CalculationResult<PortfolioStats>> {
    const startTime = Date.now();
    
    // Use sample data if none provided
    if (!returns) {
      const sampleData = generateSamplePortfolioData();
      returns = sampleData.returns;
    }

    // Validate inputs
    const validation = validateCalculationInputs(returns, 'portfolio statistics');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    let fallbackUsed = false;
    let engine = CalculationEngine.PYSCRIPT;
    let error: string | undefined;

    try {
      // Try PyScript first if available
      if (this.status.isAvailable && this.status.isReady) {
        const result = await this.tryPyScriptPortfolioCalculation(returns);
        if (result) {
          const executionTime = Date.now() - startTime;
          return {
            data: { ...result, source: 'pyscript' as const },
            engine,
            executionTime,
            fallbackUsed
          };
        }
      }
    } catch (pyError) {
      error = pyError instanceof Error ? pyError.message : 'PyScript calculation failed';
      console.warn('PyScript portfolio calculation failed:', error);
    }

    // Fall back to JavaScript calculation
    fallbackUsed = true;
    engine = CalculationEngine.JAVASCRIPT;
    
    try {
      const result = calculatePortfolioStatsJS(returns);
      const executionTime = Date.now() - startTime;
      
      // Validate results
      if (!this.validatePortfolioResults(result)) {
        throw new Error('Portfolio calculation produced invalid results');
      }

      return {
        data: result,
        engine,
        executionTime,
        fallbackUsed,
        error
      };
    } catch (jsError) {
      throw new Error(
        `Both PyScript and JavaScript calculations failed. PyScript: ${error}, JavaScript: ${jsError instanceof Error ? jsError.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Run Monte Carlo simulation with PyScript fallback to JavaScript
   */
  async runMonteCarloSimulation(
    initialPrice?: number,
    expectedReturn?: number,
    volatility?: number,
    timeHorizon?: number,
    numSimulations?: number
  ): Promise<CalculationResult<MonteCarloResult>> {
    const startTime = Date.now();
    
    // Use default parameters if not provided
    const params = {
      initialPrice: initialPrice ?? 100,
      expectedReturn: expectedReturn ?? 0.1,
      volatility: volatility ?? 0.2,
      timeHorizon: timeHorizon ?? 30,
      numSimulations: numSimulations ?? 1000
    };

    let fallbackUsed = false;
    let engine = CalculationEngine.PYSCRIPT;
    let error: string | undefined;

    try {
      // Try PyScript first if available
      if (this.status.isAvailable && this.status.isReady) {
        const result = await this.tryPyScriptMonteCarloCalculation(params);
        if (result) {
          const executionTime = Date.now() - startTime;
          return {
            data: { ...result, source: 'pyscript' as const },
            engine,
            executionTime,
            fallbackUsed
          };
        }
      }
    } catch (pyError) {
      error = pyError instanceof Error ? pyError.message : 'PyScript Monte Carlo failed';
      console.warn('PyScript Monte Carlo simulation failed:', error);
    }

    // Fall back to JavaScript calculation
    fallbackUsed = true;
    engine = CalculationEngine.JAVASCRIPT;
    
    try {
      const result = runMonteCarloSimulationJS(
        params.initialPrice,
        params.expectedReturn,
        params.volatility,
        params.timeHorizon,
        params.numSimulations
      );
      const executionTime = Date.now() - startTime;
      
      // Validate results
      if (!this.validateMonteCarloResults(result)) {
        throw new Error('Monte Carlo simulation produced invalid results');
      }

      return {
        data: result,
        engine,
        executionTime,
        fallbackUsed,
        error
      };
    } catch (jsError) {
      throw new Error(
        `Both PyScript and JavaScript Monte Carlo failed. PyScript: ${error}, JavaScript: ${jsError instanceof Error ? jsError.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Try PyScript portfolio calculation
   */
  private async tryPyScriptPortfolioCalculation(returns: number[]): Promise<PortfolioStats | null> {
    const pythonCode = `
import numpy as np

# Portfolio statistics calculation
returns = np.array([${returns.join(', ')}])
mean_return = np.mean(returns) * 100
volatility = np.std(returns, ddof=1) * 100
sharpe_ratio = mean_return / volatility if volatility > 0 else 0
risk_free_rate = 2.0

{
  "mean_return": float(mean_return),
  "volatility": float(volatility),
  "sharpe_ratio": float((mean_return - risk_free_rate) / volatility if volatility > 0 else 0)
}
`;

    try {
      const result = await this.executePyScriptCode(pythonCode);
      if (result && typeof result === 'object') {
        return {
          mean_return: result.mean_return,
          volatility: result.volatility,
          sharpe_ratio: result.sharpe_ratio,
          source: 'pyscript'
        };
      }
      return null;
    } catch (error) {
      console.error('PyScript portfolio calculation error:', error);
      return null;
    }
  }

  /**
   * Try PyScript Monte Carlo calculation
   */
  private async tryPyScriptMonteCarloCalculation(params: {
    initialPrice: number;
    expectedReturn: number;
    volatility: number;
    timeHorizon: number;
    numSimulations: number;
  }): Promise<MonteCarloResult | null> {
    const pythonCode = `
import numpy as np

# Monte Carlo simulation parameters
S0 = ${params.initialPrice}
mu = ${params.expectedReturn}
sigma = ${params.volatility}
T = ${params.timeHorizon}
dt = 1/252
n_sims = ${params.numSimulations}

# Run Monte Carlo simulation
np.random.seed(42)  # For reproducible results
final_prices = []

for i in range(n_sims):
    price = S0
    for t in range(T):
        dW = np.random.normal(0, 1)
        price = price * np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * dW)
    final_prices.append(price)

final_prices = np.array(final_prices)
expected_price = np.mean(final_prices)
min_price = np.min(final_prices)
max_price = np.max(final_prices)
ci_lower = np.percentile(final_prices, 2.5)
ci_upper = np.percentile(final_prices, 97.5)

{
  "expected_price": float(expected_price),
  "min_price": float(min_price),
  "max_price": float(max_price),
  "confidenceinterval": [float(ci_lower), float(ci_upper)]
}
`;

    try {
      const result = await this.executePyScriptCode(pythonCode);
      if (result && typeof result === 'object') {
        return {
          expected_price: Number(result.expected_price.toFixed(2)),
          min_price: Number(result.min_price.toFixed(2)),
          max_price: Number(result.max_price.toFixed(2)),
          confidenceinterval: [
            Number(result.confidenceinterval[0].toFixed(2)),
            Number(result.confidenceinterval[1].toFixed(2))
          ],
          source: 'pyscript'
        };
      }
      return null;
    } catch (error) {
      console.error('PyScript Monte Carlo calculation error:', error);
      return null;
    }
  }

  /**
   * Validate portfolio calculation results
   */
  private validatePortfolioResults(result: PortfolioStats): boolean {
    return (
      isReasonableFinancialValue(result.mean_return, 'return') &&
      isReasonableFinancialValue(result.volatility, 'volatility') &&
      isReasonableFinancialValue(result.sharpe_ratio, 'ratio')
    );
  }

  /**
   * Validate Monte Carlo simulation results
   */
  private validateMonteCarloResults(result: MonteCarloResult): boolean {
    return (
      isReasonableFinancialValue(result.expected_price, 'price') &&
      isReasonableFinancialValue(result.min_price, 'price') &&
      isReasonableFinancialValue(result.max_price, 'price') &&
      result.min_price <= result.expected_price &&
      result.expected_price <= result.max_price &&
      result.confidenceinterval[0] <= result.confidenceinterval[1]
    );
  }

  /**
   * Get performance info for the last calculation
   */
  getPerformanceInfo(
    calculationType: 'portfolio_stats' | 'monte_carlo',
    engine: CalculationEngine,
    executionTime: number
  ): {
    isWithinBenchmark: boolean;
    benchmark: number;
    performance: 'excellent' | 'good' | 'slow' | 'very_slow';
  } {
    const benchmark = PERFORMANCE_BENCHMARKS[calculationType][engine];
    const ratio = executionTime / benchmark;
    
    let performance: 'excellent' | 'good' | 'slow' | 'very_slow';
    if (ratio <= 1) performance = 'excellent';
    else if (ratio <= 2) performance = 'good';
    else if (ratio <= 5) performance = 'slow';
    else performance = 'very_slow';

    return {
      isWithinBenchmark: ratio <= 2,
      benchmark,
      performance
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}



// Export singleton instance
export const pyScriptWrapper = PyScriptWrapper.getInstance(); 
