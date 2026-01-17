export interface User {
  id: number
  email: string
  name: string
}

export interface Document {
  id: number
  title: string
  content: string
  parentId: number | null
  userId: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  treePath?: string
  level?: number
  sortOrder?: number
  isDeleted?: boolean
}

export interface Block {
  id: number
  type: string
  content: string | ImageBlockContent // Allow object types for image blocks
  documentId: number
  position: number // Changed from 'order' to match backend
  createdAt: string
  updatedAt?: string
}

// Image block specific types
export interface ImageBlockContent {
  src: string // 画像のURL (/api/uploads/filename.jpg)
  alt?: string // 代替テキスト
  caption?: string // キャプション
  width?: number // 表示幅
  height?: number // 表示高さ
  originalName?: string // 元のファイル名
  fileSize?: number // ファイルサイズ（バイト）
  // MinIO関連フィールド
  fileKey?: string // MinIO内部キー（再取得用）
  fileId?: number // file_metadata.id（API呼び出し用）
  bucketName?: string // MinIOバケット名
  uploadedAt?: string // アップロード日時（ISO 8601形式）
  status?: 'active' | 'deleted' | 'orphaned' // ファイルステータス
}

// Upload related types
export interface UploadResponse {
  success: boolean
  fileId?: number // file_metadata.id (Backendから追加)
  filename?: string
  url?: string
  message?: string
  fileKey?: string // MinIO内部キー（フロントで補完する可能性）
}

export interface UploadError {
  error: string
  message: string
}

// アップロード進捗詳細情報
export interface UploadProgressInfo {
  loaded: number // アップロード済みバイト数
  total: number // 総バイト数
  percentage: number // 進捗率 (0-100)
  speed: number // アップロード速度 (バイト/秒)
  remainingTime: number // 残り時間 (秒)
  estimatedTimeRemaining: string // 残り時間の人間が読みやすい形式
}

// アップロードコールバック
export interface UploadCallbacks {
  onProgress?: (progress: UploadProgressInfo) => void
  onSuccess?: (response: UploadResponse) => void
  onError?: (error: Error) => void
  onAbort?: () => void
}

// アップロードコントローラー（キャンセル用）
export interface UploadController {
  abort: () => void
  xhr: XMLHttpRequest
}

// リトライ設定
export interface RetryConfig {
  maxRetries?: number // 最大リトライ回数（デフォルト: 3）
  retryDelay?: number // リトライ間隔（ミリ秒、デフォルト: 1000）
  backoffMultiplier?: number // 遅延倍率（デフォルト: 2 = 指数バックオフ）
}

// Document with blocks type for the editor (共通化のためここに移動)
export interface DocumentWithBlocks extends Document {
  blocks?: Block[]
}

// 読み取り専用ドキュメント表示関連の型定義
export interface ReadOnlyDocumentViewerProps {
  documentId: number
  onClose?: () => void
}

export interface UseReadOnlyDocumentViewerReturn {
  // ドキュメント状態
  document: DocumentWithBlocks | null
  isLoading: boolean
  error: string | null

  // 計算されたプロパティ
  isEmpty: boolean
  isReady: boolean
}

// MinIO関連型定義

// 署名付きURLレスポンス型
export interface PresignedURLResponse {
  url: string // MinIO署名付きURL（有効期限付き）
}
