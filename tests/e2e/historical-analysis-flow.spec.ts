import { expect, test } from '@playwright/test';

test.describe('Historical Analysis Flow - Complete E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to load
    await page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });
  });

  test.describe('Input & Validation Phase', () => {
    test('should accept valid ticker symbols and validate input', async ({
      page,
    }) => {
      // Navigate to input section
      await page.click('[data-testid="step-input-validation"]');

      // Test single ticker input
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');

      await expect(
        page.locator('[data-testid="validation-success"]')
      ).toBeVisible();
      await expect(page.locator('text=AAPL')).toBeVisible();

      // Test multiple ticker input
      await page.fill('[data-testid="ticker-input"]', 'AAPL,GOOGL,MSFT');
      await page.click('[data-testid="validate-tickers-button"]');

      await expect(
        page.locator('[data-testid="validation-success"]')
      ).toBeVisible();
      await expect(page.locator('text=AAPL')).toBeVisible();
      await expect(page.locator('text=GOOGL')).toBeVisible();
      await expect(page.locator('text=MSFT')).toBeVisible();
    });

    test('should reject invalid ticker symbols', async ({ page }) => {
      await page.click('[data-testid="step-input-validation"]');

      // Test invalid ticker
      await page.fill('[data-testid="ticker-input"]', 'INVALID123');
      await page.click('[data-testid="validate-tickers-button"]');

      await expect(
        page.locator('[data-testid="validation-error"]')
      ).toBeVisible();
      await expect(page.locator('text=Simbolo non valido')).toBeVisible();

      // Test empty input
      await page.fill('[data-testid="ticker-input"]', '');
      await page.click('[data-testid="validate-tickers-button"]');

      await expect(
        page.locator('[data-testid="validation-error"]')
      ).toBeVisible();
      await expect(
        page.locator('text=Inserisci almeno un simbolo')
      ).toBeVisible();
    });

    test('should handle special characters and formatting', async ({
      page,
    }) => {
      await page.click('[data-testid="step-input-validation"]');

      // Test with spaces and special characters
      await page.fill('[data-testid="ticker-input"]', ' AAPL , GOOGL , MSFT ');
      await page.click('[data-testid="validate-tickers-button"]');

      await expect(
        page.locator('[data-testid="validation-success"]')
      ).toBeVisible();
      await expect(page.locator('text=AAPL')).toBeVisible();
      await expect(page.locator('text=GOOGL')).toBeVisible();
      await expect(page.locator('text=MSFT')).toBeVisible();
    });
  });

  test.describe('Analysis Execution Phase', () => {
    test('should start analysis with valid tickers', async ({ page }) => {
      // Setup valid tickers
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL,GOOGL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      // Navigate to analysis step
      await page.click('[data-testid="step-analysis-execution"]');

      // Start analysis
      await page.click('[data-testid="start-analysis-button"]');

      // Verify loading state
      await expect(
        page.locator('[data-testid="analysis-loading"]')
      ).toBeVisible();
      await expect(page.locator('text=Analisi in corso...')).toBeVisible();

      // Wait for analysis completion (with timeout)
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      // Verify success state
      await expect(
        page.locator('[data-testid="analysis-success"]')
      ).toBeVisible();
      await expect(
        page.locator('text=Analisi completata con successo')
      ).toBeVisible();
    });

    test('should handle analysis errors gracefully', async ({ page }) => {
      // Setup invalid ticker that will cause API error
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'INVALID999');
      await page.click('[data-testid="validate-tickers-button"]');

      // Navigate to analysis step
      await page.click('[data-testid="step-analysis-execution"]');

      // Start analysis
      await page.click('[data-testid="start-analysis-button"]');

      // Wait for error state
      await page.waitForSelector('[data-testid="analysis-error"]', {
        timeout: 15000,
      });

      // Verify error handling
      await expect(
        page.locator('[data-testid="analysis-error"]')
      ).toBeVisible();
      await expect(page.locator("text=Errore durante l'analisi")).toBeVisible();
      await expect(
        page.locator('[data-testid="retry-analysis-button"]')
      ).toBeVisible();
    });

    test('should show progress indicators during analysis', async ({
      page,
    }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Verify progress indicators
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      await expect(page.locator('text=Recupero dati storici')).toBeVisible();

      // Wait for completion
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });
    });
  });

  test.describe('Historical Chart Visualization', () => {
    test('should display historical chart after successful analysis', async ({
      page,
    }) => {
      // Complete analysis setup
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      // Navigate to historical analysis step
      await page.click('[data-testid="step-historical-analysis"]');

      // Verify chart is displayed
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="chart-line"]')).toBeVisible();

      // Verify chart controls
      await expect(page.locator('[data-testid="chart-zoom-in"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="chart-zoom-out"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="chart-reset"]')).toBeVisible();
    });

    test('should toggle technical indicators', async ({ page }) => {
      // Setup and complete analysis
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      // Test SMA 20 toggle
      const sma20Toggle = page.locator('[data-testid="sma-20-toggle"]');
      await sma20Toggle.click();
      await expect(sma20Toggle).toBeChecked();

      // Test RSI toggle
      const rsiToggle = page.locator('[data-testid="rsi-toggle"]');
      await rsiToggle.click();
      await expect(rsiToggle).toBeChecked();

      // Test Volume toggle
      const volumeToggle = page.locator('[data-testid="volume-toggle"]');
      await volumeToggle.click();
      await expect(volumeToggle).toBeChecked();
    });

    test('should display chart statistics correctly', async ({ page }) => {
      // Setup and complete analysis
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      // Verify statistics are displayed
      await expect(
        page.locator('[data-testid="chart-statistics"]')
      ).toBeVisible();
      await expect(page.locator('text=AAPL')).toBeVisible();

      // Verify performance metrics are shown
      const performanceText = await page
        .locator('[data-testid="performance-summary"]')
        .textContent();
      expect(performanceText).toMatch(/[+-]\d+\.\d+% \| \d+ punti/);
    });

    test('should handle chart interactions (zoom, pan)', async ({ page }) => {
      // Setup and complete analysis
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      // Test zoom in
      await page.click('[data-testid="chart-zoom-in"]');

      // Test zoom out
      await page.click('[data-testid="chart-zoom-out"]');

      // Test reset
      await page.click('[data-testid="chart-reset"]');

      // Verify chart is still visible after interactions
      await expect(page.locator('[data-testid="chart-line"]')).toBeVisible();
    });
  });

  test.describe('Historical Table Visualization', () => {
    test('should display historical table with OHLCV data', async ({
      page,
    }) => {
      // Setup and complete analysis
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      // Switch to table view
      await page.click('[data-testid="table-view-tab"]');

      // Verify table is displayed
      await expect(
        page.locator('[data-testid="historical-table"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="table-header"]')).toBeVisible();

      // Verify table columns
      await expect(page.locator('text=Data')).toBeVisible();
      await expect(page.locator('text=Apertura')).toBeVisible();
      await expect(page.locator('text=Massimo')).toBeVisible();
      await expect(page.locator('text=Minimo')).toBeVisible();
      await expect(page.locator('text=Chiusura')).toBeVisible();
      await expect(page.locator('text=Volume')).toBeVisible();
    });

    test('should sort table columns correctly', async ({ page }) => {
      // Setup and complete analysis
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      await page.click('[data-testid="table-view-tab"]');
      await page.waitForSelector('[data-testid="historical-table"]');

      // Test date sorting
      await page.click('[data-testid="sort-date"]');
      await expect(page.locator('[data-testid="sort-date"]')).toHaveAttribute(
        'data-sort',
        'asc'
      );

      await page.click('[data-testid="sort-date"]');
      await expect(page.locator('[data-testid="sort-date"]')).toHaveAttribute(
        'data-sort',
        'desc'
      );

      // Test close price sorting
      await page.click('[data-testid="sort-close"]');
      await expect(page.locator('[data-testid="sort-close"]')).toHaveAttribute(
        'data-sort',
        'asc'
      );
    });

    test('should filter table data', async ({ page }) => {
      // Setup and complete analysis
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      await page.click('[data-testid="table-view-tab"]');
      await page.waitForSelector('[data-testid="historical-table"]');

      // Test date filter
      await page.fill('[data-testid="date-filter"]', '2024-01-01');
      await expect(page.locator('[data-testid="table-row"]')).toHaveCount(1);

      // Clear filter
      await page.click('[data-testid="clear-filters"]');
      await expect(
        page.locator('[data-testid="table-row"]')
      ).toHaveCount.greaterThan(1);
    });

    test('should handle pagination correctly', async ({ page }) => {
      // Setup and complete analysis with longer timeframe
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      await page.click('[data-testid="table-view-tab"]');
      await page.waitForSelector('[data-testid="historical-table"]');

      // Check if pagination is present (if data is large enough)
      const paginationElement = page.locator('[data-testid="pagination"]');
      if (await paginationElement.isVisible()) {
        // Test next page
        await page.click('[data-testid="next-page"]');
        await expect(
          page.locator('[data-testid="current-page"]')
        ).toContainText('2');

        // Test previous page
        await page.click('[data-testid="prev-page"]');
        await expect(
          page.locator('[data-testid="current-page"]')
        ).toContainText('1');
      }
    });
  });

  test.describe('Export Functionality', () => {
    test('should export historical data to CSV', async ({ page }) => {
      // Setup and complete analysis
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      await page.click('[data-testid="table-view-tab"]');
      await page.waitForSelector('[data-testid="historical-table"]');

      // Test CSV export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain('dati-storici');
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('should show export success message', async ({ page }) => {
      // Setup and complete analysis
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      await page.click('[data-testid="table-view-tab"]');
      await page.waitForSelector('[data-testid="historical-table"]');

      // Mock download to avoid actual file download
      await page.evaluate(() => {
        // Mock the download functionality
        const mockDownload = document.createElement('a');
        mockDownload.href = 'data:text/csv;charset=utf-8,test';
        mockDownload.download = 'dati-storici.csv';
        mockDownload.click();
      });

      await page.click('[data-testid="export-csv"]');

      // Verify success message
      await expect(
        page.locator('[data-testid="export-success"]')
      ).toBeVisible();
      await expect(page.locator('text=Esportazione completata')).toBeVisible();
    });
  });

  test.describe('Error States and Recovery', () => {
    test('should handle network errors during analysis', async ({ page }) => {
      // Mock network error
      await page.route('**/api/analysis', route => {
        route.abort('failed');
      });

      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Wait for error state
      await page.waitForSelector('[data-testid="analysis-error"]', {
        timeout: 10000,
      });

      // Verify error message
      await expect(page.locator('text=Errore di connessione')).toBeVisible();
      await expect(
        page.locator('[data-testid="retry-analysis-button"]')
      ).toBeVisible();
    });

    test('should retry analysis after error', async ({ page }) => {
      // First attempt with error
      await page.route('**/api/analysis', route => {
        route.abort('failed');
      });

      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-error"]', {
        timeout: 10000,
      });

      // Restore normal network and retry
      await page.unroute('**/api/analysis');
      await page.click('[data-testid="retry-analysis-button"]');

      // Wait for success
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });
      await expect(
        page.locator('[data-testid="analysis-success"]')
      ).toBeVisible();
    });

    test('should handle empty analysis results', async ({ page }) => {
      // Mock empty results
      await page.route('**/api/analysis', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              historicalData: {
                labels: [],
                datasets: [],
              },
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
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      await page.click('[data-testid="step-historical-analysis"]');

      // Verify empty state
      await expect(
        page.locator('text=Nessun Dato Storico Disponibile')
      ).toBeVisible();
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should handle multiple symbols efficiently', async ({ page }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill(
        '[data-testid="ticker-input"]',
        'AAPL,GOOGL,MSFT,TSLA,NVDA'
      );
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Should complete within reasonable time
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 60000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      // Verify all symbols are displayed
      await expect(page.locator('text=AAPL')).toBeVisible();
      await expect(page.locator('text=GOOGL')).toBeVisible();
      await expect(page.locator('text=MSFT')).toBeVisible();
      await expect(page.locator('text=TSLA')).toBeVisible();
      await expect(page.locator('text=NVDA')).toBeVisible();
    });

    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      // Verify mobile-friendly layout
      await expect(
        page.locator('[data-testid="mobile-chart-container"]')
      ).toBeVisible();

      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    });
  });

  test.describe('Accessibility and Usability', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.click('[data-testid="step-input-validation"]');

      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="ticker-input"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(
        page.locator('[data-testid="validate-tickers-button"]')
      ).toBeFocused();

      // Test keyboard input
      await page.keyboard.type('AAPL');
      await page.keyboard.press('Enter');

      await page.waitForSelector('[data-testid="validation-success"]');
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.click('[data-testid="step-input-validation"]');

      // Verify ARIA labels
      await expect(
        page.locator('[aria-label="Inserisci simboli dei titoli"]')
      ).toBeVisible();
      await expect(page.locator('[aria-label="Valida simboli"]')).toBeVisible();

      // Verify roles
      await expect(page.locator('[role="textbox"]')).toBeVisible();
      await expect(page.locator('[role="button"]')).toBeVisible();
    });

    test('should provide clear error messages', async ({ page }) => {
      await page.click('[data-testid="step-input-validation"]');

      // Test invalid input
      await page.fill('[data-testid="ticker-input"]', 'INVALID123');
      await page.click('[data-testid="validate-tickers-button"]');

      // Verify clear error message
      await expect(
        page.locator('[data-testid="validation-error"]')
      ).toBeVisible();
      await expect(
        page.locator('text=Il simbolo INVALID123 non è valido')
      ).toBeVisible();

      // Verify error is announced to screen readers
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
    });
  });
});
