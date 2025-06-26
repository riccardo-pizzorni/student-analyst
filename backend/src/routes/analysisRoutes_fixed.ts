import express, { Request, Response } from 'express';
import {
  AnalysisApiResponse,
  performAnalysis,
} from '../services/analysisService';

const router = express.Router();

// Endpoint principale per l'analisi storica
router.post('/', async (req: Request, res: Response) => {
  console.log(
    '🔍 Analysis endpoint chiamato con body:',
    JSON.stringify(req.body, null, 2)
  );

  const { tickers, startDate, endDate, frequency } = req.body;

  // Validazione parametri
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

  // Validazione frequenza
  const validFrequencies = ['daily', 'weekly', 'monthly'];
  if (!validFrequencies.includes(frequency)) {
    res.status(400).json({
      error: 'Frequenza non valida. Valori ammessi: daily, weekly, monthly.',
    });
    return;
  }

  // Validazione date
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({
      error: 'Date non valide. Usa il formato YYYY-MM-DD.',
    });
    return;
  }

  if (start >= end) {
    res.status(400).json({
      error: 'La data di inizio deve essere precedente alla data di fine.',
    });
    return;
  }

  console.log('✅ Parametri validi, eseguo analisi storica...');

  try {
    const results: AnalysisApiResponse = await performAnalysis({
      tickers,
      startDate,
      endDate,
      frequency,
    });

    console.log('✅ Analisi storica completata con successo');
    res.json(results);
  } catch (error) {
    console.error(
      "❌ Errore durante l'esecuzione dell'analisi storica:",
      error
    );
    res.status(500).json({
      error: "Si è verificato un errore interno durante l'analisi storica.",
      details: error instanceof Error ? error.message : 'Errore sconosciuto',
    });
  }
});

// Endpoint per test rapido
router.get('/test', (req: Request, res: Response) => {
  res.json({
    message: 'Analisi storica endpoint funzionante',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// Endpoint per health check specifico
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'historical-analysis',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

export { router as analysisRoutes };
