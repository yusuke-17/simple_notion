import type { FileUploadResponse, UploadError } from '$lib/types'

// サポートするファイル形式
export const ALLOWED_FILE_TYPES = [
  // PDF
  'application/pdf',
  // Microsoft Office (新形式)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  // Microsoft Office (旧形式)
  'application/msword', // .doc
  'application/vnd.ms-excel', // .xls
  'application/vnd.ms-powerpoint', // .ppt
  // テキストファイル
  'text/plain', // .txt
  // 圧縮ファイル
  'application/zip', // .zip
  'application/x-rar-compressed', // .rar
  'application/x-7z-compressed', // .7z
  'application/x-tar', // .tar
  'application/gzip', // .gz
  // その他
  'application/json', // .json
  'text/csv', // .csv
  'application/xml', // .xml
  'text/xml', // .xml
  'application/rtf', // .rtf
]

// ファイル拡張子とMIMEタイプのマッピング
export const FILE_EXTENSION_TO_MIME: Record<string, string> = {
  // PDF
  pdf: 'application/pdf',
  // Microsoft Office (新形式)
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Microsoft Office (旧形式)
  doc: 'application/msword',
  xls: 'application/vnd.ms-excel',
  ppt: 'application/vnd.ms-powerpoint',
  // テキストファイル
  txt: 'text/plain',
  // 圧縮ファイル
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  // その他
  json: 'application/json',
  csv: 'text/csv',
  xml: 'application/xml',
  rtf: 'application/rtf',
}

// 最大ファイルサイズ (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * ファイルの検証
 * @param file - 検証するファイル
 * @returns 検証結果 { isValid, error }
 */
export const validateFile = (
  file: File
): { isValid: boolean; error?: string } => {
  // ファイルサイズチェック
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `ファイルサイズが大きすぎます（最大${MAX_FILE_SIZE / 1024 / 1024}MB）`,
    }
  }

  // MIMEタイプチェック
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    // 拡張子からMIMEタイプを推測
    const extension = file.name.split('.').pop()?.toLowerCase()
    const mimeType = extension ? FILE_EXTENSION_TO_MIME[extension] : undefined

    if (!mimeType || !ALLOWED_FILE_TYPES.includes(mimeType)) {
      return {
        isValid: false,
        error: 'サポートされていないファイル形式です',
      }
    }
  }

  return { isValid: true }
}

/**
 * ファイルをサーバーにアップロード
 * @param file - アップロードするファイル
 * @returns アップロード結果
 */
export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  try {
    // ファイル検証
    const validation = validateFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error || 'ファイルの検証に失敗しました')
    }

    // FormDataの作成
    const formData = new FormData()
    formData.append('file', file)

    // API エンドポイント
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

    // アップロードリクエスト
    const response = await fetch(`${apiUrl}/api/upload/file`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Cookie認証のため
    })

    if (!response.ok) {
      const errorData = (await response.json()) as UploadError
      throw new Error(errorData.message || 'アップロードに失敗しました')
    }

    const data = (await response.json()) as FileUploadResponse

    // MIMEタイプとファイルサイズを追加
    return {
      ...data,
      mimeType: file.type,
      fileSize: file.size,
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 * @param bytes - バイト数
 * @returns フォーマットされたファイルサイズ文字列
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * MIMEタイプからファイルタイプの表示名を取得
 * @param mimeType - MIMEタイプ
 * @returns ファイルタイプの表示名
 */
export const getFileTypeName = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'Word',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      'Excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'PowerPoint',
    'application/msword': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'text/plain': 'テキスト',
    'application/zip': 'ZIP',
    'application/x-rar-compressed': 'RAR',
    'application/x-7z-compressed': '7-Zip',
    'application/x-tar': 'TAR',
    'application/gzip': 'GZIP',
    'application/json': 'JSON',
    'text/csv': 'CSV',
    'application/xml': 'XML',
    'text/xml': 'XML',
    'application/rtf': 'RTF',
  }

  return typeMap[mimeType] || 'ファイル'
}

/**
 * MIMEタイプからファイルアイコンのクラス名を取得（Lucide Reactアイコン用）
 * @param mimeType - MIMEタイプ
 * @returns アイコン名
 */
export const getFileIconName = (mimeType: string): string => {
  // PDF
  if (mimeType === 'application/pdf') return 'FileText'

  // Word
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return 'FileText'
  }

  // Excel
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'text/csv'
  ) {
    return 'FileSpreadsheet'
  }

  // PowerPoint
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) {
    return 'FilePresentation'
  }

  // 圧縮ファイル
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-7z-compressed' ||
    mimeType === 'application/x-tar' ||
    mimeType === 'application/gzip'
  ) {
    return 'FileArchive'
  }

  // テキスト・コード
  if (
    mimeType === 'text/plain' ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml' ||
    mimeType === 'text/xml'
  ) {
    return 'FileCode'
  }

  // デフォルト
  return 'File'
}

/**
 * ファイル拡張子を取得
 * @param filename - ファイル名
 * @returns 拡張子（小文字、ドットなし）
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
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
class FileUploadSpeedCalculator {
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
 * XMLHttpRequestを使った進捗付きファイルアップロード（リトライ・キャンセル対応）
 */
export const uploadFileWithProgress = (
  file: File,
  callbacks?: import('$lib/types').UploadCallbacks,
  retryConfig?: import('$lib/types').RetryConfig
): import('$lib/types').UploadController => {
  const validation = validateFile(file)
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

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

  const attemptUpload = () => {
    xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    const speedCalculator = new FileUploadSpeedCalculator()

    // 進捗イベント
    xhr.upload.addEventListener('progress', event => {
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
          const response: FileUploadResponse = JSON.parse(xhr!.responseText)
          // MIMEタイプとファイルサイズを追加
          const enhancedResponse = {
            ...response,
            mimeType: file.type,
            fileSize: file.size,
          }
          callbacks?.onSuccess?.(enhancedResponse)
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
            `File upload failed, retrying in ${delay}ms (attempt ${currentRetry}/${maxRetries})`
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
    xhr.open('POST', `${apiUrl}/api/upload/file`)
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

/**
 * Promise形式の進捗付きファイルアップロード（async/await用）
 */
export const uploadFileWithProgressPromise = (
  file: File,
  onProgress?: (progress: import('$lib/types').UploadProgressInfo) => void,
  retryConfig?: import('$lib/types').RetryConfig
): Promise<FileUploadResponse> & { abort: () => void } => {
  let controller: import('$lib/types').UploadController | null = null

  const promise = new Promise<FileUploadResponse>((resolve, reject) => {
    controller = uploadFileWithProgress(
      file,
      {
        onProgress,
        onSuccess: resolve as (
          response: import('$lib/types').UploadResponse
        ) => void,
        onError: reject,
        onAbort: () => reject(new Error('アップロードがキャンセルされました')),
      },
      retryConfig
    )
  }) as Promise<FileUploadResponse> & { abort: () => void }

  // abort メソッドを追加
  promise.abort = () => {
    controller?.abort()
  }

  return promise
}
