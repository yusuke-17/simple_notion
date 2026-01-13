<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Editor } from '@tiptap/core'
  import { Document } from '@tiptap/extension-document'
  import { Paragraph } from '@tiptap/extension-paragraph'
  import { Text } from '@tiptap/extension-text'
  import { Bold } from '@tiptap/extension-bold'
  import { Italic } from '@tiptap/extension-italic'
  import { Strike } from '@tiptap/extension-strike'
  import { Underline } from '@tiptap/extension-underline'
  import { Color } from '@tiptap/extension-color'
  import { Highlight } from '@tiptap/extension-highlight'
  import { TextStyle } from '@tiptap/extension-text-style'
  import { Link } from '@tiptap/extension-link'
  import { HardBreak } from '@tiptap/extension-hard-break'
  import { Dropcursor } from '@tiptap/extension-dropcursor'
  import { Gapcursor } from '@tiptap/extension-gapcursor'
  import { TableKit } from '@tiptap/extension-table'
  import FloatingToolbar from '$lib/components/FloatingToolbar.svelte'
  import TableFloatingMenu from '$lib/components/TableFloatingMenu.svelte'
  import {
    normalizeContent,
    getSelectionCoordinates,
    hasSelection,
  } from '$lib/utils/editorUtils'
  import {
    getTableMenuPosition,
    isTableActive,
    TABLE_MENU_CONFIG,
  } from '$lib/utils/tableUtils'

  // Props
  let {
    content = $bindable(''),
    placeholder = 'Start typing...',
    onUpdate = $bindable<(content: string) => void>(() => {}),
    onFocus = $bindable<() => void>(() => {}),
    onKeyDown = $bindable<
      ((event: KeyboardEvent) => boolean | void) | undefined
    >(undefined),
    class: className = '',
  } = $props()

  // State
  let editorElement: HTMLDivElement | null = $state(null)
  let editor: Editor | null = $state(null)
  let showToolbar = $state(false)
  let toolbarPosition = $state({ top: 0, left: 0 })
  let showTableMenu = $state(false)
  let tableMenuPosition = $state({ top: 0, left: 0 })
  let lastContent = $state('')
  let isUpdating = $state(false)

  /**
   * テキスト選択時のツールバー表示処理
   */
  function handleSelectionUpdate() {
    // テキスト選択時のツールバー
    if (hasSelection() && editorElement) {
      const coords = getSelectionCoordinates(editorElement)
      if (coords) {
        toolbarPosition = coords
        showToolbar = true
      }
    } else {
      showToolbar = false
    }

    // テーブルメニューの表示判定
    if (editor && editorElement && isTableActive(editor)) {
      const tableCoords = getTableMenuPosition(editorElement)
      if (tableCoords) {
        tableMenuPosition = tableCoords
        showTableMenu = true
      }
    } else {
      showTableMenu = false
    }
  }

  /**
   * エディター初期化
   */
  onMount(() => {
    if (!editorElement) return

    editor = new Editor({
      element: editorElement,
      extensions: [
        Document,
        Paragraph.configure({
          HTMLAttributes: {
            class: 'outline-none leading-normal my-1 min-h-[1.5rem]',
          },
        }),
        Text,
        TextStyle,
        Color.configure({
          types: ['textStyle'],
        }),
        Highlight.configure({
          multicolor: true,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class:
              'text-blue-600 underline decoration-blue-600 hover:text-blue-700 cursor-pointer',
            rel: 'noopener noreferrer',
          },
        }),
        Bold,
        Italic,
        Strike,
        HardBreak,
        Dropcursor,
        Gapcursor,
        Underline.configure({
          HTMLAttributes: {
            class:
              'underline decoration-2 underline-offset-2 decoration-blue-500',
          },
        }),
        TableKit.configure({
          tableCell: {
            HTMLAttributes: {
              class: 'border border-gray-300 px-3 py-2 min-w-[100px]',
            },
          },
          tableHeader: {
            HTMLAttributes: {
              class: 'border border-gray-400 bg-gray-100 px-3 py-2 font-semibold min-w-[100px]',
            },
          },
        }),
      ],
      content: normalizeContent(content || ''),
      autofocus: true,
      editable: true,
      onUpdate: ({ editor }: { editor: Editor }) => {
        if (isUpdating) return

        try {
          const json = editor.getJSON()
          const jsonString = JSON.stringify(json)

          if (jsonString !== lastContent) {
            lastContent = jsonString
            onUpdate(jsonString)
          }
        } catch (error) {
          console.debug('RichTextEditor update error:', error)
        }
      },
      onSelectionUpdate: () => {
        try {
          handleSelectionUpdate()
        } catch (error) {
          console.debug('RichTextEditor selection update error:', error)
        }
      },
      onFocus: () => {
        onFocus()
      },
      onBlur: () => {
        setTimeout(() => {
          showToolbar = false
        }, 100)
      },
      editorProps: {
        attributes: {
          class:
            'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[2rem] leading-normal',
          placeholder: placeholder,
          spellcheck: 'false',
        },
        handleKeyDown: (_view: any, event: KeyboardEvent) => {
          if (onKeyDown) {
            const result = onKeyDown(event)
            if (result === false) {
              return true
            }
          }
          return false
        },
      },
    })

    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  })

  /**
   * コンテンツ同期
   */
  $effect(() => {
    if (!editor || isUpdating) return

    const currentContent = JSON.stringify(editor.getJSON())
    const incomingContent = content || ''

    if (incomingContent === lastContent || incomingContent === currentContent) {
      return
    }

    if (editor.isFocused) {
      return
    }

    isUpdating = true
    try {
      const normalizedContent = normalizeContent(incomingContent)
      editor.commands.setContent(normalizedContent, { emitUpdate: false })
      lastContent = incomingContent
    } catch (error) {
      console.debug('Content sync error:', error)
    } finally {
      setTimeout(() => {
        isUpdating = false
      }, 50)
    }
  })

  /**
   * ツールバーアクション
   */
  function toggleBold() {
    editor?.chain().focus().toggleBold().run()
  }

  function toggleItalic() {
    editor?.chain().focus().toggleItalic().run()
  }

  function toggleUnderline() {
    editor?.chain().focus().toggleUnderline().run()
  }

  function toggleStrike() {
    editor?.chain().focus().toggleStrike().run()
  }

  function setTextColor(color: string) {
    if (color === '') {
      editor?.chain().focus().unsetColor().run()
    } else {
      editor?.chain().focus().setColor(color).run()
    }
  }

  function setHighlightColor(color: string) {
    if (color === '') {
      editor?.chain().focus().unsetHighlight().run()
    } else {
      editor?.chain().focus().setHighlight({ color }).run()
    }
  }

  function setLink(url: string) {
    if (url) {
      editor?.chain().focus().setLink({ href: url, target: '_blank' }).run()
    }
  }

  /**
   * テーブル操作関数
   */
  function insertTable() {
    editor
      ?.chain()
      .focus()
      .insertTable({
        rows: TABLE_MENU_CONFIG.DEFAULT_ROWS,
        cols: TABLE_MENU_CONFIG.DEFAULT_COLS,
        withHeaderRow: TABLE_MENU_CONFIG.WITH_HEADER_ROW,
      })
      .run()
  }

  function addRowBefore() {
    editor?.chain().focus().addRowBefore().run()
  }

  function addRowAfter() {
    editor?.chain().focus().addRowAfter().run()
  }

  function deleteRow() {
    editor?.chain().focus().deleteRow().run()
  }

  function addColumnBefore() {
    editor?.chain().focus().addColumnBefore().run()
  }

  function addColumnAfter() {
    editor?.chain().focus().addColumnAfter().run()
  }

  function deleteColumn() {
    editor?.chain().focus().deleteColumn().run()
  }

  function deleteTable() {
    editor?.chain().focus().deleteTable().run()
  }

  onDestroy(() => {
    if (editor) {
      editor.destroy()
    }
  })
</script>

<div class="relative">
  <!-- メインエディター -->
  <div bind:this={editorElement} class={`relative ${className}`}></div>

  <!-- フローティングツールバー -->
  {#if showToolbar}
    <FloatingToolbar
      position={toolbarPosition}
      {toggleBold}
      {toggleItalic}
      {toggleUnderline}
      {toggleStrike}
      {setTextColor}
      {setHighlightColor}
      {setLink}
      {insertTable}
    />
  {/if}

  <!-- テーブルフローティングメニュー -->
  {#if showTableMenu}
    <TableFloatingMenu
      position={tableMenuPosition}
      onAddRowBefore={addRowBefore}
      onAddRowAfter={addRowAfter}
      onDeleteRow={deleteRow}
      onAddColumnBefore={addColumnBefore}
      onAddColumnAfter={addColumnAfter}
      onDeleteColumn={deleteColumn}
      onDeleteTable={deleteTable}
    />
  {/if}
</div>
