// Interfacce per i mock
interface IMockIDBObjectStore {
  get: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  clear: jest.Mock;
  createIndex: jest.Mock;
  index: jest.Mock;
  getAll: jest.Mock;
  getAllKeys: jest.Mock;
  count: jest.Mock;
  openCursor: jest.Mock;
  openKeyCursor: jest.Mock;
}

interface IMockIDBTransaction {
  objectStore: jest.Mock;
  commit: jest.Mock;
  abort: jest.Mock;
  oncomplete: ((this: IDBTransaction, ev: Event) => unknown) | null;
  onerror: ((this: IDBTransaction, ev: Event) => unknown) | null;
  onabort: ((this: IDBTransaction, ev: Event) => unknown) | null;
}

interface IMockIDBDatabase {
  createObjectStore: jest.Mock;
  transaction: jest.Mock;
  close: jest.Mock;
  deleteObjectStore: jest.Mock;
  objectStoreNames: DOMStringList;
  name: string;
  version: number;
  onclose: ((this: IDBDatabase, ev: Event) => unknown) | null;
  onerror: ((this: IDBDatabase, ev: Event) => unknown) | null;
  onversionchange:
    | ((this: IDBDatabase, ev: IDBVersionChangeEvent) => unknown)
    | null;
}

interface IMockIDBOpenDBRequest extends IDBRequest<IDBDatabase> {
  result: IMockIDBDatabase | null;
  error: DOMException | null;
  source: unknown;
  transaction: IMockIDBTransaction | null;
  readyState: string;
  onsuccess: ((this: IDBRequest<IDBDatabase>, ev: Event) => unknown) | null;
  onerror: ((this: IDBRequest<IDBDatabase>, ev: Event) => unknown) | null;
  onupgradeneeded:
    | ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown)
    | null;
  onblocked: ((this: IDBOpenDBRequest, ev: Event) => unknown) | null;
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) => void;
  dispatchEvent: (event: Event) => boolean;
}

// Interfacce per TextEncoder/TextDecoder
interface IMockTextEncoder {
  encode: jest.Mock;
  encodeInto: jest.Mock;
}

interface IMockTextDecoder {
  decode: jest.Mock;
  encoding: string;
  fatal: boolean;
  ignoreBOM: boolean;
}

// Mock per IndexedDB
const mockIDBObjectStore: IMockIDBObjectStore = {
  get: jest.fn().mockImplementation(() => Promise.resolve(null)),
  put: jest.fn().mockImplementation(() => Promise.resolve(null)),
  delete: jest.fn().mockImplementation(() => Promise.resolve(null)),
  clear: jest.fn().mockImplementation(() => Promise.resolve(null)),
  createIndex: jest.fn().mockImplementation(() => mockIDBObjectStore),
  index: jest.fn().mockImplementation(() => mockIDBObjectStore),
  getAll: jest.fn().mockImplementation(() => Promise.resolve([])),
  getAllKeys: jest.fn().mockImplementation(() => Promise.resolve([])),
  count: jest.fn().mockImplementation(() => Promise.resolve(0)),
  openCursor: jest.fn().mockImplementation(() => Promise.resolve(null)),
  openKeyCursor: jest.fn().mockImplementation(() => Promise.resolve(null)),
};

const mockIDBTransaction: IMockIDBTransaction = {
  objectStore: jest.fn().mockReturnValue(mockIDBObjectStore),
  commit: jest.fn(),
  abort: jest.fn(),
  oncomplete: null,
  onerror: null,
  onabort: null,
};

const mockIDBDatabase: IMockIDBDatabase = {
  createObjectStore: jest.fn().mockReturnValue(mockIDBObjectStore),
  transaction: jest.fn().mockReturnValue(mockIDBTransaction),
  close: jest.fn(),
  deleteObjectStore: jest.fn(),
  objectStoreNames: [] as unknown as DOMStringList,
  name: 'mock-db',
  version: 1,
  onclose: null,
  onerror: null,
  onversionchange: null,
};

