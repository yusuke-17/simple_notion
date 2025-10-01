import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBlockManager } from '../useBlockManager'
import type { Block } from '@/types'

// モックブロックデータ
const mockBlocks: Block[] = [
  {
    id: 1,
    type: 'text',
    content: 'First block',
    position: 0,
    documentId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    type: 'text',
    content: 'Second block',
    position: 1,
    documentId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

describe('useBlockManager', () => {
  const documentId = 1

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('初期ブロック配列で正しく初期化される', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    expect(result.current.blocks).toHaveLength(2)
    expect(result.current.blocks[0].content).toBe('First block')
    expect(result.current.blocks[1].content).toBe('Second block')
  })

  it('空の初期配列の場合、isEmpty が true になる', () => {
    const { result } = renderHook(() => useBlockManager([], documentId))

    expect(result.current.isEmpty).toBe(true)
    expect(result.current.hasMultipleBlocks).toBe(false)
  })

  it('ブロックの内容を正しく更新できる', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    act(() => {
      result.current.handleBlockUpdate(1, 'Updated content')
    })

    expect(result.current.blocks[0].content).toBe('Updated content')
    expect(result.current.blocks[1].content).toBe('Second block') // 他は変更されない
  })

  it('ブロックのタイプを更新できる', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    act(() => {
      result.current.handleBlockUpdate(1, 'Updated content', 'heading')
    })

    expect(result.current.blocks[0].content).toBe('Updated content')
    expect(result.current.blocks[0].type).toBe('heading')
  })

  it('ブロックを正しく削除できる', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    act(() => {
      // position: 0ではない2番目のブロック（ID: 2）を削除
      result.current.handleBlockDelete(2)
    })

    expect(result.current.blocks).toHaveLength(1)
    expect(result.current.blocks[0].id).toBe(1)
    expect(result.current.blocks[0].content).toBe('First block')
  })

  it('新しいブロックを指定位置の後に追加できる', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    act(() => {
      result.current.handleAddBlock(1, 'text')
    })

    expect(result.current.blocks).toHaveLength(3)
    expect(result.current.blocks[1].content).toBe('') // 新しいブロックは空
    expect(result.current.blocks[1].type).toBe('text')
    expect(result.current.blocks[1].documentId).toBe(documentId)
  })

  it('ブロックを上に移動できる', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    act(() => {
      result.current.handleMoveBlockUp(2)
    })

    expect(result.current.blocks[0].id).toBe(2)
    expect(result.current.blocks[1].id).toBe(1)
  })

  it('ブロックを下に移動できる', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    act(() => {
      result.current.handleMoveBlockDown(1)
    })

    expect(result.current.blocks[0].id).toBe(2)
    expect(result.current.blocks[1].id).toBe(1)
  })

  it('ドラッグ&ドロップで順序を変更できる', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    act(() => {
      result.current.handleDragEnd('2', '1')
    })

    expect(result.current.blocks[0].id).toBe(2)
    expect(result.current.blocks[1].id).toBe(1)
  })

  it('同じ要素へのドラッグ&ドロップは何も変更しない', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    act(() => {
      result.current.handleDragEnd('1', '1')
    })

    expect(result.current.blocks[0].id).toBe(1)
    expect(result.current.blocks[1].id).toBe(2)
  })

  it('サーバーブロックで正しく初期化できる', () => {
    const { result } = renderHook(() => useBlockManager([], documentId))

    const serverBlocks: Block[] = [
      {
        id: 10,
        type: 'heading',
        content: 'Server block',
        position: 0,
        documentId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    act(() => {
      result.current.initializeBlocks(serverBlocks)
    })

    expect(result.current.blocks).toHaveLength(1)
    expect(result.current.blocks[0].content).toBe('Server block')
    expect(result.current.blocks[0].type).toBe('heading')
  })

  it('空のサーバーブロックの場合、初期ブロックを自動作成する', () => {
    const { result } = renderHook(() => useBlockManager([], documentId))

    act(() => {
      result.current.initializeBlocks([])
    })

    expect(result.current.blocks).toHaveLength(1)
    expect(result.current.blocks[0].type).toBe('text')
    expect(result.current.blocks[0].content).toBe('')
    expect(result.current.blocks[0].documentId).toBe(documentId)
  })

  it('サーバーとの同期で内容が変更された場合のみ更新する', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    const serverBlocks: Block[] = [
      {
        id: 1,
        type: 'text',
        content: 'Updated from server',
        position: 0,
        documentId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z',
      },
    ]

    act(() => {
      result.current.syncWithServer(serverBlocks)
    })

    expect(result.current.blocks).toHaveLength(1)
    expect(result.current.blocks[0].content).toBe('Updated from server')
  })

  it('getBlockById で正しいブロックを取得できる', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    const block = result.current.getBlockById(2)
    expect(block).toBeDefined()
    expect(block?.content).toBe('Second block')

    const nonExistentBlock = result.current.getBlockById(999)
    expect(nonExistentBlock).toBeUndefined()
  })

  it('isFirstBlock で最初のブロックかどうか判定できる', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    expect(result.current.isFirstBlock(1)).toBe(true)
    expect(result.current.isFirstBlock(2)).toBe(false)
  })

  it('isLastBlock で最後のブロックかどうか判定できる', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    expect(result.current.isLastBlock(1)).toBe(false)
    expect(result.current.isLastBlock(2)).toBe(true)
  })

  it('resetBlocks で初期状態に戻せる', () => {
    const { result } = renderHook(() => useBlockManager(mockBlocks, documentId))

    // ブロックを変更
    act(() => {
      result.current.handleBlockUpdate(1, 'Changed content')
    })

    expect(result.current.blocks[0].content).toBe('Changed content')

    // リセット
    act(() => {
      result.current.resetBlocks()
    })

    expect(result.current.blocks[0].content).toBe('First block')
  })
})
