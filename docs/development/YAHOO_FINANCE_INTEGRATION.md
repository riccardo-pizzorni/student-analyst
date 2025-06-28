# 📊 Integrazione Yahoo Finance - Student Analyst

> **Data**: 2025-06-27  
> **Versione**: 1.0.0  
> **Autore**: Student Analyst Team

---

## 🎯 Panoramica

L'integrazione Yahoo Finance rappresenta un upgrade significativo per Student Analyst, introducendo una sorgente dati primaria robusta, gratuita e senza limiti artificiali per l'analisi storica dei titoli azionari.

### **Obiettivi dell'Integrazione**

- ✅ **Sostituire Alpha Vantage** come sorgente primaria per dati storici
- ✅ **Eliminare limiti artificiali** su profondità storica e batch processing
- ✅ **Mantenere Alpha Vantage** come fallback per continuità del servizio
- ✅ **Migliorare performance** e affidabilità del sistema
- ✅ **Supportare dataset grandi** (fino a 50 ticker simultanei)

---

## 🏗️ Architettura

### **Componenti Principali**

```
┌─────────────────────────────────────────────────────────────┐
│                    DataSourceManager                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ YahooFinance    │  │ AlphaVantage    │  │ Cache        │ │
│  │ Service         │  │ Service         │  │ System       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Historical      │
                    │ Analysis        │
                    │ Service         │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ API Endpoints   │
                    │ (/api/analysis) │
                    └─────────────────┘
```

### **Flusso di Dati**

1. **Richiesta Utente** → `/api/analysis`
2. **DataSourceManager** → Prova Yahoo Finance (primario)
3. **Se fallisce** → Fallback automatico su Alpha Vantage
4. **Processamento** → HistoricalAnalysisService
5. **Risposta** → Dati analizzati all'utente

---

## 📊 Vantaggi di Yahoo Finance

### **vs Alpha Vantage (Free Tier)**

| Caratteristica         | Yahoo Finance   | Alpha Vantage Free      |
| ---------------------- | --------------- | ----------------------- |
| **Limiti API**         | ❌ Nessuno      | ✅ 5 calls/min, 500/day |
| **Profondità Storica** | ✅ 15+ anni     | ❌ Limitata             |
| **Batch Processing**   | ✅ Multi-ticker | ❌ Singolo ticker       |
| **Dati Reali**         | ✅ Completi     | ❌ Limitati             |
| **Costo**              | ✅ Gratuito     | ✅ Gratuito             |
| **Stabilità**          | ✅ Alta         | ⚠️ Media                |

### **Vantaggi Specifici**

#### **1. Nessun Limite Artificiale**

- **Profondità storica**: Fino a 15+ anni di dati
- **Batch processing**: Analisi simultanea di multiple ticker
- **Frequenza dati**: Giornaliera, settimanale, mensile
- **Quote real-time**: Dati aggiornati in tempo reale

#### **2. Performance Superiori**

- **Velocità**: Risposta più rapida delle API
- **Affidabilità**: Servizio stabile e ben mantenuto
- **Scalabilità**: Supporto per grandi dataset
- **Cache**: Sistema di cache intelligente

#### **3. Dati Completi**

- **OHLCV**: Open, High, Low, Close, Volume
- **Adjusted Close**: Prezzi aggiustati per dividendi/split
- **Metadati**: Informazioni complete sui titoli
- **Validazione**: Controlli automatici di qualità

---

## 🔧 Implementazione Tecnica

### **Dipendenze**

```json
{
  "yahoo-finance2": "^2.13.3"
}
```

### **Servizi Implementati**

#### **1. YahooFinanceService**

```typescript
export class YahooFinanceService {
  // Fetch dati storici
  async getStockData(
    symbol: string,
    timeframe: YahooFinanceTimeframe
  ): Promise<YahooFinanceResponse>;

  // Validazione input
  validateSymbol(symbol: string): void;

  // Gestione errori
  handleError(error: unknown): YahooFinanceError;

  // Cache management
  getCachedData(cacheKey: string): YahooFinanceResponse | null;
}
```

#### **2. DataSourceManager**

```typescript
export class DataSourceManager {
  // Gestione multi-sorgente
  async getStockData(
    params: UnifiedRequestParams
  ): Promise<UnifiedDataResponse>;

  // Fallback automatico
  private async fetchFromSource(
    source: DataSource
  ): Promise<UnifiedDataResponse>;

  // Health check
  async healthCheck(): Promise<HealthStatus>;
}
```

