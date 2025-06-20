/**
 * STUDENT ANALYST - Test Setup (Semplificato)
 * Configurazione minima per i test che funzionano
 */

// Mock localStorage semplice
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

// Mock IndexedDB semplice
const indexedDBMock = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
});

// Clean up after each test
afterEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});
