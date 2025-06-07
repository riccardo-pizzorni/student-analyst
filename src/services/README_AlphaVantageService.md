# Alpha Vantage Service - Professional Financial Data Integration

## 📊 Overview

The **AlphaVantageService** is a professional-grade financial data service that provides reliable access to real-time and historical stock market data through the Alpha Vantage API. This service is designed for financial analysts who need high-quality market data with robust error handling and intelligent rate limiting.

## ✨ Key Features

### 🔄 **Multiple Timeframes Support**
- **Daily**: Last 100 trading days (default)
- **Weekly**: Historical weekly data
- **Monthly**: Historical monthly data  
- **Intraday**: 1-minute, 5-minute, 15-minute intervals

### ⚡ **Intelligent Rate Limiting**
- Respects Alpha Vantage limits: 5 requests/minute, 25 requests/day
- Automatic request queuing and timing
- Real-time usage statistics and monitoring
- Prevents API quota exhaustion

### 🛡️ **Comprehensive Error Handling**
- **RATE_LIMITED**: Automatic retry with intelligent backoff
- **SYMBOL_NOT_FOUND**: Clear feedback with symbol validation
- **INVALID_API_KEY**: Configuration guidance for users
- **NETWORK_ERROR**: Connection timeout and retry logic
- **SERVICE_UNAVAILABLE**: Alpha Vantage server issues
- **INVALID_REQUEST**: Input validation and formatting

### 🔧 **Data Validation & Quality**
- Validates all stock data points for consistency
- Sanity checks: high ≥ low, volume ≥ 0, prices > 0
- Automatic data sorting (newest first)
- Metadata preservation and standardization

### ⚙️ **Circuit Breaker Protection**
- Automatic service protection during outages
- Configurable failure thresholds and recovery timeouts
- Prevents cascade failures in dependent systems

## 🚀 Usage Examples

### Basic Stock Data Retrieval

```typescript
import { alphaVantageService } from '../services/AlphaVantageService';

// Get daily data for Apple (default)
const appleData = await alphaVantageService.getStockData({
  symbol: 'AAPL'
});

console.log(`Retrieved ${appleData.data.length} data points`);
console.log(`Latest price: $${appleData.data[0].close}`);
```

### Advanced Usage with Timeframes

```typescript
// Get 5-minute intraday data for Microsoft
const msftIntraday = await alphaVantageService.getStockData({
  symbol: 'MSFT',
  timeframe: 'INTRADAY_5MIN'
});

// Get weekly data for Google
const googWeekly = await alphaVantageService.getStockData({
  symbol: 'GOOGL',
  timeframe: 'WEEKLY'
});
```

### Error Handling Best Practices

```typescript
try {
  const data = await alphaVantageService.getStockData({
    symbol: 'AAPL'
  });
  
  // Process successful data
  processStockData(data);
  
} catch (error) {
  const alphaError = error as AlphaVantageError;
  
  if (alphaError.retryable) {
    console.log(`Retryable error: ${alphaError.userFriendlyMessage}`);
    if (alphaError.retryAfter) {
      console.log(`Retry after ${alphaError.retryAfter} seconds`);
    }
  } else {
    console.error(`Permanent error: ${alphaError.userFriendlyMessage}`);
    if (alphaError.suggestedAction) {
      console.log(`Suggestion: ${alphaError.suggestedAction}`);
    }
  }
}
```

### Usage Statistics Monitoring

```typescript
const stats = alphaVantageService.getUsageStats();

console.log(`Requests this minute: ${stats.requestsThisMinute}/${stats.maxRequestsPerMinute}`);
console.log(`Requests today: ${stats.requestsToday}/${stats.maxRequestsPerDay}`);
console.log(`Can make request: ${stats.canMakeRequest}`);
```

## 📋 Data Structure

### StockData Response Format

```typescript
interface StockData {
  symbol: string;                    // Stock symbol (e.g., "AAPL")
  timeframe: Timeframe;             // Data timeframe
  data: StockDataPoint[];           // Array of price data (newest first)
  metadata: {
    lastRefreshed: string;          // Last data update time
    timeZone: string;               // Market timezone
    dataSource: 'ALPHA_VANTAGE';   // Data provider
    requestTime: string;            // Request timestamp
  };
}

interface StockDataPoint {
  date: string;                     // Date in YYYY-MM-DD format
  open: number;                     // Opening price
  high: number;                     // Highest price
  low: number;                      // Lowest price
  close: number;                    // Closing price
  volume: number;                   // Trading volume
  adjustedClose?: number;           // Adjusted closing price (if available)
}
```

### Error Response Format

```typescript
interface AlphaVantageError {
  type: 'RATE_LIMITED' | 'INVALID_API_KEY' | 'SYMBOL_NOT_FOUND' | 
        'NETWORK_ERROR' | 'INVALID_REQUEST' | 'SERVICE_UNAVAILABLE';
  message: string;                  // Technical error message
  userFriendlyMessage: string;      // User-friendly explanation
  retryable: boolean;               // Whether the error can be retried
  retryAfter?: number;              // Seconds to wait before retry
  suggestedAction?: string;         // Suggested user action
}
```

