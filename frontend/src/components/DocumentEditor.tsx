import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Trash2 } from 'lucide-react'
import type { Document } from '@/types'

interface DocumentEditorProps {
  documentId: number
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const [document, setDocument] = useState<Document | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
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
          setContent(doc.content)
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
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled',
          content
        }),
        credentials: 'include'
      })

      if (response.ok) {
        setLastSaved(new Date())
        // Trigger document list refresh
        window.dispatchEvent(new CustomEvent('document-updated'))
      }
    } catch (error) {
      console.error('Failed to save document:', error)
    } finally {
      setIsSaving(false)
    }
  }, [document, documentId, title, content])

  const deleteDocument = async () => {
    if (!document) return
    if (!confirm('Move this document to trash?')) return

    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      // Trigger document list refresh and clear current document
      window.dispatchEvent(new CustomEvent('document-deleted', { 
        detail: { documentId } 
      }))
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (document && (title !== document.title || content !== document.content)) {
        saveDocument()
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [title, content, document, saveDocument])

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
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="w-full h-full border-none resize-none focus:outline-none text-base leading-relaxed"
        />
      </div>
    </div>
  )
}
