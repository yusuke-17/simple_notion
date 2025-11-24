import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFileBlockEditor } from '../useFileBlockEditor'

// uploadFileWithProgress関数をモック
vi.mock('@/utils/fileUploadUtils', () => ({
  validateFile: vi.fn((file: File) => {
    // 簡易的な検証ロジック
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'ファイルサイズが大きすぎます' }
    }
    return { isValid: true }
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadFileWithProgress: vi.fn((file: File, callbacks?: any) => {
    // コールバックを即座に実行してアップロード完了をシミュレート
    if (callbacks?.onProgress) {
      // 進捗を50%、100%と段階的に呼び出す
      setTimeout(() => {
        callbacks.onProgress({
          loaded: file.size / 2,
          total: file.size,
          percentage: 50,
          speed: 1000,
          remainingTime: 1,
          estimatedTimeRemaining: '約1秒',
        })
      }, 10)

      setTimeout(() => {
        callbacks.onProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100,
          speed: 1000,
          remainingTime: 0,
          estimatedTimeRemaining: '完了',
        })
      }, 20)
    }

    if (callbacks?.onSuccess) {
      setTimeout(() => {
        callbacks.onSuccess({
          success: true,
          url: 'http://localhost:8080/uploads/test-file.pdf',
          mimeType: file.type,
          fileSize: file.size,
          filename: file.name,
        })
      }, 30)
    }
    // UploadControllerを返す
    return {
      abort: vi.fn(),
      xhr: new XMLHttpRequest(),
    }
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
    vi.useFakeTimers() // タイマーをモック化
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers() // テスト後に実タイマーに戻す
  })

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() =>
      useFileBlockEditor(undefined, mockOnContentChange)
    )

    expect(result.current.content.downloadUrl).toBe('')
    expect(result.current.isUploading).toBe(false)
    expect(result.current.uploadProgress).toBeNull()
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

    // アップロード処理を開始
    await act(async () => {
      const uploadPromise = result.current.handleFileSelect(event)

      // プログレスのsetIntervalを進める
      vi.advanceTimersByTime(2000)

      // アップロード完了を待つ
      await uploadPromise
    })

    // 最終状態の確認
    expect(result.current.isUploading).toBe(false)
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

  // 追加テストケース
  it('ドラッグ&ドロップでファイルアップロードが実行される', async () => {
    const { result } = renderHook(() =>
      useFileBlockEditor(undefined, mockOnContentChange)
    )

    const file = new File(['test content'], 'dropped.pdf', {
      type: 'application/pdf',
    })

    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { files: [file] },
    } as unknown as React.DragEvent<HTMLDivElement>

    await act(async () => {
      const uploadPromise = result.current.handleFileDrop(event)
      vi.advanceTimersByTime(2000)
      await uploadPromise
    })

    expect(result.current.isUploading).toBe(false)
    expect(result.current.content.filename).toBe('dropped.pdf')
    expect(mockOnContentChange).toHaveBeenCalled()
  })

  it('アップロード進行状況が正しく更新される', async () => {
    const { result } = renderHook(() =>
      useFileBlockEditor(undefined, mockOnContentChange)
    )

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      const uploadPromise = result.current.handleFileSelect(event)

      // タイマーを進めてアップロード完了
      vi.advanceTimersByTime(2000)
      await uploadPromise
    })

    // アップロード完了後、進捗はnullになる(完了状態)
    expect(result.current.uploadProgress).toBeNull()
    expect(result.current.isUploading).toBe(false)
  })

  it('ファイルダウンロードが正しく動作する', () => {
    const initialContent = {
      filename: 'test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      uploadedAt: '2024-01-01T00:00:00Z',
      downloadUrl: 'http://localhost:8080/uploads/test.pdf',
      originalName: 'original-test.pdf',
    }

    const { result } = renderHook(() =>
      useFileBlockEditor(initialContent, mockOnContentChange)
    )

    // DOM操作をモック
    const mockLink = document.createElement('a')
    const mockClick = vi.fn()
    mockLink.click = mockClick

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(mockLink)
    const appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => mockLink)
    const removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => mockLink)

    act(() => {
      result.current.downloadFile()
    })

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(mockClick).toHaveBeenCalled()
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
  })

  it('計算されたプロパティが正しく返される', () => {
    const initialContent = {
      filename: 'test.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
      uploadedAt: '2024-01-01T00:00:00Z',
      downloadUrl: 'http://localhost:8080/uploads/test.pdf',
      originalName: 'test.pdf',
    }

    const { result } = renderHook(() =>
      useFileBlockEditor(initialContent, mockOnContentChange)
    )

    expect(result.current.hasFile).toBe(true)
    expect(result.current.isReady).toBe(true)
    expect(result.current.fileTypeName).toBe('PDF')
    expect(result.current.formattedFileSize).toBe('2048 Bytes')
  })

  it('ファイル入力参照が正しく設定される', () => {
    const { result } = renderHook(() =>
      useFileBlockEditor(undefined, mockOnContentChange)
    )

    expect(result.current.fileInputRef).toBeDefined()
    expect(result.current.fileInputRef.current).toBeNull()
  })

  it('アップロード中は isReady が false になる', async () => {
    const { result } = renderHook(() =>
      useFileBlockEditor(undefined, mockOnContentChange)
    )

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      const uploadPromise = result.current.handleFileSelect(event)
      expect(result.current.isReady).toBe(false)

      vi.advanceTimersByTime(2000)
      await uploadPromise
    })

    expect(result.current.isReady).toBe(true)
  })
})
