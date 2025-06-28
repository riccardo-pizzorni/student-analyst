import PerformanceMetrics from '@/components/charts/PerformanceMetrics';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock del toast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock del context
const mockUseAnalysis = jest.fn();
jest.mock('@/context/AnalysisContext', () => ({
  useAnalysis: () => mockUseAnalysis(),
}));

// Mock dei componenti UI
jest.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
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
  const mockAnalysisResults = {
    performanceMetrics: [
      {
        label: 'Rendimento Totale',
        value: '15.25%',
        description: 'Rendimento complessivo del periodo',
      },
      {
        label: 'Rendimento Annuo',
        value: '12.50%',
        description: 'Rendimento annualizzato',
      },
    ],
  };

  const defaultMockContext = {
    analysisState: {
      analysisResults: mockAnalysisResults,
      isLoading: false,
      error: null,
    },
    startAnalysis: jest.fn(),
    setTickers: jest.fn(),
    setStartDate: jest.fn(),
    setEndDate: jest.fn(),
    setFrequency: jest.fn(),
  };

  const renderWithContext = (contextValue = defaultMockContext) => {
    mockUseAnalysis.mockReturnValue(contextValue);
    return render(<PerformanceMetrics />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAnalysis.mockReturnValue(defaultMockContext);
  });

  it('should render performance metrics with data', () => {
    renderWithContext();
    expect(screen.getByText('Rendimento Totale')).toBeInTheDocument();
    expect(screen.getByText('15.25%')).toBeInTheDocument();
  });

  it('should show no data message when no results', () => {
    const contextWithNoData = {
      ...defaultMockContext,
      analysisState: {
        ...defaultMockContext.analysisState,
        analysisResults: null,
      },
    };
    renderWithContext(contextWithNoData);
    expect(
      screen.getByText(
        "Avvia un'analisi per calcolare le metriche di performance."
      )
    ).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const contextWithLoading = {
      ...defaultMockContext,
      analysisState: {
        ...defaultMockContext.analysisState,
        isLoading: true,
      },
    };
    renderWithContext(contextWithLoading);
    expect(screen.getByText('Calcolo metriche...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const contextWithError = {
      ...defaultMockContext,
      analysisState: {
        ...defaultMockContext.analysisState,
        error: "Errore durante l'analisi",
      },
    };
    renderWithContext(contextWithError);
    expect(screen.getByText("Errore durante l'analisi")).toBeInTheDocument();
  });

  it('should handle theory button click', async () => {
    const user = userEvent.setup();
    renderWithContext();

    const theoryButton = screen.getByRole('button', { name: /teoria/i });
    await user.click(theoryButton);

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Teoria delle Metriche di Performance',
      description: expect.stringContaining('Le metriche di performance'),
    });
  });
});
