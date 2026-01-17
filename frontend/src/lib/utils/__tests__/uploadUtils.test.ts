import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateImageFile,
  formatBytes,
  formatSpeed,
  uploadImageFileWithProgress,
  UPLOAD_CONFIG,
} from '$lib/utils/uploadUtils'

describe('uploadUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    let mockXHR: {
      open: ReturnType<typeof vi.fn>
      send: ReturnType<typeof vi.fn>
      abort: ReturnType<typeof vi.fn>
      setRequestHeader: ReturnType<typeof vi.fn>
      upload: {
        addEventListener: ReturnType<typeof vi.fn>
      }
      addEventListener: ReturnType<typeof vi.fn>
      withCredentials: boolean
      status: number
      responseText: string
    }

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

      // コンストラクタとして使えるクラスでXMLHttpRequestをモック
      const MockXMLHttpRequest = vi.fn(function (this: typeof mockXHR) {
        Object.assign(this, mockXHR)
      }) as unknown as typeof XMLHttpRequest
      vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
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
      // withCredentialsは実際のXHRインスタンスで設定されるため、controller.xhrから確認
      expect(controller.xhr.withCredentials).toBe(true)
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
