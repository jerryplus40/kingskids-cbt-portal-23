import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      // Each database test file boots Postgres in WebAssembly and runs every migration
      hookTimeout: 60_000,
      testTimeout: 30_000,
    },
  }),
);
