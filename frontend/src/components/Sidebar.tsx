import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, Plus, Trash2 } from 'lucide-react'
import type { Document } from '@/types'

interface SidebarProps {
  currentDocumentId: number | null
  onDocumentSelect: (documentId: number) => void
  showingSidebar: boolean
  onToggleSidebar: () => void
}

export function Sidebar({ currentDocumentId, onDocumentSelect, showingSidebar, onToggleSidebar }: SidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [showingTrash, setShowingTrash] = useState(false)
  const [trashedDocuments, setTrashedDocuments] = useState<Document[]>([])

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    }
  }

  const loadTrashedDocuments = async () => {
    try {
      const response = await fetch('/api/documents?deleted=true', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setTrashedDocuments(data)
      }
    } catch (error) {
      console.error('Failed to load trashed documents:', error)
    }
  }

  const createDocument = async () => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled',
          content: '',
          parentId: null
        }),
        credentials: 'include'
      })
      
      if (response.ok) {
        const newDoc = await response.json()
        setDocuments(prev => [...prev, newDoc])
        onDocumentSelect(newDoc.id)
      }
    } catch (error) {
      console.error('Failed to create document:', error)
    }
  }

  const restoreDocument = async (docId: number) => {
    try {
      await fetch(`/api/documents/${docId}/restore`, {
        method: 'PUT',
        credentials: 'include'
      })
      await loadTrashedDocuments()
      await loadDocuments()
    } catch (error) {
      console.error('Failed to restore document:', error)
    }
  }

  const permanentDelete = async (docId: number) => {
    if (!confirm('Permanently delete this document? This cannot be undone.')) return

    try {
      await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      await loadTrashedDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const toggleTrash = () => {
    setShowingTrash(!showingTrash)
    if (!showingTrash) {
      loadTrashedDocuments()
    }
  }

  if (!showingSidebar) return null

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Documents</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          onClick={createDocument}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">
              {showingTrash ? 'Trash' : 'All Documents'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTrash}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {(showingTrash ? trashedDocuments : documents).map((doc) => (
              <div
                key={doc.id}
                className={`p-2 rounded-md cursor-pointer transition-colors ${
                  currentDocumentId === doc.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => !showingTrash && onDocumentSelect(doc.id)}
              >
                <div className="text-sm font-medium truncate">
                  {doc.title || 'Untitled'}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </div>
                
                {showingTrash && (
                  <div className="mt-2 flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreDocument(doc.id)}
                    >
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => permanentDelete(doc.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
