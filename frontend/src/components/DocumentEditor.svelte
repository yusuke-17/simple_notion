<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import BlockEditor from './BlockEditor.svelte';
  
  let { documentId }: { documentId: number } = $props();
  
  interface Block {
    id: number;
    type: 'text' | 'heading' | 'checklist';
    content: any;
    position: number;
  }
  
  interface Document {
    id: number;
    title: string;
    content: string;
    blocks: Block[];
  }
  
  let document = $state<Document>({
    id: 0,
    title: '',
    content: '',
    blocks: []
  });
  
  let isLoading = $state(true);
  let saveTimeout: NodeJS.Timeout;
  let titleElement: HTMLElement;
  
  $effect(() => {
    if (documentId) {
      loadDocument();
    }
  });
  
  onDestroy(() => {
    if (saveTimeout) clearTimeout(saveTimeout);
  });
  
  async function loadDocument() {
    isLoading = true;
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        document = await response.json();
      }
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveDocument, 2000);
  }
  
  async function saveDocument() {
    try {
      await fetch(`/api/documents/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: document.title,
          blocks: document.blocks
        })
      });
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  }
  
  function onTitleChange() {
    debouncedSave();
  }
  
  function addBlock(type: Block['type'], afterIndex?: number) {
    const newBlock: Block = {
      id: Date.now(),
      type,
      content: getDefaultContent(type),
      position: afterIndex !== undefined ? afterIndex + 1 : document.blocks.length
    };
    
    if (afterIndex !== undefined) {
      document.blocks.splice(afterIndex + 1, 0, newBlock);
      // 後続ブロックのposition更新
      for (let i = afterIndex + 2; i < document.blocks.length; i++) {
        document.blocks[i].position = i;
      }
    } else {
      document.blocks = [...document.blocks, newBlock];
    }
    
    debouncedSave();
    
    // 新しいブロックにフォーカス
    setTimeout(() => {
      const newBlockElement = window.document.querySelector(`[data-block-id="${newBlock.id}"]`);
      if (newBlockElement) {
        (newBlockElement as HTMLElement).focus();
      }
    }, 50);
  }
  
  function getDefaultContent(type: Block['type']) {
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
  
  function deleteBlock(blockId: number) {
    const index = document.blocks.findIndex(b => b.id === blockId);
    if (index > -1) {
      document.blocks.splice(index, 1);
      // 後続ブロックのposition更新
      for (let i = index; i < document.blocks.length; i++) {
        document.blocks[i].position = i;
      }
      debouncedSave();
    }
  }
  
  function moveBlock(blockId: number, direction: 'up' | 'down') {
    const index = document.blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= document.blocks.length) return;
    
    // ブロックを交換
    [document.blocks[index], document.blocks[newIndex]] = [document.blocks[newIndex], document.blocks[index]];
    
    // position更新
    document.blocks[index].position = index;
    document.blocks[newIndex].position = newIndex;
    
    document.blocks = [...document.blocks];
    debouncedSave();
  }
  
  function onBlockContentChange(blockId: number, newContent: any) {
    const block = document.blocks.find(b => b.id === blockId);
    if (block) {
      block.content = newContent;
      debouncedSave();
    }
  }
  
  // キーボードショートカット
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === '/' && event.target === titleElement) {
      event.preventDefault();
      addBlock('text');
    }
  }
</script>

<div class="h-full overflow-y-auto" onkeydown={handleKeydown}>
  {#if isLoading}
    <div class="flex items-center justify-center h-full">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  {:else}
    <div class="max-w-4xl mx-auto p-8">
      <!-- タイトル -->
      <input 
        bind:this={titleElement}
        bind:value={document.title}
        oninput={onTitleChange}
        placeholder="Untitled"
        class="w-full text-4xl font-bold border-none outline-none mb-8 placeholder-gray-400"
      />
      
      <!-- ブロックエディタ -->
      <div class="space-y-1">
        {#each document.blocks as block, index (block.id)}
          <BlockEditor 
            {block}
            onContentChange={(content) => onBlockContentChange(block.id, content)}
            onAddBlock={(type) => addBlock(type, index)}
            onDeleteBlock={() => deleteBlock(block.id)}
            onMoveUp={() => moveBlock(block.id, 'up')}
            onMoveDown={() => moveBlock(block.id, 'down')}
            canMoveUp={index > 0}
            canMoveDown={index < document.blocks.length - 1}
          />
        {/each}
      </div>
      
      <!-- 新しいブロック追加 -->
      {#if document.blocks.length === 0}
        <div class="mt-4">
          <button 
            onclick={() => addBlock('text')}
            class="flex items-center text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-50"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Click to add your first block
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
