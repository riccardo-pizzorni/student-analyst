/**
 * Volume Handler per STUDENT ANALYST
 *
 * Sistema di gestione e normalizzazione del volume di trading
 * Converte unità diverse (K, M, B) e valida coerenza dei dati
 */

// ========== INTERFACCE ==========

export interface VolumeDataItem {
  [key: string]: unknown;
  volume?: number | string;
  volumeNormalized?: number;
  originalVolume?: number | string;
  volumeUnit?: string;
  volumeInterpolated?: boolean;
}

export interface VolumeNormalizationResult {
  success: boolean;
  normalizedData: VolumeDataItem[];
  conversions: VolumeConversion[];
  anomalies: VolumeAnomaly[];
  stats: {
    recordsProcessed: number;
    recordsNormalized: number;
    averageVolume: number;
    medianVolume: number;
    volumeRange: { min: number; max: number };
  };
}

export interface VolumeConversion {
  originalValue: unknown;
  normalizedValue: number;
  detectedUnit: string;
  conversionFactor: number;
  confidence: number;
}

export interface VolumeAnomaly {
  type:
    | 'ZERO_VOLUME'
    | 'NEGATIVE_VOLUME'
    | 'EXTREME_HIGH'
    | 'EXTREME_LOW'
    | 'INCONSISTENT_FORMAT';
  record: number;
  originalValue: unknown;
  normalizedValue?: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface VolumeHandlerConfig {
  enableNormalization: boolean;
  enableAnomalyDetection: boolean;
  zeroVolumeHandling: 'KEEP' | 'REMOVE' | 'INTERPOLATE';
  extremeVolumeThreshold: number; // Multiplo della mediana per considerare volume estremo
  interpolationMethod: 'LINEAR' | 'MEDIAN' | 'AVERAGE';
  preserveOriginalValues: boolean;
}

// ========== CLASSE PRINCIPALE ==========

export class VolumeHandler {
  private readonly config: VolumeHandlerConfig;

  // Pattern per riconoscere unità di volume
  private readonly volumePatterns = [
    {
      pattern: /^(\d+(?:\.\d+)?)\s*[kK]$/,
      unit: 'K',
      factor: 1000,
      priority: 5,
    },
    {
      pattern: /^(\d+(?:\.\d+)?)\s*[mM]$/,
      unit: 'M',
      factor: 1000000,
      priority: 4,
    },
    {
      pattern: /^(\d+(?:\.\d+)?)\s*[bB]$/,
      unit: 'B',
      factor: 1000000000,
      priority: 3,
    },
    {
      pattern: /^(\d+(?:\.\d+)?)\s*[tT]$/,
      unit: 'T',
      factor: 1000000000000,
      priority: 2,
    },
    { pattern: /^(\d+(?:\.\d+)?)$/, unit: 'UNITS', factor: 1, priority: 1 },
  ];

  constructor(config?: Partial<VolumeHandlerConfig>) {
    this.config = {
      enableNormalization: true,
      enableAnomalyDetection: true,
      zeroVolumeHandling: 'KEEP',
      extremeVolumeThreshold: 10, // 10x la mediana
      interpolationMethod: 'MEDIAN',
      preserveOriginalValues: true,
      ...config,
    };
  }

  /**
   * Normalizza volume in un array di dati
   */
  public normalizeVolume(data: VolumeDataItem[]): VolumeDataItem[] {
    if (!this.config.enableNormalization || data.length === 0) {
      return data;
    }

    const result = this.processVolumeData(data);

    if (!result.success) {
      return data; // Ritorna dati originali in caso di errore
    }

    return result.normalizedData;
  }

