# 🔧 DETTAGLI CONFIGURAZIONI SPECIFICHE - STUDENT ANALYST

> **Fonte**: Screenshot dettagliati GitHub, Vercel, Render  
> **Data**: 2025-06-28  
> **Dettagli tecnici specifici estratti dalle immagini**

---

## 🎯 **IDENTIFICATORI UNICI E CODICI**

### **Project IDs e Service IDs**

- **Vercel Project ID**: `prj_pUADPQ9JRbzIyUY4bXImtB0SGKLy`
- **Render Service ID**: `srv-d1282are5dus73f040f0`
- **GitHub Repository**: `riccardo-pizzorni/student-analyst`
- **Webhook ID**: `554587057`

### **Deployment Hash Examples**

- **Latest Commit**: `f71ee9a` (chore: remove temporary test file after workflow verification)
- **Previous Commits**: `0e4ed57`, `a894653`
- **Deploy IDs**: `Cd1xINpPH`, `9YngUhxfz`, `7bkFa9aKo`, `Fr3EwIFvF`, `8Z3sNXLJJ`

---

## 🌐 **NETWORKING E DOMAINS**

### **Vercel Domain Configuration**

```
Primary: student-analyst.vercel.app
Additional Domains: +2 (non specificati nelle immagini)
SSL: Automatic
CDN: Global Edge Network
```

### **Render Networking**

```
Primary URL: https://student-analyst.onrender.com
Subdomain: Enabled
Custom Domains: Supported but not configured
SSL: Automatic
Region: Oregon (US West)
```

### **CORS Origins (Exact List)**

```javascript
const allowedOrigins = [
  'https://student-analyst.vercel.app',
  'https://student-analyst-git-main.vercel.app',
  'https://student-analyst-git-feature.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];
```

---

## 🔐 **SECURITY TOKENS E KEYS**

### **API Keys Visibili**

```bash
# Alpha Vantage API Key (ESPOSTA - da verificare sicurezza)
ALPHA_VANTAGE_API_KEY=W8EEE8B0TZMGIP1M
VITE_APIKey_ALPHA_VANTAGE=W8EEE8B0TZMGIP1M
```

### **Webhook Security**

```
Payload URL: https://api.vercel.com/v1/integrations/deploy/prj_pUADPQ9JRbzIyUY4bXImtB0SGKLy/It0qZcTNtv
Content Type: application/json
SSL Verification: Enabled
Secret: [Configurato ma nascosto]
```

---

## 📊 **METRICHE SPECIFICHE DALLE IMMAGINI**

### **Vercel Analytics (Ultimi 6h)**

```
Edge Requests: 592
Function Invocations: 0
Error Rate: 0%
Data Transfer: 362.04 MB / 100 GB
CPU Duration: 0s / 1h
```

### **Render Resource Usage**

```
Instance Type: Free
CPU: 0.1 CPU
Memory: 512 MB
Storage: Limited
Bandwidth: Limited
```

### **GitHub Statistics**

```
Repository Size: 31.1 MB
Total Commits: 567
Languages: TypeScript 94.1%, CSS 4.6%
Stars: 0
Watchers: 0
Forks: 0
```

---

## 🔄 **BUILD CONFIGURATIONS ESATTE**

### **Vercel Build Settings**

```json
{
  "framework": "vite",
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rootDirectory": null,
  "nodeVersion": "18.x"
}
```

### **Render Build Settings**

```bash
# Build Command
backend/ $ npm install && npm run build

# Pre-Deploy Command (Optional)
backend/ $

# Start Command
backend/ $ node dist/index.js

# Auto-Deploy: On Commit
# Branch: master
```

---

## 📋 **ENVIRONMENT VARIABLES COMPLETE**

### **Vercel Environment Variables (Tutte)**

```bash
VITE_DEBUG_MODE=true
VITE_API_TIMEOUT=20000
VITE_APIKey_ALPHA_VANTAGE=W8EEE8B0TZMGIP1M
VITE_BACKEND_URL=https://student-analyst.onrender.com
```

### **Render Environment Variables (Tutte)**

```bash
ALPHA_VANTAGE_API_KEY=W8EEE8B0TZMGIP1M
ALPHA_VANTAGE_BASE_URL=https://www.alphavantage.co/query
FRONTEND_URL=https://student-analyst.vercel.app
NODE_ENV=production
PORT=10000
```

---

## 🚀 **DEPLOYMENT HISTORY SPECIFICO**

### **Vercel Deployments (Cronologia)**

