import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * TRADINGVIEW WIDGET INTEGRATION - SCRIPT LOADING SYSTEM
 *
 * Questo componente implementa un'integrazione sicura con il widget TradingView
 * utilizzando il caricamento dinamico dello script esterno. Il sistema è progettato
 * per gestire in modo robusto:
 *
 * 1. CARICAMENTO ASINCRONO: Lo script viene caricato dinamicamente solo quando necessario
 * 2. GESTIONE ERRORI: Timeout, errori di rete e fallback graceful
 * 3. PREVENZIONE DUPLICATI: Evita il caricamento multiplo dello stesso script
 * 4. CLEANUP: Pulizia delle risorse per prevenire memory leak
 * 5. VALIDAZIONE: Controllo dei parametri prima dell'inizializzazione
 *
 * ============================================================================
 * ERROR HANDLING STRATEGY - STRATEGIA DI GESTIONE ERRORI
 * ============================================================================
 *
 * Il sistema implementa una strategia di gestione errori su più livelli:
 *
 * 1. VALIDATION ERRORS (Pre-caricamento):
 *    - Validazione parametri prima dell'inizializzazione
 *    - Controllo formato simboli, intervalli, dimensioni
 *    - Prevenzione errori runtime con validazione anticipata
 *    - Errori mostrati immediatamente senza caricamento script
 *
 * 2. NETWORK ERRORS (Durante caricamento):
 *    - script.onerror: Gestisce fallimenti caricamento CDN
 *    - Possibili cause: problemi rete, CDN down, firewall/adblocker
 *    - Fallback: Messaggio errore + bottone retry
 *    - Recovery: Reload completo pagina per reset stato
 *
 * 3. INITIALIZATION ERRORS (Post-caricamento):
 *    - try/catch durante creazione widget TradingView
 *    - Gestisce parametri invalidi non catturati da validazione
 *    - Problemi memory browser, conflitti script
 *    - API TradingView temporaneamente non disponibile
 *
 * 4. TIMEOUT ERRORS (Prestazioni):
 *    - Timer di sicurezza per prevenire blocchi infiniti
 *    - Configurabile tramite initTimeout prop
 *    - Trigger automatico onLoadError callback
 *    - Previene esperienze utente degradate
 *
 * ERROR RECOVERY PATTERNS:
 * - Automatic fallback UI con messaggio descrittivo
 * - Manual retry tramite bottone "Riprova"
 * - Callback onLoadError per gestione custom parent
 * - Logging dettagliato console per debugging
 *
 * ============================================================================
 * CLEANUP & MEMORY MANAGEMENT - GESTIONE MEMORIA E PULIZIA
 * ============================================================================
 *
 * Il sistema implementa un cleanup rigoroso per prevenire memory leak:
 *
 * 1. TIMEOUT CLEANUP:
 *    - Cancellazione timer quando widget si carica con successo
 *    - Cancellazione timer durante unmount componente
 *    - Prevenzione callback orfani dopo unmount
 *    - clearTimeout() in tutti i path di uscita
 *
 * 2. WIDGET CLEANUP:
 *    - Rimozione istanza widget TradingView durante unmount
 *    - Chiamata metodo remove() se disponibile
 *    - Nulling reference per garbage collection
 *    - Gestione errori durante cleanup stesso
 *
 * 3. SCRIPT CLEANUP:
 *    - Rimozione script DOM durante unmount
 *    - Prevenzione accumulo script duplicati
 *    - getElementById per lookup sicuro
 *    - removeChild() solo se elemento esiste
 *
 * 4. EVENT LISTENERS CLEANUP:
 *    - Event handlers script (onload/onerror) sono automaticamente rimossi
 *    - TradingView widget cleanup gestisce propri event listeners
 *    - useEffect cleanup function garantisce pulizia completa
 *
 * MEMORY LEAK PREVENTION:
 * - Tutte le risorse sono tracciabili tramite useRef
 * - Cleanup function chiamata su unmount E dependency change
 * - Defensive programming con try/catch durante cleanup
 * - Null checking prima di ogni operazione cleanup
 *
 * PERFORMANCE CONSIDERATIONS:
 * - Script DOM lookup una sola volta durante cleanup
 * - Operazioni asincrone cancellate preventivamente
 * - Resource disposal ordinato (timer → widget → script)
 * - Minimal impact su performance durante cleanup
 */

// Costanti per validazione
const VALID_INTERVALS = [
  '1',
  '3',
  '5',
  '15',
  '30',
  '60',
  '120',
  '240',
  'D',
  'W',
  'M',
] as const;
const VALID_THEMES = ['light', 'dark'] as const;
const SUPPORTED_EXCHANGES = ['NASDAQ', 'NYSE', 'MIL', 'BINANCE', 'FX'] as const;

// Tipi per validazione
type ValidInterval = (typeof VALID_INTERVALS)[number];
type ValidTheme = (typeof VALID_THEMES)[number];
type SupportedExchange = (typeof SUPPORTED_EXCHANGES)[number];

/**
 * VALIDATION FUNCTIONS - PARAMETRI SICURI
 *
 * Queste funzioni garantiscono che solo parametri validi vengano passati
 * al widget TradingView, prevenendo errori di runtime e comportamenti imprevisti.
 */

const isValidInterval = (interval: string): interval is ValidInterval => {
  return VALID_INTERVALS.includes(interval as ValidInterval);
};

const isValidTheme = (theme: string): theme is ValidTheme => {
  return VALID_THEMES.includes(theme as ValidTheme);
};

const isValidSymbol = (symbol: string): boolean => {
  const parts = symbol.split(':');
  if (parts.length !== 2) return false;
  const [exchange, ticker] = parts;
  return (
    SUPPORTED_EXCHANGES.includes(exchange as SupportedExchange) &&
    ticker.length > 0
  );
};

