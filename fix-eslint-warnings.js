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
const filesToProcess = [
  'src/components/charts/HistoricalChart.tsx',
  'src/components/charts/HistoricalTable.tsx',
  'src/components/charts/PerformanceMetrics.tsx',
  'src/components/charts/VolatilityChart.tsx',
  'src/components/charts/CorrelationMatrix.tsx',
  'src/components/input/TickerInputSection.tsx',
  'src/components/input/DataUploadSection.tsx',
  'src/components/input/UnifiedInputSection.tsx',
  'src/components/AppSidebar.tsx',
  'src/components/FullSidebar.tsx',
  'src/components/Badge.tsx',
  'src/components/icons/CustomIcons.tsx',
  'src/context/AnalysisContext.tsx',
  'src/services/analysisAPI.ts',
  'src/hooks/use-mobile.tsx',
  'src/hooks/use-toast.ts',
  'src/lib/utils.ts',
  'src/App.tsx',
  'src/main.tsx',
  'src/pages/Index.tsx',
  'src/pages/NotFound.tsx',
  'tests/unit/components/HistoricalChart.test.tsx',
  'tests/unit/components/HistoricalTable.test.tsx',
  'tests/unit/components/PerformanceMetrics.test.tsx',
  'tests/unit/components/VolatilityChart.test.tsx',
  'tests/unit/components/CorrelationMatrix.test.tsx',
  'tests/unit/components/TickerInputSection.test.tsx',
  'tests/unit/components/DataUploadSection.test.tsx',
  'tests/unit/components/UnifiedInputSection.test.tsx',
  'tests/unit/components/AppSidebar.test.tsx',
  'tests/unit/components/FullSidebar.test.tsx',
  'tests/unit/components/Badge.test.tsx',
  'tests/unit/components/CustomIcons.test.tsx',
  'tests/unit/context/AnalysisContext.test.tsx',
  'tests/unit/services/analysisAPI.test.ts',
  'tests/unit/hooks/use-mobile.test.tsx',
  'tests/unit/hooks/use-toast.test.ts',
  'tests/unit/lib/utils.test.ts',
  'tests/unit/App.test.tsx',
  'tests/unit/pages/Index.test.tsx',
  'tests/unit/pages/NotFound.test.tsx',
  'tests/e2e/historical-analysis-flow.spec.ts',
  'tests/e2e/api/integration.spec.ts',
  'tests/e2e/visual/basic-screenshots.spec.ts',
  'tests/e2e/visual/regression.spec.ts',
  'tests/e2e/performance/load-testing.spec.ts',
  'tests/performance/historical-analysis-performance.test.ts',
  'tests/performance/load.test.ts',
  'tests/performance/memory.test.ts',
  'tests/performance/stress.test.ts',
  'tests/unit/services/historicalAnalysisService.test.ts',
  'tests/unit/services/yahooFinanceService.test.ts',
  'tests/unit/services/dataSourceManager.test.ts',
  'tests/unit/algorithm-optimization-engine.test.ts',
  'tests/unit/automatic-cleanup-service.test.ts',
  'tests/unit/automatic-cleanup-simple.test.ts',
  'tests/unit/components/cache-quality-service.spec.ts',
  'tests/unit/components/cache-quality-service.config.ts',
];

// Fix all files
filesToProcess.forEach(file => {
  if (fs.existsSync(file)) {
    fixUnusedErrors(file);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('ESLint warnings fix completed!');
