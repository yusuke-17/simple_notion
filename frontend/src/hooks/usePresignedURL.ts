import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { fetchPresignedURL, isPresignedURLExpired } from '@/utils/minioUtils'

/**
 * 署名付きURLキャッシュエントリ
 */
interface CachedURLEntry {
  url: string
  fetchedAt: Date
  fileId: number
}

/**
 * usePresignedURL フックの返り値型
 */
export interface UsePresignedURLReturn {
  // 状態
  url: string | null
  isLoading: boolean
  error: string | null

  // アクション
  refetch: () => Promise<void>
  clearCache: () => void
}

/**
 * グローバルURLキャッシュ（コンポーネント間で共有）
 * キー: fileId, 値: CachedURLEntry
 */
const urlCache = new Map<number, CachedURLEntry>()

/**
 * キャッシュの有効期限（ミリ秒）
 * デフォルト: 23時間（Backendの署名付きURLの有効期限24時間よりも1時間短い）
 */
const CACHE_EXPIRATION_MS = 23 * 60 * 60 * 1000

/**
 * グローバルキャッシュをクリアする（テスト用）
 * @internal
 */
export const clearAllPresignedURLCache = (): void => {
  urlCache.clear()
}

/**
 * キャッシュエントリが期限切れかどうかをチェック
 *
 * @param entry - キャッシュエントリ
 * @returns 期限切れの場合true
 */
const isCacheExpired = (entry: CachedURLEntry): boolean => {
  const now = new Date().getTime()
  const fetchedTime = entry.fetchedAt.getTime()
  const isTimeExpired = now - fetchedTime > CACHE_EXPIRATION_MS

  // 時間ベースの期限切れチェック
  if (isTimeExpired) return true

  // URL自体の署名期限もチェック
  return isPresignedURLExpired(entry.url, 60) // 60分のバッファ
}

/**
 * usePresignedURL - 署名付きURL取得とキャッシュ管理Hook
 *
 * MinIOファイルにアクセスするための署名付きURLを取得し、
 * キャッシュで管理することで不要なAPI呼び出しを削減します。
 *
 * 【使用例】
 * ```tsx
 * const { url, isLoading, error, refetch } = usePresignedURL(fileId)
 *
 * if (isLoading) return <div>読み込み中...</div>
 * if (error) return <div>エラー: {error}</div>
 * if (url) return <img src={url} alt="画像" />
 * ```
 *
 * @param fileId - file_metadata.id（null/undefinedの場合は取得しない）
 * @param options - オプション設定
 * @param options.enabled - 自動取得を有効化（デフォルト: true）
 * @param options.onSuccess - 取得成功時のコールバック
 * @param options.onError - エラー発生時のコールバック
 * @returns 署名付きURL、ローディング状態、エラー、再取得関数
 */
export const usePresignedURL = (
  fileId: number | null | undefined,
  options: {
    enabled?: boolean
    onSuccess?: (url: string) => void
    onError?: (error: string) => void
  } = {}
): UsePresignedURLReturn => {
  const { enabled = true, onSuccess, onError } = options

  const [url, setUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // コールバック関数の安定した参照を保持
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [onSuccess, onError])

  /**
   * 署名付きURLを取得する（キャッシュを利用）
   */
  const fetchURL = useCallback(async () => {
    if (!fileId) {
      setUrl(null)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // キャッシュチェック
      const cached = urlCache.get(fileId)
      if (cached && !isCacheExpired(cached)) {
        setUrl(cached.url)
        setIsLoading(false)
        onSuccessRef.current?.(cached.url)
        return
      }

      // API呼び出し
      const presignedURL = await fetchPresignedURL(fileId)

      // キャッシュに保存
      urlCache.set(fileId, {
        url: presignedURL,
        fetchedAt: new Date(),
        fileId,
      })

      setUrl(presignedURL)
      onSuccessRef.current?.(presignedURL)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '署名付きURLの取得に失敗しました'
      setError(errorMessage)
      onErrorRef.current?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [fileId])

  /**
   * キャッシュをクリアする
   */
  const clearCache = useCallback(() => {
    if (fileId) {
      urlCache.delete(fileId)
    }
  }, [fileId])

  /**
   * 強制的に再取得する（キャッシュを無視）
   */
  const refetch = useCallback(async () => {
    if (fileId) {
      urlCache.delete(fileId) // キャッシュを削除
    }
    await fetchURL()
  }, [fileId, fetchURL])

  // 初回マウント時 & fileId変更時に自動取得
  useEffect(() => {
    if (enabled && fileId) {
      fetchURL()
    }
  }, [fileId, enabled, fetchURL])

  return {
    url,
    isLoading,
    error,
    refetch,
    clearCache,
  }
}

/**
 * 複数のファイルIDに対して署名付きURLを一括取得するHook
 *
 * @param fileIds - ファイルIDの配列
 * @returns ファイルIDをキーとするURL Map
 */
export const usePresignedURLBatch = (
  fileIds: number[]
): {
  urlMap: Map<number, string>
  isLoading: boolean
  errors: Map<number, string>
  refetchAll: () => Promise<void>
} => {
  const [urlMap, setUrlMap] = useState<Map<number, string>>(new Map())
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<Map<number, string>>(new Map())

  // fileIdsを文字列化して比較用のキーとする（数値順にソート）
  const fileIdsKey = useMemo(
    () => [...fileIds].sort((a, b) => a - b).join(','),
    [fileIds]
  )

  const fetchAllURLs = useCallback(async () => {
    if (fileIds.length === 0) {
      setUrlMap(new Map())
      setErrors(new Map())
      return
    }

    setIsLoading(true)
    const newUrlMap = new Map<number, string>()
    const newErrors = new Map<number, string>()

    await Promise.all(
      fileIds.map(async fileId => {
        try {
          // キャッシュチェック
          const cached = urlCache.get(fileId)
          if (cached && !isCacheExpired(cached)) {
            newUrlMap.set(fileId, cached.url)
            return
          }

          // API呼び出し
          const url = await fetchPresignedURL(fileId)
          urlCache.set(fileId, {
            url,
            fetchedAt: new Date(),
            fileId,
          })
          newUrlMap.set(fileId, url)
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : '署名付きURLの取得に失敗しました'
          newErrors.set(fileId, errorMessage)
        }
      })
    )

    setUrlMap(newUrlMap)
    setErrors(newErrors)
    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileIdsKey]) // ✅ fileIdsKeyのみに依存（fileIdsの内容が変わった時だけ再生成）

  const refetchAll = useCallback(async () => {
    // 全てのキャッシュをクリア
    fileIds.forEach(fileId => urlCache.delete(fileId))
    await fetchAllURLs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileIdsKey, fetchAllURLs]) // ✅ fileIdsKeyを使用

  useEffect(() => {
    fetchAllURLs()
  }, [fetchAllURLs]) // ✅ fetchAllURLsのみに依存（fileIdsKeyが変わると自動的に変わる）

  return {
    urlMap,
    isLoading,
    errors,
    refetchAll,
  }
}
