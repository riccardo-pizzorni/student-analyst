import React, { useState } from 'react';
import {
  Plus,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Search,
  Calendar,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function UnifiedInputSection() {
  const [tickerInput, setTickerInput] = useState('');
  const [tickers, setTickers] = useState<
    Array<{
      symbol: string;
      name: string;
      status: 'valid' | 'invalid' | 'loading';
      price?: number;
      change?: number;
    }>
  >([
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      status: 'valid',
      price: 182.52,
      change: 2.3,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      status: 'valid',
      price: 378.85,
      change: -0.8,
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      status: 'valid',
      price: 2847.35,
      change: 1.2,
    },
  ]);

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [frequency, setFrequency] = useState('daily');

  const addTicker = () => {
    if (!tickerInput.trim()) return;

    const symbols = tickerInput
      .toUpperCase()
      .split(/[,\s]+/)
      .filter(s => s);

    symbols.forEach(symbol => {
      if (!tickers.find(t => t.symbol === symbol)) {
        setTickers(prev => [
          ...prev,
          {
            symbol,
            name: 'Loading...',
            status: 'loading',
          },
        ]);

        setTimeout(() => {
          setTickers(prev =>
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
      }
    });

    setTickerInput('');
  };

  const removeTicker = (symbol: string) => {
    setTickers(prev => prev.filter(t => t.symbol !== symbol));
  };

  const handleFileUpload = () => {
    console.log('File upload triggered');
  };

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
          {tickers.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {tickers.map(ticker => (
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
                      !startDate && 'text-slate-500'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy') : '30/05/2024'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-slate-800 border-slate-700"
                  align="start"
                >
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
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
                      !endDate && 'text-slate-500'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy') : 'Seleziona data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-slate-800 border-slate-700"
                  align="start"
                >
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
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
            {[
              { value: 'daily', label: 'Giornaliera' },
              { value: 'weekly', label: 'Settimanale' },
              { value: 'monthly', label: 'Mensile' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setFrequency(option.value)}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
                  frequency === option.value
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                    : 'border-slate-700/50 bg-transparent text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <label className="text-slate-300 text-sm font-medium block">
            File CSV opzionale
          </label>
          <button
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
            disabled={tickers.filter(t => t.status === 'valid').length < 1}
            className="px-10 py-3 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-medium text-sm"
          >
            Avvia Analisi
          </button>
        </div>
      </div>
    </div>
  );
}
