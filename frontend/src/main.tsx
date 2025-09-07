import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 包括的なグローバルエラーハンドラーでメッセージポートとその他の開発環境エラーを処理
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason === 'object' && 
      'message' in event.reason && 
      typeof event.reason.message === 'string') {
    const errorMessage = event.reason.message.toLowerCase()
    
    // 開発環境で一般的なエラーを静的に処理
    const devErrors = [
      'message port closed',
      'extension context invalidated',
      'attempting to use a disconnected port',
      'could not establish connection',
      'port closed before a response was received',
      'the message port closed',
      'disconnected port object',
      'chrome-extension:'
    ]
    
    if (devErrors.some(err => errorMessage.includes(err))) {
      // 開発環境のノイズなので静的に処理
      if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SUPPRESS_DEV_WARNINGS) {
        console.debug('[Dev Environment] Communication error suppressed:', event.reason.message)
      }
      event.preventDefault()
      return
    }
  }
})

// Chrome拡張機能、DevTools、その他のブラウザ特有エラーも静的に処理
window.addEventListener('error', (event) => {
  if (event.message) {
    const errorMessage = event.message.toLowerCase()
    const devErrors = [
      'extension context invalidated',
      'could not establish connection',
      'attempting to use a disconnected port',
      'chrome-extension:',
      'non-error promise rejection captured',
      'script error',
      'resizeobserver loop limit exceeded'
    ]
    
    if (devErrors.some(err => errorMessage.includes(err))) {
      if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SUPPRESS_DEV_WARNINGS) {
        console.debug('[Dev Environment] Error suppressed:', event.message)
      }
      event.preventDefault()
      return
    }
  }
})

// ResizeObserver エラーのハンドリング（よくある無害なエラー）
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('ResizeObserver loop limit exceeded')) {
    event.preventDefault()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
