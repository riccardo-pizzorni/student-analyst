/**
 * STUDENT ANALYST - CacheAnalyticsEngine Unit Tests
 * Task 3.1 - Test completi per aumentare copertura da 19.13% a 80%+
 */

import { CacheAnalyticsEngine } from '../../src/services/CacheAnalyticsEngine';

describe('CacheAnalyticsEngine', () => {
  let engine: CacheAnalyticsEngine;

  beforeEach(() => {
    // Creo una nuova istanza per ogni test per garantire isolamento
    engine = new CacheAnalyticsEngine();
  });

  afterEach(() => {
    engine.reset();
  });

  describe('Initial State', () => {
    it('should start with empty metrics', () => {
      const metrics = engine.getMetrics();
      
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.hitRate).toBe(0);
      expect(Object.keys(metrics.lastAccessed).length).toBe(0);
    });

    it('should provide consistent initial state', () => {
      const metrics1 = engine.getMetrics();
      const metrics2 = engine.getMetrics();
      
      expect(metrics1).toEqual(metrics2);
      expect(metrics1.lastAccessed).not.toBe(metrics2.lastAccessed); // Different objects
    });
  });

  describe('Cache Hit Tracking', () => {
    it('should track single cache hit', () => {
      engine.trackCacheHit('test-key');
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.hitRate).toBe(1);
      expect(metrics.lastAccessed['test-key']).toBeDefined();
    });

    it('should track multiple cache hits', () => {
      engine.trackCacheHit('key1');
      engine.trackCacheHit('key2');
      engine.trackCacheHit('key3');
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(3);
      expect(metrics.misses).toBe(0);
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.hitRate).toBe(1);
    });

    it('should update lastAccessed timestamps', () => {
      const before = Date.now();
      engine.trackCacheHit('test-key');
      const after = Date.now();
      
      const metrics = engine.getMetrics();
      const timestamp = metrics.lastAccessed['test-key'];
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should handle multiple accesses to same key', () => {
      engine.trackCacheHit('same-key');
      const firstTimestamp = engine.getMetrics().lastAccessed['same-key'];
      
      // Small delay to ensure different timestamp
      setTimeout(() => {
        engine.trackCacheHit('same-key');
        const metrics = engine.getMetrics();
        expect(metrics.hits).toBe(2);
        expect(metrics.lastAccessed['same-key']).toBeGreaterThan(firstTimestamp);
      }, 10);
    });
  });

  describe('Cache Miss Tracking', () => {
    it('should track single cache miss', () => {
      engine.trackCacheMiss('missing-key');
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(1);
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.hitRate).toBe(0);
      expect(Object.keys(metrics.lastAccessed).length).toBe(0);
    });

    it('should track multiple cache misses', () => {
      engine.trackCacheMiss('key1');
      engine.trackCacheMiss('key2');
      engine.trackCacheMiss('key3');
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(3);
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.hitRate).toBe(0);
    });

    it('should not update lastAccessed for misses', () => {
      engine.trackCacheMiss('missing-key');
      
      const metrics = engine.getMetrics();
      expect(metrics.lastAccessed['missing-key']).toBeUndefined();
    });
  });

  describe('Hit Rate Calculation', () => {
    it('should calculate correct hit rate with mixed hits and misses', () => {
      engine.trackCacheHit('hit1');
      engine.trackCacheHit('hit2');
      engine.trackCacheMiss('miss1');
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.hitRate).toBeCloseTo(2/3, 5);
    });

    it('should handle 100% hit rate', () => {
      engine.trackCacheHit('key1');
      engine.trackCacheHit('key2');
      
      const metrics = engine.getMetrics();
      expect(metrics.hitRate).toBe(1);
    });

    it('should handle 0% hit rate', () => {
      engine.trackCacheMiss('key1');
      engine.trackCacheMiss('key2');
      
      const metrics = engine.getMetrics();
      expect(metrics.hitRate).toBe(0);
    });

    it('should handle 50% hit rate', () => {
      engine.trackCacheHit('hit');
      engine.trackCacheMiss('miss');
      
      const metrics = engine.getMetrics();
      expect(metrics.hitRate).toBe(0.5);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle realistic cache access pattern', () => {
      // Simulate user access pattern
      engine.trackCacheHit('user:123');
      engine.trackCacheHit('user:456');
      engine.trackCacheMiss('user:789');
      engine.trackCacheHit('user:123'); // Cache hit again
      engine.trackCacheMiss('user:999');
      engine.trackCacheHit('user:456'); // Cache hit again
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(4);
      expect(metrics.misses).toBe(2);
      expect(metrics.totalRequests).toBe(6);
      expect(metrics.hitRate).toBeCloseTo(4/6, 5);
      expect(Object.keys(metrics.lastAccessed)).toContain('user:123');
      expect(Object.keys(metrics.lastAccessed)).toContain('user:456');
      expect(Object.keys(metrics.lastAccessed)).not.toContain('user:789');
    });

    it('should handle high volume access pattern', () => {
      // Simulate many hits
      for (let i = 0; i < 100; i++) {
        engine.trackCacheHit(`key${i}`);
      }
      
      // Simulate some misses
      for (let i = 0; i < 20; i++) {
        engine.trackCacheMiss(`miss${i}`);
      }
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(100);
      expect(metrics.misses).toBe(20);
      expect(metrics.totalRequests).toBe(120);
      expect(metrics.hitRate).toBeCloseTo(100/120, 5);
      expect(Object.keys(metrics.lastAccessed).length).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty key strings', () => {
      engine.trackCacheHit('');
      engine.trackCacheMiss('');
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.lastAccessed['']).toBeDefined();
    });

    it('should handle very long key strings', () => {
      const longKey = 'a'.repeat(1000);
      engine.trackCacheHit(longKey);
      engine.trackCacheMiss(longKey);
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.lastAccessed[longKey]).toBeDefined();
    });

    it('should handle special characters in keys', () => {
      const specialKeys = ['key:with:colons', 'key-with-dashes', 'key.with.dots', 'key/with/slashes'];
      
      specialKeys.forEach(key => {
        engine.trackCacheHit(key);
      });
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(specialKeys.length);
      specialKeys.forEach(key => {
        expect(metrics.lastAccessed[key]).toBeDefined();
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics to initial state', () => {
      // Add some data
      engine.trackCacheHit('key1');
      engine.trackCacheHit('key2');
      engine.trackCacheMiss('key3');
      
      // Verify data exists
      let metrics = engine.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(Object.keys(metrics.lastAccessed).length).toBe(2);
      
      // Reset
      engine.reset();
      
      // Verify reset state
      metrics = engine.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.hitRate).toBe(0);
      expect(Object.keys(metrics.lastAccessed).length).toBe(0);
    });

    it('should allow normal operation after reset', () => {
      // Add data, reset, then add more data
      engine.trackCacheHit('before-reset');
      engine.reset();
      engine.trackCacheHit('after-reset');
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
      expect(metrics.lastAccessed['before-reset']).toBeUndefined();
      expect(metrics.lastAccessed['after-reset']).toBeDefined();
    });
  });

  describe('getMetrics() Immutability', () => {
    it('should return a fresh copy of lastAccessed each time', () => {
      engine.trackCacheHit('test');
      
      const metrics1 = engine.getMetrics();
      const metrics2 = engine.getMetrics();
      
      expect(metrics1.lastAccessed).toEqual(metrics2.lastAccessed);
      expect(metrics1.lastAccessed).not.toBe(metrics2.lastAccessed);
    });

    it('should not allow external modification of metrics', () => {
      engine.trackCacheHit('test');
      
      const metrics = engine.getMetrics();
      const originalHits = metrics.hits;
      
      // Try to modify returned metrics
      metrics.hits = 999;
      metrics.lastAccessed['new-key'] = Date.now();
      
      // Verify original data is unchanged
      const freshMetrics = engine.getMetrics();
      expect(freshMetrics.hits).toBe(originalHits);
      expect(freshMetrics.lastAccessed['new-key']).toBeUndefined();
    });
  });

  describe('Concurrent Access Simulation', () => {
    it('should handle rapid successive calls', () => {
      const testKey = 'rapid-access';
      
      // Simulate rapid access
      for (let i = 0; i < 10; i++) {
        engine.trackCacheHit(testKey);
      }
      
      const metrics = engine.getMetrics();
      expect(metrics.hits).toBe(10);
      expect(metrics.lastAccessed[testKey]).toBeDefined();
    });
  });
}); 