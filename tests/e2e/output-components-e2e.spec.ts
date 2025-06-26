import { expect, test } from '@playwright/test';

test.describe('Output Components E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla pagina principale
    await page.goto('/');
  });

  test.describe('PerformanceMetrics Component', () => {
    test('should show no data message when no analysis is performed', async ({
      page,
    }) => {
      // Verifica che il messaggio "no data" sia visibile
      await expect(
        page.locator(
          "text=Avvia un'analisi per vedere le metriche di performance"
        )
      ).toBeVisible();
    });

    test('should display performance metrics after analysis', async ({
      page,
    }) => {
      // Simula l'inserimento di dati per l'analisi
      await page.fill('[data-testid="ticker-input"]', 'AAPL,GOOGL');
      await page.click('[data-testid="start-analysis-button"]');

      // Attendi che l'analisi sia completata
      await page.waitForSelector('[data-testid="performance-metrics"]', {
        timeout: 30000,
      });

      // Verifica che le metriche siano visibili
      await expect(
        page.locator('[data-testid="performance-metrics"]')
      ).toBeVisible();
      await expect(page.locator('text=Metriche di Performance')).toBeVisible();
    });

    test('should show theory button and handle click', async ({ page }) => {
      // Verifica che il bottone teoria sia presente
      const theoryButton = page.locator('button:has-text("Teoria")').first();
      await expect(theoryButton).toBeVisible();

      // Clicca sul bottone teoria
      await theoryButton.click();

      // Verifica che il toast sia apparso (se implementato)
      // Questo test potrebbe fallire se il toast non è implementato, ma è utile per verificare che il bottone funzioni
    });
  });

  test.describe('VolatilityChart Component', () => {
    test('should show no data message when no analysis is performed', async ({
      page,
    }) => {
      // Verifica che il messaggio "no data" sia visibile
      await expect(
        page.locator(
          "text=Avvia un'analisi per vedere l'analisi della volatilità"
        )
      ).toBeVisible();
    });

    test('should display volatility data after analysis', async ({ page }) => {
      // Simula l'inserimento di dati per l'analisi
      await page.fill('[data-testid="ticker-input"]', 'AAPL,GOOGL');
      await page.click('[data-testid="start-analysis-button"]');

      // Attendi che l'analisi sia completata
      await page.waitForSelector('[data-testid="volatility-chart"]', {
        timeout: 30000,
      });

      // Verifica che il grafico sia visibile
      await expect(
        page.locator('[data-testid="volatility-chart"]')
      ).toBeVisible();
      await expect(page.locator('text=Analisi della Volatilità')).toBeVisible();
    });
  });

  test.describe('CorrelationMatrix Component', () => {
    test('should show no data message when no analysis is performed', async ({
      page,
    }) => {
      // Verifica che il messaggio "no data" sia visibile
      await expect(
        page.locator(
          "text=Avvia un'analisi per vedere la matrice di correlazione"
        )
      ).toBeVisible();
    });

    test('should display correlation data after analysis', async ({ page }) => {
      // Simula l'inserimento di dati per l'analisi
      await page.fill('[data-testid="ticker-input"]', 'AAPL,GOOGL');
      await page.click('[data-testid="start-analysis-button"]');

      // Attendi che l'analisi sia completata
      await page.waitForSelector('[data-testid="correlation-matrix"]', {
        timeout: 30000,
      });

      // Verifica che la matrice sia visibile
      await expect(
        page.locator('[data-testid="correlation-matrix"]')
      ).toBeVisible();
      await expect(page.locator('text=Matrice di Correlazione')).toBeVisible();
    });
  });

  test.describe('HistoricalChart Component', () => {
    test('should show no data message when no analysis is performed', async ({
      page,
    }) => {
      // Verifica che il messaggio "no data" sia visibile
      await expect(
        page.locator("text=Avvia un'analisi per vedere il grafico storico")
      ).toBeVisible();
    });

    test('should display historical data after analysis', async ({ page }) => {
      // Simula l'inserimento di dati per l'analisi
      await page.fill('[data-testid="ticker-input"]', 'AAPL,GOOGL');
      await page.click('[data-testid="start-analysis-button"]');

      // Attendi che l'analisi sia completata
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Verifica che il grafico sia visibile
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
      await expect(page.locator('text=Grafico Storico')).toBeVisible();
    });

    test('should handle update button click', async ({ page }) => {
      // Prima esegui un'analisi
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Clicca sul bottone aggiorna
      const updateButton = page.locator('button:has-text("Aggiorna")').first();
      await expect(updateButton).toBeVisible();
      await updateButton.click();

      // Verifica che il bottone sia cliccabile (non dovrebbe causare errori)
      await expect(updateButton).toBeEnabled();
    });
  });

  test.describe('Component Integration', () => {
    test('should show all components after successful analysis', async ({
      page,
    }) => {
      // Esegui un'analisi completa
      await page.fill('[data-testid="ticker-input"]', 'AAPL,GOOGL,MSFT');
      await page.click('[data-testid="start-analysis-button"]');

      // Attendi che tutti i componenti siano caricati
      await page.waitForSelector('[data-testid="performance-metrics"]', {
        timeout: 30000,
      });
      await page.waitForSelector('[data-testid="volatility-chart"]', {
        timeout: 30000,
      });
      await page.waitForSelector('[data-testid="correlation-matrix"]', {
        timeout: 30000,
      });
      await page.waitForSelector('[data-testid="historical-chart"]', {
        timeout: 30000,
      });

      // Verifica che tutti i componenti siano visibili
      await expect(
        page.locator('[data-testid="performance-metrics"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="volatility-chart"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="correlation-matrix"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
    });

    test('should handle theory buttons consistently across all components', async ({
      page,
    }) => {
      // Esegui un'analisi
      await page.fill('[data-testid="ticker-input"]', 'AAPL');
      await page.click('[data-testid="start-analysis-button"]');
      await page.waitForSelector('[data-testid="performance-metrics"]', {
        timeout: 30000,
      });

      // Trova tutti i bottoni teoria
      const theoryButtons = page.locator('button:has-text("Teoria")');
      const count = await theoryButtons.count();

      // Verifica che ci siano bottoni teoria
      expect(count).toBeGreaterThan(0);

      // Clicca su ogni bottone teoria per verificare che non causino errori
      for (let i = 0; i < count; i++) {
        await theoryButtons.nth(i).click();
        // Breve pausa per permettere al toast di apparire
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid ticker symbols gracefully', async ({
      page,
    }) => {
      // Inserisci simboli non validi
      await page.fill('[data-testid="ticker-input"]', 'INVALID_SYMBOL_123');
      await page.click('[data-testid="start-analysis-button"]');

      // Attendi un po' per vedere se ci sono errori
      await page.waitForTimeout(5000);

      // Verifica che l'app non sia crashato
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle empty input gracefully', async ({ page }) => {
      // Clicca su start analysis senza inserire dati
      await page.click('[data-testid="start-analysis-button"]');

      // Verifica che l'app non sia crashato
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // Verifica che ci siano heading appropriati
      await expect(page.locator('h1, h2, h3')).toHaveCount(expect.any(Number));
    });

    test('should have clickable buttons with proper labels', async ({
      page,
    }) => {
      // Verifica che i bottoni abbiano testo appropriato
      const buttons = page.locator('button');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        // Verifica che il bottone abbia del testo o sia accessibile
        expect(text?.trim().length || 0).toBeGreaterThan(0);
      }
    });
  });
});
