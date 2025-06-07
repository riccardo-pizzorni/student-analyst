/**
 * Auto Save Demo Component
 * 
 * Demo completa per testare e mostrare tutte le funzionalità del sistema di auto-save
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { useAutoSave, autoSaveService } from '../services/AutoSaveService';
import AutoSaveRecovery from './AutoSaveRecovery';
import AutoSaveIndicator, { AutoSaveStatus } from './AutoSaveIndicator';

interface DemoStep {
  id: string;
  name: string;
  description: string;
  defaultData: any;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 'data-input',
    name: 'Portfolio Data Input',
    description: 'Enter your portfolio holdings and basic information',
    defaultData: {
      portfolioName: '',
      totalValue: 100000,
      currency: 'USD',
      holdings: []
    }
  },
  {
    id: 'risk-analysis',
    name: 'Risk Analysis',
    description: 'Configure risk analysis parameters',
    defaultData: {
      riskTolerance: 'moderate',
      timeHorizon: 5,
      maxDrawdown: 20,
      volatilityTarget: 15
    }
  },
  {
    id: 'optimization',
    name: 'Portfolio Optimization',
    description: 'Set optimization constraints and objectives',
    defaultData: {
      optimizationMethod: 'markowitz',
      constraints: {
        maxWeight: 30,
        minWeight: 1,
        sectorLimits: true
      },
      rebalanceFrequency: 'quarterly'
    }
  }
];

export const AutoSaveDemo: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveredSteps, setRecoveredSteps] = useState<string[]>([]);
  const [globalStatus, setGlobalStatus] = useState<AutoSaveStatus>('idle');
  const [storageStats, setStorageStats] = useState({ totalEntries: 0, totalSize: 0, oldestEntry: null as Date | null });

  const currentStep = DEMO_STEPS[currentStepIndex];
  
  // Auto-save hook per lo step corrente
  const {
    data,
    status,
    lastSaved,
    hasUnsavedChanges,
    setData,
    save,
    saveImmediate,
    version
  } = useAutoSave(currentStep.id, currentStep.defaultData);

  // Monitor global auto-save status
  useEffect(() => {
    const unsubscribe = autoSaveService.subscribe((newStatus) => {
      setGlobalStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  // Update storage stats periodically
  useEffect(() => {
    const updateStats = () => {
      setStorageStats(autoSaveService.getStorageStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check for recovery data on mount
  useEffect(() => {
    const savedSteps = autoSaveService.getAllSavedSteps();
    if (savedSteps.length > 0) {
      setShowRecovery(true);
    }
  }, []);

  const handleDataChange = useCallback((field: string, value: any) => {
    const newData = { ...data, [field]: value };
    setData(newData);
  }, [data, setData]);

  const handleStepChange = (newIndex: number) => {
    setCurrentStepIndex(newIndex);
  };

  const handleRecoveryComplete = (steps: string[]) => {
    setRecoveredSteps(steps);
    setShowRecovery(false);
    
    // Naviga al primo step recuperato se disponibile
    if (steps.length > 0) {
      const firstStepIndex = DEMO_STEPS.findIndex(step => steps.includes(step.id));
      if (firstStepIndex !== -1) {
        setCurrentStepIndex(firstStepIndex);
      }
    }
  };

  const handleRecoveryDeclined = () => {
    setShowRecovery(false);
    setRecoveredSteps([]);
  };

  const simulateConflict = () => {
    // Simula un conflitto creando dati con stesso timestamp ma diverso sessionId
    const conflictData = {
      ...data,
      conflictField: 'Modified from another device',
      timestamp: Date.now()
    };
    
    // Salva direttamente in localStorage per simulare conflitto
    const storageKey = `student_analyst_autosave_${currentStep.id}`;
    const conflictAutoSaveData = {
      stepId: currentStep.id,
      data: conflictData,
      timestamp: Date.now(),
      version: version + 1,
      sessionId: 'different_session(i)d',
      checksum: 'different_checksum'
    };
    
    localStorage.setItem(storageKey, JSON.stringify(conflictAutoSaveData));
    
    // Ora tenta di salvare i dati correnti
    save();
  };

  const clearAllData = () => {
    autoSaveService.clearAll();
    setRecoveredSteps([]);
    // Resetta tutti i dati agli default
    setData(currentStep.defaultData);
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'data-input':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portfolio Name
              </label>
              <input
                type="text"
                value={data.portfolioName || ''}
                onChange={(e) => handleDataChange('portfolioName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter portfolio name"
              />
            </div>
            
            <div>
              <label htmlFor="total-value-input" className="block text-sm font-medium text-gray-700 mb-1">
                Total Value
              </label>
              <input
                id="total-value-input"
                type="number"
                value={data.totalValue || 0}
                onChange={(e) => handleDataChange('totalValue', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                id="currency-select"
                value={data.currency || 'USD'}
                onChange={(e) => handleDataChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">US Dollar</option>
                <option value="EUR">Euro</option>
                <option value="GBP">British Pound</option>
                <option value="JPY">Japanese Yen</option>
              </select>
            </div>
          </div>
        );
        
      case 'risk-analysis':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="risk-tolerance-select" className="block text-sm font-medium text-gray-700 mb-1">
                Risk Tolerance
              </label>
              <select
                id="risk-tolerance-select"
                value={data.riskTolerance || 'moderate'}
                onChange={(e) => handleDataChange('riskTolerance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="time-horizon-input" className="block text-sm font-medium text-gray-700 mb-1">
                Time Horizon (years)
              </label>
              <input
                id="time-horizon-input"
                type="number"
                min="1"
                max="30"
                value={data.timeHorizon || 5}
                onChange={(e) => handleDataChange('timeHorizon', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="max-drawdown-input" className="block text-sm font-medium text-gray-700 mb-1">
                Max Drawdown (%)
              </label>
              <input
                id="max-drawdown-input"
                type="number"
                min="5"
                max="50"
                value={data.maxDrawdown || 20}
                onChange={(e) => handleDataChange('maxDrawdown', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
        
      case 'optimization':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="optimization-method-select" className="block text-sm font-medium text-gray-700 mb-1">
                Optimization Method
              </label>
              <select
                id="optimization-method-select"
                value={data.optimizationMethod || 'markowitz'}
                onChange={(e) => handleDataChange('optimizationMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="markowitz">Markowitz (Mean-Variance)</option>
                <option value="black-litterman">Black-Litterman</option>
                <option value="risk-parity">Risk Parity</option>
                <option value="equal-weight">Equal Weight</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="max-weight-input" className="block text-sm font-medium text-gray-700 mb-1">
                Max Single Asset Weight (%)
              </label>
              <input
                id="max-weight-input"
                type="number"
                min="1"
                max="100"
                value={data.constraints?.maxWeight || 30}
                onChange={(e) => handleDataChange('constraints', { 
                  ...data.constraints, 
                  maxWeight: Number(e.target.value) 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="rebalance-frequency-select" className="block text-sm font-medium text-gray-700 mb-1">
                Rebalance Frequency
              </label>
              <select
                id="rebalance-frequency-select"
                value={data.rebalanceFrequency || 'quarterly'}
                onChange={(e) => handleDataChange('rebalanceFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semiannual">Semi-Annual</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        );
        
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Recovery Modal */}
      {showRecovery && (
        <AutoSaveRecovery
          onRecoveryComplete={handleRecoveryComplete}
          onRecoveryDeclined={handleRecoveryDeclined}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              💾 Auto-Save Demo
            </h1>
            
            {/* Global Status */}
            <div className="flex items-center space-x-4">
              <AutoSaveIndicator
                status={status}
                lastSaved={lastSaved}
                stepName={currentStep.name}
                variant="compact"
              />
              
              <div className="text-sm text-gray-600">
                Global: {globalStatus}
              </div>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex flex-wrap items-center justify-between mt-4 gap-4">
            <div className="flex items-center space-x-2">
              {DEMO_STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepChange(index)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    index === currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : recoveredSteps.includes(step.id)
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}. {step.name}
                  {recoveredSteps.includes(step.id) && ' ✓'}
                </button>
              ))}
            </div>

            <div className="text-sm text-gray-600">
              Version: {version} | {hasUnsavedChanges ? 'Modified' : 'Saved'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {currentStep.name}
              </h2>
              <p className="text-gray-600 mb-6">
                {currentStep.description}
              </p>
              
              {renderStepContent()}
            </div>

            {/* Test Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Test Auto-Save Features
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => saveImmediate()}
                  variant="outline"
                  className="w-full"
                >
                  💾 Save Now
                </Button>
                
                <Button
                  onClick={simulateConflict}
                  variant="outline"
                  className="w-full"
                >
                  ⚡ Simulate Conflict
                </Button>
                
                <Button
                  onClick={() => setShowRecovery(true)}
                  variant="outline"
                  className="w-full"
                >
                  🔄 Show Recovery
                </Button>
                
                <Button
                  onClick={clearAllData}
                  variant="outline"
                  className="w-full text-red-600 hover:bg-red-50"
                >
                  🗑️ Clear All
                </Button>
              </div>
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Current Step Status */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Current Step Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    status === 'saved' ? 'text-green-600' :
                    status === 'saving' ? 'text-blue-600' :
                    status === 'error' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium">{version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Changes:</span>
                  <span className={`font-medium ${hasUnsavedChanges ? 'text-orange-600' : 'text-green-600'}`}>
                    {hasUnsavedChanges ? 'Modified' : 'Saved'}
                  </span>
                </div>
                {lastSaved && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Saved:</span>
                    <span className="font-medium">{lastSaved.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Storage Stats */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Storage Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Entries:</span>
                  <span className="font-medium">{storageStats.totalEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Size:</span>
                  <span className="font-medium">
                    {(storageStats.totalSize / 1024).toFixed(1)} KB
                  </span>
                </div>
                {storageStats.oldestEntry && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Oldest:</span>
                    <span className="font-medium">
                      {storageStats.oldestEntry.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Data Preview */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Data Preview</h4>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoSaveDemo; 

