import express, { Request, Response } from 'express';
import {
  AnalysisApiResponse,
  performAnalysis,
} from '../services/analysisService';

const router = express.Router();

router.post('/', (req: Request, res: Response) => {
  const { tickers, startDate, endDate, frequency } = req.body;

  if (
    !tickers ||
    !Array.isArray(tickers) ||
    tickers.length === 0 ||
    !startDate ||
    !endDate ||
    !frequency
  ) {
    return res.status(400).json({
      error:
        'Parametri mancanti o non validi. Sono richiesti tickers, startDate, endDate e frequency.',
    });
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
