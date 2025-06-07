# Circuit Breaker Pattern Implementation

## Overview
The Circuit Breaker pattern is a design pattern used to detect failures and encapsulates the logic of preventing a failure from constantly recurring during maintenance, temporary external system failure, or unexpected system difficulties.

This implementation provides automatic protection for API calls in the Student Analyst platform, preventing cascading failures and providing graceful degradation when external services are unavailable.

## Core Concepts

### Circuit Breaker States

1. **CLOSED (🟢)** - Normal Operation
   - All requests are allowed to pass through
   - Failures are monitored and counted
   - Transitions to OPEN when failure threshold is exceeded

2. **OPEN (🔴)** - Circuit Breaker Activated
   - All requests are immediately rejected without attempting the operation
   - Prevents further strain on failing service
   - Transitions to HALF_OPEN after recovery timeout

3. **HALF_OPEN (🟡)** - Testing Recovery
   - Limited requests are allowed to test if service has recovered
   - On success: transitions to CLOSED
   - On failure: returns to OPEN state

### State Transitions

```
CLOSED --[failure_threshold exceeded]--> OPEN
OPEN --[recovery_timeout elapsed]--> HALF_OPEN
HALF_OPEN --[success]--> CLOSED
HALF_OPEN --[failure]--> OPEN
```

## Implementation Details

### CircuitBreaker Class

```typescript
const breaker = new CircuitBreaker('api-name', {
  failureThreshold: 3,        // Number of failures before opening
  recoveryTimeout: 5 * 60 * 1000,  // 5 minutes in milliseconds
  successThreshold: 1,        // Successes needed to close from half-open
  monitoringPeriod: 60 * 1000 // Monitoring window (future feature)
});
```

### Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `failureThreshold` | 3 | Number of consecutive failures before circuit opens |
| `recoveryTimeout` | 5 minutes | Time to wait before attempting recovery |
| `successThreshold` | 1 | Number of successes needed to close from half-open |
| `monitoringPeriod` | 1 minute | Time window for failure counting (reserved) |

## Usage Examples

### Basic Usage

```typescript
import { CircuitBreaker } from '../utils/CircuitBreaker';

const apiBreaker = new CircuitBreaker('external-api');

// Execute operation with circuit breaker protection
try {
  const result = await apiBreaker.execute(async () => {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });
  console.log('Success:', result);
} catch (error) {
  if (error instanceof CircuitBreakerError) {
    console.log('Circuit breaker is open:', error.message);
  } else {
    console.log('Operation failed:', error.message);
  }
}
```

### Integration with useApiCall Hook

The circuit breaker is automatically integrated with our API hooks:

```typescript
import { useAlphaVantageApi } from '../hooks/useApiCall';

const MyComponent = () => {
  const api = useAlphaVantageApi({
    context: 'Stock Data'
  });

  const fetchData = () => {
    api.execute('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT');
  };

  return (
    <div>
      <button onClick={fetchData}>Fetch Stock Data</button>
      {api.isCircuitBreakerOpen && (
        <p>Service temporarily unavailable</p>
      )}
    </div>
  );
};
```

### Circuit Breaker Registry

The registry manages multiple circuit breakers:

```typescript
import { CircuitBreakerRegistry } from '../utils/CircuitBreaker';

const registry = CircuitBreakerRegistry.getInstance();

// Get or create a circuit breaker
const alphaVantageBreaker = registry.getBreaker('alpha-vantage', {
  failureThreshold: 2,        // More conservative for rate-limited APIs
  recoveryTimeout: 10 * 60 * 1000  // 10 minutes
});

// Get statistics for all breakers
const allStats = registry.getAllStats();

// Check overall health
const isHealthy = registry.getOverallHealth();
```

## Pre-configured Circuit Breakers

The system includes pre-configured circuit breakers for common financial APIs:

### Alpha Vantage API
```typescript
{
  failureThreshold: 2,        // Conservative due to rate limits
  recoveryTimeout: 10 minutes,
  successThreshold: 1
}
```

### Yahoo Finance API
```typescript
{
  failureThreshold: 3,        // Standard configuration
  recoveryTimeout: 5 minutes,
  successThreshold: 1
}
```

### Backend API
```typescript
{
  failureThreshold: 3,        // Standard configuration
  recoveryTimeout: 2 minutes, // Quick recovery for internal APIs
  successThreshold: 1
}
```

## API Call Hook Integration

### Enhanced useApiCall

The `useApiCall` hook now includes circuit breaker functionality:

```typescript
const api = useApiCall({
  enableCircuitBreaker: true,      // Enable circuit breaker (default: true)
  circuitBreakerName: 'my-api',    // Custom breaker name
  context: 'Financial Data'
});

// Check circuit breaker status
const stats = api.getCircuitBreakerStats();
const isOpen = api.isCircuitBreakerOpen;
```

### Specialized Hooks

```typescript
// Pre-configured for Alpha Vantage
const alphaApi = useAlphaVantageApi();

// Pre-configured for Yahoo Finance
const yahooApi = useYahooFinanceApi();

// Pre-configured for backend
const backendApi = useBackendApi();
```

## Error Handling

### CircuitBreakerError

When a circuit breaker is open, it throws a special error:

