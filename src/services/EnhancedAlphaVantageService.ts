/**
 * STUDENT ANALYST - Enhanced Alpha Vantage Service
 * Comprehensive service wrapper with advanced error handling and retry logic
 */

import { 
  alphaVantageService, 
  AlphaVantageError, 
  ApiCallOptions, 
  StockData 
} from './AlphaVantageService';
import { errorHandlingService, ErrorContext } from './ErrorHandlingService';
import { retryManager, RetryOptions, RetryProgress } from './RetryManager';

export interface EnhancedApiOptions extends ApiCallOptions {
  retryOptions?: RetryOptions;
  enableUserFeedback?: boolean;
  enableSymbolValidation?: boolean;
  onProgress?: (progress: RetryProgress) => void;
  onError?: (error: AlphaVantageError, userMessage: string) => void;
  onRetrySuccess?: (data: StockData, attemptCount: number) => void;
}

export interface UserFriendlyError {
  type: string;
  userMessage: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  canRetry: boolean;
  suggestedActions: string[];
  alternativeSymbols?: string[];
  retryAfter?: number;
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: UserFriendlyError;
  attemptCount: number;
  totalTime: number; // milliseconds
  fromCache?: boolean;
}

export class EnhancedAlphaVantageService {
  private static instance: EnhancedAlphaVantageService;
  
