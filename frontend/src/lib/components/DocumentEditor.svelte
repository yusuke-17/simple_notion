<script lang="ts">
  import { untrack } from 'svelte'
  import { dndzone } from 'svelte-dnd-action'
  import Input from '$lib/components/ui/input.svelte'
  import BlockEditor from '$lib/components/BlockEditor.svelte'
  import type { Block, Document as DocumentType } from '$lib/types'

  // Props
  let { documentId = $bindable<number>() } = $props()

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

  // State
  let document = $state<DocumentType | null>(null)
  let title = $state('')
  let blocks = $state<Block[]>([])
  let isLoading = $state(true)
  let error = $state<string | null>(null)
  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  let lastLoadedDocumentId: number | null = null

  /**
   * ドキュメントを読み込み
   */
  async function loadDocument(docId: number) {
    isLoading = true
    error = null

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to load document')
      }

      const doc = await response.json()
      document = doc
      title = doc.title
      blocks = doc.blocks
        ? doc.blocks.sort((a: Block, b: Block) => a.position - b.position)
        : []

      // 初期ブロックがない場合は作成
      if (blocks.length === 0) {
        blocks = [
          {
            id: Date.now(),
            type: 'text',
            content: '',
            documentId: docId,
            position: 0,
            createdAt: new Date().toISOString(),
          },
        ]
      }

      lastLoadedDocumentId = docId
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load document'
      console.error('Failed to load document:', err)
    } finally {
      isLoading = false
    }
  }

  // documentIdの変更を監視してドキュメントを再読み込み
  $effect(() => {
    const currentDocId = documentId

    untrack(() => {
      if (currentDocId && currentDocId !== lastLoadedDocumentId) {
        // 前のドキュメントの自動保存タイマーをクリア
        if (saveTimeout) {
          clearTimeout(saveTimeout)
          saveTimeout = null
        }
        loadDocument(currentDocId)
      }
    })
  })

  /**
   * タイトル更新
   */
  function updateTitle(newTitle: string) {
    title = newTitle
    scheduleAutoSave()
  }

  /**
   * ブロック更新
   */
  function handleBlockUpdate(id: number, content: string, type?: string) {
    blocks = blocks.map((block) =>
      block.id === id ? { ...block, content, ...(type ? { type } : {}) } : block
    )
    scheduleAutoSave()
  }

  /**
   * ブロック削除
   */
  function handleBlockDelete(id: number) {
    blocks = blocks.filter((block) => block.id !== id)
    // 位置を再計算
    blocks = blocks.map((block, index) => ({ ...block, position: index }))
    scheduleAutoSave()
  }

  /**
   * ブロック追加
   */
  function handleAddBlock(afterBlockId: number, type: string) {
    const afterIndex = blocks.findIndex((block) => block.id === afterBlockId)
    const newBlock: Block = {
      id: Date.now(),
      type,
      content: '',
      documentId,
      position: afterIndex + 1,
      createdAt: new Date().toISOString(),
    }

    // 新しいブロックを追加し、位置を再計算
    blocks = [
      ...blocks.slice(0, afterIndex + 1),
      newBlock,
      ...blocks.slice(afterIndex + 1),
    ].map((block, index) => ({ ...block, position: index }))

    scheduleAutoSave()
  }

  /**
   * 自動保存をスケジュール
   */
  function scheduleAutoSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(() => {
      saveDocument()
    }, 1000)
  }

  /**
   * ドキュメント保存
   */
  async function saveDocument() {
    if (!document) return

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/${documentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title,
            blocks: blocks.map((block) => ({
              id: block.id,
              type: block.type,
              content: block.content,
              position: block.position,
            })),
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to save document')
      }

      console.log('Document saved successfully')
    } catch (err) {
      console.error('Failed to save document:', err)
    }
  }

  /**
   * フォーカス処理（プレースホルダー）
   */
  function handleBlockFocus(_id: number) {
    // 将来的なフォーカス管理用
  }

  /**
   * ドラッグ&ドロップ - consider段階（ドラッグ中）
   */
  function handleDndConsider(
    e: CustomEvent<{ items: Block[]; info: { trigger: string } }>
  ) {
    blocks = e.detail.items
  }

  /**
   * ドラッグ&ドロップ - finalize段階（ドロップ完了）
   */
  function handleDndFinalize(
    e: CustomEvent<{ items: Block[]; info: { trigger: string } }>
  ) {
    blocks = e.detail.items.map((block, index) => ({
      ...block,
      position: index,
    }))
    scheduleAutoSave()
  }
</script>

{#if isLoading}
  <div class="flex items-center justify-center h-full">
    <div class="text-gray-500">Loading...</div>
  </div>
{:else if error}
  <div class="flex items-center justify-center h-full">
    <div class="text-red-500">Error: {error}</div>
  </div>
{:else if !document}
  <div class="flex items-center justify-center h-full">
    <div class="text-gray-500">Document not found</div>
  </div>
{:else}
  <div class="flex flex-col h-full">
    <!-- ヘッダー -->
    <div class="border-b border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <Input
          value={title}
          oninput={(e: Event) =>
            updateTitle((e.target as HTMLInputElement).value)}
          placeholder="Untitled"
          class="text-2xl font-bold border-none p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          data-testid="document-title-input"
        />
      </div>
    </div>

    <!-- エディター -->
    <div class="flex-1 p-4 pl-20">
      <div
        class="max-w-4xl"
        use:dndzone={{
          items: blocks,
          flipDurationMs: 200,
          dropTargetStyle: {},
          dragDisabled: false,
        }}
        onconsider={handleDndConsider}
        onfinalize={handleDndFinalize}
      >
        {#each blocks as block (block.id)}
          <BlockEditor
            {block}
            onUpdate={handleBlockUpdate}
            onDelete={handleBlockDelete}
            onAddBlock={handleAddBlock}
            onFocus={handleBlockFocus}
          />
        {/each}
      </div>
    </div>
  </div>
{/if}
