// src/services/analysisAPI.ts

interface AnalysisParams {
  tickers: string[];
  startDate: string;
  endDate: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

// Definiamo una struttura di tipi per la risposta dell'API
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
    annualizedVolatility: {
      value: number;
      benchmark: number;
      description: string;
    };
    sharpeRatio: {
      value: number;
      max: number;
      description: string;
    };
  };
  correlation: {
    matrix: {
      symbol: string;
      values: number[];
    }[];
    diversificationIndex: {
      value: number;
      label: string;
    };
    averageCorrelation: {
      value: number;
      label: string;
    };
    riskReduction: {
      value: number;
      label: string;
    };
    highCorrelationAlert: {
      pair: string;
      value: number;
    };
  };
}

// Simula una struttura di dati di risposta dall'API
const mockApiResponse: AnalysisApiResponse = {
  historicalData: {
    labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'],
    datasets: [
      {
        label: 'Portfolio',
        data: [100, 105, 102, 108, 112, 110],
        borderColor: 'rgb(59, 130, 246)',
      },
      {
        label: 'Benchmark',
        data: [100, 102, 101, 104, 105, 106],
        borderColor: 'rgb(107, 114, 128)',
      },
    ],
  },
  performanceMetrics: [
    { label: 'CAGR', value: '15.2%' },
    { label: 'Sharpe Ratio', value: '1.58' },
    { label: 'Sortino Ratio', value: '2.1' },
    { label: 'Calmar Ratio', value: '0.89' },
  ],
  volatility: {
    annualizedVolatility: {
      value: 0.237, // 23.7%
      benchmark: 0.152,
      description: 'Rischio elevato vs benchmark',
    },
    sharpeRatio: {
      value: 1.42,
      max: 2,
      description: 'Buona performance risk-adjusted',
    },
    // Potremmo aggiungere in futuro la rolling volatility per un grafico
  },
  correlation: {
    matrix: [
      { symbol: 'AAPL', values: [1.0, 0.71, 0.48, 0.35, 0.3] },
      { symbol: 'MSFT', values: [0.71, 1.0, 0.75, 0.43, 0.38] },
      { symbol: 'GOOGL', values: [0.48, 0.75, 1.0, 0.4, 0.31] },
      { symbol: 'AMZN', values: [0.35, 0.43, 0.4, 1.0, 0.46] },
      { symbol: 'TSLA', values: [0.3, 0.38, 0.31, 0.46, 1.0] },
    ],
    diversificationIndex: {
      value: 0.78,
      label: 'Buona diversificazione',
    },
    averageCorrelation: {
      value: 0.48,
      label: 'Livello accettabile',
    },
    riskReduction: {
      value: 0.214, // 21.4%
      label: 'Beneficio diversificazione',
    },
    highCorrelationAlert: {
      pair: 'MSFT & GOOGL',
      value: 0.75,
    },
  },
  // Aggiungeremo altre sezioni di dati (correlazione, etc.) in seguito
};

/**
 * Simula una chiamata API al backend per ottenere i dati dell'analisi.
 * In futuro, questa funzione conterrà una vera richiesta `fetch` a un endpoint
 * del nostro server (es. POST /api/analysis).
 *
 * @param params I parametri dell'analisi inseriti dall'utente.
 * @returns Una Promise che risolve con i dati dell'analisi.
 */
export const fetchAnalysisData = (
  params: AnalysisParams
): Promise<AnalysisApiResponse> => {
  console.log('Chiamata API simulata con i parametri:', params);

  return new Promise(resolve => {
    // Simula un ritardo di rete di 1.5 secondi
    setTimeout(() => {
      console.log('Dati simulati ricevuti:', mockApiResponse);
      resolve(mockApiResponse);
    }, 1500);
  });
};
