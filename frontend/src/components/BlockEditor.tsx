import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Trash2, GripVertical, Plus } from 'lucide-react'
import { RichTextEditor } from '@/components/RichTextEditor'
import type { Block } from '@/types'

interface BlockEditorProps {
  block: Block
  onUpdate: (id: number, content: string, type?: string) => void
  onDelete: (id: number) => void
  onAddBlock: (afterBlockId: number, type: string) => void
  onMoveUp: (id: number) => void
  onMoveDown: (id: number) => void
  onFocus: (id: number) => void
  isLastBlock: boolean
  dragHandleProps?: Record<string, unknown>
}

const BLOCK_TYPES = {
  text: 'Text',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  bullet: 'Bullet List',
  numbered: 'Numbered List',
  quote: 'Quote',
  code: 'Code'
}

export function BlockEditor({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  onMoveUp,
  onMoveDown,
  onFocus,
  dragHandleProps
}: Omit<BlockEditorProps, 'isLastBlock'>) {
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-resize textarea
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [block.content])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onAddBlock(block.id, 'text')
    } else if (e.key === 'Backspace' && block.content === '') {
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
  }

  const handleRichTextKeyDown = (e: KeyboardEvent): boolean | void => {
    // Check if content is empty for certain key actions - improved empty detection
    const isEmpty = !block.content || 
                   block.content.trim() === '' || 
                   block.content === '{"type":"doc","content":[]}' ||
                   block.content === '{"type":"doc","content":[{"type":"paragraph"}]}'
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onAddBlock(block.id, 'text')
      return false // Prevent default
    } else if (e.key === 'Backspace' && isEmpty) {
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
  }

  const handleTypeChange = (newType: string) => {
    onUpdate(block.id, block.content, newType)
    setShowTypeSelector(false)
  }

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading1':
        return 'Heading 1'
      case 'heading2':
        return 'Heading 2'
      case 'heading3':
        return 'Heading 3'
      case 'bullet':
        return '• List item'
      case 'numbered':
        return '1. List item'
      case 'quote':
        return 'Quote'
      case 'code':
        return 'Code'
      default:
        return block.position === 0 ? 'Type to start writing...' : 'Type / for commands'
    }
  }

  const getClassName = () => {
    const baseClass = "w-full bg-transparent border-none resize-none focus:outline-none"
    
    switch (block.type) {
      case 'heading1':
        return `${baseClass} text-3xl font-bold`
      case 'heading2':
        return `${baseClass} text-2xl font-semibold`
      case 'heading3':
        return `${baseClass} text-xl font-medium`
      case 'quote':
        return `${baseClass} italic border-l-4 border-gray-300 pl-4`
      case 'code':
        return `${baseClass} font-mono bg-gray-100 rounded p-2`
      default:
        return `${baseClass} text-base`
    }
  }

  const renderPrefixIcon = () => {
    switch (block.type) {
      case 'bullet':
        return <span className="text-gray-400 mr-2 flex items-center h-[2rem] leading-none">•</span>
      case 'numbered':
        return <span className="text-gray-400 mr-2 flex items-center h-[2rem] leading-none">{block.position + 1}.</span>
      default:
        return null
    }
  }

  return (
    <div className="group relative py-0.5 hover:bg-gray-50/50 transition-colors duration-75" style={{ willChange: 'background-color' }}>
      {/* Block controls - Notion-like styling with improved spacing */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 -ml-20 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all duration-200 ease-out"
        style={{ willChange: 'opacity, transform' }}
      >
        <button
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors duration-150 border border-transparent hover:border-gray-200"
          onClick={() => onAddBlock(block.id, 'text')}
          title="Add block"
        >
          <Plus className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
        <button
          className="h-8 w-8 flex items-center justify-center rounded-md cursor-grab hover:bg-gray-100 transition-colors duration-150 border border-transparent hover:border-gray-200 active:cursor-grabbing"
          {...dragHandleProps}
          title="Drag to move"
        >
          <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>

      {/* Type selector */}
      {showTypeSelector && (
        <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg p-2 mt-6">
          {Object.entries(BLOCK_TYPES).map(([type, label]) => (
            <button
              key={type}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
              onClick={() => handleTypeChange(type)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Block content - improved stability */}
      <div className="flex items-start"> {/* Changed from items-center to items-start for better text alignment */}
        {renderPrefixIcon()}
        <div className="flex-1 min-h-[2rem]"> {/* Removed flex items-center for better layout */}
          {block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3' ? (
            <Input
              ref={inputRef}
              value={block.content}
              onChange={(e) => onUpdate(block.id, e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => onFocus(block.id)}
              placeholder={getPlaceholder()}
              className={getClassName()}
            />
          ) : block.type === 'text' ? (
            <div className="w-full">
              <RichTextEditor
                content={block.content}
                placeholder={getPlaceholder()}
                onUpdate={(content) => onUpdate(block.id, content)}
                onFocus={() => onFocus(block.id)}
                onKeyDown={handleRichTextKeyDown}
                className="min-h-[2rem] w-full"
              />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={block.content}
              onChange={(e) => onUpdate(block.id, e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => onFocus(block.id)}
              placeholder={getPlaceholder()}
              className={getClassName()}
              rows={1}
            />
          )}
        </div>

        {/* Delete button - Notion-like styling */}
        <button
          className="h-8 w-8 flex items-center justify-center ml-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-md transition-all duration-200 ease-out border border-transparent hover:border-red-200"
          onClick={() => onDelete(block.id)}
          title="Delete block"
        >
          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
        </button>
      </div>
    </div>
  )
}
