import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApiCall, useJsonApi, useHealthCheck, testApiConnectivity } from '../hooks/useApiCall';

interface TestEndpoint {
  name: string;
  url: string;
  description: string;
  expectedBehavior: string;
}

const TEST_ENDPOINTS: TestEndpoint[] = [
  {
    name: 'JSONPlaceholder (Success)',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    description: 'Should succeed and return JSON data',
    expectedBehavior: 'Success notification, data displayed'
  },
  {
    name: 'HTTPBin Delay (Timeout Test)', 
    url: 'https://httpbin.org/delay/35',
    description: 'Should timeout after 30 seconds',
    expectedBehavior: 'Timeout warning, retry attempts'
  },
  {
    name: 'HTTPBin Status 500 (Error Test)',
    url: 'https://httpbin.org/status/500', 
    description: 'Should fail with 500 error',
    expectedBehavior: 'Error notification, retry attempts'
  },
  {
    name: 'Invalid URL (Network Error)',
    url: 'https://invalid-domain-that-does-not-exist-12345.com/api',
    description: 'Should fail with network error',
    expectedBehavior: 'Error notification, retry attempts'
  },
  {
    name: 'Backend Health Check',
    url: 'http://localhost:3001/health',
    description: 'Test connection to our backend',
    expectedBehavior: 'Success if backend running, error otherwise'
  }
];

