import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { RichTextEditor } from '../RichTextEditor'

// Mock useRichTextEditor hook with comprehensive mocked return values
const mockUseRichTextEditor = vi.fn()

vi.mock('@/hooks/useRichTextEditor', () => ({
  useRichTextEditor: (props: unknown) => mockUseRichTextEditor(props),
}))

// Mock TipTap modules
const mockEditor = {
  getJSON: vi.fn(() => ({ type: 'doc', content: [] })),
  commands: {
    setContent: vi.fn(),
    focus: vi.fn(),
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleStrike: vi.fn(),
  },
  chain: vi.fn(() => ({
    focus: vi.fn(() => ({
      toggleBold: vi.fn(() => ({ run: vi.fn() })),
      toggleItalic: vi.fn(() => ({ run: vi.fn() })),
      toggleUnderline: vi.fn(() => ({ run: vi.fn() })),
      toggleStrike: vi.fn(() => ({ run: vi.fn() })),
    })),
  })),
  isActive: vi.fn(() => false),
  isFocused: false,
}

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => mockEditor),
  EditorContent: ({
    className,
    editor,
  }: {
    editor?: unknown
    className?: string
  }) => (
    <div
      className={className}
      data-testid="rich-text-editor"
      data-editor={editor ? 'connected' : 'disconnected'}
    >
      <div className="tiptap ProseMirror">
        <p>Mock editor content</p>
      </div>
    </div>
  ),
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    className,
    ...props
  }: {
    children?: React.ReactNode
    onClick?: () => void
    variant?: string
    size?: string
    className?: string
    [key: string]: unknown
  }) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      data-testid="format-button"
      {...props}
    >
      {children}
    </button>
  ),
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Bold: (props: { className?: string }) => (
    <span data-testid="bold-icon" {...props} />
  ),
  Italic: (props: { className?: string }) => (
    <span data-testid="italic-icon" {...props} />
  ),
  Underline: (props: { className?: string }) => (
    <span data-testid="underline-icon" {...props} />
  ),
  Strikethrough: (props: { className?: string }) => (
    <span data-testid="strikethrough-icon" {...props} />
  ),
  Palette: (props: { className?: string }) => (
    <span data-testid="palette-icon" {...props} />
  ),
  Type: (props: { className?: string }) => (
    <span data-testid="type-icon" {...props} />
  ),
}))

// Mock ColorPalette components
vi.mock('@/components/ui/ColorPalette', () => ({
  ColorPalette: ({
    onColorSelect,
    onClose,
  }: {
    onColorSelect: (color: string) => void
    onClose: () => void
  }) => (
    <div data-testid="color-palette">
      <button
        data-testid="color-option-red"
        onClick={() => onColorSelect('#DC2626')}
      >
        Red
      </button>
      <button data-testid="close-palette" onClick={onClose}>
        Close
      </button>
    </div>
  ),
  ColorPaletteTrigger: ({
    type,
    onClick,
    isActive,
    currentColor,
  }: {
    type: 'text' | 'highlight'
    onClick: () => void
    isActive?: boolean
    currentColor?: string
  }) => (
    <button
      data-testid={`color-trigger-${type}`}
      onClick={onClick}
      data-active={isActive}
      data-current-color={currentColor}
    >
      {type === 'text' ? 'Text Color' : 'Highlight Color'}
    </button>
  ),
}))

