import { TextDecoder, TextEncoder } from 'util';

async function globalSetup() {
  // Mock TextEncoder/TextDecoder
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder as any;

  // Setup global window object if not exists
  if (typeof global.window === 'undefined') {
    global.window = {} as any;
  }

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

  // Enhanced IndexedDB mock for async operations and callbacks
  class MockIDBRequest {
    onsuccess: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    onupgradeneeded: ((event: any) => void) | null = null;
    result: any = undefined;
    constructor(result: any) {
      setTimeout(() => {
        this.result = result;
        if (typeof this.onsuccess === 'function') this.onsuccess({ target: this });
      }, 1);
    }
  }

  class MockObjectStore {
    store: Record<string, any>;
    constructor(store) { this.store = store; }
    get(key) { return new MockIDBRequest(this.store[key] ?? undefined); }
    put(entry) { this.store[entry.key] = entry; return new MockIDBRequest(undefined); }
    delete(key) { delete this.store[key]; return new MockIDBRequest(undefined); }
    clear() { Object.keys(this.store).forEach(k => delete this.store[k]); return new MockIDBRequest(undefined); }
    getAllKeys() { return new MockIDBRequest(Object.keys(this.store)); }
    count() { return new MockIDBRequest(Object.keys(this.store).length); }
    index() { return this; }
    openCursor() { return new MockIDBRequest({ continue: () => {} }); }
  }

  class MockTransaction {
    store: Record<string, any>;
    constructor(store) { this.store = store; }
    objectStore() { return new MockObjectStore(this.store); }
  }

  class MockIDBDatabase {
    store: Record<string, any>;
    constructor(store) { this.store = store; }
    transaction() { return new MockTransaction(this.store); }
    createObjectStore() { return new MockObjectStore(this.store); }
    close() {}
  }

  const _mockIDBStore: Record<string, any> = {};
  const mockIndexedDB = {
    open: () => {
      const req = new MockIDBRequest(new MockIDBDatabase(_mockIDBStore));
      setTimeout(() => {
        if (typeof req.onupgradeneeded === 'function') req.onupgradeneeded({ target: req });
        if (typeof req.onsuccess === 'function') req.onsuccess({ target: req });
      }, 1);
      return req;
    },
    deleteDatabase: () => {},
  };

  // Mock IDBKeyRange
  class MockIDBKeyRange {
    static upperBound(value: any) {
      return { upper: value };
    }
  }

  // Mock window.setInterval
  Object.defineProperty(global.window, 'setInterval', {
    value: (callback: (...args: any[]) => void, delay: number): NodeJS.Timeout => {
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

  Object.defineProperty(global.window, 'IDBKeyRange', {
    value: MockIDBKeyRange,
    writable: true,
  });
}

export default globalSetup; 