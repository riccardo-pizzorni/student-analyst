/**
 * Loading State Component
 * 
 * Componente universale per gestire stati di caricamento
 * con diversi stili e animazioni
 */

import React from 'react';
import { ProgressIndicator } from './ui/ProgressIndicator';

export type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'progress';

export interface LoadingStateProps {
  isLoading: boolean;
  variant?: LoadingVariant;
  message?: string;
  progress?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showMessage?: boolean;
  children?: React.ReactNode;
  fullScreen?: boolean;
  overlay?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  variant = 'spinner',
  message = 'Loading...',
  progress,
  className = '',
  size = 'md',
  showMessage = true,
  children,
  fullScreen = false,
  overlay = false
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-4',
          spinner: 'w-6 h-6',
          text: 'text-sm',
          dots: 'text-lg'
        };
      case 'md':
        return {
          container: 'p-6',
          spinner: 'w-8 h-8',
          text: 'text-base',
          dots: 'text-2xl'
        };
      case 'lg':
        return {
          container: 'p-8',
          spinner: 'w-12 h-12',
          text: 'text-lg',
          dots: 'text-3xl'
        };
      case 'xl':
        return {
          container: 'p-12',
          spinner: 'w-16 h-16',
          text: 'text-xl',
          dots: 'text-4xl'
        };
      default:
        return {
          container: 'p-6',
          spinner: 'w-8 h-8',
          text: 'text-base',
          dots: 'text-2xl'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const renderSpinner = () => (
    <div className={`${sizeClasses.spinner} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`} />
  );

  const renderDots = () => (
    <div className={`flex space-x-1 ${sizeClasses.dots}`}>
      <div className="animate-bounce">•</div>
      <div className="animate-bounce" style={{ animationDelay: '0.1s' }}>•</div>
      <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</div>
    </div>
  );

  const renderPulse = () => (
    <div className="flex space-x-2">
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-3 w-full max-w-md">
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
    </div>
  );

  const renderProgress = () => {
    if (progress !== undefined) {
      return (
        <div className="w-full max-w-md">
                     <ProgressIndicator 
             progress={{
               id: 'loading-progress',
               percentage: progress,
               message: message,
               stage: 'processing',
               canCancel: false,
               lastUpdate: Date.now(),
               startTime: Date.now(),
               estimatedTimeRemaining: undefined
             }}
             variant="default"
             showStage={false}
             showTimeRemaining={false}
           />
        </div>
      );
    }
    return renderSpinner();
  };

  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      case 'progress':
        return renderProgress();
      default:
        return renderSpinner();
    }
  };

  const containerClasses = `
    flex flex-col items-center justify-center text-center
    ${sizeClasses.container}
    ${fullScreen ? 'min-h-screen' : ''}
    ${overlay ? 'absolute inset-0 bg-white bg-opacity-75 z-50' : ''}
    ${className}
  `;

  const content = (
    <div className={containerClasses}>
      {renderLoadingIndicator()}
      
      {showMessage && variant !== 'skeleton' && (
        <div className={`mt-4 ${sizeClasses.text} text-gray-600 font-medium`}>
          {message}
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="relative">
        {children}
        {content}
      </div>
    );
  }

  return content;
};

// Specialized loading components for common use cases

export const SkeletonLoader: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div 
        key={index}
        className="h-4 bg-gray-200 rounded animate-pulse"
        style={{ width: `${100 - (index * 10)}%` }}
      />
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 border rounded-lg ${className}`}>
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number; className?: string }> = ({ 
  rows = 5, 
  cols = 4, 
  className = '' 
}) => (
  <div className={`border rounded-lg overflow-hidden ${className}`}>
    <div className="bg-gray-50 px-6 py-3 border-b">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-4 bg-gray-200 rounded animate-pulse"
                style={{ animationDelay: `${(rowIndex * cols + colIndex) * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingState; 

