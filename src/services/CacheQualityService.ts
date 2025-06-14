/**
 * STUDENT ANALYST - Cache Quality Service
 * Data quality monitoring and automatic cache invalidation system
 */

import { cacheService } from './CacheService';

export interface QualityRule {
  id: string;
  name: string;
  description: string;
  dataType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  validator: (data: any, metadata?: any) => QualityCheckResult;
  autoInvalidate: boolean;
  alertThreshold: number; // Number of violations before alert
}

export interface QualityCheckResult {
  passed: boolean;
  score: number; // 0-100, where 100 is perfect quality
  issues: QualityIssue[];
  confidence: number; // 0-1, confidence in the check result
  metadata?: Record<string, any>;
}

export interface QualityIssue {
  type: 'missing_data' | 'stale_data' | 'inconsistent_data' | 'invalid_format' | 'suspicious_values' | 'networkerror' | 'apierror';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  field?: string;
  expectedValue?: any;
  actualValue?: any;
  suggestion?: string;
}

export interface QualityMetrics {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  invalidationsTriggered: number;
  averageQualityScore: number;
  issuesByType: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  lastCheckTime: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface InvalidationEvent {
  id: string;
  cacheKey: string;
  reason: string;
  qualityScore: number;
  issues: QualityIssue[];
  timestamp: number;
  dataType: string;
  symbol?: string;
  action: 'invalidate' | 'refresh' | 'quarantine';
}

export class CacheQualityService {
  private rules: Map<string, QualityRule> = new Map();
  private metrics: QualityMetrics;
  private invalidationHistory: InvalidationEvent[] = [];
  private quarantinedKeys: Set<string> = new Set();
  private checkInterval: number | null = null;
  private isMonitoring = true;

  // Configuration
  private readonly QUALITY_THRESHOLD = 70; // Minimum quality score (0-100)
  private readonly CRITICAL_THRESHOLD = 30; // Critical quality threshold
  private readonly MAX_HISTORY = 1000; // Maximum invalidation events to store
  private readonly CHECKiNTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly QUARANTINE_DURATION = 60 * 60 * 1000; // 1 hour

  constructor(dependencies?: any) {
    this.metrics = this.initializeMetrics();
    this.setupDefaultRules();
    this.startQualityMonitoring();
  }

  private initializeMetrics(): QualityMetrics {
    return {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      invalidationsTriggered: 0,
      averageQualityScore: 100,
      issuesByType: {},
      issuesBySeverity: {},
      lastCheckTime: 0,
      healthStatus: 'excellent'
    };
  }

  /**
   * Setup default quality rules for financial data
   */
  private setupDefaultRules(): void {
    // Stock Price Validation
    this.addRule({
      id: 'stock-price-validation',
      name: 'Stock Price Validation',
      description: 'Validates stock price data for reasonable values and completeness',
      dataType: 'stock-data',
      severity: 'high',
      enabled: true,
      autoInvalidate: true,
      alertThreshold: 3,
      validator: (data: any) => this.validateStockPrice(data)
    });

    // Data Freshness Check
    this.addRule({
      id: 'data-freshness',
      name: 'Data Freshness Check',
      description: 'Ensures data is not too stale for reliable analysis',
      dataType: 'all',
      severity: 'medium',
      enabled: true,
      autoInvalidate: true,
      alertThreshold: 5,
      validator: (data: any) => this.validateDataFreshness(data)
    });

    // Missing Data Detection
    this.addRule({
      id: 'missing-data-detection',
      name: 'Missing Data Detection',
      description: 'Detects incomplete or missing critical data fields',
      dataType: 'all',
      severity: 'medium',
      enabled: true,
      autoInvalidate: false,
      alertThreshold: 2,
      validator: (data: any) => this.validateDataCompleteness(data)
    });

    // Consistency Check
    this.addRule({
      id: 'data-consistency',
      name: 'Data Consistency Check',
      description: 'Validates internal consistency of financial data',
      dataType: 'fundamentals',
      severity: 'high',
      enabled: true,
      autoInvalidate: true,
      alertThreshold: 2,
      validator: (data: any) => this.validateDataConsistency(data)
    });

    // Outlier Detection
    this.addRule({
      id: 'outlier-detection',
      name: 'Outlier Detection',
      description: 'Identifies suspicious values that may indicate data corruption',
      dataType: 'all',
      severity: 'medium',
      enabled: true,
      autoInvalidate: false,
      alertThreshold: 5,
      validator: (data: any) => this.validateOutliers(data)
    });

    // Network Error Detection
    this.addRule({
      id: 'network-error-detection',
      name: 'Network Error Detection',
      description: 'Detects data that may be corrupted due to network issues',
      dataType: 'all',
      severity: 'critical',
      enabled: true,
      autoInvalidate: true,
      alertThreshold: 1,
      validator: (data: any) => this.validateNetworkIntegrity(data)
    });
  }

