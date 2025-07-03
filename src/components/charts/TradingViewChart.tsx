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
  'w-6 h-6 flex items-center justify-center border border-muted rounded-[1rem] bg-muted text-xl text-muted-foreground shadow transition hover:bg-accent hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 p-0';
const iconInnerStyle =
  'w-full h-full flex items-center justify-center pl-1 pr-1 pt-1 pb-[0.32rem] font-mono leading-none text-2xl';

export const TradingViewChart = () => {
  const { analysisState } = useAnalysis();
  const [interval, setInterval] = useState('daily');

  // Stabilizza symbol e interval
  const symbol = useMemo(
    () =>
      analysisState.tickers[0]
        ? `NASDAQ:${analysisState.tickers[0]}`
        : 'NASDAQ:AAPL',
    [analysisState.tickers]
  );
  const tvInterval = useMemo(() => freqToInterval[interval], [interval]);
  // Stabilizza studies (vuoto per ora)
  const studies = useMemo(() => [], []);
  // Chiave stabile
  const widgetKey = useMemo(
    () => `${symbol}-${tvInterval}`,
    [symbol, tvInterval]
  );

  // Debug log
  if (process.env.NODE_ENV !== 'production') {
    console.log('[TradingViewChart] render', { symbol, tvInterval, widgetKey });
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <Select value={interval} onValueChange={setInterval}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleziona frequenza" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Giornaliero</SelectItem>
            <SelectItem value="weekly">Settimanale</SelectItem>
            <SelectItem value="monthly">Mensile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <NewTradingViewWidget
          key={widgetKey}
          symbol={symbol}
          interval={tvInterval}
          theme="dark"
          autosize
          allow_symbol_change={false}
          hide_side_toolbar
          save_image
          studies={studies}
          onChartReady={() => console.log('Chart pronto')}
          onLoadError={error => console.error('Errore:', error)}
        />
      </div>
    </div>
  );
};
