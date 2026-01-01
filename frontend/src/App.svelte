<script lang="ts">
  import { onMount } from 'svelte'
  import './app.css'
  import Login from '$lib/components/Login.svelte'
  import Sidebar from '$lib/components/Sidebar.svelte'
  import DocumentEditor from '$lib/components/DocumentEditor.svelte'
  import ReadOnlyDocumentViewer from '$lib/components/ReadOnlyDocumentViewer.svelte'
  import { authStore } from '$lib/stores/auth.svelte'

  // State
  let currentDocumentId = $state<number | null>(null)
  let showingSidebar = $state(true)
  let isReadOnly = $state(false)

  /**
   * ドキュメント選択処理を作成する関数
   */
  function createDocumentSelectHandler() {
    return (documentId: number, readOnly: boolean = false) => {
      currentDocumentId = documentId
      isReadOnly = readOnly
    }
  }

  /**
   * ドキュメント削除処理を作成する関数
   */
  function createDocumentDeleteHandler() {
    return (documentId: number) => {
      if (currentDocumentId === documentId) {
        currentDocumentId = null
      }
    }
  }

  let handleDocumentSelect = $state(createDocumentSelectHandler())
  let handleDocumentDelete = $state(createDocumentDeleteHandler())

  /**
   * サイドバー切り替え
   */
  function toggleSidebar() {
    showingSidebar = !showingSidebar
  }

  /**
   * ログアウト処理
   */
  async function handleLogout() {
    await authStore.logout()
  }

  // 初期化時に認証状態をチェック
  onMount(() => {
    authStore.checkAuth()
  })
</script>

<div class="h-screen w-screen overflow-hidden">
  {#if !authStore.user}
    <!-- ログイン画面 -->
    <Login />
  {:else}
    <!-- メインアプリケーション -->
    <div class="flex h-full">
      <!-- サイドバー -->
      <Sidebar
        bind:currentDocumentId
        bind:onDocumentSelect={handleDocumentSelect}
        bind:onDocumentDelete={handleDocumentDelete}
        bind:showingSidebar
      />

      <!-- メインコンテンツ -->
      <div class="flex-1 flex flex-col">
        <!-- ヘッダー -->
        <div
          class="border-b border-gray-200 p-4 flex items-center justify-between"
        >
          <div class="flex items-center space-x-4">
            <button
              onclick={toggleSidebar}
              class="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title={showingSidebar ? 'サイドバーを隠す' : 'サイドバーを表示'}
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 class="text-lg font-semibold">Simple Notion</h1>
            {#if isReadOnly}
              <span class="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                読み取り専用
              </span>
            {/if}
          </div>

          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">
              {authStore.user.name}
            </span>
            <button
              onclick={handleLogout}
              class="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>

        <!-- ドキュメントエディター -->
        <div class="flex-1 overflow-auto">
          {#if currentDocumentId}
            {#if isReadOnly}
              <ReadOnlyDocumentViewer documentId={currentDocumentId} />
            {:else}
              <DocumentEditor documentId={currentDocumentId} />
            {/if}
          {:else}
            <div class="flex items-center justify-center h-full">
              <div class="text-center">
                <p class="text-gray-600 mb-2">ドキュメントを選択してください</p>
                <p class="text-sm text-gray-500">
                  左のサイドバーからドキュメントを選択するか、新しいドキュメントを作成してください
                </p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
