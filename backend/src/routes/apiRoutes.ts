/**
 * STUDENT ANALYST - API Routes
 * ===========================
 *
 * Route sicure per il proxy API che nascondono completamente le chiavi
 * e forniscono endpoints puliti al frontend
 */

import { Request, Response, Router } from 'express';
import {
  dateRangeValidationMiddleware,
  sanitizationMiddleware,
  tickerValidationMiddleware,
} from '../middleware/sanitizationMiddleware';
import {
  AlphaVantageError,
  AlphaVantageErrorType,
  AlphaVantageService,
  AlphaVantageTimeframe,
} from '../services/alphaVantageService';
import { ApiProxyService } from '../services/apiProxy';
import { batchRoutes } from './batchRoutes';

const router = Router();

// Inizializza Alpha Vantage Service
const alphaVantageService = new AlphaVantageService({
  baseUrl: process.env.BACKEND_URL || 'http://localhost:10000',
  timeout: 30000,
  retryAttempts: 3,
  cacheEnabled: true,
  validateData: true,
});

// Applica sanitizzazione globale a tutte le route
router.use(
  sanitizationMiddleware({
    enableBodySanitization: true,
    enableParamsSanitization: true,
    enableQuerySanitization: false,
    logSuspiciousActivity: true,
    blockOnDangerousPatterns: true,
    maxRequestSize: 512 * 1024, // 512KB per API finanziarie
    trustedIPs: ['127.0.0.1', '::1', 'localhost'],
  })
);

/**
 * ALPHA VANTAGE PROXY ENDPOINT
 * ============================
 */

/**
 * GET /api/v1/alpha-vantage
 * Proxy sicuro per Alpha Vantage API - utilizzato dal nostro AlphaVantageService
 * Nasconde completamente le API keys e gestisce caching/rate limiting
 */
router.get('/alpha-vantage', ApiProxyService.alphaVantageProxy);

/**
 * FINANCIAL DATA ENDPOINTS - ALPHA VANTAGE
 * =========================================
 */

/**
 * GET /api/v1/stock/:symbol
 * Endpoint unificato per dati azionari con diversi timeframe
 *
 * Query Parameters:
 * - timeframe: 1min, 5min, 15min, 30min, 60min, daily, weekly, monthly
 * - outputsize: compact | full
 * - adjusted: true | false (default: true)
 * - month: YYYY-MM (solo per intraday storico)
 * - nocache: true | false (bypassa cache, default: false)
 *
 * Esempi:
 * - /api/v1/stock/AAPL?timeframe=daily&outputsize=compact
 * - /api/v1/stock/MSFT?timeframe=1min&outputsize=full
 * - /api/v1/stock/GOOGL?timeframe=weekly&adjusted=false
 * - /api/v1/stock/TSLA?timeframe=5min&month=2024-01
 */
router.get(
  '/stock/:symbol',
  tickerValidationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const {
        timeframe = 'daily',
        outputsize = 'compact',
        adjusted = 'true',
        month,
        nocache = 'false',
      } = req.query;

      // Validazione timeframe
      if (
        !Object.values(AlphaVantageTimeframe).includes(
          timeframe as AlphaVantageTimeframe
        )
      ) {
        return res.status(400).json({
          error: 'Invalid Timeframe',
          message: `Timeframe "${timeframe}" not supported`,
          supportedTimeframes: Object.values(AlphaVantageTimeframe),
          example: '/api/v1/stock/AAPL?timeframe=daily',
        });
      }

      // Validazione output size
      if (outputsize !== 'compact' && outputsize !== 'full') {
        return res.status(400).json({
          error: 'Invalid Output Size',
          message: 'outputsize must be "compact" or "full"',
          provided: outputsize,
        });
      }

      // Validazione mese per intraday
      if (month && !/^\d{4}-\d{2}$/.test(month as string)) {
        return res.status(400).json({
          error: 'Invalid Month Format',
          message: 'month must be in YYYY-MM format',
          provided: month,
          example: '2024-01',
        });
      }

      // Chiama Alpha Vantage Service
      const response = await alphaVantageService.getStockData(
        symbol,
        timeframe as AlphaVantageTimeframe,
        {
          outputSize: outputsize as 'compact' | 'full',
          adjusted: adjusted === 'true',
          month: month as string,
          useCache: nocache !== 'true',
        }
      );

      res.json({
        success: true,
        ...response,
        requestInfo: {
          symbol: symbol.toUpperCase(),
          timeframe,
          outputsize,
          adjusted: adjusted === 'true',
          month: month || null,
          cached: response.cacheHit || false,
        },
      });
    } catch (_error) {
      if (error instanceof AlphaVantageError) {
        const statusCode = getStatusCodeFromErrorType(error.type);
        return res.status(statusCode).json({
          error: error.type,
          message: error.message,
          retryable: error.retryable,
          timestamp: error.timestamp,
          details: error.response,
        });
      }

      console.error('Stock data error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch stock data',
      });
    }
  }
);

