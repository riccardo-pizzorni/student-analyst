import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  error: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  url: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    this.setState({
      error,
      errorInfo
    });

    // Log to local storage for debugging
    this.logErrorLocally(error, errorInfo);
    
    // Log to console for development
    console.group('🚨 React Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // In produzione, invia l'errore a un servizio di monitoring
    if (process.env.NODE_ENV === 'production') {
      // Esempio: Sentry, LogRocket, etc.
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  private logErrorLocally = (error: Error, errorInfo: ErrorInfo): void => {
    try {
      const errorLog: ErrorLog = {
        id: this.state.errorId || `ERR_${Date.now()}`,
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack || undefined,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Get existing error logs
      const existingLogs = this.getErrorLogs();
      
      // Add new error log
      const updatedLogs = [errorLog, ...existingLogs].slice(0, 50); // Keep only last 50 errors
      
      // Save to localStorage
      localStorage.setItem('student_analyst_error_logs', JSON.stringify(updatedLogs));
      
    } catch (logError) {
      console.error('Failed to log error to localStorage:', logError);
    }
  };

  private getErrorLogs = (): ErrorLog[] => {
    try {
      const logs = localStorage.getItem('student_analyst_error_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    });
  };

  private handleReportError = (): void => {
    const { error, errorInfo, errorId } = this.state;
    
    // Create error report
    const errorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2)).then(() => {
      alert('Error report copied to clipboard. Please send this to our support team.');
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = JSON.stringify(errorReport, null, 2);
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Error report copied to clipboard. Please send this to our support team.');
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default professional fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md w-full text-center text-white border border-white/20">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-4">Oops! Qualcosa è andato storto</h1>
            <p className="text-white/80 mb-6 leading-relaxed">
              Si è verificato un errore inaspettato nell'applicazione. 
              Riprova o ricarica la pagina.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
              >
                🔄 Riprova
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
              >
                🔄 Ricarica Pagina
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If this issue persists, please contact our support team with the error ID above.
              </p>
            </div>

            {/* Development Mode Error Details */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-white/70 hover:text-white">
                  Dettagli Errore (Development)
                </summary>
                <div className="mt-3 p-3 bg-black/20 rounded text-xs font-mono text-left overflow-auto max-h-40">
                  <div className="text-red-300 mb-2">
                    <strong>Error:</strong> {this.state.error?.message}
                  </div>
                  <div className="text-gray-300">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1">
                      {this.state.error?.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div className="text-blue-300 mt-2">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based wrapper for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Utility function to manually trigger error boundary (for testing)
export const triggerErrorBoundary = (message: string = 'Manual error boundary test') => {
  throw new Error(message);
};

// Utility function to get error logs
export const getStoredErrorLogs = (): ErrorLog[] => {
  try {
    const logs = localStorage.getItem('student_analyst(error)_logs');
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
};

// Utility function to clear error logs
export const clearStoredErrorLogs = (): void => {
  try {
    localStorage.removeItem('student_analyst(error)_logs');
  } catch (error) {
    console.error('Failed to clear error logs:', (error));
  }
}; 

