<script lang="ts">
  import { Trash2, GripVertical, Plus } from "lucide-svelte";
  import Input from "$lib/components/ui/input.svelte";
  import RichTextEditor from "$lib/components/RichTextEditor.svelte";
  import ImageBlockEditor from "$lib/components/ImageBlockEditor.svelte";
  import type { Block, ImageBlockContent } from "$lib/types";

  // ブロックタイプ定数
  const BLOCK_TYPES = {
    TEXT: "text",
    HEADING1: "heading1",
    HEADING2: "heading2",
    HEADING3: "heading3",
    IMAGE: "image",
  } as const;

  // Props
  let {
    block = $bindable<Block>(),
    onUpdate = $bindable<(id: number, content: string, type?: string) => void>(
      () => {}
    ),
    onDelete = $bindable<(id: number) => void>(() => {}),
    onAddBlock = $bindable<(afterBlockId: number, type: string) => void>(
      () => {}
    ),
    onFocus = $bindable<(id: number) => void>(() => {}),
  } = $props();

  // State
  let showTypeSelector = $state(false);

  /**
   * コンテンツ更新処理
   */
  function handleContentChange(content: string) {
    onUpdate(block.id, content);
  }

  /**
   * キーボード処理
   */
  function handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const content = target.value;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onAddBlock(block.id, BLOCK_TYPES.TEXT);
    } else if (
      event.key === "Backspace" &&
      content === "" &&
      block.position > 0
    ) {
      event.preventDefault();
      onDelete(block.id);
    } else if (event.key === "/" && content === "") {
      event.preventDefault();
      showTypeSelector = true;
    }
  }

  /**
   * リッチテキストキーボード処理
   */
  function handleRichTextKeyDown(event: KeyboardEvent): boolean | void {
    const isEmpty = !block.content || block.content.trim() === "";

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onAddBlock(block.id, BLOCK_TYPES.TEXT);
      return false;
    } else if (event.key === "Backspace" && isEmpty && block.position > 0) {
      event.preventDefault();
      onDelete(block.id);
      return false;
    } else if (event.key === "/" && isEmpty) {
      event.preventDefault();
      showTypeSelector = true;
      return false;
    }
  }

  /**
   * ブロックタイプ変更
   */
  function handleTypeChange(newType: string) {
    onUpdate(block.id, block.content, newType);
    showTypeSelector = false;
  }

  /**
   * 画像コンテンツ更新
   */
  function handleImageContentChange(imageContent: ImageBlockContent) {
    handleContentChange(JSON.stringify(imageContent));
  }

  /**
   * 画像ブロックのコンテンツを取得
   */
  function getImageContent(): ImageBlockContent | undefined {
    if (block.type !== BLOCK_TYPES.IMAGE) return undefined;

    try {
      if (typeof block.content === "object" && block.content !== null) {
        return block.content as ImageBlockContent;
      }
      return JSON.parse(block.content) as ImageBlockContent;
    } catch {
      return {
        src: "",
        alt: "",
        caption: "",
        width: 0,
        height: 0,
        originalName: "",
        fileSize: 0,
      };
    }
  }

  /**
   * プレースホルダーを取得
   */
  function getPlaceholder(): string {
    switch (block.type) {
      case BLOCK_TYPES.HEADING1:
        return "Heading 1";
      case BLOCK_TYPES.HEADING2:
        return "Heading 2";
      case BLOCK_TYPES.HEADING3:
        return "Heading 3";
      case BLOCK_TYPES.IMAGE:
        return "Click to upload image";
      default:
        return block.position === 0
          ? "Type '/' for commands"
          : "Type something...";
    }
  }

  /**
   * クラス名を取得
   */
  function getClassName(): string {
    switch (block.type) {
      case BLOCK_TYPES.HEADING1:
        return "text-3xl font-bold";
      case BLOCK_TYPES.HEADING2:
        return "text-2xl font-bold";
      case BLOCK_TYPES.HEADING3:
        return "text-xl font-bold";
      default:
        return "";
    }
  }

  // Computed
  let placeholder = $derived(getPlaceholder());
  let className = $derived(getClassName());
