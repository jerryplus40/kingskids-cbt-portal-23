import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      // Edge function tests run under Deno (npm run check:functions), not Node
      exclude: [...configDefaults.exclude, 'supabase/functions/**'],
      // Each database test file boots Postgres in WebAssembly and runs every migration
      hookTimeout: 60_000,
      testTimeout: 30_000,
    },
  }),
);
