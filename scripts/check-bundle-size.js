#!/usr/bin/env node

/**
 * 📦 Bundle Size Checker for Student Analyst
 *
 * Ensures the application stays within performance limits:
 * - Main bundle < 1MB (for fast loading)
 * - Total assets < 5MB (for reasonable bandwidth usage)
 * - Individual chunks < 500KB (for optimal caching)
 */

import fs from 'fs';
import path from 'path';

const LIMITS = {
  MAIN_BUNDLE_MAX: 1024 * 1024, // 1MB
  TOTAL_ASSETS_MAX: 5 * 1024 * 1024, // 5MB
  INDIVIDUAL_CHUNK_MAX: 500 * 1024, // 500KB
};

function formatBytes(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function analyzeBundleSize() {
  const distPath = path.join(process.cwd(), 'dist');
  const assetsPath = path.join(distPath, 'assets');

  console.log('📦 Analyzing bundle size...\n');

  if (!fs.existsSync(distPath)) {
    console.error('❌ Build directory not found. Run npm run build first.');
    process.exit(1);
  }

  let totalSize = 0;
  let mainBundleSize = 0;
  let warnings = [];
  let errors = [];

  // Analyze assets directory
  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);

    console.log('📁 Assets analysis:');
    files.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      const size = stats.size;
      totalSize += size;

      console.log(`  ${file}: ${formatBytes(size)}`);

      // Check if this is the main bundle (largest JS file)
      if (file.endsWith('.js') && size > mainBundleSize) {
        mainBundleSize = size;
      }

      // Check individual chunk size
      if (size > LIMITS.INDIVIDUAL_CHUNK_MAX) {
        warnings.push(`⚠️  Large chunk: ${file} (${formatBytes(size)})`);
      }
    });
  }

  // Check index.html
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    const indexSize = fs.statSync(indexPath).size;
    totalSize += indexSize;
    console.log(`  index.html: ${formatBytes(indexSize)}`);
  }

  console.log(`\n📊 Bundle Summary:`);
  console.log(`  Main bundle: ${formatBytes(mainBundleSize)}`);
  console.log(`  Total size: ${formatBytes(totalSize)}`);

  // Check limits
  if (mainBundleSize > LIMITS.MAIN_BUNDLE_MAX) {
    errors.push(
      `❌ Main bundle too large: ${formatBytes(mainBundleSize)} > ${formatBytes(LIMITS.MAIN_BUNDLE_MAX)}`
    );
  }

  if (totalSize > LIMITS.TOTAL_ASSETS_MAX) {
    errors.push(
      `❌ Total assets too large: ${formatBytes(totalSize)} > ${formatBytes(LIMITS.TOTAL_ASSETS_MAX)}`
    );
  }

  // Report results
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`  ${warning}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`  ${error}`));
    console.log('\n💡 Consider:');
    console.log('  - Code splitting');
    console.log('  - Tree shaking');
    console.log('  - Asset optimization');
    console.log('  - Lazy loading');
    process.exit(1);
  }

  console.log('\n✅ Bundle size check passed!');

  // Performance recommendations
  if (mainBundleSize > LIMITS.MAIN_BUNDLE_MAX * 0.8) {
    console.log(
      '\n💡 Recommendation: Main bundle is getting large, consider code splitting.'
    );
  }

  if (totalSize > LIMITS.TOTAL_ASSETS_MAX * 0.8) {
    console.log(
      '\n💡 Recommendation: Total assets approaching limit, consider optimization.'
    );
  }
}

// Run the analysis
try {
  analyzeBundleSize();
} catch (error) {
  console.error('❌ Bundle size check failed:', error.message);
  process.exit(1);
}
