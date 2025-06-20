/**
 * STUDENT ANALYST - API Proxy Service
 * ==================================
 *
 * Sistema di proxy sicuro per le chiamate API che:
 * - Nasconde completamente le API keys dal frontend
 * - Fa da intermediario per Alpha Vantage e Yahoo Finance
 * - Implementa caching intelligente per performance
 * - Monitora e logga tutti gli accessi
 * - Supporta rotazione delle chiavi
 */

import { Request, Response } from 'express';

export interface ApiKeyConfig {
  primary: string;
  backup?: string;
  lastRotated: Date;
  rotationInterval: number; // millisecondi
  usageCount: number;
  maxUsage: number;
}

export interface ApiCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
  source: 'alpha-vantage' | 'yahoo-finance' | 'cache';
  timestamp: Date;
  responseTime: number;
  keyUsed?: string;
}

export interface ApiUsageLog {
  timestamp: Date;
  endpoint: string;
  ip: string;
  userAgent: string;
  success: boolean;
  responseTime: number;
  keyRotated?: boolean;
  suspicious?: boolean;
  errorMessage?: string;
}

/**
 * Gestione sicura delle API keys con rotazione
 */
class ApiKeyManager {
  private alphaVantageKeys: ApiKeyConfig;
  private usageLogs: ApiUsageLog[] = [];
  private cache: Map<string, { data: unknown; timestamp: Date; ttl: number }> =
    new Map();

  constructor() {
    this.alphaVantageKeys = {
      primary: process.env.VITE_API_KEY_ALPHA_VANTAGE || '',
      backup: process.env.VITE_API_KEY_ALPHA_VANTAGE_BACKUP || '',
      lastRotated: new Date(),
      rotationInterval: 24 * 60 * 60 * 1000, // 24 ore
      usageCount: 0,
      maxUsage: 20, // Lasciamo margine sui 25 al giorno
    };
  }

  /**
   * Ottiene la chiave API attualmente attiva
   */
  private getCurrentApiKey(): string {
    const config = this.alphaVantageKeys;

    // Controlla se è tempo di rotazione
    const timeSinceRotation = Date.now() - config.lastRotated.getTime();
    if (
      timeSinceRotation > config.rotationInterval ||
      config.usageCount >= config.maxUsage
    ) {
      this.rotateApiKey();
    }

    return config.primary;
  }

  /**
   * Rotazione automatica delle chiavi API
   */
  private rotateApiKey(): void {
    const config = this.alphaVantageKeys;

    if (config.backup && config.backup !== config.primary) {
      // Scambia primary con backup
      const temp = config.primary;
      config.primary = config.backup;
      config.backup = temp;

      config.lastRotated = new Date();
      config.usageCount = 0;

      console.log(`🔄 API Key rotated at ${config.lastRotated.toISOString()}`);

      // Log della rotazione
      this.logApiUsage({
        timestamp: new Date(),
        endpoint: 'key-rotation',
        ip: 'system',
        userAgent: 'api-key-manager',
        success: true,
        responseTime: 0,
        keyRotated: true,
      });
    } else {
      console.warn('⚠️  API Key rotation failed: no backup key available');
    }
  }

  /**
   * Incrementa il contatore di utilizzo
   */
  private incrementUsage(): void {
    this.alphaVantageKeys.usageCount++;
  }

