<script lang="ts">
  import { Upload, X, AlertCircle, XCircle } from 'lucide-svelte'
  import type { ImageBlockContent, UploadProgressInfo } from '$lib/types'
  import {
    uploadImageFileWithProgress,
    validateImageFile,
    formatBytes,
    formatSpeed,
  } from '$lib/utils/uploadUtils'

  // Props
  let {
    initialContent = $bindable<ImageBlockContent | undefined>(undefined),
    onContentChange = $bindable<(content: ImageBlockContent) => void>(() => {}),
    placeholder = 'Click to upload image or drag & drop',
    class: className = '',
  } = $props()

  // State
  let content = $state<ImageBlockContent>(
    initialContent || {
      src: '',
      alt: '',
      caption: '',
      width: 0,
      height: 0,
      originalName: '',
      fileSize: 0,
    }
  )
  let isUploading = $state(false)
  let uploadProgress = $state<UploadProgressInfo | null>(null)
  let error = $state('')
  let previewUrl = $state('')
  let fileInputRef: HTMLInputElement | null = $state(null)
  let uploadController: { abort: () => void; xhr: XMLHttpRequest } | null =
    $state(null)

  // Computed
  let hasImage = $derived(!!content.src)

  /**
   * ファイル選択ダイアログを開く
   */
  function openFileDialog() {
    fileInputRef?.click()
  }

  /**
   * ファイル選択処理
   */
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  /**
   * ドラッグ&ドロップ処理
   */
  function handleFileDrop(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()

    const files = Array.from(event.dataTransfer?.files || [])
    if (files.length === 0) {
      error = 'ファイルが選択されていません'
      return
    }

    const file = files[0]
    const validation = validateImageFile(file)

    if (!validation.isValid) {
      error = validation.error || 'ファイルが無効です'
      return
    }

    uploadFile(file)
  }

  /**
   * ドラッグオーバー処理
   */
  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  /**
   * ファイルアップロード
   */
  function uploadFile(file: File) {
    error = ''
    isUploading = true
    previewUrl = URL.createObjectURL(file)

    uploadController = uploadImageFileWithProgress(file, {
      onProgress: (progress: UploadProgressInfo) => {
        uploadProgress = progress
      },
      onSuccess: (response) => {
        if (response.success && response.url) {
          const newContent: ImageBlockContent = {
            src: response.url,
            alt: file.name,
            caption: '',
            width: 0,
            height: 0,
            originalName: file.name,
            fileSize: file.size,
            fileId: response.fileId,
          }
          content = newContent
          onContentChange(newContent)
          isUploading = false
          uploadProgress = null
          URL.revokeObjectURL(previewUrl)
          previewUrl = ''
        }
      },
      onError: (err: Error) => {
        error = err.message
        isUploading = false
        uploadProgress = null
        URL.revokeObjectURL(previewUrl)
        previewUrl = ''
      },
    })
  }

  /**
   * アップロードキャンセル
   */
  function cancelUpload() {
    uploadController?.abort()
    isUploading = false
    uploadProgress = null
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      previewUrl = ''
    }
  }

  /**
   * 画像削除
   */
  function removeImage() {
    content = {
      src: '',
      alt: '',
      caption: '',
      width: 0,
      height: 0,
      originalName: '',
      fileSize: 0,
    }
    onContentChange(content)
  }

  /**
   * キャプション更新
   */
  function updateCaption(newCaption: string) {
    content = { ...content, caption: newCaption }
    onContentChange(content)
  }

  /**
   * Alt更新
   */
  function updateAlt(newAlt: string) {
    content = { ...content, alt: newAlt }
    onContentChange(content)
  }

  /**
   * エラークリア
   */
  function clearError() {
    error = ''
  }
</script>

