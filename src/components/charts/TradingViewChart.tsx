import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAnalysis } from '@/context/AnalysisContext';
import { useMemo, useState } from 'react';
import NewTradingViewWidget from './NewTradingViewWidget';

// Mappa frequenza -> intervallo TradingView
const freqToInterval: Record<string, string> = {
  daily: 'D',
  weekly: 'W',
  monthly: 'M',
};

const iconStyle =
  'w-8 h-8 flex items-center justify-center border border-muted rounded-md bg-muted text-sm text-muted-foreground shadow transition hover:bg-accent hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer select-none';

export const TradingViewChart = () => {
  const { analysisState } = useAnalysis();
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [showTopToolbar, setShowTopToolbar] = useState(false);
  const [showSideToolbar, setShowSideToolbar] = useState(false);

  // Usa la frequenza dell'analisi
  const tvInterval = useMemo(
    () => freqToInterval[analysisState.frequency] || 'D',
    [analysisState.frequency]
  );

  // Stabilizza symbol basato sul ticker selezionato
  const symbol = useMemo(() => {
    const ticker = selectedTicker || analysisState.tickers[0];
    return ticker ? `NASDAQ:${ticker}` : 'NASDAQ:AAPL';
  }, [selectedTicker, analysisState.tickers]);

  // Stabilizza studies (vuoto per ora)
  const studies = useMemo(() => [], []);

  // Chiave stabile
  const widgetKey = useMemo(
    () => `${symbol}-${tvInterval}-${showTopToolbar}-${showSideToolbar}`,
    [symbol, tvInterval, showTopToolbar, showSideToolbar]
  );

  // Debug log
  if (process.env.NODE_ENV !== 'production') {
    console.log('[TradingViewChart] render', { symbol, tvInterval, widgetKey });
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Controlli superiori */}
      <div className="flex items-center gap-2 mb-4">
        <Select value={selectedTicker} onValueChange={setSelectedTicker}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleziona ticker" />
          </SelectTrigger>
          <SelectContent>
            {analysisState.tickers.map(ticker => (
              <SelectItem key={ticker} value={ticker}>
                {ticker}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          className={iconStyle}
          onClick={() => setShowTopToolbar(v => !v)}
          title={
            showTopToolbar
              ? 'Nascondi toolbar superiore'
              : 'Mostra toolbar superiore'
          }
        >
          {showTopToolbar ? '−' : '+'}T
        </button>

        <button
          className={iconStyle}
          onClick={() => setShowSideToolbar(v => !v)}
          title={
            showSideToolbar
              ? 'Nascondi toolbar laterale'
              : 'Mostra toolbar laterale'
          }
        >
          {showSideToolbar ? '−' : '+'}S
        </button>
      </div>

      {/* Container del grafico con altezza flessibile */}
      <div className="flex-1 min-h-[calc(100vh-12rem)] relative">
        <NewTradingViewWidget
          key={widgetKey}
          symbol={symbol}
          interval={tvInterval}
          theme="dark"
          width="100%"
          height="100%"
          autosize
          allow_symbol_change={false}
          hide_top_toolbar={!showTopToolbar}
          hide_side_toolbar={!showSideToolbar}
          save_image
          studies={studies}
          onChartReady={() => console.log('Chart pronto')}
          onLoadError={error => console.error('Errore:', error)}
        />
      </div>
    </div>
  );
};
