import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import {
  useStorageUsage,
  getStorageUsageColorClass,
  getStorageUsageProgressColor,
  getStorageUsageMessage,
} from '../useStorageUsage'
import type { UserStorageUsage } from '@/types'

// fetch APIのモック
global.fetch = vi.fn()

describe('useStorageUsage', () => {
  const mockUsageData: UserStorageUsage = {
    userId: 1,
    fileCount: 10,
    totalBytes: 50 * 1024 * 1024, // 50 MB
    totalMb: 50,
    quotaBytes: 100 * 1024 * 1024, // 100 MB
    quotaMb: 100,
    usageRate: 50,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初期状態では何も取得していない', () => {
    // Act
    const { result } = renderHook(() => useStorageUsage({ enabled: false }))

    // Assert
    expect(result.current.usage).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('ストレージ使用量を正常に取得できる', async () => {
    // Arrange
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsageData,
    })

    // Act
    const { result } = renderHook(() => useStorageUsage())

    // Assert - ローディング中
    expect(result.current.isLoading).toBe(true)

    // Assert - 取得完了
    await waitFor(() => {
      expect(result.current.usage).toEqual(mockUsageData)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/storage/usage',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      })
    )
  })

  it('enabled=falseの場合は自動取得しない', () => {
    // Act
    const { result } = renderHook(() => useStorageUsage({ enabled: false }))

    // Assert
    expect(result.current.usage).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('APIエラー時にエラー状態を設定する', async () => {
    // Arrange
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Authentication required' }),
    })

    // Act
    const { result } = renderHook(() => useStorageUsage())

    // Assert
    await waitFor(() => {
      expect(result.current.usage).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Authentication required')
    })
  })

  it('ネットワークエラー時にエラー状態を設定する', async () => {
    // Arrange
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    )

    // Act
    const { result } = renderHook(() => useStorageUsage())

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })
  })

  it('計算されたプロパティが正しく動作する', async () => {
    // Arrange
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsageData,
    })

    // Act
    const { result } = renderHook(() => useStorageUsage())

    // Assert
    await waitFor(() => {
      expect(result.current.usagePercentage).toBe(50)
      expect(result.current.remainingBytes).toBe(50 * 1024 * 1024)
      expect(result.current.remainingMb).toBe(50)
      expect(result.current.isNearQuota).toBe(false)
      expect(result.current.isOverQuota).toBe(false)
    })
  })

  it('使用率80%以上の場合にisNearQuotaがtrueになる', async () => {
    // Arrange
    const highUsageData: UserStorageUsage = {
      ...mockUsageData,
      totalBytes: 85 * 1024 * 1024,
      totalMb: 85,
      usageRate: 85,
    }
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => highUsageData,
    })

    // Act
    const { result } = renderHook(() => useStorageUsage())

    // Assert
    await waitFor(() => {
      expect(result.current.isNearQuota).toBe(true)
      expect(result.current.isOverQuota).toBe(false)
    })
  })

  it('使用率100%以上の場合にisOverQuotaがtrueになる', async () => {
    // Arrange
    const overQuotaData: UserStorageUsage = {
      ...mockUsageData,
      totalBytes: 105 * 1024 * 1024,
      totalMb: 105,
      usageRate: 105,
    }
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => overQuotaData,
    })

    // Act
    const { result } = renderHook(() => useStorageUsage())

    // Assert
    await waitFor(() => {
      expect(result.current.isNearQuota).toBe(true)
      expect(result.current.isOverQuota).toBe(true)
    })
  })

  it('onQuotaWarningコールバックが使用率80%以上で呼ばれる', async () => {
    // Arrange
    const onQuotaWarning = vi.fn()
    const warningData: UserStorageUsage = {
      ...mockUsageData,
      totalBytes: 85 * 1024 * 1024,
      totalMb: 85,
      usageRate: 85,
    }
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => warningData,
    })

    // Act
    renderHook(() => useStorageUsage({ onQuotaWarning }))

    // Assert
    await waitFor(() => {
      expect(onQuotaWarning).toHaveBeenCalledWith(warningData)
      expect(onQuotaWarning).toHaveBeenCalledTimes(1)
    })
  })

  it('onQuotaExceededコールバックが使用率100%以上で呼ばれる', async () => {
    // Arrange
    const onQuotaExceeded = vi.fn()
    const exceededData: UserStorageUsage = {
      ...mockUsageData,
      totalBytes: 105 * 1024 * 1024,
      totalMb: 105,
      usageRate: 105,
    }
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => exceededData,
    })

    // Act
    renderHook(() => useStorageUsage({ onQuotaExceeded }))

    // Assert
    await waitFor(() => {
      expect(onQuotaExceeded).toHaveBeenCalledWith(exceededData)
      expect(onQuotaExceeded).toHaveBeenCalledTimes(1)
    })
  })

  it('refetch関数でストレージ使用量を再取得できる', async () => {
    // Arrange
    const updatedData: UserStorageUsage = {
      ...mockUsageData,
      totalBytes: 60 * 1024 * 1024,
      totalMb: 60,
      usageRate: 60,
    }
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsageData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedData,
      })

    // Act
    const { result } = renderHook(() => useStorageUsage())

    // 初回取得完了を待つ
    await waitFor(() => {
      expect(result.current.usage?.totalMb).toBe(50)
    })

    // refetch実行
    await act(async () => {
      await result.current.refetch()
    })

    // Assert
    await waitFor(() => {
      expect(result.current.usage?.totalMb).toBe(60)
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})

