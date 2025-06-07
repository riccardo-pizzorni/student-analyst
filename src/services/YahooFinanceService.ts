/**
 * STUDENT ANALYST - Yahoo Finance Service
 * Free alternative data provider with CSV parsing and same interface as AlphaVantage
 */

import { CircuitBreaker } from '../utils/CircuitBreaker';

// Re-use the same interfaces from AlphaVantageService for compatibility
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
    dataSource: 'YAHOO_FINANCE';
    requestTime: string;
  };
}

export type Timeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INTRADAY_1MIN' | 'INTRADAY_5MIN' | 'INTRADAY_15MIN';

export interface YahooFinanceError {
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

/**
 * Yahoo Finance service that provides the same interface as AlphaVantageService
 * but uses Yahoo Finance's free CSV data API
 */
export class YahooFinanceService {
  private baseUrl = 'https://query1.finance.yahoo.com/v7/finance/download/';
  private circuitBreaker: CircuitBreaker;
  private requestCount = 0;
  private requestTimes: number[] = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 60; // Yahoo is more generous than Alpha Vantage
  private readonly MAX_REQUESTS_PER_DAY = 2000;

  constructor() {
    // Initialize circuit breaker for service resilience
    this.circuitBreaker = new CircuitBreaker('YahooFinanceService', {
      failureThreshold: 5,
      recoveryTimeout: 180000, // 3 minutes
      successThreshold: 2,
      monitoringPeriod: 60000   // 1 minute
    });
  }

  /**
   * Main method to get stock data - same interface as AlphaVantageService
   */
  public async getStockData(options: ApiCallOptions): Promise<StockData> {
    try {
      // Input validation
      this.validateStockDataRequest(options);
      
      // Check rate limits before making request
      await this.checkRateLimits();
      
      // Make the API call through circuit breaker
      const csvData = await this.circuitBreaker.execute(() => 
        this.makeApiCall(options)
      );
      
      // Parse CSV response into our standard format
      const parsedData = this.parseStockDataResponse(csvData, options);
      
      // Track successful request
      this.trackApiCall();
      
      return parsedData;
      
    } catch (error) {
      // Convert any error to our standardized format
      throw this.handleApiError(error, options);
    }
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
    
    // Yahoo Finance accepts broader symbol formats than Alpha Vantage
    if (!/^[A-Z0-9.^=-]{1,10}$/i.test(options.symbol)) {
      throw new Error(
        `Invalid symbol format: "${options.symbol}". Symbol must be alphanumeric with optional special characters`
      );
    }
    
    // Validate timeframe
    if (options.timeframe && !['DAILY', 'WEEKLY', 'MONTHLY'].includes(options.timeframe)) {
      console.warn(`Yahoo Finance does not support intraday data. Converting ${options.timeframe} to DAILY`);
      options.timeframe = 'DAILY';
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
      
      throw this.createYahooFinanceError(
        'RATE_LIMITED',
        `Rate limit exceeded: ${this.MAX_REQUESTS_PER_MINUTE} requests per minute`,
        `Rate limit reached. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`,
        true,
        Math.ceil(waitTime / 1000)
      );
    }
    
    // Check daily limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_DAY) {
      throw this.createYahooFinanceError(
        'RATE_LIMITED',
        `Daily limit exceeded: ${this.MAX_REQUESTS_PER_DAY} requests per day`,
        'Daily limit reached. Limit resets at midnight EST.',
        false
      );
    }
  }

