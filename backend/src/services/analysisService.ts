import {
  HistoricalAnalysisParams,
  HistoricalAnalysisResponse,
  historicalAnalysisService,
} from './historicalAnalysisService';

export interface PerformanceMetric {
  label: string;
  value: string;
}

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}

export interface AnalysisApiResponse {
  historicalData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor?: string;
      fill?: boolean;
      yAxisID?: string;
    }[];
  };
  performanceMetrics: PerformanceMetric[];
  volatility: {
    annualizedVolatility: number;
    sharpeRatio: number;
  } | null;
  correlation: {
    correlationMatrix: CorrelationMatrix;
    diversificationIndex: number;
    averageCorrelation: number;
  } | null;
  marketPhases?: {
    bullMarkets: Array<{
      start: string;
      end: string;
      duration: number;
      return: number;
    }>;
    bearMarkets: Array<{
      start: string;
      end: string;
      duration: number;
      return: number;
    }>;
    consolidation: Array<{ start: string; end: string; duration: number }>;
  };
  metadata?: {
    analysisDate: string;
    symbols: string[];
    period: { start: string; end: string };
    frequency: string;
    dataPoints: number;
    processingTime: number;
  };
}

interface AnalysisParams {
  tickers: string[];
  startDate: string;
  endDate: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

/**
 * Funzione principale per eseguire l'analisi completa
 */
export async function performAnalysis(
  params: AnalysisParams
): Promise<AnalysisApiResponse> {
  console.log('🚀 Avvio analisi completa con parametri:', params);

  try {
    // 1. Esegui analisi storica
    const historicalParams: HistoricalAnalysisParams = {
      tickers: params.tickers,
      startDate: params.startDate,
      endDate: params.endDate,
      frequency: params.frequency,
      includeTechnicalIndicators: true,
      includePerformanceMetrics: true,
    };

    const historicalResponse =
      await historicalAnalysisService.performHistoricalAnalysis(
        historicalParams
      );

    if (!historicalResponse.success) {
      throw new Error(
        historicalResponse.error || "Errore durante l'analisi storica"
      );
    }

    // 2. Formatta i dati per il frontend
    const formattedData = formatHistoricalDataForFrontend(
      historicalResponse.data
    );

    // 3. Calcola metriche di performance aggregate
    const performanceMetrics = calculateAggregatePerformanceMetrics(
      historicalResponse.data
    );

    // 4. Calcola volatilità e Sharpe ratio
    const volatility = calculateVolatilityMetrics(historicalResponse.data);

    // 5. Calcola correlazioni se ci sono più ticker
    const correlation =
      params.tickers.length > 1
        ? calculateCorrelationMatrix(historicalResponse.data)
        : null;

    console.log('✅ Analisi completata con successo');

    return {
      historicalData: formattedData,
      performanceMetrics,
      volatility,
      correlation,
      marketPhases: historicalResponse.data.marketPhases,
      metadata: historicalResponse.metadata,
    };
  } catch (error) {
    console.error("❌ Errore durante l'analisi:", error);
    throw error;
  }
}

/**
 * Formatta i dati storici per il frontend
 */
function formatHistoricalDataForFrontend(
  data: HistoricalAnalysisResponse['data']
) {
  const { historicalData, portfolioData } = data;

  if (historicalData.length === 0) {
    return {
      labels: [],
      datasets: [],
    };
  }

  // Usa le date del primo ticker come labels
  const labels = historicalData[0].dates;

  const datasets = [];

  // Aggiungi dataset per ogni ticker
  historicalData.forEach((tickerData, index) => {
    const colors = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
      '#FF6384',
      '#C9CBCF',
      '#4BC0C0',
      '#FF6384',
    ];

    // Dataset prezzi
    datasets.push({
      label: `${tickerData.symbol} - Prezzo`,
      data: tickerData.prices.adjustedClose,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      fill: false,
      yAxisID: 'y',
    });

    // Dataset SMA 20
    if (tickerData.technicalIndicators.sma20.length > 0) {
      datasets.push({
        label: `${tickerData.symbol} - SMA 20`,
        data: tickerData.technicalIndicators.sma20,
        borderColor: colors[index % colors.length] + '80',
        backgroundColor: 'transparent',
        fill: false,
        yAxisID: 'y',
      });
    }

    // Dataset SMA 50
    if (tickerData.technicalIndicators.sma50.length > 0) {
      datasets.push({
        label: `${tickerData.symbol} - SMA 50`,
        data: tickerData.technicalIndicators.sma50,
        borderColor: colors[index % colors.length] + '60',
        backgroundColor: 'transparent',
        fill: false,
        yAxisID: 'y',
      });
    }

    // Dataset RSI (se abilitato)
    if (tickerData.technicalIndicators.rsi.length > 0) {
      datasets.push({
        label: `${tickerData.symbol} - RSI`,
        data: tickerData.technicalIndicators.rsi,
        borderColor: '#FF6384',
        backgroundColor: 'transparent',
        fill: false,
        yAxisID: 'y1',
      });
    }
  });

