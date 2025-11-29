<script lang="ts">
  import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Palette,
    Link as LinkIcon,
  } from "lucide-svelte";
  import Button from "$lib/components/ui/button.svelte";

  let {
    position,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrike,
    setTextColor,
    setHighlightColor,
    setLink,
    removeLink,
  }: {
    position: { top: number; left: number };
    toggleBold: () => void;
    toggleItalic: () => void;
    toggleUnderline: () => void;
    toggleStrike: () => void;
    setTextColor: (color: string) => void;
    setHighlightColor: (color: string) => void;
    setLink: (url: string) => void;
    removeLink: () => void;
  } = $props();

  let showColorPalette = $state(false);

  // カラーパレット
  const textColors = [
    { name: "Black", value: "#000000" },
    { name: "Red", value: "#EF4444" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#10B981" },
    { name: "Yellow", value: "#F59E0B" },
    { name: "Purple", value: "#8B5CF6" },
  ];

  const highlightColors = [
    { name: "Yellow", value: "#FEF08A" },
    { name: "Green", value: "#BBF7D0" },
    { name: "Blue", value: "#BFDBFE" },
    { name: "Pink", value: "#FBCFE8" },
    { name: "Orange", value: "#FED7AA" },
  ];

  function handleSetLink() {
    const url = prompt("リンクURL:");
    if (url) {
      setLink(url);
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
      onclick={() => (showColorPalette = !showColorPalette)}
      class="text-white hover:bg-gray-700"
    >
      <Palette class="h-4 w-4" />
    </Button>

    {#if showColorPalette}
      <div
        class="absolute top-full mt-2 left-0 bg-white text-black rounded-lg shadow-xl p-3 min-w-[200px]"
      >
        <div class="mb-3">
          <p class="text-xs font-semibold mb-2">テキスト色</p>
          <div class="flex gap-2">
            {#each textColors as color}
              <button
                class="w-6 h-6 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                style="background-color: {color.value}"
                onclick={() => setTextColor(color.value)}
                title={color.name}
              ></button>
            {/each}
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold mb-2">背景色</p>
          <div class="flex gap-2">
            {#each highlightColors as color}
              <button
                class="w-6 h-6 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                style="background-color: {color.value}"
                onclick={() => setHighlightColor(color.value)}
                title={color.name}
              ></button>
            {/each}
          </div>
        </div>
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
</div>
