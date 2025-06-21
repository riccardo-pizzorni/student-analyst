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

    // Fix other unused variables by prefixing with _
    const unusedVars = [
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
    ];

    unusedVars.forEach(varName => {
      const regex = new RegExp(`\\b${varName}\\b(?=\\s*[,)])`, 'g');
      content = content.replace(regex, `_${varName}`);
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
  'tests/e2e/performance/load-testing.spec.ts',
  'tests/e2e/realistic-flows.spec.ts',
  'tests/e2e/student-analyst-e2e.spec.ts',
  'tests/e2e/tier-1-smoke.spec.ts',
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
