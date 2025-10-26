import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
    typecheck: {
      include: ['**/*.{test,spec}.{ts,tsx}'],
      tsconfig: './tsconfig.test.json', // テスト用のTypeScript設定を明示的に指定
    },
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
    env: {
      VITE_API_BASE_URL: '',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/setup.ts',
        '**/*.d.ts',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
