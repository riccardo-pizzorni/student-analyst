# 🔄 Sistema di Fallback - Student Analyst

> **Data**: 2025-06-27  
> **Versione**: 1.0.0  
> **Autore**: Student Analyst Team

---

## 🎯 Panoramica

Il sistema di fallback di Student Analyst garantisce continuità del servizio e affidabilità dei dati finanziari attraverso la gestione intelligente di multiple sorgenti dati. Yahoo Finance funge da sorgente primaria, mentre Alpha Vantage fornisce backup automatico in caso di problemi.

---

## 🏗️ Architettura del Fallback

### **Flusso Operativo**

```
┌─────────────────────────────────────────────────────────────┐
│                    Richiesta Utente                        │
│                    /api/analysis                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 DataSourceManager                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Prova Yahoo Finance (Primario)                   │   │
│  │    ├─ Success → Ritorna dati                        │   │
│  │    └─ Failure → Log error, delay 1s                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                             │
│                              ▼                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. Prova Alpha Vantage (Fallback)                  │   │
│  │    ├─ Success → Ritorna dati + flag fallback       │   │
│  │    └─ Failure → Errore completo                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### **Componenti del Sistema**

#### **1. DataSourceManager**

- **Responsabilità**: Coordinazione tra sorgenti dati
- **Configurazione**: Sorgente primaria e fallback
- **Logging**: Tracciamento di tutti i fallback
- **Monitoring**: Health check delle sorgenti

#### **2. YahooFinanceService**

- **Sorgente**: Primaria
- **Priorità**: 1
- **Timeout**: 30 secondi
- **Retry**: 3 tentativi

#### **3. AlphaVantageService**

- **Sorgente**: Fallback
- **Priorità**: 2
- **Timeout**: 30 secondi
- **Retry**: 3 tentativi

---

## ⚙️ Configurazione

### **Parametri di Configurazione**

```typescript
interface DataSourceManagerConfig {
  primarySource: DataSource.YAHOO_FINANCE;
  enableFallback: boolean; // true
  fallbackDelay: number; // 1000ms
  maxRetries: number; // 3
  logFallbacks: boolean; // true
}
```

### **Configurazione Avanzata**

```typescript
const config: DataSourceManagerConfig = {
  primarySource: DataSource.YAHOO_FINANCE,
  enableFallback: true,
  fallbackDelay: 1000, // 1 secondo di delay
  maxRetries: 3, // 3 tentativi per sorgente
  logFallbacks: true, // Logging dettagliato
};
```

---

## 🔄 Logica di Fallback

### **Condizioni di Attivazione**

Il fallback viene attivato automaticamente quando:

1. **Errore di Rete**

   - Timeout della connessione
   - Connessione rifiutata
   - DNS resolution failed
   - Network unreachable

2. **Errore API**

   - Rate limit exceeded
   - Service unavailable (503)
   - Internal server error (500)
   - Bad gateway (502)

3. **Errore di Dati**

   - Symbol not found
   - No data available
   - Invalid date range
   - Malformed response

4. **Errore di Parsing**
   - JSON parsing failed
   - Missing required fields
   - Invalid data format
   - Type conversion error

### **Esclusione dal Fallback**

Il fallback NON viene attivato per:

- **Errori di Validazione**: Input utente invalido
- **Errori di Autenticazione**: API key mancante/invalida
- **Errori di Autorizzazione**: Permessi insufficienti
- **Errori di Business Logic**: Logica applicativa

---

## 📊 Monitoring e Logging

### **Log di Fallback**

```typescript
// Log di attivazione fallback
console.warn(
  `[WARN] Primary source (${primarySource}) failed for ${symbol}:`,
  error
);

// Log di successo fallback
console.log(`[INFO] Fallback to ${fallbackSource} successful for ${symbol}`);

