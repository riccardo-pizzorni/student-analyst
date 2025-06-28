# Test Conventions and Standards

## Overview

This document defines the conventions and standards for writing, organizing, and maintaining tests in our financial analysis platform. Following these conventions ensures consistency, reliability, and maintainability across all tests.

## File Organization

### Directory Structure

```
tests/
├── unit/                 # Unit tests
│   ├── components/       # React component tests
│   ├── services/        # Service layer tests
│   └── utils/           # Utility function tests
├── integration/         # Integration tests
│   ├── api/            # API integration tests
│   ├── cache/          # Cache system tests
│   └── data/           # Data flow tests
├── e2e/                # End-to-end tests
│   ├── flows/          # User flow tests
│   └── scenarios/      # Test scenarios
└── manual/             # Manual test documentation
```

### File Naming

- Unit tests: `[component].test.ts`
- Integration tests: `[feature].integration.test.ts`
- E2E tests: `[flow].e2e.test.ts`
- Test utilities: `[purpose].utils.ts`

## Code Style

### Test Structure

```typescript
// Imports
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { setupTestEnvironment, cleanupTestEnvironment } from '../test-utils';

// Test suite
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    setupTestEnvironment();
  });

  // Cleanup
  afterEach(() => {
    cleanupTestEnvironment();
  });

  // Test cases
  it('should perform expected behavior', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = component.process(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Naming Conventions

1. **Test Suites**

   - Use PascalCase for suite names
   - Include component/feature name
   - Example: `describe('StockPriceChart', () => {`

2. **Test Cases**

   - Use descriptive names
   - Follow pattern: `should [expected behavior] when [condition]`
   - Example: `it('should update price when new data arrives', () => {`

3. **Variables**
   - Use camelCase for variables
   - Prefix test data with `mock` or `test`
   - Example: `const mockStockData = { ... }`

## Test Categories

### Unit Tests

- Test individual components/functions
- Mock all dependencies
- Focus on specific behavior
- Example:

```typescript
describe('FinancialCalculator', () => {
  it('should calculate correct ROI', () => {
    const calculator = new FinancialCalculator();
    const result = calculator.calculateROI(100, 120);
    expect(result).toBe(0.2);
  });
});
```

### Integration Tests

- Test component interactions
- Use real dependencies where appropriate
- Focus on data flow
- Example:

```typescript
describe('CacheSystem', () => {
  it('should maintain consistency across levels', async () => {
    await cache.set('key', 'value');
    const l1Value = await MemoryCacheL1.get('key');
    const l2Value = await LocalStorageCacheL2.get('key');
    expect(l1Value).toBe(l2Value);
  });
});
```

### E2E Tests

- Test complete user flows
- Use real browser environment
- Focus on user experience
- Example:

```typescript
describe('Portfolio Creation', () => {
  it('should create portfolio with selected stocks', async () => {
    await page.goto('/portfolio/new');
    await page.selectStocks(['AAPL', 'GOOGL']);
    await page.click('Create Portfolio');
    expect(await page.getPortfolioName()).toBe('New Portfolio');
  });
});
```

## Assertions

### Basic Assertions

```typescript
// Equality
expect(value).toBe(expected);
expect(value).toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Numbers
expect(value).toBeGreaterThan(expected);
expect(value).toBeLessThan(expected);

// Strings
expect(value).toContain(substring);
expect(value).toMatch(pattern);

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(length);

// Objects
expect(object).toHaveProperty(prop);
expect(object).toMatchObject(expected);
```

### Async Assertions

```typescript
// Promises
await expect(promise).resolves.toBe(expected);
await expect(promise).rejects.toThrow(error);

// Async Functions
await expect(asyncFunction()).resolves.toBe(expected);
await expect(asyncFunction()).rejects.toThrow(error);
```

## Mocking

### Function Mocks

```typescript
// Mock implementation
jest.mock('../api', () => ({
  fetchData: jest.fn().mockResolvedValue(mockData),
}));

// Mock return value
mockFunction.mockReturnValue(value);

// Mock implementation
mockFunction.mockImplementation(() => value);

// Mock async
mockFunction.mockResolvedValue(value);
mockFunction.mockRejectedValue(error);
```

### Module Mocks

```typescript
// Mock entire module
jest.mock('../module');

// Mock specific exports
jest.mock('../module', () => ({
  export1: jest.fn(),
  export2: jest.fn(),
}));
```

## Test Data

### Data Generation

```typescript
// Use factories
const stock = createTestStock();
const portfolio = createTestPortfolio();

// Use builders
const stock = StockBuilder.create().withSymbol('AAPL').withPrice(150).build();
```

### Data Cleanup

```typescript
// Cleanup after each test
afterEach(() => {
  cleanupTestData();
});

// Reset state
beforeEach(() => {
  resetTestState();
});
```

## Performance

### Test Optimization

- Minimize setup/teardown overhead
- Use appropriate test types
- Optimize test data size
- Example:

```typescript
describe('Performance', () => {
  it('should process data within time limit', async () => {
    const start = performance.now();
    await processData();
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});
```

### Memory Management

- Clean up resources
- Monitor memory usage
- Handle large datasets
- Example:

```typescript
describe('Memory Usage', () => {
  it('should not exceed memory limit', () => {
    const initialMemory = measureMemoryUsage();
    processLargeDataset();
    const finalMemory = measureMemoryUsage();
    expect(finalMemory - initialMemory).toBeLessThan(maxMemory);
  });
});
```

## Documentation

### Test Documentation

- Document test purpose
- Explain test setup
- Describe expected behavior
- Example:

```typescript
/**
 * Tests the portfolio rebalancing functionality
 * Verifies that:
 * 1. Weights are correctly adjusted
 * 2. Transactions are generated
 * 3. Portfolio is updated
 */
describe('Portfolio Rebalancing', () => {
  // Test cases
});
```

### Code Comments

- Comment complex logic
- Explain test data
- Document edge cases
- Example:

```typescript
it('should handle market hours correctly', () => {
  // Market is closed on weekends
  const weekend = new Date('2024-01-06');
  expect(isMarketOpen(weekend)).toBe(false);
});
```

## Maintenance

### Regular Tasks

1. **Review**

   - Review test coverage
   - Check test effectiveness
   - Update documentation

2. **Cleanup**

   - Remove obsolete tests
   - Update test data
   - Optimize performance

3. **Improvement**
   - Add new test cases
   - Enhance test utilities
   - Update conventions

### Version Control

1. **Commits**

   - Test-related commits
   - Documentation updates
   - Configuration changes

2. **Branches**
   - Feature branches
   - Test branches
   - Release branches

## Best Practices

1. **General**

   - Write clear, focused tests
   - Use appropriate assertions
   - Handle edge cases
   - Clean up resources

2. **Organization**

   - Group related tests
   - Use descriptive names
   - Follow directory structure
   - Maintain documentation

3. **Performance**

   - Optimize test execution
   - Manage memory usage
   - Handle async operations
   - Monitor test duration

4. **Maintenance**
   - Regular reviews
   - Update documentation
   - Remove obsolete tests
   - Improve test utilities
