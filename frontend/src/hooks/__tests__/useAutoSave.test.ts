import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { MockedFunction } from 'vitest'
import { useAutoSave } from '../useAutoSave'
import type { Block } from '@/types'

// fetch のモック
global.fetch = vi.fn()
const mockFetch = fetch as MockedFunction<typeof fetch>

// window.dispatchEvent のモック
const mockDispatchEvent = vi.fn()
Object.defineProperty(window, 'dispatchEvent', {
  writable: true,
  value: mockDispatchEvent,
})

// タイマーのモック
vi.useFakeTimers()

const mockBlocks: Block[] = [
  {
    id: 1,
    type: 'text',
    content: 'Test content',
    position: 0,
    documentId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

const mockOriginalBlocks: Block[] = [
  {
    id: 1,
    type: 'text',
    content: 'Original content',
    position: 0,
    documentId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

describe('useAutoSave', () => {
  const mockOnSaveSuccess = vi.fn()
  const documentId = 1
  const title = 'Test Document'
  const originalTitle = 'Original Title'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: documentId,
        title,
        blocks: mockBlocks,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z',
      }),
    } as Response)
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.useFakeTimers()
  })

  it('初期状態では保存中ではない', () => {
    const { result } = renderHook(() =>
      useAutoSave(
        documentId,
        title,
        mockBlocks,
        originalTitle,
        mockOriginalBlocks,
        mockOnSaveSuccess
      )
    )

    expect(result.current.isSaving).toBe(false)
  })

  it('変更がない場合は保存されない', async () => {
    const sameBlocks = [...mockOriginalBlocks]
    const sameTitle = originalTitle

    renderHook(() =>
      useAutoSave(
        documentId,
        sameTitle,
        sameBlocks,
        originalTitle,
        mockOriginalBlocks,
        mockOnSaveSuccess
      )
    )

    // デバウンス時間を経過させる
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('内容が変更された場合は自動保存される', async () => {
    const { rerender } = renderHook(
      props =>
        useAutoSave(
          documentId,
          props.title,
          props.blocks,
          props.originalTitle,
          props.originalBlocks,
          mockOnSaveSuccess
        ),
      {
        initialProps: {
          title: originalTitle,
          blocks: mockOriginalBlocks,
          originalTitle,
          originalBlocks: mockOriginalBlocks,
        },
      }
    )

    // 内容を変更してフックを再レンダリング
    rerender({
      title,
      blocks: mockBlocks,
      originalTitle,
      originalBlocks: mockOriginalBlocks,
    })

    // タイマーを動作させる
    await act(async () => {
      vi.runAllTimers()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockOnSaveSuccess).toHaveBeenCalledTimes(1)
  })

  it('saveNow で即座に保存できる', async () => {
    const { result } = renderHook(() =>
      useAutoSave(
        documentId,
        title,
        mockBlocks,
        originalTitle,
        mockOriginalBlocks,
        mockOnSaveSuccess
      )
    )

    await act(async () => {
      await result.current.saveNow()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockOnSaveSuccess).toHaveBeenCalledTimes(1)
  })

  it('hasUnsavedChanges で変更があるかどうか判定できる', () => {
    // 変更がある場合
    const { result: resultWithChanges } = renderHook(() =>
      useAutoSave(
        documentId,
        title, // 変更されたタイトル
        mockBlocks,
        originalTitle,
        mockOriginalBlocks,
        mockOnSaveSuccess
      )
    )

    expect(resultWithChanges.current.hasUnsavedChanges()).toBe(true)

    // 変更がない場合
    const { result: resultWithoutChanges } = renderHook(() =>
      useAutoSave(
        documentId,
        originalTitle, // 変更なし
        mockOriginalBlocks, // 変更なし
        originalTitle,
        mockOriginalBlocks,
        mockOnSaveSuccess
      )
    )

    expect(resultWithoutChanges.current.hasUnsavedChanges()).toBe(false)
  })

  it('連続した変更は適切にデバウンスされる', async () => {
    const { rerender } = renderHook(
      props =>
        useAutoSave(
          documentId,
          props.title,
          props.blocks,
          props.originalTitle,
          props.originalBlocks,
          mockOnSaveSuccess
        ),
      {
        initialProps: {
          title: 'First change',
          blocks: mockBlocks,
          originalTitle,
          originalBlocks: mockOriginalBlocks,
        },
      }
    )

    // 短時間で複数回変更
    rerender({
      title: 'Second change',
      blocks: mockBlocks,
      originalTitle,
      originalBlocks: mockOriginalBlocks,
    })
    vi.advanceTimersByTime(500)

    rerender({
      title: 'Third change',
      blocks: mockBlocks,
      originalTitle,
      originalBlocks: mockOriginalBlocks,
    })
    vi.advanceTimersByTime(500)

    rerender({
      title: 'Final change',
      blocks: mockBlocks,
      originalTitle,
      originalBlocks: mockOriginalBlocks,
    })

    // デバウンス時間を完全に経過
    await act(async () => {
      vi.runAllTimers()
    })

    // 最後の変更のみが保存される
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('保存中の重複リクエストは防がれる', async () => {
    const { result } = renderHook(() =>
      useAutoSave(
        documentId,
        title,
        mockBlocks,
        originalTitle,
        mockOriginalBlocks,
        mockOnSaveSuccess
      )
    )

    // 遅いレスポンスをシミュレート
    mockFetch.mockImplementationOnce(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  id: documentId,
                  title,
                  blocks: mockBlocks,
                }),
              } as Response),
            1000
          )
        )
    )

    // 複数回同時に保存を試行
    const promises = [
      result.current.saveNow(),
      result.current.saveNow(),
      result.current.saveNow(),
    ]

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    await act(async () => {
      await Promise.all(promises)
    })

    // 1回のみ実行される
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('保存エラーが適切に処理される', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() =>
      useAutoSave(
        documentId,
        title,
        mockBlocks,
        originalTitle,
        mockOriginalBlocks,
        mockOnSaveSuccess
      )
    )

    await expect(result.current.saveNow()).rejects.toThrow('Network error')
    expect(mockOnSaveSuccess).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('APIレスポンスが正しい形式でリクエストされる', async () => {
    const { result } = renderHook(() =>
      useAutoSave(
        documentId,
        title,
        mockBlocks,
        originalTitle,
        mockOriginalBlocks,
        mockOnSaveSuccess
      )
    )

    await act(async () => {
      await result.current.saveNow()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/documents/${documentId}`),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining(title),
      })
    )
  })
})
