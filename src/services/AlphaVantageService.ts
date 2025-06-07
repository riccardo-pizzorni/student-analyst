/**
 * STUDENT ANALYST - Alpha Vantage Service
 * ======================================
 * 
 * Professional financial data service that connects directly to Alpha Vantage API
 * Provides reliable access to real-time and historical stock market data
 * with robust error handling and intelligent rate limiting compliance.
 */

import { CircuitBreaker } from '../utils/CircuitBreaker';

// Types for Alpha Vantage API responses and our standardized data format
export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

export interface StockData {
  symbol: string;
  timeframe: Timeframe;
  data: StockDataPoint[];
  metadata: {
    lastRefreshed: string;
    timeZone: string;
    dataSource: 'ALPHA_VANTAGE';
    requestTime: string;
  };
}

export type Timeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INTRADAY_1MIN' | 'INTRADAY_5MIN' | 'INTRADAY_15MIN';

export interface AlphaVantageError {
  type: 'RATE_LIMITED' | 'INVALID_APIkey' | 'SYMBOL_NOT_FOUND' | 'NETWORKerror' | 'INVALID_REQUEST' | 'SERVICE_UNAVAILABLE';
  message: string;
  userFriendlyMessage: string;
  retryable: boolean;
  retryAfter?: number; // seconds
  suggestedAction?: string;
}

export interface ApiCallOptions {
  symbol: string;
  timeframe?: Timeframe;
  startDate?: string;
  endDate?: string;
  timeout?: number;
}

export interface AlphaVantageRawResponse {
  'Meta Data'?: Record<string, string>;
  'Time Series (Daily)'?: Record<string, Record<string, string>>;
  'Weekly Time Series'?: Record<string, Record<string, string>>;
  'Monthly Time Series'?: Record<string, Record<string, string>>;
  'Time Series (1min)'?: Record<string, Record<string, string>>;
  'Time Series (5min)'?: Record<string, Record<string, string>>;
  'Time Series (15min)'?: Record<string, Record<string, string>>;
  'Error Message'?: string;
  'Note'?: string;
  'Information'?: string;
}

/**
 * Main Alpha Vantage service class that handles all communications with the API
 */
export class AlphaVantageService {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';
  private circuitBreaker: CircuitBreaker;
  private requestCount = 0;
  private requestTimes: number[] = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 5;
  private readonly MAX_REQUESTS_PER_DAY = 25;

  constructor() {
    // Get API key from environment variables with validation
    this.apiKey = this.getValidatedApiKey();
    
    // Initialize circuit breaker for service resilience
    this.circuitBreaker = new CircuitBreaker('AlphaVantageService', {
      failureThreshold: 3,
      recoveryTimeout: 300000, // 5 minutes
      successThreshold: 1,
      monitoringPeriod: 60000   // 1 minute
    });
  }

  /**
   * Main method to get stock data for any symbol and timeframe
   */
  public async getStockData(options: ApiCallOptions): Promise<StockData> {
    try {
      // Input validation
      this.validateStockDataRequest(options);
      
      // Check rate limits before making request
      await this.checkRateLimits();
      
      // Make the API call through circuit breaker
      const rawData = await this.circuitBreaker.execute(() => 
        this.makeApiCall(options)
      );
      
      // Parse and validate response
      const parsedData = this.parseStockDataResponse(rawData, options);
      
      // Track successful request
      this.trackApiCall();
      
      return parsedData;
      
    } catch (error) {
      // Convert any error to our standardized format
      throw this.handleApiError(error, options);
    }
  }

  /**
   * Validates the API key from environment variables
   */
  private getValidatedApiKey(): string {
    const apiKey = import.meta.env.VITE_APIkey_ALPHA_VANTAGE;
    
    if (!apiKey) {
      throw new Error(
        'Alpha Vantage API key not found. Please check your .env file and ensure VITE_APIkey_ALPHA_VANTAGE is set.'
      );
    }
    
    if (apiKey === 'demo' || apiKey === 'your_alpha_vantage_apikey_here') {
      console.warn(
        '⚠️  Using demo API key. Replace with your real Alpha Vantage API key for production use.'
      );
    }
    
    return apiKey;
  }

