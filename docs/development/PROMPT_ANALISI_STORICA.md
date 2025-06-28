# 🎯 PROMPT PERFETTO PER CURSOR AI - STEP "ANALISI STORICA"

---

## 🚨 **ISTRUZIONI CRITICHE PRELIMINARI**

**ATTENZIONE**: Questo è un progetto di livello Bloomberg/Reuters. Ogni errore può compromettere la credibilità didattica e professionale dell'intera piattaforma. Segui questo prompt con precisione assoluta.

**REGOLA FONDAMENTALE**: Se hai anche solo un dubbio su qualsiasi aspetto, FERMATI e chiedi chiarimenti. È meglio perdere tempo in chiarimenti che introdurre errori.

**ZERO TOLERANZA PER ERRORI**: Questo step è il fondamento di tutto il sistema. Un errore qui compromette tutti gli step successivi.

---

## 🎯 **CONTESTO E OBIETTIVI DEL PROGETTO**

### **Student Analyst - Piattaforma di Analisi Finanziaria**

- **Target**: Studenti universitari, professori, analisti finanziari
- **Obiettivo**: Creare uno strumento didattico-professionale di livello Bloomberg
- **Filosofia**: "Dalla teoria alla pratica" con focus su didattica e precisione
- **Stack**: React/TypeScript (Vercel) + Node.js/Express (Render) + PostgreSQL
- **URL Frontend**: https://student-analyst.vercel.app
- **URL Backend**: https://student-analyst.onrender.com

### **Step "Analisi Storica" - Fondamento del Sistema**

- **Ruolo**: Primo step di ogni analisi finanziaria
- **Scopo**: Trasformare dati grezzi in informazioni significative
- **Obiettivo**: Strumento professionale per analisi storica di titoli e portafogli
- **Punteggio Attuale**: 6/10 (da portare a 10/10)

---

## 🎯 **OBIETTIVI SPECIFICI DELLO STEP**

### **Obiettivi Didattici**

1. **Comprensione dei Pattern**: Identificare trend, cicli e pattern ricorrenti
2. **Analisi della Volatilità**: Comprendere la variabilità dei prezzi nel tempo
3. **Identificazione di Fasi di Mercato**: Distinguere bull market, bear market, consolidamento
4. **Base per Decisioni**: Fornire il contesto storico per analisi future
5. **Glossario Integrato**: Spiegazioni teoriche per ogni concetto

### **Obiettivi Tecnici**

1. **Dati Reali**: Sostituire completamente i mock con calcoli reali da Alpha Vantage
2. **Indicatori Avanzati**: Implementare SMA, RSI, Bollinger Bands, MACD, Volume analysis
3. **Performance Metrics**: Calcoli di rendimento, drawdown, volatilità annualizzata
4. **UX Professionale**: Interfaccia intuitiva e didattica con tooltip educativi
5. **Export Funzionalità**: Export dati e grafici in CSV, Excel, PNG, PDF
6. **Tabella Dati**: Visualizzazione completa dati OHLCV con sorting e filtri

### **Obiettivi di Qualità**

1. **Precisione Assoluta**: Zero errori nei calcoli finanziari
2. **Performance**: Tempo di caricamento < 2 secondi, rendering grafico < 500ms
3. **Accessibilità**: WCAG 2.1 compliance completa
4. **Testing**: Coverage > 90% unit tests, 100% E2E critical paths
5. **Documentazione**: Completa e aggiornata con esempi pratici
6. **Sicurezza**: Input validation, rate limiting, CORS, XSS protection

---

## 🛠️ **PERCORSO STEP-BY-STEP DETTAGLIATO**

### **FASE 1: ANALISI E PIANIFICAZIONE (2-3 ore)**

#### **Step 1.1: Lettura Completa della Documentazione**

