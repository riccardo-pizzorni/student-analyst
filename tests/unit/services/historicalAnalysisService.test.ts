import {
  aggregatePortfolioData,
  calculateBollingerBands,
  calculateDrawdown,
  calculateMACD,
  calculatePerformanceMetrics,
  calculateRSI,
  calculateSMA,
  identifyMarketPhases,
  processHistoricalData,
  validateHistoricalData,
} from '@/services/historicalAnalysisService';

describe('Historical Analysis Service', () => {
  const mockHistoricalData = {
    AAPL: [
      {
        date: '2024-01-01',
        open: 150.0,
        high: 155.5,
        low: 149.25,
        close: 153.75,
        volume: 1000000,
      },
      {
        date: '2024-01-02',
        open: 153.75,
        high: 158.0,
        low: 152.5,
        close: 156.25,
        volume: 1200000,
      },
      {
        date: '2024-01-03',
        open: 156.25,
        high: 159.75,
        low: 154.0,
        close: 157.5,
        volume: 1100000,
      },
      {
        date: '2024-01-04',
        open: 157.5,
        high: 162.0,
        low: 156.25,
        close: 160.75,
        volume: 1300000,
      },
      {
        date: '2024-01-05',
        open: 160.75,
        high: 165.25,
        low: 159.5,
        close: 163.25,
        volume: 1400000,
      },
    ],
    GOOGL: [
      {
        date: '2024-01-01',
        open: 2500.0,
        high: 2550.0,
        low: 2490.0,
        close: 2520.0,
        volume: 500000,
      },
      {
        date: '2024-01-02',
        open: 2520.0,
        high: 2580.0,
        low: 2510.0,
        close: 2560.0,
        volume: 600000,
      },
      {
        date: '2024-01-03',
        open: 2560.0,
        high: 2610.0,
        low: 2540.0,
        close: 2590.0,
        volume: 550000,
      },
      {
        date: '2024-01-04',
        open: 2590.0,
        high: 2650.0,
        low: 2570.0,
        close: 2620.0,
        volume: 650000,
      },
      {
        date: '2024-01-05',
        open: 2620.0,
        high: 2680.0,
        low: 2600.0,
        close: 2650.0,
        volume: 700000,
      },
    ],
  };

  describe('calculateSMA', () => {
    it('should calculate SMA correctly for period 3', () => {
      const prices = [150.0, 153.75, 156.25, 157.5, 160.75];
      const sma3 = calculateSMA(prices, 3);

      expect(sma3).toEqual([
        null,
        null, // First two values are null
        153.33, // (150 + 153.75 + 156.25) / 3
        155.83, // (153.75 + 156.25 + 157.50) / 3
        158.17, // (156.25 + 157.50 + 160.75) / 3
      ]);
    });

    it('should calculate SMA correctly for period 5', () => {
      const prices = [150.0, 153.75, 156.25, 157.5, 160.75];
      const sma5 = calculateSMA(prices, 5);

      expect(sma5).toEqual([
        null,
        null,
        null,
        null, // First four values are null
        155.65, // (150 + 153.75 + 156.25 + 157.50 + 160.75) / 5
      ]);
    });

    it('should handle empty array', () => {
      const sma = calculateSMA([], 5);
      expect(sma).toEqual([]);
    });

    it('should handle array shorter than period', () => {
      const prices = [150.0, 153.75];
      const sma = calculateSMA(prices, 5);
      expect(sma).toEqual([null, null]);
    });

    it('should handle period 1', () => {
      const prices = [150.0, 153.75, 156.25];
      const sma = calculateSMA(prices, 1);
      expect(sma).toEqual([150.0, 153.75, 156.25]);
    });
  });

  describe('calculateRSI', () => {
    it('should calculate RSI correctly for period 14', () => {
      const prices = [
        150.0, 153.75, 156.25, 157.5, 160.75, 163.25, 165.0, 167.5, 169.25,
        171.0, 173.5, 175.25, 177.0, 179.5, 181.25, 183.0,
      ];
      const rsi = calculateRSI(prices, 14);

      // RSI should be calculated for the last value
      expect(rsi[rsi.length - 1]).toBeGreaterThan(50); // Trending up
      expect(rsi[rsi.length - 1]).toBeLessThan(100);
    });

    it('should handle array shorter than period', () => {
      const prices = [150.0, 153.75, 156.25];
      const rsi = calculateRSI(prices, 14);
      expect(rsi).toEqual([null, null, null]);
    });

    it('should handle all gains', () => {
      const prices = [
        100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113,
        114,
      ];
      const rsi = calculateRSI(prices, 14);
      expect(rsi[rsi.length - 1]).toBeCloseTo(100, 0);
    });

    it('should handle all losses', () => {
      const prices = [
        100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86,
      ];
      const rsi = calculateRSI(prices, 14);
      expect(rsi[rsi.length - 1]).toBeCloseTo(0, 0);
    });
  });

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const prices = [
        150.0, 153.75, 156.25, 157.5, 160.75, 163.25, 165.0, 167.5, 169.25,
        171.0, 173.5, 175.25, 177.0, 179.5, 181.25, 183.0, 185.5, 187.25, 189.0,
        191.5,
      ];
      const { upper, middle, lower } = calculateBollingerBands(prices, 20, 2);

      expect(upper.length).toBe(prices.length);
      expect(middle.length).toBe(prices.length);
      expect(lower.length).toBe(prices.length);

      // First 19 values should be null
      for (let i = 0; i < 19; i++) {
        expect(upper[i]).toBeNull();
        expect(middle[i]).toBeNull();
        expect(lower[i]).toBeNull();
      }

      // Last value should have calculated bands
      expect(upper[19]).toBeGreaterThan(middle[19]);
      expect(middle[19]).toBeGreaterThan(lower[19]);
      expect(upper[19] - lower[19]).toBeGreaterThan(0);
    });

    it('should handle array shorter than period', () => {
      const prices = [150.0, 153.75, 156.25];
      const bands = calculateBollingerBands(prices, 20, 2);

      expect(bands.upper).toEqual([null, null, null]);
      expect(bands.middle).toEqual([null, null, null]);
      expect(bands.lower).toEqual([null, null, null]);
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD correctly', () => {
      const prices = [
        150.0, 153.75, 156.25, 157.5, 160.75, 163.25, 165.0, 167.5, 169.25,
        171.0, 173.5, 175.25, 177.0, 179.5, 181.25, 183.0, 185.5, 187.25, 189.0,
        191.5, 193.25, 195.0, 197.5, 199.25, 201.0, 203.5,
      ];
      const { macd, signal, histogram } = calculateMACD(prices);

      expect(macd.length).toBe(prices.length);
      expect(signal.length).toBe(prices.length);
      expect(histogram.length).toBe(prices.length);

      // First values should be null
      expect(macd[0]).toBeNull();
      expect(signal[0]).toBeNull();
      expect(histogram[0]).toBeNull();

      // Later values should be calculated
      expect(macd[macd.length - 1]).not.toBeNull();
      expect(signal[signal.length - 1]).not.toBeNull();
      expect(histogram[histogram.length - 1]).not.toBeNull();
    });

    it('should handle array shorter than required period', () => {
      const prices = [150.0, 153.75, 156.25];
      const macd = calculateMACD(prices);

      expect(macd.macd).toEqual([null, null, null]);
      expect(macd.signal).toEqual([null, null, null]);
      expect(macd.histogram).toEqual([null, null, null]);
    });
  });

  describe('calculatePerformanceMetrics', () => {
    it('should calculate performance metrics correctly', () => {
      const prices = [100, 105, 110, 108, 115, 120, 118, 125, 130, 128];
      const metrics = calculatePerformanceMetrics(prices);

      expect(metrics.totalReturn).toBeCloseTo(28, 1); // (128 - 100) / 100 * 100
      expect(metrics.annualizedReturn).toBeGreaterThan(0);
      expect(metrics.volatility).toBeGreaterThan(0);
      expect(metrics.sharpeRatio).toBeDefined();
      expect(metrics.maxDrawdown).toBeLessThan(0);
      expect(metrics.calmarRatio).toBeDefined();
    });

    it('should handle single price', () => {
      const prices = [100];
      const metrics = calculatePerformanceMetrics(prices);

      expect(metrics.totalReturn).toBe(0);
      expect(metrics.annualizedReturn).toBe(0);
      expect(metrics.volatility).toBe(0);
      expect(metrics.sharpeRatio).toBe(0);
      expect(metrics.maxDrawdown).toBe(0);
      expect(metrics.calmarRatio).toBe(0);
    });

    it('should handle declining prices', () => {
      const prices = [100, 95, 90, 85, 80];
      const metrics = calculatePerformanceMetrics(prices);

      expect(metrics.totalReturn).toBeLessThan(0);
      expect(metrics.maxDrawdown).toBeLessThan(0);
    });
  });

  describe('calculateDrawdown', () => {
    it('should calculate drawdown correctly', () => {
      const prices = [100, 110, 105, 120, 115, 130, 125, 140, 135, 150];
      const drawdown = calculateDrawdown(prices);

      expect(drawdown.maxDrawdown).toBeLessThan(0);
      expect(drawdown.maxDrawdownPercentage).toBeLessThan(0);
      expect(drawdown.drawdownPeriods.length).toBeGreaterThan(0);

      // Check that drawdown periods have correct structure
      if (drawdown.drawdownPeriods.length > 0) {
        const period = drawdown.drawdownPeriods[0];
        expect(period.startIndex).toBeGreaterThanOrEqual(0);
        expect(period.endIndex).toBeGreaterThan(period.startIndex);
        expect(period.drawdown).toBeLessThan(0);
      }
    });

    it('should handle continuously rising prices', () => {
      const prices = [100, 105, 110, 115, 120];
      const drawdown = calculateDrawdown(prices);

      expect(drawdown.maxDrawdown).toBe(0);
      expect(drawdown.maxDrawdownPercentage).toBe(0);
      expect(drawdown.drawdownPeriods).toEqual([]);
    });
  });

  describe('identifyMarketPhases', () => {
    it('should identify market phases correctly', () => {
      const prices = [
        100, 105, 110, 108, 115, 120, 118, 125, 130, 128, 135, 140, 138, 145,
        150,
      ];
      const phases = identifyMarketPhases(prices);

      expect(phases.length).toBeGreaterThan(0);

      phases.forEach(phase => {
        expect(phase.type).toMatch(/^(bull|bear|sideways)$/);
        expect(phase.startIndex).toBeGreaterThanOrEqual(0);
        expect(phase.endIndex).toBeGreaterThan(phase.startIndex);
        expect(phase.duration).toBeGreaterThan(0);
        expect(phase.return).toBeDefined();
      });
    });

    it('should handle short price series', () => {
      const prices = [100, 105, 110];
      const phases = identifyMarketPhases(prices);

      expect(phases.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('aggregatePortfolioData', () => {
    it('should aggregate portfolio data correctly', () => {
      const portfolioData = {
        AAPL: { weight: 0.6, data: mockHistoricalData['AAPL'] },
        GOOGL: { weight: 0.4, data: mockHistoricalData['GOOGL'] },
      };

      const aggregated = aggregatePortfolioData(portfolioData);

      expect(aggregated.labels).toHaveLength(5); // 5 dates
      expect(aggregated.datasets).toHaveLength(1); // 1 portfolio dataset
      expect(aggregated.metadata).toBeDefined();
      expect(aggregated.metadata.symbols).toEqual(['AAPL', 'GOOGL']);
      expect(aggregated.metadata.weights).toEqual([0.6, 0.4]);
    });

    it('should handle single asset portfolio', () => {
      const portfolioData = {
        AAPL: { weight: 1.0, data: mockHistoricalData['AAPL'] },
      };

      const aggregated = aggregatePortfolioData(portfolioData);

      expect(aggregated.labels).toHaveLength(5);
      expect(aggregated.datasets).toHaveLength(1);
      expect(aggregated.metadata.symbols).toEqual(['AAPL']);
      expect(aggregated.metadata.weights).toEqual([1.0]);
    });

    it('should handle empty portfolio', () => {
      const portfolioData = {};

      const aggregated = aggregatePortfolioData(portfolioData);

      expect(aggregated.labels).toEqual([]);
      expect(aggregated.datasets).toEqual([]);
      expect(aggregated.metadata.symbols).toEqual([]);
      expect(aggregated.metadata.weights).toEqual([]);
    });
  });

  describe('validateHistoricalData', () => {
    it('should validate correct data', () => {
      const data = mockHistoricalData['AAPL'];
      const result = validateHistoricalData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing required fields', () => {
      const invalidData = [
        { date: '2024-01-01', open: 150.0, high: 155.5, low: 149.25 }, // Missing close and volume
        {
          date: '2024-01-02',
          open: 153.75,
          high: 158.0,
          low: 152.5,
          close: 156.25,
          volume: 1200000,
        },
      ];

      const result = validateHistoricalData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('missing required field');
    });

    it('should detect invalid price values', () => {
      const invalidData = [
        {
          date: '2024-01-01',
          open: -150.0,
          high: 155.5,
          low: 149.25,
          close: 153.75,
          volume: 1000000,
        },
        {
          date: '2024-01-02',
          open: 153.75,
          high: 158.0,
          low: 152.5,
          close: 156.25,
          volume: 1200000,
        },
      ];

      const result = validateHistoricalData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('negative price');
    });

    it('should detect invalid volume values', () => {
      const invalidData = [
        {
          date: '2024-01-01',
          open: 150.0,
          high: 155.5,
          low: 149.25,
          close: 153.75,
          volume: -1000000,
        },
        {
          date: '2024-01-02',
          open: 153.75,
          high: 158.0,
          low: 152.5,
          close: 156.25,
          volume: 1200000,
        },
      ];

      const result = validateHistoricalData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('negative volume');
    });

    it('should detect invalid OHLC relationships', () => {
      const invalidData = [
        {
          date: '2024-01-01',
          open: 150.0,
          high: 145.5,
          low: 149.25,
          close: 153.75,
          volume: 1000000,
        }, // High < Low
        {
          date: '2024-01-02',
          open: 153.75,
          high: 158.0,
          low: 152.5,
          close: 156.25,
          volume: 1200000,
        },
      ];

      const result = validateHistoricalData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('OHLC relationship');
    });

    it('should handle empty data', () => {
      const result = validateHistoricalData([]);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('empty data');
    });
  });

  describe('processHistoricalData', () => {
    it('should process valid historical data correctly', () => {
      const result = processHistoricalData(mockHistoricalData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.labels).toHaveLength(5);
      expect(result.data.datasets.length).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.indicators).toBeDefined();
    });

    it('should handle invalid data', () => {
      const invalidData = {
        AAPL: [
          {
            date: '2024-01-01',
            open: -150.0,
            high: 155.5,
            low: 149.25,
            close: 153.75,
            volume: 1000000,
          },
        ],
      };

      const result = processHistoricalData(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('should handle empty data', () => {
      const result = processHistoricalData({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('No data provided');
    });

    it('should calculate all indicators when requested', () => {
      const result = processHistoricalData(mockHistoricalData, {
        calculateSMA: true,
        calculateRSI: true,
        calculateBollingerBands: true,
        calculateMACD: true,
      });

      expect(result.success).toBe(true);
      expect(result.indicators.sma).toBeDefined();
      expect(result.indicators.rsi).toBeDefined();
      expect(result.indicators.bollingerBands).toBeDefined();
      expect(result.indicators.macd).toBeDefined();
    });

    it('should handle single symbol data', () => {
      const singleSymbolData = {
        AAPL: mockHistoricalData['AAPL'],
      };

      const result = processHistoricalData(singleSymbolData);

      expect(result.success).toBe(true);
      expect(result.data.datasets.length).toBe(1);
      expect(result.metadata.symbols).toEqual(['AAPL']);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values', () => {
      const dataWithNulls = [
        {
          date: '2024-01-01',
          open: 150.0,
          high: 155.5,
          low: 149.25,
          close: 153.75,
          volume: 1000000,
        },
        {
          date: '2024-01-02',
          open: null,
          high: 158.0,
          low: 152.5,
          close: 156.25,
          volume: 1200000,
        },
      ];

      const result = validateHistoricalData(dataWithNulls);
      expect(result.isValid).toBe(false);
    });

    it('should handle very large numbers', () => {
      const largeData = [
        {
          date: '2024-01-01',
          open: 1e6,
          high: 1.1e6,
          low: 0.9e6,
          close: 1.05e6,
          volume: 1e9,
        },
      ];

      const result = validateHistoricalData(largeData);
      expect(result.isValid).toBe(true);
    });

    it('should handle very small numbers', () => {
      const smallData = [
        {
          date: '2024-01-01',
          open: 0.001,
          high: 0.002,
          low: 0.0005,
          close: 0.0015,
          volume: 1000,
        },
      ];

      const result = validateHistoricalData(smallData);
      expect(result.isValid).toBe(true);
    });

    it('should handle duplicate dates', () => {
      const duplicateData = [
        {
          date: '2024-01-01',
          open: 150.0,
          high: 155.5,
          low: 149.25,
          close: 153.75,
          volume: 1000000,
        },
        {
          date: '2024-01-01',
          open: 153.75,
          high: 158.0,
          low: 152.5,
          close: 156.25,
          volume: 1200000,
        },
      ];

      const result = validateHistoricalData(duplicateData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('duplicate date');
    });
  });

  describe('Yahoo Finance Integration', () => {
    const yahooFinanceDeepData = {
      AAPL: Array.from({ length: 4000 }, (_, i) => ({
        date: `2020-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        open: 150.0 + Math.random() * 10,
        high: 155.0 + Math.random() * 10,
        low: 145.0 + Math.random() * 10,
        close: 152.0 + Math.random() * 10,
        volume: 1000000 + Math.floor(Math.random() * 500000),
      })),
    };

    const yahooFinanceBatchData = {
      AAPL: Array.from({ length: 1000 }, (_, i) => ({
        date: `2023-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        open: 150.0 + Math.random() * 10,
        high: 155.0 + Math.random() * 10,
        low: 145.0 + Math.random() * 10,
        close: 152.0 + Math.random() * 10,
        volume: 1000000 + Math.floor(Math.random() * 500000),
      })),
      MSFT: Array.from({ length: 1000 }, (_, i) => ({
        date: `2023-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        open: 300.0 + Math.random() * 20,
        high: 310.0 + Math.random() * 20,
        low: 290.0 + Math.random() * 20,
        close: 305.0 + Math.random() * 20,
        volume: 800000 + Math.floor(Math.random() * 400000),
      })),
      GOOGL: Array.from({ length: 1000 }, (_, i) => ({
        date: `2023-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        open: 2500.0 + Math.random() * 100,
        high: 2550.0 + Math.random() * 100,
        low: 2450.0 + Math.random() * 100,
        close: 2520.0 + Math.random() * 100,
        volume: 500000 + Math.floor(Math.random() * 300000),
      })),
    };

    describe('Deep Historical Data Processing (15+ Years)', () => {
      it('should process 4000+ data points correctly', () => {
        const result = processHistoricalData(yahooFinanceDeepData);

        expect(result.success).toBe(true);
        expect(result.data.labels).toHaveLength(4000);
        expect(result.data.datasets[0].data).toHaveLength(4000);
        expect(result.metadata.dataPoints).toBe(4000);
        expect(result.metadata.symbols).toEqual(['AAPL']);
      });

      it('should calculate indicators for deep historical data', () => {
        const result = processHistoricalData(yahooFinanceDeepData, {
          calculateSMA: true,
          calculateRSI: true,
          calculateBollingerBands: true,
        });

        expect(result.success).toBe(true);
        expect(result.indicators.sma).toBeDefined();
        expect(result.indicators.sma[20]).toHaveLength(4000); // 20-period SMA
        expect(result.indicators.rsi).toBeDefined();
        expect(result.indicators.rsi[14]).toHaveLength(4000); // 14-period RSI
        expect(result.indicators.bollingerBands).toBeDefined();
        expect(result.indicators.bollingerBands[20]).toBeDefined();
      });

      it('should handle very long date ranges', () => {
        const longRangeData = {
          AAPL: Array.from({ length: 6000 }, (_, i) => ({
            date: `2010-${String(Math.floor(i / 365) + 1).padStart(2, '0')}-${String((i % 365) + 1).padStart(3, '0')}`,
            open: 150.0 + Math.random() * 10,
            high: 155.0 + Math.random() * 10,
            low: 145.0 + Math.random() * 10,
            close: 152.0 + Math.random() * 10,
            volume: 1000000 + Math.floor(Math.random() * 500000),
          })),
        };

        const result = processHistoricalData(longRangeData);

        expect(result.success).toBe(true);
        expect(result.data.labels).toHaveLength(6000);
        expect(result.metadata.dataPoints).toBe(6000);
        expect(result.metadata.dateRange.start).toContain('2010');
        expect(result.metadata.dateRange.end).toContain('2025');
      });

      it('should validate deep historical data quality', () => {
        const validationResult = validateHistoricalData(
          yahooFinanceDeepData.AAPL
        );

        expect(validationResult.isValid).toBe(true);
        expect(validationResult.dataPoints).toBe(4000);
        expect(validationResult.dateRange.start).toBeDefined();
        expect(validationResult.dateRange.end).toBeDefined();
        expect(validationResult.qualityScore).toBeGreaterThan(0.8);
      });
    });

    describe('Batch Ticker Processing', () => {
      it('should process multiple tickers with large datasets', () => {
        const result = processHistoricalData(yahooFinanceBatchData);

        expect(result.success).toBe(true);
        expect(result.data.datasets).toHaveLength(3);
        expect(result.metadata.symbols).toEqual(['AAPL', 'MSFT', 'GOOGL']);
        expect(result.metadata.totalDataPoints).toBe(3000);

        // Each dataset should have 1000 data points
        result.data.datasets.forEach(dataset => {
          expect(dataset.data).toHaveLength(1000);
        });
      });

      it('should calculate correlation matrix for batch data', () => {
        const result = processHistoricalData(yahooFinanceBatchData, {
          calculateCorrelation: true,
        });

        expect(result.success).toBe(true);
        expect(result.correlation).toBeDefined();
        expect(result.correlation.matrix).toHaveLength(3);
        expect(result.correlation.matrix[0]).toHaveLength(3);
        expect(result.correlation.symbols).toEqual(['AAPL', 'MSFT', 'GOOGL']);
      });

      it('should handle mixed data quality in batch', () => {
        const mixedQualityData = {
          ...yahooFinanceBatchData,
          INVALID: [
            {
              date: '2023-01-01',
              open: -150.0, // Invalid negative price
              high: 155.5,
              low: 149.25,
              close: 153.75,
              volume: 1000000,
            },
          ],
        };

        const result = processHistoricalData(mixedQualityData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('validation failed');
        expect(result.error).toContain('INVALID');
      });

      it('should aggregate portfolio metrics for batch data', () => {
        const result = aggregatePortfolioData(yahooFinanceBatchData);

        expect(result.success).toBe(true);
        expect(result.portfolioMetrics).toBeDefined();
        expect(result.portfolioMetrics.totalValue).toBeGreaterThan(0);
        expect(result.portfolioMetrics.weightedReturn).toBeDefined();
        expect(result.portfolioMetrics.volatility).toBeDefined();
        expect(result.portfolioMetrics.sharpeRatio).toBeDefined();
      });
    });

    describe('Fallback System Integration', () => {
      it('should handle Alpha Vantage fallback data format', () => {
        const alphaVantageData = {
          AAPL: Array.from({ length: 100 }, (_, i) => ({
            date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
            open: 150.0 + Math.random() * 10,
            high: 155.0 + Math.random() * 10,
            low: 145.0 + Math.random() * 10,
            close: 152.0 + Math.random() * 10,
            volume: 1000000 + Math.floor(Math.random() * 500000),
            source: 'alpha_vantage',
            fallbackUsed: true,
          })),
        };

        const result = processHistoricalData(alphaVantageData);

        expect(result.success).toBe(true);
        expect(result.metadata.source).toBe('alpha_vantage');
        expect(result.metadata.fallbackUsed).toBe(true);
      });

      it('should validate fallback data quality', () => {
        const fallbackData = Array.from({ length: 100 }, (_, i) => ({
          date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
          open: 150.0 + Math.random() * 10,
          high: 155.0 + Math.random() * 10,
          low: 145.0 + Math.random() * 10,
          close: 152.0 + Math.random() * 10,
          volume: 1000000 + Math.floor(Math.random() * 500000),
        }));

        const validationResult = validateHistoricalData(fallbackData);

        expect(validationResult.isValid).toBe(true);
        expect(validationResult.dataPoints).toBe(100);
        expect(validationResult.qualityScore).toBeGreaterThan(0.7);
      });
    });

    describe('Performance and Memory Management', () => {
      it('should handle large datasets without memory issues', () => {
        const largeDataset = {
          AAPL: Array.from({ length: 10000 }, (_, i) => ({
            date: `2020-${String(Math.floor(i / 365) + 1).padStart(2, '0')}-${String((i % 365) + 1).padStart(3, '0')}`,
            open: 150.0 + Math.random() * 10,
            high: 155.0 + Math.random() * 10,
            low: 145.0 + Math.random() * 10,
            close: 152.0 + Math.random() * 10,
            volume: 1000000 + Math.floor(Math.random() * 500000),
          })),
        };

        const startTime = Date.now();
        const result = processHistoricalData(largeDataset);
        const endTime = Date.now();

        expect(result.success).toBe(true);
        expect(result.data.labels).toHaveLength(10000);
        expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      });

      it('should optimize calculations for deep historical data', () => {
        const deepData = {
          AAPL: Array.from({ length: 5000 }, (_, i) => ({
            date: `2020-${String(Math.floor(i / 365) + 1).padStart(2, '0')}-${String((i % 365) + 1).padStart(3, '0')}`,
            open: 150.0 + Math.random() * 10,
            high: 155.0 + Math.random() * 10,
            low: 145.0 + Math.random() * 10,
            close: 152.0 + Math.random() * 10,
            volume: 1000000 + Math.floor(Math.random() * 500000),
          })),
        };

        const startTime = Date.now();
        const result = processHistoricalData(deepData, {
          calculateSMA: true,
          calculateRSI: true,
          calculateBollingerBands: true,
          calculateMACD: true,
        });
        const endTime = Date.now();

        expect(result.success).toBe(true);
        expect(result.indicators.sma).toBeDefined();
        expect(result.indicators.rsi).toBeDefined();
        expect(result.indicators.bollingerBands).toBeDefined();
        expect(result.indicators.macd).toBeDefined();
        expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds
      });
    });

    describe('Data Source Metadata', () => {
      it('should include Yahoo Finance metadata', () => {
        const result = processHistoricalData(yahooFinanceDeepData);

        expect(result.success).toBe(true);
        expect(result.metadata.source).toBe('yahoo_finance');
        expect(result.metadata.lastRefreshed).toBeDefined();
        expect(result.metadata.dataPoints).toBe(4000);
        expect(result.metadata.symbols).toEqual(['AAPL']);
      });

      it('should handle source transitions (Yahoo to Alpha Vantage)', () => {
        const mixedSourceData = {
          AAPL: yahooFinanceDeepData.AAPL.map((point, index) => ({
            ...point,
            source: index < 2000 ? 'yahoo_finance' : 'alpha_vantage',
            fallbackUsed: index >= 2000,
          })),
        };

        const result = processHistoricalData(mixedSourceData);

        expect(result.success).toBe(true);
        expect(result.metadata.source).toBe('mixed');
        expect(result.metadata.fallbackUsed).toBe(true);
        expect(result.metadata.yahooFinancePoints).toBe(2000);
        expect(result.metadata.alphaVantagePoints).toBe(2000);
      });
    });
  });
});
