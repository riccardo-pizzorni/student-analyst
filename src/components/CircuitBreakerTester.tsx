import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useApiCall, useAlphaVantageApi, useYahooFinanceApi, useBackendApi } from '../hooks/useApiCall';
import { CircuitBreakerRegistry, CircuitBreakerStats, CircuitBreakerState } from '../utils/CircuitBreaker';

interface MockApiStatus {
  isEnabled: boolean;
  shouldFail: boolean;
  failureRate: number;
  responseDelay: number;
}

interface CircuitBreakerTestScenario {
  name: string;
  description: string;
  url: string;
  expectedBehavior: string;
  circuitBreakerName: string;
}

const TEST_SCENARIOS: CircuitBreakerTestScenario[] = [
  {
    name: 'Alpha Vantage Simulation',
    description: 'Test circuit breaker with simulated Alpha Vantage API',
    url: 'https://httpbin.org/status/500',
    expectedBehavior: 'Should open after 2 failures, wait 10 minutes',
    circuitBreakerName: 'alpha-vantage'
  },
  {
    name: 'Yahoo Finance Simulation',
    description: 'Test circuit breaker with simulated Yahoo Finance API',
    url: 'https://httpbin.org/status/503',
    expectedBehavior: 'Should open after 3 failures, wait 5 minutes',
    circuitBreakerName: 'yahoo-finance'
  },
  {
    name: 'Backend API Simulation',
    description: 'Test circuit breaker with simulated backend API',
    url: 'http://localhost:3001/nonexistent',
    expectedBehavior: 'Should open after 3 failures, wait 2 minutes',
    circuitBreakerName: 'backend-api'
  },
  {
    name: 'Generic Unstable API',
    description: 'Test with generic unstable API endpoint',
    url: 'https://httpbin.org/status/502',
    expectedBehavior: 'Should open after 3 failures, wait 5 minutes',
    circuitBreakerName: 'httpbin.org'
  }
];

