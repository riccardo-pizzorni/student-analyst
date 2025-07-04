# TradingViewWidget – Documentazione Completa

## Descrizione

Componente React per integrare in modo sicuro e robusto il widget TradingView in applicazioni React/TypeScript. Supporta validazione, gestione errori, cleanup, personalizzazione UI e callback avanzati.

---

## Interfaccia delle Props (estratta da JSDoc)

```typescript
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

// ... (continua con tutte le altre sezioni e props come da file .tsx)
```

---

## Tabella delle Props Principali

| Prop                | Tipo               | Default       | Descrizione breve                         |
| ------------------- | ------------------ | ------------- | ----------------------------------------- |
| symbol              | string             | 'NASDAQ:AAPL' | Simbolo finanziario (es. 'MIL:ENEL')      |
| interval            | string             | 'D'           | Intervallo temporale (es. 'D', '15', 'W') |
| theme               | 'light' \| 'dark'  | 'dark'        | Tema visivo                               |
| locale              | string             | 'it'          | Lingua UI                                 |
| width               | string \| number   | '100%'        | Larghezza container                       |
| height              | string \| number   | 500           | Altezza container                         |
| autosize            | boolean            | true          | Ridimensionamento automatico              |
| studies             | string[]           | []            | Indicatori tecnici da mostrare            |
| hide_top_toolbar    | boolean            | false         | Nasconde la toolbar superiore             |
| hide_side_toolbar   | boolean            | false         | Nasconde la toolbar laterale              |
| allow_symbol_change | boolean            | true          | Permette cambio simbolo da UI             |
| save_image          | boolean            | true          | Abilita salvataggio grafico come immagine |
| show_popup_button   | boolean            | false         | Mostra bottone popup                      |
| popup_width         | string \| number   | '1000'        | Larghezza popup                           |
| popup_height        | string \| number   | '650'         | Altezza popup                             |
| toolbar_bg          | string             | '#131722'     | Colore sfondo toolbar                     |
| className           | string             | ''            | Classi CSS custom                         |
| style               | CSSProperties      | {{}}          | Stili inline custom                       |
| onSymbolChange      | (symbol) => void   |               | Callback cambio simbolo                   |
| onIntervalChange    | (interval) => void |               | Callback cambio intervallo                |
| onChartReady        | () => void         |               | Callback grafico pronto                   |
| onLoadError         | (error) => void    |               | Callback errore caricamento               |
| initTimeout         | number             | 30000         | Timeout inizializzazione (ms)             |
| debug               | boolean            | false         | Abilita overlay debug                     |

---

## Strategie di Gestione Errori

### 1. **Validation Errors (Pre-caricamento)**

- Validazione parametri (symbol, interval, theme, dimensioni)
- Errori mostrati subito senza caricare lo script

### 2. **Network Errors (Durante caricamento)**

- Gestione script.onerror (rete, CDN, adblock)
- Messaggio + bottone retry

### 3. **Initialization Errors (Post-caricamento)**

- try/catch durante creazione widget
- Errori di configurazione, memoria, API TradingView

### 4. **Timeout Errors (Prestazioni)**

- Timer di sicurezza (initTimeout)
- Trigger automatico onLoadError

**Recovery:**

- Overlay fallback UI, retry manuale, logging dettagliato

---

## Cleanup & Memory Management

- Cancellazione timer su successo/unmount
- Rimozione istanza widget TradingView su unmount
- Rimozione script DOM su unmount
- Cleanup event listeners
- Tutte le risorse sono tracciate via useRef

---

## Dettaglio Props e Comportamento

### 1. **CORE CONFIGURATION**

- **symbol**: Formato 'EXCHANGE:TICKER' (es. 'NASDAQ:AAPL', 'MIL:ENEL')
- **interval**: '1', '5', '15', '30', '60', 'D', 'W', 'M'
- **locale**: 'it', 'en', 'de', ...

### 2. **LAYOUT & STYLING**

- **theme**: 'light' | 'dark'
- **width/height**: pixel o percentuale
- **autosize**: true/false
- **toolbar_bg**: colore CSS

### 3. **USER INTERFACE**

