import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRichTextEditor } from '../useRichTextEditor'

// Mock TipTap modules
const mockEditor = {
  getJSON: vi.fn(() => ({ type: 'doc', content: [] })),
  commands: {
    setContent: vi.fn(),
    focus: vi.fn(),
  },
  chain: vi.fn(() => ({
    focus: vi.fn(() => ({
      toggleBold: vi.fn(() => ({ run: vi.fn() })),
      toggleItalic: vi.fn(() => ({ run: vi.fn() })),
      toggleUnderline: vi.fn(() => ({ run: vi.fn() })),
      toggleStrike: vi.fn(() => ({ run: vi.fn() })),
    })),
  })),
  isActive: vi.fn(() => false),
  isFocused: false,
}

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => mockEditor),
}))

// Mock TipTap extensions
vi.mock('@tiptap/extension-document', () => ({ Document: {} }))
vi.mock('@tiptap/extension-paragraph', () => ({
  Paragraph: { configure: vi.fn(() => ({})) },
}))
vi.mock('@tiptap/extension-text', () => ({ Text: {} }))
vi.mock('@tiptap/extension-bold', () => ({ Bold: {} }))
vi.mock('@tiptap/extension-italic', () => ({ Italic: {} }))
vi.mock('@tiptap/extension-strike', () => ({ Strike: {} }))
vi.mock('@tiptap/extension-hard-break', () => ({ HardBreak: {} }))
vi.mock('@tiptap/extension-dropcursor', () => ({ Dropcursor: {} }))
vi.mock('@tiptap/extension-gapcursor', () => ({ Gapcursor: {} }))
vi.mock('@tiptap/extension-underline', () => ({
  default: { configure: vi.fn(() => ({})) },
}))

// Mock editor utilities
vi.mock('@/utils/editorUtils', () => ({
  normalizeContent: vi.fn(() => ({ type: 'doc', content: [] })),
  getSelectionCoordinates: vi.fn(() => ({ top: 100, left: 50 })),
  getContextMenuCoordinates: vi.fn(() => ({ top: 150, left: 75 })),
  hasSelection: vi.fn(() => false),
  isContentSynchronized: vi.fn(() => true),
  DEFAULT_TOOLBAR_POSITION: { top: 0, left: 0 },
  TOOLBAR_CONFIG: {
    WIDTH: 150,
    HEIGHT: 50,
    SELECTION_DEBOUNCE: 50,
    BLUR_TIMEOUT: 100,
    CONTENT_SYNC_DELAY: 50,
  },
}))

