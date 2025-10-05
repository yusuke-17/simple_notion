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
  // 全てのビジネスロジックをカプセル化したカスタムフックを使用
  const {
    // ドキュメント状態
    document,
    title,
    isLoading,
    error,

    // タイトル管理
    updateTitle,

    // ブロック管理
    blocks,
    handleBlockUpdate,
    handleBlockDelete,
    handleAddBlock,
    handleMoveBlockUp,
    handleMoveBlockDown,
    handleDragEnd,
  } = useDocumentEditor(documentId)

  // ドラッグ&ドロップセンサー
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // フォーカスイベントを処理（将来の機能のためのプレースホルダー）
  const handleBlockFocus = () => {
    // 現在は未使用だが、フォーカス管理などの将来の機能のために保持
  }

  // ローディング状態
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  // ドキュメントが見つかりません
  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Document not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <Input
            value={title}
            onChange={e => updateTitle(e.target.value)}
            placeholder="Untitled"
            className="text-2xl font-bold border-none p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid="document-title-input"
          />
        </div>
      </div>

      {/* エディター */}
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
                  key={`block-${block.id}-${block.position}`} // 不要な再レンダリングを防ぐための安定したキー
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
