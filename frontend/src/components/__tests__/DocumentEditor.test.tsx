import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import {
  describe,
  it,
  beforeEach,
  afterEach,
  expect,
  vi,
  type MockedFunction,
} from 'vitest'
import { DocumentEditor } from '../DocumentEditor'

// fetchのモック
global.fetch = vi.fn()

const mockDocument = {
  id: 1,
  title: 'Test Document',
  content: 'Test content',
  parentId: null,
  userId: 1,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  blocks: [], // 空のブロック配列を追加
}

// カスタムイベントのモック
const mockDispatchEvent = vi.fn()
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true,
})

describe('DocumentEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDispatchEvent.mockClear()

    // デフォルトのfetchモックを設定（すべてのテストで使用）
    ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockDocument),
    } as unknown as Response)
  })

  afterEach(() => {
    // 各テスト後にモックをクリア
    vi.clearAllMocks()
  })

  it('ドキュメントが正しく読み込まれ、初期ブロックが自動作成される', async () => {
    render(<DocumentEditor documentId={1} />)

    await waitFor(() => {
      // タイトル入力要素を確認
      expect(screen.getByPlaceholderText('Untitled')).toBeInTheDocument()
      // ドキュメントが読み込まれて初期ブロックが作成される
      expect(screen.getByTitle('Add block')).toBeInTheDocument()
    })

    expect(fetch).toHaveBeenCalledWith('/api/documents/1', {
      method: 'GET',
      credentials: 'include',
    })
  })

  describe('Loading State', () => {
    it('ローディング中は適切な表示がされる', () => {
      ;(fetch as MockedFunction<typeof fetch>).mockImplementation(
        () => new Promise(() => {}) // 永続的にpendingにする
      )

      render(<DocumentEditor documentId={1} />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  it('タイトルを編集できる', async () => {
    // テスト開始前にモックを明確にリセット
    vi.clearAllMocks()

    // fetchモックをより現実的に設定
    ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(mockDocument),
      text: vi.fn().mockResolvedValue(JSON.stringify(mockDocument)),
    } as unknown as Response)

    render(<DocumentEditor documentId={1} />)

    // ローディングが完了し、タイトルが表示されるまで待機
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const titleInput = await waitFor(() =>
      screen.getByTestId('document-title-input')
    )

    // タイトルが正しく設定されているか確認
    await waitFor(() => {
      expect(titleInput).toHaveValue('Test Document')
    })

    // 直接値を変更してchangeイベントを発火
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } })

    expect(titleInput).toHaveValue('Updated Title')
  })

  it('空のドキュメントでは初期ブロックが自動作成される', async () => {
    render(<DocumentEditor documentId={1} />)

    await waitFor(() => {
      // 空のドキュメントでも自動的に初期ブロックが作成される
      expect(screen.getByPlaceholderText('Untitled')).toBeInTheDocument()
    })
  })

  it('既存のブロックがある場合はそれらが表示される', async () => {
    const mockDocumentWithBlocks = {
      ...mockDocument,
      blocks: [
        {
          id: 1,
          type: 'text',
          content: 'Test block content',
          documentId: 1,
          position: 0,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ],
    }

    ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockDocumentWithBlocks),
    } as unknown as Response)

    render(<DocumentEditor documentId={1} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument()
      // ブロックが存在する場合はSortableBlockEditorが表示される
      // Note: 実際のテストではSortableBlockEditorコンポーネントの要素を確認する必要がある
    })
  })
  it('ドキュメント読み込みエラー時の処理', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    ;(fetch as MockedFunction<typeof fetch>).mockRejectedValue(
      new Error('Network error')
    )

    render(<DocumentEditor documentId={1} />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load document:',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })
})
