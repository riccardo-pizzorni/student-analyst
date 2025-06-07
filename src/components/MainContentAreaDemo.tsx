/**
 * Main Content Area Demo Component
 * 
 * Demo interattiva per testare tutte le funzionalità del MainContentArea
 */

import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import MainContentArea, { useStepData } from './MainContentArea';
import { AutoSaveStatus } from './AutoSaveIndicator';

interface DemoSettings {
  enableAutoSave: boolean;
  showHeader: boolean;
  isLoading: boolean;
  loadingVariant: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'progress';
  loadingProgress: number;
  maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  simulateError: boolean;
  autoSaveStatus: AutoSaveStatus;
}

const DEMO_STEPS = [
  { id: 'data-input', name: 'Portfolio Data Input', description: 'Input your portfolio holdings' },
  { id: 'data-validation', name: 'Data Validation', description: 'Validate data quality' },
  { id: 'risk-analysis', name: 'Risk Analysis', description: 'Analyze portfolio risk' },
  { id: 'performance-analysis', name: 'Performance Analysis', description: 'Evaluate performance metrics' }
];

export const MainContentAreaDemo: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [settings, setSettings] = useState<DemoSettings>({
    enableAutoSave: true,
    showHeader: true,
    isLoading: false,
    loadingVariant: 'spinner',
    loadingProgress: 0,
    maxWidth: 'xl',
    simulateError: false,
    autoSaveStatus: 'idle'
  });

  const currentStep = DEMO_STEPS[currentStepIndex];
  const { data, isDirty, autoSaveStatus, lastSaved, updateData } = useStepData(currentStep.id, {
    portfolioValue: 100000,
    numberOfHoldings: 10,
    riskTolerance: 'moderate'
  });

  const [progressTimer, setProgressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSettingChange = useCallback((key: keyof DemoSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const simulateLoading = useCallback(() => {
    if (progressTimer) {
      clearInterval(progressTimer);
    }

    handleSettingChange('isLoading', true);
    handleSettingChange('loadingProgress', 0);

    const timer = setInterval(() => {
      setSettings(prev => {
        const newProgress = prev.loadingProgress + 10;
        if (newProgress >= 100) {
          clearInterval(timer);
          return {
            ...prev,
            isLoading: false,
            loadingProgress: 100
          };
        }
        return {
          ...prev,
          loadingProgress: newProgress
        };
      });
    }, 200);

    setProgressTimer(timer as any);
  }, [progressTimer, handleSettingChange]);

  const simulateAutoSave = useCallback(() => {
    updateData({
      ...data,
      lastModified: new Date().toISOString()
    });
  }, [data, updateData]);

  const triggerError = useCallback(() => {
    throw new Error('Simulated error for testing error boundary');
  }, []);

  const ErrorComponent: React.FC = () => {
    if (settings.simulateError) {
      triggerError();
    }
    return null;
  };

  const renderDemoContent = () => (
    <div className="space-y-6">
      {/* Sample step content */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{currentStep.description}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portfolio Value
            </label>
            <input
              id="portfolio-value"
              type="number"
              aria-label="Portfolio Value"
              value={data.portfolioValue}
              onChange={(e) => updateData({ ...data, portfolioValue: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Holdings
            </label>
            <input
              id="number-of-holdings"
              type="number"
              aria-label="Number of Holdings"
              value={data.numberOfHoldings}
              onChange={(e) => updateData({ ...data, numberOfHoldings: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Tolerance
            </label>
            <select
              id="risk-tolerance"
              aria-label="Risk Tolerance"
              value={data.riskTolerance}
              onChange={(e) => updateData({ ...data, riskTolerance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            Data Status: {isDirty ? 'Modified' : 'Saved'}
          </p>
          {lastSaved && (
            <p className="text-xs text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Error trigger component */}
      <ErrorComponent />
      
      {/* Sample charts/analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-medium mb-3">Portfolio Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Value:</span>
              <span className="font-medium">${data.portfolioValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Holdings:</span>
              <span className="font-medium">{data.numberOfHoldings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Risk Level:</span>
              <span className="font-medium capitalize">{data.riskTolerance}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-medium mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <Button 
              onClick={simulateAutoSave}
              className="w-full"
              variant="outline"
            >
              🔄 Trigger Auto-Save
            </Button>
            <Button 
              onClick={simulateLoading}
              className="w-full"
              variant="outline"
            >
              ⏳ Simulate Loading
            </Button>
            <Button 
              onClick={() => handleSettingChange('simulateError', !settings.simulateError)}
              className="w-full"
              variant="outline"
            >
              {settings.simulateError ? '✅ Stop Error' : '💥 Trigger Error'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo controls */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              📱 Main Content Area Demo
            </h2>
            
            {/* Step navigation */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                variant="outline"
                size="sm"
              >
                ← Prev
              </Button>
              
              <span className="text-sm text-gray-600">
                {currentStepIndex + 1} / {DEMO_STEPS.length}
              </span>
              
              <Button
                onClick={() => setCurrentStepIndex(Math.min(DEMO_STEPS.length - 1, currentStepIndex + 1))}
                disabled={currentStepIndex === DEMO_STEPS.length - 1}
                variant="outline"
                size="sm"
              >
                Next →
              </Button>
            </div>
          </div>
          
          {/* Settings controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.enableAutoSave}
                onChange={(e) => handleSettingChange('enableAutoSave', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-save</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.showHeader}
                onChange={(e) => handleSettingChange('showHeader', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show header</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.isLoading}
                onChange={(e) => handleSettingChange('isLoading', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Loading</span>
            </label>
            
            <select
              value={settings.loadingVariant}
              onChange={(e) => handleSettingChange('loadingVariant', e.target.value)}
              className="text-sm border rounded px-2 py-1"
              aria-label="Loading variant selection"
            >
              <option value="spinner">Spinner</option>
              <option value="dots">Dots</option>
              <option value="pulse">Pulse</option>
              <option value="skeleton">Skeleton</option>
              <option value="progress">Progress</option>
            </select>
            
            <select
              value={settings.maxWidth}
              onChange={(e) => handleSettingChange('maxWidth', e.target.value)}
              className="text-sm border rounded px-2 py-1"
              aria-label="Max width selection"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">X-Large</option>
              <option value="2xl">2X-Large</option>
              <option value="full">Full Width</option>
            </select>
            
            <div className="text-xs text-gray-500">
              Progress: {settings.loadingProgress}%
            </div>
          </div>
        </div>
      </div>

      {/* Main content area demo */}
      <MainContentArea
        currentStep={`${currentStepIndex + 1}`}
        stepName={currentStep.name}
        enableAutoSave={settings.enableAutoSave}
        autoSaveStatus={autoSaveStatus}
        lastSaved={lastSaved}
        isLoading={settings.isLoading}
        loadingMessage={`Processing ${currentStep.name.toLowerCase()}...`}
        loadingProgress={settings.loadingVariant === 'progress' ? settings.loadingProgress : undefined}
        loadingVariant={settings.loadingVariant}
        maxWidth={settings.maxWidth}
        showHeader={settings.showHeader}
        className="bg-gray-50"
      >
        {renderDemoContent()}
      </MainContentArea>
    </div>
  );
};

export default MainContentAreaDemo; 

