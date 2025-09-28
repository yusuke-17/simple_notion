import { Input } from '@/components/ui/input'
import { SortableBlockEditor } from './SortableBlockEditor'
import { useDocumentEditor } from '@/hooks/useDocumentEditor'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

interface DocumentEditorProps {
  documentId: number
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  // Use our custom hook that encapsulates all business logic
  const {
    // Document state
    document,
    title,
    isLoading,
    error,

    // Title management
    updateTitle,

    // Block management
    blocks,
    handleBlockUpdate,
    handleBlockDelete,
    handleAddBlock,
    handleMoveBlockUp,
    handleMoveBlockDown,
    handleDragEnd,
  } = useDocumentEditor(documentId)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle focus events (placeholder for future features)
  const handleBlockFocus = () => {
    // Currently unused, but kept for future features like focus management
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  // Document not found
  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Document not found</div>
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
            onChange={e => updateTitle(e.target.value)}
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
              {blocks.map(block => (
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
