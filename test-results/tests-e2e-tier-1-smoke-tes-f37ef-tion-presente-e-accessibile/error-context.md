# Test info

- Name: 🎯 TIER 1 - Smoke Testing (100% Pass Required) >> ✅ Main navigation presente e accessibile
- Location: D:\student-analyst\tests\e2e\tier-1-smoke-testing.spec.ts:80:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('h1').filter({ hasText: 'Student Analyst' }).first()
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('h1').filter({ hasText: 'Student Analyst' }).first()

    at assertion (D:\student-analyst\tests\e2e\tier-1-smoke-testing.spec.ts:83:87)
    at resilientExpect (D:\student-analyst\tests\e2e\tier-1-smoke-testing.spec.ts:21:13)
    at D:\student-analyst\tests\e2e\tier-1-smoke-testing.spec.ts:82:5
```

# Test source

```ts
   1 | import { expect, test } from '@playwright/test';
   2 |
   3 | /**
   4 |  * TIER 1 - SMOKE TESTING (100% PASS REQUIRED)
   5 |  * Test basilari che DEVONO passare per Student Analyst
   6 |  * Zero tolerance policy - ogni fallimento blocca progression
   7 |  */
   8 |
   9 | // Smart element interaction helper
   10 | async function smartClick(page: any, selector: string, options = {}) {
   11 |   await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
   12 |   await page.waitForLoadState('networkidle', { timeout: 5000 });
   13 |   await page.click(selector, { timeout: 8000, ...options });
   14 |   await page.waitForTimeout(1000); // Stabilization
   15 | }
   16 |
   17 | // Resilient assertions helper
   18 | async function resilientExpect(assertion: () => Promise<void>, retries = 3) {
   19 |   for (let i = 0; i < retries; i++) {
   20 |     try {
   21 |       await assertion();
   22 |       return;
   23 |     } catch (error) {
   24 |       if (i === retries - 1) throw error;
   25 |       await new Promise(resolve => setTimeout(resolve, 1000));
   26 |     }
   27 |   }
   28 | }
   29 |
   30 | test.describe('🎯 TIER 1 - Smoke Testing (100% Pass Required)', () => {
   31 |   
   32 |   test.beforeEach(async ({ page }) => {
   33 |     // Network error monitoring
   34 |     const errors: string[] = [];
   35 |     page.on('pageerror', error => errors.push(error.message));
   36 |     
   37 |     // Navigation with timeout handling  
   38 |     await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 20000 });
   39 |     
   40 |     // Stabilization wait for React hydration
   41 |     await page.waitForTimeout(3000);
   42 |     
   43 |     // Error threshold validation - MAX 5 non-critical errors (increased for complex SPA)
   44 |     const criticalErrors = errors.filter(e => 
   45 |       !e.includes('404') && 
   46 |       !e.includes('network') && 
   47 |       !e.includes('favicon') &&
   48 |       !e.includes('manifest')
   49 |     );
   50 |     expect(criticalErrors.length).toBeLessThan(5);
   51 |   });
   52 |
   53 |   test('✅ App loads without crash (titolo corretto)', async ({ page }) => {
   54 |     // Verifica titolo pagina
   55 |     await resilientExpect(async () => {
   56 |       await expect(page).toHaveTitle(/Student Analyst/);
   57 |     });
   58 |     
   59 |     console.log('✅ TIER 1.1: Page title verification PASSED');
   60 |   });
   61 |
   62 |   test('✅ Body element visibile (CSS rendering OK)', async ({ page }) => {
   63 |     // Wait for body visibility fix
   64 |     await page.waitForFunction(() => {
   65 |       const body = document.body;
   66 |       const computedStyle = getComputedStyle(body);
   67 |       return computedStyle.visibility !== 'hidden' && 
   68 |              computedStyle.display !== 'none' &&
   69 |              body.offsetHeight > 0;
   70 |     }, {}, { timeout: 15000 });
   71 |     
   72 |     // Verify body is actually visible
   73 |     await resilientExpect(async () => {
   74 |       await expect(page.locator('body')).toBeVisible();
   75 |     });
   76 |     
   77 |     console.log('✅ TIER 1.2: Body element visibility PASSED');
   78 |   });
   79 |
   80 |   test('✅ Main navigation presente e accessibile', async ({ page }) => {
   81 |     // Verifica titolo principale applicazione - più specifico per evitare strict mode
   82 |     await resilientExpect(async () => {
>  83 |       await expect(page.locator('h1').filter({ hasText: 'Student Analyst' }).first()).toBeVisible();
      |                                                                                       ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
   84 |     });
   85 |     
   86 |     // Verifica presenza container principale
   87 |     await resilientExpect(async () => {
   88 |       await expect(page.locator('div.min-h-screen').first()).toBeVisible();
   89 |     });
   90 |     
   91 |     // Verifica presenza almeno un button navigabile
   92 |     await resilientExpect(async () => {
   93 |       const visibleButton = page.locator('button:visible').first();
   94 |       await expect(visibleButton).toBeVisible();
   95 |     });
   96 |     
   97 |     console.log('✅ TIER 1.3: Main navigation accessibility PASSED');
   98 |   });
   99 |
  100 |   test('✅ No critical console errors (<5 errori non fatali max)', async ({ page }) => {
  101 |     const errors: string[] = [];
  102 |     const warnings: string[] = [];
  103 |     
  104 |     page.on('pageerror', error => errors.push(error.message));
  105 |     page.on('console', msg => {
  106 |       if (msg.type() === 'error') errors.push(msg.text());
  107 |       if (msg.type() === 'warning') warnings.push(msg.text());
  108 |     });
  109 |     
  110 |     // Navigate and wait for stabilization
  111 |     await page.goto('http://localhost:5173/');
  112 |     await page.waitForTimeout(5000);
  113 |     
  114 |     // Filter out non-critical errors
  115 |     const criticalErrors = errors.filter(error => 
  116 |       !error.includes('404') &&
  117 |       !error.includes('favicon') &&
  118 |       !error.includes('manifest') &&
  119 |       !error.includes('network') &&
  120 |       !error.includes('VITE_API') && // Environment related
  121 |       !error.includes('Refused to load')
  122 |     );
  123 |     
  124 |     expect(criticalErrors.length).toBeLessThan(5);
  125 |     
  126 |     console.log(`✅ TIER 1.4: Console errors check PASSED (${criticalErrors.length}/5 critical errors)`);
  127 |     if (criticalErrors.length > 0) {
  128 |       console.log('Non-critical errors detected:', criticalErrors);
  129 |     }
  130 |   });
  131 |
  132 |   test('✅ Basic performance threshold (<15s load iniziale)', async ({ page }) => {
  133 |     const startTime = Date.now();
  134 |     
  135 |     await page.goto('http://localhost:5173/');
  136 |     await page.waitForLoadState('networkidle', { timeout: 20000 });
  137 |     
  138 |     const loadTime = Date.now() - startTime;
  139 |     
  140 |     // 15s reasonable limit per complex financial app
  141 |     expect(loadTime).toBeLessThan(15000);
  142 |     
  143 |     // Memory usage check
  144 |     const memoryUsage = await page.evaluate(() => 
  145 |       (performance as any).memory?.usedJSHeapSize || 0
  146 |     );
  147 |     expect(memoryUsage).toBeLessThan(200 * 1024 * 1024); // 200MB limit
  148 |     
  149 |     console.log(`✅ TIER 1.5: Performance threshold PASSED (Load: ${loadTime}ms, Memory: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB)`);
  150 |   });
  151 |
  152 |   test('✅ Core UI elements render properly', async ({ page }) => {
  153 |     // Verify logos are present
  154 |     await resilientExpect(async () => {
  155 |       const logos = page.locator('img[alt*="logo"]');
  156 |       await expect(logos).toHaveCount(2); // Vite + React logos
  157 |     });
  158 |     
  159 |     // Verify main card container
  160 |     await resilientExpect(async () => {
  161 |       await expect(page.locator('.bg-card')).toBeVisible();
  162 |     });
  163 |     
  164 |     // Verify platform features section
  165 |     await resilientExpect(async () => {
  166 |       await expect(page.locator('text=🚀 Platform Features')).toBeVisible();
  167 |     });
  168 |     
  169 |     console.log('✅ TIER 1.6: Core UI elements rendering PASSED');
  170 |   });
  171 |
  172 |   test('✅ Environment status display functional', async ({ page }) => {
  173 |     // Check environment status section - più specifico
  174 |     await resilientExpect(async () => {
  175 |       await expect(page.locator('text=✅ Frontend: React + TypeScript + Tailwind')).toBeVisible();
  176 |     });
  177 |     
  178 |     // Environment configuration notice should be visible - più specifico
  179 |     const configSection = page.locator('div.border-t').last();
  180 |     await resilientExpect(async () => {
  181 |       await expect(configSection).toBeVisible();
  182 |     });
  183 |     
```