/**
 * ManualStorageManagementService - Gestione Manuale Memoria Enterprise
 * 
 * Questo servizio fornisce controlli granulari per la gestione manuale della memoria,
 * permettendo agli utenti di visualizzare, analizzare e pulire selettivamente
 * diversi tipi di dati finanziari con precisione chirurgica.
 * 
 * Features:
 * - Storage visualization con breakdown dettagliato
 * - Selective cleanup per tipo dati
 * - Clear cache con confirmation e undo
 * - Analytics avanzate per decision making
 */

import { localStorageCacheL2 } from '../features/cache/services/LocalStorageCacheL2';
import { memoryCacheL1 } from '../features/cache/services/MemoryCacheL1';

interface DataCategory {
  type: string;
  name: string;
  description: string;
  size: number;
  count: number;
  lastAccessed: number;
  symbols: string[];
  layer: 'L1' | 'L2' | 'L3' | 'ALL';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface StorageBreakdown {
  byLayer: {
    L1: LayerBreakdown;
    L2: LayerBreakdown;
    L3: LayerBreakdown;
  };
  byType: Record<string, DataCategory>;
  bySymbol: Record<string, SymbolBreakdown>;
  timeline: TimelinePoint[];
  totalSize: number;
  totalCount: number;
  lastUpdated: number;
}

interface LayerBreakdown {
  totalSize: number;
  usedSize: number;
  quota: number;
  itemCount: number;
  categories: Record<string, number>;
  usagePercentage: number;
  performanceImpact: number;
}

interface SymbolBreakdown {
  symbol: string;
  totalSize: number;
  count: number;
  categories: Record<string, number>;
  lastAccessed: number;
  layers: ('L1' | 'L2' | 'L3')[];
}

interface TimelinePoint {
  timestamp: number;
  totalSize: number;
  categories: Record<string, number>;
  operations: string[];
}

interface SelectiveCleanupOptions {
  dataTypes?: string[];
  symbols?: string[];
  layers?: ('L1' | 'L2' | 'L3')[];
  olderThan?: number; // milliseconds
  largerThan?: number; // bytes
  excludeCritical?: boolean;
  preview?: boolean;
}

interface CleanupPreview {
  itemsToDelete: CleanupItem[];
  totalSize: number;
  totalCount: number;
  layersAffected: ('L1' | 'L2' | 'L3')[];
  symbolsAffected: string[];
  categoriesAffected: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impact: {
    performance: number;
    storage: number;
    functionality: string[];
  };
}

interface CleanupItem {
  key: string;
  layer: 'L1' | 'L2' | 'L3';
  size: number;
  type: string;
  symbol?: string;
  lastAccessed: number;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ClearCacheOptions {
  layers?: ('L1' | 'L2' | 'L3')[];
  confirmationLevel?: 'ALWAYS_ASK' | 'ASKiF_RISKY' | 'NEVER_ASK';
  createBackup?: boolean;
  excludeTypes?: string[];
  preserveCritical?: boolean;
}

interface ManualOperationResult {
  success: boolean;
  itemsProcessed: number;
  spaceFreed: number;
  duration: number;
  errors: string[];
  backupId?: string;
  undoAvailable: boolean;
}

class ManualStorageManagementService {
  private static instance: ManualStorageManagementService;
  private storageBreakdown: StorageBreakdown | null = null;
  private lastAnalysis: number = 0;
  private analysisInterval = 30000; // 30 seconds
  private backups = new Map<string, any>();
  private maxBackups = 5;

  constructor() {
    this.setupPeriodicAnalysis();
  }

  public static getInstance(): ManualStorageManagementService {
    if (!ManualStorageManagementService.instance) {
      ManualStorageManagementService.instance = new ManualStorageManagementService();
    }
    return ManualStorageManagementService.instance;
  }

