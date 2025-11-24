import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileBlockEditor } from '../FileBlockEditor'
import { useFileBlockEditor } from '@/hooks/useFileBlockEditor'

// useFileBlockEditorフックをモック
vi.mock('@/hooks/useFileBlockEditor')

const mockUseFileBlockEditor = vi.mocked(useFileBlockEditor)

// 共通のモックヘルパー関数
const createMockHookReturn = (overrides = {}) => ({
  content: {
    filename: '',
    fileSize: 0,
    mimeType: '',
    uploadedAt: '',
    downloadUrl: '',
    originalName: '',
  },
  updateContent: vi.fn(),
  uploadState: {
    isUploading: false,
    progress: null,
    error: null,
  },
  isUploading: false,
  uploadProgress: null,
  uploadError: null,
  fileInputRef: { current: null },
  openFileDialog: vi.fn(),
  handleFileSelect: vi.fn(),
  handleFileDrop: vi.fn(),
  handleDragOver: vi.fn(),
  removeFile: vi.fn(),
  downloadFile: vi.fn(),
  cancelUpload: vi.fn(), // キャンセル機能を追加
  hasFile: false,
  isReady: false,
  fileTypeName: 'ファイル',
  formattedFileSize: '',
  ...overrides,
})

describe('FileBlockEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ファイルアップロード前の表示', () => {
    it('アップロードエリアとファイル選択ボタンが表示される', () => {
      mockUseFileBlockEditor.mockReturnValue(createMockHookReturn())

      render(<FileBlockEditor />)

      expect(screen.getByText('クリックしてファイルを選択')).toBeInTheDocument()
      expect(screen.getByText('ファイルを選択')).toBeInTheDocument()
    })
  })

  describe('ファイルアップロード済みの表示', () => {
    it('ファイル情報とアクションボタンが表示される', () => {
      mockUseFileBlockEditor.mockReturnValue(
        createMockHookReturn({
          content: {
            filename: 'test.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: '2024-01-01T00:00:00Z',
            downloadUrl: 'http://localhost:8080/uploads/test.pdf',
            originalName: 'test.pdf',
          },
          hasFile: true,
          isReady: true,
          fileTypeName: 'PDF',
          formattedFileSize: '1.0 KB',
        })
      )

      render(<FileBlockEditor />)

      expect(screen.getByText('test.pdf')).toBeInTheDocument()
      expect(screen.getByText(/1\.0 KB/)).toBeInTheDocument()
      expect(screen.getByText('ダウンロード')).toBeInTheDocument()
    })
  })

  describe('アップロード中の表示', () => {
    it('プログレスバーとアップロード状態が表示される', () => {
      mockUseFileBlockEditor.mockReturnValue(
        createMockHookReturn({
          isUploading: true,
          uploadProgress: {
            loaded: 512,
            total: 1024,
            percentage: 50,
            speed: 1000,
            remainingTime: 0.5,
            estimatedTimeRemaining: '約1秒',
          },
        })
      )

      render(<FileBlockEditor />)

      expect(screen.getByText('アップロード中...')).toBeInTheDocument()
      expect(screen.getByText('50.0%')).toBeInTheDocument()
    })
  })

  describe('エラー表示', () => {
    it('エラーメッセージが表示される', () => {
      mockUseFileBlockEditor.mockReturnValue(
        createMockHookReturn({
          uploadError: 'ファイルサイズが大きすぎます',
        })
      )

      render(<FileBlockEditor />)

      expect(
        screen.getByText('ファイルサイズが大きすぎます')
      ).toBeInTheDocument()
    })
  })

  describe('ユーザーインタラクション', () => {
    it('削除ボタンクリックでremoveFileが呼ばれる', () => {
      const mockRemoveFile = vi.fn()

      mockUseFileBlockEditor.mockReturnValue(
        createMockHookReturn({
          content: {
            filename: 'test.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: '2024-01-01T00:00:00Z',
            downloadUrl: 'http://localhost:8080/uploads/test.pdf',
            originalName: 'test.pdf',
          },
          hasFile: true,
          isReady: true,
          removeFile: mockRemoveFile,
        })
      )

      render(<FileBlockEditor />)

      const deleteButton = screen.getByTitle('削除')
      fireEvent.click(deleteButton)

      expect(mockRemoveFile).toHaveBeenCalledOnce()
    })

    it('ダウンロードボタンクリックでdownloadFileが呼ばれる', () => {
      const mockDownloadFile = vi.fn()

      mockUseFileBlockEditor.mockReturnValue(
        createMockHookReturn({
          content: {
            filename: 'test.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: '2024-01-01T00:00:00Z',
            downloadUrl: 'http://localhost:8080/uploads/test.pdf',
            originalName: 'test.pdf',
          },
          hasFile: true,
          isReady: true,
          downloadFile: mockDownloadFile,
        })
      )

      render(<FileBlockEditor />)

      const downloadButton = screen.getByTitle('ダウンロード')
      fireEvent.click(downloadButton)

      expect(mockDownloadFile).toHaveBeenCalledOnce()
    })
  })
})
