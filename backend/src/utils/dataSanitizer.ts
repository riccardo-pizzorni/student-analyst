/**
 * STUDENT ANALYST - Data Sanitization & Validation System
 * =======================================================
 *
 * Sistema completo per la sanitizzazione e validazione di tutti i dati
 * di input per proteggere contro XSS, injection attacks, e dati non validi
 */

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue?: unknown;
  errors: string[];
  warnings: string[];
  metadata?: {
    originalValue: unknown;
    sanitizationType: string;
    timestamp: Date;
  };
}

export interface TickerValidationOptions {
  maxLength?: number;
  allowedExchanges?: string[];
  enforceUppercase?: boolean;
  allowCrypto?: boolean;
  allowFutures?: boolean;
}

export interface DateRangeValidationOptions {
  minDate?: Date;
  maxDate?: Date;
  maxRangeDays?: number;
  allowFutureDates?: boolean;
  requiredFormat?: string;
}

export interface SanitizedRequestData {
  [key: string]: unknown;
}

/**
 * Sistema di sanitizzazione principale
 */
export class DataSanitizer {
  // Patterns pericolosi da rilevare e neutralizzare
  private static readonly DANGEROUS_PATTERNS = {
    // SQL Injection patterns
    sql: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(UNION\s+SELECT)/gi,
      /(\|\||&&|--|\/\*|\*\/)/g,
      /((')|('')|(--)|(\;)|(\/)\))/g,
      /(0x[0-9a-f]+)/gi,
    ],

    // XSS patterns
    xss: [
      /<script[^>]*>(.*?)<\/script>/gi,
      /<iframe[^>]*>(.*?)<\/iframe>/gi,
      /<object[^>]*>(.*?)<\/object>/gi,
      /<embed[^>]*>(.*?)<\/embed>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /javascript\s*:/gi,
      /vbscript\s*:/gi,
      /on\w+\s*=/gi,
      /data\s*:\s*text\/html/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
    ],

    // Command injection patterns
    command: [
      /(\||&&|;|\$\(|`)/g,
      /(\.\.\/|\.\.\\)/g,
      /(\/bin\/|\/usr\/|\/etc\/)/g,
      /(curl|wget|nc|netcat)/gi,
    ],

    // File path traversal
    pathTraversal: [
      /(\.\.\/|\.\.\\)/g,
      /(\/\.\.|\\\.\.)/g,
      /(%2e%2e%2f|%2e%2e%5c)/gi,
      /(%252e%252e%252f)/gi,
    ],
  };

  // Caratteri HTML che devono essere escapati
  private static readonly HTML_ESCAPE_MAP: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  /**
   * Sanitizza una stringa da HTML/XSS
   */
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input.replace(
      /[&<>"'`=/]/g,
      char => DataSanitizer.HTML_ESCAPE_MAP[char] || char
    );
  }

  /**
   * Rimuove tutti i pattern pericolosi
   */
  static removeDangerousPatterns(input: string): ValidationResult {
    if (!input || typeof input !== 'string') {
      return {
        isValid: true,
        sanitizedValue: '',
        errors: [],
        warnings: [],
      };
    }

    let sanitized = input;
    const warnings: string[] = [];
    const errors: string[] = [];

    // Controlla e rimuove pattern SQL injection
    for (const pattern of DataSanitizer.DANGEROUS_PATTERNS.sql) {
      if (pattern.test(sanitized)) {
        errors.push('SQL injection pattern detected');
        sanitized = sanitized.replace(pattern, '');
      }
    }

    // Controlla e rimuove pattern XSS
    for (const pattern of DataSanitizer.DANGEROUS_PATTERNS.xss) {
      if (pattern.test(sanitized)) {
        errors.push('XSS pattern detected');
        sanitized = sanitized.replace(pattern, '');
      }
    }

    // Controlla command injection
    for (const pattern of DataSanitizer.DANGEROUS_PATTERNS.command) {
      if (pattern.test(sanitized)) {
        errors.push('Command injection pattern detected');
        sanitized = sanitized.replace(pattern, '');
      }
    }

    // Controlla path traversal
    for (const pattern of DataSanitizer.DANGEROUS_PATTERNS.pathTraversal) {
      if (pattern.test(sanitized)) {
        errors.push('Path traversal pattern detected');
        sanitized = sanitized.replace(pattern, '');
      }
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized.trim(),
      errors,
      warnings,
      metadata: {
        originalValue: input,
        sanitizationType: 'dangerous-patterns',
        timestamp: new Date(),
      },
    };
  }

  /**
   * Valida e sanitizza ticker symbols
   */
  static validateTicker(
    ticker: string,
    options: TickerValidationOptions = {}
  ): ValidationResult {
    const {
      maxLength = 10,
      allowedExchanges = [],
      enforceUppercase = true,
      allowCrypto = false,
      allowFutures = false,
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Controlla input base
    if (!ticker || typeof ticker !== 'string') {
      return {
        isValid: false,
        errors: ['Ticker symbol is required'],
        warnings: [],
      };
    }

    // Prima sanitizzazione di base
    const sanitizedTicker = DataSanitizer.removeDangerousPatterns(ticker);
    if (!sanitizedTicker.isValid) {
      return {
        isValid: false,
        errors: ['Ticker contains dangerous patterns'],
        warnings: [],
      };
    }

    let cleanTicker = sanitizedTicker.sanitizedValue as string;

    // Converti in maiuscolo se richiesto
    if (enforceUppercase) {
      cleanTicker = cleanTicker.toUpperCase();
    }

    // Controlli di lunghezza
    if (cleanTicker.length > maxLength) {
      errors.push(`Ticker too long (max ${maxLength} characters)`);
    }

    if (cleanTicker.length < 1) {
      errors.push('Ticker too short');
    }

    // Pattern di validazione base
    const validPattern = /^[A-Z0-9.-]+$/;
    if (!validPattern.test(cleanTicker)) {
      errors.push('Invalid ticker format');
    }

    // Controlli specifici per crypto
    if (!allowCrypto && cleanTicker.includes('-')) {
      errors.push('Crypto tickers not allowed');
    }

    // Controlli specifici per futures
    if (!allowFutures && cleanTicker.includes('=')) {
      errors.push('Futures tickers not allowed');
    }

    // Controlli per exchange specifici
    if (allowedExchanges.length > 0) {
      // Logica per validare exchange specifico
      warnings.push('Exchange-specific validation not implemented');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: cleanTicker,
      errors,
      warnings,
      metadata: {
        originalValue: ticker,
        sanitizationType: 'ticker-validation',
        timestamp: new Date(),
      },
    };
  }

  /**
   * Valida range di date
   */
  static validateDateRange(
    startDate: string | Date,
    endDate: string | Date,
    options: DateRangeValidationOptions = {}
  ): ValidationResult {
    const {
      minDate,
      maxDate,
      maxRangeDays = 365,
      allowFutureDates = false,
      requiredFormat,
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Converti in Date objects
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      const end = endDate instanceof Date ? endDate : new Date(endDate);

      // Validazioni base
      if (isNaN(start.getTime())) {
        errors.push('Invalid start date');
      }

      if (isNaN(end.getTime())) {
        errors.push('Invalid end date');
      }

      if (start > end) {
        errors.push('Start date must be before end date');
      }

      // Controllo range massimo
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > maxRangeDays) {
        errors.push(`Date range too large (max ${maxRangeDays} days)`);
      }

      // Controllo date future
      if (!allowFutureDates) {
        const now = new Date();
        if (start > now || end > now) {
          errors.push('Future dates not allowed');
        }
      }

      // Controllo min/max date
      if (minDate && start < minDate) {
        errors.push(
          `Start date must be after ${minDate.toISOString().split('T')[0]}`
        );
      }

      if (maxDate && end > maxDate) {
        errors.push(
          `End date must be before ${maxDate.toISOString().split('T')[0]}`
        );
      }

      // Warning per range molto piccoli
      if (diffDays < 1) {
        warnings.push('Very short date range');
      }

      return {
        isValid: errors.length === 0,
        sanitizedValue: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          rangeDays: diffDays,
        },
        errors,
        warnings,
        metadata: {
          originalValue: { startDate, endDate },
          sanitizationType: 'date-range-validation',
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Date validation error: ${error}`],
        warnings: [],
      };
    }
  }

  /**
   * Valida parametri numerici (quantità, prezzi, percentuali)
   */
  static validateNumericInput(
    value: string | number,
    type: 'price' | 'quantity' | 'percentage' | 'generic' = 'generic',
    options: {
      min?: number;
      max?: number;
      decimals?: number;
      allowNegative?: boolean;
    } = {}
  ): ValidationResult {
    const { min, max, decimals = 8, allowNegative = false } = options;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (value === null || value === undefined || value === '') {
      return {
        isValid: false,
        errors: ['Numeric value is required'],
        warnings: [],
      };
    }

    // Sanitizza da pattern pericolosi se è stringa
    if (typeof value === 'string') {
      const dangerousCheck = DataSanitizer.removeDangerousPatterns(value);
      if (!dangerousCheck.isValid) {
        return {
          isValid: false,
          errors: ['Invalid numeric input: contains dangerous patterns'],
          warnings: [],
        };
      }
      value = dangerousCheck.sanitizedValue as string;
    }

    // Converti a numero
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    // Controlli base
    if (isNaN(numValue) || !isFinite(numValue)) {
      errors.push('Invalid numeric value');
    }

    if (!allowNegative && numValue < 0) {
      errors.push('Negative values not allowed');
    }

    if (min !== undefined && numValue < min) {
      errors.push(`Value must be at least ${min}`);
    }

    if (max !== undefined && numValue > max) {
      errors.push(`Value must be at most ${max}`);
    }

    // Validazioni specifiche per tipo
    switch (type) {
      case 'price':
        if (numValue < 0) {
          errors.push('Price cannot be negative');
        }
        if (numValue > 1000000) {
          warnings.push('Very high price value');
        }
        break;

      case 'quantity':
        if (numValue < 0) {
          errors.push('Quantity cannot be negative');
        }
        if (numValue % 1 !== 0) {
          warnings.push(
            'Fractional quantities may not be supported for all assets'
          );
        }
        break;

      case 'percentage':
        if (numValue < -100 || numValue > 100) {
          errors.push('Percentage must be between -100 and 100');
        }
        break;
    }

    // Controlla decimali
    const decimalsCount = numValue.toString().split('.')[1]?.length || 0;
    if (decimalsCount > decimals) {
      warnings.push(
        `Value has ${decimalsCount} decimals, max recommended is ${decimals}`
      );
    }

    const sanitizedValue = parseFloat(numValue.toFixed(decimals));

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      errors,
      warnings,
      metadata: {
        originalValue: value,
        sanitizationType: `numeric-${type}`,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Sanitizzazione completa per oggetti request
   */
  static sanitizeRequestData(data: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitized: SanitizedRequestData = {};

    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        errors: ['Invalid request data'],
        warnings: [],
      };
    }

    for (const [key, value] of Object.entries(data)) {
      // Sanitizza la chiave
      const keySanitized = DataSanitizer.removeDangerousPatterns(key);
      if (!keySanitized.isValid) {
        errors.push(`Invalid field name: ${key}`);
        continue;
      }

      const cleanKey = keySanitized.sanitizedValue as string;

      // Sanitizza il valore basato sul tipo
      if (typeof value === 'string') {
        const valueSanitized = DataSanitizer.removeDangerousPatterns(value);
        if (!valueSanitized.isValid) {
          errors.push(`Invalid value for field ${cleanKey}`);
          continue;
        }
        sanitized[cleanKey] = DataSanitizer.sanitizeHtml(
          valueSanitized.sanitizedValue as string
        );
      } else if (typeof value === 'number') {
        const numValidation = DataSanitizer.validateNumericInput(value);
        if (!numValidation.isValid) {
          errors.push(`Invalid numeric value for field ${cleanKey}`);
          continue;
        }
        sanitized[cleanKey] = numValidation.sanitizedValue;
      } else if (Array.isArray(value)) {
        // Sanitizza array ricorsivamente
        const sanitizedArray = value.map(item => {
          if (typeof item === 'string') {
            const itemSanitized = DataSanitizer.removeDangerousPatterns(item);
            return itemSanitized.isValid
              ? DataSanitizer.sanitizeHtml(
                  itemSanitized.sanitizedValue as string
                )
              : '';
          }
          return item;
        });
        sanitized[cleanKey] = sanitizedArray;
      } else {
        // Mantieni altri tipi ma logga warning
        warnings.push(
          `Unsanitized field type for ${cleanKey}: ${typeof value}`
        );
        sanitized[cleanKey] = value;
      }
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized,
      errors,
      warnings,
      metadata: {
        originalValue: data,
        sanitizationType: 'request-data',
        timestamp: new Date(),
      },
    };
  }
}

export default DataSanitizer;