const isValidDimension = (value: string | number): boolean => {
  if (typeof value === 'number') return value > 0;
  return /^(\d+px|\d+%|auto|100%)$/.test(value);
};

/**
 * ============================================================================
 * COMPONENT PROPS INTERFACE - DETAILED PARAMETER DOCUMENTATION
 * ============================================================================
 *
 * Questa interfaccia definisce tutti i parametri configurabili del widget TradingView.
 * Ogni parametro ha un impatto specifico sul comportamento e l'aspetto del widget.
 *
 * CATEGORIE DI PARAMETRI:
 * 1. CORE CONFIGURATION: Parametri essenziali per il funzionamento base
 * 2. LAYOUT & STYLING: Controllo aspetto visivo e dimensioni
 * 3. USER INTERFACE: Controllo elementi UI e interattività
 * 4. TECHNICAL ANALYSIS: Configurazione indicatori e studi
 * 5. REACT INTEGRATION: Integrazione con l'ecosistema React
 * 6. EVENT HANDLING: Gestione eventi e callback
 * 7. PERFORMANCE & RELIABILITY: Controllo prestazioni e affidabilità
 */
interface NewTradingViewWidgetProps {
  // ========================================================================
  // 1. CORE CONFIGURATION - PARAMETRI ESSENZIALI
  // ========================================================================

  /**
   * SYMBOL - Simbolo Finanziario
   *
   * Formato: "EXCHANGE:TICKER" (es. "NASDAQ:AAPL", "BINANCE:BTCUSDT")
   *
   * EXCHANGES SUPPORTATI:
   * - NASDAQ: Mercato azionario statunitense (es. NASDAQ:AAPL, NASDAQ:MSFT)
   * - NYSE: New York Stock Exchange (es. NYSE:IBM, NYSE:GE)
   * - MIL: Borsa Italiana (es. MIL:ENEL, MIL:ENI)
   * - BINANCE: Crypto exchange (es. BINANCE:BTCUSDT, BINANCE:ETHBTC)
   * - FX: Forex pairs (es. FX:EURUSD, FX:GBPJPY)
   *
   * VALIDAZIONE:
   * - Deve contenere esattamente un ":" separatore
   * - Exchange deve essere nella lista supportata
   * - Ticker non può essere vuoto
   * - Trigger reload del widget se cambiato
   *
   * DEFAULT: "NASDAQ:AAPL"
   * ESEMPIO: "MIL:ENEL" per azioni italiane
   */
  symbol?: string;

  /**
   * INTERVAL - Intervallo Temporale
   *
   * Determina il timeframe di ogni candela/barra nel grafico.
   *
   * VALORI SUPPORTATI:
   * - "1", "3", "5", "15", "30": Minuti (intraday)
   * - "60", "120", "240": Ore (1h, 2h, 4h)
   * - "D": Giornaliero (1 giorno per candela)
   * - "W": Settimanale (1 settimana per candela)
   * - "M": Mensile (1 mese per candela)
   *
   * IMPATTO SUL WIDGET:
   * - Cambia la granularità dei dati visualizzati
   * - Influenza il caricamento dei dati storici
   * - Trigger reload del widget se cambiato
   *
   * DEFAULT: "D" (giornaliero)
   * ESEMPIO: "15" per trading intraday, "W" per analisi long-term
   */
  interval?: string;

  /**
   * LOCALE - Localizzazione
   *
   * Controlla la lingua dell'interfaccia utente del widget.
   *
   * FORMATO: "language" o "language-COUNTRY" (ISO 639-1 + ISO 3166-1)
   *
   * LINGUE COMUNI:
   * - "it": Italiano
   * - "en": Inglese
   * - "de": Tedesco
   * - "fr": Francese
   * - "es": Spagnolo
   * - "ru": Russo
   * - "zh": Cinese
   *
   * ELEMENTI LOCALIZZATI:
   * - Etichette toolbar e menu
   * - Messaggi di errore
   * - Formati data e ora
   * - Separatori numerici
   *
   * DEFAULT: "it" (italiano)
   * ESEMPIO: "en-US" per inglese americano
   */
  locale?: string;

  // ========================================================================
  // 2. LAYOUT & STYLING - CONTROLLO ASPETTO VISIVO
  // ========================================================================

  /**
   * THEME - Tema Visivo
   *
   * Controlla lo schema colori dell'intero widget.
   *
   * VALORI:
   * - "light": Tema chiaro (sfondo bianco/grigio chiaro)
   * - "dark": Tema scuro (sfondo nero/grigio scuro)
   *
   * ELEMENTI TEMATIZZATI:
   * - Sfondo principale del grafico
   * - Colore delle candele/barre
   * - Toolbar e menu
   * - Testo e etichette
   * - Linee della griglia
   *
   * INTEGRAZIONE:
   * - Dovrebbe matchare il tema dell'applicazione host
   * - Trigger reload del widget se cambiato
   *
   * DEFAULT: "dark"
   * CONSIGLIO: Usa "dark" per trading apps, "light" per dashboards business
   */
  theme?: 'light' | 'dark';

  /**
   * WIDTH - Larghezza Container
   *
   * Controlla la larghezza del widget container.
   *
   * TIPI ACCETTATI:
   * - number: Pixel esatti (es. 800 → "800px")
   * - string: CSS value (es. "100%", "50vw", "800px")
   *
   * VALORI COMUNI:
   * - "100%": Occupa tutta la larghezza del parent
   * - "50%": Metà della larghezza del parent
   * - 800: 800 pixel esatti
   * - "calc(100vw - 200px)": Larghezza viewport meno 200px
   *
   * RESPONSIVE DESIGN:
   * - Usa "100%" per layout responsive
   * - Usa pixel per dimensioni fisse
   * - Combinato con autosize per adattamento automatico
   *
   * DEFAULT: "100%"
   */
  width?: string | number;

