import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Types for the demo (simplified versions)
interface HelpContent {
  id: string;
  title: string;
  message: string;
  type: 'tip' | 'warning' | 'error' | 'performance' | 'best-practice';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dismissible: boolean;
  autoHide?: number;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

interface ApplicationContext {
  currentStep: string;
  currentModule: string;
  assetsCount: number;
  lastAction: string;
  errorHistory: string[];
  memoryUsage: number;
  processingTime: number;
}

// Help Panel Component (embedded for demo)
function HelpPanel({ 
  helpItems, 
  isVisible, 
  onDismiss, 
  onToggleVisibility, 
  onClearAll 
}: {
  helpItems: HelpContent[];
  isVisible: boolean;
  onDismiss: (id: string) => void;
  onToggleVisibility: () => void;
  onClearAll: () => void;
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  const HelpIcon = ({ type }: { type: HelpContent['type'] }) => {
    const iconClasses = "w-5 h-5";
    switch (type) {
      case 'tip':
        return <span className={cn(iconClasses, "text-blue-500")}>💡</span>;
      case 'warning':
        return <span className={cn(iconClasses, "text-yellow-500")}>⚠️</span>;
      case 'error':
        return <span className={cn(iconClasses, "text-red-500")}>❌</span>;
      case 'performance':
        return <span className={cn(iconClasses, "text-orange-500")}>⚡</span>;
      case 'best-practice':
        return <span className={cn(iconClasses, "text-green-500")}>✅</span>;
      default:
        return null;
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed top-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Mostra aiuto contestuale"
      >
        🔮
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-40 w-80 max-h-96 bg-white border border-gray-200 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔮</span>
          <h3 className="font-semibold text-gray-900">Aiuto Contestuale</h3>
          {helpItems.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              {helpItems.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {helpItems.length > 1 && (
            <button
              onClick={onClearAll}
              className="p-1 text-gray-400 hover:text-gray-600 rounded text-sm"
              title="Chiudi tutto"
            >
              🗑️
            </button>
          )}
          
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded text-sm"
            title={isMinimized ? "Espandi" : "Riduci"}
          >
            {isMinimized ? "⬇️" : "⬆️"}
          </button>
          
          <button
            onClick={onToggleVisibility}
            className="p-1 text-gray-400 hover:text-gray-600 rounded text-sm"
            title="Nascondi pannello"
          >
            ❌
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3 max-h-80 overflow-y-auto">
          {helpItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-3">💤</div>
              <p className="text-sm">Nessun aiuto contestuale disponibile.</p>
              <p className="text-xs text-gray-400 mt-1">
                I suggerimenti appariranno in base alle tue azioni.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {helpItems.map((help) => (
                <div
                  key={help.id}
                  className={cn(
                    "rounded-lg border p-3 transition-all duration-200",
                    help.type === 'tip' && "border-blue-200 bg-blue-50",
                    help.type === 'warning' && "border-yellow-200 bg-yellow-50",
                    help.type === 'error' && "border-red-200 bg-red-50",
                    help.type === 'performance' && "border-orange-200 bg-orange-50",
                    help.type === 'best-practice' && "border-green-200 bg-green-50",
                    help.priority === 'critical' && "border-l-4 border-l-red-500 animate-pulse",
                    help.priority === 'high' && "border-l-4 border-l-orange-400",
                    help.priority === 'medium' && "border-l-4 border-l-yellow-400"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <HelpIcon type={help.type} />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">
                          {help.title}
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {help.message}
                        </p>
                        
                        {help.actions && help.actions.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {help.actions.map((action, index) => (
                              <button
                                key={index}
                                onClick={action.action}
                                className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {help.dismissible && (
                      <button
                        onClick={() => onDismiss(help.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded text-sm ml-2"
                        title="Chiudi"
                      >
                        ❌
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ContextualHelpDemo() {
  const [context, setContext] = useState<ApplicationContext>({
    currentStep: 'idle',
    currentModule: 'home',
    assetsCount: 0,
    lastAction: 'none',
    errorHistory: [],
    memoryUsage: 45,
    processingTime: 0
  });

  const [helpItems, setHelpItems] = useState<HelpContent[]>([]);
  const [isHelpVisible, setIsHelpVisible] = useState(true);
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Add help item
  const addHelp = (help: HelpContent) => {
    setHelpItems(prev => {
      const exists = prev.find(h => h.id === help.id);
      if (exists) return prev;
      
      const newItems = [...prev, help].sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Auto-hide if specified
      if (help.autoHide) {
        setTimeout(() => {
          dismissHelp(help.id);
        }, help.autoHide);
      }

      return newItems;
    });
  };

  // Dismiss help
  const dismissHelp = (helpId: string) => {
    setHelpItems(prev => prev.filter(help => help.id !== helpId));
  };

  // Clear all help
  const clearAllHelp = () => {
    setHelpItems([]);
  };

  // Log action
  const logAction = (action: string) => {
    setActionLog(prev => [...prev.slice(-4), action]);
  };

  // Simulate step changes
  const changeStep = (step: string) => {
    setContext(prev => ({ ...prev, currentStep: step, lastAction: `step-${step}` }));
    logAction(`Cambiato step: ${step}`);

    // Step-specific help
    const stepHelp: Record<string, HelpContent> = {
      'data-import': {
        id: 'help-data-import',
        title: 'Importazione Dati',
        message: 'Importa dati da fonti gratuite (Alpha Vantage, Yahoo Finance) o CSV. Verifica sempre qualità e completezza.',
        type: 'tip',
        priority: 'low',
        dismissible: true
      },
      'data-cleaning': {
        id: 'help-data-cleaning',
        title: 'Pulizia e Validazione',
        message: 'Rimuovi outliers, gestisci valori mancanti. Usa Quality Dashboard per monitorare.',
        type: 'tip',
        priority: 'low',
        dismissible: true
      },
      'risk-analysis': {
        id: 'help-risk-analysis',
        title: 'Analisi del Rischio',
        message: 'Calcola VaR, volatility, correlazioni. Per dati giornalieri usa finestre di 252 giorni.',
        type: 'tip',
        priority: 'low',
        dismissible: true
      },
      'optimization': {
        id: 'help-optimization',
        title: 'Ottimizzazione Portfolio',
        message: 'Imposta constraints realistici. Per portfolio >50 asset considera factor models.',
        type: 'tip',
        priority: 'low',
        dismissible: true
      }
    };

    if (stepHelp[step]) {
      addHelp(stepHelp[step]);
    }
  };

  // Simulate asset count changes
  const changeAssetCount = (count: number) => {
    setContext(prev => ({ ...prev, assetsCount: count }));
    logAction(`Assets impostati: ${count}`);

    // Asset count specific help
    if (count > 100) {
      addHelp({
        id: 'help-large-portfolio',
        title: 'Portfolio Grande Rilevato',
        message: 'Con &gt;100 asset, usa data chunking e considera constraints settoriali per risultati realistici.',
        type: 'performance',
        priority: 'medium',
        dismissible: true,
        actions: [{
          label: 'Guida Chunking',
          action: () => logAction('Aperta guida chunking')
        }]
      });
    } else if (count < 15 && count > 0) {
      addHelp({
        id: 'help-small-portfolio',
        title: 'Best Practice: Diversificazione',
        message: 'Portfolio con <15 asset potrebbero essere sotto-diversificati. Considera ETF settoriali.',
        type: 'best-practice',
        priority: 'medium',
        dismissible: true
      });
    }
  };

  // Simulate errors
  const triggerError = (errorType: string) => {
    const errors: Record<string, HelpContent> = {
      'api-limit': {
        id: 'error-api-limit',
        title: 'Limite API Raggiunto',
        message: 'Hai raggiunto il limite giornaliero delle API gratuite. Usa la cache o riprova domani.',
        type: 'error',
        priority: 'high',
        dismissible: true,
        actions: [{
          label: 'Cache Status',
          action: () => logAction('Controllato status cache')
        }]
      },
      'cors': {
        id: 'error-cors',
        title: 'Errore CORS',
        message: 'Problema cross-origin. Verifica che il proxy server sia attivo sulla porta 3001.',
        type: 'error',
        priority: 'critical',
        dismissible: true,
        actions: [{
          label: 'Avvia Proxy',
          action: () => logAction('Tentativo avvio proxy')
        }]
      },
      'memory': {
        id: 'error-memory',
        title: 'Memoria Insufficiente',
        message: 'Heap memory esaurita. Riduci dataset o usa processing in batch.',
        type: 'error',
        priority: 'high',
        dismissible: true,
        actions: [{
          label: 'Ottimizza',
          action: () => logAction('Avviata ottimizzazione memoria')
        }]
      }
    };

    if (errors[errorType]) {
      addHelp(errors[errorType]);
      setContext(prev => ({ 
        ...prev, 
        errorHistory: [...prev.errorHistory, errorType].slice(-3)
      }));
      logAction(`Errore: ${errorType}`);
    }
  };

  // Simulate performance issues
  const triggerPerformanceIssue = () => {
    const processingTime = Math.random() * 10000 + 5000; // 5-15 seconds
    setContext(prev => ({ ...prev, processingTime }));
    logAction(`Operazione lenta: ${(processingTime/1000).toFixed(1)}s`);

    addHelp({
      id: 'perf-slow-operation',
      title: 'Performance Alert',
      message: `Operazione completata in ${(processingTime/1000).toFixed(1)}s. Considera chunking o algoritmi approssimati.`,
      type: 'performance',
      priority: 'medium',
      dismissible: true,
      autoHide: 8000
    });
  };

  // Memory usage simulation
  const simulateMemoryUsage = (usage: number) => {
    setContext(prev => ({ ...prev, memoryUsage: usage }));
    logAction(`Memoria: ${usage}%`);

    if (usage > 80) {
      addHelp({
        id: 'perf-high-memory',
        title: 'Uso Memoria Elevato',
        message: `Memoria al ${usage}%. Libera variabili inutilizzate o processa in batch più piccoli.`,
        type: 'performance',
        priority: 'high',
        dismissible: true
      });
    }
  };

  // Auto-help for patterns
  useEffect(() => {
    if (context.errorHistory.length >= 3) {
      addHelp({
        id: 'pattern-errors',
        title: 'Pattern di Errori Rilevato',
        message: 'Molti errori recenti. Controlla qualità dati o configurazione API.',
        type: 'warning',
        priority: 'medium',
        dismissible: true,
        actions: [{
          label: 'Debug Guide',
          action: () => logAction('Aperta guida debugging')
        }]
      });
    }
  }, [context.errorHistory]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Contextual Help Demo - Sistema di Aiuto Intelligente
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Sistema di aiuto che si adatta al contesto dell'utente, fornendo suggerimenti specifici,
          alerting su errori, tips di performance e best practices professionali.
        </p>
      </div>

      {/* Current Context Display */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contesto Corrente</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-500">Step Corrente</div>
            <div className="font-semibold text-blue-600">{context.currentStep}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Assets Count</div>
            <div className="font-semibold text-green-600">{context.assetsCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Memoria</div>
            <div className="font-semibold text-orange-600">{context.memoryUsage}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Errori Recenti</div>
            <div className="font-semibold text-red-600">{context.errorHistory.length}</div>
          </div>
        </div>
      </section>

      {/* Simulation Controls */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Simulatori Contestuali</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Step Changes */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">🔄 Cambia Step</h3>
            <div className="space-y-2">
              {['data-import', 'data-cleaning', 'risk-analysis', 'optimization'].map(step => (
                <button
                  key={step}
                  onClick={() => changeStep(step)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded border transition-colors",
                    context.currentStep === step 
                      ? "bg-blue-100 border-blue-300 text-blue-900"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  {step.replace('-', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Count */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📊 Portfolio Size</h3>
            <div className="space-y-2">
              {[5, 25, 75, 150].map(count => (
                <button
                  key={count}
                  onClick={() => changeAssetCount(count)}
                  className="w-full text-left px-3 py-2 text-sm rounded border bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  {count} Assets
                </button>
              ))}
            </div>
          </div>

          {/* Errors */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">⚠️ Simula Errori</h3>
            <div className="space-y-2">
              {[
                { key: 'api-limit', label: 'API Limit' },
                { key: 'cors', label: 'CORS Error' },
                { key: 'memory', label: 'Memory Error' }
              ].map(error => (
                <button
                  key={error.key}
                  onClick={() => triggerError(error.key)}
                  className="w-full text-left px-3 py-2 text-sm rounded border bg-red-50 border-red-200 hover:bg-red-100 transition-colors text-red-800"
                >
                  {error.label}
                </button>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">⚡ Performance</h3>
            <div className="space-y-2">
              <button
                onClick={triggerPerformanceIssue}
                className="w-full text-left px-3 py-2 text-sm rounded border bg-orange-50 border-orange-200 hover:bg-orange-100 transition-colors text-orange-800"
              >
                Operazione Lenta
              </button>
              {[60, 85, 95].map(usage => (
                <button
                  key={usage}
                  onClick={() => simulateMemoryUsage(usage)}
                  className="w-full text-left px-3 py-2 text-sm rounded border bg-orange-50 border-orange-200 hover:bg-orange-100 transition-colors text-orange-800"
                >
                  Memoria {usage}%
                </button>
              ))}
            </div>
          </div>

          {/* Help Controls */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">🔮 Controlli Help</h3>
            <div className="space-y-2">
              <button
                onClick={() => setIsHelpVisible(!isHelpVisible)}
                className="w-full text-left px-3 py-2 text-sm rounded border bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors text-blue-800"
              >
                {isHelpVisible ? 'Nascondi' : 'Mostra'} Help
              </button>
              <button
                onClick={clearAllHelp}
                className="w-full text-left px-3 py-2 text-sm rounded border bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Pulisci Help
              </button>
            </div>
          </div>

          {/* Action Log */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📝 Log Azioni</h3>
            <div className="h-32 overflow-y-auto bg-gray-50 border border-gray-200 rounded p-2">
              {actionLog.length === 0 ? (
                <p className="text-sm text-gray-500">Nessuna azione ancora...</p>
              ) : (
                <div className="space-y-1">
                  {actionLog.map((action, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      {action}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Help System Features */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-blue-900 mb-4">Caratteristiche del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">🎯 Dynamic Help</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Help specifico per ogni step del workflow</li>
              <li>• Suggerimenti basati sul numero di asset</li>
              <li>• Auto-trigger su azioni utente</li>
              <li>• Prioritizzazione per importanza</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">🚨 Error Guidance</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Messaggi specifici per tipo di errore</li>
              <li>• Azioni correttive suggerite</li>
              <li>• Pattern detection per errori ricorrenti</li>
              <li>• Livelli di priorità (low → critical)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">⚡ Performance Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Monitoraggio automatico memoria</li>
              <li>• Alert per operazioni lente (&gt;5s)</li>
              <li>• Suggerimenti ottimizzazione</li>
              <li>• Auto-hide per tips temporanei</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">✅ Best Practices</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Consigli professionali contestuali</li>
              <li>• Standard industry (CFA, GIPS)</li>
              <li>• Diversification guidelines</li>
              <li>• Risk management tips</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Istruzioni Demo</h2>
        <div className="prose prose-gray max-w-none">
          <p>
            Questa demo mostra come il sistema di aiuto contestuale si adatta in tempo reale alle azioni dell'utente:
          </p>
          <ol>
            <li><strong>Cambia Step</strong>: Ogni step del workflow attiverà suggerimenti specifici</li>
            <li><strong>Modifica Portfolio Size</strong>: Diversi consigli per portfolio piccoli vs grandi</li>
            <li><strong>Simula Errori</strong>: Ogni errore mostrerà guidance specifica e azioni correttive</li>
            <li><strong>Test Performance</strong>: Alert automatici per operazioni lente o memoria alta</li>
            <li><strong>Osserva Pattern</strong>: Il sistema rileva pattern (es. errori ripetuti) e suggerisce soluzioni</li>
          </ol>
        </div>
      </section>

      {/* Help Panel (positioned absolutely) */}
      <HelpPanel
        helpItems={helpItems}
        isVisible={isHelpVisible}
        onDismiss={dismissHelp}
        onToggleVisibility={() => setIsHelpVisible(!isHelpVisible)}
        onClearAll={clearAllHelp}
      />
    </div>
  );
} 