```typescript
catch (error) {
  if (error instanceof CircuitBreakerError) {
    console.log('Circuit breaker state:', error.state);
    console.log('Time until retry:', error.timeUntilRetry);
  }
}
```

### User Notifications

The system automatically shows user-friendly notifications:

- **Circuit Open**: "Service temporarily unavailable. Will retry automatically in X minutes."
- **Recovery**: Service notifications when circuit closes
- **Contextual Messages**: Include service name for clarity

## Testing

### CircuitBreakerTester Component

The testing interface provides comprehensive testing capabilities:

1. **Manual Testing**
   - Test individual scenarios
   - Select different API endpoints
   - Real-time status monitoring

2. **Automated Testing**
   - Run all scenarios automatically
   - Demonstrate state transitions
   - Performance validation

3. **Monitoring Dashboard**
   - Real-time circuit breaker status
   - Success/failure statistics
   - Time until next attempt
   - Visual state indicators

### Test Scenarios

1. **Alpha Vantage Simulation**
   - URL: `https://httpbin.org/status/500`
   - Expected: Opens after 2 failures, 10-minute timeout

2. **Yahoo Finance Simulation**
   - URL: `https://httpbin.org/status/503`
   - Expected: Opens after 3 failures, 5-minute timeout

3. **Backend API Simulation**
   - URL: `http://localhost:3001/nonexistent`
   - Expected: Opens after 3 failures, 2-minute timeout

4. **Generic Unstable API**
   - URL: `https://httpbin.org/status/502`
   - Expected: Opens after 3 failures, 5-minute timeout

## Benefits

### 1. Fault Tolerance
- Prevents cascading failures
- Isolates failing services
- Maintains system stability

### 2. Resource Conservation
- Avoids wasting resources on failing calls
- Reduces load on struggling services
- Preserves API quotas for free services

### 3. Improved User Experience
- Faster failure detection
- Meaningful error messages
- Automatic recovery attempts

### 4. System Observability
- Real-time status monitoring
- Failure rate tracking
- Recovery time measurement

## Best Practices

### 1. Configuration
- **Free APIs**: Lower failure threshold (2-3)
- **Paid APIs**: Higher failure threshold (3-5)
- **Internal APIs**: Shorter recovery timeout
- **External APIs**: Longer recovery timeout

### 2. Monitoring
- Monitor circuit breaker metrics
- Set up alerts for frequent openings
- Track recovery success rates

### 3. Fallback Strategies
```typescript
const api = useApiCall();

const getData = async () => {
  try {
    return await api.execute(primaryUrl);
  } catch (error) {
    if (error instanceof CircuitBreakerError) {
      // Use fallback data source or cached data
      return getCachedData();
    }
    throw error;
  }
};
```

### 4. Testing
- Test circuit breaker behavior in development
- Validate timeout configurations
- Ensure proper error handling

## Advanced Features

### 1. Statistics Tracking
```typescript
const stats = breaker.getStats();
console.log({
  state: stats.state,
  failureRate: breaker.getFailureRate(),
  totalRequests: stats.totalRequests,
  successRate: (stats.totalSuccesses / stats.totalRequests) * 100
});
```

### 2. Administrative Controls
```typescript
// Force open for maintenance
breaker.forceOpen();

// Reset to closed state
breaker.reset();

// Check health status
const isHealthy = breaker.isHealthy();
```

### 3. Bulk Operations
```typescript
const registry = CircuitBreakerRegistry.getInstance();

// Reset all circuit breakers
registry.resetAll();

// Get health of all services
const overallHealth = registry.getOverallHealth();

// Remove specific breaker
registry.removeBreaker('old-api');
```

## Financial API Considerations

### Rate Limiting Integration
Circuit breakers work alongside rate limiting:

```typescript
import { defaultRateLimit } from '../hooks/useApiCall';

const fetchWithProtection = async (url: string) => {
  // Check rate limit first
  if (!defaultRateLimit.canMakeRequest()) {
    throw new Error('Rate limit exceeded');
  }

  // Use circuit breaker protection
  return await breaker.execute(() => fetch(url));
};
```

### API-Specific Configurations

1. **Alpha Vantage**
   - Low failure threshold due to rate limits
   - Longer recovery timeout
   - Conservative approach

2. **Yahoo Finance**
   - Standard failure threshold
   - Medium recovery timeout
   - Balanced approach

3. **Internal APIs**
   - Higher failure threshold
   - Shorter recovery timeout
   - Optimistic approach

## Production Considerations

### 1. Persistence
- Circuit breaker state is not persisted across page refreshes
- Consider localStorage for critical applications
- Implement server-side circuit breakers for persistence

### 2. Metrics Collection
- Log circuit breaker events
- Monitor open/close frequencies
- Track failure patterns

### 3. Alerting
- Alert on frequent circuit breaker openings
- Monitor recovery success rates
- Track API health trends

### 4. Configuration Management
- Environment-specific configurations
- Runtime configuration updates
- A/B testing for thresholds

## Future Enhancements

- [ ] Exponential backoff for recovery timeout
- [ ] Sliding window failure counting
- [ ] Metric collection and export
- [ ] Circuit breaker state persistence
- [ ] Integration with monitoring systems
- [ ] Adaptive threshold adjustment
- [ ] Bulk operations for similar services 