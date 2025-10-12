import { Button } from './button'
import { Palette, Type } from 'lucide-react'
import { useState } from 'react'
import { COLOR_OPTIONS, HIGHLIGHT_OPTIONS } from '@/utils/colorOptions'

export interface ColorOption {
  name: string
  textColor: string
  backgroundColor?: string
  value: string
  isDefault?: boolean
}

export interface ColorPaletteProps {
  /**
   * カラーパレットのタイプ
   */
  type: 'text' | 'highlight'
  /**
   * 現在選択されている色の値
   */
  currentColor?: string
  /**
   * 色が選択されたときのコールバック
   */
  onColorSelect: (color: string) => void
  /**
   * パレットを閉じるときのコールバック
   */
  onClose: () => void
  /**
   * カスタムクラス名
   */
  className?: string
}

/**
 * Notion風のカラーパレットコンポーネント
 * テキスト色と背景色の両方をサポート
 */
export function ColorPalette({
  type,
  currentColor = '',
  onColorSelect,
  onClose,
  className = '',
}: ColorPaletteProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'highlight'>(type)

  const colorOptions = activeTab === 'text' ? COLOR_OPTIONS : HIGHLIGHT_OPTIONS

  const handleColorSelect = (colorValue: string) => {
    onColorSelect(colorValue)
    onClose()
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[240px] z-50 ${className}`}
      data-color-palette
      onClick={e => e.stopPropagation()} // パレット内のクリックで閉じないようにする
    >
      {/* タブヘッダー */}
      <div className="flex mb-3 bg-gray-100 rounded-md p-1">
        <Button
          size="sm"
          variant={activeTab === 'text' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('text')}
          className="flex-1 h-7 text-xs"
        >
          <Type className="h-3 w-3 mr-1" />
          テキスト色
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'highlight' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('highlight')}
          className="flex-1 h-7 text-xs"
        >
          <Palette className="h-3 w-3 mr-1" />
          背景色
        </Button>
      </div>

      {/* カラーグリッド */}
      <div className="grid grid-cols-5 gap-1">
        {colorOptions.map(option => (
          <button
            key={option.name}
            type="button"
            className={`
              w-8 h-8 rounded-md border-2 transition-all duration-150 
              hover:scale-110 hover:shadow-md
              ${
                currentColor === option.value
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }
              ${option.isDefault ? 'relative' : ''}
            `}
            style={{
              backgroundColor: option.backgroundColor || '#ffffff',
              color: option.textColor,
            }}
            onClick={() => handleColorSelect(option.value)}
            title={option.name}
          >
            {option.isDefault ? (
              // デフォルト色は「A」を表示
              <span className="text-xs font-medium">A</span>
            ) : (
              // その他の色は「A」サンプルテキストを表示
              <span className="text-xs font-medium">A</span>
            )}
          </button>
        ))}
      </div>

      {/* フッター情報 */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          {activeTab === 'text'
            ? 'テキストの色を変更'
            : 'テキストの背景色を変更'}
        </p>
      </div>
    </div>
  )
}

/**
 * カラーパレットのトリガーボタン
 */
export interface ColorPaletteTriggerProps {
  /**
   * カラーパレットのタイプ
   */
  type: 'text' | 'highlight'
  /**
   * 現在選択されている色
   */
  currentColor?: string
  /**
   * アクティブ状態かどうか
   */
  isActive?: boolean
  /**
   * クリック時のコールバック
   */
  onClick: () => void
  /**
   * カスタムクラス名
   */
  className?: string
}

export function ColorPaletteTrigger({
  type,
  currentColor,
  isActive = false,
  onClick,
  className = '',
}: ColorPaletteTriggerProps) {
  const Icon = type === 'text' ? Type : Palette
  const title = type === 'text' ? 'テキスト色' : '背景色'

  return (
    <Button
      size="sm"
      variant={isActive ? 'default' : 'ghost'}
      onClick={onClick}
      className={`h-6 w-6 p-1 relative ${className}`}
      title={title}
    >
      <Icon className="h-3 w-3" />
      {/* 現在の色を示すインジケーター */}
      {currentColor && (
        <div
          className="absolute bottom-0 right-0 w-2 h-2 rounded-sm border border-white"
          style={{
            backgroundColor: currentColor,
          }}
        />
      )}
    </Button>
  )
}
