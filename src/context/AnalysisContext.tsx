import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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
  csvFile?: File | undefined;
}

// Espandiamo lo stato per includere i risultati, lo stato di caricamento e gli errori
interface AnalysisState extends AnalysisInputState {
  analysisResults: AnalysisApiResponse | null;
  isLoading: boolean;
  error: string | null;
}

// Helper per formattare le date
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Valori iniziali dello stato
const initialState: AnalysisState = {
  tickers: ['AAPL', 'MSFT', 'GOOGL'],
  startDate: formatDate(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  ), // Un mese fa
  endDate: formatDate(new Date()), // Oggi
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

  useEffect(() => {
    const now = new Date().toISOString();
    console.log(`[AnalysisProvider][DEBUG][${now}] MOUNT`);
    return () => {
      const now = new Date().toISOString();
      console.log(`[AnalysisProvider][DEBUG][${now}] UNMOUNT`);
    };
  }, []);

  const setTickers = (tickers: string[]) => {
    setAnalysisState(prev => ({ ...prev, tickers }));
  };

  const setStartDate = (date: Date | undefined) => {
    setAnalysisState(prev => ({
      ...prev,
      startDate: date ? formatDate(date) : initialState.startDate,
    }));
  };

  const setEndDate = (date: Date | undefined) => {
    setAnalysisState(prev => ({
      ...prev,
      endDate: date ? formatDate(date) : initialState.endDate,
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

    // Validazione base
    if (!tickers?.length) {
      setAnalysisState(prev => ({
        ...prev,
        error: 'Seleziona almeno un ticker',
        isLoading: false,
      }));
      return;
    }

    // Validazione date
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const currentStartDate = startDate || formatDate(lastMonth);
    const currentEndDate = endDate || formatDate(today);

    if (!startDate || !endDate) {
      setAnalysisState(prev => ({
        ...prev,
        startDate: currentStartDate,
        endDate: currentEndDate,
        error: 'Date mancanti, impostate automaticamente',
        isLoading: false,
      }));
      return;
    }

    const start = new Date(currentStartDate);
    const end = new Date(currentEndDate);
    today.setHours(23, 59, 59, 999); // Fine della giornata corrente

    if (end > today) {
      const todayStr = formatDate(today);
      setAnalysisState(prev => ({
        ...prev,
        endDate: todayStr,
        error: 'La data di fine è stata impostata a oggi',
        isLoading: false,
      }));
      return;
    }

    if (start > end) {
      const newStartDate = new Date(end);
      newStartDate.setMonth(newStartDate.getMonth() - 1);
      const startStr = formatDate(newStartDate);

      setAnalysisState(prev => ({
        ...prev,
        startDate: startStr,
        error: 'La data di inizio è stata corretta',
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
      console.log('🚀 Avvio analisi con parametri:', {
        tickers,
        startDate: currentStartDate,
        endDate: currentEndDate,
        frequency,
      });

      const results = await fetchAnalysisData({
        tickers,
        startDate: currentStartDate,
        endDate: currentEndDate,
        frequency,
      });

      // Validazione risultati prima di salvarli
      if (!results || typeof results !== 'object') {
        throw new Error('Formato risposta non valido dal backend');
      }

      const validatedResults = {
        ...results,
        performanceMetrics: Array.isArray(results.performanceMetrics)
          ? results.performanceMetrics.map(metric => ({
              label: metric.label || 'Metrica',
              value: metric.value || '0%',
            }))
          : [],
        volatility:
          results.volatility && typeof results.volatility === 'object'
            ? {
                annualizedVolatility:
                  Number(results.volatility.annualizedVolatility) || 0,
                sharpeRatio: Number(results.volatility.sharpeRatio) || 0,
              }
            : null,
        correlation:
          results.correlation && typeof results.correlation === 'object'
            ? {
                correlationMatrix: results.correlation.correlationMatrix || {
                  symbols: [],
                  matrix: [],
                },
                diversificationIndex:
                  Number(results.correlation.diversificationIndex) || 0,
                averageCorrelation:
                  Number(results.correlation.averageCorrelation) || 0,
              }
            : null,
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
      console.error("❌ Errore durante l'analisi:", errorMessage);

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