```
1. Leggi completamente il file "STEP STEP/1-analisi-storica.txt"
2. Leggi la "BIBBIA_STUDENT_ANALYST.txt" (sezioni relative all'analisi storica)
3. Analizza tutti i file esistenti:
   - src/components/charts/HistoricalChart.tsx
   - src/components/MainTabs.tsx
   - src/components/input/UnifiedInputSection.tsx
   - src/context/AnalysisContext.tsx
   - backend/src/services/analysisService.ts
   - backend/src/services/alphaVantageService.ts
   - backend/src/services/dataTransformer.ts
   - tests/e2e/output-components-e2e.spec.ts
   - tests/unit/components/PerformanceMetrics.test.tsx
4. Identifica ogni gap tra implementazione attuale e obiettivi
5. Crea una lista dettagliata di tutti i task necessari
6. Documenta ogni decisione presa
```

#### **Step 1.2: Validazione degli Obiettivi**

```
1. Conferma che hai compreso ogni obiettivo didattico e tecnico
2. Verifica che gli obiettivi siano realistici e misurabili
3. Identifica eventuali conflitti tra obiettivi
4. Definisci criteri di successo per ogni obiettivo
5. Documenta ogni decisione presa
6. Crea checklist di validazione per ogni obiettivo
```

#### **Step 1.3: Pianificazione del Workflow**

```
1. Definisci l'ordine esatto di implementazione
2. Identifica le dipendenze tra i task
3. Stima il tempo per ogni task
4. Identifica i punti di rischio
5. Pianifica i test per ogni fase
6. Definisci i checkpoint di validazione
```

### **FASE 2: IMPLEMENTAZIONE BACKEND - DATI REALI (4-6 ore)**

#### **Step 2.1: Analisi del Backend Attuale**

```
1. Leggi completamente backend/src/services/analysisService.ts
2. Identifica tutti i dati mock attuali
3. Analizza la struttura delle interfacce TypeScript
4. Verifica la gestione degli errori
5. Controlla la validazione dei parametri
6. Analizza il sistema di caching esistente
7. Verifica la configurazione Alpha Vantage
```

#### **Step 2.2: Implementazione Calcoli Finanziari Base**

```
1. Crea le funzioni di calcolo SMA:
   - Verifica la formula: SMA = (P1 + P2 + ... + Pn) / n
   - Implementa con validazione input (period > 0, dati non vuoti)
   - Gestisci edge cases (period > dati disponibili)
   - Aggiungi test unitari con dati noti
   - Documenta ogni decisione

2. Crea le funzioni di calcolo RSI:
   - Verifica la formula: RSI = 100 - (100 / (1 + RS))
   - RS = Average Gain / Average Loss
   - Implementa con periodo configurabile (default 14)
   - Gestisci edge cases (primi periodi, dati costanti)
   - Aggiungi test unitari con valori di riferimento
   - Validazione: RSI deve essere tra 0 e 100

3. Crea le funzioni di calcolo Volume:
   - Volume medio su periodo
   - Volume Price Trend (VPT) = VPT[i-1] + Volume[i] * (Close[i] - Close[i-1])/Close[i-1]
   - On-Balance Volume (OBV) = OBV[i-1] + Volume[i] * (Close[i] > Close[i-1] ? 1 : -1)
   - Aggiungi test unitari
   - Gestisci edge cases (volume zero, prezzi uguali)
```

#### **Step 2.3: Implementazione Indicatori Avanzati**

```
1. Bollinger Bands:
   - Middle Band = SMA(20)
   - Upper Band = Middle + (2 * Standard Deviation)
   - Lower Band = Middle - (2 * Standard Deviation)
   - Implementa con periodo configurabile
   - Testa con dati noti

2. MACD (Moving Average Convergence Divergence):
   - MACD Line = EMA(12) - EMA(26)
   - Signal Line = EMA(9) of MACD Line
   - Histogram = MACD Line - Signal Line
   - Implementa EMA (Exponential Moving Average)
   - Testa con dati di riferimento

3. Stochastic Oscillator:
   - %K = ((Close - Lowest Low) / (Highest High - Lowest Low)) * 100
   - %D = SMA(3) of %K
   - Implementa con periodi configurabili
   - Testa con dati noti
```

