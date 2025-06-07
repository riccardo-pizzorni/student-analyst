import Dexie, { Table } from 'dexie';

// Interfaces for IndexedDB data structures
export interface StockDataRecord {
  id?: number;
  key: string;
  symbol: string;
  dataType: string;
  date: string;
  data: any;
  createdAt: number;
  lastAccessed: number;
  ttlExpiry: number;
  accessCount: number;
  dataSize: number;
  compressed: boolean;
}

export interface MetadataRecord {
  id?: number;
  key: string;
  symbol: string;
  dataType: string;
  totalSize: number;
  recordCount: number;
  firstCreated: number;
  lastUpdated: number;
  totalAccesses: number;
  averageAccessTime: number;
}

export interface CacheStatsL3 {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  compressionRatio: number;
  averageAccessTime: number;
  oldestEntry: number;
  newestEntry: number;
  dataTypeBreakdown: Record<string, { count: number; size: number }>;
  symbolBreakdown: Record<string, { count: number; size: number }>;
  performanceMetrics: {
    avgQueryTime: number;
    avgWriteTime: number;
    avgDeleteTime: number;
    databaseSize: number;
  };
}

// IndexedDB Database Schema
class StudentAnalystDB extends Dexie {
  stockData!: Table<StockDataRecord>;
  metadata!: Table<MetadataRecord>;

  constructor() {
    super('StudentAnalystDB');
    
    this.version(1).stores({
      stockData: '++id, key, symbol, dataType, date, ttlExpiry, lastAccessed, accessCount',
      metadata: '++id, key, symbol, dataType, lastUpdated'
    });

    // Add hooks for performance tracking
    this.stockData.hook('reading', (obj) => {
      obj.lastAccessed = Date.now();
      obj.accessCount = (obj.accessCount || 0) + 1;
      return obj;
    });
  }
}

export class IndexedDBCacheL3 {
  private db: StudentAnalystDB;
  private stats: CacheStatsL3;
  private backgroundCleanupInterval: number | null = null;
  private compressionThreshold = 1024; // 1KB threshold for compression
  private maxStorageSize = 100 * 1024 * 1024; // 100MB default limit
  private defaultTTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  private cleanupScheduleHour = 2; // 2 AM cleanup
  private performanceMetrics = {
    queryTimes: [] as number[],
    writeTimes: [] as number[],
    deleteTimes: [] as number[]
  };

  constructor() {
    this.db = new StudentAnalystDB();
    this.stats = this.initializeStats();
    this.initializeDatabase();
    this.scheduleBackgroundCleanup();
  }

