/**
 * STUDENT ANALYST - Intelligent Fallback Manager
 * Manages automatic fallback logic with consecutive failure tracking and smart recovery
 */

import { NotificationManager } from './NotificationManager';

export interface ProviderStatus {
  id: string;
  name: string;
  isEnabled: boolean;
  consecutiveFailures: number;
  totalFailures: number;
  totalSuccesses: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  isTemporarilyDisabled: boolean;
  disabledUntil?: Date;
  healthScore: number; // 0-100
}

export interface FallbackConfig {
  maxConsecutiveFailures: number; // Default: 3
  temporaryDisableDuration: number; // Minutes to disable after max failures
  recoveryTestInterval: number; // Minutes between recovery tests
  enableNotifications: boolean;
  autoRecovery: boolean;
}

export interface FallbackEvent {
  type: 'failure' | 'success' | 'provider_disabled' | 'provider_enabled' | 'fallback_triggered' | 'recovery_attempt';
  providerId: string;
  timestamp: Date;
  message: string;
  consecutiveFailures?: number;
}

/**
 * Intelligent Fallback Manager that handles automatic provider switching
 * based on consecutive failures and smart recovery logic
 */
export class FallbackManager {
  private static instance: FallbackManager;
  
  private providers: Map<string, ProviderStatus> = new Map();
  private config: FallbackConfig;
  private eventHistory: FallbackEvent[] = [];
  private notificationManager: NotificationManager;
  
  private constructor() {
    this.config = {
      maxConsecutiveFailures: 3,
      temporaryDisableDuration: 15, // 15 minutes
      recoveryTestInterval: 5, // 5 minutes
      enableNotifications: true,
      autoRecovery: true
    };
    
    this.notificationManager = NotificationManager.getInstance();
    
    // Start recovery monitoring if auto-recovery is enabled
    if (this.config.autoRecovery) {
      this.startRecoveryMonitoring();
    }
  }
  
  public static getInstance(): FallbackManager {
    if (!FallbackManager.instance) {
      FallbackManager.instance = new FallbackManager();
    }
    return FallbackManager.instance;
  }
  
  /**
   * Register a provider with the fallback manager
   */
  public registerProvider(id: string, name: string, initiallyEnabled = true): void {
    this.providers.set(id, {
      id,
      name,
      isEnabled: initiallyEnabled,
      consecutiveFailures: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      isTemporarilyDisabled: false,
      healthScore: 100
    });
    
    this.logEvent({
      type: 'provider_enabled',
      providerId: id,
      timestamp: new Date(),
      message: `Provider ${name} registered and enabled`
    });
  }
  
  /**
   * Record a successful operation for a provider
   */
  public recordSuccess(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (!provider) return;
    
    const wasTemporarilyDisabled = provider.isTemporarilyDisabled;
    
    // Reset consecutive failures on success
    provider.consecutiveFailures = 0;
    provider.totalSuccesses++;
    provider.lastSuccessTime = new Date();
    provider.isTemporarilyDisabled = false;
    provider.disabledUntil = undefined;
    
    // Improve health score
    provider.healthScore = Math.min(100, provider.healthScore + 2);
    
    this.logEvent({
      type: 'success',
      providerId,
      timestamp: new Date(),
      message: `${provider.name} operation successful`,
      consecutiveFailures: 0
    });
    
    // Notify if provider was recovered
    if (wasTemporarilyDisabled && this.config.enableNotifications) {
      this.notificationManager.showSuccess(
        `✅ ${provider.name} is back online`,
        `Connection restored successfully after recovery.`
      );
    }
  }
  
  /**
   * Record a failed operation for a provider
   */
  public recordFailure(providerId: string, error?: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    
    provider.consecutiveFailures++;
    provider.totalFailures++;
    provider.lastFailureTime = new Date();
    
    // Degrade health score
    provider.healthScore = Math.max(0, provider.healthScore - 5);
    
    this.logEvent({
      type: 'failure',
      providerId,
      timestamp: new Date(),
      message: error || `${provider.name} operation failed`,
      consecutiveFailures: provider.consecutiveFailures
    });
    
    // Check if we need to disable the provider
    if (provider.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      this.temporarilyDisableProvider(providerId);
      return true; // Indicates fallback should be triggered
    }
    
    // Show warning for repeated failures
    if (provider.consecutiveFailures === 2 && this.config.enableNotifications) {
      this.notificationManager.showWarning(
        `⚠️ ${provider.name} issues detected`,
        `${provider.consecutiveFailures} consecutive failures. Monitoring closely.`
      );
    }
    
    return false;
  }
  
  /**
   * Temporarily disable a provider after max consecutive failures
   */
  private temporarilyDisableProvider(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (!provider) return;
    
    provider.isTemporarilyDisabled = true;
    provider.disabledUntil = new Date(Date.now() + this.config.temporaryDisableDuration * 60 * 1000);
    provider.healthScore = Math.max(0, provider.healthScore - 20);
    
    this.logEvent({
      type: 'provider_disabled',
      providerId,
      timestamp: new Date(),
      message: `${provider.name} temporarily disabled after ${provider.consecutiveFailures} consecutive failures`
    });
    
    if (this.config.enableNotifications) {
      this.notificationManager.showError(
        `🚫 ${provider.name} temporarily disabled`,
        `Too many failures detected. Automatically switching to backup provider.`,
        8000 // Longer duration for important messages
      );
    }
  }
  