## ⚙️ Configuration

### Environment Variables

The service requires the following environment variable:

```env
# Alpha Vantage API Key (Required)
VITE_API_KEY_ALPHA_VANTAGE=your_alpha_vantage_api_key_here
```

### Getting an API Key

1. Visit [Alpha Vantage API Key Registration](https://www.alphavantage.co/support/#api-key)
2. Register with your email address
3. Receive your free API key immediately
4. Add the key to your `.env` file

**Free Tier Limits:**
- 25 requests per day
- 5 requests per minute
- No credit card required

## 🔧 Advanced Configuration

### Circuit Breaker Settings

The service uses a circuit breaker with the following default configuration:

```typescript
{
  failureThreshold: 3,        // 3 failures trigger OPEN state
  recoveryTimeout: 300000,    // 5 minutes recovery time
  successThreshold: 1,        // 1 success needed to close
  monitoringPeriod: 60000     // 1 minute monitoring window
}
```

### Rate Limiting Behavior

- **Per Minute**: Maximum 5 requests, tracked with sliding window
- **Per Day**: Maximum 25 requests, simple counter (resets daily)
- **Automatic Queuing**: Requests are automatically delayed to respect limits
- **Smart Retry**: Failed requests are retried with exponential backoff

## 🧪 Testing

### Built-in Test Component

The service includes a simple test component for validation:

```typescript
import { SimpleAlphaVantageTest } from '../components/SimpleAlphaVantageTest';

// Use in your React app to test the service
<SimpleAlphaVantageTest />
```

### Manual Testing

```typescript
// Test basic functionality
const testBasic = async () => {
  try {
    const data = await alphaVantageService.getStockData({ symbol: 'AAPL' });
    console.log('✅ Basic test passed:', data);
  } catch (error) {
    console.error('❌ Basic test failed:', error);
  }
};

// Test error handling
const testErrorHandling = async () => {
  try {
    await alphaVantageService.getStockData({ symbol: 'INVALID123' });
  } catch (error) {
    console.log('✅ Error handling test passed:', error);
  }
};

// Test rate limiting
const testRateLimiting = async () => {
  const promises = Array(6).fill(null).map(() => 
    alphaVantageService.getStockData({ symbol: 'AAPL' }).catch(e => e)
  );
  
  const results = await Promise.all(promises);
  const rateLimited = results.filter(r => r?.type === 'RATE_LIMITED');
  
  if (rateLimited.length > 0) {
    console.log('✅ Rate limiting test passed');
  }
};
```

## 🚨 Common Issues & Solutions

### Issue: "API key not found"
**Solution**: Ensure `VITE_API_KEY_ALPHA_VANTAGE` is set in your `.env` file

### Issue: "Rate limit exceeded"
**Solution**: The service handles this automatically. Wait for the retry or check usage stats.

### Issue: "Symbol not found"
**Solution**: Verify the stock symbol is correct. Use standard ticker symbols (e.g., AAPL, MSFT, GOOGL).

### Issue: "Network timeout"
**Solution**: The service retries automatically. Check your internet connection if persistent.

### Issue: "Invalid timeframe"
**Solution**: Use one of: DAILY, WEEKLY, MONTHLY, INTRADAY_1MIN, INTRADAY_5MIN, INTRADAY_15MIN

## 📈 Performance Considerations

### Optimization Tips

1. **Cache Results**: Store frequently accessed data locally
2. **Batch Requests**: Group multiple symbol requests when possible
3. **Use Appropriate Timeframes**: Daily data for long-term analysis, intraday for real-time needs
4. **Monitor Usage**: Check usage stats to optimize request patterns

### Memory Usage

- Each stock data response: ~10-50KB depending on timeframe
- Service overhead: ~5KB
- Circuit breaker state: ~1KB

## 🔮 Future Enhancements

### Planned Features

- **Data Caching**: Intelligent local caching to reduce API calls
- **Batch Processing**: Multiple symbol requests in optimized batches
- **WebSocket Support**: Real-time data streaming when available
- **Additional Providers**: Yahoo Finance, IEX Cloud integration
- **Advanced Analytics**: Built-in technical indicators and calculations

### Extensibility

The service is designed to be easily extended:

```typescript
// Add new timeframes
type Timeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INTRADAY_1MIN' | 'NEW_TIMEFRAME';

// Add new error types
type ErrorType = 'RATE_LIMITED' | 'SYMBOL_NOT_FOUND' | 'NEW_ERROR_TYPE';

// Extend data points
interface StockDataPoint {
  // ... existing fields
  newField?: number;
}
```

## 📞 Support

For issues related to:
- **Alpha Vantage API**: Visit [Alpha Vantage Support](https://www.alphavantage.co/support/)
- **Service Implementation**: Check the source code and inline documentation
- **Rate Limiting**: Use the built-in usage statistics and monitoring

---

**Built with ❤️ for professional financial analysis** 