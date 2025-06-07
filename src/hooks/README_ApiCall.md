# API Call Error Handler System

## Overview
The `useApiCall` hook system provides robust error handling, retry logic, and user notifications for API calls in the Student Analyst platform. It's specifically designed to handle the challenges of working with free financial APIs that may be unreliable or have rate limits.

## Features

### Core Functionality
- ✅ **Automatic Retry Logic**: Configurable retry attempts with exponential backoff
- ✅ **Timeout Handling**: Configurable timeout with AbortController support
- ✅ **User Notifications**: Integration with notification system for user feedback
- ✅ **Request Cancellation**: Ability to cancel ongoing requests
- ✅ **Rate Limiting**: Built-in rate limiting for API protection
- ✅ **TypeScript Support**: Full TypeScript support with generic types

### Error Handling
- Network errors (connection failures)
- HTTP errors (4xx, 5xx status codes)
- Timeout errors (configurable timeout duration)
- Rate limit errors (with automatic backoff)
- JSON parsing errors
- AbortController cancellation

## Usage Examples

### Basic API Call
```tsx
import { useApiCall } from '../hooks/useApiCall';

const MyComponent = () => {
  const { data, loading, error, execute } = useApiCall<{ title: string }>({
    context: 'Stock Data',
    timeout: 15000,
    maxRetries: 2
  });

  const fetchData = () => {
    execute('https://api.example.com/stock/AAPL');
  };

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Stock Data'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {data && <p>Title: {data.title}</p>}
    </div>
  );
};
```

### JSON API with Custom Configuration
```tsx
import { useJsonApi } from '../hooks/useApiCall';

const JsonApiExample = () => {
  const api = useJsonApi({
    context: 'Financial Data',
    timeout: 30000,      // 30 seconds
    maxRetries: 3,       // 3 retry attempts
    retryDelay: 2000,    // 2 seconds initial delay
    retryDelayMultiplier: 1.5,  // Increase delay by 1.5x each retry
    enableNotifications: true,   // Show user notifications
    silentErrors: false         // Don't suppress error notifications
  });

  return (
    <button onClick={() => api.execute('/api/portfolio')}>
      Load Portfolio
    </button>
  );
};
```

### Health Check Example
```tsx
import { useHealthCheck } from '../hooks/useApiCall';

const HealthChecker = () => {
  const health = useHealthCheck();

  const checkBackend = () => {
    health.execute('http://localhost:3001/health');
  };

  return (
    <div>
      <button onClick={checkBackend}>Check Backend Health</button>
      <span className={health.data ? 'text-green-500' : 'text-red-500'}>
        {health.data ? '✅ Online' : '❌ Offline'}
      </span>
    </div>
  );
};
```

## Configuration Options

### ApiCallConfig Interface
```typescript
interface ApiCallConfig {
  timeout?: number;                    // Timeout in ms (default: 30000)
  maxRetries?: number;                 // Max retry attempts (default: 3)
  retryDelay?: number;                 // Initial delay between retries in ms (default: 1000)
  retryDelayMultiplier?: number;       // Multiply delay after each retry (default: 2)
  enableNotifications?: boolean;       // Show user notifications (default: true)
  context?: string;                    // Context for error messages
  silentErrors?: boolean;              // Don't show error notifications (default: false)
}
```

### Default Configuration
```typescript
const DEFAULT_CONFIG = {
  timeout: 30000,           // 30 seconds
  maxRetries: 3,            // 3 retry attempts
  retryDelay: 1000,         // 1 second initial delay
  retryDelayMultiplier: 2,  // Double delay each time
  enableNotifications: true,
  silentErrors: false,
};
```

## Available Hooks

### `useApiCall<T>(config?: ApiCallConfig)`
Main hook for general API calls with full configuration options.

**Returns:**
```typescript
{
  data: T | null;
  loading: boolean;
  error: Error | null;
  attempt: number;
  isTimeout: boolean;
  execute: (url: string, options?: RequestInit) => Promise<T | null>;
  reset: () => void;
  cancel: () => void;
}
```

### `useJsonApi<T>(config?: ApiCallConfig)`
Specialized hook for JSON API calls. Same as `useApiCall` but optimized for JSON responses.

### `useFileDownload(config?: ApiCallConfig)`
Hook for file downloads. Sets `silentErrors: true` by default.

### `useHealthCheck(config?: ApiCallConfig)`
Hook for health checks with:
- Shorter timeout (5 seconds)
- Fewer retries (1 attempt)
- Silent errors (no notifications)

## Utility Functions

### `testApiConnectivity(url: string): Promise<boolean>`
Test if an API endpoint is reachable using a HEAD request.

