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
  const [selectedTicker, setSelectedTicker] = useState(
    analysisState.tickers[0]
  );

  const interval = useMemo(() => {
    return freqToInterval[analysisState.frequency] || 'D';
  }, [analysisState.frequency]);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="flex items-center gap-2">
        <Select
          value={selectedTicker}
          onValueChange={value => setSelectedTicker(value)}
        >
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

      <div className="relative flex-1 min-h-[calc(100vh-8rem)] w-full">
        <NewTradingViewWidget symbol={selectedTicker} interval={interval} />
      </div>
    </div>
  );
};
