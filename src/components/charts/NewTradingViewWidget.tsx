import React, { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

type CSSProperties = Record<string, string | number>;

// Dichiarazione del tipo per TradingView
declare global {
  interface Window {
    TradingView: {
      widget: new (config: any) => any;
    };
  }
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
  autosize = false,
  toolbar_bg = '#f1f3f6',
  allow_symbol_change = false,
  save_image = false,
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

  // Carica lo script TradingView una sola volta
  useEffect(() => {
    if (scriptLoaded || typeof window.TradingView !== 'undefined') {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      console.log('[TradingViewWidget] Script caricato');
    };
    script.onerror = () => {
      setError('Errore nel caricamento dello script TradingView');
      console.error('[TradingViewWidget] Errore caricamento script');
    };

    document.head.appendChild(script);

    return () => {
      // Non rimuovere lo script al cleanup per evitare problemi
    };
  }, []);

  // Crea il widget quando lo script è caricato
  useEffect(() => {
    if (
      !scriptLoaded ||
      !isValid ||
      typeof window.TradingView === 'undefined' ||
      !containerRef.current
    ) {
      return;
    }

    if (debug) {
      console.log('[TradingViewWidget] Inizializzazione widget:', {
        symbol,
        interval,
        containerId,
      });
    }

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
        if (debug) {
          console.log('[TradingViewWidget] Cleanup widget precedente');
        }
      }
      widgetRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    // Timeout per l'inizializzazione
    timeoutRef.current = setTimeout(() => {
      setError('Timeout: il widget non si è caricato entro 30 secondi');
      setIsLoading(false);
    }, initTimeout);

    try {
      // Crea il widget
      widgetRef.current = new window.TradingView.widget({
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
        studies: studies,
        width: width,
        height: height,
        autosize: autosize,
        onChartReady: () => {
          console.log('[TradingViewWidget] Widget pronto');
          setIsLoading(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          onChartReady?.();
        },
      });

      console.log('[TradingViewWidget] Widget creato');
    } catch (error) {
      console.error('[TradingViewWidget] Errore creazione widget:', error);
      setError('Errore nella creazione del widget');
      setIsLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      onLoadError?.(error as Error);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    scriptLoaded,
    isValid,
    symbol,
    interval,
    theme,
    locale,
    hide_top_toolbar,
    hide_side_toolbar,
    containerId,
    initTimeout,
    onChartReady,
    onLoadError,
    // Altre props necessarie
    width,
    height,
    autosize,
    toolbar_bg,
    allow_symbol_change,
    save_image,
    show_popup_button,
    popup_width,
    popup_height,
    studies,
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

  if (!isValid) {
    return (
      <div className={`tradingview-widget-error ${className}`} style={style}>
        <div className="text-red-500 p-4">
          <h3>Errore di validazione</h3>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`tradingview-widget-container ${className}`} style={style}>
      <div
        id={containerId}
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
        }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
              style={{ animation: 'spin 1s linear infinite' }}
            />
            <span className="text-sm text-muted-foreground">
              Caricamento grafico TradingView...
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center p-4">
            <div className="text-red-500 mb-2">
              ❌ Errore caricamento grafico
            </div>
            <div className="text-sm text-muted-foreground">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
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
};

export default NewTradingViewWidget;
