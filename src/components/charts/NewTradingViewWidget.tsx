import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { z } from 'zod';

type CSSProperties = Record<string, string | number>;

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

// Funzioni di validazione
const VALID_INTERVALS = ['1', '5', '15', '30', '60', 'D', 'W', 'M'];
const MAX_STUDIES = 5;

const isValidSymbol = (symbol: string): boolean => {
  // Formato: EXCHANGE:TICKER
  const symbolRegex = /^[A-Z]+:[A-Z0-9]+$/;
  return symbolRegex.test(symbol);
};

const isValidInterval = (interval: string): boolean => {
  return VALID_INTERVALS.includes(interval);
};

const isValidTheme = (theme: string): boolean => {
  return ['light', 'dark'].includes(theme);
};

const isValidDimension = (dimension: number | string): boolean => {
  if (typeof dimension === 'number') {
    return dimension > 0;
  }

  if (typeof dimension === 'string') {
    // Accetta valori percentuali o pixel
    const dimensionRegex = /^(\d+)(%|px)?$/;
    const match = dimension.match(dimensionRegex);

    if (!match || !match[1]) return false;

    const value = parseInt(match[1], 10);
    return value > 0;
  }

  return false;
};

// Validation schemas
const symbolSchema = z.string().regex(/^[A-Z]+:[A-Z]+$/, {
  message: 'Invalid symbol format. Must be in "EXCHANGE:TICKER" format',
});

const intervalSchema = z.enum(['1', '5', '15', '30', '60', 'D', 'W', 'M'], {
  errorMap: () => ({
    message: 'Invalid interval. Must be one of: 1, 5, 15, 30, 60, D, W, M',
  }),
});

const themeSchema = z.enum(['light', 'dark'], {
  errorMap: () => ({ message: 'Invalid theme. Must be "light" or "dark"' }),
});

// Dichiarazione del tipo per TradingView
declare global {
  interface Window {
    TradingView: {
      widget: new (config: any) => any;
    };
  }
}

