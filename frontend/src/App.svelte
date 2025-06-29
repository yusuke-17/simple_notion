<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore, authService } from './stores/auth';
  import Login from './components/Login.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import DocumentEditor from './components/DocumentEditor.svelte';
  
  let currentDocumentId = $state<number | null>(null);
  let showingSidebar = $state(true);
  
  onMount(async () => {
    await authService.checkAuth();
    
    // ドキュメント選択イベントリスナー
    window.addEventListener('document-selected', (e: Event) => {
      const customEvent = e as CustomEvent;
      currentDocumentId = customEvent.detail.documentId;
    });
  });
</script>

{#if $authStore.user}
  <div class="flex h-screen bg-white">
    <!-- サイドバー -->
    {#if showingSidebar}
      <div class="w-64 flex-shrink-0">
        <Sidebar bind:currentDocumentId />
      </div>
    {/if}
    
    <!-- メインエディタエリア -->
    <div class="flex-1 flex flex-col">
      <!-- ヘッダー -->
      <header class="h-12 border-b border-gray-200 flex items-center px-4">
        <button 
          onclick={() => showingSidebar = !showingSidebar}
          class="p-2 hover:bg-gray-100 rounded-md mr-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        
        <div class="flex-1"></div>
        
        <button 
          onclick={() => authService.logout()}
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          Logout
        </button>
      </header>
      
      <!-- エディタ -->
      <main class="flex-1 overflow-hidden">
        {#if currentDocumentId}
          <DocumentEditor documentId={currentDocumentId} />
        {:else}
          <div class="flex items-center justify-center h-full text-gray-500">
            <div class="text-center">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-lg">Select a document to start editing</p>
            </div>
          </div>
        {/if}
      </main>
    </div>
  </div>
{:else}
  <Login />
{/if}