#### **Step 2.4: Integrazione Alpha Vantage**

```
1. Verifica la configurazione API:
   - Controlla environment variables (ALPHA_VANTAGE_API_KEY)
   - Testa la connessione con endpoint di test
   - Verifica rate limiting (5 calls/minute, 500/day)
   - Implementa retry logic con exponential backoff

2. Implementa fetch dati storici:
   - Funzione per recuperare dati OHLCV
   - Supporto per timeframe multipli (1min, 5min, 15min, 30min, 60min, daily, weekly, monthly)
   - Validazione e pulizia dati (rimuovi record con dati mancanti)
   - Gestione errori specifici (API limit, invalid symbol, network error)
   - Caching intelligente (TTL variabile per frequenza)

3. Testa con dati reali:
   - Usa ticker noti (AAPL, GOOGL, MSFT, TSLA)
   - Verifica la qualità dei dati (completeness, accuracy)
   - Controlla la performance (tempo di risposta)
   - Valida la consistenza dei dati
```

#### **Step 2.5: Implementazione Performance Metrics**

```
1. Calcolo rendimento totale:
   - Formula: (Prezzo finale - Prezzo iniziale) / Prezzo iniziale
   - Gestione dividendi e split (adjusted close)
   - Rendimento annualizzato: ((1 + Total Return) ^ (365/days) - 1)
   - Validazione dati (prezzi positivi, date valide)

2. Calcolo drawdown:
   - Massimo drawdown: max((Peak - Current) / Peak)
   - Drawdown corrente: (Peak - Current) / Peak
   - Periodo di recupero: giorni dal peak al recovery
   - Implementa rolling peak calculation

3. Calcolo volatilità:
   - Volatilità annualizzata: StdDev(returns) * sqrt(252)
   - Rolling volatility (20 giorni, 60 giorni)
   - Standard deviation dei rendimenti logaritmici
   - Validazione: volatilità deve essere positiva

4. Testa ogni calcolo con dati noti e risultati di riferimento
```

#### **Step 2.6: Aggiornamento analysisService.ts**

```
1. Sostituisci tutti i mock con calcoli reali:
   - Rimuovi dati statici hardcoded
   - Implementa pipeline di calcolo completa
   - Mantieni le interfacce TypeScript esistenti
   - Aggiungi validazione robusta per ogni parametro

2. Implementa error handling completo:
   - Try-catch per ogni operazione
   - Errori specifici per ogni tipo di problema
   - Logging dettagliato per debugging
   - Fallback graceful per errori non critici

3. Aggiungi logging per debugging:
   - Log di inizio e fine di ogni operazione
   - Log di errori con stack trace
   - Log di performance (tempo di esecuzione)
   - Log di validazione dati

4. Testa ogni endpoint con dati reali e verifica la correttezza dei risultati
```

### **FASE 3: IMPLEMENTAZIONE FRONTEND - UI/UX (3-4 ore)**

#### **Step 3.1: Analisi del Frontend Attuale**

```
1. Leggi completamente src/components/charts/HistoricalChart.tsx
2. Identifica tutti i componenti coinvolti (MainTabs, AnalysisContext)
3. Analizza la gestione dello stato (useState, useEffect, Context)
4. Verifica la gestione degli errori e loading states
5. Controlla l'accessibilità (ARIA labels, keyboard navigation)
6. Analizza la responsività e design system
```

#### **Step 3.2: Miglioramento Grafico Storico**

```
1. Aggiorna il componente per dati reali:
   - Rimuovi tutti i dati statici e placeholder
   - Connetta con AnalysisContext per dati reali
   - Aggiungi stati di loading appropriati (skeleton, spinner)
   - Implementa error handling robusto con retry
   - Aggiungi fallback per dati mancanti

2. Aggiungi indicatori tecnici:
   - SMA 20, 50, 200 con colori distintivi (#EF4444, #F59E0B, #10B981)
   - RSI con overlay o subplot (colore #8B5CF6)
   - Bollinger Bands con area shaded
   - Volume con subplot e colori dinamici
   - MACD con histogram
   - Legend interattiva con toggle

3. Migliora l'interattività:
   - Zoom e pan fluidi con Chart.js
   - Crosshair per precisione con coordinate
   - Tooltip informativi con valori esatti
   - Legend interattiva con click per toggle
   - Responsive design per mobile
   - Keyboard navigation support
```

