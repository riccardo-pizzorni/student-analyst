/**
 * STUDENT ANALYST - StorageMonitoringService
 * Servizio per monitoraggio stato e quota storage
 */

export interface StorageHealth {
  localStorage: { status: string; usage: number; error?: string };
  sessionStorage: { status: string; usage: number; error?: string };
  indexedDB: { status: string; usage: number; error?: string };
  overall: 'healthy' | 'warning' | 'critical' | 'error';
  lastCheck: number;
  totalUsage: number;
  estimatedQuota: number;
}

export interface StorageQuota {
  localStorage: number;
  sessionStorage: number;
  indexedDB: number;
  total: number;
}

export interface MonitoringConfig {
  checkInterval: number; // milliseconds
  warningThreshold: number; // percentage (0-1)
  criticalThreshold: number; // percentage (0-1)
  enableAutoCheck: boolean;
}

export class StorageMonitoringService {
  private static instance: StorageMonitoringService;
  private isInitialized = false;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private storageHealth: StorageHealth;
  private config: MonitoringConfig;
  private lastQuotaCheck = 0;
  private quotaCache: StorageQuota | null = null;

  // Dependencies (for dependency injection)
  private localStorage: Storage;
  private sessionStorage: Storage;
  private indexedDB: IDBFactory;
  private navigator: Navigator;

  constructor(dependencies?: {
    localStorage?: Storage;
    sessionStorage?: Storage;
    indexedDB?: IDBFactory;
    navigator?: Navigator;
  }) {
    // Dependency injection support
    this.localStorage = dependencies?.localStorage || (typeof window !== 'undefined' ? window.localStorage : {} as Storage);
    this.sessionStorage = dependencies?.sessionStorage || (typeof window !== 'undefined' ? window.sessionStorage : {} as Storage);
    this.indexedDB = dependencies?.indexedDB || (typeof window !== 'undefined' ? window.indexedDB : {} as IDBFactory);
    this.navigator = dependencies?.navigator || (typeof window !== 'undefined' ? window.navigator : {} as Navigator);

    this.config = {
      checkInterval: 30000, // 30 seconds
      warningThreshold: 0.8, // 80%
      criticalThreshold: 0.95, // 95%
      enableAutoCheck: true
    };

    this.storageHealth = this.initializeHealthState();
  }

  public static getInstance(dependencies?: any): StorageMonitoringService {
    if (!StorageMonitoringService.instance) {
      StorageMonitoringService.instance = new StorageMonitoringService(dependencies);
    }
    return StorageMonitoringService.instance;
  }

  /**
   * Inizializza il servizio di monitoraggio
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Detect initial quotas
      await this.detectStorageQuotas();
      
      // Perform initial health check
      await this.performHealthCheck();
      
      // Start monitoring if enabled
      if (this.config.enableAutoCheck) {
        this.startMonitoring();
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize StorageMonitoringService:', error);
      return false;
    }
  }

  /**
   * Avvia il monitoraggio continuo
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Error during health check:', error);
      }
    }, this.config.checkInterval);
  }

  /**
   * Ferma il monitoraggio
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Ottiene lo stato di salute corrente
   */
  getStorageHealth(): StorageHealth {
    return { ...this.storageHealth };
  }

  /**
   * Forza un controllo immediato
   */
  async forceHealthCheck(): Promise<StorageHealth> {
    await this.performHealthCheck();
    return this.getStorageHealth();
  }

  /**
   * Ottiene le quote storage
   */
  async getStorageQuotas(): Promise<StorageQuota> {
    if (!this.quotaCache || Date.now() - this.lastQuotaCheck > 60000) { // Cache for 1 minute
      await this.detectStorageQuotas();
    }
    return this.quotaCache!;
  }

  /**
   * Aggiorna la configurazione
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // Restart monitoring if interval changed
    if (newConfig.checkInterval && newConfig.checkInterval !== oldConfig.checkInterval && this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }

    // Start/stop monitoring based on enableAutoCheck
    if (newConfig.enableAutoCheck !== undefined) {
      if (newConfig.enableAutoCheck && !this.isMonitoring) {
        this.startMonitoring();
      } else if (!newConfig.enableAutoCheck && this.isMonitoring) {
        this.stopMonitoring();
      }
    }
  }

  /**
   * Ottiene la configurazione corrente
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Verifica se il servizio � inizializzato
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Verifica se il monitoraggio � attivo
   */
  isServiceMonitoring(): boolean {
    return this.isMonitoring;
  }

