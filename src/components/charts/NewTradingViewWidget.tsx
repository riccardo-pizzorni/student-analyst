import React, { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

type CSSProperties = Record<string, string | number>;

// Debug utility
const DEBUG = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TradingViewWidget] ${message}`, data ? data : '');
    }
  },
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[TradingViewWidget] ${message}`, error ? error : '');
    }
  },
};

// Dichiarazione del tipo per TradingView
declare global {
  interface Window {
    TradingView: {
      widget: new (config: TradingViewConfig) => TradingViewWidget;
    };
  }
}

interface TradingViewWidget {
  remove: () => void;
}

interface TradingViewConfig {
  container_id: string;
  symbol: string;
  interval: string;
  timezone?: string;
  theme?: string;
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  save_image?: boolean;
  hide_top_toolbar?: boolean;
  hide_side_toolbar?: boolean;
  show_popup_button?: boolean;
  popup_width?: string | number;
  popup_height?: string | number;
  autosize?: boolean;
  studies?: string[];
  width?: string | number;
  height?: string | number;
  fullscreen?: boolean;
  container?: string;
  library_path?: string;
  charts_storage_url?: string;
  charts_storage_api_version?: string;
  client_id?: string;
  user_id?: string;
  loading_screen?: { backgroundColor?: string; foregroundColor?: string };
  // Eventi come parte della configurazione
  onChartReady?: (() => void) | undefined;
  onSymbolChange?: ((symbol: string) => void) | undefined;
  onIntervalChange?: ((interval: string) => void) | undefined;
}

// Tipizzazione delle props (senza commenti)
interface NewTradingViewWidgetProps {
  symbol?: string;
  interval?: string;
  locale?: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
  autosize?: boolean;
  toolbar_bg?: string;
  allow_symbol_change?: boolean;
  save_image?: boolean;
  hide_top_toolbar?: boolean;
  hide_side_toolbar?: boolean;
  show_popup_button?: boolean;
  popup_width?: string | number;
  popup_height?: string | number;
  studies?: string[];
  className?: string;
  style?: CSSProperties;
  onSymbolChange?: ((symbol: string) => void) | undefined;
  onIntervalChange?: ((interval: string) => void) | undefined;
  onChartReady?: (() => void) | undefined;
  onLoadError?: ((error: Error) => void) | undefined;
  initTimeout?: number;
  debug?: boolean;
}

