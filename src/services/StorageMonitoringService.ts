/**
 * StorageMonitoringService - Sistema di Monitoraggio Storage Enterprise
 * 
 * Questo servizio monitora in tempo reale l'utilizzo dello storage su tutti e tre
 * i layer di cache (L1, L2, L3), rileva automaticamente le quote disponibili
 * e fornisce warning proattivi per prevenire overflow della memoria.
 * 
 * Features:
 * - Real-time monitoring di tutti i layer cache
 * - Auto-detection delle quote disponibili per browser
 * - Warning system intelligente con soglie personalizzabili
 * - Emergency recovery per situazioni critiche
 * - Analytics e recommendations per ottimizzazione
 */

interface StorageUsage {
  used: number;
  quota: number;
  percentage: number;
  lastUpdated: number;
}

interface StorageQuota {
  estimated: number;
  exact?: number;
  source: 'estimated' | 'measured' | 'api';
  reliability: number; // 0-1, quanto è affidabile la stima
}

interface StorageWarning {
  level: 'info' | 'warning' | 'critical' | 'emergency';
  layer: 'L1' | 'L2' | 'L3';
  usage: number;
  quota: number;
  percentage: number;
  message: string;
  recommendations: string[];
  timestamp: number;
}

interface StorageHealth {
  overall: 'healthy' | 'warning' | 'critical' | 'emergency';
  l1: StorageUsage;
  l2: StorageUsage;
  l3: StorageUsage;
  totalUsed: number;
  totalQuota: number;
  warnings: StorageWarning[];
  lastCheck: number;
}

interface MonitoringConfig {
  checkInterval: number; // secondi
  warningThresholds: {
    info: number;     // 70%
    warning: number;  // 85%
    critical: number; // 95%
    emergency: number; // 98%
  };
  enableAutoCleanup: boolean;
  cleanupThreshold: number; // 95%
}

class StorageMonitoringService {
  private static instance: StorageMonitoringService;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private storageHealth: StorageHealth;
  private quotaCache = new Map<string, StorageQuota>();
  private eventListeners = new Set<(health: StorageHealth) => void>();
  private warningListeners = new Set<(warning: StorageWarning) => void>();

  private config: MonitoringConfig = {
    checkInterval: 30, // 30 secondi
    warningThresholds: {
      info: 0.70,     // 70%
      warning: 0.85,  // 85%
      critical: 0.95, // 95%
      emergency: 0.98 // 98%
    },
    enableAutoCleanup: true,
    cleanupThreshold: 0.95
  };

  constructor() {
    this.storageHealth = this.initializeHealthState();
    this.setupEventListeners();
  }

  public static getInstance(): StorageMonitoringService {
    if (!StorageMonitoringService.instance) {
      StorageMonitoringService.instance = new StorageMonitoringService();
    }
    return StorageMonitoringService.instance;
  }

  /**
   * Inizializza il sistema di monitoraggio
   */
  public async initialize(): Promise<void> {
    console.log('🔍 Inizializzando StorageMonitoringService...');
    
    try {
      // Rileva le quote iniziali
      await this.detectAllQuotas();
      
      // Effettua il primo check
      await this.performHealthCheck();
      
      // Avvia il monitoraggio continuo
      this.startMonitoring();
      
      console.log('✅ StorageMonitoringService inizializzato con successo');
    } catch (error) {
      console.error('❌ Errore inizializzazione StorageMonitoringService:', error);
      throw error;
    }
  }

  /**
   * Avvia il monitoraggio continuo
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️ Monitoraggio già attivo');
      return;
    }

    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('❌ Errore durante health check:', error);
      }
    }, this.config.checkInterval * 1000);

    console.log(`🚀 Monitoraggio storage avviato (check ogni ${this.config.checkInterval}s)`);
  }

  /**
   * Ferma il monitoraggio continuo
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('🛑 Monitoraggio storage fermato');
  }

  /**
   * Ottiene lo stato attuale della salute storage
   */
  public getStorageHealth(): StorageHealth {
    return { ...this.storageHealth };
  }