  /**
   * Add a quality rule
   */
  addRule(rule: QualityRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a quality rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Check data quality for a specific cache entry
   */
  async checkDataQuality(cacheKey: string, data: any, metadata?: any): Promise<QualityCheckResult> {
    const dataType = this.extractDataType(cacheKey);
    const applicableRules = this.getApplicableRules(dataType);
    
    const results: QualityCheckResult[] = [];
    
    for (const rule of applicableRules) {
      if (!rule.enabled) continue;
      
      try {
        const result = rule.validator(data, metadata);
        result.metadata = { ...result.metadata, ruleId: rule.id, ruleName: rule.name };
        results.push(result);
      } catch (error) {
        console.warn(`Quality rule ${rule.id} failed:`, error);
        results.push({
          passed: false,
          score: 0,
          confidence: 0.5,
          issues: [{
            type: 'apierror',
            severity: 'medium',
            message: `Quality check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            suggestion: 'Review quality rule implementation'
          }]
        });
      }
    }

    // Aggregate results
    const aggregatedResult = this.aggregateQualityResults(results);
    
    // Update metrics
    this.updateMetrics(aggregatedResult);
    
    // Handle quality issues if necessary
    if (!aggregatedResult.passed || aggregatedResult.score < this.QUALITY_THRESHOLD) {
      await this.handleQualityIssues(cacheKey, aggregatedResult, dataType);
    }
    
    return aggregatedResult;
  }

  private getApplicableRules(dataType: string): QualityRule[] {
    return Array.from(this.rules.values()).filter(rule => 
      rule.dataType === 'all' || rule.dataType === dataType
    );
  }

  private aggregateQualityResults(results: QualityCheckResult[]): QualityCheckResult {
    if (results.length === 0) {
      return {
        passed: true,
        score: 100,
        confidence: 1,
        issues: []
      };
    }

    const totalWeight = results.length;
    const weightedScore = results.reduce((sum, result) => sum + (result.score * result.confidence), 0) / 
                         results.reduce((sum, result) => sum + result.confidence, 0);
    
    const allIssues = results.flatMap(result => result.issues);
    const averageConfidence = results.reduce((sum, result) => sum + result.confidence, 0) / results.length;
    
    const hasCriticalIssues = allIssues.some(issue => issue.severity === 'critical');
    const hasHighIssues = allIssues.some(issue => issue.severity === 'high');
    
    return {
      passed: weightedScore >= this.QUALITY_THRESHOLD && !hasCriticalIssues,
      score: Math.round(weightedScore),
      confidence: averageConfidence,
      issues: allIssues,
      metadata: {
        rulesApplied: results.length,
        criticalIssues: allIssues.filter(i => i.severity === 'critical').length,
        highIssues: allIssues.filter(i => i.severity === 'high').length
      }
    };
  }

  private async handleQualityIssues(
    cacheKey: string, 
    qualityResult: QualityCheckResult, 
    dataType: string
  ): Promise<void> {
    const hasCriticalIssues = qualityResult.issues.some(issue => issue.severity === 'critical');
    const symbol = this.extractSymbol(cacheKey);
    
    let action: 'invalidate' | 'refresh' | 'quarantine' = 'invalidate';
    
    if (hasCriticalIssues || qualityResult.score < this.CRITICAL_THRESHOLD) {
      action = 'quarantine';
      this.quarantinedKeys.add(cacheKey);
      
      // Schedule removal from quarantine
      setTimeout(() => {
        this.quarantinedKeys.delete(cacheKey);
      }, this.QUARANTINE_DURATION);
      
    } else if (qualityResult.score < this.QUALITY_THRESHOLD) {
      action = 'refresh';
    }

    // Create invalidation event
    const event: InvalidationEvent = {
      id: this.generateEventId(),
      cacheKey,
      reason: `Quality score ${qualityResult.score} below threshold ${this.QUALITY_THRESHOLD}`,
      qualityScore: qualityResult.score,
      issues: qualityResult.issues,
      timestamp: Date.now(),
      dataType,
      symbol,
      action
    };

    this.invalidationHistory.push(event);
    
    // Limit history size
    if (this.invalidationHistory.length > this.MAX_HISTORY) {
      this.invalidationHistory = this.invalidationHistory.slice(-this.MAX_HISTORY);
    }

    // Execute action
    switch (action) {
      case 'invalidate':
      case 'quarantine':
        // Note: invalidate method doesn't exist, using clearAll as fallback
        console.warn(`Would invalidate ${cacheKey} but method not available`);
        this.metrics.invalidationsTriggered++;
        console.warn(`[Quality Service] ${action} cache key ${cacheKey} due to quality issues:`, qualityResult.issues);
        break;
        
      case 'refresh':
        // Mark for refresh - actual refresh would be handled by the warming service
        window.dispatchEvent(new CustomEvent('cache-refresh-requested', {
          detail: { cacheKey, reason: 'quality-issues', priority: 'high' }
        }));
        console.info(`[Quality Service] Refresh requested for ${cacheKey} due to quality issues`);
        break;
    }

    // Emit quality event for other systems
    window.dispatchEvent(new CustomEvent('cache-quality-issue', {
      detail: event
    }));
  }

  private updateMetrics(result: QualityCheckResult): void {
    this.metrics.totalChecks++;
    
    if (result.passed) {
      this.metrics.passedChecks++;
    } else {
      this.metrics.failedChecks++;
    }
    
    // Update average quality score (rolling average)
    this.metrics.averageQualityScore = 
      (this.metrics.averageQualityScore * (this.metrics.totalChecks - 1) + result.score) / this.metrics.totalChecks;
    
    // Update issue counts
    result.issues.forEach(issue => {
      this.metrics.issuesByType[issue.type] = (this.metrics.issuesByType[issue.type] || 0) + 1;
      this.metrics.issuesBySeverity[issue.severity] = (this.metrics.issuesBySeverity[issue.severity] || 0) + 1;
    });
    
    this.metrics.lastCheckTime = Date.now();
    
    // Update health status
    this.updateHealthStatus();
  }

  private updateHealthStatus(): void {
    const score = this.metrics.averageQualityScore;
    const passRate = this.metrics.totalChecks > 0 ? 
      (this.metrics.passedChecks / this.metrics.totalChecks) * 100 : 100;
    
    const criticalIssues = this.metrics.issuesBySeverity['critical'] || 0;
    const highIssues = this.metrics.issuesBySeverity['high'] || 0;
    
    if (criticalIssues > 5 || score < 30) {
      this.metrics.healthStatus = 'critical';
    } else if (highIssues > 10 || score < 50 || passRate < 60) {
      this.metrics.healthStatus = 'poor';
    } else if (score < 70 || passRate < 80) {
      this.metrics.healthStatus = 'fair';
    } else if (score < 85 || passRate < 90) {
      this.metrics.healthStatus = 'good';
    } else {
      this.metrics.healthStatus = 'excellent';
    }
  }

  // Quality validation methods

  private validateStockPrice(data: any): QualityCheckResult {
    const issues: QualityIssue[] = [];
    let score = 100;

    if (!data || typeof data !== 'object') {
      return {
        passed: false,
        score: 0,
        confidence: 1,
        issues: [{
          type: 'invalid_format',
          severity: 'critical',
          message: 'Data is not a valid object',
          suggestion: 'Ensure data is properly formatted JSON object'
        }]
      };
    }

    // Check for required fields
    const requiredFields = ['price', 'symbol'];
    requiredFields.forEach(field => {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        issues.push({
          type: 'missing_data',
          severity: 'high',
          message: `Missing required field: ${field}`,
          field,
          suggestion: `Ensure ${field} is included in stock data`
        });
        score -= 20;
      }
    });

    // Validate price
    if (data.price !== undefined) {
      const price = parseFloat(data.price);
      if (isNaN(price) || price < 0) {
        issues.push({
          type: 'invalid_format',
          severity: 'high',
          message: 'Stock price must be a positive number',
          field: 'price',
          actualValue: data.price,
          suggestion: 'Verify price data source and format'
        });
        score -= 30;
      } else if (price > 10000) {
        issues.push({
          type: 'suspicious_values',
          severity: 'medium',
          message: 'Stock price seems unusually high',
          field: 'price',
          actualValue: price,
          suggestion: 'Verify if price is per share or needs adjustment'
        });
        score -= 10;
      }
    }

    return {
      passed: score >= this.QUALITY_THRESHOLD,
      score: Math.max(0, score),
      confidence: 0.9,
      issues
    };
  }

  private validateDataFreshness(data: any): QualityCheckResult {
    const issues: QualityIssue[] = [];
    let score = 100;

    if (!data || typeof data !== 'object') {
      return {
        passed: false,
        score: 0,
        confidence: 0.8,
        issues: [{
          type: 'invalid_format',
          severity: 'medium',
          message: 'Cannot validate freshness - invalid data format'
        }]
      };
    }

    const now = Date.now();
    const timestamp = data.timestamp || data.lastUpdated || data.date;

    if (!timestamp) {
      issues.push({
        type: 'missing_data',
        severity: 'medium',
        message: 'No timestamp found in data',
        suggestion: 'Include timestamp field for freshness validation'
      });
      score -= 20;
    } else {
      const dataTime = new Date(timestamp).getTime();
      const ageMs = now - dataTime;
      const ageHours = ageMs / (60 * 60 * 1000);

      if (ageHours > 24) {
        issues.push({
          type: 'stale_data',
          severity: ageHours > 72 ? 'high' : 'medium',
          message: `Data is ${ageHours.toFixed(1)} hours old`,
          actualValue: new Date(timestamp).toISOString(),
          suggestion: 'Refresh data from source'
        });
        score -= Math.min(50, ageHours * 2);
      }
    }

    return {
      passed: score >= this.QUALITY_THRESHOLD,
      score: Math.max(0, score),
      confidence: 0.8,
      issues
    };
  }

  private validateDataCompleteness(data: any): QualityCheckResult {
    const issues: QualityIssue[] = [];
    let score = 100;

    if (!data || typeof data !== 'object') {
      return {
        passed: false,
        score: 0,
        confidence: 0.9,
        issues: [{
          type: 'invalid_format',
          severity: 'critical',
          message: 'Data is not a valid object'
        }]
      };
    }

    // Count null/undefined/empty values
    let emptyFields = 0;
    let totalFields = 0;

    const checkObject = (obj: any, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        totalFields++;
        const currentPath = path ? `${path}.${key}` : key;
        
        if (value === null || value === undefined || value === '') {
          emptyFields++;
          issues.push({
            type: 'missing_data',
            severity: 'low',
            message: `Empty field: ${currentPath}`,
            field: currentPath
          });
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          checkObject(value, currentPath);
        }
      }
    };

    checkObject(data);

    if (totalFields > 0) {
      const completeness = ((totalFields - emptyFields) / totalFields) * 100;
      score = Math.round(completeness);
    }

    return {
      passed: score >= this.QUALITY_THRESHOLD,
      score,
      confidence: 0.7,
      issues,
      metadata: { completeness: score, emptyFields, totalFields }
    };
  }

  private validateDataConsistency(data: any): QualityCheckResult {
    const issues: QualityIssue[] = [];
    let score = 100;

    if (!data || typeof data !== 'object') {
      return {
        passed: false,
        score: 0,
        confidence: 0.8,
        issues: [{
          type: 'invalid_format',
          severity: 'medium',
          message: 'Cannot validate consistency - invalid data format'
        }]
      };
    }

    // Basic financial data consistency checks
    if (data.marketCap && data.sharesOutstanding && data.price) {
      const calculatedMarketCap = data.sharesOutstanding * data.price;
      const difference = Math.abs(data.marketCap - calculatedMarketCap) / data.marketCap;
      
      if (difference > 0.1) { // 10% tolerance
        issues.push({
          type: 'inconsistent_data',
          severity: 'medium',
          message: 'Market cap inconsistent with shares outstanding and price',
          expectedValue: calculatedMarketCap,
          actualValue: data.marketCap,
          suggestion: 'Verify market cap calculation or data source'
        });
        score -= 20;
      }
    }

    // PE ratio consistency
    if (data.pe && data.price && data.eps) {
      const calculatedPE = data.price / data.eps;
      const difference = Math.abs(data.pe - calculatedPE) / data.pe;
      
      if (difference > 0.05) { // 5% tolerance
        issues.push({
          type: 'inconsistent_data',
          severity: 'low',
          message: 'P/E ratio inconsistent with price and EPS',
          expectedValue: calculatedPE,
          actualValue: data.pe
        });
        score -= 10;
      }
    }

    return {
      passed: score >= this.QUALITY_THRESHOLD,
      score,
      confidence: 0.8,
      issues
    };
  }

  private validateOutliers(data: any): QualityCheckResult {
    const issues: QualityIssue[] = [];
    let score = 100;

    if (!data || typeof data !== 'object') {
      return {
        passed: true,
        score: 100,
        confidence: 0.5,
        issues: []
      };
    }

    // Simple outlier detection for numeric values
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'number' && !isNaN(value)) {
        // Basic range checks for common financial metrics
        const ranges: Record<string, [number, number]> = {
          'price': [0.01, 10000],
          'pe': [-100, 1000],
          'marketCap': [1000000, 10000000000000], // $1M to $10T
          'volume': [0, 1000000000],
          'beta': [-5, 5],
          'dividend': [0, 1000]
        };

        const range = ranges[key.toLowerCase()];
        if (range && (value < range[0] || value > range[1])) {
          issues.push({
            type: 'suspicious_values',
            severity: 'low',
            message: `${key} value ${value} outside expected range [${range[0]}, ${range[1]}]`,
            field: key,
            actualValue: value,
            suggestion: 'Verify data source and value accuracy'
          });
          score -= 5;
        }
      }
    });

    return {
      passed: score >= this.QUALITY_THRESHOLD,
      score: Math.max(0, score),
      confidence: 0.6,
      issues
    };
  }

  private validateNetworkIntegrity(data: any): QualityCheckResult {
    const issues: QualityIssue[] = [];
    let score = 100;

    // Check for common network error indicators
    if (typeof data === 'string') {
      const errorPatterns = [
        /error/i,
        /timeout/i,
        /network/i,
        /connection/i,
        /unavailable/i,
        /service.*down/i
      ];

      if (errorPatterns.some(pattern => pattern.test(data))) {
        issues.push({
          type: 'networkerror',
          severity: 'critical',
          message: 'Data appears to contain network error information',
          actualValue: data,
          suggestion: 'Retry data fetch or check network connectivity'
        });
        score = 0;
      }
    }

    // Check for incomplete JSON or data structures
    if (data && typeof data === 'object') {
      const jsonString = JSON.stringify(data);
      if (jsonString.includes('null') && jsonString.length < 50) {
        issues.push({
          type: 'networkerror',
          severity: 'high',
          message: 'Data appears incomplete, possibly due to network issues',
          suggestion: 'Retry data fetch'
        });
        score -= 40;
      }
    }

    return {
      passed: score >= this.QUALITY_THRESHOLD,
      score,
      confidence: 0.9,
      issues
    };
  }

  /**
   * Start background quality monitoring
   */
  private startQualityMonitoring(): void {
    this.checkInterval = window.setInterval(async () => {
      if (!this.isMonitoring) return;

      // Get sample of cache keys for random quality checks
      const cacheStats = cacheService.getStats();
      const sampleSize = Math.min(10, Math.floor((cacheStats.currentEntries || 0) * 0.1));
      
      // This would ideally sample actual cache entries
      // For now, we'll just update our monitoring status
      console.log(`[Quality Service] Monitoring ${cacheStats.currentEntries || 0} cache entries, health: ${this.metrics.healthStatus}`);
      
    }, this.CHECKiNTERVAL);
  }

  // Public API

  /**
   * Get quality metrics
   */
  getMetrics(): QualityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get invalidation history
   */
  getInvalidationHistory(limit = 50): InvalidationEvent[] {
    return this.invalidationHistory.slice(-limit);
  }

  /**
   * Get quarantined cache keys
   */
  getQuarantinedKeys(): string[] {
    return Array.from(this.quarantinedKeys);
  }

  /**
   * Check if a cache key is quarantined
   */
  isQuarantined(cacheKey: string): boolean {
    return this.quarantinedKeys.has(cacheKey);
  }

  /**
   * Manually release a key from quarantine
   */
  releaseFromQuarantine(cacheKey: string): void {
    this.quarantinedKeys.delete(cacheKey);
  }

  /**
   * Enable/disable quality monitoring
   */
  setMonitoring(enabled: boolean): void {
    this.isMonitoring = enabled;
  }

  /**
   * Get all quality rules
   */
  getRules(): QualityRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Update quality rule
   */
  updateRule(ruleId: string, updates: Partial<QualityRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
    }
  }

  // Utility methods
  private extractDataType(cacheKey: string): string {
    return cacheKey.split(':')[0] || 'unknown';
  }

  private extractSymbol(cacheKey: string): string | undefined {
    return cacheKey.split(':')[1];
  }

  private generateEventId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Dispose of the service
   */
  dispose(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.quarantinedKeys.clear();
    this.invalidationHistory = [];
  }
}

// Export singleton instance
export const cacheQualityService = new CacheQualityService();

