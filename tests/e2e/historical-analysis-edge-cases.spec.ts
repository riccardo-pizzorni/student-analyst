import { expect, test } from '@playwright/test';

test.describe('Historical Analysis Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Aspetta che l'app sia caricata
    await page.waitForSelector('[data-testid="ticker-input"]', {
      timeout: 10000,
    });
  });

  test.describe('Incomplete Data Series', () => {
    test('should handle META with incomplete data (stops at 2013)', async ({
      page,
    }) => {
      // Inserisci ticker che ha dati incompleti
      await page.fill('[data-testid="ticker-input"]', 'META,AAPL');

      // Seleziona periodo lungo per evidenziare i buchi
      await page.click('[data-testid="period-select"]');
      await page.click('text=5 anni');

      // Avvia analisi
      await page.click('[data-testid="start-analysis-button"]');

      // Aspetta che l'analisi sia completata
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Verifica che il warning per serie incompleta sia presente
      await expect(
        page.locator(
          'text=Attenzione: dati disponibili solo fino a una certa data per META'
        )
      ).toBeVisible();
      await expect(
        page.locator('text=Verifica la copertura storica del titolo')
      ).toBeVisible();

      // Verifica che il grafico sia renderizzato
      await expect(page.locator('[data-testid="chart-line"]')).toBeVisible();
    });

    test('should handle IPO recente (ABNB) with significant gaps', async ({
      page,
    }) => {
      await page.fill('[data-testid="ticker-input"]', 'ABNB');

      // Seleziona periodo che include pre-IPO
      await page.click('[data-testid="period-select"]');
      await page.click('text=5 anni');

      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Verifica warning per buchi temporali
      await expect(
        page.locator('text=Rilevati buchi temporali significativi nei dati')
      ).toBeVisible();
      await expect(
        page.locator('text=IPO recente, merge aziendale o cambio di simbolo')
      ).toBeVisible();
    });
  });

  test.describe('Missing Tickers', () => {
    test('should handle invalid tickers gracefully', async ({ page }) => {
      await page.fill('[data-testid="ticker-input"]', 'INVALID,MISSING,AAPL');

      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Verifica warning per ticker mancanti
      await expect(
        page.locator('text=Ticker INVALID, MISSING non ha dati disponibili')
      ).toBeVisible();
      await expect(
        page.locator('text=Verifica il simbolo o prova un periodo diverso')
      ).toBeVisible();

      // Verifica che AAPL sia ancora visualizzato
      await expect(page.locator('text=AAPL')).toBeVisible();
    });

    test('should handle all invalid tickers', async ({ page }) => {
      await page.fill(
        '[data-testid="ticker-input"]',
        'INVALID1,INVALID2,INVALID3'
      );

      await page.click('[data-testid="start-analysis-button"]');

      // Aspetta messaggio di errore
      await expect(
        page.locator('text=Nessun Dato Storico Disponibile')
      ).toBeVisible();
      await expect(
        page.locator('text=Nessun ticker valido trovato')
      ).toBeVisible();
    });
  });

  test.describe('Long Periods and Different Frequencies', () => {
    test('should handle 15+ years period', async ({ page }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL,MSFT');

      // Seleziona periodo massimo
      await page.click('[data-testid="period-select"]');
      await page.click('text=Massimo');

      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 45000,
      }); // Timeout maggiore per periodo lungo

      // Verifica che il grafico sia renderizzato
      await expect(page.locator('[data-testid="chart-line"]')).toBeVisible();

      // Verifica che i metadata mostrino molti punti dati
      await expect(page.locator('text=/\\d+ punti/')).toBeVisible();
    });

    test('should handle different frequencies', async ({ page }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL');

      // Testa frequenza settimanale
      await page.click('[data-testid="frequency-select"]');
      await page.click('text=Settimanale');

      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Verifica che la frequenza sia corretta nei metadata
      await expect(page.locator('text=Settimanale')).toBeVisible();

      // Testa frequenza mensile
      await page.click('[data-testid="frequency-select"]');
      await page.click('text=Mensile');

      await page.click('[data-testid="refresh-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      await expect(page.locator('text=Mensile')).toBeVisible();
    });
  });

  test.describe('Multiple Tickers Stress Test', () => {
    test('should handle many tickers without performance issues', async ({
      page,
    }) => {
      const manyTickers = 'AAPL,MSFT,GOOGL,AMZN,TSLA,META,NVDA,NFLX,AMD,INTC';
      await page.fill('[data-testid="ticker-input"]', manyTickers);

      const startTime = Date.now();
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 60000,
      }); // Timeout maggiore per molti ticker
      const endTime = Date.now();

      // Verifica che il tempo di risposta sia ragionevole (< 60 secondi)
      expect(endTime - startTime).toBeLessThan(60000);

      // Verifica che tutti i ticker siano presenti
      const tickers = manyTickers.split(',');
      for (const ticker of tickers) {
        await expect(page.locator(`text=${ticker}`)).toBeVisible();
      }

      // Verifica che il grafico sia renderizzato
      await expect(page.locator('[data-testid="chart-line"]')).toBeVisible();
    });

    test('should handle mixed valid/invalid tickers', async ({ page }) => {
      await page.fill(
        '[data-testid="ticker-input"]',
        'AAPL,INVALID,MSFT,MISSING,GOOGL'
      );

      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 45000,
      });

      // Verifica warning per ticker mancanti
      await expect(
        page.locator('text=Ticker INVALID, MISSING non ha dati disponibili')
      ).toBeVisible();

      // Verifica che i ticker validi siano presenti
      await expect(page.locator('text=AAPL')).toBeVisible();
      await expect(page.locator('text=MSFT')).toBeVisible();
      await expect(page.locator('text=GOOGL')).toBeVisible();
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should maintain responsive design on mobile', async ({ page }) => {
      // Imposta viewport mobile
      await page.setViewportSize({ width: 375, height: 667 });

      await page.fill('[data-testid="ticker-input"]', 'AAPL,MSFT');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Verifica che il layout sia responsive
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();

      // Verifica che i controlli siano accessibili su mobile
      await expect(
        page.locator('[data-testid="refresh-button"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="info-button"]')).toBeVisible();
    });

    test('should handle rapid interactions without lag', async ({ page }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Testa interazioni rapide
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="refresh-button"]');
        await page.waitForTimeout(1000); // Breve pausa
      }

      // Verifica che l'ultima interazione sia completata
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
    });
  });

  test.describe('Accessibility and Keyboard Navigation', () => {
    test('should be fully keyboard navigable', async ({ page }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Navigazione con Tab
      await page.keyboard.press('Tab');
      await expect(
        page.locator('[data-testid="refresh-button"]')
      ).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="info-button"]')).toBeFocused();

      // Attivazione con Enter
      await page.keyboard.press('Enter');
      await expect(page.locator('text=Informazioni sul grafico')).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Verifica aria-label sui bottoni
      await expect(
        page.locator('[aria-label="Aggiorna dati storici"]')
      ).toBeVisible();
      await expect(
        page.locator('[aria-label="Informazioni sul grafico"]')
      ).toBeVisible();

      // Verifica aria-label sugli switch
      await expect(
        page.locator('[aria-label="Mostra/nascondi SMA 20"]')
      ).toBeVisible();
      await expect(
        page.locator('[aria-label="Mostra/nascondi RSI"]')
      ).toBeVisible();
    });
  });

  test.describe('Error Recovery', () => {
    test('should recover from network errors', async ({ page }) => {
      // Simula errore di rete (se possibile)
      await page.route('**/api/analysis', route => {
        route.abort('failed');
      });

      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="start-analysis-button"]');

      // Aspetta messaggio di errore
      await expect(page.locator('text=Errore di connessione')).toBeVisible();

      // Ripristina connessione normale
      await page.unroute('**/api/analysis');

      // Riprova
      await page.click('[data-testid="retry-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
    });

    test('should handle partial data failures gracefully', async ({ page }) => {
      await page.fill('[data-testid="ticker-input"]', 'AAPL,INVALID,MSFT');

      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Verifica che l'analisi continui con i dati disponibili
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
      await expect(page.locator('text=AAPL')).toBeVisible();
      await expect(page.locator('text=MSFT')).toBeVisible();

      // Verifica warning per dati mancanti
      await expect(page.locator('text=INVALID')).toBeVisible();
    });
  });
});
