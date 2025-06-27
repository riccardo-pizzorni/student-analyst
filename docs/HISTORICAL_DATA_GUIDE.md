# 📈 Guida ai Dati Storici - Student Analyst

> **Data**: 2025-06-27  
> **Versione**: 1.0.0  
> **Autore**: Student Analyst Team

---

## 🎯 Panoramica

Student Analyst ora supporta dati storici profondi (fino a 15+ anni) attraverso l'integrazione con Yahoo Finance. Questa guida ti aiuterà a comprendere e utilizzare al meglio le funzionalità di analisi storica avanzata.

---

## 📊 Caratteristiche dei Dati Storici

### **Profondità Storica**

| Periodo      | Disponibilità | Dettagli                               |
| ------------ | ------------- | -------------------------------------- |
| **1 Anno**   | ✅ Completo   | Dati giornalieri, settimanali, mensili |
| **5 Anni**   | ✅ Completo   | Dati completi con aggiustamenti        |
| **10 Anni**  | ✅ Completo   | Dati storici estesi                    |
| **15+ Anni** | ✅ Completo   | Dati storici massimi disponibili       |

### **Tipi di Dati**

#### **1. Dati OHLCV**

- **Open**: Prezzo di apertura
- **High**: Prezzo massimo della giornata
- **Low**: Prezzo minimo della giornata
- **Close**: Prezzo di chiusura
- **Volume**: Volume scambiato

#### **2. Dati Aggiustati**

- **Adjusted Close**: Prezzo aggiustato per dividendi e split
- **Split Factor**: Fattore di split azionario
- **Dividend Amount**: Importo dividendi

#### **3. Metadati**

- **Symbol**: Simbolo del titolo
- **Company Name**: Nome dell'azienda
- **Exchange**: Borsa di riferimento
- **Currency**: Valuta di quotazione

---

## 🔧 Utilizzo dei Dati Storici

### **Endpoint API**

```http
POST /api/analysis
Content-Type: application/json

{
  "tickers": ["AAPL", "MSFT", "GOOGL"],
  "startDate": "2010-01-01",
  "endDate": "2025-01-01",
  "frequency": "daily"
}
```

### **Parametri di Richiesta**

#### **tickers (Array di stringhe)**

- **Formato**: Array di simboli azionari
- **Esempi**: `["AAPL"]`, `["AAPL", "MSFT", "GOOGL"]`
- **Limite**: Fino a 50 ticker simultanei
- **Validazione**: Simboli validi per Yahoo Finance

#### **startDate (Stringa)**

- **Formato**: `YYYY-MM-DD`
- **Esempi**: `"2010-01-01"`, `"2020-06-15"`
- **Limite**: Fino a 15+ anni nel passato
- **Validazione**: Data valida e nel passato

#### **endDate (Stringa)**

- **Formato**: `YYYY-MM-DD`
- **Esempi**: `"2025-01-01"`, `"2024-12-31"`
- **Limite**: Data corrente o nel passato
- **Validazione**: Data valida e >= startDate

#### **frequency (Stringa)**

- **Valori**: `"daily"`, `"weekly"`, `"monthly"`
- **Default**: `"daily"`
- **Impatto**: Granularità dei dati e performance

### **Esempi di Utilizzo**

#### **Analisi Storica Semplice**

```json
{
  "tickers": ["AAPL"],
  "startDate": "2023-01-01",
  "endDate": "2024-12-31",
  "frequency": "daily"
}
```

#### **Analisi Multi-Ticker**

```json
{
  "tickers": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
  "startDate": "2020-01-01",
  "endDate": "2024-12-31",
  "frequency": "daily"
}
```

#### **Analisi Storica Profonda**

```json
{
  "tickers": ["AAPL"],
  "startDate": "2010-01-01",
  "endDate": "2024-12-31",
  "frequency": "monthly"
}
```

---

## 📈 Analisi Avanzate

### **1. Analisi di Trend**

#### **Trend a Lungo Termine**

```typescript
// Analisi trend 10 anni
const longTermTrend = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tickers: ['AAPL'],
    startDate: '2014-01-01',
    endDate: '2024-12-31',
    frequency: 'monthly',
  }),
});
```

#### **Analisi Ciclica**

```typescript
// Analisi cicli di mercato
const cyclicalAnalysis = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tickers: ['SPY', 'QQQ', 'IWM'],
    startDate: '2008-01-01',
    endDate: '2024-12-31',
    frequency: 'daily',
  }),
});
```

### **2. Analisi di Volatilità**

#### **Volatilità Storica**

```typescript
// Calcolo volatilità rolling
const volatilityAnalysis = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tickers: ['AAPL'],
    startDate: '2020-01-01',
    endDate: '2024-12-31',
    frequency: 'daily',
  }),
});
```

#### **Stress Testing**

