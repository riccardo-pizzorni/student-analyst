import { render, screen } from '@testing-library/react';
import React from 'react';

// Test semplice per verificare che l'infrastruttura funzioni
describe('Frontend Test Infrastructure', () => {
  test('renders a simple component', () => {
    const TestComponent = () => (
      <div data-testid="test-component">Test Component</div>
    );

    render(<TestComponent />);

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  test('handles basic user interactions', () => {
    const TestButton = () => (
      <button data-testid="test-button" onClick={() => console.log('clicked')}>
        Click me
      </button>
    );

    render(<TestButton />);

    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  test('supports async operations', async () => {
    const AsyncComponent = () => {
      const [data, setData] = React.useState<string>('loading');

      React.useEffect(() => {
        setTimeout(() => setData('loaded'), 100);
      }, []);

      return <div data-testid="async-component">{data}</div>;
    };

    render(<AsyncComponent />);

    expect(screen.getByTestId('async-component')).toHaveTextContent('loading');

    // Wait for async update
    await screen.findByText('loaded');
    expect(screen.getByTestId('async-component')).toHaveTextContent('loaded');
  });
});
