import { expect, test } from '@playwright/test';

test.describe('Student Analyst E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('App loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Student Analyst/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Student Analyst').first()).toBeVisible();
  });

  test('Basic navigation works', async ({ page }) => {
    await page.click('text=PyScript');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
    
    await page.click('text=Home');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Student Analyst').first()).toBeVisible();
  });

  test('Responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('Performance check', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(15000);
  });

  test('Error resilience', async ({ page }) => {
    await page.route('**/api/**', route => route.abort());
    await page.goto('http://localhost:5173/');
    await expect(page.locator('body')).toBeVisible();
    await page.unroute('**/api/**');
  });
}); 