import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateImageFile,
  uploadImageFile,
  createFileInput,
  handleDragEvents,
  createPreviewUrl,
  cleanupPreviewUrl,
  formatBytes,
  formatSpeed,
  uploadImageFileWithProgress,
  UPLOAD_CONFIG,
} from '@/utils/uploadUtils'

// Mock fetch for upload tests
global.fetch = vi.fn()

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('uploadUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockClear()
  })

  describe('validateImageFile', () => {
    test('有効な画像ファイルの検証', () => {
      const validFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      })

      const result = validateImageFile(validFile)

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('無効なファイル形式の検証', () => {
      const invalidFile = new File(['text content'], 'test.txt', {
        type: 'text/plain',
      })

      const result = validateImageFile(invalidFile)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('サポートされていないファイル形式')
    })

    test('ファイルサイズが大きすぎる場合の検証', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })

      const result = validateImageFile(largeFile)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('ファイルサイズが大きすぎます')
    })

    test('PNGファイルの検証', () => {
      const pngFile = new File(['png content'], 'test.png', {
        type: 'image/png',
      })

      const result = validateImageFile(pngFile)

      expect(result.isValid).toBe(true)
    })

    test('WebPファイルの検証', () => {
      const webpFile = new File(['webp content'], 'test.webp', {
        type: 'image/webp',
      })

      const result = validateImageFile(webpFile)

      expect(result.isValid).toBe(true)
    })
  })

  describe('uploadImageFile', () => {
    test('成功時のアップロード処理', async () => {
      const mockResponse = {
        success: true,
        url: '/api/uploads/test.jpg',
        filename: 'test.jpg',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const validFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      })

      const result = await uploadImageFile(validFile)

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(
        UPLOAD_CONFIG.UPLOAD_ENDPOINT,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: expect.any(FormData),
        })
      )
    })

    test('サーバーエラー時のエラーハンドリング', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'サーバーエラー' }),
      } as Response)

      const validFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      })

      await expect(uploadImageFile(validFile)).rejects.toThrow('サーバーエラー')
    })

    test('ネットワークエラー時のエラーハンドリング', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const validFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      })

      await expect(uploadImageFile(validFile)).rejects.toThrow('Network error')
    })

    test('無効なファイルでのエラー', async () => {
      const invalidFile = new File(['text content'], 'test.txt', {
        type: 'text/plain',
      })

      await expect(uploadImageFile(invalidFile)).rejects.toThrow(
        'サポートされていないファイル形式'
      )
    })
  })

  describe('createFileInput', () => {
    test('ファイル入力要素の作成', () => {
      const mockCallback = vi.fn()

      const input = createFileInput(mockCallback)

      expect(input.type).toBe('file')
      expect(input.accept).toBe(UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.join(','))
      expect(input.style.display).toBe('none')
    })

    test('ファイル選択時のコールバック実行', () => {
      const mockCallback = vi.fn()
      const input = createFileInput(mockCallback)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      // ファイル選択をシミュレート
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })

      input.dispatchEvent(new Event('change'))

      expect(mockCallback).toHaveBeenCalledWith(file)
    })

    test('複数ファイル選択の設定', () => {
      const mockCallback = vi.fn()

      const input = createFileInput(mockCallback, true)

      expect(input.multiple).toBe(true)
    })
  })

  describe('handleDragEvents', () => {
    test('onDragOver処理', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { dropEffect: '' },
      } as unknown as React.DragEvent

      handleDragEvents.onDragOver(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockEvent.stopPropagation).toHaveBeenCalled()
      expect(mockEvent.dataTransfer.dropEffect).toBe('copy')
    })

    test('onDrop処理 - 成功時', () => {
      const mockOnFileSelect = vi.fn()
      const mockFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      })

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [mockFile] },
      } as unknown as React.DragEvent

      handleDragEvents.onDrop(mockEvent, mockOnFileSelect)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockEvent.stopPropagation).toHaveBeenCalled()
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile)
    })

    test('onDrop処理 - 無効なファイル', () => {
      const mockOnFileSelect = vi.fn()
      const mockOnError = vi.fn()
      const invalidFile = new File(['text'], 'test.txt', { type: 'text/plain' })

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [invalidFile] },
      } as unknown as React.DragEvent

      handleDragEvents.onDrop(mockEvent, mockOnFileSelect, mockOnError)

      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('サポートされていないファイル形式')
      )
      expect(mockOnFileSelect).not.toHaveBeenCalled()
    })

    test('onDrop処理 - ファイルなし', () => {
      const mockOnFileSelect = vi.fn()
      const mockOnError = vi.fn()

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [] },
      } as unknown as React.DragEvent

      handleDragEvents.onDrop(mockEvent, mockOnFileSelect, mockOnError)

      expect(mockOnError).toHaveBeenCalledWith('ファイルが選択されていません')
      expect(mockOnFileSelect).not.toHaveBeenCalled()
    })
  })

  describe('getImageDimensions', () => {
    test.skip('画像の寸法取得成功', async () => {
      // このテストは複雑なモックが必要なのでスキップ
    })

    test.skip('画像の読み込みエラー', async () => {
      // このテストは複雑なモックが必要なのでスキップ
    })
  })

  describe('createPreviewUrl and cleanupPreviewUrl', () => {
    test('プレビューURLの作成', () => {
      const file = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      })

      const url = createPreviewUrl(file)

      expect(URL.createObjectURL).toHaveBeenCalledWith(file)
      expect(url).toBe('blob:mock-url')
    })

    test('blobURLのクリーンアップ', () => {
      const blobUrl = 'blob:mock-url'

      cleanupPreviewUrl(blobUrl)

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(blobUrl)
    })

    test('非blobURLのクリーンアップは実行されない', () => {
      const normalUrl = 'https://example.com/image.jpg'

      cleanupPreviewUrl(normalUrl)

      expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    })
  })

  describe('formatBytes', () => {
    test('バイト単位のフォーマット', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1073741824)).toBe('1 GB')
    })

    test('小数点以下のフォーマット', () => {
      expect(formatBytes(1536)).toBe('1.50 KB')
      expect(formatBytes(1572864)).toBe('1.50 MB')
    })

    test('カスタム小数点以下桁数', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB')
      expect(formatBytes(1536, 1)).toBe('1.5 KB')
      expect(formatBytes(1536, 3)).toBe('1.500 KB')
    })
  })

  describe('formatSpeed', () => {
    test('速度のフォーマット', () => {
      expect(formatSpeed(0)).toBe('0 B/s')
      expect(formatSpeed(512)).toBe('512.0 B/s')
      expect(formatSpeed(1024)).toBe('1.0 KB/s')
      expect(formatSpeed(1024 * 1024)).toBe('1.0 MB/s')
      expect(formatSpeed(1.5 * 1024 * 1024)).toBe('1.5 MB/s')
    })
  })

  describe('uploadImageFileWithProgress', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockXHR: any

    beforeEach(() => {
      // XMLHttpRequestのモック
      mockXHR = {
        open: vi.fn(),
        send: vi.fn(),
        abort: vi.fn(),
        setRequestHeader: vi.fn(),
        upload: {
          addEventListener: vi.fn(),
        },
        addEventListener: vi.fn(),
        withCredentials: false,
        status: 200,
        responseText: '',
      }

      // グローバルXMLHttpRequestを置き換え
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.XMLHttpRequest = vi.fn(() => mockXHR) as any
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    test('正常にファイルをアップロードし、コントローラーを返す', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const onProgress = vi.fn()
      const onSuccess = vi.fn()

      const controller = uploadImageFileWithProgress(file, {
        onProgress,
        onSuccess,
      })

      expect(controller).toHaveProperty('abort')
      expect(controller).toHaveProperty('xhr')
      expect(mockXHR.open).toHaveBeenCalledWith(
        'POST',
        UPLOAD_CONFIG.UPLOAD_ENDPOINT
      )
      expect(mockXHR.withCredentials).toBe(true)
    })

    test('無効なファイルの場合、エラーコールバックが呼ばれる', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const onError = vi.fn()

      uploadImageFileWithProgress(file, { onError })

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('サポートされていない'),
        })
      )
    })

    test('abort()を呼ぶとアップロードがキャンセルされる', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const controller = uploadImageFileWithProgress(file, {})
      controller.abort()

      expect(mockXHR.abort).toHaveBeenCalled()
    })

    test('進捗イベントハンドラーが登録される', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const onProgress = vi.fn()

      uploadImageFileWithProgress(file, { onProgress })

      expect(mockXHR.upload.addEventListener).toHaveBeenCalledWith(
        'progress',
        expect.any(Function)
      )
    })

    test('アップロード成功時にonSuccessが呼ばれる', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const onSuccess = vi.fn()
      const mockResponse = {
        success: true,
        url: '/uploads/test.jpg',
        filename: 'test.jpg',
      }

      mockXHR.responseText = JSON.stringify(mockResponse)
      mockXHR.status = 200

      uploadImageFileWithProgress(file, { onSuccess })

      // loadイベントハンドラーを取得して実行
      const loadHandler = mockXHR.addEventListener.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any) => call[0] === 'load'
      )?.[1]
      loadHandler?.()

      expect(onSuccess).toHaveBeenCalledWith(mockResponse)
    })
  })

  describe('UPLOAD_CONFIG', () => {
    test('設定値の検証', () => {
      expect(UPLOAD_CONFIG.MAX_FILE_SIZE_MB).toBe(5)
      expect(UPLOAD_CONFIG.UPLOAD_ENDPOINT).toBe('/api/upload/image')
      expect(UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES).toEqual([
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ])
    })
  })
})
