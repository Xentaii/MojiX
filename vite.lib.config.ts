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
        style: resolve(__dirname, 'src/entries/style.ts'),
        'locales/de': resolve(__dirname, 'src/entries/locales/de.ts'),
        'locales/en': resolve(__dirname, 'src/entries/locales/en.ts'),
        'locales/es': resolve(__dirname, 'src/entries/locales/es.ts'),
        'locales/fr': resolve(__dirname, 'src/entries/locales/fr.ts'),
        'locales/ja': resolve(__dirname, 'src/entries/locales/ja.ts'),
        'locales/pt': resolve(__dirname, 'src/entries/locales/pt.ts'),
        'locales/ru': resolve(__dirname, 'src/entries/locales/ru.ts'),
        'locales/uk': resolve(__dirname, 'src/entries/locales/uk.ts'),
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
