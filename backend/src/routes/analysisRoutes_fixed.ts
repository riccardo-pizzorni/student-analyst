import { Request, Response, Router } from 'express';
import { performAnalysis } from '../services/analysisService';

export const analysisRoutes = Router();

// GET endpoint per test
analysisRoutes.get('/', (req, res) => {
  res.json({
    message: 'Analysis API is active',
    endpoints: {
      'POST /': 'Perform financial analysis',
      'GET /': 'API status',
    },
  });
});

// POST endpoint per l'analisi finanziaria
analysisRoutes.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📊 Richiesta analisi ricevuta:', req.body);

    // Validazione parametri
    const { tickers, startDate, endDate, frequency } = req.body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({
        error: 'Parametro tickers richiesto (array di stringhe)',
        code: 'MISSING_TICKERS',
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Parametri startDate e endDate richiesti',
        code: 'MISSING_DATES',
      });
    }

    if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        error: 'Parametro frequency richiesto (daily, weekly, monthly)',
        code: 'INVALID_FREQUENCY',
      });
    }

    // Sanitizzazione tickers
    const sanitizedTickers = tickers
      .map((ticker: string) => ticker.toString().toUpperCase().trim())
      .filter((ticker: string) => ticker.length > 0);

    if (sanitizedTickers.length === 0) {
      return res.status(400).json({
        error: 'Nessun ticker valido fornito',
        code: 'NO_VALID_TICKERS',
      });
    }

    console.log('✅ Parametri validati:', {
      tickers: sanitizedTickers,
      startDate,
      endDate,
      frequency,
    });

    // Esegui analisi
    const result = await performAnalysis({
      tickers: sanitizedTickers,
      startDate,
      endDate,
      frequency,
    });

    console.log('🎉 Analisi completata con successo');

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Errore durante analisi:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Errore sconosciuto';

    res.status(500).json({
      success: false,
      error: errorMessage,
      code: 'ANALYSIS_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});