// Creazione del mock IDBOpenDBRequest con proprietà read-only
const createMockIDBOpenDBRequest = (): IMockIDBOpenDBRequest => {
  const request = {} as IMockIDBOpenDBRequest;

  // Proprietà read-only
  Object.defineProperties(request, {
    result: {
      value: mockIDBDatabase,
      writable: false,
      configurable: false,
    },
    error: {
      value: null,
      writable: false,
      configurable: false,
    },
    source: {
      value: null,
      writable: false,
      configurable: false,
    },
    transaction: {
      value: null,
      writable: false,
      configurable: false,
    },
    readyState: {
      value: 'done',
      writable: false,
      configurable: false,
    },
  });

  // Eventi
  Object.defineProperties(request, {
    onsuccess: {
      value: null,
      writable: true,
      configurable: true,
    },
    onerror: {
      value: null,
      writable: true,
      configurable: true,
    },
    onupgradeneeded: {
      value: null,
      writable: true,
      configurable: true,
    },
  });

  return request;
};

const mockIndexedDB = {
  open: jest.fn().mockImplementation(() => {
    const request = createMockIDBOpenDBRequest();
    // Simula il comportamento asincrono
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess(new Event('success'));
      }
    }, 0);
    return request;
  }),
  deleteDatabase: jest.fn().mockImplementation(() => {
    const request = createMockIDBOpenDBRequest();
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess(new Event('success'));
      }
    }, 0);
    return request;
  }),
  databases: jest.fn().mockResolvedValue([]),
};

// Mock per Storage
const createMockStorage = () => ({
  getItem: jest.fn().mockImplementation((key: string) => null),
  setItem: jest.fn().mockImplementation((key: string, value: string) => {}),
  removeItem: jest.fn().mockImplementation((key: string) => {}),
  clear: jest.fn(),
  key: jest.fn().mockImplementation((index: number) => null),
  length: 0,
});

const mockLocalStorage = createMockStorage();
const mockSessionStorage = createMockStorage();

