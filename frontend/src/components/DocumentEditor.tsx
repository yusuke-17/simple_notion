import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Input } from '@/components/ui/input'
import { SortableBlockEditor } from './SortableBlockEditor'
import type { Document, Block } from '@/types'

interface DocumentEditorProps {
  documentId: number
}

interface DocumentWithBlocks extends Document {
  blocks: Block[]
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const [document, setDocument] = useState<DocumentWithBlocks | null>(null)
  const [title, setTitle] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  
  // Keep track of original data for comparison
  const [originalTitle, setOriginalTitle] = useState('')
  const [originalBlocks, setOriginalBlocks] = useState<Block[]>([])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          credentials: 'include'
        })
        if (response.ok) {
          const doc = await response.json()
          setDocument(doc)
          setTitle(doc.title)
          setOriginalTitle(doc.title) // Keep track of original title
          
          // Initialize blocks
          if (doc.blocks && doc.blocks.length > 0) {
            const sortedBlocks = doc.blocks.sort((a: Block, b: Block) => a.position - b.position)
            setBlocks(sortedBlocks)
            setOriginalBlocks(sortedBlocks) // Keep track of original blocks
          } else {
            // Auto-create first block for immediate typing
            const initialBlock: Block = {
              id: Date.now(),
              type: 'text',
              content: '',
              documentId: documentId,
              position: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            setBlocks([initialBlock])
            setOriginalBlocks([initialBlock])
          }
        }
      } catch (error) {
        console.error('Failed to load document:', error)
      }
    }
    
    loadDocument()
  }, [documentId])

  const saveDocument = useCallback(async () => {
    if (!document) return

    try {
      // Prepare blocks with proper order
      const orderedBlocks = blocks.map((block, index) => ({
        ...block,
        position: index,
        documentId: documentId
      }))

      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled',
          content: blocks.map(block => block.content).join('\n'), // Legacy content field
          blocks: orderedBlocks
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const updatedDoc = await response.json()
        setDocument(updatedDoc)
        
        // Update original data to reflect the saved state
        setOriginalTitle(updatedDoc.title)
        if (updatedDoc.blocks) {
          const sortedBlocks = updatedDoc.blocks.sort((a: Block, b: Block) => a.position - b.position)
          setOriginalBlocks(sortedBlocks)
          
          // Only update blocks if there are actual changes from server
          // to prevent unnecessary re-renders and cursor position issues
          if (JSON.stringify(sortedBlocks) !== JSON.stringify(blocks)) {
            setBlocks(sortedBlocks)
          }
        }
        // Trigger document list refresh
        window.dispatchEvent(new CustomEvent('document-updated'))
      }
    } catch (error) {
      console.error('Failed to save document:', error)
    }
  }, [document, documentId, title, blocks])

  const handleBlockUpdate = useCallback((blockId: number, content: string, type?: string) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId 
          ? { ...block, content, type: type || block.type, updatedAt: new Date().toISOString() }
          : block
      )
    )
  }, [])

  const handleBlockDelete = useCallback((blockId: number) => {
    setBlocks(prevBlocks => {
      // Prevent deleting the last remaining block or the first block (position 0)
      if (prevBlocks.length <= 1) return prevBlocks
      
      const blockToDelete = prevBlocks.find(block => block.id === blockId)
      if (blockToDelete && blockToDelete.position === 0 && prevBlocks.length > 1) {
        // If trying to delete the first block but there are other blocks,
        // don't delete it to maintain document structure
        return prevBlocks
      }
      
      const newBlocks = prevBlocks.filter(block => block.id !== blockId)
      // Recalculate positions after deletion
      return newBlocks.map((block, index) => ({ ...block, position: index }))
    })
  }, [])

  const handleAddBlock = useCallback((afterBlockId: number, type: string) => {
    setBlocks(prevBlocks => {
      const afterIndex = prevBlocks.findIndex(block => block.id === afterBlockId)
      const newBlock: Block = {
        id: Date.now() + Math.random(), // Ensure unique temporary ID
        type,
        content: '',
        documentId: documentId,
        position: afterIndex + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const newBlocks = [...prevBlocks]
      newBlocks.splice(afterIndex + 1, 0, newBlock)
      
      // Update position for subsequent blocks
      return newBlocks.map((block, index) => ({ ...block, position: index }))
    })
  }, [documentId])

  const handleMoveBlockUp = useCallback((blockId: number) => {
    setBlocks(prevBlocks => {
      const blockIndex = prevBlocks.findIndex(block => block.id === blockId)
      if (blockIndex <= 0) return prevBlocks
      
      const newBlocks = [...prevBlocks]
      const temp = newBlocks[blockIndex]
      newBlocks[blockIndex] = newBlocks[blockIndex - 1]
      newBlocks[blockIndex - 1] = temp
      
      // Update position
      return newBlocks.map((block, index) => ({ ...block, position: index }))
    })
  }, [])

  const handleMoveBlockDown = useCallback((blockId: number) => {
    setBlocks(prevBlocks => {
      const blockIndex = prevBlocks.findIndex(block => block.id === blockId)
      if (blockIndex >= prevBlocks.length - 1) return prevBlocks
      
      const newBlocks = [...prevBlocks]
      const temp = newBlocks[blockIndex]
      newBlocks[blockIndex] = newBlocks[blockIndex + 1]
      newBlocks[blockIndex + 1] = temp
      
      // Update position
      return newBlocks.map((block, index) => ({ ...block, position: index }))
    })
  }, [])

  const handleBlockFocus = useCallback((blockId: number) => {
    // Currently unused, but kept for future features like focus management
    console.log('Block focused:', blockId)
  }, [])

  // Handle drag end event
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setBlocks((blocks) => {
        const oldIndex = blocks.findIndex((block) => block.id.toString() === active.id)
        const newIndex = blocks.findIndex((block) => block.id.toString() === over.id)

        const newBlocks = arrayMove(blocks, oldIndex, newIndex)
        
        // Update position for all blocks after reordering
        return newBlocks.map((block, index) => ({ ...block, position: index }))
      })
    }
  }, [])

  // Content-based auto-save - only save when content actually changes
  useEffect(() => {
    // Check if title or blocks have changed from original
    const titleChanged = title !== originalTitle
    const blocksChanged = JSON.stringify(blocks) !== JSON.stringify(originalBlocks)
    
    if (titleChanged || blocksChanged) {
      // Debounce save to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        saveDocument()
      }, 500) // 500ms debounce
      
      return () => clearTimeout(timeoutId)
    }
  }, [title, blocks, originalTitle, originalBlocks, saveDocument])

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="text-2xl font-bold border-none p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4 pl-20">
        <div className="max-w-4xl">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map(block => block.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map((block) => (
                <SortableBlockEditor
                  key={`block-${block.id}-${block.position}`} // Stable key to prevent unnecessary re-renders
                  block={block}
                  onUpdate={handleBlockUpdate}
                  onDelete={handleBlockDelete}
                  onAddBlock={handleAddBlock}
                  onMoveUp={handleMoveBlockUp}
                  onMoveDown={handleMoveBlockDown}
                  onFocus={handleBlockFocus}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