  /**
   * Validates input parameters for stock data requests
   */
  private validateStockDataRequest(options: ApiCallOptions): void {
    if (!options.symbol || typeof options.symbol !== 'string') {
      throw new Error('Symbol is required and must be a string');
    }
    
    // Clean and validate symbol format
    options.symbol = options.symbol.trim().toUpperCase();
    if (!/^[A-Z]{1,5}$/.test(options.symbol)) {
      throw new Error(
        `Invalid symbol format: "${options.symbol}". Symbol must be 1-5 letters (e.g., "AAPL", "MSFT")`
      );
    }
    
    // Validate timeframe
    if (options.timeframe && !['DAILY', 'WEEKLY', 'MONTHLY', 'INTRADAY_1MIN', 'INTRADAY_5MIN', 'INTRADAY_15MIN'].includes(options.timeframe)) {
      throw new Error(
        `Invalid timeframe: "${options.timeframe}". Must be one of: DAILY, WEEKLY, MONTHLY, INTRADAY_1MIN, INTRADAY_5MIN, INTRADAY_15MIN`
      );
    }
    
    // Validate dates if provided
    if (options.startDate && !this.isValidDate(options.startDate)) {
      throw new Error(`Invalid start date format: "${options.startDate}". Use YYYY-MM-DD format`);
    }
    
    if (options.endDate && !this.isValidDate(options.endDate)) {
      throw new Error(`Invalid end date format: "${options.endDate}". Use YYYY-MM-DD format`);
    }
  }

  /**
   * Checks if we're within rate limits before making a request
   */
  private async checkRateLimits(): Promise<void> {
    const now = Date.now();
    
    // Clean old request times (older than 1 minute)
    this.requestTimes = this.requestTimes.filter(time => now - time < 60000);
    
    // Check requests per minute limit
    if (this.requestTimes.length >= this.MAX_REQUESTS_PER_MINUTE) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = 60000 - (now - oldestRequest);
      
      throw this.createAlphaVantageError(
        'RATE_LIMITED',
        `Rate limit exceeded: ${this.MAX_REQUESTS_PER_MINUTE} requests per minute`,
        `You've reached the limit of ${this.MAX_REQUESTS_PER_MINUTE} requests per minute. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`,
        true,
        Math.ceil(waitTime / 1000)
      );
    }
    
