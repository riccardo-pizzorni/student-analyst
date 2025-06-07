/**
 * STUDENT ANALYST - Advanced Error Handling Service
 * Comprehensive error management with intelligent recovery and user-friendly messaging
 */

import { AlphaVantageError } from './AlphaVantageService';

export interface ErrorContext {
  operation: string;
  symbol?: string;
  timeframe?: string;
  userId?: string;
  timestamp: string;
  attemptNumber: number;
  maxRetries: number;
}

export interface ErrorResolution {
  canRetry: boolean;
  retryAfter?: number; // seconds
  suggestedAction?: string;
  alternativeOptions?: string[];
  userMessage: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  shouldNotifyUser: boolean;
}

export interface RetryStrategy {
  maxRetries: number;
  baseDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
  condition: (error: AlphaVantageError, attempt: number) => boolean;
}

export interface SymbolSuggestion {
  symbol: string;
  name: string;
  confidence: number; // 0-1
  reason: string;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySymbol: Record<string, number>;
  averageRetryCount: number;
  successfulRecoveries: number;
  lastErrorTime: string;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  
  // Error tracking and statistics
  private errorHistory: Array<{
    error: AlphaVantageError;
    context: ErrorContext;
    resolution: ErrorResolution;
    resolved: boolean;
    resolvedAt?: string;
  }> = [];
  
  // Known symbols database for validation and suggestions
  private knownSymbols = new Map<string, { name: string; aliases: string[] }>();
  
  // Retry strategies for different error types
  private retryStrategies = new Map<string, RetryStrategy>();
  
