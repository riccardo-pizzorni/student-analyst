import { NotificationManager } from './NotificationManager';

export interface ErrorContext {
  component: string;
  operation: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
  timestamp: Date;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private notificationManager: NotificationManager;
  private errorHistory: ErrorReport[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;

  private constructor() {
    this.notificationManager = NotificationManager.getInstance();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: Error, context: ErrorContext, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    const report: ErrorReport = {
      error,
      context,
      severity,
      handled: false,
      timestamp: new Date()
    };

    this.errorHistory.push(report);
    if (this.errorHistory.length > this.MAX_HISTORY_SIZE) {
      this.errorHistory.shift();
    }

    this.notifyError(report);
    this.logError(report);
  }

  public getErrorHistory(): ErrorReport[] {
    return [...this.errorHistory];
  }

  public getRecentErrors(minutes: number = 60): ErrorReport[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorHistory.filter(report => report.timestamp >= cutoff);
  }

  public getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): ErrorReport[] {
    return this.errorHistory.filter(report => report.severity === severity);
  }

  public getErrorsByComponent(component: string): ErrorReport[] {
    return this.errorHistory.filter(report => report.context.component === component);
  }

  public clearHistory(): void {
    this.errorHistory = [];
  }

  private notifyError(report: ErrorReport): void {
    const message = this.formatErrorMessage(report);
    
    switch (report.severity) {
      case 'critical':
        this.notificationManager.showError(message);
        break;
      case 'high':
        this.notificationManager.showWarning(message);
        break;
      case 'medium':
        this.notificationManager.showWarning(message);
        break;
      case 'low':
        // Non notificare errori di bassa severità
        break;
    }
  }

  private logError(report: ErrorReport): void {
    const logMessage = this.formatLogMessage(report);
    console.error(logMessage);
    
    // Qui si potrebbe aggiungere l'invio del log a un servizio esterno
    // o la persistenza su file/database
  }

  private formatErrorMessage(report: ErrorReport): string {
    const { error, context, severity } = report;
    return `[${severity.toUpperCase()}] ${context.component}: ${error.message}`;
  }

  private formatLogMessage(report: ErrorReport): string {
    const { error, context, severity, timestamp } = report;
    return JSON.stringify({
      timestamp: timestamp.toISOString(),
      severity,
      component: context.component,
      operation: context.operation,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      metadata: context.metadata
    });
  }
} 