  /**
   * Analizza e categorizza tutti i dati di storage
   */
  public async analyzeStorageBreakdown(force: boolean = false): Promise<StorageBreakdown> {
    const now = Date.now();
    
    if (!force && this.storageBreakdown && (now - this.lastAnalysis) < this.analysisInterval) {
      return this.storageBreakdown;
    }

    console.log('🔍 Analyzing storage breakdown...');

    try {
      const breakdown: StorageBreakdown = {
        byLayer: {
          L1: await this.analyzeLayer('L1'),
          L2: await this.analyzeLayer('L2'),
          L3: await this.analyzeLayer('L3')
        },
        byType: {},
        bySymbol: {},
        timeline: await this.getStorageTimeline(),
        totalSize: 0,
        totalCount: 0,
        lastUpdated: now
      };

      // Aggregate data by type and symbol
      await this.aggregateDataCategories(breakdown);

      // Calculate totals
      breakdown.totalSize = Object.values(breakdown.byType).reduce((sum, cat) => sum + cat.size, 0);
      breakdown.totalCount = Object.values(breakdown.byType).reduce((sum, cat) => sum + cat.count, 0);

      this.storageBreakdown = breakdown;
      this.lastAnalysis = now;

      console.log('✅ Storage breakdown analysis completed', {
        totalSize: this.formatBytes(breakdown.totalSize),
        totalCount: breakdown.totalCount,
        categories: Object.keys(breakdown.byType).length
      });

      return breakdown;

    } catch (error) {
      console.error('❌ Error analyzing storage breakdown:', error);
      throw error;
    }
  }

  /**
   * Analizza un singolo layer
   */
  private async analyzeLayer(layer: 'L1' | 'L2' | 'L3'): Promise<LayerBreakdown> {
    try {
      let totalSize = 0;
      let usedSize = 0;
      let quota = 0;
      let itemCount = 0;
      const categories: Record<string, number> = {};

      switch (layer) {
        case 'L1':
          const l1Stats = memoryCacheL1.getStats();
          const l1Keys = Object.keys(localStorage).filter(key => key.startsWith('l1_cache_'));
          
          quota = l1Stats.maxSize || 0;
          usedSize = l1Stats.memoryUsage || 0;
          itemCount = l1Keys.length;
          
          for (const key of l1Keys) {
            const data = memoryCacheL1.get(key);
            if (data) {
              const size = this.estimateDataSize(data);
              totalSize += size;
              
              const category = this.categorizeDataByKey(key);
              categories[category] = (categories[category] || 0) + size;
            }
          }
          break;

        case 'L2':
          const l2Stats = localStorageCacheL2.getStats();
          const l2Keys = Object.keys(localStorage).filter(key => key.startsWith('l2_cache_'));
          
          quota = 5 * 1024 * 1024; // 5MB default quota for L2 LocalStorage
          usedSize = l2Stats.totalSize || 0;
          itemCount = l2Keys.length;
          
          for (const key of l2Keys) {
            const data = localStorageCacheL2.get(key);
            if (data) {
              const size = this.estimateDataSize(data);
              totalSize += size;
              
              const category = this.categorizeDataByKey(key);
              categories[category] = (categories[category] || 0) + size;
            }
          }
          break;

        case 'L3':
          // TODO: Implementare quando avremo accesso completo ai dati L3
          quota = 50 * 1024 * 1024; // 50MB default
          break;
      }

      const usagePercentage = quota > 0 ? (usedSize / quota) * 100 : 0;
      const performanceImpact = this.calculatePerformanceImpact(layer, usagePercentage);

      return {
        totalSize,
        usedSize,
        quota,
        itemCount,
        categories,
        usagePercentage,
        performanceImpact
      };

    } catch (error) {
      console.error(`❌ Error analyzing ${layer}:`, error);
      return {
        totalSize: 0,
        usedSize: 0,
        quota: 0,
        itemCount: 0,
        categories: {},
        usagePercentage: 0,
        performanceImpact: 0
      };
    }
  }

