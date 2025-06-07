/**
 * Sidebar Step Navigation Component
 * 
 * Provides step-by-step navigation for the financial analysis workflow
 * Shows progress, current step, and allows navigation between completed steps
 */

import React from 'react';
import { 
  CheckIcon, 
  ClockIcon, 
  DatabaseIcon, 
  ShieldIcon, 
  TargetIcon, 
  BarChartIcon, 
  FileTextIcon, 
  DownloadIcon 
} from '@/components/ui/icons';

export type StepStatus = 'pending' | 'current' | 'completed';

export interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: StepStatus;
  route?: string;
}

export interface SidebarStepNavigationProps {
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
  isCollapsed?: boolean;
}

// Workflow steps for financial analysis
const WORKFLOW_STEPS: Step[] = [
  {
    id: 'data-input',
    title: 'Portfolio Data Input',
    description: 'Insert portfolio assets and weights',
    icon: <DatabaseIcon size={20} />,
    status: 'pending',
    route: 'portfolio-input'
  },
  {
    id: 'data-validation',
    title: 'Data Validation',
    description: 'Verify data quality and consistency', 
    icon: <CheckIcon size={20} />,
    status: 'pending',
    route: 'data-validation'
  },
  {
    id: 'risk-analysis',
    title: 'Risk Analysis',
    description: 'Calculate risk metrics and measures',
    icon: <ShieldIcon size={20} />,
    status: 'pending',
    route: 'risk-analysis'
  },
  {
    id: 'performance-analysis',
    title: 'Performance Analysis',
    description: 'Analyze returns and performance ratios',
    icon: <BarChartIcon size={20} />,
    status: 'pending',
    route: 'performance-analysis'
  },
  {
    id: 'optimization',
    title: 'Portfolio Optimization',
    description: 'Optimize portfolio allocation',
    icon: <TargetIcon size={20} />,
    status: 'pending',
    route: 'optimization'
  },
  {
    id: 'strategy-comparison',
    title: 'Strategy Comparison',
    description: 'Compare with benchmark strategies',
    icon: <BarChartIcon size={20} />,
    status: 'pending',
    route: 'strategy-comparison'
  },
  {
    id: 'report-generation',
    title: 'Report Generation',
    description: 'Generate detailed analysis report',
    icon: <FileTextIcon size={20} />,
    status: 'pending',
    route: 'report-generation'
  },
  {
    id: 'export-results',
    title: 'Export Results',
    description: 'Download reports and data',
    icon: <DownloadIcon size={20} />,
    status: 'pending',
    route: 'export-results'
  }
];

export const SidebarStepNavigation: React.FC<SidebarStepNavigationProps> = ({
  currentStep,
  onStepClick,
  className = "",
  isCollapsed = false
}) => {
  // Calculate progress
  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.id === currentStep);
  const completedSteps = currentStepIndex >= 0 ? currentStepIndex : 0;
  const progressPercentage = (completedSteps / WORKFLOW_STEPS.length) * 100;

  // Update step statuses based on current step
  const stepsWithStatus = WORKFLOW_STEPS.map((step, index) => {
    let status: StepStatus = 'pending';
    
    if (index < currentStepIndex) {
      status = 'completed';
    } else if (index === currentStepIndex) {
      status = 'current';
    }
    
    return { ...step, status };
  });

  const handleStepClick = (step: Step) => {
    // Only allow navigation to completed steps or current step
    if (step.status === 'completed' || step.status === 'current') {
      if (onStepClick) {
        onStepClick(step.id);
      }
    }
  };

  const getStepStyles = (step: Step) => {
    const baseStyles = "flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer group";
    
    switch (step.status) {
      case 'completed':
        return `${baseStyles} bg-green-50 hover:bg-green-100 border border-green-200`;
      case 'current':
        return `${baseStyles} bg-blue-50 border-2 border-blue-500 shadow-sm`;
      case 'pending':
      default:
        return `${baseStyles} bg-gray-50 hover:bg-gray-100 border border-gray-200 cursor-not-allowed opacity-60`;
    }
  };

  const getIconStyles = (step: Step) => {
    switch (step.status) {
      case 'completed':
        return "text-green-600";
      case 'current':
        return "text-blue-600";
      case 'pending':
      default:
        return "text-gray-400";
    }
  };

  const getTextStyles = (step: Step) => {
    switch (step.status) {
      case 'completed':
        return "text-green-800";
      case 'current':
        return "text-blue-800";
      case 'pending':
      default:
        return "text-gray-500";
    }
  };

  if (isCollapsed) {
    return (
      <div className={`w-16 bg-white border-r border-gray-200 shadow-sm ${className}`}>
        {/* Progress indicator for collapsed state */}
        <div className="p-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-600">
              {completedSteps}/{WORKFLOW_STEPS.length}
            </span>
          </div>
        </div>
        
        {/* Collapsed step icons */}
        <div className="space-y-2 px-2">
          {stepsWithStatus.map((step, index) => (
            <div
              key={step.id}
              onClick={() => handleStepClick(step)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                step.status === 'completed' ? 'bg-green-50 hover:bg-green-100' :
                step.status === 'current' ? 'bg-blue-50 border-2 border-blue-500' :
                'bg-gray-50 cursor-not-allowed opacity-60'
              }`}
              title={step.title}
            >
              <div className={getIconStyles(step)}>
                {step.status === 'completed' ? <CheckIcon size={16} /> : step.icon}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 bg-white border-r border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Analysis Workflow
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Follow these steps to complete your portfolio analysis
        </p>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Step {completedSteps + 1} of {WORKFLOW_STEPS.length}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        {stepsWithStatus.map((step, index) => (
          <div
            key={step.id}
            onClick={() => handleStepClick(step)}
            className={getStepStyles(step)}
          >
            {/* Step number and icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm mr-3">
              {step.status === 'completed' ? (
                <CheckIcon size={16} className="text-green-600" />
              ) : step.status === 'current' ? (
                <ClockIcon size={16} className="text-blue-600" />
              ) : (
                <span className="text-xs font-semibold text-gray-400">
                  {index + 1}
                </span>
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-1">
                <div className={`mr-2 ${getIconStyles(step)}`}>
                  {step.icon}
                </div>
                <h3 className={`font-medium text-sm ${getTextStyles(step)}`}>
                  {step.title}
                </h3>
              </div>
              <p className={`text-xs ${step.status === 'current' ? 'text-blue-600' : 'text-gray-500'}`}>
                {step.description}
              </p>
            </div>

            {/* Status indicator */}
            {step.status === 'current' && (
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p>💡 <strong>Tip:</strong> Click on completed steps to review your work</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarStepNavigation; 