- **allow_symbol_change**: true/false
- **save_image**: true/false
- **hide_top_toolbar**: true/false
- **hide_side_toolbar**: true/false
- **show_popup_button**: true/false
- **popup_width/popup_height**: dimensioni popup

### 4. **TECHNICAL ANALYSIS**

- **studies**: Array di indicatori ('RSI', 'MACD', ...)

### 5. **REACT INTEGRATION**

- **className**: classi CSS custom
- **style**: stili inline

### 6. **EVENT HANDLING**

- **onSymbolChange**: callback cambio simbolo
- **onIntervalChange**: callback cambio intervallo
- **onChartReady**: callback grafico pronto
- **onLoadError**: callback errore

### 7. **PERFORMANCE & RELIABILITY**

- **initTimeout**: timeout ms
- **debug**: overlay debug

---

## Esempio di Utilizzo

```tsx
<NewTradingViewWidget
  symbol="MIL:ENEL"
  interval="D"
  theme="light"
  width={800}
  height={500}
  autosize={false}
  studies={['RSI', 'MACD']}
  hide_top_toolbar={true}
  hide_side_toolbar={false}
  allow_symbol_change={false}
  save_image={true}
  show_popup_button={true}
  popup_width={1200}
  popup_height={800}
  toolbar_bg="#1f2937"
  locale="it"
  onSymbolChange={symbol => console.log(symbol)}
  onIntervalChange={interval => console.log(interval)}
  onChartReady={() => console.log('Chart ready!')}
  onLoadError={err => alert(err.message)}
  debug={true}
/>
```

---

## Note di Performance e Best Practice

- Usa autosize=true per layout responsive
- Limita il numero di studies a 3-5 per performance
- Imposta un timeout adeguato per connessioni lente
- Usa callback per sincronizzare altri componenti
- Overlay debug utile solo in sviluppo

---

## Troubleshooting

- **Loop mount/unmount**: assicurati che la prop key sia stabile e le props non cambino reference a ogni render
- **Errore validazione**: controlla formato symbol e interval
- **Timeout**: aumenta initTimeout su reti lente
- **Script non caricato**: verifica adblocker/firewall

---

## Changelog

- v1.0: Prima versione stabile, gestione errori avanzata, overlay debug, cleanup rigoroso

---

Per dettagli tecnici sulle props, vedere direttamente l'interfaccia `NewTradingViewWidgetProps` nel file `.tsx`.

/\*\*

