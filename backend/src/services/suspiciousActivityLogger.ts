/**
 * STUDENT ANALYST - Suspicious Activity Logger
 * ===========================================
 * 
 * Sistema avanzato per rilevare, loggare e monitorare attività sospette
 * nell'accesso alle API protette
 */

export interface SuspiciousEventMetadata {
  action?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface SuspiciousEvent {
  id: string;
  timestamp: Date;
  type: 'rate_limit_abuse' | 'invalid_api_key' | 'suspicious_user_agent' | 'repeated_failures' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: {
    ip: string;
    userAgent: string;
    endpoint: string;
    description: string;
    metadata?: SuspiciousEventMetadata;
  };
  resolved: boolean;
  actionTaken?: string;
}

export interface ThreatLevel {
  ip: string;
  level: number; // 0-100
  events: SuspiciousEvent[];
  firstSeen: Date;
  lastSeen: Date;
  blocked: boolean;
  whitelist: boolean;
}

export interface SecurityStats {
  totalEvents: number;
  last24Hours: number;
  lastHour: number;
  criticalEvents24h: number;
  blockedIPs: string[];
  whitelistedIPs: string[];
  activeTreats: number;
  highThreatIPs: Array<{ ip: string; level: number; lastSeen: Date }>;
  eventsByType: Record<string, number>;
  timestamp: string;
}

export interface EventsByType {
  [key: string]: number;
}

/**
 * Sistema di rilevamento e logging attività sospette
 */
export class SuspiciousActivityLogger {
  private events: SuspiciousEvent[] = [];
  private threatLevels: Map<string, ThreatLevel> = new Map();
  private blockedIPs: Set<string> = new Set();
  private whitelistedIPs: Set<string> = new Set(['127.0.0.1', 'localhost', '::1']);
  private eventId = 0;

  constructor() {
    // Auto-cleanup ogni ora
    setInterval(() => {
      this.cleanupOldEvents();
    }, 3600000);
    
    console.log('🛡️  Suspicious Activity Logger initialized');
  }

  /**
   * Genera un ID univoco per gli eventi
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${++this.eventId}`;
  }

  /**
   * Log di un evento sospetto
   */
  logSuspiciousEvent(event: Omit<SuspiciousEvent, 'id' | 'timestamp' | 'resolved'>): void {
    const suspiciousEvent: SuspiciousEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      resolved: false,
      ...event
    };

    this.events.push(suspiciousEvent);
    this.updateThreatLevel(event.details.ip, suspiciousEvent);
    this.logToConsole(suspiciousEvent);
    
    // Auto-azione per eventi critici
    if (event.severity === 'critical') {
      this.takeAutomaticAction(suspiciousEvent);
    }

    // Mantieni solo gli ultimi 5000 eventi
    if (this.events.length > 5000) {
      this.events = this.events.slice(-5000);
    }
  }

