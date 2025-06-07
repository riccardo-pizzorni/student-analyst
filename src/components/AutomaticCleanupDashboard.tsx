/**
 * AutomaticCleanupDashboard - Dashboard per gestione cleanup automatico
 * 
 * Features:
 * - Configurazione cleanup automatico
 * - Statistiche operazioni cleanup
 * - Controlli manuali per cleanup immediato
 * - History delle operazioni
 * - LRU analytics
 */

import React, { useState, useEffect } from 'react';
import { 
  automaticCleanup, 
  CleanupConfig, 
  CleanupReport, 
  CleanupOperation 
} from '../services/AutomaticCleanupService';
import CleanupProgressDialog from './CleanupProgressDialog';
import styles from './AutomaticCleanupDashboard.module.css';

const AutomaticCleanupDashboard: React.FC = () => {
  const [config, setConfig] = useState<CleanupConfig | null>(null);
  const [history, setHistory] = useState<CleanupReport[]>([]);
  const [currentOperations, setCurrentOperations] = useState<CleanupOperation[]>([]);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<CleanupOperation | null>(null);
  const [confirmationCallback, setConfirmationCallback] = useState<((confirmed: boolean) => void) | null>(null);
  const [stats, setStats] = useState({
    totalCleanupsToday: 0,
    totalSpaceFreedToday: 0,
    avgCleanupDuration: 0,
    lastCleanupTime: null as Date | null
  });

  useEffect(() => {
    loadData();
    
    // Setup listeners
    const unsubscribeCompletion = automaticCleanup.onCompletion((report) => {
      setHistory(prev => [...prev, report]);
      updateStats();
    });

    const interval = setInterval(() => {
      setCurrentOperations(automaticCleanup.getCurrentOperations());
    }, 1000);

    return () => {
      unsubscribeCompletion();
      clearInterval(interval);
    };
  }, []);

  const loadData = () => {
    setConfig(automaticCleanup.getConfig());
    setHistory(automaticCleanup.getCleanupHistory());
    setCurrentOperations(automaticCleanup.getCurrentOperations());
    updateStats();
  };

  const updateStats = () => {
    const history = automaticCleanup.getCleanupHistory();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayReports = history.filter(report => 
      new Date(report.timestamp) >= today
    );

    const totalCleanupsToday = todayReports.length;
    const totalSpaceFreedToday = todayReports.reduce((sum, report) => sum + report.spaceFreed, 0);
    const avgCleanupDuration = todayReports.length > 0 
      ? todayReports.reduce((sum, report) => sum + report.duration, 0) / todayReports.length
      : 0;
    
    const lastCleanupTime = history.length > 0 
      ? new Date(Math.max(...history.map(report => report.timestamp)))
      : null;

    setStats({
      totalCleanupsToday,
      totalSpaceFreedToday,
      avgCleanupDuration,
      lastCleanupTime
    });
  };

  const handleConfigUpdate = (newConfig: Partial<CleanupConfig>) => {
    if (config) {
      const updatedConfig = { ...config, ...newConfig };
      automaticCleanup.updateConfig(updatedConfig);
      setConfig(updatedConfig);
    }
  };

  const handleManualCleanup = async (layer?: 'L1' | 'L2' | 'L3') => {
    try {
      const success = await automaticCleanup.forceCleanup(layer);
      if (success) {
        console.log(`✅ Cleanup ${layer || 'completo'} completato`);
      }
    } catch (error) {
      console.error('❌ Errore cleanup manuale:', (error));
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatAge = (hours: number): string => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (!config) {
    return <div className={styles.loadingContainer}>Caricamento configurazione cleanup...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ 
        margin: '0 0 24px 0', 
        fontSize: '28px', 
        fontWeight: '700',
        color: '#111827'
      }}>
        🧹 Gestione Cleanup Automatico
      </h1>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#374151' }}>
            Cleanup Oggi
          </h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#3B82F6' }}>
            {stats.totalCleanupsToday}
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            operazioni completate
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#374151' }}>
            Spazio Liberato
          </h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#10B981' }}>
            {formatBytes(stats.totalSpaceFreedToday)}
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            nelle ultime 24h
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#374151' }}>
            Durata Media
          </h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#8B5CF6' }}>
            {formatDuration(stats.avgCleanupDuration)}
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            per operazione
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#374151' }}>
            Ultimo Cleanup
          </h3>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B' }}>
            {stats.lastCleanupTime 
              ? stats.lastCleanupTime.toLocaleTimeString()
              : 'Mai'
            }
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            {stats.lastCleanupTime 
              ? stats.lastCleanupTime.toLocaleDateString()
              : 'Nessun cleanup eseguito'
            }
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            ⚙️ Configurazione Cleanup
          </h2>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Daily Cleanup Settings */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151' }}>
                Cleanup Giornaliero
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#374151',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={config.enableDailyCleanup}
                    onChange={(e) => handleConfigUpdate({ enableDailyCleanup: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  Abilita cleanup automatico giornaliero
                </label>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Orario cleanup (24h):
                </label>
                <input
                  id="daily-cleanup-time"
                  type="time"
                  value={config.dailyCleanupTime}
                  onChange={(e) => handleConfigUpdate({ dailyCleanupTime: e.target.value })}
                  aria-label="Orario cleanup giornaliero"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Data Age Settings */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151' }}>
                Età Massima Dati
              </h3>
              
              {(['L1', 'L2', 'L3'] as const).map(layer => (
                <div key={layer} style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    {layer} Cache:
                  </label>
                  <select
                    id={`max-data-age-${layer}`}
                    value={config.maxDataAge[layer]}
                    onChange={(e) => handleConfigUpdate({
                      maxDataAge: {
                        ...config.maxDataAge,
                        [layer]: parseInt(e.target.value)
                      }
                    })}
                    aria-label={`Età massima dati per cache ${layer}`}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  >
                    <option value={1 * 60 * 60 * 1000}>1 ora</option>
                    <option value={6 * 60 * 60 * 1000}>6 ore</option>
                    <option value={24 * 60 * 60 * 1000}>1 giorno</option>
                    <option value={7 * 24 * 60 * 60 * 1000}>7 giorni</option>
                    <option value={30 * 24 * 60 * 60 * 1000}>30 giorni</option>
                  </select>
                </div>
              ))}
            </div>

            {/* LRU Thresholds */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151' }}>
                Soglie LRU Cleanup
              </h3>
              
              {(['L1', 'L2', 'L3'] as const).map(layer => (
                <div key={layer} style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    {layer} Threshold: {Math.round(config.lruThresholds[layer] * 100)}%
                  </label>
                  <input
                    id={`lru-threshold-${layer}`}
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={config.lruThresholds[layer]}
                    onChange={(e) => handleConfigUpdate({
                      lruThresholds: {
                        ...config.lruThresholds,
                        [layer]: parseFloat(e.target.value)
                      }
                    })}
                    aria-label={`Soglia LRU per cache ${layer}: ${Math.round(config.lruThresholds[layer] * 100)}%`}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Controls */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            🔧 Controlli Manuali
          </h2>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <button
              onClick={() => handleManualCleanup()}
              style={{
                padding: '12px 20px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'center'
              }}
            >
              🧹 Cleanup Completo
            </button>

            <button
              onClick={() => handleManualCleanup('L1')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'center'
              }}
            >
              🔄 Cleanup L1
            </button>

            <button
              onClick={() => handleManualCleanup('L2')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'center'
              }}
            >
              💾 Cleanup L2
            </button>

            <button
              onClick={() => handleManualCleanup('L3')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'center'
              }}
            >
              🗄️ Cleanup L3
            </button>
          </div>
        </div>
      </div>

      {/* Current Operations */}
      {currentOperations.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '32px'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB'
          }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
              🔄 Operazioni in Corso
            </h2>
          </div>

          <div style={{ padding: '24px' }}>
            {currentOperations.map(operation => (
              <div key={operation.id} style={{
                padding: '16px',
                backgroundColor: '#F0F9FF',
                borderRadius: '8px',
                border: '1px solid #0EA5E9',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#0C4A6E' }}>
                      {operation.type} {operation.layer && `- ${operation.layer}`}
                    </div>
                    <div style={{ fontSize: '14px', color: '#0369A1' }}>
                      {operation.processedItems} / {operation.totalItems} elementi
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOperation(operation);
                      setShowProgressDialog(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#0EA5E9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Visualizza
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            📈 Storico Operazioni
          </h2>
        </div>

        <div style={{ padding: '24px' }}>
          {history.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#6B7280',
              padding: '40px',
              fontSize: '16px'
            }}>
              Nessuna operazione di cleanup eseguita
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Data</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Tipo</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Layer</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #E5E7EB' }}>Elementi</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #E5E7EB' }}>Spazio</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #E5E7EB' }}>Durata</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #E5E7EB' }}>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(-20).reverse().map((report, index) => (
                    <tr key={index}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #F3F4F6' }}>
                        {new Date(report.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #F3F4F6' }}>
                        {report.operationType}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #F3F4F6' }}>
                        {report.layer}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #F3F4F6' }}>
                        {report.itemsRemoved.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #F3F4F6' }}>
                        {formatBytes(report.spaceFreed)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #F3F4F6' }}>
                        {formatDuration(report.duration)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
                        {report.success ? (
                          <span style={{ color: '#10B981', fontWeight: '600' }}>✅</span>
                        ) : (
                          <span style={{ color: '#EF4444', fontWeight: '600' }}>❌</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Progress Dialog */}
      <CleanupProgressDialog
        isOpen={showProgressDialog}
        onClose={() => {
          setShowProgressDialog(false);
          setSelectedOperation(null);
          setConfirmationCallback(null);
        }}
        operation={selectedOperation || undefined}
        onConfirm={confirmationCallback || undefined}
      />
    </div>
  );
};

export default AutomaticCleanupDashboard; 

