import { expect, test } from '@playwright/test';

test.describe('Yahoo Finance Integration - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });
  });

  test.describe('Deep Historical Data (15+ Years)', () => {
    test('should fetch 15+ years of historical data for single ticker', async ({
      page,
    }) => {
      // Setup analysis with long timeframe
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Wait for analysis completion with extended timeout for deep data
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 60000, // 60 seconds for deep historical data
      });

      // Navigate to historical analysis
      await page.click('[data-testid="step-historical-analysis"]');

      // Verify deep historical data is loaded
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();

      // Check data points count (should be >4000 for 15+ years)
      const dataPointsText = await page
        .locator('[data-testid="data-points-count"]')
        .textContent();
      const dataPoints = parseInt(dataPointsText || '0');
      expect(dataPoints).toBeGreaterThan(4000);

      // Verify date range spans multiple years
      const dateRangeText = await page
        .locator('[data-testid="date-range"]')
        .textContent();
      expect(dateRangeText).toContain('2010'); // Should include data from 2010 or earlier
    });

    test('should handle very long historical periods (max timeframe)', async ({
      page,
    }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'MSFT');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');

      // Select max timeframe
      await page.selectOption('[data-testid="timeframe-select"]', 'max');
      await page.click('[data-testid="start-analysis-button"]');

      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 90000, // 90 seconds for maximum historical data
      });

      await page.click('[data-testid="step-historical-analysis"]');

      // Verify maximum historical data
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();

      // Check for very large dataset
      const dataPointsText = await page
        .locator('[data-testid="data-points-count"]')
        .textContent();
      const dataPoints = parseInt(dataPointsText || '0');
      expect(dataPoints).toBeGreaterThan(5000); // Should have 5000+ data points
    });

    test('should display loading progress for deep historical data', async ({
      page,
    }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'GOOGL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Verify progress indicators for deep data
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      await expect(
        page.locator('text=Recupero dati storici profondi')
      ).toBeVisible();
      await expect(
        page.locator('text=Elaborazione dati storici')
      ).toBeVisible();

      // Wait for completion
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 60000,
      });
    });
  });

  test.describe('Batch Ticker Processing', () => {
    test('should process multiple tickers with deep historical data', async ({
      page,
    }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill(
        '[data-testid="ticker-input"]',
        'AAPL,MSFT,GOOGL,TSLA,AMZN'
      );
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Wait for batch processing completion
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 120000, // 2 minutes for batch processing
      });

      // Verify all tickers were processed
      await expect(page.locator('text=AAPL')).toBeVisible();
      await expect(page.locator('text=MSFT')).toBeVisible();
      await expect(page.locator('text=GOOGL')).toBeVisible();
      await expect(page.locator('text=TSLA')).toBeVisible();
      await expect(page.locator('text=AMZN')).toBeVisible();

      // Check batch processing statistics
      const processedTickers = await page
        .locator('[data-testid="processed-tickers-count"]')
        .textContent();
      expect(processedTickers).toContain('5');
    });

    test('should handle mixed valid/invalid tickers in batch', async ({
      page,
    }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill(
        '[data-testid="ticker-input"]',
        'AAPL,INVALID123,MSFT,INVALID456,GOOGL'
      );
      await page.click('[data-testid="validate-tickers-button"]');

      // Should show partial validation success
      await expect(
        page.locator('[data-testid="validation-partial-success"]')
      ).toBeVisible();
      await expect(page.locator('text=AAPL')).toBeVisible();
      await expect(page.locator('text=MSFT')).toBeVisible();
      await expect(page.locator('text=GOOGL')).toBeVisible();
      await expect(page.locator('text=INVALID123')).not.toBeVisible();
      await expect(page.locator('text=INVALID456')).not.toBeVisible();

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 90000,
      });

      // Should show results for valid tickers only
      await expect(page.locator('text=AAPL')).toBeVisible();
      await expect(page.locator('text=MSFT')).toBeVisible();
      await expect(page.locator('text=GOOGL')).toBeVisible();
    });

    test('should show batch processing progress', async ({ page }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL,MSFT,GOOGL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Verify batch progress indicators
      await expect(
        page.locator('[data-testid="batch-progress"]')
      ).toBeVisible();
      await expect(
        page.locator('text=Elaborazione ticker 1 di 3')
      ).toBeVisible();
      await expect(
        page.locator('text=Elaborazione ticker 2 di 3')
      ).toBeVisible();
      await expect(
        page.locator('text=Elaborazione ticker 3 di 3')
      ).toBeVisible();

      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 90000,
      });
    });
  });

  test.describe('Fallback System', () => {
    test('should use Alpha Vantage fallback when Yahoo Finance fails', async ({
      page,
    }) => {
      // Mock Yahoo Finance failure and Alpha Vantage success
      await page.route('**/api/financial/AAPL', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                date: '2024-01-01',
                open: 150.0,
                high: 155.5,
                low: 149.25,
                close: 153.75,
                volume: 1000000,
              },
            ],
            metadata: {
              symbol: 'AAPL',
              lastRefreshed: '2024-01-01',
              source: 'alpha_vantage',
              dataPoints: 1,
            },
            source: 'alpha_vantage',
            fallbackUsed: true,
          }),
        });
      });

      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      // Verify fallback was used
      await expect(
        page.locator('[data-testid="fallback-indicator"]')
      ).toBeVisible();
      await expect(
        page.locator('text=Sorgente di fallback utilizzata')
      ).toBeVisible();
    });

    test('should show fallback delay message', async ({ page }) => {
      // Mock Yahoo Finance timeout
      await page.route('**/api/financial/AAPL', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            metadata: { symbol: 'AAPL', source: 'alpha_vantage' },
            source: 'alpha_vantage',
            fallbackUsed: true,
          }),
        });
      });

      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Verify fallback delay message
      await expect(
        page.locator('text=Attivazione sorgente di fallback')
      ).toBeVisible();
      await expect(
        page.locator('text=Utilizzo Alpha Vantage come fallback')
      ).toBeVisible();

      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });
    });

    test('should handle both sources failing gracefully', async ({ page }) => {
      // Mock both sources failing
      await page.route('**/api/financial/AAPL', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              type: 'NETWORK_ERROR',
              message: 'Both sources failed',
            },
          }),
        });
      });

      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Wait for error state
      await page.waitForSelector('[data-testid="analysis-error"]', {
        timeout: 30000,
      });

      // Verify error handling
      await expect(
        page.locator('[data-testid="analysis-error"]')
      ).toBeVisible();
      await expect(
        page.locator('text=Entrambe le sorgenti dati non disponibili')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="retry-analysis-button"]')
      ).toBeVisible();
    });
  });

  test.describe('Data Source Indicators', () => {
    test('should display Yahoo Finance as primary source', async ({ page }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      // Verify Yahoo Finance source indicator
      await expect(
        page.locator('[data-testid="data-source-indicator"]')
      ).toBeVisible();
      await expect(page.locator('text=Yahoo Finance')).toBeVisible();
      await expect(page.locator('text=Sorgente primaria')).toBeVisible();
    });

    test('should show data freshness information', async ({ page }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      // Verify data freshness
      await expect(
        page.locator('[data-testid="data-freshness"]')
      ).toBeVisible();
      await expect(page.locator('text=Ultimo aggiornamento')).toBeVisible();
    });

    test('should display data quality metrics', async ({ page }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      // Verify data quality metrics
      await expect(
        page.locator('[data-testid="data-quality-metrics"]')
      ).toBeVisible();
      await expect(page.locator('text=Qualità dati')).toBeVisible();
      await expect(page.locator('text=Completezza')).toBeVisible();
      await expect(page.locator('text=Accuratezza')).toBeVisible();
    });
  });

  test.describe('Performance and Optimization', () => {
    test('should complete analysis within reasonable time', async ({
      page,
    }) => {
      const startTime = Date.now();

      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 60000,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 60 seconds
      expect(duration).toBeLessThan(60000);
    });

    test('should show performance metrics', async ({ page }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      // Verify performance metrics
      await expect(
        page.locator('[data-testid="performance-metrics"]')
      ).toBeVisible();
      await expect(page.locator('text=Tempo di elaborazione')).toBeVisible();
      await expect(
        page.locator('text=Velocità di recupero dati')
      ).toBeVisible();
    });

    test('should handle concurrent requests efficiently', async ({ page }) => {
      // Start multiple analyses quickly
      const analyses = ['AAPL', 'MSFT', 'GOOGL'];

      for (const ticker of analyses) {
        await page.click('[data-testid="step-input-validation"]');
        await page.fill('[data-testid="ticker-input"]', ticker);
        await page.click('[data-testid="validate-tickers-button"]');
        await page.waitForSelector('[data-testid="validation-success"]');

        await page.click('[data-testid="step-analysis-execution"]');
        await page.click('[data-testid="start-analysis-button"]');
      }

      // All should complete within reasonable time
      for (let i = 0; i < analyses.length; i++) {
        await page.waitForSelector('[data-testid="analysis-complete"]', {
          timeout: 90000, // 90 seconds total for all analyses
        });
      }
    });
  });

  test.describe('Error Handling and User Feedback', () => {
    test('should provide clear error messages for invalid symbols', async ({
      page,
    }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'INVALID999');
      await page.click('[data-testid="validate-tickers-button"]');

      await expect(
        page.locator('[data-testid="validation-error"]')
      ).toBeVisible();
      await expect(page.locator('text=Simbolo non trovato')).toBeVisible();
      await expect(
        page.locator('text=Verifica il simbolo e riprova')
      ).toBeVisible();
    });

    test('should show retry options when analysis fails', async ({ page }) => {
      // Mock analysis failure
      await page.route('**/api/financial/AAPL', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { type: 'NETWORK_ERROR', message: 'Service unavailable' },
          }),
        });
      });

      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      await page.waitForSelector('[data-testid="analysis-error"]', {
        timeout: 30000,
      });

      // Verify retry options
      await expect(
        page.locator('[data-testid="retry-analysis-button"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="try-fallback-button"]')
      ).toBeVisible();
      await expect(
        page.locator('text=Riprova con sorgente alternativa')
      ).toBeVisible();
    });

    test('should provide helpful troubleshooting information', async ({
      page,
    }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'INVALID999');
      await page.click('[data-testid="validate-tickers-button"]');

      await expect(
        page.locator('[data-testid="troubleshooting-info"]')
      ).toBeVisible();
      await expect(page.locator('text=Suggerimenti')).toBeVisible();
      await expect(
        page.locator('text=Verifica la connessione internet')
      ).toBeVisible();
      await expect(
        page.locator('text=Prova con un simbolo diverso')
      ).toBeVisible();
    });
  });
});
