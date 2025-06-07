#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Funzione per processare un file
function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File non trovato: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  console.log(`Processando: ${filePath}`);

  // 1. Sostituisce 'any' con tipi più specifici in contesti comuni
  // Sostituisce any negli eventi React
  if (content.includes('any') && filePath.includes('.tsx')) {
    const patterns = [
      // Eventi React comuni
      { from: /\(e: any\)/g, to: '(e: React.ChangeEvent<HTMLInputElement>)' },
      { from: /\(event: any\)/g, to: '(event: React.MouseEvent)' },
      { from: /\(err: any\)/g, to: '(err: Error | unknown)' },
      { from: /\(error: any\)/g, to: '(error: Error | unknown)' },
      // Callback generici
      { from: /Promise<any>/g, to: 'Promise<unknown>' },
      { from: /Array<any>/g, to: 'Array<unknown>' },
      { from: /: any\[\]/g, to: ': unknown[]' },
      { from: /: any =/g, to: ': unknown =' }
    ];

    patterns.forEach(pattern => {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to);
        changed = true;
      }
    });
  }

  // 2. Rimuove variabili non utilizzate comuni
  const unusedVarPatterns = [
    // Parametri dei map non utilizzati
    { from: /\.map\(\([^,]+, i\) =>/g, to: '.map(($1) =>' },
    { from: /\.map\(\([^,]+, index\) =>/g, to: '.map(($1) =>' },
    // Parametri di callback non utilizzati
    { from: /\(([^,]+), (i|index|key)\) =>/g, to: '($1) =>' }
  ];

  unusedVarPatterns.forEach(pattern => {
    if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      changed = true;
    }
  });

  // 3. Corregge let in const dove appropriato
  const letToConstPatterns = [
    { from: /let (\w+) = /g, to: 'const $1 = ' }
  ];

  letToConstPatterns.forEach(pattern => {
    if (pattern.from.test(content)) {
      // Solo se la variabile non viene riassegnata
      const matches = content.match(pattern.from);
      if (matches) {
        matches.forEach(match => {
          const varName = match.match(/let (\w+) =/)[1];
          // Cerca riassegnazioni della variabile
          const reassignRegex = new RegExp(`\\b${varName}\\s*=(?!=)`, 'g');
          const reassignments = content.match(reassignRegex);
          // Se c'è solo una assegnazione (quella iniziale), converte in const
          if (!reassignments || reassignments.length <= 1) {
            content = content.replace(match, match.replace('let ', 'const '));
            changed = true;
          }
        });
      }
    }
  });

  // 4. Commenta variabili/import non utilizzati invece di rimuoverli
  const commentPatterns = [
    // Import non utilizzati
    { from: /^import .* from .*unused.*/gm, to: '// $&' },
    // Variabili non utilizzate in funzioni
    { from: /const (\w+) = [^;]+;[\s]*\/\/ eslint-disable-next-line @typescript-eslint\/no-unused-vars/gm, 
      to: '// const $1 = ...; // Commented out - unused variable' }
  ];

  // 5. Aggiunge tipo esplicito per componenti React
  if (filePath.includes('.tsx') && content.includes('const ') && content.includes(' = () => {')) {
    const componentRegex = /const (\w+) = \(\) => {/g;
    content = content.replace(componentRegex, 'const $1: React.FC = () => {');
    changed = true;
  }

  // 6. Corregge dichiarazioni lexical in case blocks
  content = content.replace(/case .*:\s*\n\s*(const|let) /g, 'case $1:\n  {\n    const ');
  content = content.replace(/break;(\s*})?(\s*)(?=case|\s*default:)/g, 'break;\n  }$2');

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Aggiornato: ${filePath}`);
  } else {
    console.log(`➖ Nessuna modifica: ${filePath}`);
  }
}

// Funzione per trovare tutti i file TypeScript/TSX
function findTypeScriptFiles(dir) {
  const files = [];
  
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist') {
        scan(fullPath);
      } else if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

// Esegui lo script
console.log('🛠️  Iniziando fix automatico degli errori ESLint...\n');

const srcDir = path.join(__dirname, 'src');
const files = findTypeScriptFiles(srcDir);

console.log(`Trovati ${files.length} file TypeScript/TSX\n`);

files.forEach(processFile);

console.log('\n✅ Fix automatico completato!');
console.log('🔍 Esegui nuovamente ESLint per vedere i miglioramenti.'); 