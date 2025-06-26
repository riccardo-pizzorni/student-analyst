import pluginJs from '@eslint/js';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.vscode/**',
      '.husky/_',
      'vite.config.ts.timestamp-*.mjs',
      '**/playwright-report/**',
      '**/test-results/**',
      'backend/dist/**',
      'backend/build/**',
      '**/*.config.cjs',
      '**/*.config.js',
      'jest.config.cjs',
      'temp_*',
      '*.tmp',
      '*.temp',
      'scripts/**/*.js',
      'scripts/**/*.cjs',
      'server/**/*.js',
      'backend/scripts/**/*.js',
      'backend/src/simple-server.js',
      'backend/test-backend.js',
      'backend/src/index.js',
      'tests/utils/testReporter.cjs',
      '**/Lovable project/**',
      '**/*.js', // <-- aggiungi questa riga se vuoi ignorare TUTTI i .js
      '**/*.cjs', // <-- aggiungi questa riga se vuoi ignorare TUTTI i .cjs
    ],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        'import.meta': 'readonly',
      },
    },
    plugins: {
      'react-hooks': eslintPluginReactHooks,
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-refresh': eslintPluginReactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