  /**
   * Forza un check immediato dello storage
   */
  public async forceHealthCheck(): Promise<StorageHealth> {
    await this.performHealthCheck();
    return this.getStorageHealth();
  }

  /**
   * Rileva automaticamente le quote per tutti i layer
   */
  private async detectAllQuotas(): Promise<void> {
    console.log('🔍 Rilevamento quote storage...');

    try {
      // L1 (Memory) - stima basata su JS heap
      const l1Quota = await this.detectMemoryQuota();
      this.quotaCache.set('L1', l1Quota);

      // L2 (LocalStorage) - test empirico
      const l2Quota = await this.detectLocalStorageQuota();
      this.quotaCache.set('L2', l2Quota);

      // L3 (IndexedDB) - API native + fallback
      const l3Quota = await this.detectIndexedDBQuota();
      this.quotaCache.set('L3', l3Quota);

      console.log('📊 Quote rilevate:', {
        L1: `${this.formatBytes(l1Quota.estimated)} (${l1Quota.source})`,
        L2: `${this.formatBytes(l2Quota.estimated)} (${l2Quota.source})`,
        L3: `${this.formatBytes(l3Quota.estimated)} (${l3Quota.source})`
      });
    } catch (error) {
      console.error('❌ Errore rilevamento quote:', error);
      // Usa quote di fallback
      this.setFallbackQuotas();
    }
  }

