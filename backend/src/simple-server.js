/**
 * STUDENT ANALYST - Backend Server (Ultra Simple Version)
 * ======================================================
 * 
 * Server Express.js ultra-semplificato per Render deployment
 * Versione minimale senza middleware problematici
 */

const express = require('express');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 10000;

// Trust proxy for deployment
app.set('trust proxy', 1);

// Basic CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Hello World from Student Analyst Backend! 🚀',
    version: '1.0.0',
    description: 'Professional Financial Analysis API - Ultra Simple Version',
    status: 'running',
    deployment: 'Render',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      test: '/api/test',
      status: '/api/status'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Student Analyst Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    server: 'Ultra Simple Express'
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
    timestamp: new Date().toISOString(),
    node_version: process.version
  });
});

// Basic API endpoint for ticker validation
app.post('/api/validate/ticker', (req, res) => {
  try {
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
      message: isValid ? 'Ticker is valid' : 'Invalid ticker format',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Simple 404 handler - NO WILDCARDS
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/test',
      'GET /api/status',
      'POST /api/validate/ticker'
    ],
    timestamp: new Date().toISOString()
  });
});

// Simple error handler
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
  console.log(`🚀 Student Analyst Backend (Ultra Simple) running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Deployment: Render ready`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Ultra simple version - no problematic middleware`);
});

module.exports = app; 