  /**
   * Aggrega dati per categoria e simbolo
   */
  private async aggregateDataCategories(breakdown: StorageBreakdown): Promise<void> {
    const dataByType: Record<string, DataCategory> = {};
    const dataBySymbol: Record<string, SymbolBreakdown> = {};

    for (const layer of ['L1', 'L2', 'L3'] as const) {
      try {
        const items = await this.getLayerItems(layer);
        
        for (const item of items) {
          const category = this.categorizeDataByKey(item.key);
          const symbol = this.extractSymbolFromKey(item.key);

          // Aggregate by type
          if (!dataByType[category]) {
            dataByType[category] = {
              type: category,
              name: this.getCategoryDisplayName(category),
              description: this.getCategoryDescription(category),
              size: 0,
              count: 0,
              lastAccessed: 0,
              symbols: [],
              layer: 'ALL',
              priority: this.getCategoryPriority(category)
            };
          }

          dataByType[category].size += item.size;
          dataByType[category].count += 1;
          dataByType[category].lastAccessed = Math.max(
            dataByType[category].lastAccessed,
            item.lastAccessed
          );

          if (symbol && !dataByType[category].symbols.includes(symbol)) {
            dataByType[category].symbols.push(symbol);
          }

          // Aggregate by symbol
          if (symbol) {
            if (!dataBySymbol[symbol]) {
              dataBySymbol[symbol] = {
                symbol,
                totalSize: 0,
                count: 0,
                categories: {},
                lastAccessed: 0,
                layers: []
              };
            }

            dataBySymbol[symbol].totalSize += item.size;
            dataBySymbol[symbol].count += 1;
            dataBySymbol[symbol].categories[category] = 
              (dataBySymbol[symbol].categories[category] || 0) + item.size;
            dataBySymbol[symbol].lastAccessed = Math.max(
              dataBySymbol[symbol].lastAccessed,
              item.lastAccessed
            );

            if (!dataBySymbol[symbol].layers.includes(layer)) {
              dataBySymbol[symbol].layers.push(layer);
            }
          }
        }

      } catch (error) {
        console.error(`❌ Error aggregating ${layer} data:`, error);
      }
    }

    breakdown.byType = dataByType;
    breakdown.bySymbol = dataBySymbol;
  }

  /**
   * Ottiene tutti gli elementi di un layer
   */
  private async getLayerItems(layer: 'L1' | 'L2' | 'L3'): Promise<CleanupItem[]> {
    const items: CleanupItem[] = [];

    try {
      switch (layer) {
        case 'L1':
          const l1Keys = Object.keys(localStorage).filter(key => key.startsWith('l1_cache_'));
          for (const key of l1Keys) {
            const data = memoryCacheL1.get(key);
            if (data) {
              items.push({
                key,
                layer: 'L1',
                size: this.estimateDataSize(data),
                type: this.categorizeDataByKey(key),
                symbol: this.extractSymbolFromKey(key),
                lastAccessed: this.getLastAccessed(key),
                description: this.generateItemDescription(key, layer),
                priority: this.assessDataPriority(key, data)
              });
            }
          }
          break;

        case 'L2':
          const l2Keys = Object.keys(localStorage).filter(key => key.startsWith('l2_cache_'));
          for (const key of l2Keys) {
            const data = localStorageCacheL2.get(key);
            if (data) {
              items.push({
                key,
                layer: 'L2',
                size: this.estimateDataSize(data),
                type: this.categorizeDataByKey(key),
                symbol: this.extractSymbolFromKey(key),
                lastAccessed: this.getLastAccessed(key),
                description: this.generateItemDescription(key, layer),
                priority: this.assessDataPriority(key, data)
              });
            }
          }
          break;

        case 'L3':
          // TODO: Implementare quando avremo accesso ai dati L3
          break;
      }

      return items;

    } catch (error) {
      console.error(`❌ Error getting ${layer} items:`, error);
      return [];
    }
  }

