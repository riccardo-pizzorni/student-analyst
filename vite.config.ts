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
        target: 'http://localhost:10000',
        changeOrigin: true, // Necessario per i virtual host
        secure: false, // Non verificare il certificato SSL (per sviluppo)
      },
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
