/**
 * StorageHealthDashboardSimple - Dashboard Monitoraggio Storage Real-Time (Versione Semplificata)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { storageMonitoring } from '../services/StorageMonitoringService';
import type { StorageHealth, StorageWarning } from '../services/StorageMonitoringService';

const StorageHealthDashboardSimple: React.FC = () => {
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
        const exists = prev.find(w => 
          w.layer === warning.layer && 
          w.level === warning.level &&
          Math.abs(w.timestamp - warning.timestamp) < 1000
        );
        
        if (exists) return prev;
        
        const newWarnings = [warning, ...prev].slice(0, 10);
        return newWarnings;
      });
    });

    return () => {
      unsubscribeHealth();
      unsubscribeWarnings();
    };
  }, [isInitialized]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, (i))).toFixed(2))} ${sizes[i]}`;
  };

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
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
        <p>Inizializzazione monitoraggio storage...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3>Errore Monitoraggio Storage</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '16px'
          }}
        >
          Riprova
        </button>
      </div>
    );
  }

  // No data state
  if (!storageHealth) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p>Nessun dato disponibile</p>
        <button onClick={handleForceRefresh}>Aggiorna</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h2>🏥 Monitoraggio Salute Storage</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span 
            style={{ 
              backgroundColor: getStatusColor(Math.max(
                storageHealth.l1.percentage,
                storageHealth.l2.percentage,
                storageHealth.l3.percentage
              )),
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
            style={{
              padding: '6px 12px',
              border: '1px solid #007bff',
              backgroundColor: 'white',
              color: '#007bff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isLoading ? '🔄' : '🔄'} Aggiorna
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ 
          background: 'white', 
          padding: '16px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          textAlign: 'center' 
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '14px' }}>Utilizzo Totale</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0', color: '#212529' }}>
            {formatBytes(storageHealth.totalUsed)}
          </p>
          <small>di {formatBytes(storageHealth.totalQuota)} disponibili</small>
        </div>
        <div style={{ 
          background: 'white', 
          padding: '16px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          textAlign: 'center' 
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '14px' }}>Warning Attivi</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0', color: '#212529' }}>
            {warnings.length}
          </p>
          <small>richiede attenzione</small>
        </div>
        <div style={{ 
          background: 'white', 
          padding: '16px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          textAlign: 'center' 
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '14px' }}>Ultimo Check</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0', color: '#212529' }}>
            {new Date(storageHealth.lastCheck).toLocaleTimeString()}
          </p>
          <small>monitoraggio attivo</small>
        </div>
      </div>

      {/* Warning Alerts */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#495057' }}>⚠️ Avvisi Attivi</h3>
          <div>
            {warnings.map((warning) => (
              <div 
                key={`${warning.timestamp}-${warning.layer}-${index}`}
                style={{ 
                  backgroundColor: `${getStatusColor(warning.percentage)}20`,
                  border: `1px solid ${getStatusColor(warning.percentage)}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span 
                    style={{ 
                      backgroundColor: getStatusColor(warning.percentage),
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {warning.level.toUpperCase()}
                  </span>
                  <span>{warning.layer}</span>
                </div>
                
                <div style={{ margin: '8px 0' }}>
                  {warning.message}
                </div>
                
                {warning.recommendations.length > 0 && (
                  <div>
                    <strong>Raccomandazioni:</strong>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      {warning.recommendations.map((rec, recIndex) => (
                        <li key={recIndex} style={{ fontSize: '14px' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Storage Layers */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: '#495057' }}>📊 Dettaglio Layer Storage</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '16px' 
        }}>
          {/* L1 Card */}
          <div style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '16px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <h3 style={{ margin: '0', fontSize: '16px', color: '#212529' }}>L1 - Memory Cache</h3>
              <span 
                style={{ 
                  backgroundColor: getStatusColor(storageHealth.l1.percentage),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {getStatusText(storageHealth.l1.percentage)}
              </span>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                <span>{formatBytes(storageHealth.l1.used)} / {formatBytes(storageHealth.l1.quota)}</span>
                <span>{(storageHealth.l1.percentage * 100).toFixed(1)}%</span>
              </div>
              <div style={{ backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden', height: '16px' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, Math.max(0, storageHealth.l1.percentage * 100))}%`,
                    backgroundColor: getStatusColor(storageHealth.l1.percentage),
                    height: '100%',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease-in-out'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '12px', 
              color: '#6c757d' 
            }}>
              <small>Ultimo aggiornamento: {new Date(storageHealth.l1.lastUpdated).toLocaleTimeString()}</small>
            </div>
          </div>

          {/* L2 Card */}
          <div style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '16px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <h3 style={{ margin: '0', fontSize: '16px', color: '#212529' }}>L2 - LocalStorage</h3>
              <span 
                style={{ 
                  backgroundColor: getStatusColor(storageHealth.l2.percentage),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {getStatusText(storageHealth.l2.percentage)}
              </span>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                <span>{formatBytes(storageHealth.l2.used)} / {formatBytes(storageHealth.l2.quota)}</span>
                <span>{(storageHealth.l2.percentage * 100).toFixed(1)}%</span>
              </div>
              <div style={{ backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden', height: '16px' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, Math.max(0, storageHealth.l2.percentage * 100))}%`,
                    backgroundColor: getStatusColor(storageHealth.l2.percentage),
                    height: '100%',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease-in-out'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '12px', 
              color: '#6c757d' 
            }}>
              <small>Ultimo aggiornamento: {new Date(storageHealth.l2.lastUpdated).toLocaleTimeString()}</small>
            </div>
          </div>

          {/* L3 Card */}
          <div style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '16px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <h3 style={{ margin: '0', fontSize: '16px', color: '#212529' }}>L3 - IndexedDB</h3>
              <span 
                style={{ 
                  backgroundColor: getStatusColor(storageHealth.l3.percentage),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {getStatusText(storageHealth.l3.percentage)}
              </span>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                <span>{formatBytes(storageHealth.l3.used)} / {formatBytes(storageHealth.l3.quota)}</span>
                <span>{(storageHealth.l3.percentage * 100).toFixed(1)}%</span>
              </div>
              <div style={{ backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden', height: '16px' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, Math.max(0, storageHealth.l3.percentage * 100))}%`,
                    backgroundColor: getStatusColor(storageHealth.l3.percentage),
                    height: '100%',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease-in-out'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '12px', 
              color: '#6c757d' 
            }}>
              <small>Ultimo aggiornamento: {new Date(storageHealth.l3.lastUpdated).toLocaleTimeString()}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Global Actions */}
      <div>
        <h3 style={{ marginBottom: '16px', color: '#495057' }}>🛠️ Azioni Globali</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px' 
        }}>
          <button 
            style={{
              padding: '12px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: '#dc3545',
              color: 'white'
            }}
            onClick={() => console.log('Cleanup completo richiesto')}
          >
            🧹 Cleanup Completo
          </button>
          <button 
            style={{
              padding: '12px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: '#6c757d',
              color: 'white'
            }}
            onClick={() => console.log('Impostazioni da implementare')}
          >
            ⚙️ Impostazioni
          </button>
          <button 
            style={{
              padding: '12px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: '#007bff',
              color: 'white'
            }}
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

export default StorageHealthDashboardSimple; 