```
Cd1xINpPH - Ready - 5m ago by riccardo-pizzorni - f71ee9a chore: remove temporary test file...
9YngUhxfz - Ready - 5m ago by riccardo-pizzorni - f71ee9a chore: remove temporary test file...
7bkFa9aKo - Ready - 6m ago via Deploy Hook - 0e4ed57 test: add temporary file to verify git...
Fr3EwIFvF - Ready - 6m ago by riccardo-pizzorni - 0e4ed57 test: add temporary file to verify git...
8Z3sNXLJJ - Ready - 55m ago via Deploy Hook - a894653 Auto-commit: 28/06/2025 8:03:05...
```

### **GitHub Actions Status (Specifico)**

```
✅ Post-Deployment Health Check - Started 2m 23s ago
✅ Frontend Tests & Build - Completed
✅ Backend Tests & Build - Completed
✅ Security & Quality Audit - Completed
✅ Integration Tests - Completed
✅ Deploy Backend (Render) - Completed
✅ Deploy Frontend (Vercel) - Completed
```

---

## 🔧 **TECHNICAL SETTINGS SPECIFICI**

### **GitHub Repository Settings**

```
Default Branch: master (NOT main)
Branch Protection: Enabled
Merge Options: All enabled
Delete Head Branches: Enabled
Automatically Delete Head Branches: Yes
```

### **Vercel Framework Detection**

```
Framework: Vite (Auto-detected)
Build Settings Override: No
Include files outside root directory: Enabled
Vercel Toolbar: Default (controlled at team level)
```

### **Render Service Configuration**

```
Service Type: Web Service
Runtime: Node.js
Health Check Path: /health
Health Check Grace Period: 0s
Health Check Interval: 30s
Health Check Timeout: 20s
Health Check Unhealthy Threshold: 3
Health Check Healthy Threshold: 1
```

---

## 📱 **NOTIFICATIONS E INTEGRATIONS**

### **GitHub Webhooks Events**

```
Active: ✅
Events: Just the push event
Recent Deliveries: Available in webhook management
SSL Verification: Enabled
```

### **Vercel Git Integration**

```
Connected Repository: riccardo-pizzorni/student-analyst
Branch Tracking: master
Pull Request Comments: Enabled
Commit Comments: Enabled
deployment_status Events: Enabled
```

### **Render Notifications**

```
Service Notifications: Use workspace default (Only failure notifications)
Preview Environment Notifications: Use account default (Disabled)
Pull Request Previews: Off
```

---

## 🎯 **QUICK ACCESS LINKS (ESATTI)**

### **Dashboard URLs (Copiate dalle immagini)**

```
GitHub Repo: https://github.com/riccardo-pizzorni/student-analyst
GitHub Settings: https://github.com/riccardo-pizzorni/student-analyst/settings
Vercel Project: https://vercel.com/riccar-pizzornis-projects/student-analyst
Render Service: https://dashboard.render.com/web/srv-d1282are5dus73f040f0
```

### **Live Application URLs**

```
Frontend: https://student-analyst.vercel.app
Backend: https://student-analyst.onrender.com
Health Check: https://student-analyst.onrender.com/health
```

---

## 🚨 **PROBLEMI IDENTIFICATI DALLE IMMAGINI**

### **Render Service Issues**

```
Status: ❌ Failed deploy
Last Successful Deploy: >3h ago
Error Type: Deploy failure (dettagli nei logs)
Health Check: Configurato ma probabilmente failing
```

### **Security Concerns**

```
⚠️ API Key esposta: W8EEE8B0TZMGIP1M
⚠️ Variabili environment potrebbero essere pubbliche
⚠️ Repository pubblico con potenziali secrets
```

### **GitHub Actions**

```
⚠️ Health check intermittent failures
⚠️ Alcuni job potrebbero avere timeout issues
✅ Build process generally stable
```

---

## 📊 **USAGE LIMITS E QUOTAS**

### **Vercel Free Tier**

```
Edge Requests: 592/100,000 per month
Function Invocations: 0/100,000 per month
Data Transfer: 362.04 MB/100 GB per month
Build Time: Used/6,000 minutes per month
```

### **Render Free Tier**

```
CPU: 0.1 CPU (shared)
Memory: 512 MB
Bandwidth: 100 GB/month
Build Minutes: 500/month
Sleep after 15 minutes of inactivity
```

### **GitHub Free**

```
Public Repositories: Unlimited
Private Repositories: Unlimited
Actions Minutes: 2,000/month
Storage: 500 MB
```

---

**🔍 Nota**: Questi dettagli sono estratti direttamente dalle immagini fornite e rappresentano lo stato esatto al momento degli screenshot. Verificare regolarmente per cambiamenti.
