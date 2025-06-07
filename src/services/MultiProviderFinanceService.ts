/**
 * STUDENT ANALYST - Multi-Provider Finance Service
 * Combines Alpha Vantage and Yahoo Finance with intelligent fallback and load balancing
 */

import { AlphaVantageError } from './AlphaVantageService';
import { yahooFinanceService, YahooFinanceError } from './YahooFinanceService';
import { enhancedAlphaVantageService } from './EnhancedAlphaVantageService';
import { fallbackManager } from './FallbackManager';
import { preferenceManager } from './PreferenceManager';
import { notificationManager } from './NotificationManager';
import { dataConsistencyChecker } from './DataConsistencyChecker';

// Unified interfaces
export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

export interface StockData {
  symbol: string;
  timeframe: Timeframe;
  data: StockDataPoint[];
  metadata: {
    lastRefreshed: string;
    timeZone: string;
    dataSource: 'ALPHA_VANTAGE' | 'YAHOO_FINANCE' | 'MULTI_PROVIDER';
    requestTime: string;
    provider?: string;
    fallbackUsed?: boolean;
  };
}

export type Timeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INTRADAY_1MIN' | 'INTRADAY_5MIN' | 'INTRADAY_15MIN';

export interface MultiProviderError extends AlphaVantageError {
  primaryProvider?: string;
  fallbackProvider?: string;
  allProvidersFailed?: boolean;
}

export interface ApiCallOptions {
  symbol: string;
  timeframe?: Timeframe;
  startDate?: string;
  endDate?: string;
  timeout?: number;
  preferredProvider?: 'alpha_vantage' | 'yahoo_finance' | 'auto';
  enableFallback?: boolean;
}

export interface ProviderConfig {
  name: string;
  priority: number;
  enabled: boolean;
  maxRetries: number;
  healthScore: number; // 0-100
  lastFailure?: Date;
  successCount: number;
  failureCount: number;
}

export interface ProviderStats {
  requests: number;
  successes: number;
  failures: number;
  avgResponseTime: number;
  lastUsed: Date;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

/**
 * Multi-provider service that intelligently routes requests between Alpha Vantage and Yahoo Finance
 */
export class MultiProviderFinanceService {
  private static instance: MultiProviderFinanceService;
  
  private providers: Map<string, ProviderConfig> = new Map();
  private providerStats: Map<string, ProviderStats> = new Map();
  private lastProviderUsed: string | null = null;
  
  private constructor() {
    this.initializeProviders();
    this.initializeFallbackManager();
  }
  
  public static getInstance(): MultiProviderFinanceService {
    if (!MultiProviderFinanceService.instance) {
      MultiProviderFinanceService.instance = new MultiProviderFinanceService();
    }
    return MultiProviderFinanceService.instance;
  }
  
  /**
   * Initialize provider configurations
   */
  private initializeProviders(): void {
    this.providers.set('alpha_vantage', {
      name: 'Alpha Vantage',
      priority: 1,
      enabled: true,
      maxRetries: 3,
      healthScore: 100,
      successCount: 0,
      failureCount: 0
    });
    
    this.providers.set('yahoo_finance', {
      name: 'Yahoo Finance',
      priority: 2,
      enabled: true,
      maxRetries: 3,
      healthScore: 100,
      successCount: 0,
      failureCount: 0
    });
    
    // Initialize stats
    this.providerStats.set('alpha_vantage', {
      requests: 0,
      successes: 0,
      failures: 0,
      avgResponseTime: 0,
      lastUsed: new Date(),
      healthStatus: 'healthy'
    });
    
    this.providerStats.set('yahoo_finance', {
      requests: 0,
      successes: 0,
      failures: 0,
      avgResponseTime: 0,
      lastUsed: new Date(),
      healthStatus: 'healthy'
    });
  }

  /**
   * Initialize fallback manager with registered providers
   */
  private initializeFallbackManager(): void {
    // Register providers with the fallback manager
    fallbackManager.registerProvider('alpha_vantage', 'Alpha Vantage', true);
    fallbackManager.registerProvider('yahoo_finance', 'Yahoo Finance', true);
    
    // Configure fallback settings based on user preferences
    const prefs = preferenceManager.getPreferences();
    fallbackManager.updateConfig({
      maxConsecutiveFailures: prefs.maxConsecutiveFailures,
      enableNotifications: prefs.enableNotifications,
      autoRecovery: prefs.enableAutoFallback
    });
  }
  
