<script lang="ts">
  import { Upload, X, File as FileIcon, Download } from "lucide-svelte";
  import {
    uploadImageFileWithProgress,
    formatBytes,
    formatSpeed,
  } from "$lib/utils/uploadUtils";
  import type { UploadController, UploadProgressInfo } from "$lib/types";

  let {
    src = $bindable(""),
    fileName = $bindable(""),
    fileSize = $bindable(0),
    onUpdate,
    onDelete,
  }: {
    src?: string;
    fileName?: string;
    fileSize?: number;
    onUpdate: (data: {
      src?: string;
      fileName?: string;
      fileSize?: number;
    }) => void;
    onDelete: () => void;
  } = $props();

  let uploadProgress = $state(0);
  let uploadSpeed = $state(0);
  let uploadController = $state<UploadController>();
  let isUploading = $state(false);

  /**
   * ファイル選択時のハンドラー
   */
  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    isUploading = true;

    try {
      uploadController = uploadImageFileWithProgress(file, {
        onProgress: (progress: UploadProgressInfo) => {
          uploadProgress = progress.percentage;
          uploadSpeed = progress.speed;
        },
        onSuccess: (response) => {
          src = response.url || "";
          fileName = file.name;
          fileSize = file.size;
          onUpdate({
            src: response.url,
            fileName: file.name,
            fileSize: file.size,
          });
          isUploading = false;
        },
        onError: (error: Error) => {
          console.error("Upload failed:", error);
          isUploading = false;
          alert("ファイルのアップロードに失敗しました");
        },
      });
    } catch (error) {
      console.error("Upload failed:", error);
      isUploading = false;
      alert("ファイルのアップロードに失敗しました");
    }
  }

  /**
   * アップロードキャンセル
   */
  function cancelUpload() {
    uploadController?.abort();
    isUploading = false;
  }
</script>

<div class="border rounded-lg p-4 my-2 bg-white">
  {#if !src && !isUploading}
    <label
      class="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <Upload class="h-10 w-10 text-gray-400 mb-2" />
      <span class="text-sm text-gray-500">ファイルをアップロード</span>
      <span class="text-xs text-gray-400 mt-1"
        >クリックまたはドラッグ&ドロップ</span
      >
      <input type="file" class="hidden" onchange={handleFileSelect} />
    </label>
  {:else if isUploading}
    <div class="flex flex-col space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <FileIcon class="h-8 w-8 text-blue-500" />
          <div>
            <p class="text-sm font-medium">{fileName || "アップロード中..."}</p>
            <p class="text-xs text-gray-500">{formatSpeed(uploadSpeed)}</p>
          </div>
        </div>
        <button
          onclick={cancelUpload}
          class="p-1 hover:bg-gray-100 rounded transition-colors"
          title="キャンセル"
        >
          <X class="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 transition-all duration-300"
            style="width: {uploadProgress}%"
          ></div>
        </div>
        <p class="text-xs text-gray-500 mt-1 text-right">
          {Math.round(uploadProgress)}%
        </p>
      </div>
    </div>
  {:else}
    <div class="relative">
      <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <FileIcon class="h-10 w-10 text-blue-500 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{fileName}</p>
          <p class="text-xs text-gray-500">{formatBytes(fileSize)}</p>
        </div>
        <div class="flex items-center space-x-1">
          <a
            href={src}
            download={fileName}
            class="p-2 hover:bg-gray-200 rounded transition-colors"
            title="ダウンロード"
          >
            <Download class="h-5 w-5 text-gray-600" />
          </a>
          <button
            onclick={onDelete}
            class="p-2 hover:bg-red-100 rounded transition-colors"
            title="削除"
          >
            <X class="h-5 w-5 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