  /**
   * Processa dati di volume completi con statistiche
   */
  public processVolumeData(data: VolumeDataItem[]): VolumeNormalizationResult {
    const conversions: VolumeConversion[] = [];
    const anomalies: VolumeAnomaly[] = [];
    const normalizedData: VolumeDataItem[] = [];

    // 1. Prima passata: normalizzazione base
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const volumeField = this.findVolumeField(item);

      if (!volumeField) {
        anomalies.push({
          type: 'INCONSISTENT_FORMAT',
          record: i,
          originalValue: item,
          severity: 'MEDIUM',
          description: 'Campo volume non trovato',
        });
        continue;
      }

      const originalVolume = item[volumeField];
      const normalizationResult = this.normalizeVolumeValue(originalVolume);

      if (normalizationResult.success) {
        const normalizedItem: VolumeDataItem = {
          ...item,
          volume: normalizationResult.normalizedValue,
          volumeNormalized: normalizationResult.normalizedValue,
        };

        if (this.config.preserveOriginalValues) {
          normalizedItem.originalVolume = originalVolume;
          normalizedItem.volumeUnit = normalizationResult.detectedUnit;
        }

        normalizedData.push(normalizedItem);

        conversions.push({
          originalValue: originalVolume,
          normalizedValue: normalizationResult.normalizedValue,
          detectedUnit: normalizationResult.detectedUnit,
          conversionFactor: normalizationResult.conversionFactor,
          confidence: normalizationResult.confidence,
        });
      } else {
        anomalies.push({
          type: 'INCONSISTENT_FORMAT',
          record: i,
          originalValue: originalVolume,
          severity: 'HIGH',
          description: `Impossibile normalizzare volume: ${originalVolume}`,
        });
      }
    }

    // 2. Seconda passata: rilevamento anomalie
    if (this.config.enableAnomalyDetection && normalizedData.length > 0) {
      const volumeAnomalies = this.detectVolumeAnomalies(normalizedData);
      anomalies.push(...volumeAnomalies);
    }

    // 3. Terza passata: gestione valori zero/negativi
    const finalData = this.handleSpecialVolumeValues(normalizedData, anomalies);

    // 4. Calcolo statistiche
    const stats = this.calculateVolumeStats(finalData);

    return {
      success: finalData.length > 0,
      normalizedData: finalData,
      conversions,
      anomalies,
      stats,
    };
  }

  /**
   * Normalizza un singolo valore di volume
   */
  private normalizeVolumeValue(value: unknown): {
    success: boolean;
    normalizedValue: number;
    detectedUnit: string;
    conversionFactor: number;
    confidence: number;
  } {
    if (value === null || value === undefined) {
      return {
        success: false,
        normalizedValue: 0,
        detectedUnit: 'NULL',
        conversionFactor: 1,
        confidence: 0,
      };
    }

    const stringValue = String(value).trim();

    // Prova tutti i pattern in ordine di priorità
    const sortedPatterns = [...this.volumePatterns].sort(
      (a, b) => b.priority - a.priority
    );

    for (const { pattern, unit, factor } of sortedPatterns) {
      const match = stringValue.match(pattern);
      if (match) {
        const numericValue = parseFloat(match[1]);

        if (!isNaN(numericValue) && numericValue >= 0) {
          return {
            success: true,
            normalizedValue: Math.round(numericValue * factor),
            detectedUnit: unit,
            conversionFactor: factor,
            confidence: this.calculateNormalizationConfidence(
              stringValue,
              unit,
              numericValue
            ),
          };
        }
      }
    }

    // Prova parsing numerico diretto
    const directNumber = Number(value);
    if (!isNaN(directNumber) && directNumber >= 0) {
      return {
        success: true,
        normalizedValue: Math.round(directNumber),
        detectedUnit: 'DIRECT',
        conversionFactor: 1,
        confidence: 0.8,
      };
    }

    return {
      success: false,
      normalizedValue: 0,
      detectedUnit: 'UNKNOWN',
      conversionFactor: 1,
      confidence: 0,
    };
  }

