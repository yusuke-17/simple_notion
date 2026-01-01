# Simple Notion - Svelte 5 Frontend

Svelte 5で構築されたNotionクローンのフロントエンドです。

## プロジェクト状況

**ステータス**: ✅ **本番稼働中**

### 技術スタック

- **Svelte**: 5.43.8
- **TypeScript**: 5.9.3
- **Vite**: 7.2.4
- **Tailwind CSS**: 4.1.17
- **TipTap**: 3.11.1（リッチテキストエディター）
- **Vitest**: 4.0.14
- **Testing Library**: @testing-library/svelte 5.2.9

## 開発環境

### ローカル開発

```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動（ポート5174）
pnpm dev

# テスト実行
pnpm test

# カバレッジ確認
pnpm coverage
```

### Docker開発

```bash
# フロントエンドのみ起動
docker compose -f docker-compose.dev.yml up frontend

# 全サービス起動
docker compose -f docker-compose.dev.yml up

# アクセス
# Svelte版: http://localhost:5174
# バックエンドAPI: http://localhost:8080
```

## プロジェクト構造

```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/  # Svelteコンポーネント（UIレンダリング専用）
│   │   ├── utils/       # 純粋関数ユーティリティ
│   │   ├── types/       # TypeScript型定義
│   │   └── stores/      # 状態管理（Svelte 5 Runes）
│   ├── tests/           # テストセットアップ
│   ├── App.svelte       # メインアプリケーション
│   ├── main.ts          # エントリーポイント
│   └── app.css          # グローバルスタイル（Tailwind CSS）
├── vite.config.ts       # Vite設定（ポート5174、APIプロキシ）
├── tailwind.config.js   # Tailwind CSS設定
├── vitest.config.ts     # Vitest設定
├── Dockerfile           # 本番用Docker設定
└── Dockerfile.dev       # 開発用Docker設定
```

### ユーティリティライブラリ

- `clsx` - クラス名結合
- `tailwind-merge` - Tailwindクラスマージ
- `class-variance-authority` - バリアント管理

## Svelte 5 Runes

本プロジェクトではSvelte 5の新しいRunes APIを採用しています。

### 主要なRunes

- `$state` - リアクティブな状態変数
- `$derived` - 派生値（computed）
- `$effect` - 副作用（useEffect相当）
- `$props` - コンポーネントプロパティ
- `$bindable` - 双方向バインディング

### レガシーAPI（使用禁止）

以下のレガシーAPIは使用しないでください:

- ❌ `writable`, `readable`, `derived`（Svelte Store API）
- ❌ `$:` reactive statements

## テスト

```bash
# テスト実行
pnpm test

# ウォッチモード
pnpm test:watch

# カバレッジレポート
pnpm test:coverage
```

---

**最終更新**: 2025年12月31日
