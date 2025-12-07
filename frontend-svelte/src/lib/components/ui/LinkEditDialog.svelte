<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import { X, Link as LinkIcon, ExternalLink, Check } from "lucide-svelte";
  import { isValidUrl, normalizeUrl } from "$lib/utils/editorUtils";

  /**
   * LinkEditDialogコンポーネントのProps型定義
   */
  let {
    initialUrl = "",
    initialText = "",
    position,
    onSetLink,
    onRemoveLink,
    onClose,
  }: {
    /** 現在のリンクURL（編集モードの場合） */
    initialUrl?: string;
    /** 現在のリンクテキスト（編集モードの場合） */
    initialText?: string;
    /** ダイアログの表示位置 */
    position: { top: number; left: number };
    /** リンク設定時のコールバック */
    onSetLink: (url: string, text: string, openInNewTab: boolean) => void;
    /** リンク解除時のコールバック */
    onRemoveLink?: () => void;
    /** ダイアログを閉じる際のコールバック */
    onClose: () => void;
  } = $props();

  /**
   * URL入力の状態管理
   */
  let url = $state(initialUrl);

  /**
   * テキスト入力の状態管理
   */
  let text = $state(initialText);

  /**
   * 新しいタブで開くかどうかの状態管理
   */
  let openInNewTab = $state(true);

  /**
   * URLエラーメッセージの状態管理
   */
  let urlError = $state("");

  /**
   * 編集モードかどうかを判定
   */
  let isEditMode = $derived(!!initialUrl);

  /**
   * 初期値が変更された場合に更新
   */
  $effect(() => {
    url = initialUrl;
    text = initialText;
  });

  /**
   * URL入力時のバリデーション
   */
  function handleUrlChange(value: string) {
    url = value;
    if (value && !isValidUrl(value)) {
      urlError = "有効なURLを入力してください";
    } else {
      urlError = "";
    }
  }

  /**
   * リンク設定処理
   */
  function handleSetLink() {
    if (!url.trim()) {
      urlError = "URLを入力してください";
      return;
    }

    if (!isValidUrl(url)) {
      urlError = "有効なURLを入力してください";
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    onSetLink(normalizedUrl, text.trim(), openInNewTab);
    onClose();
  }

  /**
   * リンク解除処理
   */
  function handleRemoveLink() {
    onRemoveLink?.();
    onClose();
  }

  /**
   * Enterキーでリンク設定、Escapeキーでダイアログを閉じる
   */
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSetLink();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }
</script>

<!-- 背景オーバーレイ -->
<div
  class="fixed inset-0 z-40 bg-black/20"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      onClose();
    }
  }}
  aria-label="ダイアログを閉じる"
></div>

<!-- ダイアログ本体 -->
<div
  class="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[400px]"
  style="top: {position.top}px; left: {position.left}px;"
  data-link-dialog
>
  <!-- ヘッダー -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-2">
      <LinkIcon class="h-4 w-4 text-blue-600" />
      <h3 class="text-sm font-semibold text-gray-900">
        {isEditMode ? "リンクを編集" : "リンクを追加"}
      </h3>
    </div>
    <Button
      size="sm"
      variant="ghost"
      onclick={onClose}
      class="h-6 w-6 p-0"
      aria-label="閉じる"
    >
      <X class="h-4 w-4" />
    </Button>
  </div>

  <!-- URL入力 -->
  <div class="space-y-3">
    <div>
      <label
        for="link-url"
        class="block text-xs font-medium text-gray-700 mb-1"
      >
        URL
      </label>
      <Input
        id="link-url"
        type="text"
        value={url}
        oninput={(e: Event) =>
          handleUrlChange((e.currentTarget as HTMLInputElement).value)}
        onkeydown={handleKeyDown}
        placeholder="https://example.com"
        class="w-full {urlError ? 'border-red-500' : ''}"
      />
      {#if urlError}
        <p class="text-xs text-red-600 mt-1">{urlError}</p>
      {/if}
    </div>

    <!-- テキスト入力（オプション） -->
    <div>
      <label
        for="link-text"
        class="block text-xs font-medium text-gray-700 mb-1"
      >
        表示テキスト（オプション）
      </label>
      <Input
        id="link-text"
        type="text"
        value={text}
        oninput={(e: Event) =>
          (text = (e.currentTarget as HTMLInputElement).value)}
        onkeydown={handleKeyDown}
        placeholder="リンクのテキスト"
        class="w-full"
      />
    </div>

    <!-- 新しいタブで開くオプション -->
    <div class="flex items-center gap-2">
      <input
        id="open-new-tab"
        type="checkbox"
        bind:checked={openInNewTab}
        class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <label
        for="open-new-tab"
        class="text-xs text-gray-700 flex items-center gap-1 cursor-pointer"
      >
        <ExternalLink class="h-3 w-3" />
        新しいタブで開く
      </label>
    </div>
  </div>

  <!-- アクションボタン -->
  <div
    class="flex items-center justify-between mt-4 pt-3 border-t border-gray-200"
  >
    <div>
      {#if isEditMode && onRemoveLink}
        <Button
          size="sm"
          variant="ghost"
          onclick={handleRemoveLink}
          class="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          リンクを解除
        </Button>
      {/if}
    </div>
    <div class="flex gap-2">
      <Button size="sm" variant="ghost" onclick={onClose}>キャンセル</Button>
      <Button
        size="sm"
        onclick={handleSetLink}
        disabled={!url.trim() || !!urlError}
        class="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Check class="h-3 w-3 mr-1" />
        {isEditMode ? "更新" : "追加"}
      </Button>
    </div>
  </div>
</div>