  /**
   * Verifica se la chiave è valida (non espone la chiave)
   */
  async validateApiKey(): Promise<boolean> {
    const key = this.getCurrentApiKey();
    if (!key || key === 'your_alpha_vantage_api_key_here') {
      return false;
    }

    try {
      // Test call semplice che non consuma quota
      const testUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=1min&outputsize=compact&apikey=${key}`;
      const response = await fetch(testUrl);
      const data = await response.json();

      // Controlla se la risposta contiene errori di API key
      if (data['Error Message'] || data['Note']) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('API Key validation failed:', error);
      return false;
    }
  }

  /**
   * Chiamata diretta Alpha Vantage tramite proxy sicuro
   * Utilizzato dal nostro AlphaVantageService
   */
  async callAlphaVantageAPI(
    queryParams: Record<string, string>
  ): Promise<unknown> {
    const apiKey = this.getCurrentApiKey();

    if (!apiKey || apiKey === 'your_alpha_vantage_api_key_here') {
      throw new Error('Alpha Vantage API key not configured');
    }

    // Costruisce URL con parametri
    const baseUrl = 'https://www.alphavantage.co/query';
    const urlParams = new URLSearchParams({
      ...queryParams,
      apikey: apiKey,
    });
    const fullUrl = `${baseUrl}?${urlParams.toString()}`;

    // Genera cache key
    const cacheKey = `av_${Object.entries(queryParams)
      .filter(([key]) => key !== 'apikey')
      .map(([key, value]) => `${key}=${value}`)
      .join('&')}`;

    const startTime = Date.now();

    try {
      // Controlla cache prima
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl) {
        console.log(`📦 Cache hit for Alpha Vantage: ${cacheKey}`);
        return {
          data: cached.data,
          source: 'cache',
          responseTime: Date.now() - startTime,
          cached: true,
        };
      }

      // Esegui chiamata API
      const response = await fetch(fullUrl);
      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Incrementa utilizzo
      this.incrementUsage();

      // Determina TTL basato sui dati
      let ttl = 300000; // 5 minuti default
      if (queryParams.function?.includes('INTRADAY')) {
        ttl = 60000; // 1 minuto per intraday
      } else if (queryParams.function?.includes('DAILY')) {
        ttl = 300000; // 5 minuti per daily
      } else if (
        queryParams.function?.includes('WEEKLY') ||
        queryParams.function?.includes('MONTHLY')
      ) {
        ttl = 3600000; // 1 ora per weekly/monthly
      }

      // Salva in cache solo se è una risposta valida
      const dataAsRecord = data as Record<string, unknown>;
      if (
        !dataAsRecord['Error Message'] &&
        !dataAsRecord['Note'] &&
        !dataAsRecord['Information']
      ) {
        this.cache.set(cacheKey, {
          data,
          timestamp: new Date(),
          ttl,
        });
      }

      return {
        data,
        source: 'alpha-vantage',
        responseTime,
        cached: false,
      };
    } catch (error) {
      console.error('Alpha Vantage API call failed:', error);
      throw error;
    }
  }

  /**
   * Ottiene dati con gestione intelligente della cache
   */
  async fetchWithCache(
    url: string,
    cacheKey: string,
    ttl: number = 300000
  ): Promise<unknown> {
    // Controlla cache prima
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl) {
      console.log(`📦 Cache hit for ${cacheKey}`);
      return { data: cached.data, source: 'cache' };
    }

    // Esegui chiamata API
    const startTime = Date.now();
    const apiKey = this.getCurrentApiKey();
    const fullUrl = url.includes('apikey=') ? url : `${url}&apikey=${apiKey}`;

    try {
      const response = await fetch(fullUrl);
      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Incrementa utilizzo
      this.incrementUsage();

      // Salva in cache solo se è una risposta valida
      if (!data['Error Message'] && !data['Note']) {
        this.cache.set(cacheKey, {
          data,
          timestamp: new Date(),
          ttl,
        });
      }

      return { data, source: 'alpha-vantage', responseTime };
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  /**
   * Log degli utilizzi API per monitoraggio
   */
  logApiUsage(log: ApiUsageLog): void {
    this.usageLogs.push(log);

    // Mantieni solo gli ultimi 1000 log
    if (this.usageLogs.length > 1000) {
      this.usageLogs = this.usageLogs.slice(-1000);
    }

    // Rileva pattern sospetti
    this.detectSuspiciousActivity(log);
  }

  /**
   * Rileva attività sospette (molte richieste, errori ripetuti, etc.)
   */
  private detectSuspiciousActivity(log: ApiUsageLog): void {
    const recentLogs = this.usageLogs.filter(
      l => Date.now() - l.timestamp.getTime() < 300000 // ultimi 5 minuti
    );

    // Troppi errori dallo stesso IP
    const sameIpErrors = recentLogs.filter(
      l => l.ip === log.ip && !l.success
    ).length;

    if (sameIpErrors > 5) {
      console.warn(
        `🚨 Suspicious activity detected from IP ${log.ip}: ${sameIpErrors} errors in 5 minutes`
      );
      log.suspicious = true;

      // TODO: Implementare blocco IP temporaneo
    }

    // Troppi accessi dallo stesso IP
    const sameIpRequests = recentLogs.filter(l => l.ip === log.ip).length;
    if (sameIpRequests > 50) {
      console.warn(
        `🚨 High request volume from IP ${log.ip}: ${sameIpRequests} requests in 5 minutes`
      );
      log.suspicious = true;
    }
  }

  /**
   * Statistiche di utilizzo per monitoring
   */
  getUsageStats(): unknown {
    const now = Date.now();
    const last24h = this.usageLogs.filter(
      l => now - l.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    return {
      currentKeyUsage: this.alphaVantageKeys.usageCount,
      maxKeyUsage: this.alphaVantageKeys.maxUsage,
      lastRotated: this.alphaVantageKeys.lastRotated,
      requests24h: last24h.length,
      errors24h: last24h.filter(l => !l.success).length,
      avgResponseTime:
        last24h.length > 0
          ? last24h.reduce((sum, l) => sum + l.responseTime, 0) / last24h.length
          : 0,
      cacheSize: this.cache.size,
      suspiciousRequests: this.usageLogs.filter(l => l.suspicious).length,
    };
  }

  /**
   * Pulizia cache periodica
   */
  cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((value, key) => {
      if (now - value.timestamp.getTime() > value.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned ${keysToDelete.length} expired cache entries`);
    }
  }
}