// Funzione per generare un ID fallback
const generateFallbackId = () => {
  return `tradingview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Schema di validazione Zod
const TradingViewPropsSchema = z.object({
  symbol: z.string().optional(),
  interval: z.string().optional(),
  locale: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  width: z.union([z.string(), z.number()]).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  autosize: z.boolean().optional(),
  toolbar_bg: z.string().optional(),
  allow_symbol_change: z.boolean().optional(),
  save_image: z.boolean().optional(),
  hide_top_toolbar: z.boolean().optional(),
  hide_side_toolbar: z.boolean().optional(),
  show_popup_button: z.boolean().optional(),
  popup_width: z.union([z.string(), z.number()]).optional(),
  popup_height: z.union([z.string(), z.number()]).optional(),
  studies: z.array(z.string()).optional(),
  className: z.string().optional(),
  style: z.record(z.union([z.string(), z.number()])).optional(),
  initTimeout: z.number().optional(),
  debug: z.boolean().optional(),
});

// Funzione di validazione
const validateTradingViewProps = (
  props: Partial<NewTradingViewWidgetProps>
) => {
  try {
    TradingViewPropsSchema.parse(props);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: error.errors };
    }
    return {
      isValid: false,
      errors: [{ message: 'Unknown validation error' }],
    };
  }
};

const NewTradingViewWidget: React.FC<NewTradingViewWidgetProps> = ({
  symbol = 'NASDAQ:AAPL',
  interval = 'D',
  locale = 'it',
  theme = 'dark',
  width = '100%',
  height = '100%',
  autosize = true,
  toolbar_bg = '#f1f3f6',
  allow_symbol_change = true,
  save_image = true,
  hide_top_toolbar = false,
  hide_side_toolbar = false,
  show_popup_button = false,
  popup_width = '1000',
  popup_height = '650',
  studies = [],
  className = '',
  style = {},
  onSymbolChange,
  onIntervalChange,
  onChartReady,
  onLoadError,
  initTimeout = 30000,
  debug = false,
}) => {
  // Genera un ID sicuro per il container
  const containerId = useMemo(() => generateFallbackId(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [widgetInitialized, setWidgetInitialized] = useState(false);

  const widgetRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Validazione props
  const { isValid, errors: validationErrors } = useMemo(
    () =>
      validateTradingViewProps({
        symbol,
        interval,
        locale,
        theme,
        width,
        height,
        autosize,
        toolbar_bg,
        allow_symbol_change,
        save_image,
        hide_top_toolbar,
        hide_side_toolbar,
        show_popup_button,
        popup_width,
        popup_height,
        studies,
        className,
        style,
        initTimeout,
        debug,
      }),
    [
      symbol,
      interval,
      locale,
      theme,
      width,
      height,
      autosize,
      toolbar_bg,
      allow_symbol_change,
      save_image,
      hide_top_toolbar,
      hide_side_toolbar,
      show_popup_button,
      popup_width,
      popup_height,
      studies,
      className,
      style,
      initTimeout,
      debug,
    ]
  );

  // Debug logging
  useEffect(() => {
    if (debug) {
      DEBUG.log('Component mounted with props:', {
        symbol,
        interval,
        containerId,
        theme,
        autosize,
        isValid,
        validationErrors,
      });
    }
  }, [
    debug,
    symbol,
    interval,
    containerId,
    theme,
    autosize,
    isValid,
    validationErrors,
  ]);

  // Carica lo script TradingView una sola volta
  useEffect(() => {
    if (scriptLoaded || typeof window.TradingView !== 'undefined') {
      DEBUG.log('Script già caricato');
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      DEBUG.log('Script caricato con successo');
    };
    script.onerror = error => {
      setError('Errore nel caricamento dello script TradingView');
      DEBUG.error('Errore caricamento script', error);
    };

    document.head.appendChild(script);

    return () => {
      DEBUG.log('Cleanup script loader');
    };
  }, []);

  // Crea il widget quando lo script è caricato
  useEffect(() => {
    if (
      !scriptLoaded ||
      !isValid ||
      typeof window.TradingView === 'undefined' ||
      !containerRef.current ||
      widgetInitialized
    ) {
      return;
    }

    DEBUG.log('Inizializzazione widget', {
      symbol,
      interval,
      containerId,
      scriptLoaded,
      isValid,
    });

    // Pulisci il container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Rimuovi widget precedente
    if (widgetRef.current) {
      try {
        if (typeof widgetRef.current.remove === 'function') {
          widgetRef.current.remove();
        }
      } catch (e) {
        DEBUG.error('Errore durante la rimozione del widget precedente', e);
      }
      widgetRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    // Imposta timeout per l'inizializzazione
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        const timeoutError = new Error('Widget initialization timeout');
        setError('Timeout: il widget non si è caricato entro 30 secondi');
        setIsLoading(false);
        DEBUG.error('Timeout inizializzazione widget', timeoutError);
        if (onLoadError) {
          onLoadError(timeoutError);
        }
      }
    }, initTimeout);

    try {
      // Crea il widget con configurazione tipizzata
      const widgetConfig: TradingViewConfig = {
        container_id: containerId,
        symbol: symbol,
        interval: interval,
        timezone: 'Etc/UTC',
        theme: theme,
        style: '1',
        locale: locale,
        toolbar_bg: toolbar_bg,
        enable_publishing: false,
        allow_symbol_change: allow_symbol_change,
        save_image: save_image,
        hide_top_toolbar: hide_top_toolbar,
        hide_side_toolbar: hide_side_toolbar,
        show_popup_button: show_popup_button,
        popup_width: popup_width,
        popup_height: popup_height,
        autosize: false,
        studies: studies,
        width: '100%',
        height: '100%',
        fullscreen: false,
        container: containerId,
        library_path: '/charting_library/',
        charts_storage_url: 'https://saveload.tradingview.com',
        charts_storage_api_version: '1.1',
        client_id: 'tradingview.com',
        user_id: 'public_user_id',
        loading_screen: {
          backgroundColor: theme === 'dark' ? '#1c1c1c' : '#ffffff',
          foregroundColor: theme === 'dark' ? '#ffffff' : '#1c1c1c',
        },
        // Eventi come parte della configurazione
        onChartReady: () => {
          console.log(
            '[TradingViewWidget][DEBUG] onChartReady chiamato: caricamento completato'
          );
          DEBUG.log('Widget pronto');
          setIsLoading(false);
          setWidgetInitialized(true);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          if (onChartReady) {
            onChartReady();
          }
        },
        onSymbolChange: onSymbolChange || undefined,
        onIntervalChange: onIntervalChange || undefined,
      };

      DEBUG.log('Creazione widget con config:', widgetConfig);
      console.log(
        '[TradingViewWidget][DEBUG] Widget creato, attendo onChartReady...'
      );
      widgetRef.current = new window.TradingView.widget(widgetConfig);
      console.log(
        '[TradingViewWidget][DEBUG] widgetRef.current:',
        widgetRef.current
      );
    } catch (error) {
      const initError =
        error instanceof Error
          ? error
          : new Error('Unknown widget initialization error');
      setError("Errore durante l'inizializzazione del widget");
      setIsLoading(false);
      console.log(
        '[TradingViewWidget][DEBUG] Errore inizializzazione, setIsLoading(false)'
      );
      DEBUG.error('Errore creazione widget', initError);
      if (onLoadError) {
        onLoadError(initError);
      }
    }

    return () => {
      console.log('[TradingViewWidget][DEBUG] Cleanup finale chiamato');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (widgetRef.current) {
        try {
          if (typeof widgetRef.current.remove === 'function') {
            widgetRef.current.remove();
          }
        } catch (e) {
          console.log('[TradingViewWidget] Cleanup finale');
        }
      }
    };
  }, [
    scriptLoaded,
    isValid,
    symbol,
    interval,
    containerId,
    theme,
    locale,
    toolbar_bg,
    allow_symbol_change,
    save_image,
    hide_top_toolbar,
    hide_side_toolbar,
    show_popup_button,
    popup_width,
    popup_height,
    autosize,
    studies,
    width,
    height,
    onChartReady,
    onSymbolChange,
    onIntervalChange,
    onLoadError,
    initTimeout,
    debug,
    widgetInitialized,
  ]);

  // Cleanup finale
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (widgetRef.current) {
        try {
          if (typeof widgetRef.current.remove === 'function') {
            widgetRef.current.remove();
          }
        } catch (e) {
          console.log('[TradingViewWidget] Cleanup finale');
        }
      }
    };
  }, []);

  // Mostra errori di validazione in development
  useEffect(() => {
    if (!isValid && validationErrors.length > 0) {
      DEBUG.error('Errori di validazione:', validationErrors);
    }
  }, [isValid, validationErrors]);

  // 1. Quando parte il caricamento
  useEffect(() => {
    if (isLoading) {
      console.log(
        '[TradingViewWidget][DEBUG] isLoading TRUE: caricamento iniziato'
      );
    }
  }, [isLoading]);

  // Timeout di fallback per onChartReady
  useEffect(() => {
    if (isLoading && !widgetInitialized) {
      const fallbackTimeout = setTimeout(() => {
        if (isLoading && !widgetInitialized) {
          setIsLoading(false);
          setError(
            'Errore: il grafico TradingView non ha segnalato il caricamento completato.'
          );
          console.log(
            '[TradingViewWidget][DEBUG] Timeout: onChartReady NON chiamato dopo 10s'
          );
        }
      }, 10000);
      return () => clearTimeout(fallbackTimeout);
    }
  }, [isLoading, widgetInitialized]);

  return (
    <div
      className={`tradingview-widget-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        ...style,
      }}
    >
      <div
        id={containerId}
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
        }}
      />
      {isLoading && !widgetInitialized && (
        <div
          className="tradingview-widget-loading"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: theme === 'dark' ? '#1c1c1c' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#1c1c1c',
            padding: '1rem',
            borderRadius: '0.5rem',
            zIndex: 10,
          }}
        >
          Caricamento grafico TradingView...
        </div>
      )}
      {error && (
        <div
          className="tradingview-widget-error"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: theme === 'dark' ? '#1c1c1c' : '#ffffff',
            color: 'red',
            padding: '1rem',
            borderRadius: '0.5rem',
            zIndex: 10,
          }}
        >
          {error}
          {!isValid && validationErrors.length > 0 && (
            <div className="validation-errors">
              {validationErrors.map(
                (error: { message: string }, index: number) => (
                  <div key={index} className="validation-error">
                    {error.message}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewTradingViewWidget;