  /**
   * Rileva la quota di memoria (L1)
   */
  private async detectMemoryQuota(): Promise<StorageQuota> {
    try {
      // Usa performance.memory se disponibile (Chrome)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const heapLimit = memory.jsHeapSizeLimit || 0;
        
        if (heapLimit > 0) {
          // Conservativo: usiamo max 25% dello heap per cache
          const quota = Math.floor(heapLimit * 0.25);
          return {
            estimated: quota,
            exact: quota,
            source: 'api',
            reliability: 0.9
          };
        }
      }

      // Fallback: stima basata su user agent
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const estimatedQuota = isMobile ? 50 * 1024 * 1024 : 100 * 1024 * 1024; // 50MB mobile, 100MB desktop

      return {
        estimated: estimatedQuota,
        source: 'estimated',
        reliability: 0.6
      };
    } catch (error) {
      console.warn('⚠️ Fallback per quota memoria:', error);
      return {
        estimated: 50 * 1024 * 1024, // 50MB default
        source: 'estimated',
        reliability: 0.3
      };
    }
  }

  /**
   * Rileva la quota di LocalStorage (L2)
   */
  private async detectLocalStorageQuota(): Promise<StorageQuota> {
    const testKey = '__storage_quota_test__';
    let quota = 0;
    
    try {
      // Test progressivo per trovare il limite
      let testSize = 1024; // 1KB iniziale
      const maxTestSize = 50 * 1024 * 1024; // 50MB max test
      
      while (testSize <= maxTestSize) {
        try {
          const testData = 'x'.repeat(testSize);
          localStorage.setItem(testKey, testData);
          localStorage.removeItem(testKey);
          quota = testSize;
          testSize *= 2;
        } catch (error) {
          // Quota raggiunti
          break;
        }
      }

      // Cleanup
      try {
        localStorage.removeItem(testKey);
      } catch {}

      if (quota > 0) {
        return {
          estimated: quota,
          exact: quota,
          source: 'measured',
          reliability: 0.95
        };
      }

      // Fallback standard
      return {
        estimated: 5 * 1024 * 1024, // 5MB standard
        source: 'estimated',
        reliability: 0.6
      };
    } catch (error) {
      console.warn('⚠️ Fallback per quota localStorage:', error);
      return {
        estimated: 5 * 1024 * 1024, // 5MB default
        source: 'estimated',
        reliability: 0.3
      };
    }
  }

  /**
   * Rileva la quota di IndexedDB (L3)
   */
  private async detectIndexedDBQuota(): Promise<StorageQuota> {
    try {
      // Prova API moderna navigator.storage.estimate()
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        
        if (estimate.quota && estimate.quota > 0) {
          return {
            estimated: estimate.quota,
            exact: estimate.quota,
            source: 'api',
            reliability: 0.95
          };
        }
      }

      // Fallback: stima basata su disco disponibile
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const estimatedQuota = isMobile 
        ? 1 * 1024 * 1024 * 1024    // 1GB mobile
        : 10 * 1024 * 1024 * 1024;  // 10GB desktop

      return {
        estimated: estimatedQuota,
        source: 'estimated',
        reliability: 0.7
      };
    } catch (error) {
      console.warn('⚠️ Fallback per quota IndexedDB:', error);
      return {
        estimated: 1 * 1024 * 1024 * 1024, // 1GB default
        source: 'estimated',
        reliability: 0.5
      };
    }
  }

  /**
   * Calcola l'utilizzo attuale di memoria (L1)
   */
  private calculateMemoryUsage(): number {
    try {
      // Usa performance.memory se disponibile
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return memory.usedJSHeapSize || 0;
      }

      // Fallback: stima approssimativa
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calcola l'utilizzo attuale di LocalStorage (L2)
   */
  private calculateLocalStorageUsage(): number {
    try {
      let totalSize = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          totalSize += key.length + value.length;
        }
      }
      
      // Stima più accurata considerando overhead UTF-16
      return totalSize * 2; // UTF-16 = 2 bytes per carattere
    } catch (error) {
      console.warn('⚠️ Errore calcolo localStorage usage:', error);
      return 0;
    }
  }

  /**
   * Calcola l'utilizzo attuale di IndexedDB (L3)
   */
  private async calculateIndexedDBUsage(): Promise<number> {
    try {
      // Usa navigator.storage.estimate() se disponibile
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }

      // Fallback: stima basata su dimensioni database
      // Questo richiede accesso ai database specifici
      return 0;
    } catch (error) {
      console.warn('⚠️ Errore calcolo IndexedDB usage:', error);
      return 0;
    }
  }

  /**
   * Esegue un controllo completo della salute storage
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();

    try {
      // Calcola utilizzo corrente per tutti i layer
      const l1Usage = this.calculateMemoryUsage();
      const l2Usage = this.calculateLocalStorageUsage();
      const l3Usage = await this.calculateIndexedDBUsage();

      // Ottieni quote
      const l1Quota = this.quotaCache.get('L1')?.estimated || 0;
      const l2Quota = this.quotaCache.get('L2')?.estimated || 0;
      const l3Quota = this.quotaCache.get('L3')?.estimated || 0;

      // Aggiorna stato salute
      this.storageHealth = {
        overall: this.determineOverallHealth(l1Usage, l1Quota, l2Usage, l2Quota, l3Usage, l3Quota),
        l1: {
          used: l1Usage,
          quota: l1Quota,
          percentage: l1Quota > 0 ? l1Usage / l1Quota : 0,
          lastUpdated: startTime
        },
        l2: {
          used: l2Usage,
          quota: l2Quota,
          percentage: l2Quota > 0 ? l2Usage / l2Quota : 0,
          lastUpdated: startTime
        },
        l3: {
          used: l3Usage,
          quota: l3Quota,
          percentage: l3Quota > 0 ? l3Usage / l3Quota : 0,
          lastUpdated: startTime
        },
        totalUsed: l1Usage + l2Usage + l3Usage,
        totalQuota: l1Quota + l2Quota + l3Quota,
        warnings: [],
        lastCheck: startTime
      };

      // Genera warning se necessari
      this.checkAndGenerateWarnings();

      // Notifica listeners
      this.notifyHealthListeners();

      // Cleanup automatico se necessario
      if (this.config.enableAutoCleanup) {
        await this.performAutoCleanupIfNeeded();
      }

    } catch (error) {
      console.error('❌ Errore durante health check:', error);
    }
  }

  /**
   * Determina lo stato generale della salute
   */
  private determineOverallHealth(
    l1Usage: number, l1Quota: number,
    l2Usage: number, l2Quota: number,
    l3Usage: number, l3Quota: number
  ): 'healthy' | 'warning' | 'critical' | 'emergency' {
    const thresholds = this.config.warningThresholds;
    
    const l1Percentage = l1Quota > 0 ? l1Usage / l1Quota : 0;
    const l2Percentage = l2Quota > 0 ? l2Usage / l2Quota : 0;
    const l3Percentage = l3Quota > 0 ? l3Usage / l3Quota : 0;

    const maxPercentage = Math.max(l1Percentage, l2Percentage, l3Percentage);

    if (maxPercentage >= thresholds.emergency) return 'emergency';
    if (maxPercentage >= thresholds.critical) return 'critical';
    if (maxPercentage >= thresholds.warning) return 'warning';
    
    return 'healthy';
  }

  /**
   * Controlla e genera warning per i vari layer
   */
  private checkAndGenerateWarnings(): void {
    this.storageHealth.warnings = [];
    
    // Check L1
    this.checkLayerWarnings('L1', this.storageHealth.l1);
    
    // Check L2  
    this.checkLayerWarnings('L2', this.storageHealth.l2);
    
    // Check L3
    this.checkLayerWarnings('L3', this.storageHealth.l3);
  }

  /**
   * Controlla warning per un layer specifico
   */
  private checkLayerWarnings(layer: 'L1' | 'L2' | 'L3', usage: StorageUsage): void {
    const thresholds = this.config.warningThresholds;
    const percentage = usage.percentage;

    let warning: StorageWarning | null = null;

    if (percentage >= thresholds.emergency) {
      warning = {
        level: 'emergency',
        layer,
        usage: usage.used,
        quota: usage.quota,
        percentage,
        message: `EMERGENZA: ${layer} al ${Math.round(percentage * 100)}% - Rischio crash imminente!`,
        recommendations: this.getEmergencyRecommendations(layer),
        timestamp: Date.now()
      };
    } else if (percentage >= thresholds.critical) {
      warning = {
        level: 'critical',
        layer,
        usage: usage.used,
        quota: usage.quota,
        percentage,
        message: `CRITICO: ${layer} al ${Math.round(percentage * 100)}% - Azione immediata richiesta`,
        recommendations: this.getCriticalRecommendations(layer),
        timestamp: Date.now()
      };
    } else if (percentage >= thresholds.warning) {
      warning = {
        level: 'warning',
        layer,
        usage: usage.used,
        quota: usage.quota,
        percentage,
        message: `Attenzione: ${layer} al ${Math.round(percentage * 100)}% - Considera pulizia`,
        recommendations: this.getWarningRecommendations(layer),
        timestamp: Date.now()
      };
    } else if (percentage >= thresholds.info) {
      warning = {
        level: 'info',
        layer,
        usage: usage.used,
        quota: usage.quota,
        percentage,
        message: `Info: ${layer} al ${Math.round(percentage * 100)}% - Tutto normale`,
        recommendations: this.getInfoRecommendations(layer),
        timestamp: Date.now()
      };
    }

    if (warning) {
      this.storageHealth.warnings.push(warning);
      this.notifyWarningListeners(warning);
    }
  }

  /**
   * Ottiene raccomandazioni per situazioni di emergenza
   */
  private getEmergencyRecommendations(layer: 'L1' | 'L2' | 'L3'): string[] {
    const base = [
      'Cleanup automatico attivato',
      'Contatta supporto se il problema persiste'
    ];

    switch (layer) {
      case 'L1':
        return [
          'Refresh immediato della pagina',
          'Chiudi altre schede del browser',
          ...base
        ];
      case 'L2':
        return [
          'Cancellazione dati L2 più vecchi',
          'Compressione dati aumentata',
          ...base
        ];
      case 'L3':
        return [
          'Cleanup database automatico',
          'Rimozione dati storici più vecchi',
          ...base
        ];
    }
  }

  /**
   * Ottiene raccomandazioni per situazioni critiche
   */
  private getCriticalRecommendations(layer: 'L1' | 'L2' | 'L3'): string[] {
    switch (layer) {
      case 'L1':
        return [
          'Riduci dati in memoria',
          'Attiva compressione aggressiva',
          'Considera refresh pagina'
        ];
      case 'L2':
        return [
          'Elimina dati L2 non essenziali',
          'Aumenta compressione',
          'Sposta dati storici a L3'
        ];
      case 'L3':
        return [
          'Pulisci dati più vecchi di 7 giorni',
          'Comprimi database',
          'Archivia dati raramente usati'
        ];
    }
  }

  /**
   * Ottiene raccomandazioni per warning normali
   */
  private getWarningRecommendations(layer: 'L1' | 'L2' | 'L3'): string[] {
    switch (layer) {
      case 'L1':
        return [
          'Monitora crescita memoria',
          'Considera pulizia cache'
        ];
      case 'L2':
        return [
          'Pulisci dati scaduti',
          'Ottimizza compressione'
        ];
      case 'L3':
        return [
          'Pianifica cleanup settimanale',
          'Comprimi dati storici'
        ];
    }
  }

  /**
   * Ottiene raccomandazioni informative
   */
  private getInfoRecommendations(layer: 'L1' | 'L2' | 'L3'): string[] {
    return [
      'Tutto sotto controllo',
      'Continua monitoraggio normale'
    ];
  }

  /**
   * Esegue cleanup automatico se necessario
   */
  private async performAutoCleanupIfNeeded(): Promise<void> {
    const health = this.storageHealth;
    
    if (health.overall === 'emergency' || health.overall === 'critical') {
      console.log('🧹 Avvio cleanup automatico...');
      
      try {
        // Priorità: pulisci prima il layer più pieno
        const layers = [
          { name: 'L3', percentage: health.l3.percentage },
          { name: 'L2', percentage: health.l2.percentage },
          { name: 'L1', percentage: health.l1.percentage }
        ].sort((a, b) => b.percentage - a.percentage);

        for (const layer of layers) {
          if (layer.percentage >= this.config.cleanupThreshold) {
            await this.performLayerCleanup(layer.name as 'L1' | 'L2' | 'L3');
          }
        }

        console.log('✅ Cleanup automatico completato');
      } catch (error) {
        console.error('❌ Errore durante cleanup automatico:', error);
      }
    }
  }

  /**
   * Esegue cleanup per un layer specifico
   */
  private async performLayerCleanup(layer: 'L1' | 'L2' | 'L3'): Promise<void> {
    console.log(`🧹 Cleanup ${layer} in corso...`);
    
    switch (layer) {
      case 'L1':
        // Forza garbage collection se disponibile
        if ('gc' in window) {
          (window as any).gc();
        }
        break;
        
      case 'L2':
        // Rimuovi i dati più vecchi da localStorage
        this.cleanupLocalStorage();
        break;
        
      case 'L3':
        // Pulisci IndexedDB
        await this.cleanupIndexedDB();
        break;
    }
  }

  /**
   * Pulisce LocalStorage rimuovendo dati vecchi
   */
  private cleanupLocalStorage(): void {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }

      // Ordina per timestamp se presente
      keys.sort((a, b) => {
        try {
          const aData = JSON.parse(localStorage.getItem(a) || '{}');
          const bData = JSON.parse(localStorage.getItem(b) || '{}');
          return (aData.timestamp || 0) - (bData.timestamp || 0);
        } catch {
          return 0;
        }
      });

      // Rimuovi i più vecchi fino a raggiungere 70% di utilizzo
      let removed = 0;
      for (const key of keys) {
        if (this.calculateLocalStorageUsage() < this.quotaCache.get('L2')!.estimated * 0.7) {
          break;
        }
        
        localStorage.removeItem(key);
        removed++;
      }

      console.log(`🧹 LocalStorage: rimossi ${removed} elementi`);
    } catch (error) {
      console.error('❌ Errore cleanup localStorage:', error);
    }
  }

  /**
   * Pulisce IndexedDB
   */
  private async cleanupIndexedDB(): Promise<void> {
    try {
      // Questo dovrebbe interfacciarsi con IndexedDBCacheL3
      // Per ora log placeholder
      console.log('🧹 IndexedDB cleanup richiesto');
      
      // TODO: Implementare cleanup IndexedDB specifico
      // Dovrebbe chiamare il servizio L3 per cleanup intelligente
    } catch (error) {
      console.error('❌ Errore cleanup IndexedDB:', error);
    }
  }

  /**
   * Imposta quote di fallback
   */
  private setFallbackQuotas(): void {
    this.quotaCache.set('L1', {
      estimated: 50 * 1024 * 1024, // 50MB
      source: 'estimated',
      reliability: 0.3
    });

    this.quotaCache.set('L2', {
      estimated: 5 * 1024 * 1024, // 5MB
      source: 'estimated',
      reliability: 0.3
    });

    this.quotaCache.set('L3', {
      estimated: 1 * 1024 * 1024 * 1024, // 1GB
      source: 'estimated',
      reliability: 0.3
    });
  }

  /**
   * Inizializza lo stato di salute
   */
  private initializeHealthState(): StorageHealth {
    return {
      overall: 'healthy',
      l1: { used: 0, quota: 0, percentage: 0, lastUpdated: 0 },
      l2: { used: 0, quota: 0, percentage: 0, lastUpdated: 0 },
      l3: { used: 0, quota: 0, percentage: 0, lastUpdated: 0 },
      totalUsed: 0,
      totalQuota: 0,
      warnings: [],
      lastCheck: 0
    };
  }

  /**
   * Configura listener di eventi
   */
  private setupEventListeners(): void {
    // Listener per eventi storage
    window.addEventListener('storage', () => {
      // Trigger check immediato quando storage cambia
      this.performHealthCheck();
    });

    // Listener per eventi memoria
    window.addEventListener('beforeunload', () => {
      this.stopMonitoring();
    });
  }

  /**
   * Notifica i listener dello stato salute
   */
  private notifyHealthListeners(): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(this.storageHealth);
      } catch (error) {
        console.error('❌ Errore notifica health listener:', error);
      }
    });
  }

  /**
   * Notifica i listener dei warning
   */
  private notifyWarningListeners(warning: StorageWarning): void {
    this.warningListeners.forEach(listener => {
      try {
        listener(warning);
      } catch (error) {
        console.error('❌ Errore notifica warning listener:', error);
      }
    });
  }

  /**
   * Formatta bytes in formato leggibile
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Public API per subscription agli eventi

  /**
   * Sottoscrive agli aggiornamenti dello stato salute
   */
  public onHealthUpdate(callback: (health: StorageHealth) => void): () => void {
    this.eventListeners.add(callback);
    
    // Invia stato corrente immediatamente
    callback(this.storageHealth);
    
    // Ritorna funzione per unsubscribe
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  /**
   * Sottoscrive agli warning
   */
  public onWarning(callback: (warning: StorageWarning) => void): () => void {
    this.warningListeners.add(callback);
    
    // Ritorna funzione per unsubscribe
    return () => {
      this.warningListeners.delete(callback);
    };
  }

  /**
   * Aggiorna configurazione monitoraggio
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Riavvia monitoraggio se l'intervallo è cambiato
    if (newConfig.checkInterval && this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Ottiene configurazione corrente
   */
  public getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Cleanup e shutdown del servizio
   */
  public shutdown(): void {
    this.stopMonitoring();
    this.eventListeners.clear();
    this.warningListeners.clear();
    this.quotaCache.clear();
  }
}

// Export singleton instance
export const storageMonitoring = StorageMonitoringService.getInstance();
export default StorageMonitoringService;

// Export types
export type {
  StorageUsage,
  StorageQuota,
  StorageWarning,
  StorageHealth,
  MonitoringConfig
}; 
