import type { AggregatedResult, TestResult } from '@jest/test-result';
import chalk from 'chalk';

const symbols = {
  passed: '✅',
  failed: '❌',
  skipped: '⏭️',
  pending: '⏳',
  todo: '📝',
  error: '💥',
  warning: '⚠️',
  info: 'ℹ️',
  coverage: '📊',
  suite: '📁',
  test: '🧪'
};

class CustomTestReporter {
  onRunComplete(_contexts: Set<any>, results: AggregatedResult) {
    console.log('\n' + chalk.bold.blue('📊 Test Results Summary'));
    console.log('='.repeat(50));

    // Overall Status
    const status = results.numFailedTests === 0 
      ? chalk.green(`${symbols.passed} All Tests Passed!`)
      : chalk.red(`${symbols.failed} ${results.numFailedTests} Tests Failed`);

    console.log(`\n${status}`);
    console.log(`${symbols.test} Total Tests: ${results.numTotalTests}`);
    console.log(`${symbols.passed} Passed: ${chalk.green(results.numPassedTests)}`);
    console.log(`${symbols.failed} Failed: ${chalk.red(results.numFailedTests)}`);
    console.log(`${symbols.skipped} Skipped: ${chalk.yellow(results.numPendingTests)}`);

    // Test Suites
    console.log('\n' + chalk.bold.blue(`${symbols.suite} Test Suites`));
    console.log('-'.repeat(50));
    results.testResults.forEach((suite: TestResult) => {
      const suiteStatus = suite.numFailingTests === 0
        ? chalk.green(`${symbols.passed} PASS`)
        : chalk.red(`${symbols.failed} FAIL`);
      
      console.log(`\n${suiteStatus} ${suite.testFilePath}`);
      
      if (suite.testExecError) {
        console.log(chalk.red(`  ${symbols.error} ${suite.testExecError.message}`));
      }

      suite.testResults.forEach(test => {
        const testStatus = test.status === 'passed'
          ? chalk.green(`${symbols.passed} PASS`)
          : test.status === 'failed'
          ? chalk.red(`${symbols.failed} FAIL`)
          : chalk.yellow(`${symbols.skipped} SKIP`);

        console.log(`  ${testStatus} ${test.title}`);
        
        if (test.failureMessages.length > 0) {
          console.log(chalk.red(`    ${symbols.error} ${test.failureMessages[0]}`));
        }
      });
    });

    // Coverage
    if (results.coverageMap) {
      console.log('\n' + chalk.bold.blue(`${symbols.coverage} Coverage Summary`));
      console.log('-'.repeat(50));
      const coverage = results.coverageMap.getCoverageSummary();
      console.log(`${symbols.info} Statements: ${this.getCoverageColor(coverage.statements.pct)}`);
      console.log(`${symbols.info} Branches: ${this.getCoverageColor(coverage.branches.pct)}`);
      console.log(`${symbols.info} Functions: ${this.getCoverageColor(coverage.functions.pct)}`);
      console.log(`${symbols.info} Lines: ${this.getCoverageColor(coverage.lines.pct)}`);
    }

    console.log('\n' + '='.repeat(50));
  }

  private getCoverageColor(percentage: number): string {
    if (percentage >= 80) return chalk.green(`${percentage}%`);
    if (percentage >= 60) return chalk.yellow(`${percentage}%`);
    return chalk.red(`${percentage}%`);
  }
}

export default CustomTestReporter; 