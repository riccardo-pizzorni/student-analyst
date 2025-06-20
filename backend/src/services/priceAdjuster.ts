/**
 * Price Adjuster per STUDENT ANALYST
 *
 * Sistema di aggiustamento prezzi per stock splits, dividendi e altri eventi aziendali
 * Garantisce coerenza storica dei dati per analisi comparative accurate
 */

// ========== INTERFACCE ==========

export interface SplitEvent {
  date: string;
  symbol: string;
  splitRatio: number; // es: 2.0 per split 2:1, 0.5 per reverse split 1:2
  splitFrom: number; // es: 1 per split 2:1
  splitTo: number; // es: 2 per split 2:1
  source: string;
  confidence: number; // 0-1
}

export interface DividendEvent {
  date: string;
  symbol: string;
  amount: number;
  currency: string;
  type: 'CASH' | 'STOCK' | 'SPECIAL';
  exDate: string;
  payDate: string;
  source: string;
}

export interface PriceDataRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume: number;
  [key: string]: unknown;
}

export interface AdjustmentResult {
  success: boolean;
  adjustedData: PriceDataRecord[];
  appliedSplits: SplitEvent[];
  appliedDividends: DividendEvent[];
  adjustmentFactor: number;
  errors: string[];
  warnings: string[];
  stats: {
    recordsAdjusted: number;
    recordsSkipped: number;
    processingTimeMs: number;
  };
}

export interface PriceAdjusterConfig {
  enableSplitAdjustment: boolean;
  enableDividendAdjustment: boolean;
  splitThreshold: number; // Soglia minima per considerare uno split (es: 1.5)
  maxLookbackDays: number; // Giorni massimi per cercare eventi storici
  useExternalSplitData: boolean; // Se usare API esterne per dati split
  adjustmentPrecision: number; // Decimali per arrotondamento
}

// ========== CLASSE PRINCIPALE ==========

export class PriceAdjuster {
  private readonly config: PriceAdjusterConfig;
  private readonly splitCache: Map<string, SplitEvent[]>;
  private readonly dividendCache: Map<string, DividendEvent[]>;

  constructor(config?: Partial<PriceAdjusterConfig>) {
    this.config = {
      enableSplitAdjustment: true,
      enableDividendAdjustment: false, // Disabilitato di default per semplicità
      splitThreshold: 1.5,
      maxLookbackDays: 365 * 5, // 5 anni
      useExternalSplitData: false, // Per ora usiamo solo detection automatica
      adjustmentPrecision: 6,
      ...config,
    };

    this.splitCache = new Map();
    this.dividendCache = new Map();
  }

