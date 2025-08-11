import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Trash2, Plus } from 'lucide-react'
import { BlockEditor } from './BlockEditor'
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
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

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
          
          // Initialize blocks if empty
          if (doc.blocks && doc.blocks.length > 0) {
            setBlocks(doc.blocks.sort((a: Block, b: Block) => a.position - b.position))
          } else {
            // Create initial text block
            const initialBlock: Block = {
              id: Date.now(), // Temporary ID for new blocks
              type: 'text',
              content: doc.content || '',
              documentId: documentId,
              position: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            setBlocks([initialBlock])
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

    setIsSaving(true)
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
        if (updatedDoc.blocks) {
          setBlocks(updatedDoc.blocks.sort((a: Block, b: Block) => a.position - b.position))
        }
        setLastSaved(new Date())
        // Trigger document list refresh
        window.dispatchEvent(new CustomEvent('document-updated'))
      }
    } catch (error) {
      console.error('Failed to save document:', error)
    } finally {
      setIsSaving(false)
    }
  }, [document, documentId, title, blocks])

  const deleteDocument = useCallback(async () => {
    if (!document) return

    const confirmed = window.confirm('Are you sure you want to delete this document?')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // Trigger document deletion event
        window.dispatchEvent(new CustomEvent('document-deleted', {
          detail: { documentId }
        }))
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }, [document, documentId])

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
      const newBlocks = prevBlocks.filter(block => block.id !== blockId)
      // If no blocks left, create a default text block
      if (newBlocks.length === 0) {
        return [{
          id: Date.now(),
          type: 'text',
          content: '',
          documentId: documentId,
          position: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      }
      return newBlocks
    })
  }, [documentId])

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

  const addNewBlock = useCallback(() => {
    const lastBlock = blocks[blocks.length - 1]
    if (lastBlock) {
      handleAddBlock(lastBlock.id, 'text')
    } else {
      // If no blocks exist, create first block
      const newBlock: Block = {
        id: Date.now(),
        type: 'text',
        content: '',
        documentId: documentId,
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setBlocks([newBlock])
    }
  }, [blocks, handleAddBlock, documentId])

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (document && blocks.length > 0) {
        saveDocument()
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [title, blocks, document, saveDocument])

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
          
          <div className="flex items-center space-x-2">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            <Button
              onClick={saveDocument}
              disabled={isSaving}
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>

            <Button
              onClick={deleteDocument}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4 pl-16">
        <div className="max-w-4xl">
          {blocks.map((block) => (
            <BlockEditor
              key={block.id}
              block={block}
              onUpdate={handleBlockUpdate}
              onDelete={handleBlockDelete}
              onAddBlock={handleAddBlock}
              onMoveUp={handleMoveBlockUp}
              onMoveDown={handleMoveBlockDown}
              onFocus={handleBlockFocus}
            />
          ))}
          
          {/* Add block button */}
          <div className="group py-2">
            <Button
              variant="ghost"
              onClick={addNewBlock}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add a block
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
