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
   npm run test:unit -- --debug
   ```

2. E2E Tests:
   ```bash
   npm run test:e2e -- --debug
   ```

3. Use VS Code debugger with the provided launch configurations

### Test Coverage

We maintain high test coverage:
- Unit tests: >90%
- E2E tests: All critical paths
- Performance tests: Key operations

Coverage reports are generated automatically and available in the `coverage` directory.

## 📁 Struttura Progetto

```
src/
  app/                # Bootstrapping, entrypoint, provider globali, router
    App.tsx
    main.tsx
    index.css
    App.css
    vite-env.d.ts
  features/
    cache/
      components/
        CacheMonitorDashboard.tsx
        CacheControlPanelSimple.tsx
        ...
      services/
        CacheService.ts
        MemoryCacheL1.ts
        LocalStorageCacheL2.ts
        IndexedDBCacheL3.ts
        ...
      utils/
      types/
      __tests__/
    portfolio/
      components/
        PortfolioOptimizationTester.tsx
        ...
      services/
        PortfolioOptimizationEngine.ts
        ...
      utils/
      types/
      __tests__/
    monitoring/
      components/
        StorageHealthDashboard.tsx
        ...
      services/
        StorageMonitoringService.ts
        ...
      utils/
      types/
      __tests__/
  shared/
    components/       # UI generica, bottoni, card, layout, header, sidebar, ecc.
    hooks/
    providers/
    utils/
    types/
    styles/
    assets/
```

## 🔧 Servizi Core

### 💾 Sistema Cache Multi-Layer
- **L1 (Memory)**: Cache in-memory ultra-veloce
- **L2 (LocalStorage)**: Persistenza browser locale
- **L3 (IndexedDB)**: Database client-side strutturato

### 🧹 Automatic Cleanup Service
- Pulizia automatica LRU (Least Recently Used)
- Monitoraggio storage e health check
- Scheduling intelligente delle operazioni

### 📈 Financial Analytics
- Calcoli rendimenti e rischio
- Metriche performance (Sharpe, Sortino, VaR)
- Algoritmi ottimizzazione portfolio

## 🌐 API Integration

### Yahoo Finance
- Dati storici prezzi
- Quote real-time
- Informazioni aziendali
- Gestione rate limiting e fallback

## 📋 Development Scripts

```bash
npm run dev                 # Sviluppo locale
npm run build              # Build produzione
npm run lint               # ESLint check
npm run test:unit          # Test unitari
npm run test:unit:coverage # Coverage report
npm run test:e2e           # Test E2E
npm run preview            # Preview build
```

## 🔗 Coverage Reports

- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Data**: `coverage/lcov.info`
- **Console Output**: Durante `npm run test:unit:coverage`

---

**🎯 Goal**: Raggiungere 100% test coverage su tutti i servizi core per garantire qualità e affidabilità del sistema.

## Struttura dei test (aggiornata)

- Tutti i test **unitari** sono in `tests/unit/` e coprono i servizi principali (cache, monitoring, cleanup, DI, ecc.).
- Tutti i test **E2E** sono in `tests/e2e/` e coprono i flussi utente critici, performance, API, visual.
- Non ci sono test duplicati, inutili o obsoleti: ogni test ha uno scopo preciso e copre un modulo/servizio reale.
- I test saltati sono stati commentati e marcati con TODO per futura revisione.
- I nomi dei file sono descrittivi e coerenti con la funzione testata.
- La struttura delle cartelle è chiara e rispetta la suddivisione unit/integration/e2e/manual/scripts.
- Ogni modifica ai test viene tracciata nei file di stato e nel log (audit trail automatico).

## Documentation

### Testing Documentation
- [Testing Guide](docs/TESTING_GUIDE.md) - Comprehensive guide to the testing system
- [Test Utilities](docs/TEST_UTILITIES.md) - Documentation for test utilities and helpers
- [Test Conventions](docs/TEST_CONVENTIONS.md) - Standards and conventions for writing tests
- [Test Troubleshooting](docs/TEST_TROUBLESHOOTING.md) - Guide for common issues and solutions

### Component Documentation
- [Cache System](docs/CACHE_SYSTEM.md) - Documentation for the multi-level cache system
- [Memory Cache L1](README_MemoryCacheL1.md) - Documentation for L1 memory cache
- [Local Storage Cache L2](README_LocalStorageCacheL2.md) - Documentation for L2 local storage cache
- [IndexedDB Cache L3](README_IndexedDBCacheL3.md) - Documentation for L3 IndexedDB cache

### Integration Documentation
- [Yahoo Finance Integration](README_YahooFinanceIntegration.md) - Documentation for Yahoo Finance integration
- [Alpha Vantage Integration](README_AlphaVantageIntegration.md) - Documentation for Alpha Vantage integration
- [Fallback System](README_AutomaticFallbackLogic.md) - Documentation for automatic fallback system

### Quality and Monitoring
- [Error Handling](README_ErrorHandling.md) - Documentation for error handling system
- [Data Consistency](README_DataConsistencyValidation.md) - Documentation for data consistency validation
- [Quality Scoring](README_UnifiedQualityScoring.md) - Documentation for quality scoring system
- [Monitoring Guide](MONITORING_GUIDE.md) - Guide for system monitoring

### Deployment and CI/CD
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Guide for deploying the application
- [CI/CD Documentation](CI_CD_DOCUMENTATION.md) - Documentation for CI/CD pipeline

## Getting Started

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- Git

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and configuration

# Verify installation
npm run test:verify
```

### Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Building
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing

### Test Categories
- Unit Tests
- Integration Tests
- E2E Tests
- Performance Tests

### Running Tests
```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.test.ts
```

### Test Coverage
- Statements: 80%
- Branches: 75%
- Functions: 90%
- Lines: 80%

## Contributing

### Development Workflow
1. Create feature branch
2. Write tests
3. Implement feature
4. Run tests
5. Submit PR

### Code Style
- Follow TypeScript best practices
- Use ESLint configuration
- Follow test conventions
- Document changes

### Pull Requests
- Include tests
- Update documentation
- Follow conventions
- Pass all checks

## License

[License Information]

## Support

[Support Information]

## Test Bot
Questo è un test del bot di auto-deploy - $(date)

<!-- Modifica di test automatica: il bot monitora TUTTO il progetto! -->

## Supporto PWA e Mobile

- Il progetto include un file `public/manifest.json` minimale e valido per supporto Progressive Web App (PWA) e installazione su dispositivi mobili.
- Il manifest è referenziato in `index.html` tramite `<link rel="manifest" href="/manifest.json" />`.
- L'icona usata è `vite.svg` (puoi sostituirla con una tua icona personalizzata se vuoi un branding diverso).
- Per un supporto ancora migliore su mobile, è stato aggiunto anche `<link rel="apple-touch-icon" href="/vite.svg" />`.

**Se vuoi personalizzare l'icona o le proprietà della PWA, modifica `public/manifest.json` e aggiorna le icone nella cartella `public/`.**
