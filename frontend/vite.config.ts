import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [sveltekit()],
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
    resolve: {
      alias: {
        $lib: path.resolve('./src/lib'),
      },
    },
    define: {
      'process.env': env
    },
    ssr: {
      noExternal: ['jwt-decode']
    },
    optimizeDeps: {
      exclude: ['jwt-decode']
    }
  };
});