// Log di fallimento completo
console.error(
  `[ERROR] Both primary and fallback sources failed for ${symbol}:`,
  error
);
```

### **Statistiche di Fallback**

```typescript
interface FallbackStats {
  yahoo_finance: number; // Contatore fallback da Yahoo
  alpha_vantage: number; // Contatore fallback da Alpha Vantage
  totalRequests: number; // Totale richieste
  successRate: number; // Tasso di successo
}
```

### **Health Check**

```typescript
interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  sources: {
    yahoo_finance: {
      status: 'ok' | 'error';
      responseTime: number;
    };
    alpha_vantage: {
      status: 'ok' | 'error';
      responseTime: number;
    };
  };
  fallbackStats: FallbackStats;
}
```

---

## 🚨 Gestione Errori

### **Tipi di Errore**

#### **1. Errori Retryable**

```typescript
const retryableErrors = [
  'ENOTFOUND', // DNS resolution failed
  'ECONNREFUSED', // Connection refused
  'ETIMEDOUT', // Connection timeout
  'ECONNRESET', // Connection reset
  'ENETUNREACH', // Network unreachable
  'RATE_LIMIT', // API rate limit
  'SERVICE_UNAVAILABLE', // 503 Service Unavailable
  'BAD_GATEWAY', // 502 Bad Gateway
];
```

#### **2. Errori Non-Retryable**

```typescript
const nonRetryableErrors = [
  'INVALID_SYMBOL', // Symbol not found
  'INVALID_DATE_RANGE', // Date range invalid
  'AUTHENTICATION_ERROR', // API key invalid
  'AUTHORIZATION_ERROR', // Insufficient permissions
  'VALIDATION_ERROR', // Input validation failed
];
```

### **Strategie di Recovery**

#### **1. Retry con Backoff Esponenziale**

```typescript
const calculateBackoffDelay = (attempt: number): number => {
  const baseDelay = 1000; // 1 secondo
  const maxDelay = 30000; // 30 secondi
  const multiplier = 2;

  return Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay);
};
```

#### **2. Circuit Breaker Pattern**

```typescript
interface CircuitBreakerConfig {
  failureThreshold: 5; // 5 fallimenti prima di aprire
  recoveryTimeout: 60000; // 60 secondi di recovery
  monitoringPeriod: 300000; // 5 minuti di monitoring
}
```

#### **3. Graceful Degradation**

```typescript
// Se entrambe le sorgenti falliscono, ritorna dati parziali se disponibili
if (cachedData) {
  return {
    ...cachedData,
    warning: 'Using cached data due to service unavailability',
  };
}
```

---

## 📈 Performance e Ottimizzazioni

### **Ottimizzazioni Implementate**

#### **1. Cache Intelligente**

```typescript
// Cache con TTL differenziato
const cacheConfig = {
  yahoo_finance: 300000, // 5 minuti
  alpha_vantage: 600000, // 10 minuti
  maxSize: 1000, // Massimo 1000 elementi
};
```

#### **2. Connection Pooling**

```typescript
// Riutilizzo connessioni HTTP
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 10,
  timeout: 30000,
});
```

#### **3. Parallel Processing**

```typescript
// Elaborazione parallela per multiple ticker
const results = await Promise.allSettled(
  tickers.map(ticker => fetchData(ticker))
);
```

### **Metriche di Performance**

#### **Tempi di Risposta Target**

- **Yahoo Finance**: < 500ms
- **Alpha Vantage**: < 1000ms
- **Fallback Delay**: 1000ms
- **Total Timeout**: 30000ms

#### **Throughput Target**

- **Concorrenza**: 10 richieste simultanee
- **Rate Limit**: Gestione automatica
- **Cache Hit Rate**: > 80%
- **Success Rate**: > 95%

---

## 🧪 Testing del Fallback

### **Test Unitari**

```typescript
describe('DataSourceManager Fallback', () => {
  it('should use fallback when primary source fails', async () => {
    const manager = new DataSourceManager();

    // Mock Yahoo Finance failure
    jest
      .spyOn(yahooService, 'getStockData')
      .mockRejectedValue(new Error('Network error'));

    const result = await manager.getStockData('AAPL', 'daily');

    expect(result.fallbackUsed).toBe(true);
    expect(result.source).toBe(DataSource.ALPHA_VANTAGE);
  });
});
```

### **Test di Integrazione**

```typescript
describe('Fallback Integration', () => {
  it('should handle complete service failure gracefully', async () => {
    const manager = new DataSourceManager();

    // Mock both services failure
    jest
      .spyOn(yahooService, 'getStockData')
      .mockRejectedValue(new Error('Service unavailable'));
    jest
      .spyOn(alphaVantageService, 'getStockData')
      .mockRejectedValue(new Error('Rate limit'));

    await expect(manager.getStockData('AAPL', 'daily')).rejects.toThrow(
      'Both sources failed'
    );
  });
});
```

### **Test E2E**

```typescript
test('should complete analysis with fallback', async ({ page }) => {
  // Mock network conditions
  await page.route('**/yahoo-finance/**', route => route.abort());

  await page.goto('/');
  await page.fill('[data-testid="ticker-input"]', 'AAPL');
  await page.click('[data-testid="start-analysis"]');

  // Should still complete with fallback
  await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="fallback-indicator"]')
  ).toBeVisible();
});
```

---

## 🔧 Configurazione Operativa

### **Environment Variables**

```bash
# Configurazione sorgenti
PRIMARY_DATA_SOURCE=yahoo_finance
ENABLE_FALLBACK=true
FALLBACK_DELAY=1000
MAX_RETRIES=3

