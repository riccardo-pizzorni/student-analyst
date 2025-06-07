import React, { useEffect, useState } from 'react';
import { RequestQueueManager } from '../services/RequestQueueManager';
import { AlphaVantageService } from '../services/AlphaVantageService';
import { CircuitBreaker } from '../utils/CircuitBreaker';
import QueueProgressTracker from './QueueProgressTracker';
import BatchRequestProcessor from './BatchRequestProcessor';

const QueueManagerDemo: React.FC = () => {
  const [queueManager, setQueueManager] = useState<RequestQueueManager | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeQueueManager();
  }, []);

  const initializeQueueManager = async () => {
    try {
      setIsInitializing(true);
      setInitError(null);

      // Initialize circuit breaker
      const circuitBreaker = new CircuitBreaker('QueueManager', {
        failureThreshold: 5,
        recoveryTimeout: 30000,
        monitoringPeriod: 60000
      });

      // Initialize Alpha Vantage service
      const alphaVantageService = new AlphaVantageService();

      // Initialize queue manager
      const manager = new RequestQueueManager(alphaVantageService, circuitBreaker);

      setQueueManager(manager);
      
    } catch (error) {
      console.error('Failed to initialize queue manager:', (error));
      setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRetryInit = () => {
    initializeQueueManager();
  };

  if (isInitializing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-6xl mb-4">🔄</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing Queue Manager</h2>
          <p className="text-gray-600">Setting up intelligent request management system...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-pulse flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initialization Failed</h2>
          <p className="text-gray-600 mb-4">Failed to initialize the queue management system.</p>
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-700">{initError}</p>
          </div>
          <button
            onClick={handleRetryInit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry Initialization
          </button>
        </div>
      </div>
    );
  }

  if (!queueManager) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Queue Manager Not Available</h2>
          <p className="text-gray-600">The queue management system is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📊 STUDENT ANALYST - Queue Management System
        </h1>
        <p className="text-gray-600">
          Professional-grade request management with intelligent rate limiting, batch processing, 
          and real-time progress tracking for financial data analysis.
        </p>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="font-medium text-blue-900">⚡ Rate Limiting</div>
            <div className="text-blue-700">5 requests/minute, 25/day</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="font-medium text-green-900">🎯 Batch Processing</div>
            <div className="text-green-700">Up to 25 symbols per batch</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <div className="font-medium text-purple-900">📈 Progress Tracking</div>
            <div className="text-purple-700">Real-time updates & ETA</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Batch Processor */}
        <div className="space-y-6">
          <BatchRequestProcessor queueManager={queueManager} />
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => queueManager.addRequest('AAPL', 'DAILY', 'HIGH')}
                className="px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
              >
                🍎 Add AAPL (Daily)
              </button>
              <button
                onClick={() => queueManager.addRequest('TSLA', 'INTRADAY_5MIN', 'CRITICAL')}
                className="px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
              >
                🚗 Add TSLA (5min)
              </button>
              <button
                onClick={() => {
                  const techStocks = ['MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'];
                  queueManager.addBatchRequest(techStocks, 'DAILY', 'MEDIUM', 'Big Tech Portfolio');
                }}
                className="px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100"
              >
                💼 Big Tech Batch
              </button>
              <button
                onClick={() => queueManager.clearQueue()}
                className="px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
              >
                🗑️ Clear Queue
              </button>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">System Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Rate Limiting:</span>
                <span className="font-medium">Sliding Window Algorithm</span>
              </div>
              <div className="flex justify-between">
                <span>Queue Persistence:</span>
                <span className="font-medium">Local Storage</span>
              </div>
              <div className="flex justify-between">
                <span>Error Recovery:</span>
                <span className="font-medium">Exponential Backoff</span>
              </div>
              <div className="flex justify-between">
                <span>Circuit Breaker:</span>
                <span className="font-medium">Integrated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Progress Tracker */}
        <div className="space-y-6">
          <QueueProgressTracker queueManager={queueManager} />
          
          {/* Usage Tips */}
          <div className="bg-gray-50 rounded-lg border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Usage Tips</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Use batch processing for analyzing multiple stocks efficiently</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Higher priority requests are processed first</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>The system automatically respects API rate limits</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Queue state persists across browser sessions</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Failed requests are automatically retried with backoff</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">⚡ Performance Features</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-blue-50 p-2 rounded">
                <div className="font-medium text-blue-900">Smart Queueing</div>
                <div className="text-blue-700">Priority-based processing</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="font-medium text-green-900">Auto Retry</div>
                <div className="text-green-700">Exponential backoff</div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <div className="font-medium text-purple-900">Deduplication</div>
                <div className="text-purple-700">Prevents duplicate requests</div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <div className="font-medium text-orange-900">Persistence</div>
                <div className="text-orange-700">Survives browser reload</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Information */}
      <div className="bg-gray-50 rounded-lg border p-4">
        <div className="text-center text-sm text-gray-600">
          <p className="mb-2">
            🚀 <strong>Queue Management System</strong> - Professional-grade request handling for financial data analysis
          </p>
          <p>
            Built with React + TypeScript • Rate limiting • Circuit breaker • Progress tracking • Batch processing
          </p>
        </div>
      </div>
    </div>
  );
};

export default QueueManagerDemo; 

