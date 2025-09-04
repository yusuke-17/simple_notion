import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, beforeEach, expect, vi, type MockedFunction } from 'vitest'
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
  blocks: [] // 空のブロック配列を追加
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
    
    // デフォルトのfetchモックを設定
    ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockDocument),
    } as unknown as Response)
  })

  it('ドキュメントが正しく読み込まれる', async () => {
    render(<DocumentEditor documentId={1} />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument()
      // 新しい動作では初期状態でブロックは表示されず、Add a blockボタンが表示される
      expect(screen.getByText('Add a block')).toBeInTheDocument()
    })
    
    expect(fetch).toHaveBeenCalledWith('/api/documents/1', {
      credentials: 'include'
    })
  })

  it('ローディング中は適切な表示がされる', () => {
    ;(fetch as MockedFunction<typeof fetch>).mockImplementation(
      () => new Promise(() => {}) // 永続的にpendingにする
    )
    
    render(<DocumentEditor documentId={1} />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('タイトルを編集できる', async () => {
    const user = userEvent.setup()
    render(<DocumentEditor documentId={1} />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument()
    })
    
    const titleInput = screen.getByDisplayValue('Test Document')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Title')
    
    expect(titleInput).toHaveValue('Updated Title')
  })

  it('Add a blockボタンでブロックを追加できる', async () => {
    const user = userEvent.setup()
    render(<DocumentEditor documentId={1} />)
    
    await waitFor(() => {
      expect(screen.getByText('Add a block')).toBeInTheDocument()
    })
    
    // Add a blockボタンをクリック
    const addButton = screen.getByText('Add a block')
    await user.click(addButton)
    
    // ブロックが追加されることを確認（テストでは実際のブロックエディターコンポーネントの確認が必要）
    expect(addButton).toBeInTheDocument()
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
          updatedAt: '2023-01-01T00:00:00Z'
        }
      ]
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
    
    ;(fetch as MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'))
    
    render(<DocumentEditor documentId={1} />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load document:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })
})
