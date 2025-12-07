import type {
  DocumentWithBlocks,
  Block,
  UseReadOnlyDocumentViewerReturn,
} from "$lib/types";

/**
 * 読み取り専用ドキュメントビューアー用ストア
 * ゴミ箱内のドキュメントを読み取り専用で取得・表示
 */
export function createReadOnlyDocumentViewerStore(documentId: number) {
  // 状態管理
  let document = $state<DocumentWithBlocks | null>(null);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  /**
   * ドキュメントが空かどうかを判定
   */
  const isEmpty = $derived(
    !document || !document.blocks || document.blocks.length === 0
  );

  /**
   * ドキュメントが準備完了かどうかを判定
   */
  const isReady = $derived(!isLoading && !error && document !== null);

  /**
   * ドキュメントを読み込む
   * 削除済みドキュメントも含めて取得
   */
  async function loadDocument() {
    isLoading = true;
    error = null;

    try {
      // 削除済みドキュメントも含めて取得
      const response = await fetch(
        `/api/documents/${documentId}?includeDeleted=true`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.status}`);
      }

      const data = await response.json();

      // ブロックを位置順にソート
      if (data.blocks && Array.isArray(data.blocks)) {
        data.blocks.sort((a: Block, b: Block) => a.position - b.position);
      }

      document = data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      error = errorMessage;

      // 開発環境でのみコンソールにログ出力
      if (import.meta.env.DEV) {
        console.error("Failed to load read-only document:", err);
      }
    } finally {
      isLoading = false;
    }
  }

  // 初期化時にドキュメントを読み込む
  loadDocument();

  // ストアのインターフェースを返す
  return {
    get document() {
      return document;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    get isEmpty() {
      return isEmpty;
    },
    get isReady() {
      return isReady;
    },
    loadDocument,
  };
}

/**
 * 読み取り専用ドキュメントビューアーストアを使用するヘルパー関数
 */
export function useReadOnlyDocumentViewer(
  documentId: number
): UseReadOnlyDocumentViewerReturn {
  const store = createReadOnlyDocumentViewerStore(documentId);

  return {
    get document() {
      return store.document;
    },
    get isLoading() {
      return store.isLoading;
    },
    get error() {
      return store.error;
    },
    get isEmpty() {
      return store.isEmpty;
    },
    get isReady() {
      return store.isReady;
    },
  };
}
