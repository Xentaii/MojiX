import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as {
  version: string;
};

export default defineConfig({
  base: process.env.BASE_URL || '/',
  define: {
    __MOJIX_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [react()],
  server: {
    forwardConsole: false,
  },
  build: {
    outDir: 'dist/demo',
    chunkSizeWarningLimit: 1500,
  },
});