// Mock per Window
const mockWindow = {
  indexedDB: mockIndexedDB,
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  setTimeout: jest
    .fn()
    .mockImplementation((callback: () => void, delay: number) => {
      return setTimeout(callback, _delay);
    }),
  clearTimeout: jest.fn().mockImplementation((id: number) => {
    clearTimeout(id);
  }),
  setInterval: jest
    .fn()
    .mockImplementation((callback: () => void, delay: number) => {
      return setInterval(callback, _delay);
    }),
  clearInterval: jest.fn().mockImplementation((id: number) => {
    clearInterval(id);
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  performance: {
    now: jest.fn().mockReturnValue(Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn().mockReturnValue([]),
    getEntriesByName: jest.fn().mockReturnValue([]),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
  location: {
    href: 'http://localhost',
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  navigator: {
    userAgent: 'jest',
    language: 'en-US',
    languages: ['en-US'],
    onLine: true,
    cookieEnabled: true,
    doNotTrack: null,
    hardwareConcurrency: 8,
    maxTouchPoints: 0,
    platform: 'Win32',
    vendor: 'Google Inc.',
  },
};

// Mock migliorati per TextEncoder/TextDecoder
const mockTextEncoder: IMockTextEncoder = {
  encode: jest.fn().mockImplementation((text: string) => {
    return new Uint8Array(Array.from(text).map(char => char.charCodeAt(0)));
  }),
  encodeInto: jest
    .fn()
    .mockImplementation((text: string, buffer: Uint8Array) => {
      const bytes = Array.from(text).map(char => char.charCodeAt(0));
      const length = Math.min(bytes.length, buffer.length);
      buffer.set(bytes.slice(0, length));
      return { read: length, written: length };
    }),
};

const mockTextDecoder: IMockTextDecoder = {
  decode: jest.fn().mockImplementation((buffer: Uint8Array) => {
    return String.fromCharCode(...buffer);
  }),
  encoding: 'utf-8',
  fatal: false,
  ignoreBOM: false,
};

// Mock per altre API browser
const mockCrypto = {
  getRandomValues: jest.fn().mockImplementation((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  randomUUID: jest.fn().mockReturnValue('mock-uuid'),
  subtle: {
    digest: jest
      .fn()
      .mockImplementation(async (algorithm: string, data: ArrayBuffer) => {
        return new ArrayBuffer(32);
      }),
    encrypt: jest
      .fn()
      .mockImplementation(
        async (algorithm: unknown, key: CryptoKey, data: ArrayBuffer) => {
          return new ArrayBuffer(data.byteLength);
        }
      ),
    decrypt: jest
      .fn()
      .mockImplementation(
        async (algorithm: unknown, key: CryptoKey, data: ArrayBuffer) => {
          return new ArrayBuffer(data.byteLength);
        }
      ),
    sign: jest
      .fn()
      .mockImplementation(
        async (algorithm: unknown, key: CryptoKey, data: ArrayBuffer) => {
          return new ArrayBuffer(64);
        }
      ),
    verify: jest
      .fn()
      .mockImplementation(
        async (
          algorithm: unknown,
          key: CryptoKey,
          signature: ArrayBuffer,
          data: ArrayBuffer
        ) => {
          return true;
        }
      ),
    generateKey: jest
      .fn()
      .mockImplementation(
        async (
          algorithm: unknown,
          extractable: boolean,
          keyUsages: string[]
        ) => {
          return { type: 'secret', extractable, _algorithm, usages: keyUsages };
        }
      ),
    deriveKey: jest
      .fn()
      .mockImplementation(
        async (
          algorithm: unknown,
          baseKey: CryptoKey,
          derivedKeyAlgorithm: unknown,
          extractable: boolean,
          keyUsages: string[]
        ) => {
          return {
            type: 'secret',
            extractable,
            algorithm: derivedKeyAlgorithm,
            usages: keyUsages,
          };
        }
      ),
    deriveBits: jest
      .fn()
      .mockImplementation(
        async (algorithm: unknown, baseKey: CryptoKey, length: number) => {
          return new ArrayBuffer(length / 8);
        }
      ),
    importKey: jest
      .fn()
      .mockImplementation(
        async (
          format: string,
          keyData: unknown,
          algorithm: unknown,
          extractable: boolean,
          keyUsages: string[]
        ) => {
          return { type: 'secret', extractable, _algorithm, usages: keyUsages };
        }
      ),
    exportKey: jest
      .fn()
      .mockImplementation(async (format: string, key: CryptoKey) => {
        return new ArrayBuffer(32);
      }),
    wrapKey: jest
      .fn()
      .mockImplementation(
        async (
          format: string,
          key: CryptoKey,
          wrappingKey: CryptoKey,
          wrapAlgorithm: unknown
        ) => {
          return new ArrayBuffer(32);
        }
      ),
    unwrapKey: jest
      .fn()
      .mockImplementation(
        async (
          format: string,
          wrappedKey: ArrayBuffer,
          unwrappingKey: CryptoKey,
          unwrapAlgorithm: unknown,
          unwrappedKeyAlgorithm: unknown,
          extractable: boolean,
          keyUsages: string[]
        ) => {
          return {
            type: 'secret',
            extractable,
            algorithm: unwrappedKeyAlgorithm,
            usages: keyUsages,
          };
        }
      ),
  },
};

// Aggiorna mockWindow con le nuove API
Object.assign(mockWindow, {
  TextEncoder: jest.fn().mockImplementation(() => mockTextEncoder),
  TextDecoder: jest.fn().mockImplementation(() => mockTextDecoder),
  crypto: mockCrypto,
  btoa: jest
    .fn()
    .mockImplementation((str: string) => Buffer.from(str).toString('base64')),
  atob: jest
    .fn()
    .mockImplementation((str: string) => Buffer.from(str, 'base64').toString()),
  Blob: jest.fn().mockImplementation((parts: unknown[], options?: unknown) => ({
    size: parts.reduce((acc, part) => acc + (part.length || 0), 0),
    type: options?.type || '',
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    text: jest.fn().mockResolvedValue(''),
    slice: jest.fn().mockReturnThis(),
  })),
  File: jest
    .fn()
    .mockImplementation(
      (parts: unknown[], name: string, options?: unknown) => ({
        name,
        size: parts.reduce((acc, part) => acc + (part.length || 0), 0),
        type: options?.type || '',
        lastModified: options?.lastModified || Date.now(),
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
        text: jest.fn().mockResolvedValue(''),
        slice: jest.fn().mockReturnThis(),
      })
    ),
  FormData: jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn().mockReturnValue([]),
    has: jest.fn().mockReturnValue(false),
    set: jest.fn(),
    forEach: jest.fn(),
    entries: jest.fn().mockReturnValue([]),
    keys: jest.fn().mockReturnValue([]),
    values: jest.fn().mockReturnValue([]),
  })),
  URL: jest.fn().mockImplementation((url: string, base?: string) => ({
    href: url,
    origin: 'http://localhost',
    protocol: 'http:',
    username: '',
    password: '',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    searchParams: new URLSearchParams(),
    hash: '',
    toString: jest.fn().mockReturnValue(url),
  })),
  URLSearchParams: jest
    .fn()
    .mockImplementation(
      (init?: string | URLSearchParams | Record<string, string>) => ({
        append: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
        getAll: jest.fn().mockReturnValue([]),
        has: jest.fn().mockReturnValue(false),
        set: jest.fn(),
        sort: jest.fn(),
        toString: jest.fn().mockReturnValue(''),
        forEach: jest.fn(),
        entries: jest.fn().mockReturnValue([]),
        keys: jest.fn().mockReturnValue([]),
        values: jest.fn().mockReturnValue([]),
      })
    ),
});

// Funzione per resettare tutti i mock
export const resetAllMocks = () => {
  jest.clearAllMocks();

  // Reset IndexedDB mocks
  Object.values(mockIDBObjectStore).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  Object.values(mockIDBTransaction).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  Object.values(mockIDBDatabase).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  Object.values(mockIndexedDB).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });

  // Reset Storage mocks
  Object.values(mockLocalStorage).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  Object.values(mockSessionStorage).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });

  // Reset TextEncoder/TextDecoder mocks
  Object.values(mockTextEncoder).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  Object.values(mockTextDecoder).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });

  // Reset Crypto mocks
  Object.values(mockCrypto).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  Object.values(mockCrypto.subtle).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });

  // Reset Window mocks
  Object.values(mockWindow).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
};

