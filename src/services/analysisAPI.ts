// src/services/analysisAPI.ts
import { AnalysisApiResponse } from './analysisAPI'; 

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
}

interface AnalysisParams {
  tickers: string[];
  startDate: string;
  endDate: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

export const fetchAnalysisData = async (
  params: AnalysisParams
): Promise<AnalysisApiResponse> => {
  console.log('Frontend: Avvio chiamata API REALE con parametri:', params);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
  const API_URL = ${API_BASE_URL}/api/analysis;

  console.log(Frontend: Eseguo la chiamata a: );

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
      console.error('Errore API dal backend:', response.status, errorData);
      throw new Error(
        errorData.error || Errore del server: 
      );
    }

    const results: AnalysisApiResponse = await response.json();
    console.log(
      'Frontend: Dati REALI ricevuti con successo dal backend:',
      results
    );
    return results;
  } catch (error) {
    console.error('Errore catastrofico durante la chiamata fetch:', error);
    throw error;
  }
};
