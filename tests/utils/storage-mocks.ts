/**
 * Storage Mocks per StorageMonitoringService
 * Mock avanzati per localStorage, sessionStorage, indexedDB con quota management
 */

export interface MockStorage {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: jest.Mock;
  length: number;
  key: jest.Mock;
  // Mock per gestire quota
  _quota: number;
  _usage: number;
  _simulateQuotaExceeded: boolean;
}

export interface MockStorageEstimate {
  quota?: number;
  usage?: number;
  usageDetails?: {
    indexedDB?: number;
    localStorage?: number;
    sessionStorage?: number;
  };
}

export interface MockNavigator {
  storage?: {
    estimate: jest.Mock<Promise<MockStorageEstimate>>;
    persist?: jest.Mock<Promise<boolean>>;
  };
}

export interface MockIDBRequest {
  result: any;
  error: any;
  readyState: string;
  onsuccess: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
}

export interface MockIDBDatabase {
  name: string;
  version: number;
  objectStoreNames: string[];
  createObjectStore: jest.Mock;
  deleteObjectStore: jest.Mock;
  transaction: jest.Mock;
  close: jest.Mock;
}

export interface MockIndexedDB {
  open: jest.Mock<MockIDBRequest>;
  deleteDatabase: jest.Mock<MockIDBRequest>;
  databases: jest.Mock<Promise<{ name: string; version: number }[]>>;
  _estimatedUsage: number;
}

/**
 * Crea mock per localStorage con gestione quota
 */
export function createMockLocalStorage(quota: number = 5 * 1024 * 1024): MockStorage {
  let storage: Record<string, string> = {};
  let usage = 0;

  const mock: MockStorage = {
    _quota: quota,
    _usage: usage,
    _simulateQuotaExceeded: false,
    length: 0,

    getItem: jest.fn((key: string) => {
      return storage[key] || null;
    }),

    setItem: jest.fn((key: string, value: string) => {
      if (mock._simulateQuotaExceeded) {
        throw new Error('QuotaExceededError');
      }
      
      const newSize = new Blob([value]).size;
      if (usage + newSize > quota) {
        throw new Error('QuotaExceededError');
      }
      
      const oldSize = storage[key] ? new Blob([storage[key]]).size : 0;
      storage[key] = value;
      usage = usage - oldSize + newSize;
      mock._usage = usage;
      mock.length = Object.keys(storage).length;
    }),

    removeItem: jest.fn((key: string) => {
      if (storage[key]) {
        const oldSize = new Blob([storage[key]]).size;
        delete storage[key];
        usage -= oldSize;
        mock._usage = usage;
        mock.length = Object.keys(storage).length;
      }
    }),

    clear: jest.fn(() => {
      storage = {};
      usage = 0;
      mock._usage = 0;
      mock.length = 0;
    }),

    key: jest.fn((index: number) => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    })
  };

  return mock;
}

/**
 * Crea mock per sessionStorage
 */
export function createMockSessionStorage(quota: number = 5 * 1024 * 1024): MockStorage {
  return createMockLocalStorage(quota); // Stessa implementazione
}

/**
 * Crea mock per IndexedDB
 */
export function createMockIndexedDB(estimatedUsage: number = 0): MockIndexedDB {
  const mockRequest = (result: any = null, error: any = null): MockIDBRequest => ({
    result,
    error,
    readyState: error ? 'done' : 'done',
    onsuccess: null,
    onerror: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  });

  const mockDatabase: MockIDBDatabase = {
    name: 'test-db',
    version: 1,
    objectStoreNames: ['cache'],
    createObjectStore: jest.fn(),
    deleteObjectStore: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn()
  };

  return {
    _estimatedUsage: estimatedUsage,

    open: jest.fn(() => {
      const request = mockRequest(mockDatabase);
      // Simula evento asincrono
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }, 0);
      return request;
    }),

    deleteDatabase: jest.fn(() => {
      const request = mockRequest(true);
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }, 0);
      return request;
    }),

    databases: jest.fn(() => 
      Promise.resolve([
        { name: 'test-db', version: 1 },
        { name: 'cache-db', version: 2 }
      ])
    )
  };
}

/**
 * Crea mock per navigator.storage API
 */
export function createMockNavigatorStorage(
  quota: number = 1024 * 1024 * 1024, // 1GB
  indexedDBUsage: number = 0,
  localStorageUsage: number = 0
): MockNavigator {
  return {
    storage: {
      estimate: jest.fn(() => 
        Promise.resolve({
          quota,
          usage: indexedDBUsage + localStorageUsage,
          usageDetails: {
            indexedDB: indexedDBUsage,
            localStorage: localStorageUsage,
            sessionStorage: 0
          }
        })
      ),
      persist: jest.fn(() => Promise.resolve(true))
    }
  };
}

/**
 * Setup completo di tutti i mock storage
 */
export function setupStorageMocks() {
  const mockLocalStorage = createMockLocalStorage();
  const mockSessionStorage = createMockSessionStorage();
  const mockIndexedDB = createMockIndexedDB();
  const mockNavigator = createMockNavigatorStorage();

  // Mock globali
  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });

  Object.defineProperty(global, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true
  });

  Object.defineProperty(global, 'indexedDB', {
    value: mockIndexedDB,
    writable: true
  });

  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true
  });

  return {
    mockLocalStorage,
    mockSessionStorage,
    mockIndexedDB,
    mockNavigator
  };
}

/**
 * Reset di tutti i mock
 */
export function resetStorageMocks() {
  jest.clearAllMocks();
} 