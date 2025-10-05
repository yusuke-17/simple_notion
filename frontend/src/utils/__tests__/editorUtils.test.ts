import { describe, it, expect, vi } from 'vitest'
import {
  normalizeContent,
  hasSelection,
  isContentSynchronized,
  DEFAULT_TOOLBAR_POSITION,
} from '../editorUtils'

// DOM APIをモック
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: vi.fn(),
})

describe('editorUtils', () => {
  describe('normalizeContent', () => {
    it('空のコンテンツを正しく処理する', () => {
      const result = normalizeContent('')

      expect(result).toEqual({
        type: 'doc',
        content: [{ type: 'paragraph' }],
      })
    })

    it('JSONコンテンツを正しく解析する', () => {
      const jsonContent = '{"type":"doc","content":[{"type":"paragraph"}]}'
      const result = normalizeContent(jsonContent)

      expect(result).toEqual({
        type: 'doc',
        content: [{ type: 'paragraph' }],
      })
    })

    it('プレーンテキストをTipTap形式に変換する', () => {
      const result = normalizeContent('Hello World')

      expect(result).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello World',
              },
            ],
          },
        ],
      })
    })

    it('無効なJSONはプレーンテキストとして処理する', () => {
      const result = normalizeContent('{"invalid": json}')

      expect(result).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '{"invalid": json}',
              },
            ],
          },
        ],
      })
    })
  })

  describe('hasSelection', () => {
    it('選択がない場合falseを返す', () => {
      vi.mocked(window.getSelection).mockReturnValue(null)

      const result = hasSelection()
      expect(result).toBe(false)
    })

    it('選択がある場合trueを返す', () => {
      const mockSelection = {
        rangeCount: 1,
        isCollapsed: false,
        toString: () => 'selected text',
      }
      vi.mocked(window.getSelection).mockReturnValue(mockSelection as Selection)

      const result = hasSelection()
      expect(result).toBe(true)
    })
  })

  describe('isContentSynchronized', () => {
    it('コンテンツが同期されている場合trueを返す', () => {
      const result = isContentSynchronized('content', 'content', 'content')
      expect(result).toBe(true)
    })

    it('コンテンツが同期されていない場合falseを返す', () => {
      const result = isContentSynchronized('new', 'different', 'old')
      expect(result).toBe(false)
    })
  })

  describe('DEFAULT_TOOLBAR_POSITION', () => {
    it('デフォルトのツールバー位置を定義している', () => {
      expect(DEFAULT_TOOLBAR_POSITION).toEqual({ top: 0, left: 0 })
    })
  })
})
