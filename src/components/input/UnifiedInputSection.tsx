import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAnalysis } from '@/context/AnalysisContext';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Calendar, CheckCircle, Upload, X } from 'lucide-react';
import { useState } from 'react';

export default function UnifiedInputSection() {
  const { analysisState, setAnalysisState, startAnalysis } = useAnalysis();

  const [tickerInput, setTickerInput] = useState('');
  const [validatedTickers, setValidatedTickers] = useState<
    Array<{
      symbol: string;
      name: string;
      status: 'valid' | 'invalid' | 'loading';
      price?: number;
      change?: number;
    }>
  >(
    analysisState.tickers.map(t => ({
      symbol: t,
      name: `${t} Name`,
      status: 'valid',
      price: 150,
      change: 2.5,
    }))
  );

  const setGlobalTickers = (tickers: string[]) => {
    setAnalysisState(prev => ({ ...prev, tickers }));
  };
  const setStartDate = (date: Date | undefined) => {
    setAnalysisState(prev => ({
      ...prev,
      startDate: date ? date.toISOString().split('T')[0] : '',
    }));
  };
  const setEndDate = (date: Date | undefined) => {
    setAnalysisState(prev => ({
      ...prev,
      endDate: date ? date.toISOString().split('T')[0] : '',
    }));
  };
  const setFrequency = (frequency: 'daily' | 'weekly' | 'monthly') => {
    setAnalysisState(prev => ({ ...prev, frequency }));
  };

  const addTicker = () => {
    if (!tickerInput.trim()) return;

    const symbols = tickerInput
      .toUpperCase()
      .split(/[,\s]+/)
      .filter(s => s);
    const newSymbols = symbols.filter(
      s => !validatedTickers.find(t => t.symbol === s)
    );

    if (newSymbols.length > 0) {
      setGlobalTickers([...analysisState.tickers, ...newSymbols]);

      newSymbols.forEach(symbol => {
        setValidatedTickers(prev => [
          ...prev,
          {
            symbol,
            name: 'Loading...',
            status: 'loading',
          },
        ]);

        setTimeout(() => {
          setValidatedTickers(prev =>
            prev.map(t =>
              t.symbol === symbol
                ? {
                  symbol,
                  name: `${symbol} Company`,
                  status: Math.random() > 0.2 ? 'valid' : 'invalid',
                  price: Math.random() * 500 + 50,
                  change: (Math.random() - 0.5) * 10,
                }
                : t
            )
          );
        }, 1500);
      });
    }

    setTickerInput('');
  };

  const removeTicker = (symbolToRemove: string) => {
    setGlobalTickers(analysisState.tickers.filter(t => t !== symbolToRemove));
    setValidatedTickers(prev => prev.filter(t => t.symbol !== symbolToRemove));
  };

  const handleFileUpload = () => {
    console.log('File upload triggered');
  };

  const isAnalysisDisabled =
    analysisState.tickers.length === 0 ||
    !analysisState.startDate ||
    !analysisState.endDate;

  return (
    <div className="h-full max-w-4xl mx-auto px-6 py-4">
      {/* Content - Compact vertical flow */}
      <div className="h-full flex flex-col gap-6">
        {/* Ticker Selection */}
        <div className="space-y-3">
          <div>
            <label htmlFor="ticker-input" className="text-slate-300 text-sm font-medium block mb-2">
              Ticker
            </label>
            <p className="text-slate-500 text-xs mb-3">
              Inserisci uno o più ticker separati da virgola
            </p>
          </div>

          {/* Current Tickers Display */}
          {validatedTickers.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {validatedTickers.map(ticker => (
                  <div
                    key={ticker.symbol}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${ticker.status === 'valid'
                      ? 'border-blue-500/30 bg-blue-500/5 text-blue-300'
                      : ticker.status === 'invalid'
                        ? 'border-red-500/30 bg-red-500/5 text-red-300'
                        : 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300'
                      }`}
                  >
                    <span className="font-medium">{ticker.symbol}</span>
                    {ticker.status === 'loading' && (
                      <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    {ticker.status === 'valid' && <CheckCircle size={12} />}
                    {ticker.status === 'invalid' && <AlertTriangle size={12} />}
                    <button
                      onClick={() => removeTicker(ticker.symbol)}
                      className="hover:bg-white/10 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${ticker.symbol}`}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticker Input */}
          <div className="flex gap-3">
            <input
              id="ticker-input"
              name="ticker-input"
              type="text"
              value={tickerInput}
              onChange={e => setTickerInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addTicker()}
              placeholder="AAPL, MSFT, TSLA"
              className="flex-1 px-3 py-2.5 bg-transparent border border-slate-700/50 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-200 placeholder-slate-500 transition-all duration-200 text-sm"
              aria-describedby="ticker-help"
            />
            <button
              onClick={addTicker}
              disabled={!tickerInput.trim()}
              className="px-5 py-2.5 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
            >
              Aggiungi
            </button>
          </div>
          <p id="ticker-help" className="text-slate-500 text-xs">
            Premi Enter o clicca Aggiungi per inserire i ticker
          </p>
        </div>

        {/* Date Selection */}
        <div className="space-y-3">
          <label className="text-slate-300 text-sm font-medium block">
            Periodo di analisi
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="start-date-button" className="text-slate-400 text-xs">Da data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date-button"
                    name="start-date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-transparent border-slate-700/50 hover:border-slate-600 h-10 text-slate-300 text-sm',
                      !analysisState.startDate && 'text-slate-500'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {analysisState.startDate
                      ? format(parseISO(analysisState.startDate), 'dd/MM/yyyy')
                      : '30/05/2024'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-slate-800 border-slate-700"
                  align="start"
                >
                  <CalendarComponent
                    mode="single"
                    selected={
                      analysisState.startDate
                        ? parseISO(analysisState.startDate)
                        : undefined
                    }
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="end-date-button" className="text-slate-400 text-xs">A data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date-button"
                    name="end-date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-transparent border-slate-700/50 hover:border-slate-600 h-10 text-slate-300 text-sm',
                      !analysisState.endDate && 'text-slate-500'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {analysisState.endDate
                      ? format(parseISO(analysisState.endDate), 'dd/MM/yyyy')
                      : 'Seleziona data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-slate-800 border-slate-700"
                  align="start"
                >
                  <CalendarComponent
                    mode="single"
                    selected={
                      analysisState.endDate
                        ? parseISO(analysisState.endDate)
                        : undefined
                    }
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Frequency Selection */}
        <div className="space-y-3">
          <label htmlFor="frequency-select" className="text-slate-300 text-sm font-medium block">
            Frequenza di analisi
          </label>
          <Select
            value={analysisState.frequency}
            onValueChange={value => setFrequency(value as 'daily' | 'weekly' | 'monthly')}
          >
            <SelectTrigger id="frequency-select" name="frequency" className="w-full px-3 py-2.5 bg-transparent border border-slate-700/50 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-200 transition-all duration-200 text-sm">
              <SelectValue placeholder="Seleziona frequenza" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
              <SelectItem value="daily">Giornaliera</SelectItem>
              <SelectItem value="weekly">Settimanale</SelectItem>
              <SelectItem value="monthly">Mensile</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <label htmlFor="file-upload-button" className="text-slate-300 text-sm font-medium block">
            File CSV opzionale
          </label>
          <button
            id="file-upload-button"
            name="file-upload"
            onClick={handleFileUpload}
            className="w-full py-4 px-4 border border-dashed border-slate-700/50 rounded-lg text-slate-500 hover:border-blue-500/50 hover:text-blue-400 transition-all duration-200 flex flex-col items-center justify-center gap-2 group bg-transparent"
          >
            <div className="w-6 h-6 rounded-full border border-slate-700 group-hover:border-blue-500/50 flex items-center justify-center transition-colors">
              <Upload
                size={14}
                className="text-slate-500 group-hover:text-blue-400"
              />
            </div>
            <div className="text-center">
              <div className="text-sm">Drag and drop file here</div>
              <div className="text-xs text-slate-600 mt-1">
                Limit 200MB per file • CSV, XLS, XLSX
              </div>
            </div>
          </button>
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-3 text-center">
          <button
            id="start-analysis-button"
            name="start-analysis"
            onClick={startAnalysis}
            disabled={isAnalysisDisabled || analysisState.isLoading}
            className="px-10 py-3 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-medium text-sm"
          >
            {analysisState.isLoading ? 'Analisi in corso...' : 'Avvia Analisi'}
          </button>
        </div>
      </div>
    </div>
  );
}
