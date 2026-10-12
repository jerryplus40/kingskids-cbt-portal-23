import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
  build: {
    rollupOptions: {
      output: {
        // Keep libraries that only some pages use out of the entry chunk every page loads
        // Match exact packages only: the object form also moves their dependencies (React) into the chunk
        manualChunks(id) {
          // React gets its own chunk so its CommonJS wrapper isn't filed under another vendor chunk
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          if (/node_modules\/(zod|react-hook-form|@hookform)\//.test(id)) return 'forms';
          if (/node_modules\/@tanstack\/(react-table|table-core)\//.test(id)) return 'table';
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