/**
 * GET /api/v1/quote/:symbol
 * Quotazione rapida (utilizza GLOBAL_QUOTE di Alpha Vantage)
 */
router.get(
  '/quote/:symbol',
  tickerValidationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { symbol: _symbol } = req.params;

      // Per ora manteniamo compatibilità con ApiProxyService
      // In futuro si può migrare completamente ad AlphaVantageService
      await ApiProxyService.getQuote(req, res);
    } catch (_error) {
      console.error('Quote error:', error);
      res.status(500).json({
        error: 'Quote Error',
        message: 'Failed to fetch quote data',
      });
    }
  }
);

/**
 * GET /api/v1/historical/:symbol
 * Dati storici (mantiene compatibilità con l'API esistente)
 */
router.get(
  '/historical/:symbol',
  tickerValidationMiddleware,
  dateRangeValidationMiddleware,
  ApiProxyService.getHistoricalData
);

/**
 * VALIDATION ENDPOINT
 * ===================
 */

/**
 * POST /api/v1/validate/request
 * Valida una richiesta senza eseguirla (utile per testing frontend)
 */
router.post('/validate/request', async (req: Request, res: Response) => {
  try {
    const { symbol, timeframe } = req.body;

    if (!symbol || !timeframe) {
      return res.status(400).json({
        error: 'Missing Parameters',
        message: 'symbol and timeframe are required',
        required: ['symbol', 'timeframe'],
      });
    }

    const validation = alphaVantageService.validateRequest(symbol, timeframe);

    res.json({
      success: true,
      validation,
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Validation Error',
      message: 'Failed to validate request',
    });
  }
});

/**
 * BATCH ENDPOINTS per performance
 * ===============================
 */

/**
 * POST /api/v1/stock/batch
 * Ottiene dati azionari per simboli multipli
 * Massimo 10 simboli per richiesta per rispettare i limiti Alpha Vantage
 */
router.post('/stock/batch', async (req: Request, res: Response) => {
  try {
    const {
      symbols,
      timeframe = 'daily',
      outputsize = 'compact',
      adjusted = true,
    } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'symbols array is required',
        example: { symbols: ['AAPL', 'MSFT', 'GOOGL'], timeframe: 'daily' },
      });
    }

    if (symbols.length > 10) {
      return res.status(400).json({
        error: 'Too Many Symbols',
        message:
          'Maximum 10 symbols allowed per batch request (Alpha Vantage free tier limitations)',
        provided: symbols.length,
        suggestion:
          'Split into multiple requests or consider upgrading to premium Alpha Vantage',
      });
    }

    // Valida timeframe
    if (!Object.values(AlphaVantageTimeframe).includes(timeframe)) {
      return res.status(400).json({
        error: 'Invalid Timeframe',
        message: `Timeframe "${timeframe}" not supported`,
        supportedTimeframes: Object.values(AlphaVantageTimeframe),
      });
    }

    // Valida simboli individualmente
    const validationResults = symbols.map((symbol: string) => ({
      symbol,
      ...alphaVantageService.validateRequest(symbol, timeframe),
    }));

    const invalidSymbols = validationResults.filter(result => !result.valid);
    if (invalidSymbols.length > 0) {
      return res.status(400).json({
        error: 'Invalid Symbols',
        message: 'Some symbols failed validation',
        invalidSymbols: invalidSymbols.map(s => ({
          symbol: s.symbol,
          errors: s.errors,
        })),
      });
    }

    // Processa simboli con gestione errori individuali
    const results = await Promise.allSettled(
      symbols.map(async (symbol: string) => {
        try {
          const data = await alphaVantageService.getStockData(
            symbol,
            timeframe,
            { outputSize: outputsize, adjusted }
          );

          return {
            symbol: symbol.toUpperCase(),
            success: true,
            data: data.data.slice(0, 50), // Limita per performance
            metadata: data.metadata,
            cached: data.cacheHit,
          };
        } catch (_error) {
          return {
            symbol: symbol.toUpperCase(),
            success: false,
            error:
              error instanceof AlphaVantageError ? error.type : 'UNKNOWN_ERROR',
            message:
              error instanceof Error ? error.message : 'Unknown error occurred',
          };
        }
      })
    );

    const successfulResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<unknown>).value)
      .filter(
        result =>
          typeof result === 'object' &&
          result !== null &&
          'success' in result &&
          (result as any).success
      );

    const failedResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<unknown>).value)
      .filter(
        result =>
          typeof result === 'object' &&
          result !== null &&
          'success' in result &&
          !(result as any).success
      );

    const rejectedResults = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        symbol: symbols[index],
        success: false,
        error: 'REQUEST_FAILED',
        message: (result as PromiseRejectedResult).reason,
      }));

    const allErrors = [...failedResults, ...rejectedResults];

    res.json({
      success: true,
      summary: {
        total: symbols.length,
        successful: successfulResults.length,
        failed: allErrors.length,
        timeframe,
        outputsize,
        adjusted,
      },
      data: successfulResults,
      errors: allErrors.length > 0 ? allErrors : undefined,
      timestamp: new Date().toISOString(),
      rateLimitWarning:
        symbols.length > 5
          ? 'Consider reducing batch size to preserve Alpha Vantage rate limits'
          : undefined,
    });
  } catch (_error) {
    console.error('Batch stock data error:', error);
    res.status(500).json({
      error: 'Batch Processing Error',
      message: 'Failed to process batch request',
    });
  }
});

