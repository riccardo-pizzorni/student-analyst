import { useState, useEffect, useCallback, useRef } from 'react';
import { PriceDataPoint, AssetConfig } from '@/components/ui/PriceChart';

// Types for API responses
interface AlphaVantageResponse {
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
  'Error Message'?: string;
  'Note'?: string;
}

interface YahooFinanceDataPoint {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceDataOptions {
  period?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max';
  interval?: '1d' | '1wk' | '1mo';
  apiKey?: string;
  useCache?: boolean;
  maxCacheAge?: number; // in milliseconds
}

export interface UsePriceDataReturn {
  data: PriceDataPoint[];
  assets: AssetConfig[];
  loading: boolean;
  error: string | null;
  fetchData: (symbols: string[], options?: PriceDataOptions) => Promise<void>;
  addAsset: (symbol: string, name?: string) => Promise<void>;
  removeAsset: (symbol: string) => void;
  toggleAsset: (symbol: string) => void;
  clearData: () => void;
  retryFailed: () => Promise<void>;
}

// Cache interface
interface CacheEntry {
  data: PriceDataPoint[];
  timestamp: number;
  symbol: string;
}

// API rate limiting
class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private window: number;

  constructor(limit: number = 5, windowMs: number = 60000) {
    this.limit = limit;
    this.window = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.window);
    return this.requests.length < this.limit;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getWaitTime(): number {
    if (this.canMakeRequest()) return 0;
    const oldest = Math.min(...this.requests);
    return this.window - (Date.now() - oldest);
  }
}

// Default colors for assets
const DEFAULT_COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea',
  '#c2410c', '#0891b2', '#be123c', '#4338ca', '#059669'
];