```typescript
// Test stress su periodi critici
const stressTest = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tickers: ['AAPL', 'MSFT', 'GOOGL'],
    startDate: '2008-09-01',
    endDate: '2009-03-31',
    frequency: 'daily',
  }),
});
```

### **3. Analisi di Correlazione**

#### **Correlazione Storica**

```typescript
// Analisi correlazione multi-asset
const correlationAnalysis = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'],
    startDate: '2020-01-01',
    endDate: '2024-12-31',
    frequency: 'daily',
  }),
});
```

---

## 🎯 Best Practices

### **1. Selezione del Periodo**

#### **Per Analisi Tecnica**

- **Breve termine**: 1-6 mesi (dati giornalieri)
- **Medio termine**: 1-3 anni (dati giornalieri/settimanali)
- **Lungo termine**: 5-15 anni (dati settimanali/mensili)

#### **Per Analisi Fondamentale**

- **Trend aziendale**: 5-10 anni (dati mensili)
- **Cicli di mercato**: 10-15 anni (dati mensili)
- **Analisi settoriale**: 3-5 anni (dati settimanali)

### **2. Selezione della Frequenza**

#### **daily**

- **Vantaggi**: Massima granularità, precisione
- **Svantaggi**: Più dati, elaborazione più lenta
- **Uso**: Analisi tecnica, trading, volatilità

#### **weekly**

- **Vantaggi**: Bilanciamento granularità/performance
- **Svantaggi**: Perdita dettagli giornalieri
- **Uso**: Analisi trend, correlazioni, portafogli

#### **monthly**

- **Vantaggi**: Performance ottimale, trend chiari
- **Svantaggi**: Perdita volatilità giornaliera
- **Uso**: Analisi fondamentale, trend lunghi

### **3. Selezione dei Ticker**

#### **Portafogli Diversificati**

```json
{
  "tickers": [
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "TSLA", // Tech
    "JPM",
    "BAC",
    "WFC", // Finance
    "JNJ",
    "PFE",
    "UNH", // Healthcare
    "XOM",
    "CVX",
    "COP" // Energy
  ]
}
```

#### **Analisi Settoriale**

```json
{
  "tickers": [
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "TSLA",
    "NVDA",
    "AMD",
    "INTC",
    "ORCL",
    "CRM"
  ]
}
```

---

## 📊 Interpretazione dei Risultati

### **Struttura della Risposta**

```json
{
  "success": true,
  "data": {
    "historicalData": [
      {
        "symbol": "AAPL",
        "date": "2024-01-02",
        "open": 185.59,
        "high": 186.12,
        "low": 184.26,
        "close": 185.85,
        "volume": 52455980,
        "adjustedClose": 185.85
      }
    ],
    "portfolioData": {
      "totalReturn": 0.15,
      "annualizedReturn": 0.12,
      "volatility": 0.18,
      "sharpeRatio": 0.67
    },
    "marketPhases": {
      "bullMarkets": [...],
      "bearMarkets": [...],
      "sidewaysMarkets": [...]
    }
  },
  "metadata": {
    "analysisDate": "2025-06-27T10:00:00Z",
    "symbols": ["AAPL"],
    "period": {
      "start": "2020-01-01",
      "end": "2024-12-31"
    },
    "frequency": "daily",
    "dataPoints": 1250,
    "processingTime": 1500,
    "dataSources": {
      "primary": "yahoo_finance",
      "fallbacks": []
    }
  }
}
```

### **Metriche Chiave**

#### **1. Performance**

- **Total Return**: Rendimento totale del periodo
- **Annualized Return**: Rendimento annualizzato
- **CAGR**: Compound Annual Growth Rate
- **Best/Worst Day**: Miglior/peggior giorno

#### **2. Rischio**

- **Volatility**: Volatilità annualizzata
- **Max Drawdown**: Massimo drawdown
- **VaR**: Value at Risk
- **CVaR**: Conditional Value at Risk

#### **3. Correlazione**

- **Correlation Matrix**: Matrice di correlazione
- **Diversification Index**: Indice di diversificazione
- **Beta**: Beta vs benchmark

---

## 🚨 Limitazioni e Considerazioni

### **1. Limitazioni dei Dati**

#### **Disponibilità Storica**

- **Nuovi Titoli**: Dati limitati per IPO recenti
- **Delisting**: Dati non disponibili per titoli delistati
- **Merger/Acquisition**: Discontinuità nei dati

#### **Qualità dei Dati**

- **Split/Dividend**: Aggiustamenti automatici
- **Holiday**: Dati non disponibili nei giorni festivi
- **Market Hours**: Dati solo durante orari di mercato

### **2. Considerazioni Tecniche**

#### **Performance**

- **Dataset Grandi**: Elaborazione più lenta per periodi lunghi
- **Memory Usage**: Maggiore utilizzo memoria per multi-ticker
- **Network**: Dipendenza da connessione internet

#### **Rate Limiting**

- **Yahoo Finance**: Nessun limite artificiale
- **Alpha Vantage**: Limiti su piano gratuito
- **Fallback**: Gestione automatica dei limiti

