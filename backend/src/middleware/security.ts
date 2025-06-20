/**
 * STUDENT ANALYST - Security Middleware
 * ===================================
 *
 * Sistema di sicurezza completo per il backend che implementa:
 * - Rate limiting per prevenire abusi
 * - CORS restrittivo per controllo accessi
 * - Security headers con helmet
 * - Logging e monitoraggio degli accessi
 */

import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Configurazione Rate Limiting
 * 100 richieste per 15 minuti per IP
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti in millisecondi
  max: 100, // Limite di 100 richieste per finestra
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the maximum number of requests allowed.',
    details: {
      limit: 100,
      windowMs: 15 * 60 * 1000,
      retryAfter: '15 minutes',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true, // Ritorna info sui limiti negli headers `RateLimit-*`
  legacyHeaders: false, // Disabilita gli headers `X-RateLimit-*`
  handler: (req: Request, res: Response) => {
    console.warn(
      `🚨 Rate limit exceeded for IP: ${req.ip} - ${req.method} ${req.originalUrl}`
    );
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exceeded the maximum number of requests allowed.',
      details: {
        limit: 100,
        window: '15 minutes',
        retryAfter: '15 minutes',
        currentTime: new Date().toISOString(),
      },
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting per health check endpoint
    return req.path === '/health';
  },
});

/**
 * Rate Limiter più restrittivo per endpoint API sensibili
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 50, // Solo 50 richieste per endpoint sensibili
  message: {
    error: 'API Rate Limit Exceeded',
    message:
      'You have made too many API requests. Please wait before trying again.',
    details: {
      limit: 50,
      windowMs: 15 * 60 * 1000,
      retryAfter: '15 minutes',
    },
  },
  handler: (req: Request, res: Response) => {
    console.warn(
      `🚨 Strict rate limit exceeded for IP: ${req.ip} - ${req.method} ${req.originalUrl}`
    );
    res.status(429).json({
      error: 'API Rate Limit Exceeded',
      message:
        'You have made too many API requests. Please wait before trying again.',
      details: {
        limit: 50,
        window: '15 minutes',
        retryAfter: '15 minutes',
        endpoint: req.originalUrl,
        currentTime: new Date().toISOString(),
      },
    });
  },
});

/**
 * Configurazione CORS restrittiva
 */
export const corsConfig = cors({
  origin: function (origin, callback) {
    // Lista di origini consentite
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // Possibile alternativa
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_URL,
    ].filter(Boolean); // Rimuove valori undefined/null

    // Permetti richieste senza origin (es. da Postman, app mobile)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS blocked request from origin: ${origin}`);
      callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    }
  },
  credentials: true, // Permetti cookies e headers di autenticazione
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400, // Cache preflight requests per 24 ore
});

/**
 * Configurazione Helmet per security headers
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Necessario per PyScript
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'",
        'https://www.alphavantage.co', // Alpha Vantage API
        'https://query1.finance.yahoo.com', // Yahoo Finance API
        'https://api.financialdata.com', // Placeholder per future API
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", 'blob:'], // Per PyScript workers
    },
  },

  // Cross Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disabilitato per compatibilità con PyScript

  // Altre configurazioni di sicurezza
  hsts: {
    maxAge: 31536000, // 1 anno
    includeSubDomains: true,
    preload: true,
  },

  // Nascondere informazioni sul server
  hidePoweredBy: true,

  // Prevenire MIME sniffing
  noSniff: true,

  // Prevenire clickjacking
  frameguard: { action: 'deny' },

  // XSS Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: { policy: 'same-origin' },
});

/**
 * Middleware per logging degli accessi di sicurezza
 */
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Log richiesta in ingresso
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `🔍 [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`
    );
  }

  // Override del res.end per loggare la risposta
  const originalEnd = res.end;
  res.end = function (...args: unknown[]) {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';

    console.log(
      `${statusColor} [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ` +
        `${res.statusCode} - ${duration}ms - IP: ${req.ip}`
    );

    // Log di sicurezza per richieste sospette
    if (res.statusCode === 429) {
      console.warn(`⚠️  Rate limit hit: ${req.ip} - ${req.originalUrl}`);
    }

    if (res.statusCode >= 400) {
      console.warn(
        `⚠️  Error response: ${res.statusCode} for ${req.originalUrl} from ${req.ip}`
      );
    }

    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Middleware per validazione generale delle richieste
 */
export const requestValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Controlla dimensione del payload
  const contentLength = req.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    // 10MB limit
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request payload exceeds maximum size limit',
      maxSize: '10MB',
    });
  }

  // Controlla User-Agent sospetti
  const userAgent = req.get('user-agent');
  if (
    userAgent &&
    (userAgent.includes('curl') || userAgent.includes('bot')) &&
    process.env.NODE_ENV === 'production'
  ) {
    console.warn(`🤖 Potential bot detected: ${userAgent} from ${req.ip}`);
  }

  next();
};

/**
 * Configurazione completa di sicurezza
 * Da applicare nell'ordine corretto
 */
export const securityMiddleware = [
  securityLogger,
  helmetConfig,
  corsConfig,
  requestValidator,
  rateLimiter,
];

/**
 * Middleware per endpoint API sensibili
 */
export const apiSecurityMiddleware = [strictRateLimiter];
