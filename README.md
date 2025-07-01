# 📊 Student Analyst - Piattaforma di Analisi Finanziaria

> **Status**: ✅ **100% FUNZIONALE E OPERATIVO**  
> **Progetto**: Analisi finanziaria professionale per studenti  
> **Stack**: React + TypeScript + Node.js + Yahoo Finance API

pavimento

[![Vercel Deploy](https://img.shields.io/badge/Vercel-✅%20Live-brightgreen)](https://student-analyst.vercel.app)
[![Render Backend](https://img.shields.io/badge/Render-✅%20Active-brightgreen)](https://student-analyst.onrender.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)

---

## 🎯 **Descrizione**

**Student Analyst** è una piattaforma completa di analisi finanziaria che permette agli studenti di:

- 📈 **Analizzare dati storici** di azioni con grafici interattivi
- 📊 **Calcolare metriche di performance** (rendimenti, volatilità, Sharpe ratio)
- 🔗 **Studiare correlazioni** tra asset diversi
- 📋 **Visualizzare indicatori tecnici** (SMA, RSI, Bollinger, MACD)
- 💼 **Comprendere il rischio** con analisi di volatilità

---

## 🚀 **Demo Live**

### **🌐 Frontend (Vercel)**

**URL**: [https://student-analyst.vercel.app](https://student-analyst.vercel.app)

### **🔧 Backend API (Render)**

**URL**: [https://student-analyst.onrender.com](https://student-analyst.onrender.com)

---

## ✨ **Funzionalità Implementate**

### **✅ Core Features (100% Operative)**

#### **1. Input & Validazione**

- ✅ Input ticker (AAPL, MSFT, GOOGL, TSLA, etc.)
- ✅ Selezione periodo di analisi
- ✅ Frequenza dati (giornaliera, settimanale, mensile)
- ✅ Upload CSV opzionale

#### **2. Analisi Storica Completa**

- ✅ **Grafici interattivi** con 1000+ punti dati
- ✅ **Prezzi storici reali** da Yahoo Finance
- ✅ **7 Indicatori tecnici**: SMA 20/50/200, RSI, Volume, Bollinger, MACD
- ✅ **Controlli dinamici** per toggle indicatori
- ✅ **Tabelle dati** complete e responsive
- ✅ **TradingView Charts**: Grafici professionali con widget TradingView integrato

#### **2.1. TradingView Widget Integration (NUOVO)**

- ✅ **Caricamento Dinamico**: Script loading asincrono sicuro
- ✅ **Multi-Exchange Support**: NASDAQ, NYSE, MIL (Borsa Italiana), BINANCE, FX
- ✅ **Indicatori Avanzati**: RSI, MACD, SMA, EMA, Bollinger Bands
- ✅ **Gestione Errori Completa**: Timeout, network errors, fallback UI
- ✅ **Responsive Design**: Adattamento automatico alle dimensioni
- ✅ **Localizzazione**: Interfaccia in italiano con supporto multi-lingua
- ✅ **Performance Monitoring**: Timeout configurabile e cleanup automatico
- ✅ **Accessibilità**: Loading states, error messages, retry functionality

#### **3. Performance Metrics**

- ✅ **Rendimento Totale**: Calcolo su periodo completo
- ✅ **Rendimento Annualizzato**: Performance media annua
- ✅ **Volatilità**: Deviazione standard annualizzata
- ✅ **Sharpe Ratio**: Risk-adjusted returns
- ✅ **Max Drawdown**: Massima perdita dal picco

#### **4. Analisi Rischio & Volatilità**

- ✅ **Volatilità Annualizzata**: Misura del rischio
- ✅ **Benchmark Comparison**: Confronto con indici
- ✅ **Risk-Return Analysis**: Rendimento per unità di rischio
- 🚧 **VaR/CVaR**: Value at Risk (in sviluppo)

#### **5. Correlazioni & Diversificazione**

- ✅ **Matrice Correlazioni**: Cross-correlation tra asset
- ✅ **Indice Diversificazione**: Misura della diversificazione
- ✅ **Correlazione Media**: Statistica aggregata
- ✅ **Visualizzazione Colorata**: Heatmap interattiva

---

## 🏗️ **Architettura**

### **Frontend (React + TypeScript)**

```
📁 src/
├── 📁 components/          # UI Components
│   ├── 📁 charts/         # Grafici finanziari
│   ├── 📁 input/          # Input e validazione
│   └── 📁 ui/             # Shadcn/UI components
├── 📁 context/            # React Context (stato globale)
├── 📁 services/           # API calls
└── 📁 pages/              # Pagine principali
```

### **Backend (Node.js + Express)**

```
📁 backend/src/
├── 📁 routes/             # API endpoints
├── 📁 services/           # Business logic
│   ├── yahooFinanceService.ts    # Yahoo Finance integration
│   ├── analysisService.ts        # Calcoli finanziari
│   └── historicalAnalysisService.ts  # Analisi storiche
└── 📁 middleware/         # Security & validation
```

---

## 🛠️ **Tech Stack**

### **Frontend**

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library
- **Recharts** - Grafici finanziari
- **React Router** - Navigation

### **Backend**

- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Yahoo Finance API** - Dati finanziari
- **CORS** - Cross-origin requests

### **Deployment**

- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **GitHub Actions** - CI/CD

---

## 📈 **TradingView Integration**

### **NewTradingViewWidget Component**

**Student Analyst** integra un widget TradingView avanzato che fornisce grafici professionali in tempo reale.

#### **✨ Caratteristiche Principali**

- **🔄 Caricamento Dinamico**: Script TradingView caricato solo quando necessario
- **🌍 Multi-Exchange**: Supporto per NASDAQ, NYSE, MIL, BINANCE, FX, e altri
- **📊 Indicatori Tecnici**: RSI, MACD, Moving Averages, Bollinger Bands integrati
- **🎨 Temi**: Supporto light/dark mode con integrazione automatica app
- **📱 Responsive**: Adattamento automatico a tutte le dimensioni schermo
- **🌐 Localizzazione**: Interfaccia italiana con supporto multi-lingua
- **⚡ Performance**: Timeout configurabile e cleanup automatico memoria
- **♿ Accessibilità**: Loading states, error messages, retry functionality

#### **🔧 Utilizzo Base**

```tsx
import { NewTradingViewWidget } from '@/components/charts/NewTradingViewWidget';

// Utilizzo semplice
<NewTradingViewWidget
  symbol="NASDAQ:AAPL"
  theme="dark"
/>

// Configurazione avanzata
<NewTradingViewWidget
  symbol="MIL:ENEL"
  theme="dark"
  interval="D"
  locale="it"
  studies={["RSI", "MACD"]}
  allow_symbol_change={true}
  save_image={true}
  onChartReady={() => console.log('Chart loaded!')}
  onSymbolChange={(symbol) => console.log('Symbol changed:', symbol)}
  onLoadError={(error) => console.error('Chart error:', error)}
/>
```

#### **📚 Parametri Configurabili**

| Parametro             | Tipo              | Default         | Descrizione                                      |
| --------------------- | ----------------- | --------------- | ------------------------------------------------ |
| `symbol`              | string            | `"NASDAQ:AAPL"` | Simbolo finanziario formato EXCHANGE:TICKER      |
| `theme`               | 'light' \| 'dark' | `"dark"`        | Tema visivo del widget                           |
| `interval`            | string            | `"D"`           | Intervallo temporale (1, 5, 15, 30, 60, D, W, M) |
| `locale`              | string            | `"it"`          | Lingua interfaccia (it, en, de, fr, es, etc.)    |
| `width`               | string \| number  | `"100%"`        | Larghezza widget                                 |
| `height`              | string \| number  | `500`           | Altezza widget                                   |
| `autosize`            | boolean           | `true`          | Ridimensionamento automatico                     |
| `studies`             | string[]          | `[]`            | Indicatori tecnici da visualizzare               |
| `allow_symbol_change` | boolean           | `true`          | Permette cambio simbolo da UI                    |
| `save_image`          | boolean           | `true`          | Abilita salvataggio immagine                     |
| `hide_top_toolbar`    | boolean           | `false`         | Nasconde toolbar superiore                       |
| `hide_side_toolbar`   | boolean           | `false`         | Nasconde toolbar laterale                        |
| `show_popup_button`   | boolean           | `false`         | Mostra bottone popup                             |
| `initTimeout`         | number            | `10000`         | Timeout inizializzazione (ms)                    |

#### **🎯 Callback Events**

```tsx
// Gestione eventi del widget
<NewTradingViewWidget
  onChartReady={() => {
    console.log('Widget completamente caricato');
    setIsLoading(false);
  }}
  onSymbolChange={newSymbol => {
    console.log('Simbolo cambiato:', newSymbol);
    updateRelatedComponents(newSymbol);
  }}
  onIntervalChange={newInterval => {
    console.log('Intervallo cambiato:', newInterval);
    syncWithOtherCharts(newInterval);
  }}
  onLoadError={error => {
    console.error('Errore caricamento:', error);
    showFallbackUI();
    trackError(error);
  }}
/>
```

#### **🔒 Gestione Errori & Sicurezza**

Il widget implementa una strategia di gestione errori su 4 livelli:

1. **Validation Errors**: Controllo parametri pre-caricamento
2. **Network Errors**: Gestione fallimenti CDN/rete
3. **Initialization Errors**: Problemi creazione widget
4. **Timeout Errors**: Protezione da blocchi infiniti

```tsx
// Esempio gestione errori custom
<NewTradingViewWidget
  symbol="INVALID:SYMBOL" // Trigger validation error
  initTimeout={5000} // Timeout ridotto per test
  onLoadError={error => {
    if (error.message.includes('validation')) {
      setValidationError(error.message);
    } else if (error.message.includes('timeout')) {
      setTimeoutError(true);
      // Implementa retry con timeout incrementale
    } else {
      setGenericError(error.message);
      // Mostra fallback widget
    }
  }}
/>
```

#### **♻️ Memory Management**

Il componente implementa un cleanup automatico completo:

- **Timeout Cleanup**: Cancellazione timer su success/unmount
- **Widget Cleanup**: Rimozione istanza TradingView
- **Script Cleanup**: Rimozione script DOM
- **Event Listeners**: Cleanup automatico handlers

#### **🌍 Exchange Support**

| Exchange | Codice     | Esempi                       | Descrizione             |
| -------- | ---------- | ---------------------------- | ----------------------- |
| NASDAQ   | `NASDAQ:`  | `NASDAQ:AAPL`, `NASDAQ:MSFT` | Mercato azionario USA   |
| NYSE     | `NYSE:`    | `NYSE:IBM`, `NYSE:GE`        | New York Stock Exchange |
| MIL      | `MIL:`     | `MIL:ENEL`, `MIL:ENI`        | Borsa Italiana          |
| BINANCE  | `BINANCE:` | `BINANCE:BTCUSDT`            | Cryptocurrency          |
| FX       | `FX:`      | `FX:EURUSD`, `FX:GBPJPY`     | Forex pairs             |

#### **🧪 Testing & Debugging**

```bash
# Test componente
npm test -- NewTradingViewWidget

# Debug mode con logging
REACT_APP_DEBUG_TRADINGVIEW=true npm run dev

# Test errori di rete
# Disconnetti internet mentre widget carica
```

#### **📁 File Backup**

Il precedente widget è stato salvato in:

- `src/components/charts/backup/` - Backup completo componenti
- Procedure di rollback documentate in sezione troubleshooting

---

## 📊 **Dati Reali Processati**

### **Esempio: Analisi AAPL (2020-2024)**

- **Punti Dati**: 1007 osservazioni daily
- **Prezzo Iniziale**: $85.75 (2020-06-10)
- **Prezzo Finale**: $192.22 (2024-06-11)
- **Rendimento Totale**: +124.85%
- **Rendimento Annuo**: +22.50%
- **Volatilità**: 25.94%
- **Sharpe Ratio**: 0.79

### **Correlazioni (AAPL vs MSFT)**

- **Correlazione**: 0.69 (correlazione forte)
- **Diversificazione**: 0.31 (moderata)

---

## 🚀 **Quick Start**

### **1. Clone Repository**

```bash
git clone https://github.com/riccardo-pizzorni/student-analyst.git
cd student-analyst
```

### **2. Install Dependencies**

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### **3. Environment Variables**

```bash
# Frontend (.env)
VITE_BACKEND_URL=https://student-analyst.onrender.com

# Backend (.env)
ALPHA_VANTAGE_API_KEY=your_api_key
FRONTEND_URL=https://student-analyst.vercel.app
```

### **4. Development**

```bash
# Frontend (Port 5173)
npm run dev

# Backend (Port 10000)
cd backend
npm run dev
```

### **5. Production Build**

```bash
# Frontend
npm run build

# Backend
cd backend
npm run build
npm start
```

---

## 🧪 **Testing**

### **Unit Tests**

```bash
npm test                    # Frontend tests
cd backend && npm test      # Backend tests
```

### **E2E Tests**

```bash
npx playwright test         # End-to-end tests
```

### **Type Checking**

```bash
npm run type-check          # TypeScript validation
```

---

## 📈 **API Endpoints**

### **Backend API (Render)**

#### **Health Check**

```
GET /health
Response: { status: "ok", timestamp: "..." }
```

#### **Financial Analysis**

```
POST /api/analysis
Body: {
  "tickers": ["AAPL", "MSFT"],
  "startDate": "2020-01-01",
  "endDate": "2024-01-01",
  "frequency": "daily"
}
Response: {
  "success": true,
  "data": {
    "historicalData": [...],
    "performanceMetrics": [...],
    "volatility": {...},
    "correlation": {...}
  }
}
```

---

## 🎨 **Screenshots**

### **Dashboard Principale**

![Dashboard](docs/screenshots/dashboard.png)

### **Analisi Storica**

![Historical Analysis](docs/screenshots/historical.png)

### **Performance Metrics**

![Performance](docs/screenshots/performance.png)

---

## 🤝 **Contributing**

### **Development Workflow**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/nome-feature`
3. Commit changes: `git commit -m "feat: aggiungi nuova feature"`
4. Push to branch: `git push origin feature/nome-feature`
5. Create Pull Request

### **Coding Standards**

- **TypeScript strict mode** - No `any` types
- **ESLint + Prettier** - Code formatting
- **Conventional Commits** - Commit message format
- **Test Coverage** - >80% for core features

---

## 📚 **Documentazione**

La documentazione è stata completamente riorganizzata e ottimizzata. Vedi [`docs/README.md`](docs/README.md) per la panoramica completa.

### **📂 Struttura Documentazione**

- **[`docs/configuration/`](docs/configuration/)** - Setup, environment, configurazioni
- **[`docs/development/`](docs/development/)** - Workflow, API, best practices
- **[`docs/deployment/`](docs/deployment/)** - Deploy, fixes, troubleshooting
- **[`docs/project/`](docs/project/)** - Status, changelog, analisi progetto
- **[`docs/testing/`](docs/testing/)** - Guide test, utilities, troubleshooting
- **[`docs/solutions/`](docs/solutions/)** - Soluzioni esistenti

### **🎯 Guide Principali**

- **Setup Iniziale**: [`docs/configuration/`](docs/configuration/)
- **Sviluppo**: [`docs/development/DEVELOPMENT_WORKFLOW.md`](docs/development/DEVELOPMENT_WORKFLOW.md)
- **Testing**: [`docs/testing/TESTING_GUIDE.md`](docs/testing/TESTING_GUIDE.md)
- **API Integration**: [`docs/development/YAHOO_FINANCE_INTEGRATION.md`](docs/development/YAHOO_FINANCE_INTEGRATION.md)

### **🔧 TaskMaster Integration**

- **[`AGENTS.md`](AGENTS.md)** - TaskMaster/Claude Code integration guide
- **[`BIBBIA_STUDENT_ANALYST.txt`](BIBBIA_STUDENT_ANALYST.txt)** - Complete project documentation

---

## 🐛 **Known Issues & Roadmap**

### **🚧 Features in Sviluppo**

- [ ] **VaR/CVaR Calculations** - Value at Risk avanzato
- [ ] **Benchmark Comparisons** - Confronti con S&P 500
- [ ] **Portfolio Optimization** - Ottimizzazione allocazioni
- [ ] **Fundamental Analysis** - Analisi bilanci
- [ ] **Advanced Strategies** - Strategie di investimento

### **🐛 Known Issues**

- Nessun issue critico attualmente aperto
- Performance ottimale su desktop
- Mobile responsive in miglioramento

---

## 📄 **License**

MIT License - vedi [LICENSE](LICENSE) per dettagli.

---

## 👥 **Team**

- **Riccardo Pizzorni** - Full Stack Developer
- **GitHub**: [@riccardo-pizzorni](https://github.com/riccardo-pizzorni)

---

## 🙏 **Acknowledgments**

- **Yahoo Finance** - API dati finanziari
- **Shadcn/UI** - Component library
- **Recharts** - Grafici React
- **TradingView** - Widget grafici professionali
- **Vercel & Render** - Hosting platforms

---

## 🔧 **Troubleshooting & Backup**

### **TradingView Widget Issues**

#### **Problema: Widget non si carica**

```bash
# Sintomi
- Loading infinito
- Messaggio "Errore durante il caricamento del widget"
- Console errors

# Soluzioni
1. Verifica connessione internet
2. Controlla adblocker (disabilita temporaneamente)
3. Verifica simbolo formato corretto (EXCHANGE:TICKER)
4. Controlla firewall aziendale/proxy
5. Riprova con timeout maggiore:
   <NewTradingViewWidget initTimeout={15000} />
```

#### **Problema: Simbolo non valido**

```bash
# Errori comuni
❌ "AAPL"          → ✅ "NASDAQ:AAPL"
❌ "ENEL"          → ✅ "MIL:ENEL"
❌ "BTCUSD"        → ✅ "BINANCE:BTCUSDT"
❌ "EURUSD"        → ✅ "FX:EURUSD"

# Verifica exchange supportati
- NASDAQ: azioni tech USA
- NYSE: azioni tradizionali USA
- MIL: azioni italiane
- BINANCE: cryptocurrency
- FX: forex pairs
```

#### **Problema: Widget troppo lento**

```tsx
// Ottimizza performance
<NewTradingViewWidget
  initTimeout={20000} // Aumenta timeout
  studies={[]} // Rimuovi indicatori pesanti
  hide_side_toolbar={true} // Riduci UI complexity
/>
```

#### **Problema: Errori di memoria**

```tsx
// Il componente implementa auto-cleanup, ma se persistono:
useEffect(() => {
  return () => {
    // Force cleanup manuale se necessario
    window.TradingView = undefined;
  };
}, []);
```

### **Procedura Rollback**

Se il nuovo widget TradingView causa problemi critici:

#### **1. Rollback Immediato**

```bash
# Step 1: Backup current
mv src/components/charts/NewTradingViewWidget.tsx src/components/charts/NewTradingViewWidget.tsx.backup
mv src/components/charts/TradingViewChart.tsx src/components/charts/TradingViewChart.tsx.backup

# Step 2: Restore from backup
cp src/components/charts/backup/TradingViewWidget.tsx src/components/charts/
cp src/components/charts/backup/react-tradingview-widget.d.ts src/components/charts/

# Step 3: Reinstall old library
npm install react-tradingview-widget@1.3.2

# Step 4: Update imports in MainTabs.tsx
# Cambia da: import { TradingViewChart } from './charts/TradingViewChart';
# A: import TradingViewWidget from 'react-tradingview-widget';
```

#### **2. Verifica Rollback**

```bash
# Test quick
npm run dev
# Naviga a http://localhost:5173
# Verifica che il grafico si carica correttamente

# Test completo
npm test
npm run build
```

#### **3. Backup Locations**

```bash
📁 Backup Files:
├── src/components/charts/backup/
│   ├── TradingViewWidget.tsx           # Widget originale
│   ├── react-tradingview-widget.d.ts   # Type definitions
│   └── integration-notes.md            # Note implementazione
│
├── .taskmaster/docs/
│   └── tradingview-migration-log.md    # Log migrazione completo
│
└── package.json.backup                 # Dependencies originali
```

### **Performance Optimization**

#### **Lazy Loading**

```tsx
// Carica widget solo quando necessario
const LazyTradingViewWidget = lazy(
  () => import('@/components/charts/NewTradingViewWidget')
);

function ChartSection() {
  return (
    <Suspense fallback={<div>Caricamento grafico...</div>}>
      <LazyTradingViewWidget symbol="NASDAQ:AAPL" />
    </Suspense>
  );
}
```

#### **Memory Optimization**

```tsx
// Evita re-render inutili
const MemoizedChart = memo(NewTradingViewWidget);

// Ottimizza callback
const handleChartReady = useCallback(() => {
  setIsLoading(false);
}, []);

const handleSymbolChange = useCallback(
  (symbol: string) => {
    updateAppState(symbol);
  },
  [updateAppState]
);
```

---

## 📞 **Support**

### **Live URLs**

- **Frontend**: https://student-analyst.vercel.app
- **Backend**: https://student-analyst.onrender.com
- **Repository**: https://github.com/riccardo-pizzorni/student-analyst

### **Issues**

Per bug reports o feature requests, apri un issue su GitHub.

---

## Future Improvements

### Yahoo Finance API Update

- **Current Status**: L'applicazione usa il metodo `historical()` di Yahoo Finance, che è deprecato ma funzionante
- **Future Change**: Aggiornare a `chart()` (il nuovo metodo ufficiale)
- **Impact**: Richiede test approfonditi perché:
  - Cambia la struttura dei dati ricevuti
  - Potrebbe impattare il parsing dei dati
  - Richiede verifica di tutte le metriche
- **Reference**: [Issue #795](https://github.com/gadicc/node-yahoo-finance2/issues/795)
- **Priority**: Media - Il sistema funziona correttamente con il metodo attuale

**🎯 Student Analyst - Analisi finanziaria professionale per il futuro degli investimenti**
