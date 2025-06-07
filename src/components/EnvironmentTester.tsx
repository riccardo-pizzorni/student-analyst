/**
 * STUDENT ANALYST - Environment Variables Tester
 * =============================================
 * 
 * Componente per testare e visualizzare lo stato delle variabili d'ambiente
 */

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { validateEnvironmentVariables, getEnvironmentStatus, type ValidationResult } from '../utils/envValidation'

export function EnvironmentTester() {
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [status, setStatus] = useState<ReturnType<typeof getEnvironmentStatus> | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const runValidation = async () => {
    setIsRefreshing(true)
    try {
      const validationResult = validateEnvironmentVariables()
      const statusResult = getEnvironmentStatus()
      
      setValidation(validationResult)
      setStatus(statusResult)
      
      console.log('🔍 Environment Validation Results:', validationResult)
      console.log('📊 Environment Status:', statusResult)
    } catch (error) {
      console.error('Errore durante la validazione:', (error))
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    runValidation()
  }, [])

  const formatEnvValue = (key: string, value: any): string => {
    if (key.includes('API_KEY') && value && typeof value === 'string') {
      // Nascondi le chiavi API per sicurezza
      return `${value.substring(0, 4)}${'*'.repeat(Math.max(0, value.length - 8))}${value.slice(-4)}`
    }
    return String(value)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔧 Environment Variables Tester
        </h1>
        <p className="text-gray-600 mb-6">
          Test and validate your environment configuration
        </p>
        
        <Button 
          onClick={runValidation}
          disabled={isRefreshing}
          className="mb-6"
        >
          {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Validation'}
        </Button>
      </div>

      {/* Status Overview */}
      {status && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Environment Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="p-4 rounded-lg border">
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {status.configured ? '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-600">Configuration</div>
                <div className="font-medium">
                  {status.configured ? 'Valid' : 'Invalid'}
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border">
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {status.hasRequiredKeys ? '🔑' : '🔒'}
                </div>
                <div className="text-sm text-gray-600">API Keys</div>
                <div className="font-medium">
                  {status.hasRequiredKeys ? 'Complete' : 'Missing'}
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border">
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {status.debugMode ? '🐛' : '🔇'}
                </div>
                <div className="text-sm text-gray-600">Debug Mode</div>
                <div className="font-medium">
                  {status.debugMode ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border">
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {status.offlineMode ? '📴' : '🌐'}
                </div>
                <div className="text-sm text-gray-600">Network Mode</div>
                <div className="font-medium">
                  {status.offlineMode ? 'Offline' : 'Online'}
                </div>
              </div>
            </div>
          </div>

          {status.missingKeys.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">❌ Missing Required Keys:</h3>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {status.missingKeys.map(key => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Validation Results */}
      {validation && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            {validation.isValid ? '✅' : '❌'} Validation Results
          </h2>

          {/* Configuration Values */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">📋 Current Configuration:</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 font-mono text-sm">
              {Object.entries(validation.config).map(([_key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600">{key}:</span>
                  <span className={`${key.includes('API_KEY') ? 'text-blue-600' : 'text-gray-900'}`}>
                    {formatEnvValue(_key, value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-red-800 mb-3">❌ Errors:</h3>
              <div className="space-y-3">
                {validation.errors.map((error) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <pre className="text-red-700 text-sm whitespace-pre-wrap">{error}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-yellow-800 mb-3">⚠️ Warnings:</h3>
              <div className="space-y-3">
                {validation.warnings.map((warning) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <pre className="text-yellow-700 text-sm whitespace-pre-wrap">{warning}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {validation.isValid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✅ Environment configuration is valid!</p>
              <p className="text-green-700 text-sm mt-1">
                All required environment variables are properly configured.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Setup Instructions */}
      <div className="bg-white rounded-lg shadow-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">📚 Setup Instructions</h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">1. Create Environment File:</h3>
            <code className="bg-gray-100 px-2 py-1 rounded">cp .env.example .env</code>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">2. Get Alpha Vantage API Key:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Visit: <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.alphavantage.co/support/#api-key</a></li>
              <li>Register with your email</li>
              <li>Copy your free API key</li>
              <li>Paste it in your .env file</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">3. Optional Configuration:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Set <code>VITE_DEBUG_MODE=true</code> for detailed logging</li>
              <li>Set <code>VITE_OFFLINE_MODE=true</code> for offline testing</li>
              <li>Adjust <code>VITE_API_TIMEOUT</code> if needed (default: 10000ms)</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">4. Restart Application:</h3>
            <p className="text-gray-600 ml-4">Changes to .env files require an application restart to take effect.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 

