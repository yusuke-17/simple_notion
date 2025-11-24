export interface User {
  id: number
  email: string
  name: string
}

export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
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
  content: string | ImageBlockContent | FileBlockContent // Allow object types for image/file blocks
  documentId: number
  position: number // Changed from 'order' to match backend
  createdAt: string
  updatedAt?: string
}

// Rich text content types for TipTap
export interface TipTapDocument {
  type: 'doc'
  content?: TipTapNode[]
}

export interface TipTapNode {
  type: string
  content?: TipTapNode[]
  marks?: TipTapMark[]
  text?: string
  attrs?: Record<string, unknown>
}

export interface TipTapMark {
  type: string
  attrs?: Record<string, unknown>
}

// Block content format types
export type BlockContentFormat = 'plain' | 'rich' | 'image'

export interface RichBlock extends Omit<Block, 'content'> {
  content: string // JSON string for rich text, plain string for legacy
  format?: BlockContentFormat
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

// File block specific types (PDF, Word, Excel等)
export interface FileBlockContent {
  filename: string // ファイル名
  fileSize: number // ファイルサイズ（バイト）
  mimeType: string // MIMEタイプ
  uploadedAt: string // アップロード日時
  downloadUrl: string // ダウンロードURL
  previewUrl?: string // プレビューURL（PDF等）
  originalName?: string // 元のファイル名（ユーザーが見やすい名前）
  // MinIO関連フィールド
  fileKey?: string // MinIO内部キー
  fileId?: number // file_metadata.id
  bucketName?: string // MinIOバケット名
  status?: 'active' | 'deleted' | 'orphaned' // ファイルステータス
  fileType?: 'file' // ファイルタイプ（固定値）
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

export interface FileUploadResponse extends UploadResponse {
  mimeType?: string
  fileSize?: number
}

export interface UploadError {
  error: string
  message: string
}

export interface UploadProgress {
  filename: string
  progress: number // 0-100
  status: 'uploading' | 'completed' | 'error'
  error?: string
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

// BackendのFileMetadata構造に対応するフロントエンド型
export interface FileMetadata {
  id: number
  userId: number
  documentId?: number | null
  blockId?: number | null
  fileKey: string // MinIO内部キー
  bucketName: string // MinIOバケット名
  originalName: string // 元のファイル名
  fileSize: number // ファイルサイズ（バイト）
  mimeType: string // MIMEタイプ
  fileType: 'image' | 'file' // ファイルタイプ区別
  width?: number | null // 画像幅（画像のみ）
  height?: number | null // 画像高さ（画像のみ）
  uploadedAt: string // アップロード日時（ISO 8601形式）
  status: 'active' | 'deleted' | 'orphaned' // ファイルステータス
  deletedAt?: string | null // 削除日時
  metadata?: Record<string, unknown> // 追加メタデータ
}

// ストレージ使用量型
export interface UserStorageUsage {
  userId: number
  fileCount: number // ファイル数
  totalBytes: number // 合計バイト数
  totalMb: number // 合計MB
  quotaBytes: number // クォータ（バイト）
  quotaMb: number // クォータMB
  usageRate: number // 使用率 (0-100%)
}

// 署名付きURLレスポンス型
export interface PresignedURLResponse {
  url: string // MinIO署名付きURL（有効期限付き）
}

// 署名付きURL取得リクエスト型
export interface GetPresignedURLRequest {
  fileId: number
}
