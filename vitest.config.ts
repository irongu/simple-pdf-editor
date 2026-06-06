import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/types.ts',
        'src/index.css',
      ],
      thresholds: {
        // App.tsx requires complex E2E/DOM mocking; thresholds
        // are set for the testable utility + hook layers
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50,
      },
    },
  },
})
