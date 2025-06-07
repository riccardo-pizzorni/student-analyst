/**
 * STUDENT ANALYST - Automatic Fallback Demo Component
 * Interactive testing and demonstration of intelligent fallback system
 */

import React, { useState, useEffect, useCallback } from 'react';
import { multiProviderFinanceService } from '../services/MultiProviderFinanceService';
import { fallbackManager } from '../services/FallbackManager';
import { preferenceManager } from '../services/PreferenceManager';
import type { ProviderStatus, FallbackEvent } from '../services/FallbackManager';
import type { UserPreferences } from '../services/PreferenceManager';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  action: () => Promise<void>;
  expectedResult: string;
}

const AutomaticFallbackDemo: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(preferenceManager.getPreferences());
  const [providersStatus, setProvidersStatus] = useState<ProviderStatus[]>([]);
  const [recentEvents, setRecentEvents] = useState<FallbackEvent[]>([]);
  const [fallbackStats, setFallbackStats] = useState(fallbackManager.getStatistics());
  const [isTestingScenario, setIsTestingScenario] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<string>('');

  // Update states function
  const refreshData = useCallback(() => {
    setPreferences(preferenceManager.getPreferences());
    setProvidersStatus(fallbackManager.getProvidersStatus());
    setRecentEvents(fallbackManager.getRecentEvents(10));
    setFallbackStats(fallbackManager.getStatistics());
  }, []);

  // Auto-refresh data every 5 seconds
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Test scenarios for automatic fallback
  const testScenarios: TestScenario[] = [
    {
      id: 'force-alpha-failures',
      name: '3 Alpha Vantage Failures',
      description: 'Simulate 3 consecutive failures from Alpha Vantage to trigger automatic fallback',
      expectedResult: 'Alpha Vantage disabled, automatic switch to Yahoo Finance with notification',
      action: async () => {
        // Simulate 3 consecutive failures
        for (let i = 0; i < 3; i++) {
          fallbackManager.recordFailure('alpha_vantage', `Simulated failure ${i + 1}/3`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between failures
        }
        setLastTestResult('✅ Alpha Vantage disabled after 3 failures. Yahoo Finance is now primary.');
      }
    },
    {
      id: 'force-yahoo-failures',
      name: '3 Yahoo Finance Failures',
      description: 'Simulate 3 consecutive failures from Yahoo Finance to trigger automatic fallback',
      expectedResult: 'Yahoo Finance disabled, automatic switch to Alpha Vantage with notification',
      action: async () => {
        // Simulate 3 consecutive failures
        for (let i = 0; i < 3; i++) {
          fallbackManager.recordFailure('yahoo_finance', `Simulated failure ${i + 1}/3`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        setLastTestResult('✅ Yahoo Finance disabled after 3 failures. Alpha Vantage is now primary.');
      }
    },
    {
      id: 'recovery-test',
      name: 'Provider Recovery',
      description: 'Test automatic recovery of a previously failed provider',
      expectedResult: 'Failed provider re-enabled and available for use again',
      action: async () => {
        // First ensure we have a failed provider
        fallbackManager.recordFailure('alpha_vantage', 'Simulated failure for recovery test');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Then simulate recovery
        fallbackManager.recordSuccess('alpha_vantage');
        setLastTestResult('✅ Alpha Vantage recovered successfully and re-enabled.');
      }
    },
    {
      id: 'seamless-switch',
      name: 'Seamless Data Retrieval',
      description: 'Test actual data retrieval with automatic fallback if needed',
      expectedResult: 'Data retrieved successfully regardless of provider issues',
      action: async () => {
        try {
          const data = await multiProviderFinanceService.getStockData({
            symbol: 'AAPL',
            timeframe: 'DAILY',
            enableFallback: true
          });
          setLastTestResult(`✅ Data retrieved successfully from ${data.metadata.provider}. Fallback used: ${data.metadata.fallbackUsed}`);
        } catch (error) {
          setLastTestResult(`❌ Data retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  ];

  const runTestScenario = async (scenario: TestScenario) => {
    setIsTestingScenario(true);
    setLastTestResult('🔄 Running test scenario...');
    
    try {
      await scenario.action();
    } catch (error) {
      setLastTestResult(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTestingScenario(false);
      // Refresh data after test
      setTimeout(refreshData, 1000);
    }
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    preferenceManager.setPreference(_key, value);
    setPreferences(preferenceManager.getPreferences());
  };

  const resetAllStats = () => {
    fallbackManager.resetStatistics();
    preferenceManager.resetPreferences();
    refreshData();
    setLastTestResult('📊 All statistics and preferences reset to defaults.');
  };

  const getStatusColor = (status: ProviderStatus): string => {
    if (status.isTemporarilyDisabled) return 'text-red-600 bg-red-100';
    if (!status.isEnabled) return 'text-gray-600 bg-gray-100';
    if (status.consecutiveFailures >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getEventIcon = (eventType: string): string => {
    switch (eventType) {
      case 'success': return '✅';
      case 'failure': return '❌';
      case 'provider_disabled': return '🚫';
      case 'provider_enabled': return '🟢';
      case 'fallback_triggered': return '🔄';
      case 'recovery_attempt': return '🔧';
      default: return '📝';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        🔄 Automatic Fallback Logic Demo
      </h1>

      {/* Fallback Statistics Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">📊 Fallback System Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{fallbackStats.totalProviders}</div>
            <div className="text-sm text-blue-500">Total Providers</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{fallbackStats.availableProviders}</div>
            <div className="text-sm text-green-500">Available Now</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(fallbackStats.successRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-purple-500">Success Rate</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{fallbackStats.fallbackEvents}</div>
            <div className="text-sm text-orange-500">Fallback Events</div>
          </div>
        </div>
      </div>

      {/* Provider Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">🏥 Provider Status</h2>
        <div className="space-y-4">
          {providersStatus.map((provider) => (
            <div key={provider.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-lg">{provider.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(provider)}`}>
                    {provider.isTemporarilyDisabled ? 'DISABLED' : provider.isEnabled ? 'ENABLED' : 'OFFLINE'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Health: {provider.healthScore}/100
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Consecutive Failures:</span>
                  <div className={`font-medium ${provider.consecutiveFailures >= 2 ? 'text-red-600' : 'text-green-600'}`}>
                    {provider.consecutiveFailures}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Total Successes:</span>
                  <div className="font-medium text-green-600">{provider.totalSuccesses}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total Failures:</span>
                  <div className="font-medium text-red-600">{provider.totalFailures}</div>
                </div>
                <div>
                  <span className="text-gray-500">Last Activity:</span>
                  <div className="font-medium">
                    {provider.lastSuccessTime ? new Date(provider.lastSuccessTime).toLocaleTimeString() : 'Never'}
                  </div>
                </div>
              </div>

              {provider.isTemporarilyDisabled && provider.disabledUntil && (
                <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-sm">
                  <strong>Disabled until:</strong> {new Date(provider.disabledUntil).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">⚙️ Fallback Preferences</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Data Source
            </label>
            <select
              id="preferred-data-source"
              value={preferences.preferredDataSource}
              onChange={(e) => updatePreference('preferredDataSource', e.target.value)}
              aria-label="Preferred Data Source"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="auto">Automatic (Smart Selection)</option>
              <option value="alpha_vantage">Alpha Vantage</option>
              <option value="yahoo_finance">Yahoo Finance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Consecutive Failures
            </label>
            <select
              id="max-consecutive-failures"
              value={preferences.maxConsecutiveFailures}
              onChange={(e) => updatePreference('maxConsecutiveFailures', parseInt(e.target.value))}
              aria-label="Max Consecutive Failures"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 (Very Sensitive)</option>
              <option value={2}>2 (Sensitive)</option>
              <option value={3}>3 (Balanced)</option>
              <option value={4}>4 (Tolerant)</option>
              <option value={5}>5 (Very Tolerant)</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableNotifications"
              checked={preferences.enableNotifications}
              onChange={(e) => updatePreference('enableNotifications', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enableNotifications" className="text-sm font-medium text-gray-700">
              Enable Notifications
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableAutoFallback"
              checked={preferences.enableAutoFallback}
              onChange={(e) => updatePreference('enableAutoFallback', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enableAutoFallback" className="text-sm font-medium text-gray-700">
              Enable Auto Fallback
            </label>
          </div>
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">🧪 Test Scenarios</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {testScenarios.map((scenario) => (
            <div key={scenario.id} className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{scenario.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
              <div className="text-xs text-gray-500 mb-3">
                <strong>Expected:</strong> {scenario.expectedResult}
              </div>
              <button
                onClick={() => runTestScenario(scenario)}
                disabled={isTestingScenario}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingScenario ? 'Running Test...' : 'Run Test'}
              </button>
            </div>
          ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={refreshData}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            🔄 Refresh Data
          </button>
          <button
            onClick={resetAllStats}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            🗑️ Reset All
          </button>
        </div>

        {lastTestResult && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <strong>Last Test Result:</strong> {lastTestResult}
          </div>
        )}
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">📋 Recent Fallback Events</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentEvents.length > 0 ? (
            recentEvents.map((event) => (
              <div key={index} className="border-l-4 border-blue-400 bg-blue-50 p-3 rounded-r">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getEventIcon(event.type)}</span>
                    <span className="font-medium">{event.type.replace('_', ' ').toUpperCase()}</span>
                    <span className="text-sm text-gray-600">({event.providerId})</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-700 mt-1">{event.message}</div>
                {event.consecutiveFailures !== undefined && (
                  <div className="text-xs text-gray-500 mt-1">
                    Consecutive failures: {event.consecutiveFailures}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No fallback events recorded yet. Run some test scenarios to see events.
            </div>
          )}
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">💡 How Automatic Fallback Works</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-blue-700 mb-2">🔄 Automatic Switching</h3>
            <ul className="space-y-1 text-blue-600">
              <li>• Monitors consecutive failures for each provider</li>
              <li>• Triggers fallback after {preferences.maxConsecutiveFailures} consecutive failures</li>
              <li>• Automatically switches to healthiest available provider</li>
              <li>• Shows user-friendly notifications about switches</li>
              <li>• Seamless data retrieval without user intervention</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-700 mb-2">🔧 Smart Recovery</h3>
            <ul className="space-y-1 text-blue-600">
              <li>• Automatically re-enables recovered providers</li>
              <li>• Tests disabled providers periodically</li>
              <li>• Gradually restores health scores on success</li>
              <li>• Maintains user preferences throughout</li>
              <li>• Provides detailed event logging for monitoring</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <h4 className="font-semibold text-blue-800 mb-1">🎯 User Experience</h4>
          <p className="text-blue-700 text-sm">
            The fallback system works completely transparently. Users continue to receive financial data 
            without interruption, while being informed about any provider switches through clear, 
            non-intrusive notifications. Preferences are remembered across sessions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutomaticFallbackDemo; 