    // Check daily limit (simplified - in production you'd want persistent storage)
    if (this.requestCount >= this.MAX_REQUESTS_PER_DAY) {
      throw this.createAlphaVantageError(
        'RATE_LIMITED',
        `Daily limit exceeded: ${this.MAX_REQUESTS_PER_DAY} requests per day`,
        `You've reached the daily limit of ${this.MAX_REQUESTS_PER_DAY} requests. Limit resets at midnight EST.`,
        false
      );
    }
  }

  /**
   * Makes the actual HTTP request to Alpha Vantage API
   */
  private async makeApiCall(options: ApiCallOptions): Promise<AlphaVantageRawResponse> {
    const params = this.buildApiParams(options);
    const url = `${this.baseUrl}?${params.toString()}`;
    
    console.log(`📊 Fetching data for ${options.symbol} (${options.timeframe || 'DAILY'})...`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'StudentAnalyst/1.0'
        }
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  /**
   * Builds URL parameters for Alpha Vantage API calls
   */
  private buildApiParams(options: ApiCallOptions): URLSearchParams {
    const params = new URLSearchParams();
    params.append('apikey', this.apiKey);
    params.append('symbol', options.symbol);
    
    // Set function based on timeframe
    switch (options.timeframe || 'DAILY') {
      case 'DAILY':
        params.append('function', 'TIME_SERIES_DAILY');
        params.append('outputsize', 'compact'); // Last 100 days
        break;
      case 'WEEKLY':
        params.append('function', 'TIME_SERIES_WEEKLY');
        break;
      case 'MONTHLY':
        params.append('function', 'TIME_SERIES_MONTHLY');
        break;
      case 'INTRADAY_1MIN':
        params.append('function', 'TIME_SERIESiNTRADAY');
        params.append('interval', '1min');
        break;
      case 'INTRADAY_5MIN':
        params.append('function', 'TIME_SERIESiNTRADAY');
        params.append('interval', '5min');
        break;
      case 'INTRADAY_15MIN':
        params.append('function', 'TIME_SERIESiNTRADAY');
        params.append('interval', '15min');
        break;
    }
    
    return params;
  }

  /**
   * Parses Alpha Vantage response into our standardized format
   */
  private parseStockDataResponse(rawData: AlphaVantageRawResponse, options: ApiCallOptions): StockData {
    // Check for API errors first
    if (rawData['Error Message']) {
      throw this.createAlphaVantageError(
        'SYMBOL_NOT_FOUND',
        rawData['Error Message'],
        `The symbol "${options.symbol}" was not found. Please check the symbol spelling and try again.`,
        false,
        undefined,
        `Try searching for "${options.symbol}" on financial websites to verify the correct symbol.`
      );
    }
    
    if (rawData['Note']) {
      throw this.createAlphaVantageError(
        'RATE_LIMITED',
        rawData['Note'],
        'API call frequency limit reached. The request will be retried automatically.',
        true,
        60
      );
    }
    
    if (rawData['Information']) {
      throw this.createAlphaVantageError(
        'RATE_LIMITED',
        rawData['Information'],
        'API usage limit reached. Please wait before making more requests.',
        true,
        300
      );
    }
    
    // Extract metadata
    const metadata = rawData['Meta Data'];
    if (!metadata) {
      throw new Error('Invalid response format: Missing metadata');
    }
    
    // Extract time series data based on timeframe
    const timeframe = options.timeframe || 'DAILY';
    let timeSeries: any;
    
    switch (timeframe) {
      case 'DAILY':
        timeSeries = rawData['Time Series (Daily)'];
        break;
      case 'WEEKLY':
        timeSeries = rawData['Weekly Time Series'];
        break;
      case 'MONTHLY':
        timeSeries = rawData['Monthly Time Series'];
        break;
      case 'INTRADAY_1MIN':
        timeSeries = rawData['Time Series (1min)'];
        break;
      case 'INTRADAY_5MIN':
        timeSeries = rawData['Time Series (5min)'];
        break;
      case 'INTRADAY_15MIN':
        timeSeries = rawData['Time Series (15min)'];
        break;
    }
    
    if (!timeSeries) {
      throw new Error('Invalid response format: Missing time series data');
    }
    
    // Parse data points
    const dataPoints: StockDataPoint[] = [];
    for (const [date, values] of Object.entries(timeSeries)) {
      const priceData = values as Record<string, string>;
      const point: StockDataPoint = {
        date,
        open: parseFloat(priceData['1. open']),
        high: parseFloat(priceData['2. high']),
        low: parseFloat(priceData['3. low']),
        close: parseFloat(priceData['4. close']),
        volume: parseInt(priceData['5. volume']),
      };
      
      // Add adjusted close if available
      if (priceData['6. adjusted close']) {
        point.adjustedClose = parseFloat(priceData['6. adjusted close']);
      }
      
      // Validate data point
      if (this.isValidDataPoint(point)) {
        dataPoints.push(point);
      }
    }
    
    if (dataPoints.length === 0) {
      throw new Error('No valid data points found in response');
    }
    
    // Sort by date (newest first)
    dataPoints.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return {
      symbol: options.symbol,
      timeframe,
      data: dataPoints,
      metadata: {
        lastRefreshed: metadata['3. Last Refreshed'] || metadata['2. Last Refreshed'] || new Date().toISOString(),
        timeZone: metadata['5. Time Zone'] || metadata['4. Time Zone'] || 'US/Eastern',
        dataSource: 'ALPHA_VANTAGE',
        requestTime: new Date().toISOString()
      }
    };
  }

  /**
   * Validates a single data point for completeness and sanity
   */
  private isValidDataPoint(point: StockDataPoint): boolean {
    return (
      !isNaN(point.open) && point.open > 0 &&
      !isNaN(point.high) && point.high > 0 &&
      !isNaN(point.low) && point.low > 0 &&
      !isNaN(point.close) && point.close > 0 &&
      !isNaN(point.volume) && point.volume >= 0 &&
      point.high >= point.low &&
      point.high >= point.open &&
      point.high >= point.close &&
      point.low <= point.open &&
      point.low <= point.close
    );
  }

  /**
   * Tracks successful API calls for rate limiting
   */
  private trackApiCall(): void {
    const now = Date.now();
    this.requestTimes.push(now);
    this.requestCount++;
  }

  /**
   * Comprehensive error handling for Alpha Vantage specific issues
   */
  private handleApiError(error: any, options: ApiCallOptions): AlphaVantageError {
    // If it's already our error format, return as-is
    if (error.type && error.userFriendlyMessage) {
      return error;
    }
    
    const errorMessage = error.message || error.toString();
    
    // Network timeout
    if (error.name === 'AbortError' || errorMessage.includes('timeout')) {
      return this.createAlphaVantageError(
        'NETWORKerror',
        'Request timeout',
        'The request took too long to complete. This might be due to network issues. Trying again...',
        true,
        5
      );
    }
    
    // Network connectivity issues
    if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
      return this.createAlphaVantageError(
        'NETWORKerror',
        'Network connectivity issue',
        'Unable to connect to Alpha Vantage servers. Checking your internet connection and retrying...',
        true,
        10
      );
    }
    
    // HTTP errors
    if (errorMessage.includes('HTTP 429')) {
      return this.createAlphaVantageError(
        'RATE_LIMITED',
        'Too many requests',
        'Rate limit exceeded. Waiting before retrying automatically...',
        true,
        60
      );
    }
    
    if (errorMessage.includes('HTTP 401') || errorMessage.includes('HTTP 403')) {
      return this.createAlphaVantageError(
        'INVALID_APIkey',
        'Authentication failed',
        'API key is invalid or expired. Please check your configuration.',
        false,
        undefined,
        'Verify your Alpha Vantage API key in the .env file'
      );
    }
    
    if (errorMessage.includes('HTTP 500') || errorMessage.includes('HTTP 502') || errorMessage.includes('HTTP 503')) {
      return this.createAlphaVantageError(
        'SERVICE_UNAVAILABLE',
        'Alpha Vantage service unavailable',
        'Alpha Vantage servers are temporarily unavailable. Retrying automatically...',
        true,
        30
      );
    }
    
    // Validation errors
    if (errorMessage.includes('Invalid symbol') || errorMessage.includes('Symbol is required')) {
      return this.createAlphaVantageError(
        'INVALID_REQUEST',
        errorMessage,
        `Please check the symbol "${options.symbol}" and ensure it's a valid stock ticker.`,
        false,
        undefined,
        'Use symbols like AAPL, MSFT, GOOGL'
      );
    }
    
    // Generic fallback
    return this.createAlphaVantageError(
      'SERVICE_UNAVAILABLE',
      errorMessage,
      'An unexpected error occurred while fetching financial data. Retrying...',
      true,
      15
    );
  }

  /**
   * Creates standardized Alpha Vantage error objects
   */
  private createAlphaVantageError(
    type: AlphaVantageError['type'],
    message: string,
    userFriendlyMessage: string,
    retryable: boolean,
    retryAfter?: number,
    suggestedAction?: string
  ): AlphaVantageError {
    return {
      type,
      message,
      userFriendlyMessage,
      retryable,
      retryAfter,
      suggestedAction
    };
  }

  /**
   * Validates date string format (YYYY-MM-DD)
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Gets current usage statistics for monitoring
   */
  public getUsageStats(): {
    requestsThisMinute: number;
    requestsToday: number;
    maxRequestsPerMinute: number;
    maxRequestsPerDay: number;
    canMakeRequest: boolean;
  } {
    const now = Date.now();
    const requestsThisMinute = this.requestTimes.filter(time => now - time < 60000).length;
    
    return {
      requestsThisMinute,
      requestsToday: this.requestCount,
      maxRequestsPerMinute: this.MAX_REQUESTS_PER_MINUTE,
      maxRequestsPerDay: this.MAX_REQUESTS_PER_DAY,
      canMakeRequest: requestsThisMinute < this.MAX_REQUESTS_PER_MINUTE && this.requestCount < this.MAX_REQUESTS_PER_DAY
    };
  }
}

// Export singleton instance for use throughout the application
export const alphaVantageService = new AlphaVantageService();
