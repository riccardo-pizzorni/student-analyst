# Test Utilities and Helper Functions

## Overview

This document provides detailed documentation for all test utilities and helper functions used in our testing system. These utilities are designed to ensure consistent, reliable, and maintainable tests across the entire codebase.

## Core Utilities

### Test Environment Setup

```typescript
// test-utils/environment.ts
export const setupTestEnvironment = () => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup fake timers
  jest.useFakeTimers();
  
  // Clear all caches
  clearAllCaches();
  
  // Reset all stores
  resetAllStores();
};

export const cleanupTestEnvironment = () => {
  // Restore real timers
  jest.useRealTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Cleanup all caches
  cleanupAllCaches();
  
  // Reset all stores
  resetAllStores();
};
```

### Mock Data Generators

```typescript
// test-utils/mock-data.ts
export const generateMockStockData = (options = {}) => ({
  symbol: options.symbol || 'AAPL',
  price: options.price || 150.00,
  volume: options.volume || 1000000,
  timestamp: options.timestamp || Date.now(),
  // ... other properties
});

export const generateMockPortfolio = (options = {}) => ({
  id: options.id || 'test-portfolio',
  name: options.name || 'Test Portfolio',
  holdings: options.holdings || [],
  // ... other properties
});
```

### Cache Testing Utilities

```typescript
// test-utils/cache.ts
export const clearAllCaches = async () => {
  await MemoryCacheL1.clear();
  await LocalStorageCacheL2.clear();
  await IndexedDBCacheL3.clear();
};

export const verifyCacheConsistency = async (key, expectedValue) => {
  const l1Value = await MemoryCacheL1.get(key);
  const l2Value = await LocalStorageCacheL2.get(key);
  const l3Value = await IndexedDBCacheL3.get(key);
  
  expect(l1Value).toEqual(expectedValue);
  expect(l2Value).toEqual(expectedValue);
  expect(l3Value).toEqual(expectedValue);
};
```

### Financial Calculation Testing

```typescript
// test-utils/financial.ts
export const verifyCalculationPrecision = (actual, expected, precision = 0.0001) => {
  expect(Math.abs(actual - expected)).toBeLessThan(precision);
};

export const generateTestMarketData = (options = {}) => ({
  prices: options.prices || [],
  volumes: options.volumes || [],
  timestamps: options.timestamps || [],
  // ... other properties
});
```

### API Mocking Utilities

```typescript
// test-utils/api-mocks.ts
export const mockAlphaVantageAPI = () => {
  jest.mock('../api/alpha-vantage', () => ({
    fetchStockData: jest.fn().mockResolvedValue(mockStockData),
    fetchMarketData: jest.fn().mockResolvedValue(mockMarketData),
    // ... other methods
  }));
};

export const mockYahooFinanceAPI = () => {
  jest.mock('../api/yahoo-finance', () => ({
    fetchStockData: jest.fn().mockResolvedValue(mockStockData),
    fetchMarketData: jest.fn().mockResolvedValue(mockMarketData),
    // ... other methods
  }));
};
```

### Error Testing Utilities

```typescript
// test-utils/error.ts
export const verifyErrorHandling = async (operation, expectedError) => {
  await expect(operation()).rejects.toThrow(expectedError);
};

export const verifyErrorRecovery = async (operation, recoveryOperation) => {
  try {
    await operation();
  } catch (error) {
    await recoveryOperation();
    expect(error).toBeDefined();
  }
};
```

## Performance Testing Utilities

### Load Testing

```typescript
// test-utils/performance.ts
export const measureOperationTime = async (operation) => {
  const start = performance.now();
  await operation();
  const end = performance.now();
  return end - start;
};

export const verifyPerformanceThreshold = async (operation, maxTime) => {
  const time = await measureOperationTime(operation);
  expect(time).toBeLessThan(maxTime);
};
```

### Memory Testing

```typescript
// test-utils/memory.ts
export const measureMemoryUsage = () => {
  const used = process.memoryUsage();
  return {
    heapUsed: used.heapUsed,
    heapTotal: used.heapTotal,
    external: used.external,
    rss: used.rss
  };
};

export const verifyMemoryThreshold = (maxHeapUsed) => {
  const { heapUsed } = measureMemoryUsage();
  expect(heapUsed).toBeLessThan(maxHeapUsed);
};
```

## E2E Testing Utilities

### Browser Testing

```typescript
// test-utils/browser.ts
export const setupBrowser = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  return { browser, page };
};

export const cleanupBrowser = async (browser) => {
  await browser.close();
};
```

### User Interaction Testing

```typescript
// test-utils/interaction.ts
export const simulateUserInput = async (page, selector, value) => {
  await page.type(selector, value);
};

export const verifyElementState = async (page, selector, expectedState) => {
  const element = await page.$(selector);
  expect(element).toBeDefined();
  // ... verify state
};
```

## Test Data Management

### Data Factories

```typescript
// test-utils/factories.ts
export const createTestUser = (options = {}) => ({
  id: options.id || 'test-user',
  name: options.name || 'Test User',
  preferences: options.preferences || {},
  // ... other properties
});

export const createTestPortfolio = (options = {}) => ({
  id: options.id || 'test-portfolio',
  name: options.name || 'Test Portfolio',
  holdings: options.holdings || [],
  // ... other properties
});
```

### Data Cleanup

```typescript
// test-utils/cleanup.ts
export const cleanupTestData = async () => {
  await clearAllCaches();
  await resetAllStores();
  await clearTestDatabase();
};

export const resetTestState = async () => {
  await cleanupTestData();
  await setupTestEnvironment();
};
```

## Best Practices

1. **Utility Usage**
   - Always use these utilities instead of writing custom test code
   - Keep utilities focused and single-purpose
   - Document any new utilities added

2. **Maintenance**
   - Regularly review and update utilities
   - Remove obsolete utilities
   - Add new utilities as needed

3. **Performance**
   - Optimize utility functions
   - Cache expensive operations
   - Use appropriate async/await patterns

4. **Error Handling**
   - Proper error handling in all utilities
   - Clear error messages
   - Recovery mechanisms

## Version Control

1. **Changes**
   - Document all changes to utilities
   - Update tests when utilities change
   - Maintain backward compatibility

2. **Review**
   - Code review all utility changes
   - Test utility changes thoroughly
   - Update documentation

## Troubleshooting

1. **Common Issues**
   - Utility not working as expected
   - Performance problems
   - Memory leaks

2. **Solutions**
   - Check utility documentation
   - Review recent changes
   - Test in isolation

## Maintenance

1. **Regular Tasks**
   - Update utilities
   - Add new utilities
   - Remove obsolete utilities

2. **Documentation**
   - Keep documentation up to date
   - Add examples
   - Document changes 