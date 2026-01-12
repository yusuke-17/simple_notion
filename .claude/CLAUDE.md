# Simple Notion - Claude Code Instructions

> **プロジェクト**: Simple Notion（Notionクローンアプリケーション）
> 
> **技術スタック**: Svelte 5 + Go + PostgreSQL
> 
> **重要**: Svelte 5に完全移行済み。React版は削除されました。

## プロジェクト概要

Simple NotionはNotionクローンアプリケーションで、ブロックベースのエディターと階層構造の文書管理機能を提供します。

### 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **バックエンド** | Go, PostgreSQL, Air（ホットリロード） |
| **フロントエンド** | Svelte 5.43.8, TypeScript 5.9.3, Vite 7.2.4 |
| **エディター** | TipTap 3.11.1（React依存排除、コアのみ） |
| **UI/スタイリング** | Tailwind CSS 4.1.17, lucide-svelte 0.555.0 |
| **ドラッグ&ドロップ** | svelte-dnd-action 0.9.67 |
| **テスト** | Vitest 4.0.14（Frontend）, Go標準テスト（Backend） |
| **インフラ** | Docker, Docker Compose |

## 基本方針

### コミュニケーション

- **日本語で丁寧に**: 常に日本語で分かりやすい言葉を選び、丁寧な表現を心がける
- **初心者に優しく**: 専門用語はできるだけ避け、必要な場合は簡単な説明を加える
- **励ましの言葉**: 常に励ましの言葉を添え、学習意欲が高まる工夫をする
- **説明責任**: 単に解決方法を示すだけでなく、「なぜこのアプローチを選択したのか」を必ず説明する

### 実装原則

- **テスト駆動開発（TDD）必須**: 新機能実装前に必ずテストケースを作成
- **Clean Architecture採用**: レイヤー責務を明確に分離
- **関数型プログラミング**: クラスの使用を避け、関数型パターンを優先
- **型安全性の確保**: TypeScript strict mode、`any`型の使用は最小限に

## よく使うコマンド

### 開発環境起動

```bash
# Docker環境全体を起動
docker-compose -f docker-compose.dev.yml up -d

# フロントエンド開発サーバー起動（別ターミナル）
cd frontend
pnpm install
pnpm dev
# → http://localhost:5173

# バックエンドはAirで自動リロード（Dockerで起動済み）
# → http://localhost:8080
```

### テスト実行

```bash
# フロントエンドテスト
cd frontend
pnpm test              # 全テスト実行
pnpm test:watch        # ウォッチモード
pnpm test:coverage     # カバレッジ計測

# バックエンドテスト
cd backend
go test ./...          # 全テスト実行
go test -v ./...       # 詳細出力
go test -cover ./...   # カバレッジ計測
```

### データベース操作

```bash
# マイグレーション実行
cd backend
make migrate-up

# PostgreSQLに接続
docker exec -it simple_notion-postgres-1 psql -U postgres -d simple_notion
```

## プロジェクト構造

```
simple_notion/
├── frontend/              # Svelte 5フロントエンド
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/    # Svelteコンポーネント
│   │   │   ├── stores/        # Svelte Runesストア（.svelte.ts）
│   │   │   ├── utils/         # 純粋関数ユーティリティ
│   │   │   └── types/         # TypeScript型定義
│   │   ├── App.svelte
│   │   └── main.ts
│   └── (設定ファイル群)
│
└── backend/               # Goバックエンド
    ├── cmd/server/        # メインエントリーポイント
    ├── internal/
    │   ├── app/           # アプリケーション初期化
    │   ├── handlers/      # HTTPハンドラー
    │   ├── services/      # ビジネスロジック
    │   ├── repository/    # データベースアクセス
    │   ├── models/        # データモデル
    │   └── middleware/    # ミドルウェア
    ├── migrations/        # DBマイグレーション
    └── tests/             # 統合テスト
```

## 重要な規約

### Svelte 5 Runes（完全必須）

**✅ 使用必須**:
- `$state()`  - リアクティブ変数
- `$derived()` - 派生値（computed）
- `$effect()` - 副作用（useEffect相当）
- `$props()` - Props受け取り
- `$bindable()` - 双方向バインディング

**❌ 完全禁止（レガシーAPI）**:
- `writable`, `readable`, `derived`（Svelte Store API）
- `$:` reactive statements

### 命名規則

| 種類 | 規則 | 例 |
|------|------|-----|
| Svelteコンポーネント | PascalCase | `DocumentEditor.svelte` |
| Svelte Runesストア | camelCase + `.svelte.ts` | `auth.svelte.ts` |
| ユーティリティファイル | camelCase + `Utils.ts` | `editorUtils.ts` |
| Goファイル | snake_case | `user_repository.go` |
| Goテストファイル | `*_test.go` | `user_repository_test.go` |

### 禁止事項

- ❌ `any`型の過度な使用
- ❌ 未使用のimport/variable
- ❌ `console.log`（デバッグ目的以外）
- ❌ パスワード/APIキーのハードコーディング
- ❌ テストコードなしでの機能追加・修正
- ❌ SQLクエリの文字列連結（SQLインジェクションリスク）

## 詳細ルール参照

プロジェクト固有の詳細ルールは以下のファイルに分割されています：

- **共通ルール**: `.claude/rules/common.md`
- **フロントエンド規約**: `.claude/rules/frontend.md`
- **バックエンド規約**: `.claude/rules/backend.md`

また、既存のCopilot用規約も参照可能です：

- `.github/copilot-instructions.md`（インデックス）
- `.github/copilot-instructions-common.md`
- `.github/copilot-instructions-svelte.md`
- `.github/copilot-instructions-backend.md`

## 開発フロー

### 新機能追加時

1. **テストケース作成** - 期待する動作を定義
2. **実装** - テストが通るように実装
3. **リファクタリング** - コード品質向上
4. **ドキュメント更新** - README等を更新

### コードレビューポイント

- [ ] テストコードが存在するか
- [ ] エラーハンドリングが適切か
- [ ] 型定義が明確か
- [ ] セキュリティリスクがないか
- [ ] パフォーマンスへの影響は考慮されているか

---

**Happy Coding! 🎉**