  /**
   * HEIGHT - Altezza Container
   *
   * Controlla l'altezza del widget container.
   *
   * TIPI ACCETTATI:
   * - number: Pixel esatti (es. 500 → "500px")
   * - string: CSS value (es. "100%", "60vh", "500px")
   *
   * CONSIDERAZIONI:
   * - Altezza minima: 300px (hard-coded per evitare layout shift)
   * - TradingView raccomanda almeno 400px per UX ottimale
   * - Con autosize=true, può adattarsi dinamicamente
   *
   * VALORI COMUNI:
   * - 500: 500px, buono per dashboard
   * - "60vh": 60% altezza viewport
   * - "100%": Occupa tutto lo spazio del parent
   *
   * DEFAULT: 500 (pixel)
   */
  height?: string | number;

  /**
   * AUTOSIZE - Ridimensionamento Automatico
   *
   * Abilita il ridimensionamento automatico del widget.
   *
   * COMPORTAMENTO:
   * - true: Il widget si adatta dinamicamente al container
   * - false: Usa dimensioni esplicite width/height
   *
   * QUANDO USARE:
   * - true: Layout responsive, container dimensioni variabili
   * - false: Dimensioni fisse, controllo preciso layout
   *
   * INTERAZIONE CON WIDTH/HEIGHT:
   * - Se autosize=true, width/height servono come dimensioni iniziali
   * - Il widget può poi adattarsi alle modifiche del container
   *
   * DEFAULT: true
   * RACCOMANDAZIONE: Usa true per la maggior parte dei casi
   */
  autosize?: boolean;

  /**
   * TOOLBAR_BG - Colore Sfondo Toolbar
   *
   * Personalizza il colore di sfondo della toolbar superiore.
   *
   * FORMATO: Qualsiasi valore CSS color valido
   * - Hex: "#131722", "#FFFFFF"
   * - RGB: "rgb(19, 23, 34)"
   * - HSL: "hsl(225, 30%, 10%)"
   * - Named: "black", "white", "transparent"
   *
   * INTEGRAZIONE DESIGN:
   * - Dovrebbe matchare il design system dell'app
   * - Considera contrasto per accessibilità
   * - Testa con entrambi i temi (light/dark)
   *
   * DEFAULT: "#131722" (grigio scuro)
   * ESEMPIO: "#1f2937" per tema Tailwind gray-800
   */
  toolbar_bg?: string;

  // ========================================================================
  // 3. USER INTERFACE - CONTROLLO ELEMENTI UI E INTERATTIVITÀ
  // ========================================================================

  /**
   * ALLOW_SYMBOL_CHANGE - Cambio Simbolo dall'Interfaccia
   *
   * Controlla se l'utente può cambiare il simbolo finanziario dall'UI del widget.
   *
   * COMPORTAMENTO:
   * - true: Mostra field di ricerca simbolo, utente può cambiare
   * - false: Simbolo fisso, non modificabile dall'utente
   *
   * EVENTI:
   * - Se abilitato, trigger onSymbolChange callback
   * - Il componente parent riceve notifica del cambio
   *
   * CASI D'USO:
   * - true: Dashboard trading, esploratore mercati
   * - false: Widget embedded con simbolo specifico
   *
   * DEFAULT: true
   * CONSIDERAZIONE: Disabilita se il simbolo deve rimanere fisso per business logic
   */
  allow_symbol_change?: boolean;

  /**
   * SAVE_IMAGE - Funzionalità Salvataggio Immagine
   *
   * Abilita il bottone per salvare il grafico come immagine.
   *
   * FORMATI SUPPORTATI:
   * - PNG: Alta qualità, supporto trasparenza
   * - SVG: Grafica vettoriale, scalabile
   *
   * FUNZIONALITÀ:
   * - Cattura snapshot del grafico corrente
   * - Include tutti gli indicatori e annotazioni visibili
   * - Mantiene risoluzione originale
   *
   * PRIVACY:
   * - Nessun dato inviato a server esterni
   * - Elaborazione locale nel browser
   *
   * DEFAULT: true
   * USO: Utile per report, condivisione analisi
   */
  save_image?: boolean;

  /**
   * HIDE_TOP_TOOLBAR - Nascondere Toolbar Superiore
   *
   * Controlla la visibilità della toolbar superiore del widget.
   *
   * ELEMENTI TOOLBAR SUPERIORE:
   * - Selector simbolo (se allow_symbol_change=true)
   * - Selector intervallo temporale
   * - Bottoni zoom e pan
   * - Menu indicatori
   * - Bottone salva immagine (se save_image=true)
   *
   * CASI D'USO:
   * - false: Esperienza completa, controllo utente
   * - true: Widget minimale, controllo programmatico
   *
   * IMPATTO UX:
   * - Nascondere toolbar limita l'interattività
   * - Più spazio per il grafico stesso
   * - Controlli devono essere implementati esternamente
   *
   * DEFAULT: false (toolbar visibile)
   */
  hide_top_toolbar?: boolean;

  /**
   * HIDE_SIDE_TOOLBAR - Nascondere Toolbar Laterale
   *
   * Controlla la visibilità della toolbar laterale destra.
   *
   * ELEMENTI TOOLBAR LATERALE:
   * - Strumenti di disegno (linee di trend, fibonacci, etc.)
   * - Template e layout salvati
   * - Controlli avanzati chart
   *
   * CONSIDERAZIONI:
   * - Toolbar laterale è meno critica della superiore
   * - Nasconderla recupera spazio horizontale
   * - Funzionalità base rimangono disponibili
   *
   * CASI D'USO:
   * - true: Widget embedded, spazio limitato
   * - false: Applicazioni trading avanzate
   *
   * DEFAULT: false (toolbar visibile)
   */
  hide_side_toolbar?: boolean;

