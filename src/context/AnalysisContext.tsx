import { createContext, ReactNode, useContext, useState } from 'react';

// 1. Definire i tipi per lo stato e le azioni
interface AnalysisState {
  tickers: string[];
  startDate: Date | undefined;
  endDate: Date | undefined;
  frequency: 'daily' | 'weekly' | 'monthly';
}

interface AnalysisContextType {
  analysisState: AnalysisState;
  setTickers: (tickers: string[]) => void;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
  setFrequency: (frequency: 'daily' | 'weekly' | 'monthly') => void;
  startAnalysis: () => void;
}

// 2. Creare il Contesto
const AnalysisContext = createContext<AnalysisContextType | undefined>(
  undefined
);

// 3. Creare il Provider del Contesto
export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    tickers: ['AAPL', 'MSFT', 'GOOGL'],
    startDate: new Date('2024-05-30'),
    endDate: undefined,
    frequency: 'daily',
  });

  const setTickers = (tickers: string[]) => {
    setAnalysisState(prev => ({ ...prev, tickers }));
  };

  const setStartDate = (date: Date | undefined) => {
    setAnalysisState(prev => ({ ...prev, startDate: date }));
  };

  const setEndDate = (date: Date | undefined) => {
    setAnalysisState(prev => ({ ...prev, endDate: date }));
  };

  const setFrequency = (frequency: 'daily' | 'weekly' | 'monthly') => {
    setAnalysisState(prev => ({ ...prev, frequency }));
  };

  const startAnalysis = () => {
    console.log('🚀 Starting Analysis with the following state:');
    console.log(JSON.stringify(analysisState, null, 2));
    // Qui andrà la logica per chiamare il backend
    alert('Analisi avviata! Controlla la console per i dettagli.');
  };

  const value = {
    analysisState,
    setTickers,
    setStartDate,
    setEndDate,
    setFrequency,
    startAnalysis,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
};

// 4. Creare un Hook per usare il Contesto facilmente
export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};