/**
 * POST /api/v1/quotes/batch
 * Quotazioni multiple (mantiene compatibilità)
 */
router.post('/quotes/batch', async (req: Request, res: Response) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'symbols array is required',
        example: { symbols: ['AAPL', 'MSFT', 'GOOGL'] },
      });
    }

    if (symbols.length > 20) {
      return res.status(400).json({
        error: 'Too Many Symbols',
        message: 'Maximum 20 symbols allowed per batch request',
        provided: symbols.length,
      });
    }

    // Valida ogni simbolo
    const validSymbols = symbols.filter(
      (symbol: unknown) =>
        typeof symbol === 'string' &&
        symbol.length <= 10 &&
        /^[A-Za-z0-9.-]+$/.test(symbol)
    );

    if (validSymbols.length !== symbols.length) {
      return res.status(400).json({
        error: 'Invalid Symbols',
        message: 'All symbols must be alphanumeric and less than 10 characters',
        validSymbols,
        invalidSymbols: symbols.filter(
          (s: unknown) => !validSymbols.includes(s)
        ),
      });
    }

    // Processa ogni simbolo (implementazione semplificata per ora)
    const results = await Promise.allSettled(
      validSymbols.map(async (symbol: string) => {
        // Simula chiamata al servizio proxy (per ora return mock data)
        return {
          symbol: symbol.toUpperCase(),
          price: Math.random() * 1000,
          change: (Math.random() - 0.5) * 20,
          timestamp: new Date().toISOString(),
        };
      })
    );

    const successfulResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<unknown>).value);

    const failedResults = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        symbol: validSymbols[index],
        error: (result as PromiseRejectedResult).reason,
      }));

    res.json({
      success: true,
      count: successfulResults.length,
      data: successfulResults,
      errors: failedResults.length > 0 ? failedResults : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    console.error('Batch quotes error:', error);
    res.status(500).json({
      error: 'Batch Processing Error',
      message: 'Failed to process batch request',
    });
  }
});

/**
 * ADMIN & MONITORING ENDPOINTS
 * ============================
 */

/**
 * GET /api/v1/admin/alpha-vantage/health
 * Health check del servizio Alpha Vantage
 */