  /**
   * Makes the actual HTTP request to Yahoo Finance API
   */
  private async makeApiCall(options: ApiCallOptions): Promise<string> {
    const url = this.buildApiUrl(options);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StudentAnalyst/1.0)'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw this.createYahooFinanceError(
            'SYMBOL_NOT_FOUND',
            `Symbol "${options.symbol}" not found`,
            `The symbol "${options.symbol}" was not found. Please verify the symbol spelling.`,
            false,
            undefined,
            'Check the symbol spelling or try searching on finance.yahoo.com'
          );
        }
        
        if (response.status === 429) {
          throw this.createYahooFinanceError(
            'RATE_LIMITED',
            'Too many requests',
            'Rate limit exceeded. Retrying automatically...',
            true,
            60
          );
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      
      // Validate that we got CSV data, not an error page
      if (!csvText || csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
        throw this.createYahooFinanceError(
          'INVALID_REQUEST',
          'Invalid response format',
          'Yahoo Finance returned an invalid response. The symbol might be delisted or unavailable.',
          false,
          undefined,
          'Try a different symbol or check if the symbol is currently traded'
        );
      }
      
      return csvText;
      
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createYahooFinanceError(
          'NETWORKerror',
          'Request timeout',
          'The request took too long to complete. Retrying automatically...',
          true,
          5
        );
      }
      
      throw error;
    }
  }

  /**
   * Builds Yahoo Finance API URL with parameters
   */
  private buildApiUrl(options: ApiCallOptions): string {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    // Convert date strings to Unix timestamps
    const startDate = options.startDate ? new Date(options.startDate) : oneYearAgo;
    const endDate = options.endDate ? new Date(options.endDate) : now;
    
    // Convert timeframe to Yahoo Finance interval
    let interval = '1d'; // default daily
    switch (options.timeframe) {
      case 'WEEKLY':
        interval = '1wk';
        break;
      case 'MONTHLY':
        interval = '1mo';
        break;
      case 'DAILY':
      default:
        interval = '1d';
        break;
    }
    
    const query = new URLSearchParams({
      period1: Math.floor(startDate.getTime() / 1000).toString(),
      period2: Math.floor(endDate.getTime() / 1000).toString(),
      interval,
      events: 'history',
      includeAdjustedClose: 'true'
    });
    
    return `${this.baseUrl}${options.symbol}?${query.toString()}`;
  }

  /**
   * Parses Yahoo Finance CSV response into our standard format
   */
  private parseStockDataResponse(csvData: string, options: ApiCallOptions): StockData {
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('Invalid CSV response: insufficient data');
    }
    
    // Validate CSV header
    const header = lines[0].toLowerCase();
    const expectedHeaders = ['date', 'open', 'high', 'low', 'close', 'adj close', 'volume'];
    const hasAllHeaders = expectedHeaders.every(h => header.includes(h.replace(' ', '')));
    
    if (!hasAllHeaders) {
      throw new Error(`Invalid CSV format. Expected headers: ${expectedHeaders.join(', ')}`);
    }
    
    const dataPoints: StockDataPoint[] = [];
    
    // Parse each data row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const point = this.parseCSVRow(line);
        if (this.isValidDataPoint(point)) {
          dataPoints.push(point);
        }
      } catch (error) {
        console.warn(`Skipping invalid data row ${i}: ${line}`, error);
        continue;
      }
    }
    
    if (dataPoints.length === 0) {
      throw new Error('No valid data points found in response');
    }
    
    // Sort by date (newest first)
    dataPoints.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return {
      symbol: options.symbol,
      timeframe: options.timeframe || 'DAILY',
      data: dataPoints,
      metadata: {
        lastRefreshed: dataPoints[0]?.date || new Date().toISOString(),
        timeZone: 'America/New_York',
        dataSource: 'YAHOO_FINANCE',
        requestTime: new Date().toISOString()
      }
    };
  }

  /**
   * Parses a single CSV row into a StockDataPoint
   */
  private parseCSVRow(csvRow: string): StockDataPoint {
    // Split CSV row, handling potential quoted values
    const values = this.parseCSVLine(csvRow);
    
    if (values.length < 6) {
      throw new Error(`Insufficient columns in CSV row: expected 6+, got ${values.length}`);
    }
    
    const date = values[0];
    const open = parseFloat(values[1]);
    const high = parseFloat(values[2]);
    const low = parseFloat(values[3]);
    const close = parseFloat(values[4]);
    const adjClose = values[5] ? parseFloat(values[5]) : undefined;
    const volume = values[6] ? parseInt(values[6]) : 0;
    
    // Validate date format (YYYY-MM-DD)
    if (!this.isValidDate(date)) {
      throw new Error(`Invalid date format: ${date}`);
    }
    
    // Validate numeric values
    if ([open, high, low, close].some(val => isNaN(val) || val <= 0)) {
      throw new Error(`Invalid price data`);
    }
    
    return {
      date,
      open,
      high,
      low,
      close,
      volume: volume || 0,
      adjustedClose: adjClose
    };
  }

  /**
   * Parses a CSV line, handling quoted values and commas within quotes
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
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
   * Comprehensive error handling for Yahoo Finance specific issues
   */
  private handleApiError(error: unknown, options: ApiCallOptions): YahooFinanceError {
    // If it's already our error format, return as-is
    if (error && typeof error === 'object' && 'type' in error && 'userFriendlyMessage' in error) {
      return error as YahooFinanceError;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Network timeout
    if ((error instanceof Error && error.name === 'AbortError') || errorMessage.includes('timeout')) {
      return this.createYahooFinanceError(
        'NETWORKerror',
        'Request timeout',
        'Request took too long. Trying again...',
        true,
        5
      );
    }
    
    // Network connectivity issues
    if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
      return this.createYahooFinanceError(
        'NETWORKerror',
        'Network connectivity issue',
        'Unable to connect to Yahoo Finance. Retrying...',
        true,
        10
      );
    }
    
    // HTTP errors
    if (errorMessage.includes('HTTP 429')) {
      return this.createYahooFinanceError(
        'RATE_LIMITED',
        'Too many requests',
        'Rate limit exceeded. Waiting before retry...',
        true,
        60
      );
    }
    
    if (errorMessage.includes('HTTP 404')) {
      return this.createYahooFinanceError(
        'SYMBOL_NOT_FOUND',
        'Symbol not found',
        `Symbol "${options.symbol}" not found. Please check the spelling.`,
        false,
        undefined,
        'Verify the symbol exists on finance.yahoo.com'
      );
    }
    
    if (errorMessage.includes('HTTP 500') || errorMessage.includes('HTTP 502') || errorMessage.includes('HTTP 503')) {
      return this.createYahooFinanceError(
        'SERVICE_UNAVAILABLE',
        'Yahoo Finance unavailable',
        'Yahoo Finance servers temporarily unavailable. Retrying...',
        true,
        30
      );
    }
    
    // CSV parsing errors
    if (errorMessage.includes('CSV') || errorMessage.includes('Invalid response format')) {
      return this.createYahooFinanceError(
        'INVALID_REQUEST',
        errorMessage,
        `Unable to parse data for "${options.symbol}". Symbol might be delisted.`,
        false,
        undefined,
        'Try a different symbol or check if it is actively traded'
      );
    }
    
    // Generic fallback
    return this.createYahooFinanceError(
      'SERVICE_UNAVAILABLE',
      errorMessage,
      'Unexpected error occurred while fetching data. Retrying...',
      true,
      15
    );
  }

  /**
   * Creates standardized Yahoo Finance error objects
   */
  private createYahooFinanceError(
    type: YahooFinanceError['type'],
    message: string,
    userFriendlyMessage: string,
    retryable: boolean,
    retryAfter?: number,
    suggestedAction?: string
  ): YahooFinanceError {
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
export const yahooFinanceService = new YahooFinanceService();
export default YahooFinanceService; 
