# Backup storico della cartella `src` (Student Analyst)

> **Questo file documenta in modo dettagliato la struttura, i concetti, le idee architetturali, le motivazioni e le relazioni di tutti i file e le macro-aree della cartella `src` PRIMA della migrazione alla UI Lovable. Serve come memoria storica e riferimento per ogni ingranaggio del vecchio sistema.**

---

## **Panoramica generale**
La cartella `src` era il cuore dell'applicazione Student Analyst, organizzata secondo principi di modularità, separazione delle responsabilità e scalabilità. Comprendeva:
- **Componenti UI avanzati** (sia generici che di dominio)
- **Hook custom** per logica riutilizzabile
- **Servizi** per orchestrazione della logica di business
- **Feature modules** per domini funzionali separati
- **Utility** e **tipi** condivisi
- **Provider** per stato e contesto globale
- **Modelli dati** standardizzati
- **Stili e asset**

---

## **Struttura e motivazioni delle macro-aree**

### 1. **components/**
- **Scopo:** Racchiudeva tutti i componenti UI, sia generici (es. bottoni, card, sidebar) che specifici (dashboard, tester, demo, ecc.).
- **Pattern:** Separation of concerns, atomic design, riuso massivo.
- **Relazioni:** I componenti si appoggiavano a hook custom, servizi e provider per logica e dati.
- **Esempi chiave:**
  - `FullSidebar.tsx`, `MainTabs.tsx`, `WelcomeBox.tsx`: orchestrazione della navigazione e delle sezioni principali.
  - `UIIntegrationTesting.tsx`, `PerformanceRatiosTester.tsx`, `CacheMonitorDashboard.tsx`: componenti avanzati per test, monitoraggio e debug.
  - `ui/`, `input/`, `icons/`, `charts/`: librerie di componenti atomici e visuali.

### 2. **hooks/**
- **Scopo:** Incapsulavano logica riutilizzabile (es: gestione toast, progress indicator, tooltip, API call, contextual help, ecc.).
- **Pattern:** Custom React hooks, separation of logic from UI.
- **Motivazione:** DRY, testabilità, composizione.
- **Esempi chiave:**
  - `useApiCall`, `usePriceData`, `useProgressIndicator`, `useContextualHelp`.

### 3. **lib/**
- **Scopo:** Utility di basso livello, helpers per classi CSS, merging di classi, ecc.
- **Esempio:** `utils.ts` (funzione `cn` per classnames con tailwind).

### 4. **pages/**
- **Scopo:** Entry point delle pagine principali (routing).
- **Motivazione:** Separazione tra logica di routing e presentazione.
- **Esempi:** `Index.tsx` (pagina principale, orchestrazione layout e sidebar), `NotFound.tsx` (gestione 404).

### 5. **app/**
- **Scopo:** Versione alternativa/legacy di bootstrap dell'app, con entrypoint, stili e wrapper duplicati.
- **Motivazione:** Transizione tra architetture, backward compatibility.

### 6. **shared/**
- **Scopo:** Raccolta di asset, stili, tipi, utility, provider, hook e componenti condivisi tra più domini.
- **Pattern:** DRY, riuso trasversale, centralizzazione di logica e risorse comuni.

### 7. **services/**
- **Scopo:** Orchestrazione della logica di business, gestione dati, calcoli finanziari, ottimizzazione, resilienza, fallback, worker, ecc.
- **Pattern:** Service layer, dependency injection, separation of business logic.
- **Motivazione:** Scalabilità, testabilità, robustezza.
- **Esempi chiave:**
  - `AutomaticCleanupService.ts`, `CacheWarmingService.ts`, `PortfolioOptimizationEngine.ts`, `RiskMetricsEngine.ts`, `AlphaVantageService.ts`, ecc.
  - Gestione avanzata di cache (multi-livello), orchestrazione di strategie di portafoglio, fallback automatici, worker per calcoli pesanti, ecc.

### 8. **features/**
- **Scopo:** Moduli funzionali isolati per domini specifici (monitoring, portfolio, cache).
- **Pattern:** Feature separation, modularità, isolamento, plug-in architecture.
- **Motivazione:** Scalabilità, sviluppo parallelo, testabilità.

### 9. **utils/**
- **Scopo:** Utility avanzate per validazione, calcoli, integrazione PyScript, circuit breaker, ecc.
- **Pattern:** Astrazione, supporto ai servizi, robustezza.
- **Esempi:** `envValidation.ts`, `FinancialCalculations.ts`, `CircuitBreaker.ts`, `PyScriptWrapper.ts`.

### 10. **types/**
- **Scopo:** Tipi TypeScript globali e di dominio (cache, ambienti, ecc.).
- **Motivazione:** Tipizzazione forte, contratti dati, interoperabilità.

### 11. **models/**
- **Scopo:** Modello dati universale per dati finanziari, normalizzazione, validazione, metadati, qualità, processing info.
- **Motivazione:** Interoperabilità tra fonti dati, validazione, tracciabilità, estendibilità.

### 12. **providers/**
- **Scopo:** Provider React per stato globale, aiuto contestuale, performance, errori, best practice.
- **Motivazione:** UX avanzata, supporto all'utente, monitoraggio globale.

### 13. **assets/**
- **Scopo:** Asset statici (icone, immagini, SVG).

---

## **Pattern architetturali e idee chiave**
- **Separation of concerns**: ogni macro-area ha responsabilità chiara e isolata.
- **Service layer**: logica di business separata dalla UI, orchestrazione tramite servizi.
- **Feature modules**: domini funzionali isolati e integrabili.
- **Provider pattern**: stato e contesto globale tramite React context/provider.
- **Custom hooks**: logica riutilizzabile e composabile.
- **Tipizzazione forte**: uso esteso di TypeScript per sicurezza e interoperabilità.
- **Resilienza**: circuit breaker, retry, fallback, monitoring.
- **UX avanzata**: aiuto contestuale, notifiche, dashboard di qualità, strumenti di debug e test.
- **Estendibilità**: struttura pensata per aggiungere nuove feature e servizi senza rompere l'esistente.

---

## **Relazioni e flussi principali**
- **Componenti** ↔ **Hook** ↔ **Servizi**: la UI si appoggia a hook che orchestrano servizi per ottenere dati, gestire stato, eseguire calcoli.
- **Provider**: forniscono stato e logica globale a tutta l'app.
- **Feature modules**: integrano servizi e componenti per domini specifici.
- **Utility e tipi**: supportano tutti i livelli con funzioni e contratti dati condivisi.
- **Modelli dati**: garantiscono coerenza e validazione tra fonti e moduli.

---

## **Motivazioni e filosofia progettuale**
- **Scalabilità**: ogni parte è pensata per crescere senza diventare monolitica.
- **Manutenibilità**: separazione netta tra livelli, testabilità, riuso.
- **Robustezza**: gestione errori, fallback, monitoring, validazione.
- **Esperienza utente**: strumenti di supporto, feedback, performance.
- **Documentazione e trasparenza**: ogni modulo e servizio è pensato per essere auto-documentante e facilmente comprensibile.

---

## **Nota finale**
Questa documentazione rappresenta la "memoria storica" della vecchia architettura di Student Analyst. Ogni concetto, pattern, servizio e componente qui descritto era parte integrante del funzionamento e della filosofia del progetto prima della migrazione totale alla UI Lovable.

---

*Generato automaticamente per garantire la conservazione della conoscenza e facilitare eventuali future reintroduzioni, refactoring o audit.* 