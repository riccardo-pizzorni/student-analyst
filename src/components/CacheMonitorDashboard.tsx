/**
 * STUDENT ANALYST - Cache Monitor Dashboard
 * Real-time monitoring dashboard for Memory Cache L1 performance
 */

import React, { useState, useEffect } from 'react';
import { cacheService } from '../services/CacheService';
import { localStorageCacheL2 } from '../services/LocalStorageCacheL2';
import { indexedDBCacheL3 } from '../services/IndexedDBCacheL3';
import './CacheMonitorDashboard.css';

interface CacheMonitorProps {
  refreshInterval?: number; // in milliseconds
  enableAutoRefresh?: boolean;
}

const CacheMonitorDashboard: React.FC<CacheMonitorProps> = ({
  refreshInterval = 5000,
  enableAutoRefresh = true
}) => {
  const [multiLayerStats, setMultiLayerStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [memoryBreakdown, setMemoryBreakdown] = useState<any>(null);
  const [l3Health, setL3Health] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load cache data
  const loadCacheData = async () => {
    setIsLoading(true);
    try {
      // Load multi-layer stats (L1 + L2 + L3)
      const multiStats = await cacheService.getMultiLayerStats();
      const l1Stats = cacheService.getStats();
      const healthStatus = {
        status: 'healthy' as const,
        details: {
          hitRate: l1Stats.hitRate,
          memoryUsage: l1Stats.memoryUsage,
          memoryUsagePercent: (l1Stats.memoryUsage / l1Stats.maxMemoryUsage) * 100,
          entryCount: l1Stats.currentEntries,
          issues: [] as string[]
        }
      };
      const breakdown = {};
      
      // Load L3 health status
      const l3HealthStatus = await indexedDBCacheL3.getHealthStatus();

      setMultiLayerStats(multiStats);
      setHealth(healthStatus);
      setMemoryBreakdown(breakdown);
      setL3Health(l3HealthStatus);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading cache data:', (error));
    } finally {
      setIsLoading(false);
    }
  };

  // Setup auto-refresh
  useEffect(() => {
    loadCacheData();

    if (enableAutoRefresh) {
      const interval = setInterval(loadCacheData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, enableAutoRefresh]);

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, (i))).toFixed(2)) + ' ' + sizes[i];
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Format time duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Get health status color
  const getHealthColor = (status: string): string => {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Get health status icon
  const getHealthIcon = (status: string): string => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  // Clear cache handler
  const handleClearCache = async () => {
    if (window.confirm('Are you sure you want to clear all cache layers (L1, L2, L3)?')) {
      await cacheService.clearAll();
      loadCacheData();
    }
  };

  // Test cache performance
  const testCachePerformance = async () => {
    const testKey = `test-${Date.now()}`;
    const testData = { message: 'Cache performance test', timestamp: Date.now() };
    
    // Test write performance
    const writeStart = performance.now();
    cacheService.set(testKey, testData);
    const writeTime = performance.now() - writeStart;

    // Test read performance
    const readStart = performance.now();
    const result = cacheService.has(testKey);
    const readTime = performance.now() - readStart;

    // Clean up
    cacheService.remove(testKey);

    alert(`Cache Performance Test:
Write: ${writeTime.toFixed(2)}ms
Read: ${readTime.toFixed(2)}ms
Result: ${result ? 'Success' : 'Failed'}`);
  };

  if (!multiLayerStats || !health) {
    return (
      <div className="cache-monitor-loading">
        <div className="loading-spinner"></div>
        <p>Loading cache monitor...</p>
      </div>
    );
  }

  const { l1: stats, l2: l2Stats, l3: l3Stats, combined } = multiLayerStats;

  return (
    <div className="cache-monitor-dashboard">
      <div className="cache-monitor-header">
        <h2>🚀 Multi-Layer Cache Monitor (L1 + L2 + L3)</h2>
        <div className="cache-monitor-controls">
          <button 
            onClick={loadCacheData} 
            disabled={isLoading}
            className="btn-refresh"
          >
            {isLoading ? '⏳' : '🔄'} Refresh
          </button>
          <button 
            onClick={testCachePerformance}
            className="btn-test"
          >
            ⚡ Test Performance
          </button>
          <button 
            onClick={handleClearCache}
            className="btn-clear"
          >
            🗑️ Clear Cache
          </button>
        </div>
      </div>

      <div className="cache-monitor-status">
        <div className="status-card">
          <div className="status-icon" style={{ color: getHealthColor(health.status) }}>
            {getHealthIcon(health.status)}
          </div>
          <div className="status-info">
            <h3>System Health</h3>
            <p className={`status-${health.status}`}>{health.status.toUpperCase()}</p>
            <small>Last updated: {lastUpdated.toLocaleTimeString()}</small>
          </div>
        </div>
      </div>

      <div className="cache-monitor-grid">
        {/* Performance Metrics */}
        <div className="cache-card">
          <h3>📊 Performance Metrics</h3>
          <div className="metric-grid">
            <div className="metric-item">
              <div className="metric-value">{formatPercentage(stats.hitRate)}</div>
              <div className="metric-label">Hit Rate</div>
              <div className={`metric-status ${stats.hitRate > 70 ? 'good' : stats.hitRate > 50 ? 'warning' : 'poor'}`}>
                {stats.hitRate > 70 ? '🟢' : stats.hitRate > 50 ? '🟡' : '🔴'}
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{stats.hits.toLocaleString()}</div>
              <div className="metric-label">Cache Hits</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{stats.misses.toLocaleString()}</div>
              <div className="metric-label">Cache Misses</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{formatDuration(stats.averageAccessTime)}</div>
              <div className="metric-label">Avg Access Time</div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="cache-card">
          <h3>💾 Memory Usage</h3>
          <div className="memory-info">
            <div className="memory-bar">
              <div 
                className="memory-fill"
                style={{ 
                  width: `${health.details.memoryUsagePercent}%`,
                  backgroundColor: health.details.memoryUsagePercent > 80 ? '#EF4444' : 
                                 health.details.memoryUsagePercent > 60 ? '#F59E0B' : '#10B981'
                }}
              ></div>
            </div>
            <div className="memory-stats">
              <div className="memory-stat">
                <span>Used:</span>
                <span>{formatBytes(stats.memoryUsage)}</span>
              </div>
              <div className="memory-stat">
                <span>Limit:</span>
                <span>{formatBytes(stats.maxMemoryUsage)}</span>
              </div>
              <div className="memory-stat">
                <span>Usage:</span>
                <span>{formatPercentage(health.details.memoryUsagePercent)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cache Statistics */}
        <div className="cache-card">
          <h3>📈 Cache Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.currentEntries.toLocaleString()}</div>
              <div className="stat-label">Total Entries</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.evictions.toLocaleString()}</div>
              <div className="stat-label">Evictions</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.totalRequests.toLocaleString()}</div>
              <div className="stat-label">Total Requests</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.maxSize.toLocaleString()}</div>
              <div className="stat-label">Max Entries</div>
            </div>
          </div>
        </div>

        {/* Health Issues */}
        {health.details.issues.length > 0 && (
          <div className="cache-card health-issues">
            <h3>⚠️ Health Issues</h3>
            <ul className="issues-list">
              {health.details.issues.map((issue: string, index: number) => (
                <li key={index} className="issue-item">
                  🔸 {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Memory Breakdown */}
        {memoryBreakdown && Object.keys(memoryBreakdown).length > 0 && (
          <div className="cache-card">
            <h3>📋 Memory Breakdown</h3>
            <div className="breakdown-list">
              {Object.entries(memoryBreakdown).map(([type, data]: [string, any]) => (
                <div key={type} className="breakdown-item">
                  <div className="breakdown-type">{type}</div>
                  <div className="breakdown-stats">
                    <span>Count: {data.count}</span>
                    <span>Size: {formatBytes(data.totalSize)}</span>
                    <span>Avg: {formatBytes(data.averageSize)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Insights */}
        <div className="cache-card insights">
          <h3>💡 Performance Insights</h3>
          <div className="insights-list">
            {stats.hitRate > 80 && (
              <div className="insight-item good">
                ✅ Excellent hit rate - cache is working effectively
              </div>
            )}
            {stats.hitRate < 50 && (
              <div className="insight-item warning">
                ⚠️ Low hit rate - consider increasing TTL or warming cache
              </div>
            )}
            {health.details.memoryUsagePercent > 90 && (
              <div className="insight-item critical">
                🚨 Memory usage critical - increase limit or reduce TTL
              </div>
            )}
            {stats.evictions > stats.hits * 0.1 && (
              <div className="insight-item warning">
                ⚠️ High eviction rate - consider increasing memory limit
              </div>
            )}
            {stats.averageAccessTime < 1 && (
              <div className="insight-item good">
                ⚡ Excellent access performance - sub-millisecond response
              </div>
            )}
          </div>
        </div>

        {/* Cache Configuration */}
        <div className="cache-card">
          <h3>⚙️ Configuration</h3>
          <div className="config-grid">
            <div className="config-item">
              <span>Max Memory:</span>
              <span>{formatBytes(stats.maxMemoryUsage)}</span>
            </div>
            <div className="config-item">
              <span>Max Entries:</span>
              <span>{stats.maxSize.toLocaleString()}</span>
            </div>
            <div className="config-item">
              <span>Default TTL:</span>
              <span>1 hour</span>
            </div>
            <div className="config-item">
              <span>Cleanup Interval:</span>
              <span>5 minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Statistics */}
      <div className="cache-monitor-section">
        <h2>🎯 Combined Cache Performance (L1 + L2 + L3)</h2>
        <div className="cache-monitor-grid">
          <div className="cache-card">
            <h3>📊 Overall Performance</h3>
            <div className="metric-grid">
              <div className="metric-item">
                <div className="metric-value">{formatPercentage(combined.overallHitRate)}</div>
                <div className="metric-label">Overall Hit Rate</div>
                <div className={`metric-status ${combined.overallHitRate > 80 ? 'good' : combined.overallHitRate > 60 ? 'warning' : 'poor'}`}>
                  {combined.overallHitRate > 80 ? '🟢' : combined.overallHitRate > 60 ? '🟡' : '🔴'}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{combined.totalHits.toLocaleString()}</div>
                <div className="metric-label">Total Hits</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{combined.totalMisses.toLocaleString()}</div>
                <div className="metric-label">Total Misses</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{formatBytes(combined.totalMemoryUsed + combined.totalStorageUsed + combined.totalDatabaseSize)}</div>
                <div className="metric-label">Total Storage</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* L2 Cache Section */}
      {l2Stats && (
        <div className="cache-monitor-section">
          <h2>💾 LocalStorage Cache L2 Monitor</h2>
          <div className="cache-monitor-grid">
            {/* L2 Performance Metrics */}
            <div className="cache-card">
              <h3>📊 L2 Performance Metrics</h3>
              <div className="metric-grid">
                <div className="metric-item">
                  <div className="metric-value">{formatPercentage((l2Stats.hits / Math.max(1, l2Stats.hits + l2Stats.misses)) * 100)}</div>
                  <div className="metric-label">L2 Hit Rate</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{l2Stats.hits.toLocaleString()}</div>
                  <div className="metric-label">L2 Hits</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{l2Stats.misses.toLocaleString()}</div>
                  <div className="metric-label">L2 Misses</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{l2Stats.evictions.toLocaleString()}</div>
                  <div className="metric-label">L2 Evictions</div>
                </div>
              </div>
            </div>

            {/* L2 Storage Usage */}
            <div className="cache-card">
              <h3>💾 L2 Storage Usage</h3>
              <div className="memory-info">
                <div className="memory-bar">
                  <div 
                    className="memory-fill"
                    style={{ 
                      width: `${l2Stats.quotaUsagePercent}%`,
                      backgroundColor: l2Stats.quotaUsagePercent > 80 ? '#EF4444' : 
                                     l2Stats.quotaUsagePercent > 60 ? '#F59E0B' : '#10B981'
                    }}
                  ></div>
                </div>
                <div className="memory-stats">
                  <div className="memory-stat">
                    <span>Used:</span>
                    <span>{formatBytes(l2Stats.totalStorageUsed)}</span>
                  </div>
                  <div className="memory-stat">
                    <span>Limit:</span>
                    <span>5 MB</span>
                  </div>
                  <div className="memory-stat">
                    <span>Usage:</span>
                    <span>{formatPercentage(l2Stats.quotaUsagePercent)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* L2 Compression Stats */}
            <div className="cache-card">
              <h3>🗜️ Compression Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{formatPercentage(l2Stats.averageCompressionRatio * 100)}</div>
                  <div className="stat-label">Compression Ratio</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatBytes(l2Stats.totalOriginalSize)}</div>
                  <div className="stat-label">Original Size</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatBytes(l2Stats.totalCompressedSize)}</div>
                  <div className="stat-label">Compressed Size</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatBytes(l2Stats.totalOriginalSize - l2Stats.totalCompressedSize)}</div>
                  <div className="stat-label">Space Saved</div>
                </div>
              </div>
            </div>

            {/* L2 Storage Breakdown */}
            {l2Stats.dataTypeBreakdown && Object.keys(l2Stats.dataTypeBreakdown).length > 0 && (
              <div className="cache-card">
                <h3>📋 L2 Storage Breakdown</h3>
                <div className="breakdown-list">
                  {Object.entries(l2Stats.dataTypeBreakdown).map(([type, data]: [string, any]) => (
                    <div key={type} className="breakdown-item">
                      <div className="breakdown-type">{type}</div>
                      <div className="breakdown-stats">
                        <span>Count: {data.count}</span>
                        <span>Original: {formatBytes(data.originalSize || 0)}</span>
                        <span>Compressed: {formatBytes(data.compressedSize || 0)}</span>
                        <span>Ratio: {formatPercentage(((data.compressedSize || 0) / Math.max(1, data.originalSize || 1)) * 100)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* L3 Cache Section */}
      {l3Stats && (
        <div className="cache-monitor-section">
          <h2>🗄️ IndexedDB Cache L3 Monitor</h2>
          <div className="cache-monitor-grid">
            {/* L3 Performance Metrics */}
            <div className="cache-card">
              <h3>📊 L3 Performance Metrics</h3>
              <div className="metric-grid">
                <div className="metric-item">
                  <div className="metric-value">{formatPercentage((l3Stats.hitCount / Math.max(1, l3Stats.hitCount + l3Stats.missCount)) * 100)}</div>
                  <div className="metric-label">L3 Hit Rate</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{l3Stats.hitCount.toLocaleString()}</div>
                  <div className="metric-label">L3 Hits</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{l3Stats.missCount.toLocaleString()}</div>
                  <div className="metric-label">L3 Misses</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{l3Stats.evictionCount.toLocaleString()}</div>
                  <div className="metric-label">L3 Evictions</div>
                </div>
              </div>
            </div>

            {/* L3 Database Usage */}
            <div className="cache-card">
              <h3>🗄️ Database Usage</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{formatBytes(l3Stats.totalSize)}</div>
                  <div className="stat-label">Database Size</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{l3Stats.totalEntries.toLocaleString()}</div>
                  <div className="stat-label">Total Records</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatPercentage(l3Stats.compressionRatio * 100)}</div>
                  <div className="stat-label">Compression Ratio</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatDuration(l3Stats.performanceMetrics.avgQueryTime)}</div>
                  <div className="stat-label">Avg Query Time</div>
                </div>
              </div>
            </div>

            {/* L3 Data Type Breakdown */}
            {l3Stats.dataTypeBreakdown && Object.keys(l3Stats.dataTypeBreakdown).length > 0 && (
              <div className="cache-card">
                <h3>📋 L3 Data Type Breakdown</h3>
                <div className="breakdown-list">
                  {Object.entries(l3Stats.dataTypeBreakdown).map(([type, data]: [string, any]) => (
                    <div key={type} className="breakdown-item">
                      <div className="breakdown-type">{type}</div>
                      <div className="breakdown-stats">
                        <span>Count: {data.count}</span>
                        <span>Size: {formatBytes(data.size)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* L3 Health Status */}
            {l3Health && (
              <div className="cache-card">
                <h3>🏥 L3 Health Status</h3>
                <div className="health-status">
                  <div className="health-indicator">
                    <span className={`health-badge ${l3Health.status}`}>
                      {getHealthIcon(l3Health.status)} {l3Health.status.toUpperCase()}
                    </span>
                  </div>
                  {l3Health.issues.length > 0 && (
                    <div className="health-issues">
                      <h4>Issues:</h4>
                      <ul>
                        {l3Health.issues.map((issue: string, index: number) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {l3Health.recommendations.length > 0 && (
                    <div className="health-recommendations">
                      <h4>Recommendations:</h4>
                      <ul>
                        {l3Health.recommendations.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* L3 Performance Metrics */}
            <div className="cache-card">
              <h3>⚡ L3 Performance Details</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{formatDuration(l3Stats.performanceMetrics.avgWriteTime)}</div>
                  <div className="stat-label">Avg Write Time</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatDuration(l3Stats.performanceMetrics.avgDeleteTime)}</div>
                  <div className="stat-label">Avg Delete Time</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{l3Stats.oldestEntry ? new Date(l3Stats.oldestEntry).toLocaleDateString() : 'N/A'}</div>
                  <div className="stat-label">Oldest Entry</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{l3Stats.newestEntry ? new Date(l3Stats.newestEntry).toLocaleDateString() : 'N/A'}</div>
                  <div className="stat-label">Newest Entry</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Chart Placeholder */}
      <div className="cache-monitor-footer">
        <div className="performance-summary">
          <h3>📊 Performance Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-icon">🎯</div>
              <div className="summary-text">
                <strong>Cache Efficiency:</strong> {formatPercentage(stats.hitRate)} hit rate
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon">⚡</div>
              <div className="summary-text">
                <strong>Response Time:</strong> {formatDuration(stats.averageAccessTime)} average
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon">💾</div>
              <div className="summary-text">
                <strong>Memory Usage:</strong> {formatBytes(stats.memoryUsage)} / {formatBytes(stats.maxMemoryUsage)}
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon">📦</div>
              <div className="summary-text">
                <strong>Active Entries:</strong> {stats.currentEntries.toLocaleString()} cached items
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheMonitorDashboard; 

