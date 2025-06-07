/**
 * Sidebar Step Navigation Demo Component
 * 
 * Interactive demonstration of the SidebarStepNavigation component
 * Shows different states and functionalities
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import SidebarStepNavigation from './SidebarStepNavigation';

const DEMO_STEPS = [
  'data-input',
  'data-validation', 
  'risk-analysis',
  'performance-analysis',
  'optimization',
  'strategy-comparison',
  'report-generation',
  'export-results'
];

export const SidebarStepNavigationDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<string>('data-input');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleStepClick = (stepId: string) => {
    setCurrentStep(stepId);
    console.log(`Navigating to step: ${stepId}`);
  };

  const handleNextStep = () => {
    const currentIndex = DEMO_STEPS.indexOf(currentStep);
    if (currentIndex < DEMO_STEPS.length - 1) {
      setCurrentStep(DEMO_STEPS[currentIndex + 1]);
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = DEMO_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(DEMO_STEPS[currentIndex - 1]);
    }
  };

  const handleReset = () => {
    setCurrentStep('data-input');
  };

  const handleJumpToStep = (index: number) => {
    if (index >= 0 && index < DEMO_STEPS.length) {
      setCurrentStep(DEMO_STEPS[index]);
    }
  };

  const currentStepIndex = DEMO_STEPS.indexOf(currentStep);
  const progressPercentage = ((currentStepIndex + 1) / DEMO_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Sidebar Step Navigation Demo
          </h1>
          <p className="text-lg text-gray-600">
            Interactive demonstration of the step-by-step workflow navigation component
          </p>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Step Navigation */}
        <SidebarStepNavigation
          currentStep={currentStep}
          onStepClick={handleStepClick}
          isCollapsed={isCollapsed}
        />

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl">
            {/* Demo Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🎮 Demo Controls
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Navigation Controls
                  </label>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handlePreviousStep}
                      disabled={currentStepIndex === 0}
                      variant="outline"
                      size="sm"
                    >
                      ← Previous
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                      disabled={currentStepIndex === DEMO_STEPS.length - 1}
                      size="sm"
                    >
                      Next →
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Quick Jump
                  </label>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleJumpToStep(0)}
                      variant="outline"
                      size="sm"
                    >
                      Start
                    </Button>
                    <Button 
                      onClick={() => handleJumpToStep(3)}
                      variant="outline"
                      size="sm"
                    >
                      Middle
                    </Button>
                    <Button 
                      onClick={() => handleJumpToStep(7)}
                      variant="outline"
                      size="sm"
                    >
                      End
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Layout Options
                  </label>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      variant="outline"
                      size="sm"
                    >
                      {isCollapsed ? 'Expand' : 'Collapse'}
                    </Button>
                    <Button 
                      onClick={handleReset}
                      variant="outline"
                      size="sm"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Current Progress
                </h3>
                <div className="flex items-center justify-between text-sm text-blue-800">
                  <span>Step: {currentStepIndex + 1} of {DEMO_STEPS.length}</span>
                  <span>{Math.round(progressPercentage)}% Complete</span>
                </div>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Current Step Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📋 Current Step: {DEMO_STEPS[currentStepIndex]}
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Step Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Step ID:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {currentStep}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span>{currentStepIndex + 1} of {DEMO_STEPS.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-blue-600 font-medium">Current</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Available Actions
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>✅ Can navigate to any completed step</p>
                    <p>🔄 Current step is highlighted with blue indicator</p>
                    <p>⏸️ Future steps are disabled until reached</p>
                    <p>📱 Responsive design adapts to screen size</p>
                    <p>🎯 Progress bar updates automatically</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                ✨ Component Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">
                    🎯 Progress Tracking
                  </h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Visual progress bar</li>
                    <li>• Step completion status</li>
                    <li>• Current step highlighting</li>
                    <li>• Percentage tracking</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    🧭 Smart Navigation
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Click to navigate</li>
                    <li>• Only completed steps clickable</li>
                    <li>• Visual state indicators</li>
                    <li>• Callback system</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">
                    📱 Responsive Design
                  </h3>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Collapsible sidebar</li>
                    <li>• Mobile-friendly</li>
                    <li>• Icon-only mode</li>
                    <li>• Smooth transitions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarStepNavigationDemo; 

