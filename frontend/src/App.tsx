import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Login } from '@/components/Login'
import { Sidebar } from '@/components/Sidebar'
import { DocumentEditor } from '@/components/DocumentEditor'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

function App() {
  const { user, checkAuth, logout } = useAuthStore()
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null)
  const [showingSidebar, setShowingSidebar] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    // Listen for document deletion events
    const handleDocumentDeleted = (e: CustomEvent) => {
      if (e.detail.documentId === currentDocumentId) {
        setCurrentDocumentId(null)
      }
    }

    window.addEventListener('document-deleted', handleDocumentDeleted as EventListener)
    return () => window.removeEventListener('document-deleted', handleDocumentDeleted as EventListener)
  }, [currentDocumentId])

  if (!user) {
    return <Login />
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        currentDocumentId={currentDocumentId}
        onDocumentSelect={setCurrentDocumentId}
        showingSidebar={showingSidebar}
        onToggleSidebar={() => setShowingSidebar(!showingSidebar)}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-12 border-b border-gray-200 flex items-center px-4">
          {!showingSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowingSidebar(true)}
              className="mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

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
                <p className="text-lg">Select a document to start editing</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
