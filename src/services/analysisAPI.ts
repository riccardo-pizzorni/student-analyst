// src/services/analysisAPI.ts

export interface AnalysisApiResponse {
  historicalData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
    }[];
  };
  performanceMetrics: {
    label: string;
    value: string;
  }[];
  volatility: {
    annualizedVolatility: number;
    sharpeRatio: number;
  } | null;
  correlation: {
    correlationMatrix: {
      symbols: string[];
      matrix: number[][];
    };
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
    dataSources?: {
      primary: string;
      fallbacks: string[];
    };
  };
}

interface AnalysisParams {
  tickers: string[];
  startDate: string;
  endDate: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

// Funzione helper per determinare la base URL dell'API
const getApiBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.VITE_BACKEND_URL) {
    return process.env.VITE_BACKEND_URL;
  }
  // @ts-expect-error
  if (typeof import !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
    // @ts-expect-error
    return import.meta.env.VITE_BACKEND_URL;
  }
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

export const fetchAnalysisData = async (
  params: AnalysisParams
): Promise<AnalysisApiResponse> => {
  const API_URL = `${API_BASE_URL}/api/analysis`;
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'La risposta del server non è un JSON valido.',
      }));
      throw new Error(errorData.error || `Errore del server: ${response.status}`);
    }
    const results: AnalysisApiResponse = await response.json();
    return results;
  } catch (error) {
    throw error;
  }
};
