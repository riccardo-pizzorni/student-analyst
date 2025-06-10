/**
 * STUDENT ANALYST - Data Sanitization & Validation System
 * =======================================================
 * 
 * Sistema completo per la sanitizzazione e validazione di tutti i dati
 * di input per proteggere contro XSS, injection attacks, e dati non validi
 */

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue?: any;
  errors: string[];
  warnings: string[];
  metadata?: {
    originalValue: any;
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
      /((')|('')|(--)|(\;)|(\/)))/g,
      /(0x[0-9a-f]+)/gi
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
      /expression\s*\(/gi
    ],
    
    // Command injection patterns
    command: [
      /(\||&&|;|\$\(|`)/g,
      /(\.\.\/|\.\.\\)/g,
      /(\/bin\/|\/usr\/|\/etc\/)/g,
      /(curl|wget|nc|netcat)/gi
    ],
    
    // File path traversal
    pathTraversal: [
      /(\.\.\/|\.\.\\)/g,
      /(\/\.\.|\\\.\.)/g,
      /(%2e%2e%2f|%2e%2e%5c)/gi,
      /(%252e%252e%252f)/gi
    ]
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
    '=': '&#x3D;'
  };

  /**
   * Sanitizza una stringa da HTML/XSS
   */
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input.replace(/[&<>"'`=/]/g, (char) => 
      DataSanitizer.HTML_ESCAPE_MAP[char] || char
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
        warnings: []
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
        timestamp: new Date()
      }
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
      allowFutures = false
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Controlla input base
    if (!ticker || typeof ticker !== 'string') {
      return {
        isValid: false,
        errors: ['Ticker symbol is required'],
        warnings: []
      };
    }

    // Prima sanitizzazione di base
    const dangerousCheck = DataSanitizer.removeDangerousPatterns(ticker);
    if (!dangerousCheck.isValid) {
      return {
        isValid: false,
        errors: ['Invalid ticker: contains dangerous patterns', ...dangerousCheck.errors],
        warnings: []
      };
    }

    let sanitized = dangerousCheck.sanitizedValue as string;

    // Rimuovi whitespace
    sanitized = sanitized.trim();

    // Controllo lunghezza
    if (sanitized.length === 0) {
      errors.push('Ticker symbol cannot be empty');
    }
    if (sanitized.length > maxLength) {
      errors.push(`Ticker symbol too long (max ${maxLength} characters)`);
    }

    // Valida formato base ticker
    const baseTickerRegex = /^[A-Za-z0-9.-]+$/;
    if (!baseTickerRegex.test(sanitized)) {
      errors.push('Ticker symbol contains invalid characters (only letters, numbers, dots, and dashes allowed)');
    }

    // Enforza uppercase se richiesto
    if (enforceUppercase) {
      sanitized = sanitized.toUpperCase();
    }

    // Validazioni specifiche per tipo di asset
    
    // Crypto validation
    if (allowCrypto && sanitized.includes('-')) {
      const cryptoRegex = /^[A-Z]{2,10}-[A-Z]{2,10}$/;
      if (!cryptoRegex.test(sanitized)) {
        warnings.push('Crypto symbol format should be like BTC-USD');
      }
    }

    // Futures validation
    if (allowFutures && sanitized.includes('.')) {
      const futuresRegex = /^[A-Z]{1,4}\d{2,4}$/;
      if (!futuresRegex.test(sanitized.replace('.', ''))) {
        warnings.push('Futures symbol format may be invalid');
      }
    }

    // Exchange validation
    if (allowedExchanges.length > 0) {
      const hasExchange = allowedExchanges.some(exchange => 
        sanitized.startsWith(exchange + ':') || sanitized.endsWith('.' + exchange)
      );
      if (!hasExchange) {
        warnings.push(`Ticker should include exchange prefix/suffix: ${allowedExchanges.join(', ')}`);
      }
    }

    // Controlla pattern comuni non validi
    if (sanitized.startsWith('.') || sanitized.endsWith('.')) {
      errors.push('Ticker symbol cannot start or end with a dot');
    }
    if (sanitized.includes('..')) {
      errors.push('Ticker symbol cannot contain consecutive dots');
    }
    if (sanitized.includes('--')) {
      errors.push('Ticker symbol cannot contain consecutive dashes');
    }

    // Blacklist di ticker non validi
    const blacklistedTickers = ['NULL', 'UNDEFINED', 'ADMIN', 'ROOT', 'TEST', 'DEBUG'];
    if (blacklistedTickers.includes(sanitized)) {
      errors.push('Reserved ticker symbol not allowed');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized,
      errors,
      warnings,
      metadata: {
        originalValue: ticker,
        sanitizationType: 'ticker-validation',
        timestamp: new Date()
      }
    };
  }

  /**
   * Valida e sanitizza date ranges
   */
  static validateDateRange(
    startDate: string | Date,
    endDate: string | Date,
    options: DateRangeValidationOptions = {}
  ): ValidationResult {
    const {
      minDate = new Date('1900-01-01'),
      maxDate = new Date(),
      maxRangeDays = 365 * 10, // 10 anni max
      allowFutureDates = false,
      requiredFormat = 'YYYY-MM-DD'
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Converti a Date objects
      let start: Date;
      let end: Date;

      if (typeof startDate === 'string') {
        // Sanitizza la stringa prima
        const startSanitized = DataSanitizer.removeDangerousPatterns(startDate);
        if (!startSanitized.isValid) {
          return {
            isValid: false,
            errors: ['Invalid start date: contains dangerous patterns'],
            warnings: []
          };
        }
        
        // Valida formato data
        if (requiredFormat === 'YYYY-MM-DD') {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(startSanitized.sanitizedValue as string)) {
            errors.push('Start date must be in YYYY-MM-DD format');
          }
        }
        
        start = new Date(startSanitized.sanitizedValue as string);
      } else {
        start = startDate;
      }

      if (typeof endDate === 'string') {
        // Sanitizza la stringa prima
        const endSanitized = DataSanitizer.removeDangerousPatterns(endDate);
        if (!endSanitized.isValid) {
          return {
            isValid: false,
            errors: ['Invalid end date: contains dangerous patterns'],
            warnings: []
          };
        }
        
        // Valida formato data
        if (requiredFormat === 'YYYY-MM-DD') {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(endSanitized.sanitizedValue as string)) {
            errors.push('End date must be in YYYY-MM-DD format');
          }
        }
        
        end = new Date(endSanitized.sanitizedValue as string);
      } else {
        end = endDate;
      }

      // Controlla validità delle date
      if (isNaN(start.getTime())) {
        errors.push('Invalid start date');
      }
      if (isNaN(end.getTime())) {
        errors.push('Invalid end date');
      }

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      // Validazioni logiche
      if (start > end) {
        errors.push('Start date cannot be after end date');
      }

      // Controlla limiti temporali
      if (start < minDate) {
        errors.push(`Start date cannot be before ${minDate.toISOString().split('T')[0]}`);
      }
      if (end > maxDate) {
        errors.push(`End date cannot be after ${maxDate.toISOString().split('T')[0]}`);
      }

      // Controlla date future
      const now = new Date();
      if (!allowFutureDates) {
        if (start > now) {
          errors.push('Start date cannot be in the future');
        }
        if (end > now) {
          errors.push('End date cannot be in the future');
        }
      }

      // Controlla range massimo
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > maxRangeDays) {
        errors.push(`Date range too large (max ${maxRangeDays} days)`);
      }

      // Warnings per range ottimali
      if (diffDays > 365) {
        warnings.push('Large date ranges may impact performance');
      }
      if (diffDays < 1) {
        warnings.push('Very short date range may not provide meaningful data');
      }

      // Weekend warnings per dati finanziari
      const startDay = start.getDay();
      const endDay = end.getDay();
      if (startDay === 0 || startDay === 6) {
        warnings.push('Start date is a weekend - markets may be closed');
      }
      if (endDay === 0 || endDay === 6) {
        warnings.push('End date is a weekend - markets may be closed');
      }

      return {
        isValid: errors.length === 0,
        sanitizedValue: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          rangeDays: diffDays
        },
        errors,
        warnings,
        metadata: {
          originalValue: { startDate, endDate },
          sanitizationType: 'date-range-validation',
          timestamp: new Date()
        }
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Date validation error: ${error}`],
        warnings: []
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
        warnings: []
      };
    }

    // Sanitizza da pattern pericolosi se è stringa
    if (typeof value === 'string') {
      const dangerousCheck = DataSanitizer.removeDangerousPatterns(value);
      if (!dangerousCheck.isValid) {
        return {
          isValid: false,
          errors: ['Invalid numeric input: contains dangerous patterns'],
          warnings: []
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
          warnings.push('Fractional quantities may not be supported for all assets');
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
      warnings.push(`Value has ${decimalsCount} decimals, max recommended is ${decimals}`);
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
        timestamp: new Date()
      }
    };
  }

  /**
   * Sanitizzazione completa per oggetti request
   */
  static sanitizeRequestData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitized: any = {};

    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        errors: ['Invalid request data'],
        warnings: []
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
        sanitized[cleanKey] = DataSanitizer.sanitizeHtml(valueSanitized.sanitizedValue as string);
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
            return itemSanitized.isValid ? DataSanitizer.sanitizeHtml(itemSanitized.sanitizedValue as string) : '';
          }
          return item;
        });
        sanitized[cleanKey] = sanitizedArray;
      } else {
        // Mantieni altri tipi ma logga warning
        warnings.push(`Unsanitized field type for ${cleanKey}: ${typeof value}`);
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
        timestamp: new Date()
      }
    };
  }
}

export default DataSanitizer; 