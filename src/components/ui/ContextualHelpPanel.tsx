import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { HelpContent } from '../../hooks/useContextualHelp';

interface ContextualHelpPanelProps {
  helpItems: HelpContent[];
  isVisible: boolean;
  position: 'top-right' | 'bottom-right' | 'floating';
  onDismiss: (helpId: string) => void;
  onToggleVisibility: () => void;
  onClearAll: () => void;
}

// Icons for different help types
const HelpIcon = ({ type, className }: { type: HelpContent['type']; className?: string }) => {
  const iconClasses = cn("w-5 h-5", className);
  
  switch (type) {
    case 'tip':
      return (
        <svg className={cn(iconClasses, "text-blue-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={cn(iconClasses, "text-yellow-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'error':
      return (
        <svg className={cn(iconClasses, "text-red-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'performance':
      return (
        <svg className={cn(iconClasses, "text-orange-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'best-practice':
      return (
        <svg className={cn(iconClasses, "text-green-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

// Individual help item component
const HelpItem = ({ 
  help, 
  onDismiss 
}: { 
  help: HelpContent; 
  onDismiss: (id: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeColors = {
    tip: 'border-blue-200 bg-blue-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
    performance: 'border-orange-200 bg-orange-50',
    'best-practice': 'border-green-200 bg-green-50'
  };

  const priorityIndicators = {
    low: '',
    medium: 'border-l-4 border-l-yellow-400',
    high: 'border-l-4 border-l-orange-400',
    critical: 'border-l-4 border-l-red-500 animate-pulse'
  };

  return (
    <div 
      className={cn(
        "rounded-lg border p-3 mb-2 transition-all duration-200",
        typeColors[help.type],
        priorityIndicators[help.priority],
        isExpanded ? 'shadow-md' : 'shadow-sm'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          <HelpIcon type={help.type} />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm mb-1">
              {help.title}
            </h4>
            <p className={cn(
              "text-sm text-gray-700 leading-relaxed",
              !isExpanded && help.message.length > 100 ? "line-clamp-2" : ""
            )}>
              {help.message}
            </p>
            
            {/* Actions */}
            {help.actions && help.actions.length > 0 && (
              <div className="mt-2 flex gap-2">
                {help.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {/* Expand button for long messages */}
          {help.message.length > 100 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title={isExpanded ? "Riduci" : "Espandi"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                />
              </svg>
            </button>
          )}
          
          {/* Dismiss button */}
          {help.dismissible && (
            <button
              onClick={() => onDismiss(help.id)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Chiudi"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export function ContextualHelpPanel({
  helpItems,
  isVisible,
  position,
  onDismiss,
  onToggleVisibility,
  onClearAll
}: ContextualHelpPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'floating': 'top-1/2 right-4 transform -translate-y-1/2'
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className={cn(
          "fixed z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors",
          positionClasses[position]
        )}
        title="Mostra aiuto contestuale"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed z-40 w-80 max-h-96 bg-white border border-gray-200 rounded-lg shadow-xl",
        positionClasses[position]
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-gray-900">
            Aiuto Contestuale
          </h3>
          {helpItems.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              {helpItems.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Clear all button */}
          {helpItems.length > 1 && (
            <button
              onClick={onClearAll}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Chiudi tutto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          
          {/* Minimize button */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title={isMinimized ? "Espandi" : "Riduci"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isMinimized ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} 
              />
            </svg>
          </button>
          
          {/* Hide button */}
          <button
            onClick={onToggleVisibility}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Nascondi pannello"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3 max-h-80 overflow-y-auto">
          {helpItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-sm">
                Nessun aiuto contestuale disponibile.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                I suggerimenti appariranno in base alle tue azioni.
              </p>
            </div>
          ) : (
            <div>
              {helpItems.map((help) => (
                <HelpItem
                  key={help.id}
                  help={help}
                  onDismiss={onDismiss}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 