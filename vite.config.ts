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
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Staff-only libraries are large; students never need them
        globIgnores: ['**/xlsx-*.js', '**/mammoth-*.js'],
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
          if (/node_modules\/(mammoth|jszip|lop|dingbat-to-unicode|bluebird|underscore|xmlbuilder|@xmldom|pako|base64-js|option)\//.test(id)) return 'mammoth';
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
