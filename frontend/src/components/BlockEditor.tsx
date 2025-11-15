import { memo } from 'react'
import { Input } from '@/components/ui/input'
import { Trash2, GripVertical, Plus } from 'lucide-react'
import { RichTextEditor } from '@/components/RichTextEditor'
import { ImageBlockEditor } from '@/components/ImageBlockEditor'
import { FileBlockEditor } from '@/components/FileBlockEditor'
import { useBlockEditor } from '@/hooks/useBlockEditor'
import type { Block, ImageBlockContent, FileBlockContent } from '@/types'
import { BLOCK_TYPES } from '@/utils/blockUtils'

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

const BLOCK_TYPE_LABELS = {
  [BLOCK_TYPES.TEXT]: 'Text',
  [BLOCK_TYPES.HEADING1]: 'Heading 1',
  [BLOCK_TYPES.HEADING2]: 'Heading 2',
  [BLOCK_TYPES.HEADING3]: 'Heading 3',
  [BLOCK_TYPES.BULLET]: 'Bullet List',
  [BLOCK_TYPES.NUMBERED]: 'Numbered List',
  [BLOCK_TYPES.QUOTE]: 'Quote',
  [BLOCK_TYPES.CODE]: 'Code',
  [BLOCK_TYPES.IMAGE]: 'Image',
  [BLOCK_TYPES.FILE]: 'File', // ファイルブロック追加
}

/**
 * Block Editor View Component
 * Now focused purely on rendering UI, with business logic in useBlockEditor hook
 */
export function BlockEditor({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  onMoveUp,
  onMoveDown,
  onFocus,
  dragHandleProps,
}: Omit<BlockEditorProps, 'isLastBlock'>) {
  // Use our custom hook that encapsulates all block editor logic
  const {
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

    // Computed values
    placeholder,
    className,
    getPrefixText,
  } = useBlockEditor(
    block,
    onUpdate,
    onDelete,
    onAddBlock,
    onMoveUp,
    onMoveDown,
    () => onFocus(block.id)
  )

  // 画像ブロック用のコンテンツ更新処理
  const handleImageContentChange = (imageContent: ImageBlockContent) => {
    handleContentChange(JSON.stringify(imageContent))
  }

  // ファイルブロック用のコンテンツ更新処理
  const handleFileContentChange = (fileContent: FileBlockContent) => {
    handleContentChange(JSON.stringify(fileContent))
  }

  // 画像ブロックのコンテンツを取得
  const getImageContent = (): ImageBlockContent | undefined => {
    if (block.type !== BLOCK_TYPES.IMAGE) return undefined

    try {
      // contentが既にオブジェクトの場合はそのまま返す（バックエンドからの直接のレスポンス）
      if (typeof block.content === 'object' && block.content !== null) {
        return block.content as ImageBlockContent
      }
      // contentが文字列の場合はパースする
      return JSON.parse(block.content) as ImageBlockContent
    } catch {
      return {
        src: '',
        alt: '',
        caption: '',
        width: 0,
        height: 0,
        originalName: '',
        fileSize: 0,
      }
    }
  }

  // ファイルブロックのコンテンツを取得
  const getFileContent = (): FileBlockContent | undefined => {
    if (block.type !== BLOCK_TYPES.FILE) return undefined

    try {
      // contentが既にオブジェクトの場合はそのまま返す（バックエンドからの直接のレスポンス）
      if (typeof block.content === 'object' && block.content !== null) {
        return block.content as FileBlockContent
      }
      // contentが文字列の場合はパースする
      return JSON.parse(block.content) as FileBlockContent
    } catch {
      return {
        filename: '',
        fileSize: 0,
        mimeType: '',
        uploadedAt: '',
        downloadUrl: '',
        originalName: '',
      }
    }
  }

  const prefixText = getPrefixText()

  return (
    <div
      className="group relative py-0.5 hover:bg-gray-50/50 transition-colors duration-75"
      style={{ willChange: 'background-color' }}
    >
      {/* Block controls - Notion-like styling with improved spacing */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 -ml-20 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all duration-200 ease-out"
        style={{ willChange: 'opacity, transform' }}
      >
        <button
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors duration-150 border border-transparent hover:border-gray-200"
          onClick={() => onAddBlock(block.id, BLOCK_TYPES.TEXT)}
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
          {Object.entries(BLOCK_TYPE_LABELS).map(([type, label]) => (
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
        {/* Prefix icon for bullet and numbered lists */}
        {prefixText && (
          <span className="text-gray-400 mr-2 flex items-center h-[2rem] leading-none">
            {prefixText}
          </span>
        )}

        <div className="flex-1 min-h-[2rem]">
          {block.type === BLOCK_TYPES.HEADING1 ||
          block.type === BLOCK_TYPES.HEADING2 ||
          block.type === BLOCK_TYPES.HEADING3 ? (
            <Input
              ref={inputRef}
              value={typeof block.content === 'string' ? block.content : ''}
              onChange={e => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder={placeholder}
              className={className}
            />
          ) : block.type === BLOCK_TYPES.TEXT ? (
            <div className="w-full">
              <RichTextEditor
                content={typeof block.content === 'string' ? block.content : ''}
                placeholder={placeholder}
                onUpdate={handleContentChange}
                onFocus={handleFocus}
                onKeyDown={handleRichTextKeyDown}
                className="min-h-[2rem] w-full"
              />
            </div>
          ) : block.type === BLOCK_TYPES.IMAGE ? (
            <div className="w-full" onClick={() => onFocus(block.id)}>
              <ImageBlockEditor
                initialContent={getImageContent()}
                onContentChange={handleImageContentChange}
                placeholder={placeholder}
                className="min-h-[2rem] w-full"
              />
            </div>
          ) : block.type === BLOCK_TYPES.FILE ? (
            <div className="w-full" onClick={() => onFocus(block.id)}>
              <FileBlockEditor
                initialContent={getFileContent()}
                onContentChange={handleFileContentChange}
              />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={typeof block.content === 'string' ? block.content : ''}
              onChange={e => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder={placeholder}
              className={className}
              rows={1}
            />
          )}
        </div>

        {/* Delete button */}
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

// Memoize BlockEditor to prevent unnecessary re-renders
export const MemoizedBlockEditor = memo(BlockEditor, (prevProps, nextProps) => {
  // Only re-render if block content, position, or type changes
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.block.type === nextProps.block.type &&
    prevProps.block.position === nextProps.block.position
  )
})
