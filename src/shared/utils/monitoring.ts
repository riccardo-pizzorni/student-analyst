/**
 * STUDENT ANALYST - Monitoring System
 * Sistema di monitoraggio completo per tracking di errori, performance e uptime
 * Completamente gratuito e autosufficiente
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Tipi per il sistema di monitoraggio
interface ErrorEvent {
  message: string;
  source: string;
  lineno: number;
  colno: number;
  error: Error | null;
  timestamp: number;
  url: string;
  userAgent: string;
  stack?: string;
}

interface PerformanceMetric {
  type: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'CUSTOM';
  name: string;
  value: number;
  timestamp: number;
  url: string;
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  timestamp: number;
  error?: string;
}

class MonitoringService {
  private errorQueue: ErrorEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private healthStatus = new Map<string, HealthCheck>();
  private isInitialized = false;

  // Inizializzazione del sistema di monitoraggio
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    console.log('🔍 [MONITORING] Initializing Student Analyst monitoring system...');
    
    this.setupErrorTracking();
    this.setupPerformanceMonitoring();
    this.setupHealthChecks();
    this.startMetricsCollection();
    
    this.isInitialized = true;
    console.log('✅ [MONITORING] Monitoring system active');
  }

  // Sistema di tracking errori
  private setupErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        stack: event.error?.stack
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        source: 'promise',
        lineno: 0,
        colno: 0,
        error: null,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        stack: event.reason?.stack || String(event.reason)
      });
    });
  }

  // Sistema di monitoraggio performance
  private setupPerformanceMonitoring(): void {
    // Web Vitals metriche standard
    onCLS((metric: Metric) => this.logPerformanceMetric({
      type: 'CLS',
      name: 'Cumulative Layout Shift',
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href
    }));

    onFID((metric: Metric) => this.logPerformanceMetric({
      type: 'FID',
      name: 'First Input Delay',
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href
    }));

    onFCP((metric: Metric) => this.logPerformanceMetric({
      type: 'FCP',
      name: 'First Contentful Paint',
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href
    }));

    onLCP((metric: Metric) => this.logPerformanceMetric({
      type: 'LCP',
      name: 'Largest Contentful Paint',
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href
    }));

    onTTFB((metric: Metric) => this.logPerformanceMetric({
      type: 'TTFB',
      name: 'Time to First Byte',
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href
    }));

    // Performance Observer per metriche personalizzate
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.logPerformanceMetric({
              type: 'CUSTOM',
              name: 'Page Load Time',
              value: entry.duration,
              timestamp: Date.now(),
              url: window.location.href
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  // Health checks per servizi esterni
  private setupHealthChecks(): void {
    // Check Alpha Vantage API
    this.checkServiceHealth('alpha-vantage', 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=demo');
    
    // Check Yahoo Finance (tramite il nostro backend)
    this.checkServiceHealth('yahoo-finance', `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/health`);
    
    // Check del nostro backend
    this.checkServiceHealth('backend', `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/test`);
    
    // Ripeti i check ogni 5 minuti
    setInterval(() => {
      this.runHealthChecks();
    }, 5 * 60 * 1000);
  }

  // Verifica salute di un servizio
  private async checkServiceHealth(serviceName: string, url: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        timeout: 10000 // 10 secondi timeout
      } as RequestInit);
      
      const responseTime = performance.now() - startTime;
      
      this.healthStatus.set(serviceName, {
        service: serviceName,
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        timestamp: Date.now(),
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
      
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      this.healthStatus.set(serviceName, {
        service: serviceName,
        status: 'down',
        responseTime,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Esegui tutti i health check
  private async runHealthChecks(): Promise<void> {
    console.log('🔍 [MONITORING] Running health checks...');
    
    await Promise.all([
      this.checkServiceHealth('alpha-vantage', 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=demo'),
      this.checkServiceHealth('yahoo-finance', `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/health`),
      this.checkServiceHealth('backend', `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/test`)
    ]);
    
    console.log('✅ [MONITORING] Health checks completed');
  }

  // Avvia la collezione automatica di metriche
  private startMetricsCollection(): void {
    // Invia metriche ogni 30 secondi
    setInterval(() => {
      this.flushMetrics();
    }, 30 * 1000);

    // Flush finale quando la pagina si chiude
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
    });
  }

  // Log di un errore
  logError(error: ErrorEvent): void {
    console.error('🚨 [MONITORING] Error tracked:', error);
    this.errorQueue.push(error);
    
    // Se queue troppo grande, rimuovi gli errori più vecchi
    if (this.errorQueue.length > 100) {
      this.errorQueue = this.errorQueue.slice(-50);
    }
  }

  // Log di una metrica di performance
  logPerformanceMetric(metric: PerformanceMetric): void {
    console.log(`📊 [MONITORING] Performance metric: ${metric.name} = ${metric.value}ms`);
    this.performanceQueue.push(metric);
    
    // Mantieni solo le ultime 50 metriche
    if (this.performanceQueue.length > 50) {
      this.performanceQueue = this.performanceQueue.slice(-25);
    }
  }

  // Timing personalizzato per operazioni specifiche
  async timeOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      this.logPerformanceMetric({
        type: 'CUSTOM',
        name,
        value: duration,
        timestamp: Date.now(),
        url: window.location.href
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.logError({
        message: `Operation '${name}' failed after ${duration}ms: ${error}`,
        source: 'timeOperation',
        lineno: 0,
        colno: 0,
        error: error instanceof Error ? error : null,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw error;
    }
  }

  // Flush delle metriche (invio al sistema di logging)
  private flushMetrics(): void {
    if (this.errorQueue.length === 0 && this.performanceQueue.length === 0) {
      return;
    }

    // In un'implementazione reale, qui manderesti i dati a un servizio di logging
    // Per ora li salviamo in localStorage per debugging
    const metrics = {
      errors: [...this.errorQueue],
      performance: [...this.performanceQueue],
      health: Object.fromEntries(this.healthStatus),
      timestamp: Date.now()
    };

    try {
      localStorage.setItem('student-analyst-metrics', JSON.stringify(metrics));
      console.log(`📡 [MONITORING] Flushed ${this.errorQueue.length} errors and ${this.performanceQueue.length} metrics`);
    } catch (error) {
      console.warn('⚠️ [MONITORING] Failed to save metrics:', error);
    }

    // Pulisci le queue dopo il flush
    this.errorQueue = [];
    this.performanceQueue = [];
  }

  // Ottieni lo stato di salute corrente
  getHealthStatus(): Map<string, HealthCheck> {
    return new Map(this.healthStatus);
  }

  // Ottieni statistiche performance
  getPerformanceStats(): {
    averagePageLoad: number;
    totalErrors: number;
    healthyServices: number;
    totalServices: number;
  } {
    const pageLoadMetrics = this.performanceQueue.filter(m => m.name === 'Page Load Time');
    const averagePageLoad = pageLoadMetrics.length > 0 
      ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length 
      : 0;

    const healthyServices = Array.from(this.healthStatus.values())
      .filter(h => h.status === 'healthy').length;

    return {
      averagePageLoad,
      totalErrors: this.errorQueue.length,
      healthyServices,
      totalServices: this.healthStatus.size
    };
  }
}

// Esporta istanza singleton
export const monitoring = new MonitoringService();

// Hook React per utilizzare il monitoring
export function useMonitoring() {
  return {
    logError: (error: Partial<ErrorEvent>) => monitoring.logError({
      message: '',
      source: '',
      lineno: 0,
      colno: 0,
      error: null,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...error
    }),
    timeOperation: monitoring.timeOperation.bind(monitoring),
    getHealthStatus: monitoring.getHealthStatus.bind(monitoring),
    getPerformanceStats: monitoring.getPerformanceStats.bind(monitoring)
  };
} 