import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, Plus, Trash2, X } from 'lucide-react'
import type { Document } from '@/types'

interface SidebarProps {
  currentDocumentId: number | null
  onDocumentSelect: (documentId: number) => void
  onDocumentDelete: (documentId: number) => void
  showingSidebar: boolean
  onToggleSidebar: () => void
}

export function Sidebar({ currentDocumentId, onDocumentSelect, onDocumentDelete, showingSidebar, onToggleSidebar }: SidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [showingTrash, setShowingTrash] = useState(false)
  const [trashedDocuments, setTrashedDocuments] = useState<Document[]>([])
  const [hoveredDocId, setHoveredDocId] = useState<number | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  // Listen for document updates to refresh the sidebar
  useEffect(() => {
    const handleDocumentUpdate = () => {
      loadDocuments()
    }

    const handleDocumentDelete = () => {
      loadDocuments()
    }

    window.addEventListener('document-updated', handleDocumentUpdate)
    window.addEventListener('document-deleted', handleDocumentDelete)
    
    return () => {
      window.removeEventListener('document-updated', handleDocumentUpdate)
      window.removeEventListener('document-deleted', handleDocumentDelete)
    }
  }, [])

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setDocuments(Array.isArray(data) ? data : [])
      } else {
        // エラー時は空配列を設定
        setDocuments([])
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
      // エラー時は空配列を設定
      setDocuments([])
    }
  }

  const loadTrashedDocuments = async () => {
    try {
      const response = await fetch('/api/documents?deleted=true', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setTrashedDocuments(Array.isArray(data) ? data : [])
      } else {
        // エラー時は空配列を設定
        setTrashedDocuments([])
      }
    } catch (error) {
      console.error('Failed to load trashed documents:', error)
      // エラー時は空配列を設定
      setTrashedDocuments([])
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

  const deleteDocument = async (docId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!confirm('Move this document to trash?')) return

    try {
      await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      // ドキュメントリストを更新
      await loadDocuments()
      
      // 削除されたドキュメントが現在表示中の場合、前のドキュメントを表示
      onDocumentDelete(docId)
    } catch (error) {
      console.error('Failed to delete document:', error)
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
      await fetch(`/api/documents/${docId}/permanent`, {
        method: 'DELETE',
        credentials: 'include'
      })
      await loadTrashedDocuments()
    } catch (error) {
      console.error('Failed to permanently delete document:', error)
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
            aria-label="Toggle sidebar"
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
              aria-label="Toggle trash view"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {showingTrash && (!trashedDocuments || trashedDocuments.length === 0) ? (
              /* ゴミ箱が空の場合の表示 */
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="mb-4">
                  <Trash2 className="h-12 w-12 text-gray-300" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  ゴミ箱は空です
                </h3>
                <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                  削除されたドキュメントは<br />
                  ここに表示されます
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTrash}
                  className="text-xs"
                >
                  ドキュメント一覧に戻る
                </Button>
              </div>
            ) : (
              (showingTrash ? (trashedDocuments || []) : documents).map((doc) => (
                <div
                  key={doc.id}
                  className={`p-2 rounded-md cursor-pointer transition-colors relative group ${
                    currentDocumentId === doc.id
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => !showingTrash && onDocumentSelect(doc.id)}
                  onMouseEnter={() => setHoveredDocId(doc.id)}
                  onMouseLeave={() => setHoveredDocId(null)}
                >
                  <div className="text-sm font-medium truncate pr-8">
                    {doc.title || 'Untitled'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(() => {
                      if (!doc.updatedAt) return 'No date';
                      const date = new Date(doc.updatedAt);
                      return isNaN(date.getTime()) 
                        ? 'Invalid date' 
                        : date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                          });
                    })()}
                  </div>
                  
                  {/* 通常のドキュメントの削除ボタン（ホバー時表示） */}
                  {!showingTrash && hoveredDocId === doc.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => deleteDocument(doc.id, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
