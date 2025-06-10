/**
 * Date Normalizer per STUDENT ANALYST
 * 
 * Gestisce la normalizzazione di date da diversi formati in standard ISO
 * Supporta fusi orari, validazione e correzione automatica
 */

// ========== INTERFACCE ==========

export interface DateParsingResult {
  success: boolean;
  date: string;        // YYYY-MM-DD
  timestamp: string;   // YYYY-MM-DDTHH:MM:SS.sssZ
  originalValue: string;
  detectedFormat: string;
  timezone: string;
  confidence: number;  // 0-1
  errors: string[];
}

export interface DateValidationRules {
  allowFutureDates: boolean;
  allowWeekendsForDaily: boolean;
  allowHolidaysForDaily: boolean;
  maxDateRange: number; // giorni
  minDateRange: number; // giorni
}

// ========== CLASSE PRINCIPALE ==========

export class DateNormalizer {
  private readonly timezone: string;
  private readonly validationRules: DateValidationRules;
  
  // Pattern regex per diversi formati di date
  private readonly datePatterns = [
    // Formati ISO
    { pattern: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/, format: 'ISO_FULL', priority: 10 },
    { pattern: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/, format: 'ISO_SECONDS', priority: 9 },
    { pattern: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})Z$/, format: 'ISO_MINUTES', priority: 8 },
    { pattern: /^(\d{4})-(\d{2})-(\d{2})$/, format: 'ISO_DATE', priority: 7 },
    
    // Formati Alpha Vantage
    { pattern: /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/, format: 'ALPHA_VANTAGE_FULL', priority: 6 },
    { pattern: /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/, format: 'ALPHA_VANTAGE_MINUTES', priority: 5 },
    
    // Formati Yahoo Finance
    { pattern: /^(\d{2})\/(\d{2})\/(\d{4})$/, format: 'YAHOO_US', priority: 4 }, // MM/DD/YYYY
    { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: 'YAHOO_US_FLEXIBLE', priority: 3 },
    
    // Formati Unix timestamp
    { pattern: /^(\d{10})$/, format: 'UNIX_SECONDS', priority: 2 },
    { pattern: /^(\d{13})$/, format: 'UNIX_MILLISECONDS', priority: 1 },
    
    // Formati generici
    { pattern: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, format: 'GENERIC_DMY', priority: 0 },
    { pattern: /^(\d{4})(\d{2})(\d{2})$/, format: 'COMPACT_YMD', priority: 0 }
  ];

  // Mapping dei fusi orari comuni
  private readonly timezoneMap = new Map([
    ['EST', 'America/New_York'],
    ['EDT', 'America/New_York'],
    ['PST', 'America/Los_Angeles'],
    ['PDT', 'America/Los_Angeles'],
    ['GMT', 'UTC'],
    ['UTC', 'UTC'],
    ['US/Eastern', 'America/New_York'],
    ['US/Pacific', 'America/Los_Angeles']
  ]);

  constructor(timezone: string = 'America/New_York', validationRules?: Partial<DateValidationRules>) {
    this.timezone = this.normalizeTimezone(timezone);
    this.validationRules = {
      allowFutureDates: false,
      allowWeekendsForDaily: true,
      allowHolidaysForDaily: true,
      maxDateRange: 365 * 5, // 5 anni
      minDateRange: 1,
      ...validationRules
    };
  }

  /**
   * Normalizza un array di dati con date
   */
  public normalize(data: any[]): any[] {
    const results: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      try {
        // Trova il campo data nell'oggetto
        const dateField = this.findDateField(item);
        if (!dateField) {
          errors.push(`Record ${i}: Nessun campo data trovato`);
          continue;
        }

        // Parsing della data
        const parseResult = this.parseDate(item[dateField]);
        if (!parseResult.success) {
          errors.push(`Record ${i}: ${parseResult.errors.join(', ')}`);
          continue;
        }

        // Validazione
        const validationResult = this.validateDate(parseResult);
        if (!validationResult.isValid) {
          errors.push(`Record ${i}: ${validationResult.reason}`);
          if (validationResult.severity === 'CRITICAL') {
            continue; // Salta record con errori critici
          }
        }

        // Crea nuovo oggetto con date standardizzate
        const normalizedItem = {
          ...item,
          date: parseResult.date,
          timestamp: parseResult.timestamp,
          originalDate: item[dateField],
          dateFormat: parseResult.detectedFormat,
          dateConfidence: parseResult.confidence
        };

        results.push(normalizedItem);

      } catch (error) {
        errors.push(`Record ${i}: Errore inaspettato - ${(error as Error).message}`);
      }
    }

    if (errors.length > 0) {
      console.warn(`DateNormalizer: ${errors.length} errori durante normalizzazione:`, errors.slice(0, 5));
    }

    return results;
  }

  /**
   * Parsing di una singola data
   */
  public parseDate(dateValue: any): DateParsingResult {
    const originalValue = String(dateValue);
    
    if (!dateValue || dateValue === '') {
      return {
        success: false,
        date: '',
        timestamp: '',
        originalValue,
        detectedFormat: 'EMPTY',
        timezone: this.timezone,
        confidence: 0,
        errors: ['Valore data vuoto']
      };
    }

    // Prova tutti i pattern in ordine di priorità
    const sortedPatterns = [...this.datePatterns].sort((a, b) => b.priority - a.priority);
    
    for (const { pattern, format } of sortedPatterns) {
      const match = originalValue.match(pattern);
      if (match) {
        try {
          const result = this.parseWithFormat(match, format, originalValue);
          if (result.success) {
            return result;
          }
        } catch (error) {
          // Continua con il prossimo pattern
        }
      }
    }

    // Prova parsing JavaScript nativo come fallback
    try {
      const jsDate = new Date(originalValue);
      if (!isNaN(jsDate.getTime())) {
        return {
          success: true,
          date: this.formatToISODate(jsDate),
          timestamp: jsDate.toISOString(),
          originalValue,
          detectedFormat: 'JAVASCRIPT_NATIVE',
          timezone: this.timezone,
          confidence: 0.5,
          errors: []
        };
      }
    } catch (error) {
      // Fallback fallito
    }

    return {
      success: false,
      date: '',
      timestamp: '',
      originalValue,
      detectedFormat: 'UNKNOWN',
      timezone: this.timezone,
      confidence: 0,
      errors: [`Formato data non riconosciuto: ${originalValue}`]
    };
  }

  /**
   * Parsing con formato specifico
   */
  private parseWithFormat(match: RegExpMatchArray, format: string, originalValue: string): DateParsingResult {
    let date: Date;
    let confidence = 1.0;

    switch (format) {
      case 'ISO_FULL':
      case 'ISO_SECONDS':
      case 'ISO_MINUTES':
        date = new Date(originalValue);
        break;

      case 'ISO_DATE':
        date = new Date(originalValue + 'T00:00:00Z');
        break;

      case 'ALPHA_VANTAGE_FULL':
        // "2023-12-01 16:00:00" -> assumiamo EST/EDT
        date = new Date(originalValue + ' EST');
        break;

      case 'ALPHA_VANTAGE_MINUTES':
        // "2023-12-01 16:00" -> assumiamo EST/EDT
        date = new Date(originalValue + ':00 EST');
        break;

      case 'YAHOO_US':
      case 'YAHOO_US_FLEXIBLE':
        // MM/DD/YYYY
        const [, month, day, year] = match;
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        confidence = 0.9; // Potrebbe essere ambiguo con DD/MM/YYYY
        break;

      case 'UNIX_SECONDS':
        date = new Date(parseInt(originalValue) * 1000);
        break;

      case 'UNIX_MILLISECONDS':
        date = new Date(parseInt(originalValue));
        break;

      case 'GENERIC_DMY':
        // Assumiamo DD-MM-YYYY (formato europeo)
        const [, dayDMY, monthDMY, yearDMY] = match;
        date = new Date(parseInt(yearDMY), parseInt(monthDMY) - 1, parseInt(dayDMY));
        confidence = 0.7; // Formato ambiguo
        break;

      case 'COMPACT_YMD':
        // YYYYMMDD
        const [, fullYear, fullMonth, fullDay] = [
          match[0].slice(0, 4),
          match[0].slice(4, 6),
          match[0].slice(6, 8)
        ];
        date = new Date(parseInt(fullYear), parseInt(fullMonth) - 1, parseInt(fullDay));
        break;

      default:
        throw new Error(`Formato non supportato: ${format}`);
    }

    if (isNaN(date.getTime())) {
      throw new Error(`Data non valida dopo parsing: ${originalValue}`);
    }

    return {
      success: true,
      date: this.formatToISODate(date),
      timestamp: date.toISOString(),
      originalValue,
      detectedFormat: format,
      timezone: this.timezone,
      confidence,
      errors: []
    };
  }

  /**
   * Validazione date secondo le regole configurate
   */
  private validateDate(parseResult: DateParsingResult): {
    isValid: boolean;
    reason: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } {
    const date = new Date(parseResult.timestamp);
    const now = new Date();

    // Controllo date future
    if (!this.validationRules.allowFutureDates && date > now) {
      return {
        isValid: false,
        reason: 'Data futura non ammessa',
        severity: 'HIGH'
      };
    }

    // Controllo range date
    const daysDiff = Math.abs((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > this.validationRules.maxDateRange) {
      return {
        isValid: false,
        reason: `Data troppo lontana (${Math.round(daysDiff)} giorni)`,
        severity: 'MEDIUM'
      };
    }

    if (daysDiff < this.validationRules.minDateRange) {
      return {
        isValid: false,
        reason: 'Data troppo recente',
        severity: 'LOW'
      };
    }

    // Controllo weekend per dati daily
    if (!this.validationRules.allowWeekendsForDaily) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Domenica o Sabato
        return {
          isValid: false,
          reason: 'Weekend non ammesso per dati giornalieri',
          severity: 'LOW'
        };
      }
    }

    // Controllo confidence minima
    if (parseResult.confidence < 0.5) {
      return {
        isValid: false,
        reason: 'Confidence di parsing troppo bassa',
        severity: 'MEDIUM'
      };
    }

    return {
      isValid: true,
      reason: 'Data valida',
      severity: 'LOW'
    };
  }

  /**
   * Trova il campo data nell'oggetto
   */
  private findDateField(item: any): string | null {
    const dateFields = [
      'date', 'timestamp', 'time', 'datetime',
      'Date', 'Timestamp', 'Time', 'DateTime',
      'DATE', 'TIMESTAMP', 'TIME', 'DATETIME'
    ];

    for (const field of dateFields) {
      if (Object.prototype.hasOwnProperty.call(item, field) && item[field] != null) {
        return field;
      }
    }

    // Cerca in chiavi dell'oggetto
    const keys = Object.keys(item);
    for (const key of keys) {
      if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
        return key;
      }
    }

    return null;
  }

  /**
   * Formatta Date JavaScript in formato ISO date (YYYY-MM-DD)
   */
  private formatToISODate(date: Date): string {
    return date.getFullYear() + '-' +
           String(date.getMonth() + 1).padStart(2, '0') + '-' +
           String(date.getDate()).padStart(2, '0');
  }

  /**
   * Normalizza timezone
   */
  private normalizeTimezone(timezone: string): string {
    return this.timezoneMap.get(timezone) || timezone;
  }

  /**
   * Ottieni statistiche di normalizzazione
   */
  public getStats(): {
    supportedFormats: string[];
    timezone: string;
    validationRules: DateValidationRules;
  } {
    return {
      supportedFormats: this.datePatterns.map(p => p.format),
      timezone: this.timezone,
      validationRules: this.validationRules
    };
  }

  /**
   * Test di un formato data specifico
   */
  public testDateFormat(dateString: string): {
    recognized: boolean;
    format: string;
    confidence: number;
    parsed?: DateParsingResult;
  } {
    const result = this.parseDate(dateString);
    return {
      recognized: result.success,
      format: result.detectedFormat,
      confidence: result.confidence,
      parsed: result.success ? result : undefined
    };
  }
} 