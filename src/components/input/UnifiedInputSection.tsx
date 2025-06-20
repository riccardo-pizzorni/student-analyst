import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
            <label className="text-slate-300 text-sm font-medium block mb-2">
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
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
                      ticker.status === 'valid'
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
              type="text"
              value={tickerInput}
              onChange={e => setTickerInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addTicker()}
              placeholder="AAPL, MSFT, TSLA"
              className="flex-1 px-3 py-2.5 bg-transparent border border-slate-700/50 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-200 placeholder-slate-500 transition-all duration-200 text-sm"
            />
            <button
              onClick={addTicker}
              disabled={!tickerInput.trim()}
              className="px-5 py-2.5 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
            >
              Aggiungi
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-3">
          <label className="text-slate-300 text-sm font-medium block">
            Periodo di analisi
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs">Da data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-transparent border-slate-700/50 hover:border-slate-600 h-10 text-slate-300 text-sm',
                      !analysisState.startDate && 'text-slate-500'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {analysisState.startDate
                      ? format(analysisState.startDate, 'dd/MM/yyyy')
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
              <label className="text-slate-400 text-xs">A data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-transparent border-slate-700/50 hover:border-slate-600 h-10 text-slate-300 text-sm',
                      !analysisState.endDate && 'text-slate-500'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {analysisState.endDate
                      ? format(analysisState.endDate, 'dd/MM/yyyy')
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
          <label className="text-slate-300 text-sm font-medium block">
            Frequenza dati
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => setFrequency('daily')}
              variant={
                analysisState.frequency === 'daily' ? 'default' : 'outline'
              }
              className={`flex-1 transition-all text-sm ${
                analysisState.frequency === 'daily'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent border-slate-700/50 hover:bg-slate-700/50'
              }`}
            >
              Giornaliera
            </Button>
            <Button
              onClick={() => setFrequency('weekly')}
              variant={
                analysisState.frequency === 'weekly' ? 'default' : 'outline'
              }
              className={`flex-1 transition-all text-sm ${
                analysisState.frequency === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent border-slate-700/50 hover:bg-slate-700/50'
              }`}
            >
              Settimanale
            </Button>
            <Button
              onClick={() => setFrequency('monthly')}
              variant={
                analysisState.frequency === 'monthly' ? 'default' : 'outline'
              }
              className={`flex-1 transition-all text-sm ${
                analysisState.frequency === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent border-slate-700/50 hover:bg-slate-700/50'
              }`}
            >
              Mensile
            </Button>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <label className="text-slate-300 text-sm font-medium">
            File CSV opzionale
          </label>
          <div className="relative border-2 border-dashed border-slate-700/70 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500/50 transition-colors">
            <Upload className="text-slate-500 w-10 h-10 mb-3" />
            <p className="text-slate-400 text-sm font-medium">
              Drag and drop file here
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Limit 200MB per file • CSV, XLS, XLSX
            </p>
            <input
              type="file"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="File upload"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <Button
            onClick={startAnalysis}
            disabled={isAnalysisDisabled || analysisState.isLoading}
            className="w-full h-12 bg-green-500 hover:bg-green-600 text-white rounded-lg text-lg font-bold transition-all mt-auto disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {analysisState.isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analisi in corso...</span>
              </div>
            ) : (
              'Avvia Analisi'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
