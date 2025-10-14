import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'

/**
 * 読み取り専用リッチテキストビューアーコンポーネント
 * TipTapエディターを読み取り専用モードで使用してJSONコンテンツを表示
 */
interface ReadOnlyRichTextViewerProps {
  content: string
}

export function ReadOnlyRichTextViewer({
  content,
}: ReadOnlyRichTextViewerProps) {
  // JSONコンテンツをパースしてオブジェクトに変換
  let parsedContent
  let isValidJson = false
  const isEmpty = !content || content.trim() === '' || content === '{}'

  if (!isEmpty) {
    // contentがすでにオブジェクトの場合はそのまま使用
    if (typeof content === 'object') {
      parsedContent = content
      isValidJson = true
    } else {
      // 文字列の場合はJSON.parseを試みる
      try {
        parsedContent = JSON.parse(content)
        isValidJson = true
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        // JSON パースに失敗した場合はプレーンテキストとして扱う
        parsedContent = content
      }
    }
  }

  // TipTapエディターを読み取り専用で初期化（Hooksは常に呼ぶ必要がある）
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: parsedContent, // パース済みのJSONオブジェクトまたはプレーンテキスト
    editable: false, // 読み取り専用
    editorProps: {
      attributes: {
        class:
          'prose max-w-none text-gray-800 leading-relaxed cursor-text outline-none',
      },
    },
  })

  // コンテンツが空の場合の表示
  if (isEmpty) {
    return <div className="text-gray-400 italic">Empty block</div>
  }

  // プレーンテキストの場合は直接表示
  if (!isValidJson) {
    return (
      <div className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
        {content}
      </div>
    )
  }

  // TipTapエディターで表示
  return (
    <div className="readonly-rich-text-viewer">
      <EditorContent editor={editor} />
    </div>
  )
}
