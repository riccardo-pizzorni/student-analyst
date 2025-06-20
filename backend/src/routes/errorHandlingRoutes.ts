/**
 * STUDENT ANALYST - Error Handling Routes
 * ========================================
 *
 * Routes per la gestione avanzata degli errori, classificazione automatica,
 * strategie di recovery e monitoraggio dello stato del sistema.
 */

import express, { Request, Response, Router } from 'express';
import { sanitizationMiddleware } from '../middleware/sanitizationMiddleware';
import {
  ClassifiedError,
  ErrorCodeHandler,
  ErrorContext,
  SystemErrorType,
} from '../services/errorCodeHandler';
import {
  CircuitBreakerState,
  FallbackService,
  NetworkResilienceConfig,
  NetworkResilienceService,
} from '../services/networkResilienceService';

const router = Router();

// Applica sanitizzazione globale
router.use(
  sanitizationMiddleware({
    enableBodySanitization: true,
    enableParamsSanitization: true,
    enableQuerySanitization: true,
    logSuspiciousActivity: true,
    blockOnDangerousPatterns: false, // Più permissivo per route di debug
    maxRequestSize: 1024 * 1024, // 1MB per report errori
    trustedIPs: ['127.0.0.1', '::1', 'localhost'],
  }) as express.RequestHandler
);

// Inizializza servizi
const errorHandler = ErrorCodeHandler.getInstance();

// Configurazione di resilienza di rete
const resilienceConfig: NetworkResilienceConfig = {
  timeout: 30000,
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2.0,
  jitter: true,
  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    monitoringPeriod: 300000,
    halfOpenMaxCalls: 3,
    halfOpenSuccessThreshold: 2,
  },
  healthCheckInterval: 30000,
  enableFallback: true,
};

const resilienceService =
  NetworkResilienceService.getInstance(resilienceConfig);

/**
 * ENDPOINT DI CLASSIFICAZIONE ERRORI
 * ===================================
 */

/**
 * POST /api/v1/errors/classify
 * Classifica un errore e fornisce messaggi user-friendly
 */
router.post('/classify', async (req: Request, res: Response) => {
  try {
    const { error, context } = req.body;

    if (!error || !context) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Fields "error" and "context" are required',
        required: {
          error: { message: 'string', stack: 'string (optional)' },
          context: {
            operation: 'string',
            apiService: 'string',
            symbol: 'string (optional)',
            timeframe: 'string (optional)',
          },
        },
      });
    }

    // Crea oggetto Error dal payload
    const errorObj = new Error(error.message);
    if (error.stack) errorObj.stack = error.stack;

    // Classifica l'errore
    const classified = errorHandler.classifyError(
      errorObj,
      context as ErrorContext
    );

    res.json({
      success: true,
      classification: {
        errorId: classified.errorId,
        type: classified.type,
        severity: classified.severity,
        retryable: classified.retryable,
        userMessage: classified.userMessage,
        recovery: classified.recovery,
        timestamp: classified.timestamp,
      },
      recommendations: generateRecommendations(classified),
      nextSteps: generateNextSteps(classified),
    });
  } catch (_error) {
    console.error('Error classification failed:', _error);
    res.status(500).json({
      error: 'Classification Error',
      message: 'Failed to classify error',
    });
  }
});

/**
 * POST /api/v1/errors/simulate
 * Simula diversi tipi di errore per testing (solo in development)
 */
router.post('/simulate', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Error simulation is not available in production',
    });
  }

  try {
    const { errorType, symbol, timeframe } = req.body;

    if (!errorType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Field "errorType" is required',
        availableTypes: Object.values(SystemErrorType),
      });
    }

    // Simula l'errore richiesto
    const simulatedError = simulateError(errorType, symbol, ___timeframe);
    const context: ErrorContext = {
      operation: 'error_simulation',
      apiService: 'test_service',
      symbol: symbol || 'TEST',
      timeframe: timeframe || 'daily',
    };

    const classified = errorHandler.classifyError(simulatedError, context);

    res.json({
      success: true,
      simulation: {
        requestedType: errorType,
        generatedError: {
          message: simulatedError.message,
          name: simulatedError.name,
        },
        classification: classified,
        userExperience: {
          title: classified.userMessage.title,
          message: classified.userMessage.message,
          suggestion: classified.userMessage.suggestion,
          estimatedResolution: classified.userMessage.estimatedResolution,
        },
      },
    });
  } catch (_error) {
    console.error('Error simulation failed:', _error);
    res.status(500).json({
      error: 'Simulation Error',
      message: 'Failed to simulate error',
    });
  }
});

