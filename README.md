# Simple Notion Clone

個人利用向けのシンプルなNotionクローンアプリケーションです。

## 技術スタック

### フロントエンド
- **React v19** + **TypeScript**
- **Vite** (ビルドツール)
- **Tailwind CSS** + **shadcn/ui** (スタイリング・UIコンポーネント)
- **Zustand** (状態管理)
- **React Router v7** (ルーティング)

### バックエンド
- **Go 1.23.3** (フレームワークなし)
- **PostgreSQL 17** (データベース)
- **JWT** + **Cookie** (認証)

## 機能

- ✅ ユーザー認証（登録/ログイン/ログアウト）
- ✅ ドキュメント管理（作成/編集/削除/復元）
- ✅ 階層構造（親子関係のツリー構造）
- ✅ ブロックベースエディタ（テキスト、見出し、チェックリスト）
- ✅ 自動保存機能
- ✅ ゴミ箱機能（論理削除）
- ✅ ドラッグ&ドロップでの移動

## 開発環境セットアップ

### 必要な環境
- Node.js v22.13.1+
- Go 1.23.3+
- Docker & Docker Compose

### 1. プロジェクトクローン
```bash
git clone <repository-url>
cd simple_notion
```

### 2. Docker Composeで起動
```bash
# 全サービスを一括起動
docker-compose up -d

# ログを確認
docker-compose logs -f
```

### 3. 個別に開発する場合

#### データベースのみDockerで起動
```bash
docker-compose up -d db
```

#### フロントエンド開発
```bash
cd frontend
npm install
npm run dev
```

#### バックエンド開発
```bash
cd backend
go mod tidy
go run cmd/server/main.go
```

## アクセス

- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:8080
- **PostgreSQL**: localhost:5432

## デフォルト設定

- **データベース**: `notion_app`
- **ユーザー**: `postgres`
- **パスワード**: `password`

## API エンドポイント

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報

### ドキュメント
- `GET /api/documents/tree` - ドキュメントツリー取得
- `GET /api/documents/{id}` - ドキュメント詳細取得
- `POST /api/documents` - ドキュメント作成
- `PUT /api/documents/{id}` - ドキュメント更新
- `DELETE /api/documents/{id}` - ドキュメント削除（論理削除）
- `PUT /api/documents/{id}/restore` - ドキュメント復元
- `PUT /api/documents/{id}/move` - ドキュメント移動

## テスト実行

### フロントエンド
```bash
cd frontend
npm run test
npm run test:ui  # UI付きテスト
```

### バックエンド
```bash
cd backend
go test ./...
```

## プロジェクト構造

```
simple_notion/
├── frontend/                # Svelteアプリケーション
│   ├── src/
│   │   ├── components/     # Svelteコンポーネント
│   │   ├── stores/         # 状態管理
│   │   └── tests/          # テストファイル
│   └── package.json
├── backend/                # Goアプリケーション
│   ├── cmd/server/         # エントリーポイント
│   ├── internal/
│   │   ├── handlers/       # HTTPハンドラー
│   │   ├── models/         # データモデル
│   │   ├── repository/     # データアクセス層
│   │   └── middleware/     # ミドルウェア
│   ├── migrations/         # データベースマイグレーション
│   └── go.mod
└── docker-compose.yml      # 開発環境設定
```

## 開発のポイント

### パフォーマンス最適化
- 個人利用想定（100-500ドキュメント）
- 2秒のdebounce自動保存
- 適切なインデックス設計

### セキュリティ
- JWT認証（24時間有効）
- パスワードハッシュ化（bcrypt）
- CORS設定

## ライセンス

MIT License
