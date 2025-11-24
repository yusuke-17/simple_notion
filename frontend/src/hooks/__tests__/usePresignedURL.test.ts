import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import {
  usePresignedURL,
  usePresignedURLBatch,
  clearAllPresignedURLCache,
} from '../usePresignedURL'
import * as minioUtils from '@/utils/minioUtils'

// minioUtilsのモック
vi.mock('@/utils/minioUtils', () => ({
  fetchPresignedURL: vi.fn(),
  isPresignedURLExpired: vi.fn(),
}))

describe('usePresignedURL', () => {
  const mockPresignedURL =
    'https://minio.example.com/bucket/file.jpg?X-Amz-Signature=abc123'

  beforeEach(() => {
    vi.clearAllMocks()
    clearAllPresignedURLCache() // ✅ キャッシュをクリア
    vi.mocked(minioUtils.isPresignedURLExpired).mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初期状態では何も取得していない', () => {
    // Act
    const { result } = renderHook(() => usePresignedURL(null))

    // Assert
    expect(result.current.url).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fileIdが指定された場合に署名付きURLを取得する', async () => {
    // Arrange
    vi.mocked(minioUtils.fetchPresignedURL).mockResolvedValueOnce(
      mockPresignedURL
    )

    // Act
    const { result } = renderHook(() => usePresignedURL(123))

    // Assert - ローディング中
    expect(result.current.isLoading).toBe(true)

    // Assert - 取得完了
    await waitFor(() => {
      expect(result.current.url).toBe(mockPresignedURL)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    expect(minioUtils.fetchPresignedURL).toHaveBeenCalledWith(123)
    expect(minioUtils.fetchPresignedURL).toHaveBeenCalledTimes(1)
  })

  it('enabled=falseの場合は自動取得しない', () => {
    // Arrange
    vi.mocked(minioUtils.fetchPresignedURL).mockResolvedValueOnce(
      mockPresignedURL
    )

    // Act
    const { result } = renderHook(() =>
      usePresignedURL(123, { enabled: false })
    )

    // Assert
    expect(result.current.url).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(minioUtils.fetchPresignedURL).not.toHaveBeenCalled()
  })

  it('エラーが発生した場合にエラー状態を設定する', async () => {
    // Arrange
    const errorMessage = 'Failed to fetch presigned URL'
    vi.mocked(minioUtils.fetchPresignedURL).mockRejectedValueOnce(
      new Error(errorMessage)
    )

    // Act
    const { result } = renderHook(() => usePresignedURL(123))

    // Assert
    await waitFor(() => {
      expect(result.current.url).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  it('onSuccessコールバックが呼ばれる', async () => {
    // Arrange
    const onSuccess = vi.fn()
    vi.mocked(minioUtils.fetchPresignedURL).mockResolvedValueOnce(
      mockPresignedURL
    )

    // Act
    renderHook(() => usePresignedURL(123, { onSuccess }))

    // Assert
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockPresignedURL)
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('onErrorコールバックが呼ばれる', async () => {
    // Arrange
    const onError = vi.fn()
    const errorMessage = 'Failed to fetch presigned URL'
    vi.mocked(minioUtils.fetchPresignedURL).mockRejectedValueOnce(
      new Error(errorMessage)
    )

    // Act
    renderHook(() => usePresignedURL(123, { onError }))

    // Assert
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(errorMessage)
      expect(onError).toHaveBeenCalledTimes(1)
    })
  })

  it('refetch関数でキャッシュを無視して再取得できる', async () => {
    // Arrange
    const newURL =
      'https://minio.example.com/bucket/file.jpg?X-Amz-Signature=xyz789'
    vi.mocked(minioUtils.fetchPresignedURL)
      .mockResolvedValueOnce(mockPresignedURL)
      .mockResolvedValueOnce(newURL)

    // Act
    const { result } = renderHook(() => usePresignedURL(123))

    // 初回取得完了を待つ
    await waitFor(() => {
      expect(result.current.url).toBe(mockPresignedURL)
    })

    // refetch実行
    await act(async () => {
      await result.current.refetch()
    })

    // Assert
    await waitFor(() => {
      expect(result.current.url).toBe(newURL)
    })

    expect(minioUtils.fetchPresignedURL).toHaveBeenCalledTimes(2)
  })

  it('fileIdが変更された場合に再取得する', async () => {
    // Arrange
    const url1 =
      'https://minio.example.com/bucket/file1.jpg?X-Amz-Signature=abc'
    const url2 =
      'https://minio.example.com/bucket/file2.jpg?X-Amz-Signature=xyz'
    vi.mocked(minioUtils.fetchPresignedURL)
      .mockResolvedValueOnce(url1)
      .mockResolvedValueOnce(url2)

    // Act
    const { result, rerender } = renderHook(
      ({ fileId }) => usePresignedURL(fileId),
      { initialProps: { fileId: 123 } }
    )

    // 初回取得完了を待つ
    await waitFor(() => {
      expect(result.current.url).toBe(url1)
    })

    // fileIdを変更
    rerender({ fileId: 456 })

    // Assert
    await waitFor(() => {
      expect(result.current.url).toBe(url2)
    })

    expect(minioUtils.fetchPresignedURL).toHaveBeenCalledWith(123)
    expect(minioUtils.fetchPresignedURL).toHaveBeenCalledWith(456)
    expect(minioUtils.fetchPresignedURL).toHaveBeenCalledTimes(2)
  })
})

describe('usePresignedURLBatch', () => {
  const mockURL1 =
    'https://minio.example.com/bucket/file1.jpg?X-Amz-Signature=abc'
  const mockURL2 =
    'https://minio.example.com/bucket/file2.jpg?X-Amz-Signature=def'
  const mockURL3 =
    'https://minio.example.com/bucket/file3.jpg?X-Amz-Signature=ghi'

  beforeEach(() => {
    vi.clearAllMocks()
    clearAllPresignedURLCache() // ✅ キャッシュをクリア
    vi.mocked(minioUtils.isPresignedURLExpired).mockReturnValue(false)
  })

  it('複数のfileIdに対して署名付きURLを一括取得できる', async () => {
    // Arrange
    vi.mocked(minioUtils.fetchPresignedURL)
      .mockResolvedValueOnce(mockURL1)
      .mockResolvedValueOnce(mockURL2)
      .mockResolvedValueOnce(mockURL3)

    // Act
    const { result } = renderHook(() => usePresignedURLBatch([1, 2, 3]))

    // Assert
    await waitFor(() => {
      expect(result.current.urlMap.size).toBe(3)
      expect(result.current.urlMap.get(1)).toBe(mockURL1)
      expect(result.current.urlMap.get(2)).toBe(mockURL2)
      expect(result.current.urlMap.get(3)).toBe(mockURL3)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.errors.size).toBe(0)
    })
  })

  it('空の配列の場合は何も取得しない', () => {
    // Act
    const { result } = renderHook(() => usePresignedURLBatch([]))

    // Assert
    expect(result.current.urlMap.size).toBe(0)
    expect(result.current.isLoading).toBe(false)
    expect(minioUtils.fetchPresignedURL).not.toHaveBeenCalled()
  })

  it('一部のfileIdでエラーが発生した場合にエラーMapに記録する', async () => {
    // Arrange
    vi.mocked(minioUtils.fetchPresignedURL)
      .mockResolvedValueOnce(mockURL1)
      .mockRejectedValueOnce(new Error('File 2 not found'))
      .mockResolvedValueOnce(mockURL3)

    // Act
    const { result } = renderHook(() => usePresignedURLBatch([1, 2, 3]))

    // Assert
    await waitFor(() => {
      expect(result.current.urlMap.size).toBe(2)
      expect(result.current.urlMap.get(1)).toBe(mockURL1)
      expect(result.current.urlMap.get(3)).toBe(mockURL3)
      expect(result.current.errors.size).toBe(1)
      expect(result.current.errors.get(2)).toBe('File 2 not found')
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('refetchAll関数で全てのURLを再取得できる', async () => {
    // Arrange
    const newURL1 =
      'https://minio.example.com/bucket/file1-new.jpg?X-Amz-Signature=aaa'
    const newURL2 =
      'https://minio.example.com/bucket/file2-new.jpg?X-Amz-Signature=bbb'

    vi.mocked(minioUtils.fetchPresignedURL)
      .mockResolvedValueOnce(mockURL1)
      .mockResolvedValueOnce(mockURL2)
      .mockResolvedValueOnce(newURL1)
      .mockResolvedValueOnce(newURL2)

    // Act
    const { result } = renderHook(() => usePresignedURLBatch([1, 2]))

    // 初回取得完了を待つ
    await waitFor(() => {
      expect(result.current.urlMap.size).toBe(2)
    })

    // refetchAll実行
    await act(async () => {
      await result.current.refetchAll()
    })

    // Assert
    await waitFor(() => {
      expect(result.current.urlMap.get(1)).toBe(newURL1)
      expect(result.current.urlMap.get(2)).toBe(newURL2)
    })

    expect(minioUtils.fetchPresignedURL).toHaveBeenCalledTimes(4)
  })
})