/**
 * ENDPOINT DI RESILIENZA DI RETE
 * ===============================
 */

/**
 * POST /api/v1/errors/execute-resilient
 * Esegue operazione con resilienza completa
 */
router.post('/execute-resilient', async (req: Request, res: Response) => {
  try {
    const { operation, context, options } = req.body;

    if (!operation || !context) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Fields "operation" and "context" are required',
      });
    }

    // Simula operazione (in un caso reale, questa sarebbe l'operazione effettiva)
    const mockOperation = async () => {
      if (operation.shouldFail) {
        throw new Error(
          operation.errorMessage || 'Simulated operation failure'
        );
      }
      return { result: 'Success', data: operation.mockData || 'Mock response' };
    };

    const result = await resilienceService.executeResilient(
      mockOperation,
      context as ErrorContext,
      options
    );

    res.json({
      success: result.success,
      result: result.data,
      metadata: {
        source: result.source,
        responseTime: result.responseTime,
        retryCount: result.retryCount,
        fromCache: result.fromCache,
        fallbackUsed: result.fallbackUsed,
      },
      error: result.error
        ? {
            type: result.error.type,
            severity: result.error.severity,
            userMessage: result.error.userMessage,
          }
        : undefined,
    });
  } catch (_error) {
    console.error('Resilient execution failed:', _error);
    res.status(500).json({
      error: 'Execution Error',
      message: 'Failed to execute resilient operation',
    });
  }
});

/**
 * ENDPOINT DI MONITORAGGIO
 * ========================
 */

/**
 * GET /api/v1/errors/statistics
 * Statistiche degli errori del sistema
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = errorHandler.getErrorStatistics();
    const circuitBreakerStats = resilienceService.getCircuitBreakerStats();
    const fallbackStatus = resilienceService.getFallbackServicesStatus();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      errorStatistics: stats,
      circuitBreakers: circuitBreakerStats,
      fallbackServices: fallbackStatus,
      systemHealth: {
        totalErrors: stats.totalErrors,
        criticalErrors: stats.errorsBySeverity['critical'] || 0,
        openCircuitBreakers: Object.values(circuitBreakerStats).filter(
          cb => cb.state === CircuitBreakerState.OPEN
        ).length,
        degradedServices: Object.values(fallbackStatus)
          .flat()
          .filter(service => service.healthStatus === 'degraded').length,
      },
    });
  } catch (_error) {
    console.error('Statistics retrieval failed:', _error);
    res.status(500).json({
      error: 'Statistics Error',
      message: 'Failed to retrieve error statistics',
    });
  }
});

/**
 * GET /api/v1/errors/circuit-breakers
 * Stato di tutti i circuit breakers
 */
router.get('/circuit-breakers', async (req: Request, res: Response) => {
  try {
    const stats = resilienceService.getCircuitBreakerStats();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      circuitBreakers: Object.entries(stats).map(([service, stat]) => ({
        service,
        state: stat.state,
        failureCount: stat.failureCount,
        successCount: stat.successCount,
        totalRequests: stat.totalRequests,
        successRate: Math.round(stat.successRate * 100),
        lastFailureTime: stat.lastFailureTime,
        nextRetryTime: stat.nextRetryTime,
        healthStatus: getHealthStatus(stat.state, stat.successRate),
      })),
    });
  } catch (_error) {
    console.error('Circuit breaker status retrieval failed:', _error);
    res.status(500).json({
      error: 'Circuit Breaker Error',
      message: 'Failed to retrieve circuit breaker status',
    });
  }
});

/**
 * POST /api/v1/errors/circuit-breakers/:service/reset
 * Resetta un circuit breaker specifico
 */
