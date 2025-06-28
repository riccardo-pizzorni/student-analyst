# 📋 INFORMAZIONI TECNICHE COMPLETE - STUDENT ANALYST

> **Data creazione**: 2025-06-28  
> **Fonte**: Analisi completa GitHub + Vercel + Render + Codebase  
> **Progetto**: Student Analyst - Piattaforma Analisi Finanziaria

---

## 🔗 **URLS E DOMINI PRINCIPALI**

### **Frontend (Vercel)**

- **URL Produzione**: https://student-analyst.vercel.app
- **URL Dashboard**: https://vercel.com/riccar-pizzornis-projects/student-analyst
- **Dominio Custom**: student-analyst.vercel.app (Valid Configuration)
- **Project ID**: prj_pUADPQ9JRbzIyUY4bXImtB0SGKLy

### **Backend (Render)**

- **URL Produzione**: https://student-analyst.onrender.com
- **Health Check**: https://student-analyst.onrender.com/health
- **Dashboard**: https://dashboard.render.com/web/srv-d1282are5dus73f040f0
- **Service Name**: student-analyst
- **Region**: Oregon (US West)
- **Instance Type**: Free (0.1 CPU, 512 MB)

### **Repository GitHub**

- **URL**: https://github.com/riccardo-pizzorni/student-analyst
- **Branch Principale**: master
- **Size**: 31.1 MB
- **Linguaggio**: TypeScript 94.1%, CSS 4.6%

---

## 🔧 **ENVIRONMENT VARIABLES**

### **Vercel (Frontend)**

```bash
# Environment Variables configurate
VITE_DEBUG_MODE=true
VITE_API_TIMEOUT=20000
VITE_APIKey_ALPHA_VANTAGE=W8EEE8B0TZMGIP1M
VITE_BACKEND_URL=https://student-analyst.onrender.com
```

### **Render (Backend)**

```bash
# Environment Variables configurate
ALPHA_VANTAGE_API_KEY=W8EEE8B0TZMGIP1M
ALPHA_VANTAGE_BASE_URL=https://www.alphavantage.co/query
FRONTEND_URL=https://student-analyst.vercel.app
NODE_ENV=production
PORT=10000
```

---

## 🚀 **CONFIGURAZIONI DEPLOYMENT**

### **Vercel Settings**

- **Framework**: Vite
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Root Directory**: `/` (project root)
- **Node.js Version**: 18.x
- **Automatic Deployments**: Enabled (su push master)

### **Render Settings**

- **Build Command**: `backend/ $ npm install && npm run build`
- **Start Command**: `backend/ $ node dist/index.js`
- **Root Directory**: `backend`
- **Runtime**: Node.js
- **Auto-Deploy**: On Commit
- **Health Check Path**: `/health`
- **Branch Tracking**: master

---

## 📊 **GITHUB INTEGRATIONS & APPS**

### **GitHub Apps Installate**

- **Cursor**: Developed by cursor
- **lovable.dev**: Developed by GPT-Engineer-App
- **Railway App**: Developed by railwayapp
- **Render**: Developed by renderinc
- **Vercel**: Developed by vercel

### **OAuth Apps Autorizzate**

- **Git Credential Manager**: git-ecosystem
- **Visual Studio Code**: Visual-Studio-Code

### **Webhooks Configurati**

- **Payload URL**: `https://api.vercel.com/v1/integrations/deploy/prj_pUADPQ9JRbzIyUY4bXImtB0SGKLy/It0qZcTNtv`
- **Content Type**: `application/json`
- **SSL Verification**: Enabled
- **Events**: Just the push event
- **Status**: Active

---

## 🔄 **DEPLOYMENT STATUS E METRICHE**

### **Vercel Deployments**

- **Status**: Production Ready (5/6 deployments successful)
- **Latest Deploy**: 5m ago by riccardo-pizzorni
- **Domain**: student-analyst.vercel.app (+2 domains)
- **Build Time**: ~55m ago
- **Edge Requests**: 592 (6h period)
- **Function Invocations**: 0
- **Error Rate**: 0%

### **Render Service Status**

- **Status**: ❌ Failed deploy
- **Service**: student-analyst
- **Runtime**: Node.js
- **Last Deploy**: 3h ago
- **Region**: Oregon (US West)
- **Health Check**: /health endpoint configured

### **GitHub Actions**

- **Post-Deployment Health Check**: ✅ Active
- **Frontend Tests & Build**: ✅ Passing
- **Backend Tests & Build**: ✅ Passing
- **Security & Quality Audit**: ✅ Passing
- **Integration Tests**: ✅ Passing
- **Deploy Backend (Render)**: ✅ Passing
- **Deploy Frontend (Vercel)**: ✅ Passing

---

## 🎯 **ENVIRONMENTS CONFIGURATI**

### **GitHub Environments**

1. **Preview** - All unassigned git branches
2. **Production - student-analyst-b2tw** - 3 weeks ago
3. **Production** - master branch
4. **Production - student-analyst-x6h1** - No custom domains
5. **Production - student-analyst-plnc** - No custom domains