router.get(
  '/admin/alpha-vantage/health',
  async (req: Request, res: Response) => {
    try {
      const health = await alphaVantageService.healthCheck();
      res.json({
        success: true,
        service: 'AlphaVantageService',
        ...health,
      });
    } catch (_error) {
      res.status(503).json({
        success: false,
        service: 'AlphaVantageService',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/v1/admin/alpha-vantage/cache
 * Statistiche cache Alpha Vantage
 */
router.get(
  '/admin/alpha-vantage/cache',
  async (req: Request, res: Response) => {
    try {
      const stats = alphaVantageService.getCacheStats();
      res.json({
        success: true,
        cache: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (_error) {
      res.status(500).json({
        error: 'Cache Stats Error',
        message: 'Failed to get cache statistics',
      });
    }
  }
);

/**
 * DELETE /api/v1/admin/alpha-vantage/cache
 * Svuota cache Alpha Vantage
 */
router.delete(
  '/admin/alpha-vantage/cache',
  async (req: Request, res: Response) => {
    try {
      alphaVantageService.clearCache();
      res.json({
        success: true,
        message: 'Alpha Vantage cache cleared successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (_error) {
      res.status(500).json({
        error: 'Cache Clear Error',
        message: 'Failed to clear cache',
      });
    }
  }
);

/**
 * GET /api/v1/admin/stats
 * Statistiche di utilizzo API (protetto da auth in futuro)
 */
router.get('/admin/stats', ApiProxyService.getApiStats);

/**
 * GET /api/v1/admin/connection-test
 * Test di connettività alle API esterne
 */
router.get('/admin/connection-test', ApiProxyService.testApiConnection);

/**
 * GET /api/v1/admin/cache-status
 * Stato della cache del sistema
 */
router.get('/admin/cache-status', async (req: Request, res: Response) => {
  try {
    // Importa il manager per accedere allo stato della cache
    const { apiKeyManager } = await import('../services/apiProxy');
    const stats = apiKeyManager.getUsageStats();

    res.json({
      success: true,
      cache: {
        size:
          typeof stats === 'object' && stats !== null && 'cacheSize' in stats
            ? (stats as any).cacheSize
            : 0,
        lastCleanup: new Date().toISOString(),
        systemMemory: process.memoryUsage(),
        uptime: process.uptime(),
      },
    });
  } catch (_error) {
    console.error('Cache status error:', error);
    res.status(500).json({
      error: 'Cache Status Error',
      message: 'Failed to get cache status',
    });
  }
});

/**
 * BATCH PROCESSING ROUTES
 * =======================
 */
router.use('/batch', batchRoutes);

/**
 * UTILITY ENDPOINTS
 * =================
 */

/**
 * GET /api/v1/timeframes
 * Lista dei timeframe supportati
 */
router.get('/timeframes', (req: Request, res: Response) => {
  res.json({
    success: true,
    timeframes: Object.values(AlphaVantageTimeframe),
    descriptions: {
      [AlphaVantageTimeframe.INTRADAY_1MIN]:
        'Intraday data with 1-minute intervals',
      [AlphaVantageTimeframe.INTRADAY_5MIN]:
        'Intraday data with 5-minute intervals',
      [AlphaVantageTimeframe.INTRADAY_15MIN]:
        'Intraday data with 15-minute intervals',
      [AlphaVantageTimeframe.INTRADAY_30MIN]:
        'Intraday data with 30-minute intervals',
      [AlphaVantageTimeframe.INTRADAY_60MIN]:
        'Intraday data with 60-minute intervals',
      [AlphaVantageTimeframe.DAILY]: 'Daily time series data',
      [AlphaVantageTimeframe.WEEKLY]: 'Weekly time series data',
      [AlphaVantageTimeframe.MONTHLY]: 'Monthly time series data',
    },
    rateLimits: {
      free: '25 requests per day',
      premium: 'Up to 1200 requests per minute (depending on plan)',
    },
    batchProcessing: {
      maxSymbols: 50,
      maxTimeframes: 5,
      rateLimiting: '5 requests per minute, automatic queueing',
      progressTracking: 'Real-time progress updates available',
    },
  });
});

/**
 * GET /api/v1/health
 * Health check generale del sistema
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const alphaVantageHealth = await alphaVantageService.healthCheck();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        alphaVantage: alphaVantageHealth,
        apiProxy: {
          status: 'healthy', // TODO: implementare health check per ApiProxyService
          timestamp: new Date().toISOString(),
        },
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
    });
  } catch (_error) {
    res.status(503).json({
      success: false,
      error: 'Health Check Failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Helper function per convertire AlphaVantageErrorType in HTTP status code
 */
function getStatusCodeFromErrorType(errorType: AlphaVantageErrorType): number {
  switch (errorType) {
    case AlphaVantageErrorType.INVALID_SYMBOL:
    case AlphaVantageErrorType.INVALID_FUNCTION:
    case AlphaVantageErrorType.INVALID_TIMEFRAME:
      return 400; // Bad Request

    case AlphaVantageErrorType.AUTHENTICATION_ERROR:
      return 401; // Unauthorized

    case AlphaVantageErrorType.API_LIMIT_EXCEEDED:
    case AlphaVantageErrorType.RATE_LIMIT:
      return 429; // Too Many Requests

    case AlphaVantageErrorType.NO_DATA_AVAILABLE:
      return 404; // Not Found

    case AlphaVantageErrorType.NETWORK_ERROR:
    case AlphaVantageErrorType.PARSING_ERROR:
    case AlphaVantageErrorType.MALFORMED_RESPONSE:
    default:
      return 500; // Internal Server Error
  }
}

export { router as apiRoutes };
