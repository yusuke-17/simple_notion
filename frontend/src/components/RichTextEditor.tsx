import { EditorContent } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
} from 'lucide-react'
import { useRichTextEditor } from '@/hooks/useRichTextEditor'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

interface RichTextEditorProps {
  content: string
  placeholder?: string
  className?: string
  onUpdate: (content: string) => void
  onFocus?: () => void
  onKeyDown?: (event: ReactKeyboardEvent) => boolean | void
}

/**
 * リッチテキストエディタービューコンポーネント
 * レンダリングとユーザーインタラクションに特化した純粋なUIコンポーネント
 * ビジネスロジックはuseRichTextEditorフックに移動済み
 */
export function RichTextEditor({
  content,
  placeholder = 'Start typing...',
  className = '',
  onUpdate,
  onFocus,
  onKeyDown,
}: RichTextEditorProps) {
  // フックが全てのリッチテキストエディターロジックをカプセル化
  const {
    editor,
    editorRef,
    showToolbar,
    toolbarPosition,
    showContextMenu,
    contextMenuPosition,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrike,
    isFormatActive,
  } = useRichTextEditor({
    content,
    placeholder,
    onUpdate,
    onFocus,
    onKeyDown,
  })

  return (
    <div className="relative">
      {/* メインエディター */}
      <div ref={editorRef} className="relative">
        <EditorContent
          editor={editor}
          className={`prose prose-sm focus-within:outline-none max-w-none ${className}`}
        />

        {/* テキスト書式用フローティングツールバー */}
        {showToolbar && (
          <div
            className="absolute z-10 bg-white border border-gray-200 rounded shadow-lg p-1 flex space-x-1"
            style={{
              top: `${toolbarPosition.top}px`,
              left: `${toolbarPosition.left}px`,
            }}
          >
            <Button
              size="sm"
              variant={isFormatActive('bold') ? 'default' : 'ghost'}
              onClick={toggleBold}
              className="h-6 w-6 p-1"
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant={isFormatActive('italic') ? 'default' : 'ghost'}
              onClick={toggleItalic}
              className="h-6 w-6 p-1"
            >
              <Italic className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant={isFormatActive('underline') ? 'default' : 'ghost'}
              onClick={toggleUnderline}
              className="h-6 w-6 p-1"
            >
              <UnderlineIcon className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant={isFormatActive('strike') ? 'default' : 'ghost'}
              onClick={toggleStrike}
              className="h-6 w-6 p-1"
            >
              <Strikethrough className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Context menu for right-click formatting */}
        {showContextMenu && (
          <div
            className="absolute z-20 bg-white border border-gray-200 rounded shadow-lg p-1"
            style={{
              top: `${contextMenuPosition.top}px`,
              left: `${contextMenuPosition.left}px`,
            }}
          >
            <div className="flex flex-col space-y-1 min-w-[120px]">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleBold}
                className="justify-start h-7 px-2"
              >
                <Bold className="h-3 w-3 mr-2" />
                Bold
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleItalic}
                className="justify-start h-7 px-2"
              >
                <Italic className="h-3 w-3 mr-2" />
                Italic
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleUnderline}
                className="justify-start h-7 px-2"
              >
                <UnderlineIcon className="h-3 w-3 mr-2" />
                Underline
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleStrike}
                className="justify-start h-7 px-2"
              >
                <Strikethrough className="h-3 w-3 mr-2" />
                Strike
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