export const ApiTester: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(TEST_ENDPOINTS[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [connectivityResults, setConnectivityResults] = useState<Record<string, boolean>>({});
  
  // Different API call hooks for testing
  const standardApi = useApiCall({
    context: 'Standard API Test',
    timeout: 30000,
    maxRetries: 3,
  });

  const jsonApi = useJsonApi({
    context: 'JSON API Test',
    timeout: 15000,
    maxRetries: 2,
  });

  const healthCheck = useHealthCheck({
    context: 'Health Check',
  });

  const quickApi = useApiCall({
    context: 'Quick Test',
    timeout: 5000,
    maxRetries: 1,
    silentErrors: false,
  });

  const handleTestStandardApi = () => {
    const url = customUrl || selectedEndpoint.url;
    standardApi.execute(url);
  };

  const handleTestJsonApi = () => {
    const url = customUrl || selectedEndpoint.url;
    jsonApi.execute(url);
  };

  const handleTestHealthCheck = () => {
    healthCheck.execute('http://localhost:3001/health');
  };

  const handleTestQuickApi = () => {
    const url = customUrl || selectedEndpoint.url;
    quickApi.execute(url);
  };

  const handleTestConnectivity = async () => {
    setConnectivityResults({});
    
    for (const endpoint of TEST_ENDPOINTS) {
      const isReachable = await testApiConnectivity(endpoint.url);
      setConnectivityResults(prev => ({
        ...prev,
        [endpoint.name]: isReachable
      }));
    }
  };

  const formatJsonData = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getStatusColor = (loading: boolean, error: Error | null, data: any) => {
    if (loading) return 'text-blue-600';
    if (error) return 'text-red-600';
    if (data) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusText = (loading: boolean, error: Error | null, data: any, attempt: number) => {
    if (loading) return `Loading... (Attempt ${attempt})`;
    if (error) return `Error: ${error.message}`;
    if (data) return 'Success';
    return 'Ready';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🌐 API Call Tester
        </h2>
        <p className="text-gray-600">
          Test the robustness of our API communication system
        </p>
      </div>

      {/* Endpoint Selection */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          🎯 Test Endpoint Selection
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {TEST_ENDPOINTS.map((endpoint) => (
            <label 
              key={endpoint.name} 
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedEndpoint.name === endpoint.name 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="endpoint"
                value={endpoint.name}
                checked={selectedEndpoint.name === endpoint.name}
                onChange={() => setSelectedEndpoint(endpoint)}
                className="sr-only"
              />
              <div className="font-medium text-sm">{endpoint.name}</div>
              <div className="text-xs text-gray-500 mt-1">{endpoint.description}</div>
              <div className="text-xs text-blue-600 mt-1">Expected: {endpoint.expectedBehavior}</div>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom URL (optional):
          </label>
          <input
            type="url"
            value={customUrl}
            onChange={(_e) => setCustomUrl(e.target.value)}
            placeholder="https://api.example.com/data"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Standard API Test */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h4 className="font-semibold mb-2">Standard API</h4>
          <p className="text-xs text-gray-600 mb-3">30s timeout, 3 retries</p>
          
          <div className="space-y-2">
            <Button 
              onClick={handleTestStandardApi}
              disabled={standardApi.loading}
              className="w-full text-sm"
              size="sm"
            >
              {standardApi.loading ? 'Testing...' : 'Test Standard'}
            </Button>
            
            <div className={`text-xs ${getStatusColor(standardApi.loading, standardApi.error, standardApi.data)}`}>
              {getStatusText(standardApi.loading, standardApi.error, standardApi.data, standardApi.attempt)}
            </div>
            
            {standardApi.isTimeout && (
              <div className="text-xs text-yellow-600">⏰ Request timed out</div>
            )}
          </div>
        </div>

        {/* JSON API Test */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h4 className="font-semibold mb-2">JSON API</h4>
          <p className="text-xs text-gray-600 mb-3">15s timeout, 2 retries</p>
          
          <div className="space-y-2">
            <Button 
              onClick={handleTestJsonApi}
              disabled={jsonApi.loading}
              variant="outline"
              className="w-full text-sm"
              size="sm"
            >
              {jsonApi.loading ? 'Testing...' : 'Test JSON'}
            </Button>
            
            <div className={`text-xs ${getStatusColor(jsonApi.loading, jsonApi.error, jsonApi.data)}`}>
              {getStatusText(jsonApi.loading, jsonApi.error, jsonApi.data, jsonApi.attempt)}
            </div>
          </div>
        </div>

        {/* Health Check Test */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h4 className="font-semibold mb-2">Health Check</h4>
          <p className="text-xs text-gray-600 mb-3">5s timeout, 1 retry, silent</p>
          
          <div className="space-y-2">
            <Button 
              onClick={handleTestHealthCheck}
              disabled={healthCheck.loading}
              variant="outline"
              className="w-full text-sm"
              size="sm"
            >
              {healthCheck.loading ? 'Checking...' : 'Check Health'}
            </Button>
            
            <div className={`text-xs ${getStatusColor(healthCheck.loading, healthCheck.error, healthCheck.data)}`}>
              {getStatusText(healthCheck.loading, healthCheck.error, healthCheck.data, healthCheck.attempt)}
            </div>
          </div>
        </div>

        {/* Quick Test */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h4 className="font-semibold mb-2">Quick Test</h4>
          <p className="text-xs text-gray-600 mb-3">5s timeout, 1 retry</p>
          
          <div className="space-y-2">
            <Button 
              onClick={handleTestQuickApi}
              disabled={quickApi.loading}
              variant="outline" 
              className="w-full text-sm"
              size="sm"
            >
              {quickApi.loading ? 'Testing...' : 'Quick Test'}
            </Button>
            
            <div className={`text-xs ${getStatusColor(quickApi.loading, quickApi.error, quickApi.data)}`}>
              {getStatusText(quickApi.loading, quickApi.error, quickApi.data, quickApi.attempt)}
            </div>
          </div>
        </div>
      </div>

      {/* Results Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Response Data */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            📊 Response Data
          </h3>
          
          {[standardApi, jsonApi, healthCheck, quickApi].map((api) => {
            const names = ['Standard', 'JSON', 'Health', 'Quick'];
            if (!api.data && !api.error) return null;
            
            return (
              <div key={names[index]} className="mb-4 p-3 bg-gray-50 rounded">
                <h4 className="font-medium text-sm mb-2">{names[index]} API Result:</h4>
                {api.data && (
                  <pre className="text-xs bg-green-50 p-2 rounded overflow-auto max-h-32">
                    {formatJsonData(api.data)}
                  </pre>
                )}
                {api.error && (
                  <div className="text-xs bg-red-50 p-2 rounded text-red-700">
                    <strong>Error:</strong> {api.error.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Connectivity Tests */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            🔍 Connectivity Tests
          </h3>
          
          <Button 
            onClick={handleTestConnectivity}
            className="w-full mb-4"
            size="sm"
          >
            Test All Endpoints Connectivity
          </Button>
          
          <div className="space-y-2">
            {TEST_ENDPOINTS.map((endpoint) => (
              <div key={endpoint.name} className="flex items-center justify-between text-sm">
                <span className="truncate">{endpoint.name}</span>
                <span className={`ml-2 ${
                  connectivityResults[endpoint.name] === true ? 'text-green-600' :
                  connectivityResults[endpoint.name] === false ? 'text-red-600' : 
                  'text-gray-400'
                }`}>
                  {connectivityResults[endpoint.name] === true ? '✅ Online' :
                   connectivityResults[endpoint.name] === false ? '❌ Offline' : 
                   '⏳ Testing...'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          🎮 Control Actions
        </h3>
        
        <div className="flex space-x-2">
          <Button 
            onClick={() => {
              standardApi.reset();
              jsonApi.reset();
              healthCheck.reset();
              quickApi.reset();
            }}
            variant="outline"
            size="sm"
          >
            🔄 Reset All Tests
          </Button>
          
          <Button 
            onClick={() => {
              standardApi.cancel();
              jsonApi.cancel();
              healthCheck.cancel();
              quickApi.cancel();
            }}
            variant="outline"
            size="sm"
          >
            ⏹️ Cancel All Requests
          </Button>
        </div>
      </div>
    </div>
  );
}; 

