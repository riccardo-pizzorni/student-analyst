/**
 * STUDENT ANALYST - Error Codes Handler
 * =====================================
 *
 * Sistema intelligente di gestione errori per API finanziarie.
 * Converte errori tecnici in messaggi user-friendly, implementa
 * auto-recovery e retry intelligente.
 */

import {
  AlphaVantageError,
  AlphaVantageErrorType,
} from './alphaVantageService';

/**
 * Enum per i tipi di errore standardizzati del sistema
 */
export enum SystemErrorType {
  // API Errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  SYMBOL_NOT_FOUND = 'SYMBOL_NOT_FOUND',
  MARKET_CLOSED = 'MARKET_CLOSED',

  // Network Errors
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  DNS_FAILURE = 'DNS_FAILURE',

  // Service Errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SERVICE_OVERLOADED = 'SERVICE_OVERLOADED',

  // Data Errors
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',
  NO_DATA_AVAILABLE = 'NO_DATA_AVAILABLE',
  DATA_VALIDATION_FAILED = 'DATA_VALIDATION_FAILED',

  // Client Errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  MALFORMED_SYMBOL = 'MALFORMED_SYMBOL',
  UNSUPPORTED_TIMEFRAME = 'UNSUPPORTED_TIMEFRAME',

  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Severità dell'errore
 */
export enum ErrorSeverity {
  LOW = 'low', // Warning, non bloccante
  MEDIUM = 'medium', // Errore recuperabile
  HIGH = 'high', // Errore critico
  CRITICAL = 'critical', // Sistema compromesso
}

/**
 * Strategia di recovery per l'errore
 */
export enum RecoveryStrategy {
  RETRY_IMMEDIATE = 'retry_immediate',
  RETRY_WITH_BACKOFF = 'retry_with_backoff',
  RETRY_AFTER_DELAY = 'retry_after_delay',
  FALLBACK_TO_CACHE = 'fallback_to_cache',
  FALLBACK_TO_ALTERNATIVE = 'fallback_to_alternative',
  USER_ACTION_REQUIRED = 'user_action_required',
  NO_RECOVERY = 'no_recovery',
}

/**
 * Interfaccia per messaggio user-friendly
 */
export interface UserFriendlyMessage {
  title: string;
  message: string;
  suggestion?: string;
  technicalDetails?: string;
  helpUrl?: string;
  estimatedResolution?: string;
}

/**
 * Interfaccia per la configurazione di retry
 */
export interface RetryConfiguration {
  enabled: boolean;
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

/**
 * Interfaccia per informazioni di recovery
 */
export interface RecoveryInfo {
  strategy: RecoveryStrategy;
  retryConfig?: RetryConfiguration;
  fallbackOptions?: string[];
  requiredUserAction?: string;
  estimatedRecoveryTime?: number; // millisecondi
}

/**
 * Interfaccia per errore classificato
 */
export interface ClassifiedError {
  type: SystemErrorType;
  severity: ErrorSeverity;
  retryable: boolean;
  userMessage: UserFriendlyMessage;
  recovery: RecoveryInfo;
  originalError: Error;
  context: ErrorContext;
  timestamp: string;
  errorId: string;
}

/**
 * Contesto dell'errore
 */
export interface ErrorContext {
  operation: string;
  symbol?: string;
  timeframe?: string;
  apiService: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Database di simboli comuni per fuzzy matching
 */
const COMMON_SYMBOLS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'GOOG',
  'AMZN',
  'TSLA',
  'META',
  'NVDA',
  'AMD',
  'INTC',
  'JPM',
  'BAC',
  'WFC',
  'GS',
  'MS',
  'C',
  'V',
  'MA',
  'PYPL',
  'SQ',
  'SPY',
  'QQQ',
  'IWM',
  'DIA',
  'VTI',
  'VOO',
  'BND',
  'TLT',
  'GLD',
  'SLV',
  'BTC-USD',
  'ETH-USD',
  'ADA-USD',
  'DOT-USD',
  'SOL-USD',
];

/**
 * Classe principale per la gestione intelligente degli errori
 */
export class ErrorCodeHandler {
  private static instance: ErrorCodeHandler;
  private errorHistory: Map<string, ClassifiedError[]> = new Map();
  private recoveryAttempts: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): ErrorCodeHandler {
    if (!ErrorCodeHandler.instance) {
      ErrorCodeHandler.instance = new ErrorCodeHandler();
    }
    return ErrorCodeHandler.instance;
  }

