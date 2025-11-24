import { useState, useCallback, useRef } from 'react'
import type {
  ImageBlockContent,
  UploadProgressInfo,
  UploadController,
} from '@/types'
import {
  validateImageFile,
  createPreviewUrl,
  cleanupPreviewUrl,
  getImageDimensions,
  uploadImageFileWithProgress,
} from '@/utils/uploadUtils'

/**
 * 画像ブロック管理用のカスタムHook
 * 画像アップロード、プレビュー表示、キャプション編集などのビジネスロジックを管理
 */
export const useImageBlockEditor = (
  initialContent?: ImageBlockContent,
  onContentChange?: (content: ImageBlockContent) => void
) => {
  // 画像ブロックのコンテンツ状態
  const [content, setContent] = useState<ImageBlockContent>(
    initialContent || {
      src: '',
      alt: '',
      caption: '',
      width: 0,
      height: 0,
      originalName: '',
      fileSize: 0,
    }
  )

  // アップロード状態管理
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean
    progress: UploadProgressInfo | null
    error: string | null
    previewUrl: string | null
  }>({
    isUploading: false,
    progress: null,
    error: null,
    previewUrl: null,
  })

  // ファイル入力要素への参照
  const fileInputRef = useRef<HTMLInputElement>(null)

  // アップロードコントローラー（キャンセル用）
  const uploadControllerRef = useRef<UploadController | null>(null)

  /**
   * 画像コンテンツを更新する
   */
  const updateContent = useCallback(
    (newContent: Partial<ImageBlockContent>) => {
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
   * 選択されたファイルを処理する
   */
  const handleFileSelect = useCallback(
    async (file: File) => {
      // ファイルバリデーション
      const validation = validateImageFile(file)
      if (!validation.isValid) {
        setUploadState(prev => ({
          ...prev,
          error: validation.error || 'ファイルが無効です',
        }))
        return
      }

      try {
        // エラーをクリア
        setUploadState(prev => ({ ...prev, error: null }))

        // プレビューURL作成
        const previewUrl = createPreviewUrl(file)

        // 画像の寸法を取得
        const dimensions = await getImageDimensions(file)

        // プレビュー状態を設定
        setUploadState({
          isUploading: true,
          progress: null,
          error: null,
          previewUrl,
        })

        // アップロード開始（XMLHttpRequestベース、進捗付き）
        const controller = uploadImageFileWithProgress(file, {
          onProgress: progressInfo => {
            setUploadState(prev => ({
              ...prev,
              progress: progressInfo,
            }))
          },
          onSuccess: uploadResult => {
            // アップロード成功時の処理
            if (!uploadResult.url) {
              throw new Error(
                'アップロードは成功しましたが、画像URLが取得できませんでした'
              )
            }

            const newContent: ImageBlockContent = {
              src: uploadResult.url,
              alt: file.name.replace(/\.[^/.]+$/, ''), // ファイル拡張子を除去
              caption: '',
              width: dimensions.width,
              height: dimensions.height,
              originalName: file.name,
              fileSize: file.size,
            }

            updateContent(newContent)

            // アップロード状態をリセット
            setUploadState({
              isUploading: false,
              progress: null,
              error: null,
              previewUrl: null,
            })

            // プレビューURLをクリーンアップ
            cleanupPreviewUrl(previewUrl)

            // コントローラーをクリア
            uploadControllerRef.current = null
          },
          onError: error => {
            // エラー処理
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'アップロードに失敗しました'

            setUploadState(prev => ({
              ...prev,
              isUploading: false,
              error: errorMessage,
              progress: null,
            }))

            // プレビューURLをクリーンアップ
            cleanupPreviewUrl(previewUrl)

            // コントローラーをクリア
            uploadControllerRef.current = null
          },
          onAbort: () => {
            // キャンセル時の処理
            setUploadState({
              isUploading: false,
              progress: null,
              error: null,
              previewUrl: null,
            })

            // プレビューURLをクリーンアップ
            cleanupPreviewUrl(previewUrl)

            // コントローラーをクリア
            uploadControllerRef.current = null
          },
        })

        // コントローラーを保存（キャンセル用）
        uploadControllerRef.current = controller
      } catch (error) {
        // エラー処理
        const errorMessage =
          error instanceof Error ? error.message : 'アップロードに失敗しました'

        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          error: errorMessage,
          progress: null,
        }))

        // プレビューURLをクリーンアップ
        if (uploadState.previewUrl) {
          cleanupPreviewUrl(uploadState.previewUrl)
        }
      }
    },
    [updateContent, uploadState.previewUrl]
  )

  /**
   * ドラッグ&ドロップでファイルを処理する
   */
  const handleFileDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const files = Array.from(event.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  /**
   * ドラッグオーバーイベントを処理する
   */
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  /**
   * キャプションを更新する
   */
  const updateCaption = useCallback(
    (caption: string) => {
      updateContent({ caption })
    },
    [updateContent]
  )

  /**
   * Alt属性を更新する
   */
  const updateAlt = useCallback(
    (alt: string) => {
      updateContent({ alt })
    },
    [updateContent]
  )

  /**
   * アップロードエラーをクリアする
   */
  const clearError = useCallback(() => {
    setUploadState(prev => ({ ...prev, error: null }))
  }, [])

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
   * 画像を削除する
   */
  const removeImage = useCallback(() => {
    // アップロード中の場合はキャンセル
    cancelUpload()

    const emptyContent: ImageBlockContent = {
      src: '',
      alt: '',
      caption: '',
      width: 0,
      height: 0,
      originalName: '',
      fileSize: 0,
    }

    setContent(emptyContent)
    onContentChange?.(emptyContent)

    // アップロード状態もリセット
    setUploadState({
      isUploading: false,
      progress: null,
      error: null,
      previewUrl: null,
    })
  }, [onContentChange, cancelUpload])

  /**
   * 画像が設定されているかチェック
   */
  const hasImage = content.src !== ''

  return {
    // 状態
    content,
    uploadState,
    hasImage,
    fileInputRef,

    // アクション
    openFileDialog,
    handleFileSelect,
    handleFileDrop,
    handleDragOver,
    updateCaption,
    updateAlt,
    removeImage,
    clearError,
    cancelUpload,
  }
}
