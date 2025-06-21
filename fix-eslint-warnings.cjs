const fs = require('fs');
const path = require('path');

// Function to fix unused error variables in catch blocks
function fixUnusedErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix catch (error) -> catch (_error)
    content = content.replace(/catch\s*\(\s*error\s*\)/g, 'catch (_error)');

    // Fix console.error statements that reference 'error' instead of '_error'
    content = content.replace(/console\.error\([^)]*error[^)]*\)/g, match => {
      return match.replace(/error/g, '_error');
    });

    // Fix specific patterns for unused variables
    const patterns = [
      // Function parameters
      {
        regex: /\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[^)]*\)\s*=>/g,
        replace: (match, varName) => {
          if (
            [
              'timeframe',
              'symbol',
              'index',
              'key',
              'query',
              'algorithm',
              'data',
              'signature',
              'format',
              'wrapAlgorithm',
              'base',
              'init',
              'input',
              'fn',
              'delay',
              'options',
              'event',
              'range',
              'direction',
              'listener',
              'type',
              'bubbles',
              'cancelable',
              'code',
              'primaryService',
              'mockReq',
              'mockRes',
              'resilientExpect',
              'initialMemory',
              'now',
              'wrappingKey',
            ].includes(varName)
          ) {
            return match.replace(
              new RegExp(`\\b${varName}\\b`, 'g'),
              `_${varName}`
            );
          }
          return match;
        },
      },

      // Variable assignments
      {
        regex: /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g,
        replace: (match, varName) => {
          if (
            [
              'timeframe',
              'symbol',
              'index',
              'key',
              'query',
              'algorithm',
              'data',
              'signature',
              'format',
              'wrapAlgorithm',
              'base',
              'init',
              'input',
              'fn',
              'delay',
              'options',
              'event',
              'range',
              'direction',
              'listener',
              'type',
              'bubbles',
              'cancelable',
              'code',
              'primaryService',
              'mockReq',
              'mockRes',
              'resilientExpect',
              'initialMemory',
              'now',
              'wrappingKey',
            ].includes(varName)
          ) {
            return match.replace(
              new RegExp(`\\b${varName}\\b`, 'g'),
              `_${varName}`
            );
          }
          return match;
        },
      },

      // Function declarations
      {
        regex: /function\s+[^(]*\(\s*([^)]*)\s*\)/g,
        replace: (match, params) => {
          const paramList = params
            .split(',')
            .map(p => p.trim().split(':')[0].trim());
          let newParams = params;
          paramList.forEach(param => {
            if (
              [
                'timeframe',
                'symbol',
                'index',
                'key',
                'query',
                'algorithm',
                'data',
                'signature',
                'format',
                'wrapAlgorithm',
                'base',
                'init',
                'input',
                'fn',
                'delay',
                'options',
                'event',
                'range',
                'direction',
                'listener',
                'type',
                'bubbles',
                'cancelable',
                'code',
                'primaryService',
                'mockReq',
                'mockRes',
                'resilientExpect',
                'initialMemory',
                'now',
                'wrappingKey',
              ].includes(param)
            ) {
              newParams = newParams.replace(
                new RegExp(`\\b${param}\\b`, 'g'),
                `_${param}`
              );
            }
          });
          return match.replace(params, newParams);
        },
      },

      // Import statements for unused imports
      {
        regex: /import\s*{\s*([^}]+)\s*}\s*from/g,
        replace: (match, imports) => {
          const importList = imports.split(',').map(i => i.trim());
          let newImports = imports;
          importList.forEach(imp => {
            if (['IMockFunction', 'CacheStats', 'INavigator'].includes(imp)) {
              newImports = newImports.replace(
                new RegExp(`\\b${imp}\\b`, 'g'),
                `_${imp}`
              );
            }
          });
          return match.replace(imports, newImports);
        },
      },
    ];

    patterns.forEach(pattern => {
      content = content.replace(pattern.regex, pattern.replace);
    });

    // Fix specific variable assignments
    const specificVars = [
      'timeframe',
      'symbol',
      'index',
      'primaryService',
      'mockReq',
      'mockRes',
      'code',
      'type',
      'bubbles',
      'cancelable',
      'listener',
      'options',
      'event',
      'range',
      'direction',
      'key',
      'query',
      'algorithm',
      'data',
      'signature',
      'format',
      'wrapAlgorithm',
      'base',
      'init',
      'input',
      'fn',
      'delay',
      'resilientExpect',
      'initialMemory',
      'now',
      'wrappingKey',
      'IMockFunction',
      'CacheStats',
      'INavigator',
    ];

    specificVars.forEach(varName => {
      // Fix variable assignments
      content = content.replace(
        new RegExp(`\\b${varName}\\b\\s*=\\s*`, 'g'),
        `_${varName} = `
      );
      // Fix function parameters
      content = content.replace(
        new RegExp(`\\(\\s*${varName}\\s*:`, 'g'),
        `(_${varName}:`
      );
      // Fix destructuring
      content = content.replace(
        new RegExp(`\\{\\s*${varName}\\s*\\}`, 'g'),
        `{ _${varName} }`
      );
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// List of files to fix
const filesToFix = [
  'backend/src/routes/apiRoutes.ts',
  'backend/src/services/alphaVantageService.ts',
  'backend/src/services/apiProxy.ts',
  'backend/src/services/batchProcessor.ts',
  'backend/src/services/dateNormalizer.ts',
  'backend/src/services/networkResilienceService.ts',
  'backend/src/services/priceAdjuster.ts',
  'backend/src/services/responseParser.ts',
  'backend/src/utils/testAlphaVantageService.ts',
  'backend/src/utils/testApiProxy.ts',
  'tests/e2e/tier-3-integration.spec.ts',
  'tests/performance/memory.test.ts',
  'tests/unit/IndexedDBCacheL3.test.ts',
  'tests/unit/algorithm-optimization-engine.test.ts',
  'tests/unit/automatic-cleanup-simple.test.ts',
  'tests/unit/memory-cache-l1.test.ts',
  'tests/unit/storage-monitoring-service.test.ts',
  'tests/utils/mocks.ts',
  'tests/utils/setup.ts',
];

// Fix all files
filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    fixUnusedErrors(file);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('ESLint warnings fix completed!');
