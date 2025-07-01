import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewTradingViewWidget from '../NewTradingViewWidget';

// Mock del window.TradingView
const mockTradingView = {
  widget: jest.fn(),
};

describe('NewTradingViewWidget', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Reset window.TradingView
    delete (window as any).TradingView;
    // Mock console.error per evitare output nei test
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Cleanup
    jest.restoreAllMocks();
  });

  it('mostra il loader durante il caricamento', () => {
    render(<NewTradingViewWidget />);
    expect(
      screen.getByText('Caricamento TradingView Widget...')
    ).toBeInTheDocument();
  });

  it('gestisce errori di validazione delle props', () => {
    render(
      <NewTradingViewWidget
        symbol="INVALID:SYMBOL"
        interval="INVALID"
        theme={'invalid' as 'light' | 'dark'}
        width="-100"
        height="-100"
        locale="invalid"
      />
    );

    // Verifica che vengano mostrati i messaggi di errore appropriati
    expect(screen.getByText(/Simbolo non valido/)).toBeInTheDocument();
    expect(screen.getByText(/Intervallo non valido/)).toBeInTheDocument();
    expect(screen.getByText(/Tema non valido/)).toBeInTheDocument();
    expect(screen.getByText(/Larghezza non valida/)).toBeInTheDocument();
    expect(screen.getByText(/Altezza non valida/)).toBeInTheDocument();
    expect(screen.getByText(/Locale non valido/)).toBeInTheDocument();
  });

  it('gestisce errori di caricamento dello script', async () => {
    // Simula un errore di caricamento dello script
    const mockOnLoadError = jest.fn();
    render(<NewTradingViewWidget onLoadError={mockOnLoadError} />);

    // Trova lo script e simula l'errore
    const script = document.querySelector('script');
    if (script) {
      const error = new Event('error');
      script.dispatchEvent(error);
    }

    // Verifica che venga mostrato il messaggio di errore
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load TradingView script/)
      ).toBeInTheDocument();
    });

    // Verifica che il callback onLoadError sia stato chiamato
    expect(mockOnLoadError).toHaveBeenCalled();
  });

  it('gestisce timeout di inizializzazione', async () => {
    // Simula un timeout di inizializzazione
    const mockOnLoadError = jest.fn();
    render(
      <NewTradingViewWidget onLoadError={mockOnLoadError} initTimeout={100} />
    );

    // Verifica che dopo il timeout venga mostrato il messaggio di errore
    await waitFor(() => {
      expect(
        screen.getByText(/non si è inizializzato entro/)
      ).toBeInTheDocument();
    });

    // Verifica che il callback onLoadError sia stato chiamato
    expect(mockOnLoadError).toHaveBeenCalled();
  });

  it('gestisce errori di inizializzazione del widget', async () => {
    // Mock di window.TradingView che lancia un errore
    (window as any).TradingView = {
      widget: jest.fn().mockImplementation(() => {
        throw new Error('Widget initialization error');
      }),
    };

    const mockOnLoadError = jest.fn();
    render(<NewTradingViewWidget onLoadError={mockOnLoadError} />);

    // Trova lo script e simula il caricamento
    const script = document.querySelector('script');
    if (script) {
      const loadEvent = new Event('load');
      script.dispatchEvent(loadEvent);
    }

    // Verifica che venga mostrato il messaggio di errore
    await waitFor(() => {
      expect(
        screen.getByText(/Widget initialization error/)
      ).toBeInTheDocument();
    });

    // Verifica che il callback onLoadError sia stato chiamato
    expect(mockOnLoadError).toHaveBeenCalled();
  });

  it('pulisce correttamente le risorse al dismount', () => {
    const { unmount } = render(<NewTradingViewWidget />);

    // Simula l'inizializzazione del widget
    (window as any).TradingView = mockTradingView;
    const mockWidget = { remove: jest.fn() };
    mockTradingView.widget.mockReturnValue(mockWidget);

    // Trova lo script e simula il caricamento
    const script = document.querySelector('script');
    if (script) {
      const loadEvent = new Event('load');
      script.dispatchEvent(loadEvent);
    }

    // Dismonta il componente
    unmount();

    // Verifica che il widget sia stato rimosso
    expect(mockWidget.remove).toHaveBeenCalled();

    // Verifica che lo script sia stato rimosso
    expect(document.querySelector('script')).toBeNull();
  });

  it('gestisce il click sul pulsante di retry', async () => {
    // Mock della funzione location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    // Simula un errore di caricamento
    render(<NewTradingViewWidget />);
    const script = document.querySelector('script');
    if (script) {
      const error = new Event('error');
      script.dispatchEvent(error);
    }

    // Aspetta che il pulsante di retry sia visibile
    await waitFor(() => {
      expect(screen.getByText('Riprova')).toBeInTheDocument();
    });

    // Clicca il pulsante di retry
    userEvent.click(screen.getByText('Riprova'));

    // Verifica che la pagina sia stata ricaricata
    expect(mockReload).toHaveBeenCalled();
  });

  it('applica correttamente le dimensioni responsive', () => {
    const { container } = render(
      <NewTradingViewWidget autosize={true} width="100%" height="100%" />
    );

    const widgetContainer = container.firstChild as HTMLElement;
    expect(widgetContainer).toHaveStyle({
      width: '100%',
      height: '100%',
    });
  });

  it('applica correttamente le dimensioni fisse', () => {
    const { container } = render(
      <NewTradingViewWidget autosize={false} width="800px" height="600px" />
    );

    const widgetContainer = container.firstChild as HTMLElement;
    expect(widgetContainer).toHaveStyle({
      width: '800px',
      height: '600px',
    });
  });

  it('usa correttamente la lingua italiana di default', () => {
    render(<NewTradingViewWidget />);

    // Verifica che il locale di default sia 'it'
    const script = document.querySelector('script');
    expect(script?.src).toContain('locale=it');
  });

  it('supporta il cambio di lingua', () => {
    render(<NewTradingViewWidget locale="en" />);

    // Verifica che il locale sia stato cambiato a 'en'
    const script = document.querySelector('script');
    expect(script?.src).toContain('locale=en');
  });

  it('gestisce errori di rete durante il caricamento del widget', async () => {
    // Mock della funzione fetch per simulare un errore di rete
    const originalFetch = window.fetch;
    window.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const mockOnLoadError = jest.fn();
    render(<NewTradingViewWidget onLoadError={mockOnLoadError} />);

    // Verifica che venga mostrato il messaggio di errore di rete
    await waitFor(() => {
      expect(screen.getByText(/errore di rete/i)).toBeInTheDocument();
    });

    // Ripristina fetch
    window.fetch = originalFetch;
  });

  it('gestisce errori di simbolo non valido', async () => {
    const mockOnLoadError = jest.fn();
    render(
      <NewTradingViewWidget symbol="INVALID" onLoadError={mockOnLoadError} />
    );

    // Verifica che venga mostrato il messaggio di errore del simbolo
    expect(screen.getByText(/Simbolo non valido/)).toBeInTheDocument();
    expect(mockOnLoadError).toHaveBeenCalled();
  });

  it('gestisce errori di configurazione del widget', async () => {
    // Mock di window.TradingView che lancia un errore di configurazione
    (window as any).TradingView = {
      widget: jest.fn().mockImplementation(() => {
        throw new Error('Invalid widget configuration');
      }),
    };

    const mockOnLoadError = jest.fn();
    render(<NewTradingViewWidget onLoadError={mockOnLoadError} />);

    // Trova lo script e simula il caricamento
    const script = document.querySelector('script');
    if (script) {
      const loadEvent = new Event('load');
      script.dispatchEvent(loadEvent);
    }

    // Verifica che venga mostrato il messaggio di errore di configurazione
    await waitFor(() => {
      expect(
        screen.getByText(/Invalid widget configuration/)
      ).toBeInTheDocument();
    });

    expect(mockOnLoadError).toHaveBeenCalled();
  });

  it('mostra il pulsante di retry dopo un errore', async () => {
    const mockOnLoadError = jest.fn();
    render(<NewTradingViewWidget onLoadError={mockOnLoadError} />);

    // Simula un errore di caricamento
    const script = document.querySelector('script');
    if (script) {
      const error = new Event('error');
      script.dispatchEvent(error);
    }

    // Verifica che il pulsante di retry sia visibile
    await waitFor(() => {
      expect(screen.getByText('Riprova')).toBeInTheDocument();
    });

    // Verifica che il pulsante sia cliccabile
    expect(screen.getByText('Riprova')).toBeEnabled();
  });
});
