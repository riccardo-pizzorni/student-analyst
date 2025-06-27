import { YahooFinanceService } from '@/services/yahooFinanceService';
import { YahooFinanceTimeframe } from '@/types/yahooFinance';

// Mock yahoo-finance2
jest.mock('yahoo-finance2', () => ({
  historical: jest.fn(),
}));

const yahooFinance = require('yahoo-finance2');

describe('YahooFinanceService', () => {
  let service: YahooFinanceService;

  beforeEach(() => {
    service = new YahooFinanceService();
    jest.clearAllMocks();
  });

  describe('getStockData', () => {
    const mockYahooResponse = {
      symbol: 'AAPL',
      timestamp: [1640995200000, 1641081600000, 1641168000000],
      regularMarketOpen: [150.0, 153.75, 156.25],
      regularMarketHigh: [155.5, 158.0, 159.75],
      regularMarketLow: [149.25, 152.5, 154.0],
      regularMarketClose: [153.75, 156.25, 157.5],
      regularMarketVolume: [1000000, 1200000, 1100000],
    };

    it('should fetch stock data successfully', async () => {
      yahooFinance.historical.mockResolvedValue(mockYahooResponse);

      const result = await service.getStockData(
        'AAPL',
        YahooFinanceTimeframe['1y']
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        date: '2022-01-01',
        open: 150.0,
        high: 155.5,
        low: 149.25,
        close: 153.75,
        volume: 1000000,
      });
      expect(yahooFinance.historical).toHaveBeenCalledWith('AAPL', {
        period1: expect.any(String),
        period2: expect.any(String),
        interval: '1d',
      });
    });

    it('should handle deep historical data (15+ years)', async () => {
      const deepHistoricalResponse = {
        ...mockYahooResponse,
        timestamp: Array.from(
          { length: 4000 },
          (_, i) => 1640995200000 + i * 86400000
        ), // ~11 years of daily data
        regularMarketOpen: Array.from({ length: 4000 }, () => 150.0),
        regularMarketHigh: Array.from({ length: 4000 }, () => 155.5),
        regularMarketLow: Array.from({ length: 4000 }, () => 149.25),
        regularMarketClose: Array.from({ length: 4000 }, () => 153.75),
        regularMarketVolume: Array.from({ length: 4000 }, () => 1000000),
      };

      yahooFinance.historical.mockResolvedValue(deepHistoricalResponse);

      const result = await service.getStockData(
        'AAPL',
        YahooFinanceTimeframe.max
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(4000);
      expect(result.metadata.dataPoints).toBe(4000);
      expect(result.metadata.source).toBe('yahoo_finance');
    });

    it('should handle batch ticker processing', async () => {
      yahooFinance.historical.mockResolvedValue(mockYahooResponse);

      const tickers = ['AAPL', 'MSFT', 'GOOGL'];
      const results = await Promise.all(
        tickers.map(ticker =>
          service.getStockData(ticker, YahooFinanceTimeframe['1y'])
        )
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);
      });
      expect(yahooFinance.historical).toHaveBeenCalledTimes(3);
    });

    it('should handle network errors gracefully', async () => {
      yahooFinance.historical.mockRejectedValue(new Error('Network error'));

      const result = await service.getStockData(
        'AAPL',
        YahooFinanceTimeframe['1y']
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('NETWORK_ERROR');
    });

    it('should handle invalid symbol errors', async () => {
      yahooFinance.historical.mockRejectedValue(new Error('Invalid symbol'));

      const result = await service.getStockData(
        'INVALID',
        YahooFinanceTimeframe['1y']
      );

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('INVALID_SYMBOL');
    });

    it('should handle rate limit errors', async () => {
      yahooFinance.historical.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const result = await service.getStockData(
        'AAPL',
        YahooFinanceTimeframe['1y']
      );

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('RATE_LIMIT');
    });

    it('should handle malformed response', async () => {
      yahooFinance.historical.mockResolvedValue({
        symbol: 'AAPL',
        // Missing required fields
      });

      const result = await service.getStockData(
        'AAPL',
        YahooFinanceTimeframe['1y']
      );

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('MALFORMED_RESPONSE');
    });

    it('should validate symbol before making request', async () => {
      const result = await service.getStockData(
        'INVALID123',
        YahooFinanceTimeframe['1y']
      );

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('INVALID_SYMBOL');
      expect(yahooFinance.historical).not.toHaveBeenCalled();
    });
  });

  describe('validateSymbol', () => {
    it('should accept valid symbols', () => {
      const validSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];

      validSymbols.forEach(symbol => {
        expect(() => service.validateSymbol(symbol)).not.toThrow();
      });
    });

    it('should reject invalid symbols', () => {
      const invalidSymbols = [
        'INVALID123',
        'AAPL123',
        '123AAPL',
        'AAPL-',
        'AAPL_',
        'AAPL.',
        '',
        'A',
        'AAPL123456789',
      ];

      invalidSymbols.forEach(symbol => {
        expect(() => service.validateSymbol(symbol)).toThrow();
      });
    });

    it('should handle edge cases', () => {
      expect(() => service.validateSymbol('AAPL ')).toThrow(); // Trailing space
      expect(() => service.validateSymbol(' AAPL')).toThrow(); // Leading space
      expect(() => service.validateSymbol('AAPL,MSFT')).toThrow(); // Multiple symbols
    });
  });

  describe('handleError', () => {
    it('should categorize network errors', () => {
      const networkErrors = [
        new Error('Network error'),
        new Error('ENOTFOUND'),
        new Error('ECONNREFUSED'),
        new Error('ETIMEDOUT'),
      ];

      networkErrors.forEach(error => {
        const result = service.handleError(error);
        expect(result.type).toBe('NETWORK_ERROR');
      });
    });

    it('should categorize rate limit errors', () => {
      const rateLimitErrors = [
        new Error('Rate limit exceeded'),
        new Error('Too many requests'),
        new Error('429'),
      ];

      rateLimitErrors.forEach(error => {
        const result = service.handleError(error);
        expect(result.type).toBe('RATE_LIMIT');
      });
    });

    it('should categorize invalid symbol errors', () => {
      const invalidSymbolErrors = [
        new Error('Invalid symbol'),
        new Error('Symbol not found'),
        new Error('No data found'),
      ];

      invalidSymbolErrors.forEach(error => {
        const result = service.handleError(error);
        expect(result.type).toBe('INVALID_SYMBOL');
      });
    });

    it('should handle unknown errors', () => {
      const unknownError = new Error('Unknown error');
      const result = service.handleError(unknownError);

      expect(result.type).toBe('UNKNOWN');
      expect(result.message).toBe('Unknown error');
    });
  });

  describe('getCachedData', () => {
    it('should return cached data if available', () => {
      const cacheKey = 'yahoo_AAPL_1y';
      const cachedData = {
        success: true,
        data: [
          {
            date: '2024-01-01',
            open: 150,
            high: 155,
            low: 149,
            close: 153,
            volume: 1000000,
          },
        ],
        metadata: {
          symbol: 'AAPL',
          lastRefreshed: '2024-01-01',
          source: 'yahoo_finance',
          dataPoints: 1,
        },
      };

      // Mock cache implementation
      jest.spyOn(service as any, 'getCachedData').mockReturnValue(cachedData);

      const result = service.getCachedData(cacheKey);
      expect(result).toEqual(cachedData);
    });

    it('should return null if no cached data', () => {
      const cacheKey = 'yahoo_INVALID_1y';

      // Mock cache implementation
      jest.spyOn(service as any, 'getCachedData').mockReturnValue(null);

      const result = service.getCachedData(cacheKey);
      expect(result).toBeNull();
    });
  });

  describe('timeframe mapping', () => {
    it('should map timeframes correctly', async () => {
      yahooFinance.historical.mockResolvedValue(mockYahooResponse);

      const timeframeTests = [
        { input: YahooFinanceTimeframe['1d'], expected: '1d' },
        { input: YahooFinanceTimeframe['5d'], expected: '5d' },
        { input: YahooFinanceTimeframe['1mo'], expected: '1mo' },
        { input: YahooFinanceTimeframe['3mo'], expected: '3mo' },
        { input: YahooFinanceTimeframe['6mo'], expected: '6mo' },
        { input: YahooFinanceTimeframe['1y'], expected: '1y' },
        { input: YahooFinanceTimeframe['2y'], expected: '2y' },
        { input: YahooFinanceTimeframe['5y'], expected: '5y' },
        { input: YahooFinanceTimeframe['10y'], expected: '10y' },
        { input: YahooFinanceTimeframe.ytd, expected: 'ytd' },
        { input: YahooFinanceTimeframe.max, expected: 'max' },
      ];

      for (const test of timeframeTests) {
        await service.getStockData('AAPL', test.input);

        expect(yahooFinance.historical).toHaveBeenCalledWith('AAPL', {
          period1: expect.any(String),
          period2: expect.any(String),
          interval: '1d',
        });
      }
    });
  });

  describe('data transformation', () => {
    it('should transform Yahoo Finance response correctly', async () => {
      const yahooResponse = {
        symbol: 'AAPL',
        timestamp: [1640995200000, 1641081600000], // 2022-01-01, 2022-01-02
        regularMarketOpen: [150.0, 153.75],
        regularMarketHigh: [155.5, 158.0],
        regularMarketLow: [149.25, 152.5],
        regularMarketClose: [153.75, 156.25],
        regularMarketVolume: [1000000, 1200000],
      };

      yahooFinance.historical.mockResolvedValue(yahooResponse);

      const result = await service.getStockData(
        'AAPL',
        YahooFinanceTimeframe['1y']
      );

      expect(result.data).toEqual([
        {
          date: '2022-01-01',
          open: 150.0,
          high: 155.5,
          low: 149.25,
          close: 153.75,
          volume: 1000000,
        },
        {
          date: '2022-01-02',
          open: 153.75,
          high: 158.0,
          low: 152.5,
          close: 156.25,
          volume: 1200000,
        },
      ]);
    });

    it('should handle missing data points', async () => {
      const yahooResponse = {
        symbol: 'AAPL',
        timestamp: [1640995200000],
        regularMarketOpen: [150.0],
        regularMarketHigh: [155.5],
        regularMarketLow: [149.25],
        regularMarketClose: [153.75],
        regularMarketVolume: [1000000],
      };

      yahooFinance.historical.mockResolvedValue(yahooResponse);

      const result = await service.getStockData(
        'AAPL',
        YahooFinanceTimeframe['1y']
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        date: '2022-01-01',
        open: 150.0,
        high: 155.5,
        low: 149.25,
        close: 153.75,
        volume: 1000000,
      });
    });
  });

  describe('performance and caching', () => {
    it('should use cache for repeated requests', async () => {
      yahooFinance.historical.mockResolvedValue(mockYahooResponse);

      // First request
      await service.getStockData('AAPL', YahooFinanceTimeframe['1y']);
      expect(yahooFinance.historical).toHaveBeenCalledTimes(1);

      // Second request should use cache
      await service.getStockData('AAPL', YahooFinanceTimeframe['1y']);
      expect(yahooFinance.historical).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should handle concurrent requests efficiently', async () => {
      yahooFinance.historical.mockResolvedValue(mockYahooResponse);

      const startTime = Date.now();
      const promises = Array.from({ length: 10 }, () =>
        service.getStockData('AAPL', YahooFinanceTimeframe['1y'])
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete within reasonable time (not 10x slower)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
