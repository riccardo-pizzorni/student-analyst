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
    correlationMatrix: CorrelationMatrix;
    diversificationIndex: number;
    averageCorrelation: number;
  } | null;
}
