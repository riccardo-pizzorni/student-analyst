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

// Estensione globale per TradingView
declare global {
  interface Window {
    TradingView?: {
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

    // Svuota il container prima di ogni mount
    const container = document.getElementById(internalId);
    if (container) {
      container.innerHTML = '';
      setContainerClean(true);
      console.log('[TradingViewWidget] Container pulito:', internalId);
    }

    timeoutRef.current = setTimeout(() => {
      setCurrentError(
        new Error(
          `Il widget non si è inizializzato entro ${initTimeout / 1000} secondi`
        )
      );
      setDebugStatus('error');
      setWidgetCreated(false);
      console.error('[TradingViewWidget] Timeout inizializzazione widget');
      if (onLoadError)
        onLoadError(
          new Error(
            `Il widget non si è inizializzato entro ${initTimeout / 1000} secondi`
          )
        );
    }, initTimeout);

    let script = document.getElementById(
      'tradingview-widget-script'
    ) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.setAttribute('data-locale', locale || 'it');
      document.body.appendChild(script);
      console.log('[TradingViewWidget] Script TradingView aggiunto');
    } else {
      console.log('[TradingViewWidget] Script TradingView già presente');
    }

    script.onload = () => {
      try {
        if (window.TradingView) {
          widgetRef.current = new window.TradingView.widget({
            container_id: internalId,
            autosize,
            width,
            height,
            symbol,
            interval,
            theme: theme.toLowerCase(),
            style: '1',
            locale,
            toolbar_bg,
            allow_symbol_change: true,
            save_image,
            hide_top_toolbar: false,
            hide_side_toolbar: false,
            show_popup_button,
            popup_width,
            popup_height,
            ...(studies.length > 0 ? { studies } : {}),
            onSymbolChange: onSymbolChange
              ? (symbol: string) => onSymbolChange(symbol)
              : undefined,
            onIntervalChange: onIntervalChange
              ? (interval: string) => onIntervalChange(interval)
              : undefined,
            onChartReady: () => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setDebugStatus('success');
              setWidgetCreated(true);
              console.log('[TradingViewWidget] Widget creato e pronto!');
              if (onChartReady) onChartReady();
            },
          });

          // Se il widget è stato creato con successo, consideriamolo come inizializzato
          // anche se onChartReady non viene chiamato immediatamente
          if (widgetRef.current) {
            // Breve delay per permettere al widget di renderizzare
            setTimeout(() => {
              if (timeoutRef.current && !widgetCreated) {
                clearTimeout(timeoutRef.current);
                setDebugStatus('success');
                setWidgetCreated(true);
                console.log(
                  '[TradingViewWidget] Widget considerato pronto dopo creazione'
                );
                if (onChartReady) onChartReady();
              }
            }, 3000); // 3 secondi dovrebbero essere sufficienti per il rendering
          }

          console.log('[TradingViewWidget] Widget TradingView istanziato');
        }
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Unknown error during initialization');
        setCurrentError(err);
        setDebugStatus('error');
        setWidgetCreated(false);
        console.error(
          "[TradingViewWidget] Errore durante l'inizializzazione:",
          err
        );
        if (onLoadError) onLoadError(err);
      }
    };

    script.onerror = error => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const err = new Error('Failed to load TradingView script');
      setCurrentError(err);
      setDebugStatus('error');
      setWidgetCreated(false);
      console.error(
        '[TradingViewWidget] Errore caricamento script TradingView'
      );
      if (onLoadError) onLoadError(err);
    };

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (widgetRef.current) {
        try {
          // Solo se esiste la funzione remove e il DOM è ancora presente
          if (
            typeof widgetRef.current.remove === 'function' &&
            widgetRef.current._innerChartWidget &&
            widgetRef.current._innerChartWidget._hostedWidget &&
            widgetRef.current._innerChartWidget._hostedWidget.parentNode
          ) {
            widgetRef.current.remove();
            console.log('[TradingViewWidget] Widget rimosso in unmount');
          } else {
            console.log(
              '[TradingViewWidget] Widget già rimosso o DOM non più presente'
            );
          }
          widgetRef.current = null;
        } catch (error) {
          if (
            !(
              error instanceof TypeError &&
              error.message &&
              error.message.includes('parentNode')
            )
          ) {
            console.error(
              '[TradingViewWidget] Errore durante la rimozione del widget TradingView:',
              error
            );
          } else {
            console.log(
              '[TradingViewWidget] Widget già rimosso (parentNode null)'
            );
          }
        }
      } else {
        console.log('[TradingViewWidget] Unmount: nessun widget da rimuovere');
      }
      // PATCH: Rimuovi lo script TradingView dal DOM per forzare il reload al prossimo mount
      const script = document.getElementById('tradingview-widget-script');
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
        console.log(
          '[TradingViewWidget] Script TradingView rimosso dal DOM in unmount'
        );
      }
    };
  }, [
    internalId,
    symbol,
    interval,
    theme,
    width,
    height,
    locale,
    autosize,
    studies,
    toolbar_bg,
    popup_width,
    popup_height,
    hide_top_toolbar,
    hide_side_toolbar,
    allow_symbol_change,
    save_image,
    show_popup_button,
    onSymbolChange,
    onIntervalChange,
    onChartReady,
    onLoadError,
    initTimeout,
    isValid,
    widgetCreated,
  ]);

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
