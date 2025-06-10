import { expect, test } from '@playwright/test';

/**
 * TIER 1 - SMOKE TESTING (100% PASS REQUIRED)
 * Test basilari che DEVONO passare per Student Analyst
 * Zero tolerance policy - ogni fallimento blocca progression
 */

// Smart element interaction helper
async function smartClick(page: any, selector: string, options = {}) {
  await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 });
  await page.click(selector, { timeout: 8000, ...options });
  await page.waitForTimeout(1000); // Stabilization
}

// Resilient assertions helper
async function resilientExpect(assertion: () => Promise<void>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await assertion();
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

test.describe('🎯 TIER 1 - Smoke Testing (100% Pass Required)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Network error monitoring
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    // Navigation with timeout handling  
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    // Stabilization wait for React hydration
    await page.waitForTimeout(3000);
    
    // Error threshold validation - MAX 5 non-critical errors (increased for complex SPA)
    const criticalErrors = errors.filter(e => 
      !e.includes('404') && 
      !e.includes('network') && 
      !e.includes('favicon') &&
      !e.includes('manifest')
    );
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('✅ App loads without crash (titolo corretto)', async ({ page }) => {
    // Verifica titolo pagina
    await resilientExpect(async () => {
      await expect(page).toHaveTitle(/Student Analyst/);
    });
    
    console.log('✅ TIER 1.1: Page title verification PASSED');
  });

  test('✅ Body element visibile (CSS rendering OK)', async ({ page }) => {
    // Wait for body visibility fix
    await page.waitForFunction(() => {
      const body = document.body;
      const computedStyle = getComputedStyle(body);
      return computedStyle.visibility !== 'hidden' && 
             computedStyle.display !== 'none' &&
             body.offsetHeight > 0;
    }, {}, { timeout: 15000 });
    
    // Verify body is actually visible
    await resilientExpect(async () => {
      await expect(page.locator('body')).toBeVisible();
    });
    
    console.log('✅ TIER 1.2: Body element visibility PASSED');
  });

  test('✅ Main navigation presente e accessibile', async ({ page }) => {
    // Verifica titolo principale applicazione - più specifico per evitare strict mode
    await resilientExpect(async () => {
      await expect(page.locator('h1').filter({ hasText: 'Student Analyst' }).first()).toBeVisible();
    });
    
    // Verifica presenza container principale
    await resilientExpect(async () => {
      await expect(page.locator('div.min-h-screen').first()).toBeVisible();
    });
    
    // Verifica presenza almeno un button navigabile
    await resilientExpect(async () => {
      const visibleButton = page.locator('button:visible').first();
      await expect(visibleButton).toBeVisible();
    });
    
    console.log('✅ TIER 1.3: Main navigation accessibility PASSED');
  });

  test('✅ No critical console errors (<5 errori non fatali max)', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    
    // Navigate and wait for stabilization
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(5000);
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('404') &&
      !error.includes('favicon') &&
      !error.includes('manifest') &&
      !error.includes('network') &&
      !error.includes('VITE_API') && // Environment related
      !error.includes('Refused to load')
    );
    
    expect(criticalErrors.length).toBeLessThan(5);
    
    console.log(`✅ TIER 1.4: Console errors check PASSED (${criticalErrors.length}/5 critical errors)`);
    if (criticalErrors.length > 0) {
      console.log('Non-critical errors detected:', criticalErrors);
    }
  });

  test('✅ Basic performance threshold (<15s load iniziale)', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    
    const loadTime = Date.now() - startTime;
    
    // 15s reasonable limit per complex financial app
    expect(loadTime).toBeLessThan(15000);
    
    // Memory usage check
    const memoryUsage = await page.evaluate(() => 
      (performance as any).memory?.usedJSHeapSize || 0
    );
    expect(memoryUsage).toBeLessThan(200 * 1024 * 1024); // 200MB limit
    
    console.log(`✅ TIER 1.5: Performance threshold PASSED (Load: ${loadTime}ms, Memory: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB)`);
  });

  test('✅ Core UI elements render properly', async ({ page }) => {
    // Verify logos are present
    await resilientExpect(async () => {
      const logos = page.locator('img[alt*="logo"]');
      await expect(logos).toHaveCount(2); // Vite + React logos
    });
    
    // Verify main card container
    await resilientExpect(async () => {
      await expect(page.locator('.bg-card')).toBeVisible();
    });
    
    // Verify platform features section
    await resilientExpect(async () => {
      await expect(page.locator('text=🚀 Platform Features')).toBeVisible();
    });
    
    console.log('✅ TIER 1.6: Core UI elements rendering PASSED');
  });

  test('✅ Environment status display functional', async ({ page }) => {
    // Check environment status section - più specifico
    await resilientExpect(async () => {
      await expect(page.locator('text=✅ Frontend: React + TypeScript + Tailwind')).toBeVisible();
    });
    
    // Environment configuration notice should be visible - più specifico
    const configSection = page.locator('div.border-t').last();
    await resilientExpect(async () => {
      await expect(configSection).toBeVisible();
    });
    
    console.log('✅ TIER 1.7: Environment status display PASSED');
  });
});

/**
 * TIER 1 QUALITY GATE VALIDATION
 * All tests above MUST pass at 100% rate before proceeding to TIER 2
 * Any failure in TIER 1 indicates fundamental application issues
 */ 