/**
 * StorageHealthDashboard - Dashboard Monitoraggio Storage Real-Time
 * 
 * Questo componente fornisce una visualizzazione completa e in tempo reale
 * dello stato della salute dello storage su tutti e tre i layer di cache.
 * Include progress bars, warnings, raccomandazioni e controlli per la pulizia.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { storageMonitoring } from '../services/StorageMonitoringService';
import type { StorageHealth, StorageWarning } from '../services/StorageMonitoringService';
import './StorageHealthDashboard.css';

interface ProgressBarProps {
  percentage: number;
  label: string;
  color: string;
  size?: 'small' | 'medium' | 'large';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, label, color, size = 'medium' }) => {
  const height = size === 'small' ? '8px' : size === 'large' ? '16px' : '12px';
  const displayPercentage = Math.min(100, Math.max(0, percentage * 100));
  
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-header">
        <span className="progress-bar-label">{label}</span>
        <span className="progress-bar-percentage">{displayPercentage.toFixed(1)}%</span>
      </div>
      <div className="progress-bar-track" style={{ height }}>
        <div 
          className="progress-bar-fill"
          style={{ 
            width: `${displayPercentage}%`,
            backgroundColor: color,
            height: '100%',
            borderRadius: '4px',
            transition: 'width 0.3s ease-in-out'
          }}
        />
      </div>
    </div>
  );
};

interface StorageLayerCardProps {
  layerName: string;
  usage: {
    used: number;
    quota: number;
    percentage: number;
    lastUpdated: number;
  };
  onCleanup?: () => void;
}

const StorageLayerCard: React.FC<StorageLayerCardProps> = ({ layerName, usage, onCleanup }) => {
  const getStatusColor = (percentage: number): string => {
    if (percentage >= 0.98) return '#dc3545'; // emergency red
    if (percentage >= 0.95) return '#fd7e14'; // critical orange
    if (percentage >= 0.85) return '#ffc107'; // warning yellow
    if (percentage >= 0.70) return '#20c997'; // info teal
    return '#28a745'; // healthy green
  };

  const getStatusText = (percentage: number): string => {
    if (percentage >= 0.98) return 'EMERGENZA';
    if (percentage >= 0.95) return 'CRITICO';
    if (percentage >= 0.85) return 'ATTENZIONE';
    if (percentage >= 0.70) return 'INFO';
    return 'SANO';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, (i))).toFixed(2))} ${sizes[i]}`;
  };

  const statusColor = getStatusColor(usage.percentage);
  const statusText = getStatusText(usage.percentage);

  return (
    <div className="storage-layer-card">
      <div className="card-header">
        <h3 className="layer-title">{layerName}</h3>
        <span 
          className="status-badge"
          style={{ backgroundColor: statusColor, color: 'white' }}
        >
          {statusText}
        </span>
      </div>
      
      <div className="usage-info">
        <ProgressBar 
          percentage={usage.percentage}
          label={`${formatBytes(usage.used)} / ${formatBytes(usage.quota)}`}
          color={statusColor}
          size="large"
        />
      </div>

      <div className="card-footer">
        <small className="last-updated">
          Ultimo aggiornamento: {new Date(usage.lastUpdated).toLocaleTimeString()}
        </small>
        {onCleanup && usage.percentage > 0.7 && (
          <button 
            className="cleanup-button"
            onClick={onCleanup}
            style={{ 
              backgroundColor: statusColor,
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Pulisci
          </button>
        )}
      </div>
    </div>
  );
};

interface WarningAlertProps {
  warning: StorageWarning;
  onDismiss?: () => void;
}

const WarningAlert: React.FC<WarningAlertProps> = ({ warning, onDismiss }) => {
  const getAlertColor = (level: string): string => {
    switch (level) {
      case 'emergency': return '#dc3545';
      case 'critical': return '#fd7e14';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const alertColor = getAlertColor(warning.level);

  return (
    <div 
      className="warning-alert"
      style={{ 
        backgroundColor: `${alertColor}20`,
        border: `1px solid ${alertColor}`,
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px'
      }}
    >
      <div className="alert-header">
        <span 
          className="alert-level"
          style={{ 
            backgroundColor: alertColor,
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {warning.level.toUpperCase()}
        </span>
        <span className="alert-layer">{warning.layer}</span>
        {onDismiss && (
          <button 
            className="dismiss-button"
            onClick={onDismiss}
            style={{ 
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: alertColor
            }}
          >
            ×
          </button>
        )}
      </div>
      
      <div className="alert-message" style={{ margin: '8px 0' }}>
        {warning.message}
      </div>
      
      {warning.recommendations.length > 0 && (
        <div className="alert-recommendations">
          <strong>Raccomandazioni:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            {warning.recommendations.map((rec) => (
              <li key={index} style={{ fontSize: '14px' }}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const StorageHealthDashboard: React.FC = () => {
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);
  const [warnings, setWarnings] = useState<StorageWarning[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inizializzazione del servizio
  useEffect(() => {
    let mounted = true;

    const initializeService = async () => {
      try {
        setIsLoading(true);
        await storageMonitoring.initialize();
        
        if (mounted) {
          setIsInitialized(true);
          setError(null);
        }
      } catch (_err) {
        if (mounted) {
          setError(`Errore inizializzazione: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeService();

    return () => {
      mounted = false;
    };
  }, []);

  // Subscription agli aggiornamenti dello stato
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribeHealth = storageMonitoring.onHealthUpdate((health) => {
      setStorageHealth(health);
    });

    const unsubscribeWarnings = storageMonitoring.onWarning((warning) => {
      setWarnings(prev => {
        // Evita duplicati
        const exists = prev.find(w => 
          w.layer === warning.layer && 
          w.level === warning.level &&
          Math.abs(w.timestamp - warning.timestamp) < 1000
        );
        
        if (exists) return prev;
        
        // Mantieni solo gli ultimi 10 warning
        const newWarnings = [warning, ...prev].slice(0, 10);
        return newWarnings;
      });
    });

    return () => {
      unsubscribeHealth();
      unsubscribeWarnings();
    };
  }, [isInitialized]);

  // Handler per cleanup manuale
  const handleLayerCleanup = useCallback(async (layer: 'L1' | 'L2' | 'L3') => {
    try {
      console.log(`🧹 Avvio cleanup manuale per ${layer}...`);
      
      // Force health check dopo cleanup
      setTimeout(async () => {
        await storageMonitoring.forceHealthCheck();
      }, 1000);
      
    } catch (error) {
      console.error(`❌ Errore cleanup ${layer}:`, (error));
    }
  }, []);

  // Handler per dismissing dei warning
  const handleDismissWarning = useCallback((index: number) => {
    setWarnings(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handler per force refresh
  const handleForceRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await storageMonitoring.forceHealthCheck();
    } catch (error) {
      console.error('❌ Errore force refresh:', (error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Loading state
  if (isLoading && !storageHealth) {
    return (
      <div className="storage-dashboard loading">
        <div className="loading-spinner">🔄</div>
        <p>Inizializzazione monitoraggio storage...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="storage-dashboard error">
        <div className="error-icon">⚠️</div>
        <h3>Errore Monitoraggio Storage</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Riprova
        </button>
      </div>
    );
  }

  // No data state
  if (!storageHealth) {
    return (
      <div className="storage-dashboard no-data">
        <div className="no-data-icon">📊</div>
        <p>Nessun dato disponibile</p>
        <button onClick={handleForceRefresh}>Aggiorna</button>
      </div>
    );
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, (i))).toFixed(2))} ${sizes[i]}`;
  };

  const getOverallStatusColor = (status: string): string => {
    switch (status) {
      case 'emergency': return '#dc3545';
      case 'critical': return '#fd7e14';
      case 'warning': return '#ffc107';
      case 'healthy': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div className="storage-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2>🏥 Monitoraggio Salute Storage</h2>
        <div className="header-controls">
          <span 
            className="overall-status"
            style={{ 
              backgroundColor: getOverallStatusColor(storageHealth.overall),
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {storageHealth.overall.toUpperCase()}
          </span>
          <button 
            onClick={handleForceRefresh}
            disabled={isLoading}
            className="refresh-button"
          >
            {isLoading ? '🔄' : '🔄'} Aggiorna
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card">
          <h4>Utilizzo Totale</h4>
          <p className="stat-value">{formatBytes(storageHealth.totalUsed)}</p>
          <small>di {formatBytes(storageHealth.totalQuota)} disponibili</small>
        </div>
        <div className="stat-card">
          <h4>Warning Attivi</h4>
          <p className="stat-value">{warnings.length}</p>
          <small>richiede attenzione</small>
        </div>
        <div className="stat-card">
          <h4>Ultimo Check</h4>
          <p className="stat-value">
            {new Date(storageHealth.lastCheck).toLocaleTimeString()}
          </p>
          <small>monitoraggio attivo</small>
        </div>
      </div>

      {/* Warning Alerts */}
      {warnings.length > 0 && (
        <div className="warnings-section">
          <h3>⚠️ Avvisi Attivi</h3>
          <div className="warnings-list">
            {warnings.map((warning) => (
              <WarningAlert 
                key={`${warning.timestamp}-${warning.layer}-${index}`}
                warning={warning}
                onDismiss={() => handleDismissWarning(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Storage Layers */}
      <div className="storage-layers">
        <h3>📊 Dettaglio Layer Storage</h3>
        <div className="layers-grid">
          <StorageLayerCard 
            layerName="L1 - Memory Cache"
            usage={storageHealth.l1}
            onCleanup={() => handleLayerCleanup('L1')}
          />
          <StorageLayerCard 
            layerName="L2 - LocalStorage"
            usage={storageHealth.l2}
            onCleanup={() => handleLayerCleanup('L2')}
          />
          <StorageLayerCard 
            layerName="L3 - IndexedDB"
            usage={storageHealth.l3}
            onCleanup={() => handleLayerCleanup('L3')}
          />
        </div>
      </div>

      {/* Global Actions */}
      <div className="global-actions">
        <h3>🛠️ Azioni Globali</h3>
        <div className="actions-grid">
          <button 
            className="action-button cleanup"
            onClick={() => {
              ['L1', 'L2', 'L3'].forEach(layer => 
                handleLayerCleanup(layer as 'L1' | 'L2' | 'L3')
              );
            }}
          >
            🧹 Cleanup Completo
          </button>
          <button 
            className="action-button settings"
            onClick={() => console.log('Settings da implementare')}
          >
            ⚙️ Impostazioni
          </button>
          <button 
            className="action-button export"
            onClick={() => {
              const data = JSON.stringify(storageHealth, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `storage-health-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            📥 Esporta Report
          </button>
        </div>
      </div>


    </div>
  );
};

export default StorageHealthDashboard; 

