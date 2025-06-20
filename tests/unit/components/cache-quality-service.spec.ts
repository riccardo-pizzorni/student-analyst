import { beforeEach, describe, expect, it } from '@jest/globals';
import { CacheQualityService } from '../../../src/services/CacheQualityService';
import { TEST_CONFIG, TEST_METRICS } from './cache-quality-service.config';

describe('CacheQualityService', () => {
  let service: CacheQualityService;

  beforeEach(() => {
    service = new CacheQualityService(TEST_CONFIG);
  });

  it('should validate cache as valid with good metrics', async () => {
    service.updateMetrics(TEST_METRICS.good);
    const result = await service.validateCache();
    expect(result.isValid).toBe(true);
    expect(result.issues).toBeUndefined();
  });

  it('should detect low hit rate', async () => {
    service.updateMetrics(TEST_METRICS.badHitRate);
    const result = await service.validateCache();
    expect(result.isValid).toBe(false);
    expect(
      result.issues?.some(i => i.type === 'HIT_RATE_BELOW_THRESHOLD')
    ).toBe(true);
  });

  it('should detect high memory usage', async () => {
    service.updateMetrics(TEST_METRICS.badMemory);
    const result = await service.validateCache();
    expect(result.isValid).toBe(false);
    expect(
      result.issues?.some(i => i.type === 'MEMORY_USAGE_ABOVE_THRESHOLD')
    ).toBe(true);
  });

  it('should detect cache too old', async () => {
    service.updateMetrics(TEST_METRICS.old);
    const result = await service.validateCache();
    expect(result.isValid).toBe(false);
    expect(result.issues?.some(i => i.type === 'CACHE_TOO_OLD')).toBe(true);
  });

  it('should not validate cache if validation interval has not passed', async () => {
    service.updateMetrics(TEST_METRICS.good);
    const firstResult = await service.validateCache();
    expect(firstResult.isValid).toBe(true);

    // Aggiorna le metriche con valori cattivi
    service.updateMetrics(TEST_METRICS.badHitRate);

    // La seconda validazione dovrebbe essere saltata perché l'intervallo non è passato
    const secondResult = await service.validateCache();
    expect(secondResult.isValid).toBe(true);
  });

  it('should update metrics correctly', () => {
    const initialMetrics = service.getMetrics();
    expect(initialMetrics.hitRate).toBe(0);
    expect(initialMetrics.memoryUsage).toBe(0);

    service.updateMetrics(TEST_METRICS.good);
    const updatedMetrics = service.getMetrics();
    expect(updatedMetrics.hitRate).toBe(TEST_METRICS.good.hitRate);
    expect(updatedMetrics.memoryUsage).toBe(TEST_METRICS.good.memoryUsage);
  });
});
