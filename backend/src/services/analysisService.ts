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
