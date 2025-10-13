import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Login } from '@/components/Login'
import { Sidebar } from '@/components/Sidebar'
import { DocumentEditor } from '@/components/DocumentEditor'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Document } from '@/types'

function App() {
  const { user, checkAuth, logout } = useAuthStore()
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(
    null
  )
  const [showingSidebar, setShowingSidebar] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth()
      setIsInitialized(true)
    }
    initializeAuth()
  }, [checkAuth])

  useEffect(() => {
    if (user) {
      loadDocuments()
    }
  }, [user])

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      } else {
        setDocuments([])
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load documents:', error)
      }
      setDocuments([])
    }
  }

  const handleDocumentDelete = (deletedDocumentId: number) => {
    if (deletedDocumentId === currentDocumentId) {
      // 削除されたドキュメントが現在表示中の場合
      const currentIndex = documents.findIndex(
        doc => doc.id === deletedDocumentId
      )

      if (currentIndex > 0) {
        // 前のドキュメントを表示
        setCurrentDocumentId(documents[currentIndex - 1].id)
      } else if (documents.length > 1) {
        // 最初のドキュメントが削除された場合、次のドキュメント（新しい最初）を表示
        setCurrentDocumentId(documents[1].id)
      } else {
        // ドキュメントが1個しかない場合、初期画面を表示
        setCurrentDocumentId(null)
      }
    }

    // ドキュメントリストを更新
    loadDocuments()
  }

  const createDocument = async () => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled',
          content: '',
          parentId: null,
        }),
        credentials: 'include',
      })

      if (response.ok) {
        const newDoc = await response.json()
        await loadDocuments()
        setCurrentDocumentId(newDoc.id)
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to create document:', error)
      }
    }
  }

  // 初期化が完了するまで待機
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        currentDocumentId={currentDocumentId}
        onDocumentSelect={setCurrentDocumentId}
        onDocumentDelete={handleDocumentDelete}
        showingSidebar={showingSidebar}
      />

      {/* サイドバーとメインエリアの境界線上の開閉ボタン */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowingSidebar(!showingSidebar)}
          className="absolute top-4 -translate-x-1/2 left-0 z-10 h-8 w-8 bg-white border border-gray-200 hover:bg-gray-50"
          aria-label="サイドバートグル"
        >
          {showingSidebar ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-12 border-b border-gray-200 flex items-center px-4">
          <div className="flex-1"></div>

          <Button
            variant="ghost"
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Logout
          </Button>
        </header>

        {/* Editor */}
        <main className="flex-1 overflow-hidden">
          {currentDocumentId ? (
            <DocumentEditor documentId={currentDocumentId} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-lg mb-4">No documents yet</p>
                <Button onClick={createDocument}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first document
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
