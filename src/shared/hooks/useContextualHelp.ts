import { useState, useEffect, useCallback, useRef } from 'react';

// Types for contextual help system
export interface ApplicationContext {
  currentStep: string;
  currentModule: string;
  userData: {
    assetsCount: number;
    lastAction: string;
    errorHistory: string[];
    performanceIssues: string[];
  };
  systemState: {
    memoryUsage: number;
    isLoading: boolean;
    hasErrors: boolean;
    processingTime: number;
  };
}

export interface HelpContent {
  id: string;
  title: string;
  message: string;
  type: 'tip' | 'warning' | 'error' | 'performance' | 'best-practice';
  priority: 'low' | 'medium' | 'high' | 'critical';
  triggers: string[];
  actions?: {
    label: string;
    action: () => void;
  }[];
  dismissible: boolean;
  autoHide?: number; // milliseconds
}

export interface ContextualHelpState {
  activeHelp: HelpContent[];
  context: ApplicationContext;
  isVisible: boolean;
  position: 'top-right' | 'bottom-right' | 'floating';
}

// Default context
const defaultContext: ApplicationContext = {
  currentStep: 'idle',
  currentModule: 'home',
  userData: {
    assetsCount: 0,
    lastAction: 'none',
    errorHistory: [],
    performanceIssues: []
  },
  systemState: {
    memoryUsage: 0,
    isLoading: false,
    hasErrors: false,
    processingTime: 0
  }
};

