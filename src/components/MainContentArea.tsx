/**
 * Main Content Area Component
 * 
 * Area principale responsive con auto-save, loading states e error boundary per step
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import AutoSaveIndicator, { AutoSaveStatus } from './AutoSaveIndicator';
import LoadingState from './LoadingState';

export interface StepData {
  stepId: string;
  stepName: string;
  data: any;
  isDirty: boolean;
  lastSaved?: Date;
}

export interface MainContentAreaProps {
  currentStep: string;
  stepName: string;
  children: ReactNode;
  
  // Auto-save props
  enableAutoSave?: boolean;
  autoSaveStatus?: AutoSaveStatus;
  lastSaved?: Date | null;
  onDataChange?: (data: any) => void;
  
  // Loading props
  isLoading?: boolean;
  loadingMessage?: string;
  loadingProgress?: number;
  loadingVariant?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'progress';
  
  // Layout props
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  showHeader?: boolean;
  
  // Error boundary props
  errorFallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  
  // Responsive props
  mobileBreakpoint?: string;
  tabletBreakpoint?: string;
}

export const MainContentArea: React.FC<MainContentAreaProps> = ({
  currentStep,
  stepName,
  children,
  
  // Auto-save
  enableAutoSave = true,
  autoSaveStatus = 'idle',
  lastSaved,
  onDataChange,
  
  // Loading
  isLoading = false,
  loadingMessage = 'Loading...',
  loadingProgress,
  loadingVariant = 'spinner',
  
  // Layout
  className = '',
  maxWidth = 'xl',
  padding = 'lg',
  showHeader = true,
  
  // Error boundary
  errorFallback,
  onError,
  
  // Responsive
  mobileBreakpoint = '768px',
  tabletBreakpoint = '1024px'
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < parseInt(mobileBreakpoint));
      setIsTablet(width >= parseInt(mobileBreakpoint) && width < parseInt(tabletBreakpoint));
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [mobileBreakpoint, tabletBreakpoint]);

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-xl';
    }
  };

  const getPaddingClass = () => {
    switch (padding) {
      case 'none': return '';
      case 'sm': return 'p-4';
      case 'md': return 'p-6';
      case 'lg': return 'p-8';
      case 'xl': return 'p-12';
      default: return 'p-8';
    }
  };

  const getResponsivePadding = () => {
    if (isMobile) {
      return 'p-4'; // Sempre padding ridotto su mobile
    } else if (isTablet) {
      return 'p-6'; // Padding medio su tablet
    }
    return getPaddingClass(); // Padding completo su desktop
  };

  const containerClasses = `
    w-full mx-auto
    ${getMaxWidthClass()}
    ${getResponsivePadding()}
    ${isMobile ? 'min-h-screen' : 'min-h-[600px]'}
    ${className}
  `;

  const headerClasses = `
    flex flex-col space-y-4 mb-6
    ${isMobile ? 'pb-4 border-b border-gray-200' : ''}
  `;

  const contentClasses = `
    relative
    ${isLoading ? 'min-h-[400px]' : ''}
  `;

  const StepErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
    <ErrorBoundary 
      fallback={errorFallback || (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Step Error
            </h3>
            <p className="text-gray-600 mb-4">
              An error occurred in step "{stepName}". Your data is safe.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );

  return (
    <div className={containerClasses}>
      {/* Header with step info and auto-save indicator */}
      {showHeader && (
        <div className={headerClasses}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {stepName}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Step {currentStep} • Financial Analysis Workflow
              </p>
            </div>
            
            {enableAutoSave && (
              <div className="flex-shrink-0">
                <AutoSaveIndicator
                  status={autoSaveStatus}
                  lastSaved={lastSaved}
                  stepName={stepName}
                  variant={isMobile ? 'compact' : 'full'}
                  showStepName={!isMobile}
                  showLastSaved={true}
                />
              </div>
            )}
          </div>
          
          {/* Progress indicator for mobile */}
          {isMobile && isLoading && loadingProgress !== undefined && (
            <div className="w-full">
              <LoadingState
                isLoading={true}
                variant="progress"
                progress={loadingProgress}
                message={loadingMessage}
                size="sm"
                className="py-2"
              />
            </div>
          )}
        </div>
      )}

      {/* Main content area with error boundary */}
      <div className={contentClasses}>
        <StepErrorBoundary>
          <LoadingState
            isLoading={isLoading}
            variant={loadingVariant}
            message={loadingMessage}
            progress={loadingProgress}
            size={isMobile ? 'md' : 'lg'}
            overlay={!isMobile} // Overlay solo su desktop
            fullScreen={isMobile && isLoading} // Full screen loading su mobile
          >
            {/* Responsive content wrapper */}
            <div className={`
              ${isMobile ? 'space-y-4' : 'space-y-6'}
              ${isTablet ? 'grid grid-cols-1 gap-6' : ''}
            `}>
              {children}
            </div>
          </LoadingState>
        </StepErrorBoundary>
      </div>

      {/* Bottom spacing for mobile navigation */}
      {isMobile && (
        <div className="h-20" />
      )}
    </div>
  );
};

// Hook helper per gestire dati del step
export const useStepData = (stepId: string, initialData: any = {}) => {
  const [data, setData] = useState(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const updateData = (newData: any) => {
    setData(newData);
    setIsDirty(true);
    
    // Simula auto-save con debouncing
    setAutoSaveStatus('saving');
    
    const timer = setTimeout(() => {
      setIsDirty(false);
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      
      // Reset to idle after showing "saved" status
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2000);
    }, 1000);

    return () => clearTimeout(timer);
  };

  return {
    data,
    isDirty,
    autoSaveStatus,
    lastSaved,
    updateData,
    setData
  };
};

export default MainContentArea; 

