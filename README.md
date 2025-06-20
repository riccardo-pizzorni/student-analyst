🚀 TEST DEPLOY AUTOMATICO: Se vedi questa riga, il deploy funziona!

# Student Analyst 📊

[![Coverage Statements](https://img.shields.io/badge/Coverage-Statements-59.76%25-orange.svg)](coverage/lcov-report/index.html)
[![Coverage Branches](https://img.shields.io/badge/Coverage-Branches-48.57%25-red.svg)](coverage/lcov-report/index.html)
[![Coverage Functions](https://img.shields.io/badge/Coverage-Functions-73.52%25-yellow.svg)](coverage/lcov-report/index.html)
[![Coverage Lines](https://img.shields.io/badge/Coverage-Lines-60.53%25-orange.svg)](coverage/lcov-report/index.html)
[![Tests](https://img.shields.io/badge/Tests-82%20passed,%2025%20failed-yellow.svg)](#testing)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF.svg)](https://vitejs.dev/)

> Applicazione web avanzata per l'analisi finanziaria con sistema di cache multi-layer, algoritmi di ottimizzazione e integrazione Yahoo Finance.

## ✨ Caratteristiche Principali

- 🚀 **Performance**: Sistema di cache multi-layer (L1: Memory, L2: LocalStorage, L3: IndexedDB)
- 📈 **Analisi Finanziaria**: Calcoli avanzati di rischio, rendimento e metriche di performance
- 🔄 **Ottimizzazione**: Algoritmi di allocazione portfolio (Markowitz, Sharpe Ratio, Risk Parity)
- 📊 **Dashboard Interattive**: Componenti React con visualizzazioni Recharts
- ⚡ **Caching Intelligente**: Pulizia automatica LRU e gestione storage
- 🌐 **Yahoo Finance API**: Integrazione per dati finanziari real-time
- 🧪 **Test Coverage**: Suite completa di test unitari Jest + jsdom

## 🛠️ Tech Stack

- **Frontend**: React 19.1.0 + TypeScript 5.8.3
- **Build Tool**: Vite 6.3.5
- **Testing**: Jest 29.7.0 + jsdom + Playwright
- **UI**: TailwindCSS + Radix UI
- **Visualizzazioni**: Recharts
- **Animazioni**: tailwindcss-animate
- **Icone**: lucide-react
- **Gestione classi**: clsx, tailwind-merge, class-variance-authority
- **Math rendering**: KaTeX
- **Monitoring**: web-vitals, @vercel/analytics, @vercel/speed-insights

## 📦 Dipendenze principali effettivamente usate

- `@radix-ui/react-slot` — Slot per componenti UI
- `@vercel/analytics` — Analytics Vercel
- `@vercel/speed-insights` — Performance insights Vercel
- `chalk` — Colorazione output CLI (solo script/test)
- `class-variance-authority` — Varianti di classi CSS
- `clsx` — Utility per classi condizionali
- `katex` — Rendering formule matematiche
- `lucide-react` — Icone SVG
- `recharts` — Grafici React
- `tailwind-merge` — Merge classi Tailwind
- `tailwindcss-animate` — Animazioni Tailwind
- `web-vitals` — Metriche performance web

## 🗃️ Automazioni e script

Tutti gli script batch sono nella cartella `/scripts`:
- **Auto commit/push**: commit e push automatici ogni 2 minuti
- **Avvio Cursor + automazioni**: batch unico per avviare tutto
- **Backup chat Cursor**: backup automatico ogni 5 minuti
- **Auto-deploy**: monitoraggio repo e deploy automatico

Vedi `scripts/README.md` per dettagli e uso.

## 🔑 Variabili d'ambiente

Vedi `.env.example` per tutte le variabili richieste e opzionali. Le principali:
- `VITE_APIkey_ALPHA_VANTAGE` — API key Alpha Vantage
- `VITE_BACKEND_URL` — URL backend (es. Render)
- `VITE_DEBUG` — Abilita modalità debug (opzionale)

## 🚀 Deploy

- Deploy automatico su Vercel collegato a GitHub branch `master`
- Variabili d'ambiente configurate su Vercel
- Forzare redeploy in caso di problemi tramite dashboard Vercel

## ♿ Accessibilità e best practice

- Tutti i form hanno label, id, aria-label
- Modalità debug sicura e documentata
- Manifest PWA incluso
- Codebase pulita: nessun codice temporaneo, debug, `any`, `var`, `@ts-ignore` inutili

## 🛡️ Type Safety Best Practices

Questo progetto mantiene la **massima type safety** con zero utilizzo di `any` esplicito:

### ✅ Regole Fondamentali
- **Mai usare `any` esplicito** - sostituire con `unknown` o tipi specifici
- **Preferire interfacce tipizzate** per mock e strutture dati
- **Usare `Record<string, unknown>`** per oggetti dinamici
- **Type guards** per validazione runtime di `unknown`

### 🧪 Testing Type-Safe
- **jest-mock-extended** per mock tipizzati
- **Mock functions con generics** specifici
- **Interfacce per tutti i servizi** mockati

### 📋 Verifica Continua
```bash
# Verifica ESLint (zero errori "no-explicit-any")
npm run lint

# Verifica TypeScript
npx tsc --noEmit

# Verifica completa
npm run test:all
```

📖 **Documentazione completa**: [`docs/TYPE_SAFETY_BEST_PRACTICES.md`](docs/TYPE_SAFETY_BEST_PRACTICES.md)

## 🧹 Pulizia e manutenzione

- Nessuna dipendenza non usata (Dexie rimossa)
- Codebase periodicamente scansionata per errori comuni
- Documentazione aggiornata e dettagliata

## 📄 Altra documentazione

- `PROJECT_SETUP.md`: guida completa setup, deploy, variabili, automazioni
- `scripts/README.md`: dettagli su tutti gli script batch
- `.env.example`: esempio completo variabili d'ambiente

---

Per domande o problemi, consulta la documentazione o apri una issue.

## 📊 Test Coverage

| Service | Statements | Branches | Functions | Lines | Status |
|---------|-----------|----------|-----------|-------|--------|
| **MemoryCacheL1** | ✅ 95.52% | ✅ 89.28% | ✅ 100% | ✅ 95.5% | **Excellent** |
| **AutomaticCleanupService** | ⚠️ 40.99% | ⚠️ 21.42% | ⚠️ 61.97% | ⚠️ 41.36% | **In Progress** |
| **CacheAnalyticsEngine** | 📊 Coverage data available | | | | **Under Test** |
| **StorageMonitoringService** | 📊 Coverage data available | | | | **Under Test** |

> **Target Goal**: 80%+ coverage per tutti i servizi core

## 🚀 Quick Start

```bash
# Clona il repository
git clone <repository-url>
cd student-analyst

# Installa dipendenze
npm install

# Avvia sviluppo
npm run dev

# Esegui test
npm run test:unit

# Build produzione
npm run build
```

## 🧪 Testing

This project uses a comprehensive testing strategy with both Jest (for unit/integration tests) and Playwright (for E2E tests).

### Running Tests

You can run all tests with a single command:

```bash
npm run test:all
```

Or run specific test suites:

- Unit/Integration tests: `npm run test:unit`
- E2E tests: `npm run test:e2e`
- Watch mode: `npm run test:watch`
- Coverage report: `npm run test:coverage`

### Test Structure

- `tests/unit/`: Unit and integration tests
- `tests/e2e/`: End-to-end tests with Playwright
- `tests/performance/`: Performance tests

### Test Reports

After running tests, reports are available in:

- Unit Tests: `test-results/unit/junit.xml`
- E2E Tests: `test-results/e2e/test-results.json`
- Coverage: `coverage/index.html`
- Combined Report: `test-results/combined-report.json`

### Continuous Integration

Tests are automatically run on GitHub Actions for:
- Every push to `main` and `develop` branches
- Every pull request to these branches

### Writing Tests

#### Unit Tests (Jest)

```typescript
import { describe, it, expect } from '@jest/globals';

describe('MyComponent', () => {
  it('should work correctly', () => {
    // Your test here
  });
});
```

#### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('should work in browser', async ({ page }) => {
  await page.goto('/');
  // Your test here
});
```

### Debugging Tests

1. Unit Tests:
   ```bash
