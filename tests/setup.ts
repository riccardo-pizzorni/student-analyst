/**
 * STUDENT ANALYST - Test Setup
 * Configures the test environment for the cache system
 */

import '@testing-library/jest-dom';
import { performance } from 'perf_hooks';
import { TextDecoder, TextEncoder } from 'util';

// Mock browser APIs
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof TextDecoder;
global.performance = performance as unknown as Performance;

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock IndexedDB
const indexedDBMock = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
});

// Increase timeout for all tests
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

// Setup IndexedDB mock
const indexedDB = {
  databases: jest.fn().mockResolvedValue([]),
  open: jest.fn().mockImplementation(() => {
    const request = {
      result: {
        createObjectStore: jest.fn().mockReturnValue({
          createIndex: jest.fn(),
          put: jest.fn(),
          get: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn(),
          index: jest.fn().mockReturnValue({
            get: jest.fn(),
            openCursor: jest.fn(),
          }),
        }),
        objectStoreNames: {
          contains: jest.fn().mockReturnValue(true),
        },
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            put: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
            index: jest.fn().mockReturnValue({
              get: jest.fn(),
              openCursor: jest.fn(),
            }),
          }),
        }),
      },
      onupgradeneeded: null as ((event: unknown) => void) | null,
      onsuccess: null as ((event: unknown) => void) | null,
      onerror: null as ((event: unknown) => void) | null,
    };

    // Simulate the upgrade needed event
    setTimeout(() => {
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: request });
      }
      if (request.onsuccess) {
        request.onsuccess({ target: request });
      }
    }, 0);

    return request;
  }),
  deleteDatabase: jest.fn().mockImplementation(() => ({
    onsuccess: null,
    onerror: null,
  })),
};

// Setup performance mock
const performanceMock = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

// Setup console mocks
const consoleMock = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Apply mocks
Object.defineProperty(window, 'indexedDB', { value: indexedDB });
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0,
  },
});
Object.defineProperty(window, 'performance', { value: performanceMock });
Object.defineProperty(window, 'console', { value: consoleMock });

// Setup test environment
beforeAll(() => {
  // Clear all mocks before each test suite
  jest.clearAllMocks();
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();

  // Reset localStorage
  localStorageMock.clear();

  // Reset IndexedDB
  indexedDB.databases.mockClear();
  indexedDB.open.mockClear();
  indexedDB.deleteDatabase.mockClear();
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllTimers();
});

afterAll(() => {
  // Clean up after all tests
  jest.clearAllMocks();
});