  /**
   * Main method to get stock data with intelligent provider selection
   */
  public async getStockData(options: ApiCallOptions): Promise<StockData> {
    const startTime = Date.now();
    
    // Determine provider order based on preferences and health
    const providers = this.selectProviders(options);
    
    let lastError: MultiProviderError | null = null;
    
    for (const providerName of providers) {
      try {
        console.log(`Attempting to fetch data using ${providerName}...`);
        
        const data = await this.fetchFromProvider(providerName, options);
        
        // Success - update stats and return
        this.updateProviderStats(providerName, true, Date.now() - startTime);
        fallbackManager.recordSuccess(providerName);
        
        // Show data source notification
        notificationManager.showDataSourceNotification(
          providerName === 'alpha_vantage' ? 'Alpha Vantage' : 'Yahoo Finance',
          data.symbol,
          true,
          this.lastProviderUsed !== providerName
        );
        
        return {
          ...data,
          metadata: {
            ...data.metadata,
            dataSource: 'MULTI_PROVIDER',
            provider: providerName,
            fallbackUsed: this.lastProviderUsed !== providerName
          }
        };
        
      } catch (error) {
        console.warn(`Provider ${providerName} failed:`, error);
        
        lastError = this.createMultiProviderError(error as AlphaVantageError | YahooFinanceError, {
          primaryProvider: providers[0],
          fallbackProvider: providerName,
          allProvidersFailed: false
        });
        
        this.updateProviderStats(providerName, false, Date.now() - startTime);
        
        // Record failure in fallback manager and check if fallback should be triggered
        const errorMessage = error instanceof Error ? error.message : String(error);
        const shouldFallback = fallbackManager.recordFailure(providerName, errorMessage);
        
        if (shouldFallback && providers.length > 1) {
          // Show provider switch notification if this was the primary provider
          if (providerName === providers[0]) {
            const nextProvider = providers[1];
            notificationManager.showProviderSwitchNotification(
              providerName === 'alpha_vantage' ? 'Alpha Vantage' : 'Yahoo Finance',
              nextProvider === 'alpha_vantage' ? 'Alpha Vantage' : 'Yahoo Finance',
              'has encountered repeated failures'
            );
          }
        }
        
        // Continue to next provider
        continue;
      }
    }
    
    // All providers failed
    if (lastError) {
      lastError.allProvidersFailed = true;
      lastError.userFriendlyMessage = 'All data providers are currently unavailable. Please try again later.';
      throw lastError;
    }
    
    throw new Error('No providers available');
  }
  
  /**
   * Select providers in order of preference using fallback manager
   */
  private selectProviders(options: ApiCallOptions): string[] {
    // Get available providers from fallback manager (excludes temporarily disabled)
    const fallbackProviders = fallbackManager.getAvailableProviders();
    const availableProviderIds = fallbackProviders.map(p => p.id);
    
    // Filter our local providers by fallback manager's availability
    const availableProviders = Array.from(this.providers.entries())
      .filter(([id, config]) => config.enabled && availableProviderIds.includes(id))
      .sort((a, b) => {
        // Sort by health score first, then priority
        const healthDiff = b[1].healthScore - a[1].healthScore;
        if (healthDiff !== 0) return healthDiff;
        return a[1].priority - b[1].priority;
      })
      .map(([name]) => name);
    
    // Get user preference for provider
    const userPreference = preferenceManager.getPreference('preferredDataSource');
    
    // Handle preferred provider (user preference overrides options)
    const preferredProvider = options.preferredProvider || userPreference;
    if (preferredProvider && preferredProvider !== 'auto') {
      if (availableProviders.includes(preferredProvider)) {
        // Move preferred to front
        return [preferredProvider, ...availableProviders.filter(p => p !== preferredProvider)];
      }
    }
    
    // Load balancing: alternate between providers if both are healthy
    if (availableProviders.length >= 2 && options.enableFallback !== false) {
      const [first, second] = availableProviders;
      const firstConfig = this.providers.get(first)!;
      const secondConfig = this.providers.get(second)!;
      
      // If both providers are equally healthy, alternate
      if (Math.abs(firstConfig.healthScore - secondConfig.healthScore) < 10) {
        if (this.lastProviderUsed === first) {
          return [second, first, ...availableProviders.slice(2)];
        }
      }
    }
    
    return availableProviders;
  }
  
