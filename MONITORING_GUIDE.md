# STUDENT ANALYST - Guida al Sistema di Monitoraggio

## 🔍 Cos'è il Sistema di Monitoraggio?

Il sistema di monitoraggio di Student Analyst è come avere un "guardiano digitale" che veglia costantemente sul nostro sito web 24 ore su 24, 7 giorni su 7. È progettato per:

- **Rilevare problemi prima che li notino gli utenti**
- **Misurare quanto veloce è il sito**
- **Tracciare tutti gli errori che si verificano**
- **Controllare che i servizi esterni funzionino**
- **Fornire statistiche di utilizzo**

## 🎯 Perché è Importante?

Immagina di avere un negozio fisico: vorresti sapere se:
- La porta è rotta e i clienti non riescono ad entrare
- La cassa funziona lentamente e i clienti si spazientiscono
- Ci sono problemi con i fornitori
- Quante persone visitano il negozio ogni giorno

Il nostro sistema di monitoraggio fa esattamente questo, ma per il sito web!

## 📊 Componenti del Sistema

### 1. **Vercel Analytics** (Gratuito)
- **Cosa fa**: Conta i visitatori e traccia il loro comportamento
- **Cosa monitora**: 
  - Numero di visite giornaliere
  - Pagine più popolari
  - Paesi di provenienza dei visitatori
  - Dispositivi utilizzati (computer, telefono, tablet)

### 2. **Sistema di Tracking Errori** (Sviluppato internamente)
- **Cosa fa**: Cattura automaticamente ogni errore che si verifica
- **Cosa monitora**:
  - Errori JavaScript nel browser
  - Problemi di connessione
  - Funzioni che si bloccano
  - Promesse non gestite
- **Dove vengono salvati**: Localmente nel browser per debugging

### 3. **Monitoraggio Performance** (Web Vitals + Custom)
- **Cosa fa**: Misura quanto veloce è il sito per gli utenti
- **Metriche monitorate**:
  - **Tempo di caricamento pagina**: Quanto ci mette ad aprirsi
  - **First Contentful Paint**: Quando appare il primo contenuto
  - **Largest Contentful Paint**: Quando si carica l'elemento principale
  - **Cumulative Layout Shift**: Se gli elementi si spostano durante il caricamento
  - **First Input Delay**: Quanto tempo ci mette a rispondere al primo click

### 4. **Health Checks** (Controlli di Salute)
- **Cosa fa**: Verifica che tutti i servizi esterni funzionino
- **Servizi monitorati**:
  - **Backend Student Analyst**: Il nostro server
  - **Alpha Vantage API**: Dati finanziari
  - **Yahoo Finance API**: Dati alternativi
- **Frequenza**: Ogni 5 minuti
- **Timeout**: 10 secondi per richiesta

## 🎮 Come Utilizzare il Dashboard

### Accesso al Monitoring Dashboard
Il dashboard di monitoraggio è integrato nell'applicazione e mostra:

#### **Panoramica Generale** (4 Card principali)
1. **Overall Health**: Percentuale di servizi funzionanti
2. **Page Load**: Tempo medio di caricamento
3. **Errors**: Numero di errori nella sessione corrente
4. **Last Update**: Quando sono stati aggiornati i dati

#### **Stato dei Servizi**
Ogni servizio mostra:
- **🟢 Healthy**: Tutto funziona perfettamente
- **🟡 Degraded**: Funziona ma con problemi
- **🔴 Down**: Non funziona

#### **Performance Insights**
Il sistema fornisce automaticamente suggerimenti:
- **Slow Page Load**: Se il sito è lento (>3 secondi)
- **High Error Rate**: Se ci sono molti errori (>5)
- **System Optimal**: Quando tutto funziona perfettamente

## 🚨 Sistema di Allerta

### Quando Vengono Inviati gli Allarmi?
- **Servizio Down**: Quando un servizio esterno non risponde
- **Performance Degradata**: Quando il sito diventa lento
- **Errori Multipli**: Quando si verificano molti errori

### Dove Vengono Visualizzati?
- **Console del Browser**: Per sviluppatori
- **Dashboard Monitoring**: Per tutti gli utenti
- **Logs Vercel**: Per analytics avanzate

## 📈 Metriche Chiave da Monitorare

### 🎯 **Obiettivi di Performance**
- **Tempo di caricamento**: < 2 secondi (Ottimo), < 3 secondi (Buono)
- **Errori**: 0 errori per sessione
- **Uptime servizi**: 99%+ di disponibilità
- **Response time API**: < 1 secondo

### 📊 **Soglie di Allarme**
- **⚠️ Warning**: Caricamento > 3 secondi
- **🚨 Critical**: Caricamento > 5 secondi o servizi down
- **📈 Good**: Tutto sotto i 2 secondi con 0 errori

## 🔧 Risoluzione Problemi Comuni

### **Sito Lento**
1. Controllare la connessione internet
2. Verificare se i servizi esterni sono down
3. Controllare il dashboard per identificare il collo di bottiglia

### **Errori Frequenti**
1. Aprire la console del browser (F12)
2. Cercare errori in rosso
3. Verificare se è un problema della nostra app o di servizi esterni

### **Servizi Down**
1. Controllare se Alpha Vantage è raggiungibile
2. Verificare lo stato del backend su Render
3. Controllare la connessione internet

## 🛠️ Comandi per Sviluppatori

### Frontend
```bash
# Avvia l'app con monitoraggio attivo
npm run dev

# Build con analytics
npm run build
```

### Backend
```bash
# Test completo di monitoraggio
npm run test:monitoring

# Solo health check
npm run test:health

# Monitoring continuo
npm run monitor
```

## 📱 Accesso alle Metriche

### **Vercel Dashboard** (Solo per admin)
- URL: https://vercel.com/dashboard
- Sezione: Analytics del progetto student-analyst
- Metriche: Traffico, performance, errori

### **Logs Locali**
- Browser: Console Developer Tools (F12)
- Storage: localStorage chiave 'student-analyst-metrics'

### **Backend Logs**
- Render Dashboard: https://dashboard.render.com
- Service: student-analyst backend

## 🚀 Benefici per gli Utenti Finali

### **Per gli Analisti Finanziari:**
- Sito sempre veloce e affidabile
- Dati finanziari sempre aggiornati
- Zero interruzioni di servizio
- Calcoli che completano in < 10 secondi

### **Per gli Amministratori:**
- Visibilità completa sullo stato del sistema
- Problemi risolti prima che impattino gli utenti
- Statistiche di utilizzo per miglioramenti
- Sistema completamente gratuito

## 🔄 Aggiornamenti Automatici

Il sistema di monitoraggio si aggiorna automaticamente:
- **Health checks**: Ogni 5 minuti
- **Performance metrics**: In tempo reale
- **Error tracking**: Istantaneo
- **Dashboard refresh**: Ogni 30 secondi

## 📞 Supporto

In caso di problemi con il monitoraggio:
1. Verificare che JavaScript sia abilitato
2. Controllare la connessione internet
3. Ricaricare la pagina
4. Controllare la console per errori specifici

---

*Ultimo aggiornamento: 07/06/2025*
*Sistema di monitoraggio versione 1.0 - Completamente gratuito e autosufficiente* 