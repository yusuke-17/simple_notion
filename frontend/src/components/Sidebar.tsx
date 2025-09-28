import { Button } from '@/components/ui/button'
import { Menu, Plus, Trash2, X } from 'lucide-react'
import { useSidebar } from '@/hooks/useSidebar'

interface SidebarProps {
  currentDocumentId: number | null
  onDocumentSelect: (documentId: number) => void
  onDocumentDelete: (documentId: number) => void
  showingSidebar: boolean
  onToggleSidebar: () => void
}

/**
 * Sidebar View Component
 * Pure UI component focused on rendering document navigation
 * Business logic has been moved to useSidebar hook
 */
export function Sidebar({
  currentDocumentId,
  onDocumentSelect,
  onDocumentDelete,
  showingSidebar,
  onToggleSidebar,
}: SidebarProps) {
  // Hook encapsulates all sidebar logic
  const {
    documents,
    showingTrash,
    trashedDocuments,
    hoveredDocId,
    createDocument,
    deleteDocument,
    restoreDocument,
    permanentDelete,
    toggleTrash,
    handleDocumentHover,
  } = useSidebar({
    onDocumentSelect,
    onDocumentDelete,
  })

  return (
    <div
      className={`${
        showingSidebar ? 'w-80' : 'w-12'
      } bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-200 h-full`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="h-8 w-8 p-0"
          aria-label="サイドバートグル"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {showingSidebar && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={createDocument}
              className="h-8 w-8 p-0"
              title="新しいドキュメント"
              aria-label="新しいドキュメント"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant={showingTrash ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleTrash}
              className="h-8 w-8 p-0"
              title={showingTrash ? 'ドキュメント一覧' : 'ゴミ箱'}
              aria-label={showingTrash ? 'ドキュメント一覧' : 'ゴミ箱'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {showingSidebar && (
        <div className="flex-1 overflow-y-auto p-2">
          {showingTrash ? (
            // Trash view
            <div className="space-y-1">
              <h3 className="px-2 py-1 text-sm font-medium text-gray-600">
                ゴミ箱
              </h3>
              {trashedDocuments.length === 0 ? (
                <p className="px-2 py-1 text-sm text-gray-500">
                  ゴミ箱は空です
                </p>
              ) : (
                trashedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="group flex items-center justify-between px-2 py-1 text-sm hover:bg-gray-200 rounded cursor-pointer"
                    onMouseEnter={() => handleDocumentHover(doc.id)}
                    onMouseLeave={() => handleDocumentHover(null)}
                  >
                    <span className="truncate flex-1">{doc.title}</span>
                    {hoveredDocId === doc.id && (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => restoreDocument(doc.id)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          title="復元"
                          aria-label="復元"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => permanentDelete(doc.id)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                          title="完全削除"
                          aria-label="削除"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            // Documents view
            <div className="space-y-1">
              <h3 className="px-2 py-1 text-sm font-medium text-gray-600">
                ドキュメント
              </h3>
              {documents.length === 0 ? (
                <p className="px-2 py-1 text-sm text-gray-500">
                  ドキュメントがありません
                </p>
              ) : (
                documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`group flex items-center justify-between px-2 py-1 text-sm rounded cursor-pointer ${
                      currentDocumentId === doc.id
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-200'
                    }`}
                    onClick={() => onDocumentSelect(doc.id)}
                    onMouseEnter={() => handleDocumentHover(doc.id)}
                    onMouseLeave={() => handleDocumentHover(null)}
                  >
                    <span className="truncate flex-1">{doc.title}</span>
                    {hoveredDocId === doc.id &&
                      currentDocumentId !== doc.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => deleteDocument(doc.id, e)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          title="削除"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
