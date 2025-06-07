# 🌐 STUDENT ANALYST - CORS Proxy System

## Overview

Professional CORS proxy server enabling secure and efficient access to Yahoo Finance API from the browser, with intelligent caching, error handling, and performance monitoring.

## 🚀 Quick Start

### Windows Users
```bash
# Double-click or run:
start-server.bat
```

### Linux/Mac Users
```bash
# Make executable (first time only):
chmod +x start-server.sh

# Run:
./start-server.sh
```

### Manual Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start server
npm start
```

## 📋 System Architecture

### Core Components

#### 1. **Express.js Proxy Server** (`server/server.js`)
- **CORS Handler**: Enables cross-origin requests from frontend
- **Request Forwarding**: Transparent proxy to Yahoo Finance API
- **Response Caching**: Intelligent TTL-based caching system
- **Error Handling**: Structured error responses with user-friendly messages
- **Health Monitoring**: Real-time performance metrics and uptime tracking

#### 2. **Frontend Service** (`src/services/ProxyService.ts`)
- **Type-Safe API**: Full TypeScript interfaces for responses
- **Connection Management**: Automatic timeout and retry logic
- **Health Monitoring**: Server status checking and diagnostics
- **Cache Management**: Client-side cache statistics and clearing

#### 3. **Interactive Demo** (`src/components/ProxyDemo.tsx`)
- **Real-Time Monitoring**: Live server status and performance metrics
- **API Testing**: Comprehensive test suite for all endpoints
- **Cache Analytics**: Visual cache hit ratios and statistics
- **Error Diagnostics**: Detailed error reporting and troubleshooting

## 🔧 Configuration

### Environment Variables

Create `server/.env` file:
```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Development Settings
NODE_ENV=development
DEBUG=true
```

### Cache Configuration

```javascript
// Automatic TTL based on data type
const cache = new NodeCache({
  stdTTL: 300,        // Default: 5 minutes
  checkperiod: 60,    // Cleanup every minute
  maxKeys: 10000      // Memory limit
});

