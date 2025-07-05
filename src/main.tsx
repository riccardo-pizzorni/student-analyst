import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupConsoleFilter } from './utils/consoleFilter';

// Attiva il filtro per nascondere errori innocui di TradingView
if (import.meta.env.DEV) {
  setupConsoleFilter();
}

createRoot(document.getElementById('root')!).render(<App />);
