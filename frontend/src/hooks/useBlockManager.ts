import { useState, useCallback, useRef, useEffect } from 'react'
import type { Block } from '@/types'
import {
  updateBlockContent,
  deleteBlock,
  insertBlock,
  moveBlockUp,
  moveBlockDown,
  reorderBlocks,
  generateTempBlockId,
  createInitialBlock,
} from '@/utils/blockUtils'

/**
 * Block management hook
 * Provides functions to manipulate blocks array
 */
export const useBlockManager = (initialBlocks: Block[], documentId: number) => {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)

  // useRefでcurrent blocksにアクセスし、無限ループを回避
  const blocksRef = useRef<Block[]>(blocks)

  // blocks が更新されるたびに ref を更新
  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  /**
   * Update block content and optionally type
   */
  const handleBlockUpdate = useCallback(
    (blockId: number, content: string, type?: string) => {
      setBlocks(prevBlocks =>
        updateBlockContent(prevBlocks, blockId, content, type)
      )
    },
    []
  )

  /**
   * Delete a block
   */
  const handleBlockDelete = useCallback((blockId: number) => {
    setBlocks(prevBlocks => deleteBlock(prevBlocks, blockId))
  }, [])

  /**
   * Add new block after specified block
   */
  const handleAddBlock = useCallback(
    (afterBlockId: number, type: string) => {
      const newBlock = {
        id: generateTempBlockId(),
        type,
        content: '',
        documentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setBlocks(prevBlocks => insertBlock(prevBlocks, afterBlockId, newBlock))
    },
    [documentId]
  )

  /**
   * Move block up in the list
   */
  const handleMoveBlockUp = useCallback((blockId: number) => {
    setBlocks(prevBlocks => moveBlockUp(prevBlocks, blockId))
  }, [])

  /**
   * Move block down in the list
   */
  const handleMoveBlockDown = useCallback((blockId: number) => {
    setBlocks(prevBlocks => moveBlockDown(prevBlocks, blockId))
  }, [])

  /**
   * Handle drag and drop reordering
   */
  const handleReorder = useCallback((oldIndex: number, newIndex: number) => {
    setBlocks(prevBlocks => reorderBlocks(prevBlocks, oldIndex, newIndex))
  }, [])

  /**
   * Handle drag and drop by block IDs
   */
  const handleDragEnd = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return

    setBlocks(prevBlocks => {
      const oldIndex = prevBlocks.findIndex(
        block => block.id.toString() === activeId
      )
      const newIndex = prevBlocks.findIndex(
        block => block.id.toString() === overId
      )

      return reorderBlocks(prevBlocks, oldIndex, newIndex)
    })
  }, [])

  /**
   * Normalize block content from server response
   * Convert object content to string for consistency
   */
  const normalizeBlockContent = (block: Block): Block => {
    // 画像とファイルブロックのcontentがオブジェクトの場合は文字列化
    if (
      (block.type === 'image' || block.type === 'file') &&
      typeof block.content === 'object' &&
      block.content !== null
    ) {
      return {
        ...block,
        content: JSON.stringify(block.content),
      }
    }
    return block
  }

  /**
   * Initialize blocks from server data
   */
  const initializeBlocks = useCallback(
    (serverBlocks: Block[]) => {
      if (serverBlocks && serverBlocks.length > 0) {
        // Sort blocks by position and normalize content
        const sortedBlocks = serverBlocks
          .sort((a, b) => a.position - b.position)
          .map(normalizeBlockContent)
        setBlocks(sortedBlocks)
      } else {
        // Auto-create first block for immediate typing
        const initialBlock = createInitialBlock(documentId)
        setBlocks([initialBlock])
      }
    },
    [documentId]
  )

  /**
   * Update blocks from server (for after save operations)
   * 修正: useRefを使用して無限ループを回避
   */
  const syncWithServer = useCallback(
    (serverBlocks: Block[]) => {
      if (serverBlocks && serverBlocks.length > 0) {
        const sortedBlocks = serverBlocks
          .sort((a, b) => a.position - b.position)
          .map(normalizeBlockContent)

        // refを使用して現在のblocksと比較（無限ループを回避）
        const currentBlocks = blocksRef.current
        if (JSON.stringify(sortedBlocks) !== JSON.stringify(currentBlocks)) {
          setBlocks(sortedBlocks)
        }
      }
    },
    [] // 依存配列からblocksを削除して無限ループを回避
  )

  /**
   * Reset blocks to initial state
   */
  const resetBlocks = useCallback(() => {
    setBlocks(initialBlocks)
  }, [initialBlocks])

  /**
   * Get block by ID
   */
  const getBlockById = useCallback(
    (blockId: number) => {
      return blocks.find(block => block.id === blockId)
    },
    [blocks]
  )

  /**
   * Check if block is first
   */
  const isFirstBlock = useCallback(
    (blockId: number) => {
      const block = getBlockById(blockId)
      return block?.position === 0
    },
    [getBlockById]
  )

  /**
   * Check if block is last
   */
  const isLastBlock = useCallback(
    (blockId: number) => {
      const block = getBlockById(blockId)
      return block?.position === blocks.length - 1
    },
    [getBlockById, blocks.length]
  )

  return {
    blocks,
    handleBlockUpdate,
    handleBlockDelete,
    handleAddBlock,
    handleMoveBlockUp,
    handleMoveBlockDown,
    handleReorder,
    handleDragEnd,
    initializeBlocks,
    syncWithServer,
    resetBlocks,
    getBlockById,
    isFirstBlock,
    isLastBlock,
    // Derived state
    isEmpty: blocks.length === 0,
    hasMultipleBlocks: blocks.length > 1,
  }
}
