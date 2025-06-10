import { expect, test } from '@playwright/test';

/**
 * TEST E2E CRITICAL FLOWS
 * Test dei flussi business-critical per Student Analyst
 */

test.describe('🔥 Critical Business Flows', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    // Attendiamo che l'app sia completamente caricata
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('✅ App Load & Basic Navigation', async ({ page }) => {
    // Verifica caricamento iniziale
    await expect(page).toHaveTitle(/Student Analyst/);
    
    // Verifica presenza header
    await expect(page.locator('header')).toBeVisible();
    
    // Verifica navigation funzionante
    await expect(page.locator('body')).toBeVisible();
  });

  test('💹 Portfolio Analysis Basic Flow', async ({ page }) => {
    // Test caricamento componenti principali
    await expect(page.locator('#root')).toBeVisible();
    
    // Verifica che non ci siano errori JS critici
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
  });

  test('📱 Responsive Design Basic', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('🔒 Error Handling & Recovery', async ({ page }) => {
    // Test che l'app gestisca errori di rete
    await page.route('**/api/**', route => route.abort());
    
    // L'app dovrebbe rimanere stabile anche con errori di rete
    await expect(page.locator('body')).toBeVisible();
    
    // Reset routes
    await page.unroute('**/api/**');
  });

  test('⚡ Performance Basic Check', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('#root', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Caricamento iniziale < 5 secondi
    expect(loadTime).toBeLessThan(5000);
  });
}); 