  /**
   * Calcola confidence della normalizzazione
   */
  private calculateNormalizationConfidence(
    value: string,
    unit: string,
    numericValue: number
  ): number {
    let confidence = 0.5;

    // Fattori che aumentano confidence:

    // 1. Formato pulito e chiaro
    if (value.match(/^\d+(\.\d+)?[KMBTkmbt]?$/)) {
      confidence += 0.3;
    }

    // 2. Unità esplicita
    if (unit !== 'UNITS' && unit !== 'DIRECT') {
      confidence += 0.2;
    }

    // 3. Valore ragionevole
    if (numericValue > 0 && numericValue < 1000000) {
      // Valore base ragionevole
      confidence += 0.2;
    }

    // 4. Formato standard
    if (value.match(/^\d+[KMB]$/)) {
      // Formato molto comune
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Rileva anomalie nel volume
   */
  private detectVolumeAnomalies(data: VolumeDataItem[]): VolumeAnomaly[] {
    const anomalies: VolumeAnomaly[] = [];

    if (data.length === 0) return anomalies;

    // Calcola statistiche per rilevamento anomalie
    const volumes = data.map(item =>
      toNumber(item.volumeNormalized ?? item.volume ?? 0)
    );
    const sortedVolumes = [...volumes].sort(
      (a, b) => toNumber(a) - toNumber(b)
    );
    const median = this.calculateMedian(sortedVolumes.map(toNumber));
    const mean =
      volumes.reduce((sum, vol) => sum + toNumber(vol), 0) / volumes.length;

    const extremeThreshold = median * this.config.extremeVolumeThreshold;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const volumeRaw = item.volumeNormalized ?? item.volume ?? 0;
      const volume = toNumber(volumeRaw);

      // Volume zero
      if (volume === 0) {
        anomalies.push({
          type: 'ZERO_VOLUME',
          record: i,
          originalValue: item.originalVolume || volume,
          normalizedValue: volume,
          severity: 'LOW',
          description: 'Volume zero rilevato',
        });
      }

      // Volume negativo
      else if (volume < 0) {
        anomalies.push({
          type: 'NEGATIVE_VOLUME',
          record: i,
          originalValue: item.originalVolume || volume,
          normalizedValue: volume,
          severity: 'HIGH',
          description: 'Volume negativo rilevato',
        });
      }

      // Volume estremamente alto
      else if (volume > extremeThreshold) {
        anomalies.push({
          type: 'EXTREME_HIGH',
          record: i,
          originalValue: item.originalVolume || volume,
          normalizedValue: volume,
          severity: 'MEDIUM',
          description: `Volume estremamente alto: ${volume} (soglia: ${extremeThreshold})`,
        });
      }

      // Volume estremamente basso (ma non zero)
      else if (
        volume > 0 &&
        volume < median / this.config.extremeVolumeThreshold
      ) {
        anomalies.push({
          type: 'EXTREME_LOW',
          record: i,
          originalValue: item.originalVolume || volume,
          normalizedValue: volume,
          severity: 'LOW',
          description: `Volume estremamente basso: ${volume} (mediana: ${median})`,
        });
      }
    }

    return anomalies;
  }

  /**
   * Gestisce valori speciali di volume (zero, negativi)
   */
  private handleSpecialVolumeValues(
    data: VolumeDataItem[],
    anomalies: VolumeAnomaly[]
  ): VolumeDataItem[] {
    if (this.config.zeroVolumeHandling === 'KEEP') {
      return data;
    }

    const result = [...data];
    const zeroVolumeIndices = anomalies
      .filter(a => a.type === 'ZERO_VOLUME')
      .map(a => a.record);

    if (this.config.zeroVolumeHandling === 'REMOVE') {
      // Rimuovi record con volume zero
      return result.filter((_, index) => !zeroVolumeIndices.includes(index));
    }

    if (this.config.zeroVolumeHandling === 'INTERPOLATE') {
      // Interpola valori zero
      for (const index of zeroVolumeIndices) {
        if (index < result.length) {
          const interpolatedValue = this.interpolateVolume(result, index);
          result[index] = {
            ...result[index],
            volume: interpolatedValue,
            volumeNormalized: interpolatedValue,
            volumeInterpolated: true,
          };
        }
      }
    }

    return result;
  }

  /**
   * Interpola volume per un record specifico
   */
  private interpolateVolume(data: VolumeDataItem[], index: number): number {
    const volumes = data.map(item =>
      toNumber(item.volumeNormalized ?? item.volume ?? 0)
    );
    switch (this.config.interpolationMethod) {
      case 'LINEAR': {
        return this.linearInterpolation(volumes, index);
      }
      case 'MEDIAN': {
        const nonZeroVolumes = volumes.filter(v => v > 0);
        return nonZeroVolumes.length > 0
          ? this.calculateMedian(nonZeroVolumes)
          : 0;
      }
      case 'AVERAGE': {
        const nonZeroVolumesAvg = volumes.filter(v => v > 0);
        return nonZeroVolumesAvg.length > 0
          ? nonZeroVolumesAvg.reduce((sum, v) => sum + v, 0) /
              nonZeroVolumesAvg.length
          : 0;
      }
      default:
        return 0;
    }
  }

  /**
   * Interpolazione lineare
   */
  private linearInterpolation(values: number[], index: number): number {
    // Trova valori non-zero prima e dopo
    let prevIndex = -1;
    let nextIndex = -1;

    for (let i = index - 1; i >= 0; i--) {
      if (values[i] > 0) {
        prevIndex = i;
        break;
      }
    }

    for (let i = index + 1; i < values.length; i++) {
      if (values[i] > 0) {
        nextIndex = i;
        break;
      }
    }

    if (prevIndex >= 0 && nextIndex >= 0) {
      const prevValue = values[prevIndex];
      const nextValue = values[nextIndex];
      const ratio = (index - prevIndex) / (nextIndex - prevIndex);
      return Math.round(prevValue + (nextValue - prevValue) * ratio);
    }

    if (prevIndex >= 0) return values[prevIndex];
    if (nextIndex >= 0) return values[nextIndex];

    return 0;
  }

  /**
   * Calcola statistiche volume
   */
  private calculateVolumeStats(data: VolumeDataItem[]): {
    recordsProcessed: number;
    recordsNormalized: number;
    averageVolume: number;
    medianVolume: number;
    volumeRange: { min: number; max: number };
  } {
    if (data.length === 0) {
      return {
        recordsProcessed: 0,
        recordsNormalized: 0,
        averageVolume: 0,
        medianVolume: 0,
        volumeRange: { min: 0, max: 0 },
      };
    }
    const volumes = data.map(item =>
      toNumber(item.volumeNormalized ?? item.volume ?? 0)
    );
    const validVolumes = volumes.filter(v => v >= 0);
    return {
      recordsProcessed: data.length,
      recordsNormalized: validVolumes.length,
      averageVolume:
        validVolumes.length > 0
          ? validVolumes.reduce((sum, v) => sum + v, 0) / validVolumes.length
          : 0,
      medianVolume:
        validVolumes.length > 0 ? this.calculateMedian(validVolumes) : 0,
      volumeRange: {
        min: validVolumes.length > 0 ? Math.min(...validVolumes) : 0,
        max: validVolumes.length > 0 ? Math.max(...validVolumes) : 0,
      },
    };
  }

  /**
   * Calcola mediana
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Trova campo volume nell'oggetto
   */
  private findVolumeField(item: VolumeDataItem): string | null {
    const volumeFields = [
      'volume',
      'Volume',
      'VOLUME',
      'vol',
      'Vol',
      'VOL',
      'v',
      'V',
    ];

    for (const field of volumeFields) {
      if (
        Object.prototype.hasOwnProperty.call(item, field) &&
        item[field] != null
      ) {
        return field;
      }
    }

    return null;
  }

  /**
   * Ottieni configurazione
   */
  public getConfig(): VolumeHandlerConfig {
    return { ...this.config };
  }

  /**
   * Test normalizzazione su valore singolo
   */
  public testNormalization(value: unknown): {
    canNormalize: boolean;
    result?: {
      normalizedValue: number;
      detectedUnit: string;
      confidence: number;
    };
    error?: string;
  } {
    try {
      const result = this.normalizeVolumeValue(value);

      if (result.success) {
        return {
          canNormalize: true,
          result: {
            normalizedValue: result.normalizedValue,
            detectedUnit: result.detectedUnit,
            confidence: result.confidence,
          },
        };
      } else {
        return {
          canNormalize: false,
          error: `Impossibile normalizzare valore: ${value}`,
        };
      }
    } catch (error) {
      return {
        canNormalize: false,
        error: (error as Error).message,
      };
    }
  }
}

// Utility function to ensure a value is a number
function toNumber(val: string | number | undefined | null): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  return 0;
}
