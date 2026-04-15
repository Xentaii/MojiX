import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/lib',
    copyPublicDir: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MojiX',
      formats: ['es', 'cjs'],
      cssFileName: 'style',
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