  /**
   * Classifica e gestisce un errore
   */
  public classifyError(error: Error, context: ErrorContext): ClassifiedError {
    const errorId = this.generateErrorId();
    const classifiedError: ClassifiedError = {
      type: this.identifyErrorType(error),
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      userMessage: { title: '', message: '' },
      recovery: { strategy: RecoveryStrategy.NO_RECOVERY },
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      errorId,
    };

    // Completa la classificazione
    this.enhanceErrorClassification(classifiedError);

    // Salva nella cronologia
    this.saveToHistory(classifiedError);

    return classifiedError;
  }

  /**
   * Identifica il tipo di errore
   */
  private identifyErrorType(error: Error): SystemErrorType {
    if (error instanceof AlphaVantageError) {
      return this.mapAlphaVantageError(error.type);
    }

    const message = error.message.toLowerCase();

    // Rate limiting patterns
    if (
      message.includes('rate limit') ||
      message.includes('25 requests per day')
    ) {
      return SystemErrorType.DAILY_LIMIT_EXCEEDED;
    }
    if (
      message.includes('5 calls per minute') ||
      message.includes('frequency')
    ) {
      return SystemErrorType.RATE_LIMIT_EXCEEDED;
    }

    // Authentication patterns
    if (
      message.includes('api key') ||
      message.includes('unauthorized') ||
      message.includes('403') ||
      message.includes('401')
    ) {
      return SystemErrorType.INVALID_API_KEY;
    }

    // Symbol patterns
    if (
      message.includes('symbol') &&
      (message.includes('not found') || message.includes('invalid'))
    ) {
      return SystemErrorType.SYMBOL_NOT_FOUND;
    }

    // Network patterns
    if (message.includes('timeout') || message.includes('econnaborted')) {
      return SystemErrorType.CONNECTION_TIMEOUT;
    }
    if (
      message.includes('network') ||
      message.includes('enotfound') ||
      message.includes('dns')
    ) {
      return SystemErrorType.DNS_FAILURE;
    }
    if (
      message.includes('econnrefused') ||
      message.includes('connection refused')
    ) {
      return SystemErrorType.NETWORK_UNAVAILABLE;
    }

    // Service patterns
    if (message.includes('503') || message.includes('service unavailable')) {
      return SystemErrorType.SERVICE_UNAVAILABLE;
    }
    if (message.includes('502') || message.includes('bad gateway')) {
      return SystemErrorType.SERVICE_OVERLOADED;
    }

    // Data patterns
    if (message.includes('no data') || message.includes('empty response')) {
      return SystemErrorType.NO_DATA_AVAILABLE;
    }
    if (message.includes('parse') || message.includes('invalid format')) {
      return SystemErrorType.INVALID_DATA_FORMAT;
    }

    return SystemErrorType.UNKNOWN_ERROR;
  }

  /**
   * Mappa errori Alpha Vantage a tipi di sistema
   */
  private mapAlphaVantageError(
    alphaVantageType: AlphaVantageErrorType
  ): SystemErrorType {
    const alphaVantageToSystemErrorMap: Record<
      AlphaVantageErrorType,
      SystemErrorType
    > = {
      [AlphaVantageErrorType.API_LIMIT_EXCEEDED]:
        SystemErrorType.DAILY_LIMIT_EXCEEDED,
      [AlphaVantageErrorType.RATE_LIMIT]: SystemErrorType.RATE_LIMIT_EXCEEDED,
      [AlphaVantageErrorType.AUTHENTICATION_ERROR]:
        SystemErrorType.INVALID_API_KEY,
      [AlphaVantageErrorType.INVALID_SYMBOL]: SystemErrorType.SYMBOL_NOT_FOUND,
      [AlphaVantageErrorType.INVALID_FUNCTION]: SystemErrorType.INVALID_REQUEST,
      [AlphaVantageErrorType.NETWORK_ERROR]:
        SystemErrorType.NETWORK_UNAVAILABLE,
      [AlphaVantageErrorType.PARSING_ERROR]:
        SystemErrorType.INVALID_DATA_FORMAT,
      [AlphaVantageErrorType.NO_DATA_AVAILABLE]:
        SystemErrorType.NO_DATA_AVAILABLE,
      [AlphaVantageErrorType.MALFORMED_RESPONSE]:
        SystemErrorType.INVALID_DATA_FORMAT,
      [AlphaVantageErrorType.INVALID_TIMEFRAME]:
        SystemErrorType.UNSUPPORTED_TIMEFRAME,
      [AlphaVantageErrorType.INVALID_RESPONSE]:
        SystemErrorType.INVALID_DATA_FORMAT,
      [AlphaVantageErrorType.SERVER_ERROR]: SystemErrorType.SERVICE_UNAVAILABLE,
      [AlphaVantageErrorType.UNKNOWN]: SystemErrorType.UNKNOWN_ERROR,
      [AlphaVantageErrorType.MAX_RETRIES_REACHED]:
        SystemErrorType.SERVICE_UNAVAILABLE,
    };

    return (
      alphaVantageToSystemErrorMap[alphaVantageType] ||
      SystemErrorType.UNKNOWN_ERROR
    );
  }

