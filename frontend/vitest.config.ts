import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
    plugins: [
    sveltekit()
  ],
  resolve: {
    conditions: mode === 'test' ? ['browser'] : []
  },
    deps: {
    optimizer: {
      web: {
        include: ['svelte', '@sveltejs/kit', '@testing-library/svelte']
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    dir: 'src/tests',
    include: ['**/*.{test,spec}.{js,ts,svelte}'],
    alias: {
      $routes: path.resolve(__dirname, 'src/routes'),
      $lib:    path.resolve(__dirname, 'src/lib'),
    },
    testTransformMode: {
      web: ['**/*.svelte']
    },
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov', 'html'],
      all: true,
      include: ['src/**/*.{ts,svelte}']
    }
  }
}));
