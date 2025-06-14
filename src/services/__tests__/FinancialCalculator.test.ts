import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { FinancialCalculator, FinancialData } from '../FinancialCalculator';
import { NotificationManager } from '../NotificationManager';

jest.mock('../NotificationManager');

describe('FinancialCalculator', () => {
  let calculator: FinancialCalculator;
  let mockNotificationManager: jest.Mocked<NotificationManager>;
  let sampleData: FinancialData[];

  beforeEach(() => {
    // Reset singleton
    (FinancialCalculator as any).instance = null;
    
    // Mock NotificationManager
    mockNotificationManager = {
      showSuccess: jest.fn(),
      showWarning: jest.fn(),
      showError: jest.fn(),
      getInstance: jest.fn().mockReturnThis()
    } as any;
    
    (NotificationManager.getInstance as jest.Mock).mockReturnValue(mockNotificationManager);
    
    calculator = FinancialCalculator.getInstance();

    // Crea dati di esempio
    sampleData = Array.from({ length: 30 }, (_, i) => ({
      price: 100 + Math.sin(i) * 10, // Prezzi oscillanti
      volume: 1000 + Math.random() * 500, // Volumi variabili
      timestamp: new Date(Date.now() - (30 - i) * 60000), // Timestamp ogni minuto
      symbol: 'TEST'
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Moving Average', () => {
    test('dovrebbe calcolare correttamente la media mobile semplice', () => {
      const period = 5;
      const result = calculator.calculateMovingAverage(sampleData, period);
      
      expect(result.value).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.metadata.calculationType).toBe('moving_average');
      expect(result.metadata.parameters.period).toBe(period);
    });

    test('dovrebbe lanciare un errore con dati insufficienti', () => {
      const period = 50;
      expect(() => calculator.calculateMovingAverage(sampleData, period))
        .toThrow(`Insufficient or invalid data/period for ${period}-period moving average`);
    });
  });

  describe('RSI (Relative Strength Index)', () => {
    test('dovrebbe calcolare correttamente l\'RSI', () => {
      const period = 14;
      const result = calculator.calculateRSI(sampleData, period);
      
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.metadata.calculationType).toBe('rsi');
      expect(result.metadata.parameters.period).toBe(period);
    });

    test('dovrebbe lanciare un errore con dati insufficienti', () => {
      const period = 50;
      expect(() => calculator.calculateRSI(sampleData, period))
        .toThrow(`Insufficient or invalid data/period for ${period}-period RSI`);
    });

    test('dovrebbe gestire correttamente i casi limite', () => {
      // Dati con solo guadagni
      const onlyGains = sampleData.map((d, i) => ({
        ...d,
        price: 100 + i // strictly increasing, always valid
      }));
      const gainsResult = calculator.calculateRSI(onlyGains);
      expect(gainsResult.value).toBeGreaterThan(50);

      // Dati con solo perdite
      const onlyLosses = sampleData.map((d, i) => ({
        ...d,
        price: 100 - i // strictly decreasing, always valid
      }));
      const lossesResult = calculator.calculateRSI(onlyLosses);
      expect(lossesResult.value).toBeLessThan(50);
    });
  });

  describe('Bollinger Bands', () => {
    test('dovrebbe calcolare correttamente le Bollinger Bands', () => {
      const period = 20;
      const stdDev = 2;
      const result = calculator.calculateBollingerBands(sampleData, period, stdDev);
      
      expect(result.value).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.metadata.calculationType).toBe('bollinger_bands');
      expect(result.metadata.parameters.period).toBe(period);
      expect(result.metadata.parameters.stdDev).toBe(stdDev);
    });

    test('dovrebbe lanciare un errore con dati insufficienti', () => {
      const period = 50;
      expect(() => calculator.calculateBollingerBands(sampleData, period))
        .toThrow(`Insufficient or invalid data/period/stdDev for ${period}-period Bollinger Bands`);
    });

    test('dovrebbe gestire correttamente i casi limite', () => {
      // Dati con alta volatilità
      const highVolatility = sampleData.map((d, i) => ({
        ...d,
        price: d.price * (1 + Math.sin(i) * 0.5)
      }));
      const highVolResult = calculator.calculateBollingerBands(highVolatility);
      expect(highVolResult.confidence).toBeLessThan(1);

      // Dati con bassa volatilità
      const lowVolatility = sampleData.map((d, i) => ({
        ...d,
        price: d.price * (1 + Math.sin(i) * 0.1)
      }));
      const lowVolResult = calculator.calculateBollingerBands(lowVolatility);
      expect(lowVolResult.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Valutazione Qualità Dati', () => {
    test('dovrebbe valutare correttamente la qualità dei dati', () => {
      // Dati con volumi consistenti e timestamp regolari
      const goodData = sampleData.map((d, i) => ({
        ...d,
        volume: 1000,
        timestamp: new Date(Date.now() - (30 - i) * 60000)
      }));
      const goodResult = calculator.calculateMovingAverage(goodData, 5);
      expect(goodResult.confidence).toBeGreaterThan(0.8);

      // Dati con volumi irregolari e timestamp non uniformi
      const badData = sampleData.map((d, i) => ({
        ...d,
        volume: Math.random() * 100 + 1, // avoid zero
        timestamp: new Date(Date.now() - Math.random() * 3600000)
      }));
      const badResult = calculator.calculateMovingAverage(badData, 5);
      expect(badResult.confidence).toBeLessThan(0.8);
    });
  });

  describe('Gestione Errori', () => {
    test('dovrebbe gestire correttamente i dati invalidi', () => {
      const invalidData = [
        { price: NaN, volume: 1000, timestamp: new Date(), symbol: 'TEST' },
        { price: Infinity, volume: 1000, timestamp: new Date(), symbol: 'TEST' },
        { price: -1, volume: 1000, timestamp: new Date(), symbol: 'TEST' }
      ];

      expect(() => calculator.calculateMovingAverage(invalidData, 2))
        .toThrow('Invalid price data');
      expect(() => calculator.calculateRSI(invalidData, 2))
        .toThrow('Invalid price data');
      expect(() => calculator.calculateBollingerBands(invalidData, 2, 2))
        .toThrow('Invalid price data');
    });

    test('dovrebbe gestire correttamente i parametri invalidi', () => {
      expect(() => calculator.calculateMovingAverage(sampleData, 0))
        .toThrow('Insufficient or invalid data/period for 0-period moving average');
      expect(() => calculator.calculateMovingAverage(sampleData, -1))
        .toThrow('Insufficient or invalid data/period for -1-period moving average');
      expect(() => calculator.calculateBollingerBands(sampleData, 20, 0))
        .toThrow('Insufficient or invalid data/period/stdDev for 20-period Bollinger Bands');
      expect(() => calculator.calculateBollingerBands(sampleData, 20, -1))
        .toThrow('Insufficient or invalid data/period/stdDev for 20-period Bollinger Bands');
      expect(() => calculator.calculateRSI(sampleData, 0))
        .toThrow('Insufficient or invalid data/period for 0-period RSI');
      expect(() => calculator.calculateRSI(sampleData, -1))
        .toThrow('Insufficient or invalid data/period for -1-period RSI');
    });
  });
}); 