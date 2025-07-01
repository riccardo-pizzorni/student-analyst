# 📈 Guida Completa: Integrazione TradingView Widget in Student Analyst (Step 2 - Analisi Storica)

---

## 🔍 INFORMAZIONI LEGALI E LIMITAZIONI

- **Gratis:** Sì, uso personale e commerciale
- **Branding:** Il logo/link TradingView deve restare visibile
- **Rate Limiting:** Possibili limiti su richieste eccessive
- **Dipendenza:** Il widget dipende dai server TradingView
- **Personalizzazione:** Non puoi modificare il codice interno
- **Dati:** Appartengono a TradingView e fornitori
- **Termini:**
  - ✅ Uso commerciale permesso
  - ✅ Redistribuzione permessa (widget intatto)
  - ❌ Non puoi rimuovere i credit TradingView
  - ❌ Non puoi modificare/estrarre dati dal widget

---

## 🚀 IMPLEMENTAZIONE REACT (CONSIGLIATA)

### 1. **Installazione**

```bash
npm install react-tradingview-widget
# oppure
yarn add react-tradingview-widget
```

### 2. **Crea il Componente TradingView**

```tsx
// src/components/TradingViewChart.tsx
import React from 'react';
import TradingViewWidget from 'react-tradingview-widget';

interface TradingViewChartProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
  interval?: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = 'NASDAQ:AAPL',
  theme = 'dark',
  width = '100%',
  height = 400,
  interval = 'D',
}) => (
  <div style={{ width, height }}>
    <TradingViewWidget
      symbol={symbol}
      theme={theme}
      width={width}
      height={height}
      autosize={true}
      interval={interval}
      allow_symbol_change={true}
      save_image={false}
      enable_publishing={false}
      hide_top_toolbar={false}
      hide_side_toolbar={false}
      toolbar_bg={theme === 'dark' ? '#131722' : '#ffffff'}
      locale="it"
      style="1" // 1=Candele
      container_id={`tradingview_${symbol.replace(':', '_')}`}
    />
  </div>
);

export default TradingViewChart;
```

### 3. **Utilizzo nel Componente Analisi Storica**

Sostituisci il grafico attuale nella prima tab di "Analisi Storica" con:

```tsx
// Esempio in HistoricalAnalysisTab.tsx
import TradingViewChart from '@/components/TradingViewChart';

<TradingViewChart
  symbol={selectedSymbol || 'NASDAQ:AAPL'}
  interval={selectedInterval || 'D'}
  theme="dark"
  width="100%"
  height={500}
/>;
```

- **Posiziona il grafico in basso** nella tab principale.
- Puoi aggiungere controlli per cambiare simbolo/intervallo.

### 4. **Gestione Loading & Error (Avanzato)**

```tsx
// src/components/AdvancedTradingViewChart.tsx
import React from 'react';
import TradingViewWidget from 'react-tradingview-widget';
import { useTradingView } from '@/hooks/useTradingView';

const AdvancedTradingViewChart = ({
  symbol,
  interval,
  theme,
  width = '100%',
  height = 400,
}) => {
  const { isLoading, error, handleWidgetReady, handleWidgetError } =
    useTradingView({ symbol, interval, theme });

  if (error) return <div>Errore: {error}</div>;
  return (
    <div style={{ width, height, position: 'relative' }}>
      {isLoading && <div className="loading">Caricamento grafico...</div>}
      <TradingViewWidget
        symbol={symbol}
        width={width}
        height={height}
        interval={interval}
        theme={theme}
        autosize={true}
        allow_symbol_change={true}
        save_image={false}
        enable_publishing={false}
        hide_top_toolbar={false}
        hide_side_toolbar={false}
        toolbar_bg={theme === 'dark' ? '#131722' : '#ffffff'}
        locale="it"
        style="1"
        container_id={`tradingview_${symbol.replace(':', '_')}_${Date.now()}`}
        onLoad={handleWidgetReady}
        onError={handleWidgetError}
      />
    </div>
  );
};
export default AdvancedTradingViewChart;
```

---

## 🏦 **Simboli Supportati**

- **Azioni USA:** "NASDAQ:AAPL", "NASDAQ:MSFT", ...
- **Azioni Italia:** "MIL:ENI", "MIL:RACE", ...
- **Crypto:** "BINANCE:BTCUSDT", ...
- **Forex:** "FX:EURUSD", ...
- **Commodities:** "TVC:GOLD", ...

---

## 🎯 **Best Practice & Consigli**

- **Container unico:** Usa sempre container_id unici
- **Responsive:** Imposta width="100%" e height dinamico
- **Error Handling:** Mostra messaggi chiari
- **Loading State:** Visualizza caricamento
- **Cleanup:** Pulisci il widget quando non serve
- **Lazy Loading:** Carica solo quando visibile
- **Debouncing:** Evita troppe richieste
- **Personalizzazione:** Puoi cambiare tema, toolbar, simboli, intervalli

---

## ✅ **Risultato Finale**

- Grafico professionale TradingView in "Analisi Storica"
- Dati in tempo reale, strumenti tecnici avanzati
- Esperienza utente superiore, zero manutenzione dati
- Completamente gratuito e legale

---

## 📌 **Note Finali**

- **Non puoi rimuovere il logo TradingView**
- **Non puoi modificare il widget internamente**
- **Non puoi estrarre i dati**
- **Se TradingView è offline, il grafico non funziona**

---

**Per domande o personalizzazioni avanzate, consulta la [documentazione ufficiale TradingView](https://www.tradingview.com/widget/)**
