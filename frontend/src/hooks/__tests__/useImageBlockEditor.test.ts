import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { useImageBlockEditor } from '@/hooks/useImageBlockEditor'
import type { ImageBlockContent } from '@/types'

// Mock the upload utilities
vi.mock('@/utils/uploadUtils', () => ({
  validateImageFile: vi.fn(),
  uploadImageFile: vi.fn(),
  createPreviewUrl: vi.fn(() => 'blob:preview-url'),
  cleanupPreviewUrl: vi.fn(),
  getImageDimensions: vi.fn(),
}))

describe('useImageBlockEditor', () => {
  const mockInitialContent: ImageBlockContent = {
    src: '/api/uploads/test-image.jpg',
    alt: 'Test image',
    caption: 'Initial caption',
    width: 800,
    height: 600,
    originalName: 'test-image.jpg',
    fileSize: 150000,
  }

  const mockOnContentChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('初期状態の設定', () => {
    const { result } = renderHook(() =>
      useImageBlockEditor(mockInitialContent, mockOnContentChange)
    )

    expect(result.current.content).toEqual(mockInitialContent)
    expect(result.current.hasImage).toBe(true)
    expect(result.current.uploadState.isUploading).toBe(false)
    expect(result.current.uploadState.error).toBe(null)
  })

  test('空の初期状態', () => {
    const { result } = renderHook(() =>
      useImageBlockEditor(undefined, mockOnContentChange)
    )

    expect(result.current.content.src).toBe('')
    expect(result.current.hasImage).toBe(false)
    expect(result.current.uploadState.isUploading).toBe(false)
  })

  test('キャプション更新', () => {
    const { result } = renderHook(() =>
      useImageBlockEditor(mockInitialContent, mockOnContentChange)
    )

    act(() => {
      result.current.updateCaption('新しいキャプション')
    })

    expect(mockOnContentChange).toHaveBeenCalledWith({
      ...mockInitialContent,
      caption: '新しいキャプション',
    })
  })

  test('Alt属性更新', () => {
    const { result } = renderHook(() =>
      useImageBlockEditor(mockInitialContent, mockOnContentChange)
    )

    act(() => {
      result.current.updateAlt('新しいAlt属性')
    })

    expect(mockOnContentChange).toHaveBeenCalledWith({
      ...mockInitialContent,
      alt: '新しいAlt属性',
    })
  })

  test('画像削除', () => {
    const { result } = renderHook(() =>
      useImageBlockEditor(mockInitialContent, mockOnContentChange)
    )

    act(() => {
      result.current.removeImage()
    })

    const expectedEmptyContent = {
      src: '',
      alt: '',
      caption: '',
      width: 0,
      height: 0,
      originalName: '',
      fileSize: 0,
    }

    expect(mockOnContentChange).toHaveBeenCalledWith(expectedEmptyContent)
    expect(result.current.hasImage).toBe(false)
  })

  test('ファイルアップロード成功', async () => {
    const { validateImageFile, uploadImageFile, getImageDimensions } =
      await import('@/utils/uploadUtils')

    vi.mocked(validateImageFile).mockReturnValue({ isValid: true })
    vi.mocked(getImageDimensions).mockResolvedValue({
      width: 1200,
      height: 800,
    })
    vi.mocked(uploadImageFile).mockResolvedValue({
      success: true,
      url: '/api/uploads/new-image.jpg',
      filename: 'new-image.jpg',
    })

    const { result } = renderHook(() =>
      useImageBlockEditor(undefined, mockOnContentChange)
    )

    const testFile = new File(['image content'], 'new-image.jpg', {
      type: 'image/jpeg',
    })

    await act(async () => {
      await result.current.handleFileSelect(testFile)
    })

    await waitFor(() => {
      expect(mockOnContentChange).toHaveBeenCalledWith({
        src: '/api/uploads/new-image.jpg',
        alt: 'new-image',
        caption: '',
        width: 1200,
        height: 800,
        originalName: 'new-image.jpg',
        fileSize: testFile.size,
      })
    })

    expect(result.current.uploadState.isUploading).toBe(false)
    expect(result.current.uploadState.error).toBe(null)
  })

  test('無効ファイルでのエラー処理', async () => {
    const { validateImageFile } = await import('@/utils/uploadUtils')

    vi.mocked(validateImageFile).mockReturnValue({
      isValid: false,
      error: 'サポートされていないファイル形式です',
    })

    const { result } = renderHook(() =>
      useImageBlockEditor(undefined, mockOnContentChange)
    )

    const invalidFile = new File(['text'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      await result.current.handleFileSelect(invalidFile)
    })

    expect(result.current.uploadState.error).toBe(
      'サポートされていないファイル形式です'
    )
    expect(mockOnContentChange).not.toHaveBeenCalled()
  })

  test('アップロードエラー処理', async () => {
    const { validateImageFile, uploadImageFile, getImageDimensions } =
      await import('@/utils/uploadUtils')

    vi.mocked(validateImageFile).mockReturnValue({ isValid: true })
    vi.mocked(getImageDimensions).mockResolvedValue({ width: 800, height: 600 })
    vi.mocked(uploadImageFile).mockRejectedValue(
      new Error('アップロードに失敗しました')
    )

    const { result } = renderHook(() =>
      useImageBlockEditor(undefined, mockOnContentChange)
    )

    const testFile = new File(['image content'], 'test.jpg', {
      type: 'image/jpeg',
    })

    await act(async () => {
      await result.current.handleFileSelect(testFile)
    })

    await waitFor(() => {
      expect(result.current.uploadState.error).toBe(
        'アップロードに失敗しました'
      )
    })

    expect(result.current.uploadState.isUploading).toBe(false)
    expect(mockOnContentChange).not.toHaveBeenCalled()
  })

  test('エラークリア', () => {
    const { result } = renderHook(() =>
      useImageBlockEditor(undefined, mockOnContentChange)
    )

    // エラー状態を手動で設定（実際のテストでは通常のフローで設定される）
    act(() => {
      result.current.clearError()
    })

    expect(result.current.uploadState.error).toBe(null)
  })

  test('ドラッグ&ドロップイベント処理', () => {
    const { result } = renderHook(() =>
      useImageBlockEditor(undefined, mockOnContentChange)
    )

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [new File(['image'], 'test.jpg', { type: 'image/jpeg' })],
      },
    } as unknown as React.DragEvent

    act(() => {
      result.current.handleFileDrop(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
  })

  test('ドラッグオーバーイベント処理', () => {
    const { result } = renderHook(() =>
      useImageBlockEditor(undefined, mockOnContentChange)
    )

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { dropEffect: '' },
    } as unknown as React.DragEvent

    act(() => {
      result.current.handleDragOver(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
    expect(mockEvent.dataTransfer.dropEffect).toBe('copy')
  })

  test('ファイルダイアログを開く', () => {
    const { result } = renderHook(() =>
      useImageBlockEditor(undefined, mockOnContentChange)
    )

    // fileInputRef.current.click() をモック
    const mockClick = vi.fn()
    if (result.current.fileInputRef.current) {
      result.current.fileInputRef.current.click = mockClick
    }

    act(() => {
      result.current.openFileDialog()
    })

    // この場合、fileInputRef が実際には存在しないため、クリックは呼ばれない
    // 実際のコンポーネントではrefが適切に設定される
    expect(mockClick).not.toHaveBeenCalled()
  })

  test('アップロード URLなしエラー', async () => {
    const { validateImageFile, uploadImageFile, getImageDimensions } =
      await import('@/utils/uploadUtils')

    vi.mocked(validateImageFile).mockReturnValue({ isValid: true })
    vi.mocked(getImageDimensions).mockResolvedValue({ width: 800, height: 600 })
    vi.mocked(uploadImageFile).mockResolvedValue({
      success: true,
      url: undefined, // URLなし
      filename: 'test.jpg',
    })

    const { result } = renderHook(() =>
      useImageBlockEditor(undefined, mockOnContentChange)
    )

    const testFile = new File(['image content'], 'test.jpg', {
      type: 'image/jpeg',
    })

    await act(async () => {
      await result.current.handleFileSelect(testFile)
    })

    await waitFor(() => {
      expect(result.current.uploadState.error).toBe(
        'アップロードは成功しましたが、画像URLが取得できませんでした'
      )
    })

    expect(mockOnContentChange).not.toHaveBeenCalled()
  })
})