  private constructor() {
    this.initializeKnownSymbols();
    this.initializeRetryStrategies();
  }
  
  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }
  
  /**
   * Main error processing method - converts errors to user-friendly resolutions
   */
  public processError(
    error: AlphaVantageError, 
    context: ErrorContext
  ): ErrorResolution {
    // Record error for statistics
    this.recordError(error, context);
    
    // Determine resolution based on error type
    const resolution = this.determineResolution(error, context);
    
    // Update error record with resolution
    this.updateErrorRecord(error, context, resolution);
    
    return resolution;
  }
  
  /**
   * Validate symbol and provide suggestions if invalid
   */
  public validateSymbol(symbol: string): {
    isValid: boolean;
    suggestions: SymbolSuggestion[];
    message: string;
  } {
    const normalizedSymbol = symbol.toUpperCase().trim();
    
    // Check if symbol exists in our database
    if (this.knownSymbols.has(normalizedSymbol)) {
      return {
        isValid: true,
        suggestions: [],
        message: `${normalizedSymbol} is a valid stock symbol`
      };
    }
    
    // Find similar symbols
    const suggestions = this.findSimilarSymbols(normalizedSymbol);
    
    return {
      isValid: false,
      suggestions,
      message: suggestions.length > 0 
        ? `Symbol "${symbol}" not found. Did you mean one of these?`
        : `Symbol "${symbol}" not found. Please check the symbol spelling.`
    };
  }
  
  /**
   * Get retry strategy for a specific error type
   */
  public getRetryStrategy(errorType: string): RetryStrategy | null {
    return this.retryStrategies.get(errorType) || null;
  }
  
  /**
   * Calculate next retry delay using exponential backoff with jitter
   */
  public calculateRetryDelay(
    strategy: RetryStrategy, 
    attemptNumber: number
  ): number {
    let delay = strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attemptNumber - 1);
    
    // Add jitter to prevent thundering herd
    if (strategy.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    // Cap at maximum reasonable delay (5 minutes)
    return Math.min(delay, 300000);
  }
  
  /**
   * Check if error should be retried
   */
  public shouldRetry(
    error: AlphaVantageError, 
    context: ErrorContext
  ): boolean {
    const strategy = this.getRetryStrategy(error.type);
    
    if (!strategy || context.attemptNumber >= strategy.maxRetries) {
      return false;
    }
    
    return strategy.condition(error, context.attemptNumber);
  }
  
  /**
   * Get comprehensive error statistics
   */
  public getErrorStats(): ErrorStats {
    const totalErrors = this.errorHistory.length;
    const errorsByType: Record<string, number> = {};
    const errorsBySymbol: Record<string, number> = {};
    let totalRetries = 0;
    let successfulRecoveries = 0;
    let lastErrorTime = '';
    
    for (const record of this.errorHistory) {
      // Count by type
      errorsByType[record.error.type] = (errorsByType[record.error.type] || 0) + 1;
      
      // Count by symbol
      if (record.context.symbol) {
        errorsBySymbol[record.context.symbol] = (errorsBySymbol[record.context.symbol] || 0) + 1;
      }
      
      // Count retries
      totalRetries += record.context.attemptNumber;
      
      // Count recoveries
      if (record.resolved) {
        successfulRecoveries++;
      }
      
      // Track last error time
      if (record.context.timestamp > lastErrorTime) {
        lastErrorTime = record.context.timestamp;
      }
    }
    
    return {
      totalErrors,
      errorsByType,
      errorsBySymbol,
      averageRetryCount: totalErrors > 0 ? totalRetries / totalErrors : 0,
      successfulRecoveries,
      lastErrorTime
    };
  }
  
  /**
   * Initialize known symbols database
   */
  private initializeKnownSymbols(): void {
    // Major US stocks
    this.knownSymbols.set('AAPL', { name: 'Apple Inc.', aliases: ['APPLE'] });
    this.knownSymbols.set('MSFT', { name: 'Microsoft Corporation', aliases: ['MICROSOFT'] });
    this.knownSymbols.set('GOOGL', { name: 'Alphabet Inc. Class A', aliases: ['GOOGLE', 'GOOG'] });
    this.knownSymbols.set('GOOG', { name: 'Alphabet Inc. Class C', aliases: ['GOOGLE', 'GOOGL'] });
    this.knownSymbols.set('AMZN', { name: 'Amazon.com Inc.', aliases: ['AMAZON'] });
    this.knownSymbols.set('TSLA', { name: 'Tesla Inc.', aliases: ['TESLA'] });
    this.knownSymbols.set('META', { name: 'Meta Platforms Inc.', aliases: ['FACEBOOK', 'FB'] });
    this.knownSymbols.set('NVDA', { name: 'NVIDIA Corporation', aliases: ['NVIDIA'] });
    this.knownSymbols.set('NFLX', { name: 'Netflix Inc.', aliases: ['NETFLIX'] });
    this.knownSymbols.set('ORCL', { name: 'Oracle Corporation', aliases: ['ORACLE'] });
    
    // Major ETFs
    this.knownSymbols.set('SPY', { name: 'SPDR S&P 500 ETF Trust', aliases: ['SP500', 'S&P500'] });
    this.knownSymbols.set('QQQ', { name: 'Invesco QQQ Trust', aliases: ['NASDAQ'] });
    this.knownSymbols.set('VTI', { name: 'Vanguard Total Stock Market ETF', aliases: [] });
    this.knownSymbols.set('IWM', { name: 'iShares Russell 2000 ETF', aliases: ['RUSSELL2000'] });
    
    // Major indices (note: may require different symbols for Alpha Vantage)
    this.knownSymbols.set('^GSPC', { name: 'S&P 500 Index', aliases: ['SPX', 'SP500'] });
    this.knownSymbols.set('^DJI', { name: 'Dow Jones Industrial Average', aliases: ['DOW', 'DJIA'] });
    this.knownSymbols.set('^IXIC', { name: 'NASDAQ Composite', aliases: ['NASDAQ'] });
  }
  
  /**
   * Initialize retry strategies for different error types
   */
  private initializeRetryStrategies(): void {
    // Rate limiting - gradual backoff
    this.retryStrategies.set('RATE_LIMITED', {
      maxRetries: 3,
      baseDelay: 60000, // 1 minute
      backoffMultiplier: 1.5,
      jitter: true,
      condition: (error, attempt) => error.retryable && attempt <= 3
    });
    
    // Network errors - quick retry
    this.retryStrategies.set('NETWORKerror', {
      maxRetries: 5,
      baseDelay: 2000, // 2 seconds
      backoffMultiplier: 2,
      jitter: true,
      condition: (error, attempt) => error.retryable && attempt <= 5
    });
    
    // Service unavailable - moderate backoff
    this.retryStrategies.set('SERVICE_UNAVAILABLE', {
      maxRetries: 4,
      baseDelay: 15000, // 15 seconds
      backoffMultiplier: 2,
      jitter: true,
      condition: (error, attempt) => error.retryable && attempt <= 4
    });
    
    // Invalid API key - no retry (requires manual fix)
    this.retryStrategies.set('INVALID_APIkey', {
      maxRetries: 0,
      baseDelay: 0,
      backoffMultiplier: 1,
      jitter: false,
      condition: () => false
    });
    
    // Symbol not found - no retry (but suggest alternatives)
    this.retryStrategies.set('SYMBOL_NOT_FOUND', {
      maxRetries: 0,
      baseDelay: 0,
      backoffMultiplier: 1,
      jitter: false,
      condition: () => false
    });
    
    // Invalid request - limited retry with backoff
    this.retryStrategies.set('INVALID_REQUEST', {
      maxRetries: 2,
      baseDelay: 5000, // 5 seconds
      backoffMultiplier: 2,
      jitter: false,
      condition: (error, attempt) => error.retryable && attempt <= 2
    });
  }
  
  /**
   * Determine appropriate resolution for an error
   */
  private determineResolution(
    error: AlphaVantageError, 
    context: ErrorContext
  ): ErrorResolution {
    switch (error.type) {
      case 'RATE_LIMITED':
        return {
          canRetry: true,
          retryAfter: error.retryAfter || 60,
          userMessage: `Too many requests. Automatically retrying in ${error.retryAfter || 60} seconds...`,
          severity: 'MEDIUM',
          shouldNotifyUser: context.attemptNumber === 1,
          suggestedAction: 'Wait for automatic retry or reduce request frequency'
        };
        
      case 'INVALID_APIkey':
        return {
          canRetry: false,
          userMessage: 'API key is invalid or expired. Please check your configuration.',
          severity: 'HIGH',
          shouldNotifyUser: true,
          suggestedAction: 'Verify your Alpha Vantage API key in the .env file',
          alternativeOptions: [
            'Check if your API key is correctly configured',
            'Verify the API key hasn\'t expired',
            'Get a new API key from Alpha Vantage if needed'
          ]
        };
        
      case 'SYMBOL_NOT_FOUND': {
        const symbolValidation = context.symbol ? this.validateSymbol(context.symbol) : null;
        return {
          canRetry: false,
          userMessage: symbolValidation?.suggestions.length 
            ? `Symbol "${context.symbol}" not found. Did you mean "${symbolValidation.suggestions[0].symbol}"?`
            : `Symbol "${context.symbol}" not found. Please check the symbol spelling.`,
          severity: 'MEDIUM',
          shouldNotifyUser: true,
          suggestedAction: 'Try a different symbol or check symbol spelling',
          alternativeOptions: symbolValidation?.suggestions.map(s => 
            `${s.symbol} - ${s.name} (${Math.round(s.confidence * 100)}% match)`
          ) || []
        };
      }
        
      case 'NETWORKerror':
        return {
          canRetry: true,
          retryAfter: this.calculateRetryDelay(
            this.getRetryStrategy('NETWORKerror')!, 
            context.attemptNumber
          ) / 1000,
          userMessage: context.attemptNumber === 1 
            ? 'Connection issue detected. Retrying automatically...'
            : `Connection retry ${context.attemptNumber}/${context.maxRetries}...`,
          severity: 'MEDIUM',
          shouldNotifyUser: context.attemptNumber <= 2,
          suggestedAction: 'Check your internet connection'
        };
        
      case 'SERVICE_UNAVAILABLE':
        return {
          canRetry: true,
          retryAfter: error.retryAfter || 30,
          userMessage: 'Alpha Vantage service temporarily unavailable. Retrying automatically...',
          severity: 'MEDIUM',
          shouldNotifyUser: context.attemptNumber === 1,
          suggestedAction: 'Wait for automatic retry - service should recover shortly'
        };
        
      case 'INVALID_REQUEST':
        return {
          canRetry: context.attemptNumber < 2,
          userMessage: `Request error: ${error.message}. ${context.attemptNumber < 2 ? 'Retrying...' : 'Please check your input.'}`,
          severity: 'MEDIUM',
          shouldNotifyUser: true,
          suggestedAction: 'Verify request parameters and try again'
        };
        
      default:
        return {
          canRetry: error.retryable && context.attemptNumber < 3,
          retryAfter: 15,
          userMessage: 'An unexpected error occurred. Retrying automatically...',
          severity: 'MEDIUM',
          shouldNotifyUser: true,
          suggestedAction: 'If the problem persists, try refreshing the page'
        };
    }
  }
  
  /**
   * Find similar symbols using fuzzy matching
   */
  private findSimilarSymbols(symbol: string): SymbolSuggestion[] {
    const suggestions: SymbolSuggestion[] = [];
    const normalizedInput = symbol.toLowerCase();
    
    for (const [knownSymbol, data] of this.knownSymbols) {
      const normalizedKnown = knownSymbol.toLowerCase();
      
      // Exact match on aliases
      for (const alias of data.aliases) {
        if (alias.toLowerCase() === normalizedInput) {
          suggestions.push({
            symbol: knownSymbol,
            name: data.name,
            confidence: 0.95,
            reason: `Matches alias "${alias}"`
          });
        }
      }
      
      // Levenshtein distance for symbol similarity
      const distance = this.levenshteinDistance(normalizedInput, normalizedKnown);
      const maxLength = Math.max(normalizedInput.length, normalizedKnown.length);
      const similarity = 1 - (distance / maxLength);
      
      if (similarity > 0.6 && similarity < 0.95) {
        suggestions.push({
          symbol: knownSymbol,
          name: data.name,
          confidence: similarity,
          reason: `Similar spelling to "${knownSymbol}"`
        });
      }
      
      // Partial match on company name
      const normalizedName = data.name.toLowerCase();
      if (normalizedName.includes(normalizedInput) || normalizedInput.includes(normalizedName.split(' ')[0])) {
        suggestions.push({
          symbol: knownSymbol,
          name: data.name,
          confidence: 0.7,
          reason: `Company name contains "${symbol}"`
        });
      }
    }
    
    // Sort by confidence and return top 3
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * Record error for tracking and statistics
   */
  private recordError(error: AlphaVantageError, context: ErrorContext): void {
    this.errorHistory.push({
      error,
      context,
      resolution: this.determineResolution(error, context),
      resolved: false
    });
    
    // Keep only last 1000 errors to prevent memory issues
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }
  }
  
  /**
   * Update error record with resolution information
   */
  private updateErrorRecord(
    error: AlphaVantageError, 
    context: ErrorContext, 
    resolution: ErrorResolution
  ): void {
    const record = this.errorHistory.find(r => 
      r.error === error && r.context.timestamp === context.timestamp
    );
    
    if (record) {
      record.resolution = resolution;
    }
  }
  
  /**
   * Mark error as resolved
   */
  public markErrorAsResolved(error: AlphaVantageError, context: ErrorContext): void {
    const record = this.errorHistory.find(r => 
      r.error === error && r.context.timestamp === context.timestamp
    );
    
    if (record) {
      record.resolved = true;
      record.resolvedAt = new Date().toISOString();
    }
  }
  
  /**
   * Add new symbol to known symbols database
   */
  public addKnownSymbol(symbol: string, name: string, aliases: string[] = []): void {
    this.knownSymbols.set(symbol.toUpperCase(), { name, aliases });
  }
  
  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
  }
  
  /**
   * Get recent errors for debugging
   */
  public getRecentErrors(limit: number = 10): Array<{
    error: AlphaVantageError;
    context: ErrorContext;
    resolution: ErrorResolution;
    resolved: boolean;
  }> {
    return this.errorHistory
      .slice(-limit)
      .reverse(); // Most recent first
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();
export default ErrorHandlingService; 
