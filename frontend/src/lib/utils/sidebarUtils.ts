import type { Document } from '$lib/types'

/**
 * サイドバーユーティリティ - ドキュメント管理のための純粋関数
 */

/**
 * 表示用にドキュメントの日付をフォーマットする
 */
export const formatDocumentDate = (updatedAt: string): string => {
  if (!updatedAt) return 'No date'

  const date = new Date(updatedAt)
  return isNaN(date.getTime())
    ? 'Invalid date'
    : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
}

/**
 * ドキュメント配列レスポンスを検証する
 */
export const validateDocumentArray = (data: unknown): Document[] => {
  return Array.isArray(data) ? data : []
}

/**
 * ドキュメントAPIリクエストオプションを作成する
 */
export const createDocumentApiOptions = (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: object
): RequestInit => {
  const options: RequestInit = {
    method,
    credentials: 'include' as RequestCredentials,
  }

  if (body) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  return options
}

/**
 * 新しいドキュメントペイロードを作成する
 */
export const createNewDocumentPayload = () => ({
  title: 'Untitled',
  content: '',
  parentId: null,
})

/**
 * APIレスポンスを安全に処理する
 */
export const handleApiResponse = async <T>(
  response: Response
): Promise<T | null> => {
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    )
  }

  try {
    return await response.json()
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to parse JSON response:', error)
    }
    return null
  }
}

/**
 * ドキュメントAPIエンドポイント
 */
export const DOCUMENT_API = {
  DOCUMENTS: '/api/documents',
  DELETED_DOCUMENTS: '/api/documents?deleted=true',
  DELETE_DOCUMENT: (id: number) => `/api/documents/${id}`,
  RESTORE_DOCUMENT: (id: number) => `/api/documents/${id}/restore`,
  PERMANENT_DELETE: (id: number) => `/api/documents/${id}/permanent`,
} as const

/**
 * サイドバーUI定数
 */
export const SIDEBAR_CONFIG = {
  WIDTH: 'w-64',
  EMPTY_TRASH_ICON_SIZE: 'h-12 w-12',
  DOC_HOVER_DEBOUNCE: 200,
} as const
