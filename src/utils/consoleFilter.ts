// Filtro per nascondere errori innocui di TradingView dalla console
export const setupConsoleFilter = () => {
  // Lista di messaggi da filtrare (errori innocui)
  const FILTERED_MESSAGES = [
    'telemetry.tradingview.com',
    'CORS non riuscita',
    'NetworkError when attempting to fetch resource',
    'Content-Security-Policy',
    'script-src-elem',
    'The state with a data type: unknown does not match a schema',
    'cookie partizionato o accesso alle risorse di archiviazione',
    'Bloccata richiesta multiorigine',
    "criterio di corrispondenza dell'origine non consente",
  ];

  // Backup delle funzioni originali
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  // Funzione per verificare se un messaggio deve essere filtrato
  const shouldFilter = (message: string): boolean => {
    return FILTERED_MESSAGES.some(filter =>
      message.toLowerCase().includes(filter.toLowerCase())
    );
  };

  // Override console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilter(message)) {
      originalError.apply(console, args);
    }
  };

  // Override console.warn
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilter(message)) {
      originalWarn.apply(console, args);
    }
  };

  // Override console.log per messaggi specifici
  console.log = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilter(message)) {
      originalLog.apply(console, args);
    }
  };

  // Funzione per ripristinare la console originale (se necessario)
  return () => {
    console.error = originalError;
    console.warn = originalWarn;
    console.log = originalLog;
  };
};
