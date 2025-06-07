/**
 * STUDENT ANALYST - Multi-Provider Demo Component
 * Interactive testing and monitoring of multi-provider finance service
 */

import React, { useState, useCallback } from 'react';
import { multiProviderFinanceService } from '../services/MultiProviderFinanceService';
import type { StockData, ApiCallOptions } from '../services/MultiProviderFinanceService';

interface TestResult {
  symbol: string;
  provider: string;
  success: boolean;
  responseTime: number;
  error?: string;
  data?: StockData;
}

const MultiProviderDemo: React.FC = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [preferredProvider, setPreferredProvider] = useState<'alpha_vantage' | 'yahoo_finance' | 'auto'>('auto');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [providerHealth, setProviderHealth] = useState(multiProviderFinanceService.getProviderHealthStatus());
  const [serviceStats, setServiceStats] = useState(multiProviderFinanceService.getServiceStats());

  const updateStats = useCallback(() => {
    setProviderHealth(multiProviderFinanceService.getProviderHealthStatus());
    setServiceStats(multiProviderFinanceService.getServiceStats());
  }, []);

  const handleFetchData = async () => {
    if (!symbol.trim()) return;

    setLoading(true);
    setTestResult(null);

    const options: ApiCallOptions = {
      symbol: symbol.trim().toUpperCase(),
      timeframe,
      preferredProvider,
      enableFallback: true
    };

    const startTime = Date.now();

    try {
      const data = await multiProviderFinanceService.getStockData(options);
      const responseTime = Date.now() - startTime;

      setTestResult({
        symbol: data.symbol,
        provider: data.metadata.provider || 'unknown',
        success: true,
        responseTime,
        data
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      setTestResult({
        symbol: symbol.trim().toUpperCase(),
        provider: 'failed',
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
      updateStats();
    }
  };

  const handleTestAllProviders = async () => {
    setLoading(true);
    try {
      const results = await multiProviderFinanceService.testAllProviders();
      console.log('Provider test results:', results);
      updateStats();
    } catch (error) {
      console.error('Provider test failed:', (error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetStats = () => {
    multiProviderFinanceService.resetProviderStats();
    updateStats();
  };

  const getHealthColor = (healthStatus: string): string => {
    switch (healthStatus) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatResponseTime = (ms: number): string => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        🔄 Multi-Provider Finance Service Demo
      </h1>

      {/* Service Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">📊 Service Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{serviceStats.totalRequests}</div>
            <div className="text-sm text-blue-500">Total Requests</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {(serviceStats.successRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-green-500">Success Rate</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatResponseTime(serviceStats.avgResponseTime)}
            </div>
            <div className="text-sm text-purple-500">Avg Response</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">
              {serviceStats.activeProviders}/{serviceStats.healthyProviders}
            </div>
            <div className="text-sm text-orange-500">Active/Healthy</div>
          </div>
        </div>
      </div>

      {/* Provider Health Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">🏥 Provider Health Status</h2>
        <div className="space-y-4">
          {providerHealth.map((provider) => (
            <div key={provider.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-lg">{provider.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(provider.healthStatus)}`}>
                    {provider.healthStatus.toUpperCase()}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  provider.enabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Health Score:</span>
                  <div className="font-medium">{provider.healthScore}/100</div>
                </div>
                <div>
                  <span className="text-gray-500">Success Rate:</span>
                  <div className="font-medium">{(provider.successRate * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-gray-500">Avg Response:</span>
                  <div className="font-medium">{formatResponseTime(provider.avgResponseTime)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Requests:</span>
                  <div className="font-medium">{provider.requests}</div>
                </div>
                <div>
                  <span className="text-gray-500">Last Used:</span>
                  <div className="font-medium">{provider.lastUsed.toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Interface */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">🧪 Test Data Fetching</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
              Stock Symbol
            </label>
            <input
              type="text"
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., AAPL"
            />
          </div>
          <div>
            <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-1">
              Timeframe
            </label>
            <select
              id="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Provider
            </label>
            <select
              id="provider"
              value={preferredProvider}
              onChange={(e) => setPreferredProvider(e.target.value as 'alpha_vantage' | 'yahoo_finance' | 'auto')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="auto">Auto (Smart Selection)</option>
              <option value="alpha_vantage">Alpha Vantage</option>
              <option value="yahoo_finance">Yahoo Finance</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFetchData}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Fetching...' : 'Fetch Data'}
            </button>
          </div>
        </div>

        <div className="flex space-x-2 mb-6">
          <button
            onClick={handleTestAllProviders}
            disabled={loading}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Test All Providers
          </button>
          <button
            onClick={handleResetStats}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            Reset Statistics
          </button>
          <button
            onClick={updateStats}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            Refresh Stats
          </button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">📋 Test Result</h3>
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Symbol:</span>
                  <div className="font-medium">{testResult.symbol}</div>
                </div>
                <div>
                  <span className="text-gray-500">Provider:</span>
                  <div className="font-medium">{testResult.provider}</div>
                </div>
                <div>
                  <span className="text-gray-500">Response Time:</span>
                  <div className="font-medium">{formatResponseTime(testResult.responseTime)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className={`font-medium ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.success ? 'SUCCESS' : 'FAILED'}
                  </div>
                </div>
              </div>

              {testResult.error && (
                <div className="mt-3 p-2 bg-red-100 rounded text-red-700 text-sm">
                  <strong>Error:</strong> {testResult.error}
                </div>
              )}

              {testResult.data && (
                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Data Summary:</strong> {testResult.data.data.length} data points from {testResult.data.metadata.dataSource}
                  </div>
                  <div className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    <div className="flex space-x-4">
                      <span><strong>Latest Close:</strong> ${testResult.data.data[0]?.close.toFixed(2)}</span>
                      <span><strong>Latest Date:</strong> {testResult.data.data[0]?.date}</span>
                      <span><strong>Volume:</strong> {testResult.data.data[0]?.volume.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Integration Info */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">💡 Multi-Provider Integration Features</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-blue-700 mb-2">✅ Alpha Vantage Integration</h3>
            <ul className="space-y-1 text-blue-600">
              <li>• Professional financial data API</li>
              <li>• Advanced error handling with retries</li>
              <li>• Symbol validation and suggestions</li>
              <li>• Rate limiting: 5 requests/minute</li>
              <li>• Supports all timeframes including intraday</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-700 mb-2">✅ Yahoo Finance Integration</h3>
            <ul className="space-y-1 text-blue-600">
              <li>• Free CSV data source</li>
              <li>• Higher rate limits: 60 requests/minute</li>
              <li>• Broader symbol support</li>
              <li>• Real-time CSV parsing</li>
              <li>• Daily, weekly, monthly data</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <h4 className="font-semibold text-blue-800 mb-1">🔄 Intelligent Failover System</h4>
          <p className="text-blue-700 text-sm">
            The system automatically switches between providers based on health scores, rate limits, and availability. 
            If Alpha Vantage is rate-limited, requests automatically route to Yahoo Finance, ensuring uninterrupted data access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MultiProviderDemo; 