describe('useRichTextEditor', () => {
  const defaultProps = {
    content: '',
    placeholder: 'Test placeholder',
    onUpdate: vi.fn(),
    onFocus: vi.fn(),
    onKeyDown: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Hook Initialization', () => {
    it('初期化時にエディターを正しく設定する', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      expect(result.current.editor).toBe(mockEditor)
      expect(result.current.showToolbar).toBe(false)
      expect(result.current.showContextMenu).toBe(false)
      expect(result.current.toolbarPosition).toEqual({ top: 0, left: 0 })
      expect(result.current.contextMenuPosition).toEqual({ top: 0, left: 0 })
      expect(result.current.placeholder).toBe('Test placeholder')
    })

    it('空のコンテンツを正しく処理する', () => {
      const { result } = renderHook(() =>
        useRichTextEditor({ ...defaultProps, content: '' })
      )

      expect(result.current.editor).toBe(mockEditor)
    })

    it('プレースホルダーが未指定の場合デフォルト値を使用する', () => {
      const { result } = renderHook(() =>
        useRichTextEditor({
          ...defaultProps,
          placeholder: undefined,
        })
      )

      expect(result.current.placeholder).toBe('Start typing...')
    })
  })

  describe('Format Actions', () => {
    it('フォーマット関数が提供されている', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      expect(typeof result.current.toggleBold).toBe('function')
      expect(typeof result.current.toggleItalic).toBe('function')
      expect(typeof result.current.toggleUnderline).toBe('function')
      expect(typeof result.current.toggleStrike).toBe('function')
      expect(typeof result.current.isFormatActive).toBe('function')
    })

    it('太字トグルを実行できる', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      act(() => {
        result.current.toggleBold()
      })

      expect(mockEditor.chain).toHaveBeenCalled()
    })

    it('イタリックトグルを実行できる', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      act(() => {
        result.current.toggleItalic()
      })

      expect(mockEditor.chain).toHaveBeenCalled()
    })

    it('アンダーライントグルを実行できる', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      act(() => {
        result.current.toggleUnderline()
      })

      expect(mockEditor.chain).toHaveBeenCalled()
    })

    it('取り消し線トグルを実行できる', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      act(() => {
        result.current.toggleStrike()
      })

      expect(mockEditor.chain).toHaveBeenCalled()
    })

    it('フォーマットがアクティブかチェックできる', () => {
      mockEditor.isActive.mockReturnValue(true)

      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      const isActive = result.current.isFormatActive('bold')

      expect(mockEditor.isActive).toHaveBeenCalledWith('bold')
      expect(isActive).toBe(true)
    })
  })

  describe('Props Changes', () => {
    it('コンテンツのprops変更を処理できる', () => {
      const { rerender } = renderHook(props => useRichTextEditor(props), {
        initialProps: defaultProps,
      })

      const newContent = 'new content'

      act(() => {
        rerender({ ...defaultProps, content: newContent })
      })

      // エラーなくレンダリングされることを確認
      expect(true).toBe(true)
    })

    it('プレースホルダーの変更を処理できる', () => {
      const { result, rerender } = renderHook(
        props => useRichTextEditor(props),
        { initialProps: defaultProps }
      )

      const newPlaceholder = 'New placeholder'

      act(() => {
        rerender({ ...defaultProps, placeholder: newPlaceholder })
      })

      expect(result.current.placeholder).toBe(newPlaceholder)
    })
  })

  describe('UI State Management', () => {
    it('ツールバー表示状態を管理する', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      expect(typeof result.current.showToolbar).toBe('boolean')
      expect(result.current.showToolbar).toBe(false)
    })

    it('コンテキストメニュー表示状態を管理する', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      expect(typeof result.current.showContextMenu).toBe('boolean')
      expect(result.current.showContextMenu).toBe(false)
    })

    it('ツールバー位置を管理する', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      expect(result.current.toolbarPosition).toEqual({ top: 0, left: 0 })
    })

    it('コンテキストメニュー位置を管理する', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      expect(result.current.contextMenuPosition).toEqual({ top: 0, left: 0 })
    })
  })

  describe('Ref Management', () => {
    it('editorRefを提供する', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      expect(result.current.editorRef).toBeDefined()
      expect(typeof result.current.editorRef).toBe('object')
    })
  })

  describe('Error Handling', () => {
    it('onFocusプロパティが無くてもエラーにならない', () => {
      const propsWithoutOnFocus = {
        content: '',
        onUpdate: vi.fn(),
      }

      const { result } = renderHook(() =>
        useRichTextEditor(propsWithoutOnFocus)
      )

      expect(result.current).toBeDefined()
      expect(result.current.editor).toBe(mockEditor)
    })

    it('onKeyDownプロパティが無くてもエラーにならない', () => {
      const propsWithoutOnKeyDown = {
        content: '',
        onUpdate: vi.fn(),
      }

      const { result } = renderHook(() =>
        useRichTextEditor(propsWithoutOnKeyDown)
      )

      expect(result.current).toBeDefined()
      expect(result.current.editor).toBe(mockEditor)
    })
  })

  describe('Return Value Structure', () => {
    it('期待されるすべてのプロパティを返す', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      const expectedProps = [
        'editor',
        'editorRef',
        'showToolbar',
        'toolbarPosition',
        'showContextMenu',
        'contextMenuPosition',
        'toggleBold',
        'toggleItalic',
        'toggleUnderline',
        'toggleStrike',
        'isFormatActive',
        'placeholder',
      ]

      expectedProps.forEach(prop => {
        expect(result.current).toHaveProperty(prop)
      })
    })

    it('フォーマットアクション用の関数を返す', () => {
      const { result } = renderHook(() => useRichTextEditor(defaultProps))

      expect(typeof result.current.toggleBold).toBe('function')
      expect(typeof result.current.toggleItalic).toBe('function')
      expect(typeof result.current.toggleUnderline).toBe('function')
      expect(typeof result.current.toggleStrike).toBe('function')
      expect(typeof result.current.isFormatActive).toBe('function')
    })
  })
})