describe('getStorageUsageColorClass', () => {
  it('使用率に応じて正しい色クラスを返す', () => {
    expect(getStorageUsageColorClass(50)).toBe('text-green-600')
    expect(getStorageUsageColorClass(79)).toBe('text-green-600')
    expect(getStorageUsageColorClass(80)).toBe('text-yellow-600')
    expect(getStorageUsageColorClass(85)).toBe('text-yellow-600')
    expect(getStorageUsageColorClass(90)).toBe('text-orange-600')
    expect(getStorageUsageColorClass(95)).toBe('text-orange-600')
    expect(getStorageUsageColorClass(100)).toBe('text-red-600')
    expect(getStorageUsageColorClass(105)).toBe('text-red-600')
  })
})

describe('getStorageUsageProgressColor', () => {
  it('使用率に応じて正しい背景色クラスを返す', () => {
    expect(getStorageUsageProgressColor(50)).toBe('bg-green-500')
    expect(getStorageUsageProgressColor(79)).toBe('bg-green-500')
    expect(getStorageUsageProgressColor(80)).toBe('bg-yellow-500')
    expect(getStorageUsageProgressColor(85)).toBe('bg-yellow-500')
    expect(getStorageUsageProgressColor(90)).toBe('bg-orange-500')
    expect(getStorageUsageProgressColor(95)).toBe('bg-orange-500')
    expect(getStorageUsageProgressColor(100)).toBe('bg-red-500')
    expect(getStorageUsageProgressColor(105)).toBe('bg-red-500')
  })
})

describe('getStorageUsageMessage', () => {
  it('使用率に応じて正しいメッセージを返す', () => {
    expect(getStorageUsageMessage(50)).toBe('ストレージ容量は十分です。')
    expect(getStorageUsageMessage(79)).toBe('ストレージ容量は十分です。')
    expect(getStorageUsageMessage(80)).toBe(
      'ストレージ容量が80%を超えています。ご注意ください。'
    )
    expect(getStorageUsageMessage(85)).toBe(
      'ストレージ容量が80%を超えています。ご注意ください。'
    )
    expect(getStorageUsageMessage(90)).toBe(
      'ストレージ容量がほぼ上限です。不要なファイルを削除することをお勧めします。'
    )
    expect(getStorageUsageMessage(95)).toBe(
      'ストレージ容量がほぼ上限です。不要なファイルを削除することをお勧めします。'
    )
    expect(getStorageUsageMessage(100)).toBe(
      'ストレージ容量が上限に達しています。ファイルを削除してください。'
    )
    expect(getStorageUsageMessage(105)).toBe(
      'ストレージ容量が上限に達しています。ファイルを削除してください。'
    )
  })
})
