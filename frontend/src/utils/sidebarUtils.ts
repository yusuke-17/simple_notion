import type { Document } from '@/types'

/**
 * Sidebar utilities - Pure functions for document management
 */

/**
 * Format document date for display
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
 * Validate document array response
 */
export const validateDocumentArray = (data: unknown): Document[] => {
  return Array.isArray(data) ? data : []
}

/**
 * Create document API request options
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
 * Create new document payload
 */
export const createNewDocumentPayload = () => ({
  title: 'Untitled',
  content: '',
  parentId: null,
})

/**
 * Handle API response safely
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
 * Document API endpoints
 */
export const DOCUMENT_API = {
  DOCUMENTS: '/api/documents',
  DELETED_DOCUMENTS: '/api/documents?deleted=true',
  DELETE_DOCUMENT: (id: number) => `/api/documents/${id}`,
  RESTORE_DOCUMENT: (id: number) => `/api/documents/${id}/restore`,
  PERMANENT_DELETE: (id: number) => `/api/documents/${id}/permanent`,
} as const

/**
 * Sidebar UI constants
 */
export const SIDEBAR_CONFIG = {
  WIDTH: 'w-64',
  EMPTY_TRASH_ICON_SIZE: 'h-12 w-12',
  DOC_HOVER_DEBOUNCE: 200,
} as const
