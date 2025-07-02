import { render, waitFor } from '@testing-library/react';
import TradingViewWidget from '../NewTradingViewWidget';

// Improved mocking strategy
const createMockTradingViewWidget = () => {
  const mockWidget = {
    remove: jest.fn(),
    onChartReady: jest.fn(callback => callback()),
  };

  const mockTradingViewWidget = jest.fn().mockReturnValue(mockWidget);

  // Mock global TradingView object
  (global as any).TradingView = {
    widget: mockTradingViewWidget,
  };

  // Mock script loading
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/tv.js';
  script.async = true;
  document.body.appendChild(script);

  return { mockTradingViewWidget, mockWidget, script };
};

const getErrorMessage = (container: HTMLElement) => {
  const errorDiv = container.querySelector(
    '.tradingview-widget-container-error'
  );
  return errorDiv ? errorDiv.textContent : null;
};

describe('TradingViewWidget', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Remove any existing scripts
    const existingScripts = document.querySelectorAll(
      'script[src*="tradingview"]'
    );
    existingScripts.forEach(script => script.remove());
  });

  it('renders widget with valid configuration', async () => {
    const { mockTradingViewWidget } = createMockTradingViewWidget();

    const { container } = render(
      <TradingViewWidget symbol="NASDAQ:AAPL" interval="1" theme="dark" />
    );

    await waitFor(() => {
      expect(mockTradingViewWidget).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'NASDAQ:AAPL',
          interval: '1',
          theme: 'dark',
        })
      );
    });
  });

  it('handles script loading errors', async () => {
    // Simulate script loading error
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn(() => {
      const script = originalCreateElement.call(document, 'script');
      Object.defineProperty(script, 'onerror', {
        get() {
          return this._onerror;
        },
        set(fn) {
          this._onerror = fn;
          // Simulate error immediately
          fn(new Error('Script load error'));
        },
      });
      return script;
    });

    const { container } = render(
      <TradingViewWidget
        symbol="NASDAQ:AAPL"
        interval="1"
        theme="dark"
        debug={true}
      />
    );

    await waitFor(() => {
      const errorMessage = getErrorMessage(container);
      expect(errorMessage).toContain('Errore di rete');
    });

    // Restore original createElement
    document.createElement = originalCreateElement;
  });

  it('handles widget initialization errors', async () => {
    // Simulate widget initialization error
    const { mockTradingViewWidget } = createMockTradingViewWidget();
    mockTradingViewWidget.mockImplementation(() => {
      throw new Error('Widget initialization error');
    });

    const { container } = render(
      <TradingViewWidget
        symbol="NASDAQ:AAPL"
        interval="1"
        theme="dark"
        debug={true}
      />
    );

    await waitFor(() => {
      const errorMessage = getErrorMessage(container);
      expect(errorMessage).toContain('Error initializing TradingView widget');
    });
  });

  it('cleans up resources on unmount', async () => {
    const { mockWidget } = createMockTradingViewWidget();

    const { unmount } = render(
      <TradingViewWidget symbol="NASDAQ:AAPL" interval="1" theme="dark" />
    );

    // Unmount the component
    unmount();

    // Verify that the widget was removed
    expect(mockWidget.remove).toHaveBeenCalled();

    // Verify that the script was removed
    expect(document.querySelector('script[src*="tradingview"]')).toBeNull();
  });

  it('handles network errors during widget loading', async () => {
    // Simulate network error
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as jest.Mock;

    const { container } = render(
      <TradingViewWidget
        symbol="NASDAQ:AAPL"
        interval="1"
        theme="dark"
        debug={true}
      />
    );

    await waitFor(() => {
      const errorMessage = getErrorMessage(container);
      expect(errorMessage).toContain('Errore di rete');
    });

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('validates theme configurations', async () => {
    const testCases = [
      {
        theme: 'invalid' as any,
        expectedError: "Invalid theme: invalid. Must be 'light' or 'dark'",
      },
      {
        theme: 'DARK' as any,
        expectedError: "Invalid theme: DARK. Must be 'light' or 'dark'",
      },
    ];

    for (const { theme, expectedError } of testCases) {
      const { container } = render(
        <TradingViewWidget
          symbol="NASDAQ:AAPL"
          interval="1"
          theme={theme}
          debug={true}
        />
      );

      await waitFor(() => {
        const errorMessage = getErrorMessage(container);
        expect(errorMessage).not.toBeNull();
        expect(errorMessage).toContain(expectedError);
      });
    }
  });
});
