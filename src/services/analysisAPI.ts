// src/services/analysisAPI.ts
import { AnalysisApiResponse } from './analysisAPI'; // Manteniamo la definizione dei tipi

// La definizione dei tipi rimane qui, perché è il "contratto" tra frontend e backend
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

/**
 * Esegue una chiamata REALE al backend per ottenere i dati dell'analisi.
 *
 * @param params I parametri dell'analisi inseriti dall'utente.
 * @returns Una Promise che risolve con i dati dell'analisi dal backend.
 */
export const fetchAnalysisData = async (
  params: AnalysisParams
): Promise<AnalysisApiResponse> => {
  console.log('Frontend: Avvio chiamata API REALE con parametri:', params);

  // In produzione, VITE_API_BASE_URL sarà l'URL del backend deployato (es. su Render).
  // In sviluppo, sarà una stringa vuota, e la chiamata userà il proxy di Vite.
  // QUESTA VARIABILE DEVE ESSERE IMPOSTATA NELLE ENV VARS DI VERCEL.
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const API_URL = `${API_BASE_URL}/api/analysis`;

  console.log(`Frontend: Eseguo la chiamata a: ${API_URL}`);

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
        errorData.error || `Errore del server: ${response.status}`
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
    throw error; // Rilanciamo l'errore per farlo gestire dal contesto
  }
};
