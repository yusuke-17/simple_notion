import type { PresignedURLResponse } from '$lib/types'

/**
 * MinIO署名付きURL関連のユーティリティ関数
 *
 * このファイルには、MinIOファイルアクセスに関する純粋関数を配置します。
 * - 署名付きURL取得API呼び出し
 * - ファイルメタデータ操作
 * - URLキャッシュ管理ヘルパー
 */

/**
 * ファイルIDから署名付きURLを取得する
 *
 * @param fileId - file_metadata.id
 * @returns MinIO署名付きURL（有効期限24時間）
 * @throws APIエラー時にエラーをスローします
 */
export const fetchPresignedURL = async (fileId: number): Promise<string> => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

  const response = await fetch(`${apiUrl}/api/files/${fileId}/url`, {
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
        `Failed to fetch presigned URL: ${response.statusText}`
    )
  }

  const data: PresignedURLResponse = await response.json()
  return data.url
}

/**
 * ファイルサイズを人間が読みやすい形式に変換する
 *
 * @param bytes - バイト数
 * @returns フォーマットされた文字列（例: "1.5 MB"）
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`
}

/**
 * MIMEタイプからファイルカテゴリを判定する
 *
 * @param mimeType - MIMEタイプ文字列
 * @returns ファイルカテゴリ（'image', 'pdf', 'document', 'spreadsheet', 'other'）
 */
export const getFileCategoryFromMimeType = (
  mimeType: string
): 'image' | 'pdf' | 'document' | 'spreadsheet' | 'other' => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (
    mimeType.includes('word') ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'document'
  }
  if (
    mimeType.includes('sheet') ||
    mimeType.includes('excel') ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return 'spreadsheet'
  }
  return 'other'
}

/**
 * ファイル拡張子からMIMEタイプを推測する
 *
 * @param filename - ファイル名
 * @returns MIMEタイプ文字列
 */
export const getMimeTypeFromFilename = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase()

  const mimeTypes: Record<string, string> = {
    // 画像
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',

    // ドキュメント
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

    // スプレッドシート
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

    // プレゼンテーション
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // テキスト
    txt: 'text/plain',
    csv: 'text/csv',

    // その他
    zip: 'application/zip',
    json: 'application/json',
  }

  return mimeTypes[extension || ''] || 'application/octet-stream'
}

/**
 * URLが署名付きURLかどうかを判定する
 *
 * @param url - チェック対象のURL文字列
 * @returns 署名付きURLの場合true
 */
export const isPresignedURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    // MinIO署名付きURLには X-Amz-Signature パラメータが含まれる
    return urlObj.searchParams.has('X-Amz-Signature')
  } catch {
    return false
  }
}

/**
 * 署名付きURLの有効期限を推定する（簡易版）
 *
 * @param url - 署名付きURL
 * @returns 有効期限のDateオブジェクト、または推定できない場合はnull
 */
export const estimatePresignedURLExpiration = (url: string): Date | null => {
  try {
    const urlObj = new URL(url)
    const expiresParam = urlObj.searchParams.get('X-Amz-Expires')
    const dateParam = urlObj.searchParams.get('X-Amz-Date')

    if (!expiresParam || !dateParam) return null

    // X-Amz-Date: YYYYMMDDTHHmmSSZ 形式
    const year = parseInt(dateParam.substring(0, 4))
    const month = parseInt(dateParam.substring(4, 6)) - 1
    const day = parseInt(dateParam.substring(6, 8))
    const hour = parseInt(dateParam.substring(9, 11))
    const minute = parseInt(dateParam.substring(11, 13))
    const second = parseInt(dateParam.substring(13, 15))

    const signedDate = new Date(
      Date.UTC(year, month, day, hour, minute, second)
    )
    const expiresSeconds = parseInt(expiresParam)

    return new Date(signedDate.getTime() + expiresSeconds * 1000)
  } catch {
    return null
  }
}

/**
 * 署名付きURLが期限切れかどうかをチェックする
 *
 * @param url - 署名付きURL
 * @param bufferMinutes - 期限切れ前のバッファ時間（分）デフォルト: 60分
 * @returns 期限切れの場合true
 */
export const isPresignedURLExpired = (
  url: string,
  bufferMinutes: number = 60
): boolean => {
  const expiration = estimatePresignedURLExpiration(url)
  if (!expiration) return false // 推定できない場合は期限切れとみなさない

  const now = new Date()
  const bufferMs = bufferMinutes * 60 * 1000

  return now.getTime() > expiration.getTime() - bufferMs
}
