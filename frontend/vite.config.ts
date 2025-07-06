import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
    },
  },
  server: {
    host: process.env.CI ? '0.0.0.0' : 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    // CI環境での互換性を改善
    global: 'globalThis',
  },
  optimizeDeps: {
    // CI環境での依存関係の最適化を改善
    include: ['react', 'react-dom'],
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