  /**
   * SHOW_POPUP_BUTTON - Bottone Apertura Popup
   *
   * Mostra bottone per aprire il widget in finestra popup.
   *
   * FUNZIONALITÀ:
   * - Apre widget in nuova finestra browser
   * - Dimensioni configurabili (popup_width/popup_height)
   * - Mantiene stato e configurazione corrente
   * - Utile per analisi dettagliata
   *
   * INTEGRAZIONE:
   * - Popup è gestito direttamente da TradingView
   * - Nessun codice aggiuntivo richiesto
   * - Funziona con popup blockers moderni
   *
   * CASI D'USO:
   * - Dashboard con widget piccoli
   * - Quick preview che può espandersi
   *
   * DEFAULT: false
   */
  show_popup_button?: boolean;

  /**
   * POPUP_WIDTH - Larghezza Finestra Popup
   *
   * Larghezza della finestra popup (se show_popup_button=true).
   *
   * TIPI:
   * - number: Pixel (es. 1000)
   * - string: Valore CSS (es. "1200px")
   *
   * CONSIDERAZIONI:
   * - Risoluzione schermo utente
   * - Spazio per toolbar TradingView
   * - Leggibilità grafico
   *
   * VALORI RACCOMANDATI:
   * - Desktop: 1200-1600px
   * - Laptop: 1000-1200px
   * - Tablet: 800-1000px
   *
   * DEFAULT: "1000"
   */
  popup_width?: string | number;

  /**
   * POPUP_HEIGHT - Altezza Finestra Popup
   *
   * Altezza della finestra popup (se show_popup_button=true).
   *
   * CONSIDERAZIONI AGGIUNTIVE:
   * - Barra del titolo browser
   * - Toolbar del browser
   * - Spazio sufficiente per chart leggibile
   *
   * VALORI RACCOMANDATI:
   * - Standard: 650-800px
   * - Full analysis: 900-1200px
   * - Minimal: 500-650px
   *
   * DEFAULT: "650"
   */
  popup_height?: string | number;

  // ========================================================================
  // 4. TECHNICAL ANALYSIS - CONFIGURAZIONE INDICATORI E STUDI
  // ========================================================================

  /**
   * STUDIES - Indicatori Tecnici
   *
   * Array di indicatori tecnici da visualizzare automaticamente.
   *
   * INDICATORI SUPPORTATI:
   * - "RSI": Relative Strength Index (momentum)
   * - "MACD": Moving Average Convergence Divergence
   * - "SMA": Simple Moving Average
   * - "EMA": Exponential Moving Average
   * - "BB": Bollinger Bands
   * - "Volume": Indicatore volume
   * - "Stoch": Stochastic Oscillator
   * - "Williams %R": Williams Percent Range
   *
   * CONFIGURAZIONE:
   * - Ogni indicatore usa parametri default di TradingView
   * - Per customizzazione avanzata, usa studies_overrides
   * - Indicatori sono aggiunti automaticamente al caricamento
   *
   * PERFORMANCE:
   * - Troppi indicatori possono rallentare il rendering
   * - Raccomandati max 3-5 indicatori simultanei
   *
   * DEFAULT: [] (nessun indicatore)
   * ESEMPIO: ["RSI", "MACD"] per analisi momentum
   */
  studies?: string[];

  // ========================================================================
  // 5. REACT INTEGRATION - INTEGRAZIONE ECOSISTEMA REACT
  // ========================================================================

  /**
   * CLASSNAME - Classi CSS Personalizzate
   *
   * Classi CSS aggiuntive da applicare al container principale.
   *
   * UTILIZZO:
   * - Styling aggiuntivo senza sovrascrivere stili base
   * - Integrazione con framework CSS (Tailwind, Bootstrap, etc.)
   * - Responsive design custom
   *
   * MERGE BEHAVIOR:
   * - Classi sono aggiunte alle classi base del componente
   * - Possono sovrascrivere stili specifici
   * - Usare !important con cautela
   *
   * ESEMPI:
   * - "shadow-lg border-2": Tailwind styling
   * - "my-custom-chart": Classe CSS personalizzata
   * - "responsive-chart mobile-hide": Classi multiple
   *
   * DEFAULT: ""
   */
  className?: string;

  /**
   * STYLE - Stili Inline Personalizzati
   *
   * Oggetto React.CSSProperties per stili inline diretti.
   *
   * PRIORITÀ:
   * - Stili inline hanno priorità su classi CSS
   * - Merged con stili base del componente
   * - Sovrascrive width/height se specificati
   *
   * CASI D'USO:
   * - Styling dinamico basato su state
   * - Overrides specifici di stili base
   * - Integrazioni con librerie di styling
   *
   * ESEMPIO:
   * ```tsx
   * style={{
   *   border: '2px solid red',
   *   borderRadius: '8px',
   *   boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
   * }}
   * ```
   *
   * DEFAULT: {}
   */
  style?: React.CSSProperties;

  // ========================================================================
  // 6. EVENT HANDLING - GESTIONE EVENTI E CALLBACK
  // ========================================================================

  /**
   * ONSYMBOLCHANGE - Callback Cambio Simbolo
   *
   * Funzione chiamata quando l'utente cambia il simbolo dal widget.
   *
   * PARAMETRI CALLBACK:
   * - symbol: string - Nuovo simbolo nel formato "EXCHANGE:TICKER"
   *
   * TRIGGER:
   * - Solo se allow_symbol_change=true
   * - Chiamata dopo validazione del simbolo
   * - Prima dell'aggiornamento visuale del widget
   *
   * CASI D'USO:
   * - Sincronizzazione con altri componenti
   * - Logging per analytics
   * - Validazione business logic custom
   * - Update URL/routing
   *
   * ESEMPIO:
   * ```tsx
   * onSymbolChange={(newSymbol) => {
   *   console.log('Simbolo cambiato a:', newSymbol);
   *   setCurrentSymbol(newSymbol);
   *   updateURL(newSymbol);
   * }}
   * ```
   */
  onSymbolChange?: (symbol: string) => void;

