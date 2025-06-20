#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- MONITOR STATUS ---');

// Check package.json
const pkg = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(pkg)) {
  console.log('✅ package.json trovato');
} else {
  console.log('❌ package.json mancante');
}

// Check node_modules
const nm = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nm)) {
  console.log('✅ node_modules presente');
} else {
  console.log('⚠️  node_modules mancante');
}

// Check git
try {
  execSync('git status', { cwd: path.join(__dirname, '..'), stdio: 'ignore' });
  console.log('✅ Git repo OK');
} catch {
  console.log('❌ Git non inizializzato');
}

// Check modifiche
try {
  const out = execSync('git status --porcelain', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
  });
  if (out.trim()) {
    console.log('📝 Modifiche non committate');
  } else {
    console.log('✅ Nessuna modifica locale');
  }
} catch {}

// Check dist
const dist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(dist)) {
  console.log('✅ dist presente');
} else {
  console.log('ℹ️  dist non trovato (ok se non buildato)');
}

console.log('--- FINE MONITOR STATUS ---');
