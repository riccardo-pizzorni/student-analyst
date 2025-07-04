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

export const TradingViewChart = () => {
  const { analysisState } = useAnalysis();
  // Garantisco che selectedTicker non sia mai undefined usando un valore di fallback
  const [selectedTicker, setSelectedTicker] = useState<string>(
    analysisState.tickers[0] || 'NASDAQ:AAPL'
  );

  const interval = useMemo(() => {
    return freqToInterval[analysisState.frequency] || 'D';
  }, [analysisState.frequency]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header con selettore */}
      <div className="flex items-center gap-2 mb-4">
        <Select defaultValue={selectedTicker} onValueChange={setSelectedTicker}>
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
      </div>

      {/* Container del grafico con altezza fissa */}
      <div className="w-full h-[600px] bg-background">
        <NewTradingViewWidget
          symbol={selectedTicker}
          interval={interval}
          autosize={false}
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
};
