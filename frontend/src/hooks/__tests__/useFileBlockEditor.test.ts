import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFileBlockEditor } from '../useFileBlockEditor'

// uploadFile関数をモック
vi.mock('@/utils/fileUploadUtils', () => ({
  validateFile: vi.fn((file: File) => {
    // 簡易的な検証ロジック
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'ファイルサイズが大きすぎます' }
    }
    return { isValid: true }
  }),
  uploadFile: vi.fn((file: File) => {
    // onProgressパラメータを削除し、単純にPromiseを返す
    return Promise.resolve({
      success: true,
      url: 'http://localhost:8080/uploads/test-file.pdf',
      mimeType: file.type,
      fileSize: file.size,
      filename: file.name,
    })
  }),
  formatFileSize: vi.fn((bytes: number) => `${bytes} Bytes`),
  getFileTypeName: vi.fn(() => 'PDF'),
  getFileIconName: vi.fn(() => 'FileText'),
  ALLOWED_FILE_TYPES: ['application/pdf'],
  MAX_FILE_SIZE: 10 * 1024 * 1024,
}))

describe('useFileBlockEditor', () => {
  const mockOnContentChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() =>
      useFileBlockEditor(undefined, mockOnContentChange)
    )

    expect(result.current.content.downloadUrl).toBe('')
    expect(result.current.isUploading).toBe(false)
    expect(result.current.uploadProgress).toBe(0)
    expect(result.current.uploadError).toBeNull()
    expect(result.current.hasFile).toBe(false)
  })

  it('初期コンテンツがある場合、正しく設定される', () => {
    const initialContent = {
      filename: 'test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      uploadedAt: '2024-01-01T00:00:00Z',
      downloadUrl: 'http://localhost:8080/uploads/test.pdf',
      originalName: 'test.pdf',
    }

    const { result } = renderHook(() =>
      useFileBlockEditor(initialContent, mockOnContentChange)
    )

    expect(result.current.content).toEqual(initialContent)
    expect(result.current.hasFile).toBe(true)
  })

  it('ファイル選択で正しくアップロードが実行される', async () => {
    const { result } = renderHook(() =>
      useFileBlockEditor(undefined, mockOnContentChange)
    )

    const file = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    })
    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      result.current.handleFileSelect(event)
      await waitFor(() => expect(result.current.isUploading).toBe(false), {
        timeout: 1000,
      })
    })

    // アップロード完了後の状態確認
    expect(result.current.content.filename).toBe('test.pdf')
    expect(result.current.uploadError).toBeNull()
    expect(mockOnContentChange).toHaveBeenCalled()
  })

  it('ドラッグオーバー時にpreventDefaultが呼ばれる', () => {
    const { result } = renderHook(() =>
      useFileBlockEditor(undefined, mockOnContentChange)
    )

    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.DragEvent<HTMLDivElement>

    act(() => {
      result.current.handleDragOver(event)
    })

    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.stopPropagation).toHaveBeenCalled()
  })

  it('ファイル削除で状態がリセットされる', () => {
    const initialContent = {
      filename: 'test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      uploadedAt: '2024-01-01T00:00:00Z',
      downloadUrl: 'http://localhost:8080/uploads/test.pdf',
      originalName: 'test.pdf',
    }

    const { result } = renderHook(() =>
      useFileBlockEditor(initialContent, mockOnContentChange)
    )

    expect(result.current.hasFile).toBe(true)

    act(() => {
      result.current.removeFile()
    })

    expect(result.current.hasFile).toBe(false)
    expect(result.current.content.downloadUrl).toBe('')
    expect(mockOnContentChange).toHaveBeenCalled()
  })

  it('ファイルサイズが大きすぎる場合エラーを表示', async () => {
    const { result } = renderHook(() =>
      useFileBlockEditor(undefined, mockOnContentChange)
    )

    const largeFile = new File(
      [new ArrayBuffer(11 * 1024 * 1024)],
      'large.pdf',
      { type: 'application/pdf' }
    )

    const event = {
      target: { files: [largeFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      result.current.handleFileSelect(event)
    })

    expect(result.current.uploadError).toContain('ファイルサイズが大きすぎます')
    expect(result.current.hasFile).toBe(false)
    expect(mockOnContentChange).not.toHaveBeenCalled()
  })

  it('ファイルが選択されていない場合は何もしない', async () => {
    const { result } = renderHook(() =>
      useFileBlockEditor(undefined, mockOnContentChange)
    )

    const event = {
      target: { files: null },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      result.current.handleFileSelect(event)
    })

    expect(result.current.hasFile).toBe(false)
    expect(mockOnContentChange).not.toHaveBeenCalled()
  })
})