#### **Step 3.3: Implementazione Tabella Dati**

```
1. Crea componente HistoricalTable:
   - Visualizzazione dati OHLCV completi
   - Sorting per ogni colonna (asc/desc)
   - Filtri per periodo (date range picker)
   - Paginazione (50 record per pagina)
   - Export CSV/Excel con formattazione
   - Responsive design per mobile

2. Connetta con dati reali:
   - Usa i dati dal AnalysisContext
   - Gestisci stati di loading con skeleton
   - Implementa error handling con retry
   - Aggiungi validazione per dati mancanti
   - Implementa caching locale per performance

3. Aggiungi funzionalità avanzate:
   - Ricerca testuale nei dati
   - Filtri avanzati (range di prezzi, volume)
   - Highlight per valori anomali
   - Copy to clipboard per singoli valori
   - Print functionality
```

#### **Step 3.4: Miglioramento Didattico**

```
1. Implementa glossario integrato:
   - Tooltip educativi per ogni indicatore
   - Spiegazioni teoriche con formule
   - Esempi pratici con dati reali
   - Link a risorse esterne (Wikipedia, Investopedia)
   - Modal con spiegazioni approfondite

2. Aggiungi tutorial interattivo:
   - Guide step-by-step per principianti
   - Esempi pratici con ticker noti
   - Quiz di comprensione con feedback
   - Progress tracking per utenti
   - Skip option per utenti esperti

3. Implementa sistema di aiuto:
   - Help button con FAQ
   - Video tutorial embedded
   - Documentazione integrata
   - Support chat (future)
   - Feedback system
```

#### **Step 3.5: Miglioramento UX/UI**

```
1. Stati di loading ottimizzati:
   - Skeleton loading per grafici
   - Progress bar per operazioni lunghe
   - Loading states per ogni sezione
   - Disable interactions durante loading

2. Error handling user-friendly:
   - Messaggi di errore chiari e utili
   - Suggerimenti per risolvere problemi
   - Retry buttons per errori temporanei
   - Fallback graceful per errori critici

3. Accessibilità completa:
   - ARIA labels per tutti gli elementi
   - Keyboard navigation completa
   - Screen reader support
   - High contrast mode
   - Font size adjustment
```

### **FASE 4: TESTING E VALIDAZIONE (2-3 ore)**

#### **Step 4.1: Test Unitari**

```
1. Testa ogni funzione di calcolo:
   - SMA con dataset noti e risultati attesi
   - RSI con valori di riferimento (70, 30, 50)
   - Performance metrics con esempi reali
   - Edge cases (dati vuoti, periodi invalidi)
   - Error handling per input invalidi

2. Testa i componenti:
   - HistoricalChart con dati reali e mock
   - HistoricalTable con sorting/filtering
   - Error handling e loading states
   - Accessibility features
   - Responsive behavior

3. Testa l'integrazione:
   - Context provider con dati reali
   - API calls e response handling
   - State management
   - Error propagation
```

#### **Step 4.2: Test E2E**

```
1. Testa il flusso completo:
   - Input ticker (validi e invalidi)
   - Avvio analisi con loading
   - Visualizzazione risultati
   - Interazioni utente (zoom, pan, toggle)
   - Export funzionalità
   - Navigation tra tab

2. Testa scenari di errore:
   - Ticker non validi con messaggi appropriati
   - Errori API con retry logic
   - Dati mancanti con fallback
   - Timeout con recovery
   - Network errors con offline handling

3. Testa performance:
   - Tempo di caricamento < 2 secondi
   - Rendering grafico < 500ms
   - Memoria usage < 50MB
   - API response time < 1 secondo
```

#### **Step 4.3: Test di Performance**

