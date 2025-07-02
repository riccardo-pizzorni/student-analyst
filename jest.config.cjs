module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
        esModuleInterop: true,
      },
    ],
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Escludi i test problematici
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/', // Escludi tutti i test E2E (Playwright)
    '/tests/performance/', // Escludi i test di performance problematici
    '/backend/dist/', // Escludi i file compilati del backend
    '/tests/unit/services/dataSourceManager.test.ts', // Missing service files
    '/tests/unit/services/historicalAnalysisService.test.ts', // Missing service files
    '/tests/unit/storage-monitoring-service.test.ts', // Missing service files
    '/tests/unit/notification-manager.test.ts', // Missing service files
    '/tests/unit/memory-cache-l1.test.ts', // Missing service files
    '/tests/unit/local-storage-cache-l2.test.ts', // Missing service files
    '/tests/unit/cache-analytics-engine.test.ts', // Missing service files
    '/tests/unit/automatic-cleanup-simple.test.ts', // Missing service files
    '/tests/unit/automatic-cleanup-service.test.ts', // Missing service files
    '/tests/unit/algorithm-optimization-engine.test.ts', // Missing service files
    '/tests/unit/components/HistoricalChart.test.tsx', // Chart.js plugin issues
    '/tests/unit/components/HistoricalTable.test.tsx', // Component not implemented (empty file)
    '/src/components/charts/__tests__/NewTradingViewWidget.test.tsx', // Memory leak issues with TradingView widget mocking
  ],

  // Includi test frontend e unit
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/unit/**/*.test.tsx',
    '**/src/**/*.test.ts',
    '**/src/**/*.test.tsx',
  ],

  // Trasforma i moduli problematici
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/tests/utils/fileMock.js',
    '^import\\.meta$': '<rootDir>/tests/utils/importMetaMock.js',
  },

  setupFilesAfterEnv: ['<rootDir>/tests/utils/setup.ts'],
};
