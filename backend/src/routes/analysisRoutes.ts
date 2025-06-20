import express from 'express';
import * as analysisService from '../services/analysisService';

const router = express.Router();

/**
 * Endpoint per eseguire un'analisi finanziaria completa.
 * Riceve i parametri dell'analisi e restituisce un set di dati completo.
 */
router.post('/', (req, res) => {
  const { tickers, startDate, endDate, frequency } = req.body;

  // Validazione di base dell'input
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

  analysisService
    .performAnalysis({ tickers, startDate, endDate, frequency })
    .then(results => res.json(results))
    .catch(error => {
      console.error('Errore durante l_esecuzione dell_analisi:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Errore sconosciuto';
      res.status(500).json({
        error: 'Si è verificato un errore interno durante l_analisi.',
        details: errorMessage,
      });
    });
});

export { router as analysisRoutes };
