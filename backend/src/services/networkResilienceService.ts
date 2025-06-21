/**
 * STUDENT ANALYST - Network Resilience Service
 * =============================================
 *
 * Sistema di resilienza di rete che gestisce timeout, circuit breaker,
 * fallback automatico e recovery intelligente per le API finanziarie.
 */

import { EventEmitter } from 'events';
import {
  ClassifiedError,
  ErrorCodeHandler,
  ErrorContext,
} from './errorCodeHandler';

/**
 * Stato del Circuit Breaker
 */
export enum CircuitBreakerState {
  CLOSED = 'closed', // Normale operazione
  OPEN = 'open', // Circuit aperto, blocca richieste
  HALF_OPEN = 'half_open', // Stato di test per recovery
}

/**
 * Configurazione del Circuit Breaker
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
  halfOpenSuccessThreshold: number;
}

/**
 * Statistiche del Circuit Breaker
 */
export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  nextRetryTime?: number;
  totalRequests: number;
  successRate: number;
}

/**
 * Configurazione per resilienza di rete
 */
export interface NetworkResilienceConfig {
  timeout: number;
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  circuitBreaker: CircuitBreakerConfig;
  healthCheckInterval: number;
  enableFallback: boolean;
}

/**
 * Informazioni su servizio alternativo
 */
export interface FallbackService {
  name: string;
  endpoint: string;
  priority: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: number;
  responseTime: number;
}

/**
 * Risultato di operazione con resilienza
 */
export interface ResilientOperationResult<T> {
  success: boolean;
  data?: T;
  error?: ClassifiedError;
  source: string;
  responseTime: number;
  retryCount: number;
  fromCache: boolean;
  fallbackUsed: boolean;
}

/**
 * Circuit Breaker per gestire errori di servizio
 */
class CircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: number;
  private halfOpenCalls: number = 0;
  private totalRequests: number = 0;

  constructor(
    private config: CircuitBreakerConfig,
    private serviceName: string
  ) {
    super();
  }

  /**
   * Esegue operazione attraverso il circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.halfOpenCalls = 0;
        this.emit('half-open', this.serviceName);
      } else {
        throw new Error(
          `Circuit breaker is OPEN for ${this.serviceName}. Next retry in ${this.getTimeToNextRetry()}ms`
        );
      }
    }

    if (
      this.state === CircuitBreakerState.HALF_OPEN &&
      this.halfOpenCalls >= this.config.halfOpenMaxCalls
    ) {
      throw new Error(
        `Circuit breaker HALF_OPEN limit exceeded for ${this.serviceName}`
      );
    }

    this.totalRequests++;
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.halfOpenCalls++;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Gestisce successo dell'operazione
   */
  private onSuccess(): void {
    this.successCount++;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successCount >= this.config.halfOpenSuccessThreshold) {
        this.reset();
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
    }
  }

  /**
   * Gestisce fallimento dell'operazione
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.open();
    } else if (
      this.state === CircuitBreakerState.CLOSED &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this.open();
    }
  }

  /**
   * Apre il circuit breaker
   */
  private open(): void {
    this.state = CircuitBreakerState.OPEN;
    this.emit('open', this.serviceName, this.getStats());
  }

  /**
   * Resetta il circuit breaker
   */
  private reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.emit('reset', this.serviceName);
  }

  /**
   * Verifica se è il momento di tentare reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  /**
   * Calcola tempo al prossimo tentativo
   */
  private getTimeToNextRetry(): number {
    if (!this.lastFailureTime) return 0;
    const elapsed = Date.now() - this.lastFailureTime;
    return Math.max(0, this.config.recoveryTimeout - elapsed);
  }

  /**
   * Ottieni statistiche del circuit breaker
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextRetryTime:
        this.state === CircuitBreakerState.OPEN
          ? this.lastFailureTime! + this.config.recoveryTimeout
          : undefined,
      totalRequests: this.totalRequests,
      successRate:
        this.totalRequests > 0 ? this.successCount / this.totalRequests : 0,
    };
  }

  /**
   * Forza apertura del circuit breaker
   */
  forceOpen(): void {
    this.open();
  }

  /**
   * Forza chiusura del circuit breaker
   */
  forceClose(): void {
    this.reset();
  }
}

/**
 * Servizio principale di resilienza di rete
 */
export class NetworkResilienceService extends EventEmitter {
  private static instance: NetworkResilienceService;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private fallbackServices: Map<string, FallbackService[]> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private errorHandler: ErrorCodeHandler;

