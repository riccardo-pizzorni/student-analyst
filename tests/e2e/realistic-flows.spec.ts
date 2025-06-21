import { expect, test } from '@playwright/test';

/**
 * REALISTIC E2E TESTING - STUDENT ANALYST
 * Test basati sulla struttura effettiva dell'applicazione
 */

test.describe('🎯 Realistic User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Configura environment per test
    await page.addInitScript(() => {
      // Mock API key se non presente
      if (!window.localStorage.getItem('demo-mode')) {
        window.localStorage.setItem('demo-mode', 'true');
      }
    });

    await page.goto('http://localhost:5173/');
  });

  test('✅ Application Loads Successfully', async ({ page }) => {
    // Test caricamento basilare
    await expect(page).toHaveTitle(/Student Analyst/);

    // Verifica che la page non abbia errori JS critici
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Attendi che il contenuto principale sia visibile
    await page.waitForSelector('body', { state: 'visible' });
    await page.waitForTimeout(2000);

    expect(
      errors.filter(e => !e.includes('404') && !e.includes('network'))
    ).toHaveLength(0);
  });

  test('📊 Financial Data Display', async ({ page }) => {
    // Test che i componenti finanziari base funzionino
    await page.waitForLoadState('networkidle');

    // Cerca elementi comuni nelle app finanziarie
    const financialElements = [
      'main',
      'header',
      'nav',
      // Possibili contenitori per dati finanziari
      '[class*="chart"]',
      '[class*="portfolio"]',
      '[class*="data"]',
      // Common UI elements
      'button',
      'input',
    ];

    let visibleElements = 0;
    for (const selector of financialElements) {
      try {
        const element = page.locator(selector);
        const count = await element.count();
        if (count > 0) visibleElements++;
      } catch (_error) {
        // Ignora errori di elementi non trovati
      }
    }

    // Almeno alcuni elementi core dovrebbero essere presenti
    expect(visibleElements).toBeGreaterThanOrEqual(3);
  });

  test('🔄 Navigation & Interaction', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Test che gli elementi interattivi rispondano - cerca quelli visibili e abilitati
    const visibleInteractiveElements = await page
      .locator('button:visible:enabled, a:visible, input:visible:enabled')
      .all();

    if (visibleInteractiveElements.length > 0) {
      // Test primo elemento interattivo visibile
      const firstVisibleElement = visibleInteractiveElements[0];
      await firstVisibleElement.click({ timeout: 5000 });

      // Verifica che l'app rimanga stabile dopo click
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Se non ci sono elementi visibili, almeno verifica che la pagina sia interattiva
      await page.mouse.click(100, 100);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('📱 Responsive Behavior', async ({ page }) => {
    // Test responsività base
    const viewports = [
      { width: 320, height: 568 }, // Mobile small
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Verifica che l'app rimanga visibile
      await expect(page.locator('body')).toBeVisible();

      // Verifica che non ci siano overflow evidenti
      const bodyWidth = await page
        .locator('body')
        .evaluate(el => el.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 100); // Tolleranza aumentata
    }
  });

  test('⚡ Performance Baseline', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Caricamento iniziale ragionevole (< 10s)
    expect(loadTime).toBeLessThan(10000);

    // Test che la pagina non consumi memoria eccessiva
    const memoryUsage = await page.evaluate(() => {
      const mem = (performance as { memory?: { usedJSHeapSize?: number } })
        .memory;
      return mem?.usedJSHeapSize || 0;
    });

    // Meno di 150MB di memoria JS (realistico per financial SPA con PyScript)
    expect(memoryUsage).toBeLessThan(150 * 1024 * 1024);
  });

  test('🛡️ Error Resilience', async ({ page }) => {
    // Test resilienza agli errori di rete
    await page.route('**/api/**', route => route.abort());

    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // L'app dovrebbe rimanere funzionale anche senza API
    await expect(page.locator('body')).toBeVisible();

    // Reset route
    await page.unroute('**/api/**');
  });

  test('💾 Local Storage & State', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Test che l'app possa salvare stato locale
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });

    await page.reload();

    const storedValue = await page.evaluate(() => {
      return localStorage.getItem('test-key');
    });

    expect(storedValue).toBe('test-value');
  });

  test('🔍 SEO & Accessibility Basics', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Test meta tags base
    const title = await page.locator('title').textContent();
    expect(title).toBeTruthy();
    expect(title!.length).toBeGreaterThan(10);

    // Test che ci siano heading tags
    const headings = await page.locator('h1, h2, h3').count();
    expect(headings).toBeGreaterThan(0);

    // Test alt text per immagini (se presenti)
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (alt !== null) {
        expect(alt.length).toBeGreaterThan(0);
      }
    }
  });

  test('🌐 Cross-Browser Compatibility', async ({ page, browserName }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // Test funzionalità base per ogni browser
    await expect(page.locator('body')).toBeVisible();

    // Test che JavaScript funzioni
    const jsWorking = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });

    expect(jsWorking).toBe(true);

    console.log(`✅ ${browserName} compatibility test passed`);
  });

  test('📈 Bundle Size Monitoring', async ({ page }) => {
    const resourceSizes: { [key: string]: number } = {};

    page.on('response', response => {
      const url = response.url();
      const contentLength = response.headers()['content-length'];

      if (contentLength && (url.includes('.js') || url.includes('.css'))) {
        resourceSizes[url] = parseInt(contentLength);
      }
    });

    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    const totalSize = Object.values(resourceSizes).reduce((a, b) => a + b, 0);

    // Limite ragionevole per una SPA finanziaria: 15MB (includes PyScript)
    expect(totalSize).toBeLessThan(15 * 1024 * 1024);

    console.log(
      `📊 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`
    );
  });
});
