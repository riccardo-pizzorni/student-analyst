const { exec } = require('child_process');
const { watch } = require('fs');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs');

fs.appendFileSync(
  '../../auto-deploy-log.txt',
  `[${new Date().toISOString()}] Avvio auto-deploy\n`
);

// Configurazione
const CONFIG = {
  watchDir: path.join(__dirname, '../..'), // Monitora tutto il progetto
  excludeDirs: [
    'node_modules',
    'dist',
    '.git',
    '.vscode',
    'coverage',
    'playwright-report',
    'test-results',
    'artifacts',
    'logs',
    'evidence',
    'public',
    'templates',
  ], // Escludi solo cartelle tecniche
  commitMessage: 'Auto-commit: Aggiornamento automatico', // Messaggio di commit predefinito
  branch: 'main', // Branch su cui fare push
  buildCommand: 'npm run build', // Comando per build
  deployCommand: 'vercel --prod', // Comando per deploy
};

// Colori per i log
const colors = {
  info: chalk.blue,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
};

// Funzione per eseguire comandi
function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(
          colors.error(`Errore nell'esecuzione del comando: ${command}`)
        );
        console.error(colors.error(error));
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(colors.warning(`Warning: ${stderr}`));
      }
      console.log(colors.info(`Output: ${stdout}`));
      resolve(stdout);
    });
  });
}

// Funzione per il processo di deploy
async function deploy() {
  try {
    console.log(colors.info('🚀 Inizio processo di deploy...'));

    // Build dalla root
    console.log(colors.info('📦 Esecuzione build...'));
    await executeCommand('npm run build', {
      cwd: path.join(__dirname, '../../'),
    });

    // Git add
    console.log(colors.info('📝 Aggiunta file modificati...'));
    await executeCommand('git add .', { cwd: path.join(__dirname, '../../') });

    // Git commit
    console.log(colors.info('💾 Commit delle modifiche...'));
    await executeCommand(`git commit -m "${CONFIG.commitMessage}"`, {
      cwd: path.join(__dirname, '../../'),
    });

    // Git push
    console.log(colors.info('⬆️ Push delle modifiche...'));
    await executeCommand(`git push origin ${CONFIG.branch}`, {
      cwd: path.join(__dirname, '../../'),
    });

    // Deploy
    console.log(colors.info('🚀 Deploy su Vercel...'));
    await executeCommand(CONFIG.deployCommand, {
      cwd: path.join(__dirname, '../../'),
    });

    console.log(colors.success('✅ Deploy completato con successo!'));
  } catch (error) {
    console.error(colors.error('❌ Errore durante il deploy:'));
    console.error(colors.error(error));
  }
}

// Funzione per verificare se un file è da escludere
function shouldExcludeFile(filePath) {
  return CONFIG.excludeDirs.some(dir => filePath.includes(dir));
}

// Funzione per il debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Funzione principale di watch
function startWatching() {
  console.log(
    colors.info(`👀 Monitoraggio della directory: ${CONFIG.watchDir}`)
  );

  const debouncedDeploy = debounce(deploy, 2000); // Debounce di 2 secondi

  watch(CONFIG.watchDir, { recursive: true }, (eventType, filename) => {
    if (filename && !shouldExcludeFile(filename)) {
      console.log(colors.info(`📝 Rilevata modifica: ${filename}`));
      debouncedDeploy();
    }
  });
}

// Avvio del monitoraggio
startWatching();