// Funzione di creazione errore dettagliato
const createDetailedError = (
  message: string,
  type: 'VALIDATION' | 'NETWORK' | 'SCRIPT_LOAD' | 'WIDGET_INIT' = 'VALIDATION',
  details?: Record<string, any>
): Error => {
  const error = new Error(message);
  error.name = `TradingViewWidgetError:${type}`;

  if (details) {
    Object.keys(details).forEach(key => {
      (error as any)[key] = details[key];
    });
  }

  // Logging degli errori
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[TradingView Widget Error - ${type}]`, error);
  }

  return error;
};

// Funzione di validazione props
const validateTradingViewProps = (
  props: NewTradingViewWidgetProps
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Symbol validation with more detailed checks
  if (!props.symbol || !isValidSymbol(props.symbol)) {
    errors.push('Invalid symbol format. Must be in "EXCHANGE:TICKER" format');
  }

  // Interval validation
  if (props.interval && !isValidInterval(props.interval)) {
    errors.push(
      `Invalid interval: ${props.interval}. Must be one of: ${VALID_INTERVALS.join(', ')}`
    );
  }

  // Theme validation
  if (props.theme && !isValidTheme(props.theme)) {
    errors.push(`Invalid theme: ${props.theme}. Must be 'light' or 'dark'`);
  }

  // Dimension validations
  if (props.width && !isValidDimension(props.width)) {
    errors.push(
      `Invalid width: ${props.width}. Must be a positive number or valid CSS dimension`
    );
  }

  if (props.height && !isValidDimension(props.height)) {
    errors.push(
      `Invalid height: ${props.height}. Must be a positive number or valid CSS dimension`
    );
  }

  // Studies validation
  if (props.studies && props.studies.length > MAX_STUDIES) {
    errors.push(`Maximum of ${MAX_STUDIES} studies allowed`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const generateFallbackId = (): string => {
  return `tvw-${Math.random().toString(36).slice(2, 10)}`;
};

function NewTradingViewWidget(props: NewTradingViewWidgetProps) {
  const {
    symbol = 'NASDAQ:AAPL',
    theme = 'dark',
    width = '100%',
    height = 500,
    interval = 'D',
    locale = 'it',
    autosize = true,
    allow_symbol_change = true,
    save_image = true,
    hide_top_toolbar = false,
    hide_side_toolbar = false,
    toolbar_bg = '#131722',
    studies = [],
    show_popup_button = false,
    popup_width = '1000',
    popup_height = '650',
    className = '',
    style = {},
    onSymbolChange,
    onIntervalChange,
    onChartReady,
    onLoadError,
    initTimeout = 30000,
    debug = false,
  } = props;

  // Id compatibile con tutte le versioni di React
  const reactId = useId();
  const internalId = reactId || generateFallbackId();

  const [retryCount, setRetryCount] = useState(0);
  const [debugStatus, setDebugStatus] = useState<
    'loading' | 'error' | 'success'
  >('loading');
  const [widgetCreated, setWidgetCreated] = useState(false);
  const [containerClean, setContainerClean] = useState(true);
  const [currentError, setCurrentError] = useState<Error | null>(null);

  const widgetRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const { isValid, errors: validationErrors } = useMemo(
    () =>
      validateTradingViewProps({
        symbol,
        interval,
        theme,
        width,
        height,
        locale,
        studies,
        autosize,
        allow_symbol_change,
        save_image,
        hide_top_toolbar,
        hide_side_toolbar,
        toolbar_bg,
        show_popup_button,
        popup_width,
        popup_height,
        className,
        style,
        onSymbolChange: onSymbolChange || undefined,
        onIntervalChange: onIntervalChange || undefined,
        onChartReady: onChartReady || undefined,
        onLoadError: onLoadError || undefined,
        initTimeout,
        debug,
      }),
    [
      symbol,
      interval,
      theme,
      width,
      height,
      locale,
      studies,
      autosize,
      allow_symbol_change,
      save_image,
      hide_top_toolbar,
      hide_side_toolbar,
      toolbar_bg,
      show_popup_button,
      popup_width,
      popup_height,
      className,
      style,
      onSymbolChange,
      onIntervalChange,
      onChartReady,
      onLoadError,
      initTimeout,
      debug,
    ]
  );

  // Funzione di retry
  const handleRetry = useCallback((): void => {
    setRetryCount((prevCount: number) => prevCount + 1);
    setCurrentError(null);
    setDebugStatus('loading');
  }, []);

  useEffect(() => {
    if (!isValid) return;

    console.log(
      '[TradingViewWidget] MOUNT: symbol',
      symbol,
      'interval',
      interval
    );

    setWidgetCreated(false);
    setContainerClean(true);
    setCurrentError(null);
    setDebugStatus('loading');

    // Svuota il container prima di ogni mount
    const container = document.getElementById(internalId);
    if (container) {
      container.innerHTML = '';
      setContainerClean(true);
      console.log('[TradingViewWidget] Container pulito:', internalId);
    }

    // Rimuovi eventuali script precedenti per evitare conflitti
    const existingScript = document.querySelector(
      'script[src*="tradingview.com"]'
    );
    if (existingScript) {
      console.log(
        '[TradingViewWidget] Rimuovo script esistente per reinizializzazione'
      );
      existingScript.remove();
    }

    timeoutRef.current = setTimeout(() => {
      setCurrentError(
        new Error(
          `Il widget non si è inizializzato entro ${initTimeout / 1000} secondi`
        )
      );
      setDebugStatus('error');
      console.log('[TradingViewWidget] Timeout inizializzazione widget');
    }, initTimeout);

    // Aggiungi script TradingView
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      console.log('[TradingViewWidget] Script TradingView caricato');

      // Piccolo delay per assicurarsi che il DOM sia pronto
      setTimeout(() => {
        if (typeof window.TradingView !== 'undefined') {
          try {
            console.log('[TradingViewWidget] Widget TradingView istanziato');
            widgetRef.current = new window.TradingView.widget({
              container_id: internalId,
              symbol: symbol || 'NASDAQ:AAPL',
              interval: interval || 'D',
              timezone: 'Etc/UTC',
              theme: theme || 'dark',
              style: '1',
              locale: locale || 'it',
              toolbar_bg: toolbar_bg || '#f1f3f6',
              enable_publishing: false,
              allow_symbol_change: allow_symbol_change || false,
              save_image: save_image || false,
              hide_top_toolbar: hide_top_toolbar || false,
              hide_side_toolbar: hide_side_toolbar || false,
              show_popup_button: show_popup_button || false,
              popup_width: popup_width || '1000',
              popup_height: popup_height || '650',
              studies: studies || [],
              width: width || '100%',
              height: height || '100%',
              autosize: autosize || false,
              onChartReady: () => {
                console.log(
                  '[TradingViewWidget] Widget considerato pronto dopo creazione'
                );
                setWidgetCreated(true);
                setDebugStatus('success');
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }
                onChartReady?.();
              },
            });
          } catch (error) {
            console.error(
              '[TradingViewWidget] Errore creazione widget:',
              error
            );
            setCurrentError(error as Error);
            setDebugStatus('error');
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            onLoadError?.(error as Error);
          }
        } else {
          console.error('[TradingViewWidget] TradingView non disponibile');
          setCurrentError(new Error('TradingView non disponibile'));
          setDebugStatus('error');
        }
      }, 100);
    };

    script.onerror = () => {
      console.error(
        '[TradingViewWidget] Errore caricamento script TradingView'
      );
      setCurrentError(new Error('Errore caricamento script TradingView'));
      setDebugStatus('error');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    // Controlla se lo script è già presente
    const existingTvScript = document.querySelector(
      'script[src*="tradingview.com"]'
    );
    if (!existingTvScript) {
      document.head.appendChild(script);
      console.log('[TradingViewWidget] Script TradingView aggiunto');
    } else {
      console.log('[TradingViewWidget] Script TradingView già presente');
      // Se lo script è già presente, prova a inizializzare direttamente
      if (typeof window.TradingView !== 'undefined') {
        setTimeout(() => {
          try {
            console.log(
              '[TradingViewWidget] Widget TradingView istanziato (script esistente)'
            );
            widgetRef.current = new window.TradingView.widget({
              container_id: internalId,
              symbol: symbol || 'NASDAQ:AAPL',
              interval: interval || 'D',
              timezone: 'Etc/UTC',
              theme: theme || 'dark',
              style: '1',
              locale: locale || 'it',
              toolbar_bg: toolbar_bg || '#f1f3f6',
              enable_publishing: false,
              allow_symbol_change: allow_symbol_change || false,
              save_image: save_image || false,
              hide_top_toolbar: hide_top_toolbar || false,
              hide_side_toolbar: hide_side_toolbar || false,
              show_popup_button: show_popup_button || false,
              popup_width: popup_width || '1000',
              popup_height: popup_height || '650',
              studies: studies || [],
              width: width || '100%',
              height: height || '100%',
              autosize: autosize || false,
              onChartReady: () => {
                console.log(
                  '[TradingViewWidget] Widget considerato pronto dopo creazione'
                );
                setWidgetCreated(true);
                setDebugStatus('success');
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }
                onChartReady?.();
              },
            });
          } catch (error) {
            console.error(
              '[TradingViewWidget] Errore creazione widget:',
              error
            );
            setCurrentError(error as Error);
            setDebugStatus('error');
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            onLoadError?.(error as Error);
          }
        }, 100);
      }
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (widgetRef.current) {
        try {
          // Verifica se il DOM è ancora presente
          const container = document.getElementById(internalId);
          if (container) {
            console.log(
              '[TradingViewWidget] Widget già rimosso o DOM non più presente'
            );
          }
        } catch (error) {
          console.log('[TradingViewWidget] Errore durante cleanup:', error);
        }
        widgetRef.current = null;
      } else {
        console.log('[TradingViewWidget] Unmount: nessun widget da rimuovere');
      }
    };
  }, [internalId, symbol, interval, theme, locale, isValid, initTimeout]);

  if (!isValid) {
    return (
      <div className="tradingview-widget-container-error">
        <div className="text-destructive font-semibold mb-2">
          Errore di configurazione TradingView Widget
        </div>
        <ul className="text-muted-foreground text-sm space-y-1">
          {validationErrors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      </div>
    );
  }

  // Box di stato di debug (solo in sviluppo)
  const isDev = process.env.NODE_ENV !== 'production';

  // Render della debug box
  const renderDebugBox = () => {
    const errorDetails = {
      status: debugStatus,
      symbol: symbol,
      interval: interval,
      theme: theme,
      locale: locale,
      validationErrors: validationErrors,
      scriptLoadError: currentError?.message,
      widgetInitError: currentError?.name,
    };

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          backgroundColor:
            debugStatus === 'error'
              ? 'rgba(255, 0, 0, 0.1)'
              : debugStatus === 'loading'
                ? 'rgba(255, 165, 0, 0.1)'
                : 'rgba(0, 255, 0, 0.1)',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1000,
        }}
      >
        <strong>DEBUG TradingViewWidget</strong>
        <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
        {debugStatus === 'error' && (
          <button
            onClick={handleRetry}
            style={{
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Riprova
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={`tradingview-widget-container ${className}`}
      style={{
        ...style,
        width: width || '100%',
        height: height || 500,
        position: 'relative',
      }}
    >
      {/* Debug box overlay (solo in development) */}
      {debug && isDev && renderDebugBox()}

      {/* Container principale per il widget TradingView */}
      <div
        id={internalId}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '300px',
        }}
      />

      {/* Loading overlay */}
      {!widgetCreated && !currentError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(2px)',
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 10px',
              }}
            />
            <p style={{ color: '#666', fontSize: '14px' }}>
              Caricamento grafico TradingView...
            </p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {currentError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            backdropFilter: 'blur(2px)',
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ color: '#d32f2f', marginBottom: '10px' }}>
              Errore caricamento grafico
            </h3>
            <p
              style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}
            >
              {currentError.message}
            </p>
            <button
              onClick={handleRetry}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Riprova
            </button>
          </div>
        </div>
      )}

      {/* CSS per l'animazione di caricamento */}
      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default NewTradingViewWidget;
