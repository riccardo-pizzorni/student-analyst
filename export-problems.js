#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function exportProblems() {
  console.log('🔍 Esportando tutti i problemi...\n');
  
  const problemsReport = {
    timestamp: new Date().toISOString(),
    typescript: {
      errors: [],
      warnings: []
    },
    eslint: {
      errors: [],
      warnings: []
    },
    summary: {
      totalProblems: 0,
      totalErrors: 0,
      totalWarnings: 0
    }
  };

  // 1. TypeScript Check
  console.log('📝 Controllando TypeScript...');
  try {
    const tscOutput = await runCommand('npx', ['tsc', '--noEmit', '--pretty', 'false']);
    if (tscOutput) {
      problemsReport.typescript.errors = tscOutput.split('\n').filter(line => line.trim());
    }
  } catch (error) {
    problemsReport.typescript.errors = error.toString().split('\n').filter(line => line.trim());
  }

  // 2. ESLint Check
  console.log('🔍 Controllando ESLint...');
  try {
    const eslintOutput = await runCommand('npx', ['eslint', 'src', '--ext', '.ts,.tsx', '--format', 'compact']);
    if (eslintOutput) {
      const lines = eslintOutput.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        if (line.includes('error')) {
          problemsReport.eslint.errors.push(line);
        } else if (line.includes('warning')) {
          problemsReport.eslint.warnings.push(line);
        }
      });
    }
  } catch (error) {
    const lines = error.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      if (line.includes('error')) {
        problemsReport.eslint.errors.push(line);
      } else if (line.includes('warning')) {
        problemsReport.eslint.warnings.push(line);
      }
    });
  }

  // 3. Calculate Summary
  problemsReport.summary.totalErrors = 
    problemsReport.typescript.errors.length + problemsReport.eslint.errors.length;
  problemsReport.summary.totalWarnings = 
    problemsReport.typescript.warnings.length + problemsReport.eslint.warnings.length;
  problemsReport.summary.totalProblems = 
    problemsReport.summary.totalErrors + problemsReport.summary.totalWarnings;

  // 4. Save Report
  const reportPath = path.join(__dirname, 'problems-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(problemsReport, null, 2));

  // 5. Create Human-Readable Report
  const humanReport = generateHumanReport(problemsReport);
  const humanReportPath = path.join(__dirname, 'problems-report.txt');
  fs.writeFileSync(humanReportPath, humanReport);

  console.log(`\n✅ Report esportato in:`);
  console.log(`📄 JSON: ${reportPath}`);
  console.log(`📋 TXT:  ${humanReportPath}`);
  console.log(`\n📊 Riepilogo: ${problemsReport.summary.totalProblems} problemi totali`);
  console.log(`   ❌ ${problemsReport.summary.totalErrors} errori`);
  console.log(`   ⚠️  ${problemsReport.summary.totalWarnings} warning`);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: true });
    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(errorOutput || output);
      }
    });
  });
}

function generateHumanReport(report) {
  let content = '';
  content += `STUDENT ANALYST - PROBLEMS REPORT\n`;
  content += `Generated: ${report.timestamp}\n`;
  content += `${'='.repeat(50)}\n\n`;

  content += `📊 SUMMARY\n`;
  content += `Total Problems: ${report.summary.totalProblems}\n`;
  content += `Total Errors: ${report.summary.totalErrors}\n`;
  content += `Total Warnings: ${report.summary.totalWarnings}\n\n`;

  if (report.typescript.errors.length > 0) {
    content += `❌ TYPESCRIPT ERRORS (${report.typescript.errors.length})\n`;
    content += `${'-'.repeat(30)}\n`;
    report.typescript.errors.forEach((error, i) => {
      content += `${i + 1}. ${error}\n`;
    });
    content += `\n`;
  }

  if (report.eslint.errors.length > 0) {
    content += `❌ ESLINT ERRORS (${report.eslint.errors.length})\n`;
    content += `${'-'.repeat(30)}\n`;
    report.eslint.errors.forEach((error, i) => {
      content += `${i + 1}. ${error}\n`;
    });
    content += `\n`;
  }

  if (report.eslint.warnings.length > 0) {
    content += `⚠️  ESLINT WARNINGS (${report.eslint.warnings.length})\n`;
    content += `${'-'.repeat(30)}\n`;
    report.eslint.warnings.slice(0, 20).forEach((warning, i) => {
      content += `${i + 1}. ${warning}\n`;
    });
    if (report.eslint.warnings.length > 20) {
      content += `... and ${report.eslint.warnings.length - 20} more warnings\n`;
    }
  }

  return content;
}

// Run the export
exportProblems().catch(console.error); 