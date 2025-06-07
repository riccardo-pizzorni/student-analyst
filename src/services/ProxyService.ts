/**
 * STUDENT ANALYST - Proxy Service
 * Frontend service for interacting with the CORS proxy server
 */

export interface ProxyResponse<T = unknown> {
  data: T;
  status: number;
  cached: boolean;
  cacheHit?: boolean;
  responseTime: number;
  timestamp: string;
  source: 'yahoo_finance' | 'proxy_server';
}

export interface ProxyError {
  error: true;
  message: string;
  status: number;
  statusText: string;
  responseTime: number;
  timestamp: string;
  source: 'proxy_server';
  originalUrl: string;
  type: 'NETWORKerror' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_SYMBOL' | 'TIMEOUTerror' | 'UNKNOWNerror';
  userMessage: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    used: string;
    total: string;
    external: string;
  };
  cache: {
    keys: number;
    stats: {
      hits: number;
      misses: number;
      errors: number;
      totalRequests: number;
    };
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
  };
  performance: {
    cacheHitRatio: number;
    successRate: number;
  };
}

export interface CacheStats {
  cache: {
    keys: number;
    stats: {
      hits: number;
      misses: number;
      errors: number;
      totalRequests: number;
    };
    hitRatio: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
  };
  timestamp: string;
}

class ProxyService {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Make a request through the proxy server to Yahoo Finance
   */
  async request<T = unknown>(
    endpoint: string, 
    params: Record<string, string | number | boolean> = {}
  ): Promise<ProxyResponse<T>> {
    const url = `${this.baseUrl}/api/yahoo/${endpoint}`;
    const queryString = new URLSearchParams(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    ).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log(`🌐 Proxy request: ${endpoint}`, params);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        const error = data as ProxyError;
        console.error(`❌ Proxy error for ${endpoint}:`, error);
        throw new Error(error.userMessage || error.message);
      }

      const proxyResponse = data as ProxyResponse<T>;
      
      console.log(
        `✅ Proxy ${proxyResponse.cached ? 'cached' : 'fresh'} response for ${endpoint} (${proxyResponse.responseTime}ms)`
      );

      return proxyResponse;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }

        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Unable to connect to proxy server. Please check if the server is running.');
        }

        throw error;
      }

      throw new Error('An unexpected error occurred during the request.');
    }
  }

  /**
   * Get Yahoo Finance quote data
   */
  async getQuote(symbol: string): Promise<ProxyResponse> {
    return this.request('v8/finance/chart/' + symbol, {
      interval: '1d',
      range: '1d',
      includePrePost: 'true'
    });
  }

  /**
   * Get historical data
   */
  async getHistoricalData(
    symbol: string,
    interval: string = '1d',
    range: string = '1y'
  ): Promise<ProxyResponse> {
    return this.request('v8/finance/chart/' + symbol, {
      interval,
      range,
      includePrePost: 'false'
    });
  }

  /**
   * Get multiple quotes
   */
  async getMultipleQuotes(symbols: string[]): Promise<ProxyResponse> {
    const symbolsString = symbols.join(',');
    return this.request('v7/finance/quote', {
      symbols: symbolsString,
      fields: 'symbol,longName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,marketCap,volume'
    });
  }

  /**
   * Search for symbols
   */
  async searchSymbols(query: string): Promise<ProxyResponse> {
    return this.request('v1/finance/search', {
      q: query,
      quotesCount: 10,
      newsCount: 0
    });
  }

  /**
   * Get market summary
   */
  async getMarketSummary(): Promise<ProxyResponse> {
    return this.request('v6/finance/quote/marketSummary', {
      lang: 'en-US',
      region: 'US'
    });
  }

  /**
   * Get trending symbols
   */
  async getTrendingSymbols(region: string = 'US'): Promise<ProxyResponse> {
    return this.request('v1/finance/trending/' + region);
  }

  /**
   * Check proxy server health
   */
  async getHealth(): Promise<HealthStatus> {
    const url = `${this.baseUrl}/health`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw new Error('Proxy server health check failed. Server may be down.');
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const url = `${this.baseUrl}/admin/cache/stats`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Cache stats failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Cache stats failed:', error);
      throw new Error('Unable to retrieve cache statistics.');
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<{ message: string; keysCleared: number; timestamp: string }> {
    const url = `${this.baseUrl}/admin/cache/clear`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Cache clear failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Cache clear failed:', error);
      throw new Error('Unable to clear cache.');
    }
  }

  /**
   * Test connection to proxy server
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch (error) {
      console.error('❌ Proxy connection test failed:', error);
      return false;
    }
  }

  /**
   * Get proxy server URL
   */
  getProxyUrl(): string {
    return this.baseUrl;
  }

  /**
   * Check if server is localhost
   */
  isLocalhost(): boolean {
    return this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1');
  }
}

// Export singleton instance
export const proxyService = new ProxyService();

// Export class for testing
export default ProxyService; 
