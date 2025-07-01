import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAnalysis } from '@/context/AnalysisContext';
import React, { useState } from 'react';
import TradingViewWidget from 'react-tradingview-widget';

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

const TradingViewChart: React.FC = () => {
  // Prendi tickers e frequenza dal context
  const { analysisState } = useAnalysis();
  const tickers: string[] = analysisState.tickers || [];
  const freq: string = analysisState.frequency || 'daily';
  const interval = freqToInterval[freq] || 'D';

  // Stato: simbolo selezionato dal dropdown (solo per cambio guidato)
  const [dropdownSymbol, setDropdownSymbol] = useState<string>(
    tickers[0] ? `NASDAQ:${tickers[0]}` : 'NASDAQ:AAPL'
  );
  // Stato: forza il reset del widget solo quando cambi dal dropdown
  const [widgetKey, setWidgetKey] = useState<number>(0);

  // Stato separato per le due toolbar
  const [showTopToolbar, setShowTopToolbar] = useState(false);
  const [showSideToolbar, setShowSideToolbar] = useState(false);

  // Handler cambio ticker dal dropdown
  const handleDropdownChange = (val: string) => {
    setDropdownSymbol(val);
    setWidgetKey(prev => prev + 1); // forza remount per aggiornare il simbolo
  };

  return (
    <div className="relative">
      {/* Dropdown solo, senza label, allineato al ticker TradingView */}
      <div className="mb-2 flex items-center gap-4">
        {tickers.length > 1 && (
          <Select value={dropdownSymbol} onValueChange={handleDropdownChange}>
            <SelectTrigger
              className="w-24 mt-2 px-3 py-1 text-base"
              id="tv-ticker-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tickers.map((tk: string) => (
                <SelectItem key={tk} value={`NASDAQ:${tk}`}>
                  {tk}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {/* Switch toolbar superiore: centrato orizzontalmente rispetto al grafico */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[32px] -translate-y-1/2 z-10"
        title={
          showTopToolbar
            ? 'Nascondi toolbar superiore'
            : 'Mostra toolbar superiore'
        }
      >
        <button
          aria-label={
            showTopToolbar
              ? 'Nascondi toolbar superiore'
              : 'Mostra toolbar superiore'
          }
          className={iconStyle}
          onClick={() => setShowTopToolbar(v => !v)}
          tabIndex={0}
        >
          <span className={iconInnerStyle}>{showTopToolbar ? '−' : '+'}</span>
        </button>
      </div>
      {/* Switch toolbar laterale: centrato verticalmente rispetto al grafico */}
      <div
        className="absolute left-[-39px] top-1/2 -translate-y-1/2 z-10"
        title={
          showSideToolbar
            ? 'Nascondi toolbar laterale'
            : 'Mostra toolbar laterale'
        }
      >
        <button
          aria-label={
            showSideToolbar
              ? 'Nascondi toolbar laterale'
              : 'Mostra toolbar laterale'
          }
          className={iconStyle}
          onClick={() => setShowSideToolbar(v => !v)}
          tabIndex={0}
        >
          <span className={iconInnerStyle}>{showSideToolbar ? '−' : '+'}</span>
        </button>
      </div>
      {/* Widget TradingView */}
      <div style={{ width: '100%', height: 500 }}>
        <TradingViewWidget
          key={widgetKey}
          symbol={dropdownSymbol}
          theme={'Dark' as any}
          autosize={true}
          height={500}
          interval={interval}
          style={'3' as any} // linea
          locale="it"
          allow_symbol_change={true}
          enable_publishing={false}
          save_image={true}
          hide_top_toolbar={!showTopToolbar}
          hide_side_toolbar={!showSideToolbar}
          toolbar_bg="#131722"
          container_id="tradingview_widget"
        />
      </div>
    </div>
  );
};

export default TradingViewChart;
