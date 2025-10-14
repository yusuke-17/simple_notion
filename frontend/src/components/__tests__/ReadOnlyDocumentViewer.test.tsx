import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReadOnlyDocumentViewer } from '../ReadOnlyDocumentViewer'

// useReadOnlyDocumentViewer フックをモック
vi.mock('@/hooks/useReadOnlyDocumentViewer', () => ({
  useReadOnlyDocumentViewer: vi.fn(),
}))

// UI コンポーネントをモック
vi.mock('@/components/ui/input', () => ({
  Input: ({ value, ...props }: { value?: string; [key: string]: unknown }) => (
    <input value={value} {...props} />
  ),
}))

describe('ReadOnlyDocumentViewer', () => {
  const mockDocument = {
    id: 1,
    title: 'Test Document',
    content: 'Test content',
    parentId: null,
    userId: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    blocks: [
      {
        id: 1,
        type: 'text',
        content: 'First block content',
        documentId: 1,
        position: 0,
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 2,
        type: 'text',
        content: 'Second block content',
        documentId: 1,
        position: 1,
        createdAt: '2023-01-01T00:00:00Z',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ローディング状態を正しく表示する', async () => {
    const { useReadOnlyDocumentViewer } = await import(
      '@/hooks/useReadOnlyDocumentViewer'
    )
    vi.mocked(useReadOnlyDocumentViewer).mockReturnValue({
      document: null,
      isLoading: true,
      error: null,
      isEmpty: true,
      isReady: false,
    })

    render(<ReadOnlyDocumentViewer documentId={1} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('エラー状態を正しく表示する', async () => {
    const { useReadOnlyDocumentViewer } = await import(
      '@/hooks/useReadOnlyDocumentViewer'
    )
    vi.mocked(useReadOnlyDocumentViewer).mockReturnValue({
      document: null,
      isLoading: false,
      error: 'Failed to load document',
      isEmpty: true,
      isReady: false,
    })

    render(<ReadOnlyDocumentViewer documentId={1} />)

    expect(
      screen.getByText('Error: Failed to load document')
    ).toBeInTheDocument()
  })

  it('ドキュメントが見つからない場合のメッセージを表示する', async () => {
    const { useReadOnlyDocumentViewer } = await import(
      '@/hooks/useReadOnlyDocumentViewer'
    )
    vi.mocked(useReadOnlyDocumentViewer).mockReturnValue({
      document: null,
      isLoading: false,
      error: null,
      isEmpty: true,
      isReady: false,
    })

    render(<ReadOnlyDocumentViewer documentId={1} />)

    expect(screen.getByText('Document not found')).toBeInTheDocument()
  })

  it('読み取り専用バナーを表示する', async () => {
    const { useReadOnlyDocumentViewer } = await import(
      '@/hooks/useReadOnlyDocumentViewer'
    )
    vi.mocked(useReadOnlyDocumentViewer).mockReturnValue({
      document: mockDocument,
      isLoading: false,
      error: null,
      isEmpty: false,
      isReady: true,
    })

    render(<ReadOnlyDocumentViewer documentId={1} />)

    expect(
      screen.getByText('📄 このドキュメントは読み取り専用です（ゴミ箱内）')
    ).toBeInTheDocument()
  })

  it('ドキュメントのタイトルを読み取り専用で表示する', async () => {
    const { useReadOnlyDocumentViewer } = await import(
      '@/hooks/useReadOnlyDocumentViewer'
    )
    vi.mocked(useReadOnlyDocumentViewer).mockReturnValue({
      document: mockDocument,
      isLoading: false,
      error: null,
      isEmpty: false,
      isReady: true,
    })

    render(<ReadOnlyDocumentViewer documentId={1} />)

    const titleInput = screen.getByTestId('readonly-document-title')
    expect(titleInput).toBeInTheDocument()
    expect(titleInput).toHaveAttribute('readonly')
    expect(titleInput).toHaveValue('Test Document')
  })

  it('ブロックのコンテンツを読み取り専用で表示する', async () => {
    const { useReadOnlyDocumentViewer } = await import(
      '@/hooks/useReadOnlyDocumentViewer'
    )
    vi.mocked(useReadOnlyDocumentViewer).mockReturnValue({
      document: mockDocument,
      isLoading: false,
      error: null,
      isEmpty: false,
      isReady: true,
    })

    render(<ReadOnlyDocumentViewer documentId={1} />)

    expect(screen.getByTestId('readonly-block-1')).toBeInTheDocument()
    expect(screen.getByTestId('readonly-block-2')).toBeInTheDocument()
    expect(screen.getByTestId('readonly-block-content-1')).toHaveTextContent(
      'First block content'
    )
    expect(screen.getByTestId('readonly-block-content-2')).toHaveTextContent(
      'Second block content'
    )
  })

  it('画像ブロックを正しく表示する', async () => {
    const documentWithImageBlock = {
      ...mockDocument,
      blocks: [
        {
          id: 3,
          type: 'image',
          content: JSON.stringify({
            src: '/uploads/test.jpg',
            alt: 'Test image',
            caption: 'Test caption',
            width: 300,
            height: 200,
          }),
          documentId: 1,
          position: 0,
          createdAt: '2023-01-01T00:00:00Z',
        },
      ],
    }

    const { useReadOnlyDocumentViewer } = await import(
      '@/hooks/useReadOnlyDocumentViewer'
    )
    vi.mocked(useReadOnlyDocumentViewer).mockReturnValue({
      document: documentWithImageBlock,
      isLoading: false,
      error: null,
      isEmpty: false,
      isReady: true,
    })

    render(<ReadOnlyDocumentViewer documentId={1} />)

    const image = screen.getByRole('img')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/uploads/test.jpg')
    expect(image).toHaveAttribute('alt', 'Test image')
    expect(screen.getByText('Test caption')).toBeInTheDocument()
  })

  it('空のドキュメントに対して適切なメッセージを表示する', async () => {
    const emptyDocument = {
      ...mockDocument,
      blocks: [],
    }

    const { useReadOnlyDocumentViewer } = await import(
      '@/hooks/useReadOnlyDocumentViewer'
    )
    vi.mocked(useReadOnlyDocumentViewer).mockReturnValue({
      document: emptyDocument,
      isLoading: false,
      error: null,
      isEmpty: true,
      isReady: true,
    })

    render(<ReadOnlyDocumentViewer documentId={1} />)

    expect(
      screen.getByText('このドキュメントには内容がありません')
    ).toBeInTheDocument()
  })

  it('無効な画像ブロックJSONに対してエラーメッセージを表示する', async () => {
    const documentWithInvalidImage = {
      ...mockDocument,
      blocks: [
        {
          id: 4,
          type: 'image',
          content: 'invalid json content',
          documentId: 1,
          position: 0,
          createdAt: '2023-01-01T00:00:00Z',
        },
      ],
    }

    const { useReadOnlyDocumentViewer } = await import(
      '@/hooks/useReadOnlyDocumentViewer'
    )
    vi.mocked(useReadOnlyDocumentViewer).mockReturnValue({
      document: documentWithInvalidImage,
      isLoading: false,
      error: null,
      isEmpty: false,
      isReady: true,
    })

    render(<ReadOnlyDocumentViewer documentId={1} />)

    expect(screen.getByText(/画像を表示できません:/)).toBeInTheDocument()
  })

  it('コンポーネントが適切なCSSクラスを持つ', async () => {
    const { useReadOnlyDocumentViewer } = await import(
      '@/hooks/useReadOnlyDocumentViewer'
    )
    vi.mocked(useReadOnlyDocumentViewer).mockReturnValue({
      document: mockDocument,
      isLoading: false,
      error: null,
      isEmpty: false,
      isReady: true,
    })

    const { container } = render(<ReadOnlyDocumentViewer documentId={1} />)

    // コンテナが読み取り専用の視覚的なスタイルを持つことを確認
    const mainContainer = container.querySelector(
      '.opacity-70.pointer-events-none.select-text'
    )
    expect(mainContainer).toBeInTheDocument()
  })
})
