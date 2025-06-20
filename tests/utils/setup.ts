import { TextEncoder } from 'util';

// Enhanced IndexedDB mock for async operations and callbacks
class MockIDBRequest {
  onsuccess: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onupgradeneeded: ((event: Event) => void) | null = null;
  result: unknown = undefined;
  constructor(result: unknown) {
    setTimeout(() => {
      this.result = result;
      if (typeof this.onsuccess === 'function') {
        const event = new Event('success');
        Object.defineProperty(event, 'target', { value: this });
        this.onsuccess(event);
      }
    }, 1);
  }
}

class MockObjectStore {
  store: Record<string, unknown>;
  constructor(store: Record<string, unknown>) {
    this.store = store;
  }
  get(key: string) {
    return new MockIDBRequest(this.store[key] ?? undefined);
  }
  put(entry: { key: string; value: unknown }) {
    this.store[entry.key] = entry;
    return new MockIDBRequest(undefined);
  }
  delete(key: string) {
    delete this.store[key];
    return new MockIDBRequest(undefined);
  }
  clear() {
    Object.keys(this.store).forEach(k => delete this.store[k]);
    return new MockIDBRequest(undefined);
  }
  getAllKeys() {
    return new MockIDBRequest(Object.keys(this.store));
  }
  count() {
    return new MockIDBRequest(Object.keys(this.store).length);
  }
  index() {
    return this;
  }
  openCursor() {
    return new MockIDBRequest({ continue: () => {} });
  }
}

class MockTransaction {
  store: Record<string, unknown>;
  constructor(store: Record<string, unknown>) {
    this.store = store;
  }
  objectStore() {
    return new MockObjectStore(this.store);
  }
}

class MockIDBDatabase {
  store: Record<string, unknown>;
  constructor(store: Record<string, unknown>) {
    this.store = store;
  }
  transaction() {
    return new MockTransaction(this.store);
  }
  createObjectStore() {
    return new MockObjectStore(this.store);
  }
  close() {}
}

const _mockIDBStore: Record<string, unknown> = {};
const mockIndexedDB = {
  open: () => {
    const req = new MockIDBRequest(new MockIDBDatabase(_mockIDBStore));
    setTimeout(() => {
      if (typeof req.onupgradeneeded === 'function') {
        const event = new Event('upgradeneeded');
        Object.defineProperty(event, 'target', { value: req });
        req.onupgradeneeded(event);
      }
      if (typeof req.onsuccess === 'function') {
        const event = new Event('success');
        Object.defineProperty(event, 'target', { value: req });
        req.onsuccess(event);
      }
    }, 1);
    return req;
  },
  deleteDatabase: () => {},
};

// Mock localStorage
const _mockLocalStorage: Record<string, string> = {};
const localStorage = {
  getItem: (key: string) => {
    return _mockLocalStorage[key] ?? null;
  },
  setItem: (key: string, value: string) => {
    _mockLocalStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete _mockLocalStorage[key];
  },
  clear: () => {
    Object.keys(_mockLocalStorage).forEach(k => delete _mockLocalStorage[k]);
  },
};

// Mock sessionStorage
const sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

// Mock TextEncoder/TextDecoder
class MockTextDecoder {
  decode(
    input?: ArrayBuffer | ArrayBufferView | null,
    options?: { stream?: boolean }
  ): string {
    // Implementazione minima per i test
    return '';
  }
}
global.TextEncoder = TextEncoder;
// @ts-expect-error: Assegniamo un mock che non rispetta la firma esatta di TextDecoder solo per i test.
// L'assegnazione usa 'as unknown' per evitare conflitti di tipo tra Node e browser, circoscritto solo a questa riga per sicurezza.
global.TextDecoder = MockTextDecoder as unknown;

// Mock console.error to prevent noise in test output
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('IndexedDB')) return;
  originalConsoleError(...args);
};

// Setup global window object if not exists
if (typeof global.window === 'undefined') {
  global.window = {} as Window & typeof globalThis;
}

// Setup window object
Object.defineProperty(global.window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

Object.defineProperty(global.window, 'localStorage', {
  value: localStorage,
  writable: true,
});

Object.defineProperty(global.window, 'sessionStorage', {
  value: sessionStorage,
  writable: true,
});

// Mock IDBKeyRange
class MockIDBKeyRange {
  static upperBound(value: unknown) {
    return { upper: value };
  }
}
Object.defineProperty(global.window, 'IDBKeyRange', {
  value: MockIDBKeyRange,
  writable: true,
});

// Mock window.setInterval
Object.defineProperty(global.window, 'setInterval', {
  value: (
    callback: (...args: unknown[]) => void,
    delay: number
  ): NodeJS.Timeout => {
    return setInterval(callback, delay);
  },
  writable: true,
});

// Mock window.clearInterval
Object.defineProperty(global.window, 'clearInterval', {
  value: (id: NodeJS.Timeout) => {
    clearInterval(id);
  },
  writable: true,
});

// Export for use in tests
export { localStorage, mockIndexedDB, sessionStorage };
