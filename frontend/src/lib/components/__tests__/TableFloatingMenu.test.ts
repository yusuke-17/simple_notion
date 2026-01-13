import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import TableFloatingMenu from '../TableFloatingMenu.svelte'

describe('TableFloatingMenu', () => {
  const mockPosition = { top: 100, left: 200 }
  const mockHandlers = {
    onAddRowBefore: vi.fn(),
    onAddRowAfter: vi.fn(),
    onDeleteRow: vi.fn(),
    onAddColumnBefore: vi.fn(),
    onAddColumnAfter: vi.fn(),
    onDeleteColumn: vi.fn(),
    onDeleteTable: vi.fn(),
  }

  it('正しい位置に表示される', () => {
    const { container } = render(TableFloatingMenu, {
      props: {
        position: mockPosition,
        ...mockHandlers,
      },
    })

    const menu = container.querySelector('div')
    expect(menu).toHaveStyle({ top: '100px', left: '200px' })
  })

  it('すべてのボタンが表示される', () => {
    render(TableFloatingMenu, {
      props: {
        position: mockPosition,
        ...mockHandlers,
      },
    })

    expect(screen.getByRole('button', { name: /行を上に追加/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /行を下に追加/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /行を削除/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /列を左に追加/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /列を右に追加/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /列を削除/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /テーブルを削除/i })).toBeInTheDocument()
  })

  it('行追加ボタンクリックで正しいハンドラが呼ばれる', async () => {
    render(TableFloatingMenu, {
      props: {
        position: mockPosition,
        ...mockHandlers,
      },
    })

    const addRowBeforeBtn = screen.getByRole('button', { name: /行を上に追加/i })
    await fireEvent.click(addRowBeforeBtn)

    expect(mockHandlers.onAddRowBefore).toHaveBeenCalledTimes(1)
  })

  it('列削除ボタンクリックで正しいハンドラが呼ばれる', async () => {
    render(TableFloatingMenu, {
      props: {
        position: mockPosition,
        ...mockHandlers,
      },
    })

    const deleteColumnBtn = screen.getByRole('button', { name: /列を削除/i })
    await fireEvent.click(deleteColumnBtn)

    expect(mockHandlers.onDeleteColumn).toHaveBeenCalledTimes(1)
  })

  it('テーブル削除ボタンは危険スタイルで表示される', () => {
    render(TableFloatingMenu, {
      props: {
        position: mockPosition,
        ...mockHandlers,
      },
    })

    const deleteTableBtn = screen.getByRole('button', { name: /テーブルを削除/i })
    expect(deleteTableBtn).toHaveClass('text-red-500')
  })
})
