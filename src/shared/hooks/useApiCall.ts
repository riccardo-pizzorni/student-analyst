import { useState, useCallback, useRef } from 'react';
import { useApiNotifications } from '../components/NotificationProvider';
import { CircuitBreaker, CircuitBreakerRegistry, CircuitBreakerError, createDefaultBreakers } from '../utils/CircuitBreaker';

export interface ApiCallConfig {
  timeout?: number;           // Timeout in milliseconds (default: 30000)
  maxRetries?: number;        // Max retry attempts (default: 3)
  retryDelay?: number;        // Delay between retries in ms (default: 1000)
  retryDelayMultiplier?: number; // Multiply delay after each retry (default: 2)
  enableNotifications?: boolean; // Show user notifications (default: true)
  context?: string;           // Context for error messages
  silentErrors?: boolean;     // Don't show error notifications (default: false)
  enableCircuitBreaker?: boolean; // Enable circuit breaker protection (default: true)
  circuitBreakerName?: string; // Custom circuit breaker name (default: auto-generated)
}

export interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  attempt: number;
  isTimeout: boolean;
  isCircuitBreakerOpen: boolean;
}

export interface ApiCallResult<T> extends ApiCallState<T> {
  execute: (url: string, options?: RequestInit) => Promise<T | null>;
  reset: () => void;
  cancel: () => void;
  getCircuitBreakerStats: () => any;
}

const DEFAULT_CONFIG: Required<Omit<ApiCallConfig, 'context' | 'circuitBreakerName'>> = {
  timeout: 30000,           // 30 seconds
  maxRetries: 3,            // 3 retry attempts
  retryDelay: 1000,         // 1 second initial delay
  retryDelayMultiplier: 2,  // Double delay each time
  enableNotifications: true,
  silentErrors: false,
  enableCircuitBreaker: true,
};

// Initialize default circuit breakers on module load
createDefaultBreakers();

// Utility function to create timeout promise
const createTimeoutPromise = (timeout: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);
  });
};

// Utility function to wait/delay
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Enhanced fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (_error) {
    clearTimeout(timeoutId);
    if (_error instanceof Error && _error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw _error;
  }
};

// Generate circuit breaker name from URL
const generateCircuitBreakerName = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    // If URL parsing fails, use a generic name
    return 'generic-api';
  }
};

export const useApiCall = <T = any>(config: ApiCallConfig = {}): ApiCallResult<T> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { notifyApiError, notifyApiSuccess, notifyApiTimeout, notifyApiRetry } = useApiNotifications();
  
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
    attempt: 0,
    isTimeout: false,
    isCircuitBreakerOpen: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const circuitBreakerRef = useRef<CircuitBreaker | null>(null);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      attempt: 0,
      isTimeout: false,
      isCircuitBreakerOpen: false,
    });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      loading: false,
    }));
  }, []);

  const getCircuitBreakerStats = useCallback(() => {
    if (!circuitBreakerRef.current) return null;
    return circuitBreakerRef.current.getStats();
  }, []);

  const execute = useCallback(async (url: string, options: RequestInit = {}): Promise<T | null> => {
    // Cancel any existing request
    cancel();

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Setup circuit breaker if enabled
    let circuitBreaker: CircuitBreaker | null = null;
    if (finalConfig.enableCircuitBreaker) {
      const registry = CircuitBreakerRegistry.getInstance();
      const breakerName = finalConfig.circuitBreakerName || generateCircuitBreakerName(url);
      circuitBreaker = registry.getBreaker(breakerName);
      circuitBreakerRef.current = circuitBreaker;
    }

    setState({
      data: null,
      loading: true,
      error: null,
      attempt: 0,
      isTimeout: false,
      isCircuitBreakerOpen: circuitBreaker ? !circuitBreaker.isHealthy() : false,
    });

    // Define the API operation
    const apiOperation = async (): Promise<T> => {
      // Check if request was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Request was cancelled');
      }

      const response = await fetchWithTimeout(url, options, finalConfig.timeout);
      
      if (!response.ok) {
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as unknown as T;
      }

      return data;
    };

    let lastError: Error | null = null;
    let currentDelay = finalConfig.retryDelay;

    for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
      setState(prev => ({ 
        ...prev, 
        attempt,
        isCircuitBreakerOpen: circuitBreaker ? !circuitBreaker.isHealthy() : false,
      }));

      try {
        let result: T;

        // Use circuit breaker if enabled
        if (circuitBreaker) {
          result = await circuitBreaker.execute(apiOperation);
        } else {
          result = await apiOperation();
        }

        // Success!
        setState({
          data: result,
          loading: false,
          error: null,
          attempt,
          isTimeout: false,
          isCircuitBreakerOpen: false,
        });

        if (finalConfig.enableNotifications && !finalConfig.silentErrors) {
          notifyApiSuccess(`Data loaded successfully${finalConfig.context ? ` from ${finalConfig.context}` : ''}`);
        }

        return result;

      } catch (_error) {
        lastError = _error instanceof Error ? _error : new Error(String(_error));
        
        // Handle circuit breaker errors specially
        if (lastError instanceof CircuitBreakerError) {
          setState(prev => ({
            ...prev,
            error: lastError,
            loading: false,
            isCircuitBreakerOpen: true,
          }));

          if (finalConfig.enableNotifications && !finalConfig.silentErrors) {
            const waitMinutes = Math.ceil(lastError.timeUntilRetry / (60 * 1000));
            notifyApiError(
              new Error(`Service temporarily unavailable. Will retry automatically in ${waitMinutes} minutes.`),
              finalConfig.context
            );
          }

          return null;
        }

        const isTimeout = lastError.message.includes('timed out');
        const isLastAttempt = attempt >= finalConfig.maxRetries + 1;

        setState(prev => ({
          ...prev,
          error: lastError,
          isTimeout,
          loading: !isLastAttempt,
          isCircuitBreakerOpen: circuitBreaker ? !circuitBreaker.isHealthy() : false,
        }));

        // Handle timeout specifically
        if (isTimeout && finalConfig.enableNotifications && !finalConfig.silentErrors) {
          notifyApiTimeout(finalConfig.context);
        }

        // If this is the last attempt, handle final error
        if (isLastAttempt) {
          setState(prev => ({ ...prev, loading: false }));
          
          if (finalConfig.enableNotifications && !finalConfig.silentErrors) {
            if (!isTimeout) { // Don't double-notify for timeouts
              notifyApiError(lastError!, finalConfig.context);
            }
            notifyApiRetry(attempt, finalConfig.maxRetries + 1, finalConfig.context);
          }
          
          return null;
        }

        // Wait before retrying (if not the last attempt)
        if (attempt < finalConfig.maxRetries + 1) {
          await delay(currentDelay);
          currentDelay *= finalConfig.retryDelayMultiplier;
        }
      }
    }

    return null;
  }, [finalConfig, cancel, notifyApiError, notifyApiSuccess, notifyApiTimeout, notifyApiRetry]);

  return {
    ...state,
    execute,
    reset,
    cancel,
    getCircuitBreakerStats,
  };
};

