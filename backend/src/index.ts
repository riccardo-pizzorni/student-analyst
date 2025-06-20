/**
 * STUDENT ANALYST - Backend Server
 * ===============================
 *
 * Server Express.js con sicurezza avanzata, rate limiting, e API proxy
 * per l'analisi finanziaria professionale
 */

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { sanitizationMiddleware } from './middleware/sanitizationMiddleware';
import analysisRoutes from './routes/analysisRoutes';
import apiRoutes from './routes/apiRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware essenziali
app.use(cors()); // Abilita CORS per le richieste dal frontend
app.use(helmet()); // Aggiunge header di sicurezza
app.use(morgan('dev'));
app.use(express.json()); // Per il parsing del body JSON delle richieste

// Usa il middleware di sanitizzazione
app.use(sanitizationMiddleware); // CORREZIONE: Passa la funzione direttamente

// Rotte API
app.use('/api', apiRoutes);
app.use('/api/analysis', analysisRoutes);

// Semplice gestore di errori globale
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('ERRORE GLOBALE:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
);

// Semplice gestore 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`✅ Server minimale avviato e in ascolto sulla porta ${PORT}`);
  console.log(
    `🚀 Endpoint di analisi disponibile a POST http://localhost:${PORT}/api/analysis`
  );
});

export default app;
