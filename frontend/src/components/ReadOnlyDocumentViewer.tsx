import { Input } from '@/components/ui/input'
import { ReadOnlyRichTextViewer } from './ReadOnlyRichTextViewer'
import type { ReadOnlyDocumentViewerProps } from '@/types'
import { useReadOnlyDocumentViewer } from '@/hooks/useReadOnlyDocumentViewer'

/**
 * 読み取り専用ドキュメントビューアーコンポーネント
 * ゴミ箱内のドキュメントを読み取り専用で表示する
 *
 * 特徴:
 * - 全ての編集機能を無効化
 * - グレーアウト表示で読み取り専用であることを明示
 * - テキスト選択とコピーは可能
 */
export function ReadOnlyDocumentViewer({
  documentId,
}: ReadOnlyDocumentViewerProps) {
  const { document, isLoading, error } = useReadOnlyDocumentViewer(documentId)

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

  // ドキュメントが見つからない場合
  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Document not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full opacity-70 pointer-events-none select-text">
      {/* 読み取り専用であることを示すバナー */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 pointer-events-auto">
        <div className="flex items-center justify-center">
          <span className="text-sm text-gray-600 font-medium">
            📄 このドキュメントは読み取り専用です（ゴミ箱内）
          </span>
        </div>
      </div>

      {/* ヘッダー - タイトル表示（読み取り専用） */}
      <div className="border-b border-gray-200 p-4 pointer-events-auto">
        <div className="flex items-center justify-between">
          <Input
            value={document.title || 'Untitled'}
            readOnly
            className="text-2xl font-bold border-none p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 cursor-default"
            data-testid="readonly-document-title"
            tabIndex={-1} // タブナビゲーションから除外
          />
        </div>
      </div>

      {/* コンテンツエリア - ブロック表示（読み取り専用） */}
      <div className="flex-1 p-4 pl-20 pointer-events-auto">
        <div className="max-w-4xl">
          {document.blocks && document.blocks.length > 0 ? (
            <div className="space-y-2">
              {document.blocks.map(block => (
                <div
                  key={`readonly-block-${block.id}`}
                  className="group relative"
                  data-testid={`readonly-block-${block.id}`}
                >
                  {/* ブロックコンテンツ */}
                  <div className="min-h-[2rem] p-2 rounded border border-transparent">
                    {block.type === 'image' ? (
                      /* 画像ブロックの読み取り専用表示 */
                      <ReadOnlyImageBlock content={block.content} />
                    ) : (
                      /* テキストブロックの読み取り専用表示 */
                      <div data-testid={`readonly-block-content-${block.id}`}>
                        <ReadOnlyRichTextViewer content={block.content || ''} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 空のドキュメント表示 */
            <div className="flex items-center justify-center h-32 text-gray-400">
              <span>このドキュメントには内容がありません</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 画像ブロックの読み取り専用表示コンポーネント
 */
function ReadOnlyImageBlock({ content }: { content: string }) {
  try {
    const imageData = JSON.parse(content)

    return (
      <div className="flex flex-col items-start space-y-2">
        <img
          src={imageData.src}
          alt={imageData.alt || ''}
          className="max-w-full h-auto rounded border border-gray-200"
          style={{
            width: imageData.width ? `${imageData.width}px` : 'auto',
            height: imageData.height ? `${imageData.height}px` : 'auto',
          }}
        />
        {imageData.caption && (
          <p className="text-sm text-gray-600 italic">{imageData.caption}</p>
        )}
      </div>
    )
  } catch {
    // JSON パースに失敗した場合は、プレーンテキストとして表示
    return (
      <div className="text-gray-500 italic">
        画像を表示できません: {content}
      </div>
    )
  }
}