  /**
   * Genera preview per selective cleanup
   */
  public async generateCleanupPreview(options: SelectiveCleanupOptions): Promise<CleanupPreview> {
    console.log('🔍 Generating cleanup preview...', options);

    try {
      const itemsToDelete: CleanupItem[] = [];
      const layersAffected = new Set<'L1' | 'L2' | 'L3'>();
      const symbolsAffected = new Set<string>();
      const categoriesAffected = new Set<string>();

      const targetLayers = options.layers || ['L1', 'L2', 'L3'];

      for (const layer of targetLayers) {
        const layerItems = await this.getLayerItems(layer);
        
        for (const item of layerItems) {
          if (this.itemMatchesCleanupCriteria(item, options)) {
            itemsToDelete.push(item);
            layersAffected.add(item.layer);
            
            if (item.symbol) {
              symbolsAffected.add(item.symbol);
            }
            
            categoriesAffected.add(item.type);
          }
        }
      }

      const totalSize = itemsToDelete.reduce((sum, item) => sum + item.size, 0);
      const riskLevel = this.assessCleanupRisk(itemsToDelete);
      const impact = this.calculateCleanupImpact(itemsToDelete);

      const preview: CleanupPreview = {
        itemsToDelete,
        totalSize,
        totalCount: itemsToDelete.length,
        layersAffected: Array.from(layersAffected),
        symbolsAffected: Array.from(symbolsAffected),
        categoriesAffected: Array.from(categoriesAffected),
        riskLevel,
        impact
      };

      console.log('✅ Cleanup preview generated:', {
        items: preview.totalCount,
        size: this.formatBytes(preview.totalSize),
        risk: preview.riskLevel
      });

      return preview;

    } catch (error) {
      console.error('❌ Error generating cleanup preview:', error);
      throw error;
    }
  }