- TRADINGVIEW WIDGET INTEGRATION - SCRIPT LOADING SYSTEM
-
- Questo componente implementa un'integrazione sicura con il widget TradingView
- utilizzando il caricamento dinamico dello script esterno. Il sistema è progettato
- per gestire in modo robusto:
-
- 1.  CARICAMENTO ASINCRONO: Lo script viene caricato dinamicamente solo quando necessario
- 2.  GESTIONE ERRORI: Timeout, errori di rete e fallback graceful
- 3.  PREVENZIONE DUPLICATI: Evita il caricamento multiplo dello stesso script
- 4.  CLEANUP: Pulizia delle risorse per prevenire memory leak
- 5.  VALIDAZIONE: Controllo dei parametri prima dell'inizializzazione
-
- ============================================================================
- ERROR HANDLING STRATEGY - STRATEGIA DI GESTIONE ERRORI
- ============================================================================
-
- Il sistema implementa una strategia di gestione errori su più livelli:
-
- 1.  VALIDATION ERRORS (Pre-caricamento):
- - Validazione parametri prima dell'inizializzazione
- - Controllo formato simboli, intervalli, dimensioni
- - Prevenzione errori runtime con validazione anticipata
- - Errori mostrati immediatamente senza caricamento script
-
- 2.  NETWORK ERRORS (Durante caricamento):
- - script.onerror: Gestisce fallimenti caricamento CDN
- - Possibili cause: problemi rete, CDN down, firewall/adblocker
- - Fallback: Messaggio errore + bottone retry
- - Recovery: Reload completo pagina per reset stato
-
- 3.  INITIALIZATION ERRORS (Post-caricamento):
- - try/catch durante creazione widget TradingView
- - Gestisce parametri invalidi non catturati da validazione
- - Problemi memory browser, conflitti script
- - API TradingView temporaneamente non disponibile
-
- 4.  TIMEOUT ERRORS (Prestazioni):
- - Timer di sicurezza per prevenire blocchi infiniti
- - Configurabile tramite initTimeout prop
- - Trigger automatico onLoadError callback
- - Previene esperienze utente degradate
-
- ERROR RECOVERY PATTERNS:
- - Automatic fallback UI con messaggio descrittivo
- - Manual retry tramite bottone "Riprova"
- - Callback onLoadError per gestione custom parent
- - Logging dettagliato console per debugging
-
- ============================================================================
- CLEANUP & MEMORY MANAGEMENT - GESTIONE MEMORIA E PULIZIA
- ============================================================================
-
- Il sistema implementa un cleanup rigoroso per prevenire memory leak:
-
- 1.  TIMEOUT CLEANUP:
- - Cancellazione timer quando widget si carica con successo
- - Cancellazione timer durante unmount componente
- - Prevenzione callback orfani dopo unmount
- - clearTimeout() in tutti i path di uscita
-
- 2.  WIDGET CLEANUP:
- - Rimozione istanza widget TradingView durante unmount
- - Chiamata metodo remove() se disponibile
- - Nulling reference per garbage collection
- - Gestione errori durante cleanup stesso
-
- 3.  SCRIPT CLEANUP:
- - Rimozione script DOM durante unmount
- - Prevenzione accumulo script duplicati
- - getElementById per lookup sicuro
- - removeChild() solo se elemento esiste
-
- 4.  EVENT LISTENERS CLEANUP:
- - Event handlers script (onload/onerror) sono automaticamente rimossi
- - TradingView widget cleanup gestisce propri event listeners
- - useEffect cleanup function garantisce pulizia completa
-
- MEMORY LEAK PREVENTION:
- - Tutte le risorse sono tracciabili tramite useRef
- - Cleanup function chiamata su unmount E dependency change
- - Defensive programming con try/catch durante cleanup
- - Null checking prima di ogni operazione cleanup
-
- PERFORMANCE CONSIDERATIONS:
- - Script DOM lookup una sola volta durante cleanup
- - Operazioni asincrone cancellate preventivamente
- - Resource disposal ordinato (timer → widget → script)
- - Minimal impact su performance durante cleanup
    \*/

/\*\*

