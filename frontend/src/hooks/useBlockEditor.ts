import { useState, useEffect, useRef, useCallback } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Block } from '@/types'
import {
  getBlockPlaceholder,
  getBlockClassName,
  isRichTextContentEmpty,
  BLOCK_TYPES,
} from '@/utils/blockUtils'

/**
 * Hook for individual block editor functionality
 * Manages block-specific UI interactions, keyboard handling, and type selection
 */
export const useBlockEditor = (
  block: Block,
  onUpdate: (blockId: number, content: string, type?: string) => void,
  onDelete: (blockId: number) => void,
  onAddBlock: (afterBlockId: number, type: string) => void,
  onMoveUp: (blockId: number) => void,
  onMoveDown: (blockId: number) => void,
  onFocus?: () => void
) => {
  // UI state
  const [showTypeSelector, setShowTypeSelector] = useState(false)

  // Refs for form elements
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [block.content])

  /**
   * Handle keyboard navigation and commands for text inputs
   */
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onAddBlock(block.id, BLOCK_TYPES.TEXT)
      } else if (
        e.key === 'Backspace' &&
        block.content === '' &&
        block.position > 0
      ) {
        e.preventDefault()
        onDelete(block.id)
      } else if (e.key === 'ArrowUp' && e.metaKey) {
        e.preventDefault()
        onMoveUp(block.id)
      } else if (e.key === 'ArrowDown' && e.metaKey) {
        e.preventDefault()
        onMoveDown(block.id)
      } else if (e.key === '/' && block.content === '') {
        e.preventDefault()
        setShowTypeSelector(true)
      }
    },
    [
      block.id,
      block.content,
      block.position,
      onAddBlock,
      onDelete,
      onMoveUp,
      onMoveDown,
    ]
  )

  /**
   * Handle keyboard navigation for rich text editors
   * Returns boolean to indicate whether default behavior should be prevented
   */
  const handleRichTextKeyDown = useCallback(
    (e: ReactKeyboardEvent): boolean | void => {
      // Check if content is empty for certain key actions - improved empty detection
      const isEmpty =
        !block.content ||
        block.content.trim() === '' ||
        isRichTextContentEmpty(block.content)

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onAddBlock(block.id, BLOCK_TYPES.TEXT)
        return false // Prevent default
      } else if (e.key === 'Backspace' && isEmpty && block.position > 0) {
        e.preventDefault()
        onDelete(block.id)
        return false // Prevent default
      } else if (e.key === 'ArrowUp' && e.metaKey) {
        e.preventDefault()
        onMoveUp(block.id)
        return false // Prevent default
      } else if (e.key === 'ArrowDown' && e.metaKey) {
        e.preventDefault()
        onMoveDown(block.id)
        return false // Prevent default
      } else if (e.key === '/' && isEmpty) {
        e.preventDefault()
        setShowTypeSelector(true)
        return false // Prevent default
      }
      // Allow default behavior for other keys
    },
    [
      block.id,
      block.content,
      block.position,
      onAddBlock,
      onDelete,
      onMoveUp,
      onMoveDown,
    ]
  )

  /**
   * Handle block type change
   */
  const handleTypeChange = useCallback(
    (newType: string) => {
      onUpdate(block.id, block.content, newType)
      setShowTypeSelector(false)
    },
    [block.id, block.content, onUpdate]
  )

  /**
   * Handle content update
   */
  const handleContentChange = useCallback(
    (content: string) => {
      onUpdate(block.id, content)
    },
    [block.id, onUpdate]
  )

  /**
   * Handle focus event
   */
  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus()
    }
  }, [onFocus])

  /**
   * Close type selector
   */
  const closeTypeSelector = useCallback(() => {
    setShowTypeSelector(false)
  }, [])

  /**
   * Get placeholder text for current block type
   */
  const placeholder = getBlockPlaceholder(block.type, block.position)

  /**
   * Get CSS classes for current block type
   */
  const className = getBlockClassName(block.type)

  /**
   * Get prefix text based on block type
   */
  const getPrefixText = useCallback((): string | null => {
    switch (block.type) {
      case BLOCK_TYPES.BULLET:
        return '•'
      case BLOCK_TYPES.NUMBERED:
        return `${block.position + 1}.`
      default:
        return null
    }
  }, [block.type, block.position])

  /**
   * Check if block has a prefix
   */
  const hasPrefix = getPrefixText() !== null

  /**
   * Check if block is rich text type
   */
  const isRichText = block.type === BLOCK_TYPES.TEXT

  return {
    // State
    showTypeSelector,

    // Refs
    textareaRef,
    inputRef,

    // Handlers
    handleKeyDown,
    handleRichTextKeyDown,
    handleTypeChange,
    handleContentChange,
    handleFocus,
    closeTypeSelector,

    // Computed values
    placeholder,
    className,
    isRichText,
    getPrefixText,
    hasPrefix,

    // Block data (for convenience)
    blockId: block.id,
    blockType: block.type,
    blockContent: block.content,
    blockPosition: block.position,
  }
}
