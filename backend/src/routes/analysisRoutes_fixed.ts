import express, { Request, Response } from 'express';
import { sanitizationMiddleware } from '../middleware/sanitizationMiddleware';
import {
  AnalysisApiResponse,
  performAnalysis,
} from '../services/analysisService';

const router = express.Router();

// Applica il middleware di sanitizzazione SOLO a questa route
router.use(
  sanitizationMiddleware({
    enableBodySanitization: true,
    enableParamsSanitization: true,
    enableQuerySanitization: false,
    logSuspiciousActivity: true,
    blockOnDangerousPatterns: false, // Disabilito temporaneamente il blocco per frequency
    maxRequestSize: 512 * 1024, // 512KB
    trustedIPs: ['127.0.0.1', '::1', 'localhost'],
  })
);

router.post('/', (req: Request, res: Response) => {
  // Usa il body sanitizzato se presente
  const body = (req as any).sanitizedBody || req.body;
  const { tickers, startDate, endDate, frequency } = body;

  if (
    !tickers ||
    !Array.isArray(tickers) ||
    tickers.length === 0 ||
    !startDate ||
    !endDate ||
    !frequency
  ) {
    res.status(400).json({
      error:
        'Parametri mancanti o non validi. Sono richiesti tickers, startDate, endDate e frequency.',
    });
    return;
  }

  performAnalysis({ tickers, startDate, endDate, frequency })
    .then((results: AnalysisApiResponse) => res.json(results))
    .catch((error: Error) => {
      console.error('Errore durante l_esecuzione dell_analisi:', error);
      res.status(500).json({
        error: 'Si è verificato un errore interno durante l_analisi.',
        details: error.message,
      });
    });
});

export { router as analysisRoutes };
