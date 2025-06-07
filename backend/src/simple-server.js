/**
 * STUDENT ANALYST - Backend Server (Simple Version)
 * =================================================
 * 
 * Server Express.js semplificato per Railway deployment
 * Versione minima ma funzionale senza TypeScript
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.'
  }
});

// Apply rate limiting to all requests
app.use(limiter);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://student-analyst.vercel.app',
    process.env.FRONTEND_URL,
    process.env.PRODUCTION_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Student Analyst Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    features: ['CORS enabled', 'Rate limiting active', 'Security headers']
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Hello World from Student Analyst Backend! 🚀',
    version: '1.0.0',
    description: 'Professional Financial Analysis API - Simple Version',
    status: 'running',
    deployment: 'Railway',
    endpoints: {
      health: '/health',
      test: '/api/test',
      status: '/api/status'
    },
    features: [
      'CORS Configuration',
      'Rate Limiting',
      'Security Headers',
      'Request Logging',
      'Health Monitoring'
    ]
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working correctly',
    timestamp: new Date().toISOString(),
    requestHeaders: req.headers,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    uptime: `${Math.floor(uptime / 60)} minutes ${Math.floor(uptime % 60)} seconds`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoint for financial data simulation
app.post('/api/validate/ticker', (req, res) => {
  const { ticker } = req.body;
  
  if (!ticker) {
    return res.status(400).json({
      success: false,
      error: 'Ticker symbol is required'
    });
  }
  
  // Simple ticker validation
  const cleanTicker = ticker.toString().toUpperCase().trim();
  const isValid = /^[A-Z]{1,5}$/.test(cleanTicker);
  
  res.json({
    success: true,
    ticker: cleanTicker,
    valid: isValid,
    message: isValid ? 'Ticker is valid' : 'Invalid ticker format'
  });
});

// Catch-all for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/test',
      'GET /api/status',
      'POST /api/validate/ticker'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on our end',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Student Analyst Backend (Simple) running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Rate limiting, CORS, Helmet active`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Deployment: Railway ready`);
});

module.exports = app; 