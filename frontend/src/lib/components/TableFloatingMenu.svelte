<script lang="ts">
  import {
    ArrowUp,
    ArrowDown,
    Trash2,
    ArrowLeft,
    ArrowRight,
    Columns,
    Rows,
  } from 'lucide-svelte'
  import Button from '$lib/components/ui/button.svelte'

  // Props定義（Svelte 5 Runes）
  let {
    position,
    onAddRowBefore,
    onAddRowAfter,
    onDeleteRow,
    onAddColumnBefore,
    onAddColumnAfter,
    onDeleteColumn,
    onDeleteTable,
  }: {
    position: { top: number; left: number }
    onAddRowBefore: () => void
    onAddRowAfter: () => void
    onDeleteRow: () => void
    onAddColumnBefore: () => void
    onAddColumnAfter: () => void
    onDeleteColumn: () => void
    onDeleteTable: () => void
  } = $props()
</script>

<div
  class="absolute z-50 flex items-center gap-1 bg-gray-900 text-white rounded-lg shadow-lg p-1"
  style="top: {position.top}px; left: {position.left}px;"
>
  <!-- 行操作グループ -->
  <Button
    variant="ghost"
    size="sm"
    onclick={onAddRowBefore}
    class="text-white hover:bg-gray-700"
    aria-label="行を上に追加"
  >
    <ArrowUp class="h-4 w-4" />
  </Button>

  <Button
    variant="ghost"
    size="sm"
    onclick={onAddRowAfter}
    class="text-white hover:bg-gray-700"
    aria-label="行を下に追加"
  >
    <ArrowDown class="h-4 w-4" />
  </Button>

  <Button
    variant="ghost"
    size="sm"
    onclick={onDeleteRow}
    class="text-white hover:bg-gray-700"
    aria-label="行を削除"
  >
    <Rows class="h-4 w-4" />
  </Button>

  <!-- 区切り線 -->
  <div class="h-4 w-px bg-gray-600"></div>

  <!-- 列操作グループ -->
  <Button
    variant="ghost"
    size="sm"
    onclick={onAddColumnBefore}
    class="text-white hover:bg-gray-700"
    aria-label="列を左に追加"
  >
    <ArrowLeft class="h-4 w-4" />
  </Button>

  <Button
    variant="ghost"
    size="sm"
    onclick={onAddColumnAfter}
    class="text-white hover:bg-gray-700"
    aria-label="列を右に追加"
  >
    <ArrowRight class="h-4 w-4" />
  </Button>

  <Button
    variant="ghost"
    size="sm"
    onclick={onDeleteColumn}
    class="text-white hover:bg-gray-700"
    aria-label="列を削除"
  >
    <Columns class="h-4 w-4" />
  </Button>

  <!-- 区切り線 -->
  <div class="h-4 w-px bg-gray-600"></div>

  <!-- テーブル削除（危険操作） -->
  <Button
    variant="ghost"
    size="sm"
    onclick={onDeleteTable}
    class="text-red-500 hover:bg-red-900/20"
    aria-label="テーブルを削除"
  >
    <Trash2 class="h-4 w-4" />
  </Button>
</div>
