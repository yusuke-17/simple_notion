import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough } from 'lucide-react'
import { useCallback, useEffect, useState, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

interface RichTextEditorProps {
  content: string
  placeholder?: string
  className?: string
  onUpdate: (content: string) => void
  onFocus?: () => void
  onKeyDown?: (event: ReactKeyboardEvent) => boolean | void
}

/**
 * Rich text editor component using TipTap
 * Supports bold, italic, underline, and strikethrough formatting
 */
export function RichTextEditor({
  content,
  placeholder = 'Start typing...',
  className = '',
  onUpdate,
  onFocus,
  onKeyDown
}: RichTextEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const editorRef = useRef<HTMLDivElement>(null)
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get selection coordinates for toolbar positioning
  const getSelectionCoordinates = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const editorRect = editorRef.current?.getBoundingClientRect()
    
    if (!editorRect) return null

    // ツールバーの幅（約150px）を考慮した位置計算
    const toolbarWidth = 150
    const selectionCenter = rect.left - editorRect.left + (rect.width / 2)
    
    // 左端で見切れないように調整
    let left = selectionCenter - (toolbarWidth / 2)
    if (left < 10) {
      left = 10 // 最小マージン
    }
    
    // 右端で見切れないように調整
    const maxLeft = editorRect.width - toolbarWidth - 10
    if (left > maxLeft) {
      left = maxLeft
    }

    return {
      top: rect.top - editorRect.top - 50, // Position above selection
      left: left
    }
  }, [])

  const handleSelectionUpdate = useCallback(() => {
    // Clear previous timeout to prevent excessive updates
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current)
    }
    
    // Use longer debounce for more stable toolbar behavior
    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection()
      const hasSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0
      
      if (hasSelection) {
        const coords = getSelectionCoordinates()
        if (coords) {
          setToolbarPosition(coords)
          setShowToolbar(true)
        }
      } else {
        setShowToolbar(false)
      }
    }, 200) // Increased debounce for stability
  }, [getSelectionCoordinates])
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable unused features to keep it lightweight
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        // Keep only paragraph and inline formatting
        paragraph: {
          HTMLAttributes: {
            class: 'outline-none'
          }
        }
      }),
      Underline
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onUpdate(JSON.stringify(json))
    },
    onSelectionUpdate: () => {
      // Direct call without setTimeout to reduce delay
      handleSelectionUpdate()
    },
    onFocus: () => {
      onFocus?.()
    },
    onBlur: ({ event }) => {
      // Check if the blur is caused by clicking on toolbar
      const relatedTarget = event.relatedTarget as HTMLElement
      if (relatedTarget && relatedTarget.closest('[data-toolbar]')) {
        return // Don't hide toolbar if clicking on toolbar buttons
      }
      // Reduce timeout for better responsiveness
      setTimeout(() => setShowToolbar(false), 50)
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ${className}`,
        placeholder: placeholder
      },
      handleKeyDown: (_view, event) => {
        if (onKeyDown) {
          const result = onKeyDown(event as unknown as ReactKeyboardEvent)
          if (result === false) {
            return true // Prevent default
          }
        }
        return false // Allow default behavior
      }
    }
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== JSON.stringify(editor.getJSON())) {
      try {
        if (content === '' || content === null || content === undefined) {
          // Handle empty content
          editor.commands.setContent({ type: 'doc', content: [] })
        } else if (content.trim().startsWith('{')) {
          // Try to parse as JSON (TipTap format)
          const parsedContent = JSON.parse(content)
          if (parsedContent.type === 'doc') {
            editor.commands.setContent(parsedContent)
          } else {
            // Invalid TipTap structure, treat as plain text
            editor.commands.setContent(`<p>${content}</p>`)
          }
        } else {
          // Plain text content, convert to paragraph
          editor.commands.setContent(`<p>${content}</p>`)
        }
      } catch (error) {
        // If JSON parsing fails, treat as plain text
        console.warn('Failed to parse rich text content, treating as plain text:', error)
        editor.commands.setContent(`<p>${content}</p>`)
      }
    }
  }, [content, editor])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current)
      }
    }
  }, [])

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run()
  }, [editor])

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run()
  }, [editor])

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run()
  }, [editor])

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="relative" ref={editorRef}>
      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="min-h-[2rem] prose prose-sm max-w-none focus-within:outline-none [&_u]:underline [&_u]:decoration-2 [&_u]:underline-offset-2 [&_u]:decoration-blue-500"
        data-testid="rich-text-editor"
      />
      
      {/* Selection-based Toolbar - Improved animation and stability */}
      {showToolbar && (
        <div 
          className="absolute flex items-center space-x-1 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 z-50 transform transition-all duration-200 ease-out scale-100 opacity-100"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            willChange: 'opacity, transform, top, left'
          }}
          data-toolbar="true"
          data-testid="selection-toolbar"
        >
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 rounded-lg transition-all duration-150 ease-out ${
              editor.isActive('bold') 
                ? 'bg-blue-100 hover:bg-blue-150 text-blue-700 border border-blue-200 shadow-sm' 
                : 'hover:bg-gray-100 text-gray-600 border border-transparent hover:border-gray-200'
            }`}
            onClick={toggleBold}
            onMouseDown={(e) => e.preventDefault()} // Prevent blur
            type="button"
            title="Bold (⌘B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 rounded-lg transition-all duration-150 ease-out ${
              editor.isActive('italic') 
                ? 'bg-blue-100 hover:bg-blue-150 text-blue-700 border border-blue-200 shadow-sm' 
                : 'hover:bg-gray-100 text-gray-600 border border-transparent hover:border-gray-200'
            }`}
            onClick={toggleItalic}
            onMouseDown={(e) => e.preventDefault()} // Prevent blur
            type="button"
            title="Italic (⌘I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 rounded-lg transition-all duration-150 ease-out ${
              editor.isActive('underline') 
                ? 'bg-blue-100 hover:bg-blue-150 text-blue-700 border border-blue-200 shadow-sm' 
                : 'hover:bg-gray-100 text-gray-600 border border-transparent hover:border-gray-200'
            }`}
            onClick={toggleUnderline}
            onMouseDown={(e) => e.preventDefault()} // Prevent blur
            type="button"
            title="Underline (⌘U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 rounded-lg transition-all duration-150 ease-out ${
              editor.isActive('strike') 
                ? 'bg-blue-100 hover:bg-blue-150 text-blue-700 border border-blue-200 shadow-sm' 
                : 'hover:bg-gray-100 text-gray-600 border border-transparent hover:border-gray-200'
            }`}
            onClick={toggleStrike}
            onMouseDown={(e) => e.preventDefault()} // Prevent blur
            type="button"
            title="Strikethrough (⌘⇧X)"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
