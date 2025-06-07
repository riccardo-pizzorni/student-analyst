/**
 * Simple Alpha Vantage Service Test
 * =================================
 * 
 * Basic test component for Alpha Vantage service functionality
 */

import React, { useState } from 'react';
import { alphaVantageService, type AlphaVantageError } from '../services/AlphaVantageService';
import { Button } from '@/components/ui/button';

export function SimpleAlphaVantageTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testService = async () => {
    setIsLoading(true);
    setResult('Testing Alpha Vantage service...');
    
    try {
      console.log('🔍 Testing Alpha Vantage service...');
      
      const data = await alphaVantageService.getStockData({
        symbol: 'AAPL'
      });
      
      const summary = `✅ Success! Retrieved ${data.data.length} data points for ${data.symbol}. Latest price: $${data.data[0].close.toFixed(2)} (${data.data[0].date})`;
      setResult(summary);
      console.log('✅ Alpha Vantage test successful:', data);
      
    } catch (error) {
      const alphaError = error as AlphaVantageError;
      const errorMsg = `❌ Error: ${alphaError.userFriendlyMessage || alphaError.message}`;
      setResult(errorMsg);
      console.error('❌ Alpha Vantage test failed:', (error));
    } finally {
      setIsLoading(false);
    }
  };

  const getUsageStats = () => {
    const stats = alphaVantageService.getUsageStats();
    setResult(`📊 Usage Stats: ${stats.requestsThisMinute}/5 this minute, ${stats.requestsToday}/25 today. Can make request: ${stats.canMakeRequest ? 'Yes' : 'No'}`);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📊 Alpha Vantage Service Test
        </h2>
        <p className="text-gray-600">
          Simple test for Alpha Vantage API integration
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={testService}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? '⏳ Testing...' : '📊 Test AAPL Data'}
          </Button>
          
          <Button
            onClick={getUsageStats}
            variant="outline"
            className="flex-1"
          >
            📈 Check Usage
          </Button>
        </div>

        {result && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <div>✨ Features: Multiple timeframes, Rate limiting, Error handling</div>
          <div>🔧 Error Types: RATE_LIMITED, SYMBOL_NOT_FOUND, NETWORK(error), etc.</div>
          <div>📊 Data: OHLCV with metadata and validation</div>
        </div>
      </div>
    </div>
  );
} 

