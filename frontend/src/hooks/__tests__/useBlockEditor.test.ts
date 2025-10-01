import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useBlockEditor } from '../useBlockEditor'
import type { Block } from '@/types'

// キーボードイベントのモック作成ヘルパー
const createMockKeyboardEvent = (
  key: string,
  options: Partial<ReactKeyboardEvent> = {}
) =>
  ({
    key,
    shiftKey: false,
    metaKey: false,
    preventDefault: vi.fn(),
    ...options,
  }) as ReactKeyboardEvent

const mockBlock: Block = {
  id: 1,
  type: 'text',
  content: 'Test content',
  position: 0,
  documentId: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('useBlockEditor', () => {
  const mockOnUpdate = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnAddBlock = vi.fn()
  const mockOnMoveUp = vi.fn()
  const mockOnMoveDown = vi.fn()
  const mockOnFocus = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() =>
      useBlockEditor(
        mockBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    expect(result.current.showTypeSelector).toBe(false)
    expect(result.current.blockId).toBe(1)
    expect(result.current.blockType).toBe('text')
    expect(result.current.blockContent).toBe('Test content')
    expect(result.current.blockPosition).toBe(0)
    expect(result.current.isRichText).toBe(true)
    expect(result.current.hasPrefix).toBe(false)
  })

  it('bullet タイプのブロックで正しいプレフィックスが表示される', () => {
    const bulletBlock = { ...mockBlock, type: 'bullet' }
    const { result } = renderHook(() =>
      useBlockEditor(
        bulletBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    expect(result.current.getPrefixText()).toBe('•')
    expect(result.current.hasPrefix).toBe(true)
    expect(result.current.isRichText).toBe(false)
  })

  it('numbered タイプのブロックで正しいプレフィックスが表示される', () => {
    const numberedBlock = { ...mockBlock, type: 'numbered', position: 2 }
    const { result } = renderHook(() =>
      useBlockEditor(
        numberedBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    expect(result.current.getPrefixText()).toBe('3.') // position + 1
    expect(result.current.hasPrefix).toBe(true)
  })

  it('Enterキーで新しいブロックが追加される', () => {
    const { result } = renderHook(() =>
      useBlockEditor(
        mockBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('Enter'))
    })

    expect(mockOnAddBlock).toHaveBeenCalledWith(1, 'text')
  })

  it('Shift+Enterキーでは新しいブロックが追加されない', () => {
    const { result } = renderHook(() =>
      useBlockEditor(
        mockBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    act(() => {
      result.current.handleKeyDown(
        createMockKeyboardEvent('Enter', { shiftKey: true })
      )
    })

    expect(mockOnAddBlock).not.toHaveBeenCalled()
  })

  it('空のブロックでBackspaceキーを押すとブロックが削除される', () => {
    const emptyBlock = { ...mockBlock, content: '', position: 1 }
    const { result } = renderHook(() =>
      useBlockEditor(
        emptyBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('Backspace'))
    })

    expect(mockOnDelete).toHaveBeenCalledWith(1)
  })

  it('最初のブロック（position: 0）でBackspaceキーを押しても削除されない', () => {
    const firstBlock = { ...mockBlock, content: '', position: 0 }
    const { result } = renderHook(() =>
      useBlockEditor(
        firstBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('Backspace'))
    })

    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('Cmd+ArrowUpでブロックが上に移動する', () => {
    const { result } = renderHook(() =>
      useBlockEditor(
        mockBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    act(() => {
      result.current.handleKeyDown(
        createMockKeyboardEvent('ArrowUp', { metaKey: true })
      )
    })

    expect(mockOnMoveUp).toHaveBeenCalledWith(1)
  })

  it('Cmd+ArrowDownでブロックが下に移動する', () => {
    const { result } = renderHook(() =>
      useBlockEditor(
        mockBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    act(() => {
      result.current.handleKeyDown(
        createMockKeyboardEvent('ArrowDown', { metaKey: true })
      )
    })

    expect(mockOnMoveDown).toHaveBeenCalledWith(1)
  })

  it('空のブロックで"/"キーを押すとタイプセレクターが表示される', () => {
    const emptyBlock = { ...mockBlock, content: '' }
    const { result } = renderHook(() =>
      useBlockEditor(
        emptyBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('/'))
    })

    expect(result.current.showTypeSelector).toBe(true)
  })

  it('リッチテキストエディターでのキーボード操作', () => {
    const { result } = renderHook(() =>
      useBlockEditor(
        mockBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    // Enterキー
    const enterResult = result.current.handleRichTextKeyDown(
      createMockKeyboardEvent('Enter')
    )

    expect(enterResult).toBe(false) // デフォルト動作を防ぐ
    expect(mockOnAddBlock).toHaveBeenCalledWith(1, 'text')
  })

  it('ブロックタイプを変更できる', () => {
    const { result } = renderHook(() =>
      useBlockEditor(
        mockBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    act(() => {
      result.current.handleTypeChange('heading')
    })

    expect(mockOnUpdate).toHaveBeenCalledWith(1, 'Test content', 'heading')
    expect(result.current.showTypeSelector).toBe(false)
  })

  it('ブロックの内容を更新できる', () => {
    const { result } = renderHook(() =>
      useBlockEditor(
        mockBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    act(() => {
      result.current.handleContentChange('Updated content')
    })

    expect(mockOnUpdate).toHaveBeenCalledWith(1, 'Updated content')
  })

  it('フォーカス時にonFocusコールバックが呼ばれる', () => {
    const { result } = renderHook(() =>
      useBlockEditor(
        mockBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    act(() => {
      result.current.handleFocus()
    })

    expect(mockOnFocus).toHaveBeenCalled()
  })

  it('タイプセレクターを閉じることができる', () => {
    // 空のブロックを使用してタイプセレクターを開くことができるようにする
    const emptyBlock = { ...mockBlock, content: '' }
    const { result } = renderHook(() =>
      useBlockEditor(
        emptyBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    // まずタイプセレクターを開く（空のブロックで"/"キーを押す）
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('/'))
    })

    expect(result.current.showTypeSelector).toBe(true)

    // 閉じる
    act(() => {
      result.current.closeTypeSelector()
    })

    expect(result.current.showTypeSelector).toBe(false)
  })

  it('ブロックタイプに応じた適切なプレースホルダーとクラス名が取得される', () => {
    const headingBlock = { ...mockBlock, type: 'heading', position: 0 }
    const { result } = renderHook(() =>
      useBlockEditor(
        headingBlock,
        mockOnUpdate,
        mockOnDelete,
        mockOnAddBlock,
        mockOnMoveUp,
        mockOnMoveDown,
        mockOnFocus
      )
    )

    expect(result.current.placeholder).toBeDefined()
    expect(result.current.className).toBeDefined()
    expect(typeof result.current.placeholder).toBe('string')
    expect(typeof result.current.className).toBe('string')
  })
})
