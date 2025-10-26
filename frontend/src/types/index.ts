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
  content: string
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
}

// Upload related types
export interface UploadResponse {
  success: boolean
  filename?: string
  url?: string
  message?: string
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