```
1. Testa con grandi dataset:
   - 5 anni di dati giornalieri (1250+ record)
   - Multiple ticker simultanei
   - Indicatori multipli attivi
   - Verifica tempi di caricamento
   - Monitora uso memoria

2. Testa la memoria:
   - Monitora uso memoria durante operazioni
   - Verifica memory leaks con profiler
   - Ottimizza se necessario
   - Implementa cleanup per componenti unmount

3. Testa la scalabilità:
   - Testa con 10+ ticker simultanei
   - Verifica performance con dati real-time
   - Testa caching effectiveness
   - Monitora API rate limiting
```

#### **Step 4.4: Test di Accessibilità**

```
1. Testa con screen reader:
   - Navigazione completa da tastiera
   - Descrizioni appropriate per elementi
   - Focus management
   - Error announcements

2. Testa responsive design:
   - Mobile (320px - 768px)
   - Tablet (768px - 1024px)
   - Desktop (1024px+)
   - Touch interactions
   - Orientation changes

3. Testa compliance WCAG 2.1:
   - Contrast ratios
   - Font sizes
   - Color independence
   - Keyboard navigation
   - Error identification
```

### **FASE 5: DOCUMENTAZIONE E DEPLOYMENT (1-2 ore)**

#### **Step 5.1: Aggiornamento Documentazione**

```
1. Aggiorna "STEP STEP/1-analisi-storica.txt":
   - Sezione implementazione completata
   - Nuove funzionalità implementate
   - Metriche di performance raggiunte
   - Roadmap aggiornata per future versioni
   - Lezioni apprese durante sviluppo

2. Crea documentazione tecnica:
   - API documentation con esempi
   - Component documentation con props
   - Testing documentation con coverage
   - Deployment guide con checklist
   - Troubleshooting guide

3. Crea documentazione utente:
   - User guide con screenshot
   - Tutorial video scripts
   - FAQ basate su test
   - Best practices guide
   - Glossary completo
```

#### **Step 5.2: Deployment e Verifica**

```
1. Test locale completo:
   - Build frontend: npm run build
   - Build backend: npm run build
   - Testa tutti i flussi end-to-end
   - Verifica performance metrics
   - Controlla errori console e network

2. Deploy e test produzione:
   - Deploy su Vercel (frontend)
   - Deploy su Render (backend)
   - Testa con dati reali in produzione
   - Verifica performance in produzione
   - Controlla logs per errori

3. Post-deployment validation:
   - Health check endpoints
   - API functionality test
   - UI rendering test
   - Performance monitoring
   - Error tracking setup
```

---

## 🛡️ **REGOLE DI SICUREZZA ASSOLUTA**

### **Prima di Ogni Modifica**

```
1. FAI SEMPRE backup del file che stai modificando
2. LEGGI COMPLETAMENTE il file prima di modificarlo
3. COMPRENDI ogni riga di codice esistente
4. IDENTIFICA le dipendenze e le relazioni
5. PIANIFICA la modifica in dettaglio
6. VERIFICA che non rompi funzionalità esistenti
```

### **Durante l'Implementazione**

```
1. TESTA ogni funzione dopo l'implementazione
2. VERIFICA che non rompi funzionalità esistenti
3. CONTROLLA la type safety TypeScript
4. VALIDA i dati di input e output
5. DOCUMENTA ogni decisione importante
6. COMMITTA frequentemente con messaggi descrittivi
```

### **Dopo Ogni Modifica**

```
1. ESEGUI test unitari: npm test
2. VERIFICA che il build funzioni: npm run build
3. CONTROLLA che non ci siano errori di linting: npm run lint
4. TESTA manualmente la funzionalità
5. COMMITTA con messaggio convenzionale
6. VERIFICA che il deploy funzioni
```

### **Regole Specifiche per Calcoli Finanziari**

```
1. VERIFICA ogni formula con fonti autorevoli (Investopedia, Bloomberg)
2. TESTA con dati noti e risultati attesi
3. GESTISCI edge cases (dati mancanti, zero, negativi, NaN)
4. VALIDA la precisione numerica (floating point)
5. DOCUMENTA ogni assunzione e limitazione
6. IMPLEMENTA validazione robusta per ogni input
```

