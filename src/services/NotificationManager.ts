/**
 * STUDENT ANALYST - Notification Manager
 * Centralized notification management that integrates with NotificationProvider
 */

// This is a singleton that wraps the existing NotificationProvider
// to provide a consistent API for notifications across the application

export interface NotificationOptions {
  duration?: number;
  persistent?: boolean;
}

export class NotificationManager {
  private static instance: NotificationManager;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }
  
  /**
   * Show success notification
   */
  public showSuccess(
    title: string, 
    message?: string, 
    duration?: number
  ): void {
    this.dispatchNotification('success', title, message, duration);
  }
  
  /**
   * Show error notification
   */
  public showError(
    title: string, 
    message?: string, 
    duration?: number
  ): void {
    this.dispatchNotification('error', title, message, duration);
  }
  
  /**
   * Show warning notification
   */
  public showWarning(
    title: string, 
    message?: string, 
    duration?: number
  ): void {
    this.dispatchNotification('warning', title, message, duration);
  }
  
  /**
   * Show info notification
   */
  public showInfo(
    title: string, 
    message?: string, 
    duration?: number
  ): void {
    this.dispatchNotification('info', title, message, duration);
  }
  
  /**
   * Dispatch notification using custom event system
   */
  private dispatchNotification(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message?: string,
    duration?: number
  ): void {
    // Create notification content
    const content = message ? `${title}: ${message}` : title;
    
    // Dispatch custom event that NotificationProvider can listen to
    const event = new CustomEvent('show-notification', {
      detail: {
        type,
        message: content,
        duration: duration || this.getDefaultDuration(type)
      }
    });
    
    // Dispatch on window object so it can be caught globally
    window.dispatchEvent(event);
  }
  
  /**
   * Get default duration based on notification type
   */
  private getDefaultDuration(type: string): number {
    switch (type) {
      case 'error':
        return 8000; // Errors stay longer
      case 'warning':
        return 6000; // Warnings stay medium time
      case 'success':
        return 4000; // Success messages shorter
      case 'info':
        return 5000; // Info messages default
      default:
        return 5000;
    }
  }
  
  /**
   * Show data source notification (specialized for financial data)
   */
  public showDataSourceNotification(
    source: string, 
    symbol: string, 
    success: boolean,
    fallbackUsed = false
  ): void {
    if (success) {
      const title = fallbackUsed 
        ? `📈 Data from ${source} (backup)`
        : `📈 Data from ${source}`;
      
      const message = fallbackUsed
        ? `${symbol} data retrieved successfully using backup provider`
        : `${symbol} data retrieved successfully`;
        
      this.showSuccess(title, message, 4000);
    } else {
      this.showError(
        `❌ ${source} failed`,
        `Unable to retrieve ${symbol} data`,
        6000
      );
    }
  }
  
  /**
   * Show provider switch notification
   */
  public showProviderSwitchNotification(
    fromProvider: string,
    toProvider: string,
    reason: string
  ): void {
    this.showWarning(
      `🔄 Switched to ${toProvider}`,
      `${fromProvider} ${reason}. Automatically using ${toProvider} for reliable data.`,
      7000
    );
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();
export default NotificationManager; 
