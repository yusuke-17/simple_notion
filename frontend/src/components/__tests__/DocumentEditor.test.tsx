import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeEach, expect, type MockedFunction } from 'vitest'
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
      expect(screen.getByDisplayValue('Test content')).toBeInTheDocument()
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

  it('コンテンツを編集できる', async () => {
    const user = userEvent.setup()
    render(<DocumentEditor documentId={1} />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test content')).toBeInTheDocument()
    })
    
    const contentTextarea = screen.getByDisplayValue('Test content')
    await user.clear(contentTextarea)
    await user.type(contentTextarea, 'Updated content')
    
    expect(contentTextarea).toHaveValue('Updated content')
  })

  it('保存ボタンをクリックするとドキュメントが保存される', async () => {
    const user = userEvent.setup()
    
    // 保存用のfetchモックを設定
    ;(fetch as MockedFunction<typeof fetch>).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/api/documents/1') && init?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({ ...mockDocument, title: 'Updated Title' }),
        } as unknown as Response)
      }
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDocument),
      } as unknown as Response)
    })
    
    render(<DocumentEditor documentId={1} />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument()
    })
    
    const titleInput = screen.getByDisplayValue('Test Document')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Title')
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/documents/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: 'Updated Title',
          content: 'Test content',
        }),
      })
    })
  })

  it('削除ボタンをクリックするとドキュメントが削除される', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn().mockReturnValue(true)
    
    // 削除用のfetchモックを設定
    ;(fetch as MockedFunction<typeof fetch>).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/api/documents/1') && init?.method === 'DELETE') {
        return Promise.resolve({ ok: true } as unknown as Response)
      }
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDocument),
      } as unknown as Response)
    })
    
    render(<DocumentEditor documentId={1} />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument()
    })
    
    // 削除ボタン（Trash2アイコンを含むボタン）を見つける
    const deleteButton = screen.getByRole('button', { name: '' }) // アイコンボタンなので名前がない
    await user.click(deleteButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/documents/1', {
        method: 'DELETE',
        credentials: 'include',
      })
    })
    
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'document-deleted',
        detail: { documentId: 1 }
      })
    )
  })

  it('削除確認ダイアログでキャンセルした場合は削除されない', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn().mockReturnValue(false)
    
    render(<DocumentEditor documentId={1} />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument()
    })
    
    const deleteButton = screen.getByRole('button', { name: '' })
    await user.click(deleteButton)
    
    // 削除APIが呼ばれないことを確認
    expect(fetch).not.toHaveBeenCalledWith('/api/documents/1', {
      method: 'DELETE',
      credentials: 'include',
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

  it('保存エラー時の処理', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // 最初の読み込みは成功、保存時にエラー
    ;(fetch as MockedFunction<typeof fetch>).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/api/documents/1') && init?.method === 'PUT') {
        return Promise.reject(new Error('Save failed'))
      }
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDocument),
      } as unknown as Response)
    })
    
    render(<DocumentEditor documentId={1} />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument()
    })
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save document:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })
})
