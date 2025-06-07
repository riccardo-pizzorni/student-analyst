/**
 * Auto Save Indicator Component
 * 
 * Mostra lo stato del salvataggio automatico con animazioni e feedback visivo
 */

import React, { useState, useEffect } from 'react';
import { SaveIcon, CheckIcon, ClockIcon } from './ui/icons';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline' | 'conflict';

export interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date | null;
  stepName?: string;
  className?: string;
  showLastSaved?: boolean;
  showStepName?: boolean;
  variant?: 'compact' | 'full' | 'minimal';
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSaved,
  stepName,
  className = '',
  showLastSaved = true,
  showStepName = false,
  variant = 'compact'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show/hide logic based on status
  useEffect(() => {
    if (status === 'saving' || status === 'saved' || status === 'error') {
      setIsVisible(true);
    } else if (status === 'idle') {
      // Hide after a delay when idle
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <SaveIcon size={16} className="animate-pulse" />,
          text: 'Saving...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'saved':
        return {
          icon: <CheckIcon size={16} className="text-green-600" />,
          text: 'Saved',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'error':
        return {
          icon: <span className="text-red-600">⚠️</span>,
          text: 'Save failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'offline':
        return {
          icon: <span className="text-orange-600">📡</span>,
          text: 'Offline',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'conflict':
        return {
          icon: <span className="text-yellow-600">⚡</span>,
          text: 'Conflict',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          icon: <ClockIcon size={16} className="text-gray-400" />,
          text: 'Ready',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const config = getStatusConfig();

  if (!isVisible && status === 'idle') {
    return null;
  }

  // Minimal variant - just an icon
  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center ${className}`} title={config.text}>
        {config.icon}
      </div>
    );
  }

  // Compact variant - icon and text
  if (variant === 'compact') {
    return (
      <div className={`
        inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium
        ${config.bgColor} ${config.color} ${config.borderColor} border
        transition-all duration-300 ease-in-out
        ${className}
      `}>
        {config.icon}
        <span>{config.text}</span>
        {showLastSaved && lastSaved && status === 'saved' && (
          <span className="text-xs opacity-75">
            • {formatLastSaved(lastSaved)}
          </span>
        )}
      </div>
    );
  }

  // Full variant - complete information
  return (
    <div className={`
      flex items-center space-x-3 p-3 rounded-lg border
      ${config.bgColor} ${config.borderColor}
      transition-all duration-300 ease-in-out
      ${className}
    `}>
      <div className="flex-shrink-0">
        {config.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${config.color}`}>
            {config.text}
          </span>
          {showStepName && stepName && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600 truncate">
                {stepName}
              </span>
            </>
          )}
        </div>
        
        {showLastSaved && lastSaved && (
          <div className="text-xs text-gray-500 mt-1">
            Last saved: {formatLastSaved(lastSaved)}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoSaveIndicator; 