export const CircuitBreakerTester: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState(TEST_SCENARIOS[0]);
  const [allStats, setAllStats] = useState<{ [name: string]: CircuitBreakerStats }>({});
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);

  // API hooks for testing
  const genericApi = useApiCall({
    context: 'Circuit Breaker Test',
    enableCircuitBreaker: true,
    enableNotifications: true,
  });

  const alphaVantageApi = useAlphaVantageApi({
    context: 'Alpha Vantage Test',
  });

  const yahooFinanceApi = useYahooFinanceApi({
    context: 'Yahoo Finance Test',
  });

  const backendApi = useBackendApi({
    context: 'Backend Test',
  });

  // Update stats every second
  useEffect(() => {
    const interval = setInterval(() => {
      const registry = CircuitBreakerRegistry.getInstance();
      setAllStats(registry.getAllStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 19)]); // Keep last 20 entries
  };

  const clearLog = () => setTestLog([]);

  const getApiHookForScenario = (scenario: CircuitBreakerTestScenario) => {
    switch (scenario.circuitBreakerName) {
      case 'alpha-vantage':
        return alphaVantageApi;
      case 'yahoo-finance':
        return yahooFinanceApi;
      case 'backend-api':
        return backendApi;
      default:
        return genericApi;
    }
  };

  const testSingleScenario = async (scenario: CircuitBreakerTestScenario) => {
    const api = getApiHookForScenario(scenario);
    addToLog(`Testing ${scenario.name}...`);
    
    try {
      await api.execute(scenario.url);
      addToLog(`✅ ${scenario.name}: Request succeeded`);
    } catch (error) {
      addToLog(`❌ ${scenario.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runAutoTest = async () => {
    setIsAutoTesting(true);
    addToLog('🚀 Starting automated circuit breaker test...');

    // Test each scenario multiple times to trigger circuit breaker
    for (const scenario of TEST_SCENARIOS) {
      addToLog(`\n📋 Testing scenario: ${scenario.name}`);
      
      // Make multiple failing requests to trigger circuit breaker
      for (let i = 1; i <= 5; i++) {
        addToLog(`Attempt ${i}/5 for ${scenario.name}`);
        await testSingleScenario(scenario);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between scenarios
    }

    addToLog('✅ Automated test completed');
    setIsAutoTesting(false);
  };

  const resetAllCircuitBreakers = () => {
    const registry = CircuitBreakerRegistry.getInstance();
    registry.resetAll();
    addToLog('🔄 All circuit breakers reset to CLOSED state');
  };

  const getStateColor = (state: CircuitBreakerState) => {
    switch (state) {
      case CircuitBreakerState.CLOSED:
        return 'text-green-600 bg-green-50 border-green-200';
      case CircuitBreakerState.OPEN:
        return 'text-red-600 bg-red-50 border-red-200';
      case CircuitBreakerState.HALF_OPEN:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStateIcon = (state: CircuitBreakerState) => {
    switch (state) {
      case CircuitBreakerState.CLOSED:
        return '🟢';
      case CircuitBreakerState.OPEN:
        return '🔴';
      case CircuitBreakerState.HALF_OPEN:
        return '🟡';
      default:
        return '⚪';
    }
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ⚡ Circuit Breaker Tester
        </h2>
        <p className="text-gray-600">
          Test the circuit breaker pattern protection for API calls
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          🎮 Test Controls
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            onClick={runAutoTest}
            disabled={isAutoTesting}
            className="w-full"
            size="sm"
          >
            {isAutoTesting ? '🧪 Testing...' : '🚀 Run Auto Test'}
          </Button>
          
          <Button 
            onClick={resetAllCircuitBreakers}
            variant="outline"
            className="w-full"
            size="sm"
          >
            🔄 Reset All Breakers
          </Button>
          
          <Button 
            onClick={clearLog}
            variant="outline"
            className="w-full"
            size="sm"
          >
            🗑️ Clear Log
          </Button>
          
          <Button 
            variant="outline"
            className="w-full"
            size="sm"
            disabled
          >
            📊 Export Stats (Soon)
          </Button>
        </div>
      </div>

      {/* Scenario Selection & Manual Testing */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          🎯 Manual Testing
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {TEST_SCENARIOS.map((scenario) => (
            <label 
              key={scenario.name} 
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedScenario.name === scenario.name 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="scenario"
                value={scenario.name}
                checked={selectedScenario.name === scenario.name}
                onChange={() => setSelectedScenario(scenario)}
                className="sr-only"
              />
              <div className="font-medium text-sm">{scenario.name}</div>
              <div className="text-xs text-gray-500 mt-1">{scenario.description}</div>
              <div className="text-xs text-blue-600 mt-1">Expected: {scenario.expectedBehavior}</div>
            </label>
          ))}
        </div>

        <Button 
          onClick={() => testSingleScenario(selectedScenario)}
          className="w-full"
          size="sm"
        >
          🧪 Test Selected Scenario
        </Button>
      </div>

      {/* Circuit Breaker Status Dashboard */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          📊 Circuit Breaker Status Dashboard
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(allStats).map(([name, stats]) => (
            <div key={name} className={`p-4 rounded-lg border ${getStateColor(stats.state)}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{name}</h4>
                <span className="text-lg">{getStateIcon(stats.state)}</span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>State:</span>
                  <span className="font-medium">{stats.state}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Failure Count:</span>
                  <span>{stats.failureCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Total Requests:</span>
                  <span>{stats.totalRequests}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span>
                    {stats.totalRequests > 0 
                      ? `${((stats.totalSuccesses / stats.totalRequests) * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
                
                {stats.lastFailureTime && (
                  <div className="flex justify-between">
                    <span>Last Failure:</span>
                    <span>{formatTime(stats.lastFailureTime)}</span>
                  </div>
                )}
                
                {stats.nextAttemptTime && stats.state === CircuitBreakerState.OPEN && (
                  <div className="flex justify-between">
                    <span>Next Attempt:</span>
                    <span>{formatTime(stats.nextAttemptTime)}</span>
                  </div>
                )}
                
                {stats.nextAttemptTime && stats.state === CircuitBreakerState.OPEN && (
                  <div className="flex justify-between">
                    <span>Time Until Retry:</span>
                    <span>{formatDuration(stats.nextAttemptTime - Date.now())}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {Object.keys(allStats).length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No circuit breakers active yet. Run some tests to see the status.
          </div>
        )}
      </div>

      {/* Test Log */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          📝 Test Log
        </h3>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
          {testLog.length > 0 ? (
            testLog.map((entry) => (
              <div key={index} className="mb-1">
                {entry}
              </div>
            ))
          ) : (
            <div className="text-gray-500">No test activity yet. Run some tests to see the log.</div>
          )}
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          ℹ️ How Circuit Breaker Works
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">🟢 CLOSED State</h4>
            <p>Normal operation. All requests pass through. Failures are counted.</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">🔴 OPEN State</h4>
            <p>Too many failures detected. All requests are blocked for the recovery timeout period.</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">🟡 HALF_OPEN State</h4>
            <p>Testing phase. One request is allowed to test if the service has recovered.</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded text-sm">
          <strong>Test Tip:</strong> Try the "Run Auto Test" to see all circuit breakers transition through states automatically.
          The Alpha Vantage breaker opens after 2 failures, others after 3 failures.
        </div>
      </div>
    </div>
  );
}; 

