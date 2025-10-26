import { useState, useCallback, useRef } from 'react'
import type { FileBlockContent, FileUploadResponse } from '@/types'
import {
  uploadFile,
  validateFile,
  formatFileSize,
  getFileTypeName,
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
    progress: number // 0-100
    error: string | null
  }>({
    isUploading: false,
    progress: 0,
    error: null,
  })

  // ファイル入力要素への参照
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          progress: 0,
          error: validation.error || 'ファイルの検証に失敗しました',
        })
        return
      }

      try {
        // アップロード開始
        setUploadState({
          isUploading: true,
          progress: 0,
          error: null,
        })

        // プログレス更新のシミュレーション
        const progressInterval = setInterval(() => {
          setUploadState(prev => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          }))
        }, 200)

        // ファイルアップロード
        const response: FileUploadResponse = await uploadFile(file)

        clearInterval(progressInterval)

        if (response.success && response.url && response.filename) {
          // アップロード成功
          const newContent: FileBlockContent = {
            filename: response.filename,
            fileSize: response.fileSize || file.size,
            mimeType: response.mimeType || file.type,
            uploadedAt: new Date().toISOString(),
            downloadUrl: response.url,
            originalName: file.name,
          }

          updateContent(newContent)

          setUploadState({
            isUploading: false,
            progress: 100,
            error: null,
          })
        } else {
          throw new Error(response.message || 'アップロードに失敗しました')
        }
      } catch (error) {
        console.error('File upload error:', error)
        setUploadState({
          isUploading: false,
          progress: 0,
          error:
            error instanceof Error
              ? error.message
              : 'アップロードに失敗しました',
        })
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
          progress: 0,
          error: validation.error || 'ファイルの検証に失敗しました',
        })
        return
      }

      try {
        // アップロード開始
        setUploadState({
          isUploading: true,
          progress: 0,
          error: null,
        })

        // プログレス更新のシミュレーション
        const progressInterval = setInterval(() => {
          setUploadState(prev => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          }))
        }, 200)

        // ファイルアップロード
        const response: FileUploadResponse = await uploadFile(file)

        clearInterval(progressInterval)

        if (response.success && response.url && response.filename) {
          // アップロード成功
          const newContent: FileBlockContent = {
            filename: response.filename,
            fileSize: response.fileSize || file.size,
            mimeType: response.mimeType || file.type,
            uploadedAt: new Date().toISOString(),
            downloadUrl: response.url,
            originalName: file.name,
          }

          updateContent(newContent)

          setUploadState({
            isUploading: false,
            progress: 100,
            error: null,
          })
        } else {
          throw new Error(response.message || 'アップロードに失敗しました')
        }
      } catch (error) {
        console.error('File upload error:', error)
        setUploadState({
          isUploading: false,
          progress: 0,
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
   * ファイルを削除する
   */
  const removeFile = useCallback(() => {
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
      progress: 0,
      error: null,
    })
  }, [onContentChange])

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

    // 計算されたプロパティ
    hasFile,
    isReady,
    fileTypeName,
    formattedFileSize,
  }
}
