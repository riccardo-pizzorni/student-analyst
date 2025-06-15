/**
 * useProgressIndicator Hook
 * Simplifies integration of progress indicators in components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  progressIndicatorService, 
  ProgressUpdate, 
  ProgressSubscription 
} from '../services/ProgressIndicatorService';

interface UseProgressIndicatorOptions {
  autoStart?: boolean;
  initialMessage?: string;
  canCancel?: boolean;
  onCancel?: () => void;
  onComplete?: (result?: any) => void;
  onError?: (error: Error) => void;
  metadata?: Record<string, any>;
}

interface ProgressController {
  id: string;
  start: (message?: string) => void;
  update: (percentage: number, message?: string, stage?: string) => void;
  complete: (message?: string, result?: any) => void;
  fail: (error: string | Error) => void;
  cancel: () => boolean;
  setMetadata: (metadata: Record<string, any>) => void;
  progress: ProgressUpdate | null;
  isActive: boolean;
  isCompleted: boolean;
  isError: boolean;
  isCancelled: boolean;
}

export const useProgressIndicator = (
  operationId?: string,
  options: UseProgressIndicatorOptions = {}
): ProgressController => {
  const {
    autoStart = false,
    initialMessage = 'Starting...',
    canCancel = true,
    onCancel,
    onComplete,
    onError,
    metadata
  } = options;

  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const subscriptionRef = useRef<ProgressSubscription | null>(null);
  const idRef = useRef<string>(operationId || `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const start = useCallback((message?: string) => {
    const startMessage = message || initialMessage;
    progressIndicatorService.startOperation(
      idRef.current,
      startMessage,
      canCancel,
      metadata
    );

    // Set up cancellation callback
    if (canCancel && onCancel) {
      progressIndicatorService.setCancellationCallback(idRef.current, onCancel);
    }
  }, [initialMessage, canCancel, onCancel, metadata]);

  const update = useCallback((percentage: number, message?: string, stage?: string) => {
    progressIndicatorService.updateProgress(idRef.current, percentage, message, stage);
  }, []);

  const complete = useCallback((message?: string, result?: any) => {
    progressIndicatorService.completeOperation(idRef.current, message || 'Completed');
    if (onComplete) {
      onComplete(result);
    }
  }, [onComplete]);

  const fail = useCallback((error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error;
    progressIndicatorService.failOperation(idRef.current, errorMessage);
    if (onError) {
      const errorObj = error instanceof Error ? error : new Error(_error);
      onError(errorObj);
    }
  }, [onError]);

  const cancel = useCallback((): boolean => {
    return progressIndicatorService.cancelOperation(idRef.current);
  }, []);

  const setMetadata = useCallback((newMetadata: Record<string, any>) => {
    const currentProgress = progressIndicatorService.getProgress(idRef.current);
    if (currentProgress) {
      progressIndicatorService.updateProgress(
        idRef.current,
        currentProgress.percentage,
        currentProgress.message,
        currentProgress.stage,
        newMetadata
      );
    }
  }, []);

  // Subscribe to progress updates
  useEffect(() => {
    const subscription = progressIndicatorService.subscribe(idRef.current, (update) => {
      setProgress(update);
    });

    subscriptionRef.current = subscription;

    // Auto-start if requested
    if (autoStart) {
      start();
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [start, autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel operation if still active
      if (progress && (progress.stage === 'initializing' || progress.stage === 'processing')) {
        progressIndicatorService.cancelOperation(idRef.current);
      }
    };
  }, []);

  return {
    id: idRef.current,
    start,
    update,
    complete,
    fail,
    cancel,
    setMetadata,
    progress,
    isActive: progress ? (progress.stage === 'initializing' || progress.stage === 'processing' || progress.stage === 'running') : false,
    isCompleted: progress?.stage === 'completed' || false,
    isError: progress?.stage === 'error' || false,
    isCancelled: progress?.stage === 'cancelled' || false
  };
};

/**
 * Hook for tracking multiple operations
 */
export const useMultipleProgressIndicators = () => {
  const [operations, setOperations] = useState<ProgressUpdate[]>([]);
  const subscriptionRef = useRef<ProgressSubscription | null>(null);

  useEffect(() => {
    const subscription = progressIndicatorService.subscribeToAll((update) => {
      setOperations(current => {
        const existing = current.find(op => op.id === update.id);
        if (existing) {
          return current.map(op => op.id === update.id ? update : op);
        } else {
          return [...current, update];
        }
      });
    });

    subscriptionRef.current = subscription;

    // Load existing operations
    setOperations(progressIndicatorService.getAllOperations());

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const cancelAll = useCallback(() => {
    operations.forEach(op => {
      if (op.canCancel && (op.stage === 'initializing' || op.stage === 'processing' || op.stage === 'running')) {
        progressIndicatorService.cancelOperation(op.id);
      }
    });
  }, [operations]);

  const getActiveOperations = useCallback(() => {
    return operations.filter(op => 
      op.stage === 'initializing' || 
      op.stage === 'processing' || 
      op.stage === 'running'
    );
  }, [operations]);

  const getCompletedOperations = useCallback(() => {
    return operations.filter(op => 
      op.stage === 'completed' || 
      op.stage === 'error' || 
      op.stage === 'cancelled'
    );
  }, [operations]);

  return {
    operations,
    activeOperations: getActiveOperations(),
    completedOperations: getCompletedOperations(),
    cancelAll,
    hasActiveOperations: getActiveOperations().length > 0
  };
};

export default useProgressIndicator; 