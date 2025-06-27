import { AlphaVantageService } from '@/services/alphaVantageService';
import { DataSourceManager } from '@/services/dataSourceManager';
import { YahooFinanceService } from '@/services/yahooFinanceService';
import {
  DataSource,
  UnifiedDataResponse,
  UnifiedRequestParams,
} from '@/types/dataSource';

// Mock services
jest.mock('@/services/yahooFinanceService');
jest.mock('@/services/alphaVantageService');

const MockYahooFinanceService = YahooFinanceService as jest.MockedClass<
  typeof YahooFinanceService
>;
const MockAlphaVantageService = AlphaVantageService as jest.MockedClass<
  typeof AlphaVantageService
>;

describe('DataSourceManager', () => {
  let manager: DataSourceManager;
  let mockYahooService: jest.Mocked<YahooFinanceService>;
  let mockAlphaVantageService: jest.Mocked<AlphaVantageService>;

  const mockYahooResponse: UnifiedDataResponse = {
    success: true,
    data: [
      {
        date: '2024-01-01',
        open: 150.0,
        high: 155.5,
        low: 149.25,
        close: 153.75,
        volume: 1000000,
      },
    ],
    metadata: {
      symbol: 'AAPL',
      lastRefreshed: '2024-01-01',
      source: DataSource.YAHOO_FINANCE,
      dataPoints: 1,
    },
    source: DataSource.YAHOO_FINANCE,
  };

  const mockAlphaVantageResponse: UnifiedDataResponse = {
    success: true,
    data: [
      {
        date: '2024-01-01',
        open: 150.0,
        high: 155.5,
        low: 149.25,
        close: 153.75,
        volume: 1000000,
      },
    ],
    metadata: {
      symbol: 'AAPL',
      lastRefreshed: '2024-01-01',
      source: DataSource.ALPHA_VANTAGE,
      dataPoints: 1,
    },
    source: DataSource.ALPHA_VANTAGE,
    fallbackUsed: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockYahooService = {
      getStockData: jest.fn(),
      validateSymbol: jest.fn(),
      handleError: jest.fn(),
      getCachedData: jest.fn(),
    } as any;

    mockAlphaVantageService = {
      getStockData: jest.fn(),
      validateSymbol: jest.fn(),
      handleError: jest.fn(),
      getCachedData: jest.fn(),
    } as any;

    MockYahooFinanceService.mockImplementation(() => mockYahooService);
    MockAlphaVantageService.mockImplementation(() => mockAlphaVantageService);

    manager = new DataSourceManager();
  });

  describe('getStockData', () => {
    const requestParams: UnifiedRequestParams = {
      symbol: 'AAPL',
      timeframe: 'daily',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };

    it('should use Yahoo Finance as primary source successfully', async () => {
      mockYahooService.getStockData.mockResolvedValue(mockYahooResponse);

      const result = await manager.getStockData(requestParams);

      expect(result.success).toBe(true);
      expect(result.source).toBe(DataSource.YAHOO_FINANCE);
      expect(result.fallbackUsed).toBeUndefined();
      expect(mockYahooService.getStockData).toHaveBeenCalledWith(
        'AAPL',
        'daily'
      );
      expect(mockAlphaVantageService.getStockData).not.toHaveBeenCalled();
    });

    it('should fallback to Alpha Vantage when Yahoo Finance fails', async () => {
      mockYahooService.getStockData.mockResolvedValue({
        ...mockYahooResponse,
        success: false,
        error: { type: 'NETWORK_ERROR', message: 'Network error' },
      });
      mockAlphaVantageService.getStockData.mockResolvedValue(
        mockAlphaVantageResponse
      );

      const result = await manager.getStockData(requestParams);

      expect(result.success).toBe(true);
      expect(result.source).toBe(DataSource.ALPHA_VANTAGE);
      expect(result.fallbackUsed).toBe(true);
      expect(mockYahooService.getStockData).toHaveBeenCalledWith(
        'AAPL',
        'daily'
      );
      expect(mockAlphaVantageService.getStockData).toHaveBeenCalledWith(
        'AAPL',
        'daily'
      );
    });

    it('should handle both sources failing', async () => {
      const errorResponse = {
        success: false,
        error: { type: 'NETWORK_ERROR', message: 'Network error' },
      };

      mockYahooService.getStockData.mockResolvedValue(errorResponse);
      mockAlphaVantageService.getStockData.mockResolvedValue(errorResponse);

      const result = await manager.getStockData(requestParams);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Both sources failed');
      expect(mockYahooService.getStockData).toHaveBeenCalled();
      expect(mockAlphaVantageService.getStockData).toHaveBeenCalled();
    });

    it('should handle batch ticker processing', async () => {
      const tickers = ['AAPL', 'MSFT', 'GOOGL'];
      mockYahooService.getStockData.mockResolvedValue(mockYahooResponse);

      const results = await Promise.all(
        tickers.map(ticker =>
          manager.getStockData({ ...requestParams, symbol: ticker })
        )
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.source).toBe(DataSource.YAHOO_FINANCE);
      });
      expect(mockYahooService.getStockData).toHaveBeenCalledTimes(3);
    });

    it('should handle deep historical data requests', async () => {
      const deepHistoricalResponse = {
        ...mockYahooResponse,
        data: Array.from({ length: 4000 }, (_, i) => ({
          date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
          open: 150.0,
          high: 155.5,
          low: 149.25,
          close: 153.75,
          volume: 1000000,
        })),
        metadata: {
          ...mockYahooResponse.metadata,
          dataPoints: 4000,
        },
      };

      mockYahooService.getStockData.mockResolvedValue(deepHistoricalResponse);

      const result = await manager.getStockData({
        ...requestParams,
        startDate: '2010-01-01',
        endDate: '2024-12-31',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(4000);
      expect(result.metadata.dataPoints).toBe(4000);
    });

    it('should respect fallback delay configuration', async () => {
      jest.useFakeTimers();

      mockYahooService.getStockData.mockResolvedValue({
        ...mockYahooResponse,
        success: false,
        error: { type: 'NETWORK_ERROR', message: 'Network error' },
      });
      mockAlphaVantageService.getStockData.mockResolvedValue(
        mockAlphaVantageResponse
      );

      const getStockDataPromise = manager.getStockData(requestParams);

      // Fast-forward time to simulate delay
      jest.advanceTimersByTime(1000);

      const result = await getStockDataPromise;

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(mockAlphaVantageService.getStockData).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should handle different timeframes correctly', async () => {
      const timeframes = ['daily', 'weekly', 'monthly'];
      mockYahooService.getStockData.mockResolvedValue(mockYahooResponse);

      for (const timeframe of timeframes) {
        await manager.getStockData({ ...requestParams, timeframe });
        expect(mockYahooService.getStockData).toHaveBeenCalledWith(
          'AAPL',
          timeframe
        );
      }
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when both sources are working', async () => {
      mockYahooService.getStockData.mockResolvedValue(mockYahooResponse);
      mockAlphaVantageService.getStockData.mockResolvedValue(
        mockAlphaVantageResponse
      );

      const health = await manager.healthCheck();

      expect(health.status).toBe('ok');
      expect(health.sources.yahoo_finance.status).toBe('ok');
      expect(health.sources.alpha_vantage.status).toBe('ok');
      expect(health.sources.yahoo_finance.responseTime).toBeGreaterThan(0);
      expect(health.sources.alpha_vantage.responseTime).toBeGreaterThan(0);
    });

    it('should return error status when primary source is down', async () => {
      mockYahooService.getStockData.mockResolvedValue({
        ...mockYahooResponse,
        success: false,
        error: { type: 'NETWORK_ERROR', message: 'Network error' },
      });
      mockAlphaVantageService.getStockData.mockResolvedValue(
        mockAlphaVantageResponse
      );

      const health = await manager.healthCheck();

      expect(health.status).toBe('error');
      expect(health.sources.yahoo_finance.status).toBe('error');
      expect(health.sources.alpha_vantage.status).toBe('ok');
    });

    it('should return error status when both sources are down', async () => {
      const errorResponse = {
        success: false,
        error: { type: 'NETWORK_ERROR', message: 'Network error' },
      };

      mockYahooService.getStockData.mockResolvedValue(errorResponse);
      mockAlphaVantageService.getStockData.mockResolvedValue(errorResponse);

      const health = await manager.healthCheck();

      expect(health.status).toBe('error');
      expect(health.sources.yahoo_finance.status).toBe('error');
      expect(health.sources.alpha_vantage.status).toBe('error');
    });

    it('should include fallback statistics', async () => {
      mockYahooService.getStockData.mockResolvedValue(mockYahooResponse);
      mockAlphaVantageService.getStockData.mockResolvedValue(
        mockAlphaVantageResponse
      );

      const health = await manager.healthCheck();

      expect(health.fallbackStats).toBeDefined();
      expect(health.fallbackStats.totalRequests).toBeGreaterThanOrEqual(0);
      expect(health.fallbackStats.successRate).toBeGreaterThanOrEqual(0);
      expect(health.fallbackStats.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('error handling', () => {
    it('should handle Yahoo Finance service errors', async () => {
      mockYahooService.getStockData.mockRejectedValue(
        new Error('Service unavailable')
      );
      mockAlphaVantageService.getStockData.mockResolvedValue(
        mockAlphaVantageResponse
      );

      const result = await manager.getStockData({
        symbol: 'AAPL',
        timeframe: 'daily',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.source).toBe(DataSource.ALPHA_VANTAGE);
    });

    it('should handle Alpha Vantage service errors', async () => {
      mockYahooService.getStockData.mockResolvedValue({
        ...mockYahooResponse,
        success: false,
        error: { type: 'NETWORK_ERROR', message: 'Network error' },
      });
      mockAlphaVantageService.getStockData.mockRejectedValue(
        new Error('API key invalid')
      );

      const result = await manager.getStockData({
        symbol: 'AAPL',
        timeframe: 'daily',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      mockYahooService.getStockData.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );
      mockAlphaVantageService.getStockData.mockResolvedValue(
        mockAlphaVantageResponse
      );

      const result = await manager.getStockData({
        symbol: 'AAPL',
        timeframe: 'daily',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should respect primary source configuration', async () => {
      const customManager = new DataSourceManager({
        primarySource: DataSource.ALPHA_VANTAGE,
        enableFallback: true,
        fallbackDelay: 500,
        maxRetries: 2,
      });

      mockAlphaVantageService.getStockData.mockResolvedValue(
        mockAlphaVantageResponse
      );

      const result = await customManager.getStockData({
        symbol: 'AAPL',
        timeframe: 'daily',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.source).toBe(DataSource.ALPHA_VANTAGE);
      expect(mockAlphaVantageService.getStockData).toHaveBeenCalled();
    });

    it('should disable fallback when configured', async () => {
      const customManager = new DataSourceManager({
        primarySource: DataSource.YAHOO_FINANCE,
        enableFallback: false,
      });

      mockYahooService.getStockData.mockResolvedValue({
        ...mockYahooResponse,
        success: false,
        error: { type: 'NETWORK_ERROR', message: 'Network error' },
      });

      const result = await customManager.getStockData({
        symbol: 'AAPL',
        timeframe: 'daily',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.success).toBe(false);
      expect(mockAlphaVantageService.getStockData).not.toHaveBeenCalled();
    });
  });

  describe('performance and caching', () => {
    it('should use cache when available', async () => {
      mockYahooService.getCachedData.mockReturnValue(mockYahooResponse);

      const result = await manager.getStockData({
        symbol: 'AAPL',
        timeframe: 'daily',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.success).toBe(true);
      expect(mockYahooService.getStockData).not.toHaveBeenCalled();
      expect(mockYahooService.getCachedData).toHaveBeenCalled();
    });

    it('should handle concurrent requests efficiently', async () => {
      mockYahooService.getStockData.mockResolvedValue(mockYahooResponse);

      const startTime = Date.now();
      const promises = Array.from({ length: 10 }, () =>
        manager.getStockData({
          symbol: 'AAPL',
          timeframe: 'daily',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('data validation', () => {
    it('should validate input parameters', async () => {
      const invalidParams = [
        { symbol: '', timeframe: 'daily' },
        { symbol: 'AAPL', timeframe: 'invalid' },
        { symbol: 'INVALID123', timeframe: 'daily' },
      ];

      for (const params of invalidParams) {
        await expect(manager.getStockData(params as any)).rejects.toThrow();
      }
    });

    it('should validate date ranges', async () => {
      const invalidDateRanges = [
        { startDate: '2024-12-31', endDate: '2024-01-01' }, // End before start
        { startDate: 'invalid-date', endDate: '2024-12-31' }, // Invalid start date
        { startDate: '2024-01-01', endDate: 'invalid-date' }, // Invalid end date
      ];

      for (const dateRange of invalidDateRanges) {
        await expect(
          manager.getStockData({
            symbol: 'AAPL',
            timeframe: 'daily',
            ...dateRange,
          })
        ).rejects.toThrow();
      }
    });
  });
});
