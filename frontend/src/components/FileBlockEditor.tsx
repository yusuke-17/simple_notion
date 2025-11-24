import { useFileBlockEditor } from '@/hooks/useFileBlockEditor'
import type { FileBlockContent } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Upload,
  File,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Download,
  Trash2,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { getFileIconName } from '@/utils/fileUploadUtils'
import { formatBytes, formatSpeed } from '@/utils/uploadUtils'

interface FileBlockEditorProps {
  initialContent?: FileBlockContent
  onContentChange?: (content: FileBlockContent) => void
}

/**
 * ファイルブロックエディターコンポーネント
 * PDF、Word、Excel等のファイルアップロードと表示を管理
 */
export function FileBlockEditor({
  initialContent,
  onContentChange,
}: FileBlockEditorProps) {
  const {
    content,
    isUploading,
    uploadProgress,
    uploadError,
    fileInputRef,
    openFileDialog,
    handleFileSelect,
    handleFileDrop,
    handleDragOver,
    removeFile,
    downloadFile,
    hasFile,
    isReady,
    fileTypeName,
    formattedFileSize,
    cancelUpload,
  } = useFileBlockEditor(initialContent, onContentChange)

  // ファイルアイコンを取得
  const getFileIcon = (mimeType: string) => {
    const iconName = getFileIconName(mimeType)

    switch (iconName) {
      case 'FileText':
        return <FileText className="h-12 w-12" />
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="h-12 w-12" />
      case 'FileCode':
        return <FileCode className="h-12 w-12" />
      case 'FileArchive':
        return <FileArchive className="h-12 w-12" />
      default:
        return <File className="h-12 w-12" />
    }
  }

  // ファイルがまだアップロードされていない場合
  if (!hasFile) {
    return (
      <div className="my-4">
        {/* ドラッグ&ドロップエリア */}
        <div
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          className="group relative flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-blue-400 hover:bg-blue-50"
        >
          {isUploading ? (
            // アップロード中の表示
            <div className="flex flex-col items-center space-y-4">
              <Upload className="h-12 w-12 animate-pulse text-blue-500" />
              <div className="w-full max-w-xs">
                <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                  <span>アップロード中...</span>
                  {uploadProgress && (
                    <span>{uploadProgress.percentage.toFixed(1)}%</span>
                  )}
                </div>
                {uploadProgress && (
                  <>
                    {/* 進捗バー */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress.percentage}%` }}
                      />
                    </div>
                    {/* ファイルサイズ */}
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>
                        {formatBytes(uploadProgress.loaded)} /{' '}
                        {formatBytes(uploadProgress.total)}
                      </span>
                    </div>
                    {/* 速度と残り時間 */}
                    {uploadProgress.speed > 0 && (
                      <div className="mt-1 flex justify-between text-xs text-gray-400">
                        <span>{formatSpeed(uploadProgress.speed)}</span>
                        <span>{uploadProgress.estimatedTimeRemaining}</span>
                      </div>
                    )}
                    {/* キャンセルボタン */}
                    <Button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        cancelUpload()
                      }}
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      キャンセル
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            // アップロード前の表示
            <>
              <Upload className="mb-4 h-12 w-12 text-gray-400 group-hover:text-blue-500" />
              <p className="mb-2 text-sm font-medium text-gray-700">
                クリックしてファイルを選択
              </p>
              <p className="mb-4 text-xs text-gray-500">
                または、ここにファイルをドラッグ&ドロップ
              </p>
              <p className="mb-4 text-xs text-gray-400">
                対応形式: PDF, Word, Excel, PowerPoint, テキスト, 圧縮ファイル等
              </p>
              <Button
                type="button"
                onClick={openFileDialog}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                ファイルを選択
              </Button>
            </>
          )}

          {/* 隠しファイル入力 */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.tar,.gz,.json,.csv,.xml,.rtf"
            className="hidden"
          />
        </div>

        {/* エラーメッセージ */}
        {uploadError && (
          <div className="mt-4 flex items-start space-x-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">エラー</p>
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ファイルがアップロード済みの場合
  return (
    <div className="my-4">
      <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* ファイル情報表示エリア */}
        <div className="flex items-center space-x-4 p-4">
          {/* ファイルアイコン */}
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
            {getFileIcon(content.mimeType)}
          </div>

          {/* ファイル詳細 */}
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-medium text-gray-900">
              {content.originalName || content.filename}
            </h4>
            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
              <span className="rounded bg-gray-100 px-2 py-0.5 font-medium">
                {fileTypeName}
              </span>
              {formattedFileSize && <span>• {formattedFileSize}</span>}
              {content.uploadedAt && (
                <span>
                  • {new Date(content.uploadedAt).toLocaleDateString('ja-JP')}
                </span>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-shrink-0 items-center space-x-2">
            <Button
              type="button"
              onClick={downloadFile}
              variant="outline"
              size="sm"
              className="gap-2"
              title="ダウンロード"
            >
              <Download className="h-4 w-4" />
              ダウンロード
            </Button>
            <Button
              type="button"
              onClick={removeFile}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ローディングオーバーレイ */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 animate-pulse text-blue-500" />
              <span className="text-sm text-gray-600">処理中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
