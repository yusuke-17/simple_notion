import React from 'react'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'
import { useImageBlockEditor } from '@/hooks/useImageBlockEditor'
import type { ImageBlockContent } from '@/types'
import { formatBytes } from '@/utils/uploadUtils'

interface ImageBlockEditorProps {
  initialContent?: ImageBlockContent
  onContentChange?: (content: ImageBlockContent) => void
  placeholder?: string
  className?: string
}

/**
 * 画像ブロックエディタコンポーネント
 * 画像のアップロード、表示、キャプション編集を行う
 */
export const ImageBlockEditor: React.FC<ImageBlockEditorProps> = ({
  initialContent,
  onContentChange,
  placeholder = 'Click to upload image or drag & drop',
  className = '',
}) => {
  const {
    content,
    uploadState,
    hasImage,
    fileInputRef,
    openFileDialog,
    handleFileSelect,
    handleFileDrop,
    handleDragOver,
    updateCaption,
    updateAlt,
    removeImage,
    clearError,
  } = useImageBlockEditor(initialContent, onContentChange)

  const { isUploading, error, previewUrl } = uploadState

  // アップロード中またはプレビュー表示中
  const showUploadArea = !hasImage || isUploading

  return (
    <div className={`image-block-editor ${className}`}>
      {/* ファイル入力要素（非表示） */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) {
            handleFileSelect(file)
          }
        }}
        className="hidden"
      />

      {showUploadArea && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${
              isUploading
                ? 'border-blue-300 bg-blue-50'
                : error
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
          onClick={openFileDialog}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onDragLeave={e => e.preventDefault()}
        >
          {isUploading ? (
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-sm text-blue-600">アップロード中...</p>
              {uploadState.progress && (
                <p className="text-xs text-gray-500">
                  {uploadState.progress.filename} ({formatBytes(0)})
                </p>
              )}
            </div>
          ) : error ? (
            <div className="space-y-2">
              <div className="flex justify-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={e => {
                  e.stopPropagation()
                  clearError()
                }}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
                エラーをクリア
              </button>
            </div>
          ) : previewUrl ? (
            <div className="space-y-2">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-48 mx-auto rounded"
              />
              <p className="text-sm text-gray-500">プレビュー</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {placeholder}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPEG, PNG, GIF, WebP形式、最大5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 画像表示エリア */}
      {hasImage && !isUploading && (
        <div className="space-y-3">
          <div className="relative group">
            <img
              src={content.src}
              alt={content.alt || 'Uploaded image'}
              className="max-w-full h-auto rounded-lg shadow-sm"
              style={{
                maxHeight: '500px',
                objectFit: 'contain',
              }}
            />

            {/* 画像コントロール */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={removeImage}
                className="flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="画像を削除"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 画像情報 */}
            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {content.originalName && <div>{content.originalName}</div>}
                {content.fileSize && <div>{formatBytes(content.fileSize)}</div>}
                {content.width && content.height && (
                  <div>
                    {content.width} × {content.height}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* キャプション編集 */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="画像のキャプションを入力..."
              value={content.caption || ''}
              onChange={e => updateCaption(e.target.value)}
              className="w-full text-sm text-gray-600 border-none bg-transparent focus:outline-none placeholder:text-gray-400"
            />

            {/* Alt テキスト編集（アクセシビリティ） */}
            <input
              type="text"
              placeholder="代替テキスト（アクセシビリティ用）"
              value={content.alt || ''}
              onChange={e => updateAlt(e.target.value)}
              className="w-full text-xs text-gray-500 border-none bg-transparent focus:outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 画像ブロック表示用の軽量コンポーネント（編集機能なし）
 */
export const ImageBlockDisplay: React.FC<{
  content: ImageBlockContent
  className?: string
}> = ({ content, className = '' }) => {
  if (!content.src) {
    return (
      <div
        className={`flex items-center justify-center h-32 bg-gray-50 rounded-lg ${className}`}
      >
        <div className="text-center">
          <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">画像が設定されていません</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`image-block-display ${className}`}>
      <img
        src={content.src}
        alt={content.alt || 'Image'}
        className="max-w-full h-auto rounded-lg shadow-sm"
        style={{
          maxHeight: '500px',
          objectFit: 'contain',
        }}
      />
      {content.caption && (
        <p className="text-sm text-gray-600 mt-2 text-center italic">
          {content.caption}
        </p>
      )}
    </div>
  )
}
