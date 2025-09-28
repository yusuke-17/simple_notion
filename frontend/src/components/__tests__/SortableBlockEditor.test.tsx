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
    const { container } = renderWithDndContext(
      <SortableBlockEditor block={mockBlock} {...mockHandlers} />
    )

    // RichTextEditorのコンテンツはProseMirror内で表示される
    const editorContent = container.querySelector('.ProseMirror')
    expect(editorContent).toBeInTheDocument()
    expect(editorContent?.querySelector('p')).toHaveTextContent(
      'テストコンテンツ'
    )
  })

  test('BlockEditorコンポーネントが正しいpropsを受け取る', () => {
    const { container } = renderWithDndContext(
      <SortableBlockEditor block={mockBlock} {...mockHandlers} />
    )

    // BlockEditorが正常にレンダリングされているかテスト
    // RichTextEditorのコンテンツを確認
    const editorContent = container.querySelector('.ProseMirror')
    expect(editorContent).toBeInTheDocument()
    expect(editorContent?.querySelector('p')).toHaveTextContent(
      'テストコンテンツ'
    )
  })

  test('ドラッグハンドルが存在する', () => {
    const { container } = renderWithDndContext(
      <SortableBlockEditor block={mockBlock} {...mockHandlers} />
    )

    // エディター要素を取得してドラッグコンテナを確認
    const editorElement = container.querySelector('.ProseMirror')
    const blockContainer = editorElement?.closest('.group')
    expect(blockContainer).toBeInTheDocument()
  })

  test('異なるブロックタイプでも正常にレンダリングされる', () => {
    const headingBlock: Block = {
      ...mockBlock,
      type: 'heading1',
      content: 'テスト見出し',
    }

    renderWithDndContext(
      <SortableBlockEditor block={headingBlock} {...mockHandlers} />
    )

    expect(screen.getByDisplayValue('テスト見出し')).toBeInTheDocument()
  })

  test('空のコンテンツでもレンダリングされる', () => {
    const emptyBlock: Block = {
      ...mockBlock,
      content: '',
    }

    const { container } = renderWithDndContext(
      <SortableBlockEditor block={emptyBlock} {...mockHandlers} />
    )

    // エディターが表示されることを確認
    const editorElement = container.querySelector('.ProseMirror')
    expect(editorElement).toBeInTheDocument()
  })
})
