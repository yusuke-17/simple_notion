import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { MockedFunction } from 'vitest'
import { useDocumentEditor } from '../useDocumentEditor'
import * as useBlockManagerModule from '../useBlockManager'
import * as useAutoSaveModule from '../useAutoSave'

// fetch のモック
global.fetch = vi.fn()
const mockFetch = fetch as MockedFunction<typeof fetch>

// useBlockManager のモック
const mockBlockManager = {
  blocks: [],
  handleBlockUpdate: vi.fn(),
  handleBlockDelete: vi.fn(),
  handleAddBlock: vi.fn(),
  handleMoveBlockUp: vi.fn(),
  handleMoveBlockDown: vi.fn(),
  handleDragEnd: vi.fn(),
  initializeBlocks: vi.fn(),
  syncWithServer: vi.fn(),
  resetBlocks: vi.fn(),
  getBlockById: vi.fn(),
  isFirstBlock: vi.fn(),
  isLastBlock: vi.fn(),
  isEmpty: true,
  hasMultipleBlocks: false,
}

// useAutoSave のモック
const mockAutoSave = {
  saveNow: vi.fn(),
  hasUnsavedChanges: vi.fn(() => false),
  isSaving: false,
}

vi.mock('../useBlockManager', () => ({
  useBlockManager: vi.fn(() => mockBlockManager),
}))

vi.mock('../useAutoSave', () => ({
  useAutoSave: vi.fn(() => mockAutoSave),
}))

const mockDocument = {
  id: 1,
  title: 'Test Document',
  blocks: [
    {
      id: 1,
      type: 'text',
      content: 'Test content',
      position: 0,
      documentId: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('useDocumentEditor', () => {
  const documentId = 1

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDocument,
    } as Response)
  })

  it('初期状態が正しく設定される', async () => {
    const { result } = renderHook(() => useDocumentEditor(documentId))

    // 初期状態の確認
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(null)
    expect(result.current.title).toBe('')
    expect(result.current.document).toBe(null)

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('文書を正常に読み込める', async () => {
    const { result } = renderHook(() => useDocumentEditor(documentId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.document).toEqual(mockDocument)
    expect(result.current.title).toBe('Test Document')
    expect(result.current.error).toBe(null)
    expect(result.current.isReady).toBe(true)
  })

  it('文書読み込みエラーが適切に処理される', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useDocumentEditor(documentId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.document).toBe(null)
    expect(result.current.isReady).toBe(false)

    consoleSpy.mockRestore()
  })

  it('タイトルを更新できる', async () => {
    const { result } = renderHook(() => useDocumentEditor(documentId))

    // 初期読み込み完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.updateTitle('New Title')
    })

    expect(result.current.title).toBe('New Title')
  })

  it('文書をリロードできる', async () => {
    const { result } = renderHook(() => useDocumentEditor(documentId))

    // 初回読み込み完了まで待機
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // リロード実行
    await act(async () => {
      await result.current.reloadDocument()
    })

    // 読み込み完了を待つ
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2) // 初回 + リロード
    })
  })

  it('文書を元の状態にリセットできる', async () => {
    const { result } = renderHook(() => useDocumentEditor(documentId))

    // 読み込み完了まで待機
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // タイトルを変更
    act(() => {
      result.current.updateTitle('Changed Title')
    })

    expect(result.current.title).toBe('Changed Title')

    // リセット
    act(() => {
      result.current.resetDocument()
    })

    expect(result.current.title).toBe('Test Document') // 元のタイトルに戻る
    expect(mockBlockManager.resetBlocks).toHaveBeenCalled()
  })

  it('ブロック管理の関数が正しく転送される', async () => {
    const { result } = renderHook(() => useDocumentEditor(documentId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // ブロック操作関数が存在することを確認
    expect(typeof result.current.handleBlockUpdate).toBe('function')
    expect(typeof result.current.handleBlockDelete).toBe('function')
    expect(typeof result.current.handleAddBlock).toBe('function')
    expect(typeof result.current.handleMoveBlockUp).toBe('function')
    expect(typeof result.current.handleMoveBlockDown).toBe('function')
    expect(typeof result.current.handleDragEnd).toBe('function')

    // ブロック関連の状態が正しく転送される
    expect(result.current.blocks).toBe(mockBlockManager.blocks)
    expect(result.current.isEmpty).toBe(mockBlockManager.isEmpty)
    expect(result.current.hasMultipleBlocks).toBe(
      mockBlockManager.hasMultipleBlocks
    )
  })

  it('自動保存機能が統合される', async () => {
    const { result } = renderHook(() => useDocumentEditor(documentId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 自動保存関連の関数と状態が存在することを確認
    expect(typeof result.current.saveNow).toBe('function')
    expect(typeof result.current.hasUnsavedChanges).toBe('function')
    expect(typeof result.current.isSaving).toBe('boolean')
  })

  it('useBlockManagerが正しいパラメータで呼ばれる', async () => {
    renderHook(() => useDocumentEditor(documentId))

    // 初回読み込み完了を待つ
    await waitFor(() => {
      expect(useBlockManagerModule.useBlockManager).toHaveBeenCalledWith(
        [],
        documentId
      )
    })
  })

  it('useAutoSaveが正しいパラメータで呼ばれる', async () => {
    renderHook(() => useDocumentEditor(documentId))

    // 読み込み完了後にuseAutoSaveが適切に呼ばれることを確認
    await waitFor(() => {
      expect(useAutoSaveModule.useAutoSave).toHaveBeenCalled()
    })

    const mockUseAutoSave = useAutoSaveModule.useAutoSave as ReturnType<
      typeof vi.fn
    >
    const autoSaveCall = mockUseAutoSave.mock.calls[0]
    expect(autoSaveCall[0]).toBe(documentId)
    expect(typeof autoSaveCall[5]).toBe('function') // handleSaveSuccess callback
  })
})
