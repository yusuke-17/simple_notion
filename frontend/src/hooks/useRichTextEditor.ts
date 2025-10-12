import { useState, useEffect, useRef, useCallback } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useEditor } from '@tiptap/react'
import { Document } from '@tiptap/extension-document'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { Bold as BoldExt } from '@tiptap/extension-bold'
import { Italic as ItalicExt } from '@tiptap/extension-italic'
import { Strike } from '@tiptap/extension-strike'
import { HardBreak } from '@tiptap/extension-hard-break'
import { Dropcursor } from '@tiptap/extension-dropcursor'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import Underline from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import {
  normalizeContent,
  getSelectionCoordinates,
  getContextMenuCoordinates,
  hasSelection,
  isContentSynchronized,
  DEFAULT_TOOLBAR_POSITION,
  TOOLBAR_CONFIG,
} from '@/utils/editorUtils'

interface UseRichTextEditorProps {
  content: string
  placeholder?: string
  onUpdate: (content: string) => void
  onFocus?: () => void
  onKeyDown?: (event: ReactKeyboardEvent) => boolean | void
}

/**
 * Hook for Rich Text Editor functionality
 * Manages TipTap editor, toolbar positioning, and content synchronization
 */
export const useRichTextEditor = ({
  content,
  placeholder = 'Start typing...',
  onUpdate,
  onFocus,
  onKeyDown,
}: UseRichTextEditorProps) => {
  // UI state
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState(
    DEFAULT_TOOLBAR_POSITION
  )
  const [contextMenuPosition, setContextMenuPosition] = useState(
    DEFAULT_TOOLBAR_POSITION
  )
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Refs for DOM elements and state management
  const editorRef = useRef<HTMLDivElement>(null)
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>('')
  const isUpdatingRef = useRef(false)

  /**
   * Handle selection update for toolbar positioning
   */
  const handleSelectionUpdate = useCallback(() => {
    // Clear previous timeout to prevent excessive updates
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current)
    }

    // Use shorter debounce for less flickering
    selectionTimeoutRef.current = setTimeout(() => {
      const hasSelectionText = hasSelection()

      if (hasSelectionText && editorRef.current) {
        const coords = getSelectionCoordinates(editorRef.current)
        if (coords) {
          setToolbarPosition(coords)
          setShowToolbar(true)
        }
      } else {
        setShowToolbar(false)
      }
    }, TOOLBAR_CONFIG.SELECTION_DEBOUNCE)
  }, [])

  /**
   * Handle right-click context menu
   */
  const handleContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault()

    if (editorRef.current) {
      const coords = getContextMenuCoordinates(event, editorRef.current)
      if (coords) {
        setContextMenuPosition(coords)
        setShowContextMenu(true)
        setShowToolbar(false) // Hide selection toolbar when showing context menu
      }
    }
  }, [])

  /**
   * Hide context menu on click outside
   */
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (
      !target.closest('[data-toolbar]') &&
      !target.closest('[data-context-menu]')
    ) {
      setShowContextMenu(false)
    }
  }, [])

  /**
   * TipTap editor configuration
   */
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: 'outline-none leading-normal my-1 min-h-[1.5rem]',
        },
      }),
      Text,
      // テキストスタイル拡張（カラーの前提条件）
      TextStyle,
      // テキスト色
      Color.configure({
        types: ['textStyle'],
      }),
      // 背景色（ハイライト）
      Highlight.configure({
        multicolor: true,
      }),
      BoldExt,
      ItalicExt,
      Strike,
      HardBreak,
      Dropcursor,
      Gapcursor,
      Underline.configure({
        HTMLAttributes: {
          class:
            'underline decoration-2 underline-offset-2 decoration-blue-500',
        },
      }),
    ],
    content: normalizeContent(content || ''),
    autofocus: true,
    editable: true,
    onCreate: ({ editor }) => {
      setIsInitialized(true)
      // For empty content, focus the editor immediately
      if (!content || content.trim() === '') {
        setTimeout(() => {
          try {
            if (editor && !editor.isDestroyed) {
              editor.commands.focus()
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.debug('Focus error:', error)
            }
          }
        }, TOOLBAR_CONFIG.CONTENT_SYNC_DELAY)
      }
    },
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return

      try {
        const json = editor.getJSON()
        const jsonString = JSON.stringify(json)

        // Only update if content actually changed
        if (jsonString !== lastContentRef.current) {
          lastContentRef.current = jsonString
          onUpdate(jsonString)
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug('RichTextEditor update error:', error)
        }
      }
    },
    onSelectionUpdate: () => {
      try {
        handleSelectionUpdate()
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug('RichTextEditor selection update error:', error)
        }
      }
    },
    onFocus: () => {
      onFocus?.()
    },
    onBlur: ({ event }) => {
      // Check if the blur is caused by clicking on toolbar
      const relatedTarget = event.relatedTarget as HTMLElement
      if (
        relatedTarget &&
        (relatedTarget.closest('[data-toolbar]') ||
          relatedTarget.closest('[data-context-menu]'))
      ) {
        return
      }
      setTimeout(() => {
        setShowToolbar(false)
        setShowContextMenu(false)
      }, TOOLBAR_CONFIG.BLUR_TIMEOUT)
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[2rem] leading-normal',
        placeholder: placeholder,
        spellcheck: 'false',
        contenteditable: 'true',
      },
      handleKeyDown: (_view, event) => {
        if (onKeyDown) {
          const result = onKeyDown(event as unknown as ReactKeyboardEvent)
          if (result === false) {
            return true
          }
        }
        return false
      },
    },
  })

  // Content synchronization effect
  useEffect(() => {
    if (!editor || !isInitialized) return

    if (isUpdatingRef.current) return

    const currentContent = JSON.stringify(editor.getJSON())
    const incomingContent = content || ''

    // Skip if content is synchronized or editor has focus
    if (
      isContentSynchronized(
        currentContent,
        incomingContent,
        lastContentRef.current
      ) ||
      editor.isFocused
    ) {
      return
    }

    // Update editor content only when necessary
    isUpdatingRef.current = true
    try {
      const normalizedContent = normalizeContent(incomingContent)
      editor.commands.setContent(normalizedContent, { emitUpdate: false })
      lastContentRef.current = incomingContent
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Content sync error:', error)
      }
    } finally {
      requestAnimationFrame(() => {
        isUpdatingRef.current = false
      })
    }
  }, [editor, content, isInitialized])

  // Add event listeners for context menu
  useEffect(() => {
    const editorElement = editorRef.current
    if (editorElement) {
      editorElement.addEventListener('contextmenu', handleContextMenu)
      document.addEventListener('click', handleClickOutside)

      return () => {
        editorElement.removeEventListener('contextmenu', handleContextMenu)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [handleContextMenu, handleClickOutside])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Toolbar action functions
   */
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run()
    setShowContextMenu(false)
  }, [editor])

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run()
    setShowContextMenu(false)
  }, [editor])

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run()
    setShowContextMenu(false)
  }, [editor])

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run()
    setShowContextMenu(false)
  }, [editor])

  /**
   * カラー機能
   */
  const setTextColor = useCallback(
    (color: string) => {
      if (color === '') {
        editor?.chain().focus().unsetColor().run()
      } else {
        editor?.chain().focus().setColor(color).run()
      }
      setShowContextMenu(false)
    },
    [editor]
  )

  const setHighlightColor = useCallback(
    (color: string) => {
      if (color === '') {
        editor?.chain().focus().unsetHighlight().run()
      } else {
        editor?.chain().focus().setHighlight({ color }).run()
      }
      setShowContextMenu(false)
    },
    [editor]
  )

  const getTextColor = useCallback(() => {
    return editor?.getAttributes('textStyle').color || ''
  }, [editor])

  const getHighlightColor = useCallback(() => {
    return editor?.getAttributes('highlight').color || ''
  }, [editor])

  /**
   * Check if formatting is active
   */
  const isFormatActive = useCallback(
    (format: string) => {
      return editor?.isActive(format) ?? false
    },
    [editor]
  )

  return {
    // Editor instance
    editor,
    editorRef,

    // UI state
    showToolbar,
    toolbarPosition,
    showContextMenu,
    contextMenuPosition,
    isInitialized,

    // Toolbar actions
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrike,
    isFormatActive,

    // Color actions
    setTextColor,
    setHighlightColor,
    getTextColor,
    getHighlightColor,

    // Computed values
    placeholder,
  }
}
