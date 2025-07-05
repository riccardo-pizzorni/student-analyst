import react from '@vitejs/plugin-react-swc';
import { componentTagger } from 'lovable-tagger';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: 'localhost',
    port: 8080,
    open: true, // Apre automaticamente il browser
    proxy: {
      // Proxy per tutte le richieste /api al nostro server backend
      '/api': {
        target: 'https://student-analyst.onrender.com',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Aggiungi CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          });
        },
      },
      // Proxy per telemetria TradingView (elimina errori CORS)
      '/telemetry': {
        target: 'https://telemetry.tradingview.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/telemetry/, ''),
      },
    },
    headers: {
      // Configura Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://static.tradingview.com https://www.tradingview-widget.com",
        "style-src 'self' 'unsafe-inline' https://s3.tradingview.com https://static.tradingview.com",
        "img-src 'self' data: https: http:",
        "connect-src 'self' http://localhost:10000 https://student-analyst.onrender.com wss://student-analyst.onrender.com https://*.tradingview.com https://telemetry.tradingview.com",
        "frame-src 'self' https://*.tradingview.com",
      ].join('; '),
    },
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