  /**
   * Completa la classificazione dell'errore
   */
  private enhanceErrorClassification(error: ClassifiedError): void {
    // Determina severità
    error.severity = this.determineSeverity(error.type);

    // Determina se è retryable
    error.retryable = this.isRetryable(error.type);

    // Genera messaggio user-friendly
    error.userMessage = this.generateUserFriendlyMessage(error);

    // Determina strategia di recovery
    error.recovery = this.determineRecoveryStrategy(error);
  }

  /**
   * Determina la severità dell'errore
   */
  private determineSeverity(errorType: SystemErrorType): ErrorSeverity {
    const severityMap: Record<SystemErrorType, ErrorSeverity> = {
      [SystemErrorType.RATE_LIMIT_EXCEEDED]: ErrorSeverity.LOW,
      [SystemErrorType.DAILY_LIMIT_EXCEEDED]: ErrorSeverity.MEDIUM,
      [SystemErrorType.INVALID_API_KEY]: ErrorSeverity.CRITICAL,
      [SystemErrorType.SYMBOL_NOT_FOUND]: ErrorSeverity.LOW,
      [SystemErrorType.MARKET_CLOSED]: ErrorSeverity.LOW,
      [SystemErrorType.CONNECTION_TIMEOUT]: ErrorSeverity.MEDIUM,
      [SystemErrorType.NETWORK_UNAVAILABLE]: ErrorSeverity.HIGH,
      [SystemErrorType.DNS_FAILURE]: ErrorSeverity.HIGH,
      [SystemErrorType.SERVICE_UNAVAILABLE]: ErrorSeverity.HIGH,
      [SystemErrorType.SERVICE_OVERLOADED]: ErrorSeverity.MEDIUM,
      [SystemErrorType.INVALID_DATA_FORMAT]: ErrorSeverity.MEDIUM,
      [SystemErrorType.NO_DATA_AVAILABLE]: ErrorSeverity.LOW,
      [SystemErrorType.DATA_VALIDATION_FAILED]: ErrorSeverity.MEDIUM,
      [SystemErrorType.INVALID_REQUEST]: ErrorSeverity.LOW,
      [SystemErrorType.MALFORMED_SYMBOL]: ErrorSeverity.LOW,
      [SystemErrorType.UNSUPPORTED_TIMEFRAME]: ErrorSeverity.LOW,
      [SystemErrorType.INTERNAL_ERROR]: ErrorSeverity.CRITICAL,
      [SystemErrorType.CACHE_ERROR]: ErrorSeverity.MEDIUM,
      [SystemErrorType.UNKNOWN_ERROR]: ErrorSeverity.HIGH,
    };

    return severityMap[errorType] || ErrorSeverity.HIGH;
  }

  /**
   * Determina se l'errore è retryable
   */
  private isRetryable(errorType: SystemErrorType): boolean {
    const retryableErrors = [
      SystemErrorType.RATE_LIMIT_EXCEEDED,
      SystemErrorType.CONNECTION_TIMEOUT,
      SystemErrorType.NETWORK_UNAVAILABLE,
      SystemErrorType.SERVICE_UNAVAILABLE,
      SystemErrorType.SERVICE_OVERLOADED,
      SystemErrorType.CACHE_ERROR,
    ];

    return retryableErrors.includes(errorType);
  }