  /**
   * Cleanup del servizio
   */
  dispose(): void {
    this.stopMonitoring();
    this.isInitialized = false;
    this.quotaCache = null;
  }

  /**
   * Rileva le quote disponibili per ogni storage
   */
  private async detectStorageQuotas(): Promise<void> {
    try {
      let totalQuota = 0;
      let localStorageQuota = 0;
      let sessionStorageQuota = 0;
      let indexedDBQuota = 0;

      // Try to use Storage API if available
      if (this.navigator && 'storage' in this.navigator && 'estimate' in this.navigator.storage) {
        try {
          const estimate = await this.navigator.storage.estimate();
          totalQuota = estimate.quota || 0;
          indexedDBQuota = (estimate.usage || 0) * 0.8;
          
          // Estimate localStorage and sessionStorage quotas (usually 5-10MB each)
          localStorageQuota = 5 * 1024 * 1024; // 5MB
          sessionStorageQuota = 5 * 1024 * 1024; // 5MB
        } catch (error) {
          console.warn('Storage API not available, using fallback estimates');
        }
      }

      // Fallback estimates if API not available
      if (totalQuota === 0) {
        totalQuota = 1024 * 1024 * 1024; // 1GB fallback
        localStorageQuota = 5 * 1024 * 1024; // 5MB
        sessionStorageQuota = 5 * 1024 * 1024; // 5MB
        indexedDBQuota = totalQuota - localStorageQuota - sessionStorageQuota;
      }

      this.quotaCache = {
        localStorage: localStorageQuota,
        sessionStorage: sessionStorageQuota,
        indexedDB: indexedDBQuota,
        total: totalQuota
      };

      this.lastQuotaCheck = Date.now();
    } catch (error) {
      console.error('Failed to detect storage quotas:', error);
      // Set minimal fallback quotas
      this.quotaCache = {
        localStorage: 1024 * 1024, // 1MB
        sessionStorage: 1024 * 1024, // 1MB
        indexedDB: 10 * 1024 * 1024, // 10MB
        total: 12 * 1024 * 1024 // 12MB
      };
    }
  }

