import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import {
  ImageBlockEditor,
  ImageBlockDisplay,
} from '@/components/ImageBlockEditor'
import type { ImageBlockContent } from '@/types'

// Mock fetch for upload tests
global.fetch = vi.fn()

describe('ImageBlockEditor', () => {
  const mockContent: ImageBlockContent = {
    src: '/api/uploads/test-image.jpg',
    alt: 'Test image',
    caption: 'This is a test image',
    width: 800,
    height: 600,
    originalName: 'test-image.jpg',
    fileSize: 150000,
  }

  const mockOnContentChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    vi.mocked(fetch).mockClear()
  })

  test('画像なしの状態でアップロードエリアを表示', () => {
    render(<ImageBlockEditor onContentChange={mockOnContentChange} />)

    expect(
      screen.getByText('Click to upload image or drag & drop')
    ).toBeInTheDocument()
    expect(
      screen.getByText('JPEG, PNG, GIF, WebP形式、最大5MB')
    ).toBeInTheDocument()
  })

  test('カスタムプレースホルダーを表示', () => {
    const customPlaceholder = 'カスタムプレースホルダー'
    render(
      <ImageBlockEditor
        placeholder={customPlaceholder}
        onContentChange={mockOnContentChange}
      />
    )

    expect(screen.getByText(customPlaceholder)).toBeInTheDocument()
  })

  test('既存の画像コンテンツを表示', () => {
    render(
      <ImageBlockEditor
        initialContent={mockContent}
        onContentChange={mockOnContentChange}
      />
    )

    const image = screen.getByAltText('Test image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/api/uploads/test-image.jpg')

    expect(screen.getByDisplayValue('This is a test image')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test image')).toBeInTheDocument()
  })

  test('キャプションを編集', async () => {
    const user = userEvent.setup()

    render(
      <ImageBlockEditor
        initialContent={mockContent}
        onContentChange={mockOnContentChange}
      />
    )

    const captionInput = screen.getByDisplayValue('This is a test image')
    await user.clear(captionInput)
    await user.type(captionInput, '新しいキャプション')

    expect(mockOnContentChange).toHaveBeenCalledWith({
      ...mockContent,
      caption: '新しいキャプション',
    })
  })

  test('Alt属性を編集', async () => {
    const user = userEvent.setup()

    render(
      <ImageBlockEditor
        initialContent={mockContent}
        onContentChange={mockOnContentChange}
      />
    )

    const altInput = screen.getByDisplayValue('Test image')
    await user.clear(altInput)
    await user.type(altInput, '新しいAltテキスト')

    expect(mockOnContentChange).toHaveBeenCalledWith({
      ...mockContent,
      alt: '新しいAltテキスト',
    })
  })

  test('画像を削除', async () => {
    const user = userEvent.setup()

    render(
      <ImageBlockEditor
        initialContent={mockContent}
        onContentChange={mockOnContentChange}
      />
    )

    // ホバーで削除ボタンを表示させるため、画像をホバー
    const imageContainer = screen
      .getByAltText('Test image')
      .closest('.relative')
    expect(imageContainer).toBeInTheDocument()

    await user.hover(imageContainer!)

    const deleteButton = screen.getByTitle('画像を削除')
    await user.click(deleteButton)

    expect(mockOnContentChange).toHaveBeenCalledWith({
      src: '',
      alt: '',
      caption: '',
      width: 0,
      height: 0,
      originalName: '',
      fileSize: 0,
    })
  })

  test('無効なファイル形式でエラー表示', async () => {
    render(<ImageBlockEditor onContentChange={mockOnContentChange} />)

    // 無効なファイルを作成
    const file = new File(['invalid'], 'test.txt', { type: 'text/plain' })

    // アップロードエリアを取得（divでボタンとしての役割）
    const uploadArea = screen
      .getByText('Click to upload image or drag & drop')
      .closest('div')

    // ファイルを選択（ドロップのシミュレート）
    fireEvent.drop(uploadArea!, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(
        screen.getByText(/サポートされていないファイル形式です/)
      ).toBeInTheDocument()
    })
  })

  test('ファイルサイズが大きすぎる場合のエラー表示', async () => {
    render(<ImageBlockEditor onContentChange={mockOnContentChange} />)

    // 大きすぎるファイルを作成（6MB）
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    })

    const uploadArea = screen
      .getByText('Click to upload image or drag & drop')
      .closest('div')

    fireEvent.drop(uploadArea!, {
      dataTransfer: {
        files: [largeFile],
      },
    })

    await waitFor(() => {
      expect(
        screen.getByText(/ファイルサイズが大きすぎます/)
      ).toBeInTheDocument()
    })
  })

  test.skip('アップロード成功時の処理', async () => {
    // URL.createObjectURL のモック
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url')
    global.URL.revokeObjectURL = vi.fn()

    // fetch のモック設定
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        url: '/api/uploads/uploaded-image.jpg',
        filename: 'uploaded-image.jpg',
      }),
    } as Response)

    // Image オブジェクトのモック - より信頼性の高い実装
    let imageLoadCallback: (() => void) | null = null
    const mockImage = {
      naturalWidth: 1200,
      naturalHeight: 800,
      addEventListener: vi.fn((event: string, callback: () => void) => {
        if (event === 'load') {
          imageLoadCallback = callback
        }
      }),
      removeEventListener: vi.fn(),
      set src(_: string) {
        // src設定時に即座にloadイベントを発火
        setTimeout(() => {
          if (imageLoadCallback) {
            imageLoadCallback()
          }
        }, 10)
      },
    }

    global.Image = vi.fn(() => mockImage) as unknown as typeof Image

    render(<ImageBlockEditor onContentChange={mockOnContentChange} />)

    const validFile = new File(['image content'], 'test.jpg', {
      type: 'image/jpeg',
    })

    const uploadArea = screen
      .getByText('Click to upload image or drag & drop')
      .closest('div')

    fireEvent.drop(uploadArea!, {
      dataTransfer: {
        files: [validFile],
      },
    })

    await waitFor(
      () => {
        expect(mockOnContentChange).toHaveBeenCalledWith({
          src: '/api/uploads/uploaded-image.jpg',
          alt: 'test',
          caption: '',
          width: 1200,
          height: 800,
          originalName: 'test.jpg',
          fileSize: validFile.size,
        })
      },
      { timeout: 2000 }
    )
  })
})

