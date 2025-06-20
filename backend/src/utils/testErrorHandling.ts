/**
 * STUDENT ANALYST - Error Handling Test Utility
 * ==============================================
 * 
 * Utility per testare il sistema di gestione errori con scenari realistici
 * di errori API, network failures, e strategie di recovery.
 */

import { AlphaVantageService, AlphaVantageTimeframe } from '../services/alphaVantageService';
import { ErrorCodeHandler, ErrorContext, SystemErrorType } from '../services/errorCodeHandler';
import { NetworkResilienceConfig, NetworkResilienceService } from '../services/networkResilienceService';

/**
 * Risultato di un test
 */
interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  errorClassification?: unknown;
  userMessage?: string;
  recovery?: unknown;
  details?: unknown;
}

/**
 * Suite di test per il sistema di gestione errori
 */
export class ErrorHandlingTestSuite {
  private errorHandler: ErrorCodeHandler;
  private resilienceService: NetworkResilienceService;
  private alphaVantageService: AlphaVantageService;
  private results: TestResult[] = [];

  constructor() {
    this.errorHandler = ErrorCodeHandler.getInstance();
    
    // Configurazione di resilienza per i test
    const resilienceConfig: NetworkResilienceConfig = {
      timeout: 5000,
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2.0,
      jitter: false, // Disabilitato per test deterministici
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeout: 10000,
        monitoringPeriod: 60000,
        halfOpenMaxCalls: 2,
        halfOpenSuccessThreshold: 1
      },
      healthCheckInterval: 30000,
      enableFallback: true
    };

