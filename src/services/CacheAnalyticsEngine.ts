/**
 * STUDENT ANALYST - Cache Analytics Engine
 * Intelligent analytics system for cache performance monitoring and user behavior analysis
 */

export interface CacheAccessPattern {
  key: string;
  accessCount: number;
  lastAccessed: number;
  firstAccessed: number;
  averageAccessInterval: number;
  peakAccessHours: number[];
  dataType: string;
  symbol?: string;
  hitRate: number;
  responseTime: number;
}

export interface UserBehaviorPattern {
  userId: string;
  sessionId: string;
  dailyPatterns: Record<number, number>; // hour -> access count
  weeklyPatterns: Record<number, number>; // day of week -> access count
  portfolioFocus: string[]; // most accessed symbols
  analysisMethods: string[]; // most used analysis types
  peakUsageHours: number[];
  averageSessionDuration: number;
  dataTypePreferences: Record<string, number>;
}

export interface CachePerformanceMetrics {
  overallHitRate: number;
  averageResponseTime: number;
  l1Performance: { hitRate: number; avgResponseTime: number };
  l2Performance: { hitRate: number; avgResponseTime: number };
  l3Performance: { hitRate: number; avgResponseTime: number };
  apiPerformance: { callCount: number; avgResponseTime: number };
  efficiency: {
    bandwidthSaved: number;
    apiCallsAvoided: number;
    timeSaved: number;
    costSaved: number;
  };
}

