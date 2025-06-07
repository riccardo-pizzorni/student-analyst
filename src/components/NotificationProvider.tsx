import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // Default 5 seconds
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration (unless persistent)
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Listen for custom notification events from NotificationManager
  useEffect(() => {
    const handleCustomNotification = (event: CustomEvent) => {
      const { type, message, duration } = event.detail;
      
      // Parse title and message if message contains a colon
      const colonIndex = message.indexOf(': ');
      const title = colonIndex > 0 ? message.substring(0, colonIndex) : message;
      const content = colonIndex > 0 ? message.substring(colonIndex + 2) : '';
      
      addNotification({
        type,
        title,
        message: content,
        duration
      });
    };

    window.addEventListener('show-notification', handleCustomNotification as EventListener);
    
    return () => {
      window.removeEventListener('show-notification', handleCustomNotification as EventListener);
    };
  }, [addNotification]);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        addNotification, 
        removeNotification, 
        clearAll 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Enhanced Toast Notification Display Component
export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="space-y-2 pointer-events-auto">
        {notifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

// Individual Toast Notification Component with animations
const ToastNotification: React.FC<{
  notification: Notification;
  onRemove: (id: string) => void;
  index: number;
}> = ({ notification, onRemove, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Handle auto-dismiss and progress bar
  useEffect(() => {
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      startTimeRef.current = Date.now();
      
      // Start progress bar animation
      const updateProgress = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, 100 - (elapsed / notification.duration!) * 100);
        setProgress(remaining);
        
        if (remaining > 0) {
          progressTimerRef.current = window.setTimeout(updateProgress, 50);
        }
      };
      
      updateProgress();
      
      // Set auto-dismiss timer
      timerRef.current = window.setTimeout(() => {
        handleRemove();
      }, notification.duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    };
  }, [notification.duration, notification.persistent]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const resumeTimer = () => {
    if (!notification.persistent && notification.duration && !timerRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, notification.duration - elapsed);
      
      if (remaining > 0) {
        const updateProgress = () => {
          const currentElapsed = Date.now() - startTimeRef.current;
          const currentRemaining = Math.max(0, 100 - (currentElapsed / notification.duration!) * 100);
          setProgress(currentRemaining);
          
          if (currentRemaining > 0) {
            progressTimerRef.current = window.setTimeout(updateProgress, 50);
          }
        };
        
        updateProgress();
        
        timerRef.current = window.setTimeout(() => {
          handleRemove();
        }, remaining);
      }
    }
  };

  const getToastStyles = () => {
    const baseStyles = `
      relative w-full p-4 rounded-lg shadow-lg border-l-4 
      transform transition-all duration-300 ease-in-out
      backdrop-blur-sm bg-opacity-95 hover:bg-opacity-100
    `;
    
    const positionStyles = `
      ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${isExiting ? 'translate-x-full opacity-0 scale-95' : ''}
    `;
    
    let typeStyles = '';
    switch (notification.type) {
      case 'success':
        typeStyles = 'bg-green-50 border-green-400 text-green-800 shadow-green-100';
        break;
      case 'error':
        typeStyles = 'bg-red-50 border-red-400 text-red-800 shadow-red-100';
        break;
      case 'warning':
        typeStyles = 'bg-yellow-50 border-yellow-400 text-yellow-800 shadow-yellow-100';
        break;
      case 'info':
        typeStyles = 'bg-blue-50 border-blue-400 text-blue-800 shadow-blue-100';
        break;
      default:
        typeStyles = 'bg-gray-50 border-gray-400 text-gray-800 shadow-gray-100';
    }

    return `${baseStyles} ${positionStyles} ${typeStyles}`;
  };

  const getIcon = () => {
    const iconBase = "text-xl flex-shrink-0 mr-3";
    
    switch (notification.type) {
      case 'success':
        return <span className={`${iconBase} text-green-600`}>✅</span>;
      case 'error':
        return <span className={`${iconBase} text-red-600`}>❌</span>;
      case 'warning':
        return <span className={`${iconBase} text-yellow-600`}>⚠️</span>;
      case 'info':
        return <span className={`${iconBase} text-blue-600`}>ℹ️</span>;
      default:
        return <span className={`${iconBase} text-gray-600`}>📢</span>;
    }
  };

  const getProgressBarColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-400';
      case 'error':
        return 'bg-red-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'info':
        return 'bg-blue-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div
      className={getToastStyles()}
      style={{ 
        zIndex: 1000 - (index),
        marginBottom: index > 0 ? '8px' : '0'
      }}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      role="alert"
      aria-live="polite"
    >
      {/* Progress bar */}
      {!notification.persistent && notification.duration && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 bg-opacity-30 rounded-b-lg overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ease-linear ${getProgressBarColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      <div className="flex items-start">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm leading-tight">
            {notification.title}
          </div>
          <div className="text-sm mt-1 text-opacity-90 leading-relaxed">
            {notification.message}
          </div>
          
          {/* Action buttons for persistent error notifications */}
          {notification.type === 'error' && notification.persistent && (
            <div className="mt-2 flex space-x-2">
              <button
                onClick={(_e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={(_e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="ml-3 flex-shrink-0 text-xl hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 rounded"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Convenience hooks for common notification types
export const useApiNotifications = () => {
  const { addNotification } = useNotifications();

  const notifyApiError = useCallback((error: Error, context?: string) => {
    addNotification({
      type: 'error',
      title: 'API Connection Error',
      message: context 
        ? `${context}: ${error.message}`
        : `Failed to fetch data: ${error.message}`,
      duration: 8000,
    });
  }, [addNotification]);

  const notifyApiSuccess = useCallback((message: string) => {
    addNotification({
      type: 'success',
      title: 'Data Updated',
      message,
      duration: 3000,
    });
  }, [addNotification]);

  const notifyApiTimeout = useCallback((context?: string) => {
    addNotification({
      type: 'warning',
      title: 'Request Timeout',
      message: context 
        ? `${context} is taking longer than expected. Please try again.`
        : 'The request is taking longer than expected. Please try again.',
      duration: 6000,
    });
  }, [addNotification]);

  const notifyApiRetry = useCallback((attempt: number, maxAttempts: number, context?: string) => {
    if (attempt === maxAttempts) {
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: context 
          ? `Unable to connect to ${context} after ${maxAttempts} attempts.`
          : `Failed to fetch data after ${maxAttempts} attempts.`,
        duration: 10000,
      });
    }
  }, [addNotification]);

  return {
    notifyApiError,
    notifyApiSuccess,
    notifyApiTimeout,
    notifyApiRetry,
  };
};

// Enhanced Toast notification hooks with feedback system
export const useToastFeedback = () => {
  const { addNotification } = useNotifications();

  const showSuccessToast = useCallback((title: string, message: string, options?: { duration?: number }) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration: options?.duration ?? 3000,
    });
  }, [addNotification]);

  const showErrorToast = useCallback((title: string, message: string, options?: { persistent?: boolean; duration?: number }) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: options?.duration ?? 8000,
      persistent: options?.persistent ?? false,
    });
  }, [addNotification]);

  const showWarningToast = useCallback((title: string, message: string, options?: { duration?: number }) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: options?.duration ?? 6000,
    });
  }, [addNotification]);

  const showInfoToast = useCallback((title: string, message: string, options?: { duration?: number; persistent?: boolean }) => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration: options?.duration ?? 5000,
      persistent: options?.persistent ?? false,
    });
  }, [addNotification]);

  const showLoadingToast = useCallback((title: string, message: string) => {
    return addNotification({
      type: 'info',
      title,
      message,
      persistent: true,
    });
  }, [addNotification]);

  return {
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    showLoadingToast,
  };
};