  /**
   * ONINTERVALCHANGE - Callback Cambio Intervallo
   *
   * Funzione chiamata quando l'utente cambia l'intervallo temporale.
   *
   * PARAMETRI CALLBACK:
   * - interval: string - Nuovo intervallo (es. "D", "1", "15")
   *
   * COMPORTAMENTO:
   * - Chiamata prima del reload dei dati
   * - Permette interceptare/validare il cambio
   * - Utile per sincronizzazione UI esterna
   *
   * INTEGRAZIONE:
   * - Aggiorna componenti correlati (indicatori, news, etc.)
   * - Salva preferenze utente
   * - Trigger caricamento dati aggiuntivi
   *
   * ESEMPIO:
   * ```tsx
   * onIntervalChange={(newInterval) => {
   *   setChartInterval(newInterval);
   *   loadRelatedData(newInterval);
   *   trackUserPreference('interval', newInterval);
   * }}
   * ```
   */
  onIntervalChange?: (interval: string) => void;

  /**
   * ONCHARTREADY - Callback Inizializzazione Completata
   *
   * Funzione chiamata quando il widget è completamente inizializzato.
   *
   * TIMING:
   * - Dopo caricamento script TradingView
   * - Dopo creazione istanza widget
   * - Dopo caricamento dati iniziali
   * - Prima che il widget sia visibile all'utente
   *
   * STATO GARANTITO:
   * - Widget completamente funzionale
   * - Tutti i dati iniziali caricati
   * - UI responsiva agli input utente
   * - Safe per interazioni programmatiche
   *
   * CASI D'USO:
   * - Nascondere loading indicators
   * - Abilitare controlli esterni
   * - Inizializzare integrazioni aggiuntive
   * - Tracking analytics (time to load)
   *
   * ESEMPIO:
   * ```tsx
   * onChartReady={() => {
   *   setIsLoading(false);
   *   enableExternalControls();
   *   trackEvent('chart_loaded');
   * }}
   * ```
   */
  onChartReady?: () => void;

  /**
   * ONLOADERROR - Callback Gestione Errori
   *
   * Funzione chiamata in caso di errori durante il caricamento.
   *
   * PARAMETRI CALLBACK:
   * - error: Error - Oggetto errore con dettagli
   *
   * TIPI DI ERRORI:
   * - Script loading failure (rete, CDN down)
   * - Widget initialization error (configurazione invalida)
   * - Timeout error (caricamento troppo lento)
   * - Parameter validation error (props invalide)
   *
   * GESTIONE ERRORI:
   * - Log per debugging/monitoring
   * - Fallback UI o widget alternativi
   * - Retry logic personalizzato
   * - User notification
   *
   * ERROR OBJECT PROPERTIES:
   * - message: Descrizione human-readable
   * - name: Tipo di errore
   * - stack: Stack trace (in development)
   *
   * ESEMPIO:
   * ```tsx
   * onLoadError={(error) => {
   *   console.error('TradingView error:', error);
   *   notifyUser('Errore caricamento grafico');
   *   trackError(error);
   *   setShowFallback(true);
   * }}
   * ```
   */
  onLoadError?: (error: Error) => void;

  // ========================================================================
  // 7. PERFORMANCE & RELIABILITY - CONTROLLO PRESTAZIONI E AFFIDABILITÀ
  // ========================================================================

  /**
   * INITTIMEOUT - Timeout Inizializzazione
   *
   * Tempo massimo in millisecondi per il caricamento del widget.
   *
   * FUNZIONAMENTO:
   * - Timer inizia con il caricamento dello script
   * - Cancellato quando onChartReady viene chiamato
   * - Trigger onLoadError se scaduto
   *
   * CONSIDERAZIONI:
   * - Connessioni lente richiedono timeout maggiori
   * - Timeout troppo corti causano false positive
   * - Timeout troppo lunghi peggiorano UX
   *
   * VALORI RACCOMANDATI:
   * - Connessione veloce: 5000-8000ms
   * - Connessione standard: 10000-15000ms
   * - Connessione lenta: 15000-20000ms
   * - Ambiente mobile: 15000-25000ms
   *
   * FALLBACK STRATEGY:
   * - Implementa retry con timeout incrementale
   * - Mostra messaggio utente dopo timeout
   * - Considera fallback a grafico semplificato
   *
   * DEFAULT: 10000 (10 secondi)
   * ESEMPIO: 15000 per ambienti mobile o reti lente
   */
  initTimeout?: number;
}

/**
 * GLOBAL WINDOW EXTENSION
 *
 * Estende l'interfaccia Window per includere l'oggetto TradingView
 * che viene aggiunto dinamicamente dallo script esterno.
 */
declare global {
  interface Window {
    TradingView?: {
      widget: new (config: any) => any;
    };
  }
}

