import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateFile,
  formatFileSize,
  getFileTypeName,
  getFileIconName,
  getFileExtension,
  formatSpeed,
  uploadFileWithProgress,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} from '../fileUploadUtils'

describe('fileUploadUtils', () => {
  describe('validateFile', () => {
    it('有効なPDFファイルを検証できる', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const result = validateFile(file)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('有効なDocxファイルを検証できる', () => {
      const file = new File(['test'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const result = validateFile(file)
      expect(result.isValid).toBe(true)
    })

    it('ファイルサイズが大きすぎる場合はエラーを返す', () => {
      const largeContent = new ArrayBuffer(MAX_FILE_SIZE + 1)
      const file = new File([largeContent], 'large.pdf', {
        type: 'application/pdf',
      })
      const result = validateFile(file)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('ファイルサイズが大きすぎます')
    })

    it('サポートされていないファイル形式の場合はエラーを返す', () => {
      const file = new File(['test'], 'test.mp4', { type: 'video/mp4' })
      const result = validateFile(file)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('サポートされていないファイル形式')
    })

    it('MIMEタイプが設定されていない場合は拡張子で判定する', () => {
      // MIMEタイプが空の場合、拡張子から推測する
      const file = new File(['test'], 'test.pdf', { type: '' })
      const result = validateFile(file)
      expect(result.isValid).toBe(true)
    })
  })

  describe('formatFileSize', () => {
    it('0バイトを正しくフォーマットする', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('バイトを正しくフォーマットする', () => {
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('キロバイトを正しくフォーマットする', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('メガバイトを正しくフォーマットする', () => {
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(5242880)).toBe('5 MB')
    })

    it('ギガバイトを正しくフォーマットする', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })
  })

  describe('getFileTypeName', () => {
    it('PDFのタイプ名を返す', () => {
      expect(getFileTypeName('application/pdf')).toBe('PDF')
    })

    it('Wordのタイプ名を返す', () => {
      expect(
        getFileTypeName(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe('Word')
      expect(getFileTypeName('application/msword')).toBe('Word')
    })

    it('Excelのタイプ名を返す', () => {
      expect(
        getFileTypeName(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
      ).toBe('Excel')
      expect(getFileTypeName('application/vnd.ms-excel')).toBe('Excel')
    })

    it('PowerPointのタイプ名を返す', () => {
      expect(
        getFileTypeName(
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
      ).toBe('PowerPoint')
    })

    it('テキストのタイプ名を返す', () => {
      expect(getFileTypeName('text/plain')).toBe('テキスト')
    })

    it('不明なMIMEタイプの場合はデフォルト値を返す', () => {
      expect(getFileTypeName('application/unknown')).toBe('ファイル')
    })
  })

  describe('getFileIconName', () => {
    it('PDFのアイコン名を返す', () => {
      expect(getFileIconName('application/pdf')).toBe('FileText')
    })

    it('Wordのアイコン名を返す', () => {
      expect(
        getFileIconName(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe('FileText')
    })

    it('Excelのアイコン名を返す', () => {
      expect(
        getFileIconName(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
      ).toBe('FileSpreadsheet')
    })

    it('PowerPointのアイコン名を返す', () => {
      expect(
        getFileIconName(
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
      ).toBe('FilePresentation')
    })

    it('圧縮ファイルのアイコン名を返す', () => {
      expect(getFileIconName('application/zip')).toBe('FileArchive')
      expect(getFileIconName('application/x-rar-compressed')).toBe(
        'FileArchive'
      )
    })

    it('テキスト/コードのアイコン名を返す', () => {
      expect(getFileIconName('text/plain')).toBe('FileCode')
      expect(getFileIconName('application/json')).toBe('FileCode')
    })

    it('不明なMIMEタイプの場合はデフォルトアイコン名を返す', () => {
      expect(getFileIconName('application/unknown')).toBe('File')
    })
  })

  describe('getFileExtension', () => {
    it('ファイル拡張子を取得できる', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf')
      expect(getFileExtension('file.docx')).toBe('docx')
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
    })

    it('拡張子がない場合は空文字を返す', () => {
      expect(getFileExtension('filename')).toBe('')
    })

    it('大文字の拡張子を小文字に変換する', () => {
      expect(getFileExtension('document.PDF')).toBe('pdf')
      expect(getFileExtension('file.DOCX')).toBe('docx')
    })
  })

  describe('定数の検証', () => {
    it('ALLOWED_FILE_TYPESが正しく定義されている', () => {
      expect(ALLOWED_FILE_TYPES).toContain('application/pdf')
      expect(ALLOWED_FILE_TYPES).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
      expect(ALLOWED_FILE_TYPES).toContain('text/plain')
      expect(ALLOWED_FILE_TYPES).toContain('application/zip')
    })

    it('MAX_FILE_SIZEが10MBに設定されている', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
    })
  })

  describe('formatSpeed', () => {
    it('速度を人間が読みやすい形式に変換する', () => {
      expect(formatSpeed(0)).toBe('0 B/s')
      expect(formatSpeed(512)).toBe('512.0 B/s')
      expect(formatSpeed(1024)).toBe('1.0 KB/s')
      expect(formatSpeed(1024 * 1024)).toBe('1.0 MB/s')
    })
  })

  describe('uploadFileWithProgress', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockXHR: any

    beforeEach(() => {
      // XMLHttpRequestのモック
      mockXHR = {
        open: vi.fn(),
        send: vi.fn(),
        abort: vi.fn(),
        upload: {
          addEventListener: vi.fn(),
        },
        addEventListener: vi.fn(),
        withCredentials: false,
        status: 200,
        responseText: '',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.XMLHttpRequest = vi.fn(() => mockXHR) as any
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('正常にファイルをアップロードし、コントローラーを返す', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const onProgress = vi.fn()

      const controller = uploadFileWithProgress(file, { onProgress })

      expect(controller).toHaveProperty('abort')
      expect(controller).toHaveProperty('xhr')
      expect(mockXHR.open).toHaveBeenCalledWith(
        'POST',
        'http://localhost:8080/api/upload/file'
      )
      expect(mockXHR.withCredentials).toBe(true)
    })

    it('無効なファイルの場合、エラーコールバックが呼ばれる', () => {
      const file = new File(['test'], 'test.mp4', { type: 'video/mp4' })
      const onError = vi.fn()

      uploadFileWithProgress(file, { onError })

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('サポートされていないファイル形式'),
        })
      )
    })

    it('abort()を呼ぶとアップロードがキャンセルされる', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

      const controller = uploadFileWithProgress(file, {})
      controller.abort()

      expect(mockXHR.abort).toHaveBeenCalled()
    })
  })
})
