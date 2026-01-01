import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchPresignedURL,
  formatFileSize,
  getFileCategoryFromMimeType,
  getMimeTypeFromFilename,
  isPresignedURL,
  estimatePresignedURLExpiration,
  isPresignedURLExpired,
} from '../minioUtils'

// fetch APIのモック
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('minioUtils', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchPresignedURL', () => {
    it('正常にファイルIDから署名付きURLを取得できる', async () => {
      // Arrange
      const mockResponse = {
        url: 'https://minio.example.com/bucket/file.jpg?X-Amz-Signature=abc123',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      // Act
      const result = await fetchPresignedURL(123)

      // Assert
      expect(result).toBe(mockResponse.url)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/files/123/url',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      )
    })

    it('APIエラー時に適切なエラーをスローする', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ message: 'File not found' }),
      })

      // Act & Assert
      await expect(fetchPresignedURL(999)).rejects.toThrow('File not found')
    })

    it('ネットワークエラー時にエラーをスローする', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      // Act & Assert
      await expect(fetchPresignedURL(123)).rejects.toThrow('Network error')
    })
  })

  describe('formatFileSize', () => {
    it('0バイトを正しくフォーマットする', () => {
      expect(formatFileSize(0)).toBe('0 B')
    })

    it('バイト単位を正しくフォーマットする', () => {
      expect(formatFileSize(500)).toBe('500.00 B')
    })

    it('KB単位を正しくフォーマットする', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB')
      expect(formatFileSize(1536)).toBe('1.50 KB')
    })

    it('MB単位を正しくフォーマットする', () => {
      expect(formatFileSize(1048576)).toBe('1.00 MB')
      expect(formatFileSize(1572864)).toBe('1.50 MB')
    })

    it('GB単位を正しくフォーマットする', () => {
      expect(formatFileSize(1073741824)).toBe('1.00 GB')
    })

    it('TB単位を正しくフォーマットする', () => {
      expect(formatFileSize(1099511627776)).toBe('1.00 TB')
    })
  })

  describe('getFileCategoryFromMimeType', () => {
    it('画像MIMEタイプを正しく判定する', () => {
      expect(getFileCategoryFromMimeType('image/jpeg')).toBe('image')
      expect(getFileCategoryFromMimeType('image/png')).toBe('image')
      expect(getFileCategoryFromMimeType('image/gif')).toBe('image')
    })

    it('PDF MIMEタイプを正しく判定する', () => {
      expect(getFileCategoryFromMimeType('application/pdf')).toBe('pdf')
    })

    it('Word文書MIMEタイプを正しく判定する', () => {
      expect(getFileCategoryFromMimeType('application/msword')).toBe('document')
      expect(
        getFileCategoryFromMimeType(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe('document')
    })

    it('Excel文書MIMEタイプを正しく判定する', () => {
      expect(getFileCategoryFromMimeType('application/vnd.ms-excel')).toBe(
        'spreadsheet'
      )
      expect(
        getFileCategoryFromMimeType(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
      ).toBe('spreadsheet')
    })

    it('その他のMIMEタイプをotherと判定する', () => {
      expect(getFileCategoryFromMimeType('application/zip')).toBe('other')
      expect(getFileCategoryFromMimeType('text/plain')).toBe('other')
    })
  })

  describe('getMimeTypeFromFilename', () => {
    it('画像ファイル拡張子を正しく判定する', () => {
      expect(getMimeTypeFromFilename('photo.jpg')).toBe('image/jpeg')
      expect(getMimeTypeFromFilename('photo.jpeg')).toBe('image/jpeg')
      expect(getMimeTypeFromFilename('photo.png')).toBe('image/png')
      expect(getMimeTypeFromFilename('photo.gif')).toBe('image/gif')
    })

    it('ドキュメントファイル拡張子を正しく判定する', () => {
      expect(getMimeTypeFromFilename('document.pdf')).toBe('application/pdf')
      expect(getMimeTypeFromFilename('document.doc')).toBe('application/msword')
      expect(getMimeTypeFromFilename('document.docx')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    })

    it('スプレッドシートファイル拡張子を正しく判定する', () => {
      expect(getMimeTypeFromFilename('spreadsheet.xls')).toBe(
        'application/vnd.ms-excel'
      )
      expect(getMimeTypeFromFilename('spreadsheet.xlsx')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    })

    it('不明な拡張子にデフォルトMIMEタイプを返す', () => {
      expect(getMimeTypeFromFilename('file.unknown')).toBe(
        'application/octet-stream'
      )
      expect(getMimeTypeFromFilename('noextension')).toBe(
        'application/octet-stream'
      )
    })

    it('大文字小文字を区別せずに判定する', () => {
      expect(getMimeTypeFromFilename('photo.JPG')).toBe('image/jpeg')
      expect(getMimeTypeFromFilename('document.PDF')).toBe('application/pdf')
    })
  })

  describe('isPresignedURL', () => {
    it('署名付きURLを正しく判定する', () => {
      const presignedURL =
        'https://minio.example.com/bucket/file.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc123'
      expect(isPresignedURL(presignedURL)).toBe(true)
    })

    it('通常のURLをfalseと判定する', () => {
      const normalURL = 'https://example.com/file.jpg'
      expect(isPresignedURL(normalURL)).toBe(false)
    })

    it('不正なURL形式をfalseと判定する', () => {
      const invalidURL = 'not-a-url'
      expect(isPresignedURL(invalidURL)).toBe(false)
    })
  })

  describe('estimatePresignedURLExpiration', () => {
    it('署名付きURLの有効期限を正しく推定する', () => {
      // 2024年1月1日 12:00:00 UTC + 3600秒（1時間）
      const presignedURL =
        'https://minio.example.com/bucket/file.jpg?X-Amz-Date=20240101T120000Z&X-Amz-Expires=3600&X-Amz-Signature=abc123'

      const expiration = estimatePresignedURLExpiration(presignedURL)

      expect(expiration).toBeInstanceOf(Date)
      expect(expiration?.getTime()).toBe(
        new Date('2024-01-01T13:00:00Z').getTime()
      )
    })

    it('署名パラメータがない場合にnullを返す', () => {
      const normalURL = 'https://example.com/file.jpg'
      expect(estimatePresignedURLExpiration(normalURL)).toBeNull()
    })

    it('不正なURL形式の場合にnullを返す', () => {
      expect(estimatePresignedURLExpiration('not-a-url')).toBeNull()
    })
  })

  describe('isPresignedURLExpired', () => {
    it('期限切れの署名付きURLをtrueと判定する', () => {
      // 過去の日時（2020年1月1日 12:00:00 UTC + 3600秒）
      const expiredURL =
        'https://minio.example.com/bucket/file.jpg?X-Amz-Date=20200101T120000Z&X-Amz-Expires=3600&X-Amz-Signature=abc123'

      expect(isPresignedURLExpired(expiredURL, 0)).toBe(true)
    })

    it('まだ有効な署名付きURLをfalseと判定する', () => {
      // 未来の日時を生成（現在時刻 + 25時間）
      const futureDate = new Date(Date.now() + 25 * 60 * 60 * 1000)
      const year = futureDate.getUTCFullYear()
      const month = String(futureDate.getUTCMonth() + 1).padStart(2, '0')
      const day = String(futureDate.getUTCDate()).padStart(2, '0')
      const hours = String(futureDate.getUTCHours()).padStart(2, '0')
      const minutes = String(futureDate.getUTCMinutes()).padStart(2, '0')
      const seconds = String(futureDate.getUTCSeconds()).padStart(2, '0')

      const validURL = `https://minio.example.com/bucket/file.jpg?X-Amz-Date=${year}${month}${day}T${hours}${minutes}${seconds}Z&X-Amz-Expires=86400&X-Amz-Signature=abc123`

      expect(isPresignedURLExpired(validURL, 60)).toBe(false)
    })

    it('推定できないURLの場合にfalseを返す', () => {
      const normalURL = 'https://example.com/file.jpg'
      expect(isPresignedURLExpired(normalURL)).toBe(false)
    })

    it('バッファ時間を考慮して判定する', () => {
      // 現在時刻 + 30分（バッファ60分以内なので期限切れと判定される）
      const nearExpiryDate = new Date(Date.now() + 30 * 60 * 1000)
      const year = nearExpiryDate.getUTCFullYear()
      const month = String(nearExpiryDate.getUTCMonth() + 1).padStart(2, '0')
      const day = String(nearExpiryDate.getUTCDate()).padStart(2, '0')
      const hours = String(nearExpiryDate.getUTCHours()).padStart(2, '0')
      const minutes = String(nearExpiryDate.getUTCMinutes()).padStart(2, '0')
      const seconds = String(nearExpiryDate.getUTCSeconds()).padStart(2, '0')

      const nearExpiryURL = `https://minio.example.com/bucket/file.jpg?X-Amz-Date=${year}${month}${day}T${hours}${minutes}${seconds}Z&X-Amz-Expires=1800&X-Amz-Signature=abc123`

      expect(isPresignedURLExpired(nearExpiryURL, 60)).toBe(true)
    })
  })
})
