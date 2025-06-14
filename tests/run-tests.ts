/**
 * STUDENT ANALYST - Test Runner
 * Executes all test suites for the cache system
 */

import { describe, expect, it } from '@jest/globals';
import { indexedDBCacheL3 } from '../src/services/IndexedDBCacheL3';
import { localStorageCacheL2 } from '../src/services/LocalStorageCacheL2';
import { memoryCacheL1 } from '../src/services/MemoryCacheL1';

// Import test suites
import './unit/cache.test';

// Global setup
beforeAll(async () => {
  // Initialize all caches
  await Promise.all([
    memoryCacheL1.initialize(),
    localStorageCacheL2.initialize(),
    indexedDBCacheL3.initialize()
  ]);
});

// Global cleanup
afterAll(async () => {
  // Clear all caches
  await Promise.all([
    memoryCacheL1.clear(),
    localStorageCacheL2.clear(),
    indexedDBCacheL3.clear()
  ]);
});

// Run tests
describe('Cache System Test Suite', () => {
  it('should run all test suites', async () => {
    // This is just a placeholder to ensure the test suite runs
    expect(true).toBe(true);
  });
}); 