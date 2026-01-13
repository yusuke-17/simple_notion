/**
 * Table utilities - Pure functions for table menu management
 */
import type { Editor } from '@tiptap/core'

/**
 * テーブルメニューの表示位置を計算
 * editorUtils.tsのgetSelectionCoordinates()と同じパターンを使用
 */
export const getTableMenuPosition = (
  editorElement: HTMLElement
): { top: number; left: number } | null => {
  // エディター内のテーブル要素を検索
  const tableElement = editorElement.querySelector('table')
  if (!tableElement) return null

  const tableRect = tableElement.getBoundingClientRect()
  const editorRect = editorElement.getBoundingClientRect()

  // メニューの幅を考慮した位置計算
  const menuWidth = 300
  const tableCenter = tableRect.left - editorRect.left + tableRect.width / 2

  // 左端で見切れないように調整
  let left = tableCenter - menuWidth / 2
  if (left < 10) {
    left = 10
  }

  // 右端で見切れないように調整
  const maxLeft = editorRect.width - menuWidth - 10
  if (left > maxLeft) {
    left = maxLeft
  }

  return {
    top: tableRect.top - editorRect.top - 60, // テーブルの上部に表示
    left: left,
  }
}

/**
 * テーブルがアクティブかどうかを判定
 */
export const isTableActive = (editor: Editor | null): boolean => {
  if (!editor) return false
  return editor.isActive('table')
}

/**
 * テーブルメニュー設定
 */
export const TABLE_MENU_CONFIG = {
  WIDTH: 300,
  HEIGHT: 50,
  DEFAULT_ROWS: 3,
  DEFAULT_COLS: 3,
  WITH_HEADER_ROW: true,
} as const
