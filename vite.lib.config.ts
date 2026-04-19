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
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'locales/en': resolve(__dirname, 'src/entries/locales/en.ts'),
        'locales/ru': resolve(__dirname, 'src/entries/locales/ru.ts'),
        'presets/index': resolve(__dirname, 'src/entries/presets/index.ts'),
      },
      name: 'MojiX',
      formats: ['es', 'cjs'],
      cssFileName: 'style',
      fileName: (format, entryName) =>
        format === 'es' ? `${entryName}.js` : `${entryName}.cjs`,
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
