import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Link as LinkIcon, ExternalLink, Check } from 'lucide-react'
import { isValidUrl, normalizeUrl } from '@/utils/editorUtils'

interface LinkEditDialogProps {
  /** 現在のリンクURL（編集モードの場合） */
  initialUrl?: string
  /** 現在のリンクテキスト（編集モードの場合） */
  initialText?: string
  /** ダイアログの表示位置 */
  position: { top: number; left: number }
  /** リンク設定時のコールバック */
  onSetLink: (url: string, text: string, openInNewTab: boolean) => void
  /** リンク解除時のコールバック */
  onRemoveLink?: () => void
  /** ダイアログを閉じる際のコールバック */
  onClose: () => void
}

/**
 * リンク編集ダイアログコンポーネント
 * リンクの追加・編集・削除を行うためのUIを提供
 */
export function LinkEditDialog({
  initialUrl = '',
  initialText = '',
  position,
  onSetLink,
  onRemoveLink,
  onClose,
}: LinkEditDialogProps) {
  const [url, setUrl] = useState(initialUrl)
  const [text, setText] = useState(initialText)
  const [openInNewTab, setOpenInNewTab] = useState(true)
  const [urlError, setUrlError] = useState('')

  const isEditMode = !!initialUrl

  // 初期値が変更された場合に更新
  useEffect(() => {
    setUrl(initialUrl)
    setText(initialText)
  }, [initialUrl, initialText])

  /**
   * URL入力時のバリデーション
   */
  const handleUrlChange = useCallback((value: string) => {
    setUrl(value)
    if (value && !isValidUrl(value)) {
      setUrlError('有効なURLを入力してください')
    } else {
      setUrlError('')
    }
  }, [])

  /**
   * リンク設定処理
   */
  const handleSetLink = useCallback(() => {
    if (!url.trim()) {
      setUrlError('URLを入力してください')
      return
    }

    if (!isValidUrl(url)) {
      setUrlError('有効なURLを入力してください')
      return
    }

    const normalizedUrl = normalizeUrl(url)
    onSetLink(normalizedUrl, text.trim(), openInNewTab)
    onClose()
  }, [url, text, openInNewTab, onSetLink, onClose])

  /**
   * リンク解除処理
   */
  const handleRemoveLink = useCallback(() => {
    onRemoveLink?.()
    onClose()
  }, [onRemoveLink, onClose])

  /**
   * Enterキーでリンク設定
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSetLink()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [handleSetLink, onClose]
  )

  return (
    <>
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-label="ダイアログを閉じる"
      />

      {/* ダイアログ本体 */}
      <div
        className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[400px]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        data-link-dialog
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              {isEditMode ? 'リンクを編集' : 'リンクを追加'}
            </h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 p-0"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* URL入力 */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="link-url"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              URL
            </label>
            <Input
              id="link-url"
              type="text"
              value={url}
              onChange={e => handleUrlChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className={`w-full ${urlError ? 'border-red-500' : ''}`}
              autoFocus
            />
            {urlError && (
              <p className="text-xs text-red-600 mt-1">{urlError}</p>
            )}
          </div>

          {/* テキスト入力（オプション） */}
          <div>
            <label
              htmlFor="link-text"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              表示テキスト（オプション）
            </label>
            <Input
              id="link-text"
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="リンクのテキスト"
              className="w-full"
            />
          </div>

          {/* 新しいタブで開くオプション */}
          <div className="flex items-center gap-2">
            <input
              id="open-new-tab"
              type="checkbox"
              checked={openInNewTab}
              onChange={e => setOpenInNewTab(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="open-new-tab"
              className="text-xs text-gray-700 flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="h-3 w-3" />
              新しいタブで開く
            </label>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
          <div>
            {isEditMode && onRemoveLink && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemoveLink}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                リンクを解除
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              size="sm"
              onClick={handleSetLink}
              disabled={!url.trim() || !!urlError}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="h-3 w-3 mr-1" />
              {isEditMode ? '更新' : '追加'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
