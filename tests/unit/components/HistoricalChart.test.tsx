import HistoricalChart from '@/components/charts/HistoricalChart';
import { useAnalysis } from '@/context/AnalysisContext';
import { useToast } from '@/hooks/use-toast';
import { AnalysisApiResponse } from '@/services/analysisAPI';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock dei hooks
jest.mock('@/context/AnalysisContext');
jest.mock('@/hooks/use-toast');
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div
      data-testid="chart-line"
      data-labels={data.labels?.length}
      data-datasets={data.datasets?.length}
    >
      Chart Component
    </div>
  ),
}));

// Mock di Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
}));

jest.mock('chartjs-plugin-zoom', () => ({}));

const mockUseAnalysis = useAnalysis as jest.MockedFunction<typeof useAnalysis>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('HistoricalChart', () => {
  const mockToast = {
    toast: jest.fn(),
    dismiss: jest.fn(),
    toasts: [],
  };

  const mockStartAnalysis = jest.fn();

  const defaultAnalysisState = {
    tickers: ['AAPL'],
    startDate: '2024-01-01',
    endDate: '2024-01-02',
    frequency: 'daily' as const,
    analysisResults: null,
    isLoading: false,
    error: null,
  };

  const createMockAnalysisResults = (
    overrides: Partial<AnalysisApiResponse> = {}
  ): AnalysisApiResponse => ({
    historicalData: {
      labels: ['2024-01-01', '2024-01-02'],
      datasets: [
        {
          label: 'AAPL - Prezzo',
          data: [150.25, 155.5],
          borderColor: '#FF6384',
        },
      ],
    },
    performanceMetrics: [],
    volatility: null,
    correlation: null,
    metadata: {
      analysisDate: '2024-01-02T12:00:00Z',
      symbols: ['AAPL'],
      period: { start: '2024-01-01', end: '2024-01-02' },
      frequency: 'daily',
      dataPoints: 2,
      processingTime: 0,
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue(mockToast);
    mockUseAnalysis.mockReturnValue({
      analysisState: defaultAnalysisState,
      startAnalysis: mockStartAnalysis,
      setAnalysisState: jest.fn(),
      setTickers: jest.fn(),
      setStartDate: jest.fn(),
      setEndDate: jest.fn(),
      setFrequency: jest.fn(),
    });
  });

  describe('Rendering States', () => {
    it('should render loading state correctly', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: { ...defaultAnalysisState, isLoading: true },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      expect(
        screen.getByText('Caricamento dati in corso...')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Recupero dati storici da Yahoo Finance')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /aggiornamento/i })
      ).toBeDisabled();
    });

    it('should render error state correctly', () => {
      const errorMessage = 'Errore di connessione API';
      mockUseAnalysis.mockReturnValue({
        analysisState: { ...defaultAnalysisState, error: errorMessage },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /riprova/i })
      ).toBeInTheDocument();
    });

    it('should render no analysis state correctly', () => {
      render(<HistoricalChart />);

      expect(screen.getByText('Nessuna Analisi Eseguita')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Vai alla sezione 'Input & Validazione' per avviare una nuova analisi/
        )
      ).toBeInTheDocument();
    });

    it('should render no data state correctly', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: createMockAnalysisResults({
            historicalData: { labels: [], datasets: [] },
          }),
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      expect(
        screen.getByText('Nessun Dato Storico Disponibile')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Avvia un'analisi per visualizzare l'andamento storico dei prezzi/
        )
      ).toBeInTheDocument();
    });

    it('should render chart with data correctly', () => {
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01', '2024-01-02'],
          datasets: [
            {
              label: 'AAPL - Prezzo',
              data: [150.25, 155.5],
              borderColor: '#FF6384',
            },
          ],
        },
        metadata: {
          analysisDate: '2024-01-02T12:00:00Z',
          symbols: ['AAPL'],
          period: { start: '2024-01-01', end: '2024-01-02' },
          frequency: 'daily',
          dataPoints: 2,
          processingTime: 0,
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      expect(screen.getByTestId('chart-line')).toBeInTheDocument();
      expect(screen.getByText('(+3.50% | 2 punti)')).toBeInTheDocument();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle refresh button click', async () => {
      const user = userEvent.setup();
      mockStartAnalysis.mockResolvedValue(undefined);

      render(<HistoricalChart />);

      const refreshButton = screen.getByRole('button', { name: /aggiorna/i });
      await user.click(refreshButton);

      expect(mockStartAnalysis).toHaveBeenCalledTimes(1);
      expect(mockToast.toast).toHaveBeenCalled();
    });

    it('should handle info button click', async () => {
      const user = userEvent.setup();

      render(<HistoricalChart />);

      const infoButton = screen.getByRole('button', { name: /info/i });
      await user.click(infoButton);

      expect(mockToast.toast).toHaveBeenCalled();
    });

    it('should handle retry button click in error state', async () => {
      const user = userEvent.setup();
      mockUseAnalysis.mockReturnValue({
        analysisState: { ...defaultAnalysisState, error: 'Test error' },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      const retryButton = screen.getByRole('button', { name: /riprova/i });
      await user.click(retryButton);

      expect(mockStartAnalysis).toHaveBeenCalledTimes(1);
    });

    it('should handle switch toggles for indicators', async () => {
      const user = userEvent.setup();
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01'],
          datasets: [
            { label: 'AAPL - Prezzo', data: [150.25], borderColor: '#FF6384' },
            { label: 'AAPL - SMA 20', data: [149.5], borderColor: '#36A2EB' },
            { label: 'AAPL - RSI', data: [65.5], borderColor: '#FFCE56' },
          ],
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      // Test SMA 20 toggle
      const sma20Switch = screen.getByRole('checkbox', { name: /sma 20/i });
      await user.click(sma20Switch);
      expect(sma20Switch).not.toBeChecked();

      // Test RSI toggle
      const rsiSwitch = screen.getByRole('checkbox', { name: /rsi/i });
      await user.click(rsiSwitch);
      expect(rsiSwitch).toBeChecked();
    });

    it('should handle RSI smoothing toggle', async () => {
      const user = userEvent.setup();
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01', '2024-01-02', '2024-01-03'],
          datasets: [
            {
              label: 'AAPL - Prezzo',
              data: [150.25, 155.5, 160.75],
              borderColor: '#FF6384',
            },
            { label: 'AAPL - RSI', data: [45, 55, 65], borderColor: '#FFCE56' },
          ],
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      // Attiva RSI
      const rsiSwitch = screen.getByRole('checkbox', { name: /rsi/i });
      await user.click(rsiSwitch);

      // Verifica che appaia il controllo smoothing
      const smoothingSwitch = screen.getByRole('checkbox', {
        name: /smoothing rsi/i,
      });
      expect(smoothingSwitch).toBeInTheDocument();

      // Attiva smoothing
      await user.click(smoothingSwitch);
      expect(smoothingSwitch).toBeChecked();

      // Verifica che il grafico sia ancora presente
      expect(screen.getByTestId('chart-line')).toBeInTheDocument();
    });
  });

  describe('Data Processing and Fallbacks', () => {
    it('should handle empty datasets gracefully', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: createMockAnalysisResults({
            historicalData: {
              labels: ['2024-01-01'],
              datasets: [],
            },
          }),
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      expect(
        screen.getByText('Nessun Dato Storico Disponibile')
      ).toBeInTheDocument();
    });

    it('should handle undefined analysis results', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: undefined,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      expect(screen.getByText('Nessuna Analisi Eseguita')).toBeInTheDocument();
    });

    it('should calculate statistics correctly', () => {
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01', '2024-01-02', '2024-01-03'],
          datasets: [
            {
              label: 'AAPL - Prezzo',
              data: [100, 110, 105],
              borderColor: '#FF6384',
            },
          ],
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      // Verifica che le statistiche siano calcolate correttamente
      expect(screen.getByText('(+5.00% | 3 punti)')).toBeInTheDocument();
    });

    it('should handle negative price changes', () => {
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01', '2024-01-02'],
          datasets: [
            {
              label: 'AAPL - Prezzo',
              data: [100, 90],
              borderColor: '#FF6384',
            },
          ],
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      expect(screen.getByText('(-10.00% | 2 punti)')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<HistoricalChart />);

      expect(
        screen.getByRole('button', { name: /aggiorna/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /info/i })).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /sma 20/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /sma 50/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /sma 200/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /rsi/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /volume/i })
      ).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(<HistoricalChart />);

      // Test tab navigation
      await user.tab();
      expect(screen.getByRole('button', { name: /aggiorna/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /info/i })).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle startAnalysis errors', async () => {
      const user = userEvent.setup();
      const error = new Error('API Error');
      mockStartAnalysis.mockRejectedValue(error);

      render(<HistoricalChart />);

      const refreshButton = screen.getByRole('button', { name: /aggiorna/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalled();
      });
    });

    it('should handle missing price dataset', () => {
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01'],
          datasets: [
            { label: 'AAPL - SMA 20', data: [149.5], borderColor: '#36A2EB' }, // Solo SMA, nessun prezzo
          ],
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      // Dovrebbe mostrare il grafico ma senza statistiche
      expect(screen.getByTestId('chart-line')).toBeInTheDocument();
      expect(screen.queryByText(/punti/)).not.toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should memoize filtered datasets', () => {
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01'],
          datasets: [
            { label: 'AAPL - Prezzo', data: [150.25], borderColor: '#FF6384' },
            { label: 'AAPL - SMA 20', data: [149.5], borderColor: '#36A2EB' },
          ],
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      const { rerender } = render(<HistoricalChart />);

      // Rerender senza cambiamenti dovrebbe mantenere la stessa performance
      rerender(<HistoricalChart />);

      expect(screen.getByTestId('chart-line')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Data Gaps', () => {
    it('should show warning for incomplete series (META example)', () => {
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: [
            '2010-01-01',
            '2010-01-02',
            '2013-01-01',
            '2013-01-02',
            '2024-01-01',
          ],
          datasets: [
            {
              label: 'AAPL - Prezzo',
              data: [25.0, 25.5, 50.0, 51.0, 150.0],
              borderColor: '#FF6384',
            },
            {
              label: 'META - Prezzo',
              data: [null, null, 25.0, 26.0, null], // META si ferma al 2013
              borderColor: '#36A2EB',
            },
          ],
        },
        metadata: {
          analysisDate: '2024-01-01T12:00:00Z',
          symbols: ['AAPL', 'META'],
          period: { start: '2010-01-01', end: '2024-01-01' },
          frequency: 'daily',
          dataPoints: 5,
          processingTime: 0,
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      expect(
        screen.getByText(
          /Attenzione: dati disponibili solo fino a una certa data per META/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Verifica la copertura storica del titolo/)
      ).toBeInTheDocument();
    });

    it('should show warning for missing tickers', () => {
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01', '2024-01-02'],
          datasets: [
            {
              label: 'AAPL - Prezzo',
              data: [150.25, 155.5],
              borderColor: '#FF6384',
            },
          ],
        },
        metadata: {
          analysisDate: '2024-01-02T12:00:00Z',
          symbols: ['AAPL', 'INVALID', 'MISSING'], // Ticker richiesti ma non trovati
          period: { start: '2024-01-01', end: '2024-01-02' },
          frequency: 'daily',
          dataPoints: 2,
          processingTime: 0,
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      expect(
        screen.getByText(/Ticker INVALID, MISSING non ha dati disponibili/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Verifica il simbolo o prova un periodo diverso/)
      ).toBeInTheDocument();
    });

    it('should show warning for significant temporal gaps (IPO example)', () => {
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: [
            '2020-01-01',
            '2020-01-02',
            '2020-12-01',
            '2020-12-02',
            '2021-01-01',
          ],
          datasets: [
            {
              label: 'ABNB - Prezzo', // IPO recente con molti buchi
              data: [null, null, 150.0, 155.0, 160.0], // 80% null = buchi significativi
              borderColor: '#FFCE56',
            },
          ],
        },
        metadata: {
          analysisDate: '2021-01-01T12:00:00Z',
          symbols: ['ABNB'],
          period: { start: '2020-01-01', end: '2021-01-01' },
          frequency: 'daily',
          dataPoints: 5,
          processingTime: 0,
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      expect(
        screen.getByText(/Rilevati buchi temporali significativi nei dati/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/IPO recente, merge aziendale o cambio di simbolo/)
      ).toBeInTheDocument();
    });

    it('should handle null values in tooltip gracefully', () => {
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01', '2024-01-02'],
          datasets: [
            {
              label: 'AAPL - Prezzo',
              data: [150.25, null], // Valore null per test tooltip
              borderColor: '#FF6384',
            },
          ],
        },
        metadata: {
          analysisDate: '2024-01-02T12:00:00Z',
          symbols: ['AAPL'],
          period: { start: '2024-01-01', end: '2024-01-02' },
          frequency: 'daily',
          dataPoints: 2,
          processingTime: 0,
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      // Verifica che il grafico si renderizzi senza crash
      expect(screen.getByTestId('chart-line')).toBeInTheDocument();
      expect(screen.getByText('(+0.00% | 1 punti)')).toBeInTheDocument(); // Solo 1 punto valido
    });

    it('should handle multiple warning states simultaneously', () => {
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2020-01-01', '2020-01-02', '2023-01-01', '2023-01-02'],
          datasets: [
            {
              label: 'AAPL - Prezzo',
              data: [100.0, 101.0, 150.0, 151.0],
              borderColor: '#FF6384',
            },
            {
              label: 'META - Prezzo',
              data: [null, null, 200.0, null], // Incompleta
              borderColor: '#36A2EB',
            },
            {
              label: 'ABNB - Prezzo',
              data: [null, null, null, 120.0], // Molti buchi
              borderColor: '#FFCE56',
            },
          ],
        },
        metadata: {
          analysisDate: '2023-01-02T12:00:00Z',
          symbols: ['AAPL', 'META', 'ABNB', 'MISSING'], // Ticker mancante
          period: { start: '2020-01-01', end: '2023-01-02' },
          frequency: 'daily',
          dataPoints: 4,
          processingTime: 0,
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      // Verifica che tutti i warning siano presenti
      expect(screen.getByText(/META/)).toBeInTheDocument(); // Serie incompleta
      expect(screen.getByText(/MISSING/)).toBeInTheDocument(); // Ticker mancante
      expect(
        screen.getByText(/buchi temporali significativi/)
      ).toBeInTheDocument(); // ABNB con buchi
    });
  });

  describe('Performance and Large Datasets', () => {
    it('should handle large datasets without performance issues', () => {
      // Simula dataset grande (1000 punti)
      const labels = Array.from(
        { length: 1000 },
        (_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`
      );
      const data = Array.from(
        { length: 1000 },
        (_, i) => 100 + Math.sin(i * 0.1) * 10
      );

      const mockData = createMockAnalysisResults({
        historicalData: {
          labels,
          datasets: [
            {
              label: 'AAPL - Prezzo',
              data,
              borderColor: '#FF6384',
            },
            {
              label: 'MSFT - Prezzo',
              data: data.map(v => v * 1.1),
              borderColor: '#36A2EB',
            },
            {
              label: 'GOOGL - Prezzo',
              data: data.map(v => v * 1.2),
              borderColor: '#FFCE56',
            },
          ],
        },
        metadata: {
          analysisDate: '2024-12-31T12:00:00Z',
          symbols: ['AAPL', 'MSFT', 'GOOGL'],
          period: { start: '2024-01-01', end: '2024-12-31' },
          frequency: 'daily',
          dataPoints: 1000,
          processingTime: 0,
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      const startTime = performance.now();
      render(<HistoricalChart />);
      const endTime = performance.now();

      // Verifica che il rendering sia veloce (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(screen.getByTestId('chart-line')).toBeInTheDocument();
      expect(screen.getByText(/1000 punti/)).toBeInTheDocument();
    });

    it('should handle many tickers without UI lag', () => {
      // Simula molti ticker (10 ticker)
      const tickers = [
        'AAPL',
        'MSFT',
        'GOOGL',
        'AMZN',
        'TSLA',
        'META',
        'NVDA',
        'NFLX',
        'AMD',
        'INTC',
      ];
      const datasets = tickers.map((ticker, index) => ({
        label: `${ticker} - Prezzo`,
        data: [100 + index * 10, 105 + index * 10, 110 + index * 10],
        borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      }));

      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01', '2024-01-02', '2024-01-03'],
          datasets,
        },
        metadata: {
          analysisDate: '2024-01-03T12:00:00Z',
          symbols: tickers,
          period: { start: '2024-01-01', end: '2024-01-03' },
          frequency: 'daily',
          dataPoints: 3,
          processingTime: 0,
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      const startTime = performance.now();
      render(<HistoricalChart />);
      const endTime = performance.now();

      // Verifica che il rendering sia veloce anche con molti ticker
      expect(endTime - startTime).toBeLessThan(50);
      expect(screen.getByTestId('chart-line')).toBeInTheDocument();

      // Verifica che tutti i ticker siano presenti nei metadata
      tickers.forEach(ticker => {
        expect(screen.getByText(ticker)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and Responsive Design', () => {
    it('should have proper aria-labels for all interactive elements', () => {
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01'],
          datasets: [
            { label: 'AAPL - Prezzo', data: [150.25], borderColor: '#FF6384' },
          ],
        },
        metadata: {
          analysisDate: '2024-01-01T12:00:00Z',
          symbols: ['AAPL'],
          period: { start: '2024-01-01', end: '2024-01-01' },
          frequency: 'daily',
          dataPoints: 1,
          processingTime: 0,
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      // Verifica aria-label sui bottoni
      expect(
        screen.getByRole('button', { name: /aggiorna dati storici/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /informazioni sul grafico/i })
      ).toBeInTheDocument();

      // Verifica aria-label sugli switch
      expect(
        screen.getByRole('switch', { name: /mostra\/nascondi sma 20/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: /mostra\/nascondi rsi/i })
      ).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const mockData = createMockAnalysisResults({
        historicalData: {
          labels: ['2024-01-01'],
          datasets: [
            { label: 'AAPL - Prezzo', data: [150.25], borderColor: '#FF6384' },
          ],
        },
        metadata: {
          analysisDate: '2024-01-01T12:00:00Z',
          symbols: ['AAPL'],
          period: { start: '2024-01-01', end: '2024-01-01' },
          frequency: 'daily',
          dataPoints: 1,
          processingTime: 0,
        },
      });

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: mockData,
        },
        startAnalysis: mockStartAnalysis,
        setAnalysisState: jest.fn(),
        setTickers: jest.fn(),
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setFrequency: jest.fn(),
      });

      render(<HistoricalChart />);

      // Navigazione con Tab
      await user.tab();
      expect(
        screen.getByRole('button', { name: /aggiorna dati storici/i })
      ).toHaveFocus();

      await user.tab();
      expect(
        screen.getByRole('button', { name: /informazioni sul grafico/i })
      ).toHaveFocus();

      // Test attivazione con Enter
      await user.keyboard('{Enter}');
      expect(mockToast.toast).toHaveBeenCalled();
    });
  });
});
