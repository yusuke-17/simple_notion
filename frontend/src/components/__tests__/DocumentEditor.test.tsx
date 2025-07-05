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
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

describe('DocumentEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    
    // 削除ボタンはtrashアイコンを含む2番目のボタン
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[1] // 2番目のボタンが削除ボタン
    await user.click(deleteButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith('/api/documents/1', {
        method: 'DELETE',
        credentials: 'include',
      })
    })
  })
})