  /**
   * Esegue selective cleanup
   */
  public async executeSelectiveCleanup(
    options: SelectiveCleanupOptions,
    confirmed: boolean = false
  ): Promise<ManualOperationResult> {
    console.log('🧹 Executing selective cleanup...', options);

    const startTime = Date.now();
    const result: ManualOperationResult = {
      success: false,
      itemsProcessed: 0,
      spaceFreed: 0,
      duration: 0,
      errors: [],
      undoAvailable: false
    };

    try {
      // Generate preview first
      const preview = await this.generateCleanupPreview(options);
      
      if (!confirmed && this.needsUserConfirmation(preview)) {
        throw new Error('User confirmation required for this operation');
      }

      // Create backup if needed
      let backupId: string | undefined;
      if (this.shouldCreateBackup(preview)) {
        backupId = await this.createBackup(preview.itemsToDelete);
        result.backupId = backupId;
        result.undoAvailable = true;
      }

      // Execute cleanup
      for (const item of preview.itemsToDelete) {
        try {
          let itemFreedSize = 0;

          switch (item.layer) {
            case 'L1':
              if (await memoryCacheL1.has(item.key)) {
                await memoryCacheL1.delete(item.key);
                itemFreedSize = item.size;
              }
              break;

            case 'L2':
              if (await localStorageCacheL2.has(item.key)) {
                await localStorageCacheL2.delete(item.key);
                itemFreedSize = item.size;
              }
              break;

            case 'L3':
              // TODO: Implementare cleanup L3
              break;
          }

          result.spaceFreed += itemFreedSize;
          result.itemsProcessed++;

        } catch (itemError) {
          const errorMsg = `Failed to delete ${item.key}: ${itemError}`;
          result.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      // Invalidate cached analysis
      this.lastAnalysis = 0;

      console.log('✅ Selective cleanup completed:', result);
      return result;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      result.errors.push(error instanceof Error ? error.message : String(error));
      
      console.error('❌ Selective cleanup failed:', error);
      return result;
    }
  }

  /**
   * Clear cache con opzioni avanzate
   */
  public async clearCache(options: ClearCacheOptions = {}): Promise<ManualOperationResult> {
    console.log('🗑️ Clearing cache...', options);

    const startTime = Date.now();
    const result: ManualOperationResult = {
      success: false,
      itemsProcessed: 0,
      spaceFreed: 0,
      duration: 0,
      errors: [],
      undoAvailable: false
    };

    try {
      const targetLayers = options.layers || ['L1', 'L2', 'L3'];
      
      // Analyze what will be cleared
      const itemsToDelete: CleanupItem[] = [];
      for (const layer of targetLayers) {
        const layerItems = await this.getLayerItems(layer);
        for (const item of layerItems) {
          if (this.shouldClearItem(item, options)) {
            itemsToDelete.push(item);
          }
        }
      }

      const riskLevel = this.assessCleanupRisk(itemsToDelete);
      
      // Check if confirmation is needed
      const needsConfirmation = options.confirmationLevel === 'ALWAYS_ASK' ||
        (options.confirmationLevel === 'ASKiF_RISKY' && riskLevel !== 'LOW');

      if (needsConfirmation) {
        throw new Error('User confirmation required for clear cache operation');
      }

      // Create backup if requested
      let backupId: string | undefined;
      if (options.createBackup) {
        backupId = await this.createBackup(itemsToDelete);
        result.backupId = backupId;
        result.undoAvailable = true;
      }

      // Execute clear operations
      for (const layer of targetLayers) {
        try {
          let layerSpaceFreed = 0;
          let layerItemsProcessed = 0;

          switch (layer) {
            case 'L1':
              const l1Items = await this.getLayerItems('L1');
              
              for (const item of l1Items) {
                if (this.shouldClearItem(item, options)) {
                  if (await memoryCacheL1.has(item.key)) {
                    await memoryCacheL1.delete(item.key);
                    layerSpaceFreed += item.size;
                    layerItemsProcessed++;
                  }
                }
              }
              break;

            case 'L2':
              const l2Items = await this.getLayerItems('L2');
              
              for (const item of l2Items) {
                if (this.shouldClearItem(item, options)) {
                  if (await localStorageCacheL2.has(item.key)) {
                    await localStorageCacheL2.delete(item.key);
                    layerSpaceFreed += item.size;
                    layerItemsProcessed++;
                  }
                }
              }
              break;

            case 'L3':
              // TODO: Implementare clear L3
              break;
          }

          result.spaceFreed += layerSpaceFreed;
          result.itemsProcessed += layerItemsProcessed;

          console.log(`✅ ${layer} cleared: ${layerItemsProcessed} items, ${this.formatBytes(layerSpaceFreed)}`);

        } catch (layerError) {
          const errorMsg = `Failed to clear ${layer}: ${layerError}`;
          result.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      // Invalidate cached analysis
      this.lastAnalysis = 0;

      console.log('✅ Cache clear completed:', result);
      return result;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      result.errors.push(error instanceof Error ? error.message : String(error));
      
      console.error('❌ Cache clear failed:', error);
      return result;
    }
  }

  /**
   * Crea backup temporaneo
   */
  private async createBackup(items: CleanupItem[]): Promise<string> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const backupData: Record<string, any> = {};

    try {
      for (const item of items) {
        try {
          let data: any = null;

          switch (item.layer) {
            case 'L1':
              data = memoryCacheL1.get(item.key);
              break;
            case 'L2':
              data = localStorageCacheL2.get(item.key);
              break;
            case 'L3':
              // TODO: Implementare backup L3
              break;
          }

          if (data !== null) {
            backupData[`${item.layer}:${item.key}`] = {
              data,
              metadata: {
                layer: item.layer,
                size: item.size,
                type: item.type,
                symbol: item.symbol,
                lastAccessed: item.lastAccessed
              }
            };
          }

        } catch (itemError) {
          console.warn(`⚠️ Failed to backup ${item.key}:`, itemError);
        }
      }

      // Store backup with expiration
      this.backups.set(backupId, {
        data: backupData,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      });

      // Cleanup old backups
      this.cleanupOldBackups();

      console.log(`💾 Backup created: ${backupId} (${Object.keys(backupData).length} items)`);
      return backupId;

    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Ripristina da backup
   */
  public async restoreFromBackup(backupId: string): Promise<ManualOperationResult> {
    console.log(`🔄 Restoring from backup: ${backupId}`);

    const startTime = Date.now();
    const result: ManualOperationResult = {
      success: false,
      itemsProcessed: 0,
      spaceFreed: 0,
      duration: 0,
      errors: [],
      undoAvailable: false
    };

    try {
      const backup = this.backups.get(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found or expired`);
      }

      if (Date.now() > backup.expiresAt) {
        this.backups.delete(backupId);
        throw new Error(`Backup ${backupId} has expired`);
      }

      for (const [fullKey, backupItem] of Object.entries(backup.data)) {
        try {
          const { data, metadata } = backupItem as any;
          const key = fullKey.split(':').slice(1).join(':'); // Remove layer prefix

          switch (metadata.layer) {
            case 'L1':
              memoryCacheL1.set(key, data);
              result.itemsProcessed++;
              break;

            case 'L2':
              localStorageCacheL2.set(key, data, undefined, metadata.type);
              result.itemsProcessed++;
              break;

            case 'L3':
              // TODO: Implementare restore L3
              break;
          }

        } catch (itemError) {
          const errorMsg = `Failed to restore ${fullKey}: ${itemError}`;
          result.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      // Invalidate cached analysis
      this.lastAnalysis = 0;

      console.log('✅ Backup restore completed:', result);
      return result;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      result.errors.push(error instanceof Error ? error.message : String(error));
      
      console.error('❌ Backup restore failed:', error);
      return result;
    }
  }

  /**
   * Utility methods
   */
  private itemMatchesCleanupCriteria(item: CleanupItem, options: SelectiveCleanupOptions): boolean {
    // Check data types
    if (options.dataTypes && !options.dataTypes.includes(item.type)) {
      return false;
    }

    // Check symbols
    if (options.symbols && item.symbol && !options.symbols.includes(item.symbol)) {
      return false;
    }

    // Check layers
    if (options.layers && !options.layers.includes(item.layer)) {
      return false;
    }

    // Check age
    if (options.olderThan && (Date.now() - item.lastAccessed) < options.olderThan) {
      return false;
    }

    // Check size
    if (options.largerThan && item.size < options.largerThan) {
      return false;
    }

    // Check critical exclusion
    if (options.excludeCritical && item.priority === 'critical') {
      return false;
    }

    return true;
  }

  private shouldClearItem(item: CleanupItem, options: ClearCacheOptions): boolean {
    // Check excluded types
    if (options.excludeTypes && options.excludeTypes.includes(item.type)) {
      return false;
    }

    // Check critical preservation
    if (options.preserveCritical && item.priority === 'critical') {
      return false;
    }

    return true;
  }

  private needsUserConfirmation(preview: CleanupPreview): boolean {
    return preview.riskLevel !== 'LOW' || preview.totalCount > 100;
  }

  private shouldCreateBackup(preview: CleanupPreview): boolean {
    return preview.riskLevel !== 'LOW' || preview.totalSize > 1024 * 1024; // 1MB
  }

  private assessCleanupRisk(items: CleanupItem[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalItems = items.filter(item => item.priority === 'critical').length;
    const highItems = items.filter(item => item.priority === 'high').length;
    const totalItems = items.length;

    if (criticalItems > 0) return 'CRITICAL';
    if (highItems > totalItems * 0.5) return 'HIGH';
    if (totalItems > 1000) return 'MEDIUM';
    return 'LOW';
  }

  private calculateCleanupImpact(items: CleanupItem[]) {
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);
    const performance = Math.min(100, (totalSize / (10 * 1024 * 1024)) * 100); // 0-100 based on 10MB scale
    const storage = totalSize;
    const functionality: string[] = [];

    const criticalCount = items.filter(item => item.priority === 'critical').length;
    if (criticalCount > 0) {
      functionality.push(`${criticalCount} critical functionalities may be affected`);
    }

    return { performance, storage, functionality };
  }

  private categorizeDataByKey(key: string): string {
    if (key.includes('stock-data')) return 'stock-data';
    if (key.includes('fundamentals')) return 'fundamentals';
    if (key.includes('market')) return 'market-data';
    if (key.includes('analysis')) return 'analysis-data';
    if (key.includes('config')) return 'configuration';
    if (key.includes('cache')) return 'cache-meta';
    return 'unknown';
  }

  private extractSymbolFromKey(key: string): string | undefined {
    const patterns = [
      /stock-data:([A-Z]+):/,
      /fundamentals:([A-Z]+):/,
      /analysis:([A-Z]+):/
    ];

    for (const pattern of patterns) {
      const match = key.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return undefined;
  }

  private getLastAccessed(key: string): number {
    // Get from LRU tracker if available
    try {
      const saved = localStorage.getItem('cleanup_lru_tracker');
      if (saved) {
        const lruData = new Map(JSON.parse(saved));
        const lastAccess = lruData.get(key);
        return typeof lastAccess === 'number' ? lastAccess : 0;
      }
    } catch {
      // Fallback to current time
    }
    
    return Date.now();
  }

  private generateItemDescription(key: string, layer: string): string {
    const category = this.categorizeDataByKey(key);
    const symbol = this.extractSymbolFromKey(key);
    
    if (symbol) {
      return `${category} for ${symbol} (${layer})`;
    }
    
    return `${category} data (${layer})`;
  }

  private assessDataPriority(key: string, data: any): 'low' | 'medium' | 'high' | 'critical' {
    if (key.includes('config') || key.includes('critical')) return 'critical';
    if (key.includes('recent') || key.includes('active')) return 'high';
    if (key.includes('cache') || key.includes('temp')) return 'low';
    return 'medium';
  }

  private getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      'stock-data': 'Stock Price Data',
      'fundamentals': 'Company Fundamentals',
      'market-data': 'Market Data',
      'analysis-data': 'Analysis Results',
      'configuration': 'Configuration',
      'cache-meta': 'Cache Metadata',
      'unknown': 'Unknown Data'
    };
    
    return names[category] || category;
  }

  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      'stock-data': 'Historical and real-time stock price information',
      'fundamentals': 'Company financial statements and ratios',
      'market-data': 'Market indices and sector information',
      'analysis-data': 'Portfolio analysis and calculation results',
      'configuration': 'Application settings and user preferences',
      'cache-meta': 'Internal cache management data',
      'unknown': 'Unclassified data'
    };
    
    return descriptions[category] || 'No description available';
  }

  private getCategoryPriority(category: string): 'low' | 'medium' | 'high' | 'critical' {
    const priorities: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'configuration': 'critical',
      'analysis-data': 'high',
      'fundamentals': 'medium',
      'stock-data': 'medium',
      'market-data': 'low',
      'cache-meta': 'low',
      'unknown': 'low'
    };
    
    return priorities[category] || 'low';
  }

  private calculatePerformanceImpact(layer: string, usagePercentage: number): number {
    // L1 has higher performance impact when full
    const multiplier = layer === 'L1' ? 2 : layer === 'L2' ? 1.5 : 1;
    return Math.min(100, usagePercentage * multiplier);
  }

  private estimateDataSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1024; // Default 1KB
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private async getStorageTimeline(): Promise<TimelinePoint[]> {
    // TODO: Implement storage timeline tracking
    return [];
  }

  private setupPeriodicAnalysis(): void {
    // Update analysis every 30 seconds if needed
    setInterval(() => {
      if (this.storageBreakdown && (Date.now() - this.lastAnalysis) > this.analysisInterval) {
        this.analyzeStorageBreakdown(false).catch(error => {
          console.warn('⚠️ Periodic analysis failed:', error);
        });
      }
    }, this.analysisInterval);
  }

  private cleanupOldBackups(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, backup] of this.backups.entries()) {
      if (now > backup.expiresAt) {
        expired.push(id);
      }
    }

    expired.forEach(id => this.backups.delete(id));

    // Keep only the most recent backups
    if (this.backups.size > this.maxBackups) {
      const sortedBackups = Array.from(this.backups.entries())
        .sort((a, b) => b[1].createdAt - a[1].createdAt);
      
      const toDelete = sortedBackups.slice(this.maxBackups);
      toDelete.forEach(([id]) => this.backups.delete(id));
    }
  }

  /**
   * Public API
   */
  public getStorageBreakdown(): StorageBreakdown | null {
    return this.storageBreakdown;
  }

  public getAvailableBackups(): string[] {
    this.cleanupOldBackups();
    return Array.from(this.backups.keys());
  }

  public async refreshAnalysis(): Promise<StorageBreakdown> {
    return this.analyzeStorageBreakdown(true);
  }
}

// Export singleton instance
export const manualStorageManagement = ManualStorageManagementService.getInstance();
export default ManualStorageManagementService;

// Export types
export type {
    CleanupItem, CleanupPreview, ClearCacheOptions, DataCategory, LayerBreakdown, ManualOperationResult, SelectiveCleanupOptions, StorageBreakdown, SymbolBreakdown
};