  /**
   * Genera messaggio user-friendly
   */
  private generateUserFriendlyMessage(
    error: ClassifiedError
  ): UserFriendlyMessage {
    const messages: Record<SystemErrorType, UserFriendlyMessage> = {
      [SystemErrorType.RATE_LIMIT_EXCEEDED]: {
        title: 'Limite di richieste temporaneo',
        message:
          'Stiamo rispettando i limiti del servizio gratuito (5 richieste al minuto). La richiesta verrà elaborata automaticamente tra qualche secondo.',
        suggestion:
          "Non è necessaria alcuna azione. Il sistema gestirà automaticamente l'attesa.",
        estimatedResolution: '30-60 secondi',
      },
      [SystemErrorType.DAILY_LIMIT_EXCEEDED]: {
        title: 'Limite giornaliero raggiunto',
        message:
          'Hai raggiunto il limite di 25 richieste gratuite per oggi. Il servizio si resetterà automaticamente domani alle 00:00 UTC.',
        suggestion:
          "Puoi utilizzare i dati già presenti nella cache o attendere il reset di domani. Considera l'utilizzo di più servizi API se hai bisogno di più dati.",
        technicalDetails: 'Alpha Vantage free tier: 25 requests/day',
        estimatedResolution: 'Domani alle 00:00 UTC',
      },
      [SystemErrorType.INVALID_API_KEY]: {
        title: 'Problema di accesso ai dati',
        message:
          "Si è verificato un problema temporaneo con l'accesso ai servizi di dati finanziari. Il sistema sta tentando di utilizzare credenziali alternative.",
        suggestion:
          'Riprova tra qualche minuto. Se il problema persiste, contatta il supporto.',
        technicalDetails: 'API key authentication failed',
      },
      [SystemErrorType.SYMBOL_NOT_FOUND]: {
        title: 'Simbolo non trovato',
        message: `Il simbolo "${error.context.symbol}" non è stato trovato nel database finanziario.`,
        suggestion: this.generateSymbolSuggestions(error.context.symbol || ''),
        technicalDetails: 'Symbol lookup failed in financial database',
      },
      [SystemErrorType.CONNECTION_TIMEOUT]: {
        title: 'Connessione lenta',
        message:
          'La connessione ai servizi finanziari è più lenta del normale. Il sistema sta riprovando automaticamente.',
        suggestion:
          'Verifica la tua connessione internet. Se il problema persiste, i dati potrebbero essere serviti dalla cache.',
        estimatedResolution: '1-2 minuti',
      },
      [SystemErrorType.NETWORK_UNAVAILABLE]: {
        title: 'Servizio temporaneamente non disponibile',
        message:
          'Il servizio di dati finanziari non è raggiungibile al momento. Il sistema sta tentando di utilizzare fonti alternative.',
        suggestion:
          'Riprova tra qualche minuto. Il sistema utilizzerà dati dalla cache quando possibile.',
        estimatedResolution: '5-15 minuti',
      },
      [SystemErrorType.NO_DATA_AVAILABLE]: {
        title: 'Dati non disponibili',
        message: `Non sono disponibili dati per "${error.context.symbol}" nel periodo richiesto.`,
        suggestion:
          'Verifica che il simbolo sia corretto e che il mercato sia aperto. Prova con un timeframe diverso.',
        technicalDetails:
          'No market data available for requested symbol and timeframe',
      },
      [SystemErrorType.INVALID_DATA_FORMAT]: {
        title: 'Errore nel formato dei dati',
        message:
          'I dati ricevuti dal servizio finanziario non sono nel formato atteso. Il sistema sta riprovando.',
        suggestion:
          'Questo è un problema temporaneo del servizio esterno. Riprova tra qualche minuto.',
        estimatedResolution: '2-5 minuti',
      },
      [SystemErrorType.MARKET_CLOSED]: {
        title: 'Mercato chiuso',
        message:
          'Il mercato è attualmente chiuso. I dati potrebbero non essere aggiornati in tempo reale.',
        suggestion:
          "I dati mostrati sono dell'ultima sessione di trading. Riprova durante gli orari di mercato.",
        estimatedResolution: 'Prossima apertura del mercato',
      },
      [SystemErrorType.DNS_FAILURE]: {
        title: 'Problema di connessione',
        message:
          'Impossibile raggiungere il servizio di dati finanziari. Problema di rete rilevato.',
        suggestion:
          'Verifica la tua connessione internet e riprova tra qualche minuto.',
        estimatedResolution: '1-5 minuti',
      },
      [SystemErrorType.SERVICE_UNAVAILABLE]: {
        title: 'Servizio non disponibile',
        message:
          'Il servizio di dati finanziari è temporaneamente non disponibile per manutenzione.',
        suggestion:
          'Il servizio dovrebbe tornare disponibile a breve. Riprova tra qualche minuto.',
        estimatedResolution: '10-30 minuti',
      },
      [SystemErrorType.SERVICE_OVERLOADED]: {
        title: 'Servizio sovraccarico',
        message:
          'Il servizio di dati finanziari è temporaneamente sovraccarico. Il sistema sta gestendo la coda.',
        suggestion:
          'Attendi qualche secondo, il sistema riproverà automaticamente.',
        estimatedResolution: '30-120 secondi',
      },
      [SystemErrorType.DATA_VALIDATION_FAILED]: {
        title: 'Dati non validi',
        message:
          'I dati ricevuti non hanno superato i controlli di validità del sistema.',
        suggestion:
          'Riprova con parametri diversi o contatta il supporto se il problema persiste.',
        estimatedResolution: 'Immediata con parametri corretti',
      },
      [SystemErrorType.INVALID_REQUEST]: {
        title: 'Richiesta non valida',
        message: 'I parametri della richiesta non sono corretti o mancanti.',
        suggestion:
          'Verifica che tutti i campi siano compilati correttamente e riprova.',
        estimatedResolution: 'Immediata con parametri corretti',
      },
      [SystemErrorType.MALFORMED_SYMBOL]: {
        title: 'Simbolo malformato',
        message: 'Il simbolo inserito non rispetta il formato richiesto.',
        suggestion:
          'Usa simboli nel formato corretto (es: AAPL, MSFT, BTC-USD).',
        estimatedResolution: 'Immediata con simbolo corretto',
      },
      [SystemErrorType.UNSUPPORTED_TIMEFRAME]: {
        title: 'Timeframe non supportato',
        message: 'Il timeframe richiesto non è supportato per questo simbolo.',
        suggestion:
          'Prova con un timeframe diverso (1min, 5min, 15min, 30min, 60min, daily).',
        estimatedResolution: 'Immediata con timeframe supportato',
      },
      [SystemErrorType.INTERNAL_ERROR]: {
        title: 'Errore interno',
        message: 'Si è verificato un errore interno del sistema.',
        suggestion:
          'Il problema è stato segnalato automaticamente. Riprova tra qualche minuto.',
        estimatedResolution: '5-15 minuti',
      },
      [SystemErrorType.CACHE_ERROR]: {
        title: 'Errore cache',
        message: 'Problema temporaneo con il sistema di cache dei dati.',
        suggestion:
          'I dati verranno recuperati direttamente dalla fonte. Potrebbe richiedere più tempo.',
        estimatedResolution: '1-3 minuti',
      },
      [SystemErrorType.UNKNOWN_ERROR]: {
        title: 'Errore sconosciuto',
        message: 'Si è verificato un errore non identificato dal sistema.',
        suggestion:
          'Riprova tra qualche minuto. Se il problema persiste, contatta il supporto.',
        estimatedResolution: 'Variabile',
      },
    };

    return (
      messages[error.type] || {
        title: 'Errore imprevisto',
        message:
          "Si è verificato un errore imprevisto durante l'elaborazione della richiesta.",
        suggestion:
          'Riprova tra qualche minuto. Se il problema persiste, contatta il supporto tecnico.',
        technicalDetails: error.originalError.message,
      }
    );
  }

