import type { Document, Block } from '@/types'

/**
 * Document operation utilities - Pure functions for document manipulation
 */

/**
 * Document with blocks type for the editor
 */
export interface DocumentWithBlocks extends Document {
  blocks?: Block[]
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
  const blocksChanged =
    JSON.stringify(currentBlocks) !== JSON.stringify(originalBlocks)

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
  const orderedBlocks = blocks.map((block, index) => ({
    ...block,
    position: index,
    documentId: documentId,
  }))

  return {
    title: title || 'Untitled',
    content: blocks.map(block => block.content).join('\n'), // Legacy content field
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
