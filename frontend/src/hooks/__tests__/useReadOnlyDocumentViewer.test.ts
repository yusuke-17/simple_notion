import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useReadOnlyDocumentViewer } from '../useReadOnlyDocumentViewer'

// documentUtils をモック
vi.mock('@/utils/documentUtils', () => ({
  createDocumentRequestOptions: vi.fn(() => ({ method: 'GET' })),
  handleApiResponse: vi.fn(),
  getDocumentApiEndpoint: vi.fn((id: number) => `/api/documents/${id}`),
  getDocumentApiEndpointIncludingDeleted: vi.fn(
    (id: number) => `/api/documents/${id}?includeDeleted=true`
  ),
  sortBlocksByPosition: vi.fn(blocks => blocks),
}))

// fetch をモック
global.fetch = vi.fn()

describe('useReadOnlyDocumentViewer', () => {
  const mockDocument = {
    id: 1,
    title: 'Test Document',
    content: 'Test content',
    parentId: null,
    userId: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    blocks: [
      {
        id: 1,
        type: 'text',
        content: 'Test block',
        documentId: 1,
        position: 0,
        createdAt: '2023-01-01T00:00:00Z',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // console.errorをモック化してエラーログを抑制
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初期状態を正しく設定する', async () => {
    const { handleApiResponse } = await import('@/utils/documentUtils')
    vi.mocked(handleApiResponse).mockResolvedValue(mockDocument)
    vi.mocked(fetch).mockResolvedValue(new Response())

    const { result } = renderHook(() => useReadOnlyDocumentViewer(1))

    expect(result.current.document).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.isReady).toBe(false)
  })

  it('ドキュメントを正常に読み込む', async () => {
    const { handleApiResponse, sortBlocksByPosition } = await import(
      '@/utils/documentUtils'
    )
    vi.mocked(handleApiResponse).mockResolvedValue(mockDocument)
    vi.mocked(sortBlocksByPosition).mockReturnValue(mockDocument.blocks)
    vi.mocked(fetch).mockResolvedValue(new Response())

    const { result } = renderHook(() => useReadOnlyDocumentViewer(1))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.document).toEqual(mockDocument)
    expect(result.current.error).toBeNull()
    expect(result.current.isEmpty).toBe(false)
    expect(result.current.isReady).toBe(true)
  })

  it('ブロックがない場合でもドキュメントを正常に読み込む', async () => {
    const documentWithoutBlocks = {
      ...mockDocument,
      blocks: [],
    }

    const { handleApiResponse } = await import('@/utils/documentUtils')
    vi.mocked(handleApiResponse).mockResolvedValue(documentWithoutBlocks)
    vi.mocked(fetch).mockResolvedValue(new Response())

    const { result } = renderHook(() => useReadOnlyDocumentViewer(1))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.document).toEqual(documentWithoutBlocks)
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.isReady).toBe(true)
  })

  it('undefined ブロックの場合でもドキュメントを正常に読み込む', async () => {
    const documentWithUndefinedBlocks = {
      ...mockDocument,
      blocks: undefined,
    }

    const { handleApiResponse } = await import('@/utils/documentUtils')
    vi.mocked(handleApiResponse).mockResolvedValue(documentWithUndefinedBlocks)
    vi.mocked(fetch).mockResolvedValue(new Response())

    const { result } = renderHook(() => useReadOnlyDocumentViewer(1))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.document).toEqual(documentWithUndefinedBlocks)
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.isReady).toBe(true)
  })

  it('API エラーを正しく処理する', async () => {
    const mockError = new Error('Failed to load document')
    const { handleApiResponse } = await import('@/utils/documentUtils')
    vi.mocked(handleApiResponse).mockRejectedValue(mockError)
    vi.mocked(fetch).mockResolvedValue(new Response())

    const { result } = renderHook(() => useReadOnlyDocumentViewer(1))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.document).toBeNull()
    expect(result.current.error).toBe('Failed to load document')
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.isReady).toBe(false)
  })

  it('一般的なエラーを正しく処理する', async () => {
    const { handleApiResponse } = await import('@/utils/documentUtils')
    vi.mocked(handleApiResponse).mockRejectedValue('String error')
    vi.mocked(fetch).mockResolvedValue(new Response())

    const { result } = renderHook(() => useReadOnlyDocumentViewer(1))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.document).toBeNull()
    expect(result.current.error).toBe('Failed to load document')
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.isReady).toBe(false)
  })

  it('documentId が変更されたら再読み込みする', async () => {
    const { handleApiResponse } = await import('@/utils/documentUtils')
    vi.mocked(handleApiResponse).mockResolvedValue(mockDocument)
    vi.mocked(fetch).mockResolvedValue(new Response())

    const { result, rerender } = renderHook(
      ({ documentId }: { documentId: number }) =>
        useReadOnlyDocumentViewer(documentId),
      { initialProps: { documentId: 1 } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // fetch が1回呼ばれることを確認
    expect(fetch).toHaveBeenCalledTimes(1)

    // documentId を変更
    rerender({ documentId: 2 })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // fetch が再度呼ばれることを確認
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('ブロックの位置順ソートが正しく呼ばれる', async () => {
    const { handleApiResponse, sortBlocksByPosition } = await import(
      '@/utils/documentUtils'
    )
    vi.mocked(handleApiResponse).mockResolvedValue(mockDocument)
    vi.mocked(sortBlocksByPosition).mockReturnValue(mockDocument.blocks)
    vi.mocked(fetch).mockResolvedValue(new Response())

    const { result } = renderHook(() => useReadOnlyDocumentViewer(1))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(sortBlocksByPosition).toHaveBeenCalledWith(mockDocument.blocks)
  })

  it('正しいAPIエンドポイントとオプションでfetchを呼ぶ', async () => {
    const {
      createDocumentRequestOptions,
      getDocumentApiEndpointIncludingDeleted,
      handleApiResponse,
    } = await import('@/utils/documentUtils')

    const mockOptions = {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    }
    vi.mocked(createDocumentRequestOptions).mockReturnValue(mockOptions)
    vi.mocked(getDocumentApiEndpointIncludingDeleted).mockReturnValue(
      '/api/documents/1?includeDeleted=true'
    )
    vi.mocked(handleApiResponse).mockResolvedValue(mockDocument)
    vi.mocked(fetch).mockResolvedValue(new Response())

    renderHook(() => useReadOnlyDocumentViewer(1))

    await waitFor(() => {
      expect(createDocumentRequestOptions).toHaveBeenCalledWith('GET')
      expect(getDocumentApiEndpointIncludingDeleted).toHaveBeenCalledWith(1)
      expect(fetch).toHaveBeenCalledWith(
        '/api/documents/1?includeDeleted=true',
        mockOptions
      )
    })
  })
})
