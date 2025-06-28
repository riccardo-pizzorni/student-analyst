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
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Escludi i test problematici
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/', // Escludi tutti i test E2E (Playwright)
    '/tests/performance/', // Escludi i test di performance problematici
    '/backend/dist/', // Escludi i file compilati del backend
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
