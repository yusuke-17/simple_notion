import { useState, useEffect, useCallback } from 'react'
import type {
  DocumentWithBlocks,
  UseReadOnlyDocumentViewerReturn,
} from '@/types'
import {
  createDocumentRequestOptions,
  handleApiResponse,
  getDocumentApiEndpointIncludingDeleted,
  sortBlocksByPosition,
} from '@/utils/documentUtils'

/**
 * 読み取り専用ドキュメントビューアー用のカスタムフック
 * ゴミ箱内のドキュメントを読み取り専用で表示するために使用
 */
export const useReadOnlyDocumentViewer = (
  documentId: number
): UseReadOnlyDocumentViewerReturn => {
  // ドキュメント状態
  const [document, setDocument] = useState<DocumentWithBlocks | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * サーバーからドキュメントを読み込む
   * 読み取り専用なので、自動保存や編集機能は不要
   */
  const loadDocument = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const options = createDocumentRequestOptions('GET')
      const response = await fetch(
        getDocumentApiEndpointIncludingDeleted(documentId),
        options
      )
      const doc = await handleApiResponse<DocumentWithBlocks>(response)

      // ブロックがある場合は位置順にソート
      if (doc.blocks && doc.blocks.length > 0) {
        doc.blocks = sortBlocksByPosition(doc.blocks)
      }

      setDocument(doc)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load document'
      setError(errorMessage)

      if (import.meta.env.DEV) {
        console.error('Failed to load read-only document:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  // ドキュメントIDが変更されたら再読み込み
  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  return {
    // ドキュメント状態
    document,
    isLoading,
    error,

    // 計算されたプロパティ
    isEmpty: !document?.blocks || document.blocks.length === 0,
    isReady: !isLoading && !error && !!document,
  }
}
