/**
 * STUDENT ANALYST - Sanitization Middleware
 * =========================================
 *
 * Middleware Express per applicare automaticamente la sanitizzazione
 * a tutte le richieste in ingresso
 */

import { NextFunction, Request, Response } from 'express';
import { suspiciousActivityLogger } from '../services/suspiciousActivityLogger';
import DataSanitizer, { ValidationResult } from '../utils/dataSanitizer';

export interface SanitizedRequest extends Request {
  sanitizedBody?: Record<string, unknown>;
  sanitizedParams?: Record<string, string>;
  sanitizedQuery?: Record<string, string | string[]>;
  validationResults?: {
    body?: ValidationResult;
    params?: ValidationResult;
    query?: ValidationResult;
  };
}

/**
 * Configurazione per il middleware di sanitizzazione
 */
export interface SanitizationConfig {
  enableBodySanitization: boolean;
  enableParamsSanitization: boolean;
  enableQuerySanitization: boolean;
  logSuspiciousActivity: boolean;
  blockOnDangerousPatterns: boolean;
  maxRequestSize: number;
  trustedIPs: string[];
}

const defaultConfig: SanitizationConfig = {
  enableBodySanitization: true,
  enableParamsSanitization: true,
  enableQuerySanitization: true,
  logSuspiciousActivity: true,
  blockOnDangerousPatterns: true,
  maxRequestSize: 1024 * 1024, // 1MB
  trustedIPs: ['127.0.0.1', '::1', 'localhost'],
};

/**
 * Middleware principale per la sanitizzazione
 */
export function sanitizationMiddleware(
  config: Partial<SanitizationConfig> = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  return (req: SanitizedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const clientIP = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || '';
    const isTrustedIP = finalConfig.trustedIPs.includes(clientIP);

    // Controlla dimensione richiesta
    const requestSize =
      JSON.stringify(req.body || {}).length +
      JSON.stringify(req.params || {}).length +
      JSON.stringify(req.query || {}).length;

    if (requestSize > finalConfig.maxRequestSize) {
      if (finalConfig.logSuspiciousActivity && !isTrustedIP) {
        suspiciousActivityLogger.logSuspiciousEvent({
          type: 'unusual_pattern',
          severity: 'medium',
          details: {
            ip: clientIP,
            userAgent,
            endpoint: req.originalUrl,
            description: `Request size too large: ${requestSize} bytes`,
            metadata: { requestSize, maxAllowed: finalConfig.maxRequestSize },
          },
        });
      }

      return res.status(413).json({
        error: 'Request Too Large',
        message: 'Request payload exceeds maximum allowed size',
        details: {
          maxSize: finalConfig.maxRequestSize,
          receivedSize: requestSize,
        },
      });
    }

    // Inizializza risultati di validazione
    req.validationResults = {};

    try {
      // Sanitizza body
      if (finalConfig.enableBodySanitization && req.body) {
        const bodyValidation = DataSanitizer.sanitizeRequestData(req.body);
        req.validationResults.body = bodyValidation;

        if (!bodyValidation.isValid) {
          if (finalConfig.blockOnDangerousPatterns) {
            logSuspiciousRequest(
              'body',
              bodyValidation,
              req,
              clientIP,
              userAgent
            );
            return res.status(400).json({
              error: 'Invalid Request Body',
              message: 'Request body contains invalid or dangerous content',
              details: bodyValidation.errors,
            });
          }
        }

        req.sanitizedBody = bodyValidation.sanitizedValue;
      }

      // Sanitizza parametri URL
      if (finalConfig.enableParamsSanitization && req.params) {
        const paramsValidation = DataSanitizer.sanitizeRequestData(req.params);
        req.validationResults.params = paramsValidation;

        if (!paramsValidation.isValid) {
          if (finalConfig.blockOnDangerousPatterns) {
            logSuspiciousRequest(
              'params',
              paramsValidation,
              req,
              clientIP,
              userAgent
            );
            return res.status(400).json({
              error: 'Invalid URL Parameters',
              message: 'URL parameters contain invalid or dangerous content',
              details: paramsValidation.errors,
            });
          }
        }

        req.sanitizedParams = paramsValidation.sanitizedValue;
      }

      // Sanitizza query string
      if (finalConfig.enableQuerySanitization && req.query) {
        const queryValidation = DataSanitizer.sanitizeRequestData(req.query);
        req.validationResults.query = queryValidation;

        if (!queryValidation.isValid) {
          if (finalConfig.blockOnDangerousPatterns) {
            logSuspiciousRequest(
              'query',
              queryValidation,
              req,
              clientIP,
              userAgent
            );
            return res.status(400).json({
              error: 'Invalid Query Parameters',
              message: 'Query parameters contain invalid or dangerous content',
              details: queryValidation.errors,
            });
          }
        }

        req.sanitizedQuery = queryValidation.sanitizedValue;
      }

      // Log warnings per IP non fidati
      if (!isTrustedIP && finalConfig.logSuspiciousActivity) {
        const allWarnings = [
          ...(req.validationResults.body?.warnings || []),
          ...(req.validationResults.params?.warnings || []),
          ...(req.validationResults.query?.warnings || []),
        ];

        if (allWarnings.length > 0) {
          suspiciousActivityLogger.logSuspiciousEvent({
            type: 'suspicious_user_agent',
            severity: 'low',
            details: {
              ip: clientIP,
              userAgent,
              endpoint: req.originalUrl,
              description: `Sanitization warnings: ${allWarnings.join(', ')}`,
              metadata: { warnings: allWarnings },
            },
          });
        }
      }

      // Aggiungi header di sicurezza per tracking
      res.setHeader('X-Request-Sanitized', 'true');
      res.setHeader('X-Sanitization-Time', `${Date.now() - startTime}ms`);

      next();
    } catch (error) {
      console.error('Sanitization middleware error:', error);

      if (finalConfig.logSuspiciousActivity) {
        suspiciousActivityLogger.logSuspiciousEvent({
          type: 'repeated_failures',
          severity: 'high',
          details: {
            ip: clientIP,
            userAgent,
            endpoint: req.originalUrl,
            description: `Sanitization middleware error: ${error}`,
            metadata: { error: String(error) },
          },
        });
      }

      return res.status(500).json({
        error: 'Request Processing Error',
        message: 'Unable to process request safely',
      });
    }
  };

  /**
   * Helper per loggare richieste sospette
   */
  function logSuspiciousRequest(
    section: string,
    validation: ValidationResult,
    req: SanitizedRequest,
    clientIP: string,
    userAgent: string
  ) {
    if (!finalConfig.logSuspiciousActivity) return;

    const severity = validation.errors.some(
      error =>
        error.toLowerCase().includes('injection') ||
        error.toLowerCase().includes('xss') ||
        error.toLowerCase().includes('dangerous')
    )
      ? 'critical'
      : 'high';

    suspiciousActivityLogger.logSuspiciousEvent({
      type: 'rate_limit_abuse', // Tipo generico per attacchi
      severity,
      details: {
        ip: clientIP,
        userAgent,
        endpoint: req.originalUrl,
        description: `Dangerous patterns in ${section}: ${validation.errors.join(', ')}`,
        metadata: {
          section,
          errors: validation.errors,
          originalData: validation.metadata?.originalValue,
        },
      },
    });
  }
}

