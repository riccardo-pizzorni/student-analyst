import { createContext, ReactNode, useContext, useState } from 'react';
import {
  AnalysisApiResponse,
  fetchAnalysisData,
} from '../services/analysisAPI';

// Definizione dei tipi
interface AnalysisInputState {
  tickers: string[];
  startDate: string;
  endDate: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  csvFile?: File;
}

// Espandiamo lo stato per includere i risultati, lo stato di caricamento e gli errori
interface AnalysisState extends AnalysisInputState {
  analysisResults: AnalysisApiResponse | null;
  isLoading: boolean;
  error: string | null;
}

// Valori iniziali dello stato
const initialState: AnalysisState = {
  tickers: ['AAPL', 'MSFT', 'GOOGL'],
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    .toISOString()
    .split('T')[0],
  frequency: 'daily',
  csvFile: undefined,
  analysisResults: null,
  isLoading: false,
  error: null,
};

// Tipo per il valore del contesto
interface AnalysisContextType {
  analysisState: AnalysisState;
  setAnalysisState: React.Dispatch<React.SetStateAction<AnalysisState>>;
  startAnalysis: () => void; // La funzione verrà resa più complessa
}

// Creazione del contesto
const AnalysisContext = createContext<AnalysisContextType | undefined>(
  undefined
);

// Provider del contesto
export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
  const [analysisState, setAnalysisState] =
    useState<AnalysisState>(initialState);

  const startAnalysis = async () => {
    setAnalysisState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
      analysisResults: null, // Pulisce i risultati precedenti
    }));

    try {
      const { tickers, startDate, endDate, frequency } = analysisState;
      const results = await fetchAnalysisData({
        tickers,
        startDate,
        endDate,
        frequency,
      });

      setAnalysisState(prevState => ({
        ...prevState,
        analysisResults: results,
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Si è verificato un errore';
      setAnalysisState(prevState => ({
        ...prevState,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  return (
    <AnalysisContext.Provider
      value={{ analysisState, setAnalysisState, startAnalysis }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

// Hook per usare il contesto
export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};