  // Operation tracking
  private operationStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    totalRetries: 0,
    avgResponseTime: 0
  };
  
  private constructor() {}
  
  public static getInstance(): EnhancedAlphaVantageService {
    if (!EnhancedAlphaVantageService.instance) {
      EnhancedAlphaVantageService.instance = new EnhancedAlphaVantageService();
    }
    return EnhancedAlphaVantageService.instance;
  }
  
  /**
   * Enhanced stock data retrieval with comprehensive error handling
   */
  public async getStockData(
    options: EnhancedApiOptions
  ): Promise<OperationResult<StockData>> {
    const startTime = Date.now();
    this.operationStats.totalOperations++;
    
    // Pre-validate symbol if enabled
    if (options.enableSymbolValidation !== false && options.symbol) {
      const symbolValidation = errorHandlingService.validateSymbol(options.symbol);
      if (!symbolValidation.isValid && symbolValidation.suggestions.length > 0) {
        const suggestedSymbol = symbolValidation.suggestions[0];
        
        // Notify user about symbol suggestion
        if (options.onError) {
          const userError: UserFriendlyError = {
            type: 'SYMBOL_SUGGESTION',
            userMessage: `Symbol "${options.symbol}" not found. Did you mean "${suggestedSymbol.symbol}" (${suggestedSymbol.name})?`,
            severity: 'MEDIUM',
            canRetry: false,
            suggestedActions: [
              `Try using "${suggestedSymbol.symbol}" instead`,
              'Check symbol spelling',
              'Verify symbol exists on stock exchanges'
            ],
            alternativeSymbols: symbolValidation.suggestions.map(s => 
              `${s.symbol} - ${s.name}`
            )
          };
          
          options.onError(
            {
              type: 'SYMBOL_NOT_FOUND',
              message: symbolValidation.message,
              userFriendlyMessage: userError.userMessage,
              retryable: false
            } as AlphaVantageError,
            userError.userMessage
          );
        }
      }
    }
    
    try {
      // Create error context
      const context: ErrorContext = {
        operation: 'getStockData',
        symbol: options.symbol,
        timeframe: options.timeframe,
        timestamp: new Date().toISOString(),
        attemptNumber: 1,
        maxRetries: options.retryOptions?.maxRetries || 3
      };
      
      // Execute with retry logic
      const result = await retryManager.executeWithRetry(
        () => alphaVantageService.getStockData(options),
        context,
        {
          ...options.retryOptions,
          onProgress: options.onProgress,
          onError: (error, resolution) => {
            // Convert to user-friendly error and notify
            const userError = this.convertToUserFriendlyError(error, resolution);
            if (options.onError) {
              options.onError(error, userError.userMessage);
            }
          },
          onSuccess: (data, attemptCount) => {
            this.operationStats.successfulOperations++;
            this.operationStats.totalRetries += (attemptCount - 1);
            
            if (options.onRetrySuccess) {
              options.onRetrySuccess(data, attemptCount);
            }
          }
        }
      );
      
      const endTime = Date.now();
      const operationTime = endTime - startTime;
      
      // Update statistics
      this.updateResponseTimeStats(operationTime);
      
      return {
        success: true,
        data: result,
        attemptCount: 1, // Will be updated by retry manager
        totalTime: operationTime
      };
      
    } catch (error) {
      this.operationStats.failedOperations++;
      const endTime = Date.now();
      
      // Process error through error handling service
      const context: ErrorContext = {
        operation: 'getStockData',
        symbol: options.symbol,
        timeframe: options.timeframe,
        timestamp: new Date().toISOString(),
        attemptNumber: 1,
        maxRetries: options.retryOptions?.maxRetries || 3
      };
      
      const resolution = errorHandlingService.processError(error as AlphaVantageError, context);
      const userError = this.convertToUserFriendlyError(error as AlphaVantageError, resolution);
      
      return {
        success: false,
        error: userError,
        attemptCount: 1,
        totalTime: endTime - startTime
      };
    }
  }
  
  /**
   * Validate symbol with enhanced suggestions
   */
  public validateSymbolWithSuggestions(symbol: string): {
    isValid: boolean;
    message: string;
    suggestions: Array<{
      symbol: string;
      name: string;
      confidence: number;
      reason: string;
    }>;
    userAction?: string;
  } {
    const validation = errorHandlingService.validateSymbol(symbol);
    
    let userAction: string | undefined;
    if (!validation.isValid && validation.suggestions.length > 0) {
      const topSuggestion = validation.suggestions[0];
      userAction = `Consider using "${topSuggestion.symbol}" (${topSuggestion.name}) instead`;
    } else if (!validation.isValid) {
      userAction = 'Please check the symbol spelling or try a different symbol';
    }
    
    return {
      ...validation,
      userAction
    };
  }
  
  /**
   * Check API health and connectivity
   */
  public async checkApiHealth(): Promise<{
    isHealthy: boolean;
    responseTime?: number;
    error?: string;
    usageStats: ReturnType<typeof alphaVantageService.getUsageStats>;
  }> {
    try {
      const startTime = Date.now();
      
      // Try a lightweight request to check connectivity
      await alphaVantageService.getStockData({
        symbol: 'AAPL',
        timeframe: 'DAILY'
      });
      
      const responseTime = Date.now() - startTime;
      const usageStats = alphaVantageService.getUsageStats();
      
      return {
        isHealthy: true,
        responseTime,
        usageStats
      };
      
    } catch (error) {
      const usageStats = alphaVantageService.getUsageStats();
      
      return {
        isHealthy: false,
        error: (error as AlphaVantageError).userFriendlyMessage || 'Unknown error',
        usageStats
      };
    }
  }
  
  /**
   * Get comprehensive service statistics
   */
     public getServiceStats() {
    const retryStats = retryManager.getRetryStats();
    const alphaVantageStats = alphaVantageService.getUsageStats();
    
    const successRate = this.operationStats.totalOperations > 0 
      ? (this.operationStats.successfulOperations / this.operationStats.totalOperations) * 100
      : 0;
      
    const avgRetriesPerOperation = this.operationStats.totalOperations > 0
      ? this.operationStats.totalRetries / this.operationStats.totalOperations
      : 0;
    
    return {
      operations: this.operationStats,
      retryManager: retryStats,
      alphaVantage: alphaVantageStats,
      successRate,
      avgRetriesPerOperation
    };
  }
  
  /**
   * Reset all statistics
   */
  public resetStats(): void {
    this.operationStats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      totalRetries: 0,
      avgResponseTime: 0
    };
  }
  
  /**
   * Get active retry operations for user feedback
   */
  public getActiveOperations(): Array<{
    operationId: string;
    operation: string;
    symbol?: string;
    currentAttempt: number;
    maxRetries: number;
    nextRetryTime?: number;
  }> {
    return retryManager.getActiveRetries().map(({ operationId, state }) => ({
      operationId,
      operation: state.operation,
      symbol: state.context.symbol,
      currentAttempt: state.currentAttempt,
      maxRetries: state.maxRetries,
      nextRetryTime: state.nextRetryTime
    }));
  }
  
  /**
   * Cancel specific operation
   */
  public cancelOperation(operationId: string): boolean {
    return retryManager.cancelRetry(operationId);
  }
  
  /**
   * Convert technical error to user-friendly format
   */
     private convertToUserFriendlyError(
     this: EnhancedAlphaVantageService,
     error: AlphaVantageError,
     resolution: ReturnType<typeof errorHandlingService.processError>
   ): UserFriendlyError {
    return {
      type: error.type,
      userMessage: resolution.userMessage,
      severity: resolution.severity,
      canRetry: resolution.canRetry,
      suggestedActions: [
        resolution.suggestedAction,
        ...(resolution.alternativeOptions || [])
      ].filter(Boolean) as string[],
      retryAfter: resolution.retryAfter
    };
  }
  
  /**
   * Update response time statistics
   */
  private updateResponseTimeStats(responseTime: number): void {
    const totalOps = this.operationStats.totalOperations;
    const currentAvg = this.operationStats.avgResponseTime;
    
    // Calculate running average
    this.operationStats.avgResponseTime = 
      ((currentAvg * (totalOps - 1)) + responseTime) / totalOps;
  }
}

// Export singleton instance
export const enhancedAlphaVantageService = EnhancedAlphaVantageService.getInstance();
export default EnhancedAlphaVantageService; 