</script>

<div
  class="group relative py-0.5 hover:bg-gray-50/50 transition-colors duration-75"
>
  <!-- Block controls -->
  <div
    class="absolute left-0 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 -ml-20 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all duration-200 ease-out"
  >
    <button
      class="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors duration-150 border border-transparent hover:border-gray-200"
      onclick={() => onAddBlock(block.id, BLOCK_TYPES.TEXT)}
      title="Add block"
    >
      <Plus class="h-4 w-4 text-gray-400 hover:text-gray-600" />
    </button>
    <button
      class="h-8 w-8 flex items-center justify-center rounded-md cursor-grab hover:bg-gray-100 transition-colors duration-150 border border-transparent hover:border-gray-200 active:cursor-grabbing"
      aria-label="Drag to reorder"
      data-id={block.id}
      title="Drag to move"
    >
      <GripVertical class="h-4 w-4 text-gray-400 hover:text-gray-600" />
    </button>
  </div>

  <!-- Type selector -->
  {#if showTypeSelector}
    <div
      class="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg p-2 mt-6"
    >
      <button
        class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
        onclick={() => handleTypeChange(BLOCK_TYPES.TEXT)}
      >
        Text
      </button>
      <button
        class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
        onclick={() => handleTypeChange(BLOCK_TYPES.HEADING1)}
      >
        Heading 1
      </button>
      <button
        class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
        onclick={() => handleTypeChange(BLOCK_TYPES.HEADING2)}
      >
        Heading 2
      </button>
      <button
        class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
        onclick={() => handleTypeChange(BLOCK_TYPES.HEADING3)}
      >
        Heading 3
      </button>
      <button
        class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
        onclick={() => handleTypeChange(BLOCK_TYPES.IMAGE)}
      >
        Image
      </button>
    </div>
  {/if}

  <!-- Block content -->
  <div class="flex items-start">
    <div class="flex-1 min-h-[2rem]">
      {#if block.type === BLOCK_TYPES.HEADING1 || block.type === BLOCK_TYPES.HEADING2 || block.type === BLOCK_TYPES.HEADING3}
        <Input
          value={typeof block.content === "string" ? block.content : ""}
          oninput={(e: Event) =>
            handleContentChange((e.target as HTMLInputElement).value)}
          onkeydown={handleKeyDown}
          onfocus={() => onFocus(block.id)}
          {placeholder}
          class={className}
        />
      {:else if block.type === BLOCK_TYPES.TEXT}
        <div class="w-full">
          <RichTextEditor
            content={typeof block.content === "string" ? block.content : ""}
            {placeholder}
            onUpdate={handleContentChange}
            onFocus={() => onFocus(block.id)}
            onKeyDown={handleRichTextKeyDown}
            class="min-h-[2rem] w-full"
          />
        </div>
      {:else if block.type === BLOCK_TYPES.IMAGE}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="w-full"
          role="button"
          tabindex="0"
          onclick={() => onFocus(block.id)}
        >
          <ImageBlockEditor
            initialContent={getImageContent()}
            onContentChange={handleImageContentChange}
            {placeholder}
            class="min-h-[2rem] w-full"
          />
        </div>
      {:else}
        <textarea
          value={typeof block.content === "string" ? block.content : ""}
          oninput={(e: Event) =>
            handleContentChange((e.target as HTMLTextAreaElement).value)}
          onkeydown={handleKeyDown}
          onfocus={() => onFocus(block.id)}
          {placeholder}
          class={className}
          rows={1}
        ></textarea>
      {/if}
    </div>

    <!-- Delete button -->
    <button
      class="h-8 w-8 flex items-center justify-center ml-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-md transition-all duration-200 ease-out border border-transparent hover:border-red-200"
      onclick={() => onDelete(block.id)}
      title="Delete block"
    >
      <Trash2 class="h-4 w-4 text-gray-400 hover:text-red-500" />
    </button>
  </div>
</div>
