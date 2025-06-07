/**
 * Auto Save Recovery Component
 * 
 * Gestisce il recovery automatico dei dati quando l'utente riapre l'applicazione
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { autoSaveService, AutoSaveSession } from '../services/AutoSaveService';

export interface RecoveryData {
  stepId: string;
  stepName: string;
  lastSaved: Date;
  dataSize: number;
  version: number;
}

export interface AutoSaveRecoveryProps {
  onRecoveryComplete?: (recoveredSteps: string[]) => void;
  onRecoveryDeclined?: () => void;
  className?: string;
}

export const AutoSaveRecovery: React.FC<AutoSaveRecoveryProps> = ({
  onRecoveryComplete,
  onRecoveryDeclined,
  className = ''
}) => {
  const [recoveryData, setRecoveryData] = useState<RecoveryData[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<AutoSaveSession | null>(null);

  useEffect(() => {
    checkForRecoverableData();
  }, []);

  const checkForRecoverableData = () => {
    try {
      const savedSteps = autoSaveService.getAllSavedSteps();
      const session = autoSaveService.getSessionInfo();
      
      if (savedSteps.length === 0) {
        return;
      }

      const recoveryItems: RecoveryData[] = [];
      
      savedSteps.forEach(stepId => {
        const data = autoSaveService.load(stepId);
        if (data) {
          recoveryItems.push({
            stepId,
            stepName: getStepDisplayName(stepId),
            lastSaved: new Date(data.timestamp),
            dataSize: JSON.stringify(data.data).length,
            version: data.version
          });
        }
      });

      if (recoveryItems.length > 0) {
        setRecoveryData(recoveryItems);
        setSessionInfo(session);
        setShowRecoveryPrompt(true);
      }
    } catch (error) {
      console.error('Error checking for recoverable data:', error);
    }
  };

  const getStepDisplayName = (stepId: string): string => {
    const stepNames: Record<string, string> = {
      'data-input': 'Portfolio Data Input',
      'data-validation': 'Data Validation',
      'risk-analysis': 'Risk Analysis',
      'performance-analysis': 'Performance Analysis',
      'optimization': 'Portfolio Optimization',
      'strategy-comparison': 'Strategy Comparison',
      'report-generation': 'Report Generation',
      'export-results': 'Export Results'
    };
    
    return stepNames[stepId] || stepId.charAt(0).toUpperCase() + stepId.slice(1).replace('-', ' ');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  const handleRecoverAll = async () => {
    setIsRecovering(true);
    
    try {
      const recoveredSteps: string[] = [];
      
      // Qui non facciamo nulla di speciale perché i dati sono già in cache
      // Il recovery avviene automaticamente quando i componenti useAutoSave si montano
      
      recoveryData.forEach(item => {
        recoveredSteps.push(item.stepId);
      });
      
      setShowRecoveryPrompt(false);
      
      if (onRecoveryComplete) {
        onRecoveryComplete(recoveredSteps);
      }
      
    } catch (error) {
      console.error('Recovery failed:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRecoverSelected = async (selectedSteps: string[]) => {
    setIsRecovering(true);
    
    try {
      // Rimuovi gli step non selezionati
      recoveryData.forEach(item => {
        if (!selectedSteps.includes(item.stepId)) {
          autoSaveService.clearStep(item.stepId);
        }
      });
      
      setShowRecoveryPrompt(false);
      
      if (onRecoveryComplete) {
        onRecoveryComplete(selectedSteps);
      }
      
    } catch (error) {
      console.error('Selective recovery failed:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleDeclineRecovery = () => {
    // Rimuovi tutti i dati salvati
    autoSaveService.clearAll();
    setShowRecoveryPrompt(false);
    
    if (onRecoveryDeclined) {
      onRecoveryDeclined();
    }
  };

  if (!showRecoveryPrompt) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">💾</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Recovery Available
              </h2>
              <p className="text-sm text-gray-600">
                We found saved data from your previous session
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {sessionInfo && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Previous Session</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Started: {new Date(sessionInfo.startTime).toLocaleString()}</p>
                <p>Last Activity: {formatTimeAgo(new Date(sessionInfo.lastActivity))}</p>
                <p className="truncate">Device: {sessionInfo.deviceInfo}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Recoverable Data:</h4>
            
            {recoveryData.map((item) => (
              <div 
                key={item.stepId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {item.stepName}
                  </div>
                  <div className="text-sm text-gray-500">
                    Saved {formatTimeAgo(item.lastSaved)} • {formatFileSize(item.dataSize)} • v{item.version}
                  </div>
                </div>
                
                <div className="text-green-600">
                  ✓
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="text-yellow-600 mt-1">⚠️</div>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important:</p>
                <p>Recovering this data will restore your work from the previous session. 
                   Any conflicting changes will be resolved automatically.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button
            onClick={handleRecoverAll}
            disabled={isRecovering}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isRecovering ? (
              <>
                <div className="animate-spin mr-2">⏳</div>
                Recovering...
              </>
            ) : (
              <>
                💾 Recover All Data
              </>
            )}
          </Button>
          
          <Button
            onClick={handleDeclineRecovery}
            disabled={isRecovering}
            variant="outline"
            className="flex-1"
          >
            🗑️ Start Fresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AutoSaveRecovery; 

