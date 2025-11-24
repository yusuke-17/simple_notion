import { useState, useEffect, useCallback } from 'react'
import type { UserStorageUsage } from '@/types'

/**
 * useStorageUsage フックの返り値型
 */
export interface UseStorageUsageReturn {
  // 状態
  usage: UserStorageUsage | null
  isLoading: boolean
  error: string | null

  // アクション
  refetch: () => Promise<void>

  // 計算されたプロパティ
  isNearQuota: boolean // 使用率80%以上
  isOverQuota: boolean // 使用率100%以上
  remainingBytes: number // 残り容量（バイト）
  remainingMb: number // 残り容量（MB）
  usagePercentage: number // 使用率（0-100）
}

/**
 * useStorageUsage - ストレージ使用量取得と管理Hook
 *
 * ユーザーのストレージ使用量を取得し、クォータとの比較や
 * 残り容量の計算など、ストレージ管理に必要な情報を提供します。
 *
 * 【使用例】
 * ```tsx
 * const { usage, isLoading, isNearQuota, usagePercentage } = useStorageUsage()
 *
 * if (isLoading) return <div>読み込み中...</div>
 * if (usage) {
 *   return (
 *     <div>
 *       <p>使用中: {usage.totalMb.toFixed(2)} MB / {usage.quotaMb} MB</p>
 *       <p>使用率: {usagePercentage}%</p>
 *       {isNearQuota && <p>⚠️ ストレージ容量が不足しています</p>}
 *     </div>
 *   )
 * }
 * ```
 *
 * @param options - オプション設定
 * @param options.enabled - 自動取得を有効化（デフォルト: true）
 * @param options.refetchInterval - 自動再取得間隔（ミリ秒、デフォルト: null = 自動更新なし）
 * @param options.onQuotaWarning - クォータ警告時のコールバック（使用率80%以上）
 * @param options.onQuotaExceeded - クォータ超過時のコールバック（使用率100%以上）
 * @returns ストレージ使用量、ローディング状態、エラー、再取得関数、計算されたプロパティ
 */
export const useStorageUsage = (
  options: {
    enabled?: boolean
    refetchInterval?: number | null
    onQuotaWarning?: (usage: UserStorageUsage) => void
    onQuotaExceeded?: (usage: UserStorageUsage) => void
  } = {}
): UseStorageUsageReturn => {
  const {
    enabled = true,
    refetchInterval = null,
    onQuotaWarning,
    onQuotaExceeded,
  } = options

  const [usage, setUsage] = useState<UserStorageUsage | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * ストレージ使用量を取得する
   */
  const fetchStorageUsage = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
      const response = await fetch(`${apiUrl}/api/storage/usage`, {
        method: 'GET',
        credentials: 'include', // 認証クッキーを含める
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message ||
            `Failed to fetch storage usage: ${response.statusText}`
        )
      }

      const data: UserStorageUsage = await response.json()
      setUsage(data)

      // クォータ警告チェック
      if (data.usageRate >= 80 && data.usageRate < 100) {
        onQuotaWarning?.(data)
      }

      // クォータ超過チェック
      if (data.usageRate >= 100) {
        onQuotaExceeded?.(data)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'ストレージ使用量の取得に失敗しました'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [onQuotaWarning, onQuotaExceeded])

  /**
   * 強制的に再取得する
   */
  const refetch = useCallback(async () => {
    await fetchStorageUsage()
  }, [fetchStorageUsage])

  // 初回マウント時に自動取得
  useEffect(() => {
    if (enabled) {
      fetchStorageUsage()
    }
  }, [enabled, fetchStorageUsage])

  // 定期的な自動再取得
  useEffect(() => {
    if (!enabled || !refetchInterval || refetchInterval <= 0) return

    const intervalId = setInterval(() => {
      fetchStorageUsage()
    }, refetchInterval)

    return () => clearInterval(intervalId)
  }, [enabled, refetchInterval, fetchStorageUsage])

  // 計算されたプロパティ
  const isNearQuota = usage ? usage.usageRate >= 80 : false
  const isOverQuota = usage ? usage.usageRate >= 100 : false
  const remainingBytes = usage ? usage.quotaBytes - usage.totalBytes : 0
  const remainingMb = usage ? usage.quotaMb - usage.totalMb : 0
  const usagePercentage = usage ? Math.min(Math.round(usage.usageRate), 100) : 0

  return {
    usage,
    isLoading,
    error,
    refetch,
    isNearQuota,
    isOverQuota,
    remainingBytes,
    remainingMb,
    usagePercentage,
  }
}

/**
 * ストレージ使用率に基づいてスタイルクラスを返すヘルパー関数
 *
 * @param usagePercentage - 使用率（0-100）
 * @returns Tailwind CSSクラス文字列
 */
export const getStorageUsageColorClass = (usagePercentage: number): string => {
  if (usagePercentage >= 100) return 'text-red-600'
  if (usagePercentage >= 90) return 'text-orange-600'
  if (usagePercentage >= 80) return 'text-yellow-600'
  return 'text-green-600'
}

/**
 * ストレージ使用率に基づいてプログレスバーの色を返すヘルパー関数
 *
 * @param usagePercentage - 使用率（0-100）
 * @returns Tailwind CSS背景色クラス文字列
 */
export const getStorageUsageProgressColor = (
  usagePercentage: number
): string => {
  if (usagePercentage >= 100) return 'bg-red-500'
  if (usagePercentage >= 90) return 'bg-orange-500'
  if (usagePercentage >= 80) return 'bg-yellow-500'
  return 'bg-green-500'
}

/**
 * ストレージ使用状況のメッセージを返すヘルパー関数
 *
 * @param usagePercentage - 使用率（0-100）
 * @returns ユーザーフレンドリーなメッセージ
 */
export const getStorageUsageMessage = (usagePercentage: number): string => {
  if (usagePercentage >= 100)
    return 'ストレージ容量が上限に達しています。ファイルを削除してください。'
  if (usagePercentage >= 90)
    return 'ストレージ容量がほぼ上限です。不要なファイルを削除することをお勧めします。'
  if (usagePercentage >= 80)
    return 'ストレージ容量が80%を超えています。ご注意ください。'
  return 'ストレージ容量は十分です。'
}
