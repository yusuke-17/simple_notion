# Simple Notion - React Frontend

SvelteからReact + Viteに完全移行したSimple Notionのフロントエンド

## 技術スタック

- **React v19** - UIフレームワーク
- **TypeScript** - 型安全性
- **Vite** - ビルドツール
- **Tailwind CSS** - CSSフレームワーク
- **shadcn/ui** - UIコンポーネントライブラリ
- **Zustand** - 状態管理
- **React Router v7** - ルーティング
- **TanStack Query** - サーバー状態管理（将来実装用）

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## プロジェクト構造

```
src/
├── components/
│   ├── ui/           # shadcn/ui コンポーネント
│   ├── Login.tsx     # ログイン画面
│   ├── Sidebar.tsx   # サイドバー
│   └── DocumentEditor.tsx # ドキュメントエディタ
├── stores/
│   └── auth.ts       # 認証状態管理 (Zustand)
├── types/
│   └── index.ts      # 型定義
├── lib/
│   └── utils.ts      # ユーティリティ関数
├── App.tsx           # メインアプリケーション
└── main.tsx          # エントリーポイント
```

## 主な機能

- ユーザー認証（ログイン・登録）
- ドキュメントの作成・編集・削除
- サイドバーでのドキュメント一覧表示
- 自動保存機能
- ゴミ箱機能（削除・復元）

## 移行内容

### Svelteから移行した機能

1. **認証システム**
   - Svelte stores → Zustand
   - リアクティブ変数 → React useState/useEffect

2. **UI コンポーネント**
   - Svelte コンポーネント → React コンポーネント
   - Tailwind CSS は継続使用
   - shadcn/ui で統一されたデザインシステム

3. **状態管理**
   - Svelte stores → Zustand
   - よりシンプルで型安全な状態管理

4. **イベントシステム**
   - Svelte custom events → カスタムイベント（window.dispatchEvent）

## 今後の拡張予定

- React Router v7 によるページルーティング
- TanStack Query によるサーバー状態管理の最適化
- よりリッチなエディタ機能
- リアルタイムコラボレーション