### **3. Best Practices Operative**

#### **Caching**

- **Cache Locale**: Dati cached per 5 minuti
- **Cache Condivisa**: Condivisione tra utenti
- **Cache Invalidation**: Invalidazione automatica

#### **Error Handling**

- **Retry Logic**: Tentativi automatici
- **Fallback**: Switch automatico tra sorgenti
- **Graceful Degradation**: Risposta parziale se possibile

---

## 🧪 Testing e Validazione

### **Test di Qualità Dati**

#### **1. Validazione Completeness**

```typescript
// Verifica completezza dati
const validateDataCompleteness = (data: HistoricalData[]) => {
  const expectedDays = calculateBusinessDays(startDate, endDate);
  const actualDays = data.length;

  return actualDays / expectedDays > 0.95; // 95% completezza
};
```

#### **2. Validazione Consistency**

```typescript
// Verifica consistenza dati
const validateDataConsistency = (data: HistoricalData[]) => {
  return data.every(
    day =>
      day.high >= day.low &&
      day.high >= day.open &&
      day.high >= day.close &&
      day.low <= day.open &&
      day.low <= day.close
  );
};
```

#### **3. Validazione Outliers**

```typescript
// Rilevamento outlier
const detectOutliers = (data: HistoricalData[]) => {
  const returns = calculateReturns(data);
  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const std = Math.sqrt(
    returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
  );

  return returns.filter(r => Math.abs(r - mean) > 3 * std);
};
```

### **Test di Performance**

#### **1. Load Testing**

```typescript
// Test carico con dataset grandi
const loadTest = async () => {
  const startTime = Date.now();

  const response = await fetch('/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tickers: Array(50)
        .fill()
        .map((_, i) => `TICKER${i}`),
      startDate: '2010-01-01',
      endDate: '2024-12-31',
      frequency: 'daily',
    }),
  });

  const processingTime = Date.now() - startTime;
  return processingTime < 30000; // < 30 secondi
};
```

#### **2. Memory Testing**

```typescript
// Test utilizzo memoria
const memoryTest = async () => {
  const initialMemory = process.memoryUsage().heapUsed;

  await performLargeAnalysis();

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;

  return memoryIncrease < 100 * 1024 * 1024; // < 100MB
};
```

---

## 📞 Supporto e Troubleshooting

### **Problemi Comuni**

#### **1. Dati Mancanti**

**Sintomi**: Gap nei dati storici
**Cause**: Holiday, delisting, errori API
**Soluzioni**:

- Verificare date (holiday, weekend)
- Controllare status del titolo
- Usare fallback automatico

#### **2. Performance Lenta**

**Sintomi**: Tempi di risposta > 30 secondi
**Cause**: Dataset troppo grandi
**Soluzioni**:

- Ridurre numero di ticker
- Usare frequenza settimanale/mensile
- Ridurre periodo di analisi

#### **3. Errori di Validazione**

**Sintomi**: Errori 400 Bad Request
**Cause**: Parametri invalidi
**Soluzioni**:

- Verificare formato date (YYYY-MM-DD)
- Controllare simboli validi
- Validare frequenza supportata

### **Comandi di Debug**

```bash
# Test endpoint
curl -X POST https://student-analyst.onrender.com/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"tickers":["AAPL"],"startDate":"2024-01-01","endDate":"2024-12-31","frequency":"daily"}'

# Health check
curl https://student-analyst.onrender.com/health

# Log analysis
tail -f logs/application.log | grep "historical"
```

---

## 🔮 Roadmap Futura

### **Prossimi Sviluppi**

- [ ] **Real-time Data**: Quote in tempo reale
- [ ] **Options Data**: Dati opzioni e derivati
- [ ] **Fundamental Data**: Dati fondamentali integrati
- [ ] **International Markets**: Mercati internazionali
- [ ] **Alternative Data**: Dati alternativi (social, sentiment)

### **Miglioramenti Performance**

- [ ] **Streaming**: Streaming dati in tempo reale
- [ ] **Compression**: Compressione dati avanzata
- [ ] **CDN**: Distribuzione globale dei dati
- [ ] **Machine Learning**: Predizioni basate su ML

---

## 📝 Changelog

### **v1.0.0 (2025-06-27)**

- ✅ **Dati Storici Profondi**: Supporto fino a 15+ anni
- ✅ **Yahoo Finance Integration**: Sorgente primaria
- ✅ **Multi-Ticker Support**: Fino a 50 ticker simultanei
- ✅ **Fallback System**: Alpha Vantage come backup
- ✅ **Performance Optimization**: Cache e lazy loading
- ✅ **Error Handling**: Gestione robusta degli errori
- ✅ **Documentation**: Guida completa ai dati storici
- ✅ **Testing**: Test unitari e di integrazione

---

**Student Analyst** - Dati storici profondi per analisi avanzate 📈📊
