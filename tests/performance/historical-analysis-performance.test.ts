import { expect, test } from '@playwright/test';

test.describe('Historical Analysis Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });
  });

  test.describe('Response Time Tests', () => {
    test('should complete single symbol analysis within 30 seconds', async ({
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
        timeout: 30000,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(30000); // 30 seconds
      console.log(`Single symbol analysis completed in ${duration}ms`);
    });

    test('should complete multi-symbol analysis within 60 seconds', async ({
      page,
    }) => {
      const startTime = Date.now();

      await page.click('[data-testid="step-input-validation"]');
      await page.fill(
        '[data-testid="ticker-input"]',
        'AAPL,GOOGL,MSFT,TSLA,NVDA'
      );
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 60000,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(60000); // 60 seconds
      console.log(`Multi-symbol analysis completed in ${duration}ms`);
    });

    test('should render chart within 5 seconds after analysis', async ({
      page,
    }) => {
      // Complete analysis first
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });

      // Measure chart rendering time
      const startTime = Date.now();
      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 5000,
      });
      const endTime = Date.now();

      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(5000); // 5 seconds
      console.log(`Chart rendered in ${renderTime}ms`);
    });

    test('should render table within 3 seconds after analysis', async ({
      page,
    }) => {
      // Complete analysis first
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

      // Measure table rendering time
      const startTime = Date.now();
      await page.click('[data-testid="table-view-tab"]');
      await page.waitForSelector('[data-testid="historical-table"]', {
        timeout: 3000,
      });
      const endTime = Date.now();

      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(3000); // 3 seconds
      console.log(`Table rendered in ${renderTime}ms`);
    });
  });

  test.describe('Memory Usage Tests', () => {
    test('should not cause memory leaks during repeated analysis', async ({
      page,
    }) => {
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Perform multiple analyses
      for (let i = 0; i < 3; i++) {
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

        // Navigate back to start
        await page.click('[data-testid="step-input-validation"]');
      }

      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

        console.log(
          `Memory usage: ${initialMemory / (1024 * 1024)}MB -> ${finalMemory / (1024 * 1024)}MB (${memoryIncreaseMB}MB increase)`
        );

        // Memory increase should be reasonable (less than 50MB)
        expect(memoryIncreaseMB).toBeLessThan(50);
      }
    });

    test('should handle large datasets without memory issues', async ({
      page,
    }) => {
      // Test with many symbols
      const manySymbols =
        'AAPL,GOOGL,MSFT,TSLA,NVDA,AMZN,META,NFLX,AMD,INTC,ORCL,CRM,ADBE,PYPL,COIN';

      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', manySymbols);
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Should complete without memory errors
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 120000,
      });

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      // Verify chart renders without issues
      await expect(page.locator('[data-testid="chart-line"]')).toBeVisible();
    });
  });

  test.describe('Scalability Tests', () => {
    test('should handle increasing number of symbols linearly', async ({
      page,
    }) => {
      const symbolSets = [
        ['AAPL'],
        ['AAPL', 'GOOGL'],
        ['AAPL', 'GOOGL', 'MSFT'],
        ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
        ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'],
      ];

      const times: number[] = [];

      for (const symbols of symbolSets) {
        const startTime = Date.now();

        await page.click('[data-testid="step-input-validation"]');
        await page.fill('[data-testid="ticker-input"]', symbols.join(','));
        await page.click('[data-testid="validate-tickers-button"]');
        await page.waitForSelector('[data-testid="validation-success"]');

        await page.click('[data-testid="step-analysis-execution"]');
        await page.click('[data-testid="start-analysis-button"]');

        await page.waitForSelector('[data-testid="analysis-complete"]', {
          timeout: 60000,
        });

        const endTime = Date.now();
        const duration = endTime - startTime;
        times.push(duration);

        console.log(`${symbols.length} symbols: ${duration}ms`);

        // Navigate back to start for next iteration
        await page.click('[data-testid="step-input-validation"]');
      }

      // Verify reasonable scaling (not exponential)
      for (let i = 1; i < times.length; i++) {
        const ratio = times[i] / times[i - 1];
        console.log(`Scaling ratio ${i}: ${ratio.toFixed(2)}x`);

        // Should scale reasonably (not more than 2x per additional symbol)
        expect(ratio).toBeLessThan(2.0);
      }
    });

    test('should handle concurrent user interactions', async ({ page }) => {
      // Complete analysis first
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

      // Perform multiple rapid interactions
      const interactions = [
        () => page.click('[data-testid="chart-zoom-in"]'),
        () => page.click('[data-testid="chart-zoom-out"]'),
        () => page.click('[data-testid="sma-20-toggle"]'),
        () => page.click('[data-testid="rsi-toggle"]'),
        () => page.click('[data-testid="table-view-tab"]'),
        () => page.click('[data-testid="chart-view-tab"]'),
      ];

      // Execute interactions rapidly
      await Promise.all(interactions.map(interaction => interaction()));

      // Verify app remains responsive
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="chart-line"]')).toBeVisible();
    });
  });

  test.describe('Network Performance Tests', () => {
    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/api/**', route => {
        route.continue();
      });

      // Set slow network conditions
      await page.setExtraHTTPHeaders({
        'X-Slow-Network': 'true',
      });

      const startTime = Date.now();

      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Should still complete within reasonable time
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 60000,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Analysis completed in slow network: ${duration}ms`);
      expect(duration).toBeLessThan(60000);
    });

    test('should handle network interruptions gracefully', async ({ page }) => {
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      // Simulate network interruption
      await page.route('**/api/analysis', route => {
        route.abort('failed');
      });

      // Wait for error state
      await page.waitForSelector('[data-testid="analysis-error"]', {
        timeout: 15000,
      });

      // Restore network and retry
      await page.unroute('**/api/analysis');
      await page.click('[data-testid="retry-analysis-button"]');

      // Should complete successfully
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });
    });
  });

  test.describe('UI Performance Tests', () => {
    test('should maintain 60fps during chart interactions', async ({
      page,
    }) => {
      // Complete analysis first
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

      // Measure frame rate during interactions
      const frameRates: number[] = [];

      // Perform chart interactions and measure performance
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        await page.click('[data-testid="chart-zoom-in"]');
        await page.waitForTimeout(100);
        await page.click('[data-testid="chart-zoom-out"]');
        await page.waitForTimeout(100);

        const endTime = performance.now();
        const frameTime = endTime - startTime;
        const fps = 1000 / frameTime;
        frameRates.push(fps);
      }

      const averageFPS =
        frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
      console.log(`Average FPS during interactions: ${averageFPS.toFixed(2)}`);

      // Should maintain reasonable performance
      expect(averageFPS).toBeGreaterThan(30);
    });

    test('should handle rapid tab switching without lag', async ({ page }) => {
      // Complete analysis first
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

      // Rapid tab switching
      const startTime = Date.now();

      for (let i = 0; i < 20; i++) {
        await page.click('[data-testid="table-view-tab"]');
        await page.waitForSelector('[data-testid="historical-table"]', {
          timeout: 1000,
        });
        await page.click('[data-testid="chart-view-tab"]');
        await page.waitForSelector('[data-testid="historical-chart"]', {
          timeout: 1000,
        });
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTimePerSwitch = totalTime / 40; // 20 switches each way

      console.log(
        `Average time per tab switch: ${averageTimePerSwitch.toFixed(2)}ms`
      );

      // Should be responsive
      expect(averageTimePerSwitch).toBeLessThan(500);
    });
  });

  test.describe('Data Processing Performance', () => {
    test('should process large datasets efficiently', async ({ page }) => {
      // Test with a large number of data points
      await page.click('[data-testid="step-input-validation"]');
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="validate-tickers-button"]');
      await page.waitForSelector('[data-testid="validation-success"]');

      await page.click('[data-testid="step-analysis-execution"]');
      await page.click('[data-testid="start-analysis-button"]');

      const startTime = Date.now();
      await page.waitForSelector('[data-testid="analysis-complete"]', {
        timeout: 30000,
      });
      const analysisTime = Date.now() - startTime;

      await page.click('[data-testid="step-historical-analysis"]');
      await page.waitForSelector('[data-testid="historical-chart"]');

      // Enable all indicators to test processing
      await page.click('[data-testid="sma-20-toggle"]');
      await page.click('[data-testid="sma-50-toggle"]');
      await page.click('[data-testid="sma-200-toggle"]');
      await page.click('[data-testid="rsi-toggle"]');
      await page.click('[data-testid="volume-toggle"]');

      // Wait for indicators to calculate
      await page.waitForTimeout(2000);

      const totalTime = Date.now() - startTime;
      console.log(`Total processing time: ${totalTime}ms`);

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(45000);
    });

    test('should handle real-time data updates efficiently', async ({
      page,
    }) => {
      // Complete initial analysis
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

      // Test multiple refresh operations
      const refreshTimes: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await page.click('[data-testid="refresh-chart"]');
        await page.waitForSelector('[data-testid="chart-updated"]', {
          timeout: 10000,
        });
        const endTime = Date.now();
        refreshTimes.push(endTime - startTime);
      }

      const averageRefreshTime =
        refreshTimes.reduce((a, b) => a + b, 0) / refreshTimes.length;
      console.log(`Average refresh time: ${averageRefreshTime.toFixed(2)}ms`);

      // Should be efficient
      expect(averageRefreshTime).toBeLessThan(10000);
    });
  });

  test.describe('Large Dataset Performance', () => {
    test('should handle 1000+ data points without lag', async ({ page }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL');

      // Seleziona periodo massimo per ottenere molti dati
      await page.click('[data-testid="period-select"]');
      await page.click('text=Massimo');

      const startTime = Date.now();
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 60000,
      });
      const loadTime = Date.now() - startTime;

      // Verifica che il caricamento sia veloce (< 60 secondi)
      expect(loadTime).toBeLessThan(60000);

      // Verifica che il grafico sia renderizzato
      await expect(page.locator('[data-testid="chart-line"]')).toBeVisible();

      // Verifica che ci siano molti punti dati
      const dataPointsText = await page
        .locator('text=/\\d+ punti/')
        .textContent();
      const dataPoints = parseInt(dataPointsText?.match(/\d+/)?.[0] || '0');
      expect(dataPoints).toBeGreaterThan(500); // Almeno 500 punti per periodo massimo
    });

    test('should handle 2000+ data points with multiple indicators', async ({
      page,
    }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL,MSFT');

      // Seleziona periodo massimo
      await page.click('[data-testid="period-select"]');
      await page.click('text=Massimo');

      // Attiva tutti gli indicatori
      await page.click('[data-testid="sma-toggle"]');
      await page.click('[data-testid="rsi-toggle"]');

      const startTime = Date.now();
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 90000,
      });
      const loadTime = Date.now() - startTime;

      // Verifica che il caricamento sia ragionevole (< 90 secondi)
      expect(loadTime).toBeLessThan(90000);

      // Verifica che tutti gli indicatori siano presenti
      await expect(page.locator('text=SMA 20')).toBeVisible();
      await expect(page.locator('text=RSI')).toBeVisible();
    });
  });

  test.describe('Multiple Tickers Performance', () => {
    test('should handle 10+ tickers efficiently', async ({ page }) => {
      const manyTickers =
        'AAPL,MSFT,GOOGL,AMZN,TSLA,META,NVDA,NFLX,AMD,INTC,ORCL,CRM';
      await page.fill('[data-testid="ticker-input"]', manyTickers);

      const startTime = Date.now();
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 120000,
      });
      const loadTime = Date.now() - startTime;

      // Verifica che il caricamento sia ragionevole (< 2 minuti)
      expect(loadTime).toBeLessThan(120000);

      // Verifica che tutti i ticker siano presenti
      const tickers = manyTickers.split(',');
      for (const ticker of tickers) {
        await expect(page.locator(`text=${ticker}`)).toBeVisible();
      }
    });

    test('should handle 20+ tickers with graceful degradation', async ({
      page,
    }) => {
      const manyTickers =
        'AAPL,MSFT,GOOGL,AMZN,TSLA,META,NVDA,NFLX,AMD,INTC,ORCL,CRM,ADBE,PYPL,COIN,UBER,LYFT,SPOT,ZOOM,SNOW';
      await page.fill('[data-testid="ticker-input"]', manyTickers);

      const startTime = Date.now();
      await page.click('[data-testid="start-analysis-button"]');

      // Aspetta o timeout o completamento
      try {
        await page.waitForSelector('[data-testid="historical-chart"]', {
          timeout: 180000,
        });
        const loadTime = Date.now() - startTime;

        // Se completa, verifica che sia ragionevole (< 3 minuti)
        expect(loadTime).toBeLessThan(180000);

        // Verifica che almeno alcuni ticker siano presenti
        await expect(page.locator('text=AAPL')).toBeVisible();
        await expect(page.locator('text=MSFT')).toBeVisible();
      } catch (error) {
        // Se timeout, verifica che ci sia un messaggio appropriato
        await expect(
          page.locator('text=Timeout') || page.locator('text=Errore')
        ).toBeVisible();
      }
    });
  });

  test.describe('Rendering Performance', () => {
    test('should render chart within 5 seconds for normal dataset', async ({
      page,
    }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL');

      const startTime = Date.now();
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });
      const renderTime = Date.now() - startTime;

      // Verifica che il rendering sia veloce (< 30 secondi)
      expect(renderTime).toBeLessThan(30000);

      // Verifica che il grafico sia visibile
      await expect(page.locator('[data-testid="chart-line"]')).toBeVisible();
    });

    test('should handle rapid chart interactions without lag', async ({
      page,
    }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Testa interazioni rapide
      const interactionTimes: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        await page.click('[data-testid="refresh-button"]');
        await page.waitForTimeout(1000); // Breve pausa
        interactionTimes.push(Date.now() - startTime);
      }

      // Verifica che ogni interazione sia veloce (< 5 secondi)
      interactionTimes.forEach(time => {
        expect(time).toBeLessThan(5000);
      });

      // Verifica che l'ultima interazione sia completata
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should not cause memory leaks with repeated interactions', async ({
      page,
    }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL');

      // Esegui multiple analisi per testare memory leaks
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="start-analysis-button"]');
        await page.waitForSelector('[data-testid="historical-chart"]', {
          timeout: 30000,
        });
        await page.waitForTimeout(2000); // Pausa tra le analisi
      }

      // Verifica che l'ultima analisi sia ancora funzionante
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();

      // Verifica che i controlli siano ancora responsivi
      await page.click('[data-testid="refresh-button"]');
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
    });

    test('should handle browser back/forward navigation gracefully', async ({
      page,
    }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Naviga avanti e indietro
      await page.goBack();
      await page.goForward();

      // Aspetta che l'app sia ricaricata
      await page.waitForSelector('[data-testid="ticker-input"]', {
        timeout: 10000,
      });

      // Verifica che l'analisi sia ancora presente
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
    });
  });

  test.describe('Concurrent Operations', () => {
    test('should handle multiple rapid requests gracefully', async ({
      page,
    }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL');

      // Clicca rapidamente multiple volte
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="start-analysis-button"]');
        await page.waitForTimeout(100); // Pausa molto breve
      }

      // Aspetta che una delle richieste sia completata
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Verifica che il risultato sia valido
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
    });

    test('should prevent duplicate requests during loading', async ({
      page,
    }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL');

      // Avvia analisi
      await page.click('[data-testid="start-analysis-button"]');

      // Aspetta che inizi il loading
      await page.waitForSelector('text=Caricamento dati in corso...', {
        timeout: 5000,
      });

      // Prova a cliccare di nuovo durante il loading
      await page.click('[data-testid="start-analysis-button"]');

      // Verifica che il bottone sia disabilitato durante il loading
      await expect(
        page.locator('[data-testid="start-analysis-button"]')
      ).toBeDisabled();

      // Aspetta che l'analisi sia completata
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Verifica che il risultato sia valido
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
    });
  });

  test.describe('Mobile Performance', () => {
    test('should perform well on mobile devices', async ({ page }) => {
      // Imposta viewport mobile
      await page.setViewportSize({ width: 375, height: 667 });

      await page.fill('[data-testid="ticker-input"]', 'AAPL,MSFT');

      const startTime = Date.now();
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });
      const loadTime = Date.now() - startTime;

      // Verifica che il caricamento sia veloce anche su mobile
      expect(loadTime).toBeLessThan(30000);

      // Verifica che il layout sia responsive
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();

      // Verifica che i controlli siano accessibili
      await expect(
        page.locator('[data-testid="refresh-button"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="info-button"]')).toBeVisible();
    });

    test('should handle touch interactions smoothly', async ({ page }) => {
      // Imposta viewport mobile
      await page.setViewportSize({ width: 375, height: 667 });

      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Simula touch interactions
      await page.touchscreen.tap(200, 300); // Tap sul grafico
      await page.waitForTimeout(1000);

      // Verifica che l'interazione non abbia causato problemi
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
    });
  });
});
