import { NotificationManager } from './NotificationManager';

export interface FinancialData {
  price: number;
  volume: number;
  timestamp: Date;
  symbol: string;
}

export interface CalculationResult {
  value: number;
  confidence: number;
  timestamp: Date;
  metadata: {
    calculationType: string;
    inputData: FinancialData[];
    parameters: Record<string, number>;
  };
}

export class FinancialCalculator {
  private static instance: FinancialCalculator;
  private notificationManager: NotificationManager;

  private constructor() {
    this.notificationManager = NotificationManager.getInstance();
  }

  public static getInstance(): FinancialCalculator {
    if (!FinancialCalculator.instance) {
      FinancialCalculator.instance = new FinancialCalculator();
    }
    return FinancialCalculator.instance;
  }

  public calculateMovingAverage(data: FinancialData[], period: number): CalculationResult {
    if (!Array.isArray(data) || data.length < period || period <= 0 || !Number.isFinite(period)) {
      throw new Error(`Insufficient or invalid data/period for ${period}-period moving average`);
    }
    if (data.some(d => typeof d.price !== 'number' || !Number.isFinite(d.price) || d.price < 0)) {
      throw new Error('Invalid price data');
    }

    const prices = data.map(d => d.price);
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    const average = sum / period;

    return {
      value: average,
      confidence: this.calculateConfidence(data, period),
      timestamp: new Date(),
      metadata: {
        calculationType: 'moving_average',
        inputData: data,
        parameters: { period }
      }
    };
  }

  public calculateRSI(data: FinancialData[], period: number = 14): CalculationResult {
    if (!Array.isArray(data) || data.length < period + 1 || period <= 0 || !Number.isFinite(period)) {
      throw new Error(`Insufficient or invalid data/period for ${period}-period RSI`);
    }
    if (data.some(d => typeof d.price !== 'number' || !Number.isFinite(d.price) || d.price < 0)) {
      throw new Error('Invalid price data');
    }

    const prices = data.map(d => d.price);
    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? -change : 0);
    
    const avgGain = this.calculateAverage(gains.slice(-period));
    const avgLoss = this.calculateAverage(losses.slice(-period));
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return {
      value: rsi,
      confidence: this.calculateConfidence(data, period),
      timestamp: new Date(),
      metadata: {
        calculationType: 'rsi',
        inputData: data,
        parameters: { period }
      }
    };
  }

  public calculateBollingerBands(data: FinancialData[], period: number = 20, stdDev: number = 2): CalculationResult {
    if (!Array.isArray(data) || data.length < period || period <= 0 || !Number.isFinite(period) || stdDev <= 0 || !Number.isFinite(stdDev)) {
      throw new Error(`Insufficient or invalid data/period/stdDev for ${period}-period Bollinger Bands`);
    }
    if (data.some(d => typeof d.price !== 'number' || !Number.isFinite(d.price) || d.price < 0)) {
      throw new Error('Invalid price data');
    }

    const prices = data.map(d => d.price);
    const sma = this.calculateMovingAverage(data, period).value;
    
    const squaredDifferences = prices.slice(-period).map(price => Math.pow(price - sma, 2));
    const variance = this.calculateAverage(squaredDifferences);
    const standardDeviation = Math.sqrt(variance);
    
    const upperBand = sma + (standardDeviation * stdDev);
    const lowerBand = sma - (standardDeviation * stdDev);

    return {
      value: (upperBand + lowerBand) / 2, // Return middle band as main value
      confidence: this.calculateConfidence(data, period),
      timestamp: new Date(),
      metadata: {
        calculationType: 'bollinger_bands',
        inputData: data,
        parameters: { period, stdDev }
      }
    };
  }

  private calculateAverage(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private calculateConfidence(data: FinancialData[], period: number): number {
    // Calcola la confidenza basata su:
    // 1. Quantità di dati disponibili
    // 2. Qualità dei dati (volume, timestamp, etc.)
    const dataQuality = this.assessDataQuality(data);
    const dataQuantity = Math.min(data.length / period, 1);
    
    return (dataQuality + dataQuantity) / 2;
  }

  private assessDataQuality(data: FinancialData[]): number {
    // Valuta la qualità dei dati basandosi su:
    // 1. Completezza dei dati
    // 2. Volume delle transazioni
    // 3. Regolarità dei timestamp
    const volumes = data.map(d => d.volume);
    const avgVolume = this.calculateAverage(volumes);
    const maxVolume = Math.max(...volumes, 1); // avoid zero
    const volumeScore = Math.max(0, Math.min(1, avgVolume / maxVolume));
    // Verifica la regolarità dei timestamp
    const timestamps = data.map(d => d.timestamp.getTime());
    const intervals = timestamps.slice(1).map((time, i) => time - timestamps[i]);
    const avgInterval = Math.max(1, this.calculateAverage(intervals)); // avoid zero/negative
    const intervalVariance = this.calculateVariance(intervals, avgInterval);
    const regularityScore = Math.max(0, Math.min(1, 1 - (intervalVariance / avgInterval)));
    return (volumeScore + regularityScore) / 2;
  }

  private calculateVariance(numbers: number[], mean: number): number {
    const squaredDifferences = numbers.map(n => Math.pow(n - mean, 2));
    return this.calculateAverage(squaredDifferences);
  }
} 