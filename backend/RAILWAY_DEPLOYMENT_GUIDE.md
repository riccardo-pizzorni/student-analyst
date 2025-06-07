# 🚂 RAILWAY DEPLOYMENT GUIDE - STUDENT ANALYST BACKEND

## 📋 **COSA STAI PER FARE**

In parole semplici: stai per mettere il "cervello" del tuo sito web (il backend) su un server online gratuito chiamato Railway. È come trasformare la tua macchina da modellino a vera automobile che può viaggiare ovunque su internet.

---

## 🎯 **PREREQUISITI (COSA TI SERVE)**

### **1. Account Railway (GRATUITO)**
- Vai su [railway.app](https://railway.app)
- Clicca "Start a New Project"
- Collegati con il tuo account GitHub (quello dove hai caricato il progetto)

### **2. Progetto GitHub Pronto**
- Il tuo codice deve essere su GitHub (✅ già fatto)
- Repository: `https://github.com/riccardo-pizzorni/student-analyst`

---

## 🛠️ **PASSAGGI DEPLOYMENT (SEGUI ESATTAMENTE)**

### **STEP 1: CREA PROGETTO RAILWAY**

1. **Vai su [railway.app](https://railway.app)**
2. **Clicca "Start a New Project"**
3. **Scegli "Deploy from GitHub repo"**
4. **Seleziona il tuo repository:** `student-analyst`
5. **Scegli la cartella backend:** `/backend`

### **STEP 2: CONFIGURA ENVIRONMENT VARIABLES**

Nel dashboard Railway, vai su **"Variables"** e aggiungi:

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://student-analyst.vercel.app
PRODUCTION_URL=https://your-railway-app.up.railway.app
```

### **STEP 3: CONFIGURA BUILD SETTINGS**

Vai su **"Settings"** → **"Deploy"** e imposta:

- **Root Directory:** `/backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### **STEP 4: AVVIA DEPLOYMENT**

1. **Clicca "Deploy"**
2. **Aspetta che il processo finisca** (2-5 minuti)
3. **Controlla i logs** per errori

---

## 🔧 **FILE IMPORTANTI CREATI PER TE**

### **📁 railway.json**
```json
{
  "name": "student-analyst-backend",
  "runtime": "nodejs",
  "build": {
    "command": "npm install",
    "output": "dist"
  },
  "start": {
    "command": "npm start"
  },
  "environment": {
    "NODE_ENV": "production"
  },
  "healthcheck": {
    "path": "/health",
    "timeout": 30,
    "interval": 60
  }
}
```

### **📁 Procfile**
```
web: npm start
```

### **📁 package.json (aggiornato)**
- Script ottimizzati per Railway
- Dipendenze corrette
- Node.js versione specificata

---

## ✅ **VERIFICA CHE TUTTO FUNZIONI**

### **1. Controlla URL Railway**
- Railway ti darà un URL tipo: `https://your-app.up.railway.app`
- Apri questo URL nel browser
- Dovresti vedere il messaggio di benvenuto del backend

### **2. Testa Health Check**
- Vai su: `https://your-railway-app.up.railway.app/health`
- Dovresti vedere:
```json
{
  "status": "OK",
  "message": "Student Analyst Backend is running",
  "timestamp": "2024-01-07T19:30:00.000Z"
}
```

### **3. Testa API**
- Vai su: `https://your-railway-app.up.railway.app/api/test`
- Dovresti vedere una risposta JSON positiva

---

## 🚨 **PROBLEMI COMUNI E SOLUZIONI**

### **❌ "Build Failed"**
**SOLUZIONE:**
1. Controlla che la cartella sia `/backend`
2. Verifica che `package.json` esista
3. Controlla i logs per errori specifici

### **❌ "Port Binding Error"**
**SOLUZIONE:**
1. Assicurati che `PORT` sia nelle variabili d'ambiente
2. Il server deve usare `process.env.PORT`

### **❌ "Cannot GET /"**
**SOLUZIONE:**
1. Il server si è avviato ma le route non funzionano
2. Controlla i logs per errori JavaScript
3. Verifica che `simple-server.js` sia presente

### **❌ "CORS Error dal Frontend"**
**SOLUZIONE:**
1. Aggiungi l'URL Railway alle variabili d'ambiente
2. Aggiorna `PRODUCTION_URL` con l'URL corretto
3. Riavvia il deployment

---

## 🔗 **COLLEGAMENTO CON FRONTEND**

### **1. Aggiorna Frontend Vercel**
Nel tuo frontend (Vercel), aggiungi la variabile d'ambiente:
```env
VITE_BACKEND_URL=https://your-railway-app.up.railway.app
```

### **2. Testa Connessione**
- Frontend su Vercel: `https://student-analyst.vercel.app`
- Backend su Railway: `https://your-railway-app.up.railway.app`
- Devono comunicare senza errori CORS

---

## 📊 **MONITORING & LOGS**

### **1. Accedi ai Logs**
- Dashboard Railway → **"Deployments"** → **"View Logs"**
- Monitora errori e performance

### **2. Health Monitoring**
- Railway controlla automaticamente `/health`
- Se il server non risponde, riavvia automaticamente

### **3. Metriche Gratuite**
- CPU usage
- Memory usage  
- Network requests
- Uptime statistics

---

## 🎯 **COSA FARE DOPO IL DEPLOYMENT**

### **✅ VERIFICHE FINALI**
1. [ ] Backend risponde su Railway URL
2. [ ] Health check funziona
3. [ ] Frontend comunica con backend
4. [ ] Nessun errore CORS
5. [ ] Logs puliti senza errori

### **🚀 PROSSIMI PASSI**
1. **Collegare API finanziarie** (Alpha Vantage, Yahoo Finance)
2. **Testare funzionalità complete**
3. **Ottimizzare performance**
4. **Aggiungere monitoring avanzato**

---

## 📞 **SUPPORTO**

Se qualcosa non funziona:
1. **Controlla sempre i logs** su Railway
2. **Verifica le variabili d'ambiente**
3. **Testa gli endpoint manualmente**
4. **Controlla la comunicazione frontend-backend**

---

## 🏆 **RISULTATO FINALE**

Dopo aver completato questa guida, avrai:
- ✅ **Backend live su Railway** (gratuito)
- ✅ **Frontend live su Vercel** (gratuito)  
- ✅ **Comunicazione frontend-backend funzionante**
- ✅ **Health monitoring attivo**
- ✅ **Zero costi operativi**

**🎉 Il tuo Student Analyst sarà completamente online e accessibile da tutto il mondo!** 