```tsx
const isOnline = await testApiConnectivity('https://api.example.com');
```

### `ApiRateLimit` Class
Rate limiting utility for API protection:

```typescript
const rateLimit = new ApiRateLimit(60, 60000); // 60 requests per minute

if (rateLimit.canMakeRequest()) {
  rateLimit.recordRequest();
  // Make API call
} else {
  const waitTime = rateLimit.getTimeUntilReset();
  // Wait or show rate limit message
}
```

## Integration with Notifications

The system integrates with the `NotificationProvider` to show user-friendly messages:

- **Success**: Data loaded successfully
- **Error**: Connection errors with context
- **Timeout**: Request timeout warnings
- **Retry**: Final failure after max retries

### Notification Types
```typescript
// Success notification (3 seconds)
notifyApiSuccess('Portfolio data updated');

// Error notification (8 seconds)
notifyApiError(error, 'Stock Data API');

// Timeout warning (6 seconds)
notifyApiTimeout('Financial API');

// Retry failure (10 seconds)
notifyApiRetry(3, 3, 'Market Data');
```

## Best Practices

### 1. Context Naming
Always provide meaningful context for better error messages:
```tsx
const api = useApiCall({ context: 'Stock Price Data' });
```

### 2. Timeout Configuration
- **Quick operations**: 5-10 seconds
- **Standard API calls**: 15-30 seconds
- **Heavy computations**: 30-60 seconds

### 3. Retry Strategy
- **Free APIs**: 2-3 retries with exponential backoff
- **Paid APIs**: 1-2 retries
- **Health checks**: 1 retry only

### 4. Error Handling
```tsx
const api = useApiCall();

// Always handle the loading state
if (api.loading) return <Spinner />;

// Handle specific error types
if (api.error) {
  if (api.isTimeout) {
    return <TimeoutMessage />;
  }
  return <ErrorMessage error={api.error} />;
}

// Handle success state
if (api.data) {
  return <DataDisplay data={api.data} />;
}
```

### 5. Request Cancellation
```tsx
const api = useApiCall();

useEffect(() => {
  return () => {
    api.cancel(); // Cancel request on component unmount
  };
}, []);
```

## Financial API Integration

### Alpha Vantage Example
```tsx
const alphaVantageApi = useApiCall({
  context: 'Alpha Vantage',
  timeout: 20000,
  maxRetries: 2,
  retryDelay: 5000, // Longer delay for rate-limited APIs
});

const fetchStockData = (symbol: string) => {
  const apiKey = 'YOUR_API_KEY';
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
  return alphaVantageApi.execute(url);
};
```

### Yahoo Finance Example
```tsx
const yahooApi = useApiCall({
  context: 'Yahoo Finance',
  timeout: 15000,
  maxRetries: 3,
});

const fetchQuote = (symbol: string) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  return yahooApi.execute(url);
};
```

## Testing

The `ApiTester` component provides comprehensive testing capabilities:

- ✅ Success scenarios with JSONPlaceholder
- ✅ Timeout testing with HTTPBin delay
- ✅ Error testing with HTTP 500 responses
- ✅ Network error testing with invalid URLs
- ✅ Backend connectivity testing
- ✅ Rate limiting demonstration
- ✅ Cancellation testing
- ✅ Real-time status monitoring

## Error Recovery Strategies

### 1. Automatic Retry
```typescript
// Exponential backoff: 1s, 2s, 4s
retryDelay: 1000,
retryDelayMultiplier: 2,
maxRetries: 3
```

### 2. User Notification
```typescript
// Professional error messages
"Unable to connect to Alpha Vantage after 3 attempts"
"Request timed out. Please try again."
"Data loaded successfully from Yahoo Finance"
```

### 3. Graceful Degradation
```tsx
// Show cached data if API fails
const data = api.data || cachedData || fallbackData;
```

## Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **Rate Limiting**: Respect API rate limits to avoid blocks
3. **CORS**: Ensure proper CORS configuration for external APIs
4. **Input Validation**: Validate URLs and parameters before making requests
5. **Error Exposure**: Don't expose sensitive error details to users

## Performance Optimizations

1. **Request Deduplication**: Avoid duplicate requests for same data
2. **Caching**: Implement response caching for frequently accessed data
3. **Lazy Loading**: Load data only when needed
4. **Abort Unused Requests**: Cancel requests when components unmount
5. **Rate Limiting**: Prevent excessive API calls

## Future Enhancements

- [ ] Request caching and deduplication
- [ ] WebSocket support for real-time data
- [ ] Offline support with service workers
- [ ] Request/response interceptors
- [ ] Automatic API key rotation
- [ ] Circuit breaker pattern
- [ ] Metrics and monitoring integration 