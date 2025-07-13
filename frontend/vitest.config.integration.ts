import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts', './src/tests/integration/setup.ts'],
    css: true,
    include: ['**/src/tests/integration/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
    testTimeout: 10000, // 結合テストは時間がかかる可能性があるため
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // テスト環境でのグローバル変数定義
    global: 'globalThis',
    // APIベースURLの設定
    'import.meta.env.VITE_API_BASE_URL': '"http://localhost:8080"',
  },
})
