import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // A service worker keeps the app itself on the device, so a page reload during an internet
    // outage still opens the exam screen. API calls are never cached.
    VitePWA({
      // 'prompt' lets src/lib/registerServiceWorker.ts choose when to apply updates (never mid-exam)
      registerType: 'prompt',
      injectRegister: false,
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Staff-only libraries are large; students never need them
        globIgnores: ['**/xlsx-*.js', '**/docx-*.js'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
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
          if (/node_modules\/(jszip|pako|lie|immediate|setimmediate|readable-stream)\//.test(id)) return 'docx';
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
