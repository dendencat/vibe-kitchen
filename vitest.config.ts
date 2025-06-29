import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.js',
        'build.js',
        'test-game.html',
        'src/main.ts',
        'src/types/*.ts'
      ],
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100
        }
      }
    },
    include: ['src/**/*.test.ts'],
    globals: true,
    setupFiles: ['./test/setup.ts']
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});