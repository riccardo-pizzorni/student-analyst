import { useMemo } from 'react';

interface PriceData {
  date: string;
  price: number;
  volume?: number;
}

interface TechnicalIndicators {
  sma20: number[];
  sma50: number[];
  sma200: number[];
  rsi: number[];
  volumes: number[];
}

export function useTechnicalIndicators(data: PriceData[]): TechnicalIndicators {
  return useMemo(() => {
    const prices = data.map(d => d.price);
    const volumes = data.map(d => d.volume || 0);

    // Calcolo SMA (Simple Moving Average)
    const calculateSMA = (period: number) => {
      const sma: number[] = [];
      for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
          sma.push(NaN);
          continue;
        }
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
      return sma;
    };

    // Calcolo RSI (Relative Strength Index)
    const calculateRSI = (period: number = 14) => {
      const rsi: number[] = [];
      const changes = prices.slice(1).map((price, i) => price - prices[i]);
      
      for (let i = 0; i < prices.length; i++) {
        if (i < period) {
          rsi.push(NaN);
          continue;
        }

        const gains = changes.slice(i - period, i).map(c => c > 0 ? c : 0);
        const losses = changes.slice(i - period, i).map(c => c < 0 ? -c : 0);
        
        const avgGain = gains.reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
        
        if (avgLoss === 0) {
          rsi.push(100);
        } else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      }
      return rsi;
    };

    return {
      sma20: calculateSMA(20),
      sma50: calculateSMA(50),
      sma200: calculateSMA(200),
      rsi: calculateRSI(),
      volumes: volumes
    };
  }, [data]);
} 