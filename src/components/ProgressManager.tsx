/**
 * Progress Manager Component
 * Shows all active operations with unified controls
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import ProgressIndicator from './ui/ProgressIndicator';
import { 
  progressIndicatorService, 
  ProgressUpdate, 
  ProgressSubscription 
} from '../services/ProgressIndicatorService';

interface ProgressManagerProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'center';
  maxVisible?: number;
  autoHide?: boolean;
  className?: string;
}

export const ProgressManager: React.FC<ProgressManagerProps> = ({
  position = 'top-right',
  maxVisible = 3,
  autoHide = true,
  className = ''
}) => {
  const [operations, setOperations] = useState<ProgressUpdate[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [subscription, setSubscription] = useState<ProgressSubscription | null>(null);

  useEffect(() => {
    // Subscribe to all progress updates
    const sub = progressIndicatorService.subscribeToAll((update) => {
      setOperations(current => {
        const existing = current.find(op => op.id === update.id);
        if (existing) {
          return current.map(op => op.id === update.id ? update : op);
        } else {
          return [...current, update];
        }
      });
    });

    setSubscription(sub);

    // Initial load of existing operations
    setOperations(progressIndicatorService.getAllOperations());

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      sub.unsubscribe();
    };
  }, []);

  // Filter out completed/cancelled operations after delay
  useEffect(() => {
    const cleanupTimer = setInterval(() => {
      setOperations(current => 
        current.filter(op => 
          op.stage !== 'completed' && 
          op.stage !== 'cancelled' && 
          op.stage !== 'error' ||
          Date.now() - op.lastUpdate < 2000
        )
      );
    }, 1000);

    return () => clearInterval(cleanupTimer);
  }, []);

  const activeOperations = operations.filter(op => 
    op.stage === 'initializing' || 
    op.stage === 'processing' || 
    op.stage === 'running'
  );

  const completedOperations = operations.filter(op => 
    op.stage === 'completed' || 
    op.stage === 'error' || 
    op.stage === 'cancelled'
  );

  const handleCancel = (operationId: string) => {
    progressIndicatorService.cancelOperation(operationId);
  };

  const handleCancelAll = () => {
    activeOperations.forEach(op => {
      if (op.canCancel) {
        progressIndicatorService.cancelOperation(op.id);
      }
    });
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';
    const positions = {
      'top-right': 'top-4 right-4',
      'bottom-right': 'bottom-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-left': 'bottom-4 left-4',
      'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
    };
    
    return `${baseClasses} ${positions[position]}`;
  };

  // Auto-hide when no operations
  if (autoHide && operations.length === 0) {
    return null;
  }

  // Collapsed view
  if (!isExpanded && activeOperations.length > 0) {
    const mainOperation = activeOperations[0];
    return (
      <div className={`${getPositionClasses()} ${className}`}>
        <div className="bg-white rounded-lg shadow-lg border max-w-sm">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                Operations ({activeOperations.length})
              </span>
              <div className="flex space-x-1">
                {activeOperations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(true)}
                    className="h-6 w-6 p-0"
                  >
                    ↗
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOperations([])}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
            
            <ProgressIndicator
              progress={mainOperation}
              onCancel={() => handleCancel(mainOperation.id)}
              variant="minimal"
              size="sm"
            />
            
            {activeOperations.length > 1 && (
              <div className="text-xs text-gray-500 mt-1">
                +{activeOperations.length - 1} more operations
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  if (isExpanded || operations.length > 0) {
    return (
      <div className={`${getPositionClasses()} ${className}`}>
        <div className="bg-white rounded-lg shadow-lg border max-w-md">
          {/* Header */}
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Progress Operations
            </h3>
            <div className="flex space-x-1">
              {activeOperations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelAll}
                  className="text-xs"
                >
                  Cancel All
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                ↙
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOperations([])}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>

          {/* Active Operations */}
          {activeOperations.length > 0 && (
            <div className="p-3 space-y-3">
              <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Active Operations ({activeOperations.length})
              </h4>
              {activeOperations.slice(0, maxVisible).map(operation => (
                <ProgressIndicator
                  key={operation.id}
                  progress={operation}
                  onCancel={() => handleCancel(operation.id)}
                  variant="default"
                  size="sm"
                  showStage
                />
              ))}
              {activeOperations.length > maxVisible && (
                <div className="text-xs text-gray-500 text-center">
                  +{activeOperations.length - maxVisible} more operations
                </div>
              )}
            </div>
          )}

          {/* Completed Operations */}
          {completedOperations.length > 0 && (
            <div className="p-3 border-t space-y-2">
              <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Recent ({completedOperations.length})
              </h4>
              {completedOperations.slice(0, 2).map(operation => (
                <ProgressIndicator
                  key={operation.id}
                  progress={operation}
                  variant="minimal"
                  size="sm"
                  showTimeRemaining={false}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {operations.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm">No active operations</div>
              <div className="text-xs mt-1">
                Operations will appear here when started
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ProgressManager; 

