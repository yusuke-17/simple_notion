import { EditorContent } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Type,
  Palette,
  Link as LinkIcon,
  Link2Off,
} from 'lucide-react'
import { useRichTextEditor } from '@/hooks/useRichTextEditor'
import { ColorPalette, ColorPaletteTrigger } from '@/components/ui/ColorPalette'
import { LinkEditDialog } from '@/components/ui/LinkEditDialog'
import { useState } from 'react'
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
  // カラーパレットの表示状態管理
  const [showColorPalette, setShowColorPalette] = useState(false)
  const [colorPaletteType, setColorPaletteType] = useState<
    'text' | 'highlight'
  >('text')

  // リンクダイアログの表示状態管理
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkDialogPosition, setLinkDialogPosition] = useState({
    top: 0,
    left: 0,
  })

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
    setTextColor,
    setHighlightColor,
    getTextColor,
    getHighlightColor,
    setLink,
    removeLink,
    getLink,
    isLinkActive,
  } = useRichTextEditor({
    content,
    placeholder,
    onUpdate,
    onFocus,
    onKeyDown,
  })

  // カラーパレットの表示切り替え
  const handleColorPaletteToggle = (type: 'text' | 'highlight') => {
    setColorPaletteType(type)
    setShowColorPalette(!showColorPalette)
  }

  // 色の選択処理
  const handleColorSelect = (color: string) => {
    if (colorPaletteType === 'text') {
      setTextColor(color)
    } else {
      setHighlightColor(color)
    }
    setShowColorPalette(false)
  }

  // カラーパレットを閉じる処理
  const handleClosePalette = () => {
    setShowColorPalette(false)
  }

  // リンクダイアログを開く処理
  const handleOpenLinkDialog = () => {
    setLinkDialogPosition(toolbarPosition)
    setShowLinkDialog(true)
    setShowColorPalette(false)
  }

  // リンク設定処理
  const handleSetLink = (url: string, text: string, openInNewTab: boolean) => {
    setLink(url, text, openInNewTab)
    setShowLinkDialog(false)
  }

  // リンク解除処理
  const handleRemoveLink = () => {
    removeLink()
    setShowLinkDialog(false)
  }

  // リンクダイアログを閉じる処理
  const handleCloseLinkDialog = () => {
    setShowLinkDialog(false)
  }

  // 選択されたテキストを取得
  const getSelectedText = () => {
    const selection = window.getSelection()
    return selection?.toString() || ''
  }

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

            {/* 区切り線 */}
            <div className="w-px bg-gray-200 mx-1" />

            {/* カラーボタン */}
            <ColorPaletteTrigger
              type="text"
              currentColor={getTextColor()}
              isActive={showColorPalette && colorPaletteType === 'text'}
              onClick={() => handleColorPaletteToggle('text')}
            />
            <ColorPaletteTrigger
              type="highlight"
              currentColor={getHighlightColor()}
              isActive={showColorPalette && colorPaletteType === 'highlight'}
              onClick={() => handleColorPaletteToggle('highlight')}
            />

            {/* 区切り線 */}
            <div className="w-px bg-gray-200 mx-1" />

            {/* リンクボタン */}
            <Button
              size="sm"
              variant={isLinkActive() ? 'default' : 'ghost'}
              onClick={handleOpenLinkDialog}
              className="h-6 w-6 p-1"
              title="リンクを追加"
            >
              <LinkIcon className="h-3 w-3" />
            </Button>
            {isLinkActive() && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemoveLink}
                className="h-6 w-6 p-1"
                title="リンクを解除"
              >
                <Link2Off className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* カラーパレット */}
        {showColorPalette && (
          <div
            className="absolute z-20"
            style={{
              top: `${toolbarPosition.top + 40}px`, // ツールバーの下に表示
              left: `${toolbarPosition.left}px`,
            }}
          >
            <ColorPalette
              type={colorPaletteType}
              currentColor={
                colorPaletteType === 'text'
                  ? getTextColor()
                  : getHighlightColor()
              }
              onColorSelect={handleColorSelect}
              onClose={handleClosePalette}
            />
          </div>
        )}

        {/* リンク編集ダイアログ */}
        {showLinkDialog && (
          <LinkEditDialog
            initialUrl={getLink()}
            initialText={getSelectedText()}
            position={linkDialogPosition}
            onSetLink={handleSetLink}
            onRemoveLink={isLinkActive() ? handleRemoveLink : undefined}
            onClose={handleCloseLinkDialog}
          />
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

              {/* 区切り線 */}
              <div className="h-px bg-gray-200 my-1" />

              {/* カラーオプション */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleColorPaletteToggle('text')}
                className="justify-start h-7 px-2"
              >
                <Type className="h-3 w-3 mr-2" />
                テキスト色
                {getTextColor() && (
                  <div
                    className="ml-2 w-2 h-2 rounded-sm border border-gray-300"
                    style={{ backgroundColor: getTextColor() }}
                  />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleColorPaletteToggle('highlight')}
                className="justify-start h-7 px-2"
              >
                <Palette className="h-3 w-3 mr-2" />
                背景色
                {getHighlightColor() && (
                  <div
                    className="ml-2 w-2 h-2 rounded-sm border border-gray-300"
                    style={{ backgroundColor: getHighlightColor() }}
                  />
                )}
              </Button>

              {/* 区切り線 */}
              <div className="h-px bg-gray-200 my-1" />

              {/* リンクオプション */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleOpenLinkDialog}
                className="justify-start h-7 px-2"
              >
                <LinkIcon className="h-3 w-3 mr-2" />
                {isLinkActive() ? 'リンクを編集' : 'リンクを追加'}
              </Button>
              {isLinkActive() && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveLink}
                  className="justify-start h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Link2Off className="h-3 w-3 mr-2" />
                  リンクを解除
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
