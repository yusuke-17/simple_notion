import { useState, useEffect, useCallback } from 'react'
import type { Document } from '@/types'
import {
  validateDocumentArray,
  createDocumentApiOptions,
  createNewDocumentPayload,
  handleApiResponse,
  DOCUMENT_API,
} from '@/utils/sidebarUtils'

interface UseSidebarProps {
  onDocumentSelect: (documentId: number) => void
  onDocumentDelete: (documentId: number) => void
}

/**
 * Hook for Sidebar functionality
 * Manages document lists, trash operations, and API interactions
 */
export const useSidebar = ({
  onDocumentSelect,
  onDocumentDelete,
}: UseSidebarProps) => {
  // Document state
  const [documents, setDocuments] = useState<Document[]>([])
  const [trashedDocuments, setTrashedDocuments] = useState<Document[]>([])

  // UI state
  const [showingTrash, setShowingTrash] = useState(false)
  const [hoveredDocId, setHoveredDocId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load documents from API
   */
  const loadDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const options = createDocumentApiOptions('GET')
      const response = await fetch(DOCUMENT_API.DOCUMENTS, options)
      const data = await handleApiResponse<Document[]>(response)

      setDocuments(validateDocumentArray(data))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load documents'
      setError(errorMessage)
      setDocuments([])

      if (import.meta.env.DEV) {
        console.error('Failed to load documents:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Load trashed documents from API
   */
  const loadTrashedDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const options = createDocumentApiOptions('GET')
      const response = await fetch(DOCUMENT_API.DELETED_DOCUMENTS, options)
      const data = await handleApiResponse<Document[]>(response)

      setTrashedDocuments(validateDocumentArray(data))
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load trashed documents'
      setError(errorMessage)
      setTrashedDocuments([])

      if (import.meta.env.DEV) {
        console.error('Failed to load trashed documents:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Create new document
   */
  const createDocument = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const payload = createNewDocumentPayload()
      const options = createDocumentApiOptions('POST', payload)
      const response = await fetch(DOCUMENT_API.DOCUMENTS, options)
      const newDoc = await handleApiResponse<Document>(response)

      if (newDoc) {
        setDocuments(prev => [...prev, newDoc])
        onDocumentSelect(newDoc.id)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create document'
      setError(errorMessage)

      if (import.meta.env.DEV) {
        console.error('Failed to create document:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [onDocumentSelect])

  /**
   * Delete document (move to trash)
   */
  const deleteDocument = useCallback(
    async (docId: number, event: React.MouseEvent) => {
      event.stopPropagation()

      if (!confirm('Move this document to trash?')) return

      setLoading(true)
      setError(null)

      try {
        const options = createDocumentApiOptions('DELETE')
        await fetch(DOCUMENT_API.DELETE_DOCUMENT(docId), options)

        // Refresh document list
        await loadDocuments()

        // Notify parent component
        onDocumentDelete(docId)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete document'
        setError(errorMessage)

        if (import.meta.env.DEV) {
          console.error('Failed to delete document:', error)
        }
      } finally {
        setLoading(false)
      }
    },
    [loadDocuments, onDocumentDelete]
  )

  /**
   * Restore document from trash
   */
  const restoreDocument = useCallback(
    async (docId: number) => {
      setLoading(true)
      setError(null)

      try {
        const options = createDocumentApiOptions('PUT')
        await fetch(DOCUMENT_API.RESTORE_DOCUMENT(docId), options)

        // Refresh both lists
        await Promise.all([loadTrashedDocuments(), loadDocuments()])
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to restore document'
        setError(errorMessage)

        if (import.meta.env.DEV) {
          console.error('Failed to restore document:', error)
        }
      } finally {
        setLoading(false)
      }
    },
    [loadTrashedDocuments, loadDocuments]
  )

  /**
   * Permanently delete document
   */
  const permanentDelete = useCallback(
    async (docId: number) => {
      if (
        !confirm('Permanently delete this document? This cannot be undone.')
      ) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const options = createDocumentApiOptions('DELETE')
        await fetch(DOCUMENT_API.PERMANENT_DELETE(docId), options)

        // Refresh trashed documents list
        await loadTrashedDocuments()
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to permanently delete document'
        setError(errorMessage)

        if (import.meta.env.DEV) {
          console.error('Failed to permanently delete document:', error)
        }
      } finally {
        setLoading(false)
      }
    },
    [loadTrashedDocuments]
  )

  /**
   * Toggle trash view
   */
  const toggleTrash = useCallback(() => {
    setShowingTrash(prev => {
      const newShowingTrash = !prev
      if (newShowingTrash) {
        loadTrashedDocuments()
      }
      return newShowingTrash
    })
  }, [loadTrashedDocuments])

  /**
   * Handle document hover
   */
  const handleDocumentHover = useCallback((docId: number | null) => {
    setHoveredDocId(docId)
  }, [])

  /**
   * Handle document selection
   */
  const handleDocumentSelect = useCallback(
    (docId: number) => {
      if (!showingTrash) {
        onDocumentSelect(docId)
      }
    },
    [showingTrash, onDocumentSelect]
  )

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Listen for document updates
  useEffect(() => {
    const handleDocumentUpdate = () => {
      loadDocuments()
    }

    const handleDocumentDeleteEvent = () => {
      loadDocuments()
    }

    window.addEventListener('document-updated', handleDocumentUpdate)
    window.addEventListener('document-deleted', handleDocumentDeleteEvent)

    return () => {
      window.removeEventListener('document-updated', handleDocumentUpdate)
      window.removeEventListener('document-deleted', handleDocumentDeleteEvent)
    }
  }, [loadDocuments])

  return {
    // Document state
    documents,
    trashedDocuments,

    // UI state
    showingTrash,
    hoveredDocId,
    loading,
    error,

    // Actions
    createDocument,
    deleteDocument,
    restoreDocument,
    permanentDelete,
    toggleTrash,
    handleDocumentHover,
    handleDocumentSelect,

    // Computed values
    currentDocumentList: showingTrash ? trashedDocuments : documents,
    isEmpty: showingTrash
      ? trashedDocuments.length === 0
      : documents.length === 0,
  }
}
