/// <reference types="vite/client" />

/**
 * Viteの環境変数の型定義
 * プロジェクトで使用する環境変数をここで定義します
 */
interface ImportMetaEnv {
  /** APIのベースURL */
  readonly VITE_API_BASE_URL: string
  /** 開発モードでの警告を抑制するフラグ */
  readonly VITE_SUPPRESS_DEV_WARNINGS?: string
  // Viteのビルトイン環境変数
  /** 開発モードかどうか */
  readonly DEV: boolean
  /** 本番モードかどうか */
  readonly PROD: boolean
  /** SSRモードかどうか */
  readonly SSR: boolean
  /** アプリケーションモード */
  readonly MODE: string
  /** ベースURL */
  readonly BASE_URL: string
}

/**
 * import.metaの型拡張
 */
interface ImportMeta {
  readonly env: ImportMetaEnv
}