# Logging
LOG_FALLBACKS=true
LOG_LEVEL=info

# Cache
CACHE_TTL_YAHOO=300000
CACHE_TTL_ALPHA_VANTAGE=600000
CACHE_MAX_SIZE=1000
```

### **Health Check Endpoint**

```http
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2025-06-27T10:00:00Z",
  "dataSourceManager": {
    "status": "ok",
    "sources": {
      "yahoo_finance": {
        "status": "ok",
        "responseTime": 250
      },
      "alpha_vantage": {
        "status": "ok",
        "responseTime": 500
      }
    },
    "fallbackStats": {
      "yahoo_finance": 0,
      "alpha_vantage": 2,
      "totalRequests": 100,
      "successRate": 0.98
    }
  }
}
```

---

## 📊 Dashboard di Monitoring

### **Metriche Chiave**

#### **1. Performance**

- **Response Time**: Tempo medio di risposta per sorgente
- **Throughput**: Richieste per minuto/secondo
- **Error Rate**: Percentuale di errori per sorgente
- **Cache Hit Rate**: Percentuale di cache hits

#### **2. Affidabilità**

- **Uptime**: Tempo di attività per sorgente
- **Fallback Rate**: Percentuale di attivazioni fallback
- **Success Rate**: Percentuale di successo totale
- **Circuit Breaker Status**: Stato dei circuit breaker

#### **3. Business**

- **Total Requests**: Numero totale di richieste
- **Unique Users**: Utenti unici per periodo
- **Data Volume**: Volume di dati processati
- **Cost Analysis**: Analisi costi per sorgente

### **Alerting**

#### **1. Critical Alerts**

- **Entrambe le sorgenti down**: Immediato
- **High error rate**: > 10% errori
- **High response time**: > 5 secondi
- **Cache miss rate**: > 50%

#### **2. Warning Alerts**

- **Fallback rate high**: > 20% fallback
- **Circuit breaker open**: Per > 5 minuti
- **Cache size limit**: > 80% utilizzo
- **Memory usage**: > 80% utilizzo

---

## 🔮 Roadmap Futura

### **Prossimi Sviluppi**

- [ ] **Multi-Source Load Balancing**: Distribuzione intelligente del carico
- [ ] **Predictive Fallback**: Predizione di problemi prima che si verifichino
- [ ] **Geographic Fallback**: Fallback basato su localizzazione geografica
- [ ] **Quality-Based Fallback**: Fallback basato sulla qualità dei dati
- [ ] **Real-time Monitoring**: Dashboard in tempo reale

### **Miglioramenti Performance**

- [ ] **Edge Caching**: Cache distribuita globalmente
- [ ] **Compression**: Compressione dati per ridurre bandwidth
- [ ] **Connection Pooling**: Pool di connessioni ottimizzato
- [ ] **Background Sync**: Sincronizzazione dati in background

---

## 📞 Supporto e Troubleshooting

### **Problemi Comuni**

#### **1. Fallback Frequente**

**Sintomi**: Alto tasso di fallback (> 20%)
**Cause**: Problemi con Yahoo Finance
**Soluzioni**:

- Verificare connessione di rete
- Controllare rate limits
- Aggiornare configurazione timeout

#### **2. Lentezza Generale**

**Sintomi**: Response time > 5 secondi
**Cause**: Problemi di performance
**Soluzioni**:

- Ottimizzare cache
- Ridurre timeout
- Implementare connection pooling

#### **3. Errori Persistenti**

**Sintomi**: Errori continui da entrambe le sorgenti
**Cause**: Problemi di configurazione
**Soluzioni**:

- Verificare API keys
- Controllare endpoint URLs
- Validare parametri di configurazione

### **Comandi di Debug**

```bash
# Health check
curl https://student-analyst.onrender.com/health

# Test sorgente specifica
curl -X POST https://student-analyst.onrender.com/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"tickers":["AAPL"],"startDate":"2024-01-01","endDate":"2024-12-31","frequency":"daily"}'

# Log analysis
tail -f logs/application.log | grep "fallback"
```

---

## 📝 Changelog

### **v1.0.0 (2025-06-27)**

- ✅ **Sistema di Fallback**: Implementazione completa
- ✅ **DataSourceManager**: Coordinazione multi-sorgente
- ✅ **Health Check**: Monitoring in tempo reale
- ✅ **Error Handling**: Gestione robusta degli errori
- ✅ **Caching**: Sistema cache intelligente
- ✅ **Logging**: Tracciamento dettagliato
- ✅ **Testing**: Test unitari e di integrazione
- ✅ **Documentazione**: Guida completa

---

**Student Analyst** - Sistema di fallback affidabile e robusto 🔄📊
