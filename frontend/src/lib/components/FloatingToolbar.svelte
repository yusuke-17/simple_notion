<script lang="ts">
  import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Palette,
    Link as LinkIcon,
    Table,
  } from 'lucide-svelte'
  import Button from '$lib/components/ui/button.svelte'
  import ColorPalette from '$lib/components/ui/ColorPalette.svelte'

  interface FloatingToolbarProps {
    position: { top: number; left: number }
    toggleBold: () => void
    toggleItalic: () => void
    toggleUnderline: () => void
    toggleStrike: () => void
    setTextColor: (color: string) => void
    setHighlightColor: (color: string) => void
    setLink: (url: string) => void
    insertTable?: () => void
  }

  let {
    position,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrike,
    setTextColor,
    setHighlightColor,
    setLink,
    insertTable,
  }: FloatingToolbarProps = $props()

  let showColorPalette = $state(false)
  let currentPaletteType = $state<'text' | 'highlight'>('text')

  /**
   * カラーパレットを開く
   */
  function openColorPalette(type: 'text' | 'highlight') {
    currentPaletteType = type
    showColorPalette = true
  }

  /**
   * カラー選択時の処理
   */
  function handleColorSelect(color: string) {
    if (currentPaletteType === 'text') {
      setTextColor(color)
    } else {
      setHighlightColor(color)
    }
  }

  function handleSetLink() {
    const url = prompt('リンクURL:')
    if (url) {
      setLink(url)
    }
  }
</script>

<div
  class="absolute z-50 flex items-center gap-1 bg-gray-900 text-white rounded-lg shadow-lg p-1"
  style="top: {position.top}px; left: {position.left}px;"
>
  <Button
    variant="ghost"
    size="sm"
    onclick={toggleBold}
    class="text-white hover:bg-gray-700"
  >
    <Bold class="h-4 w-4" />
  </Button>

  <Button
    variant="ghost"
    size="sm"
    onclick={toggleItalic}
    class="text-white hover:bg-gray-700"
  >
    <Italic class="h-4 w-4" />
  </Button>

  <Button
    variant="ghost"
    size="sm"
    onclick={toggleUnderline}
    class="text-white hover:bg-gray-700"
  >
    <Underline class="h-4 w-4" />
  </Button>

  <Button
    variant="ghost"
    size="sm"
    onclick={toggleStrike}
    class="text-white hover:bg-gray-700"
  >
    <Strikethrough class="h-4 w-4" />
  </Button>

  <div class="h-4 w-px bg-gray-600"></div>

  <div class="relative">
    <Button
      variant="ghost"
      size="sm"
      onclick={() => openColorPalette('text')}
      class="text-white hover:bg-gray-700"
    >
      <Palette class="h-4 w-4" />
    </Button>

    {#if showColorPalette}
      <div class="absolute top-full mt-2 left-0">
        <ColorPalette
          type={currentPaletteType}
          onColorSelect={handleColorSelect}
          onClose={() => (showColorPalette = false)}
        />
      </div>
    {/if}
  </div>

  <Button
    variant="ghost"
    size="sm"
    onclick={handleSetLink}
    class="text-white hover:bg-gray-700"
  >
    <LinkIcon class="h-4 w-4" />
  </Button>

  {#if insertTable}
    <div class="h-4 w-px bg-gray-600"></div>

    <Button
      variant="ghost"
      size="sm"
      onclick={insertTable}
      class="text-white hover:bg-gray-700"
      aria-label="テーブルを挿入"
    >
      <Table class="h-4 w-4" />
    </Button>
  {/if}
</div>
