<script lang="ts">
  interface Block {
    id: number;
    type: 'text' | 'heading' | 'checklist';
    content: any;
    position: number;
  }
  
  let {
    block,
    onContentChange,
    onAddBlock,
    onDeleteBlock,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown
  }: {
    block: Block;
    onContentChange: (content: any) => void;
    onAddBlock: (type: Block['type']) => void;
    onDeleteBlock: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
  } = $props();
  
  let showMenu = $state(false);
  let blockElement: HTMLElement;
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      if (block.type === 'checklist') {
        // チェックリストの場合は新しいアイテムを追加
        event.preventDefault();
        addChecklistItem();
      } else {
        // その他のブロックタイプでは新しいテキストブロックを追加
        event.preventDefault();
        onAddBlock('text');
      }
    } else if (event.key === '/' && (event.target as HTMLElement).textContent === '') {
      event.preventDefault();
      showMenu = true;
    } else if (event.key === 'Backspace' && (event.target as HTMLElement).textContent === '') {
      event.preventDefault();
      onDeleteBlock();
    }
  }
  
  function selectBlockType(type: Block['type']) {
    const newContent = getDefaultContentForType(type);
    onContentChange(newContent);
    block.type = type; // ローカル更新
    showMenu = false;
  }
  
  function getDefaultContentForType(type: Block['type']) {
    switch (type) {
      case 'text':
        return { text: '' };
      case 'heading':
        return { text: '', level: 1 };
      case 'checklist':
        return { items: [{ text: '', checked: false }] };
      default:
        return { text: '' };
    }
  }
  
  function addChecklistItem() {
    if (block.type === 'checklist') {
      const newItems = [...block.content.items, { text: '', checked: false }];
      onContentChange({ items: newItems });
    }
  }
  
  function updateChecklistItem(index: number, updates: { text?: string; checked?: boolean }) {
    if (block.type === 'checklist') {
      const newItems = [...block.content.items];
      newItems[index] = { ...newItems[index], ...updates };
      onContentChange({ items: newItems });
    }
  }
  
  function removeChecklistItem(index: number) {
    if (block.type === 'checklist' && block.content.items.length > 1) {
      const newItems = block.content.items.filter((_: any, i: number) => i !== index);
      onContentChange({ items: newItems });
    }
  }
</script>

<div 
  class="group relative"
  data-block-id={block.id}
  bind:this={blockElement}
>
  <!-- ブロックコントロール -->
  <div class="absolute left-0 top-0 -ml-12 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
    <button
      onclick={() => showMenu = !showMenu}
      class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
      title="Block menu"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
      </svg>
    </button>
    
    <div class="flex flex-col">
      {#if canMoveUp}
        <button
          onclick={onMoveUp}
          class="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Move up"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
          </svg>
        </button>
      {/if}
      
      {#if canMoveDown}
        <button
          onclick={onMoveDown}
          class="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Move down"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      {/if}
    </div>
  </div>
  
  <!-- ブロックメニュー -->
  {#if showMenu}
    <div class="absolute top-0 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-2 min-w-48">
      <button
        onclick={() => selectBlockType('text')}
        class="w-full flex items-center px-4 py-2 text-sm hover:bg-gray-50"
      >
        <span class="mr-3">📝</span>
        Text
      </button>
      <button
        onclick={() => selectBlockType('heading')}
        class="w-full flex items-center px-4 py-2 text-sm hover:bg-gray-50"
      >
        <span class="mr-3">📰</span>
        Heading
      </button>
      <button
        onclick={() => selectBlockType('checklist')}
        class="w-full flex items-center px-4 py-2 text-sm hover:bg-gray-50"
      >
        <span class="mr-3">☑️</span>
        Checklist
      </button>
      <div class="border-t border-gray-100 mt-2 pt-2">
        <button
          onclick={onDeleteBlock}
          class="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <span class="mr-3">🗑️</span>
          Delete
        </button>
      </div>
    </div>
  {/if}
  
  <!-- ブロックコンテンツ -->
  <div class="min-h-[1.5rem]" onkeydown={handleKeydown}>
    {#if block.type === 'text'}
      <div
        contenteditable
        class="p-2 rounded hover:bg-gray-50 focus:outline-none focus:bg-white"
        oninput={(e) => onContentChange({ text: (e.target as HTMLElement).textContent || '' })}
        placeholder="Type something..."
      >{block.content.text || ''}</div>
      
    {:else if block.type === 'heading'}
      <div class="flex items-center space-x-2">
        <select
          bind:value={block.content.level}
          onchange={(e) => onContentChange({ ...block.content, level: parseInt((e.target as HTMLSelectElement).value) })}
          class="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value={1}>H1</option>
          <option value={2}>H2</option>
          <option value={3}>H3</option>
        </select>
        
        <div
          contenteditable
          class="flex-1 p-2 rounded hover:bg-gray-50 focus:outline-none focus:bg-white {
            block.content.level === 1 ? 'text-3xl font-bold' :
            block.content.level === 2 ? 'text-2xl font-semibold' :
            'text-xl font-medium'
          }"
          oninput={(e) => onContentChange({ ...block.content, text: (e.target as HTMLElement).textContent || '' })}
          placeholder="Heading"
        >{block.content.text || ''}</div>
      </div>
      
    {:else if block.type === 'checklist'}
      <div class="space-y-2">
        {#each block.content.items as item, index}
          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={item.checked}
              onchange={() => updateChecklistItem(index, { checked: !item.checked })}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div
              contenteditable
              class="flex-1 p-1 rounded hover:bg-gray-50 focus:outline-none focus:bg-white {item.checked ? 'line-through text-gray-500' : ''}"
              oninput={(e) => updateChecklistItem(index, { text: (e.target as HTMLElement).textContent || '' })}
              placeholder="To-do"
            >{item.text}</div>
            
            {#if block.content.items.length > 1}
              <button
                onclick={() => removeChecklistItem(index)}
                class="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- メニュー外クリックで閉じる -->
{#if showMenu}
  <div class="fixed inset-0 z-0" onclick={() => showMenu = false}></div>
{/if}
