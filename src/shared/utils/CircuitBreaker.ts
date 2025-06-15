export enum CircuitBreakerState {
  CLOSED = 'CLOSED',     // Normal operation, requests pass through
  OPEN = 'OPEN',         // Circuit is open, requests are blocked
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening (default: 3)
  recoveryTimeout: number;     // Time to wait before trying again in ms (default: 5 minutes)
  successThreshold: number;    // Number of successes needed to close from half-open (default: 1)
  monitoringPeriod: number;    // Time window for counting failures in ms (default: 1 minute)
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  nextAttemptTime: number | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,        // 3 failures trigger OPEN state
  recoveryTimeout: 5 * 60 * 1000,  // 5 minutes in milliseconds
  successThreshold: 1,        // 1 success needed to close from half-open
  monitoringPeriod: 60 * 1000 // 1 minute monitoring window
};

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private nextAttemptTime: number | null = null;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private readonly config: CircuitBreakerConfig;
  private readonly name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if we can make the request
    if (!this.canExecute()) {
      const timeUntilRetry = this.getTimeUntilNextAttempt();
      throw new CircuitBreakerError(
        `Circuit breaker is OPEN for ${this.name}. Next attempt in ${Math.ceil(timeUntilRetry / 1000)}s`,
        this.state,
        timeUntilRetry
      );
    }

    this.totalRequests++;

    try {
      // Execute the operation
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if the circuit breaker allows execution
   */
  private canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        if (this.nextAttemptTime && now >= this.nextAttemptTime) {
          this.transitionToHalfOpen();
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    this.totalSuccesses++;

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        // Reset failure count on success in closed state
        this.resetFailureCount();
        break;

      case CircuitBreakerState.HALF_OPEN:
        this.successCount++;
        if (this.successCount >= this.config.successThreshold) {
          this.transitionToClosed();
        }
        break;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.totalFailures++;
    this.failureCount++;

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        if (this.failureCount >= this.config.failureThreshold) {
          this.transitionToOpen();
        }
        break;

      case CircuitBreakerState.HALF_OPEN:
        this.transitionToOpen();
        break;
    }
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.resetFailureCount();
    this.successCount = 0;
    this.nextAttemptTime = null;
    console.log(`[CircuitBreaker:${this.name}] Transitioned to CLOSED state`);
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    console.log(`[CircuitBreaker:${this.name}] Transitioned to OPEN state. Next attempt at ${new Date(this.nextAttemptTime).toLocaleTimeString()}`);
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.successCount = 0;
    console.log(`[CircuitBreaker:${this.name}] Transitioned to HALF_OPEN state`);
  }

  /**
   * Reset failure count (used when cleaning old failures or on success)
   */
  private resetFailureCount(): void {
    this.failureCount = 0;
  }

  /**
   * Get time until next attempt is allowed
   */
  getTimeUntilNextAttempt(): number {
    if (this.state !== CircuitBreakerState.OPEN || !this.nextAttemptTime) {
      return 0;
    }
    return Math.max(0, this.nextAttemptTime - Date.now());
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses
    };
  }

  /**
   * Get circuit breaker name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Force reset the circuit breaker to CLOSED state (for testing/admin)
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttemptTime = null;
    console.log(`[CircuitBreaker:${this.name}] Reset to CLOSED state`);
  }

  /**
   * Force open the circuit breaker (for testing/maintenance)
   */
  forceOpen(): void {
    this.transitionToOpen();
  }

  /**
   * Check if circuit breaker is healthy (not in OPEN state)
   */
  isHealthy(): boolean {
    return this.state !== CircuitBreakerState.OPEN;
  }

  /**
   * Get failure rate as percentage
   */
  getFailureRate(): number {
    if (this.totalRequests === 0) return 0;
    return (this.totalFailures / this.totalRequests) * 100;
  }
}

/**
 * Custom error class for circuit breaker
 */
export class CircuitBreakerError extends Error {
  public readonly state: CircuitBreakerState;
  public readonly timeUntilRetry: number;

  constructor(message: string, state: CircuitBreakerState, timeUntilRetry: number = 0) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.state = state;
    this.timeUntilRetry = timeUntilRetry;
  }
}

/**
 * Circuit breaker registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breakers
   */
  getAllBreakers(): CircuitBreaker[] {
    return Array.from(this.breakers.values());
  }

  /**
   * Get circuit breaker statistics for all breakers
   */
  getAllStats(): { [name: string]: CircuitBreakerStats } {
    const stats: { [name: string]: CircuitBreakerStats } = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Remove a circuit breaker
   */
  removeBreaker(name: string): boolean {
    return this.breakers.delete(name);
  }

  /**
   * Get health status of all breakers
   */
  getOverallHealth(): boolean {
    return Array.from(this.breakers.values()).every(breaker => breaker.isHealthy());
  }
}

// Default circuit breakers for common financial APIs
export const createDefaultBreakers = () => {
  const registry = CircuitBreakerRegistry.getInstance();
  
  // Alpha Vantage - more conservative due to rate limits
  registry.getBreaker('alpha-vantage', {
    failureThreshold: 2,
    recoveryTimeout: 10 * 60 * 1000, // 10 minutes
    successThreshold: 1
  });

  // Yahoo Finance - standard configuration
  registry.getBreaker('yahoo-finance', {
    failureThreshold: 3,
    recoveryTimeout: 5 * 60 * 1000, // 5 minutes
    successThreshold: 1
  });

  // Backend API - quick recovery
  registry.getBreaker('backend-api', {
    failureThreshold: 3,
    recoveryTimeout: 2 * 60 * 1000, // 2 minutes
    successThreshold: 1
  });

  return registry;
}; 
