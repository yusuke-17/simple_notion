import type { UploadResponse, UploadError } from '$lib/types'

/**
 * File upload utilities - Pure functions for handling file uploads
 */

/**
 * Upload configuration constants
 */
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ] as const,
  UPLOAD_ENDPOINT: '/api/upload/image',
} as const

/**
 * Validate uploaded file
 */
export const validateImageFile = (
  file: File
): { isValid: boolean; error?: string } => {
  // Check file type
  if (
    !(UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES as readonly string[]).includes(
      file.type
    )
  ) {
    return {
      isValid: false,
      error: `サポートされていないファイル形式です。${UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}のみアップロード可能です。`,
    }
  }

  // Check file size
  const maxSizeInBytes = UPLOAD_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `ファイルサイズが大きすぎます。${UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB以下のファイルをアップロードしてください。`,
    }
  }

  return { isValid: true }
}

/**
 * Convert bytes to human-readable format
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)

  // 整数の場合は小数点以下を表示しない
  if (value % 1 === 0) {
    return value.toString() + ' ' + sizes[i]
  }

  return value.toFixed(dm) + ' ' + sizes[i]
}

/**
 * バイト/秒を人間が読みやすい速度形式に変換
 */
export const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond === 0) return '0 B/s'

  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']

  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
  const value = bytesPerSecond / Math.pow(k, i)

  return value.toFixed(1) + ' ' + sizes[i]
}

/**
 * アップロード速度と残り時間を計算するヘルパークラス
 */
class UploadSpeedCalculator {
  private startTime: number
  private lastTime: number
  private lastLoaded: number
  private speeds: number[] = []
  private readonly maxSamples = 5 // 移動平均のサンプル数

  constructor() {
    this.startTime = Date.now()
    this.lastTime = this.startTime
    this.lastLoaded = 0
  }

  /**
   * 進捗情報を更新して速度と残り時間を計算
   */
  calculate(
    loaded: number,
    total: number
  ): import('$lib/types').UploadProgressInfo {
    const now = Date.now()
    const elapsed = (now - this.lastTime) / 1000 // 秒単位
    const loadedDiff = loaded - this.lastLoaded

    // 速度計算（バイト/秒）
    let speed = 0
    if (elapsed > 0) {
      speed = loadedDiff / elapsed

      // 移動平均で速度を平滑化
      this.speeds.push(speed)
      if (this.speeds.length > this.maxSamples) {
        this.speeds.shift()
      }
    }

    // 平均速度
    const avgSpeed =
      this.speeds.length > 0
        ? this.speeds.reduce((a, b) => a + b, 0) / this.speeds.length
        : 0

    // 残りバイト数
    const remaining = total - loaded

    // 残り時間（秒）
    const remainingTime = avgSpeed > 0 ? remaining / avgSpeed : 0

    // 進捗率
    const percentage = total > 0 ? (loaded / total) * 100 : 0

    // 人間が読みやすい残り時間
    const estimatedTimeRemaining = this.formatTime(remainingTime)

    // 次回計算用に更新
    this.lastTime = now
    this.lastLoaded = loaded

    return {
      loaded,
      total,
      percentage,
      speed: avgSpeed,
      remainingTime,
      estimatedTimeRemaining,
    }
  }

  /**
   * 秒数を人間が読みやすい形式に変換
   */
  private formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) {
      return '計算中...'
    }

    if (seconds < 1) {
      return '1秒未満'
    }

    if (seconds < 60) {
      return `約${Math.ceil(seconds)}秒`
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.ceil(seconds % 60)

    if (minutes < 60) {
      return remainingSeconds > 0
        ? `約${minutes}分${remainingSeconds}秒`
        : `約${minutes}分`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return remainingMinutes > 0
      ? `約${hours}時間${remainingMinutes}分`
      : `約${hours}時間`
  }
}

/**
 * XMLHttpRequestを使った進捗付き画像アップロード（リトライ・キャンセル対応）
 */
export const uploadImageFileWithProgress = (
  file: File,
  callbacks?: import('$lib/types').UploadCallbacks,
  retryConfig?: import('$lib/types').RetryConfig
): import('$lib/types').UploadController => {
  const validation = validateImageFile(file)
  if (!validation.isValid) {
    const error = new Error(validation.error || 'ファイルの検証に失敗しました')
    callbacks?.onError?.(error)
    // ダミーコントローラーを返す
    return {
      abort: () => {},
      xhr: new XMLHttpRequest(),
    }
  }

  let currentRetry = 0
  const maxRetries = retryConfig?.maxRetries ?? 3
  const retryDelay = retryConfig?.retryDelay ?? 1000
  const backoffMultiplier = retryConfig?.backoffMultiplier ?? 2

  let xhr: XMLHttpRequest | null = null
  let aborted = false

  const attemptUpload = () => {
    xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('image', file)

    const speedCalculator = new UploadSpeedCalculator()

    // 進捗イベント
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && callbacks?.onProgress) {
        const progressInfo = speedCalculator.calculate(
          event.loaded,
          event.total
        )
        callbacks.onProgress(progressInfo)
      }
    })

    // 完了イベント
    xhr.addEventListener('load', () => {
      if (xhr!.status >= 200 && xhr!.status < 300) {
        try {
          const response: UploadResponse = JSON.parse(xhr!.responseText)
          callbacks?.onSuccess?.(response)
        } catch {
          callbacks?.onError?.(new Error('レスポンスの解析に失敗しました'))
        }
      } else {
        // HTTPエラー
        let errorMessage = 'アップロードに失敗しました'
        try {
          const errorData: UploadError = JSON.parse(xhr!.responseText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // JSON解析失敗時はデフォルトメッセージを使用
        }

        // リトライ可能なエラーの場合
        if (
          !aborted &&
          currentRetry < maxRetries &&
          (xhr!.status === 0 || xhr!.status >= 500)
        ) {
          currentRetry++
          const delay =
            retryDelay * Math.pow(backoffMultiplier, currentRetry - 1)
          console.log(
            `Upload failed, retrying in ${delay}ms (attempt ${currentRetry}/${maxRetries})`
          )
          setTimeout(attemptUpload, delay)
        } else {
          callbacks?.onError?.(new Error(errorMessage))
        }
      }
    })

    // エラーイベント（ネットワークエラー等）
    xhr.addEventListener('error', () => {
      if (!aborted && currentRetry < maxRetries) {
        currentRetry++
        const delay = retryDelay * Math.pow(backoffMultiplier, currentRetry - 1)
        console.log(
          `Network error, retrying in ${delay}ms (attempt ${currentRetry}/${maxRetries})`
        )
        setTimeout(attemptUpload, delay)
      } else {
        callbacks?.onError?.(new Error('ネットワークエラーが発生しました'))
      }
    })

    // 中断イベント
    xhr.addEventListener('abort', () => {
      if (aborted) {
        callbacks?.onAbort?.()
      }
    })

    // アップロード開始
    xhr.open('POST', UPLOAD_CONFIG.UPLOAD_ENDPOINT)
    xhr.withCredentials = true // Cookie認証のため
    xhr.send(formData)
  }

  // 初回アップロード試行
  attemptUpload()

  // コントローラーを返す
  return {
    abort: () => {
      aborted = true
      xhr?.abort()
    },
    xhr: xhr!,
  }
}