    this.resilienceService = NetworkResilienceService.getInstance(resilienceConfig);
    this.alphaVantageService = new AlphaVantageService({
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 500,
      cacheEnabled: false // Disabilitato per test
    });
  }

  /**
   * Esegue tutti i test
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Error Handling Test Suite...\n');
    
    this.results = [];

    // Test di classificazione errori
    await this.testErrorClassification();
    
    // Test di messaggi user-friendly
    await this.testUserFriendlyMessages();
    
    // Test di strategie di recovery
    await this.testRecoveryStrategies();
    
    // Test di resilienza di rete
    await this.testNetworkResilience();
    
    // Test di circuit breaker
    await this.testCircuitBreaker();
    
    // Test di integrazione con AlphaVantageService
    await this.testAlphaVantageIntegration();

    this.printSummary();
    return this.results;
  }

  /**
   * Test di classificazione errori
   */
  private async testErrorClassification(): Promise<void> {
    console.log('📋 Testing Error Classification...');

    const testCases = [
      {
        name: 'Rate Limit Error',
        error: new Error('Thank you for using Alpha Vantage! You have made 5 API calls within the last minute.'),
        expectedType: SystemErrorType.RATE_LIMIT_EXCEEDED
      },
      {
        name: 'Daily Limit Error',
        error: new Error('Thank you for using Alpha Vantage! Our standard API call frequency is 25 requests per day.'),
        expectedType: SystemErrorType.DAILY_LIMIT_EXCEEDED
      },
      {
        name: 'Invalid API Key Error',
        error: new Error('Invalid API key. Please try again or visit https://www.alphavantage.co/support/#api-key'),
        expectedType: SystemErrorType.INVALID_API_KEY
      },
      {
        name: 'Symbol Not Found Error',
        error: new Error('Invalid API call. Please retry or visit the documentation. Symbol=INVALID123 not found.'),
        expectedType: SystemErrorType.SYMBOL_NOT_FOUND
      },
      {
        name: 'Connection Timeout Error',
        error: Object.assign(new Error('Operation timeout after 30000ms'), { name: 'TimeoutError' }),
        expectedType: SystemErrorType.CONNECTION_TIMEOUT
      },
      {
        name: 'Network Unavailable Error',
        error: Object.assign(new Error('ENOTFOUND api.alphavantage.co'), { name: 'NetworkError' }),
        expectedType: SystemErrorType.DNS_FAILURE
      }
    ];

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        const context: ErrorContext = {
          operation: 'test_classification',
          apiService: 'alpha_vantage',
          symbol: 'TEST',
          timeframe: 'daily'
        };

        const classified = this.errorHandler.classifyError(testCase.error, context);
        const duration = Date.now() - startTime;

        const success = classified.type === testCase.expectedType;
        
        this.results.push({
          testName: testCase.name,
          success,
          duration,
          errorClassification: {
            type: classified.type,
            severity: classified.severity,
            retryable: classified.retryable
          },
          userMessage: classified.userMessage.title,
          details: {
            expected: testCase.expectedType,
            actual: classified.type
          }
        });

        console.log(`  ${success ? '✅' : '❌'} ${testCase.name}: ${classified.type}`);
        
      } catch (error) {
        this.results.push({
          testName: testCase.name,
          success: false,
          duration: Date.now() - startTime,
          details: { error: (error as Error).message }
        });
        console.log(`  ❌ ${testCase.name}: Test failed - ${(error as Error).message}`);
      }
    }
    
    console.log('');
  }

  /**
   * Test di messaggi user-friendly
   */
  private async testUserFriendlyMessages(): Promise<void> {
    console.log('💬 Testing User-Friendly Messages...');

    const testCases = [
      {
        name: 'Rate Limit Message Quality',
        errorType: SystemErrorType.RATE_LIMIT_EXCEEDED,
        expectedKeywords: ['limite', 'richieste', 'minuto', 'automaticamente']
      },
      {
        name: 'Symbol Not Found Message Quality',
        errorType: SystemErrorType.SYMBOL_NOT_FOUND,
        expectedKeywords: ['simbolo', 'trovato', 'verifica']
      },
      {
        name: 'Network Error Message Quality',
        errorType: SystemErrorType.CONNECTION_TIMEOUT,
        expectedKeywords: ['connessione', 'lenta', 'riprovando']
      }
    ];

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        const error = this.createMockError(testCase.errorType);
        const context: ErrorContext = {
          operation: 'test_user_message',
          apiService: 'alpha_vantage',
          symbol: 'AAPL',
          timeframe: 'daily'
        };

        const classified = this.errorHandler.classifyError(error, context);
        const duration = Date.now() - startTime;

        const message = classified.userMessage.message.toLowerCase();
        const hasKeywords = testCase.expectedKeywords.every(keyword => 
          message.includes(keyword.toLowerCase())
        );

        const success = hasKeywords && classified.userMessage.title.length > 0;
        
        this.results.push({
          testName: testCase.name,
          success,
          duration,
          userMessage: classified.userMessage.title,
          details: {
            message: classified.userMessage.message,
            suggestion: classified.userMessage.suggestion,
            hasAllKeywords: hasKeywords
          }
        });

        console.log(`  ${success ? '✅' : '❌'} ${testCase.name}`);
        
      } catch (error) {
        this.results.push({
          testName: testCase.name,
          success: false,
          duration: Date.now() - startTime,
          details: { error: (error as Error).message }
        });
        console.log(`  ❌ ${testCase.name}: Test failed`);
      }
    }
    
    console.log('');
  }

  /**
   * Test di strategie di recovery
   */
  private async testRecoveryStrategies(): Promise<void> {
    console.log('🔄 Testing Recovery Strategies...');

    const testCases = [
      {
        name: 'Rate Limit Recovery Strategy',
        errorType: SystemErrorType.RATE_LIMIT_EXCEEDED,
        expectedRetryable: true,
        expectedStrategy: 'retry_after_delay'
      },
      {
        name: 'Daily Limit Recovery Strategy',
        errorType: SystemErrorType.DAILY_LIMIT_EXCEEDED,
        expectedRetryable: false,
        expectedStrategy: 'fallback_to_cache'
      },
      {
        name: 'Symbol Not Found Recovery Strategy',
        errorType: SystemErrorType.SYMBOL_NOT_FOUND,
        expectedRetryable: false,
        expectedStrategy: 'user_action_required'
      }
    ];

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        const error = this.createMockError(testCase.errorType);
        const context: ErrorContext = {
          operation: 'test_recovery',
          apiService: 'alpha_vantage',
          symbol: 'AAPL',
          timeframe: 'daily'
        };

        const classified = this.errorHandler.classifyError(error, context);
        const duration = Date.now() - startTime;

        const retryableMatch = classified.retryable === testCase.expectedRetryable;
        const strategyMatch = classified.recovery.strategy.includes(testCase.expectedStrategy.split('_')[0]);

        const success = retryableMatch && strategyMatch;
        
        this.results.push({
          testName: testCase.name,
          success,
          duration,
          recovery: {
            strategy: classified.recovery.strategy,
            retryable: classified.retryable,
            estimatedRecoveryTime: classified.recovery.estimatedRecoveryTime
          },
          details: {
            expectedRetryable: testCase.expectedRetryable,
            actualRetryable: classified.retryable,
            expectedStrategy: testCase.expectedStrategy,
            actualStrategy: classified.recovery.strategy
          }
        });

        console.log(`  ${success ? '✅' : '❌'} ${testCase.name}`);
        
      } catch (error) {
        this.results.push({
          testName: testCase.name,
          success: false,
          duration: Date.now() - startTime,
          details: { error: (error as Error).message }
        });
        console.log(`  ❌ ${testCase.name}: Test failed`);
      }
    }
    
    console.log('');
  }

  /**
   * Test di resilienza di rete
   */
  private async testNetworkResilience(): Promise<void> {
    console.log('🌐 Testing Network Resilience...');

    const testCases = [
      {
        name: 'Successful Operation',
        shouldFail: false,
        expectedSuccess: true
      },
      {
        name: 'Retryable Operation with Recovery',
        shouldFail: true,
        retryable: true,
        expectedSuccess: false // Fallirà ma con retry
      },
      {
        name: 'Non-retryable Operation',
        shouldFail: true,
        retryable: false,
        expectedSuccess: false
      }
    ];

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        const context: ErrorContext = {
          operation: 'test_resilience',
          apiService: 'test_service',
          symbol: 'TEST',
          timeframe: 'daily'
        };

        const mockOperation = async () => {
          if (testCase.shouldFail) {
            const error = testCase.retryable 
              ? new Error('Temporary network error')
              : new Error('Permanent API error');
            throw error;
          }
          return { success: true, data: 'test data' };
        };

        const result = await this.resilienceService.executeResilient(
          mockOperation,
          context,
          { maxRetries: 1, timeout: 2000 }
        );

        const duration = Date.now() - startTime;
        const success = result.success === testCase.expectedSuccess;
        
        this.results.push({
          testName: testCase.name,
          success,
          duration,
          details: {
            resultSuccess: result.success,
            expectedSuccess: testCase.expectedSuccess,
            retryCount: result.retryCount,
            responseTime: result.responseTime,
            source: result.source
          }
        });

        console.log(`  ${success ? '✅' : '❌'} ${testCase.name} (${result.retryCount} retries)`);
        
      } catch (error) {
        this.results.push({
          testName: testCase.name,
          success: false,
          duration: Date.now() - startTime,
          details: { error: (error as Error).message }
        });
        console.log(`  ❌ ${testCase.name}: Test failed`);
      }
    }
    
    console.log('');
  }

  /**
   * Test di circuit breaker
   */
  private async testCircuitBreaker(): Promise<void> {
    console.log('⚡ Testing Circuit Breaker...');

    const startTime = Date.now();
    
    try {
      // Simula fallimenti multipli per aprire il circuit breaker
      const context: ErrorContext = {
        operation: 'test_circuit_breaker',
        apiService: 'circuit_test_service',
        symbol: 'TEST',
        timeframe: 'daily'
      };

      const failingOperation = async () => {
        throw new Error('Service unavailable');
      };

      // Esegui operazioni fallimentari per aprire il circuit breaker
      for (let i = 0; i < 4; i++) {
        try {
          await this.resilienceService.executeResilient(
            failingOperation,
            context,
            { maxRetries: 0 }
          );
        } catch (error) {
          // Ignora errori, stiamo testando il circuit breaker
        }
      }

      // Verifica stato del circuit breaker
      const stats = this.resilienceService.getCircuitBreakerStats();
      const circuitBreakerExists = stats['circuit_test_service'] !== undefined;
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName: 'Circuit Breaker Functionality',
        success: circuitBreakerExists,
        duration,
        details: {
          circuitBreakerStats: stats,
          serviceExists: circuitBreakerExists
        }
      });

      console.log(`  ${circuitBreakerExists ? '✅' : '❌'} Circuit Breaker Functionality`);
      
    } catch (error) {
      this.results.push({
        testName: 'Circuit Breaker Functionality',
        success: false,
        duration: Date.now() - startTime,
        details: { error: (error as Error).message }
      });
      console.log(`  ❌ Circuit Breaker Functionality: Test failed`);
    }
    
    console.log('');
  }

  /**
   * Test di integrazione con AlphaVantageService
   */
  private async testAlphaVantageIntegration(): Promise<void> {
    console.log('🔗 Testing AlphaVantage Integration...');

    const testCases = [
      {
        name: 'Invalid Symbol Handling',
        symbol: 'INVALID123',
        timeframe: AlphaVantageTimeframe.DAILY,
        expectedError: true
      },
      {
        name: 'Valid Request Validation',
        symbol: 'AAPL',
        timeframe: AlphaVantageTimeframe.DAILY,
        expectedError: false
      }
    ];

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        const validation = this.alphaVantageService.validateRequest(
          testCase.symbol,
          testCase.timeframe
        );

        const duration = Date.now() - startTime;
        const success = validation.valid !== testCase.expectedError;
        
        this.results.push({
          testName: testCase.name,
          success,
          duration,
          details: {
            symbol: testCase.symbol,
            timeframe: testCase.timeframe,
            validationResult: validation,
            expectedError: testCase.expectedError
          }
        });

        console.log(`  ${success ? '✅' : '❌'} ${testCase.name}`);
        
      } catch (error) {
        this.results.push({
          testName: testCase.name,
          success: false,
          duration: Date.now() - startTime,
          details: { error: (error as Error).message }
        });
        console.log(`  ❌ ${testCase.name}: Test failed`);
      }
    }
    
    console.log('');
  }

  /**
   * Crea un errore mock per il tipo specificato
   */
  private createMockError(errorType: SystemErrorType): Error {
    switch (errorType) {
      case SystemErrorType.RATE_LIMIT_EXCEEDED:
        return new Error('Thank you for using Alpha Vantage! You have made 5 API calls within the last minute.');
      
      case SystemErrorType.DAILY_LIMIT_EXCEEDED:
        return new Error('Thank you for using Alpha Vantage! Our standard API call frequency is 25 requests per day.');
      
      case SystemErrorType.INVALID_API_KEY:
        return new Error('Invalid API key. Please try again or visit https://www.alphavantage.co/support/#api-key');
      
      case SystemErrorType.SYMBOL_NOT_FOUND:
        return new Error('Invalid API call. Symbol=INVALID123 not found.');
      
      case SystemErrorType.CONNECTION_TIMEOUT:
        const timeoutError = new Error('Operation timeout after 30000ms');
        timeoutError.name = 'TimeoutError';
        return timeoutError;
      
      case SystemErrorType.NETWORK_UNAVAILABLE:
        const networkError = new Error('ENOTFOUND api.alphavantage.co');
        networkError.name = 'NetworkError';
        return networkError;
      
      default:
        return new Error(`Mock error for type: ${errorType}`);
    }
  }

  /**
   * Stampa il riassunto dei test
   */
  private printSummary(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;

    console.log('📊 Test Summary:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests} ✅`);
    console.log(`  Failed: ${failedTests} ❌`);
    console.log(`  Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log(`  Average Duration: ${Math.round(averageDuration)}ms`);
    console.log('');

    if (failedTests > 0) {
      console.log('❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.details?.error || 'Unknown error'}`);
        });
      console.log('');
    }

    console.log('🎉 Error Handling Test Suite Complete!');
  }

  /**
   * Ottieni i risultati dei test
   */
  getResults(): TestResult[] {
    return this.results;
  }

  /**
   * Pulisce le risorse dopo i test
   */
  cleanup(): void {
    this.errorHandler.clearErrorHistory();
    this.resilienceService.cleanup();
  }
} 