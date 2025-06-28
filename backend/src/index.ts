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
import { analysisRoutes } from './routes/analysisRoutes_fixed';
import { apiRoutes } from './routes/apiRoutes';
import healthRouter from './routes/health';

const app = express();
const PORT = process.env.PORT || 10000;

// CORS sicuro: consenti solo le origin Vercel (prod e preview)
const allowedOrigins = [
  'https://student-analyst.vercel.app',
  'https://student-analyst-git-main.vercel.app',
  'https://student-analyst-git-feature.vercel.app',
  'https://student-analyst-foxy8lbm8-riccar-pizzornis-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];
const corsOptions = {
  origin: (origin, callback) => {
    // Consenti richieste senza origin (es. curl, health check)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Gestione preflight OPTIONS globale (per sicurezza)
app.options('*', cors(corsOptions));

// Middleware essenziali
app.use(helmet()); // Aggiunge header di sicurezza
app.use(morgan('dev'));
app.use(express.json()); // Per il parsing del body JSON delle richieste

// Health check endpoint
app.use('/', healthRouter);

// Rotte API - ANALYSIS PRIMA DI API ROUTES PER EVITARE CONFLITTI
app.use('/api/analysis', analysisRoutes);
app.use('/api', apiRoutes);

// Semplice gestore di errori globale
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('ERRORE GLOBALE:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
);

// Semplice gestore 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`✅ Server minimale avviato e in ascolto sulla porta ${PORT}`);
  console.log(
    `🚀 Endpoint di analisi disponibile a POST http://localhost:${PORT}/api/analysis`
  );
  console.log(
    `🏥 Health check disponibile a GET http://localhost:${PORT}/health`
  );
});

export default app;
