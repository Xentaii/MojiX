import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as {
  version: string;
};

export default defineConfig({
  define: {
    __MOJIX_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/components/**', 'src/core/**'],
      exclude: [
        'src/core/generated/**',
        'src/**/*.d.ts',
        'src/**/__tests__/**',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 72,
        lines: 70,
      },
    },
  },
});
