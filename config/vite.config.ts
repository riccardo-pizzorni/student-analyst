import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      "@/components": path.resolve(process.cwd(), "src/components"),
      "@/lib": path.resolve(process.cwd(), "src/lib"),
      "@/hooks": path.resolve(process.cwd(), "src/hooks"),
    },
  },
}));
