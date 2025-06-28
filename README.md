# 📊 Student Analyst - Piattaforma di Analisi Finanziaria

> **Status**: ✅ **100% FUNZIONALE E OPERATIVO**  
> **Progetto**: Analisi finanziaria professionale per studenti  
> **Stack**: React + TypeScript + Node.js + Yahoo Finance API

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
- **Vercel & Render** - Hosting platforms

---

## 📞 **Support**

### **Live URLs**

- **Frontend**: https://student-analyst.vercel.app
- **Backend**: https://student-analyst.onrender.com
- **Repository**: https://github.com/riccardo-pizzorni/student-analyst

### **Issues**

Per bug reports o feature requests, apri un issue su GitHub.

---

**🎯 Student Analyst - Analisi finanziaria professionale per il futuro degli investimenti**
