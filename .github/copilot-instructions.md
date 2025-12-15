# GitHub Copilot Instructions for Simple Notion Project

> **📁 このファイルはインデックスファイルです**
> 
> Simple Notionプロジェクトの開発規約は、技術スタック別に以下の3つのファイルに分割されています。
> 作業内容に応じて適切なファイルを参照してください。

## プロジェクト概要

Simple NotionはNotionクローンアプリケーションで、Go（バックエンド）とSvelte 5/TypeScript（フロントエンド）を使用して構築されています。ブロックベースのエディターと階層構造の文書管理機能を提供します。

**重要**: 本プロジェクトは**Svelte 5に移行完了**しています。React版は非推奨・アーカイブ済みです。

## 技術スタック

- **バックエンド**: Go, PostgreSQL, Air（開発時ホットリロード）
- **フロントエンド**: Svelte 5, TypeScript, Vite, Tailwind CSS
- **インフラ**: Docker, Docker Compose
- **テスト**: Vitest（フロントエンド）, Go標準テスト（バックエンド）

## 📚 規約ドキュメント

### 🌐 [共通ルール](copilot-instructions-common.md)

全技術スタックに共通する基本原則とルールです。**すべての開発者が必ず参照してください。**

**含まれる内容**:
- 基本原則（開発とコミュニケーション、開発ツールの使用方針）
- プログラミングパターン（関数型、宣言型、ROROパターン）
- フォームとバリデーション
- セキュリティとデータ保護
- テスト駆動開発の必須化
- 共通の禁止事項
- Docker環境とAPI設計の共通原則

### 🔧 [バックエンド規約](copilot-instructions-backend.md)

Go/PostgreSQL専用の開発規約です。バックエンド作業時に参照してください。

**含まれる内容**:
- Go基本規約（命名規則、ファイル構成）
- プロジェクト構造（`cmd/`, `internal/`, `migrations/`）
- データベース規約（テーブル命名、マイグレーション）
- エラーハンドリングパターン
- テーブル駆動テスト
- バックエンド最適化（N+1問題回避、インデックス戦略）
- ファイルパターン

**参照タイミング**: バックエンドAPIの実装、データベース設計、サーバーサイドテスト作成時

### 🎨 [フロントエンド規約](copilot-instructions-svelte.md)

Svelte 5/TypeScript専用の開発規約です。フロントエンド作業時に参照してください。

**含まれる内容**:
- Svelte 5基本規約（ファイル構成、命名規則）
- **Svelte 5 Runes完全必須**（`$state`, `$derived`, `$effect`, `$props`, `$bindable`）
- **レガシーAPI完全禁止**（`writable`, `readable`, `derived`, `$:` 禁止）
- TipTap統合パターン（`onMount`/`onDestroy`）
- Svelte Runesストア（状態管理クラスパターン）
- ドラッグ&ドロップ（svelte-dnd-action）
- UIとスタイリング（Tailwind CSS、lucide-svelte）
- テスト（Testing Library + Vitest）
- ファイルパターン

**参照タイミング**: UIコンポーネントの実装、状態管理、フロントエンドテスト作成時

## 🔄 使い分けガイド

### バックエンド作業時

1. [共通ルール](copilot-instructions-common.md) を参照
2. [バックエンド規約](copilot-instructions-backend.md) を参照

**例**: 
- 新しいAPIエンドポイントの追加
- データベーススキーマの変更
- 認証ミドルウェアの実装
- Go言語のテスト作成

### フロントエンド作業時

1. [共通ルール](copilot-instructions-common.md) を参照
2. [フロントエンド規約](copilot-instructions-svelte.md) を参照

**例**: 
- Svelteコンポーネントの作成
- TipTapエディターの統合
- ドラッグ&ドロップ機能の実装
- フロントエンドテストの作成

### フルスタック作業時

すべてのファイルを参照し、バックエンドとフロントエンドの整合性を保ってください。

**例**: 
- 新機能の追加（API + UI）
- データフローの最適化
- エンドツーエンドテストの実装

## 📝 重要な注意事項

### React版について

**本プロジェクトはSvelte 5に移行完了しています。**

- ✅ **Svelte 5**: 現在のメインフロントエンド（`frontend-svelte/`）
- ❌ **React版**: 非推奨・アーカイブ済み（`frontend/`）

新規開発や機能追加は必ずSvelte 5で行ってください。

### レガシーAPIの完全禁止

Svelte 5では以下のレガシーAPIは**完全禁止**です:

- ❌ `writable`, `readable`, `derived`（Svelte Store API）
- ❌ `$:` reactive statements
- ✅ 代わりにSvelte 5 Runesを使用（`$state`, `$derived`, `$effect`）

詳細は[フロントエンド規約](copilot-instructions-svelte.md)の「レガシーAPI - 完全禁止」セクションを参照してください。

### Serena MCPの必須使用

- Copilotを使用する場合は、必ずSerena MCPを利用してプロジェクトの構造と規約を把握してからコード提案を行います
- コードの分析、検索、編集にはSerena MCPの機能を活用し、プロジェクト全体の整合性を保ちます

## 🚀 開発の始め方

### 1. 環境セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd simple_notion

# Docker環境の起動
docker-compose -f docker-compose.dev.yml up -d

# フロントエンド（Svelte）の起動
cd frontend-svelte
pnpm install
pnpm dev
```

### 2. 規約ファイルの確認

作業内容に応じて以下のファイルを開いて、規約を確認してください:

- 共通ルール: [copilot-instructions-common.md](copilot-instructions-common.md)
- バックエンド: [copilot-instructions-backend.md](copilot-instructions-backend.md)
- フロントエンド: [copilot-instructions-svelte.md](copilot-instructions-svelte.md)

### 3. テスト駆動開発

新機能の実装前には、必ずテストケースを作成してください。詳細は[共通ルール](copilot-instructions-common.md)の「テスト駆動開発の必須化」を参照してください。

## 📞 サポート

質問や不明点がある場合は、プロジェクトのドキュメントを参照するか、チームメンバーに相談してください。

---

**Happy Coding! 🎉**