// Funzione per setup globale dei mock
export const setupGlobalMocks = () => {
  // Setup IndexedDB
  Object.defineProperty(window, 'indexedDB', {
    value: mockIndexedDB,
    writable: true,
    configurable: true,
  });

  // Setup Storage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });

  // Setup Window
  Object.entries(mockWindow).forEach(([_key, value]) => {
    Object.defineProperty(window, _key, {
      value,
      writable: true,
      configurable: true,
    });
  });

  // Setup TextEncoder/TextDecoder
  Object.defineProperty(global, 'TextEncoder', {
    value: mockTextEncoder,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(global, 'TextDecoder', {
    value: mockTextDecoder,
    writable: true,
    configurable: true,
  });
};

// Funzione per cleanup globale dei mock
export const cleanupGlobalMocks = () => {
  resetAllMocks();

  // Rimuovi tutti i mock dal window object
  Object.keys(mockWindow).forEach(key => {
    delete (window as { [key: string]: unknown })[key];
  });
};

// Esporta tutti i mock
export {
  mockIDBDatabase,
  mockIDBObjectStore,
  mockIDBTransaction,
  mockIndexedDB,
  mockLocalStorage,
  mockSessionStorage,
  mockTextDecoder,
  mockTextEncoder,
  mockWindow,
};