#### **3. HistoricalAnalysisService**

```typescript
export class HistoricalAnalysisService {
  // Analisi storica con nuova architettura
  async performHistoricalAnalysis(
    params: HistoricalAnalysisParams
  ): Promise<HistoricalAnalysisResponse>;

  // Fetch dati usando DataSourceManager
  private async fetchHistoricalData(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<UnifiedDataResponse>;
}
```

### **Interfacce TypeScript**

#### **UnifiedDataResponse**

```typescript
interface UnifiedDataResponse {
  data: OHLCVData[];
  metadata: {
    symbol: string;
    lastRefreshed: string;
    source: DataSource;
    dataPoints: number;
  };
  success: boolean;
  source: DataSource;
  fallbackUsed?: boolean;
}
```

#### **YahooFinanceTimeframe**

```typescript
enum YahooFinanceTimeframe {
  '1d' = '1d',
  '5d' = '5d',
  '1mo' = '1mo',
  '3mo' = '3mo',
  '6mo' = '6mo',
  '1y' = '1y',
  '2y' = '2y',
  '5y' = '5y',
  '10y' = '10y',
  'ytd' = 'ytd',
  'max' = 'max',
}
```

---

## 🚀 Utilizzo

### **Endpoint API**

```http
POST /api/analysis
Content-Type: application/json

{
  "tickers": ["AAPL", "MSFT", "GOOGL"],
  "startDate": "2020-01-01",
  "endDate": "2025-01-01",
  "frequency": "daily"
}
```

### **Risposta**

```json
{
  "success": true,
  "data": {
    "historicalData": [...],
    "portfolioData": {...},
    "marketPhases": {...}
  },
  "metadata": {
    "analysisDate": "2025-06-27T10:00:00Z",
    "symbols": ["AAPL", "MSFT", "GOOGL"],
    "period": {
      "start": "2020-01-01",
      "end": "2025-01-01"
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

### **Esempi di Utilizzo**

#### **Analisi Storica Semplice**

```typescript
const response = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tickers: ['AAPL'],
    startDate: '2023-01-01',
    endDate: '2025-01-01',
    frequency: 'daily',
  }),
});
```

#### **Analisi Multi-Ticker**

```typescript
const response = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
    startDate: '2020-01-01',
    endDate: '2025-01-01',
    frequency: 'daily',
  }),
});
```

---

## 🔄 Sistema di Fallback

### **Logica di Fallback**

1. **Tentativo Primario**: Yahoo Finance
2. **Se fallisce**: Delay di 1 secondo
3. **Tentativo Secondario**: Alpha Vantage
4. **Se entrambi falliscono**: Errore con dettagli

### **Condizioni di Fallback**

- **Errore di rete**: Timeout, connessione rifiutata
- **Errore API**: Rate limit, servizio non disponibile
- **Dati mancanti**: Simbolo non trovato, periodo senza dati
- **Errore di parsing**: Risposta malformata

### **Logging e Monitoring**

```typescript
// Log di fallback
console.log(`[INFO] Fallback to ${fallbackSource} for ${symbol}`);

// Statistiche fallback
{
  "fallbackStats": {
    "yahoo_finance": 0,
    "alpha_vantage": 2
  }
}
```

---

## 🧪 Testing

### **Test Unitari**

```typescript
describe('YahooFinanceService', () => {
  it('should fetch historical data successfully', async () => {
    const service = new YahooFinanceService();
    const data = await service.getStockData(
      'AAPL',
      YahooFinanceTimeframe['1y']
    );
    expect(data.success).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });
});
```

### **Test di Integrazione**

```typescript
describe('DataSourceManager', () => {
  it('should use fallback when primary source fails', async () => {
    const manager = new DataSourceManager();
    // Mock Yahoo Finance failure
    const response = await manager.getStockData({
      symbol: 'AAPL',
      timeframe: 'daily',
    });
    expect(response.fallbackUsed).toBe(true);
  });
});
```

### **Test E2E**

```typescript
test('should complete historical analysis with Yahoo Finance', async ({
  page,
}) => {
  await page.goto('/');
  await page.fill('[data-testid="ticker-input"]', 'AAPL,MSFT');
  await page.click('[data-testid="start-analysis"]');
  await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
});
```

---

## 📈 Performance e Ottimizzazioni

### **Cache System**

- **TTL**: 5 minuti per dati storici
- **Chiave**: `yahoo_{symbol}_{timeframe}_{options}`
- **Pulizia**: Automatica quando cache > 1000 elementi
- **Hit Rate**: Monitoraggio continuo

### **Batch Processing**

- **Concorrenza**: Fino a 10 richieste simultanee
- **Rate Limiting**: Gestione automatica dei limiti
- **Error Handling**: Retry con backoff esponenziale
- **Timeout**: 30 secondi per richiesta

### **Monitoring**

```typescript
// Health check
{
  "status": "ok",
  "timestamp": "2025-06-27T10:00:00Z",
  "sources": {
    "yahoo_finance": {
      "status": "ok",
      "responseTime": 250
    },
    "alpha_vantage": {
      "status": "ok",
      "responseTime": 500
    }
  }
}
```

---

## 🚨 Gestione Errori

### **Tipi di Errore**

```typescript
enum YahooFinanceErrorType {
  INVALID_SYMBOL = 'INVALID_SYMBOL',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  NO_DATA_AVAILABLE = 'NO_DATA_AVAILABLE',
  MALFORMED_RESPONSE = 'MALFORMED_RESPONSE',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}
