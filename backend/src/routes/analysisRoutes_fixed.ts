import express, { Request, Response } from 'express';
import {
  AnalysisApiResponse,
  performAnalysis,
} from '../services/analysisService';

const router = express.Router();

// Whitelist di campi sicuri per l'analisi finanziaria
const ALLOWED_ANALYSIS_FIELDS = [
  'tickers',
  'startDate',
  'endDate',
  'frequency',
];

// Middleware personalizzato per l'analisi che bypassa la sanitizzazione aggressiva
router.use((req: Request, res: Response, next: any) => {
  if (req.method === 'POST' && req.body) {
    // Sanitizzazione personalizzata per campi di analisi
    const sanitizedBody: any = {};
    const errors: string[] = [];

    for (const [key, value] of Object.entries(req.body)) {
      // Controlla se il campo è nella whitelist
      if (ALLOWED_ANALYSIS_FIELDS.includes(key)) {
        // Sanitizzazione base per valori stringa
        if (typeof value === 'string') {
          // Rimuovi solo caratteri HTML pericolosi, non bloccare il campo
          sanitizedBody[key] = value
            .replace(/[<>]/g, '') // Rimuovi solo < e >
            .trim();
        } else {
          sanitizedBody[key] = value;
        }
      } else {
        errors.push(`Field '${key}' not allowed in analysis request`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Invalid Request Body',
        message: 'Request contains disallowed fields',
        details: errors,
      });
    }

    // Sostituisci il body con quello sanitizzato
    (req as any).sanitizedBody = sanitizedBody;
  }

  next();
});

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