export function usePriceData(): UsePriceDataReturn {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [assets, setAssets] = useState<AssetConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const rateLimiterRef = useRef(new RateLimiter(5, 60000)); // 5 requests per minute
  const failedSymbolsRef = useRef<string[]>([]);

  // Cache management
  const getCachedData = useCallback((symbol: string, maxAge: number = 5 * 60 * 1000): CacheEntry | null => {
    const cached = cacheRef.current.get(symbol);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > maxAge;
    if (isExpired) {
      cacheRef.current.delete(symbol);
      return null;
    }
    
    return cached;
  }, []);

  const setCachedData = useCallback((symbol: string, data: PriceDataPoint[]) => {
    cacheRef.current.set(symbol, {
      data,
      timestamp: Date.now(),
      symbol
    });
  }, []);

  // Yahoo Finance API (free, no key required)
  const fetchYahooFinanceData = useCallback(async (
    symbol: string, 
    options: PriceDataOptions = {}
  ): Promise<PriceDataPoint[]> => {
    const { period = '1y', interval = '1d' } = options;
    
    // Using a proxy or direct approach for CORS
    const proxyUrl = '/api/yahoo-finance'; // Assumes backend proxy
    const params = new URLSearchParams({
      symbol,
      period,
      interval
    });

    const response = await fetch(`${proxyUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const yahooData = await response.json();
    
    if (!yahooData.chart?.result?.[0]?.timestamp) {
      throw new Error('Invalid Yahoo Finance response format');
    }

    const result = yahooData.chart.result[0];
    const timestamps = result.timestamp;
    const prices = result.indicators.quote[0].close;

    return timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      timestamp,
      [symbol]: prices[index] || 0
    }));
  }, []);

  // Alpha Vantage API (free with API key)
  const fetchAlphaVantageData = useCallback(async (
    symbol: string,
    apiKey: string
  ): Promise<PriceDataPoint[]> => {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=full`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data: AlphaVantageResponse = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      throw new Error('API call frequency limit reached. Try again later.');
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error('No data available for this symbol');
    }

    return Object.entries(timeSeries)
      .map(([date, values]) => ({
        date,
        timestamp: new Date(date).getTime(),
        [symbol]: parseFloat(values['4. close'])
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, []);

  // Fallback to mock data for development
  const generateMockData = useCallback((symbol: string): PriceDataPoint[] => {
    const days = 252; // 1 year of trading days
    const basePrice = 100 + Math.random() * 400; // Random base price
    const volatility = 0.02 + Math.random() * 0.03; // Daily volatility
    
    const data: PriceDataPoint[] = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      // Random walk with slight upward bias
      const randomChange = (Math.random() - 0.48) * volatility;
      currentPrice *= (1 + randomChange);
      
      data.push({
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        [symbol]: Math.round(currentPrice * 100) / 100
      });
    }
    
    return data;
  }, []);

  // Main fetch function
  const fetchSingleAsset = useCallback(async (
    symbol: string,
    options: PriceDataOptions = {}
  ): Promise<PriceDataPoint[]> => {
    const { useCache = true, maxCacheAge = 5 * 60 * 1000, apiKey } = options;
    
    // Check cache first
    if (useCache) {
      const cached = getCachedData(symbol, maxCacheAge);
      if (cached) {
        return cached.data;
      }
    }

    // Rate limiting
    if (!rateLimiterRef.current.canMakeRequest()) {
      const waitTime = rateLimiterRef.current.getWaitTime();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    try {
      let priceData: PriceDataPoint[];

      // Try Yahoo Finance first (no API key required)
      try {
        priceData = await fetchYahooFinanceData(symbol, options);
        rateLimiterRef.current.recordRequest();
      } catch (yahooError) {
        console.warn(`Yahoo Finance failed for ${symbol}:`, yahooError);
        
        // Fallback to Alpha Vantage if API key is provided
        if (apiKey) {
          priceData = await fetchAlphaVantageData(symbol, apiKey);
          rateLimiterRef.current.recordRequest();
        } else {
          // Final fallback to mock data
          console.warn(`Using mock data for ${symbol}`);
          priceData = generateMockData(symbol);
        }
      }

      // Cache the result
      if (useCache) {
        setCachedData(symbol, priceData);
      }

      return priceData;
    } catch (error) {
      failedSymbolsRef.current.push(symbol);
      throw error;
    }
  }, [fetchYahooFinanceData, fetchAlphaVantageData, generateMockData, getCachedData, setCachedData]);

  // Fetch multiple assets
  const fetchData = useCallback(async (
    symbols: string[],
    options: PriceDataOptions = {}
  ) => {
    if (symbols.length === 0) return;

    setLoading(true);
    setError(null);
    failedSymbolsRef.current = [];

    try {
      const promises = symbols.map(symbol => 
        fetchSingleAsset(symbol, options).catch(error => {
          console.error(`Failed to fetch ${symbol}:`, error);
          return null;
        })
      );

      const results = await Promise.all(promises);
      const successfulResults = results.filter((result): result is PriceDataPoint[] => result !== null);

      if (successfulResults.length === 0) {
        throw new Error('Failed to fetch data for all symbols');
      }

      // Merge data from all assets
      const allDates = new Set<string>();
      successfulResults.forEach(assetData => {
        assetData.forEach(point => allDates.add(point.date));
      });

      const sortedDates = Array.from(allDates).sort();
      const mergedData: PriceDataPoint[] = sortedDates.map(date => {
        const basePoint: PriceDataPoint = {
          date,
          timestamp: new Date(date).getTime()
        };

        successfulResults.forEach(assetData => {
          const point = assetData.find(p => p.date === date);
          if (point) {
            Object.keys(point).forEach(key => {
              if (key !== 'date' && key !== 'timestamp') {
                basePoint[key] = point[key];
              }
            });
          }
        });

        return basePoint;
      });

      setData(mergedData);

      // Update assets configuration
      const newAssets: AssetConfig[] = symbols.map((symbol, index) => ({
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(), // Could be enhanced with company names
        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        visible: true
      }));

      setAssets(newAssets);

      if (failedSymbolsRef.current.length > 0) {
        setError(`Warning: Failed to fetch data for: ${failedSymbolsRef.current.join(', ')}`);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch price data');
    } finally {
      setLoading(false);
    }
  }, [fetchSingleAsset]);

  // Add single asset
  const addAsset = useCallback(async (symbol: string, name?: string) => {
    const upperSymbol = symbol.toUpperCase();
    
    // Check if asset already exists
    if (assets.some(asset => asset.symbol === upperSymbol)) {
      setError(`Asset ${upperSymbol} is already added`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newAssetData = await fetchSingleAsset(upperSymbol);
      
      // Merge with existing data
      const allDates = new Set<string>();
      data.forEach(point => allDates.add(point.date));
      newAssetData.forEach(point => allDates.add(point.date));

      const sortedDates = Array.from(allDates).sort();
      const mergedData: PriceDataPoint[] = sortedDates.map(date => {
        const existingPoint = data.find(p => p.date === date);
        const newPoint = newAssetData.find(p => p.date === date);
        
        return {
          date,
          timestamp: new Date(date).getTime(),
          ...existingPoint,
          ...newPoint
        };
      });

      setData(mergedData);

      const newAsset: AssetConfig = {
        symbol: upperSymbol,
        name: name || upperSymbol,
        color: DEFAULT_COLORS[assets.length % DEFAULT_COLORS.length],
        visible: true
      };

      setAssets(prev => [...prev, newAsset]);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add asset');
    } finally {
      setLoading(false);
    }
  }, [assets, data, fetchSingleAsset]);

  // Remove asset
  const removeAsset = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    
    setAssets(prev => prev.filter(asset => asset.symbol !== upperSymbol));
    
    setData(prev => prev.map(point => {
      const newPoint = { ...point };
      delete newPoint[upperSymbol];
      return newPoint;
    }));
  }, []);

  // Toggle asset visibility
  const toggleAsset = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    
    setAssets(prev => prev.map(asset => 
      asset.symbol === upperSymbol 
        ? { ...asset, visible: !asset.visible }
        : asset
    ));
  }, []);

  // Clear all data
  const clearData = useCallback(() => {
    setData([]);
    setAssets([]);
    setError(null);
    cacheRef.current.clear();
    failedSymbolsRef.current = [];
  }, []);

  // Retry failed symbols
  const retryFailed = useCallback(async () => {
    if (failedSymbolsRef.current.length === 0) return;
    
    const failedSymbols = [...failedSymbolsRef.current];
    failedSymbolsRef.current = [];
    
    await fetchData(failedSymbols);
  }, [fetchData]);

  return {
    data,
    assets,
    loading,
    error,
    fetchData,
    addAsset,
    removeAsset,
    toggleAsset,
    clearData,
    retryFailed
  };
} 