export function useContextualHelp() {
  const [state, setState] = useState<ContextualHelpState>({
    activeHelp: [],
    context: defaultContext,
    isVisible: true,
    position: 'top-right'
  });

  const helpHistoryRef = useRef<Set<string>>(new Set());
  const performanceRef = useRef<{
    startTime: number;
    operations: string[];
  }>({ startTime: Date.now(), operations: [] });

  // Update application context
  const updateContext = useCallback((updates: Partial<ApplicationContext>) => {
    setState(prev => ({
      ...prev,
      context: {
        ...prev.context,
        ...updates,
        userData: {
          ...prev.context.userData,
          ...updates.userData
        },
        systemState: {
          ...prev.context.systemState,
          ...updates.systemState
        }
      }
    }));
  }, []);

  // Add help content
  const addHelp = useCallback((content: HelpContent) => {
    // Avoid duplicate help
    if (helpHistoryRef.current.has(content.id)) {
      return;
    }

    setState(prev => ({
      ...prev,
      activeHelp: [...prev.activeHelp, content].sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
    }));

    helpHistoryRef.current.add(content.id);

    // Auto-hide if specified
    if (content.autoHide) {
      setTimeout(() => {
        dismissHelp(content.id);
      }, content.autoHide);
    }
  }, []);

  // Dismiss help
  const dismissHelp = useCallback((helpId: string) => {
    setState(prev => ({
      ...prev,
      activeHelp: prev.activeHelp.filter(help => help.id !== helpId)
    }));
  }, []);

  // Clear all help
  const clearAllHelp = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeHelp: []
    }));
  }, []);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: !prev.isVisible
    }));
  }, []);

  // Performance monitoring
  const trackPerformance = useCallback((operation: string, duration: number) => {
    performanceRef.current.operations.push(`${operation}:${duration}ms`);
    
    // Trigger performance tips
    if (duration > 5000) { // >5s
      addHelp({
        id: `perf-${operation}-${Date.now()}`,
        title: 'Performance Alert',
        message: `L'operazione ${operation} ha richiesto ${(duration/1000).toFixed(1)}s. Considera di ottimizzare o usare data chunking.`,
        type: 'performance',
        priority: 'medium',
        triggers: ['slow-operation'],
        dismissible: true,
        autoHide: 10000
      });
    }
    
    updateContext({
      systemState: {
        processingTime: duration
      }
    });
  }, [addHelp, updateContext]);

  // Error handling with contextual guidance
  const handleError = useCallback((error: Error, context: string) => {
    const errorId = `error-${Date.now()}`;
    let helpMessage = 'Si è verificato un errore. Controlla la console per dettagli.';
    let actions: HelpContent['actions'] = [];

    // Contextual error guidance
    if (error.message.includes('fetch')) {
      helpMessage = 'Problema di connessione. Verifica la connessione internet o riprova tra qualche secondo.';
      actions = [{
        label: 'Riprova',
        action: () => window.location.reload()
      }];
    } else if (error.message.includes('memory') || error.message.includes('heap')) {
      helpMessage = 'Memoria insufficiente. Riduci il numero di asset o usa il data chunking.';
      actions = [{
        label: 'Guida Ottimizzazione',
        action: () => console.log('Open optimization guide')
      }];
    } else if (error.message.includes('CORS')) {
      helpMessage = 'Errore CORS. Assicurati che il proxy server sia attivo.';
      actions = [{
        label: 'Verifica Proxy',
        action: () => console.log('Check proxy status')
      }];
    }

    addHelp({
      id: errorId,
      title: `Errore in ${context}`,
      message: helpMessage,
      type: 'error',
      priority: 'high',
      triggers: ['error'],
      actions,
      dismissible: true
    });

    // Update error history
    updateContext({
      userData: {
        errorHistory: [...state.context.userData.errorHistory, error.message].slice(-5)
      },
      systemState: {
        hasErrors: true
      }
    });
  }, [addHelp, updateContext, state.context.userData.errorHistory]);

  // Best practice suggestions based on context
  const checkBestPractices = useCallback(() => {
    const { currentStep, userData, systemState } = state.context;

    // Portfolio size recommendations
    if (userData.assetsCount > 100 && currentStep === 'optimization') {
      addHelp({
        id: 'bp-large-portfolio',
        title: 'Best Practice: Portfolio Grande',
        message: 'Con >100 asset, considera constraints settoriali e limiti di concentrazione per risultati più realistici.',
        type: 'best-practice',
        priority: 'medium',
        triggers: ['large-portfolio'],
        dismissible: true
      });
    }

    // Memory usage warnings
    if (systemState.memoryUsage > 80) {
      addHelp({
        id: 'bp-memory-usage',
        title: 'Best Practice: Memoria',
        message: 'Uso memoria elevato. Considera di processare i dati in chunks o ridurre la finestra temporale.',
        type: 'performance',
        priority: 'high',
        triggers: ['high-memory'],
        dismissible: true
      });
    }

    // Frequent errors pattern
    if (userData.errorHistory.length >= 3) {
      addHelp({
        id: 'bp-error-pattern',
        title: 'Pattern di Errori Rilevato',
        message: 'Molti errori recenti. Considera di controllare la qualità dei dati o la configurazione.',
        type: 'warning',
        priority: 'medium',
        triggers: ['error-pattern'],
        dismissible: true,
        actions: [{
          label: 'Guida Debugging',
          action: () => console.log('Open debugging guide')
        }]
      });
    }
  }, [state.context, addHelp]);

  // Step-specific help
  const getStepHelp = useCallback((step: string) => {
    const stepHelp: Record<string, HelpContent> = {
      'data-import': {
        id: 'help-data-import',
        title: 'Importazione Dati',
        message: 'Importa dati da fonti multiple. Verifica formato e completezza prima di procedere.',
        type: 'tip',
        priority: 'low',
        triggers: ['step-help'],
        dismissible: true
      },
      'data-cleaning': {
        id: 'help-data-cleaning',
        title: 'Pulizia Dati',
        message: 'Rimuovi outliers e gestisci valori mancanti. Controlla la qualità con il Quality Dashboard.',
        type: 'tip',
        priority: 'low',
        triggers: ['step-help'],
        dismissible: true
      },
      'risk-analysis': {
        id: 'help-risk-analysis',
        title: 'Analisi del Rischio',
        message: 'Calcola VaR, volatility e correlazioni. Usa finestre temporali appropriate per la frequenza dei dati.',
        type: 'tip',
        priority: 'low',
        triggers: ['step-help'],
        dismissible: true
      },
      'optimization': {
        id: 'help-optimization',
        title: 'Ottimizzazione Portfolio',
        message: 'Imposta constraints realistici. Per portfolio grandi, considera factor models o stratificazione.',
        type: 'tip',
        priority: 'low',
        triggers: ['step-help'],
        dismissible: true
      }
    };

    if (stepHelp[step]) {
      addHelp(stepHelp[step]);
    }
  }, [addHelp]);

  // Monitor context changes for automatic help triggering
  useEffect(() => {
    checkBestPractices();
  }, [state.context, checkBestPractices]);

  return {
    state,
    updateContext,
    addHelp,
    dismissHelp,
    clearAllHelp,
    toggleVisibility,
    trackPerformance,
    handleError,
    getStepHelp,
    // Shortcuts for common context updates
    setCurrentStep: (step: string) => updateContext({ currentStep: step }),
    setCurrentModule: (module: string) => updateContext({ currentModule: module }),
    setAssetsCount: (count: number) => updateContext({ userData: { assetsCount: count } }),
    setLoading: (loading: boolean) => updateContext({ systemState: { isLoading: loading } }),
    setMemoryUsage: (usage: number) => updateContext({ systemState: { memoryUsage: usage } })
  };
} 