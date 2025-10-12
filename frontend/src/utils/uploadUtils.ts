import type { UploadResponse, UploadError } from '@/types'

/**
 * File upload utilities - Pure functions for handling file uploads
 */

/**
 * Upload configuration constants
 */
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ] as const,
  UPLOAD_ENDPOINT: '/api/upload/image',
} as const

/**
 * Validate uploaded file
 */
export const validateImageFile = (
  file: File
): { isValid: boolean; error?: string } => {
  // Check file type
  if (
    !(UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES as readonly string[]).includes(
      file.type
    )
  ) {
    return {
      isValid: false,
      error: `サポートされていないファイル形式です。${UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}のみアップロード可能です。`,
    }
  }

  // Check file size
  const maxSizeInBytes = UPLOAD_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `ファイルサイズが大きすぎます。${UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB以下のファイルをアップロードしてください。`,
    }
  }

  return { isValid: true }
}

/**
 * Upload image file to server
 */
export const uploadImageFile = async (file: File): Promise<UploadResponse> => {
  const validation = validateImageFile(file)
  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  const formData = new FormData()
  formData.append('image', file)

  try {
    const response = await fetch(UPLOAD_CONFIG.UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData,
      credentials: 'include', // JWT認証のため
    })

    if (!response.ok) {
      let errorMessage = 'アップロードに失敗しました'

      try {
        const errorData: UploadError = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // JSON解析に失敗した場合はデフォルトメッセージを使用
      }

      throw new Error(errorMessage)
    }

    const result: UploadResponse = await response.json()
    return result
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('アップロード中にエラーが発生しました')
  }
}

/**
 * Create file input element for image selection
 */
export const createFileInput = (
  onFileSelect: (file: File) => void,
  multiple: boolean = false
): HTMLInputElement => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.join(',')
  input.multiple = multiple
  input.style.display = 'none'

  input.addEventListener('change', event => {
    const target = event.target as HTMLInputElement
    const files = target.files

    if (files && files.length > 0) {
      onFileSelect(files[0])
    }

    // Reset input to allow selecting the same file again
    input.value = ''
  })

  return input
}

/**
 * Handle drag and drop events for file upload
 */
export const handleDragEvents = {
  onDragOver: (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
  },

  onDragLeave: (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  },

  onDrop: (
    event: React.DragEvent,
    onFileSelect: (file: File) => void,
    onError?: (error: string) => void
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const files = Array.from(event.dataTransfer.files)

    if (files.length === 0) {
      onError?.('ファイルが選択されていません')
      return
    }

    const file = files[0]
    const validation = validateImageFile(file)

    if (!validation.isValid) {
      onError?.(validation.error || 'ファイルが無効です')
      return
    }

    onFileSelect(file)
  },
}

/**
 * Get image dimensions from file
 */
export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('画像の読み込みに失敗しました'))
    }

    img.src = url
  })
}

/**
 * Create preview URL for selected file
 */
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file)
}

/**
 * Cleanup preview URL
 */
export const cleanupPreviewUrl = (url: string): void => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

/**
 * Convert bytes to human-readable format
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)

  // 整数の場合は小数点以下を表示しない
  if (value % 1 === 0) {
    return value.toString() + ' ' + sizes[i]
  }

  return value.toFixed(dm) + ' ' + sizes[i]
}
