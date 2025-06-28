import {
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function TickerInputSection() {
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

        // Simulate API call
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-blue-300 flex items-center gap-3 mb-2">
          <TrendingUp size={28} className="text-blue-400" />
          Selezione Titoli
        </h3>
        <p className="text-slate-400">
          Aggiungi i ticker dei titoli da analizzare
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/20 rounded-xl p-6 border border-slate-700/50">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
            />
            <input
              id="ticker-search-input"
              name="ticker-search"
              type="text"
              value={tickerInput}
              onChange={e => setTickerInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addTicker()}
              placeholder="Inserisci ticker (es: AAPL, MSFT, GOOGL)"
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-200 placeholder-slate-400 transition-all duration-200"
              aria-describedby="ticker-help-text"
            />
          </div>
          <button
            id="add-ticker-button"
            name="add-ticker"
            onClick={addTicker}
            disabled={!tickerInput.trim()}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg shadow-blue-500/25 flex items-center gap-2"
          >
            <Plus size={18} />
            Aggiungi
          </button>
        </div>

        <div id="ticker-help-text" className="text-sm text-slate-400">
          Puoi inserire più ticker separati da virgola o spazio
        </div>
      </div>

      {/* Tickers List */}
      {tickers.length > 0 && (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h4 className="font-semibold text-slate-300 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-400" />
              Portafoglio ({
                tickers.filter(t => t.status === 'valid').length
              }{' '}
              titoli validi)
            </h4>
          </div>

          <div className="divide-y divide-slate-700/30">
            {tickers.map(ticker => (
              <div
                key={ticker.symbol}
                className="p-4 hover:bg-slate-700/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        ticker.status === 'valid'
                          ? 'bg-green-500/20 text-green-300'
                          : ticker.status === 'invalid'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {ticker.status === 'loading' ? (
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        ticker.symbol.slice(0, 2)
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {ticker.symbol}
                        </span>
                        {ticker.status === 'valid' && (
                          <CheckCircle size={14} className="text-green-400" />
                        )}
                        {ticker.status === 'invalid' && (
                          <AlertTriangle size={14} className="text-red-400" />
                        )}
                      </div>
                      <span className="text-sm text-slate-400">
                        {ticker.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {ticker.price && (
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-400">
                          ${ticker.price?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-sm text-slate-400">
                          {ticker.change !== undefined
                            ? `${ticker.change >= 0 ? '+' : ''}${ticker.change.toFixed(2)}%`
                            : '0.00%'}
                        </div>
                      </div>
                    )}

                    <button
                      id={`remove-${ticker.symbol}-button`}
                      name={`remove-${ticker.symbol}`}
                      onClick={() => removeTicker(ticker.symbol)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      aria-label={`Rimuovi ${ticker.symbol} dal portafoglio`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tickers.filter(t => t.status === 'valid').length >= 3 && (
            <div className="p-4 bg-green-500/5 border-t border-green-500/20">
              <div className="flex items-center gap-2 text-green-300 text-sm">
                <CheckCircle size={16} />
                Portafoglio pronto per l'analisi (
                {tickers.filter(t => t.status === 'valid').length} titoli)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Add Popular Stocks */}
      <div className="bg-gradient-to-br from-purple-900/20 to-slate-800/50 rounded-xl p-6 border border-purple-500/20">
        <h4 className="font-semibold text-purple-300 mb-4">Titoli Popolari</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            'AAPL',
            'MSFT',
            'GOOGL',
            'AMZN',
            'TSLA',
            'META',
            'NVDA',
            'NFLX',
          ].map(symbol => (
            <button
              key={symbol}
              id={`popular-${symbol}-button`}
              name={`popular-${symbol}`}
              onClick={() => {
                if (!tickers.find(t => t.symbol === symbol)) {
                  setTickerInput(prev =>
                    prev ? `${prev}, ${symbol}` : symbol
                  );
                }
              }}
              disabled={tickers.some(t => t.symbol === symbol)}
              className="px-4 py-2 bg-purple-500/10 text-purple-300 rounded-lg hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium border border-purple-500/20"
              aria-label={`Aggiungi ${symbol} ai ticker`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