/**
 * Middleware specifico per validazione ticker symbols
 */
export function tickerValidationMiddleware(
  req: SanitizedRequest,
  res: Response,
  next: NextFunction
) {
  const { symbol } = req.params;

  if (!symbol) {
    return res.status(400).json({
      error: 'Missing Symbol',
      message: 'Ticker symbol is required',
    });
  }

  const validation = DataSanitizer.validateTicker(symbol, {
    maxLength: 10,
    enforceUppercase: true,
    allowCrypto: true,
    allowFutures: false,
  });

  if (!validation.isValid) {
    const clientIP = req.ip || 'unknown';

    suspiciousActivityLogger.logSuspiciousEvent({
      type: 'suspicious_user_agent',
      severity: 'medium',
      details: {
        ip: clientIP,
        userAgent: req.get('user-agent') || '',
        endpoint: req.originalUrl,
        description: `Invalid ticker symbol: ${symbol}`,
        metadata: { originalSymbol: symbol, errors: validation.errors },
      },
    });

    return res.status(400).json({
      error: 'Invalid Ticker Symbol',
      message: 'The provided ticker symbol is not valid',
      details: validation.errors,
      suggestions: 'Use valid stock symbols like AAPL, MSFT, GOOGL',
    });
  }

  // Sostituisci il simbolo con la versione sanitizzata
  req.params.symbol = validation.sanitizedValue as string;
  req.sanitizedParams = {
    ...req.sanitizedParams,
    symbol: validation.sanitizedValue,
  };

  if (validation.warnings.length > 0) {
    res.setHeader('X-Ticker-Warnings', validation.warnings.join('; '));
  }

  next();
}

/**
 * Middleware per validazione date ranges
 */
export function dateRangeValidationMiddleware(
  req: SanitizedRequest,
  res: Response,
  next: NextFunction
) {
  const { startDate, endDate, from, to } = req.query;

  // Supporta diverse convenzioni di naming
  const start = startDate || from;
  const end = endDate || to;

  if (start && end) {
    const validation = DataSanitizer.validateDateRange(
      start as string,
      end as string,
      {
        maxRangeDays: 365 * 5, // 5 anni max
        allowFutureDates: false,
      }
    );

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid Date Range',
        message: 'The provided date range is not valid',
        details: validation.errors,
        format: 'Use YYYY-MM-DD format',
      });
    }

    // Sostituisci con date sanitizzate
    const sanitizedDates = validation.sanitizedValue as {
      startDate: string;
      endDate: string;
    };
    req.query.startDate = sanitizedDates.startDate;
    req.query.endDate = sanitizedDates.endDate;
    req.sanitizedQuery = {
      ...req.sanitizedQuery,
      startDate: sanitizedDates.startDate,
      endDate: sanitizedDates.endDate,
    };

    if (validation.warnings.length > 0) {
      res.setHeader('X-Date-Warnings', validation.warnings.join('; '));
    }
  }

  next();
}

/**
 * Middleware per validazione parametri numerici
 */
export function numericValidationMiddleware(
  fieldName: string,
  type: 'price' | 'quantity' | 'percentage' | 'generic' = 'generic'
) {
  return (req: SanitizedRequest, res: Response, next: NextFunction) => {
    const value = req.query[fieldName] || req.body?.[fieldName];

    if (value !== undefined && value !== null && value !== '') {
      const validation = DataSanitizer.validateNumericInput(value, type, {
        allowNegative: type === 'percentage',
      });

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid Numeric Value',
          message: `Invalid ${type} value for ${fieldName}`,
          details: validation.errors,
        });
      }

      // Sostituisci con valore sanitizzato
      if (req.query[fieldName] !== undefined) {
        req.query[fieldName] = validation.sanitizedValue as string;
        req.sanitizedQuery = {
          ...req.sanitizedQuery,
          [fieldName]: validation.sanitizedValue,
        };
      }
      if (req.body?.[fieldName] !== undefined) {
        req.body[fieldName] = validation.sanitizedValue;
        req.sanitizedBody = {
          ...req.sanitizedBody,
          [fieldName]: validation.sanitizedValue,
        };
      }
    }

    next();
  };
}

export default sanitizationMiddleware;