describe('RichTextEditor', () => {
  const mockOnUpdate = vi.fn()
  const mockOnFocus = vi.fn()

  // Default mock return values for useRichTextEditor
  const defaultHookReturn = {
    editor: mockEditor,
    editorRef: { current: document.createElement('div') },
    showToolbar: false,
    toolbarPosition: { top: 0, left: 0 },
    showContextMenu: false,
    contextMenuPosition: { top: 0, left: 0 },
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleStrike: vi.fn(),
    isFormatActive: vi.fn(() => false),
    // カラー機能のモック
    setTextColor: vi.fn(),
    setHighlightColor: vi.fn(),
    getTextColor: vi.fn(() => ''),
    getHighlightColor: vi.fn(() => ''),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Set default mock return value
    mockUseRichTextEditor.mockReturnValue(defaultHookReturn)
  })

  it('renders correctly with basic props', () => {
    render(
      <RichTextEditor
        content=""
        onUpdate={mockOnUpdate}
        onFocus={mockOnFocus}
        placeholder="Test placeholder"
      />
    )

    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument()
    expect(mockUseRichTextEditor).toHaveBeenCalledWith({
      content: '',
      placeholder: 'Test placeholder',
      onUpdate: mockOnUpdate,
      onFocus: mockOnFocus,
      onKeyDown: undefined,
    })
  })

  it('renders with custom className', () => {
    render(
      <RichTextEditor
        content=""
        onUpdate={mockOnUpdate}
        className="custom-editor-class"
      />
    )

    const editor = screen.getByTestId('rich-text-editor')
    expect(editor).toHaveClass(
      'prose',
      'prose-sm',
      'focus-within:outline-none',
      'max-w-none',
      'custom-editor-class'
    )
  })

  it('renders with default placeholder when none provided', () => {
    render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

    expect(mockUseRichTextEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        placeholder: 'Start typing...',
      })
    )
  })

  it('passes onKeyDown handler correctly', () => {
    const mockKeyDown = vi.fn()
    render(
      <RichTextEditor
        content=""
        onUpdate={mockOnUpdate}
        onKeyDown={mockKeyDown}
      />
    )

    expect(mockUseRichTextEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        onKeyDown: mockKeyDown,
      })
    )
  })

  describe('Toolbar Display', () => {
    it('shows selection toolbar when showToolbar is true', () => {
      mockUseRichTextEditor.mockReturnValue({
        ...defaultHookReturn,
        showToolbar: true,
        toolbarPosition: { top: 100, left: 50 },
      })

      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      // Check if toolbar buttons are present (since the toolbar is shown)
      expect(screen.getByTestId('bold-icon')).toBeInTheDocument()
      expect(screen.getByTestId('italic-icon')).toBeInTheDocument()
      expect(screen.getByTestId('underline-icon')).toBeInTheDocument()
      expect(screen.getByTestId('strikethrough-icon')).toBeInTheDocument()
    })

    it('hides selection toolbar when showToolbar is false', () => {
      mockUseRichTextEditor.mockReturnValue({
        ...defaultHookReturn,
        showToolbar: false,
      })

      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      // Toolbar should not be visible
      const toolbarButtons = screen.queryAllByTestId(/button-/)
      expect(toolbarButtons).toHaveLength(0)
    })

    it('renders all formatting buttons in toolbar', () => {
      mockUseRichTextEditor.mockReturnValue({
        ...defaultHookReturn,
        showToolbar: true,
      })

      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      expect(screen.getByTestId('bold-icon')).toBeInTheDocument()
      expect(screen.getByTestId('italic-icon')).toBeInTheDocument()
      expect(screen.getByTestId('underline-icon')).toBeInTheDocument()
      expect(screen.getByTestId('strikethrough-icon')).toBeInTheDocument()
    })
  })

  describe('Context Menu', () => {
    it('shows context menu when showContextMenu is true', () => {
      mockUseRichTextEditor.mockReturnValue({
        ...defaultHookReturn,
        showContextMenu: true,
        contextMenuPosition: { top: 150, left: 75 },
      })

      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      // Check for context menu buttons with labels
      expect(screen.getByText('Bold')).toBeInTheDocument()
      expect(screen.getByText('Italic')).toBeInTheDocument()
      expect(screen.getByText('Underline')).toBeInTheDocument()
      expect(screen.getByText('Strike')).toBeInTheDocument()
    })

    it('hides context menu when showContextMenu is false', () => {
      mockUseRichTextEditor.mockReturnValue({
        ...defaultHookReturn,
        showContextMenu: false,
      })

      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      expect(screen.queryByText('Bold')).not.toBeInTheDocument()
      expect(screen.queryByText('Italic')).not.toBeInTheDocument()
    })
  })

  describe('Format Actions', () => {
    it('calls toggleBold when bold button is clicked in toolbar', async () => {
      const mockToggleBold = vi.fn()
      mockUseRichTextEditor.mockReturnValue({
        ...defaultHookReturn,
        showToolbar: true,
        toggleBold: mockToggleBold,
      })

      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      const boldButton = screen.getByTestId('bold-icon').closest('button')
      expect(boldButton).toBeInTheDocument()

      await fireEvent.click(boldButton!)
      expect(mockToggleBold).toHaveBeenCalledTimes(1)
    })

    it('calls toggleItalic when italic button is clicked', async () => {
      const mockToggleItalic = vi.fn()
      mockUseRichTextEditor.mockReturnValue({
        ...defaultHookReturn,
        showToolbar: true,
        toggleItalic: mockToggleItalic,
      })

      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      const italicButton = screen.getByTestId('italic-icon').closest('button')
      await fireEvent.click(italicButton!)
      expect(mockToggleItalic).toHaveBeenCalledTimes(1)
    })

    it('calls format actions from context menu', async () => {
      const mockToggleUnderline = vi.fn()
      const mockToggleStrike = vi.fn()

      mockUseRichTextEditor.mockReturnValue({
        ...defaultHookReturn,
        showContextMenu: true,
        toggleUnderline: mockToggleUnderline,
        toggleStrike: mockToggleStrike,
      })

      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      await fireEvent.click(screen.getByText('Underline'))
      expect(mockToggleUnderline).toHaveBeenCalledTimes(1)

      await fireEvent.click(screen.getByText('Strike'))
      expect(mockToggleStrike).toHaveBeenCalledTimes(1)
    })
  })

  describe('Active Format States', () => {
    it('shows active state for bold formatting', () => {
      const mockIsFormatActive = vi.fn((format: string) => format === 'bold')
      mockUseRichTextEditor.mockReturnValue({
        ...defaultHookReturn,
        showToolbar: true,
        isFormatActive: mockIsFormatActive,
      })

      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      const boldButton = screen.getByTestId('bold-icon').closest('button')
      expect(boldButton).toHaveAttribute('data-variant', 'default')
    })

    it('shows inactive state for non-active formatting', () => {
      const mockIsFormatActive = vi.fn(() => false)
      mockUseRichTextEditor.mockReturnValue({
        ...defaultHookReturn,
        showToolbar: true,
        isFormatActive: mockIsFormatActive,
      })

      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      const boldButton = screen.getByTestId('bold-icon').closest('button')
      expect(boldButton).toHaveAttribute('data-variant', 'ghost')
    })
  })

  describe('Content Handling', () => {
    it('handles empty content correctly', () => {
      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      expect(mockUseRichTextEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '',
        })
      )
    })

    it('handles JSON content correctly', () => {
      const jsonContent =
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}'

      render(<RichTextEditor content={jsonContent} onUpdate={mockOnUpdate} />)

      expect(mockUseRichTextEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          content: jsonContent,
        })
      )
    })

    it('re-renders when content prop changes', () => {
      const { rerender } = render(
        <RichTextEditor content="" onUpdate={mockOnUpdate} />
      )

      expect(mockUseRichTextEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '',
        })
      )

      rerender(<RichTextEditor content="new content" onUpdate={mockOnUpdate} />)

      expect(mockUseRichTextEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'new content',
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('renders without crashing when hook returns null editor', () => {
      mockUseRichTextEditor.mockReturnValue({
        ...defaultHookReturn,
        editor: null,
      })

      render(<RichTextEditor content="" onUpdate={mockOnUpdate} />)

      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument()
    })

    it('handles missing callback props gracefully', () => {
      render(
        <RichTextEditor
          content=""
          onUpdate={mockOnUpdate}
          // Intentionally omitting onFocus and onKeyDown
        />
      )

      expect(mockUseRichTextEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          onFocus: undefined,
          onKeyDown: undefined,
        })
      )
    })
  })
})