  // Aggiungi dataset del portafoglio se disponibile
  if (portfolioData) {
    datasets.push({
      label: 'Portafoglio - Valore',
      data: portfolioData.portfolioValue,
      borderColor: '#00FF00',
      backgroundColor: '#00FF0020',
      fill: false,
      yAxisID: 'y',
    });
  }

  return {
    labels,
    datasets,
  };
}

/**
 * Calcola metriche di performance aggregate
 */
function calculateAggregatePerformanceMetrics(
  data: HistoricalAnalysisResponse['data']
): PerformanceMetric[] {
  const { historicalData, portfolioData } = data;

  if (historicalData.length === 0) {
    return [];
  }

  const metrics: PerformanceMetric[] = [];

  // Se c'è un portafoglio, usa quelle metriche
  if (portfolioData) {
    const { portfolioMetrics } = portfolioData;

    metrics.push(
      {
        label: 'Rendimento Totale',
        value: `${(portfolioMetrics.totalReturn * 100).toFixed(2)}%`,
      },
      {
        label: 'Rendimento Annuo',
        value: `${(portfolioMetrics.annualizedReturn * 100).toFixed(2)}%`,
      },
      {
        label: 'Volatilità Annua',
        value: `${(portfolioMetrics.volatility * 100).toFixed(2)}%`,
      },
      { label: 'Sharpe Ratio', value: portfolioMetrics.sharpeRatio.toFixed(2) },
      {
        label: 'Max Drawdown',
        value: `${(portfolioMetrics.maxDrawdown * 100).toFixed(2)}%`,
      }
    );
  } else {
    // Altrimenti usa le metriche del primo ticker
    const firstTicker = historicalData[0];
    const { performanceMetrics } = firstTicker;

    metrics.push(
      {
        label: 'Rendimento Totale',
        value: `${(performanceMetrics.totalReturn * 100).toFixed(2)}%`,
      },
      {
        label: 'Rendimento Annuo',
        value: `${(performanceMetrics.annualizedReturn * 100).toFixed(2)}%`,
      },
      {
        label: 'Volatilità Annua',
        value: `${(performanceMetrics.volatility * 100).toFixed(2)}%`,
      },
      {
        label: 'Sharpe Ratio',
        value: performanceMetrics.sharpeRatio.toFixed(2),
      },
      {
        label: 'Max Drawdown',
        value: `${(performanceMetrics.maxDrawdown * 100).toFixed(2)}%`,
      },
      {
        label: 'Calmar Ratio',
        value: performanceMetrics.calmarRatio.toFixed(2),
      }
    );
  }

  return metrics;
}

/**
 * Calcola metriche di volatilità
 */
function calculateVolatilityMetrics(data: HistoricalAnalysisResponse['data']) {
  const { historicalData, portfolioData } = data;

  if (historicalData.length === 0) {
    return null;
  }

  if (portfolioData) {
    const { portfolioMetrics } = portfolioData;
    return {
      annualizedVolatility: portfolioMetrics.volatility,
      sharpeRatio: portfolioMetrics.sharpeRatio,
    };
  } else {
    const firstTicker = historicalData[0];
    const { performanceMetrics } = firstTicker;
    return {
      annualizedVolatility: performanceMetrics.volatility,
      sharpeRatio: performanceMetrics.sharpeRatio,
    };
  }
}

/**
 * Calcola matrice di correlazione
 */
function calculateCorrelationMatrix(data: HistoricalAnalysisResponse['data']) {
  const { historicalData } = data;

  if (historicalData.length < 2) {
    return null;
  }

  const symbols = historicalData.map(d => d.symbol);
  const matrix: number[][] = [];

  // Calcola correlazioni tra tutti i ticker
  for (let i = 0; i < historicalData.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < historicalData.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        matrix[i][j] = calculateCorrelation(
          historicalData[i].returns.daily,
          historicalData[j].returns.daily
        );
      }
    }
  }

  // Calcola indice di diversificazione
  const averageCorrelation = calculateAverageCorrelation(matrix);
  const diversificationIndex = 1 - averageCorrelation;

  return {
    correlationMatrix: { symbols, matrix },
    diversificationIndex,
    averageCorrelation,
  };
}

/**
 * Calcola correlazione tra due serie di rendimenti
 */
function calculateCorrelation(returns1: number[], returns2: number[]): number {
  if (returns1.length !== returns2.length || returns1.length === 0) {
    return 0;
  }

  const n = returns1.length;
  const mean1 = returns1.reduce((a, b) => a + b, 0) / n;
  const mean2 = returns2.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(denominator1 * denominator2);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calcola correlazione media dalla matrice
 */
function calculateAverageCorrelation(matrix: number[][]): number {
  let sum = 0;
  let count = 0;

  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix.length; j++) {
      sum += matrix[i][j];
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}
