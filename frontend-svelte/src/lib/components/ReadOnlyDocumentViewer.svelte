<script lang="ts">
  import Input from "$lib/components/ui/input.svelte";
  import ReadOnlyRichTextViewer from "./ReadOnlyRichTextViewer.svelte";
  import type {
    ReadOnlyDocumentViewerProps,
    Block,
    ImageBlockContent,
    FileBlockContent,
  } from "$lib/types";
  import { createReadOnlyDocumentViewerStore } from "$lib/stores/useReadOnlyDocumentViewer.svelte";
  import {
    Download,
    File,
    FileText,
    FileSpreadsheet,
    FileCode,
    FileArchive,
  } from "lucide-svelte";
  import {
    getFileIconName,
    formatFileSize,
    getFileTypeName,
  } from "$lib/utils/fileUploadUtils";

  /**
   * 読み取り専用ドキュメントビューアーコンポーネント
   * ゴミ箱内のドキュメントを読み取り専用で表示する
   *
   * 特徴:
   * - 全ての編集機能を無効化
   * - グレーアウト表示で読み取り専用であることを明示
   * - テキスト選択とコピーは可能
   */

  // Props
  let { documentId, onClose = undefined }: ReadOnlyDocumentViewerProps =
    $props();

  // ストアを作成
  let store = $state(createReadOnlyDocumentViewerStore(documentId));

  // documentIdが変更された場合、ストアを再作成
  $effect(() => {
    store = createReadOnlyDocumentViewerStore(documentId);
  });

  /**
   * ファイルアイコンを取得
   */
  function getFileIcon(mimeType: string) {
    const iconName = getFileIconName(mimeType);

    switch (iconName) {
      case "file-text":
        return FileText;
      case "file-spreadsheet":
        return FileSpreadsheet;
      case "file-code":
        return FileCode;
      case "file-archive":
        return FileArchive;
      default:
        return File;
    }
  }

  /**
   * 画像ブロックかどうかを判定
   */
  function isImageBlock(
    block: Block
  ): block is Block & { content: ImageBlockContent } {
    return block.type === "image" && typeof block.content === "object";
  }

  /**
   * ファイルブロックかどうかを判定
   */
  function isFileBlock(
    block: Block
  ): block is Block & { content: FileBlockContent } {
    return block.type === "file" && typeof block.content === "object";
  }

  /**
   * テキストブロックの内容を取得
   */
  function getTextContent(block: Block): string {
    if (typeof block.content === "string") {
      return block.content;
    }
    return "";
  }
</script>

<div class="h-full overflow-auto">
  <!-- ローディング状態 -->
  {#if store.isLoading}
    <div class="flex items-center justify-center h-full">
      <div class="text-gray-500">Loading...</div>
    </div>
    <!-- エラー状態 -->
  {:else if store.error}
    <div class="flex items-center justify-center h-full">
      <div class="text-red-500">Error: {store.error}</div>
    </div>
    <!-- ドキュメント未検出 -->
  {:else if !store.document}
    <div class="flex items-center justify-center h-full">
      <div class="text-gray-500">Document not found</div>
    </div>
    <!-- ドキュメント表示 -->
  {:else}
    <!-- 読み取り専用コンテナ（全体を70%透明化、クリック無効） -->
    <div class="opacity-70 pointer-events-none">
      <!-- バナー -->
      <div
        class="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-center pointer-events-auto"
      >
        <span class="text-sm text-gray-600">
          📄 このドキュメントは読み取り専用です（ゴミ箱内）
        </span>
      </div>

      <div class="px-4 py-6 max-w-4xl mx-auto">
        <!-- タイトル入力欄（読み取り専用） -->
        <Input
          value={store.document.title}
          readonly
          tabindex={-1}
          class="text-2xl font-bold border-0 focus:ring-0 px-0 mb-4 pointer-events-none"
        />

        <!-- ブロックリスト -->
        <div class="space-y-2 pl-20">
          {#if store.document.blocks && store.document.blocks.length > 0}
            {#each store.document.blocks as block (block.id)}
              <div class="group relative">
                <!-- テキストブロック -->
                {#if block.type === "text"}
                  <div class="min-h-[2rem] select-text pointer-events-auto">
                    <ReadOnlyRichTextViewer content={getTextContent(block)} />
                  </div>
                  <!-- 画像ブロック -->
                {:else if isImageBlock(block)}
                  {@const imageContent = block.content}
                  <div
                    class="my-4 select-text pointer-events-auto max-w-2xl mx-auto"
                  >
                    {#if imageContent.src}
                      <img
                        src={imageContent.src}
                        alt={imageContent.alt ||
                          imageContent.originalName ||
                          "Image"}
                        class="w-full h-auto rounded-lg shadow-md"
                        style={imageContent.width
                          ? `max-width: ${imageContent.width}px`
                          : ""}
                      />
                      {#if imageContent.caption}
                        <div class="text-center text-sm text-gray-600 mt-2">
                          {imageContent.caption}
                        </div>
                      {/if}
                    {:else}
                      <div
                        class="bg-gray-100 rounded-lg p-4 text-center text-gray-500"
                      >
                        画像が見つかりません
                      </div>
                    {/if}
                  </div>
                  <!-- ファイルブロック -->
                {:else if isFileBlock(block)}
                  {@const fileContent = block.content}
                  {@const FileIcon = getFileIcon(fileContent.mimeType)}
                  <div
                    class="my-4 border border-gray-200 rounded-lg p-4 bg-gray-50 max-w-xl"
                  >
                    <div class="flex items-start space-x-3">
                      <!-- ファイルアイコン -->
                      <div class="flex-shrink-0 mt-1">
                        <FileIcon class="w-8 h-8 text-gray-400" />
                      </div>

                      <!-- ファイル情報 -->
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 truncate">
                          {fileContent.originalName || fileContent.filename}
                        </div>
                        <div class="text-sm text-gray-500 mt-1">
                          {getFileTypeName(fileContent.mimeType)} •
                          {formatFileSize(fileContent.fileSize)}
                        </div>
                        {#if fileContent.uploadedAt}
                          <div class="text-xs text-gray-400 mt-1">
                            アップロード日時: {new Date(
                              fileContent.uploadedAt
                            ).toLocaleString("ja-JP")}
                          </div>
                        {/if}
                      </div>

                      <!-- ダウンロードボタン -->
                      {#if fileContent.downloadUrl}
                        <a
                          href={fileContent.downloadUrl}
                          download={fileContent.originalName ||
                            fileContent.filename}
                          class="flex-shrink-0 p-2 hover:bg-gray-100 rounded-md transition-colors pointer-events-auto"
                          title="ダウンロード"
                        >
                          <Download class="w-5 h-5 text-gray-600" />
                        </a>
                      {/if}
                    </div>
                  </div>
                  <!-- その他のブロックタイプ -->
                {:else}
                  <div class="text-gray-400 italic">
                    Unknown block type: {block.type}
                  </div>
                {/if}
              </div>
            {/each}
          {:else}
            <div class="text-gray-400 italic py-4">
              このドキュメントにはコンテンツがありません
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
