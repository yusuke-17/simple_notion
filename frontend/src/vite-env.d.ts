/// <reference types="vite/client" />

/**
 * Viteの環境変数の型定義
 * プロジェクトで使用するカスタム環境変数をここで定義します
 */
interface ImportMetaEnv {
  /** APIのベースURL */
  readonly VITE_API_BASE_URL: string
  /** 開発モードでの警告を抑制するフラグ */
  readonly VITE_SUPPRESS_DEV_WARNINGS?: string
}
