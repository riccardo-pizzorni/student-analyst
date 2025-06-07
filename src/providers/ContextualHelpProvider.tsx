import React, { createContext, useContext, useEffect } from 'react';
import { useContextualHelp, HelpContent, ApplicationContext } from '@/hooks/useContextualHelp';
import { ContextualHelpPanel } from '@/components/ui/ContextualHelpPanel';

// Context for sharing help state
const ContextualHelpContext = createContext<ReturnType<typeof useContextualHelp> | null>(null);

interface ContextualHelpProviderProps {
  children: React.ReactNode;
}

export function ContextualHelpProvider({ children }: ContextualHelpProviderProps) {
  const helpSystem = useContextualHelp();

  // Performance monitoring hook
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        helpSystem.trackPerformance('API Call', duration);
        return response;
      } catch (error) {
        helpSystem.handleError(error as Error, 'API Call');
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [helpSystem]);

  // Memory monitoring
  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        helpSystem.setMemoryUsage(usage);
      }
    };

    const interval = setInterval(checkMemory, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [helpSystem]);

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      helpSystem.handleError(
        new Error(event.message), 
        `${event.filename}:${event.lineno}`
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      helpSystem.handleError(
        new Error(event.reason), 
        'Unhandled Promise Rejection'
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [helpSystem]);

  return (
    <ContextualHelpContext.Provider value={helpSystem}>
      {children}
      <ContextualHelpPanel
        helpItems={helpSystem.state.activeHelp}
        isVisible={helpSystem.state.isVisible}
        position={helpSystem.state.position}
        onDismiss={helpSystem.dismissHelp}
        onToggleVisibility={helpSystem.toggleVisibility}
        onClearAll={helpSystem.clearAllHelp}
      />
    </ContextualHelpContext.Provider>
  );
}

// Hook to use contextual help in components
export function useContextualHelpSystem() {
  const context = useContext(ContextualHelpContext);
  if (!context) {
    throw new Error('useContextualHelpSystem must be used within a ContextualHelpProvider');
  }
  return context;
}

