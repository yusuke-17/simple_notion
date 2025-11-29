import { describe, it, expect, vi } from 'vitest'
import {
  normalizeContent,
  hasSelection,
  isContentSynchronized,
  DEFAULT_TOOLBAR_POSITION,
  isValidUrl,
  normalizeUrl,
  detectUrls,
  getLinkDisplayText,
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

  describe('isValidUrl', () => {
    it('有効なURLを正しく検証する', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://example.com')).toBe(true)
      expect(isValidUrl('https://example.com/path')).toBe(true)
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true)
    })

    it('プロトコルがないドメインを検証する', () => {
      expect(isValidUrl('example.com')).toBe(true)
      expect(isValidUrl('www.example.com')).toBe(true)
      expect(isValidUrl('subdomain.example.com')).toBe(true)
    })

    it('無効なURLを拒否する', () => {
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('not a url')).toBe(false)
      expect(isValidUrl('.com')).toBe(false)
    })
  })

  describe('normalizeUrl', () => {
    it('プロトコルがない場合はhttps://を追加する', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com')
      expect(normalizeUrl('www.example.com')).toBe('https://www.example.com')
    })

    it('既にプロトコルがある場合はそのまま返す', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com')
      expect(normalizeUrl('http://example.com')).toBe('http://example.com')
    })

    it('空文字列の場合は空文字列を返す', () => {
      expect(normalizeUrl('')).toBe('')
      expect(normalizeUrl('   ')).toBe('')
    })
  })

  describe('detectUrls', () => {
    it('http(s)://で始まるURLを検出する', () => {
      const text = 'Visit https://example.com for more info'
      const urls = detectUrls(text)
      expect(urls).toContain('https://example.com')
    })

    it('www.で始まるURLを検出する', () => {
      const text = 'Check out www.example.com today'
      const urls = detectUrls(text)
      expect(urls).toContain('https://www.example.com')
    })

    it('複数のURLを検出する', () => {
      const text = 'Visit https://example.com and www.another.com for details'
      const urls = detectUrls(text)
      expect(urls.length).toBeGreaterThan(0)
    })

    it('URLがない場合は空配列を返す', () => {
      const text = 'This is just plain text'
      const urls = detectUrls(text)
      expect(urls).toEqual([])
    })
  })

  describe('getLinkDisplayText', () => {
    it('短いURLはそのまま表示する', () => {
      const url = 'https://example.com'
      const displayText = getLinkDisplayText(url, 50)
      expect(displayText).toBe('example.com/')
    })

    it('長いURLは短縮して表示する', () => {
      const url = 'https://example.com/very/long/path/to/some/resource'
      const displayText = getLinkDisplayText(url, 20)
      expect(displayText).toContain('...')
      expect(displayText.length).toBeLessThanOrEqual(20)
    })

    it('無効なURLでも処理する', () => {
      const url = 'not-a-valid-url'
      const displayText = getLinkDisplayText(url, 50)
      expect(displayText).toBe(url)
    })
  })
})
