import React, { useState, useEffect, useRef } from 'react';
import { Notification } from './NotificationProvider';

interface ToastProps {
  notification: Notification;
  onRemove: (id: string) => void;
  index: number;
}

export const Toast: React.FC<ToastProps> = ({ notification, onRemove, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
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
          progressTimerRef.current = setTimeout(updateProgress, 50); // Update every 50ms for smooth animation
        }
      };
      
      updateProgress();
      
      // Set auto-dismiss timer
      timerRef.current = setTimeout(() => {
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
    }, 300); // Match exit animation duration
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
        // Resume progress bar
        const updateProgress = () => {
          const currentElapsed = Date.now() - startTimeRef.current;
          const currentRemaining = Math.max(0, 100 - (currentElapsed / notification.duration!) * 100);
          setProgress(currentRemaining);
          
          if (currentRemaining > 0) {
            progressTimerRef.current = setTimeout(updateProgress, 50);
          }
        };
        
        updateProgress();
        
        // Resume auto-dismiss
        timerRef.current = setTimeout(() => {
          handleRemove();
        }, remaining);
      }
    }
  };

  const getToastStyles = () => {
    const baseStyles = `
      relative w-full max-w-sm p-4 rounded-lg shadow-lg border-l-4 
      transform transition-all duration-300 ease-in-out cursor-pointer
      backdrop-blur-sm bg-opacity-95 hover:bg-opacity-100
    `;
    
    // Position and animation styles
    const positionStyles = `
      translate-x-0 
      ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${isExiting ? 'translate-x-full opacity-0 scale-95' : ''}
    `;
    
    // Type-specific styles
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
        zIndex: 1000 - (index), // Stack notifications properly
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
          
          {/* Optional action buttons for important notifications */}
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

// Enhanced Toast Container with better positioning and animations
export const ToastContainer: React.FC = () => {
  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-0 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="space-y-2 pointer-events-auto">
        {/* Individual toasts will be rendered here */}
      </div>
    </div>
  );
};

// Toast animation variants for different entrance effects
export const TOAST_ANIMATIONS = {
  slideIn: 'animate-slide-in-right',
  fadeIn: 'animate-fade-in',
  bounceIn: 'animate-bounce-in',
  slideDown: 'animate-slide-in-down'
} as const;

// Toast priority levels for better organization
export const TOAST_PRIORITIES = {
  low: 1,
  normal: 2,
  high: 3,
  critical: 4
} as const;

export type ToastPriority = typeof TOAST_PRIORITIES[keyof typeof TOAST_PRIORITIES];

// Extended notification interface with toast-specific properties
export interface ToastNotification extends Notification {
  priority?: ToastPriority;
  animation?: keyof typeof TOAST_ANIMATIONS;
  sound?: boolean;
  vibrate?: boolean;
}

// Utility functions for creating specific toast types
export const createToastNotification = {
  success: (title: string, message: string, options?: Partial<ToastNotification>): Omit<ToastNotification, 'id'> => ({
    type: 'success',
    title,
    message,
    duration: 3000,
    priority: TOAST_PRIORITIES.normal,
    ...options
  }),
  
  error: (title: string, message: string, options?: Partial<ToastNotification>): Omit<ToastNotification, 'id'> => ({
    type: 'error',
    title,
    message,
    duration: 8000,
    priority: TOAST_PRIORITIES.high,
    persistent: options?.persistent ?? false,
    ...options
  }),
  
  warning: (title: string, message: string, options?: Partial<ToastNotification>): Omit<ToastNotification, 'id'> => ({
    type: 'warning',
    title,
    message,
    duration: 6000,
    priority: TOAST_PRIORITIES.normal,
    ...options
  }),
  
  info: (title: string, message: string, options?: Partial<ToastNotification>): Omit<ToastNotification, 'id'> => ({
    type: 'info',
    title,
    message,
    duration: 5000,
    priority: TOAST_PRIORITIES.low,
    ...options
  }),
  
  loading: (title: string, message: string): Omit<ToastNotification, 'id'> => ({
    type: 'info',
    title,
    message,
    persistent: true,
    priority: TOAST_PRIORITIES.normal
  })
}; 

