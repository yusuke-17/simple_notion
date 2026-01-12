<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '$lib/components/ui/button.svelte'
  import { Plus, Trash2, X, FileText } from 'lucide-svelte'
  import type { Document } from '$lib/types'

  // Props
  let {
    currentDocumentId = $bindable<number | null>(null),
    onDocumentSelect = $bindable<
      (documentId: number, isReadOnly?: boolean) => void
    >(() => {}),
    onDocumentDelete = $bindable<(documentId: number) => void>(() => {}),
    showingSidebar = $bindable(true),
  } = $props()

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

  // State
  let documents = $state<Document[]>([])
  let trashedDocuments = $state<Document[]>([])
  let showingTrash = $state(false)
  let hoveredDocId = $state<number | null>(null)

  /**
   * ドキュメント一覧を読み込み
   */
  async function loadDocuments() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to load documents')
      }

      const data = await response.json()
      documents = Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Failed to load documents:', error)
      documents = []
    }
  }

  /**
   * ゴミ箱のドキュメント一覧を読み込み
   */
  async function loadTrashedDocuments() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents?deleted=true`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to load trashed documents')
      }

      const data = await response.json()
      trashedDocuments = Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Failed to load trashed documents:', error)
      trashedDocuments = []
    }
  }

  /**
   * 新規ドキュメント作成
   */
  async function createDocument() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled', content: '' }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to create document')
      }

      const newDoc = await response.json()
      documents = [...documents, newDoc]
      onDocumentSelect(newDoc.id)
    } catch (error) {
      console.error('Failed to create document:', error)
    }
  }

  /**
   * ドキュメント削除（ゴミ箱に移動）
   */
  async function deleteDocument(docId: number, event: MouseEvent) {
    event.stopPropagation()

    if (!confirm('Move this document to trash?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      await loadDocuments()
      onDocumentDelete(docId)
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  /**
   * ドキュメント復元
   */
  async function restoreDocument(docId: number) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/${docId}/restore`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to restore document')
      }

      await Promise.all([loadTrashedDocuments(), loadDocuments()])
    } catch (error) {
      console.error('Failed to restore document:', error)
    }
  }

  /**
   * ドキュメント完全削除
   */
  async function permanentDelete(docId: number) {
    if (!confirm('Permanently delete this document? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/${docId}/permanent`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to permanently delete document')
      }

      await loadTrashedDocuments()
    } catch (error) {
      console.error('Failed to permanently delete document:', error)
    }
  }

  /**
   * ゴミ箱表示切り替え
   */
  function toggleTrash() {
    showingTrash = !showingTrash
    if (showingTrash) {
      loadTrashedDocuments()
    }
  }

  /**
   * ドキュメント選択処理
   */
  function handleDocumentSelect(docId: number) {
    if (showingTrash) {
      // ゴミ箱内のドキュメントは読み取り専用モードで選択
      onDocumentSelect(docId, true)
    } else {
      // 通常のドキュメントは編集可能モードで選択
      onDocumentSelect(docId, false)
    }
  }

  // 初期ロード
  onMount(() => {
    loadDocuments()
  })
</script>

<div
  class={`${
    showingSidebar ? 'w-80' : 'w-12'
  } bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-200 h-full`}
>
  <!-- Header -->
  <div class="flex items-center justify-start p-4 border-b border-gray-200">
    {#if showingSidebar}
      <div class="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onclick={createDocument}
          class="h-8 w-8 p-0"
          title="新しいドキュメント"
          aria-label="新しいドキュメント"
        >
          <Plus class="h-4 w-4" />
        </Button>
        <Button
          variant={showingTrash ? 'default' : 'ghost'}
          size="sm"
          onclick={toggleTrash}
          class="h-8 w-8 p-0"
          title={showingTrash ? 'ドキュメント一覧' : 'ゴミ箱'}
          aria-label={showingTrash ? 'ドキュメント一覧' : 'ゴミ箱'}
        >
          {#if showingTrash}
            <FileText class="h-4 w-4" />
          {:else}
            <Trash2 class="h-4 w-4" />
          {/if}
        </Button>
      </div>
    {/if}
  </div>

  <!-- Content -->
  {#if showingSidebar}
    <div class="flex-1 overflow-y-auto p-2">
      {#if showingTrash}
        <!-- Trash view -->
        <div class="space-y-1">
          <h3 class="px-2 py-1 text-sm font-medium text-gray-600">ゴミ箱</h3>
          {#if trashedDocuments.length === 0}
            <p class="px-2 py-1 text-sm text-gray-500">ゴミ箱は空です</p>
          {:else}
            {#each trashedDocuments as doc (doc.id)}
              <button
                type="button"
                class={`group flex items-center justify-between px-2 py-1 text-sm rounded cursor-pointer w-full text-left ${
                  currentDocumentId === doc.id
                    ? 'bg-red-100 text-red-900'
                    : 'hover:bg-gray-200'
                }`}
                onclick={() => handleDocumentSelect(doc.id)}
                onmouseenter={() => (hoveredDocId = doc.id)}
                onmouseleave={() => (hoveredDocId = null)}
              >
                <span class="truncate flex-1">{doc.title}</span>
                {#if hoveredDocId === doc.id}
                  <span class="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={(e: MouseEvent) => {
                        e.stopPropagation()
                        restoreDocument(doc.id)
                      }}
                      class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      title="復元"
                      aria-label="復元"
                    >
                      <X class="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={(e: MouseEvent) => {
                        e.stopPropagation()
                        permanentDelete(doc.id)
                      }}
                      class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                      title="完全削除"
                      aria-label="削除"
                    >
                      <Trash2 class="h-3 w-3" />
                    </Button>
                  </span>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      {:else}
        <!-- Documents view -->
        <div class="space-y-1">
          <h3 class="px-2 py-1 text-sm font-medium text-gray-600">
            ドキュメント
          </h3>
          {#if documents.length === 0}
            <p class="px-2 py-1 text-sm text-gray-500">
              ドキュメントがありません
            </p>
          {:else}
            {#each documents as doc (doc.id)}
              <button
                type="button"
                class={`group flex items-center justify-between px-2 py-1 text-sm rounded cursor-pointer w-full text-left ${
                  currentDocumentId === doc.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-gray-200'
                }`}
                onclick={() => handleDocumentSelect(doc.id)}
                onmouseenter={() => (hoveredDocId = doc.id)}
                onmouseleave={() => (hoveredDocId = null)}
              >
                <span class="truncate flex-1">{doc.title}</span>
                {#if hoveredDocId === doc.id && currentDocumentId !== doc.id}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation()
                      deleteDocument(doc.id, e)
                    }}
                    class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    title="削除"
                  >
                    <Trash2 class="h-3 w-3" />
                  </Button>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