// Predefined help content database
export const helpDatabase = {
  // Step-specific help
  steps: {
    'data-import': {
      id: 'step-data-import',
      title: 'Importazione Dati',
      message: 'Importa dati da API gratuite (Alpha Vantage, Yahoo Finance) o file CSV. Verifica sempre la qualità dei dati prima di procedere.',
      type: 'tip' as const,
      priority: 'low' as const,
      triggers: ['step-change'],
      dismissible: true
    },
    'data-cleaning': {
      id: 'step-data-cleaning',
      title: 'Pulizia e Validazione',
      message: 'Rimuovi outliers statistici, gestisci valori mancanti e normalizza i dati. Usa il Quality Dashboard per monitorare la qualità.',
      type: 'tip' as const,
      priority: 'low' as const,
      triggers: ['step-change'],
      dismissible: true
    },
    'risk-analysis': {
      id: 'step-risk-analysis',
      title: 'Analisi del Rischio',
      message: 'Calcola VaR, volatility e correlazioni. Per dati giornalieri usa finestre di 252 giorni per annualizzazioni.',
      type: 'tip' as const,
      priority: 'low' as const,
      triggers: ['step-change'],
      dismissible: true
    },
    'portfolio-optimization': {
      id: 'step-portfolio-optimization',
      title: 'Ottimizzazione Portfolio',
      message: 'Imposta constraints realistici (min/max weights, settori). Per portfolio >50 asset considera factor models.',
      type: 'tip' as const,
      priority: 'low' as const,
      triggers: ['step-change'],
      dismissible: true
    },
    'backtesting': {
      id: 'step-backtesting',
      title: 'Backtesting e Validazione',
      message: 'Testa su dati out-of-sample. Attenzione al survivorship bias e transaction costs.',
      type: 'tip' as const,
      priority: 'low' as const,
      triggers: ['step-change'],
      dismissible: true
    }
  },

  // Performance tips
  performance: {
    'large-dataset': {
      id: 'perf-large-dataset',
      title: 'Dataset Grandi',
      message: 'Per &gt;100 asset, usa data chunking e Web Workers per evitare blocchi UI. Considera sampling per analisi preliminari.',
      type: 'performance' as const,
      priority: 'medium' as const,
      triggers: ['large-data'],
      dismissible: true,
      actions: [{
        label: 'Guida Chunking',
        action: () => console.log('Open chunking guide')
      }]
    },
    'slow-calculations': {
      id: 'perf-slow-calc',
      title: 'Calcoli Lenti',
      message: 'Calcoli >10s rilevati. Usa algoritmi approssimati o riduci la precisione per analisi preliminari.',
      type: 'performance' as const,
      priority: 'high' as const,
      triggers: ['slow-operation'],
      dismissible: true
    },
    'memory-usage': {
      id: 'perf-memory',
      title: 'Uso Memoria Elevato',
      message: 'Memoria &gt;80% utilizzata. Libera variabili inutilizzate o processa i dati in batch più piccoli.',
      type: 'performance' as const,
      priority: 'high' as const,
      triggers: ['high-memory'],
      dismissible: true
    }
  },

  // Best practices
  bestPractices: {
    'diversification': {
      id: 'bp-diversification',
      title: 'Best Practice: Diversificazione',
      message: 'Portfolio con <15 asset potrebbero essere sotto-diversificati. Considera ETF settoriali per esposizione più ampia.',
      type: 'best-practice' as const,
      priority: 'medium' as const,
      triggers: ['small-portfolio'],
      dismissible: true
    },
    'rebalancing': {
      id: 'bp-rebalancing',
      title: 'Best Practice: Rebalancing',
      message: 'Definisci soglie di rebalancing (tipicamente 5-10% di drift). Considera costi di transazione nelle decisioni.',
      type: 'best-practice' as const,
      priority: 'low' as const,
      triggers: ['portfolio-drift'],
      dismissible: true
    },
    'risk-budgeting': {
      id: 'bp-risk-budgeting',
      title: 'Best Practice: Risk Budgeting',
      message: 'Alloca il rischio (non solo il capitale) tra asset. Usa risk parity o equal risk contribution per esposizioni bilanciate.',
      type: 'best-practice' as const,
      priority: 'medium' as const,
      triggers: ['risk-allocation'],
      dismissible: true
    }
  },

  // Error-specific guidance
  errors: {
    'api-limit': {
      id: 'error-api-limit',
      title: 'Limite API Raggiunto',
      message: 'Hai raggiunto il limite giornaliero delle API gratuite. Usa la cache o riprova domani.',
      type: 'error' as const,
      priority: 'high' as const,
      triggers: ['api-error'],
      dismissible: true,
      actions: [{
        label: 'Cache Status',
        action: () => console.log('Check cache status')
      }]
    },
    'cors-error': {
      id: 'error-cors',
      title: 'Errore CORS',
      message: 'Problema di accesso cross-origin. Verifica che il proxy server sia attivo sulla porta 3001.',
      type: 'error' as const,
      priority: 'critical' as const,
      triggers: ['cors-error'],
      dismissible: true,
      actions: [{
        label: 'Avvia Proxy',
        action: () => console.log('Start proxy server')
      }]
    },
    'data-quality': {
      id: 'error-data-quality',
      title: 'Qualità Dati Insufficiente',
      message: 'Troppi valori mancanti o outliers rilevati. Controlla la fonte dati o modifica i filtri di qualità.',
      type: 'warning' as const,
      priority: 'medium' as const,
      triggers: ['data-quality'],
      dismissible: true,
      actions: [{
        label: 'Quality Dashboard',
        action: () => console.log('Open quality dashboard')
      }]
    }
  }
};

// Helper function to trigger contextual help
export function triggerContextualHelp(
  helpSystem: ReturnType<typeof useContextualHelp>,
  trigger: string,
  context?: Partial<ApplicationContext>
) {
  // Update context if provided
  if (context) {
    helpSystem.updateContext(context);
  }

  // Find relevant help content
  const allHelp = Object.values(helpDatabase).flatMap(category => Object.values(category));
  const relevantHelp = allHelp.filter(help => help.triggers.includes(trigger));

  // Add relevant help
  relevantHelp.forEach(help => {
    helpSystem.addHelp(help);
  });
} 