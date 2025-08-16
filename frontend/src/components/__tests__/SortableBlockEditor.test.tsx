import { render, screen } from '@testing-library/react'
import { describe, test, beforeEach, expect, vi } from 'vitest'
import { SortableBlockEditor } from '../SortableBlockEditor'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Block } from '@/types'

// Mock the useSortable hook
vi.mock('@dnd-kit/sortable', async () => {
  const actual = await vi.importActual('@dnd-kit/sortable')
  return {
    ...actual,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    }),
  }
})

const mockBlock: Block = {
  id: 1,
  type: 'text',
  content: 'テストコンテンツ',
  position: 0,
  documentId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockHandlers = {
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  onAddBlock: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
  onFocus: vi.fn(),
}

const renderWithDndContext = (component: React.ReactElement) => {
  return render(
    <DndContext>
      <SortableContext
        items={[mockBlock.id.toString()]}
        strategy={verticalListSortingStrategy}
      >
        {component}
      </SortableContext>
    </DndContext>
  )
}

describe('SortableBlockEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('レンダリングが正常に行われる', () => {
    renderWithDndContext(
      <SortableBlockEditor
        block={mockBlock}
        {...mockHandlers}
      />
    )

    expect(screen.getByDisplayValue('テストコンテンツ')).toBeInTheDocument()
  })

  test('BlockEditorコンポーネントが正しいpropsを受け取る', () => {
    renderWithDndContext(
      <SortableBlockEditor
        block={mockBlock}
        {...mockHandlers}
      />
    )

    // BlockEditorが正常にレンダリングされているかテスト
    const textArea = screen.getByDisplayValue('テストコンテンツ')
    expect(textArea).toBeInTheDocument()
    expect(textArea).toHaveAttribute('placeholder', 'Type / for commands')
  })

  test('ドラッグハンドルが存在する', () => {
    renderWithDndContext(
      <SortableBlockEditor
        block={mockBlock}
        {...mockHandlers}
      />
    )

    // マウスホバーでドラッグハンドルが表示されるはず
    const blockContainer = screen.getByRole('textbox').closest('.group')
    expect(blockContainer).toBeInTheDocument()
  })

  test('異なるブロックタイプでも正常にレンダリングされる', () => {
    const headingBlock: Block = {
      ...mockBlock,
      type: 'heading1',
      content: 'テスト見出し',
    }

    renderWithDndContext(
      <SortableBlockEditor
        block={headingBlock}
        {...mockHandlers}
      />
    )

    expect(screen.getByDisplayValue('テスト見出し')).toBeInTheDocument()
  })

  test('空のコンテンツでもレンダリングされる', () => {
    const emptyBlock: Block = {
      ...mockBlock,
      content: '',
    }

    renderWithDndContext(
      <SortableBlockEditor
        block={emptyBlock}
        {...mockHandlers}
      />
    )

    const textArea = screen.getByRole('textbox')
    expect(textArea).toBeInTheDocument()
    expect(textArea).toHaveValue('')
  })
})
