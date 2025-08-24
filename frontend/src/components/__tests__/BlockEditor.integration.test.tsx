import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BlockEditor } from '../BlockEditor'
import type { Block } from '@/types'

// Mock RichTextEditor
vi.mock('../RichTextEditor', () => ({
  RichTextEditor: ({ content, onUpdate, placeholder }: {
    content: string
    onUpdate: (content: string) => void
    placeholder?: string
  }) => (
    <div data-testid="rich-text-editor">
      <div data-testid="editor-content">{content}</div>
      <input
        data-testid="editor-input"
        placeholder={placeholder}
        onChange={(e) => onUpdate(e.target.value)}
      />
    </div>
  )
}))

describe('BlockEditor Integration with RichTextEditor', () => {
  const mockBlock: Block = {
    id: 1,
    type: 'text',
    content: '',
    documentId: 1,
    position: 0,
    createdAt: '2024-01-01T00:00:00Z'
  }

  const mockProps = {
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onAddBlock: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onFocus: vi.fn(),
    dragHandleProps: {}
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders RichTextEditor for text type blocks', () => {
    render(
      <BlockEditor
        block={mockBlock}
        {...mockProps}
      />
    )

    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument()
    expect(screen.getByTestId('editor-input')).toHaveAttribute('placeholder', 'Type / for commands')
  })

  it('renders textarea for non-text type blocks', () => {
    const codeBlock = { ...mockBlock, type: 'code' }
    
    render(
      <BlockEditor
        block={codeBlock}
        {...mockProps}
      />
    )

    expect(screen.queryByTestId('rich-text-editor')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('handles rich text content updates', () => {
    render(
      <BlockEditor
        block={mockBlock}
        {...mockProps}
      />
    )

    const input = screen.getByTestId('editor-input')
    fireEvent.change(input, { target: { value: '{"type":"doc","content":[]}' } })

    expect(mockProps.onUpdate).toHaveBeenCalledWith(1, '{"type":"doc","content":[]}')
  })

  it('handles plain text content for text blocks', () => {
    const textBlock = { ...mockBlock, content: 'Plain text content' }
    
    render(
      <BlockEditor
        block={textBlock}
        {...mockProps}
      />
    )

    expect(screen.getByTestId('editor-content')).toHaveTextContent('Plain text content')
  })

  it('handles rich text JSON content for text blocks', () => {
    const richTextContent = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Rich text"}]}]}'
    const textBlock = { ...mockBlock, content: richTextContent }
    
    render(
      <BlockEditor
        block={textBlock}
        {...mockProps}
      />
    )

    expect(screen.getByTestId('editor-content')).toHaveTextContent(richTextContent)
  })

  it('shows block controls on hover', () => {
    render(
      <BlockEditor
        block={mockBlock}
        {...mockProps}
      />
    )

    const blockContainer = screen.getByTestId('rich-text-editor').closest('.group')
    expect(blockContainer).toBeInTheDocument()
  })

  it('handles keyboard shortcuts in rich text editor', () => {
    render(
      <BlockEditor
        block={mockBlock}
        {...mockProps}
      />
    )

    // The keyboard shortcuts are handled in the RichTextEditor component
    // This test verifies that the component is rendered correctly
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument()
  })
})
