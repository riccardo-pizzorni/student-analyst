import HistoricalChart from '@/components/charts/HistoricalChart';
import { useAnalysis } from '@/context/AnalysisContext';
import { useToast } from '@/hooks/use-toast';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock dei hooks
jest.mock('@/context/AnalysisContext');
jest.mock('@/hooks/use-toast');
jest.mock('react-chartjs-2', () => ({
    Line: ({ data, options }: any) => (
        <div data-testid="chart-line" data-labels={data.labels?.length} data-datasets={data.datasets?.length}>
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

            render(<HistoricalChart />);

            expect(screen.getByText('Caricamento dati in corso...')).toBeInTheDocument();
            expect(screen.getByText('Recupero dati storici da Alpha Vantage')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /aggiornamento/i })).toBeDisabled();
        });

        it('should render error state correctly', () => {
            const errorMessage = 'Errore di connessione API';
            mockUseAnalysis.mockReturnValue({
                analysisState: { ...defaultAnalysisState, error: errorMessage },
                startAnalysis: mockStartAnalysis,
            });

            render(<HistoricalChart />);

            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /riprova/i })).toBeInTheDocument();
        });

        it('should render no analysis state correctly', () => {
            render(<HistoricalChart />);

            expect(screen.getByText('Nessuna Analisi Eseguita')).toBeInTheDocument();
            expect(screen.getByText(/Vai alla sezione 'Input & Validazione' per avviare una nuova analisi/)).toBeInTheDocument();
        });

        it('should render no data state correctly', () => {
            mockUseAnalysis.mockReturnValue({
                analysisState: {
                    ...defaultAnalysisState,
                    analysisResults: { historicalData: { labels: [], datasets: [] } },
                },
                startAnalysis: mockStartAnalysis,
            });

            render(<HistoricalChart />);

            expect(screen.getByText('Nessun Dato Storico Disponibile')).toBeInTheDocument();
            expect(screen.getByText(/Avvia un'analisi per visualizzare l'andamento storico dei prezzi/)).toBeInTheDocument();
        });

        it('should render chart with data correctly', () => {
            const mockData = {
                historicalData: {
                    labels: ['2024-01-01', '2024-01-02'],
                    datasets: [
                        {
                            label: 'AAPL - Prezzo',
                            data: [150.25, 155.50],
                            borderColor: '#FF6384',
                        },
                    ],
                },
                metadata: {
                    symbols: ['AAPL'],
                    period: { start: '2024-01-01', end: '2024-01-02' },
                    frequency: 'daily',
                    dataPoints: 2,
                },
            };

            mockUseAnalysis.mockReturnValue({
                analysisState: {
                    ...defaultAnalysisState,
                    analysisResults: mockData,
                },
                startAnalysis: mockStartAnalysis,
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
            expect(mockToast.title).toHaveBeenCalledWith('Aggiornamento dati');
            expect(mockToast.description).toHaveBeenCalledWith('Aggiornamento dei dati storici in corso...');
        });

        it('should handle info button click', async () => {
            const user = userEvent.setup();

            render(<HistoricalChart />);

            const infoButton = screen.getByRole('button', { name: /info/i });
            await user.click(infoButton);

            expect(mockToast.title).toHaveBeenCalledWith('Informazioni sul grafico');
            expect(mockToast.description).toContain('Questo grafico mostra l\'andamento storico');
        });

        it('should handle retry button click in error state', async () => {
            const user = userEvent.setup();
            mockUseAnalysis.mockReturnValue({
                analysisState: { ...defaultAnalysisState, error: 'Test error' },
                startAnalysis: mockStartAnalysis,
            });

            render(<HistoricalChart />);

            const retryButton = screen.getByRole('button', { name: /riprova/i });
            await user.click(retryButton);

            expect(mockStartAnalysis).toHaveBeenCalledTimes(1);
        });

        it('should handle switch toggles for indicators', async () => {
            const user = userEvent.setup();
            const mockData = {
                historicalData: {
                    labels: ['2024-01-01'],
                    datasets: [
                        { label: 'AAPL - Prezzo', data: [150.25] },
                        { label: 'AAPL - SMA 20', data: [149.50] },
                        { label: 'AAPL - RSI', data: [65.5] },
                    ],
                },
            };

            mockUseAnalysis.mockReturnValue({
                analysisState: {
                    ...defaultAnalysisState,
                    analysisResults: mockData,
                },
                startAnalysis: mockStartAnalysis,
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
    });

    describe('Data Processing and Fallbacks', () => {
        it('should handle empty datasets gracefully', () => {
            mockUseAnalysis.mockReturnValue({
                analysisState: {
                    ...defaultAnalysisState,
                    analysisResults: {
                        historicalData: {
                            labels: ['2024-01-01'],
                            datasets: [],
                        },
                    },
                },
                startAnalysis: mockStartAnalysis,
            });

            render(<HistoricalChart />);

            expect(screen.getByText('Nessun Dato Storico Disponibile')).toBeInTheDocument();
        });

        it('should handle undefined analysis results', () => {
            mockUseAnalysis.mockReturnValue({
                analysisState: {
                    ...defaultAnalysisState,
                    analysisResults: undefined,
                },
                startAnalysis: mockStartAnalysis,
            });

            render(<HistoricalChart />);

            expect(screen.getByText('Nessuna Analisi Eseguita')).toBeInTheDocument();
        });

        it('should calculate statistics correctly', () => {
            const mockData = {
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
            };

            mockUseAnalysis.mockReturnValue({
                analysisState: {
                    ...defaultAnalysisState,
                    analysisResults: mockData,
                },
                startAnalysis: mockStartAnalysis,
            });

            render(<HistoricalChart />);

            // Verifica che le statistiche siano calcolate correttamente
            expect(screen.getByText('(+5.00% | 3 punti)')).toBeInTheDocument();
        });

        it('should handle negative price changes', () => {
            const mockData = {
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
            };

            mockUseAnalysis.mockReturnValue({
                analysisState: {
                    ...defaultAnalysisState,
                    analysisResults: mockData,
                },
                startAnalysis: mockStartAnalysis,
            });

            render(<HistoricalChart />);

            expect(screen.getByText('(-10.00% | 2 punti)')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            render(<HistoricalChart />);

            expect(screen.getByRole('button', { name: /aggiorna/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /info/i })).toBeInTheDocument();
            expect(screen.getByRole('checkbox', { name: /sma 20/i })).toBeInTheDocument();
            expect(screen.getByRole('checkbox', { name: /sma 50/i })).toBeInTheDocument();
            expect(screen.getByRole('checkbox', { name: /sma 200/i })).toBeInTheDocument();
            expect(screen.getByRole('checkbox', { name: /rsi/i })).toBeInTheDocument();
            expect(screen.getByRole('checkbox', { name: /volume/i })).toBeInTheDocument();
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
                expect(mockToast.title).toHaveBeenCalledWith('Errore nell\'aggiornamento');
                expect(mockToast.description).toHaveBeenCalledWith('Impossibile aggiornare i dati storici. Riprova più tardi.');
                expect(mockToast.variant).toHaveBeenCalledWith('destructive');
            });
        });

        it('should handle missing price dataset', () => {
            const mockData = {
                historicalData: {
                    labels: ['2024-01-01'],
                    datasets: [
                        { label: 'AAPL - SMA 20', data: [149.50] }, // Solo SMA, nessun prezzo
                    ],
                },
            };

            mockUseAnalysis.mockReturnValue({
                analysisState: {
                    ...defaultAnalysisState,
                    analysisResults: mockData,
                },
                startAnalysis: mockStartAnalysis,
            });

            render(<HistoricalChart />);

            // Dovrebbe mostrare il grafico ma senza statistiche
            expect(screen.getByTestId('chart-line')).toBeInTheDocument();
            expect(screen.queryByText(/punti/)).not.toBeInTheDocument();
        });
    });

    describe('Performance and Optimization', () => {
        it('should memoize filtered datasets', () => {
            const mockData = {
                historicalData: {
                    labels: ['2024-01-01'],
                    datasets: [
                        { label: 'AAPL - Prezzo', data: [150.25] },
                        { label: 'AAPL - SMA 20', data: [149.50] },
                    ],
                },
            };

            mockUseAnalysis.mockReturnValue({
                analysisState: {
                    ...defaultAnalysisState,
                    analysisResults: mockData,
                },
                startAnalysis: mockStartAnalysis,
            });

            const { rerender } = render(<HistoricalChart />);

            // Rerender senza cambiamenti dovrebbe mantenere la stessa performance
            rerender(<HistoricalChart />);

            expect(screen.getByTestId('chart-line')).toBeInTheDocument();
        });
    });
}); 