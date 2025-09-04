import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
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
    // Check if content is empty for certain key actions
    const isEmpty = !block.content || block.content === '' || block.content === '{"type":"doc","content":[]}'
    
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
        return 'Type / for commands'
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
        return <span className="text-gray-400 mr-2">•</span>
      case 'numbered':
        return <span className="text-gray-400 mr-2">{block.position + 1}.</span>
      default:
        return null
    }
  }

  return (
    <div className="group relative py-1 hover:bg-gray-50/50 transition-colors duration-75" style={{ willChange: 'background-color' }}>
      {/* Block controls - improved positioning and animation */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center space-x-1 -ml-12 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-0 transition-all duration-150 ease-out"
        style={{ willChange: 'opacity, transform' }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-blue-100 border border-transparent hover:border-blue-200 transition-all duration-100"
          onClick={() => onAddBlock(block.id, 'text')}
        >
          <Plus className="h-3.5 w-3.5 text-gray-400 hover:text-blue-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 cursor-grab hover:bg-gray-200 border border-transparent hover:border-gray-300 transition-all duration-100 active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
        </Button>
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

      {/* Block content */}
      <div className="flex items-start">
        {renderPrefixIcon()}
        <div className="flex-1">
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
            <RichTextEditor
              content={block.content}
              placeholder={getPlaceholder()}
              onUpdate={(content) => onUpdate(block.id, content)}
              onFocus={() => onFocus(block.id)}
              onKeyDown={handleRichTextKeyDown}
              className="min-h-[2rem]"
            />
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

        {/* Delete button - improved styling and positioning */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 ml-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-150 ease-out"
          onClick={() => onDelete(block.id)}
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
        </Button>
      </div>
    </div>
  )
}
