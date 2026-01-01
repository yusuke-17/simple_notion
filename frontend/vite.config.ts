import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
    },
  },
  server: {
    host: process.env.CI ? '0.0.0.0' : 'localhost',
    port: parseInt(process.env.PORT || '5174'),
    strictPort: false,
    proxy: {
      '/api': {
        // サーバーサイドプロキシ用の環境変数を優先使用
        target:
          process.env.VITE_API_PROXY_TARGET ||
          process.env.VITE_API_BASE_URL ||
          'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    global: 'globalThis',
  },
  preview: {
    host: '0.0.0.0',
    port: 4174,
  },
})
