/**
 * Rich Text Editor utilities - Pure functions for TipTap editor management
 */

/**
 * Normalize content to TipTap document format
 */
export const normalizeContent = (inputContent: string): object => {
  if (!inputContent || inputContent.trim() === '') {
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }

  if (inputContent.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(inputContent)
      if (parsed.type === 'doc') {
        return parsed
      }
    } catch {
      // Fall through to plain text handling
    }
  }

  // Convert plain text to TipTap format
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: inputContent,
          },
        ],
      },
    ],
  }
}

/**
 * Calculate selection coordinates for toolbar positioning
 */
export const getSelectionCoordinates = (editorElement: HTMLElement) => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const editorRect = editorElement.getBoundingClientRect()

  // ツールバーの幅（約150px）を考慮した位置計算
  const toolbarWidth = 150
  const selectionCenter = rect.left - editorRect.left + rect.width / 2

  // 左端で見切れないように調整
  let left = selectionCenter - toolbarWidth / 2
  if (left < 10) {
    left = 10 // 最小マージン
  }

  // 右端で見切れないように調整
  const maxLeft = editorRect.width - toolbarWidth - 10
  if (left > maxLeft) {
    left = maxLeft
  }

  return {
    top: rect.top - editorRect.top - 50, // Position above selection
    left: left,
  }
}

/**
 * Calculate context menu coordinates for right-click positioning
 */
export const getContextMenuCoordinates = (
  event: MouseEvent,
  editorElement: HTMLElement
) => {
  const editorRect = editorElement.getBoundingClientRect()

  const toolbarWidth = 150
  const toolbarHeight = 50

  // Calculate position relative to editor
  let left = event.clientX - editorRect.left
  let top = event.clientY - editorRect.top

  // Prevent menu from going off-screen
  if (left + toolbarWidth > editorRect.width) {
    left = editorRect.width - toolbarWidth - 10
  }
  if (left < 10) {
    left = 10
  }
  if (top + toolbarHeight > editorRect.height) {
    top = top - toolbarHeight - 10
  }
  if (top < 10) {
    top = 10
  }

  return { top, left }
}

/**
 * Check if selection has text
 */
export const hasSelection = (): boolean => {
  const selection = window.getSelection()
  return !!(
    selection &&
    !selection.isCollapsed &&
    selection.toString().trim().length > 0
  )
}

/**
 * Check if content is synchronized
 */
export const isContentSynchronized = (
  currentContent: string,
  incomingContent: string,
  lastContent: string
): boolean => {
  return incomingContent === lastContent || incomingContent === currentContent
}

/**
 * Default toolbar position
 */
export const DEFAULT_TOOLBAR_POSITION = { top: 0, left: 0 }

/**
 * Toolbar configuration
 */
export const TOOLBAR_CONFIG = {
  WIDTH: 150,
  HEIGHT: 50,
  SELECTION_DEBOUNCE: 50,
  BLUR_TIMEOUT: 100,
  CONTENT_SYNC_DELAY: 50,
} as const
