import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// グローバルなfetch mock
global.fetch = vi.fn()

// カスタムイベントのmock
global.CustomEvent = vi.fn().mockImplementation((type: string, eventInitDict?: CustomEventInit) => ({
  type,
  detail: eventInitDict?.detail || {},
  bubbles: eventInitDict?.bubbles || false,
  cancelable: eventInitDict?.cancelable || false,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
}))
