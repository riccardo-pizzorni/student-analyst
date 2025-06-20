/**
 * STUDENT ANALYST - Batch Processing Routes
 * ========================================
 *
 * Endpoints API per gestione batch processing di richieste finanziarie
 * con progress tracking in tempo reale e rate limiting intelligente
 */

import { Request, Response, Router } from 'express';
import { sanitizationMiddleware } from '../middleware/sanitizationMiddleware';
import {
  AlphaVantageService,
  AlphaVantageTimeframe,
} from '../services/alphaVantageService';
import {
  BatchProcessor,
  BatchRequest,
  BatchResult,
} from '../services/batchProcessor';

const router = Router();

// Inizializza servizi
const alphaVantageService = new AlphaVantageService({
  baseUrl: process.env.BACKEND_URL || 'http://localhost:10000',
  timeout: 30000,
  retryAttempts: 3,
  cacheEnabled: true,
  validateData: true,
});

const batchProcessor = new BatchProcessor(alphaVantageService, {
  maxConcurrentBatches: 3,
  defaultBatchSize: 10,
  enableProgressTracking: true,
  enableAutoRetry: true,
  cacheFirstStrategy: true,
});

// Applica sanitizzazione a tutte le route batch
router.use(
  sanitizationMiddleware({
    enableBodySanitization: true,
    enableParamsSanitization: true,
    enableQuerySanitization: true,
    logSuspiciousActivity: true,
    blockOnDangerousPatterns: true,
    maxRequestSize: 1024 * 1024, // 1MB
    trustedIPs: ['127.0.0.1', '::1', 'localhost'],
  })
);

/**
 * BATCH PROCESSING ENDPOINTS
 * ==========================
 */

/**
 * POST /api/v1/batch/process
 * Avvia elaborazione batch di simboli multipli
 *
 * Body:
 * {
 *   "symbols": ["AAPL", "MSFT", "GOOGL"],
 *   "timeframe": "daily",
 *   "options": {
 *     "outputSize": "compact",
 *     "adjusted": true,
 *     "useCache": true
 *   },
 *   "priority": 5,
 *   "batchId": "optional-custom-id"
 * }
 */