<div class={`image-block-editor ${className}`}>
  <!-- ファイル入力要素（非表示） -->
  <input
    bind:this={fileInputRef}
    type="file"
    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
    onchange={handleFileSelect}
    class="hidden"
  />

  {#if !hasImage || isUploading}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        ${
          isUploading
            ? 'border-blue-300 bg-blue-50'
            : error
              ? 'border-red-300 bg-red-50 hover:border-red-400'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }
      `}
      role="button"
      tabindex="0"
      onclick={openFileDialog}
      ondrop={handleFileDrop}
      ondragover={handleDragOver}
      ondragleave={(e: DragEvent) => e.preventDefault()}
      onkeydown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openFileDialog()
        }
      }}
    >
      {#if isUploading}
        <div class="space-y-2">
          <div class="flex justify-center">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            ></div>
          </div>
          <p class="text-sm text-blue-600">アップロード中...</p>
          {#if uploadProgress}
            <div class="space-y-2">
              <!-- 進捗バー -->
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style:width={`${uploadProgress.percentage}%`}
                ></div>
              </div>
              <!-- 進捗情報 -->
              <div class="flex justify-between text-xs text-gray-600">
                <span>{uploadProgress.percentage.toFixed(1)}%</span>
                <span>
                  {formatBytes(uploadProgress.loaded)} / {formatBytes(
                    uploadProgress.total
                  )}
                </span>
              </div>
              <!-- 速度と残り時間 -->
              {#if uploadProgress.speed > 0}
                <div class="flex justify-between text-xs text-gray-500">
                  <span>{formatSpeed(uploadProgress.speed)}</span>
                  <span>{uploadProgress.estimatedTimeRemaining}</span>
                </div>
              {/if}
              <!-- キャンセルボタン -->
              <button
                onclick={(e) => {
                  e.stopPropagation()
                  cancelUpload()
                }}
                class="w-full mt-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-2"
              >
                <XCircle class="h-4 w-4" />
                キャンセル
              </button>
            </div>
          {/if}
        </div>
      {:else if error}
        <div class="space-y-2">
          <div class="flex justify-center">
            <AlertCircle class="h-8 w-8 text-red-500" />
          </div>
          <p class="text-sm text-red-600">{error}</p>
          <button
            onclick={(e) => {
              e.stopPropagation()
              clearError()
            }}
            class="text-xs text-red-500 hover:text-red-700 underline"
          >
            エラーをクリア
          </button>
        </div>
      {:else if previewUrl}
        <div class="space-y-2">
          <img
            src={previewUrl}
            alt="Preview"
            class="max-w-full max-h-48 mx-auto rounded"
          />
          <p class="text-sm text-gray-500">プレビュー</p>
        </div>
      {:else}
        <div class="space-y-2">
          <div class="flex justify-center">
            <div
              class="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full"
            >
              <Upload class="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">{placeholder}</p>
            <p class="text-xs text-gray-500 mt-1">
              JPEG, PNG, GIF, WebP形式、最大5MB
            </p>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- 画像表示エリア -->
  {#if hasImage && !isUploading}
    <div class="space-y-3">
      <div class="relative group">
        <img
          src={content.src}
          alt={content.alt || 'Uploaded image'}
          class="max-w-full h-auto rounded-lg shadow-sm"
          style:max-height="500px"
          style:object-fit="contain"
        />

        <!-- 画像コントロール -->
        <div
          class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            onclick={removeImage}
            class="flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="画像を削除"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- 画像情報 -->
        <div
          class="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div
            class="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded"
          >
            {#if content.originalName}
              <div>{content.originalName}</div>
            {/if}
            {#if content.fileSize}
              <div>{formatBytes(content.fileSize)}</div>
            {/if}
            {#if content.width && content.height}
              <div>{content.width} × {content.height}</div>
            {/if}
          </div>
        </div>
      </div>

      <!-- キャプション編集 -->
      <div class="space-y-2">
        <input
          type="text"
          placeholder="画像のキャプションを入力..."
          value={content.caption || ''}
          oninput={(e) => updateCaption((e.target as HTMLInputElement).value)}
          class="w-full text-sm text-gray-600 border-none bg-transparent focus:outline-none placeholder:text-gray-400"
        />

        <!-- Alt テキスト編集（アクセシビリティ） -->
        <input
          type="text"
          placeholder="代替テキスト（アクセシビリティ用）"
          value={content.alt || ''}
          oninput={(e) => updateAlt((e.target as HTMLInputElement).value)}
          class="w-full text-xs text-gray-500 border-none bg-transparent focus:outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  {/if}
</div>
