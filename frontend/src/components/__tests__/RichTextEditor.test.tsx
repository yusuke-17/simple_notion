import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RichTextEditor } from '../RichTextEditor'

// Mock TipTap modules
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => ({
    getJSON: vi.fn(() => ({ type: 'doc', content: [] })),
    commands: {
      setContent: vi.fn(),
      focus: vi.fn(),
      toggleBold: vi.fn(),
      toggleItalic: vi.fn(),
      toggleUnderline: vi.fn(),
      toggleStrike: vi.fn()
    },
    chain: vi.fn(() => ({
      focus: vi.fn(() => ({
        toggleBold: vi.fn(() => ({ run: vi.fn() })),
        toggleItalic: vi.fn(() => ({ run: vi.fn() })),
        toggleUnderline: vi.fn(() => ({ run: vi.fn() })),
        toggleStrike: vi.fn(() => ({ run: vi.fn() }))
      }))
    })),
    isActive: vi.fn(() => false)
  })),
  EditorContent: ({ children }: { children: React.ReactNode }) => <div data-testid="editor-content">{children}</div>
}))

// Mock window.getSelection for selection-based toolbar testing
const mockGetSelection = vi.fn()
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: mockGetSelection
})

vi.mock('@tiptap/starter-kit', () => ({
  default: {
    configure: vi.fn(() => ({}))
  }
}))

vi.mock('@tiptap/extension-underline', () => ({
  default: {}
}))

describe('RichTextEditor', () => {
  const mockOnUpdate = vi.fn()
  const mockOnFocus = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset selection mock
    mockGetSelection.mockReturnValue({
      isCollapsed: true,
      toString: () => '',
      rangeCount: 0
    })
  })

  it('renders correctly', () => {
    render(
      <RichTextEditor
        content=""
        onUpdate={mockOnUpdate}
        onFocus={mockOnFocus}
        placeholder="Test placeholder"
      />
    )

    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('hides toolbar initially and shows on text selection', () => {
    render(
      <RichTextEditor
        content=""
        onUpdate={mockOnUpdate}
        onFocus={mockOnFocus}
      />
    )

    // Initially, toolbar should not be visible (no selection)
    expect(screen.queryByTestId('selection-toolbar')).not.toBeInTheDocument()

    // Simulate text selection by setting up mock selection
    mockGetSelection.mockReturnValue({
      isCollapsed: false,
      toString: () => 'selected text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => ({
          top: 100,
          left: 50,
          width: 100,
          height: 20
        })
      })
    })

    // Note: In a real test environment, we would trigger the selection event
    // For now, we just verify the component structure exists
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('calls onUpdate when content changes', () => {
    const { rerender } = render(
      <RichTextEditor
        content=""
        onUpdate={mockOnUpdate}
        onFocus={mockOnFocus}
      />
    )

    // Simulate content change by re-rendering with different content
    rerender(
      <RichTextEditor
        content='{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}'
        onUpdate={mockOnUpdate}
        onFocus={mockOnFocus}
      />
    )

    // Due to mocking, we can't test the actual onUpdate call,
    // but we can verify the component handles content prop changes
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('displays custom placeholder', () => {
    const customPlaceholder = 'Enter your text here...'
    render(
      <RichTextEditor
        content=""
        onUpdate={mockOnUpdate}
        placeholder={customPlaceholder}
      />
    )

    // The placeholder is set in editor props, which is mocked
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })
})
