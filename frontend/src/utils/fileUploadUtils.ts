import type { FileUploadResponse, UploadError } from '@/types'

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
