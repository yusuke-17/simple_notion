import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MemoizedBlockEditor } from '@/components/BlockEditor'
import type { Block } from '@/types'

interface SortableBlockEditorProps {
  block: Block
  onUpdate: (id: number, content: string, type?: string) => void
  onDelete: (id: number) => void
  onAddBlock: (afterBlockId: number, type: string) => void
  onMoveUp: (id: number) => void
  onMoveDown: (id: number) => void
  onFocus: (id: number) => void
}

export function SortableBlockEditor({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  onMoveUp,
  onMoveDown,
  onFocus
}: SortableBlockEditorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <MemoizedBlockEditor
        block={block}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAddBlock={onAddBlock}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onFocus={onFocus}
        dragHandleProps={listeners}
      />
    </div>
  )
}