  private initializeStats(): CacheStatsL3 {
    return {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      compressionRatio: 0,
      averageAccessTime: 0,
      oldestEntry: 0,
      newestEntry: 0,
      dataTypeBreakdown: {},
      symbolBreakdown: {},
      performanceMetrics: {
        avgQueryTime: 0,
        avgWriteTime: 0,
        avgDeleteTime: 0,
        databaseSize: 0
      }
    };
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await this.db.open();
      await this.updateStats();
    } catch (error) {
      console.error('[IndexedDB L3] Database initialization failed:', error);
      throw new Error('Failed to initialize IndexedDB Cache L3');
    }
  }

  // Main cache operations
  async get(key: string): Promise<any> {
    const startTime = performance.now();
    
    try {
      const record = await this.db.stockData.where('key').equals(key).first();
      
      if (!record) {
        this.stats.missCount++;
        return null;
      }

      // Check TTL expiry
      if (record.ttlExpiry < Date.now()) {
        await this.delete(key);
        this.stats.missCount++;
        return null;
      }

      // Update access tracking
      await this.db.stockData.update(record.id!, {
        lastAccessed: Date.now(),
        accessCount: record.accessCount + 1
      });

      this.stats.hitCount++;
      
      const queryTime = performance.now() - startTime;
      this.updatePerformanceMetric('query', queryTime);

      // Decompress if necessary
      let data = record.data;
      if (record.compressed && typeof data === 'string') {
        data = this.decompress(data);
      }

      return data;

    } catch (error) {
      console.error('[IndexedDB L3] Get operation failed:', error);
      this.stats.missCount++;
      return null;
    }
  }

  async set(key: string, data: any, ttl?: number): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      const now = Date.now();
      const ttlExpiry = now + (ttl || this.defaultTTL);
      
      // Parse key to extract metadata
      const { symbol, dataType, date } = this.parseKey(key);
      
      // Serialize and optionally compress data
      let serializedData = JSON.stringify(data);
      let compressed = false;
      
      if (serializedData.length > this.compressionThreshold) {
        const compressedData = this.compress(serializedData);
        if (compressedData.length < serializedData.length * 0.8) {
          serializedData = compressedData;
          compressed = true;
        }
      }

      const dataSize = this.calculateSize(serializedData);
      
      // Check storage limits
      if (await this.shouldEvict(dataSize)) {
        await this.performEviction(dataSize);
      }

      const record: StockDataRecord = {
        key,
        symbol,
        dataType,
        date,
        data: compressed ? serializedData : data,
        createdAt: now,
        lastAccessed: now,
        ttlExpiry,
        accessCount: 0,
        dataSize,
        compressed
      };

      await this.db.stockData.put(record);
      await this.updateMetadata(symbol, dataType, dataSize);
      
      const writeTime = performance.now() - startTime;
      this.updatePerformanceMetric('write', writeTime);
      
      await this.updateStats();
      return true;

    } catch (error) {
      console.error('[IndexedDB L3] Set operation failed:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      const record = await this.db.stockData.where('key').equals(key).first();
      if (record) {
        await this.db.stockData.delete(record.id!);
        this.stats.evictionCount++;
      }
      
      const deleteTime = performance.now() - startTime;
      this.updatePerformanceMetric('delete', deleteTime);
      
      return true;
    } catch (error) {
      console.error('[IndexedDB L3] Delete operation failed:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.db.stockData.clear();
      await this.db.metadata.clear();
      this.stats = this.initializeStats();
    } catch (error) {
      console.error('[IndexedDB L3] Clear operation failed:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const record = await this.db.stockData.where('key').equals(key).first();
      if (!record) return false;
      
      // Check TTL
      if (record.ttlExpiry < Date.now()) {
        await this.delete(key);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[IndexedDB L3] Has operation failed:', error);
      return false;
    }
  }

  // Background cleanup and maintenance
  private scheduleBackgroundCleanup(): void {
    const scheduleNextCleanup = () => {
      const now = new Date();
      const nextCleanup = new Date();
      nextCleanup.setHours(this.cleanupScheduleHour, 0, 0, 0);
      
      // If it's already past cleanup time today, schedule for tomorrow
      if (nextCleanup <= now) {
        nextCleanup.setDate(nextCleanup.getDate() + 1);
      }
      
      const msUntilCleanup = nextCleanup.getTime() - now.getTime();
      
      this.backgroundCleanupInterval = window.setTimeout(async () => {
        await this.performBackgroundCleanup();
        scheduleNextCleanup(); // Schedule next cleanup
      }, msUntilCleanup);
    };

    scheduleNextCleanup();
  }

  private async performBackgroundCleanup(): Promise<void> {
    try {
      console.log('[IndexedDB L3] Starting background cleanup...');
      
      const now = Date.now();
      const expiredRecords = await this.db.stockData.where('ttlExpiry').below(now).toArray();
      
      if (expiredRecords.length > 0) {
        const expiredKeys = expiredRecords.map(r => r.id!);
        await this.db.stockData.bulkDelete(expiredKeys);
        this.stats.evictionCount += expiredRecords.length;
        
        console.log(`[IndexedDB L3] Cleaned up ${expiredRecords.length} expired records`);
      }

      // Optimize database (compact)
      await this.optimizeDatabase();
      
      // Update statistics
      await this.updateStats();
      
      console.log('[IndexedDB L3] Background cleanup completed');
    } catch (error) {
      console.error('[IndexedDB L3] Background cleanup failed:', error);
    }
  }

  private async optimizeDatabase(): Promise<void> {
    try {
      // Update metadata based on current stock data
      await this.db.metadata.clear();
      
      const stockRecords = await this.db.stockData.toArray();
      const metadataMap = new Map<string, MetadataRecord>();
      
      for (const record of stockRecords) {
        const key = `${record.symbol}-${record.dataType}`;
        
        if (!metadataMap.has(key)) {
          metadataMap.set(key, {
            key,
            symbol: record.symbol,
            dataType: record.dataType,
            totalSize: 0,
            recordCount: 0,
            firstCreated: record.createdAt,
            lastUpdated: record.createdAt,
            totalAccesses: 0,
            averageAccessTime: 0
          });
        }
        
        const metadata = metadataMap.get(key)!;
        metadata.totalSize += record.dataSize;
        metadata.recordCount++;
        metadata.lastUpdated = Math.max(metadata.lastUpdated, record.createdAt);
        metadata.totalAccesses += record.accessCount;
        metadata.firstCreated = Math.min(metadata.firstCreated, record.createdAt);
      }
      
      if (metadataMap.size > 0) {
        await this.db.metadata.bulkAdd(Array.from(metadataMap.values()));
      }
    } catch (error) {
      console.error('[IndexedDB L3] Database optimization failed:', error);
    }
  }

  // Storage management
  private async shouldEvict(newDataSize: number): Promise<boolean> {
    const currentSize = await this.calculateTotalSize();
    return (currentSize + newDataSize) > this.maxStorageSize;
  }

  private async performEviction(requiredSpace: number): Promise<void> {
    try {
      // Evict least recently accessed records until we have enough space
      const records = await this.db.stockData
        .orderBy('lastAccessed')
        .limit(100)  // Process in batches
        .toArray();
      
      let freedSpace = 0;
      const recordsToDelete = [];
      
      for (const record of records) {
        recordsToDelete.push(record.id!);
        freedSpace += record.dataSize;
        
        if (freedSpace >= requiredSpace * 1.2) { // 20% buffer
          break;
        }
      }
      
      if (recordsToDelete.length > 0) {
        await this.db.stockData.bulkDelete(recordsToDelete);
        this.stats.evictionCount += recordsToDelete.length;
      }
    } catch (error) {
      console.error('[IndexedDB L3] Eviction failed:', error);
    }
  }

  private async calculateTotalSize(): Promise<number> {
    try {
      const records = await this.db.stockData.toArray();
      return records.reduce((total, record) => total + record.dataSize, 0);
    } catch (error) {
      console.error('[IndexedDB L3] Size calculation failed:', error);
      return 0;
    }
  }

  // Statistics and monitoring
  async getStats(): Promise<CacheStatsL3> {
    await this.updateStats();
    return { ...this.stats };
  }

  private async updateStats(): Promise<void> {
    try {
      const records = await this.db.stockData.toArray();
      
      this.stats.totalEntries = records.length;
      this.stats.totalSize = records.reduce((sum, r) => sum + r.dataSize, 0);
      
      // Update breakdowns
      this.stats.dataTypeBreakdown = {};
      this.stats.symbolBreakdown = {};
      
      let totalCompressedSize = 0;
      let totalUncompressedSize = 0;
      let oldestTime = Date.now();
      let newestTime = 0;
      
      for (const record of records) {
        // Data type breakdown
        if (!this.stats.dataTypeBreakdown[record.dataType]) {
          this.stats.dataTypeBreakdown[record.dataType] = { count: 0, size: 0 };
        }
        this.stats.dataTypeBreakdown[record.dataType].count++;
        this.stats.dataTypeBreakdown[record.dataType].size += record.dataSize;
        
        // Symbol breakdown
        if (!this.stats.symbolBreakdown[record.symbol]) {
          this.stats.symbolBreakdown[record.symbol] = { count: 0, size: 0 };
        }
        this.stats.symbolBreakdown[record.symbol].count++;
        this.stats.symbolBreakdown[record.symbol].size += record.dataSize;
        
        // Compression metrics
        if (record.compressed) {
          totalCompressedSize += record.dataSize;
          totalUncompressedSize += record.dataSize * 2; // Estimate
        }
        
        // Time tracking
        oldestTime = Math.min(oldestTime, record.createdAt);
        newestTime = Math.max(newestTime, record.createdAt);
      }
      
      this.stats.compressionRatio = totalUncompressedSize > 0 ? 
        (totalUncompressedSize - totalCompressedSize) / totalUncompressedSize : 0;
      
      this.stats.oldestEntry = oldestTime === Date.now() ? 0 : oldestTime;
      this.stats.newestEntry = newestTime;
      
      // Performance metrics
      this.stats.performanceMetrics = {
        avgQueryTime: this.calculateAverage(this.performanceMetrics.queryTimes),
        avgWriteTime: this.calculateAverage(this.performanceMetrics.writeTimes),
        avgDeleteTime: this.calculateAverage(this.performanceMetrics.deleteTimes),
        databaseSize: await this.calculateTotalSize()
      };
      
    } catch (error) {
      console.error('[IndexedDB L3] Stats update failed:', error);
    }
  }

  // Utility methods
  private parseKey(key: string): { symbol: string; dataType: string; date: string } {
    const parts = key.split(':');
    return {
      symbol: parts[1] || 'unknown',
      dataType: parts[0] || 'unknown',
      date: parts[2] || new Date().toISOString().split('T')[0]
    };
  }

  private compress(data: string): string {
    // Simple dictionary-based compression for financial data
    const financialDict = {
      '"symbol"': '①',
      '"price"': '②',
      '"volume"': '③',
      '"timestamp"': '④',
      '"open"': '⑤',
      '"high"': '⑥',
      '"low"': '⑦',
      '"close"': '⑧',
      '"marketCap"': '⑨',
      '"PE"': '⑩'
    };
    
    let compressed = data;
    for (const [key, value] of Object.entries(financialDict)) {
      compressed = compressed.replace(new RegExp(key, 'g'), value);
    }
    
    return compressed;
  }

  private decompress(data: string): any {
    const financialDict = {
      '①': '"symbol"',
      '②': '"price"',
      '③': '"volume"',
      '④': '"timestamp"',
      '⑤': '"open"',
      '⑥': '"high"',
      '⑦': '"low"',
      '⑧': '"close"',
      '⑨': '"marketCap"',
      '⑩': '"PE"'
    };
    
    let decompressed = data;
    for (const [key, value] of Object.entries(financialDict)) {
      decompressed = decompressed.replace(new RegExp(key, 'g'), value);
    }
    
    try {
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('[IndexedDB L3] Decompression failed:', error);
      return null;
    }
  }

  private calculateSize(data: any): number {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return new Blob([str]).size;
  }

  private async updateMetadata(symbol: string, dataType: string, dataSize: number): Promise<void> {
    try {
      const key = `${symbol}-${dataType}`;
      const existing = await this.db.metadata.where('key').equals(key).first();
      
      if (existing) {
        await this.db.metadata.update(existing.id!, {
          totalSize: existing.totalSize + dataSize,
          recordCount: existing.recordCount + 1,
          lastUpdated: Date.now(),
          totalAccesses: existing.totalAccesses + 1
        });
      } else {
        await this.db.metadata.add({
          key,
          symbol,
          dataType,
          totalSize: dataSize,
          recordCount: 1,
          firstCreated: Date.now(),
          lastUpdated: Date.now(),
          totalAccesses: 1,
          averageAccessTime: 0
        });
      }
    } catch (error) {
      console.error('[IndexedDB L3] Metadata update failed:', error);
    }
  }

  private updatePerformanceMetric(type: 'query' | 'write' | 'delete', time: number): void {
    const metrics = this.performanceMetrics;
    const maxSamples = 100;
    
    switch (type) {
      case 'query':
        metrics.queryTimes.push(time);
        if (metrics.queryTimes.length > maxSamples) {
          metrics.queryTimes.shift();
        }
        break;
      case 'write':
        metrics.writeTimes.push(time);
        if (metrics.writeTimes.length > maxSamples) {
          metrics.writeTimes.shift();
        }
        break;
      case 'delete':
        metrics.deleteTimes.push(time);
        if (metrics.deleteTimes.length > maxSamples) {
          metrics.deleteTimes.shift();
        }
        break;
    }
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  // Health check
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      const stats = await this.getStats();
      
      // Check database size
      if (stats.totalSize > this.maxStorageSize * 0.9) {
        issues.push('Database approaching storage limit');
        recommendations.push('Consider increasing cleanup frequency');
      }
      
      // Check performance
      if (stats.performanceMetrics.avgQueryTime > 100) {
        issues.push('Query performance degrading');
        recommendations.push('Consider database optimization');
      }
      
      // Check hit ratio
      const hitRatio = stats.hitCount / (stats.hitCount + stats.missCount);
      if (hitRatio < 0.7) {
        issues.push('Low cache hit ratio');
        recommendations.push('Review TTL settings and data patterns');
      }
      
      const status = issues.length === 0 ? 'healthy' : 
                    issues.length <= 2 ? 'warning' : 'error';
      
      return { status, issues, recommendations };
      
    } catch (error) {
      return {
        status: 'error',
        issues: ['Database health check failed'],
        recommendations: ['Check database connectivity and integrity']
      };
    }
  }

  // Cleanup
  dispose(): void {
    if (this.backgroundCleanupInterval) {
      clearTimeout(this.backgroundCleanupInterval);
      this.backgroundCleanupInterval = null;
    }
    
    if (this.db) {
      this.db.close();
    }
  }
}

// Export singleton instance
export const indexedDBCacheL3 = new IndexedDBCacheL3();
