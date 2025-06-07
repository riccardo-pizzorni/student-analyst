import React, { useState } from 'react';
import { RequestQueueManager, BatchRequest } from '../services/RequestQueueManager';

interface BatchRequestProcessorProps {
  queueManager: RequestQueueManager;
  className?: string;
}

const BatchRequestProcessor: React.FC<BatchRequestProcessorProps> = ({
  queueManager,
  className = ''
}) => {
  const [symbols, setSymbols] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INTRADAY_1MIN' | 'INTRADAY_5MIN' | 'INTRADAY_15MIN'>('DAILY');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [batchName, setBatchName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastBatch, setLastBatch] = useState<BatchRequest | null>(null);

  // Common stock symbols for quick selection
  const popularSymbols = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM',
    'JNJ', 'V', 'PG', 'HD', 'UNH', 'MA', 'BAC', 'DIS',
    'ADBE', 'CRM', 'NFLX', 'PYPL', 'INTC', 'CMCSA', 'PFE', 'VZ'
  ];

  const parseSymbols = (input: string): string[] => {
    return input
      .split(/[,\s\n]+/)
      .map(symbol => symbol.trim().toUpperCase())
      .filter(symbol => symbol.length > 0 && /^[A-Z]{1,5}$/.test(symbol));
  };

  const handleQuickAdd = (symbolsToAdd: string[]) => {
    const currentSymbols = parseSymbols(symbols);
    const newSymbols = symbolsToAdd.filter(symbol => !currentSymbols.includes(symbol));
    const combinedSymbols = [...currentSymbols, ...newSymbols];
    setSymbols(combinedSymbols.join(', '));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const symbolList = parseSymbols(symbols);
    if (symbolList.length === 0) {
      alert('Please enter at least one valid stock symbol (e.g., AAPL, MSFT)');
      return;
    }

    if (symbolList.length > 25) {
      alert('Maximum 25 symbols allowed per batch due to API daily limits');
      return;
    }

    setIsProcessing(true);

    try {
      const batch = queueManager.addBatchRequest(
        symbolList,
        timeframe,
        priority,
        batchName || undefined
      );

      setLastBatch(batch);
      
      // Clear form after successful submission
      setSymbols('');
      setBatchName('');
      
      alert(`Batch request submitted successfully!\n${symbolList.length} symbols queued for processing.\nEstimated time: ${Math.ceil(batch.estimatedDuration / 60000)} minutes`);
      
    } catch (error) {
      console.error('Error submitting batch request:', (error));
      alert('Failed to submit batch request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const symbolList = parseSymbols(symbols);
  const estimatedTime = symbolList.length > 0 ? Math.ceil((symbolList.length * 12000) / 60000) : 0; // ~12 seconds per request on average

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Batch Request Processor</h3>
        <p className="text-sm text-gray-600 mt-1">
          Add multiple stock symbols for analysis. Maximum 25 symbols per batch.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Batch Name */}
        <div>
          <label htmlFor="batchName" className="block text-sm font-medium text-gray-700 mb-1">
            Batch Name (optional)
          </label>
          <input
            type="text"
            id="batchName"
            value={batchName}
            onChange={(_e) => setBatchName(e.target.value)}
            placeholder="e.g., Tech Portfolio Analysis"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Stock Symbols */}
        <div>
          <label htmlFor="symbols" className="block text-sm font-medium text-gray-700 mb-1">
            Stock Symbols *
          </label>
          <textarea
            id="symbols"
            value={symbols}
            onChange={(_e) => setSymbols(e.target.value)}
            placeholder="Enter stock symbols separated by commas or new lines&#10;e.g., AAPL, MSFT, GOOGL"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {symbolList.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 mb-1">
                Parsed symbols ({symbolList.length}/25):
              </p>
              <div className="flex flex-wrap gap-1">
                {symbolList.map((symbol) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Popular Symbols */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Add Popular Stocks
          </label>
          <div className="grid grid-cols-6 md:grid-cols-8 gap-1">
            {popularSymbols.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => handleQuickAdd([symbol])}
                disabled={parseSymbols(symbols).includes(symbol)}
                className={`px-2 py-1 text-xs border rounded ${
                  parseSymbols(symbols).includes(symbol)
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleQuickAdd(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'])}
            className="mt-2 px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
          >
            Add Top 5 Tech Stocks
          </button>
        </div>

        {/* Timeframe Selection */}
        <div>
          <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-1">
            Data Timeframe *
          </label>
          <select
            id="timeframe"
            value={timeframe}
            onChange={(_e) => setTimeframe(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INTRADAY_1MIN' | 'INTRADAY_5MIN' | 'INTRADAY_15MIN')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="DAILY">Daily (End of day data)</option>
            <option value="WEEKLY">Weekly (End of week data)</option>
            <option value="MONTHLY">Monthly (End of month data)</option>
            <option value="INTRADAY_1MIN">Intraday 1-minute (Real-time)</option>
            <option value="INTRADAY_5MIN">Intraday 5-minute (Real-time)</option>
            <option value="INTRADAY_15MIN">Intraday 15-minute (Real-time)</option>
          </select>
        </div>

        {/* Priority Selection */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Processing Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(_e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="LOW">Low (Process after other requests)</option>
            <option value="MEDIUM">Medium (Standard processing)</option>
            <option value="HIGH">High (Priority processing)</option>
            <option value="CRITICAL">Critical (Process immediately)</option>
          </select>
        </div>

        {/* Estimated Time */}
        {symbolList.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Processing Estimate</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div>📊 {symbolList.length} symbols to process</div>
              <div>⏱️ Estimated time: ~{estimatedTime} minutes</div>
              <div>🔄 Rate limit: 5 requests per minute</div>
              <div>📈 All requests will be processed automatically</div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-gray-500">
            {symbolList.length > 25 && (
              <span className="text-red-600">⚠️ Too many symbols (max 25)</span>
            )}
          </div>
          <button
            type="submit"
            disabled={isProcessing || symbolList.length === 0 || symbolList.length > 25}
            className={`px-4 py-2 rounded-md font-medium ${
              isProcessing || symbolList.length === 0 || symbolList.length > 25
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center space-x-2">
                <span>🔄</span>
                <span>Adding to Queue...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>🚀</span>
                <span>Start Batch Processing</span>
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Last Batch Info */}
      {lastBatch && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200">
          <div className="text-sm">
            <div className="font-medium text-green-800">✅ Last Batch Submitted</div>
            <div className="text-green-700 text-xs mt-1">
              {lastBatch.name} - {lastBatch.symbols.length} symbols - Est. {Math.ceil(lastBatch.estimatedDuration / 60000)}min
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchRequestProcessor; 