  /**
   * Aggiusta prezzi per stock splits
   */
  public async adjustForSplits(
    data: PriceDataRecord[],
    symbol: string
  ): Promise<PriceDataRecord[]> {
    const _startTime = Date.now();

    if (!this.config.enableSplitAdjustment || data.length === 0) {
      return data;
    }

    try {
      // 1. Rileva splits automaticamente dai dati
      const detectedSplits = this.detectSplitsFromData(data, ____symbol);

      // 2. Ottieni splits da cache o API esterne se abilitato
      const cachedSplits = this.getCachedSplits(____symbol);

      // 3. Combina e valida tutti gli splits
      const allSplits = this.mergeSplitEvents([
        ...detectedSplits,
        ...cachedSplits,
      ]);

      // 4. Applica aggiustamenti
      const adjustedData = this.applySplitAdjustments(data, allSplits);

      // 5. Aggiorna cache
      this.updateSplitCache(symbol, allSplits);

      return adjustedData;
    } catch (error) {
      // Log warning in production environment
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Errore durante aggiustamento splits per ${symbol}:`,
          error
        );
      }
      return data; // Ritorna dati originali in caso di errore
    }
  }

  /**
   * Rileva stock splits automaticamente dai dati di prezzo
   */
  private detectSplitsFromData(
    data: PriceDataRecord[],
    symbol: string
  ): SplitEvent[] {
    const splits: SplitEvent[] = [];

    if (data.length < 2) return splits;

    // Ordina dati per data (più vecchi prima)
    const sortedData = [...data].sort((a, b) => {
      if (
        a &&
        b &&
        typeof a === 'object' &&
        typeof b === 'object' &&
        'date' in a &&
        'date' in b
      ) {
        return (
          new Date((a as PriceDataRecord).date).getTime() -
          new Date((b as PriceDataRecord).date).getTime()
        );
      }
      return 0;
    });

    for (let i = 1; i < sortedData.length; i++) {
      const prevDay = sortedData[i - 1];
      const currentDay = sortedData[i];

      if (
        prevDay &&
        currentDay &&
        typeof prevDay === 'object' &&
        typeof currentDay === 'object' &&
        'date' in prevDay &&
        'open' in prevDay &&
        'close' in prevDay &&
        'volume' in prevDay &&
        'date' in currentDay &&
        'open' in currentDay &&
        'close' in currentDay &&
        'volume' in currentDay
      ) {
        // Calcola ratio di prezzo tra giorni consecutivi
        const priceRatio =
          (prevDay as PriceDataRecord).close /
          (currentDay as PriceDataRecord).open;

        // Rileva possibili splits
        if (priceRatio >= this.config.splitThreshold) {
          const splitRatio = this.calculateSplitRatio(priceRatio);

          if (splitRatio > 0) {
            const confidence = this.calculateSplitConfidence(
              prevDay,
              currentDay,
              splitRatio
            );

            if (confidence > 0.7) {
              // Soglia di confidence per accettare lo split
              splits.push({
                date: currentDay.date,
                symbol,
                splitRatio,
                splitFrom: 1,
                splitTo: Math.round(splitRatio),
                source: 'AUTO_DETECTION',
                confidence,
              });
            }
          }
        }

        // Rileva reverse splits
        else if (priceRatio <= 1 / this.config.splitThreshold) {
          const reverseSplitRatio = 1 / priceRatio;

          if (reverseSplitRatio >= this.config.splitThreshold) {
            const confidence = this.calculateSplitConfidence(
              prevDay,
              currentDay,
              reverseSplitRatio
            );

            if (confidence > 0.7) {
              splits.push({
                date: currentDay.date,
                symbol,
                splitRatio: 1 / reverseSplitRatio,
                splitFrom: Math.round(reverseSplitRatio),
                splitTo: 1,
                source: 'AUTO_DETECTION_REVERSE',
                confidence,
              });
            }
          }
        }
      } else {
        // fallback: ignora la coppia non valida
        continue;
      }
    }

    return splits;
  }

  /**
   * Calcola ratio di split più probabile
   */
  private calculateSplitRatio(priceRatio: number): number {
    // Ratios comuni di split
    const commonRatios = [2, 3, 4, 5, 1.5, 2.5, 3.5];

    let bestRatio = 0;
    let minDifference = Infinity;

    for (const ratio of commonRatios) {
      const difference = Math.abs(priceRatio - ratio);
      if (difference < minDifference && difference < 0.3) {
        // Tolleranza del 30%
        minDifference = difference;
        bestRatio = ratio;
      }
    }

    return bestRatio;
  }

  /**
   * Calcola confidence di un possibile split
   */
  private calculateSplitConfidence(
    prevDay: PriceDataRecord,
    currentDay: PriceDataRecord,
    splitRatio: number
  ): number {
    let confidence = 0.5; // Base confidence

    // Fattori che aumentano confidence:

    // 1. Volume alto nel giorno dello split
    if (Number(currentDay.volume) > Number(prevDay.volume) * 1.5) {
      confidence += 0.2;
    }

    // 2. Ratio molto vicino a valori comuni
    const commonRatios = [2, 3, 4, 5, 1.5, 2.5];
    const isCommonRatio = commonRatios.some(
      ratio => Math.abs(splitRatio - ratio) < 0.1
    );
    if (isCommonRatio) {
      confidence += 0.2;
    }

    // 3. Prezzo adjusted close coerente
    if (prevDay.adjustedClose && currentDay.adjustedClose) {
      const adjustedRatio =
        Number(prevDay.adjustedClose) / Number(currentDay.adjustedClose);
      if (Math.abs(adjustedRatio - 1) < 0.05) {
        // Adjusted close dovrebbe essere continuo
        confidence += 0.3;
      }
    }

    // 4. Gap significativo nel prezzo
    const gapSize =
      Math.abs(Number(prevDay.close) - Number(currentDay.open)) /
      Number(prevDay.close);
    if (gapSize > 0.3) {
      // Gap > 30%
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Applica aggiustamenti per splits ai dati
   */
  private applySplitAdjustments(
    data: PriceDataRecord[],
    splits: SplitEvent[]
  ): PriceDataRecord[] {
    if (splits.length === 0) return data;

    // Ordina splits per data (più recenti prima)
    const sortedSplits = [...splits].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return data.map(item => {
      if (
        item &&
        typeof item === 'object' &&
        'date' in item &&
        'open' in item &&
        'close' in item &&
        'high' in item &&
        'low' in item &&
        'volume' in item
      ) {
        let adjustmentFactor = 1.0;

        // Calcola fattore di aggiustamento cumulativo
        for (const split of sortedSplits) {
          if (new Date((item as PriceDataRecord).date) < new Date(split.date)) {
            adjustmentFactor *= split.splitRatio;
          }
        }

        // Applica aggiustamento se necessario
        if (Math.abs(adjustmentFactor - 1.0) > 0.001) {
          return {
            ...(item as PriceDataRecord),
            open: this.roundToDecimal(
              (item as PriceDataRecord).open / adjustmentFactor,
              this.config.adjustmentPrecision
            ),
            high: this.roundToDecimal(
              (item as PriceDataRecord).high / adjustmentFactor,
              this.config.adjustmentPrecision
            ),
            low: this.roundToDecimal(
              (item as PriceDataRecord).low / adjustmentFactor,
              this.config.adjustmentPrecision
            ),
            close: this.roundToDecimal(
              (item as PriceDataRecord).close / adjustmentFactor,
              this.config.adjustmentPrecision
            ),
            adjustedClose:
              (item as PriceDataRecord).adjustedClose ||
              this.roundToDecimal(
                (item as PriceDataRecord).close / adjustmentFactor,
                this.config.adjustmentPrecision
              ),
            volume: Math.round(
              (item as PriceDataRecord).volume * adjustmentFactor
            ), // Volume aumenta con split
            splitAdjustmentFactor: adjustmentFactor,
            splitAdjusted: true,
          };
        }

        return {
          ...(item as PriceDataRecord),
          adjustedClose:
            (item as PriceDataRecord).adjustedClose ||
            (item as PriceDataRecord).close,
          splitAdjustmentFactor: 1.0,
          splitAdjusted: false,
        };
      } else {
        // fallback: oggetto PriceDataRecord di default con warning
        return {
          date: '',
          open: 0,
          high: 0,
          low: 0,
          close: 0,
          volume: 0,
          adjustedClose: 0,
          splitAdjustmentFactor: 1.0,
          splitAdjusted: false,
          warning: 'Invalid record structure',
        } as PriceDataRecord;
      }
    });
  }

  /**
   * Combina e deduplicata eventi di split
   */
  private mergeSplitEvents(splits: SplitEvent[]): SplitEvent[] {
    const merged = new Map<string, SplitEvent>();

    for (const split of splits) {
      const key = `${split.symbol}_${split.date}`;
      const existing = merged.get(key);

      if (!existing || split.confidence > existing.confidence) {
        merged.set(key, split);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Ottieni splits dalla cache
   */
  private getCachedSplits(symbol: string): SplitEvent[] {
    return this.splitCache.get(____symbol) || [];
  }

  /**
   * Aggiorna cache splits
   */
  private updateSplitCache(symbol: string, splits: SplitEvent[]): void {
    this.splitCache.set(symbol, splits);
  }

  /**
   * Arrotonda a numero specifico di decimali
   */
  private roundToDecimal(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Aggiusta per dividendi (implementazione base)
   */
  public async adjustForDividends(
    data: PriceDataRecord[],
    symbol: string
  ): Promise<PriceDataRecord[]> {
    if (!this.config.enableDividendAdjustment) {
      return data;
    }

    // TODO: Implementazione completa per dividendi
    // Per ora ritorna dati non modificati
    return data;
  }

  /**
   * Valida aggiustamenti applicati
   */
  public validateAdjustments(
    originalData: PriceDataRecord[],
    adjustedData: PriceDataRecord[]
  ): {
    isValid: boolean;
    issues: string[];
    continuityScore: number;
  } {
    const issues: string[] = [];

    if (originalData.length !== adjustedData.length) {
      issues.push('Lunghezza dati diversa dopo aggiustamento');
    }

    // Calcola score di continuità (quanto sono "smooth" i prezzi adjusted)
    let continuityScore = 1.0;

    if (adjustedData.length > 1) {
      const sortedData = [...adjustedData].sort((a, b) => {
        const aDate = (a as Record<string, unknown>).date;
        const bDate = (b as Record<string, unknown>).date;
        const aDateStr = typeof aDate === 'string' ? aDate : '';
        const bDateStr = typeof bDate === 'string' ? bDate : '';
        return new Date(aDateStr).getTime() - new Date(bDateStr).getTime();
      });

      let totalGaps = 0;
      let significantGaps = 0;

      for (let i = 1; i < sortedData.length; i++) {
        const prevClose =
          (sortedData[i - 1] as Record<string, unknown>).adjustedClose ||
          (sortedData[i - 1] as Record<string, unknown>).close;
        const currentOpen = (sortedData[i] as Record<string, unknown>).open;

        const gap =
          Math.abs(Number(prevClose) - Number(currentOpen)) / Number(prevClose);
        totalGaps += gap;

        if (gap > 0.1) {
          // Gap > 10%
          significantGaps++;
        }
      }

      const avgGap = totalGaps / (sortedData.length - 1);
      const gapRatio = significantGaps / (sortedData.length - 1);

      continuityScore = Math.max(0, 1 - avgGap * 2 - gapRatio * 0.5);
    }

    return {
      isValid: issues.length === 0,
      issues,
      continuityScore,
    };
  }

  /**
   * Ottieni statistiche di aggiustamento
   */
  public getStats(): {
    config: PriceAdjusterConfig;
    cacheStats: {
      symbolsInSplitCache: number;
      symbolsInDividendCache: number;
    };
  } {
    return {
      config: this.config,
      cacheStats: {
        symbolsInSplitCache: this.splitCache.size,
        symbolsInDividendCache: this.dividendCache.size,
      },
    };
  }

  /**
   * Pulisci cache
   */
  public clearCache(): void {
    this.splitCache.clear();
    this.dividendCache.clear();
  }

  /**
   * Test di rilevamento split su dati campione
   */
  public testSplitDetection(
    data: PriceDataRecord[],
    symbol: string
  ): {
    detectedSplits: SplitEvent[];
    confidence: number;
    recommendations: string[];
  } {
    const splits = this.detectSplitsFromData(data, ____symbol);
    const avgConfidence =
      splits.length > 0
        ? splits.reduce((sum, split) => sum + split.confidence, 0) /
          splits.length
        : 0;

    const recommendations: string[] = [];

    if (splits.length === 0) {
      recommendations.push('Nessun split rilevato nei dati');
    } else if (avgConfidence < 0.7) {
      recommendations.push(
        'Split rilevati ma con bassa confidence - verificare manualmente'
      );
    } else {
      recommendations.push('Split rilevati con alta confidence');
    }

    return {
      detectedSplits: splits,
      confidence: avgConfidence,
      recommendations,
    };
  }
}