  /**
   * Esegue un controllo completo della salute storage
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();

    try {
      // Get quotas first
      if (!this.quotaCache) {
        await this.detectStorageQuotas();
      }

      // Check localStorage
      const localStorageHealth = await this.checkLocalStorageHealth();
      
      // Check sessionStorage
      const sessionStorageHealth = await this.checkSessionStorageHealth();
      
      // Check indexedDB
      const indexedDBHealth = await this.checkIndexedDBHealth();

      // Calculate totals
      const totalUsage = localStorageHealth.usage + sessionStorageHealth.usage + indexedDBHealth.usage;
      const estimatedQuota = this.quotaCache?.total || 0;

      // Determine overall health
      const overallHealth = this.determineOverallHealth(
        localStorageHealth.status,
        sessionStorageHealth.status,
        indexedDBHealth.status,
        totalUsage,
        estimatedQuota
      );

      // Update health state
      this.storageHealth = {
        localStorage: localStorageHealth,
        sessionStorage: sessionStorageHealth,
        indexedDB: indexedDBHealth,
        overall: overallHealth,
        lastCheck: startTime,
        totalUsage,
        estimatedQuota
      };

    } catch (error) {
      console.error('Health check failed:', error);
      this.storageHealth.overall = 'error';
      this.storageHealth.lastCheck = startTime;
    }
  }

  /**
   * Controlla la salute del localStorage
   */
  private async checkLocalStorageHealth(): Promise<{ status: string; usage: number; error?: string }> {
    try {
      // Test basic functionality
      const testKey = '__storage_test__';
      const testValue = 'test';
      
      this.localStorage.setItem(testKey, testValue);
      const retrieved = this.localStorage.getItem(testKey);
      this.localStorage.removeItem(testKey);

      if (retrieved !== testValue) {
        return { status: 'error', usage: 0, error: 'Read/write test failed' };
      }

      // Estimate usage
      let totalSize = 0;
      for (let i = 0; i < this.localStorage.length; i++) {
        const key = this.localStorage.key(i);
        if (key) {
          const value = this.localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([key + value]).size;
          }
        }
      }

      return { status: 'healthy', usage: totalSize };
    } catch (error) {
      return { 
        status: 'error', 
        usage: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Controlla la salute del sessionStorage
   */
  private async checkSessionStorageHealth(): Promise<{ status: string; usage: number; error?: string }> {
    try {
      // Test basic functionality
      const testKey = '__session_test__';
      const testValue = 'test';
      
      this.sessionStorage.setItem(testKey, testValue);
      const retrieved = this.sessionStorage.getItem(testKey);
      this.sessionStorage.removeItem(testKey);

      if (retrieved !== testValue) {
        return { status: 'error', usage: 0, error: 'Read/write test failed' };
      }

      // Estimate usage
      let totalSize = 0;
      for (let i = 0; i < this.sessionStorage.length; i++) {
        const key = this.sessionStorage.key(i);
        if (key) {
          const value = this.sessionStorage.getItem(key);
          if (value) {
            totalSize += new Blob([key + value]).size;
          }
        }
      }

      return { status: 'healthy', usage: totalSize };
    } catch (error) {
      return { 
        status: 'error', 
        usage: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Controlla la salute di IndexedDB
   */
  private async checkIndexedDBHealth(): Promise<{ status: string; usage: number; error?: string }> {
    try {
      // Try to open a test database
      return new Promise((resolve) => {
        const testDbName = '__indexeddb_test__';
        const request = this.indexedDB.open(testDbName, 1);

        request.onerror = () => {
          resolve({ 
            status: 'error', 
            usage: 0, 
            error: 'Failed to open test database' 
          });
        };

        request.onsuccess = () => {
          const db = request.result;
          db.close();
          
          // Try to delete the test database
          const deleteRequest = this.indexedDB.deleteDatabase(testDbName);
          deleteRequest.onsuccess = () => {
            // Estimate usage (simplified)
            const estimatedUsage = 0; // Would need more complex logic to estimate real usage
            resolve({ status: 'healthy', usage: estimatedUsage });
          };
          deleteRequest.onerror = () => {
            resolve({ status: 'healthy', usage: 0 });
          };
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          resolve({ 
            status: 'warning', 
            usage: 0, 
            error: 'IndexedDB response timeout' 
          });
        }, 5000);
      });
    } catch (error) {
      return { 
        status: 'error', 
        usage: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Determina lo stato generale di salute
   */
  private determineOverallHealth(
    localStorageStatus: string,
    sessionStorageStatus: string,
    indexedDBStatus: string,
    totalUsage: number,
    estimatedQuota: number
  ): 'healthy' | 'warning' | 'critical' | 'error' {
    // Check for errors first
    if (localStorageStatus === 'error' || sessionStorageStatus === 'error' || indexedDBStatus === 'error') {
      return 'error';
    }

    // Check usage percentage
    if (estimatedQuota > 0) {
      const usagePercentage = totalUsage / estimatedQuota;
      
      if (usagePercentage >= this.config.criticalThreshold) {
        return 'critical';
      } else if (usagePercentage >= this.config.warningThreshold) {
        return 'warning';
      }
    }

    // Check for warnings
    if (localStorageStatus === 'warning' || sessionStorageStatus === 'warning' || indexedDBStatus === 'warning') {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Inizializza lo stato di salute
   */
  private initializeHealthState(): StorageHealth {
    return {
      localStorage: { status: 'unknown', usage: 0 },
      sessionStorage: { status: 'unknown', usage: 0 },
      indexedDB: { status: 'unknown', usage: 0 },
      overall: 'healthy',
      lastCheck: 0,
      totalUsage: 0,
      estimatedQuota: 0
    };
  }
}

export const storageMonitoring = new StorageMonitoringService();