// Convenience hooks for common API patterns

// Hook for JSON API calls
export const useJsonApi = <T = any>(config: ApiCallConfig = {}) => {
  return useApiCall<T>({
    ...config,
    // JSON-specific configurations can go here
  });
};

// Hook for file downloads
export const useFileDownload = (config: ApiCallConfig = {}) => {
  return useApiCall<Blob>({
    ...config,
    silentErrors: true, // File downloads usually don't need notifications
    enableCircuitBreaker: false, // Downloads might not need circuit breaker
  });
};

// Hook for health checks/ping
export const useHealthCheck = (config: ApiCallConfig = {}) => {
  return useApiCall<{ status: string; timestamp: string }>({
    ...config,
    timeout: 5000,        // Shorter timeout for health checks
    maxRetries: 1,        // Fewer retries for health checks
    silentErrors: true,   // Health checks should be silent
    enableCircuitBreaker: false, // Health checks used for monitoring
  });
};

// Utility function to test API connectivity
export const testApiConnectivity = async (url: string): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(url, { method: 'HEAD' }, 5000);
    return response.ok;
  } catch {
    return false;
  }
};

// Rate limiting utility
export class ApiRateLimit {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number = 60, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const timeUntilReset = this.timeWindow - (Date.now() - oldestRequest);
    
    return Math.max(0, timeUntilReset);
  }
}

// Default rate limiter for free APIs (conservative limits)
export const defaultRateLimit = new ApiRateLimit(60, 60000); // 60 requests per minute

// Circuit breaker specific hooks

// Hook for Alpha Vantage API with circuit breaker
export const useAlphaVantageApi = <T = any>(config: ApiCallConfig = {}) => {
  return useApiCall<T>({
    ...config,
    circuitBreakerName: 'alpha-vantage',
    context: config.context || 'Alpha Vantage API',
    timeout: 20000, // Longer timeout for Alpha Vantage
    maxRetries: 2,  // Fewer retries due to rate limits
  });
};

// Hook for Yahoo Finance API with circuit breaker
export const useYahooFinanceApi = <T = any>(config: ApiCallConfig = {}) => {
  return useApiCall<T>({
    ...config,
    circuitBreakerName: 'yahoo-finance',
    context: config.context || 'Yahoo Finance API',
    timeout: 15000,
    maxRetries: 3,
  });
};

// Hook for backend API with circuit breaker
export const useBackendApi = <T = any>(config: ApiCallConfig = {}) => {
  return useApiCall<T>({
    ...config,
    circuitBreakerName: 'backend-api',
    context: config.context || 'Backend API',
    timeout: 10000,
    maxRetries: 3,
  });
}; 