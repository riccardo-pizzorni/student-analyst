import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { TextEncoder } from 'util';

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

// Setup window object
Object.defineProperty(global.window, 'localStorage', {
  value: localStorage,
  writable: true,
});

Object.defineProperty(global.window, 'sessionStorage', {
  value: sessionStorage,
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
export { localStorage, sessionStorage };