### **Vercel Environments**

1. **Production** - master branch tracking
2. **Preview** - All unassigned git branches
3. **Development** - Accessible via CLI

---

## 📦 **CONFIGURAZIONI TECNICHE**

### **Package.json (Root)**

```json
{
  "name": "vite_react_shadcn_ts",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "jest"
  }
}
```

### **Backend Package.json**

```json
{
  "name": "student-analyst-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "start": "ts-node src/index.ts",
    "build": "tsc"
  }
}
```

### **Vercel.json Configuration**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "buildCommand": "vite build",
        "outputDirectory": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*\\.(png|jpg|jpeg|svg|ico|txt|webp|gif|css|js))",
      "dest": "/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 🔐 **SECURITY & ACCESS**

### **Repository Settings**

- **Visibility**: Public
- **Default Branch**: master (not main)
- **Branch Protection**: Enabled per deploy
- **Collaborators**: 0
- **Git LFS**: Disabled

### **Render Security**

- **Render Subdomain**: Enabled (onrender.com)
- **Custom Domains**: Supportati
- **SSL**: Automatico
- **Instance Type**: Free tier
- **Health Checks**: Configurati su /health

### **Vercel Security**

- **Domain**: student-analyst.vercel.app
- **SSL**: Automatico
- **Environment Variables**: Configurate e sicure
- **Build Protection**: Attiva
- **Firewall**: Attivo (24h)

---

## 📈 **MONITORING E ANALYTICS**

### **Vercel Analytics**

- **Edge Requests**: 592 (last 6h)
- **Function Invocations**: 0
- **Error Rate**: 0%
- **Performance**: Ottimizzato con CDN globale

### **Render Monitoring**

- **Health Checks**: /health endpoint
- **Uptime**: Monitorato
- **Logs**: Disponibili nel dashboard
- **Metrics**: CPU, Memory, Network

### **GitHub Insights**

- **Stars**: 0
- **Watchers**: 0
- **Forks**: 0
- **Commits**: 567 total
- **Releases**: No releases published
- **Packages**: No packages published

---

## 🔧 **CONFIGURAZIONI SPECIFICHE**

### **CORS Settings (Backend)**

```javascript
const allowedOrigins = [
  'https://student-analyst.vercel.app',
  'https://student-analyst-git-main.vercel.app',
  'https://student-analyst-git-feature.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];
```

### **API Endpoints**

- **Health Check**: GET /health
- **Analysis**: POST /api/analysis
- **Financial Data**: GET /api/financial/:symbol

### **Database Configuration**

- **Type**: PostgreSQL (configurato ma non utilizzato attivamente)
- **Connection**: Tramite environment variables
- **Backup**: Non configurato

---

## 🚨 **ISSUES E PROBLEMI NOTI**

### **Render Backend**

- **Status**: ❌ Failed deploy (ultimo tentativo)
- **Causa**: Da investigare nei logs
- **Soluzione**: Verificare configurazione e rifare deploy

### **GitHub Actions**

- **Health Check**: Alcuni fallimenti intermittenti
- **Retry Logic**: Configurato per 5 tentativi

### **Environment Variables**

- **Alpha Vantage Key**: W8EEE8B0TZMGIP1M (esposta, da verificare)
- **Sicurezza**: Alcune variabili potrebbero essere esposte pubblicamente

---

## 📋 **CHECKLIST OPERATIVA**

### **Per Deploy Frontend (Vercel)**

- [ ] Push su branch master
- [ ] Verifica build automatico
- [ ] Test su student-analyst.vercel.app
- [ ] Controllo environment variables

### **Per Deploy Backend (Render)**

- [ ] Verifica configurazione backend/
- [ ] Check environment variables
- [ ] Test health check endpoint
- [ ] Verifica logs per errori

### **Per Debugging**

- [ ] GitHub Actions logs
- [ ] Vercel build logs
- [ ] Render service logs
- [ ] Browser console errors

---

## 🎯 **INFORMAZIONI RAPIDE**

### **Accesso Veloce**

- **Frontend Live**: https://student-analyst.vercel.app
- **Backend Live**: https://student-analyst.onrender.com
- **Health Check**: https://student-analyst.onrender.com/health
- **Repository**: https://github.com/riccardo-pizzorni/student-analyst
- **Vercel Dashboard**: https://vercel.com/riccar-pizzornis-projects/student-analyst
- **Render Dashboard**: https://dashboard.render.com/web/srv-d1282are5dus73f040f0

### **Credenziali Chiave**

- **GitHub User**: riccardo-pizzorni
- **Email**: r.pizzorni@campus.unimib.it
- **Vercel Project**: student-analyst
- **Render Service**: student-analyst

### **Porte e Configurazioni**

- **Frontend Dev**: 5173 (Vite default)
- **Backend**: 10000 (configurata)
- **Health Check**: /health
- **API Base**: /api/

---

**📝 Nota**: Questo file contiene tutte le informazioni tecniche critiche per la gestione del progetto Student Analyst. Aggiornare regolarmente con nuove configurazioni e modifiche.
