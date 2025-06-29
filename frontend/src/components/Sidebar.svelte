<script lang="ts">
  import { onMount } from 'svelte';
  import DocumentTree from './DocumentTree.svelte';
  import { authStore } from '../stores/auth';
  
  let { currentDocumentId = $bindable() }: { currentDocumentId: number | null } = $props();
  
  let showingTrash = $state(false);
  let trashedDocuments = $state<any[]>([]);
  
  async function loadTrashedDocuments() {
    try {
      const response = await fetch('/api/documents?deleted=true', {
        credentials: 'include'
      });
      if (response.ok) {
        trashedDocuments = await response.json();
      }
    } catch (error) {
      console.error('Failed to load trashed documents:', error);
    }
  }
  
  async function restoreDocument(docId: number) {
    try {
      await fetch(`/api/documents/${docId}/restore`, {
        method: 'PUT',
        credentials: 'include'
      });
      await loadTrashedDocuments();
    } catch (error) {
      console.error('Failed to restore document:', error);
    }
  }
  
  async function permanentDelete(docId: number) {
    if (!confirm('Permanently delete this document? This cannot be undone.')) return;
    
    try {
      await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      await loadTrashedDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  }

  async function createDocument() {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: 'Untitled'
        })
      });
      
      if (response.ok) {
        // DocumentTreeが自動的に更新されるようにイベントを発火
        window.dispatchEvent(new CustomEvent('document-created'));
      }
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  }
</script>

<div class="h-full bg-gray-50 border-r border-gray-200 flex flex-col">
  <!-- ユーザー情報 -->
  <div class="p-4 border-b border-gray-200">
    <div class="flex items-center">
      <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
        {$authStore.user?.name?.[0]?.toUpperCase() || 'U'}
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium text-gray-900">{$authStore.user?.name}</p>
        <p class="text-xs text-gray-500">{$authStore.user?.email}</p>
      </div>
    </div>
  </div>

  <!-- ドキュメント管理ヘッダー -->
  <div class="flex items-center justify-between p-4 border-b border-gray-200">
    <h2 class="text-lg font-semibold text-gray-800">Documents</h2>
    <button 
      onclick={createDocument}
      class="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
      </svg>
    </button>
  </div>
  
  <!-- ナビゲーション -->
  <div class="flex-1 overflow-y-auto p-4">
    {#if !showingTrash}
      <DocumentTree bind:currentDocumentId />
    {:else}
      <div>
        <h3 class="text-sm font-medium text-gray-900 mb-3">Trash</h3>
        {#if trashedDocuments.length === 0}
          <p class="text-sm text-gray-500">No documents in trash</p>
        {:else}
          <div class="space-y-2">
            {#each trashedDocuments as doc}
              <div class="flex items-center justify-between p-2 bg-white rounded border">
                <div class="flex-1 truncate">
                  <p class="text-sm text-gray-900">{doc.title}</p>
                  <p class="text-xs text-gray-500">
                    Deleted {new Date(doc.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div class="flex space-x-1">
                  <button 
                    onclick={() => restoreDocument(doc.id)}
                    class="p-1 text-green-600 hover:text-green-800"
                    title="Restore"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                    </svg>
                  </button>
                  <button 
                    onclick={() => permanentDelete(doc.id)}
                    class="p-1 text-red-600 hover:text-red-800"
                    title="Delete permanently"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- フッター -->
  <div class="p-4 border-t border-gray-200">
    <button 
      onclick={() => {
        showingTrash = !showingTrash;
        if (showingTrash) loadTrashedDocuments();
      }}
      class="flex items-center w-full p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
    >
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
      {showingTrash ? 'Back to Documents' : 'Trash'}
    </button>
  </div>
</div>