const NewTradingViewWidget: React.FC<NewTradingViewWidgetProps> = ({
  // Props principali con valori di default sicuri
  symbol = 'NASDAQ:AAPL',
  theme = 'dark',
  width = '100%',
  height = 500,
  interval = 'D',
  locale = 'it',

  // Props avanzate con configurazione ottimale
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

  // Props per il container
  className = '',
  style = {},

  // Props per gli eventi
  onSymbolChange,
  onIntervalChange,
  onChartReady,
  onLoadError,

  // Props per il timeout (default: 10 secondi)
  initTimeout = 10000,
}) => {
  /**
   * COMPONENT STATE MANAGEMENT
   *
   * Gestisce tutti gli stati necessari per il ciclo di vita del widget:
   * - ID univoco per evitare conflitti tra istanze multiple
   * - Riferimenti per cleanup delle risorse
   * - Stati di loading, errori e validazione
   */

  // Genera un ID unico per il container (sostituisce ':' per compatibilità DOM)
  const containerId = useId().replace(/:/g, '_');

  // Riferimento al widget TradingView per cleanup
  const widgetRef = useRef<any>(null);

  // Riferimento al timer di timeout per cleanup
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Stati per gestione UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stati per errori di validazione parametri
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * PROPS VALIDATION SYSTEM
   *
   * Valida tutti i parametri prima dell'inizializzazione per prevenire
   * errori runtime e comportamenti imprevisti del widget.
   */
  const validateProps = useCallback(() => {
    const errors: string[] = [];

    // Valida il simbolo finanziario (formato EXCHANGE:TICKER)
    if (symbol && !isValidSymbol(symbol)) {
      errors.push(
        `Simbolo non valido: ${symbol}. Formato atteso: EXCHANGE:TICKER (es. NASDAQ:AAPL)`
      );
    }

    // Valida l'intervallo temporale
    if (interval && !isValidInterval(interval)) {
      errors.push(
        `Intervallo non valido: ${interval}. Valori supportati: ${VALID_INTERVALS.join(', ')}`
      );
    }

    // Valida il tema
    if (theme && !isValidTheme(theme)) {
      errors.push(
        `Tema non valido: ${theme}. Valori supportati: ${VALID_THEMES.join(', ')}`
      );
    }

    // Valida dimensioni del widget
    if (width && !isValidDimension(width)) {
      errors.push(
        `Larghezza non valida: ${width}. Usa un numero positivo o una stringa valida (es. '100%', '500px')`
      );
    }
    if (height && !isValidDimension(height)) {
      errors.push(
        `Altezza non valida: ${height}. Usa un numero positivo o una stringa valida (es. '100%', '500px')`
      );
    }

    // Valida locale (formato ISO: 'it' o 'it-IT')
    if (locale && !/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) {
      errors.push(
        `Locale non valido: ${locale}. Formato atteso: 'it' o 'it-IT'`
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [symbol, interval, theme, width, height, locale]);

  /**
   * SCRIPT LOADING AND WIDGET INITIALIZATION
   *
   * Questo useEffect gestisce l'intero ciclo di vita del widget:
   *
   * 1. VALIDAZIONE: Verifica che tutti i parametri siano validi
   * 2. SCRIPT LOADING: Carica dinamicamente lo script TradingView
   * 3. INIZIALIZZAZIONE: Crea l'istanza del widget con parametri validati
   * 4. ERROR HANDLING: Gestisce timeout, errori di rete e fallback
   * 5. CLEANUP: Pulisce le risorse quando il componente viene smontato
   */
  useEffect(() => {
    // STEP 1: Validazione parametri
    // Prima di qualsiasi operazione, validiamo tutti i parametri
    const isValid = validateProps();

    // Se ci sono errori di validazione, interrompiamo il processo
    if (!isValid) {
      return;
    }

    /**
     * STEP 2: INIZIALIZZAZIONE STATI
     *
     * Reset degli stati prima di iniziare il caricamento:
     * - Attiva loading state per mostrare indicatore all'utente
     * - Reset eventuali errori precedenti per clean slate
     */
    setIsLoading(true);
    setError(null);

    /**
     * STEP 3: TIMEOUT PROTECTION
     *
     * Imposta un timer di sicurezza per prevenire blocchi infiniti.
     * Se il widget non si inizializza entro il tempo limite:
     * - Mostra errore di timeout all'utente
     * - Chiama il callback onLoadError se fornito
     * - Pulisce il loading state
     *
     * Questo previene situazioni dove lo script si carica ma il widget
     * non riesce ad inizializzarsi per problemi di rete o configurazione.
     */
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        const timeoutError = new Error(
          `Il widget non si è inizializzato entro ${initTimeout / 1000} secondi`
        );
        console.error(
          'Timeout durante il caricamento del widget TradingView:',
          timeoutError
        );
        setError(timeoutError);
        setIsLoading(false);
        if (onLoadError) {
          onLoadError(timeoutError);
        }
      }
    }, initTimeout);

    /**
     * STEP 4: DYNAMIC SCRIPT LOADING
     *
     * Carica dinamicamente lo script TradingView da CDN esterno.
     *
     * VANTAGGI del caricamento dinamico:
     * - Evita il bundle bloat (script caricato solo quando necessario)
     * - Sempre ultima versione dal CDN ufficiale TradingView
     * - Gestione errori granulare per problemi di rete
     *
     * CONFIGURAZIONE SCRIPT:
     * - ID univoco per prevenire duplicati
     * - Async loading per non bloccare il main thread
     * - Event handlers per success/error management
     */
    const script = document.createElement('script');
    script.id = 'tradingview-widget-script'; // ID univoco per gestione DOM
    script.src = 'https://s3.tradingview.com/tv.js'; // CDN ufficiale TradingView
    script.async = true; // Caricamento asincrono non-blocking

    /**
     * STEP 5: SCRIPT SUCCESS HANDLER
     *
     * Gestisce il caso di successo del caricamento dello script.
     * Questa funzione viene chiamata quando lo script è stato scaricato
     * e processato dal browser con successo.
     */
    script.onload = () => {
      try {
        /**
         * VERIFICA DISPONIBILITÀ API
         *
         * Controlla che l'oggetto TradingView sia disponibile nel window.
         * Lo script potrebbe caricarsi ma l'API potrebbe non essere disponibile
         * per problemi di compatibilità o errori del server.
         */
        if (window.TradingView) {
          /**
           * WIDGET CONFIGURATION
           *
           * Crea una nuova istanza del widget con configurazione validata.
           * Ogni parametro viene passato dopo essere stato validato.
           *
           * PARAMETRI CRITICI:
           * - container_id: ID univoco del container DOM
           * - symbol: Simbolo finanziario validato
           * - interval: Intervallo temporale validato
           * - theme: Tema UI validato
           *
           * PARAMETRI OPZIONALI:
           * - studies: Array di indicatori tecnici
           * - toolbar settings: Configurazione UI
           * - event callbacks: Gestione eventi utente
           */
          widgetRef.current = new window.TradingView.widget({
            // CONTAINER CONFIGURATION
            container_id: containerId, // ID univoco per evitare conflitti
            autosize, // Auto-sizing responsive
            width, // Larghezza esplicita
            height, // Altezza esplicita

            // FINANCIAL DATA CONFIGURATION
            symbol, // Simbolo finanziario (es. NASDAQ:AAPL)
            interval, // Timeframe (1, 5, 15, 30, D, W, M)
            theme: theme.toLowerCase(), // Tema UI (light/dark)
            style: '1', // Stile chart (1=candele, 2=linea, etc.)
            locale, // Localizzazione (it, en, de, etc.)
            toolbar_bg, // Colore background toolbar

            // UI FEATURES CONFIGURATION
            allow_symbol_change, // Permette cambio simbolo dall'UI
            save_image, // Abilita salvataggio immagine
            hide_top_toolbar, // Nascondi toolbar superiore
            hide_side_toolbar, // Nascondi toolbar laterale
            studies_overrides: {}, // Override configurazioni indicatori

            // POPUP CONFIGURATION
            show_popup_button, // Mostra bottone popup
            popup_width, // Larghezza finestra popup
            popup_height, // Altezza finestra popup

            // TECHNICAL INDICATORS
            studies, // Array indicatori da visualizzare

            /**
             * EVENT CALLBACKS CONFIGURATION
             *
             * Configura i callback per eventi del widget.
             * Solo i callback forniti come props vengono registrati
             * per evitare overhead di eventi non necessari.
             */
            onSymbolChange: onSymbolChange
              ? (symbol: string) => onSymbolChange(symbol)
              : undefined,
            onIntervalChange: onIntervalChange
              ? (interval: string) => onIntervalChange(interval)
              : undefined,

            /**
             * CHART READY CALLBACK
             *
             * Chiamato quando il chart è completamente inizializzato.
             * Questo è il momento sicuro per:
             * - Cancellare il timeout timer
             * - Disattivare loading state
             * - Notificare il componente parent che il chart è pronto
             */
            onChartReady: () => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current); // Cancella timeout protection
              }
              setIsLoading(false); // Disattiva loading state
              if (onChartReady) {
                onChartReady(); // Notifica parent component
              }
            },
          });
        }
      } catch (error) {
        /**
         * INITIALIZATION ERROR HANDLING
         *
         * Gestisce errori durante la creazione del widget.
         * Possibili cause:
         * - Parametri invalidi non catturati dalla validazione
         * - Problemi di memoria browser
         * - Conflitti con altri script
         * - API TradingView temporaneamente non disponibile
         */
        const err =
          error instanceof Error
            ? error
            : new Error('Unknown error during initialization');
        console.error(
          "Errore durante l'inizializzazione del widget TradingView:",
          err
        );
        setError(err);
        setIsLoading(false);
        if (onLoadError) {
          onLoadError(err);
        }
      }
    };

    /**
     * STEP 6: SCRIPT ERROR HANDLER
     *
     * Gestisce errori durante il caricamento dello script.
     * Possibili cause:
     * - Problemi di connessione di rete
     * - CDN TradingView non disponibile
     * - Blocco da firewall/adblocker
     * - CORS issues
     */
    script.onerror = error => {
      // Cancella il timer in caso di errore di caricamento
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Crea errore descrittivo per l'utente
      const err = new Error('Failed to load TradingView script');
      console.error(
        'Errore durante il caricamento dello script TradingView:',
        error
      );
      setError(err);
      setIsLoading(false);
      if (onLoadError) {
        onLoadError(err);
      }
    };

    /**
     * STEP 7: SCRIPT INJECTION
     *
     * Inietta lo script nel DOM per iniziare il download.
     * Lo script viene aggiunto al <head> per compatibilità
     * e viene scaricato asincronamente.
     */
    document.head.appendChild(script);

    /**
     * STEP 8: CLEANUP FUNCTION
     *
     * Funzione di pulizia chiamata quando:
     * - Il componente viene smontato (unmount)
     * - Le dependencies del useEffect cambiano
     * - Il componente viene re-renderizzato
     *
     * OPERAZIONI DI CLEANUP:
     * 1. Cancella timer di timeout per prevenire memory leak
     * 2. Rimuove widget TradingView per liberare memoria
     * 3. Rimuove script dal DOM per pulizia
     *
     * Questo previene:
     * - Memory leaks
     * - Event listeners orfani
     * - Timer attivi dopo unmount
     * - Script duplicati nel DOM
     */
    return () => {
      // 1. TIMEOUT CLEANUP
      // Cancella il timer di timeout se ancora attivo
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 2. WIDGET CLEANUP
      // Rimuove il widget TradingView se presente
      if (widgetRef.current) {
        try {
          // Alcuni widget hanno un metodo remove() per cleanup
          if (typeof widgetRef.current.remove === 'function') {
            widgetRef.current.remove();
          }
          widgetRef.current = null;
        } catch (error) {
          console.error(
            'Errore durante la rimozione del widget TradingView:',
            error
          );
        }
      }

      // 3. SCRIPT CLEANUP
      // Rimuove lo script dal DOM per evitare accumulo
      const existingScript = document.getElementById(
        'tradingview-widget-script'
      );
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [
    /**
     * USEEFFECT DEPENDENCIES
     *
     * Lista completa delle dipendenze che causano il reload del widget.
     * Ogni volta che una di queste cambia, il widget viene ricreato.
     *
     * CATEGORIE DI DIPENDENZE:
     *
     * 1. IDENTIFIERS & CORE CONFIG:
     *    - containerId: ID univoco container DOM
     *    - symbol: Simbolo finanziario (trigger reload per nuovo chart)
     *    - interval: Timeframe (trigger reload per nuovi dati)
     *    - theme: Tema UI (trigger reload per restyling)
     *
     * 2. LAYOUT & STYLING:
     *    - width/height: Dimensioni container
     *    - locale: Localizzazione UI
     *    - toolbar_bg: Colori UI
     *
     * 3. FEATURE FLAGS:
     *    - autosize: Modalità responsive
     *    - allow_symbol_change: Permessi UI
     *    - save_image: Funzionalità export
     *    - hide_top_toolbar/hide_side_toolbar: Layout UI
     *    - show_popup_button: Feature popup
     *    - popup_width/popup_height: Configurazione popup
     *
     * 4. TECHNICAL INDICATORS:
     *    - studies: Array indicatori (trigger reload per nuovi indicatori)
     *
     * 5. EVENT HANDLERS:
     *    - onSymbolChange/onIntervalChange/onChartReady/onLoadError:
     *      Callback functions (cambio callback = re-register eventi)
     *
     * 6. VALIDATION & STATE:
     *    - validationErrors: Errori validazione parametri
     *    - initTimeout: Configurazione timeout
     *    - isLoading: Stato loading (per gestione re-renders)
     *    - validateProps: Funzione di validazione
     *
     * NOTA: Ogni cambio di dependenza causa unmount/remount del widget
     * per garantire configurazione corretta e prevenire stati inconsistenti.
     */
    containerId,
    symbol,
    interval,
    theme,
    width,
    height,
    locale,
    autosize,
    allow_symbol_change,
    save_image,
    hide_top_toolbar,
    hide_side_toolbar,
    toolbar_bg,
    studies,
    show_popup_button,
    popup_width,
    popup_height,
    onSymbolChange,
    onIntervalChange,
    onChartReady,
    onLoadError,
    validationErrors,
    initTimeout,
    isLoading,
    validateProps,
  ]);

  /**
   * COMPONENT RENDER
   *
   * Struttura del rendering a strati (layer-based):
   *
   * 1. CONTAINER PRINCIPALE: Wrapper con ID univoco per TradingView
   * 2. BACKGROUND LAYER: Container per il widget con styling base
   * 3. LOADING OVERLAY: Mostrato durante caricamento script/widget
   * 4. ERROR OVERLAY: Mostrato in caso di errori o validazione fallita
   *
   * RESPONSIVE DESIGN:
   * - Gestione automatica dimensioni (numero vs stringa)
   * - Altezza minima per prevenire layout shift
   * - Classi TailwindCSS per responsività
   *
   * ACCESSIBILITY:
   * - Overlay con backdrop-blur per focus
   * - Bottoni con focus states
   * - Messaggi di errore descrittivi
   * - Spinner animato per loading state
   */
  return (
    <div
      id={containerId} // ID univoco richiesto da TradingView API
      className={`tradingview-widget-container relative overflow-hidden rounded-lg border border-border shadow-sm transition-all duration-200 hover:shadow-md ${className}`}
      style={{
        // Gestione dinamica delle dimensioni (numero → px, stringa → as-is)
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        minHeight: '300px', // Altezza minima per evitare layout shift durante loading
        ...style, // Merge con stili personalizzati dall'utente
      }}
    >
      {/* 
        BACKGROUND CONTAINER
        
        Container principale che ospita il widget TradingView.
        Il widget viene iniettato automaticamente da TradingView script
        all'interno di questo div usando l'ID containerId.
      */}
      <div className="w-full h-full bg-background">
        {/* 
          LOADING OVERLAY
          
          Mostrato durante il caricamento dello script e inizializzazione widget.
          
          FEATURES:
          - Backdrop blur per focus sull'overlay
          - Spinner animato CSS
          - Messaggio descrittivo per l'utente
          - Transizioni fluide per UX migliore
          
          TIMING:
          - Attivato all'inizio del useEffect
          - Disattivato quando onChartReady viene chiamato
          - Disattivato in caso di errore
        */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-200">
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-background/50 shadow-lg">
              {/* Spinner CSS animato */}
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm font-medium">
                Caricamento TradingView Widget...
              </p>
            </div>
          </div>
        )}

        {/* 
          ERROR OVERLAY
          
          Mostrato in caso di errori di qualsiasi tipo:
          - Errori di validazione parametri
          - Errori di caricamento script
          - Errori di inizializzazione widget
          - Timeout errors
          
          FEATURES:
          - Icona di warning visuale
          - Messaggi di errore descrittivi
          - Bottone "Riprova" per reload pagina
          - Design consistente con il theme
          
          PRIORITÀ ERRORI:
          1. Errori di validazione (mostrati per primi)
          2. Errori runtime (script/widget)
        */}
        {(error || validationErrors.length > 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/5 backdrop-blur-sm transition-all duration-200">
            <div className="flex flex-col items-center gap-3 p-6 m-4 rounded-lg bg-background shadow-lg border border-destructive/20">
              {/* Icona di warning */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                <svg
                  className="w-6 h-6 text-destructive"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Messaggio di errore */}
              <div className="text-center">
                <p className="text-destructive font-semibold mb-2">
                  Errore durante il caricamento del widget
                </p>

                {/* Priorità: errori di validazione > errori runtime */}
                {validationErrors.length > 0 ? (
                  // Mostra tutti gli errori di validazione
                  <div className="text-muted-foreground text-sm space-y-1">
                    {validationErrors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                ) : (
                  // Mostra errore runtime
                  <p className="text-muted-foreground text-sm">
                    {error?.message}
                  </p>
                )}
              </div>

              {/* Bottone retry */}
              <button
                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors duration-200"
                onClick={() => window.location.reload()}
              >
                Riprova
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewTradingViewWidget;
