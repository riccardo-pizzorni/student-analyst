/**
 * STUDENT ANALYST - CORS Proxy Server
 * Professional proxy server for Yahoo Finance API with caching and error handling
 */

import axios from 'axios';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import NodeCache from 'node-cache';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize cache with intelligent TTL settings
const cache = new NodeCache({
  stdTTL: 300, // Default 5 minutes
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Better performance
  deleteOnExpire: true,
  maxKeys: 10000, // Limit memory usage
});

// Cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
  totalRequests: 0,
};

// Request statistics
let requestStats = {
  total: 0,
  successful: 0,
  failed: 0,
  cached: 0,
};

/**
 * Middleware Configuration
 */

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Allow proxy functionality
  })
);

// Compression for better performance
app.use(compression());

// Logging
app.use(
  morgan('combined', {
    skip: (req, res) => req.path === '/health', // Skip health check logs
  })
);

// CORS configuration for frontend access
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // Cache preflight for 24 hours
  })
);

// Rate limiting to protect Yahoo Finance API
const yahooRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.path === '/health', // Skip rate limiting for health checks
});

app.use('/api/yahoo', yahooRateLimit);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

/**
 * Cache key generation
 */
function generateCacheKey(url, params) {
  const sortedParams = Object.keys(params || {})
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return `${url}?${sortedParams}`;
}

/**
 * Get appropriate TTL based on data type
 */
function getTTL(url, params) {
  const interval = params?.interval || params?.period;

  // Intraday data: 1 minute cache
  if (
    interval === '1m' ||
    interval === '5m' ||
    interval === '15m' ||
    interval === '30m'
  ) {
    return 60; // 1 minute
  }

  // Daily data: 1 hour cache
  if (interval === '1d' || interval === 'daily') {
    return 3600; // 1 hour
  }

  // Weekly/Monthly data: 4 hours cache
  if (
    interval === '1wk' ||
    interval === '1mo' ||
    interval === 'weekly' ||
    interval === 'monthly'
  ) {
    return 14400; // 4 hours
  }

  // Default: 5 minutes
  return 300;
}

/**
 * Yahoo Finance proxy endpoint
 */
app.get('/api/yahoo/*', async (req, res) => {
  const startTime = Date.now();
  requestStats.total++;

  try {
    // Extract the Yahoo Finance API path
    const yahooPart = req.path.replace('/api/yahoo/', '');
    const yahooUrl = `https://query1.finance.yahoo.com/${yahooPart}`;

    // Generate cache key
    const cacheKey = generateCacheKey(yahooUrl, req.query);

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      cacheStats.hits++;
      requestStats.cached++;

      console.log(
        `✅ Cache HIT for ${yahooPart} (${Date.now() - startTime}ms)`
      );

      return res.json({
        ...cached,
        cached: true,
        cacheHit: true,
        responseTime: Date.now() - startTime,
      });
    }

    cacheStats.misses++;
    console.log(
      `🔍 Cache MISS for ${yahooPart}, fetching from Yahoo Finance...`
    );

    // Make request to Yahoo Finance with proper headers
    const response = await axios.get(yahooUrl, {
      params: req.query,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: 'https://finance.yahoo.com/',
        Origin: 'https://finance.yahoo.com',
        'sec-ch-ua':
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
      timeout: 30000, // 30 second timeout
      maxRedirects: 5,
      validateStatus: status => status < 500, // Accept 4xx as valid responses
    });

    const responseTime = Date.now() - startTime;
    requestStats.successful++;

    // Prepare response data
    const responseData = {
      data: response.data,
      status: response.status,
      cached: false,
      responseTime,
      timestamp: new Date().toISOString(),
      source: 'yahoo_finance',
    };

    // Cache the response with appropriate TTL
    const ttl = getTTL(yahooUrl, req.query);
    cache.set(cacheKey, responseData, ttl);

    console.log(
      `✅ Yahoo Finance SUCCESS for ${yahooPart} (${responseTime}ms) - Cached for ${ttl}s`
    );

    // Return response
    res.json(responseData);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    requestStats.failed++;
    cacheStats.errors++;

    console.error(`❌ Yahoo Finance ERROR for ${req.path}:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseTime,
    });

    // Forward error to frontend with structured format
    const errorResponse = {
      error: true,
      message: error.message,
      status: error.response?.status || 500,
      statusText: error.response?.statusText || 'Internal Server Error',
      responseTime,
      timestamp: new Date().toISOString(),
      source: 'proxy_server',
      originalUrl: req.originalUrl,
    };

    // Add specific error details for common issues
    if (error.code === 'ENOTFOUND') {
      errorResponse.type = 'NETWORK_ERROR';
      errorResponse.userMessage =
        'Unable to connect to Yahoo Finance. Please check your internet connection.';
    } else if (error.response?.status === 429) {
      errorResponse.type = 'RATE_LIMIT_EXCEEDED';
      errorResponse.userMessage =
        'Too many requests to Yahoo Finance. Please wait a moment and try again.';
    } else if (error.response?.status === 404) {
      errorResponse.type = 'INVALID_SYMBOL';
      errorResponse.userMessage =
        'The requested financial symbol was not found.';
    } else if (error.code === 'ECONNABORTED') {
      errorResponse.type = 'TIMEOUT_ERROR';
      errorResponse.userMessage =
        'Request timed out. The data source may be temporarily unavailable.';
    } else {
      errorResponse.type = 'UNKNOWN_ERROR';
      errorResponse.userMessage =
        'An unexpected error occurred while fetching financial data.';
    }

    res.status(error.response?.status || 500).json(errorResponse);
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
    },
    cache: {
      keys: cache.keys().length,
      stats: cacheStats,
    },
    requests: requestStats,
    performance: {
      cacheHitRatio:
        requestStats.total > 0
          ? Math.round(
              (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
            )
          : 0,
      successRate:
        requestStats.total > 0
          ? Math.round((requestStats.successful / requestStats.total) * 100)
          : 0,
    },
  });
});

/**
 * Cache management endpoints
 */
app.post('/admin/cache/clear', (req, res) => {
  const keysBefore = cache.keys().length;
  cache.flushAll();

  // Reset cache stats
  cacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalRequests: 0,
  };

  res.json({
    message: 'Cache cleared successfully',
    keysCleared: keysBefore,
    timestamp: new Date().toISOString(),
  });
});

app.get('/admin/cache/stats', (req, res) => {
  res.json({
    cache: {
      keys: cache.keys().length,
      stats: cacheStats,
      hitRatio:
        cacheStats.hits + cacheStats.misses > 0
          ? Math.round(
              (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
            )
          : 0,
    },
    requests: requestStats,
    timestamp: new Date().toISOString(),
  });
});

/**
 * 404 handler
 */
app.use('*', (req, res) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health - Server health check',
      'GET /api/yahoo/* - Yahoo Finance API proxy',
      'POST /admin/cache/clear - Clear cache',
      'GET /admin/cache/stats - Cache statistics',
    ],
  });
});

/**
 * Global error handler
 */
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled Error:', error);

  res.status(500).json({
    error: true,
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown',
  });
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Starting graceful shutdown...');

  // Clear cache
  cache.flushAll();

  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Starting graceful shutdown...');

  // Clear cache
  cache.flushAll();

  process.exit(0);
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log('🚀 Student Analyst CORS Proxy Server started successfully!');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Yahoo Finance proxy: http://localhost:${PORT}/api/yahoo/*`);
  console.log('✅ CORS enabled, caching active, rate limiting configured');
});

export default app;