router.post(
  '/circuit-breakers/:service/reset',
  async (req: Request, res: Response) => {
    try {
      const { service } = req.params;
      const success = resilienceService.resetCircuitBreaker(service);

      if (success) {
        res.json({
          success: true,
          message: `Circuit breaker for ${service} has been reset`,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(404).json({
          error: 'Not Found',
          message: `Circuit breaker for service "${service}" not found`,
        });
      }
    } catch (_error) {
      console.error('Circuit breaker reset failed:', _error);
      res.status(500).json({
        error: 'Reset Error',
        message: 'Failed to reset circuit breaker',
      });
    }
  }
);

/**
 * POST /api/v1/errors/circuit-breakers/:service/open
 * Apre forzatamente un circuit breaker
 */
router.post(
  '/circuit-breakers/:service/open',
  async (req: Request, res: Response) => {
    try {
      const { service } = req.params;
      const success = resilienceService.openCircuitBreaker(service);

      if (success) {
        res.json({
          success: true,
          message: `Circuit breaker for ${service} has been opened`,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(404).json({
          error: 'Not Found',
          message: `Circuit breaker for service "${service}" not found`,
        });
      }
    } catch (_error) {
      console.error('Circuit breaker open failed:', _error);
      res.status(500).json({
        error: 'Open Error',
        message: 'Failed to open circuit breaker',
      });
    }
  }
);

/**
 * POST /api/v1/errors/fallback-services/register
 * Registra un nuovo servizio di fallback
 */
router.post(
  '/fallback-services/register',
  async (req: Request, res: Response) => {
    try {
      const { primaryService, fallbackService } = req.body;

      if (!primaryService || !fallbackService) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Fields "primaryService" and "fallbackService" are required',
          fallbackServiceSchema: {
            name: 'string',
            endpoint: 'string',
            priority: 'number',
            healthStatus: 'healthy | degraded | unhealthy',
            lastChecked: 'number',
            responseTime: 'number',
          },
        });
      }

      resilienceService.registerFallbackService(
        primaryService,
        fallbackService as FallbackService
      );

      res.json({
        success: true,
        message: `Fallback service ${fallbackService.name} registered for ${primaryService}`,
        timestamp: new Date().toISOString(),
      });
    } catch (_error) {
      console.error('Fallback service registration failed:', _error);
      res.status(500).json({
        error: 'Registration Error',
        message: 'Failed to register fallback service',
      });
    }
  }
);

/**
 * GET /api/v1/errors/health
 * Health check del sistema di gestione errori
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = errorHandler.getErrorStatistics();
    const circuitBreakers = resilienceService.getCircuitBreakerStats();

    const criticalErrors = stats.errorsBySeverity['critical'] || 0;
    const openCircuitBreakers = Object.values(circuitBreakers).filter(
      cb => cb.state === CircuitBreakerState.OPEN
    ).length;

    const isHealthy = criticalErrors === 0 && openCircuitBreakers === 0;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      details: {
        errorHandlerActive: true,
        resilienceServiceActive: true,
        totalErrors: stats.totalErrors,
        criticalErrors,
        openCircuitBreakers,
        recentErrorsCount: stats.recentErrors.length,
      },
      actions: isHealthy
        ? []
        : generateHealthActions(criticalErrors, openCircuitBreakers),
    });
  } catch (_error) {
    console.error('Error handling health check failed:', _error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /api/v1/errors/history
 * Pulisce la cronologia degli errori
 */
router.delete('/history', async (req: Request, res: Response) => {
  try {
    errorHandler.clearErrorHistory();

    res.json({
      success: true,
      message: 'Error history cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    console.error('Error history clearing failed:', _error);
    res.status(500).json({
      error: 'Clear Error',
      message: 'Failed to clear error history',
    });
  }
});

/**
 * UTILITY FUNCTIONS
 * =================
 */

/**
 * Genera raccomandazioni basate sull'errore classificato
 */
function generateRecommendations(error: ClassifiedError): string[] {
  const recommendations: string[] = [];

  switch (error.type) {
    case SystemErrorType.RATE_LIMIT_EXCEEDED:
      recommendations.push('Implementare cache più aggressiva');
      recommendations.push('Considerare rate limiting client-side');
      recommendations.push(
        'Utilizzare batch processing per richieste multiple'
      );
      break;

    case SystemErrorType.DAILY_LIMIT_EXCEEDED:
      recommendations.push('Implementare rotazione di API keys');
      recommendations.push('Utilizzare servizi alternativi come fallback');
      recommendations.push('Ottimizzare cache per ridurre chiamate API');
      break;

    case SystemErrorType.INVALID_API_KEY:
      recommendations.push('Verificare validità e scadenza delle API keys');
      recommendations.push('Implementare refresh automatico delle chiavi');
      recommendations.push('Configurare alerting per errori di autenticazione');
      break;

    case SystemErrorType.SYMBOL_NOT_FOUND:
      recommendations.push('Implementare validazione simboli client-side');
      recommendations.push('Aggiungere database di simboli supportati');
      recommendations.push(
        'Fornire suggerimenti automatici per simboli simili'
      );
      break;

    case SystemErrorType.CONNECTION_TIMEOUT:
      recommendations.push('Aumentare timeout per connessioni lente');
      recommendations.push('Implementare retry con backoff esponenziale');
      recommendations.push('Utilizzare connection pooling');
      break;

    default:
      recommendations.push(
        'Monitorare pattern di errori per identificare cause'
      );
      recommendations.push('Implementare logging dettagliato per debugging');
      break;
  }

  return recommendations;
}

/**
 * Genera prossimi passi per risolvere l'errore
 */
function generateNextSteps(error: ClassifiedError): string[] {
  const steps: string[] = [];

  if (error.retryable) {
    steps.push('Il sistema riproverà automaticamente');
    if (error.recovery.estimatedRecoveryTime) {
      steps.push(
        `Tempo stimato di recovery: ${Math.round(error.recovery.estimatedRecoveryTime / 1000)} secondi`
      );
    }
  }

  if (error.recovery.fallbackOptions?.length) {
    steps.push(
      `Fallback disponibili: ${error.recovery.fallbackOptions.join(', ')}`
    );
  }

  if (error.recovery.requiredUserAction) {
    steps.push(`Azione richiesta: ${error.recovery.requiredUserAction}`);
  }

  return steps;
}

/**
 * Simula errori per testing
 */
function simulateError(
  errorType: string,
  symbol?: string,
  timeframe?: string
): Error {
  let timeoutError: Error;
  let networkError: Error;
  switch (errorType) {
    case SystemErrorType.RATE_LIMIT_EXCEEDED:
      return new Error(
        'Thank you for using Alpha Vantage! You have made 5 API calls within the last minute.'
      );

    case SystemErrorType.DAILY_LIMIT_EXCEEDED:
      return new Error(
        'Thank you for using Alpha Vantage! Our standard API call frequency is 25 requests per day.'
      );

    case SystemErrorType.INVALID_API_KEY:
      return new Error(
        'Invalid API key. Please try again or visit https://www.alphavantage.co/support/#api-key for more information.'
      );

    case SystemErrorType.SYMBOL_NOT_FOUND:
      return new Error(
        `Invalid API call. Please retry or visit the documentation (https://www.alphavantage.co/documentation/) for TIME_SERIES_DAILY. Symbol=${symbol || 'INVALID123'} not found.`
      );

    case SystemErrorType.CONNECTION_TIMEOUT:
      timeoutError = new Error('Operation timeout after 30000ms');
      timeoutError.name = 'TimeoutError';
      return timeoutError;

    case SystemErrorType.NETWORK_UNAVAILABLE:
      networkError = new Error('ENOTFOUND api.alphavantage.co');
      networkError.name = 'NetworkError';
      return networkError;

    default:
      return new Error(`Simulated error of type: ${errorType}`);
  }
}

/**
 * Determina lo stato di salute di un circuit breaker
 */
function getHealthStatus(
  state: CircuitBreakerState,
  successRate: number
): string {
  if (state === CircuitBreakerState.OPEN) return 'unhealthy';
  if (state === CircuitBreakerState.HALF_OPEN) return 'degraded';
  if (successRate < 0.8) return 'degraded';
  return 'healthy';
}

/**
 * Genera azioni per migliorare la salute del sistema
 */
function generateHealthActions(
  criticalErrors: number,
  openCircuitBreakers: number
): string[] {
  const actions: string[] = [];

  if (criticalErrors > 0) {
    actions.push('Investigate critical errors in error statistics');
    actions.push('Check system logs for recurring issues');
  }

  if (openCircuitBreakers > 0) {
    actions.push('Check status of services with open circuit breakers');
    actions.push(
      'Consider manual circuit breaker reset if services are healthy'
    );
  }

  return actions;
}

export { router as errorHandlingRoutes };