### **Regole per API Integration**

```
1. VERIFICA rate limiting e implementa retry logic
2. VALIDA ogni response prima di processarlo
3. GESTISCI errori specifici per ogni tipo di problema
4. IMPLEMENTA caching intelligente
5. MONITORA performance e errori
6. DOCUMENTA ogni endpoint e parametro
```

---

## 🎯 **CRITERI DI SUCCESSO**

### **Criteri Tecnici**

- [ ] Tutti i dati mock sostituiti con calcoli reali da Alpha Vantage
- [ ] Tutti gli indicatori tecnici implementati e testati (SMA, RSI, Bollinger, MACD, Volume)
- [ ] Performance metrics calcolate correttamente (rendimento, drawdown, volatilità)
- [ ] Tempo di caricamento < 2 secondi, rendering grafico < 500ms
- [ ] Coverage test > 90% unit tests, 100% E2E critical paths
- [ ] Zero errori TypeScript, zero errori di linting
- [ ] Tabella dati completa con sorting, filtri, export
- [ ] Export funzionalità per CSV, Excel, PNG, PDF

### **Criteri Didattici**

- [ ] Glossario integrato per ogni termine tecnico
- [ ] Tooltip educativi per ogni indicatore con formule
- [ ] Tutorial interattivo implementato con progress tracking
- [ ] Esempi pratici disponibili con ticker noti
- [ ] Spiegazioni teoriche complete con fonti
- [ ] FAQ basate su test reali con utenti

### **Criteri UX**

- [ ] Interfaccia intuitiva e professionale di livello Bloomberg
- [ ] Responsive design per tutti i dispositivi (mobile, tablet, desktop)
- [ ] Accessibilità WCAG 2.1 compliance completa
- [ ] Export funzionalità funzionante per tutti i formati
- [ ] Error handling user-friendly con suggerimenti
- [ ] Loading states appropriati per ogni operazione

### **Criteri di Qualità**

- [ ] Codice pulito e ben documentato con JSDoc
- [ ] Architettura modulare e scalabile
- [ ] Gestione errori robusta con logging
- [ ] Sicurezza implementata (input validation, rate limiting, CORS)
- [ ] Performance ottimizzata con caching e lazy loading
- [ ] Testing completo con coverage reporting

### **Criteri di Sicurezza**

- [ ] Input sanitization per tutti i parametri
- [ ] API key protection e rate limiting
- [ ] CORS configuration corretta
- [ ] XSS protection implementata
- [ ] Error handling senza information disclosure
- [ ] HTTPS enforcement

---

## 🚨 **PUNTI DI ATTENZIONE CRITICI**

### **Calcoli Finanziari**

- **PRECISIONE ASSOLUTA**: Un errore nei calcoli può compromettere l'intera credibilità
- **VALIDAZIONE DATI**: Controlla sempre la qualità e completezza dei dati
- **EDGE CASES**: Gestisci sempre dati mancanti, zero, negativi, NaN
- **FORMULE**: Verifica ogni formula con fonti autorevoli (Investopedia, Bloomberg)
- **FLOATING POINT**: Attenzione alla precisione numerica nei calcoli

### **Performance**

- **API CALLS**: Ottimizza le chiamate API per evitare rate limiting
- **CACHING**: Implementa caching intelligente con TTL appropriati
- **MEMORY**: Monitora l'uso della memoria e previeni memory leaks
- **RENDERING**: Ottimizza il rendering dei grafici con Chart.js
- **BUNDLE SIZE**: Mantieni il bundle size ottimizzato

### **UX/UI**

- **ACCESSIBILITÀ**: Non compromettere mai l'accessibilità
- **RESPONSIVE**: Testa su tutti i dispositivi e orientazioni
- **LOADING**: Stati di loading appropriati per ogni operazione
- **ERRORI**: Messaggi di errore chiari, utili e non tecnici
- **NAVIGATION**: Keyboard navigation completa e intuitiva

