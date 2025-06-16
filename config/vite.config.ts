import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      "@/components": path.resolve(process.cwd(), "src/components"),
      "@/lib": path.resolve(process.cwd(), "src/lib"),
      "@/hooks": path.resolve(process.cwd(), "src/hooks")
    },
  },
  build: {
    // Ottimizzazioni per produzione
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Chunking intelligente per performance
        manualChunks: {
          vendor: ['react', 'react-dom'],
          recharts: ['recharts'],
          ui: ['@radix-ui/react-slot', 'clsx', 'tailwind-merge'],
          math: ['katex']
        },
        // Ottimizzazione nomi file
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Target moderni per performance
    target: 'esnext',
    // Source maps solo in dev
    sourcemap: false,
    // Ottimizzazione CSS
    cssCodeSplit: true,
    // Limite dimensioni chunk per warning
    chunkSizeWarningLimit: 1000,
    // Asset inlining ottimizzato
    assetsInlineLimit: 4096
  },
  // Preview per test locale
  preview: {
    port: 3000,
    strictPort: true
  },
  // Ottimizzazioni dev
  server: {
    port: 5173,
    strictPort: true
  }
})