// Financial-specific toast notifications
export const useFinancialToasts = () => {
  const { showSuccessToast, showErrorToast, showWarningToast, showInfoToast, showLoadingToast } = useToastFeedback();

  const notifyCalculationStart = useCallback((calculationType: string) => {
    return showLoadingToast(
      'Calculation in Progress',
      `Running ${calculationType} analysis...`
    );
  }, [showLoadingToast]);

  const notifyCalculationSuccess = useCallback((calculationType: string, duration: number, engine?: string) => {
    return showSuccessToast(
      'Calculation Complete',
      `${calculationType} completed successfully in ${duration}ms${engine ? ` using ${engine}` : ''}`
    );
  }, [showSuccessToast]);

  const notifyCalculationError = useCallback((calculationType: string, error: string) => {
    return showErrorToast(
      'Calculation Failed',
      `${calculationType} failed: ${error}`,
      { persistent: true }
    );
  }, [showErrorToast]);

  const notifyDataValidation = useCallback((issue: string) => {
    return showWarningToast(
      'Data Validation Warning',
      issue
    );
  }, [showWarningToast]);

  const notifyApiConnection = useCallback((apiName: string, status: 'connecting' | 'connected' | 'error', details?: string) => {
    switch (status) {
      case 'connecting':
        return showLoadingToast(
          'Connecting to API',
          `Establishing connection to ${apiName}...`
        );
      case 'connected':
        return showSuccessToast(
          'API Connected',
          `Successfully connected to ${apiName}`,
          { duration: 2000 }
        );
      case 'error':
        return showErrorToast(
          'API Connection Failed',
          `Unable to connect to ${apiName}${details ? `: ${details}` : ''}`,
          { persistent: true }
        );
    }
  }, [showLoadingToast, showSuccessToast, showErrorToast]);

  const notifyPerformanceIssue = useCallback((operation: string, actualTime: number, expectedTime: number) => {
    return showWarningToast(
      'Performance Warning',
      `${operation} took ${actualTime}ms (expected <${expectedTime}ms). Consider optimizing data size.`
    );
  }, [showWarningToast]);

  const notifyFallbackUsed = useCallback((primarySystem: string, fallbackSystem: string, reason?: string) => {
    return showInfoToast(
      'Fallback System Active',
      `Switched from ${primarySystem} to ${fallbackSystem}${reason ? `: ${reason}` : ''}`,
      { duration: 4000 }
    );
  }, [showInfoToast]);

  return {
    notifyCalculationStart,
    notifyCalculationSuccess,
    notifyCalculationError,
    notifyDataValidation,
    notifyApiConnection,
    notifyPerformanceIssue,
    notifyFallbackUsed,
  };
}; 

