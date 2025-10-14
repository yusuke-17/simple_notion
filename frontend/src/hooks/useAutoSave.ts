import { useCallback, useEffect, useRef } from 'react'
import type { Block, DocumentWithBlocks } from '@/types'
import {
  hasDocumentChanged,
  prepareDocumentUpdatePayload,
  createDocumentRequestOptions,
  handleApiResponse,
  getDocumentApiEndpoint,
  SAVE_DEBOUNCE_DELAY,
} from '@/utils/documentUtils'

/**
 * Auto-save hook for document editor
 * Handles debounced saving when content changes
 */
export const useAutoSave = (
  documentId: number,
  title: string,
  blocks: Block[],
  originalTitle: string,
  originalBlocks: Block[],
  onSaveSuccess?: (updatedDocument: DocumentWithBlocks) => void
) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)

  /**
   * Save document to server
   */
  const saveDocument = useCallback(async () => {
    if (isSavingRef.current) return

    try {
      isSavingRef.current = true

      const payload = prepareDocumentUpdatePayload(title, blocks, documentId)
      const options = createDocumentRequestOptions('PUT', payload)

      const response = await fetch(getDocumentApiEndpoint(documentId), options)
      const updatedDoc = await handleApiResponse<DocumentWithBlocks>(response)

      // Trigger document list refresh
      window.dispatchEvent(new CustomEvent('document-updated'))

      if (onSaveSuccess) {
        onSaveSuccess(updatedDoc)
      }

      return updatedDoc
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to save document:', error)
      }
      throw error
    } finally {
      isSavingRef.current = false
    }
  }, [documentId, title, blocks, onSaveSuccess])

  /**
   * Debounced save effect
   */
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Check if content has changed from original
    const contentChanged = hasDocumentChanged(
      title,
      blocks,
      originalTitle,
      originalBlocks
    )

    if (contentChanged) {
      // Debounce save to avoid excessive API calls
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument()
      }, SAVE_DEBOUNCE_DELAY)
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, blocks, originalTitle, originalBlocks, saveDocument])

  /**
   * Manual save function (for immediate saves)
   */
  const saveNow = useCallback(async () => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    return await saveDocument()
  }, [saveDocument])

  /**
   * Check if there are unsaved changes
   */
  const hasUnsavedChanges = useCallback(() => {
    return hasDocumentChanged(title, blocks, originalTitle, originalBlocks)
  }, [title, blocks, originalTitle, originalBlocks])

  return {
    saveNow,
    hasUnsavedChanges,
    isSaving: isSavingRef.current,
  }
}
