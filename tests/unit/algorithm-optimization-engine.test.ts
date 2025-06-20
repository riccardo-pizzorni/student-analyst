import AlgorithmOptimizationEngine from '../../src/services/AlgorithmOptimizationEngine';

// Mock performance.now
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

describe('AlgorithmOptimizationEngine', () => {
  let engine: AlgorithmOptimizationEngine;

  beforeEach(() => {
    engine = new AlgorithmOptimizationEngine();
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
  });

  afterEach(() => {
    engine.clearCaches();
  });

  describe('Construction and Initial State', () => {
    it('should create engine with empty caches and zero metrics', () => {
      const metrics = engine.getMetrics();
      
      expect(metrics.cacheHitRate).toBe(0);
      expect(metrics.averageComputeTime).toBe(0);
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.memoryUsage).toBe(0);
    });

    it('should provide immutable metrics object', () => {
      const metrics1 = engine.getMetrics();
      const metrics2 = engine.getMetrics();
      
      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe('Covariance Matrix Calculation', () => {
    it('should calculate covariance matrix correctly', async () => {
      const returns = [
        [0.1, 0.2, 0.15],
        [0.05, 0.12, 0.08]
      ];

      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100);

      const result = await engine.calculateOptimizedCovariance(returns);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].length).toBe(2);
      
      // Check symmetry
      expect(result[0][1]).toBe(result[1][0]);
    });

    it('should use cache for repeated calculations', async () => {
      const returns = [[0.1, 0.2], [0.05, 0.12]];

      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1050);

      const result1 = await engine.calculateOptimizedCovariance(returns);
      const result2 = await engine.calculateOptimizedCovariance(returns);

      expect(result1).toEqual(result2);
    });

    it('should handle empty returns array', async () => {
      const returns: number[][] = [];
      const result = await engine.calculateOptimizedCovariance(returns);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should record computation time correctly', async () => {
      const returns = [[0.1, 0.2], [0.05, 0.12]];

      mockPerformanceNow
        .mockReturnValueOnce(5000)
        .mockReturnValueOnce(5200);

      await engine.calculateOptimizedCovariance(returns);
      const metrics = engine.getMetrics();

      expect(metrics.averageComputeTime).toBe(200);
      expect(metrics.totalOperations).toBe(1);
    });
  });

  describe('Memoization', () => {
    it('should memoize function results', () => {
      const mockFn = jest.fn((x: number, y: number) => x + y);

      const result1 = engine.memoize(mockFn as unknown, 5, 3);
      const result2 = engine.memoize(mockFn as unknown, 5, 3);

      expect(result1).toBe(8);
      expect(result2).toBe(8);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should call function again with different arguments', () => {
      const mockFn = jest.fn((x: number) => x * 2);

      const result1 = engine.memoize(mockFn as unknown, 10);
      const result2 = engine.memoize(mockFn as unknown, 20);
      const result3 = engine.memoize(mockFn as unknown, 10);

      expect(result1).toBe(20);
      expect(result2).toBe(40);
      expect(result3).toBe(20);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle functions with no arguments', () => {
      const mockFn = jest.fn(() => 'constant');

      const result1 = engine.memoize(mockFn as unknown);
      const result2 = engine.memoize(mockFn as unknown);

      expect(result1).toBe('constant');
      expect(result2).toBe('constant');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should update cache hit rate with memoization', () => {
      const mockFn = jest.fn((x: number) => x);

      engine.memoize(mockFn as unknown, 1); // Miss
      let metrics = engine.getMetrics();
      expect(metrics.cacheHitRate).toBe(0);

      engine.memoize(mockFn as unknown, 1); // Hit
      metrics = engine.getMetrics();
      expect(metrics.cacheHitRate).toBe(0.5);
    });
  });

  describe('Cache Management', () => {
    it('should clear all caches', () => {
      const mockFn = jest.fn((x: number) => x);

      engine.memoize(mockFn as unknown, 1);
      engine.memoize(mockFn as unknown, 2);

      const metrics = engine.getMetrics();
      expect(metrics.totalOperations).toBe(2);

      engine.clearCaches();

      engine.memoize(mockFn as unknown, 1);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should handle cache TTL expiration', async () => {
      const returns = [[0.1, 0.2], [0.05, 0.12]];
      
      // Mock Date.now for TTL testing
      const originalDateNow = Date.now;
      Date.now = jest.fn()
        .mockReturnValueOnce(1000) // First cache set
        .mockReturnValueOnce(301001); // Beyond TTL (300000ms + 1)

      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100)
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(2150);

      // First calculation
      await engine.calculateOptimizedCovariance(returns);
      
      // Second calculation should miss cache due to TTL
      await engine.calculateOptimizedCovariance(returns);
      
      const metrics = engine.getMetrics();
      expect(metrics.totalOperations).toBe(2);
      
      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative returns', async () => {
      const returns = [
        [-0.1, 0.2, -0.05],
        [0.05, -0.12, 0.08]
      ];

      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100);

      const result = await engine.calculateOptimizedCovariance(returns);

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });

    it('should handle single return series', async () => {
      const returns = [[0.1, 0.2, 0.15]];

      mockPerformanceNow
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(2050);

      const result = await engine.calculateOptimizedCovariance(returns);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0][0]).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero variance case', async () => {
      const returns = [
        [0.1, 0.1, 0.1],
        [0.05, 0.12, 0.08]
      ];

      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100);

      const result = await engine.calculateOptimizedCovariance(returns);

      expect(result).toBeDefined();
      expect(result[0][0]).toBe(0);
    });

    it('should handle different length return series', async () => {
      const returns = [
        [0.1, 0.2, 0.15, 0.25],
        [0.05, 0.12, 0.08],
        [0.08, 0.18]
      ];

      mockPerformanceNow
        .mockReturnValueOnce(3000)
        .mockReturnValueOnce(3075);

      const result = await engine.calculateOptimizedCovariance(returns);

      expect(result).toBeDefined();
      expect(result.length).toBe(3);
      expect(result[0].length).toBe(3);
    });
  });
}); 