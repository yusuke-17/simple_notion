<script lang="ts">
  import Button from "./button.svelte";
  import { Palette, Type } from "lucide-svelte";
  import { COLOR_OPTIONS, HIGHLIGHT_OPTIONS } from "$lib/utils/colorOptions";
  import type { ColorOption } from "$lib/utils/colorOptions";

  /**
   * ColorPaletteコンポーネントのProps型定義
   */
  let {
    type,
    currentColor = "",
    onColorSelect,
    onClose,
    class: className = "",
  }: {
    /** カラーパレットのタイプ */
    type: "text" | "highlight";
    /** 現在選択されている色の値 */
    currentColor?: string;
    /** 色が選択されたときのコールバック */
    onColorSelect: (color: string) => void;
    /** パレットを閉じるときのコールバック */
    onClose: () => void;
    /** カスタムクラス名 */
    class?: string;
  } = $props();

  /**
   * アクティブなタブの状態管理
   */
  let activeTab = $state<"text" | "highlight">(type);

  /**
   * 現在のタブに応じたカラーオプションを取得
   */
  let colorOptions = $derived(
    activeTab === "text" ? COLOR_OPTIONS : HIGHLIGHT_OPTIONS
  );

  /**
   * 色選択時の処理
   */
  function handleColorSelect(colorValue: string) {
    onColorSelect(colorValue);
    onClose();
  }
</script>

<div
  class="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[240px] z-50 {className}"
  data-color-palette
  role="dialog"
  tabindex="-1"
  onclick={(e) => e.stopPropagation()}
  onkeydown={(e) => {
    if (e.key === "Escape") {
      onClose();
    }
  }}
>
  <!-- タブヘッダー -->
  <div class="flex mb-3 bg-gray-100 rounded-md p-1">
    <Button
      size="sm"
      variant={activeTab === "text" ? "default" : "ghost"}
      onclick={() => (activeTab = "text")}
      class="flex-1 h-7 text-xs"
    >
      <Type class="h-3 w-3 mr-1" />
      テキスト色
    </Button>
    <Button
      size="sm"
      variant={activeTab === "highlight" ? "default" : "ghost"}
      onclick={() => (activeTab = "highlight")}
      class="flex-1 h-7 text-xs"
    >
      <Palette class="h-3 w-3 mr-1" />
      背景色
    </Button>
  </div>

  <!-- カラーグリッド -->
  <div class="grid grid-cols-5 gap-1">
    {#each colorOptions as option}
      <button
        type="button"
        class="w-8 h-8 rounded-md border-2 transition-all duration-150 hover:scale-110 hover:shadow-md
          {currentColor === option.value
          ? 'border-blue-500 shadow-md'
          : 'border-gray-200 hover:border-gray-300'}
          {option.isDefault ? 'relative' : ''}"
        style="background-color: {option.backgroundColor ||
          '#ffffff'}; color: {option.textColor};"
        onclick={() => handleColorSelect(option.value)}
        title={option.name}
      >
        <!-- すべての色に「A」サンプルテキストを表示 -->
        <span class="text-xs font-medium">A</span>
      </button>
    {/each}
  </div>

  <!-- フッター情報 -->
  <div class="mt-3 pt-2 border-t border-gray-100">
    <p class="text-xs text-gray-500 text-center">
      {activeTab === "text" ? "テキストの色を変更" : "テキストの背景色を変更"}
    </p>
  </div>
</div>