  /**
   * Fetch data from specific provider
   */
  private async fetchFromProvider(providerName: string, options: ApiCallOptions): Promise<StockData> {
    this.lastProviderUsed = providerName;
    
    switch (providerName) {
      case 'alpha_vantage': {
        // Use enhanced service for better error handling
        const result = await enhancedAlphaVantageService.getStockData({
          ...options,
          enableSymbolValidation: true,
          enableUserFeedback: false
        });
        return result.data!;
      }
        
      case 'yahoo_finance':
        return await yahooFinanceService.getStockData(options);
        
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }
  
  /**
   * Update provider statistics
   */
  private updateProviderStats(providerName: string, success: boolean, responseTime: number): void {
    const stats = this.providerStats.get(providerName);
    const config = this.providers.get(providerName);
    
    if (!stats || !config) return;
    
    stats.requests++;
    stats.lastUsed = new Date();
    
    if (success) {
      stats.successes++;
      config.successCount++;
      
      // Update average response time
      stats.avgResponseTime = ((stats.avgResponseTime * (stats.successes - 1)) + responseTime) / stats.successes;
      
      // Improve health score
      config.healthScore = Math.min(100, config.healthScore + 1);
      
    } else {
      stats.failures++;
      config.failureCount++;
      config.lastFailure = new Date();
      
      // Degrade health score
      config.healthScore = Math.max(0, config.healthScore - 10);
    }
    
    // Update health status
    const successRate = stats.successes / stats.requests;
    if (successRate > 0.9 && config.healthScore > 80) {
      stats.healthStatus = 'healthy';
    } else if (successRate > 0.7 && config.healthScore > 50) {
      stats.healthStatus = 'degraded';
    } else {
      stats.healthStatus = 'unhealthy';
    }
  }
  
  /**
   * Create multi-provider error
   */
  private createMultiProviderError(
    originalError: AlphaVantageError | YahooFinanceError, 
    context: Partial<MultiProviderError>
  ): MultiProviderError {
    return {
      ...originalError,
      ...context
    };
  }
  
  /**
   * Get health status of all providers
   */
  public getProviderHealthStatus(): Array<{
    name: string;
    enabled: boolean;
    healthScore: number;
    healthStatus: string;
    successRate: number;
    avgResponseTime: number;
    lastUsed: Date;
    requests: number;
  }> {
    return Array.from(this.providers.entries()).map(([name, config]) => {
      const stats = this.providerStats.get(name)!;
      const successRate = stats.requests > 0 ? stats.successes / stats.requests : 0;
      
      return {
        name: config.name,
        enabled: config.enabled,
        healthScore: config.healthScore,
        healthStatus: stats.healthStatus,
        successRate,
        avgResponseTime: stats.avgResponseTime,
        lastUsed: stats.lastUsed,
        requests: stats.requests
      };
    });
  }
  
  /**
   * Enable/disable a specific provider
   */
  public setProviderEnabled(providerName: string, enabled: boolean): void {
    const config = this.providers.get(providerName);
    if (config) {
      config.enabled = enabled;
    }
  }
  
  /**
   * Reset provider statistics
   */
  public resetProviderStats(): void {
    for (const [name, config] of this.providers) {
      config.healthScore = 100;
      config.successCount = 0;
      config.failureCount = 0;
      config.lastFailure = undefined;
      
      const stats = this.providerStats.get(name)!;
      stats.requests = 0;
      stats.successes = 0;
      stats.failures = 0;
      stats.avgResponseTime = 0;
      stats.healthStatus = 'healthy';
    }
  }
  
  /**
   * Test connectivity to all providers
   */
  public async testAllProviders(): Promise<Array<{
    provider: string;
    status: 'success' | 'failure';
    responseTime: number;
    error?: string;
  }>> {
    const results = [];
    
    for (const providerName of this.providers.keys()) {
      const startTime = Date.now();
      
      try {
        await this.fetchFromProvider(providerName, {
          symbol: 'AAPL',
          timeframe: 'DAILY'
        });
        
        results.push({
          provider: providerName,
          status: 'success' as const,
          responseTime: Date.now() - startTime
        });
        
      } catch (error) {
        results.push({
          provider: providerName,
          status: 'failure' as const,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return results;
  }
  
  /**
   * Get comprehensive service statistics
   */
  public getServiceStats() {
    const totalRequests = Array.from(this.providerStats.values())
      .reduce((sum, stats) => sum + stats.requests, 0);
    
    const totalSuccesses = Array.from(this.providerStats.values())
      .reduce((sum, stats) => sum + stats.successes, 0);
    
    const avgResponseTime = Array.from(this.providerStats.values())
      .filter(stats => stats.avgResponseTime > 0)
      .reduce((sum, stats, _, arr) => sum + stats.avgResponseTime / arr.length, 0);
    
    return {
      totalRequests,
      totalSuccesses,
      successRate: totalRequests > 0 ? totalSuccesses / totalRequests : 0,
      avgResponseTime,
      activeProviders: Array.from(this.providers.values()).filter(p => p.enabled).length,
      healthyProviders: Array.from(this.providerStats.values()).filter(s => s.healthStatus === 'healthy').length,
      lastProviderUsed: this.lastProviderUsed
    };
  }

  /**
   * Run consistency check between Alpha Vantage and Yahoo Finance data
   */
  public async runConsistencyCheck(symbol: string, timeframe: Timeframe = 'DAILY') {
    try {
      console.log(`🔍 Running consistency check for ${symbol}...`);
      
      // Get data from both providers
      const alphaData = await this.fetchFromProvider('alpha_vantage', { symbol, timeframe, enableFallback: false });
      const yahooData = await this.fetchFromProvider('yahoo_finance', { symbol, timeframe, enableFallback: false });
      
      // Convert to StockDataPoint format for consistency checker
      const alphaPoints = alphaData.data.map(d => ({
        ...d,
        source: 'alpha_vantage' as const
      }));
      
      const yahooPoints = yahooData.data.map(d => ({
        ...d,
        source: 'yahoo_finance' as const
      }));
      
      // Run consistency check
      const report = await dataConsistencyChecker.checkConsistency(
        alphaPoints,
        yahooPoints,
        symbol
      );
      
      return report;
      
    } catch (error) {
      console.error('Consistency check failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const multiProviderFinanceService = MultiProviderFinanceService.getInstance();
export default MultiProviderFinanceService; 
