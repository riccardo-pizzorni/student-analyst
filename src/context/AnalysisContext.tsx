import { ReactNode, createContext, useContext, useRef, useState } from 'react';
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
  startAnalysis: () => void;
  setTickers: (tickers: string[]) => void;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
  setFrequency: (frequency: 'daily' | 'weekly' | 'monthly') => void;
}

// Creazione del contesto
const AnalysisContext = createContext<AnalysisContextType | undefined>(
  undefined
);

// Provider del contesto
export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
  const [analysisState, setAnalysisState] =
    useState<AnalysisState>(initialState);

  // Ref per prevenire chiamate multiple
  const isAnalysisRunning = useRef(false);

  const setTickers = (tickers: string[]) => {
    setAnalysisState(prev => ({ ...prev, tickers }));
  };

  const setStartDate = (date: Date | undefined) => {
    setAnalysisState(prev => ({
      ...prev,
      startDate: date
        ? date.toISOString().split('T')[0]
        : initialState.startDate,
    }));
  };

  const setEndDate = (date: Date | undefined) => {
    setAnalysisState(prev => ({
      ...prev,
      endDate: date ? date.toISOString().split('T')[0] : initialState.endDate,
    }));
  };

  const setFrequency = (frequency: 'daily' | 'weekly' | 'monthly') => {
    setAnalysisState(prev => ({ ...prev, frequency }));
  };

  const startAnalysis = async () => {
    // Prevenire chiamate multiple
    if (isAnalysisRunning.current) {
      console.log('🚫 Analisi già in corso, ignoro chiamata multipla');
      return;
    }

    // Validazione parametri
    const { tickers, startDate, endDate, frequency } = analysisState;
    if (!tickers || tickers.length === 0) {
      setAnalysisState(prev => ({
        ...prev,
        error: 'Seleziona almeno un ticker',
        isLoading: false,
      }));
      return;
    }

    if (!startDate || !endDate) {
      setAnalysisState(prev => ({
        ...prev,
        error: 'Seleziona le date di inizio e fine',
        isLoading: false,
      }));
      return;
    }

    isAnalysisRunning.current = true;

    setAnalysisState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
      analysisResults: null, // Pulisce i risultati precedenti
    }));

    try {
      console.log('🚀 Avvio analisi con parametri:', { tickers, startDate, endDate, frequency });

      const results = await fetchAnalysisData({
        tickers,
        startDate,
        endDate,
        frequency,
      });

      // Validazione risultati prima di salvarli
      const validatedResults = {
        ...results,
        performanceMetrics: results.performanceMetrics?.map(metric => ({
          label: metric.label || 'Metrica',
          value: metric.value || '0%'
        })) || [],
        volatility: results.volatility ? {
          annualizedVolatility: results.volatility.annualizedVolatility || 0,
          sharpeRatio: results.volatility.sharpeRatio || 0
        } : null,
        correlation: results.correlation ? {
          correlationMatrix: results.correlation.correlationMatrix || { symbols: [], matrix: [] },
          diversificationIndex: results.correlation.diversificationIndex || 0,
          averageCorrelation: results.correlation.averageCorrelation || 0
        } : null
      };

      setAnalysisState(prevState => ({
        ...prevState,
        analysisResults: validatedResults,
        isLoading: false,
      }));

      console.log('✅ Analisi completata con successo');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Si è verificato un errore';
      console.error('❌ Errore durante l\'analisi:', errorMessage);

      setAnalysisState(prevState => ({
        ...prevState,
        isLoading: false,
        error: errorMessage,
      }));
    } finally {
      isAnalysisRunning.current = false;
    }
  };

  return (
    <AnalysisContext.Provider
      value={{
        analysisState,
        setAnalysisState,
        startAnalysis,
        setTickers,
        setStartDate,
        setEndDate,
        setFrequency,
      }}
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