router.post('/process', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      symbols,
      timeframe,
      options = {},
      priority = 1,
      batchId,
    } = req.body;

    // Validazione input
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'symbols array is required and must not be empty',
        example: {
          symbols: ['AAPL', 'MSFT', 'GOOGL'],
          timeframe: 'daily',
        },
      });
    }

    if (symbols.length > 50) {
      return res.status(400).json({
        error: 'Batch Size Limit Exceeded',
        message: 'Maximum 50 symbols allowed per batch request',
        provided: symbols.length,
        suggestion:
          'Split into multiple smaller batches for better performance',
      });
    }

    if (!timeframe) {
      return res.status(400).json({
        error: 'Invalid Timeframe',
        message: 'timeframe is required',
        supportedTimeframes: [
          '1min',
          '5min',
          '15min',
          '30min',
          '60min',
          'daily',
          'weekly',
          'monthly',
        ],
      });
    }

    // Crea richiesta batch
    const batchRequest: BatchRequest = {
      symbols: symbols.map((s: string) => s.toUpperCase()),
      timeframe,
      options,
      priority,
      batchId,
    };

    // Avvia elaborazione batch (asincrona)
    const processingPromise = batchProcessor.processBatch(batchRequest);

    // Risposta immediata con ID batch
    const responseTime = Date.now() - startTime;
    const actualBatchId = batchRequest.batchId || `batch-${Date.now()}`;

    res.status(202).json({
      success: true,
      message: 'Batch processing started',
      batchId: actualBatchId,
      status: 'processing',
      request: {
        symbols: batchRequest.symbols,
        timeframe: batchRequest.timeframe,
        symbolCount: batchRequest.symbols.length,
        estimatedTimeMinutes: Math.ceil(
          (batchRequest.symbols.length * 12) / 60
        ),
      },
      monitoring: {
        statusEndpoint: `/api/v1/batch/status/${actualBatchId}`,
        resultEndpoint: `/api/v1/batch/result/${actualBatchId}`,
        cancelEndpoint: `/api/v1/batch/cancel/${actualBatchId}`,
      },
      responseTime,
      timestamp: new Date().toISOString(),
    });

    // Gestisci risultato asincrono
    processingPromise
      .then((result: BatchResult) => {
        console.log(
          `✅ Batch ${actualBatchId} completed: ${result.successfulSymbols}/${result.totalSymbols} successful`
        );
      })
      .catch((error: Error) => {
        console.error(`❌ Batch ${actualBatchId} failed:`, error.message);
      });
  } catch (_error) {
    const responseTime = Date.now() - startTime;
    console.error('Batch processing error:', _error);

    res.status(500).json({
      error: 'Batch Processing Error',
      message: 'Failed to start batch processing',
      details: _error instanceof Error ? _error.message : 'Unknown error',
      responseTime,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/v1/batch/status/:batchId
 * Ottiene stato di elaborazione di un batch
 */
router.get('/status/:batchId', (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({
        error: 'Missing Batch ID',
        message: 'Batch ID is required',
      });
    }

    const batchStatus = batchProcessor.getBatchStatus(batchId);

    if (!batchStatus) {
      // Controlla se è un batch completato
      const completedResult = batchProcessor.getBatchResult(batchId);
      if (completedResult) {
        return res.json({
          success: true,
          batchId,
          status: 'completed',
          progress: {
            completed: completedResult.totalSymbols,
            total: completedResult.totalSymbols,
            percentage: 100,
            estimatedTimeRemainingMs: 0,
          },
          result: {
            successfulSymbols: completedResult.successfulSymbols,
            failedSymbols: completedResult.failedSymbols,
            executionTimeMs: completedResult.executionTimeMs,
            cacheHits: completedResult.cacheHits,
            apiCalls: completedResult.apiCalls,
          },
          links: {
            result: `/api/v1/batch/result/${batchId}`,
          },
        });
      }

      return res.status(404).json({
        error: 'Batch Not Found',
        message: `No batch found with ID: ${batchId}`,
        suggestion: 'Check the batch ID or the batch may have expired',
      });
    }

    res.json({
      success: true,
      batchId,
      status: batchStatus.status,
      progress: batchStatus.progress,
      startTime: batchStatus.startTime,
      endTime: batchStatus.endTime,
      errors: batchStatus.errors.slice(-5), // Ultimi 5 errori
      links: {
        result:
          batchStatus.status === 'completed'
            ? `/api/v1/batch/result/${batchId}`
            : null,
        cancel:
          batchStatus.status === 'processing'
            ? `/api/v1/batch/cancel/${batchId}`
            : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    console.error('Batch status error:', _error);
    res.status(500).json({
      error: 'Status Retrieval Error',
      message: 'Failed to get batch status',
    });
  }
});

/**
 * GET /api/v1/batch/result/:batchId
 * Ottiene risultati completi di un batch
 */
router.get('/result/:batchId', (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { format = 'summary' } = req.query;

    if (!batchId) {
      return res.status(400).json({
        error: 'Missing Batch ID',
        message: 'Batch ID is required',
      });
    }

    const batchResult = batchProcessor.getBatchResult(batchId);

    if (!batchResult) {
      return res.status(404).json({
        error: 'Batch Result Not Found',
        message: `No completed batch found with ID: ${batchId}`,
        suggestion: 'Check the batch ID or ensure the batch has completed',
      });
    }

    // Formato summary (default)
    res.json({
      success: batchResult.success,
      batchId,
      summary: {
        totalSymbols: batchResult.totalSymbols,
        successfulSymbols: batchResult.successfulSymbols,
        failedSymbols: batchResult.failedSymbols,
        cacheHits: batchResult.cacheHits,
        apiCalls: batchResult.apiCalls,
        executionTimeMs: batchResult.executionTimeMs,
        successRate:
          (
            (batchResult.successfulSymbols / batchResult.totalSymbols) *
            100
          ).toFixed(1) + '%',
      },
      symbolsSummary: {
        successful: Array.from(batchResult.results.keys()),
        failed: Array.from(batchResult.errors.keys()),
      },
      performance: {
        averageTimePerSymbol: Math.round(
          batchResult.executionTimeMs / batchResult.totalSymbols
        ),
        cacheHitRate:
          batchResult.cacheHits > 0
            ? (
                (batchResult.cacheHits /
                  (batchResult.cacheHits + batchResult.apiCalls)) *
                100
              ).toFixed(1) + '%'
            : '0%',
        apiEfficiency:
          batchResult.apiCalls +
          ' API calls for ' +
          batchResult.totalSymbols +
          ' symbols',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    console.error('Batch result error:', _error);
    res.status(500).json({
      error: 'Result Retrieval Error',
      message: 'Failed to get batch results',
    });
  }
});

/**
 * DELETE /api/v1/batch/cancel/:batchId
 * Cancella un batch in elaborazione
 */
router.delete('/cancel/:batchId', (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({
        error: 'Missing Batch ID',
        message: 'Batch ID is required',
      });
    }

    const cancelled = batchProcessor.cancelBatch(batchId);

    if (!cancelled) {
      return res.status(404).json({
        error: 'Batch Not Found or Not Cancellable',
        message: `Batch ${batchId} not found or already completed`,
        suggestion: 'Check batch status or ensure batch is still processing',
      });
    }

    res.json({
      success: true,
      message: `Batch ${batchId} cancelled successfully`,
      batchId,
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    console.error('Batch cancellation error:', _error);
    res.status(500).json({
      error: 'Cancellation Error',
      message: 'Failed to cancel batch',
    });
  }
});

/**
 * GET /api/v1/batch/active
 * Lista tutti i batch attivi
 */
router.get('/active', (req: Request, res: Response) => {
  try {
    const activeBatches = batchProcessor.getActiveBatches();
    const activeBatchArray = Array.from(activeBatches.values());

    res.json({
      success: true,
      activeBatches: activeBatchArray.length,
      batches: activeBatchArray.map(batch => ({
        batchId: batch.batchId,
        status: batch.status,
        progress: batch.progress,
        startTime: batch.startTime,
        errors: batch.errors.length,
      })),
      rateLimitStats: batchProcessor.getRateLimitStats(),
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    console.error('Active batches error:', _error);
    res.status(500).json({
      error: 'Active Batches Error',
      message: 'Failed to get active batches',
    });
  }
});

/**
 * POST /api/v1/batch/multi-timeframe
 * Elabora simboli multipli con timeframe multipli
 */
router.post('/multi-timeframe', async (req: Request, res: Response) => {
  try {
    const { symbols, timeframes, options = {} } = req.body;

    // Validazione
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        error: 'Invalid Symbols',
        message: 'symbols array is required',
      });
    }

    if (!timeframes || !Array.isArray(timeframes) || timeframes.length === 0) {
      return res.status(400).json({
        error: 'Invalid Timeframes',
        message: 'timeframes array is required',
      });
    }

    if (symbols.length > 20) {
      return res.status(400).json({
        error: 'Symbol Limit Exceeded',
        message: 'Maximum 20 symbols allowed for multi-timeframe processing',
      });
    }

    if (timeframes.length > 5) {
      return res.status(400).json({
        error: 'Timeframe Limit Exceeded',
        message: 'Maximum 5 timeframes allowed per request',
      });
    }

    // Valida timeframes
    const invalidTimeframes = timeframes.filter(
      (tf: unknown) =>
        !Object.values(AlphaVantageTimeframe).includes(
          tf as AlphaVantageTimeframe
        )
    );

    if (invalidTimeframes.length > 0) {
      return res.status(400).json({
        error: 'Invalid Timeframes',
        message: 'Some timeframes are not supported',
        invalidTimeframes,
        supportedTimeframes: Object.values(AlphaVantageTimeframe),
      });
    }

    // Avvia elaborazione
    const processingPromise = batchProcessor.processMultipleSymbols(
      symbols.map((s: string) => s.toUpperCase()),
      timeframes,
      options
    );

    // Genera ID per tracking
    const multiTimeframeId = `multi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Risposta immediata
    res.status(202).json({
      success: true,
      message: 'Multi-timeframe processing started',
      processingId: multiTimeframeId,
      request: {
        symbols: symbols.length,
        timeframes: timeframes.length,
        totalCombinations: symbols.length * timeframes.length,
        estimatedTimeMinutes: Math.ceil(
          (symbols.length * timeframes.length * 12) / 60
        ),
      },
      timestamp: new Date().toISOString(),
    });

    // Gestisci risultato asincrono
    processingPromise
      .then(results => {
        console.log(
          `✅ Multi-timeframe processing ${multiTimeframeId} completed`
        );
        // Qui potresti salvare i risultati in un database o cache per recupero successivo
      })
      .catch(error => {
        console.error(
          `❌ Multi-timeframe processing ${multiTimeframeId} failed:`,
          error
        );
      });
  } catch (_error) {
    console.error('Multi-timeframe processing error:', _error);
    res.status(500).json({
      error: 'Multi-Timeframe Processing Error',
      message: 'Failed to start multi-timeframe processing',
    });
  }
});

/**
 * GET /api/v1/batch/stats
 * Statistiche generali del batch processor
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const rateLimitStats = batchProcessor.getRateLimitStats();
    const activeBatches = batchProcessor.getActiveBatches();

    res.json({
      success: true,
      rateLimiting: rateLimitStats,
      batches: {
        active: activeBatches.size,
        maxConcurrent: 3,
      },
      quotas: {
        daily: {
          used: rateLimitStats.totalRequestsMade,
          remaining: rateLimitStats.dailyQuotaRemaining,
          total: 25,
        },
        perMinute: {
          used: rateLimitStats.requestsInLastMinute,
          remaining: rateLimitStats.minuteQuotaRemaining,
          total: 5,
        },
      },
      performance: {
        cacheHitRate: rateLimitStats.cacheHitRate.toFixed(1) + '%',
        averageResponseTime:
          rateLimitStats.averageResponseTime.toFixed(0) + 'ms',
        queueLength: rateLimitStats.queueLength,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    console.error('Batch stats error:', _error);
    res.status(500).json({
      error: 'Stats Error',
      message: 'Failed to get batch processing statistics',
    });
  }
});

/**
 * DELETE /api/v1/batch/cancel-all
 * Cancella tutti i batch attivi
 */
router.delete('/cancel-all', (req: Request, res: Response) => {
  try {
    const cancelledCount = batchProcessor.cancelAllBatches();

    res.json({
      success: true,
      message: `Cancelled ${cancelledCount} active batches`,
      cancelledBatches: cancelledCount,
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    console.error('Cancel all batches error:', _error);
    res.status(500).json({
      error: 'Cancel All Error',
      message: 'Failed to cancel all batches',
    });
  }
});

export { router as batchRoutes };