- ============================================================================
- COMPONENT PROPS INTERFACE - DETAILED PARAMETER DOCUMENTATION
- ============================================================================
-
- Questa interfaccia definisce tutti i parametri configurabili del widget TradingView.
- Ogni parametro ha un impatto specifico sul comportamento e l'aspetto del widget.
-
- CATEGORIE DI PARAMETRI:
- 1.  CORE CONFIGURATION: Parametri essenziali per il funzionamento base
- 2.  LAYOUT & STYLING: Controllo aspetto visivo e dimensioni
- 3.  USER INTERFACE: Controllo elementi UI e interattività
- 4.  TECHNICAL ANALYSIS: Configurazione indicatori e studi
- 5.  REACT INTEGRATION: Integrazione con l'ecosistema React
- 6.  EVENT HANDLING: Gestione eventi e callback
- 7.  PERFORMANCE & RELIABILITY: Controllo prestazioni e affidabilità
      \*/
      interface NewTradingViewWidgetProps {
      // ========================================================================
      // 1. CORE CONFIGURATION - PARAMETRI ESSENZIALI
      // ========================================================================

/\*\*

- SYMBOL - Simbolo Finanziario
-
- Formato: "EXCHANGE:TICKER" (es. "NASDAQ:AAPL", "BINANCE:BTCUSDT")
-
- EXCHANGES SUPPORTATI:
- - NASDAQ: Mercato azionario statunitense (es. NASDAQ:AAPL, NASDAQ:MSFT)
- - NYSE: New York Stock Exchange (es. NYSE:IBM, NYSE:GE)
- - MIL: Borsa Italiana (es. MIL:ENEL, MIL:ENI)
- - BINANCE: Crypto exchange (es. BINANCE:BTCUSDT, BINANCE:ETHBTC)
- - FX: Forex pairs (es. FX:EURUSD, FX:GBPJPY)
-
- VALIDAZIONE:
- - Deve contenere esattamente un ":" separatore
- - Exchange deve essere nella lista supportata
- - Ticker non può essere vuoto
- - Trigger reload del widget se cambiato
-
- DEFAULT: "NASDAQ:AAPL"
- ESEMPIO: "MIL:ENEL" per azioni italiane
  \*/
  symbol?: string;

/\*\*

- INTERVAL - Intervallo Temporale
-
- Determina il timeframe di ogni candela/barra nel grafico.
-
- VALORI SUPPORTATI:
- - "1", "3", "5", "15", "30": Minuti (intraday)
- - "60", "120", "240": Ore (1h, 2h, 4h)
- - "D": Giornaliero (1 giorno per candela)
- - "W": Settimanale (1 settimana per candela)
- - "M": Mensile (1 mese per candela)
-
- IMPATTO SUL WIDGET:
- - Cambia la granularità dei dati visualizzati
- - Influenza il caricamento dei dati storici
- - Trigger reload del widget se cambiato
-
- DEFAULT: "D" (giornaliero)
- ESEMPIO: "15" per trading intraday, "W" per analisi long-term
  \*/

\*\*

- LOCALE - Localizzazione
-
- Controlla la lingua dell'interfaccia utente del widget.
-
- FORMATO: "language" o "language-COUNTRY" (ISO 639-1 + ISO 3166-1)
-
- LINGUE COMUNI:
- - "it": Italiano
- - "en": Inglese
- - "de": Tedesco
- - "fr": Francese
- - "es": Spagnolo
- - "ru": Russo
- - "zh": Cinese
-
- ELEMENTI LOCALIZZATI:
- - Etichette toolbar e menu
- - Messaggi di errore
- - Formati data e ora
- - Separatori numerici
-
- DEFAULT: "it" (italiano)
- ESEMPIO: "en-US" per inglese americano
  \*/

// ========================================================================
// 2. LAYOUT & STYLING - CONTROLLO ASPETTO VISIVO
// ========================================================================

/\*\*

- THEME - Tema Visivo
-
- Controlla lo schema colori dell'intero widget.
-
- VALORI:
- - "light": Tema chiaro (sfondo bianco/grigio chiaro)
- - "dark": Tema scuro (sfondo nero/grigio scuro)
-
- ELEMENTI TEMATIZZATI:
- - Sfondo principale del grafico
- - Colore delle candele/barre
- - Toolbar e menu
- - Testo e etichette
- - Linee della griglia
-
- INTEGRAZIONE:
- - Dovrebbe matchare il tema dell'applicazione host
- - Trigger reload del widget se cambiato
-
- DEFAULT: "dark"
- CONSIGLIO: Usa "dark" per trading apps, "light" per dashboards business
  \*/

/\*\*

- WIDTH - Larghezza Container
-
- Controlla la larghezza del widget container.
-
- TIPI ACCETTATI:
- - number: Pixel esatti (es. 800 → "800px")
- - string: CSS value (es. "100%", "50vw", "800px")
-
- VALORI COMUNI:
- - "100%": Occupa tutta la larghezza del parent
- - "50%": Metà della larghezza del parent
- - 800: 800 pixel esatti
- - "calc(100vw - 200px)": Larghezza viewport meno 200px
-
- RESPONSIVE DESIGN:
- - Usa "100%" per layout responsive
- - Usa pixel per dimensioni fisse
- - Combinato con autosize per adattamento automatico
-
- DEFAULT: "100%"
  \*/

/\*\*

- HEIGHT - Altezza Container
-
- Controlla l'altezza del widget container.
-
- TIPI ACCETTATI:
- - number: Pixel esatti (es. 500 → "500px")
- - string: CSS value (es. "100%", "60vh", "500px")
-
- CONSIDERAZIONI:
- - Altezza minima: 300px (hard-coded per evitare layout shift)
- - TradingView raccomanda almeno 400px per UX ottimale
- - Con autosize=true, può adattarsi dinamicamente
-
- VALORI COMUNI:
- - 500: 500px, buono per dashboard
- - "60vh": 60% altezza viewport
- - "100%": Occupa tutto lo spazio del parent
-
- DEFAULT: 500 (pixel)
  \*/


    /**

- AUTOSIZE - Ridimensionamento Automatico
-
- Abilita il ridimensionamento automatico del widget.
-
- COMPORTAMENTO:
- - true: Il widget si adatta dinamicamente al container
- - false: Usa dimensioni esplicite width/height
-
- QUANDO USARE:
- - true: Layout responsive, container dimensioni variabili
- - false: Dimensioni fisse, controllo preciso layout
-
- INTERAZIONE CON WIDTH/HEIGHT:
- - Se autosize=true, width/height servono come dimensioni iniziali
- - Il widget può poi adattarsi alle modifiche del container
-
- DEFAULT: true
- RACCOMANDAZIONE: Usa true per la maggior parte dei casi
  \*/

\*\*

- TOOLBAR_BG - Colore Sfondo Toolbar
-
- Personalizza il colore di sfondo della toolbar superiore.
-
- FORMATO: Qualsiasi valore CSS color valido
- - Hex: "#131722", "#FFFFFF"
- - RGB: "rgb(19, 23, 34)"
- - HSL: "hsl(225, 30%, 10%)"
- - Named: "black", "white", "transparent"
-
- INTEGRAZIONE DESIGN:
- - Dovrebbe matchare il design system dell'app
- - Considera contrasto per accessibilità
- - Testa con entrambi i temi (light/dark)
-
- DEFAULT: "#131722" (grigio scuro)
- ESEMPIO: "#1f2937" per tema Tailwind gray-800
  \*/

/\*\*

- ALLOW_SYMBOL_CHANGE - Cambio Simbolo dall'Interfaccia
-
- Controlla se l'utente può cambiare il simbolo finanziario dall'UI del widget.
-
- COMPORTAMENTO:
- - true: Mostra field di ricerca simbolo, utente può cambiare
- - false: Simbolo fisso, non modificabile dall'utente
-
- EVENTI:
- - Se abilitato, trigger onSymbolChange callback
- - Il componente parent riceve notifica del cambio
-
- CASI D'USO:
- - true: Dashboard trading, esploratore mercati
- - false: Widget embedded con simbolo specifico
-
- DEFAULT: true
- CONSIDERAZIONE: Disabilita se il simbolo deve rimanere fisso per business logic
  \*/

\*\*

- SAVE_IMAGE - Funzionalità Salvataggio Immagine
-
- Abilita il bottone per salvare il grafico come immagine.
-
- FORMATI SUPPORTATI:
- - PNG: Alta qualità, supporto trasparenza
- - SVG: Grafica vettoriale, scalabile
-
- FUNZIONALITÀ:
- - Cattura snapshot del grafico corrente
- - Include tutti gli indicatori e annotazioni visibili
- - Mantiene risoluzione originale
-
- PRIVACY:
- - Nessun dato inviato a server esterni
- - Elaborazione locale nel browser
-
- DEFAULT: true
- USO: Utile per report, condivisione analisi
  \*/

/\*\*

- HIDE_TOP_TOOLBAR - Nascondere Toolbar Superiore
-
- Controlla la visibilità della toolbar superiore del widget.
-
- ELEMENTI TOOLBAR SUPERIORE:
- - Selector simbolo (se allow_symbol_change=true)
- - Selector intervallo temporale
- - Bottoni zoom e pan
- - Menu indicatori
- - Bottone salva immagine (se save_image=true)
-
- CASI D'USO:
- - false: Esperienza completa, controllo utente
- - true: Widget minimale, controllo programmatico
-
- IMPATTO UX:
- - Nascondere toolbar limita l'interattività
- - Più spazio per il grafico stesso
- - Controlli devono essere implementati esternamente
-
- DEFAULT: false (toolbar visibile)
  \*/

/\*\*

- HIDE_SIDE_TOOLBAR - Nascondere Toolbar Laterale
-
- Controlla la visibilità della toolbar laterale destra.
-
- ELEMENTI TOOLBAR LATERALE:
- - Strumenti di disegno (linee di trend, fibonacci, etc.)
- - Template e layout salvati
- - Controlli avanzati chart
-
- CONSIDERAZIONI:
- - Toolbar laterale è meno critica della superiore
- - Nasconderla recupera spazio horizontale
- - Funzionalità base rimangono disponibili
-
- CASI D'USO:
- - true: Widget embedded, spazio limitato
- - false: Applicazioni trading avanzate
-
- DEFAULT: false (toolbar visibile)
  \*/

/\*\*

- SHOW_POPUP_BUTTON - Bottone Apertura Popup
-
- Mostra bottone per aprire il widget in finestra popup.
-
- FUNZIONALITÀ:
- - Apre widget in nuova finestra browser
- - Dimensioni configurabili (popup_width/popup_height)
- - Mantiene stato e configurazione corrente
- - Utile per analisi dettagliata
-
- INTEGRAZIONE:
- - Popup è gestito direttamente da TradingView
- - Nessun codice aggiuntivo richiesto
- - Funziona con popup blockers moderni
-
- CASI D'USO:
- - Dashboard con widget piccoli
- - Quick preview che può espandersi
-
- DEFAULT: false
  \*/

/\*\*

- POPUP_WIDTH - Larghezza Finestra Popup
-
- Larghezza della finestra popup (se show_popup_button=true).
-
- TIPI:
- - number: Pixel (es. 1000)
- - string: Valore CSS (es. "1200px")
-
- CONSIDERAZIONI:
- - Risoluzione schermo utente
- - Spazio per toolbar TradingView
- - Leggibilità grafico
-
- VALORI RACCOMANDATI:
- - Desktop: 1200-1600px
- - Laptop: 1000-1200px
- - Tablet: 800-1000px
-
- DEFAULT: "1000"
  \*/

\*\*

- POPUP_HEIGHT - Altezza Finestra Popup
-
- Altezza della finestra popup (se show_popup_button=true).
-
- CONSIDERAZIONI AGGIUNTIVE:
- - Barra del titolo browser
- - Toolbar del browser
- - Spazio sufficiente per chart leggibile
-
- VALORI RACCOMANDATI:
- - Standard: 650-800px
- - Full analysis: 900-1200px
- - Minimal: 500-650px
-
- DEFAULT: "650"
  \*/

// ========================================================================
// 4. TECHNICAL ANALYSIS - CONFIGURAZIONE INDICATORI E STUDI
// ========================================================================

/\*\*

- STUDIES - Indicatori Tecnici
-
- Array di indicatori tecnici da visualizzare automaticamente.
-
- INDICATORI SUPPORTATI:
- - "RSI": Relative Strength Index (momentum)
- - "MACD": Moving Average Convergence Divergence
- - "SMA": Simple Moving Average
- - "EMA": Exponential Moving Average
- - "BB": Bollinger Bands
- - "Volume": Indicatore volume
- - "Stoch": Stochastic Oscillator
- - "Williams %R": Williams Percent Range
-
- CONFIGURAZIONE:
- - Ogni indicatore usa parametri default di TradingView
- - Per customizzazione avanzata, usa studies_overrides
- - Indicatori sono aggiunti automaticamente al caricamento
-
- PERFORMANCE:
- - Troppi indicatori possono rallentare il rendering
- - Raccomandati max 3-5 indicatori simultanei
-
- DEFAULT: [] (nessun indicatore)
- ESEMPIO: ["RSI", "MACD"] per analisi momentum
  \*/

// ========================================================================
// 5. REACT INTEGRATION - INTEGRAZIONE ECOSISTEMA REACT
// ========================================================================

/\*\*

- CLASSNAME - Classi CSS Personalizzate
-
- Classi CSS aggiuntive da applicare al container principale.
-
- UTILIZZO:
- - Styling aggiuntivo senza sovrascrivere stili base
- - Integrazione con framework CSS (Tailwind, Bootstrap, etc.)
- - Responsive design custom
-
- MERGE BEHAVIOR:
- - Classi sono aggiunte alle classi base del componente
- - Possono sovrascrivere stili specifici
- - Usare !important con cautela
-
- ESEMPI:
- - "shadow-lg border-2": Tailwind styling
- - "my-custom-chart": Classe CSS personalizzata
- - "responsive-chart mobile-hide": Classi multiple
-
- DEFAULT: ""
  \*/

/\*\*

- STYLE - Stili Inline Personalizzati
-
- Oggetto React.CSSProperties per stili inline diretti.
-
- PRIORITÀ:
- - Stili inline hanno priorità su classi CSS
- - Merged con stili base del componente
- - Sovrascrive width/height se specificati
-
- CASI D'USO:
- - Styling dinamico basato su state
- - Overrides specifici di stili base
- - Integrazioni con librerie di styling
-
- ESEMPIO:
- ```tsx

  ```
- style={{
- border: '2px solid red',
- borderRadius: '8px',
- boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
- }}
- ```

  ```
-
- DEFAULT: {}
  \*/

// ========================================================================
// 6. EVENT HANDLING - GESTIONE EVENTI E CALLBACK
// ========================================================================

/\*\*

- ONSYMBOLCHANGE - Callback Cambio Simbolo
-
- Funzione chiamata quando l'utente cambia il simbolo dal widget.
-
- PARAMETRI CALLBACK:
- - symbol: string - Nuovo simbolo nel formato "EXCHANGE:TICKER"
-
- TRIGGER:
- - Solo se allow_symbol_change=true
- - Chiamata dopo validazione del simbolo
- - Prima dell'aggiornamento visuale del widget
-
- CASI D'USO:
- - Sincronizzazione con altri componenti
- - Logging per analytics
- - Validazione business logic custom
- - Update URL/routing
-
- ESEMPIO:
- ```tsx

  ```
- onSymbolChange={(newSymbol) => {
- console.log('Simbolo cambiato a:', newSymbol);
- setCurrentSymbol(newSymbol);
- updateURL(newSymbol);
- }}
- ```
  */
  ```


    /**

- ONINTERVALCHANGE - Callback Cambio Intervallo
-
- Funzione chiamata quando l'utente cambia l'intervallo temporale.
-
- PARAMETRI CALLBACK:
- - interval: string - Nuovo intervallo (es. "D", "1", "15")
-
- COMPORTAMENTO:
- - Chiamata prima del reload dei dati
- - Permette interceptare/validare il cambio
- - Utile per sincronizzazione UI esterna
-
- INTEGRAZIONE:
- - Aggiorna componenti correlati (indicatori, news, etc.)
- - Salva preferenze utente
- - Trigger caricamento dati aggiuntivi
-
- ESEMPIO:
- ```tsx

  ```
- onIntervalChange={(newInterval) => {
- setChartInterval(newInterval);
- loadRelatedData(newInterval);
- trackUserPreference('interval', newInterval);
- }}
- ```
  */
  ```

/\*\*

- ONCHARTREADY - Callback Inizializzazione Completata
-
- Funzione chiamata quando il widget è completamente inizializzato.
-
- TIMING:
- - Dopo caricamento script TradingView
- - Dopo creazione istanza widget
- - Dopo caricamento dati iniziali
- - Prima che il widget sia visibile all'utente
-
- STATO GARANTITO:
- - Widget completamente funzionale
- - Tutti i dati iniziali caricati
- - UI responsiva agli input utente
- - Safe per interazioni programmatiche
-
- CASI D'USO:
- - Nascondere loading indicators
- - Abilitare controlli esterni
- - Inizializzare integrazioni aggiuntive
- - Tracking analytics (time to load)
-
- ESEMPIO:
- ```tsx

  ```
- onChartReady={() => {
- setIsLoading(false);
- enableExternalControls();
- trackEvent('chart_loaded');
- }}
- ```
  */
  ```


    /**

- ONLOADERROR - Callback Gestione Errori
-
- Funzione chiamata in caso di errori durante il caricamento.
-
- PARAMETRI CALLBACK:
- - error: Error - Oggetto errore con dettagli
-
- TIPI DI ERRORI:
- - Script loading failure (rete, CDN down)
- - Widget initialization error (configurazione invalida)
- - Timeout error (caricamento troppo lento)
- - Parameter validation error (props invalide)
-
- GESTIONE ERRORI:
- - Log per debugging/monitoring
- - Fallback UI o widget alternativi
- - Retry logic personalizzato
- - User notification
-
- ERROR OBJECT PROPERTIES:
- - message: Descrizione human-readable
- - name: Tipo di errore
- - stack: Stack trace (in development)
-
- ESEMPIO:
- ```tsx

  ```
- onLoadError={(error) => {
- console.error('TradingView error:', error);
- notifyUser('Errore caricamento grafico');
- trackError(error);
- setShowFallback(true);
- }}
- ```
  */
  ```

// ========================================================================
// 7. PERFORMANCE & RELIABILITY - CONTROLLO PRESTAZIONI E AFFIDABILITÀ
// ========================================================================

/\*\*

- INITTIMEOUT - Timeout Inizializzazione
-
- Tempo massimo in millisecondi per il caricamento del widget.
-
- FUNZIONAMENTO:
- - Timer inizia con il caricamento dello script
- - Cancellato quando onChartReady viene chiamato
- - Trigger onLoadError se scaduto
-
- CONSIDERAZIONI:
- - Connessioni lente richiedono timeout maggiori
- - Timeout troppo corti causano false positive
- - Timeout troppo lunghi peggiorano UX
-
- VALORI RACCOMANDATI:
- - Connessione veloce: 5000-8000ms
- - Connessione standard: 10000-15000ms
- - Connessione lenta: 15000-20000ms
- - Ambiente mobile: 15000-25000ms
-
- FALLBACK STRATEGY:
- - Implementa retry con timeout incrementale
- - Mostra messaggio utente dopo timeout
- - Considera fallback a grafico semplificato
-
- DEFAULT: 30000 (30 secondi)
- ESEMPIO: 15000 per ambienti mobile o reti lente
  \*/

// ========================================================================
// 8. DEBUG - CONTROLLO DEBUGGING E TESTING
// ========================================================================

/\*\*

- DEBUG - Abilita Debugging e Testing
-
- Controlla se il widget deve eseguire log dettagliati e test.
-
- COMPORTAMENTO:
- - true: Abilita log dettagliati e test
- - false: Disabilita log dettagliati e test
-
- ELEMENTI DEBUG:
- - Log dettagliati durante caricamento
- - Test di validazione parametri
- - Simulazione errori di caricamento
-
- DEFAULT: false
  \*/

\*\*

- GLOBAL WINDOW EXTENSION
-
- Estende l'interfaccia Window per includere l'oggetto TradingView
- che viene aggiunto dinamicamente dallo script esterno.
  \*/

\*\*

- COMPONENT STATE MANAGEMENT
-
- Gestisce tutti gli stati necessari per il ciclo di vita del widget:
- - ID univoco per evitare conflitti tra istanze multiple
- - Riferimenti per cleanup delle risorse
- - Stati di loading, errori e validazione
    \*/

/\*\*

- SCRIPT LOADING AND WIDGET INITIALIZATION
-
- Questo useEffect gestisce l'intero ciclo di vita del widget:
-
- 1.  VALIDAZIONE: Verifica che tutti i parametri siano validi
- 2.  SCRIPT LOADING: Carica dinamicamente lo script TradingView
- 3.  INIZIALIZZAZIONE: Crea l'istanza del widget con parametri validati
- 4.  ERROR HANDLING: Gestisce timeout, errori di rete e fallback
- 5.  CLEANUP: Pulisce le risorse quando il componente viene smontato
      \*/

\*\*

- COMPONENT RENDER
-
- Struttura del rendering a strati (layer-based):
-
- 1.  CONTAINER PRINCIPALE: Wrapper con ID univoco per TradingView
- 2.  BACKGROUND LAYER: Container per il widget con styling base
- 3.  LOADING OVERLAY: Mostrato durante caricamento script/widget
- 4.  ERROR OVERLAY: Mostrato in caso di errori o validazione fallita
-
- RESPONSIVE DESIGN:
- - Gestione automatica dimensioni (numero vs stringa)
- - Altezza minima per prevenire layout shift
- - Classi TailwindCSS per responsività
-
- ACCESSIBILITY:
- - Overlay con backdrop-blur per focus
- - Bottoni con focus states
- - Messaggi di errore descrittivi
- - Spinner animato per loading state
    \*/
