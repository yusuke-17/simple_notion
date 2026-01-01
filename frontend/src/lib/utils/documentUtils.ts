import type { Block } from '$lib/types'

/**
 * Document operation utilities - Pure functions for document manipulation
 */

/**
 * Normalize block content to string for consistent comparison
 */
const normalizeBlockContent = (content: Block['content']): string => {
  return typeof content === 'string' ? content : JSON.stringify(content)
}

/**
 * Check if document content has changed from original
 */
export const hasDocumentChanged = (
  currentTitle: string,
  currentBlocks: Block[],
  originalTitle: string,
  originalBlocks: Block[]
): boolean => {
  const titleChanged = currentTitle !== originalTitle

  // Normalize content for accurate comparison
  const normalizedCurrent = currentBlocks.map((block) => ({
    ...block,
    content: normalizeBlockContent(block.content),
  }))

  const normalizedOriginal = originalBlocks.map((block) => ({
    ...block,
    content: normalizeBlockContent(block.content),
  }))

  const blocksChanged =
    JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedOriginal)

  return titleChanged || blocksChanged
}

/**
 * Prepare document update payload
 */
export const prepareDocumentUpdatePayload = (
  title: string,
  blocks: Block[],
  documentId: number
) => {
  // Prepare blocks with proper order and document ID
  const orderedBlocks = blocks.map((block, index) => {
    // contentが既にオブジェクトの場合は文字列化する
    const content =
      typeof block.content === 'string'
        ? block.content
        : JSON.stringify(block.content)

    return {
      ...block,
      content,
      position: index,
      documentId: documentId,
    }
  })

  // Legacy content field: テキストブロックのcontentのみを結合
  // 画像やファイルブロックは除外
  const textBlocks = blocks.filter(
    (block) => block.type !== 'image' && block.type !== 'file'
  )
  const legacyContent =
    textBlocks.length > 0
      ? textBlocks
          .map((block) =>
            typeof block.content === 'string'
              ? block.content
              : JSON.stringify(block.content)
          )
          .join('\n')
      : '' // 空の場合は空文字列

  return {
    title: title || 'Untitled',
    content: legacyContent,
    blocks: orderedBlocks,
  }
}

/**
 * Sort blocks by position
 */
export const sortBlocksByPosition = (blocks: Block[]): Block[] => {
  return [...blocks].sort((a, b) => a.position - b.position)
}

/**
 * Validate document title
 */
export const validateDocumentTitle = (
  title: string
): { isValid: boolean; errorMessage?: string } => {
  if (!title || title.trim() === '') {
    return { isValid: false, errorMessage: 'Title cannot be empty' }
  }

  if (title.length > 200) {
    return {
      isValid: false,
      errorMessage: 'Title must be less than 200 characters',
    }
  }

  return { isValid: true }
}

/**
 * Create document API request options
 */
export const createDocumentRequestOptions = (
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
 * Handle API response and extract data
 */
export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}

/**
 * Generate document API endpoint
 */
export const getDocumentApiEndpoint = (documentId: number): string => {
  return `/api/documents/${documentId}`
}

/**
 * Get API endpoint for document including deleted ones
 */
export const getDocumentApiEndpointIncludingDeleted = (
  documentId: number
): string => {
  return `/api/documents/${documentId}?includeDeleted=true`
}

/**
 * Check if blocks need server update based on differences
 */
export const shouldUpdateBlocks = (
  serverBlocks: Block[],
  localBlocks: Block[]
): boolean => {
  return JSON.stringify(serverBlocks) !== JSON.stringify(localBlocks)
}

/**
 * Merge server blocks with local changes safely
 */
export const mergeBlocksFromServer = (
  serverBlocks: Block[],
  localBlocks: Block[]
): Block[] => {
  // If there are actual changes from server, use server blocks
  // Otherwise, keep local blocks to prevent cursor position issues
  if (shouldUpdateBlocks(serverBlocks, localBlocks)) {
    return sortBlocksByPosition(serverBlocks)
  }

  return localBlocks
}

/**
 * Create document save debounce delay (in milliseconds)
 */
export const SAVE_DEBOUNCE_DELAY = 500

/**
 * Default document title
 */
export const DEFAULT_DOCUMENT_TITLE = 'Untitled'

/**
 * Document API endpoints
 */
export const DOCUMENT_ENDPOINTS = {
  GET_DOCUMENTS: '/api/documents',
  CREATE_DOCUMENT: '/api/documents',
} as const
