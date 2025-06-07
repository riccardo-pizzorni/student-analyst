/**
 * StorageManagementSettings - Pagina Impostazioni Gestione Memoria
 * 
 * Features:
 * - Storage visualization con breakdown dettagliato
 * - Clear Cache buttons con confirmation
 * - Selective cleanup per data type
 * - Storage usage analytics
 */

import React, { useState, useEffect } from 'react';
import { 
  manualStorageManagement, 
  StorageBreakdown, 
  CleanupPreview, 
  SelectiveCleanupOptions,
  ClearCacheOptions,
  ManualOperationResult
} from '../services/ManualStorageManagementService';

const StorageManagementSettings: React.FC = () => {
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState<string | null>(null);
  const [showCleanupPreview, setShowCleanupPreview] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [lastResult, setLastResult] = useState<ManualOperationResult | null>(null);

  useEffect(() => {
    loadStorageBreakdown();
  }, []);

  const loadStorageBreakdown = async () => {
    try {
      setLoading(true);
      const data = await manualStorageManagement.analyzeStorageBreakdown();
      setBreakdown(data);
    } catch (error) {
      console.error('❌ Error loading storage breakdown:', (error));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await manualStorageManagement.refreshAnalysis();
      setBreakdown(data);
    } catch (error) {
      console.error('❌ Error refreshing analysis:', (error));
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearCache = async (options: ClearCacheOptions) => {
    try {
      setOperationInProgress(true);
      const result = await manualStorageManagement.clearCache(options);
      setLastResult(result);
      
      if (result.success) {
        // Refresh data after successful clear
        await loadStorageBreakdown();
      }
    } catch (error) {
      console.error('❌ Clear cache failed:', (error));
      setLastResult({
        success: false,
        itemsProcessed: 0,
        spaceFreed: 0,
        duration: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        undoAvailable: false
      });
    } finally {
      setOperationInProgress(false);
      setShowClearConfirm(null);
    }
  };

  const handleSelectiveCleanup = async () => {
    if (!cleanupPreview) return;

    try {
      setOperationInProgress(true);
      
      const options: SelectiveCleanupOptions = {
        dataTypes: selectedDataTypes.length > 0 ? selectedDataTypes : undefined,
        symbols: selectedSymbols.length > 0 ? selectedSymbols : undefined
      };

      const result = await manualStorageManagement.executeSelectiveCleanup(options, true);
      setLastResult(result);
      
      if (result.success) {
        // Refresh data after successful cleanup
        await loadStorageBreakdown();
        setShowCleanupPreview(false);
        setCleanupPreview(null);
        setSelectedDataTypes([]);
        setSelectedSymbols([]);
      }
    } catch (error) {
      console.error('❌ Selective cleanup failed:', (error));
      setLastResult({
        success: false,
        itemsProcessed: 0,
        spaceFreed: 0,
        duration: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        undoAvailable: false
      });
    } finally {
      setOperationInProgress(false);
    }
  };

  const generatePreview = async () => {
    try {
      const options: SelectiveCleanupOptions = {
        dataTypes: selectedDataTypes.length > 0 ? selectedDataTypes : undefined,
        symbols: selectedSymbols.length > 0 ? selectedSymbols : undefined
      };

      const preview = await manualStorageManagement.generateCleanupPreview(options);
      setCleanupPreview(preview);
      setShowCleanupPreview(true);
    } catch (error) {
      console.error('❌ Error generating preview:', (error));
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, (i))).toFixed(2))} ${sizes[i]}`;
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return '#EF4444';
    if (percentage >= 75) return '#F59E0B';
    if (percentage >= 50) return '#10B981';
    return '#3B82F6';
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'LOW': return '#10B981';
      case 'MEDIUM': return '#F59E0B';
      case 'HIGH': return '#EF4444';
      case 'CRITICAL': return '#DC2626';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>🔍</div>
        <div>Analizzando utilizzo memoria...</div>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>❌</div>
        <div>Errore caricamento dati memoria</div>
        <button
          onClick={loadStorageBreakdown}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '28px', 
          fontWeight: '700',
          color: '#111827'
        }}>
          ⚙️ Gestione Memoria
        </h1>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '10px 20px',
            backgroundColor: refreshing ? '#9CA3AF' : '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {refreshing ? '🔄 Aggiornando...' : '🔄 Aggiorna'}
        </button>
      </div>

      {/* Storage Overview */}
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
            📊 Panoramica Storage
          </h2>
          <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
            Aggiornato: {new Date(breakdown.lastUpdated).toLocaleString()}
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Total Usage Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              padding: '16px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#3B82F6' }}>
                {formatBytes(breakdown.totalSize)}
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                Spazio Totale Utilizzato
              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981' }}>
                {breakdown.totalCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                Elementi Totali
              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#8B5CF6' }}>
                {Object.keys(breakdown.byType).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                Tipi di Dati
              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B' }}>
                {Object.keys(breakdown.bySymbol).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                Simboli Tracciati
              </div>
            </div>
          </div>

          {/* Layer Breakdown */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
              📊 Utilizzo per Layer
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              {(['L1', 'L2', 'L3'] as const).map(layer => (
                <div key={layer} style={{
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                      {layer} - {layer === 'L1' ? 'Memory' : layer === 'L2' ? 'LocalStorage' : 'IndexedDB'}
                    </h4>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: getUsageColor(breakdown.byLayer[layer].usagePercentage)
                    }}>
                      {Math.round(breakdown.byLayer[layer].usagePercentage)}%
                    </span>
                  </div>

                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${breakdown.byLayer[layer].usagePercentage}%`,
                      height: '100%',
                      backgroundColor: getUsageColor(breakdown.byLayer[layer].usagePercentage),
                      transition: 'width 0.3s ease-in-out'
                    }} />
                  </div>

                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    <div>Utilizzato: {formatBytes(breakdown.byLayer[layer].usedSize)}</div>
                    <div>Quota: {formatBytes(breakdown.byLayer[layer].quota)}</div>
                    <div>Elementi: {breakdown.byLayer[layer].itemCount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Type Breakdown */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
              📁 Breakdown per Tipo Dati
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '12px'
            }}>
              {Object.values(breakdown.byType)
                .sort((a, b) => b.size - a.size)
                .map((category) => (
                <div key={category.type} style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {category.name}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      {formatBytes(category.size)}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#6B7280'
                  }}>
                    <span>{category.count} elementi</span>
                    <span>{category.symbols.length} simboli</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cache Controls */}
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
            🗑️ Clear Cache
          </h2>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => setShowClearConfirm('all')}
              disabled={operationInProgress}
              style={{
                padding: '12px 20px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: operationInProgress ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: operationInProgress ? 0.6 : 1
              }}
            >
              🗑️ Clear All Cache
            </button>

            <button
              onClick={() => setShowClearConfirm('L1')}
              disabled={operationInProgress}
              style={{
                padding: '12px 20px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: operationInProgress ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: operationInProgress ? 0.6 : 1
              }}
            >
              🔄 Clear L1 (Memory)
            </button>

            <button
              onClick={() => setShowClearConfirm('L2')}
              disabled={operationInProgress}
              style={{
                padding: '12px 20px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: operationInProgress ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: operationInProgress ? 0.6 : 1
              }}
            >
              💾 Clear L2 (LocalStorage)
            </button>

            <button
              onClick={() => setShowClearConfirm('L3')}
              disabled={operationInProgress}
              style={{
                padding: '12px 20px',
                backgroundColor: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: operationInProgress ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: operationInProgress ? 0.6 : 1
              }}
            >
              🗄️ Clear L3 (IndexedDB)
            </button>
          </div>

          {/* Clear Confirmation Dialog */}
          {showClearConfirm && (
            <div style={{
              padding: '16px',
              backgroundColor: '#FEF3C7',
              borderRadius: '8px',
              border: '1px solid #F59E0B',
              marginTop: '16px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#92400E' }}>
                ⚠️ Conferma Clear Cache
              </h4>
              
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#78350F' }}>
                {showClearConfirm === 'all' 
                  ? 'Questa operazione eliminerà TUTTI i dati dalla cache. Tutti i layer (L1, L2, L3) verranno svuotati completamente.'
                  : `Questa operazione eliminerà tutti i dati dal layer ${showClearConfirm}.`
                }
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    const options: ClearCacheOptions = {
                      layers: showClearConfirm === 'all' ? ['L1', 'L2', 'L3'] : [showClearConfirm as 'L1' | 'L2' | 'L3'],
                      confirmationLevel: 'NEVER_ASK',
                      createBackup: true,
                      preserveCritical: true
                    };
                    handleClearCache(options);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Conferma Clear
                </button>

                <button
                  onClick={() => setShowClearConfirm(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selective Cleanup */}
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
            🎯 Pulizia Selettiva
          </h2>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Data Type Selection */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              Seleziona Tipi di Dati da Eliminare:
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px'
            }}>
              {Object.values(breakdown.byType).map(category => (
                <label key={category.type} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: selectedDataTypes.includes(category.type) ? '#EBF8FF' : '#F9FAFB',
                  borderRadius: '6px',
                  border: `1px solid ${selectedDataTypes.includes(category.type) ? '#3B82F6' : '#E5E7EB'}`,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedDataTypes.includes(category.type)}
                    onChange={(_e) => {
                      if (e.target.checked) {
                        setSelectedDataTypes([...selectedDataTypes, category.type]);
                      } else {
                        setSelectedDataTypes(selectedDataTypes.filter(t => t !== category.type));
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  <span>{category.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6B7280' }}>
                    {formatBytes(category.size)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Symbol Selection */}
          {Object.keys(breakdown.bySymbol).length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                Seleziona Simboli da Eliminare (opzionale):
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '8px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {Object.values(breakdown.bySymbol)
                  .sort((a, b) => b.totalSize - a.totalSize)
                  .slice(0, 20) // Show top 20 symbols
                  .map(symbolData => (
                  <label key={symbolData.symbol} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 10px',
                    backgroundColor: selectedSymbols.includes(symbolData.symbol) ? '#F0FDF4' : '#F9FAFB',
                    borderRadius: '4px',
                    border: `1px solid ${selectedSymbols.includes(symbolData.symbol) ? '#10B981' : '#E5E7EB'}`,
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedSymbols.includes(symbolData.symbol)}
                      onChange={(_e) => {
                        if (e.target.checked) {
                          setSelectedSymbols([...selectedSymbols, symbolData.symbol]);
                        } else {
                          setSelectedSymbols(selectedSymbols.filter(s => s !== symbolData.symbol));
                        }
                      }}
                      style={{ marginRight: '6px' }}
                    />
                    <span style={{ fontWeight: '500' }}>{symbolData.symbol}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#6B7280' }}>
                      {formatBytes(symbolData.totalSize)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={generatePreview}
              disabled={operationInProgress || selectedDataTypes.length === 0}
              style={{
                padding: '10px 20px',
                backgroundColor: selectedDataTypes.length === 0 ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: selectedDataTypes.length === 0 || operationInProgress ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🔍 Anteprima Pulizia
            </button>

            <button
              onClick={() => {
                setSelectedDataTypes([]);
                setSelectedSymbols([]);
                setCleanupPreview(null);
                setShowCleanupPreview(false);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🔄 Reset Selezione
            </button>
          </div>
        </div>
      </div>

      {/* Cleanup Preview Dialog */}
      {showCleanupPreview && cleanupPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                🔍 Anteprima Pulizia Selettiva
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Preview Summary */}
              <div style={{
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  fontSize: '14px'
                }}>
                  <div>
                    <strong>Elementi da eliminare:</strong><br />
                    <span style={{ color: '#6B7280' }}>{cleanupPreview.totalCount.toLocaleString()}</span>
                  </div>
                  
                  <div>
                    <strong>Spazio da liberare:</strong><br />
                    <span style={{ color: '#6B7280' }}>{formatBytes(cleanupPreview.totalSize)}</span>
                  </div>
                  
                  <div>
                    <strong>Layer coinvolti:</strong><br />
                    <span style={{ color: '#6B7280' }}>{cleanupPreview.layersAffected.join(', ')}</span>
                  </div>
                  
                  <div>
                    <strong>Livello di rischio:</strong><br />
                    <span style={{ 
                      color: getRiskColor(cleanupPreview.riskLevel),
                      fontWeight: '600'
                    }}>
                      {cleanupPreview.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Warning */}
              {cleanupPreview.riskLevel !== 'LOW' && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '6px',
                  border: '1px solid #F59E0B',
                  marginBottom: '20px'
                }}>
                  <div style={{ color: '#92400E', fontSize: '14px', fontWeight: '500' }}>
                    ⚠️ Attenzione: Operazione a rischio {cleanupPreview.riskLevel}
                  </div>
                  <div style={{ color: '#78350F', fontSize: '13px', marginTop: '4px' }}>
                    Questa operazione potrebbe influire sulla funzionalità del sistema. Verrà creato un backup automatico.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowCleanupPreview(false);
                    setCleanupPreview(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Annulla
                </button>
                
                <button
                  onClick={handleSelectiveCleanup}
                  disabled={operationInProgress}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: operationInProgress ? '#9CA3AF' : '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: operationInProgress ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {operationInProgress ? '🔄 Elaborando...' : '🗑️ Conferma Pulizia'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operation Result */}
      {lastResult && (
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
              📋 Risultato Operazione
            </h2>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: lastResult.success ? '#D1FAE5' : '#FEE2E2',
              borderRadius: '8px',
              border: `1px solid ${lastResult.success ? '#10B981' : '#EF4444'}`
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: lastResult.success ? '#065F46' : '#991B1B',
                marginBottom: '8px'
              }}>
                {lastResult.success ? '✅ Operazione completata con successo' : '❌ Operazione fallita'}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                fontSize: '14px',
                color: lastResult.success ? '#047857' : '#B91C1C'
              }}>
                <div>
                  <strong>Elementi elaborati:</strong><br />
                  {lastResult.itemsProcessed.toLocaleString()}
                </div>
                
                <div>
                  <strong>Spazio liberato:</strong><br />
                  {formatBytes(lastResult.spaceFreed)}
                </div>
                
                <div>
                  <strong>Durata:</strong><br />
                  {(lastResult.duration / 1000).toFixed(2)}s
                </div>
              </div>

              {lastResult.errors.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  backgroundColor: '#FECACA',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <strong>Errori:</strong>
                  {lastResult.errors.map((error) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}

              {lastResult.undoAvailable && (
                <div style={{
                  marginTop: '12px',
                  fontSize: '14px',
                  color: '#059669'
                }}>
                  💾 Backup creato - operazione reversibile
                </div>
              )}
            </div>

            <button
              onClick={() => setLastResult(null)}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageManagementSettings; 

