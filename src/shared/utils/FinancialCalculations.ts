/**
 * JavaScript fallback calculations for financial analysis
 * These provide basic functionality when PyScript is unavailable
 */

export interface PortfolioStats {
  mean_return: number;
  volatility: number;
  sharpe_ratio: number;
  source: 'pyscript' | 'javascript';
}

export interface MonteCarloResult {
  expected_price: number;
  min_price: number;
  max_price: number;
  confidenceinterval: [number, number];
  source: 'pyscript' | 'javascript';
}

export interface PriceData {
  date: string;
  price: number;
}

/**
 * Calculate basic statistics for a portfolio using JavaScript
 */
export const calculatePortfolioStatsJS = (
  returns: number[], 
  riskFreeRate: number = 0.02
): PortfolioStats => {
  if (returns.length === 0) {
    throw new Error('No returns data provided');
  }

  // Calculate mean return
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  
  // Calculate volatility (standard deviation)
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / (returns.length - 1);
  const volatility = Math.sqrt(variance);
  
  // Calculate Sharpe ratio
  const sharpeRatio = volatility !== 0 ? (meanReturn - riskFreeRate) / volatility : 0;

  return {
    mean_return: meanReturn * 100, // Convert to percentage
    volatility: volatility * 100,  // Convert to percentage
    sharpe_ratio: sharpeRatio,
    source: 'javascript'
  };
};

/**
 * Simple Monte Carlo simulation using JavaScript
 */
export const runMonteCarloSimulationJS = (
  initialPrice: number,
  expectedReturn: number,
  volatility: number,
  timeHorizon: number = 30, // days
  numSimulations: number = 1000
): MonteCarloResult => {
  const dt = 1 / 252; // Daily time step (assuming 252 trading days per year)
  const drift = expectedReturn - (volatility * volatility) / 2;
  
  const finalPrices: number[] = [];
  
  // Run Monte Carlo simulations
  for (let i = 0; i < numSimulations; i++) {
    let price = initialPrice;
    
    for (let t = 0; t < timeHorizon; t++) {
      const randomShock = generateRandomNormal() * volatility * Math.sqrt(dt);
      const driftComponent = drift * dt;
      price = price * Math.exp(driftComponent + randomShock);
    }
    
    finalPrices.push(price);
  }
  
  // Calculate statistics
  finalPrices.sort((a, b) => a - b);
  
  const expectedPrice = finalPrices.reduce((sum, price) => sum + price, 0) / finalPrices.length;
  const minPrice = finalPrices[0];
  const maxPrice = finalPrices[finalPrices.length - 1];
  
  // 95% confidence interval (2.5th and 97.5th percentiles)
  const lowerIndex = Math.floor(0.025 * finalPrices.length);
  const upperIndex = Math.floor(0.975 * finalPrices.length);
  const confidenceInterval: [number, number] = [
    finalPrices[lowerIndex],
    finalPrices[upperIndex]
  ];

  return {
    expected_price: Number(expectedPrice.toFixed(2)),
    min_price: Number(minPrice.toFixed(2)),
    max_price: Number(maxPrice.toFixed(2)),
    confidenceinterval: [
      Number(confidenceInterval[0].toFixed(2)),
      Number(confidenceInterval[1].toFixed(2))
    ],
    source: 'javascript'
  };
};

/**
 * Generate random number from normal distribution using Box-Muller transform
 */
const generateRandomNormal = (): number => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

/**
 * Calculate returns from price data
 */
export const calculateReturns = (prices: number[]): number[] => {
  if (prices.length < 2) {
    throw new Error('Need at least 2 price points to calculate returns');
  }
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const returnValue = (prices[i] - prices[i-1]) / prices[i-1];
    returns.push(returnValue);
  }
  
  return returns;
};

/**
 * Generate sample portfolio data for testing
 */
export const generateSamplePortfolioData = (): {
  prices: number[];
  returns: number[];
  initialPrice: number;
} => {
  // Generate sample daily prices for a stock over 100 days
  const initialPrice = 100;
  const prices = [initialPrice];
  
  // Simulate random walk with drift
  for (let i = 1; i < 100; i++) {
    const randomReturn = generateRandomNormal() * 0.02 + 0.001; // 2% daily vol, 0.1% daily return
    const newPrice = prices[i-1] * (1 + randomReturn);
    prices.push(Number(newPrice.toFixed(2)));
  }
  
  const returns = calculateReturns(prices);
  
  return {
    prices,
    returns,
    initialPrice
  };
};

/**
 * Validate calculation inputs
 */
export const validateCalculationInputs = (
  data: number[] | null,
  operation: string
): { isValid: boolean; error?: string } => {
  if (!data) {
    return { isValid: false, error: `No data provided for ${operation}` };
  }
  
  if (!Array.isArray(data)) {
    return { isValid: false, error: `Invalid data format for ${operation}` };
  }
  
  if (data.length === 0) {
    return { isValid: false, error: `Empty data array for ${operation}` };
  }
  
  if (data.some(value => typeof value !== 'number' || isNaN(value))) {
    return { isValid: false, error: `Invalid numeric data for ${operation}` };
  }
  
  return { isValid: true };
};

/**
 * Format percentage for display
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  if (isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format currency for display
 */
export const formatCurrency = (value: number, decimals: number = 2): string => {
  if (isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  return `$${value.toFixed(decimals)}`;
};

/**
 * Check if a value is within reasonable financial bounds
 */
export const isReasonableFinancialValue = (
  value: number, 
  type: 'return' | 'volatility' | 'price' | 'ratio'
): boolean => {
  if (isNaN(value) || !isFinite(value)) {
    return false;
  }
  
  switch (type) {
    case 'return':
      // Annual returns between -100% and +1000% are reasonable
      return value >= -100 && value <= 1000;
    case 'volatility':
      // Volatility between 0% and 200% is reasonable
      return value >= 0 && value <= 200;
    case 'price':
      // Prices between $0.01 and $10,000 are reasonable for most assets
      return value >= 0.01 && value <= 10000;
    case 'ratio':
      // Ratios between -10 and +10 are reasonable
      return value >= -10 && value <= 10;
    default:
      return true;
  }
};

/**
 * Performance benchmarks for calculation time
 */
export const PERFORMANCE_BENCHMARKS = {
  portfolio_stats: {
    javascript: 10, // milliseconds
    pyscript: 100   // milliseconds
  },
  monte_carlo: {
    javascript: 100,  // milliseconds
    pyscript: 500     // milliseconds
  }
} as const;

/**
 * Default calculation parameters
 */
export const DEFAULT_CALCULATION_PARAMS = {
  riskFreeRate: 0.02,        // 2% annual risk-free rate
  monteCarloSimulations: 1000, // Number of simulations
  timeHorizon: 30,           // Days for Monte Carlo
  confidenceLevel: 0.95      // 95% confidence interval
} as const; 