// Istanza globale del manager
export const apiKeyManager = new ApiKeyManager();

/**
 * Service per gestire le chiamate API con sicurezza
 */
export class ApiProxyService {
  /**
   * GET /api/v1/alpha-vantage
   * Proxy endpoint per Alpha Vantage API - usato dal nostro AlphaVantageService
   */
  static async alphaVantageProxy(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    try {
      // Estrai parametri query
      const queryParams = req.query as Record<string, string>;

      // Validazione parametri base
      if (!queryParams.function) {
        res.status(400).json({
          error: 'Missing Function',
          message: 'Alpha Vantage function parameter is required',
          example: '?function=TIME_SERIES_DAILY&symbol=AAPL',
        });
        return;
      }

      if (!queryParams.symbol) {
        res.status(400).json({
          error: 'Missing Symbol',
          message: 'Symbol parameter is required',
          example: '?function=TIME_SERIES_DAILY&symbol=AAPL',
        });
        return;
      }

      // Chiama Alpha Vantage tramite manager sicuro
      const result = await apiKeyManager.callAlphaVantageAPI(queryParams);

      // Log dell'accesso
      apiKeyManager.logApiUsage({
        timestamp: new Date(),
        endpoint: 'alpha-vantage-proxy',
        ip: clientIp,
        userAgent,
        success: true,
        responseTime: Date.now() - startTime,
      });

      // Restituisci dati
      res.json((result as any).data);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Log dell'errore
      apiKeyManager.logApiUsage({
        timestamp: new Date(),
        endpoint: 'alpha-vantage-proxy',
        ip: clientIp,
        userAgent,
        success: false,
        responseTime,
        errorMessage,
      });

      console.error('Alpha Vantage proxy error:', error);

      res.status(500).json({
        error: 'Alpha Vantage API Error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/quote/:symbol - Ottiene quotazione corrente
   */
  static async getQuote(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const { symbol } = req.params;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    try {
      if (!symbol) {
        res.status(400).json({
          error: 'Missing Symbol',
          message: 'Symbol parameter is required',
        });
      }

      // Usa Alpha Vantage GLOBAL_QUOTE per quotazioni rapide
      const cacheKey = `quote_${symbol.toUpperCase()}`;
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}`;

      const result = await apiKeyManager.fetchWithCache(url, cacheKey, 60000); // 1 minuto cache

      // Log dell'accesso
      apiKeyManager.logApiUsage({
        timestamp: new Date(),
        endpoint: `/quote/${symbol}`,
        ip: clientIp,
        userAgent,
        success: true,
        responseTime: Date.now() - startTime,
      });

      // Verifica se ci sono dati validi
      const globalQuote = typeof result === 'object' && result !== null && 'data' in result && typeof (result as any).data === 'object' && (result as any).data !== null ? (result as any).data['Global Quote'] : null;
      if (!globalQuote || Object.keys(globalQuote).length === 0) {
        res.status(404).json({
          error: 'Symbol Not Found',
          message: `No data available for symbol: ${symbol}`,
          symbol: symbol.toUpperCase(),
        });
      }

      // Formato risposta standardizzato
      const formattedData = {
        success: true,
        symbol: globalQuote['01. symbol'] || symbol.toUpperCase(),
        price: parseFloat(globalQuote['05. price'] || '0'),
        change: parseFloat(globalQuote['09. change'] || '0'),
        changePercent: globalQuote['10. change percent'] || '0%',
        previousClose: parseFloat(globalQuote['08. previous close'] || '0'),
        open: parseFloat(globalQuote['02. open'] || '0'),
        high: parseFloat(globalQuote['03. high'] || '0'),
        low: parseFloat(globalQuote['04. low'] || '0'),
        volume: parseInt(globalQuote['06. volume'] || '0'),
        latestTradingDay: globalQuote['07. latest trading day'] || '',
        source: typeof result === 'object' && result !== null && 'source' in result ? (result as any).source : 'unknown',
        timestamp: new Date().toISOString(),
      };

      res.json(formattedData);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      apiKeyManager.logApiUsage({
        timestamp: new Date(),
        endpoint: `/quote/${symbol}`,
        ip: clientIp,
        userAgent,
        success: false,
        responseTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error(`Quote error for ${symbol}:`, error);

      res.status(500).json({
        error: 'Quote Fetch Error',
        message: 'Failed to fetch quote data',
        symbol: symbol,
      });
    }
  }

  /**
   * GET /api/v1/historical/:symbol - Ottiene dati storici
   */
  static async getHistoricalData(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const { symbol } = req.params;
    const { interval = 'daily', outputsize = 'compact' } = req.query;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    try {
      if (!symbol) {
        res.status(400).json({
          error: 'Missing Symbol',
          message: 'Symbol parameter is required',
        });
      }

      // Mappa interval a funzione Alpha Vantage
      let avFunction = 'TIME_SERIES_DAILY';
      if (
        interval === '1min' ||
        interval === '5min' ||
        interval === '15min' ||
        interval === '30min' ||
        interval === '60min'
      ) {
        avFunction = 'TIME_SERIES_INTRADAY';
      } else if (interval === 'weekly') {
        avFunction = 'TIME_SERIES_WEEKLY';
      } else if (interval === 'monthly') {
        avFunction = 'TIME_SERIES_MONTHLY';
      }

      // Cache key
      const cacheKey = `hist_${symbol}_${interval}_${outputsize}`;

      // Costruisci URL
      let url = `https://www.alphavantage.co/query?function=${avFunction}&symbol=${symbol}&outputsize=${outputsize}`;
      if (avFunction === 'TIME_SERIES_INTRADAY') {
        url += `&interval=${interval}`;
      }

      // Cache TTL basato sull'interval
      let cacheTTL = 300000; // 5 minuti default
      if (interval === '1min' || interval === '5min') {
        cacheTTL = 60000; // 1 minuto per alta frequenza
      } else if (interval === 'daily') {
        cacheTTL = 300000; // 5 minuti per daily
      } else {
        cacheTTL = 3600000; // 1 ora per weekly/monthly
      }

      const result = await apiKeyManager.fetchWithCache(
        url,
        cacheKey,
        cacheTTL
      );

      // Log dell'accesso
      apiKeyManager.logApiUsage({
        timestamp: new Date(),
        endpoint: `/historical/${symbol}`,
        ip: clientIp,
        userAgent,
        success: true,
        responseTime: Date.now() - startTime,
      });

      // Verifica dati
      const keys = Object.keys(result.data);
      const dataKey = keys.find(key => key.includes('Time Series'));

      if (!dataKey || !result.data[dataKey]) {
        res.status(404).json({
          error: 'No Data Available',
          message: `No historical data available for symbol: ${symbol}`,
          symbol: symbol.toUpperCase(),
          interval,
        });
      }

      // Formato risposta
      const formattedData = {
        success: true,
        symbol: symbol.toUpperCase(),
        interval,
        outputsize,
        data: result.data[dataKey],
        metadata: result.data['Meta Data'] || {},
        source: typeof result === 'object' && result !== null && 'source' in result ? (result as any).source : 'unknown',
        timestamp: new Date().toISOString(),
      };

      res.json(formattedData);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      apiKeyManager.logApiUsage({
        timestamp: new Date(),
        endpoint: `/historical/${symbol}`,
        ip: clientIp,
        userAgent,
        success: false,
        responseTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error(`Historical data error for ${symbol}:`, error);

      res.status(500).json({
        error: 'Historical Data Error',
        message: 'Failed to fetch historical data',
        symbol: symbol,
        interval,
      });
    }
  }

  /**
   * GET /api/v1/admin/stats - Statistiche sistema
   */
  static async getApiStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = apiKeyManager.getUsageStats();

      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        error: 'Stats Error',
        message: 'Failed to get API statistics',
      });
    }
  }

  /**
   * GET /api/v1/admin/connection-test - Test connettività
   */
  static async testApiConnection(req: Request, res: Response): Promise<void> {
    try {
      const testResult = await apiKeyManager.validateApiKey();

      res.json({
        success: true,
        connected: testResult,
        message: testResult
          ? 'API connection successful'
          : 'API connection failed',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Cleanup automatico della cache ogni 15 minuti
setInterval(
  () => {
    apiKeyManager.cleanupCache();
  },
  15 * 60 * 1000
);
