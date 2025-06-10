import { expect, test } from '@playwright/test';

/**
 * BASIC VISUAL TESTING
 * Screenshot test semplificati per regression detection
 */

test.describe('📸 Visual Regression - Basic', () => {
  
  test('🏠 Homepage Screenshot', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    
    // Attendi stabilizzazione
    await page.waitForTimeout(2000);
    
    // Screenshot senza elementi dinamici problematici
    await expect(page).toHaveScreenshot('homepage-stable.png', {
      fullPage: true,
      // Maschera elementi che potrebbero essere dinamici
      mask: [
        page.locator('[class*="loading"]'),
        page.locator('[class*="spinner"]'),
        page.locator('[id*="timestamp"]')
      ]
    });
  });

  test('📱 Mobile View', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('mobile-view.png', {
      fullPage: true
    });
  });

  test('💻 Desktop View', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('desktop-view.png', {
      fullPage: false, // Solo viewport per desktop
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
  });

  test('🎨 Theme Consistency', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Screenshot del tema corrente
    await expect(page).toHaveScreenshot('current-theme.png', {
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
  });

  test('🔧 Error State Visual', async ({ page }) => {
    // Simula errore di rete
    await page.route('**/*', route => {
      if (route.request().url().includes('api')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);
    
    // Screenshot dello stato con errori di rete
    await expect(page).toHaveScreenshot('network-error-state.png', {
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
    
    await page.unroute('**/*');
  });
}); 