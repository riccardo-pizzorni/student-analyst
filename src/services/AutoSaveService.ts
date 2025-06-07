/**
 * Auto Save Service
 * 
 * Sistema completo di salvataggio automatico per Student Analyst
 * - Salva automaticamente ogni 30 secondi
 * - LocalStorage persistence
 * - Recovery su page refresh
 * - Risoluzione conflitti
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline' | 'conflict';

export interface AutoSaveOptions {
  autoSaveIntervalMs?: number;
  debounceMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  enableLocalStorage?: boolean;
  maxStorageEntries?: number;
  onStatusChange?: (status: AutoSaveStatus) => void;
  onError?: (error: Error) => void;
  onConflict?: (local: AutoSaveData, incoming: AutoSaveData) => AutoSaveData;
}

export interface AutoSaveData {
  stepId: string;
  data: any;
  timestamp: number;
  version: number;
  sessionId: string;
  checksum: string;
}

export interface AutoSaveSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  deviceInfo: string;
}

class AutoSaveService {
  private status: AutoSaveStatus = 'idle';
  private debounceTimer: number | null = null;
  private autoSaveTimer: number | null = null;
  private retryTimer: number | null = null;
  private options: Required<AutoSaveOptions>;
  private listeners: Set<(status: AutoSaveStatus) => void> = new Set();
  private dataCache: Map<string, AutoSaveData> = new Map();
  private isOnline: boolean = navigator.onLine;
  private sessionId: string;
  private lastAutoSave: number = 0;

  constructor(options: AutoSaveOptions = {}) {
    this.sessionId = this.generateSessionId();
    
    this.options = {
      autoSaveIntervalMs: 30000, // 30 secondi come richiesto
      debounceMs: 2000,
      retryAttempts: 3,
      retryDelayMs: 2000,
      enableLocalStorage: true,
      maxStorageEntries: 100,
      onStatusChange: () => {},
      onError: () => {},
      onConflict: this.defaultConflictResolver.bind(this),
      ...options
    };

    this.setupEventListeners();
    this.loadFromLocalStorage();
    this.startAutoSaveTimer();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.setStatus('idle');
      this.retrySaveAll();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.setStatus('offline');
    });

    // Gestione chiusura pagina
    window.addEventListener('beforeunload', () => {
      this.performFinalSave();
    });

    // Gestione visibilità pagina per ottimizzazione
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performFinalSave();
        this.pauseAutoSave();
      } else {
        this.resumeAutoSave();
      }
    });
  }

  private startAutoSaveTimer(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = window.setInterval(() => {
      this.performAutoSave();
    }, this.options.autoSaveIntervalMs);
  }

  private pauseAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private resumeAutoSave(): void {
    if (!this.autoSaveTimer) {
      this.startAutoSaveTimer();
    }
  }

  private async performAutoSave(): Promise<void> {
    if (!this.isOnline || this.dataCache.size === 0) {
      return;
    }

    try {
      const now = Date.now();
      let hasUnsavedChanges = false;

      for (const [stepId, data] of this.dataCache.entries()) {
        if (data.timestamp > this.lastAutoSave) {
          hasUnsavedChanges = true;
          break;
        }
      }

      if (!hasUnsavedChanges) {
        return;
      }

      this.setStatus('saving');
      
      for (const [stepId, data] of this.dataCache.entries()) {
        if (data.timestamp > this.lastAutoSave) {
          await this.saveToLocalStorage(stepId, data);
        }
      }

      this.lastAutoSave = now;
      this.setStatus('saved');

      // Reset to idle after showing "saved" status
      setTimeout(() => {
        if (this.status === 'saved') {
          this.setStatus('idle');
        }
      }, 2000);

    } catch (error) {
      console.error('Auto-save failed:', error);
      this.setStatus('error');
      this.options.onError(error as Error);
    }
  }

  private async performFinalSave(): Promise<void> {
    if (this.dataCache.size === 0) return;

    try {
      for (const [stepId, data] of this.dataCache.entries()) {
        await this.saveToLocalStorage(stepId, data);
      }
    } catch (error) {
      console.error('Final save failed:', error);
    }
  }

  private setStatus(status: AutoSaveStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.options.onStatusChange(status);
      this.notifyListeners(status);
    }
  }

  private notifyListeners(status: AutoSaveStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in auto-save listener:', error);
      }
    });
  }

  private async saveToLocalStorage(stepId: string, data: AutoSaveData): Promise<void> {
    try {
      if (!this.options.enableLocalStorage) return;
      
      const storageKey = `student_analyst_autosave_${stepId}`;
      
      // Check for conflicts
      const existingData = this.getExistingStorageData(storageKey);
      if (existingData && this.detectConflict(existingData, data)) {
        const resolved = this.options.onConflict(existingData, data);
        data = resolved;
        this.setStatus('conflict');
      }

      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      // Save session info
      this.saveSessionInfo();
      
      // Cleanup old entries
      this.cleanupOldLocalStorageData();
      
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  }

  private getExistingStorageData(storageKey: string): AutoSaveData | null {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private detectConflict(existing: AutoSaveData, incoming: AutoSaveData): boolean {
    // Conflict se:
    // 1. Diverse sessionId (diversi dispositivi/tab)
    // 2. Version diverse
    // 3. Timestamp molto vicini ma checksum diversi
    
    if (existing.sessionId !== incoming.sessionId) {
      return true;
    }

    if (existing.version !== incoming.version && 
        Math.abs(existing.timestamp - incoming.timestamp) < 60000) { // 1 minuto
      return true;
    }

    return false;
  }

  private defaultConflictResolver(local: AutoSaveData, incoming: AutoSaveData): AutoSaveData {
    // Strategia: prendi la versione più recente
    if (incoming.timestamp > local.timestamp) {
      return {
        ...incoming,
        version: Math.max(local.version, incoming.version) + 1
      };
    } else {
      return {
        ...local,
        version: Math.max(local.version, incoming.version) + 1
      };
    }
  }

  private saveSessionInfo(): void {
    try {
      const session: AutoSaveSession = {
        sessionId: this.sessionId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        deviceInfo: navigator.userAgent.substring(0, 100)
      };
      
      localStorage.setItem('student_analyst_session', JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session info:', error);
    }
  }

  private cleanupOldLocalStorageData(): void {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith('student_analyst_autosave_'))
        .sort();

      if (keys.length > this.options.maxStorageEntries) {
        const keysToRemove = keys.slice(0, keys.length - this.options.maxStorageEntries);
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      // Rimuovi dati vecchi (> 30 giorni)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      keys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && data.timestamp < thirtyDaysAgo) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key); // Rimuovi dati corrotti
        }
      });
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith('student_analyst_autosave_'));

      keys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.stepId && data.data) {
            this.dataCache.set(data.stepId, data);
          }
        } catch (error) {
          console.error('Failed to parse saved data for key:', key);
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  public save(stepId: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      // Clear existing debounce timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      // Set new debounce timer
      this.debounceTimer = window.setTimeout(async () => {
        try {
          await this.performSave(stepId, data);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, this.options.debounceMs);
    });
  }

  public async saveImmediate(stepId: string, data: any): Promise<void> {
    // Clear any pending debounced saves
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    return this.performSave(stepId, data);
  }

  private async performSave(stepId: string, data: any): Promise<void> {
    try {
      this.setStatus('saving');

      const autoSaveData: AutoSaveData = {
        stepId,
        data,
        timestamp: Date.now(),
        version: (this.dataCache.get(stepId)?.version || 0) + 1,
        sessionId: this.sessionId,
        checksum: this.generateChecksum(data)
      };

      // Update cache
      this.dataCache.set(stepId, autoSaveData);

      // Save to localStorage if enabled
      if (this.options.enableLocalStorage) {
        await this.saveToLocalStorage(stepId, autoSaveData);
      }

      this.setStatus('saved');

      // Reset status after showing "saved"
      setTimeout(() => {
        if (this.status === 'saved') {
          this.setStatus('idle');
        }
      }, 2000);

    } catch (error) {
      console.error('Save failed:', error);
      this.options.onError(error as Error);
      this.setStatus('error');
      throw error;
    }
  }

  public load(stepId: string): AutoSaveData | null {
    return this.dataCache.get(stepId) || null;
  }

  public getAllSavedSteps(): string[] {
    return Array.from(this.dataCache.keys());
  }

  public recoverAllData(): Map<string, any> {
    const recovered = new Map<string, any>();
    
    this.dataCache.forEach((autoSaveData, stepId) => {
      recovered.set(stepId, autoSaveData.data);
    });
    
    return recovered;
  }

  public clearStep(stepId: string): void {
    this.dataCache.delete(stepId);
    
    if (this.options.enableLocalStorage) {
      const storageKey = `student_analyst_autosave_${stepId}`;
      localStorage.removeItem(storageKey);
    }
  }

  public clearAll(): void {
    this.dataCache.clear();
    
    if (this.options.enableLocalStorage) {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith('student_analyst_autosave_'));
      keys.forEach(key => localStorage.removeItem(key));
    }
  }

  public getStatus(): AutoSaveStatus {
    return this.status;
  }

  public subscribe(listener: (status: AutoSaveStatus) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current status
    listener(this.status);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  public isDataDirty(stepId: string, currentData: any): boolean {
    const saved = this.dataCache.get(stepId);
    if (!saved) return true;
    
    try {
      const currentChecksum = this.generateChecksum(currentData);
      return saved.checksum !== currentChecksum;
    } catch {
      return true;
    }
  }

  private async retrySaveAll(): Promise<void> {
    if (!this.isOnline) return;

    // Retry save for all cached data
    for (const [stepId, data] of this.dataCache.entries()) {
      try {
        await this.saveToLocalStorage(stepId, data);
      } catch (error) {
        console.error(`Failed to retry save for step ${stepId}:`, error);
      }
    }
  }

  public getLastSaved(stepId: string): Date | null {
    const data = this.dataCache.get(stepId);
    return data ? new Date(data.timestamp) : null;
  }

  public getDataVersion(stepId: string): number {
    const data = this.dataCache.get(stepId);
    return data?.version || 0;
  }

  public getSessionInfo(): AutoSaveSession | null {
    try {
      const sessionData = localStorage.getItem('student_analyst_session');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }

  public getStorageStats(): { totalEntries: number; totalSize: number; oldestEntry: Date | null } {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith('student_analyst_autosave_'));
      
      let totalSize = 0;
      let oldestTimestamp = Infinity;
      
      keys.forEach(key => {
        const value = localStorage.getItem(key) || '';
        totalSize += value.length;
        
        try {
          const data = JSON.parse(value);
          if (data.timestamp && data.timestamp < oldestTimestamp) {
            oldestTimestamp = data.timestamp;
          }
        } catch {}
      });
      
      return {
        totalEntries: keys.length,
        totalSize,
        oldestEntry: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp)
      };
    } catch {
      return { totalEntries: 0, totalSize: 0, oldestEntry: null };
    }
  }

  public destroy(): void {
    // Cleanup timers
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    // Final save before destroy
    this.performFinalSave();

    // Clear listeners and cache
    this.listeners.clear();
    this.dataCache.clear();
  }
}

// Export singleton instance
export const autoSaveService = new AutoSaveService();

// Enhanced React hook for auto-save
export const useAutoSave = (stepId: string, initialData: any = {}, options?: Partial<AutoSaveOptions>) => {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState<AutoSaveStatus>(autoSaveService.getStatus());
  const [lastSaved, setLastSaved] = useState<Date | null>(autoSaveService.getLastSaved(stepId));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastDataRef = useRef(initialData);

  // Recovery on mount
  useEffect(() => {
    const recovered = autoSaveService.load(stepId);
    if (recovered && recovered.data) {
      setData(recovered.data);
      setLastSaved(new Date(recovered.timestamp));
      lastDataRef.current = recovered.data;
    }
  }, [stepId]);

  // Subscribe to status changes
  useEffect(() => {
    const unsubscribe = autoSaveService.subscribe((newStatus) => {
      setStatus(newStatus);
      setLastSaved(autoSaveService.getLastSaved(stepId));
    });

    return unsubscribe;
  }, [stepId]);

  // Check for unsaved changes
  useEffect(() => {
    const isDirty = autoSaveService.isDataDirty(stepId, data);
    setHasUnsavedChanges(isDirty);
  }, [stepId, data]);

  const save = useCallback((newData?: any) => {
    const dataToSave = newData !== undefined ? newData : data;
    return autoSaveService.save(stepId, dataToSave);
  }, [stepId, data]);

  const saveImmediate = useCallback((newData?: any) => {
    const dataToSave = newData !== undefined ? newData : data;
    return autoSaveService.saveImmediate(stepId, dataToSave);
  }, [stepId, data]);

  const updateData = useCallback((newData: any) => {
    setData(newData);
    lastDataRef.current = newData;
    // Auto-save will be triggered by the service
    autoSaveService.save(stepId, newData);
  }, [stepId]);

  const load = useCallback(() => {
    return autoSaveService.load(stepId);
  }, [stepId]);

  return {
    data,
    status,
    lastSaved,
    hasUnsavedChanges,
    setData: updateData,
    save,
    saveImmediate,
    load,
    version: autoSaveService.getDataVersion(stepId)
  };
}; 