```

### **Strategie di Recovery**

1. **Retry Automatico**: 3 tentativi con backoff
2. **Fallback**: Switch automatico ad Alpha Vantage
3. **Cache**: Utilizzo dati cached se disponibili
4. **Graceful Degradation**: Risposta parziale se possibile

### **Messaggi Utente**

```typescript
const errorMessages = {
  INVALID_SYMBOL: 'Simbolo non trovato. Verifica la spelling.',
  NETWORK_ERROR: 'Errore di connessione. Riprova tra qualche secondo.',
  RATE_LIMIT: 'Troppe richieste. Riprova tra un minuto.',
  NO_DATA_AVAILABLE: 'Nessun dato disponibile per il periodo richiesto.',
};
```

---

## 📚 Documentazione API

### **Endpoint Principale**

#### **POST /api/analysis**

**Request Body:**

```json
{
  "tickers": ["string"],
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "frequency": "daily" | "weekly" | "monthly"
}
```

**Response:**

```json
{
  "success": boolean,
  "data": {
    "historicalData": [...],
    "portfolioData": {...},
    "marketPhases": {...}
  },
  "metadata": {
    "analysisDate": "string",
    "symbols": ["string"],
    "period": {
      "start": "string",
      "end": "string"
    },
    "frequency": "string",
    "dataPoints": number,
    "processingTime": number,
    "dataSources": {
      "primary": "yahoo_finance" | "alpha_vantage",
      "fallbacks": ["string"]
    }
  }
}
```

### **Health Check**

#### **GET /health**

**Response:**

```json
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
    }
  }
}
```

---

## 🔮 Roadmap Futura

### **Prossimi Sviluppi**

- [ ] **Caching Avanzato**: Redis per cache distribuita
- [ ] **Real-time Data**: WebSocket per quote live
- [ ] **Analisi Tecnica**: Indicatori avanzati
- [ ] **Machine Learning**: Predizioni basate su ML
- [ ] **Multi-exchange**: Supporto per borse europee

### **Miglioramenti Performance**

- [ ] **CDN**: Distribuzione globale dei dati
- [ ] **Compressione**: Gzip per ridurre bandwidth
- [ ] **Lazy Loading**: Caricamento progressivo
- [ ] **Background Jobs**: Elaborazione asincrona

---

## 📞 Supporto

### **Risorse Utili**

- **Documentazione**: Questo file
- **Issues**: GitHub Issues per bug report
- **Discussions**: GitHub Discussions per domande
- **Wiki**: Documentazione tecnica dettagliata

### **Contatti**

- **Email**: support@student-analyst.com
- **GitHub**: https://github.com/riccardo-pizzorni/student-analyst
- **Documentazione**: `/docs` directory

---

## 📝 Changelog

### **v1.0.0 (2025-06-27)**

- ✅ **Integrazione Yahoo Finance**: Sorgente primaria per dati storici
- ✅ **DataSourceManager**: Gestione multi-sorgente con fallback
- ✅ **Cache System**: Ottimizzazione performance
- ✅ **Error Handling**: Gestione robusta degli errori
- ✅ **Documentazione**: Guida completa all'integrazione
- ✅ **Testing**: Test unitari e di integrazione
- ✅ **Monitoring**: Health check e logging

---

**Student Analyst** - Piattaforma di analisi finanziaria avanzata 🎓📊
