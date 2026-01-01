import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

// テスト後にクリーンアップ（Svelte用）
afterEach(() => {
  // Svelteのクリーンアップは@testing-library/svelteが自動処理
})

// モックの設定
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// matchMediaのモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// window.confirmのモック
global.confirm = vi.fn().mockReturnValue(true)