  /**
   * Get list of available (enabled and not temporarily disabled) providers
   */
  public getAvailableProviders(): ProviderStatus[] {
    const now = Date.now();
    
    return Array.from(this.providers.values())
      .filter(provider => {
        // Check if provider is enabled
        if (!provider.isEnabled) return false;
        
        // Check if temporary disable period has expired
        if (provider.isTemporarilyDisabled && provider.disabledUntil) {
          if (now >= provider.disabledUntil.getTime()) {
            // Re-enable provider for testing
            provider.isTemporarilyDisabled = false;
            provider.disabledUntil = undefined;
            return true;
          }
          return false;
        }
        
        return !provider.isTemporarilyDisabled;
      })
      .sort((a, b) => {
        // Sort by health score (higher is better)
        if (b.healthScore !== a.healthScore) {
          return b.healthScore - a.healthScore;
        }
        
        // Then by consecutive failures (lower is better)
        return a.consecutiveFailures - b.consecutiveFailures;
      });
  }
  
  /**
   * Get the best available provider
   */
  public getBestProvider(): ProviderStatus | null {
    const available = this.getAvailableProviders();
    return available.length > 0 ? available[0] : null;
  }
  
  /**
   * Check if fallback should be triggered for a specific provider
   */
  public shouldTriggerFallback(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    
    return provider.consecutiveFailures >= this.config.maxConsecutiveFailures ||
           provider.isTemporarilyDisabled;
  }
  
  /**
   * Manually enable/disable a provider
   */
  public setProviderEnabled(providerId: string, enabled: boolean): void {
    const provider = this.providers.get(providerId);
    if (!provider) return;
    
    provider.isEnabled = enabled;
    
    if (enabled) {
      // Reset temporary disable when manually enabled
      provider.isTemporarilyDisabled = false;
      provider.disabledUntil = undefined;
      provider.consecutiveFailures = 0;
    }
    
    this.logEvent({
      type: enabled ? 'provider_enabled' : 'provider_disabled',
      providerId,
      timestamp: new Date(),
      message: `${provider.name} manually ${enabled ? 'enabled' : 'disabled'}`
    });
    
         if (this.config.enableNotifications) {
       const message = enabled 
         ? `✅ ${provider.name} manually enabled`
         : `🚫 ${provider.name} manually disabled`;
       
       if (enabled) {
         this.notificationManager.showSuccess(message);
       } else {
         this.notificationManager.showWarning(message);
       }
     }
  }
  
  /**
   * Get comprehensive status of all providers
   */
  public getProvidersStatus(): ProviderStatus[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Get fallback statistics
   */
  public getStatistics() {
    const providers = Array.from(this.providers.values());
    const totalProviders = providers.length;
    const enabledProviders = providers.filter(p => p.isEnabled).length;
    const availableProviders = this.getAvailableProviders().length;
    const healthyProviders = providers.filter(p => p.healthScore > 80).length;
    
    const totalFailures = providers.reduce((sum, p) => sum + p.totalFailures, 0);
    const totalSuccesses = providers.reduce((sum, p) => sum + p.totalSuccesses, 0);
    const totalOperations = totalFailures + totalSuccesses;
    const successRate = totalOperations > 0 ? totalSuccesses / totalOperations : 0;
    
    return {
      totalProviders,
      enabledProviders,
      availableProviders,
      healthyProviders,
      totalOperations,
      successRate,
      fallbackEvents: this.eventHistory.filter(e => e.type === 'fallback_triggered').length,
      lastFallback: this.eventHistory
        .filter(e => e.type === 'fallback_triggered')
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.timestamp
    };
  }
  
  /**
   * Get recent events for monitoring
   */
  public getRecentEvents(limit = 20): FallbackEvent[] {
    // Return the most recent events, newest first
    return this.eventHistory.slice(-limit).reverse();
  }
  
  /**
   * Update fallback configuration
   */
  public updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart recovery monitoring if auto-recovery setting changed
    if ('autoRecovery' in newConfig) {
      if (newConfig.autoRecovery) {
        this.startRecoveryMonitoring();
      }
    }
  }
  
  /**
   * Reset all provider statistics
   */
  public resetStatistics(): void {
    for (const provider of this.providers.values()) {
      provider.totalSuccesses = 0;
      provider.totalFailures = 0;
      provider.consecutiveFailures = 0;
      provider.healthScore = 100;
    }
    if (this.config.enableNotifications && typeof this.notificationManager.showInfo === 'function') {
      this.notificationManager.showInfo('📊 Statistics reset', 'All provider statistics have been reset.');
    }
  }
  
  /**
   * Log an event to the history
   */
  private logEvent(event: FallbackEvent): void {
    this.eventHistory.push(event);
    
    // Keep only last 1000 events to prevent memory issues
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }
  }
  
  /**
   * Start monitoring for provider recovery
   */
  private startRecoveryMonitoring(): void {
    // For testability, allow manual invocation in tests
    if (typeof global !== 'undefined' && (global as any).__TEST_MODE__) return;
    setInterval(() => this.attemptProviderRecovery(), this.config.recoveryTestInterval * 60 * 1000);
  }
  
  /**
   * Attempt to recover temporarily disabled providers
   */
  private attemptProviderRecovery(): void {
    const now = Date.now();
    
    for (const provider of this.providers.values()) {
      if (provider.isTemporarilyDisabled && provider.disabledUntil) {
        if (now >= provider.disabledUntil.getTime()) {
          // Time to test recovery
          provider.isTemporarilyDisabled = false;
          provider.disabledUntil = undefined;
          
          this.logEvent({
            type: 'recovery_attempt',
            providerId: provider.id,
            timestamp: new Date(),
            message: `Attempting recovery for ${provider.name}`
          });
          
          if (this.config.enableNotifications) {
            this.notificationManager.showInfo(
              `🔄 Testing ${provider.name} recovery`,
              'Attempting to restore connection...'
            );
          }
        }
      }
    }
  }
}

// Export singleton instance
export const fallbackManager = FallbackManager.getInstance();
export default FallbackManager; 