  private constructor(private config: NetworkResilienceConfig) {
    super();
    this.errorHandler = ErrorCodeHandler.getInstance();
    this.initializeHealthChecking();
  }

  public static getInstance(
    config?: NetworkResilienceConfig
  ): NetworkResilienceService {
    if (!NetworkResilienceService.instance) {
      if (!config) {
        throw new Error(
          'NetworkResilienceService requires configuration on first initialization'
        );
      }
      NetworkResilienceService.instance = new NetworkResilienceService(config);
    }
    return NetworkResilienceService.instance;
  }

  /**
   * Esegue operazione con resilienza completa
   */
  async executeResilient<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options?: {
      timeout?: number;
      maxRetries?: number;
      enableCircuitBreaker?: boolean;
      enableFallback?: boolean;
      cacheKey?: string;
    }
  ): Promise<ResilientOperationResult<T>> {
    const startTime = Date.now();
    const serviceName = context.apiService;
    let retryCount = 0;
    let lastError: Error;
    const fallbackUsed = false;

    // Configurazione specifica per questa operazione
    const opConfig = {
      timeout: options?.timeout || this.config.timeout,
      maxRetries: options?.maxRetries || this.config.maxRetries,
      enableCircuitBreaker: options?.enableCircuitBreaker !== false,
      enableFallback:
        options?.enableFallback !== false && this.config.enableFallback,
    };

    // Ottieni o crea circuit breaker per il servizio
    const circuitBreaker = this.getOrCreateCircuitBreaker(serviceName);

    // Tentativo con servizio principale
    for (let attempt = 0; attempt <= opConfig.maxRetries; attempt++) {
      try {
        if (opConfig.enableCircuitBreaker) {
          const result = await circuitBreaker.execute(async () => {
            return await this.executeWithTimeout(operation, opConfig.timeout);
          });

          return {
            success: true,
            data: result,
            source: serviceName,
            responseTime: Date.now() - startTime,
            retryCount: attempt,
            fromCache: false,
            fallbackUsed: false,
          };
        } else {
          const result = await this.executeWithTimeout(
            operation,
            opConfig.timeout
          );
          return {
            success: true,
            data: result,
            source: serviceName,
            responseTime: Date.now() - startTime,
            retryCount: attempt,
            fromCache: false,
            fallbackUsed: false,
          };
        }
      } catch (error) {
        lastError = error as Error;
        retryCount = attempt;

        // Classifica l'errore
        const classifiedError = this.errorHandler.classifyError(
          lastError,
          context
        );

        // Se non è retryable o è l'ultimo tentativo, esci dal loop
        if (!classifiedError.retryable || attempt === opConfig.maxRetries) {
          break;
        }

        // Calcola il ritardo con backoff esponenziale e jitter
        const delay = this.calculateBackoffDelay(retryCount);
        await this.delay(delay);
      }
    }

    // Se abbiamo fallito con il servizio principale, prova fallback
    if (opConfig.enableFallback) {
      const fallbackResult = await this.tryFallbackServices(context);
      if (fallbackResult.success) {
        return {
          ...fallbackResult,
          responseTime: Date.now() - startTime,
          retryCount,
          fallbackUsed: true,
          data: fallbackResult.data as unknown as T,
        };
      }
    }

    // Classifica l'errore finale
    const finalClassifiedError = this.errorHandler.classifyError(
      lastError!,
      context
    );

    return {
      success: false,
      error: finalClassifiedError,
      source: serviceName,
      responseTime: Date.now() - startTime,
      retryCount,
      fromCache: false,
      fallbackUsed,
      data: undefined as T,
    };
  }

  /**
   * Esegue operazione con timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Operation timeout after ${timeout}ms`)),
        timeout
      );
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  /**
   * Calcola delay con backoff esponenziale
   */
  private calculateBackoffDelay(attempt: number): number {
    let delay =
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt);
    delay = Math.min(delay, this.config.maxDelay);

    // Aggiungi jitter se abilitato
    if (this.config.jitter) {
      const jitterAmount = delay * 0.1;
      delay += Math.random() * jitterAmount;
    }

    return Math.round(delay);
  }

  /**
   * Tenta servizi di fallback
   */
  private async tryFallbackServices<T>(
    context: ErrorContext
  ): Promise<ResilientOperationResult<T>> {
    const fallbackServices =
      this.fallbackServices.get(context.apiService) || [];
    const healthyFallbacks = fallbackServices
      .filter(s => s.healthStatus === 'healthy')
      .sort((a, b) => a.priority - b.priority);

    for (const fallback of healthyFallbacks) {
      try {
        // Simula la chiamata al servizio di fallback
        const result = await this.executeResilient(
          () =>
            Promise.resolve(
              `Fallback response from ${fallback.name}` as unknown as T
            ),
          { ...context, apiService: fallback.name },
          { enableFallback: false } // Evita loop di fallback
        );

        if (result.success) {
          result.fallbackUsed = true;
          return result;
        }
      } catch (error) {
        // Logga l'errore del fallback ma continua a provare gli altri
        console.error(`Fallback service ${fallback.name} failed:`, error);
      }
    }

    return {
      success: false,
      source: 'fallback',
      responseTime: 0,
      retryCount: 0,
      fromCache: false,
      fallbackUsed: true,
      data: undefined as unknown as T,
    };
  }

  /**
   * Ottieni o crea circuit breaker per un servizio
   */
  private getOrCreateCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const circuitBreaker = new CircuitBreaker(
        this.config.circuitBreaker,
        serviceName
      );

      // Ascolta eventi del circuit breaker
      circuitBreaker.on('open', (service, stats) => {
        console.warn(`Circuit breaker OPENED for ${service}:`, stats);
        this.emit('circuit-breaker-open', service, stats);
      });

      circuitBreaker.on('half-open', service => {
        console.info(`Circuit breaker HALF-OPEN for ${service}`);
        this.emit('circuit-breaker-half-open', service);
      });

      circuitBreaker.on('reset', service => {
        console.info(`Circuit breaker RESET for ${service}`);
        this.emit('circuit-breaker-reset', service);
      });

      this.circuitBreakers.set(serviceName, circuitBreaker);
    }

    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Registra servizio di fallback
   */
  registerFallbackService(
    primaryService: string,
    fallbackService: FallbackService
  ): void {
    if (!this.fallbackServices.has(primaryService)) {
      this.fallbackServices.set(primaryService, []);
    }
    this.fallbackServices.get(primaryService)?.push(fallbackService);
    console.log(
      `Registered fallback service ${fallbackService.name} for ${primaryService}`
    );
  }

  /**
   * Inizializza health checking per servizi di fallback
   */
  private initializeHealthChecking(): void {
    // Implementazione del health checking periodico
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Esegue health check su tutti i servizi di fallback
   */
  private async performHealthChecks(): Promise<void> {
    const services = Array.from(this.fallbackServices.keys());
    for (const service of services) {
      const fallbacks = this.fallbackServices.get(service) || [];
      for (const fallback of fallbacks) {
        try {
          // Simula una chiamata di health check
          // In un'implementazione reale, qui ci sarebbe una vera chiamata HTTP
          const responseTime = 50 + Math.random() * 100; // Simula 50-150ms
          fallback.healthStatus = 'healthy';
          fallback.responseTime = responseTime;
        } catch (error) {
          fallback.healthStatus = 'unhealthy';
          fallback.responseTime = -1;
        }
        fallback.lastChecked = Date.now();
      }
    }
  }

  /**
   * Ottieni statistiche di tutti i circuit breakers
   */
  getCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    for (const [
      serviceName,
      circuitBreaker,
    ] of this.circuitBreakers.entries()) {
      stats[serviceName] = circuitBreaker.getStats();
    }

    return stats;
  }

  /**
   * Ottieni stato dei servizi di fallback
   */
  getFallbackServicesStatus(): Record<string, FallbackService[]> {
    const status: Record<string, FallbackService[]> = {};

    for (const [primaryService, services] of this.fallbackServices.entries()) {
      status[primaryService] = [...services];
    }

    return status;
  }

  /**
   * Forza reset di un circuit breaker
   */
  resetCircuitBreaker(serviceName: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.forceClose();
      return true;
    }
    return false;
  }

  /**
   * Forza apertura di un circuit breaker
   */
  openCircuitBreaker(serviceName: string): boolean {
    const cb = this.circuitBreakers.get(serviceName);
    if (cb) {
      cb.forceOpen();
      return true;
    }
    return false;
  }

  /**
   * Utility per delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Pulisce tutte le risorse
   */
  cleanup(): void {
    // Pulisci tutti gli interval di health check
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();

    // Pulisci circuit breakers
    this.circuitBreakers.clear();
    this.fallbackServices.clear();
  }
}
