/**
 * Progress Indicator Component
 * Reusable component for showing progress with real-time updates
 */

import React from 'react';
import { Button } from './button';
import { ProgressUpdate } from '../../services/ProgressIndicatorService';

interface ProgressIndicatorProps {
  progress: ProgressUpdate;
  onCancel?: () => void;
  showTimeRemaining?: boolean;
  showMessage?: boolean;
  showStage?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'detailed';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  onCancel,
  showTimeRemaining = true,
  showMessage = true,
  showStage = false,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const formatDuration = (milliseconds: number): string => {
    if (milliseconds < 1000) return 'Less than 1 second';
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getProgressColor = () => {
    switch (progress.stage) {
      case 'error': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const getContainerClass = () => {
    const sizeClasses = {
      sm: 'p-2',
      md: 'p-3',
      lg: 'p-4'
    };
    
    return `bg-white rounded-lg border ${sizeClasses[size]} ${className}`;
  };

  const getProgressBarHeight = () => {
    const heights = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    };
    
    return heights[size];
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`flex-1 bg-gray-200 rounded-full ${getProgressBarHeight()}`}>
          <div 
            className={`${getProgressColor()} ${getProgressBarHeight()} rounded-full transition-all duration-300`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600">
          {progress.percentage}%
        </span>
        {progress.canCancel && onCancel && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={getContainerClass()}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {showStage && (
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {progress.stage}
            </span>
          )}
          <span className="text-sm font-medium text-gray-900">
            {progress.percentage}%
          </span>
        </div>
        
        {progress.canCancel && onCancel && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
            className="text-xs"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className={`w-full bg-gray-200 rounded-full ${getProgressBarHeight()} mb-2`}>
        <div 
          className={`${getProgressColor()} ${getProgressBarHeight()} rounded-full transition-all duration-300`}
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Message and Time */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        {showMessage && (
          <span className="flex-1 truncate">{progress.message}</span>
        )}
        
        {showTimeRemaining && progress.estimatedTimeRemaining !== undefined && (
          <span className="ml-2 text-nowrap">
            {formatDuration(progress.estimatedTimeRemaining)} remaining
          </span>
        )}
      </div>

      {/* Detailed info for 'detailed' variant */}
      {variant === 'detailed' && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span className="font-medium">Started:</span> {' '}
              {new Date(progress.startTime).toLocaleTimeString()}
            </div>
            <div>
              <span className="font-medium">Elapsed:</span> {' '}
              {formatDuration(Date.now() - progress.startTime)}
            </div>
          </div>
          
          {progress.metadata && Object.keys(progress.metadata).length > 0 && (
            <div className="mt-1">
              <span className="font-medium text-xs text-gray-500">Details:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(progress.metadata).map(([_key, value]) => (
                  <span 
                    key={key}
                    className="px-1.5 py-0.5 bg-gray-100 text-xs rounded"
                  >
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator; 