### **Testing**

- **COVERAGE**: Mantieni coverage > 90% per unit tests
- **E2E**: Testa sempre il flusso completo end-to-end
- **PERFORMANCE**: Testa con dataset reali e grandi
- **ERRORI**: Testa tutti gli scenari di errore possibili
- **ACCESSIBILITÀ**: Testa con screen reader e keyboard navigation

### **Deployment**

- **ENVIRONMENT**: Verifica tutte le environment variables
- **HEALTH CHECK**: Implementa health check endpoints
- **LOGGING**: Setup logging appropriato per monitoring
- **BACKUP**: Backup di tutti i dati e configurazioni
- **ROLLBACK**: Piano di rollback in caso di problemi

---

## 📞 **PROTOCOLLO DI COMUNICAZIONE**

### **Quando Chiedere Aiuto**

```
1. Se non sei sicuro di una formula finanziaria
2. Se non comprendi completamente un file esistente
3. Se incontri errori non previsti o non documentati
4. Se hai dubbi su best practice o architettura
5. Se devi prendere decisioni che impattano altri step
6. Se i test falliscono e non capisci il motivo
7. Se la performance non raggiunge i target
```

### **Come Chiedere Aiuto**

```
1. Descrivi il problema in dettaglio con esempi
2. Fornisci il codice rilevante e gli errori esatti
3. Spiega cosa hai già provato e i risultati
4. Specifica l'errore esatto con stack trace
5. Chiedi chiarimenti specifici e non generici
6. Fornisci contesto su cosa stavi cercando di fare
```

### **Checklist Pre-Help Request**

```
- [ ] Ho letto completamente la documentazione
- [ ] Ho testato con dati noti e semplici
- [ ] Ho verificato che non sia un problema di configurazione
- [ ] Ho controllato i logs per errori
- [ ] Ho provato a riprodurre il problema
- [ ] Ho documentato cosa ho già provato
```

---

## 🎯 **METRICHE DI SUCCESSO**

### **Metriche Tecniche**

- **Performance**: Tempo di caricamento < 2s, rendering < 500ms
- **Coverage**: Unit tests > 90%, E2E tests 100%
- **Errors**: Zero errori TypeScript, zero errori linting
- **Memory**: Uso memoria < 50MB per dataset standard
- **API**: Response time < 1s, success rate > 99%

### **Metriche UX**

- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive**: Funziona perfettamente su tutti i dispositivi
- **Usability**: Task completion rate > 95%
- **Error Handling**: User error recovery > 90%
- **Loading**: Perceived performance score > 90

### **Metriche Didattiche**

- **Comprehension**: User understanding score > 85%
- **Engagement**: Tutorial completion rate > 80%
- **Retention**: Return user rate > 70%
- **Feedback**: User satisfaction score > 4.5/5
- **Support**: Help request rate < 5%

---

## 🎯 **CONCLUSIONE**

Questo prompt ti guiderà attraverso l'implementazione completa e professionale dello step "Analisi Storica" per Student Analyst.

**RICORDA**:

- La precisione è più importante della velocità
- Ogni decisione deve essere documentata
- Ogni implementazione deve essere testata
- La qualità è non-negoziabile
- Questo step è il fondamento di tutto il sistema

**OBIETTIVO FINALE**: Creare uno strumento di analisi storica di livello Bloomberg che sia didattico, preciso, performante e professionale.

**INIZIA CON FASE 1, STEP 1.1** e procedi metodicamente attraverso ogni fase. Non saltare passaggi e non fare supposizioni.

**BUON LAVORO! 🚀**

---

## 📝 **NOTE FINALI**

- Questo prompt è stato creato il 27/06/2025
- Versione: 1.0
- Status: Pronto per implementazione
- Responsabile: Team Student Analyst
- Prossima revisione: Dopo completamento step

**PER INIZIARE**: Leggi completamente questo prompt, poi inizia con FASE 1, STEP 1.1
</rewritten_file>
