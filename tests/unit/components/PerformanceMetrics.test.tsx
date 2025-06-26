import { PerformanceMetrics } from '@/components/charts/PerformanceMetrics';
import { AnalysisContext } from '@/context/AnalysisContext';
import { toast } from '@/hooks/use-toast';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock del toast
jest.mock('@/hooks/use-toast', () => ({
    toast: jest.fn(),
}));

// Mock dei componenti UI
jest.mock('@/components/ui/card', () => ({
    Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="card" className={className}>{children}</div>
    ),
    CardContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="card-content">{children}</div>
    ),
    CardHeader: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="card-header">{children}</div>
    ),
    CardTitle: ({ children }: { children: React.ReactNode }) => (
        <h3 data-testid="card-title">{children}</h3>
    ),
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, variant, size, className }: any) => (
        <button
            data-testid="button"
            onClick={onClick}
            data-variant={variant}
            data-size={size}
            className={className}
        >
            {children}
        </button>
    ),
}));

jest.mock('@/components/ui/badge', () => ({
    Badge: ({ children, variant, className }: any) => (
        <span data-testid="badge" data-variant={variant} className={className}>
            {children}
        </span>
    ),
}));

describe('PerformanceMetrics', () => {
    const mockToast = toast as jest.MockedFunction<typeof toast>;

    const mockAnalysisResults = {
        performanceMetrics: [
            {
                label: 'Rendimento Totale',
                value: '15.25%',
                description: 'Rendimento complessivo del periodo'
            },
            {
                label: 'Rendimento Annuo',
                value: '12.50%',
                description: 'Rendimento annualizzato'
            },
            {
                label: 'Volatilità',
                value: '8.75%',
                description: 'Deviazione standard dei rendimenti'
            },
            {
                label: 'Sharpe Ratio',
                value: '1.42',
                description: 'Rapporto rischio-rendimento'
            }
        ],
        volatility: {
            annualizedVolatility: 8.75,
            sharpeRatio: 1.42
        },
        correlation: {
            correlationMatrix: {
                symbols: ['AAPL', 'GOOGL'],
                matrix: [[1, 0.6], [0.6, 1]]
            },
            diversificationIndex: 0.4,
            averageCorrelation: 0.6
        }
    };

    const mockContextValue = {
        analysisResults: mockAnalysisResults,
        isAnalysisRunning: false,
        startAnalysis: jest.fn(),
        clearResults: jest.fn(),
        error: null,
        lastAnalysisDate: new Date('2024-01-15T10:00:00Z')
    };

    const renderWithContext = (contextValue = mockContextValue) => {
        return render(
            <AnalysisContext.Provider value={contextValue}>
                <PerformanceMetrics />
            </AnalysisContext.Provider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering con dati reali', () => {
        it('should render all performance metrics with real data', () => {
            renderWithContext();

            // Verifica che tutti i metrici siano renderizzati
            expect(screen.getByText('Rendimento Totale')).toBeInTheDocument();
            expect(screen.getByText('15.25%')).toBeInTheDocument();
            expect(screen.getByText('Rendimento Annuo')).toBeInTheDocument();
            expect(screen.getByText('12.50%')).toBeInTheDocument();
            expect(screen.getByText('Volatilità')).toBeInTheDocument();
            expect(screen.getByText('8.75%')).toBeInTheDocument();
            expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
            expect(screen.getByText('1.42')).toBeInTheDocument();
        });

        it('should render card structure correctly', () => {
            renderWithContext();

            expect(screen.getByTestId('card')).toBeInTheDocument();
            expect(screen.getByTestId('card-header')).toBeInTheDocument();
            expect(screen.getByTestId('card-title')).toHaveTextContent('Metriche di Performance');
            expect(screen.getByTestId('card-content')).toBeInTheDocument();
        });

        it('should render theory button', () => {
            renderWithContext();

            const theoryButton = screen.getByRole('button', { name: /teoria/i });
            expect(theoryButton).toBeInTheDocument();
        });
    });

    describe('Rendering con dati vuoti', () => {
        it('should show no data message when analysisResults is null', () => {
            const contextWithNoData = {
                ...mockContextValue,
                analysisResults: null
            };

            renderWithContext(contextWithNoData);

            expect(screen.getByText('Avvia un\'analisi per vedere le metriche di performance')).toBeInTheDocument();
        });

        it('should show no data message when performanceMetrics is empty', () => {
            const contextWithEmptyMetrics = {
                ...mockContextValue,
                analysisResults: {
                    ...mockAnalysisResults,
                    performanceMetrics: []
                }
            };

            renderWithContext(contextWithEmptyMetrics);

            expect(screen.getByText('Avvia un\'analisi per vedere le metriche di performance')).toBeInTheDocument();
        });

        it('should show no data message when performanceMetrics is undefined', () => {
            const contextWithUndefinedMetrics = {
                ...mockContextValue,
                analysisResults: {
                    ...mockAnalysisResults,
                    performanceMetrics: undefined
                }
            };

            renderWithContext(contextWithUndefinedMetrics);

            expect(screen.getByText('Avvia un\'analisi per vedere le metriche di performance')).toBeInTheDocument();
        });
    });

    describe('Rendering con dati parziali', () => {
        it('should handle metrics with missing values', () => {
            const contextWithPartialData = {
                ...mockContextValue,
                analysisResults: {
                    ...mockAnalysisResults,
                    performanceMetrics: [
                        {
                            label: 'Rendimento Totale',
                            value: undefined,
                            description: 'Rendimento complessivo del periodo'
                        },
                        {
                            label: undefined,
                            value: '12.50%',
                            description: 'Rendimento annualizzato'
                        }
                    ]
                }
            };

            renderWithContext(contextWithPartialData);

            // Dovrebbe mostrare fallback per valori mancanti
            expect(screen.getByText('Rendimento Totale')).toBeInTheDocument();
            expect(screen.getByText('Metrica')).toBeInTheDocument(); // fallback per label mancante
            expect(screen.getByText('12.50%')).toBeInTheDocument();
        });
    });

    describe('Interazioni utente', () => {
        it('should show theory toast when theory button is clicked', async () => {
            const user = userEvent.setup();
            renderWithContext();

            const theoryButton = screen.getByRole('button', { name: /teoria/i });
            await user.click(theoryButton);

            expect(mockToast).toHaveBeenCalledWith({
                title: 'Teoria delle Metriche di Performance',
                description: expect.stringContaining('Le metriche di performance'),
                variant: 'default'
            });
        });

        it('should handle theory button click with proper event handling', async () => {
            const user = userEvent.setup();
            renderWithContext();

            const theoryButton = screen.getByRole('button', { name: /teoria/i });

            // Verifica che il bottone sia cliccabile
            expect(theoryButton).not.toBeDisabled();

            await user.click(theoryButton);

            // Verifica che il toast sia stato chiamato
            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Stati di loading', () => {
        it('should show loading state when analysis is running', () => {
            const contextWithLoading = {
                ...mockContextValue,
                isAnalysisRunning: true
            };

            renderWithContext(contextWithLoading);

            expect(screen.getByText('Analisi in corso...')).toBeInTheDocument();
        });
    });

    describe('Gestione errori', () => {
        it('should show error state when there is an error', () => {
            const contextWithError = {
                ...mockContextValue,
                error: 'Errore durante l\'analisi'
            };

            renderWithContext(contextWithError);

            expect(screen.getByText('Errore durante l\'analisi')).toBeInTheDocument();
        });
    });

    describe('Accessibilità', () => {
        it('should have proper ARIA labels and roles', () => {
            renderWithContext();

            // Verifica che il bottone abbia un ruolo appropriato
            const theoryButton = screen.getByRole('button', { name: /teoria/i });
            expect(theoryButton).toBeInTheDocument();

            // Verifica che i metrici siano accessibili
            expect(screen.getByText('Rendimento Totale')).toBeInTheDocument();
            expect(screen.getByText('15.25%')).toBeInTheDocument();
        });

        it('should be keyboard navigable', async () => {
            const user = userEvent.setup();
            renderWithContext();

            const theoryButton = screen.getByRole('button', { name: /teoria/i });

            // Navigazione da tastiera
            theoryButton.focus();
            expect(theoryButton).toHaveFocus();

            // Attivazione con Enter
            await user.keyboard('{Enter}');
            expect(mockToast).toHaveBeenCalled();
        });
    });

    describe('Edge cases', () => {
        it('should handle very long metric labels', () => {
            const contextWithLongLabels = {
                ...mockContextValue,
                analysisResults: {
                    ...mockAnalysisResults,
                    performanceMetrics: [
                        {
                            label: 'Rendimento Totale Molto Molto Lungo Che Potrebbe Causare Problemi di Layout',
                            value: '15.25%',
                            description: 'Descrizione molto lunga'
                        }
                    ]
                }
            };

            renderWithContext(contextWithLongLabels);

            expect(screen.getByText('Rendimento Totale Molto Molto Lungo Che Potrebbe Causare Problemi di Layout')).toBeInTheDocument();
        });

        it('should handle very large numbers', () => {
            const contextWithLargeNumbers = {
                ...mockContextValue,
                analysisResults: {
                    ...mockAnalysisResults,
                    performanceMetrics: [
                        {
                            label: 'Rendimento',
                            value: '999999.99%',
                            description: 'Numero molto grande'
                        }
                    ]
                }
            };

            renderWithContext(contextWithLargeNumbers);

            expect(screen.getByText('999999.99%')).toBeInTheDocument();
        });

        it('should handle negative values', () => {
            const contextWithNegativeValues = {
                ...mockContextValue,
                analysisResults: {
                    ...mockAnalysisResults,
                    performanceMetrics: [
                        {
                            label: 'Rendimento',
                            value: '-15.25%',
                            description: 'Rendimento negativo'
                        }
                    ]
                }
            };

            renderWithContext(contextWithNegativeValues);

            expect(screen.getByText('-15.25%')).toBeInTheDocument();
        });
    });
}); 