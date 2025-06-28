import HistoricalTable from '@/components/charts/HistoricalTable';
import { useAnalysis } from '@/context/AnalysisContext';
import { useToast } from '@/hooks/use-toast';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock dei hooks
jest.mock('@/context/AnalysisContext');
jest.mock('@/hooks/use-toast');

// Mock di react-csv
jest.mock('react-csv', () => ({
  CSVLink: ({ data, filename }: any) => (
    <a
      href="#"
      data-testid="csv-download"
      data-filename={filename}
      data-rows={data?.length}
    >
      Download CSV
    </a>
  ),
}));

const mockUseAnalysis = useAnalysis as jest.MockedFunction<typeof useAnalysis>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('HistoricalTable', () => {
  const mockToast = {
    title: jest.fn(),
    description: jest.fn(),
    variant: jest.fn(),
  };

  const mockStartAnalysis = jest.fn();

  const defaultAnalysisState = {
    isLoading: false,
    error: null,
    analysisResults: null,
  };

  const mockHistoricalData = [
    {
      date: '2024-01-01',
      open: 150.0,
      high: 155.5,
      low: 149.25,
      close: 153.75,
      volume: 1000000,
      symbol: 'AAPL',
    },
    {
      date: '2024-01-02',
      open: 153.75,
      high: 158.0,
      low: 152.5,
      close: 156.25,
      volume: 1200000,
      symbol: 'AAPL',
    },
    {
      date: '2024-01-03',
      open: 156.25,
      high: 159.75,
      low: 154.0,
      close: 157.5,
      volume: 1100000,
      symbol: 'AAPL',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue(mockToast);
    mockUseAnalysis.mockReturnValue({
      analysisState: defaultAnalysisState,
      startAnalysis: mockStartAnalysis,
    });
  });

  describe('Rendering States', () => {
    it('should render loading state correctly', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: { ...defaultAnalysisState, isLoading: true },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(
        screen.getByText('Caricamento dati in corso...')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Recupero dati storici da Alpha Vantage')
      ).toBeInTheDocument();
    });

    it('should render error state correctly', () => {
      const errorMessage = 'Errore di connessione API';
      mockUseAnalysis.mockReturnValue({
        analysisState: { ...defaultAnalysisState, error: errorMessage },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /riprova/i })
      ).toBeInTheDocument();
    });

    it('should render no analysis state correctly', () => {
      render(<HistoricalTable />);

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
          analysisResults: { historicalData: { data: [] } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(
        screen.getByText('Nessun Dato Storico Disponibile')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Avvia un'analisi per visualizzare i dati storici/)
      ).toBeInTheDocument();
    });

    it('should render table with data correctly', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText('$155.50')).toBeInTheDocument();
      expect(screen.getByText('$149.25')).toBeInTheDocument();
      expect(screen.getByText('$153.75')).toBeInTheDocument();
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by date in ascending order', async () => {
      const user = userEvent.setup();
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const dateHeader = screen.getByText('Data');
      await user.click(dateHeader);

      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('2024-01-01');
      expect(rows[2]).toHaveTextContent('2024-01-02');
      expect(rows[3]).toHaveTextContent('2024-01-03');
    });

    it('should sort by date in descending order on second click', async () => {
      const user = userEvent.setup();
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const dateHeader = screen.getByText('Data');
      await user.click(dateHeader); // First click - ascending
      await user.click(dateHeader); // Second click - descending

      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('2024-01-03');
      expect(rows[2]).toHaveTextContent('2024-01-02');
      expect(rows[3]).toHaveTextContent('2024-01-01');
    });

    it('should sort by close price', async () => {
      const user = userEvent.setup();
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const closeHeader = screen.getByText('Chiusura');
      await user.click(closeHeader);

      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('$153.75'); // Lowest close
      expect(rows[2]).toHaveTextContent('$156.25');
      expect(rows[3]).toHaveTextContent('$157.50'); // Highest close
    });

    it('should sort by volume', async () => {
      const user = userEvent.setup();
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const volumeHeader = screen.getByText('Volume');
      await user.click(volumeHeader);

      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('1,000,000'); // Lowest volume
      expect(rows[2]).toHaveTextContent('1,100,000');
      expect(rows[3]).toHaveTextContent('1,200,000'); // Highest volume
    });
  });

  describe('Filtering Functionality', () => {
    it('should filter by symbol', async () => {
      const user = userEvent.setup();
      const multiSymbolData = [
        ...mockHistoricalData,
        {
          date: '2024-01-01',
          open: 2500.0,
          high: 2550.0,
          low: 2490.0,
          close: 2520.0,
          volume: 500000,
          symbol: 'GOOGL',
        },
      ];

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: multiSymbolData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const symbolFilter = screen.getByPlaceholderText('Filtra per simbolo...');
      await user.type(symbolFilter, 'AAPL');

      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.queryByText('GOOGL')).not.toBeInTheDocument();
    });

    it('should filter by date range', async () => {
      const user = userEvent.setup();
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const dateFilter = screen.getByPlaceholderText('Filtra per data...');
      await user.type(dateFilter, '2024-01-02');

      expect(screen.getByText('2024-01-02')).toBeInTheDocument();
      expect(screen.queryByText('2024-01-01')).not.toBeInTheDocument();
      expect(screen.queryByText('2024-01-03')).not.toBeInTheDocument();
    });

    it('should clear filters', async () => {
      const user = userEvent.setup();
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const symbolFilter = screen.getByPlaceholderText('Filtra per simbolo...');
      await user.type(symbolFilter, 'AAPL');

      const clearButton = screen.getByRole('button', {
        name: /pulisci filtri/i,
      });
      await user.click(clearButton);

      expect(symbolFilter).toHaveValue('');
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('2024-01-02')).toBeInTheDocument();
      expect(screen.getByText('2024-01-03')).toBeInTheDocument();
    });
  });

  describe('Pagination Functionality', () => {
    it('should display pagination controls with many rows', () => {
      const manyRowsData = Array.from({ length: 25 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 150.0 + i,
        high: 155.0 + i,
        low: 149.0 + i,
        close: 153.0 + i,
        volume: 1000000 + i * 10000,
        symbol: 'AAPL',
      }));

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: manyRowsData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(screen.getByText('1-10 di 25')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /successiva/i })
      ).toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      const manyRowsData = Array.from({ length: 25 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 150.0 + i,
        high: 155.0 + i,
        low: 149.0 + i,
        close: 153.0 + i,
        volume: 1000000 + i * 10000,
        symbol: 'AAPL',
      }));

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: manyRowsData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const nextButton = screen.getByRole('button', { name: /successiva/i });
      await user.click(nextButton);

      expect(screen.getByText('11-20 di 25')).toBeInTheDocument();
    });

    it('should navigate to previous page', async () => {
      const user = userEvent.setup();
      const manyRowsData = Array.from({ length: 25 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 150.0 + i,
        high: 155.0 + i,
        low: 149.0 + i,
        close: 153.0 + i,
        volume: 1000000 + i * 10000,
        symbol: 'AAPL',
      }));

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: manyRowsData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const nextButton = screen.getByRole('button', { name: /successiva/i });
      await user.click(nextButton);

      const prevButton = screen.getByRole('button', { name: /precedente/i });
      await user.click(prevButton);

      expect(screen.getByText('1-10 di 25')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should render export button', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(screen.getByTestId('csv-download')).toBeInTheDocument();
      expect(screen.getByTestId('csv-download')).toHaveAttribute(
        'data-filename',
        'dati-storici.csv'
      );
    });

    it('should prepare correct CSV data', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const csvLink = screen.getByTestId('csv-download');
      expect(csvLink).toHaveAttribute('data-rows', '3');
    });

    it('should show export success message', async () => {
      const user = userEvent.setup();
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const csvLink = screen.getByTestId('csv-download');
      await user.click(csvLink);

      expect(mockToast.title).toHaveBeenCalledWith('Esportazione completata');
      expect(mockToast.description).toHaveBeenCalledWith(
        'I dati storici sono stati esportati con successo'
      );
    });
  });

  describe('User Interactions', () => {
    it('should handle refresh button click', async () => {
      const user = userEvent.setup();
      mockStartAnalysis.mockResolvedValue(undefined);

      render(<HistoricalTable />);

      const refreshButton = screen.getByRole('button', { name: /aggiorna/i });
      await user.click(refreshButton);

      expect(mockStartAnalysis).toHaveBeenCalledTimes(1);
      expect(mockToast.title).toHaveBeenCalledWith('Aggiornamento dati');
      expect(mockToast.description).toHaveBeenCalledWith(
        'Aggiornamento dei dati storici in corso...'
      );
    });

    it('should handle info button click', async () => {
      const user = userEvent.setup();

      render(<HistoricalTable />);

      const infoButton = screen.getByRole('button', { name: /info/i });
      await user.click(infoButton);

      expect(mockToast.title).toHaveBeenCalledWith(
        'Informazioni sulla tabella'
      );
      expect(mockToast.description).toContain(
        'Questa tabella mostra i dati storici OHLCV'
      );
    });

    it('should handle retry button click in error state', async () => {
      const user = userEvent.setup();
      mockUseAnalysis.mockReturnValue({
        analysisState: { ...defaultAnalysisState, error: 'Test error' },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      const retryButton = screen.getByRole('button', { name: /riprova/i });
      await user.click(retryButton);

      expect(mockStartAnalysis).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Formatting', () => {
    it('should format currency values correctly', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText('$155.50')).toBeInTheDocument();
      expect(screen.getByText('$149.25')).toBeInTheDocument();
      expect(screen.getByText('$153.75')).toBeInTheDocument();
    });

    it('should format volume values correctly', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(screen.getByText('1,000,000')).toBeInTheDocument();
      expect(screen.getByText('1,200,000')).toBeInTheDocument();
    });

    it('should format date values correctly', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('2024-01-02')).toBeInTheDocument();
      expect(screen.getByText('2024-01-03')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /aggiorna/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /info/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /pulisci filtri/i })
      ).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: mockHistoricalData } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

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

      render(<HistoricalTable />);

      const refreshButton = screen.getByRole('button', { name: /aggiorna/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockToast.title).toHaveBeenCalledWith(
          "Errore nell'aggiornamento"
        );
        expect(mockToast.description).toHaveBeenCalledWith(
          'Impossibile aggiornare i dati storici. Riprova più tardi.'
        );
        expect(mockToast.variant).toHaveBeenCalledWith('destructive');
      });
    });

    it('should handle missing data gracefully', () => {
      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: null } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(
        screen.getByText('Nessun Dato Storico Disponibile')
      ).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 150.0 + i * 0.1,
        high: 155.0 + i * 0.1,
        low: 149.0 + i * 0.1,
        close: 153.0 + i * 0.1,
        volume: 1000000 + i * 1000,
        symbol: 'AAPL',
      }));

      mockUseAnalysis.mockReturnValue({
        analysisState: {
          ...defaultAnalysisState,
          analysisResults: { historicalData: { data: largeDataset } },
        },
        startAnalysis: mockStartAnalysis,
      });

      render(<HistoricalTable />);

      expect(screen.getByText('1-10 di 1,000')).toBeInTheDocument();
    });
  });
});
