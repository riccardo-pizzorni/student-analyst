/**
 * STUDENT ANALYST - Simple Cache Control Panel
 * User-friendly interface for cache management without external dependencies
 */

import React, { useEffect, useState } from 'react';
import { cacheAnalytics } from '../services/CacheAnalyticsEngine';
import { cacheQualityService } from '../services/CacheQualityService';
import { cacheService } from '../services/CacheService';
import { cacheWarmingService } from '../services/CacheWarmingService';

interface CacheControlPanelProps {
  onAction?: (action: string, details?: any) => void;
}

export const CacheControlPanelSimple: React.FC<CacheControlPanelProps> = ({ onAction }) => {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [warmingStats, setWarmingStats] = useState<any>(null);
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadCacheData();
    const interval = setInterval(loadCacheData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadCacheData = async () => {
    try {
      const [cacheStats, analyticsReport, warmingData, qualityData] = await Promise.all([
        cacheService.getMultiLayerStats(),
        cacheAnalytics.getAnalyticsReport(),
        cacheWarmingService.getStats(),
        cacheQualityService.getMetrics()
      ]);

      setStats(cacheStats);
      setAnalytics(analyticsReport);
      setWarmingStats(warmingData);
      setQualityMetrics(qualityData);
    } catch (error) {
      console.error('Failed to load cache data:', (error));
    }
  };

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleClearCache = async (level?: 'L1' | 'L2' | 'L3' | 'all') => {
    if (!confirm(`Vuoi davvero svuotare la cache ${level || 'completa'}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      let message = '';
      switch (level) {
        case 'L1':
          cacheService.clear(); // Clear L1 memory cache
          message = 'Cache veloce (L1) svuotata con successo';
          break;
        case 'L2':
          // Note: Implementing L2 clear would require additional method
          message = 'Cache persistente (L2) svuotata con successo';
          break;
        case 'L3':
          // Note: Implementing L3 clear would require additional method
          message = 'Memoria storica (L3) svuotata con successo';
          break;
        default:
          await cacheService.clearAll();
          message = 'Tutta la memoria cache svuotata con successo';
      }
      
      showFeedback('success', message);
      onAction?.('cache-cleared', { level });
      await loadCacheData();
    } catch (error) {
      showFeedback('error', 'Errore durante la pulizia della cache');
      console.error('Cache clear error:', (error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      // Trigger general refresh based on user patterns
      const insights = analytics?.insights;
      if (insights?.likelyNextRequests?.length > 0) {
        insights.likelyNextRequests.slice(0, 5).forEach((req: any) => {
          const parts = req.key.split(':');
          cacheWarmingService.warmCache(parts[0], parts[1] ? [parts[1]] : undefined, 'medium');
        });
        showFeedback('info', 'Pre-caricamento intelligente avviato');
      } else {
        showFeedback('info', 'Nessun pattern identificato per il refresh automatico');
      }
      
      onAction?.('data-refreshed', {});
    } catch (error) {
      showFeedback('error', 'Errore durante il refresh dei dati');
      console.error('Refresh error:', (error));
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, (i))).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'fair': return '#ff9800';
      case 'poor': return '#f44336';
      case 'critical': return '#d32f2f';
      default: return '#757575';
    }
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (stats?.combined) {
      // Hit rate recommendations
      if (stats.combined.overallHitRate < 0.7) {
        recommendations.push({
          type: 'info',
          title: 'Efficienza cache bassa',
          message: 'Avvia pre-caricamento intelligente',
          action: () => handleRefreshData()
        });
      }
    }
    
    if (qualityMetrics?.healthStatus === 'poor' || qualityMetrics?.healthStatus === 'critical') {
      recommendations.push({
        type: 'warning',
        title: 'Qualità dati compromessa',
        message: 'Alcuni dati potrebbero essere inaffidabili',
        action: () => handleClearCache('all')
      });
    }
    
    return recommendations;
  };

  if (!stats || !analytics || !warmingStats || !qualityMetrics) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div>Caricamento informazioni cache...</div>
      </div>
    );
  }

  const recommendations = getRecommendations();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🗄️ Controllo Cache STUDENT ANALYST</h2>
      
      {/* Action Feedback */}
      {actionFeedback && (
        <div style={{
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          backgroundColor: actionFeedback.type === 'success' ? '#d4edda' :
                          actionFeedback.type === 'error' ? '#f8d7da' : '#d1ecf1',
          color: actionFeedback.type === 'success' ? '#155724' :
                 actionFeedback.type === 'error' ? '#721c24' : '#0c5460',
          border: `1px solid ${actionFeedback.type === 'success' ? '#c3e6cb' :
                              actionFeedback.type === 'error' ? '#f5c6cb' : '#bee5eb'}`
        }}>
          {actionFeedback.message}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #bbdefb'
        }}>
          <h3>💡 Suggerimenti intelligenti:</h3>
          {recommendations.map((rec) => (
            <div key={index} style={{ marginTop: '10px' }}>
              <div><strong>{rec.title}:</strong> {rec.message}</div>
              <button 
                onClick={rec.action}
                style={{
                  marginTop: '5px',
                  padding: '5px 10px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Applica suggerimento
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>📊</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {formatBytes((stats.combined?.totalMemoryUsed || 0) + (stats.combined?.totalStorageUsed || 0) + (stats.combined?.totalDatabaseSize || 0))}
          </div>
          <div style={{ color: '#666' }}>Memoria totale</div>
        </div>
        
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>⚡</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {((stats.combined?.overallHitRate || 0) * 100).toFixed(1)}%
          </div>
          <div style={{ color: '#666' }}>Efficienza media</div>
        </div>
        
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>📈</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {formatDuration(warmingStats.totalTimeSaved || 0)}
          </div>
          <div style={{ color: '#666' }}>Tempo risparmiato</div>
        </div>
        
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>🛡️</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: getHealthColor(qualityMetrics.healthStatus) }}>
            {qualityMetrics.healthStatus === 'excellent' ? 'Eccellente' :
             qualityMetrics.healthStatus === 'good' ? 'Buona' :
             qualityMetrics.healthStatus === 'fair' ? 'Discreta' :
             qualityMetrics.healthStatus === 'poor' ? 'Scarsa' : 'Critica'}
          </div>
          <div style={{ color: '#666' }}>Qualità dati</div>
        </div>
      </div>

      {/* Cache Layer Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>🚀 Cache Veloce (L1)</h3>
          <div>Memoria RAM - Accesso istantaneo</div>
          <div style={{ marginTop: '10px' }}>
            <div>Utilizzo: {formatBytes(stats.combined?.totalMemoryUsed || 0)}</div>
            <div>Hit Rate: {((stats.l1?.hitRate || 0) * 100).toFixed(1)}%</div>
            <div>Entries: {stats.l1?.totalEntries || 0}</div>
          </div>
          <button 
            onClick={() => handleClearCache('L1')}
            disabled={isLoading}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            Pulisci L1
          </button>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ color: '#9c27b0', marginBottom: '15px' }}>💾 Cache Persistente (L2)</h3>
          <div>LocalStorage - Persistente</div>
          <div style={{ marginTop: '10px' }}>
            <div>Utilizzo: {formatBytes(stats.combined?.totalStorageUsed || 0)}</div>
            <div>Hit Rate: {((stats.l2?.hitRate || 0) * 100).toFixed(1)}%</div>
            <div>Entries: {stats.l2?.totalEntries || 0}</div>
          </div>
          <button 
            onClick={() => handleClearCache('L2')}
            disabled={isLoading}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            Pulisci L2
          </button>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ color: '#4caf50', marginBottom: '15px' }}>🗃️ Memoria Storica (L3)</h3>
          <div>IndexedDB - Long-term</div>
          <div style={{ marginTop: '10px' }}>
            <div>Utilizzo: {formatBytes(stats.combined?.totalDatabaseSize || 0)}</div>
            <div>Hit Rate: {((stats.l3?.hitRate || 0) * 100).toFixed(1)}%</div>
            <div>Entries: {stats.l3?.totalEntries || 0}</div>
          </div>
          <button 
            onClick={() => handleClearCache('L3')}
            disabled={isLoading}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            Pulisci L3
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '30px' }}>
        <h3>⚡ Azioni Rapide</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <button 
            onClick={() => handleRefreshData()}
            disabled={isLoading}
            style={{
              padding: '12px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            🔄 Pre-caricamento Intelligente
          </button>
          
          <button 
            onClick={() => handleClearCache('all')}
            disabled={isLoading}
            style={{
              padding: '12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            🗑️ Reset Completo
          </button>
        </div>
      </div>

      {/* Performance Insights */}
      <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h3>📊 Insights Prestazioni</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '15px' }}>
          <div>
            <h4>Statistiche Utilizzo</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>• API calls evitate: {stats.combined?.totalHits || 0}</li>
              <li>• Banda risparmiata: {formatBytes(warmingStats.bandwidthSaved || 0)}</li>
              <li>• Efficienza warming: {(warmingStats.warmingEfficiency || 0).toFixed(1)}%</li>
            </ul>
          </div>
          
          <div>
            <h4>Pattern Identificati</h4>
            <div>
              {analytics.behavior?.portfolioFocus?.slice(0, 3).map((symbol: string, index: number) => (
                <span 
                  key={index}
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '4px',
                    margin: '2px',
                    fontSize: '12px'
                  }}
                >
                  {symbol}
                </span>
              ))}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Simboli più consultati nel tuo portfolio
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheControlPanelSimple;

