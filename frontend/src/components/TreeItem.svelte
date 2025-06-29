<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  let {
    item,
    expandedIds,
    selectedDocId
  }: {
    item: any;
    expandedIds: Set<number>;
    selectedDocId: number | null;
  } = $props();
  
  const dispatch = createEventDispatcher();
  
  function toggleExpanded() {
    dispatch('toggle-expanded', item.id);
  }
  
  function selectDocument() {
    dispatch('select-document', item.id);
  }
  
  function createDocument() {
    dispatch('create-document', item.id);
  }
  
  function handleDragStart(e: DragEvent) {
    dispatch('drag-start', { event: e, item });
  }
  
  function handleDragOver(e: DragEvent) {
    dispatch('drag-over', { event: e, item });
  }
  
  function handleDrop(e: DragEvent) {
    dispatch('drop', { event: e, item });
  }
</script>

<div 
  class="group"
  draggable="true"
  ondragstart={handleDragStart}
  ondragover={(e) => { e.preventDefault(); handleDragOver(e); }}
  ondrop={(e) => { e.preventDefault(); handleDrop(e); }}
  role="treeitem"
>
  <div 
    class="flex items-center py-1 px-2 text-sm rounded cursor-pointer hover:bg-gray-100 {selectedDocId === item.id ? 'bg-blue-50 text-blue-700' : ''}"
    style="padding-left: {item.level * 16 + 8}px"
  >
    {#if item.children && item.children.length > 0}
      <button 
        onclick={toggleExpanded}
        class="mr-1 p-0.5 hover:bg-gray-200 rounded"
        aria-label="Toggle expand"
      >
        <svg 
          class="w-4 h-4 transition-transform {expandedIds.has(item.id) ? 'rotate-90' : ''}" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    {:else}
      <div class="w-5 h-5 mr-1"></div>
    {/if}
    
    <button 
      onclick={selectDocument}
      class="flex-1 text-left truncate"
    >
      📄 {item.title}
    </button>
    
    <button 
      onclick={createDocument}
      class="opacity-0 group-hover:opacity-100 ml-1 p-1 hover:bg-gray-200 rounded"
      title="Add child document"
      aria-label="Add child document"
    >
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
      </svg>
    </button>
  </div>
  
  {#if item.children && item.children.length > 0 && expandedIds.has(item.id)}
    {#each item.children as child}
      <svelte:self 
        item={child}
        {expandedIds}
        {selectedDocId}
        on:toggle-expanded
        on:select-document
        on:create-document
        on:drag-start
        on:drag-over
        on:drop
      />
    {/each}
  {/if}
</div>
