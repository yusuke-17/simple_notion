import type { Block } from '@/types'

/**
 * Block operation utilities - Pure functions for block manipulation
 * These functions don't have side effects and are easily testable
 */

/**
 * Reorder blocks array by moving element from oldIndex to newIndex
 */
export const reorderBlocks = (
  blocks: Block[],
  oldIndex: number,
  newIndex: number
): Block[] => {
  const result = Array.from(blocks)
  const [removed] = result.splice(oldIndex, 1)
  result.splice(newIndex, 0, removed)

  // Update positions after reordering
  return result.map((block, index) => ({
    ...block,
    position: index,
  }))
}

/**
 * Update block content and type
 */
export const updateBlockContent = (
  blocks: Block[],
  blockId: number,
  content: string,
  type?: string
): Block[] => {
  return blocks.map(block =>
    block.id === blockId
      ? {
          ...block,
          content,
          type: type || block.type,
          updatedAt: new Date().toISOString(),
        }
      : block
  )
}

/**
 * Delete block from array and recalculate positions
 */
export const deleteBlock = (blocks: Block[], blockId: number): Block[] => {
  // Prevent deleting if it's the only block or the first block with other blocks
  if (blocks.length <= 1) return blocks

  const blockToDelete = blocks.find(block => block.id === blockId)
  if (blockToDelete && blockToDelete.position === 0 && blocks.length > 1) {
    return blocks // Don't delete first block if there are others
  }

  const filteredBlocks = blocks.filter(block => block.id !== blockId)

  // Recalculate positions after deletion
  return filteredBlocks.map((block, index) => ({
    ...block,
    position: index,
  }))
}

/**
 * Insert new block after specified position
 */
export const insertBlock = (
  blocks: Block[],
  afterBlockId: number,
  newBlock: Omit<Block, 'position'>
): Block[] => {
  const afterIndex = blocks.findIndex(block => block.id === afterBlockId)

  const blockWithPosition: Block = {
    ...newBlock,
    position: afterIndex + 1,
  }

  const result = [...blocks]
  result.splice(afterIndex + 1, 0, blockWithPosition)

  // Update positions for subsequent blocks
  return result.map((block, index) => ({
    ...block,
    position: index,
  }))
}

/**
 * Move block up in the array
 */
export const moveBlockUp = (blocks: Block[], blockId: number): Block[] => {
  const blockIndex = blocks.findIndex(block => block.id === blockId)
  if (blockIndex <= 0) return blocks

  const result = [...blocks]
  const temp = result[blockIndex]
  result[blockIndex] = result[blockIndex - 1]
  result[blockIndex - 1] = temp

  return result.map((block, index) => ({
    ...block,
    position: index,
  }))
}

/**
 * Move block down in the array
 */
export const moveBlockDown = (blocks: Block[], blockId: number): Block[] => {
  const blockIndex = blocks.findIndex(block => block.id === blockId)
  if (blockIndex >= blocks.length - 1) return blocks

  const result = [...blocks]
  const temp = result[blockIndex]
  result[blockIndex] = result[blockIndex + 1]
  result[blockIndex + 1] = temp

  return result.map((block, index) => ({
    ...block,
    position: index,
  }))
}

/**
 * Create initial block for a new document
 */
export const createInitialBlock = (documentId: number): Block => ({
  id: Date.now(),
  type: 'text',
  content: '',
  documentId,
  position: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

/**
 * Generate unique temporary ID for new blocks
 */
export const generateTempBlockId = (): number => {
  return Date.now() + Math.random()
}

/**
 * Get block type placeholder text
 */
export const getBlockPlaceholder = (
  blockType: string,
  position: number
): string => {
  switch (blockType) {
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
      return position === 0 ? 'Type to start writing...' : 'Type / for commands'
  }
}

/**
 * Get CSS classes for block type
 */
export const getBlockClassName = (blockType: string): string => {
  const baseClass =
    'w-full bg-transparent border-none resize-none focus:outline-none'

  switch (blockType) {
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

/**
 * Check if rich text content is empty
 */
export const isRichTextContentEmpty = (content: string): boolean => {
  if (!content || content.trim() === '') return true

  // Check for empty TipTap document structures
  const emptyPatterns = [
    '{"type":"doc","content":[]}',
    '{"type":"doc","content":[{"type":"paragraph"}]}',
  ]

  return emptyPatterns.includes(content)
}

/**
 * Available block types
 */
export const BLOCK_TYPES = {
  TEXT: 'text',
  HEADING1: 'heading1',
  HEADING2: 'heading2',
  HEADING3: 'heading3',
  BULLET: 'bullet',
  NUMBERED: 'numbered',
  QUOTE: 'quote',
  CODE: 'code',
} as const

export type BlockType = (typeof BLOCK_TYPES)[keyof typeof BLOCK_TYPES]
