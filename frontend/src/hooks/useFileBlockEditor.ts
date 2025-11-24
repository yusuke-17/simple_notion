import { useState, useCallback, useRef } from 'react'
import type {
  FileBlockContent,
  FileUploadResponse,
  UploadProgressInfo,
  UploadController,
} from '@/types'
import {
  validateFile,
  formatFileSize,
  getFileTypeName,
  uploadFileWithProgress,
} from '@/utils/fileUploadUtils'

/**
 * ファイルブロック管理用のカスタムHook
 * ファイルアップロード、ダウンロード、削除などのビジネスロジックを管理
 */
export const useFileBlockEditor = (
  initialContent?: FileBlockContent,
  onContentChange?: (content: FileBlockContent) => void
) => {
  // ファイルブロックのコンテンツ状態
  const [content, setContent] = useState<FileBlockContent>(
    initialContent || {
      filename: '',
      fileSize: 0,
      mimeType: '',
      uploadedAt: '',
      downloadUrl: '',
      originalName: '',
    }
  )

  // アップロード状態管理
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean
    progress: UploadProgressInfo | null
    error: string | null
  }>({
    isUploading: false,
    progress: null,
    error: null,
  })

  // ファイル入力要素への参照
  const fileInputRef = useRef<HTMLInputElement>(null)

  // アップロードコントローラー（キャンセル用）
  const uploadControllerRef = useRef<UploadController | null>(null)

  /**
   * ファイルコンテンツを更新する
   */
  const updateContent = useCallback(
    (newContent: Partial<FileBlockContent>) => {
      const updatedContent = { ...content, ...newContent }
      setContent(updatedContent)
      onContentChange?.(updatedContent)
    },
    [content, onContentChange]
  )

  /**
   * ファイル選択ダイアログを開く
   */
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  /**
   * ファイルが選択されたときの処理
   */
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // ファイル検証
      const validation = validateFile(file)
      if (!validation.isValid) {
        setUploadState({
          isUploading: false,
          progress: null,
          error: validation.error || 'ファイルの検証に失敗しました',
        })
        return
      }

      try {
        // アップロード開始
        setUploadState({
          isUploading: true,
          progress: null,
          error: null,
        })

        // アップロード開始（XMLHttpRequestベース、進捗付き）
        const controller = uploadFileWithProgress(file, {
          onProgress: progressInfo => {
            setUploadState(prev => ({
              ...prev,
              progress: progressInfo,
            }))
          },
          onSuccess: response => {
            const uploadResponse = response as FileUploadResponse
            if (
              uploadResponse.success &&
              uploadResponse.url &&
              uploadResponse.filename
            ) {
              // アップロード成功
              const newContent: FileBlockContent = {
                filename: uploadResponse.filename,
                fileSize: uploadResponse.fileSize || file.size,
                mimeType: uploadResponse.mimeType || file.type,
                uploadedAt: new Date().toISOString(),
                downloadUrl: uploadResponse.url,
                originalName: file.name,
              }

              updateContent(newContent)

              setUploadState({
                isUploading: false,
                progress: null,
                error: null,
              })

              // コントローラーをクリア
              uploadControllerRef.current = null
            } else {
              throw new Error(response.message || 'アップロードに失敗しました')
            }
          },
          onError: error => {
            console.error('File upload error:', error)
            setUploadState({
              isUploading: false,
              progress: null,
              error:
                error instanceof Error
                  ? error.message
                  : 'アップロードに失敗しました',
            })

            // コントローラーをクリア
            uploadControllerRef.current = null
          },
          onAbort: () => {
            // キャンセル時の処理
            setUploadState({
              isUploading: false,
              progress: null,
              error: null,
            })

            // コントローラーをクリア
            uploadControllerRef.current = null
          },
        })

        // コントローラーを保存（キャンセル用）
        uploadControllerRef.current = controller
      } finally {
        // ファイル入力をリセット
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [updateContent]
  )

  /**
   * ドラッグ＆ドロップでファイルがドロップされたときの処理
   */
  const handleFileDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const file = event.dataTransfer.files?.[0]
      if (!file) return

      // ファイル検証
      const validation = validateFile(file)
      if (!validation.isValid) {
        setUploadState({
          isUploading: false,
          progress: null,
          error: validation.error || 'ファイルの検証に失敗しました',
        })
        return
      }

      try {
        // アップロード開始
        setUploadState({
          isUploading: true,
          progress: null,
          error: null,
        })

        // アップロード開始（XMLHttpRequestベース、進捗付き）
        const controller = uploadFileWithProgress(file, {
          onProgress: progressInfo => {
            setUploadState(prev => ({
              ...prev,
              progress: progressInfo,
            }))
          },
          onSuccess: response => {
            const uploadResponse = response as FileUploadResponse
            if (
              uploadResponse.success &&
              uploadResponse.url &&
              uploadResponse.filename
            ) {
              // アップロード成功
              const newContent: FileBlockContent = {
                filename: uploadResponse.filename,
                fileSize: uploadResponse.fileSize || file.size,
                mimeType: uploadResponse.mimeType || file.type,
                uploadedAt: new Date().toISOString(),
                downloadUrl: uploadResponse.url,
                originalName: file.name,
              }

              updateContent(newContent)

              setUploadState({
                isUploading: false,
                progress: null,
                error: null,
              })

              // コントローラーをクリア
              uploadControllerRef.current = null
            } else {
              throw new Error(
                uploadResponse.message || 'アップロードに失敗しました'
              )
            }
          },
          onError: error => {
            console.error('File upload error:', error)
            setUploadState({
              isUploading: false,
              progress: null,
              error:
                error instanceof Error
                  ? error.message
                  : 'アップロードに失敗しました',
            })

            // コントローラーをクリア
            uploadControllerRef.current = null
          },
          onAbort: () => {
            // キャンセル時の処理
            setUploadState({
              isUploading: false,
              progress: null,
              error: null,
            })

            // コントローラーをクリア
            uploadControllerRef.current = null
          },
        })

        // コントローラーを保存（キャンセル用）
        uploadControllerRef.current = controller
      } catch (error) {
        console.error('File upload error:', error)
        setUploadState({
          isUploading: false,
          progress: null,
          error:
            error instanceof Error
              ? error.message
              : 'アップロードに失敗しました',
        })
      }
    },
    [updateContent]
  )

  /**
   * ドラッグオーバー時の処理
   */
  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
    },
    []
  )

  /**
   * アップロードをキャンセルする
   */
  const cancelUpload = useCallback(() => {
    if (uploadControllerRef.current) {
      uploadControllerRef.current.abort()
      uploadControllerRef.current = null
    }
  }, [])

  /**
   * ファイルを削除する
   */
  const removeFile = useCallback(() => {
    // アップロード中の場合はキャンセル
    cancelUpload()

    const emptyContent: FileBlockContent = {
      filename: '',
      fileSize: 0,
      mimeType: '',
      uploadedAt: '',
      downloadUrl: '',
      originalName: '',
    }

    setContent(emptyContent)
    onContentChange?.(emptyContent)

    setUploadState({
      isUploading: false,
      progress: null,
      error: null,
    })
  }, [onContentChange, cancelUpload])

  /**
   * ファイルをダウンロードする
   */
  const downloadFile = useCallback(() => {
    if (!content.downloadUrl) return

    // 新しいウィンドウでダウンロードリンクを開く
    const link = document.createElement('a')
    link.href = content.downloadUrl
    link.download = content.originalName || content.filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [content])

  // 計算されたプロパティ
  const hasFile = Boolean(content.downloadUrl)
  const isReady = hasFile && !uploadState.isUploading
  const fileTypeName = content.mimeType
    ? getFileTypeName(content.mimeType)
    : 'ファイル'
  const formattedFileSize = content.fileSize
    ? formatFileSize(content.fileSize)
    : ''

  return {
    // コンテンツ状態
    content,
    updateContent,

    // アップロード状態
    uploadState,
    isUploading: uploadState.isUploading,
    uploadProgress: uploadState.progress,
    uploadError: uploadState.error,

    // ファイル操作
    fileInputRef,
    openFileDialog,
    handleFileSelect,
    handleFileDrop,
    handleDragOver,
    removeFile,
    downloadFile,
    cancelUpload,

    // 計算されたプロパティ
    hasFile,
    isReady,
    fileTypeName,
    formattedFileSize,
  }
}