  /**
   * Aggiorna il livello di minaccia per un IP
   */
  private updateThreatLevel(ip: string, event: SuspiciousEvent): void {
    if (this.whitelistedIPs.has(ip)) {
      return; // IP whitelistato, non aggiornare threat level
    }

    let threat = this.threatLevels.get(ip);
    
    if (!threat) {
      threat = {
        ip,
        level: 0,
        events: [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        blocked: false,
        whitelist: false
      };
    }

    threat.events.push(event);
    threat.lastSeen = new Date();

    // Calcola nuovo livello di minaccia
    const severityWeights = {
      low: 5,
      medium: 15,
      high: 30,
      critical: 50
    };

    threat.level += severityWeights[event.severity];
    threat.level = Math.min(threat.level, 100); // Cap a 100

    // Decay nel tempo - riduci il livello di minaccia
    const hoursSinceFirst = (Date.now() - threat.firstSeen.getTime()) / (1000 * 60 * 60);
    if (hoursSinceFirst > 24) {
      threat.level *= 0.9; // 10% decay dopo 24 ore
    }

    this.threatLevels.set(ip, threat);

    // Auto-block per threat level alto
    if (threat.level >= 80 && !threat.blocked) {
      this.blockIP(ip, 'Auto-blocked for high threat level');
    }
  }

  /**
   * Blocca un IP
   */
  blockIP(ip: string, reason: string): void {
    if (this.whitelistedIPs.has(ip)) {
      console.warn(`⚠️  Attempted to block whitelisted IP: ${ip}`);
      return;
    }

    this.blockedIPs.add(ip);
    const threat = this.threatLevels.get(ip);
    if (threat) {
      threat.blocked = true;
    }

    console.warn(`🚫 IP blocked: ${ip} - Reason: ${reason}`);
    
    this.logSuspiciousEvent({
      type: 'unusual_pattern',
      severity: 'critical',
      details: {
        ip,
        userAgent: 'system',
        endpoint: 'security-system',
        description: `IP auto-blocked: ${reason}`,
        metadata: { action: 'ip_blocked', reason }
      },
      actionTaken: `IP ${ip} blocked automatically`
    });
  }

  /**
   * Sblocca un IP
   */
  unblockIP(ip: string, reason: string): void {
    this.blockedIPs.delete(ip);
    const threat = this.threatLevels.get(ip);
    if (threat) {
      threat.blocked = false;
      threat.level = Math.max(0, threat.level - 50); // Riduci threat level
    }

    console.log(`✅ IP unblocked: ${ip} - Reason: ${reason}`);
  }

  /**
   * Controlla se un IP è bloccato
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Controlla se un IP è sospetto
   */
  isIPSuspicious(ip: string): boolean {
    const threat = this.threatLevels.get(ip);
    return threat ? threat.level > 50 : false;
  }

  /**
   * Azioni automatiche per eventi critici
   */
  private takeAutomaticAction(event: SuspiciousEvent): void {
    const { ip, endpoint } = event.details;
    
    switch (event.type) {
      case 'rate_limit_abuse': {
        // Blocco temporaneo per rate limit abuse
        setTimeout(() => {
          this.blockIP(ip, 'Rate limit abuse detected');
        }, 1000);
        break;
      }
        
      case 'repeated_failures': {
        // Incrementa threat level per fallimenti ripetuti
        const threat = this.threatLevels.get(ip);
        if (threat && threat.level > 60) {
          this.blockIP(ip, 'Repeated API failures indicate malicious activity');
        }
        break;
      }
        
      case 'invalid_api_key':
        // Log per tentativi di API key non valide
        console.error(`🔑 Invalid API key attempt from ${ip} on ${endpoint}`);
        break;
    }
  }

  /**
   * Logging formattato su console
   */
  private logToConsole(event: SuspiciousEvent): void {
    const severityEmojis = {
      low: '🟡',
      medium: '🟠', 
      high: '🔴',
      critical: '🚨'
    };

    const emoji = severityEmojis[event.severity];
    const { ip, endpoint, description } = event.details;
    
    console.warn(
      `${emoji} [${event.severity.toUpperCase()}] ${event.type} from ${ip} on ${endpoint}: ${description}`
    );
  }

  /**
   * Cleanup di eventi vecchi
   */
  private cleanupOldEvents(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Rimuovi eventi vecchi
    this.events = this.events.filter(event => 
      event.timestamp.getTime() > oneWeekAgo
    );

    // Cleanup threat levels inattivi
    for (const [ip, threat] of this.threatLevels.entries()) {
      if (threat.lastSeen.getTime() < oneWeekAgo) {
        this.threatLevels.delete(ip);
      }
    }

    console.log('🧹 Suspicious activity logs cleaned up');
  }

  /**
   * Ottieni statistiche di sicurezza
   */
  getSecurityStats(): SecurityStats {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last1h = now - (60 * 60 * 1000);

    const recentEvents = this.events.filter(e => e.timestamp.getTime() > last24h);
    const recentCritical = recentEvents.filter(e => e.severity === 'critical');
    const hourlyEvents = this.events.filter(e => e.timestamp.getTime() > last1h);

    return {
      totalEvents: this.events.length,
      last24Hours: recentEvents.length,
      lastHour: hourlyEvents.length,
      criticalEvents24h: recentCritical.length,
      blockedIPs: Array.from(this.blockedIPs),
      whitelistedIPs: Array.from(this.whitelistedIPs),
      activeTreats: this.threatLevels.size,
      highThreatIPs: Array.from(this.threatLevels.entries())
        .filter(([_, threat]) => threat.level > 60)
        .map(([ip, threat]) => ({ ip, level: threat.level, lastSeen: threat.lastSeen })),
      eventsByType: this.getEventsByType(recentEvents),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Raggruppa eventi per tipo
   */
  private getEventsByType(events: SuspiciousEvent[]): EventsByType {
    const byType: EventsByType = {};
    
    events.forEach(event => {
      byType[event.type] = (byType[event.type] || 0) + 1;
    });
    
    return byType;
  }

  /**
   * Ottieni eventi per IP specifico
   */
  getEventsForIP(ip: string): SuspiciousEvent[] {
    return this.events.filter(event => event.details.ip === ip);
  }

  /**
   * Ottieni threat level per IP
   */
  getThreatLevel(ip: string): ThreatLevel | null {
    return this.threatLevels.get(ip) || null;
  }

  /**
   * Aggiungi IP alla whitelist
   */
  addToWhitelist(ip: string, reason: string): void {
    this.whitelistedIPs.add(ip);
    
    // Rimuovi da blocked se presente
    if (this.blockedIPs.has(ip)) {
      this.unblockIP(ip, `Added to whitelist: ${reason}`);
    }

    console.log(`✅ IP added to whitelist: ${ip} - Reason: ${reason}`);
  }

  /**
   * Rimuovi IP dalla whitelist
   */
  removeFromWhitelist(ip: string): void {
    this.whitelistedIPs.delete(ip);
    console.log(`❌ IP removed from whitelist: ${ip}`);
  }

  /**
   * Esporta log per analisi esterna
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        exportTimestamp: new Date().toISOString(),
        events: this.events,
        threatLevels: Array.from(this.threatLevels.entries()),
        blockedIPs: Array.from(this.blockedIPs),
        stats: this.getSecurityStats()
      }, null, 2);
    }
    
    // CSV format
    const headers = 'Timestamp,Type,Severity,IP,Endpoint,Description\n';
    const rows = this.events.map(event => 
      `${event.timestamp.toISOString()},${event.type},${event.severity},${event.details.ip},${event.details.endpoint},"${event.details.description}"`
    ).join('\n');
    
    return headers + rows;
  }
}

// Istanza singleton
export const suspiciousActivityLogger = new SuspiciousActivityLogger(); 