describe('ImageBlockDisplay', () => {
  const mockContent: ImageBlockContent = {
    src: '/api/uploads/test-image.jpg',
    alt: 'Test image',
    caption: 'This is a test caption',
    width: 800,
    height: 600,
    originalName: 'test-image.jpg',
    fileSize: 150000,
  }

  test('画像とキャプションを表示', () => {
    render(<ImageBlockDisplay content={mockContent} />)

    const image = screen.getByAltText('Test image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/api/uploads/test-image.jpg')

    expect(screen.getByText('This is a test caption')).toBeInTheDocument()
  })

  test('キャプションなしで画像のみ表示', () => {
    const contentWithoutCaption = { ...mockContent, caption: '' }

    render(<ImageBlockDisplay content={contentWithoutCaption} />)

    const image = screen.getByAltText('Test image')
    expect(image).toBeInTheDocument()

    expect(screen.queryByText('This is a test caption')).not.toBeInTheDocument()
  })

  test('画像なしの場合のプレースホルダー表示', () => {
    const emptyContent: ImageBlockContent = {
      src: '',
      alt: '',
      caption: '',
      width: 0,
      height: 0,
      originalName: '',
      fileSize: 0,
    }

    render(<ImageBlockDisplay content={emptyContent} />)

    expect(screen.getByText('画像が設定されていません')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  test('カスタムクラス名を適用', () => {
    const { container } = render(
      <ImageBlockDisplay content={mockContent} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass(
      'image-block-display',
      'custom-class'
    )
  })
})
