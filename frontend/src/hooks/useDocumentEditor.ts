import { useState, useEffect, useCallback, useRef } from 'react'
import type { Block, DocumentWithBlocks } from '@/types'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  createDocumentRequestOptions,
  handleApiResponse,
  getDocumentApiEndpoint,
  sortBlocksByPosition,
} from '@/utils/documentUtils'
import { createInitialBlock } from '@/utils/blockUtils'
import { useBlockManager } from './useBlockManager'
import { useAutoSave } from './useAutoSave'

/**
 * ドキュメントエディターフック
 * ドキュメントの読み込み、タイトル管理、ブロック管理と自動保存の統合を管理
 */
export const useDocumentEditor = (documentId: number) => {
  // ドキュメント状態
  const [document, setDocument] = useState<DocumentWithBlocks | null>(null)
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 比較用の元データ（自動保存用）
  const [originalTitle, setOriginalTitle] = useState('')
  const [originalBlocks, setOriginalBlocks] = useState<Block[]>([])

  // ブロックマネージャーを初期化
  const blockManager = useBlockManager([], documentId)

  // blockManagerへの参照を保持して無限ループを回避
  const blockManagerRef = useRef(blockManager)
  blockManagerRef.current = blockManager

  /**
   * 保存成功を処理 - 元データを更新
   * useCallbackで安定化して無限ループを回避
   */
  const handleSaveSuccess = useCallback((updatedDoc: DocumentWithBlocks) => {
    setDocument(updatedDoc)
    setOriginalTitle(updatedDoc.title)

    if (updatedDoc.blocks) {
      const sortedBlocks = sortBlocksByPosition(updatedDoc.blocks)
      setOriginalBlocks(sortedBlocks)
      blockManagerRef.current.syncWithServer(sortedBlocks)
    }
  }, []) // blockManager依存関係を削除

  // Auto-save functionality
  const { saveNow, hasUnsavedChanges, isSaving } = useAutoSave(
    documentId,
    title,
    blockManager.blocks,
    originalTitle,
    originalBlocks,
    handleSaveSuccess
  )

  /**
   * Load document from server
   */
  const loadDocument = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const options = createDocumentRequestOptions('GET')
      const response = await fetch(getDocumentApiEndpoint(documentId), options)
      const doc = await handleApiResponse<DocumentWithBlocks>(response)

      setDocument(doc)
      setTitle(doc.title)
      setOriginalTitle(doc.title)

      // Initialize blocks
      if (doc.blocks && doc.blocks.length > 0) {
        const sortedBlocks = sortBlocksByPosition(doc.blocks)
        setOriginalBlocks(sortedBlocks)
        blockManagerRef.current.initializeBlocks(sortedBlocks)
      } else {
        // Auto-create first block for immediate typing
        const initialBlock = createInitialBlock(documentId)
        const initialBlocks = [initialBlock]
        setOriginalBlocks(initialBlocks)
        blockManagerRef.current.initializeBlocks(initialBlocks)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load document'
      setError(errorMessage)

      if (import.meta.env.DEV) {
        console.error('Failed to load document:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [documentId]) // blockManager依存関係を削除

  /**
   * Update document title
   */
  const updateTitle = useCallback((newTitle: string) => {
    setTitle(newTitle)
  }, [])

  /**
   * Reload document from server
   */
  const reloadDocument = useCallback(() => {
    loadDocument()
  }, [loadDocument])

  /**
   * Reset document to original state
   */
  const resetDocument = useCallback(() => {
    setTitle(originalTitle)
    blockManagerRef.current.resetBlocks()
  }, [originalTitle]) // blockManager依存関係を削除

  // Load document on mount and when documentId changes
  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  return {
    // Document state
    document,
    title,
    isLoading,
    error,

    // Title management
    updateTitle,

    // Block management (forwarded from useBlockManager)
    blocks: blockManager.blocks,
    handleBlockUpdate: blockManager.handleBlockUpdate,
    handleBlockDelete: blockManager.handleBlockDelete,
    handleAddBlock: blockManager.handleAddBlock,
    handleMoveBlockUp: blockManager.handleMoveBlockUp,
    handleMoveBlockDown: blockManager.handleMoveBlockDown,
    handleDragEnd: (event: DragEndEvent) => {
      const { active, over } = event
      if (active && over) {
        blockManager.handleDragEnd(String(active.id), String(over.id))
      }
    },

    // Save functionality
    saveNow,
    hasUnsavedChanges,
    isSaving,

    // Document controls
    reloadDocument,
    resetDocument,

    // Derived state
    isEmpty: !blockManager.blocks || blockManager.blocks.length === 0,
    hasMultipleBlocks: blockManager.blocks && blockManager.blocks.length > 1,
    isReady: !isLoading && !error && !!document,
  }
}
