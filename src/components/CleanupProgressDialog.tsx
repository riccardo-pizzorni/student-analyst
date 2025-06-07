/**
 * CleanupProgressDialog - Dialogo per conferme e progresso cleanup
 * 
 * Componente che gestisce:
 * - User confirmation per major cleanup operations
 * - Progress tracking real-time durante cleanup
 * - Risultati e report delle operazioni
 * - Controlli per cancellazione operazioni
 */

import React, { useState, useEffect } from 'react';
import { automaticCleanup, CleanupProgress, CleanupOperation, CleanupReport } from '../services/AutomaticCleanupService';

interface CleanupProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operation?: CleanupOperation;
  onConfirm?: (confirmed: boolean) => void;
}

const CleanupProgressDialog: React.FC<CleanupProgressDialogProps> = ({
  isOpen,
  onClose,
  operation,
  onConfirm
}) => {
  const [progress, setProgress] = useState<CleanupProgress | null>(null);
  const [report, setReport] = useState<CleanupReport | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen || !operation) return;

    // Determina se mostrare confirmation dialog
    const needsConfirmation = operation.status === 'PENDING' && 
      (operation.riskLevel !== 'LOW' || operation.totalItems > 100);
    
    setShowConfirmation(needsConfirmation);
    setIsCompleted(false);
    setReport(null);
    setProgress(null);

    // Setup listeners per progress e completion
    const unsubscribeProgress = automaticCleanup.onProgress((prog) => {
      if (prog.operationId === operation.id) {
        setProgress(prog);
        
        if (prog.status === 'COMPLETED') {
          setIsCompleted(true);
        }
      }
    });

    const unsubscribeCompletion = automaticCleanup.onCompletion((rep) => {
      if (rep.timestamp >= operation.startTime) {
        setReport(rep);
        setIsCompleted(true);
      }
    });

    return () => {
      unsubscribeProgress();
      unsubscribeCompletion();
    };
  }, [isOpen, operation]);

  const handleConfirm = (confirmed: boolean) => {
    setShowConfirmation(false);
    if (onConfirm) {
      onConfirm(confirmed);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, (i))).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'LOW': return '#10B981';
      case 'MEDIUM': return '#F59E0B';
      case 'HIGH': return '#EF4444';
      case 'CRITICAL': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getOperationTypeLabel = (type: string): string => {
    switch (type) {
      case 'DAILY': return 'Pulizia Giornaliera';
      case 'LRU': return 'Pulizia LRU';
      case 'MANUAL': return 'Pulizia Manuale';
      case 'EMERGENCY': return 'Pulizia Emergenza';
      default: return 'Pulizia';
    }
  };

  if (!isOpen || !operation) {
    return null;
  }

  return (
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
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827'
            }}>
              {showConfirmation ? 'Conferma Operazione' : 'Progresso Cleanup'}
            </h2>
            
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6B7280',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{
            marginTop: '8px',
            fontSize: '14px',
            color: '#6B7280'
          }}>
            {getOperationTypeLabel(operation.type)}
            {operation.layer && ` - Layer ${operation.layer}`}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {showConfirmation && (
            <div>
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#FEF3C7',
                borderRadius: '8px',
                border: '1px solid #F59E0B'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '20px', marginRight: '8px' }}>⚠️</span>
                  <span style={{
                    fontWeight: '600',
                    color: '#92400E'
                  }}>
                    Operazione di Pulizia Richiesta
                  </span>
                </div>
                
                <div style={{
                  fontSize: '14px',
                  color: '#78350F',
                  marginBottom: '12px'
                }}>
                  Questa operazione rimuoverà dati dal sistema. Verifica i dettagli prima di procedere.
                </div>
              </div>

              {/* Operation Details */}
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Dettagli Operazione
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '14px'
                }}>
                  <div>
                    <strong>Elementi da rimuovere:</strong><br />
                    <span style={{ color: '#6B7280' }}>{operation.totalItems.toLocaleString()}</span>
                  </div>
                  
                  <div>
                    <strong>Spazio da liberare:</strong><br />
                    <span style={{ color: '#6B7280' }}>{formatBytes(operation.totalSize)}</span>
                  </div>
                  
                  <div>
                    <strong>Livello di rischio:</strong><br />
                    <span style={{ 
                      color: getRiskLevelColor(operation.riskLevel),
                      fontWeight: '600'
                    }}>
                      {operation.riskLevel}
                    </span>
                  </div>
                  
                  <div>
                    <strong>Tipo operazione:</strong><br />
                    <span style={{ color: '#6B7280' }}>{getOperationTypeLabel(operation.type)}</span>
                  </div>
                </div>
              </div>

              {/* Preview of items to be cleaned */}
              {operation.itemsToClean.length > 0 && (
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Anteprima Elementi ({Math.min(5, operation.itemsToClean.length)} di {operation.totalItems})
                  </h3>
                  
                  <div style={{ fontSize: '13px' }}>
                    {operation.itemsToClean.slice(0, 5).map((item) => (
                      <div key={index} style={{
                        padding: '8px 12px',
                        marginBottom: '4px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        border: '1px solid #E5E7EB'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ color: '#374151' }}>{item.description}</span>
                          <span style={{ color: '#6B7280', fontSize: '12px' }}>
                            {formatBytes(item.size)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {operation.totalItems > 5 && (
                      <div style={{
                        textAlign: 'center',
                        color: '#6B7280',
                        fontStyle: 'italic',
                        marginTop: '8px'
                      }}>
                        ... e altri {operation.totalItems - 5} elementi
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Confirmation Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => handleConfirm(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: 'white',
                    color: '#374151',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Annulla
                </button>
                
                <button
                  onClick={() => handleConfirm(true)}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    backgroundColor: '#EF4444',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Conferma Pulizia
                </button>
              </div>
            </div>
          )}

          {!showConfirmation && progress && (
            <div>
              {/* Progress Bar */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Progresso: {Math.round(progress.percentage)}%
                  </span>
                  
                  <span style={{
                    fontSize: '12px',
                    color: '#6B7280'
                  }}>
                    {progress.processedCount} / {progress.totalCount}
                  </span>
                </div>
                
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#E5E7EB',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progress.percentage}%`,
                    height: '100%',
                    backgroundColor: isCompleted ? '#10B981' : '#3B82F6',
                    transition: 'width 0.3s ease-in-out'
                  }} />
                </div>
              </div>

              {/* Current Item */}
              {progress.currentItem && !isCompleted && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#F0F9FF',
                  borderRadius: '6px',
                  border: '1px solid #0EA5E9'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#0369A1',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    Elaborando:
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#0C4A6E'
                  }}>
                    {progress.currentItem}
                  </div>
                </div>
              )}

              {/* Progress Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                <div>
                  <strong>Spazio liberato:</strong><br />
                  <span style={{ color: '#10B981', fontWeight: '600' }}>
                    {formatBytes(progress.freedSpace)}
                  </span>
                  <span style={{ color: '#6B7280' }}>
                    {' '} / {formatBytes(progress.totalSpace)}
                  </span>
                </div>
                
                <div>
                  <strong>Tempo trascorso:</strong><br />
                  <span style={{ color: '#6B7280' }}>
                    {formatDuration(progress.elapsedTime)}
                  </span>
                </div>
                
                {!isCompleted && progress.estimatedTimeRemaining > 0 && (
                  <>
                    <div>
                      <strong>Tempo stimato:</strong><br />
                      <span style={{ color: '#6B7280' }}>
                        {formatDuration(progress.estimatedTimeRemaining)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Status */}
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: isCompleted ? '#D1FAE5' : '#F0F9FF',
                border: `1px solid ${isCompleted ? '#10B981' : '#0EA5E9'}`,
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>
                  {isCompleted ? '✅' : '🔄'}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isCompleted ? '#065F46' : '#0C4A6E'
                }}>
                  {isCompleted ? 'Operazione Completata' : 'Operazione in Corso...'}
                </div>
              </div>
            </div>
          )}

          {isCompleted && report && (
            <div style={{ marginTop: '20px' }}>
              {/* Success Report */}
              <div style={{
                padding: '16px',
                backgroundColor: report.success ? '#D1FAE5' : '#FEE2E2',
                borderRadius: '8px',
                border: `1px solid ${report.success ? '#10B981' : '#EF4444'}`,
                marginBottom: '16px'
              }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: report.success ? '#065F46' : '#991B1B'
                }}>
                  {report.success ? '✅ Operazione Completata' : '❌ Operazione Fallita'}
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '14px',
                  color: report.success ? '#047857' : '#B91C1C'
                }}>
                  <div>
                    <strong>Elementi rimossi:</strong><br />
                    {report.itemsRemoved.toLocaleString()}
                  </div>
                  
                  <div>
                    <strong>Spazio liberato:</strong><br />
                    {formatBytes(report.spaceFreed)}
                  </div>
                  
                  <div>
                    <strong>Durata:</strong><br />
                    {formatDuration(report.duration)}
                  </div>
                  
                  <div>
                    <strong>Layer:</strong><br />
                    {report.layer}
                  </div>
                </div>

                {!report.success && report.errors.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: '#FECACA',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <strong>Errori:</strong><br />
                    {report.errors.map((error) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Chiudi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleanupProgressDialog; 