  /**
   * Genera suggerimenti per simboli simili
   */
  private generateSymbolSuggestions(invalidSymbol: string): string {
    if (!invalidSymbol)
      return 'Verifica che il simbolo sia scritto correttamente (es: AAPL, MSFT, GOOGL).';

    const upperSymbol = invalidSymbol.toUpperCase();
    const suggestions = COMMON_SYMBOLS.filter(symbol => {
      return (
        symbol.includes(upperSymbol) ||
        upperSymbol.includes(symbol) ||
        this.levenshteinDistance(symbol, upperSymbol) <= 2
      );
    }).slice(0, 3);

    if (suggestions.length > 0) {
      return `Forse intendevi: ${suggestions.join(', ')}? Verifica che il simbolo sia scritto correttamente.`;
    }

    return 'Verifica che il simbolo sia scritto correttamente. Usa simboli come AAPL per Apple, MSFT per Microsoft, etc.';
  }

  /**
   * Calcola la distanza di Levenshtein per fuzzy matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Determina la strategia di recovery
   */
  private determineRecoveryStrategy(error: ClassifiedError): RecoveryInfo {
    const strategies: Record<SystemErrorType, RecoveryInfo> = {
      [SystemErrorType.RATE_LIMIT_EXCEEDED]: {
        strategy: RecoveryStrategy.RETRY_AFTER_DELAY,
        retryConfig: {
          enabled: true,
          maxAttempts: 3,
          baseDelay: 15000, // 15 secondi
          maxDelay: 60000,
          backoffMultiplier: 1.5,
          jitter: true,
        },
        estimatedRecoveryTime: 30000,
      },
      [SystemErrorType.DAILY_LIMIT_EXCEEDED]: {
        strategy: RecoveryStrategy.FALLBACK_TO_CACHE,
        fallbackOptions: ['cache', 'alternative_service'],
        requiredUserAction:
          'Attendere il reset di domani o utilizzare servizi alternativi',
      },
      [SystemErrorType.INVALID_API_KEY]: {
        strategy: RecoveryStrategy.FALLBACK_TO_ALTERNATIVE,
        fallbackOptions: ['yahoo_finance', 'alternative_keys'],
        estimatedRecoveryTime: 5000,
      },
      [SystemErrorType.CONNECTION_TIMEOUT]: {
        strategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
        retryConfig: {
          enabled: true,
          maxAttempts: 5,
          baseDelay: 2000,
          maxDelay: 30000,
          backoffMultiplier: 2.0,
          jitter: true,
        },
        estimatedRecoveryTime: 10000,
      },
      [SystemErrorType.NETWORK_UNAVAILABLE]: {
        strategy: RecoveryStrategy.FALLBACK_TO_CACHE,
        fallbackOptions: ['cache', 'alternative_service'],
        estimatedRecoveryTime: 300000, // 5 minuti
      },
      [SystemErrorType.SYMBOL_NOT_FOUND]: {
        strategy: RecoveryStrategy.USER_ACTION_REQUIRED,
        requiredUserAction:
          'Verificare il simbolo e riprovare con un simbolo valido',
      },
      [SystemErrorType.MARKET_CLOSED]: {
        strategy: RecoveryStrategy.FALLBACK_TO_CACHE,
        fallbackOptions: ['cache', 'last_session_data'],
        requiredUserAction:
          "I dati mostrati sono dell'ultima sessione di trading",
      },
      [SystemErrorType.DNS_FAILURE]: {
        strategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
        retryConfig: {
          enabled: true,
          maxAttempts: 3,
          baseDelay: 5000,
          maxDelay: 30000,
          backoffMultiplier: 2.0,
          jitter: true,
        },
        estimatedRecoveryTime: 15000,
      },
      [SystemErrorType.SERVICE_UNAVAILABLE]: {
        strategy: RecoveryStrategy.FALLBACK_TO_ALTERNATIVE,
        fallbackOptions: ['alternative_service', 'cache'],
        estimatedRecoveryTime: 600000, // 10 minuti
      },
      [SystemErrorType.SERVICE_OVERLOADED]: {
        strategy: RecoveryStrategy.RETRY_AFTER_DELAY,
        retryConfig: {
          enabled: true,
          maxAttempts: 5,
          baseDelay: 10000,
          maxDelay: 120000,
          backoffMultiplier: 2.0,
          jitter: true,
        },
        estimatedRecoveryTime: 60000,
      },
      [SystemErrorType.INVALID_DATA_FORMAT]: {
        strategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
        retryConfig: {
          enabled: true,
          maxAttempts: 2,
          baseDelay: 3000,
          maxDelay: 10000,
          backoffMultiplier: 2.0,
          jitter: false,
        },
        estimatedRecoveryTime: 10000,
      },
      [SystemErrorType.NO_DATA_AVAILABLE]: {
        strategy: RecoveryStrategy.USER_ACTION_REQUIRED,
        requiredUserAction:
          'Verificare il simbolo e il timeframe, provare con parametri diversi',
      },
      [SystemErrorType.DATA_VALIDATION_FAILED]: {
        strategy: RecoveryStrategy.USER_ACTION_REQUIRED,
        requiredUserAction:
          'Verificare i parametri della richiesta e riprovare',
      },
      [SystemErrorType.INVALID_REQUEST]: {
        strategy: RecoveryStrategy.USER_ACTION_REQUIRED,
        requiredUserAction: 'Correggere i parametri della richiesta',
      },
      [SystemErrorType.MALFORMED_SYMBOL]: {
        strategy: RecoveryStrategy.USER_ACTION_REQUIRED,
        requiredUserAction:
          'Inserire un simbolo nel formato corretto (es: AAPL, MSFT)',
      },
      [SystemErrorType.UNSUPPORTED_TIMEFRAME]: {
        strategy: RecoveryStrategy.USER_ACTION_REQUIRED,
        requiredUserAction: 'Selezionare un timeframe supportato',
      },
      [SystemErrorType.INTERNAL_ERROR]: {
        strategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
        retryConfig: {
          enabled: true,
          maxAttempts: 2,
          baseDelay: 5000,
          maxDelay: 15000,
          backoffMultiplier: 2.0,
          jitter: true,
        },
        estimatedRecoveryTime: 15000,
      },
      [SystemErrorType.CACHE_ERROR]: {
        strategy: RecoveryStrategy.FALLBACK_TO_ALTERNATIVE,
        fallbackOptions: ['direct_api_call'],
        estimatedRecoveryTime: 5000,
      },
      [SystemErrorType.UNKNOWN_ERROR]: {
        strategy: RecoveryStrategy.NO_RECOVERY,
        requiredUserAction:
          'Contattare il supporto tecnico se il problema persiste',
      },
    };

    return (
      strategies[error.type] || {
        strategy: RecoveryStrategy.NO_RECOVERY,
        requiredUserAction:
          'Contattare il supporto tecnico se il problema persiste',
      }
    );
  }

