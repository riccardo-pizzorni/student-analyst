🚀 TEST DEPLOY AUTOMATICO: Se vedi questa riga, il deploy funziona!

# 🎓 Student Analyst - Financial Analysis Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Prettier](https://img.shields.io/badge/Prettier-Enabled-orange.svg)](https://prettier.io/)
[![ESLint](https://img.shields.io/badge/ESLint-No%20Errors-green.svg)](https://eslint.org/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](https://jestjs.io/)

> **⚠️ IMPORTANTE**: Questo progetto ha subito critiche ottimizzazioni il 2024-12-19. Leggi la [documentazione dei fix critici](docs/CRITICAL_FIXES_SUMMARY.md) prima di iniziare.

---

## 🚀 Quick Start

```bash
# Installazione
npm install

# Verifica stato progetto
npm run lint          # TypeScript safety
npm run format:check  # Formattazione
npm test             # Test unitari

# Sviluppo
npm run dev          # Frontend (porta 8080)
cd backend && npm run dev  # Backend (porta 10000)
```

---

## 📋 Prerequisiti

- **Node.js**: 18+ 
- **npm**: 9+
- **TypeScript**: 5.5+
- **VS Code**: Con estensioni Prettier e ESLint

---

## 🏗️ Architettura

```
student-analyst/
├── src/                    # Frontend React + TypeScript
├── backend/               # Backend Node.js + Express
├── tests/                 # Test suite completa
├── docs/                  # Documentazione dettagliata
└── config/               # Configurazioni
```

---

## 🔧 Configurazione Critica

### **Porte del Sistema**
- **Frontend**: 8080
- **Backend**: 10000 ⚠️ **CRITICO**
- **Test**: 10000 ⚠️ **CRITICO**

### **TypeScript Safety**
- **Strict Mode**: ON
- **No Explicit Any**: ON
- **Null Checks**: ON

### **Formattazione**
- **Prettier**: Configurato automaticamente
- **ESLint**: Regole TypeScript rigorose
- **Auto-format**: Al salvataggio

---

## 🧪 Testing

```bash
# Test unitari
npm test

# Test backend
cd backend && npm run test:backend

# Test E2E
npm run test:e2e

# Coverage
npm test -- --coverage
```

---

## 📚 Documentazione

### **Fix Critici e Ottimizzazioni**
- [📋 Riassunto Esecutivo](docs/CRITICAL_FIXES_SUMMARY.md) - Fix critici del 2024-12-19
- [🔧 Fix Dettagliati](docs/PRETTIER_INTEGRATION_AND_TYPE_SAFETY_FIXES.md) - Documentazione completa
- [🤖 Guida AI](docs/AI_ASSISTANT_GUIDE.md) - Regole per AI Assistant
- [🔄 Workflow](docs/DEVELOPMENT_WORKFLOW.md) - Processo di sviluppo

### **Tecnica**
- [🧪 Testing Guide](docs/TESTING_GUIDE.md)
- [💾 Cache System](docs/CACHE_SYSTEM.md)
- [⚡ Performance](docs/PERFORMANCE_TESTING.md)

---

## 🚨 Errori Comuni da Evitare

### **❌ MAI usare `any` in TypeScript**
```typescript
// SBAGLIATO
const data: any = response.json();

// CORRETTO
interface ApiResponse {
  data: unknown;
  status: number;
}
const data: ApiResponse = response.json();
```

### **❌ MAI configurare porte diverse**
```javascript
// SBAGLIATO: Server su 10000, test su 3001
const PORT = 3001;

// CORRETTO: Coerenza
const PORT = 10000;
```

### **❌ MAI ignorare la formattazione**
```bash
# SBAGLIATO: Formattazione manuale
# CORRETTO: Automazione
npm run format
```

---

## 🔄 Workflow di Sviluppo

### **Pre-Commit Checklist**
- [ ] `npm run lint` → 0 errori
- [ ] `npm run format:check` → 0 errori
- [ ] `npm test` → Tutti passati
- [ ] `npm run test:backend` → Backend OK
- [ ] `npm run build` → Build successo

### **Comandi Essenziali**
```bash
# Qualità del codice
npm run lint              # Verifica TypeScript
npm run lint:fix          # Correggi errori
npm run format            # Formatta codice
npm run format:check      # Verifica formattazione

# Testing
npm test                  # Test unitari
npm run test:backend      # Test backend
npm run test:e2e          # Test E2E

# Build
npm run build             # Build frontend
cd backend && npm run build  # Build backend
```

---

## 🛠️ Tecnologie

### **Frontend**
- **React 18** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Componenti
- **Chart.js** - Grafici
- **React Query** - Data fetching

### **Backend**
- **Node.js** + Express
- **TypeScript** - Type safety
- **Jest** - Testing
- **Alpha Vantage API** - Dati finanziari

### **Testing**
- **Jest** - Unit testing
- **Playwright** - E2E testing
- **React Testing Library** - Component testing

### **Quality**
- **ESLint** - Linting
- **Prettier** - Formattazione
- **TypeScript** - Type checking

---

## 📊 Metriche di Qualità

- **Type Safety**: 100% ✅
- **Code Coverage**: >80% ✅
- **ESLint Errors**: 0 ✅
- **Prettier Issues**: 0 ✅
- **Test Pass Rate**: 100% ✅

---

## 🚀 Deployment

### **Frontend (Vercel)**
```bash
npm run build
vercel --prod
```

### **Backend (Railway/Render)**
```bash
cd backend
npm run build
# Deploy su Railway o Render
```

---

## 🤝 Contributing

1. **Leggi la documentazione** dei fix critici
2. **Segui il workflow** di sviluppo
3. **Rispetta le regole** TypeScript
4. **Mantieni la formattazione** Prettier
5. **Testa tutto** prima del commit

### **Branch Naming**
```bash
feature/nome-feature
fix/nome-fix
docs/nome-documentazione
test/nome-test
```

---

## 📞 Supporto

### **Documentazione**
- [Fix Critici](docs/CRITICAL_FIXES_SUMMARY.md)
- [Workflow](docs/DEVELOPMENT_WORKFLOW.md)
- [Guida AI](docs/AI_ASSISTANT_GUIDE.md)

### **Comandi di Emergenza**
```bash
# Reset completo
git reset --hard HEAD
npm ci
npm run format
npm run lint:fix

# Verifica stato
npm run lint
npm run format:check
npm test
npm run build
```

---

## 📝 Changelog

### **2024-12-19 - Fix Critici**
- ✅ Eliminazione completa uso di `any` in TypeScript
- ✅ Integrazione Prettier per formattazione automatica
- ✅ Fix configurazione porte backend (3001 → 10000)
- ✅ Standardizzazione workflow di sviluppo
- ✅ Documentazione completa per AI e sviluppatori

---

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE) per dettagli.

---

**⚠️ IMPORTANTE**: Questo progetto ha standard di qualità elevati. Leggi sempre la documentazione prima di contribuire.

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

## 🧪 Backend Testing

Il backend include una suite completa di test per garantire la stabilità e le performance:

### ✅ Test Disponibili

- **Health Tests**: Verifica avvio server, endpoint health, CORS, performance
- **Endpoint Tests**: Test di tutti gli endpoint API con validazione response
- **Monitoring Tests**: Test di monitoraggio e performance con Alpha Vantage API
- **Complete Suite**: Script unificato per tutti i test in sequenza

### 🚀 Esecuzione Test

```bash
# Test completo (raccomandato)
cd backend && node test-backend.js

# Test individuali
cd backend && npm run test:health
cd backend && npm run test:endpoints
cd backend && npm run test:monitoring
```

### 📊 Risultati Attesi

- **Porta**: 10000 (configurata correttamente)
- **Response Time**: 1-7ms (eccellente)
- **Success Rate**: 100%
- **Coverage**: Tutti gli endpoint testati

📖 **Documentazione backend**: [`docs/BACKEND_TEST_FIXES.md`](docs/BACKEND_TEST_FIXES.md)

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

| Service                      | Statements                 | Branches  | Functions | Lines     | Status          |
| ---------------------------- | -------------------------- | --------- | --------- | --------- | --------------- |
| **MemoryCacheL1**            | ✅ 95.52%                  | ✅ 89.28% | ✅ 100%   | ✅ 95.5%  | **Excellent**   |
| **AutomaticCleanupService**  | ⚠️ 40.99%                  | ⚠️ 21.42% | ⚠️ 61.97% | ⚠️ 41.36% | **In Progress** |
| **CacheAnalyticsEngine**     | 📊 Coverage data available |           |           |           | **Under Test**  |
| **StorageMonitoringService** | 📊 Coverage data available |           |           |           | **Under Test**  |

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

   ```
