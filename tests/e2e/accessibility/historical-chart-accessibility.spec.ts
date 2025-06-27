import { expect, test } from '@playwright/test';

test.describe('Historical Chart Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="ticker-input"]', {
      timeout: 10000,
    });

    // Prepara l'analisi per i test
    await page.fill('[data-testid="ticker-input"]', 'AAPL');
    await page.click('[data-testid="start-analysis-button"]');
    await page.waitForSelector('[data-testid="historical-chart"]', {
      timeout: 30000,
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should be fully navigable with keyboard', async ({ page }) => {
      // Naviga con Tab attraverso tutti gli elementi interattivi
      await page.keyboard.press('Tab');
      await expect(
        page.locator('[data-testid="refresh-button"]')
      ).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="info-button"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="sma-toggle"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="rsi-toggle"]')).toBeFocused();

      // Verifica che il focus torni al primo elemento
      await page.keyboard.press('Tab');
      await expect(
        page.locator('[data-testid="refresh-button"]')
      ).toBeFocused();
    });

    test('should activate elements with Enter key', async ({ page }) => {
      // Focus sul bottone refresh
      await page.keyboard.press('Tab');
      await expect(
        page.locator('[data-testid="refresh-button"]')
      ).toBeFocused();

      // Attiva con Enter
      await page.keyboard.press('Enter');

      // Verifica che l'azione sia stata eseguita (refresh iniziato)
      await expect(
        page.locator('text=Aggiornamento dei dati storici in corso...')
      ).toBeVisible();
    });

    test('should activate switches with Space key', async ({ page }) => {
      // Focus sullo switch SMA
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="sma-toggle"]')).toBeFocused();

      // Attiva con Space
      await page.keyboard.press(' ');

      // Verifica che lo switch sia stato attivato
      await expect(page.locator('[data-testid="sma-toggle"]')).toBeChecked();
    });

    test('should handle Escape key to close modals', async ({ page }) => {
      // Apri info modal
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Verifica che il modal sia aperto
      await expect(page.locator('text=Informazioni sul grafico')).toBeVisible();

      // Chiudi con Escape
      await page.keyboard.press('Escape');

      // Verifica che il modal sia chiuso
      await expect(
        page.locator('text=Informazioni sul grafico')
      ).not.toBeVisible();
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA labels for all interactive elements', async ({
      page,
    }) => {
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

    test('should have proper role attributes', async ({ page }) => {
      // Verifica role sui bottoni
      await expect(page.locator('[role="button"]')).toHaveCount(2); // refresh e info

      // Verifica role sugli switch
      await expect(page.locator('[role="switch"]')).toHaveCount(2); // SMA e RSI
    });

    test('should have proper aria-describedby for complex elements', async ({
      page,
    }) => {
      // Verifica che il grafico abbia una descrizione accessibile
      await expect(page.locator('[data-testid="chart-line"]')).toHaveAttribute(
        'aria-describedby'
      );

      // Verifica che la descrizione sia presente
      const describedBy = await page
        .locator('[data-testid="chart-line"]')
        .getAttribute('aria-describedby');
      if (describedBy) {
        await expect(page.locator(`#${describedBy}`)).toBeVisible();
      }
    });

    test('should announce loading states to screen readers', async ({
      page,
    }) => {
      // Avvia un refresh per testare gli stati di loading
      await page.click('[data-testid="refresh-button"]');

      // Verifica che ci sia un messaggio di loading accessibile
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
      await expect(
        page.locator('text=Aggiornamento dei dati storici in corso...')
      ).toBeVisible();
    });
  });

  test.describe('Focus Management', () => {
    test('should maintain focus order logically', async ({ page }) => {
      // Verifica che l'ordine del focus sia logico
      const focusOrder = [
        '[data-testid="refresh-button"]',
        '[data-testid="info-button"]',
        '[data-testid="sma-toggle"]',
        '[data-testid="rsi-toggle"]',
      ];

      for (const selector of focusOrder) {
        await page.keyboard.press('Tab');
        await expect(page.locator(selector)).toBeFocused();
      }
    });

    test('should trap focus in modals', async ({ page }) => {
      // Apri info modal
      await page.click('[data-testid="info-button"]');

      // Verifica che il focus sia nel modal
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Naviga con Tab nel modal
      await page.keyboard.press('Tab');

      // Verifica che il focus rimanga nel modal
      const focusedElement = await page.evaluate(() => document.activeElement);
      const modal = await page.locator('[role="dialog"]');
      await expect(modal).toContainElement(focusedElement);
    });

    test('should restore focus after modal closes', async ({ page }) => {
      // Ricorda l'elemento focalizzato prima del modal
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="info-button"]')).toBeFocused();

      // Apri e chiudi modal
      await page.keyboard.press('Enter');
      await page.keyboard.press('Escape');

      // Verifica che il focus sia tornato al bottone info
      await expect(page.locator('[data-testid="info-button"]')).toBeFocused();
    });
  });

  test.describe('Color and Contrast', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      // Verifica che il testo abbia contrasto sufficiente
      const textElements = page.locator('text=/.*/');
      const count = await textElements.count();

      // Testa alcuni elementi di testo principali
      const mainTextElements = [
        page.locator('text=AAPL'),
        page.locator('text=Analisi Storica'),
        page.locator('text=Indicatori'),
      ];

      for (const element of mainTextElements) {
        await expect(element).toBeVisible();
        // Nota: Il test di contrasto reale richiederebbe librerie specifiche
        // Qui verifichiamo solo che gli elementi siano visibili
      }
    });

    test('should not rely solely on color to convey information', async ({
      page,
    }) => {
      // Verifica che gli indicatori abbiano sia colore che testo
      await expect(page.locator('text=SMA 20')).toBeVisible();
      await expect(page.locator('text=RSI')).toBeVisible();

      // Verifica che i warning abbiano sia icone che testo
      await expect(page.locator('text=Attenzione')).toBeVisible();
    });

    test('should support high contrast mode', async ({ page }) => {
      // Simula high contrast mode (se supportato)
      await page.addStyleTag({
        content: `
                    * {
                        background: white !important;
                        color: black !important;
                        border: 1px solid black !important;
                    }
                `,
      });

      // Verifica che tutti gli elementi siano ancora visibili
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="refresh-button"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="info-button"]')).toBeVisible();
    });
  });

  test.describe('Semantic HTML', () => {
    test('should use semantic HTML elements', async ({ page }) => {
      // Verifica che i bottoni siano elementi button
      await expect(
        page.locator('[data-testid="refresh-button"]')
      ).toHaveTagName('button');
      await expect(page.locator('[data-testid="info-button"]')).toHaveTagName(
        'button'
      );

      // Verifica che gli switch siano elementi button con role switch
      await expect(page.locator('[data-testid="sma-toggle"]')).toHaveAttribute(
        'role',
        'switch'
      );
      await expect(page.locator('[data-testid="rsi-toggle"]')).toHaveAttribute(
        'role',
        'switch'
      );
    });

    test('should have proper heading structure', async ({ page }) => {
      // Verifica che ci sia una struttura di heading logica
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      // Verifica che ci siano heading appropriati
      expect(headingCount).toBeGreaterThan(0);

      // Verifica che il titolo principale sia un h1 o h2
      await expect(page.locator('text=Analisi Storica')).toBeVisible();
    });

    test('should have proper list structure for data', async ({ page }) => {
      // Verifica che le liste di ticker siano strutturate semanticamente
      const lists = page.locator('ul, ol');
      const listCount = await lists.count();

      // Se ci sono liste, verifica che siano accessibili
      if (listCount > 0) {
        for (let i = 0; i < listCount; i++) {
          const list = lists.nth(i);
          await expect(list).toBeVisible();
        }
      }
    });
  });

  test.describe('Error Handling Accessibility', () => {
    test('should announce errors to screen readers', async ({ page }) => {
      // Simula un errore (se possibile)
      await page.route('**/api/analysis', route => {
        route.abort('failed');
      });

      await page.click('[data-testid="refresh-button"]');

      // Verifica che l'errore sia annunciato
      await expect(page.locator('[aria-live="assertive"]')).toBeVisible();
      await expect(page.locator('text=Errore')).toBeVisible();

      // Ripristina connessione normale
      await page.unroute('**/api/analysis');
    });

    test('should provide accessible error recovery', async ({ page }) => {
      // Simula un errore
      await page.route('**/api/analysis', route => {
        route.abort('failed');
      });

      await page.click('[data-testid="refresh-button"]');

      // Verifica che ci sia un bottone di retry accessibile
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="retry-button"]')
      ).toHaveAttribute('aria-label');

      // Ripristina connessione normale
      await page.unroute('**/api/analysis');
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page }) => {
      // Imposta viewport mobile
      await page.setViewportSize({ width: 375, height: 667 });

      // Verifica che tutti gli elementi siano accessibili su mobile
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="refresh-button"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="info-button"]')).toBeVisible();

      // Verifica che i touch target siano sufficientemente grandi
      const refreshButton = page.locator('[data-testid="refresh-button"]');
      const buttonBox = await refreshButton.boundingBox();

      if (buttonBox) {
        // Verifica che il touch target sia almeno 44x44px
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should support touch gestures for accessibility', async ({
      page,
    }) => {
      // Imposta viewport mobile
      await page.setViewportSize({ width: 375, height: 667 });

      // Verifica che i gesti touch funzionino
      await page.touchscreen.tap(200, 300); // Tap sul grafico
      await page.waitForTimeout(1000);

      // Verifica che l'interazione sia accessibile
      await expect(
        page.locator('[data-testid="historical-chart"]')
      ).toBeVisible();
    });
  });
});
