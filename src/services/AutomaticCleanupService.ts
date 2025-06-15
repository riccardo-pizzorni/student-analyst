/**
 * AutomaticCleanupService - Sistema di Pulizia Automatica Enterprise
 * 
 * Questo servizio gestisce la pulizia automatica intelligente dei dati su tutti e tre
 * i layer di cache (L1, L2, L3), implementando algoritmi LRU, scheduling giornaliero,
 * confirmation dialogs e progress tracking real-time.
 * 
 * Features:
 * - Daily cleanup schedulato alle 2:00 AM
 * - LRU cleanup quando storage è pieno
 * - User confirmation per major cleanup operations
 * - Progress feedback real-time per tutte le operazioni
 * - Analytics e reporting dettagliato
 */

import { IIndexedDBCacheL3, ILocalStorageCacheL2, IMemoryCacheL1 } from './interfaces/ICache';

interface CleanupItem {
  key: string;
  layer: 'L1' | 'L2' | 'L3';
  size: number;
  lastAccessed: number;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface CleanupOperation {
  id: string;
  type: 'DAILY' | 'LRU' | 'MANUAL' | 'EMERGENCY';
  layer?: 'L1' | 'L2' | 'L3';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  itemsToClean: CleanupItem[];
  totalItems: number;
  processedItems: number;
  totalSize: number;
  freedSize: number;
  startTime: number;
  endTime?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface CleanupProgress {
  operationId: string;
  percentage: number;
  currentItem?: string;
  processedCount: number;
  totalCount: number;
  freedSpace: number;
  totalSpace: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  status: string;
}

interface CleanupConfig {
  dailyCleanupTime: string; // "02:00"
  enableDailyCleanup: boolean;
  maxDataAge: {
    L1: number; // milliseconds
    L2: number; // milliseconds  
    L3: number; // milliseconds
  };
  lruThresholds: {
    L1: number; // percentage
    L2: number; // percentage
    L3: number; // percentage
  };
  confirmationThresholds: {
    itemCount: number;
    spacePercentage: number; // percentage of quota
  };
}

interface CleanupReport {
  timestamp: number;
  operationType: string;
  layer: string;
  itemsRemoved: number;
  spaceFreed: number;
  duration: number;
  success: boolean;
  errors: string[];
}

interface CleanupSchedule {
  lastCleanup: number;
  nextCleanup: number;
  interval: number;
}

class AutomaticCleanupService {
  private static instance: AutomaticCleanupService;
  private isRunning = false;
  private currentOperations = new Map<string, CleanupOperation>();
  private cleanupHistory: CleanupReport[] = [];
  private progressListeners = new Set<(progress: CleanupProgress) => void>();
  private completionListeners = new Set<(report: CleanupReport) => void>();
  private dailyCleanupTimer?: NodeJS.Timeout;
  private lruTracker = new Map<string, number>(); // key -> last access timestamp
  private memoryCache: IMemoryCacheL1;
  private localStorageCache: ILocalStorageCacheL2;
  private indexedDBCache: IIndexedDBCacheL3;
  private schedule: CleanupSchedule;
  private cleanupTimer: number | null = null;
  private readonly defaultInterval = 24 * 60 * 60 * 1000; // 24 ore

  private config: CleanupConfig = {
    dailyCleanupTime: "02:00",
    enableDailyCleanup: true,
    maxDataAge: {
      L1: 24 * 60 * 60 * 1000,      // 24 hours
      L2: 7 * 24 * 60 * 60 * 1000,  // 7 days
      L3: 30 * 24 * 60 * 60 * 1000  // 30 days
    },
    lruThresholds: {
      L1: 0.90, // 90%
      L2: 0.85, // 85%
      L3: 0.80  // 80%
    },
    confirmationThresholds: {
      itemCount: 100,
      spacePercentage: 0.10 // 10%
    }
  };

  constructor(
    memoryCache: IMemoryCacheL1,
    localStorageCache: ILocalStorageCacheL2,
    indexedDBCache: IIndexedDBCacheL3
  ) {
    this.memoryCache = memoryCache;
    this.localStorageCache = localStorageCache;
    this.indexedDBCache = indexedDBCache;
    this.schedule = {
      lastCleanup: 0,
      nextCleanup: 0,
      interval: this.defaultInterval
    };
    this.setupEventListeners();
    this.loadLRUTracker();
  }

  public static getInstance(): AutomaticCleanupService {
    if (!AutomaticCleanupService.instance) {
      AutomaticCleanupService.instance = new AutomaticCleanupService(
        null as any,
        null as any,
        null as any
      );
    }
    return AutomaticCleanupService.instance;
  }

  /**
   * Inizializza il servizio di cleanup automatico
   */
  public async initialize(): Promise<void> {
    console.log('🧹 Inizializzazione AutomaticCleanupService...');
    
    try {
      // Avvia scheduler daily cleanup
      this.startDailyCleanupScheduler();
      
      // Setup LRU tracking
      this.setupLRUTracking();
      
      // Load previous cleanup history
      this.loadCleanupHistory();
      
      // Carica lo schedule salvato
      await this.loadSchedule();
      
      // Avvia la pulizia programmata
      this.scheduleCleanup();
      
      console.log('✅ AutomaticCleanupService inizializzato con successo');
    } catch (error) {
      console.error('❌ Errore inizializzazione AutomaticCleanupService:', error);
      throw error;
    }
  }

  /**
   * Avvia il scheduler per cleanup giornaliero
   */
  private startDailyCleanupScheduler(): void {
    if (!this.config.enableDailyCleanup) {
      console.log('📅 Daily cleanup disabilitato');
      return;
    }

    // Calcola il tempo fino al prossimo cleanup
    const now = new Date();
    const [hours, minutes] = this.config.dailyCleanupTime.split(':').map(Number);
    
    const nextCleanup = new Date();
    nextCleanup.setHours(hours, minutes, 0, 0);
    
    // Se l'ora è già passata oggi, programma per domani
    if (nextCleanup <= now) {
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }

    const timeUntilCleanup = nextCleanup.getTime() - now.getTime();

    console.log(`📅 Prossimo cleanup giornaliero: ${nextCleanup.toLocaleString()}`);

    this.dailyCleanupTimer = setTimeout(() => {
      this.performDailyCleanup();
      // Ri-programma per il giorno successivo
      this.startDailyCleanupScheduler();
    }, timeUntilCleanup);
  }

  /**
   * Esegue il cleanup giornaliero automatico
   */
  private async performDailyCleanup(): Promise<void> {
    console.log('🌅 Avvio cleanup giornaliero automatico...');

    try {
      const operationId = this.generateOperationId();
      
      // Identifica dati da pulire
      const cleanupItems = await this.identifyDailyCleanupItems();
      
      if (cleanupItems.length === 0) {
        console.log('✅ Nessun dato da pulire nel cleanup giornaliero');
        return;
      }

      // Crea operazione di cleanup
      const operation: CleanupOperation = {
        id: operationId,
        type: 'DAILY',
        status: 'PENDING',
        itemsToClean: cleanupItems,
        totalItems: cleanupItems.length,
        processedItems: 0,
        totalSize: cleanupItems.reduce((sum, item) => sum + item.size, 0),
        freedSize: 0,
        startTime: Date.now(),
        riskLevel: 'LOW' // Daily cleanup è sempre low risk
      };

      this.currentOperations.set(operationId, operation);

      // Esegui cleanup senza confirmation (è automatico)
      await this.executeCleanupOperation(operation);

    } catch (error) {
      console.error('❌ Errore durante cleanup giornaliero:', error);
    }
  }

  /**
   * Esegue cleanup LRU quando storage è pieno
   */
  public async performLRUCleanup(
    layer: 'L1' | 'L2' | 'L3',
    targetFreePercentage: number = 0.3
  ): Promise<boolean> {
    console.log(`🔄 Avvio LRU cleanup per ${layer}...`);

    try {
      const operationId = this.generateOperationId();
      
      // Identifica candidati LRU per cleanup
      const cleanupItems = await this.identifyLRUCleanupItems(layer, targetFreePercentage);
      
      if (cleanupItems.length === 0) {
        console.log(`✅ Nessun dato LRU da pulire in ${layer}`);
        return true;
      }

      // Assess risk level
      const riskLevel = this.assessCleanupRisk(cleanupItems, layer);

      // Crea operazione di cleanup
      const operation: CleanupOperation = {
        id: operationId,
        type: 'LRU',
        layer,
        status: 'PENDING',
        itemsToClean: cleanupItems,
        totalItems: cleanupItems.length,
        processedItems: 0,
        totalSize: cleanupItems.reduce((sum, item) => sum + item.size, 0),
        freedSize: 0,
        startTime: Date.now(),
        riskLevel
      };

      this.currentOperations.set(operationId, operation);

      // Chiedi confirmation se necessario
      const needsConfirmation = this.needsUserConfirmation(operation);
      
      if (needsConfirmation) {
        const confirmed = await this.requestUserConfirmation(operation);
        if (!confirmed) {
          operation.status = 'CANCELLED';
          console.log('🚫 LRU cleanup cancellato dall\'utente');
          return false;
        }
      }

      // Esegui cleanup
      await this.executeCleanupOperation(operation);
      return true;

    } catch (error) {
      console.error(`❌ Errore durante LRU cleanup ${layer}:`, error);
      return false;
    }
  }

  /**
   * Esegue cleanup manuale con confirmation
   */
  public async performManualCleanup(
    items: CleanupItem[],
    requireConfirmation: boolean = true
  ): Promise<boolean> {
    console.log('🔧 Avvio cleanup manuale...');

    try {
      const operationId = this.generateOperationId();
      
      const operation: CleanupOperation = {
        id: operationId,
        type: 'MANUAL',
        status: 'PENDING',
        itemsToClean: items,
        totalItems: items.length,
        processedItems: 0,
        totalSize: items.reduce((sum, item) => sum + item.size, 0),
        freedSize: 0,
        startTime: Date.now(),
        riskLevel: this.assessCleanupRisk(items)
      };

      this.currentOperations.set(operationId, operation);

      // Chiedi confirmation se richiesto
      if (requireConfirmation) {
        const confirmed = await this.requestUserConfirmation(operation);
        if (!confirmed) {
          operation.status = 'CANCELLED';
          console.log('🚫 Cleanup manuale cancellato dall\'utente');
          return false;
        }
      }

      // Esegui cleanup
      await this.executeCleanupOperation(operation);
      return true;

    } catch (error) {
      console.error('❌ Errore durante cleanup manuale:', error);
      return false;
    }
  }

  /**
   * Identifica elementi per il cleanup giornaliero
   */
  private async identifyDailyCleanupItems(): Promise<CleanupItem[]> {
    const items: CleanupItem[] = [];
    const now = Date.now();

    try {
      // Import dei servizi cache
      const { memoryCacheL1 } = await import('../features/cache/services/MemoryCacheL1');
      const { localStorageCacheL2 } = await import('../features/cache/services/LocalStorageCacheL2');
      const { indexedDBCacheL3 } = await import('../features/cache/services/IndexedDBCacheL3');

      // L1 - Rimuovi dati scaduti oltre la max age
      const l1Keys = memoryCacheL1.keys();
      for (const key of l1Keys) {
        const data = memoryCacheL1.get(key);
        if (data) {
          const lastAccessed = this.lruTracker.get(key) || 0;
          const age = now - lastAccessed;
          
          if (age > this.config.maxDataAge.L1) {
            items.push({
              key,
              layer: 'L1',
              size: this.estimateDataSize(data),
              lastAccessed,
              type: this.identifyDataType(key),
              priority: 'low',
              description: `L1 data scaduto: ${key}`
            });
          }
        }
      }

      // L2 - Rimuovi dati scaduti oltre la max age
      const l2Keys = localStorageCacheL2.keys();
      for (const key of l2Keys) {
        const data = localStorageCacheL2.get(key);
        if (data) {
          const lastAccessed = this.lruTracker.get(key) || 0;
          const age = now - lastAccessed;
          
          if (age > this.config.maxDataAge.L2) {
            items.push({
              key,
              layer: 'L2',
              size: this.estimateDataSize(data),
              lastAccessed,
              type: this.identifyDataType(key),
              priority: 'low',
              description: `L2 data scaduto: ${key}`
            });
          }
        }
      }

      // L3 - Rimuovi dati molto vecchi oltre la max age
      // TODO: Implementare quando avremo accesso ai dati L3
      
      console.log(`📊 Identificati ${items.length} elementi per daily cleanup`);
      return items;

    } catch (error) {
      console.error('❌ Errore identificazione daily cleanup items:', error);
      return [];
    }
  }

  /**
   * Identifica candidati LRU per cleanup
   */
  private async identifyLRUCleanupItems(
    layer: 'L1' | 'L2' | 'L3',
    targetFreePercentage: number
  ): Promise<CleanupItem[]> {
    const items: CleanupItem[] = [];

    try {
      // Import dei servizi necessari
      const { storageMonitoring } = await import('./StorageMonitoringService');
      const health = storageMonitoring.getStorageHealth();
      
      let currentUsage: number;
      let quota: number;
      
      switch (layer) {
        case 'L1':
          currentUsage = health.localStorage.usage;
          quota = 100000;
          break;
        case 'L2':
          currentUsage = health.sessionStorage.usage;
          quota = 50000;
          break;
        case 'L3':
          currentUsage = health.indexedDB.usage;
          quota = 1000000;
          break;
      }

      const targetUsage = quota * (1 - targetFreePercentage);
      
      if (currentUsage <= targetUsage) {
        console.log(`✅ ${layer} non necessita LRU cleanup (${currentUsage} <= ${targetUsage})`);
        return [];
      }

      const spaceToFree = currentUsage - targetUsage;
      console.log(`📊 ${layer} necessita LRU cleanup: ${spaceToFree} bytes da liberare`);

      // Ottieni tutti gli elementi del layer ordinati per LRU
      const allItems = await this.getAllLayerItemsLRUSorted(layer);
      
      let spaceWillFree = 0;
      for (const item of allItems) {
        if (spaceWillFree >= spaceToFree) {
          break;
        }
        
        // Skip elementi critici
        if (item.priority === 'critical') {
          continue;
        }
        
        items.push(item);
        spaceWillFree += item.size;
      }

      console.log(`📊 Identificati ${items.length} elementi LRU per cleanup`);
      return items;

    } catch (error) {
      console.error(`❌ Errore identificazione LRU cleanup items ${layer}:`, error);
      return [];
    }
  }

  /**
   * Ottiene tutti gli elementi di un layer ordinati per LRU
   */
  private async getAllLayerItemsLRUSorted(layer: 'L1' | 'L2' | 'L3'): Promise<CleanupItem[]> {
    const items: CleanupItem[] = [];

    try {
      const keys: string[] = [];
      
      switch (layer) {
        case 'L1':
          const { memoryCacheL1 } = await import('../features/cache/services/MemoryCacheL1');
          const l1Keys = Object.keys(localStorage).filter(key => key.startsWith('l1_cache_'));
          for (const key of l1Keys) {
            const data = memoryCacheL1.get(key);
            if (data) {
              items.push({
                key,
                layer: 'L1',
                size: this.estimateDataSize(data),
                lastAccessed: this.lruTracker.get(key) || 0,
                type: this.identifyDataType(key),
                priority: this.assessDataPriority(key, data),
                description: `L1 item: ${key}`
              });
            }
          }
          break;
          
        case 'L2':
          const { localStorageCacheL2 } = await import('../features/cache/services/LocalStorageCacheL2');
          const l2Keys = Object.keys(localStorage).filter(key => key.startsWith('l2_cache_'));
          for (const key of l2Keys) {
            const data = localStorageCacheL2.get(key);
            if (data) {
              items.push({
                key,
                layer: 'L2',
                size: this.estimateDataSize(data),
                lastAccessed: this.lruTracker.get(key) || 0,
                type: this.identifyDataType(key),
                priority: this.assessDataPriority(key, data),
                description: `L2 item: ${key}`
              });
            }
          }
          break;
          
        case 'L3':
          const { indexedDBCacheL3 } = await import('../features/cache/services/IndexedDBCacheL3');
          const l3Keys = Object.keys(localStorage).filter(key => key.startsWith('l3_cache_'));
          for (const key of l3Keys) {
            const data = indexedDBCacheL3.get(key);
            if (data) {
              items.push({
                key,
                layer: 'L3',
                size: this.estimateDataSize(data),
                lastAccessed: this.lruTracker.get(key) || 0,
                type: this.identifyDataType(key),
                priority: this.assessDataPriority(key, data),
                description: `L3 item: ${key}`
              });
            }
          }
          break;
      }

      // Ordina per LRU (meno recentemente usati prima)
      items.sort((a, b) => a.lastAccessed - b.lastAccessed);

      return items;

    } catch (error) {
      console.error(`❌ Errore recupero ${layer} items LRU sorted:`, error);
      return [];
    }
  }

  /**
   * Esegue l'operazione di cleanup con progress tracking
   */
  private async executeCleanupOperation(operation: CleanupOperation): Promise<void> {
    console.log(`🚀 Avvio cleanup operation ${operation.id}...`);
    
    operation.status = 'RUNNING';
    operation.startTime = Date.now();

    try {
      const { memoryCacheL1 } = await import('../features/cache/services/MemoryCacheL1');
      const { localStorageCacheL2 } = await import('../features/cache/services/LocalStorageCacheL2');
      const { indexedDBCacheL3 } = await import('../features/cache/services/IndexedDBCacheL3');
      
      let processedItems = 0;
      let freedSize = 0;

      for (const item of operation.itemsToClean) {
        // Update progress
        const progress: CleanupProgress = {
          operationId: operation.id,
          percentage: (processedItems / operation.totalItems) * 100,
          currentItem: item.description,
          processedCount: processedItems,
          totalCount: operation.totalItems,
          freedSpace: freedSize,
          totalSpace: operation.totalSize,
          elapsedTime: Date.now() - operation.startTime,
          estimatedTimeRemaining: this.calculateETA(
            processedItems,
            operation.totalItems,
            operation.startTime
          ),
          status: 'PROCESSING'
        };

        this.notifyProgressListeners(progress);

        // Perform cleanup for this item
        try {
          let itemFreedSize = 0;
          
          switch (item.layer) {
            case 'L1':
              if (memoryCacheL1.has(item.key)) {
                memoryCacheL1.remove(item.key);
                itemFreedSize = item.size;
              }
              break;
              
            case 'L2':
              if (localStorageCacheL2.has(item.key)) {
                localStorageCacheL2.delete(item.key);
                itemFreedSize = item.size;
              }
              break;
              
            case 'L3':
              if (await indexedDBCacheL3.has(item.key)) {
                await indexedDBCacheL3.delete(item.key);
                itemFreedSize = item.size;
              }
              break;
          }

          freedSize += itemFreedSize;
          processedItems++;
          
          // Remove from LRU tracker
          this.lruTracker.delete(item.key);

          // Small delay to avoid blocking UI
          if (processedItems % 10 === 0) {
            await this.sleep(1);
          }

        } catch (itemError) {
          console.error(`❌ Errore cleanup item ${item.key}:`, itemError);
          processedItems++; // Continue with next item
        }
      }

      // Final progress update
      const finalProgress: CleanupProgress = {
        operationId: operation.id,
        percentage: 100,
        processedCount: processedItems,
        totalCount: operation.totalItems,
        freedSpace: freedSize,
        totalSpace: operation.totalSize,
        elapsedTime: Date.now() - operation.startTime,
        estimatedTimeRemaining: 0,
        status: 'COMPLETED'
      };

      this.notifyProgressListeners(finalProgress);

      // Update operation
      operation.status = 'COMPLETED';
      operation.endTime = Date.now();
      operation.processedItems = processedItems;
      operation.freedSize = freedSize;

      // Generate report
      const report: CleanupReport = {
        timestamp: Date.now(),
        operationType: operation.type,
        layer: operation.layer || 'ALL',
        itemsRemoved: processedItems,
        spaceFreed: freedSize,
        duration: operation.endTime - operation.startTime,
        success: true,
        errors: []
      };

      this.addCleanupReport(report);
      this.notifyCompletionListeners(report);

      console.log(`✅ Cleanup operation ${operation.id} completato:`, {
        items: processedItems,
        space: this.formatBytes(freedSize),
        duration: report.duration
      });

    } catch (error) {
      console.error(`❌ Errore cleanup operation ${operation.id}:`, error);
      
      operation.status = 'FAILED';
      operation.endTime = Date.now();

      const report: CleanupReport = {
        timestamp: Date.now(),
        operationType: operation.type,
        layer: operation.layer || 'ALL',
        itemsRemoved: operation.processedItems,
        spaceFreed: operation.freedSize,
        duration: operation.endTime! - operation.startTime,
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };

      this.addCleanupReport(report);
      this.notifyCompletionListeners(report);
    } finally {
      this.currentOperations.delete(operation.id);
      this.saveLRUTracker();
    }
  }

  /**
   * Verifica se un'operazione necessita conferma utente
   */
  private needsUserConfirmation(operation: CleanupOperation): boolean {
    const thresholds = this.config.confirmationThresholds;
    
    // Auto-approve per daily cleanup
    if (operation.type === 'DAILY') {
      return false;
    }

    // Auto-approve per operazioni low risk
    if (operation.riskLevel === 'LOW') {
      return false;
    }

    // Richiedi confirmation se sopra le soglie
    if (operation.totalItems > thresholds.itemCount) {
      return true;
    }

    // TODO: Calcolare percentage of quota quando avremo accesso storage health
    
    return operation.riskLevel === 'MEDIUM' || operation.riskLevel === 'HIGH' || operation.riskLevel === 'CRITICAL';
  }

  /**
   * Richiede conferma utente per l'operazione
   */
  private async requestUserConfirmation(operation: CleanupOperation): Promise<boolean> {
    console.log(`❓ Richiesta conferma per cleanup operation ${operation.id}`);
    
    // Per ora returniamo true - in una implementazione reale questo
    // mostrerebbe un dialog di conferma all'utente
    
    const confirmationData = {
      operationType: operation.type,
      layer: operation.layer,
      itemCount: operation.totalItems,
      spaceToFree: this.formatBytes(operation.totalSize),
      riskLevel: operation.riskLevel,
      preview: operation.itemsToClean.slice(0, 5).map(item => item.description)
    };

    console.log('📋 Confirmation data:', confirmationData);
    
    // Simulate user confirmation delay
    await this.sleep(100);
    
    // Auto-approve per ora - in futuro sarà un dialog reale
    return true;
  }

  /**
   * Setup del tracking LRU
   */
  private setupLRUTracking(): void {
    // Track accessi ai dati per LRU
    this.trackDataAccess = this.trackDataAccess.bind(this);
    
    // In una implementazione reale, questo si collegherebbe agli eventi
    // di accesso dei vari servizi cache
  }

  /**
   * Traccia accesso ai dati per LRU
   */
  public trackDataAccess(key: string, layer: 'L1' | 'L2' | 'L3'): void {
    this.lruTracker.set(key, Date.now());
    
    // Salva periodicamente per persistenza
    if (Math.random() < 0.01) { // 1% delle volte
      this.saveLRUTracker();
    }
  }

  /**
   * Utility methods
   */
  private generateOperationId(): string {
    return `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateDataSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1024; // Default 1KB
    }
  }

  private identifyDataType(key: string): string {
    if (key.includes('stock')) return 'stock-data';
    if (key.includes('market')) return 'market-data';
    if (key.includes('analysis')) return 'analysis-data';
    return 'unknown';
  }

  private assessDataPriority(key: string, data: any): 'low' | 'medium' | 'high' | 'critical' {
    // Logica semplificata - in realtà sarebbe più complessa
    if (key.includes('critical') || key.includes('config')) return 'critical';
    if (key.includes('recent') || key.includes('active')) return 'high';
    if (key.includes('cache') || key.includes('temp')) return 'low';
    return 'medium';
  }

  private assessCleanupRisk(items: CleanupItem[], layer?: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalItems = items.filter(item => item.priority === 'critical').length;
    const highItems = items.filter(item => item.priority === 'high').length;
    const totalItems = items.length;

    if (criticalItems > 0) return 'CRITICAL';
    if (highItems > totalItems * 0.5) return 'HIGH';
    if (totalItems > 1000) return 'MEDIUM';
    return 'LOW';
  }

  private calculateETA(processed: number, total: number, startTime: number): number {
    if (processed === 0) return 0;
    
    const elapsed = Date.now() - startTime;
    const avgTimePerItem = elapsed / processed;
    const remaining = total - processed;
    
    return remaining * avgTimePerItem;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Persistence methods
   */
  private loadLRUTracker(): void {
    try {
      const saved = localStorage.getItem('cleanup_lru_tracker');
      if (saved) {
        const data = JSON.parse(saved);
        this.lruTracker = new Map(data);
      }
    } catch (error) {
      console.warn('⚠️ Errore loading LRU tracker:', error);
    }
  }

  private saveLRUTracker(): void {
    try {
      const data = Array.from(this.lruTracker.entries());
      localStorage.setItem('cleanup_lru_tracker', JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Errore saving LRU tracker:', error);
    }
  }

  private loadCleanupHistory(): void {
    try {
      const saved = localStorage.getItem('cleanup_history');
      if (saved) {
        this.cleanupHistory = JSON.parse(saved);
        // Mantieni solo gli ultimi 100 report
        this.cleanupHistory = this.cleanupHistory.slice(-100);
      }
    } catch (error) {
      console.warn('⚠️ Errore loading cleanup history:', error);
    }
  }

  private addCleanupReport(report: CleanupReport): void {
    this.cleanupHistory.push(report);
    
    // Mantieni solo gli ultimi 100 report
    if (this.cleanupHistory.length > 100) {
      this.cleanupHistory = this.cleanupHistory.slice(-100);
    }
    
    // Salva su localStorage
    try {
      localStorage.setItem('cleanup_history', JSON.stringify(this.cleanupHistory));
    } catch (error) {
      console.warn('⚠️ Errore saving cleanup history:', error);
    }
  }

  /**
   * Event listeners
   */
  private setupEventListeners(): void {
    // Cleanup quando finestra si chiude
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('beforeunload', () => {
        this.shutdown();
      });
    }
  }

  private notifyProgressListeners(progress: CleanupProgress): void {
    this.progressListeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        console.error('❌ Errore notifica progress listener:', error);
      }
    });
  }

  private notifyCompletionListeners(report: CleanupReport): void {
    this.completionListeners.forEach(listener => {
      try {
        listener(report);
      } catch (error) {
        console.error('❌ Errore notifica completion listener:', error);
      }
    });
  }

  /**
   * Public API
   */
  public onProgress(callback: (progress: CleanupProgress) => void): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  public onCompletion(callback: (report: CleanupReport) => void): () => void {
    this.completionListeners.add(callback);
    return () => this.completionListeners.delete(callback);
  }

  public getCleanupHistory(): CleanupReport[] {
    return [...this.cleanupHistory];
  }

  public getCurrentOperations(): CleanupOperation[] {
    return Array.from(this.currentOperations.values());
  }

  public getConfig(): CleanupConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Riavvia scheduler se configurazione cambiata
    if (newConfig.dailyCleanupTime || newConfig.enableDailyCleanup !== undefined) {
      if (this.dailyCleanupTimer) {
        clearTimeout(this.dailyCleanupTimer);
      }
      this.startDailyCleanupScheduler();
    }
  }

  public async forceCleanup(layer?: 'L1' | 'L2' | 'L3'): Promise<boolean> {
    if (layer) {
      return this.performLRUCleanup(layer);
    } else {
      // Cleanup di tutti i layer
      const results = await Promise.all([
        this.performLRUCleanup('L1'),
        this.performLRUCleanup('L2'),
        this.performLRUCleanup('L3')
      ]);
      
      return results.every(result => result);
    }
  }

  public cancelCleanup(): void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.dailyCleanupTimer) {
      clearTimeout(this.dailyCleanupTimer);
      this.dailyCleanupTimer = undefined;
    }
    this.isRunning = false;
  }

  public shutdown(): void {
    console.log('🛑 Shutdown AutomaticCleanupService...');
    
    // Ferma scheduler
    if (this.dailyCleanupTimer) {
      clearTimeout(this.dailyCleanupTimer);
    }
    
    // Cancella operazioni in corso
    this.currentOperations.forEach(operation => {
      operation.status = 'CANCELLED';
    });
    
    // Salva dati
    this.saveLRUTracker();
    
    // Clear listeners
    this.progressListeners.clear();
    this.completionListeners.clear();
  }

  private async loadSchedule(): Promise<void> {
    try {
      const savedSchedule = localStorage.getItem('__cleanup_schedule__');
      if (savedSchedule) {
        this.schedule = JSON.parse(savedSchedule);
      }
    } catch (error) {
      console.warn('Failed to load cleanup schedule:', error);
      // Usa i valori di default
      this.schedule = {
        lastCleanup: 0,
        nextCleanup: Date.now() + this.defaultInterval,
        interval: this.defaultInterval
      };
    }
  }

  private async saveSchedule(): Promise<void> {
    try {
      localStorage.setItem('__cleanup_schedule__', JSON.stringify(this.schedule));
    } catch (error) {
      console.warn('Failed to save cleanup schedule:', error);
    }
  }

  private async scheduleCleanup(): Promise<void> {
    if (this.cleanupTimer) {
      window.clearTimeout(this.cleanupTimer);
    }

    const now = Date.now();
    const timeUntilNextCleanup = Math.max(0, this.schedule.nextCleanup - now);

    this.cleanupTimer = window.setTimeout(() => {
      this.performCleanup();
    }, timeUntilNextCleanup);
  }

  private async performCleanup(): Promise<void> {
    try {
      console.log('Starting automatic cleanup...');
      // Controlli di sicurezza: esegui .clear solo se l'oggetto esiste e ha il metodo
      if (this.memoryCache && typeof this.memoryCache.clear === 'function') {
        this.memoryCache.clear();
      } else {
        console.warn('[AutomaticCleanupService] memoryCache non inizializzato o senza metodo clear');
      }
      if (this.localStorageCache && typeof this.localStorageCache.clear === 'function') {
        this.localStorageCache.clear();
      } else {
        console.warn('[AutomaticCleanupService] localStorageCache non inizializzato o senza metodo clear');
      }
      if (this.indexedDBCache && typeof this.indexedDBCache.clear === 'function') {
        await this.indexedDBCache.clear();
      } else {
        console.warn('[AutomaticCleanupService] indexedDBCache non inizializzato o senza metodo clear');
      }
      // Aggiorna lo schedule
      this.schedule.lastCleanup = Date.now();
      this.schedule.nextCleanup = this.schedule.lastCleanup + this.schedule.interval;
      // Salva lo schedule
      await this.saveSchedule();
      // Programma la prossima pulizia
      this.scheduleCleanup();
      console.log('Automatic cleanup completed successfully');
    } catch (error) {
      console.error('Automatic cleanup failed:', error);
      throw error;
    }
  }

  private getCleanupSchedule(): CleanupSchedule {
    return { ...this.schedule };
  }
}

// Export singleton instance
export const automaticCleanup = AutomaticCleanupService.getInstance();
export default AutomaticCleanupService;

// Export types
export type {
  CleanupConfig, CleanupItem,
  CleanupOperation,
  CleanupProgress, CleanupReport
};