// Dynamic TTL by interval:
// - Intraday (1m, 5m, 15m, 30m): 1 minute
// - Daily data: 1 hour
// - Weekly/Monthly: 4 hours
```

### Rate Limiting

```javascript
// Protect Yahoo Finance API
const yahooRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute window
  max: 100,             // 100 requests per minute per IP
  standardHeaders: true
});
```

## 🌐 API Endpoints

### Main Proxy Endpoint
```
GET /api/yahoo/*
```

**Examples:**
```bash
# Single Quote
GET /api/yahoo/v8/finance/chart/AAPL?interval=1d&range=1d

# Historical Data
GET /api/yahoo/v8/finance/chart/AAPL?interval=1d&range=1y

# Multiple Quotes
GET /api/yahoo/v7/finance/quote?symbols=AAPL,GOOGL,MSFT

# Symbol Search
GET /api/yahoo/v1/finance/search?q=Apple

# Market Summary
GET /api/yahoo/v6/finance/quote/marketSummary
```

### Health & Monitoring
```bash
# Server Health Check
GET /health

# Cache Statistics
GET /admin/cache/stats

# Clear Cache
POST /admin/cache/clear
```

## 📊 Response Format

### Successful Response
```typescript
interface ProxyResponse<T> {
  data: T;                    // Yahoo Finance data
  status: number;             // HTTP status code
  cached: boolean;            // Whether response was cached
  responseTime: number;       // Response time in milliseconds
  timestamp: string;          // ISO timestamp
  source: 'yahoo_finance';    // Data source identifier
}
```

### Error Response
```typescript
interface ProxyError {
  error: true;
  message: string;            // Technical error message
  userMessage: string;        // User-friendly message
  status: number;             // HTTP status code
  type: 'NETWORK_ERROR' |     // Error type classification
        'RATE_LIMIT_EXCEEDED' |
        'INVALID_SYMBOL' |
        'TIMEOUT_ERROR' |
        'UNKNOWN_ERROR';
  responseTime: number;
  timestamp: string;
  originalUrl: string;
}
```

## 🔍 Frontend Integration

### Basic Usage

```typescript
import { proxyService } from '../services/ProxyService';

// Get quote data
const quote = await proxyService.getQuote('AAPL');
console.log('Price:', quote.data.chart.result[0].meta.regularMarketPrice);

// Get historical data
const historical = await proxyService.getHistoricalData('AAPL', '1d', '1y');

// Check server health
const health = await proxyService.getHealth();
console.log('Cache hit ratio:', health.performance.cacheHitRatio);
```

### Error Handling

```typescript
try {
  const data = await proxyService.getQuote('INVALID');
} catch (error) {
  // Proxy service automatically provides user-friendly messages
  console.error('User message:', error.message);
  
  // Check if it's a specific error type
  if (error.message.includes('symbol was not found')) {
    // Handle invalid symbol
  } else if (error.message.includes('Rate limit exceeded')) {
    // Handle rate limiting
  }
}
```

## 📈 Performance Metrics

### Caching Performance
- **Cache Hit Ratio**: Target >80% for production workloads
- **Response Time**: <50ms for cached responses, <2000ms for fresh data
- **Memory Usage**: <100MB for 10,000 cached symbols
- **TTL Efficiency**: Automatic optimization based on data freshness

### Network Performance
- **Compression**: Gzip enabled for all responses
- **Keep-Alive**: Connection pooling for reduced latency
- **Timeout Management**: Adaptive timeouts (30s default)
- **Error Recovery**: Exponential backoff retry logic

### Monitoring Dashboard

```bash
# Access monitoring interface
http://localhost:5173 → "CORS Proxy Server Monitor"
```

**Real-time metrics:**
- Server uptime and memory usage
- Cache statistics and hit ratios
- Request success/failure rates
- Response time distributions
- Active connections and queue status

## 🛡️ Security Features

### CORS Configuration
```javascript
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400  // 24 hour preflight cache
};
```

### Request Sanitization
- Input validation for all parameters
- SQL injection prevention
- XSS attack protection
- Rate limiting per IP address

### Header Security
```javascript
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Allow proxy functionality
}));
```

## 🧪 Testing Suite

### Automated Tests (in ProxyDemo)

1. **Health Check Test**: Server connectivity and status
2. **Single Quote Test**: Basic API functionality
3. **Historical Data Test**: Time-series data retrieval
4. **Multiple Quotes Test**: Batch processing capability
5. **Symbol Search Test**: Search functionality
6. **Market Summary Test**: Market-wide data retrieval

### Performance Benchmarks

**Response Time Targets:**
- Cache Hit: <50ms
- Fresh Data: <2000ms
- Error Response: <100ms

**Throughput Targets:**
- Concurrent Requests: 50+
- Requests/minute: 1000+
- Memory Efficiency: <10MB per 1000 symbols

## 🔧 Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check if port is in use
netstat -ano | findstr :3001

# Kill process if needed (Windows)
taskkill /PID <PID> /F

# Restart server
npm start
```

#### CORS Errors
- Verify frontend URL matches CORS configuration
- Check browser developer console for specific CORS messages
- Ensure server is running on correct port (3001)

#### Cache Issues
```bash
# Clear cache via API
curl -X POST http://localhost:3001/admin/cache/clear

# Or via frontend: CORS Proxy Monitor → Clear Cache button
```

#### Rate Limiting
- Wait 1 minute for rate limit reset
- Check if multiple instances are running
- Monitor request frequency in dashboard

### Debug Mode

```bash
# Enable detailed logging
DEBUG=true npm start

# Check specific logs
curl http://localhost:3001/health | jq
```

## 🚀 Production Deployment

### Environment Setup
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
DEBUG=false
```

### Process Management
```bash
# Using PM2 for production
npm install -g pm2
pm2 start server.js --name "student-analyst-proxy"
pm2 save
pm2 startup
```

### Monitoring
- Set up health check endpoints
- Configure log aggregation
- Monitor memory and CPU usage
- Set up alerting for downtime

## 📄 Technical Specifications

### Dependencies
- **Express.js**: Web framework and routing
- **cors**: CORS middleware for cross-origin requests
- **helmet**: Security headers middleware
- **compression**: Gzip compression middleware
- **morgan**: HTTP request logging
- **express-rate-limit**: Rate limiting middleware
- **node-cache**: In-memory caching solution
- **axios**: HTTP client for Yahoo Finance API
- **dotenv**: Environment variable management

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Node.js Requirements
- Node.js 16+ (ESM modules)
- npm 7+

## 🎯 Performance Optimization

### Cache Strategy
```javascript
// Intelligent TTL based on data type
function getTTL(url, params) {
  const interval = params?.interval;
  
  if (interval?.includes('m')) return 60;     // 1 minute for intraday
  if (interval === '1d') return 3600;        // 1 hour for daily
  if (interval?.includes('w|mo')) return 14400; // 4 hours for weekly/monthly
  
  return 300; // 5 minutes default
}
```

### Memory Management
- LRU eviction for cache overflow
- Automatic cleanup of expired keys
- Memory usage monitoring and alerts
- Graceful shutdown with cache persistence

### Network Optimization
- HTTP/2 support for multiplexing
- Connection keep-alive for reduced latency
- Request deduplication to prevent duplicate calls
- Adaptive timeout based on historical performance

## 📚 Advanced Usage

### Custom Headers
```typescript
// Add custom headers for specific use cases
const response = await proxyService.request('v8/finance/chart/AAPL', {
  interval: '1d',
  range: '1y'
});
```

### Batch Processing
```typescript
// Process multiple symbols efficiently
const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
const quotes = await proxyService.getMultipleQuotes(symbols);
```

### Error Recovery
```typescript
// Automatic retry with exponential backoff
const retryConfig = {
  retries: 3,
  retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000
};
```

## 🎯 Next Steps

1. **Task B1.2.5**: Advanced Caching System
   - Redis integration for persistent cache
   - Distributed caching for horizontal scaling
   - Cache warming strategies
   - Background refresh mechanisms

2. **Performance Enhancements**
   - HTTP/2 push for predictive caching
   - WebSocket support for real-time data
   - Edge caching with CDN integration
   - Request prioritization and queuing

3. **Enterprise Features**
   - Authentication and authorization
   - API key management
   - Usage analytics and billing
   - Multi-tenant support

---

*Built with ❤️ for Student Analyst Platform - Professional Financial Analysis Made Accessible* 