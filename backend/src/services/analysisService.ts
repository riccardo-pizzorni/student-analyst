import * as ss from 'simple-statistics';
import {
  AlphaVantageService,
  AlphaVantageTimeframe,
  OHLCVData,
} from './alphaVantageService';

interface PerformanceMetric {
  label: string;
  value: string;
}

// Duplichiamo la definizione del tipo qui per disaccoppiare backend e frontend
export interface AnalysisApiResponse {
  historicalData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
    }[];
  };
  performanceMetrics: PerformanceMetric[];
  volatility: {
    annualizedVolatility: number;
    sharpeRatio: number;
    // ... altre metriche di volatilità
  } | null;
  correlation: {
    matrix: {
      symbol: string;
      values: number[];
    }[];
    // ... altre metriche di correlazione
  } | null;
}

interface AnalysisParams {
  tickers: string[];
  startDate: string;
  endDate: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

interface VolatilityMetrics {
  annualizedVolatility: number;
  sharpeRatio: number;
}

interface CalculationResult {
  performanceMetrics: PerformanceMetric[];
  volatility: VolatilityMetrics | null;
}

interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}

interface CorrelationResult {
  correlationMatrix: CorrelationMatrix;
  diversificationIndex: number;
  averageCorrelation: number;
  // ... altre metriche di diversificazione
}

/**
 * Trasforma e filtra i dati grezzi di Alpha Vantage.
 */
const processTimeSeries = (
  timeSeries: OHLCVData[],
  startDate: string,
  endDate: string
): { date: string; price: number }[] => {
  return timeSeries
    .map(point => ({
      date: point.date,
      price: point.adjustedClose || point.close, // Preferisce 'adjusted close' se disponibile
    }))
    .filter(point => point.date >= startDate && point.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date)); // Ordina cronologicamente
};

// Istanziamo il servizio una sola volta per riutilizzare la connessione e la cache
const alphaService = new AlphaVantageService();

const calculatePerformanceAndVolatility = (
  timeSeries: { date: string; price: number }[]
): CalculationResult => {
  if (timeSeries.length < 2) {
    return { performanceMetrics: [], volatility: null };
  }

  const startPrice = timeSeries[0].price;
  const endPrice = timeSeries[timeSeries.length - 1].price;
  const startDate = new Date(timeSeries[0].date);
  const endDate = new Date(timeSeries[timeSeries.length - 1].date);

  // Calcolo Rendimento Totale
  const totalReturn = (endPrice - startPrice) / startPrice;

  // Calcolo CAGR
  const years =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const cagr = Math.pow(1 + totalReturn, 1 / years) - 1;

  // Calcolo Rendimenti Giornalieri
  const dailyReturns = [];
  for (let i = 1; i < timeSeries.length; i++) {
    const yesterdayPrice = timeSeries[i - 1].price;
    const todayPrice = timeSeries[i].price;
    dailyReturns.push((todayPrice - yesterdayPrice) / yesterdayPrice);
  }

  const meanReturn = ss.mean(dailyReturns);
  const stdDev = ss.standardDeviation(dailyReturns);

  // Calcolo Volatilità Annualizzata
  const annualizedVolatility = stdDev * Math.sqrt(252);

  // Calcolo Sharpe Ratio
  const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

  const performanceMetrics = [
    { label: 'Rendimento Totale', value: `${(totalReturn * 100).toFixed(2)}%` },
    { label: 'CAGR', value: `${(cagr * 100).toFixed(2)}%` },
    { label: 'Sharpe Ratio', value: sharpeRatio.toFixed(2) },
  ];

  const volatility = {
    annualizedVolatility,
    sharpeRatio,
    // Aggiungeremo altre metriche in futuro
  };

  return { performanceMetrics, volatility };
};

/**
 * Calcola la matrice di correlazione e le metriche di diversificazione.
 */
const calculateCorrelation = (
  allSeries: { date: string; price: number }[][],
  tickers: string[]
): CorrelationResult | null => {
  if (allSeries.length < 2) {
    return null;
  }

  // 1. Trova le date comuni a tutte le serie
  const dateSets = allSeries.map(series => new Set(series.map(p => p.date)));
  const commonDates = [...dateSets[0]].filter(date =>
    dateSets.every(set => set.has(date))
  );
  commonDates.sort();

  // 2. Allinea le serie storiche e calcola i rendimenti
  const returnsMatrix: number[][] = allSeries.map(series => {
    const priceMap = new Map(series.map(p => [p.date, p.price]));
    const alignedPrices = commonDates.map(date => priceMap.get(date)!);

    const returns = [];
    for (let i = 1; i < alignedPrices.length; i++) {
      returns.push(
        (alignedPrices[i] - alignedPrices[i - 1]) / alignedPrices[i - 1]
      );
    }
    return returns;
  });

  // 3. Calcola la matrice di correlazione
  const matrix: number[][] = [];
  for (let i = 0; i < returnsMatrix.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < returnsMatrix.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        matrix[i][j] = ss.sampleCorrelation(returnsMatrix[i], returnsMatrix[j]);
      }
    }
  }

  // TODO: Calcolare le altre metriche
  return {
    correlationMatrix: {
      symbols: tickers,
      matrix,
    },
    diversificationIndex: 0.73, // mock
    averageCorrelation: 0.45, // mock
  };
};

/**
 * Servizio principale per eseguire l'analisi finanziaria.
 * Orchestra il recupero dei dati, i calcoli e la formattazione della risposta.
 */
export const performAnalysis = async (
  params: AnalysisParams
): Promise<AnalysisApiResponse> => {
  console.log('Backend: Inizio analisi con parametri:', params);

  const timeframes = {
    daily: AlphaVantageTimeframe.DAILY,
    weekly: AlphaVantageTimeframe.WEEKLY,
    monthly: AlphaVantageTimeframe.MONTHLY,
  };
  const timeframe = timeframes[params.frequency];

  // Step 1: Recuperare e processare i dati storici
  const processedDataPromises = params.tickers.map(async ticker => {
    const response = await alphaService.getStockData(ticker, timeframe, {
      outputSize: 'full', // Chiediamo la serie storica completa
    });
    return processTimeSeries(response.data, params.startDate, params.endDate);
  });

  const allProcessedData = await Promise.all(processedDataPromises);

  const mainTickerData = allProcessedData[0] || [];

  const historicalData = {
    labels: mainTickerData.map(p => p.date),
    datasets: [
      {
        label: params.tickers[0] || 'Portfolio',
        data: mainTickerData.map(p => p.price),
        borderColor: 'rgb(59, 130, 246)',
      },
    ],
  };

  // Calcoliamo performance e volatilità insieme
  const { performanceMetrics, volatility } =
    calculatePerformanceAndVolatility(mainTickerData);

  // Calcoliamo la correlazione
  const correlation = calculateCorrelation(allProcessedData, params.tickers);

  // Step 5: Formattare la risposta (usando dati mock per ora)
  const results: AnalysisApiResponse = {
    historicalData,
    performanceMetrics,
    volatility,
    correlation,
  };

  console.log('Backend: Analisi completata con successo.');
  return results;
};
