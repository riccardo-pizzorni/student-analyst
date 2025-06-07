/**
 * STUDENT ANALYST - Preference Manager
 * Handles persistent storage of user preferences in localStorage
 */

export interface UserPreferences {
  preferredDataSource: 'alpha_vantage' | 'yahoo_finance' | 'auto';
  enableNotifications: boolean;
  enableAutoFallback: boolean;
  maxConsecutiveFailures: number;
  theme: 'light' | 'dark' | 'auto';
  lastUpdated: string;
}

export interface PreferenceHistory {
  timestamp: string;
  action: string;
  previousValue: unknown;
  newValue: unknown;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredDataSource: 'auto',
  enableNotifications: true,
  enableAutoFallback: true,
  maxConsecutiveFailures: 3,
  theme: 'auto',
  lastUpdated: new Date().toISOString()
};

/**
 * Manages user preferences with persistent storage and history tracking
 */
export class PreferenceManager {
  private static instance: PreferenceManager;
  private static readonly STORAGEkey = 'student_analyst_preferences';
  private static readonly HISTORYkey = 'student_analyst_preference_history';
  private static readonly VERSION = '1.0';
  
  private preferences: UserPreferences;
  private history: PreferenceHistory[] = [];
  
  private constructor() {
    this.preferences = this.loadPreferences();
    this.history = this.loadHistory();
  }
  
  public static getInstance(): PreferenceManager {
    if (!PreferenceManager.instance) {
      PreferenceManager.instance = new PreferenceManager();
    }
    return PreferenceManager.instance;
  }
  
  /**
   * Get current preferences
   */
  public getPreferences(): UserPreferences {
    return { ...this.preferences };
  }
  
  /**
   * Update a specific preference
   */
  public setPreference<K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ): void {
    const previousValue = this.preferences[key];
    
    this.preferences[key] = value;
    this.preferences.lastUpdated = new Date().toISOString();
    
    this.addToHistory({
      timestamp: new Date().toISOString(),
      action: `Set ${key}`,
      previousValue,
      newValue: value
    });
    
    this.savePreferences();
  }
  
  /**
   * Update multiple preferences at once
   */
  public updatePreferences(updates: Partial<UserPreferences>): void {
    const previousPreferences = { ...this.preferences };
    
    Object.assign(this.preferences, updates);
    this.preferences.lastUpdated = new Date().toISOString();
    
    this.addToHistory({
      timestamp: new Date().toISOString(),
      action: 'Bulk update',
      previousValue: previousPreferences,
      newValue: { ...this.preferences }
    });
    
    this.savePreferences();
  }
  
  /**
   * Reset all preferences to defaults
   */
  public resetPreferences(): void {
    const previousPreferences = { ...this.preferences };
    
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.preferences.lastUpdated = new Date().toISOString();
    
    this.addToHistory({
      timestamp: new Date().toISOString(),
      action: 'Reset to defaults',
      previousValue: previousPreferences,
      newValue: { ...this.preferences }
    });
    
    this.savePreferences();
  }
  
  /**
   * Get preference history
   */
  public getHistory(limit = 50): PreferenceHistory[] {
    return this.history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  /**
   * Clear preference history
   */
  public clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }
  
  /**
   * Export preferences as JSON
   */
  public exportPreferences(): string {
    return JSON.stringify({
      version: PreferenceManager.VERSION,
      preferences: this.preferences,
      history: this.history,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
  
  /**
   * Import preferences from JSON
   */
  public importPreferences(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate structure
      if (!data.preferences || !data.version) {
        throw new Error('Invalid preference data format');
      }
      
      // Migration logic for different versions if needed
      if (data.version !== PreferenceManager.VERSION) {
        console.warn(`Importing preferences from version ${data.version}, current version is ${PreferenceManager.VERSION}`);
      }
      
      const previousPreferences = { ...this.preferences };
      
      // Merge with defaults to ensure all required fields are present
      this.preferences = { 
        ...DEFAULT_PREFERENCES, 
        ...data.preferences,
        lastUpdated: new Date().toISOString()
      };
      
      if (data.history && Array.isArray(data.history)) {
        this.history = [...this.history, ...data.history];
      }
      
      this.addToHistory({
        timestamp: new Date().toISOString(),
        action: 'Import preferences',
        previousValue: previousPreferences,
        newValue: { ...this.preferences }
      });
      
      this.savePreferences();
      this.saveHistory();
      
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }
  
  /**
   * Get a specific preference value
   */
  public getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K] {
    return this.preferences[key];
  }
  
  /**
   * Check if preferences have been customized from defaults
   */
  public hasCustomPreferences(): boolean {
    const defaults = DEFAULT_PREFERENCES;
    return Object.keys(defaults).some(key => {
      if (key === 'lastUpdated') return false;
      return this.preferences[key as keyof UserPreferences] !== defaults[key as keyof UserPreferences];
    });
  }
  
  /**
   * Get preferences summary for display
   */
  public getPreferencesSummary(): {
    dataSource: string;
    notifications: string;
    autoFallback: string;
    failureThreshold: number;
    lastUpdated: string;
  } {
    return {
      dataSource: this.preferences.preferredDataSource === 'auto' 
        ? 'Automatic (Smart Selection)' 
        : this.preferences.preferredDataSource === 'alpha_vantage'
        ? 'Alpha Vantage'
        : 'Yahoo Finance',
      notifications: this.preferences.enableNotifications ? 'Enabled' : 'Disabled',
      autoFallback: this.preferences.enableAutoFallback ? 'Enabled' : 'Disabled',
      failureThreshold: this.preferences.maxConsecutiveFailures,
      lastUpdated: new Date(this.preferences.lastUpdated).toLocaleString()
    };
  }
  
  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(PreferenceManager.STORAGEkey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all fields are present
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error);
    }
    
    return { ...DEFAULT_PREFERENCES };
  }
  
  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(
        PreferenceManager.STORAGEkey, 
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Failed to save preferences to localStorage:', error);
    }
  }
  
  /**
   * Load history from localStorage
   */
  private loadHistory(): PreferenceHistory[] {
    try {
      const stored = localStorage.getItem(PreferenceManager.HISTORYkey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load preference history from localStorage:', error);
    }
    
    return [];
  }
  
  /**
   * Save history to localStorage
   */
  private saveHistory(): void {
    try {
      localStorage.setItem(
        PreferenceManager.HISTORYkey, 
        JSON.stringify(this.history)
      );
    } catch (error) {
      console.error('Failed to save preference history to localStorage:', error);
    }
  }
  
  /**
   * Add entry to history
   */
  private addToHistory(entry: PreferenceHistory): void {
    this.history.push(entry);
    
    // Keep only last 100 entries to prevent localStorage bloat
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }
    
    this.saveHistory();
  }
}

// Export singleton instance
export const preferenceManager = PreferenceManager.getInstance();
export default PreferenceManager; 
