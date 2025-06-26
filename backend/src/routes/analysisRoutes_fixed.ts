import express, { Request, Response } from 'express';
import {
  AnalysisApiResponse,
  performAnalysis,
} from '../services/analysisService';

const router = express.Router();

// RIMUOVO TUTTA LA SANITIZZAZIONE - USA DIRETTAMENTE REQ.BODY
router.post('/', (req: Request, res: Response) => {
  console.log(
    '🔍 Analysis endpoint chiamato con body:',
    JSON.stringify(req.body, null, 2)
  );

  const { tickers, startDate, endDate, frequency } = req.body;

  if (
    !tickers ||
    !Array.isArray(tickers) ||
    tickers.length === 0 ||
    !startDate ||
    !endDate ||
    !frequency
  ) {
    console.log('❌ Parametri mancanti:', {
      tickers,
      startDate,
      endDate,
      frequency,
    });
    res.status(400).json({
      error:
        'Parametri mancanti o non validi. Sono richiesti tickers, startDate, endDate e frequency.',
    });
    return;
  }

  console.log('✅ Parametri validi, eseguo analisi...');

  performAnalysis({ tickers, startDate, endDate, frequency })
    .then((results: AnalysisApiResponse) => {
      console.log('✅ Analisi completata con successo');
      res.json(results);
    })
    .catch((error: Error) => {
      console.error('❌ Errore durante l_esecuzione dell_analisi:', error);
      res.status(500).json({
        error: 'Si è verificato un errore interno durante l_analisi.',
        details: error.message,
      });
    });
});

export { router as analysisRoutes };
