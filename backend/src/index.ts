/**
 * STUDENT ANALYST - Backend Server
 * ===============================
 * 
 * Server Express.js con sicurezza avanzata, rate limiting, e API proxy
 * per l'analisi finanziaria professionale
 */

import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy settings for accurate IP detection
app.set('trust proxy', 1);

// Rate limiting configuration
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // 100 richieste per finestra
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the maximum number of requests allowed.',
    details: {
      limit: 100,
      window: '15 minutes',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`🚨 Rate limit exceeded for IP: ${req.ip} - ${req.method} ${req.originalUrl}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exceeded the maximum number of requests allowed.',
      details: {
        limit: 100,
        window: '15 minutes',
        retryAfter: '15 minutes',
        currentTime: new Date().toISOString()
      }
    });
  },
  skip: (req: Request) => req.path === '/health'
});

// Strict rate limiter for API endpoints
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: 'API Rate Limit Exceeded',
    message: 'You have made too many API requests. Please wait before trying again.',
    details: {
      limit: 50,
      window: '15 minutes'
    }
  }
});

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://www.alphavantage.co",
        "https://query1.finance.yahoo.com"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  hidePoweredBy: true,
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_URL
    ].filter(Boolean);

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS blocked request from origin: ${origin}`);
      callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400
}));

// Apply rate limiting
app.use(rateLimiter);

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global input sanitization middleware
import { sanitizationMiddleware } from './middleware/sanitizationMiddleware';
app.use(sanitizationMiddleware({
  enableBodySanitization: true,
  enableParamsSanitization: true,
  enableQuerySanitization: true,
  logSuspiciousActivity: true,
  blockOnDangerousPatterns: true,
  maxRequestSize: 1024 * 1024, // 1MB
  trustedIPs: ['127.0.0.1', '::1', 'localhost']
}));

// API Routes with strict rate limiting
import { apiRoutes } from './routes/apiRoutes';
import { errorHandlingRoutes } from './routes/errorHandlingRoutes';
app.use('/api/v1', strictRateLimiter, apiRoutes);
app.use('/api/v1/errors', errorHandlingRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Student Analyst Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    security: {
      rateLimiting: 'active',
      cors: 'configured',
      helmet: 'active'
    },
    errorHandling: {
      status: 'active',
      endpoints: [
        '/api/v1/errors/health',
        '/api/v1/errors/statistics',
        '/api/v1/errors/classify'
      ]
    }
  });
});

// Hello World endpoint for testing
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello World from Student Analyst Backend! 🚀',
    version: '1.0.0',
    description: 'Professional Financial Analysis API with Advanced Error Handling',
    security: {
      cors: 'restrictive policy active',
      headers: 'security headers configured'
    },
    endpoints: {
      health: '/health',
      errorHandling: '/api/v1/errors/health',
      errorStats: '/api/v1/errors/statistics',
      errorClassify: '/api/v1/errors/classify',
      batch: '/api/v1/batch',
      batchProcess: '/api/v1/batch/process',
      batchStatus: '/api/v1/batch/status/:batchId',
      batchResult: '/api/v1/batch/result/:batchId'
    },
    features: [
      'Intelligent Error Handling',
      'User-Friendly Error Messages',
      'Auto-Recovery Strategies',
      'Circuit Breaker Pattern',
      'Network Resilience',
      'Batch Processing',
      'Progress Tracking',
      'Queue Management',
      'Rate Limiting (5 req/min)'
    ]
  });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: any) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/v1/errors/health',
      'GET /api/v1/errors/statistics',
      'POST /api/v1/errors/classify'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Student Analyst Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Rate limiting, CORS, Helmet active`);
  console.log(`🛡️  Error Handling: Advanced system active`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Error endpoints: http://localhost:${PORT}/api/v1/errors/health`);
});

export default app; 