  /**
   * Implementa la strategia di retry con backoff
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfiguration,
    context: ErrorContext
  ): Promise<T> {
    let lastError: Error;
    let delay = retryConfig.baseDelay;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Se è l'ultimo tentativo, rilancia l'errore
        if (attempt === retryConfig.maxAttempts) {
          break;
        }

        // Verifica se l'errore è retryable
        const classified = this.classifyError(lastError, context);
        if (!classified.retryable) {
          break;
        }

        // Calcola delay con jitter se abilitato
        const actualDelay = retryConfig.jitter
          ? delay + Math.random() * delay * 0.1
          : delay;

        console.log(
          `Retry attempt ${attempt} in ${actualDelay}ms for ${context.operation}`
        );
        await this.delay(Math.min(actualDelay, retryConfig.maxDelay));

        // Aumenta il delay per il prossimo tentativo
        delay *= retryConfig.backoffMultiplier;
      }
    }

    throw lastError!;
  }

  /**
   * Utility per delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Genera ID univoco per l'errore
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Salva errore nella cronologia
   */
  private saveToHistory(error: ClassifiedError): void {
    const key = `${error.context.operation}_${error.context.symbol || 'unknown'}`;
    if (!this.errorHistory.has(key)) {
      this.errorHistory.set(key, []);
    }

    const history = this.errorHistory.get(key)!;
    history.push(error);

    // Mantieni solo gli ultimi 10 errori per operazione
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Ottieni statistiche degli errori
   */
  public getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ClassifiedError[];
  } {
    const allErrors = Array.from(this.errorHistory.values()).flat();
    const recentErrors = allErrors
      .filter(
        e => Date.now() - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
      ) // Ultime 24 ore
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    for (const error of allErrors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] =
        (errorsBySeverity[error.severity] || 0) + 1;
    }

    return {
      totalErrors: allErrors.length,
      errorsByType,
      errorsBySeverity,
      recentErrors,
    };
  }

  /**
   * Pulisce la cronologia degli errori
   */
  public clearErrorHistory(): void {
    this.errorHistory.clear();
    this.recoveryAttempts.clear();
  }
}