export interface PredictiveInsights {
  likelyNextRequests: Array<{
    key: string;
    probability: number;
    suggestedPreloadTime: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  warmingRecommendations: Array<{
    dataType: string;
    symbols: string[];
    timing: number;
    reason: string;
  }>;
  qualityIssues: Array<{
    key: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
}

export class CacheAnalyticsEngine {
  private accessPatterns: Map<string, CacheAccessPattern> = new Map();
  private userBehavior: UserBehaviorPattern = this.initializeUserBehavior();
  private performanceMetrics: CachePerformanceMetrics = this.initializePerformanceMetrics();
  private sessionStartTime: number;
  private currentSessionId: string;
  
  // Configuration
  private readonly PATTERN_STORAGEkey = 'student-analyst-cache-patterns';
  private readonly BEHAVIOR_STORAGEkey = 'student-analyst-user-behavior';
  private readonly MAX_PATTERN_HISTORY = 10000; // Maximum patterns to store
  private readonly ANALYSIS_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  constructor() {
    this.sessionStartTime = Date.now();
    this.currentSessionId = this.generateSessionId();
    this.userBehavior = this.initializeUserBehavior();
    this.performanceMetrics = this.initializePerformanceMetrics();
    this.loadStoredPatterns();
    this.schedulePeriodicAnalysis();
  }

  private initializeUserBehavior(): UserBehaviorPattern {
    return {
      userId: this.getUserId(),
      sessionId: this.currentSessionId,
      dailyPatterns: {},
      weeklyPatterns: {},
      portfolioFocus: [],
      analysisMethods: [],
      peakUsageHours: [],
      averageSessionDuration: 0,
      dataTypePreferences: {}
    };
  }

  private initializePerformanceMetrics(): CachePerformanceMetrics {
    return {
      overallHitRate: 0,
      averageResponseTime: 0,
      l1Performance: { hitRate: 0, avgResponseTime: 0 },
      l2Performance: { hitRate: 0, avgResponseTime: 0 },
      l3Performance: { hitRate: 0, avgResponseTime: 0 },
      apiPerformance: { callCount: 0, avgResponseTime: 0 },
      efficiency: {
        bandwidthSaved: 0,
        apiCallsAvoided: 0,
        timeSaved: 0,
        costSaved: 0
      }
    };
  }

  /**
   * Track cache access for analytics
   */
  trackCacheAccess(
    key: string, 
    hit: boolean, 
    layer: 'L1' | 'L2' | 'L3' | 'API',
    responseTime: number,
    dataSize?: number
  ): void {
    const now = Date.now();
    const hour = new Date(now).getHours();
    const dayOfWeek = new Date(now).getDay();
    
    // Update access patterns
    this.updateAccessPattern(key, hit, responseTime, dataSize);
    
    // Update user behavior
    this.updateUserBehavior(hour, dayOfWeek, key);
    
    // Update performance metrics
    this.updatePerformanceMetrics(layer, hit, responseTime);
    
    // Trigger predictive analysis
    this.triggerPredictiveAnalysis();
  }

  private updateAccessPattern(key: string, hit: boolean, responseTime: number, dataSize?: number): void {
    const now = Date.now();
    const pattern = this.accessPatterns.get(key) || this.createNewPattern(key);
    
    pattern.accessCount++;
    pattern.lastAccessed = now;
    
    // Calculate average access interval
    if (pattern.accessCount > 1) {
      const timeSinceFirst = now - pattern.firstAccessed;
      pattern.averageAccessInterval = timeSinceFirst / pattern.accessCount;
    }
    
    // Update peak access hours
    const hour = new Date(now).getHours();
    if (!pattern.peakAccessHours.includes(hour)) {
      pattern.peakAccessHours.push(hour);
    }
    
    // Update hit rate
    const totalRequests = pattern.accessCount;
    const hitCount = hit ? 1 : 0;
    pattern.hitRate = ((pattern.hitRate * (totalRequests - 1)) + hitCount) / totalRequests;
    
    // Update response time
    pattern.responseTime = ((pattern.responseTime * (totalRequests - 1)) + responseTime) / totalRequests;
    
    this.accessPatterns.set(key, pattern);
  }

  private createNewPattern(key: string): CacheAccessPattern {
    const now = Date.now();
    const { dataType, symbol } = this.parseKey(key);
    
    return {
      key,
      accessCount: 0,
      lastAccessed: now,
      firstAccessed: now,
      averageAccessInterval: 0,
      peakAccessHours: [],
      dataType,
      symbol,
      hitRate: 0,
      responseTime: 0
    };
  }

  private updateUserBehavior(hour: number, dayOfWeek: number, key: string): void {
    // Update daily patterns
    this.userBehavior.dailyPatterns[hour] = (this.userBehavior.dailyPatterns[hour] || 0) + 1;
    
    // Update weekly patterns
    this.userBehavior.weeklyPatterns[dayOfWeek] = (this.userBehavior.weeklyPatterns[dayOfWeek] || 0) + 1;
    
    // Update portfolio focus
    const { symbol, dataType } = this.parseKey(key);
    if (symbol && !this.userBehavior.portfolioFocus.includes(symbol)) {
      this.userBehavior.portfolioFocus.push(symbol);
      // Keep only top 50 symbols
      if (this.userBehavior.portfolioFocus.length > 50) {
        this.userBehavior.portfolioFocus = this.userBehavior.portfolioFocus.slice(-50);
      }
    }
    
    // Update data type preferences
    this.userBehavior.dataTypePreferences[dataType] = (this.userBehavior.dataTypePreferences[dataType] || 0) + 1;
    
    // Update peak usage hours
    if (!this.userBehavior.peakUsageHours.includes(hour)) {
      this.userBehavior.peakUsageHours.push(hour);
    }
  }

  private updatePerformanceMetrics(layer: string, hit: boolean, responseTime: number): void {
    // Update layer-specific metrics
    const layerMetrics = this.getLayerMetrics(layer);
    if (layerMetrics) {
      const newHitRate = hit ? 1 : 0;
      layerMetrics.hitRate = (layerMetrics.hitRate + newHitRate) / 2; // Simple moving average
      layerMetrics.avgResponseTime = (layerMetrics.avgResponseTime + responseTime) / 2;
    }
    
    // Update overall metrics
    this.performanceMetrics.averageResponseTime = (this.performanceMetrics.averageResponseTime + responseTime) / 2;
    
    if (hit) {
      this.performanceMetrics.efficiency.apiCallsAvoided++;
      this.performanceMetrics.efficiency.timeSaved += Math.max(0, 2000 - responseTime); // Assume API takes 2000ms
      this.performanceMetrics.efficiency.costSaved += 0.001; // Estimate cost per API call
    }
  }

  private getLayerMetrics(layer: string): { hitRate: number; avgResponseTime: number } | null {
    switch (layer) {
      case 'L1': return this.performanceMetrics.l1Performance;
      case 'L2': return this.performanceMetrics.l2Performance;
      case 'L3': return this.performanceMetrics.l3Performance;
      default: return null;
    }
  }

  /**
   * Generate predictive insights based on analytics
   */
  generatePredictiveInsights(): PredictiveInsights {
    const likelyNextRequests = this.predictLikelyRequests();
    const warmingRecommendations = this.generateWarmingRecommendations();
    const qualityIssues = this.detectQualityIssues();
    
    return {
      likelyNextRequests,
      warmingRecommendations,
      qualityIssues
    };
  }

  private predictLikelyRequests(): Array<{
    key: string;
    probability: number;
    suggestedPreloadTime: number;
    priority: 'high' | 'medium' | 'low';
  }> {
    const now = Date.now();
    const currentHour = new Date(now).getHours();
    const predictions: Array<any> = [];
    
    for (const [key, pattern] of this.accessPatterns) {
      // Calculate probability based on access patterns
      const hourProbability = pattern.peakAccessHours.includes(currentHour) ? 0.8 : 0.2;
      const frequencyProbability = Math.min(pattern.accessCount / 100, 1.0);
      const recencyProbability = Math.max(0, 1 - (now - pattern.lastAccessed) / (24 * 60 * 60 * 1000));
      
      const overallProbability = (hourProbability + frequencyProbability + recencyProbability) / 3;
      
      if (overallProbability > 0.3) {
        predictions.push({
          key,
          probability: overallProbability,
          suggestedPreloadTime: this.calculateOptimalPreloadTime(pattern),
          priority: this.calculatePriority(overallProbability)
        });
      }
    }
    
    return predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 20); // Top 20 predictions
  }

  private generateWarmingRecommendations(): Array<{
    dataType: string;
    symbols: string[];
    timing: number;
    reason: string;
  }> {
    const recommendations: Array<any> = [];
    const now = Date.now();
    const currentHour = new Date(now).getHours();
    
    // Analyze user behavior patterns
    const topDataTypes = Object.entries(this.userBehavior.dataTypePreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);
    
    const topSymbols = this.userBehavior.portfolioFocus.slice(-10); // Last 10 symbols
    
    // Generate recommendations based on time patterns
    if (this.isPeakUsageTime(currentHour)) {
      recommendations.push({
        dataType: 'stock-data',
        symbols: topSymbols,
        timing: now + (5 * 60 * 1000), // 5 minutes from now
        reason: 'Peak usage time detected'
      });
    }
    
    // Check for market open/close warming
    if (this.isMarketOpeningTime(currentHour)) {
      recommendations.push({
        dataType: 'market-data',
        symbols: ['SPY', 'QQQ', 'IWM'], // Major indices
        timing: now + (2 * 60 * 1000), // 2 minutes from now
        reason: 'Market opening detected'
      });
    }
    
    return recommendations;
  }

  private detectQualityIssues(): Array<{
    key: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }> {
    const issues: Array<any> = [];
    const now = Date.now();
    
    for (const [key, pattern] of this.accessPatterns) {
      // Check for stale data
      const dataAge = now - pattern.lastAccessed;
      if (dataAge > 24 * 60 * 60 * 1000) { // 24 hours
        issues.push({
          key,
          issue: 'Data older than 24 hours',
          severity: 'medium' as const,
          recommendation: 'Consider refreshing data'
        });
      }
      
      // Check for low hit rate
      if (pattern.hitRate < 0.5 && pattern.accessCount > 10) {
        issues.push({
          key,
          issue: 'Low cache hit rate',
          severity: 'high' as const,
          recommendation: 'Review TTL settings or data access patterns'
        });
      }
      
      // Check for slow response times
      if (pattern.responseTime > 1000) { // 1 second
        issues.push({
          key,
          issue: 'Slow response time',
          severity: 'medium' as const,
          recommendation: 'Optimize cache layer or data structure'
        });
      }
    }
    
    return issues;
  }

  /**
   * Get comprehensive analytics report
   */
  getAnalyticsReport(): {
    patterns: CacheAccessPattern[];
    behavior: UserBehaviorPattern;
    performance: CachePerformanceMetrics;
    insights: PredictiveInsights;
  } {
    return {
      patterns: Array.from(this.accessPatterns.values()),
      behavior: this.userBehavior,
      performance: this.performanceMetrics,
      insights: this.generatePredictiveInsights()
    };
  }

  /**
   * Get cache warming suggestions
   */
  getCacheWarmingSuggestions(): Array<{
    key: string;
    priority: number;
    estimatedBenefit: string;
  }> {
    const insights = this.generatePredictiveInsights();
    
    return insights.likelyNextRequests.map(req => ({
      key: req.key,
      priority: req.probability,
      estimatedBenefit: this.calculateEstimatedBenefit(req.probability)
    }));
  }

  // Utility methods
  private parseKey(key: string): { dataType: string; symbol?: string } {
    const parts = key.split(':');
    return {
      dataType: parts[0] || 'unknown',
      symbol: parts[1] || undefined
    };
  }

  private calculateOptimalPreloadTime(pattern: CacheAccessPattern): number {
    // Calculate based on average access interval
    const interval = pattern.averageAccessInterval || (60 * 60 * 1000); // Default 1 hour
    return Date.now() + (interval * 0.8); // Preload at 80% of expected interval
  }

  private calculatePriority(probability: number): 'high' | 'medium' | 'low' {
    if (probability > 0.7) return 'high';
    if (probability > 0.4) return 'medium';
    return 'low';
  }

  private calculateEstimatedBenefit(probability: number): string {
    const timeSaved = probability * 2000; // Assume 2 seconds saved on cache hit
    return `~${timeSaved.toFixed(0)}ms saved`;
  }

  private isPeakUsageTime(hour: number): boolean {
    return this.userBehavior.peakUsageHours.includes(hour);
  }

  private isMarketOpeningTime(hour: number): boolean {
    // US market opens at 9:30 AM EST
    return hour >= 9 && hour <= 10;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getUserId(): string {
    let userId = localStorage.getItem('student-analyst-user-id');
    if (!userId) {
      userId = 'user-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      localStorage.setItem('student-analyst-user-id', userId);
    }
    return userId;
  }

  private loadStoredPatterns(): void {
    try {
      const storedPatterns = localStorage.getItem(this.PATTERN_STORAGEkey);
      if (storedPatterns) {
        const patterns = JSON.parse(storedPatterns);
        this.accessPatterns = new Map(patterns);
      }
      
      const storedBehavior = localStorage.getItem(this.BEHAVIOR_STORAGEkey);
      if (storedBehavior) {
        const behavior = JSON.parse(storedBehavior);
        this.userBehavior = { ...this.userBehavior, ...behavior };
      }
    } catch (error) {
      console.warn('Failed to load stored analytics patterns:', error);
    }
  }

  private savePatterns(): void {
    try {
      // Convert Map to Array for storage
      const patternsArray = Array.from(this.accessPatterns.entries());
      localStorage.setItem(this.PATTERN_STORAGEkey, JSON.stringify(patternsArray));
      localStorage.setItem(this.BEHAVIOR_STORAGEkey, JSON.stringify(this.userBehavior));
    } catch (error) {
      console.warn('Failed to save analytics patterns:', error);
    }
  }

  private schedulePeriodicAnalysis(): void {
    // Save patterns every 5 minutes
    setInterval(() => {
      this.savePatterns();
    }, 5 * 60 * 1000);
    
    // Clean old patterns every hour
    setInterval(() => {
      this.cleanOldPatterns();
    }, 60 * 60 * 1000);
    
    // Generate insights every 30 minutes
    setInterval(() => {
      this.triggerPredictiveAnalysis();
    }, 30 * 60 * 1000);
  }

  private cleanOldPatterns(): void {
    const now = Date.now();
    const cutoff = now - this.ANALYSIS_WINDOW;
    
    for (const [key, pattern] of this.accessPatterns) {
      if (pattern.lastAccessed < cutoff) {
        this.accessPatterns.delete(key);
      }
    }
    
    // Limit total patterns
    if (this.accessPatterns.size > this.MAX_PATTERN_HISTORY) {
      const sortedPatterns = Array.from(this.accessPatterns.entries())
        .sort(([,a], [,b]) => b.lastAccessed - a.lastAccessed)
        .slice(0, this.MAX_PATTERN_HISTORY);
      
      this.accessPatterns = new Map(sortedPatterns);
    }
  }

  private triggerPredictiveAnalysis(): void {
    // This could trigger cache warming or other optimizations
    const insights = this.generatePredictiveInsights();
    
    // Emit events for other systems to react to
    window.dispatchEvent(new CustomEvent('cache-insights-updated', {
      detail: insights
    }));
  }

  // Public API for cleanup
  dispose(): void {
    this.savePatterns();
  }
}

// Export singleton instance
export const cacheAnalyticsEngine = new CacheAnalyticsEngine();
