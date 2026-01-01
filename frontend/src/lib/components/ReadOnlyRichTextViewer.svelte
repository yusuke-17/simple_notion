<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Editor } from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import { Color } from '@tiptap/extension-color'
  import { Highlight } from '@tiptap/extension-highlight'
  import { TextStyle } from '@tiptap/extension-text-style'

  /**
   * 読み取り専用リッチテキストビューアーコンポーネント
   * TipTapエディターを読み取り専用モードで使用してJSONコンテンツを表示
   */

  // Props
  let { content = '' }: { content?: string } = $props()

  // State
  let editorElement: HTMLDivElement | null = $state(null)
  let editor: Editor | null = $state(null)

  /**
   * JSONコンテンツのパース処理
   * 文字列、オブジェクト、空の値をすべて処理可能
   */
  function parseContent(
    contentValue: string | Record<string, unknown>
  ): Record<string, unknown> | string | null {
    // 空の場合
    const isEmpty =
      !contentValue ||
      contentValue === '' ||
      contentValue === '{}' ||
      (typeof contentValue === 'object' &&
        Object.keys(contentValue).length === 0)

    if (isEmpty) {
      return null
    }

    // すでにオブジェクトの場合はそのまま返す
    if (typeof contentValue === 'object') {
      return contentValue
    }

    // 文字列の場合はJSONパースを試みる
    try {
      const parsed = JSON.parse(contentValue)
      return parsed
    } catch {
      // JSONパースに失敗した場合はプレーンテキストとして返す
      return contentValue
    }
  }

  /**
   * エディター初期化
   */
  onMount(() => {
    if (!editorElement) return

    const parsedContent = parseContent(content)
    const isEmpty = parsedContent === null
    const isValidJson =
      parsedContent !== null && typeof parsedContent === 'object'

    editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit,
        TextStyle,
        Color,
        Highlight.configure({
          multicolor: true,
        }),
      ],
      content: isValidJson ? parsedContent : parsedContent || '',
      editable: false,
      editorProps: {
        attributes: {
          class:
            'prose prose-sm sm:prose-base max-w-none text-gray-800 leading-relaxed cursor-text outline-none',
        },
      },
    })
  })

  onDestroy(() => {
    if (editor) {
      editor.destroy()
    }
  })

  // コンテンツが変更された場合の処理
  $effect(() => {
    if (!editor) return

    const parsedContent = parseContent(content)
    const isValidJson =
      parsedContent !== null && typeof parsedContent === 'object'

    try {
      editor.commands.setContent(
        isValidJson ? parsedContent : parsedContent || '',
        { emitUpdate: false }
      )
    } catch (error) {
      console.debug('ReadOnlyRichTextViewer content update error:', error)
    }
  })

  // コンテンツの状態を計算
  const contentState = $derived.by(() => {
    const parsed = parseContent(content)
    const isEmpty = parsed === null
    const isValidJson = parsed !== null && typeof parsed === 'object'
    return { parsed, isEmpty, isValidJson }
  })
</script>

<!-- 空の場合 -->
{#if contentState.isEmpty}
  <div class="text-gray-400 italic py-2">Empty block</div>
  <!-- プレーンテキストの場合 -->
{:else if !contentState.isValidJson}
  <div class="whitespace-pre-wrap break-words py-2 text-gray-800">
    {contentState.parsed}
  </div>
  <!-- リッチテキスト（JSON）の場合 -->
{:else}
  <div bind:this={editorElement} class="py-2"></div>
{/if}
