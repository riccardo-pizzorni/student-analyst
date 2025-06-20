import { chromium, FullConfig } from '@playwright/test';

/**
 * GLOBAL SETUP - ZERO RISK PREPARATION
 * Prepara l'ambiente per esecuzione test perfetta
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 INIZIALIZZAZIONE GLOBAL SETUP');

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Verifica che il server sia raggiungibile
    console.log('🔍 Verifica server accessibility...');
    await page.goto(
      config.projects[0].use?.baseURL || 'http://localhost:5173',
      {
        waitUntil: 'networkidle',
        timeout: 30000,
      }
    );

    // Verifica che la pagina si carichi correttamente
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Server verificato e accessibile');

    // Clear any existing local storage/cookies per fresh start
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('🧹 Storage pulito per fresh start');

    // Pre-warm any critical resources
    const performance = await page.evaluate(() => {
      return {
        loadTime:
          window.performance.timing.loadEventEnd -
          window.performance.timing.navigationStart,
        domReady:
          window.performance.timing.domContentLoadedEventEnd -
          window.performance.timing.navigationStart,
      };
    });

    console.log(
      `⚡ Performance baseline - Load: ${performance.loadTime}ms, DOM: ${performance.domReady}ms`
    );
  } catch (error) {
    console.error('❌ GLOBAL SETUP FAILED:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ GLOBAL SETUP COMPLETATO');
}

export default globalSetup;
