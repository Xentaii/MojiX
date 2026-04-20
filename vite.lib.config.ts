import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf8'),
) as {
  version: string;
};

function copyBundleDataPlugin() {
  const jsonModuleLoaderSource = [
    'async function importJsonModule(url) {',
    '  try {',
    `    return (await Function('u', 'return import(u, { with: { type: "json" } });')(url.href)).default;`,
    '  } catch (withError) {',
    `    return (await Function('u', 'return import(u, { assert: { type: "json" } });')(url.href)).default;`,
    '  }',
    '}',
    '',
  ].join('\n');

  return {
    name: 'copy-mojix-data',
    writeBundle() {
      const generatedDir = resolve(__dirname, 'src/core/generated');
      const distDataDir = resolve(__dirname, 'dist/data');
      const distLibNodeDir = resolve(__dirname, 'dist/lib/node');
      const distLibNodeLocaleDir = resolve(distLibNodeDir, 'locales');
      const distLocaleDir = resolve(distDataDir, 'locales');

      mkdirSync(distLocaleDir, { recursive: true });
      mkdirSync(distLibNodeLocaleDir, { recursive: true });
      cpSync(
        resolve(generatedDir, 'emoji-data.json'),
        resolve(distDataDir, 'emoji-data.json'),
      );
      writeFileSync(
        resolve(distLibNodeDir, 'data.js'),
        [
          jsonModuleLoaderSource,
          "const emojiData = await importJsonModule(new URL('../../data/emoji-data.json', import.meta.url));",
          '',
          'export default emojiData;',
          '',
        ].join('\n'),
        'utf8',
      );

      for (const fileName of readdirSync(generatedDir)) {
        const match = /^emoji-locale\.([^.]+)\.json$/u.exec(fileName);

        if (!match) {
          continue;
        }

        cpSync(
          resolve(generatedDir, fileName),
          resolve(distLocaleDir, `${match[1]}.json`),
        );
        writeFileSync(
          resolve(distLibNodeLocaleDir, `${match[1]}.js`),
          [
            jsonModuleLoaderSource,
            `const localePack = await importJsonModule(new URL('../../../data/locales/${match[1]}.json', import.meta.url));`,
            '',
            'export default localePack;',
            '',
          ].join('\n'),
          'utf8',
        );
      }
    },
  };
}

export default defineConfig({
  define: {
    __MOJIX_VERSION__: JSON.stringify(packageJson.version),
  },
  esbuild: {
    legalComments: 'none',
  },
  plugins: [react(), copyBundleDataPlugin()],
  build: {
    outDir: 'dist/lib',
    copyPublicDir: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
    minify: 'esbuild',
    sourcemap: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        style: resolve(__dirname, 'src/entries/style.ts'),
        'sprites/apple': resolve(__dirname, 'src/entries/sprites/apple.ts'),
        'sprites/facebook': resolve(__dirname, 'src/entries/sprites/facebook.ts'),
        'sprites/google': resolve(__dirname, 'src/entries/sprites/google.ts'),
        'sprites/twitter': resolve(__dirname, 'src/entries/sprites/twitter.ts'),
        'presets/index': resolve(__dirname, 'src/entries/presets/index.ts'),
      },
      name: 'MojiX',
      formats: ['es'],
      cssFileName: 'style',
      fileName: (_format, entryName) => `${entryName}.js`,
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
