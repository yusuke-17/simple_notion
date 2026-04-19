# Simple Notion Clone

個人利用向けのシンプルなNotionクローンアプリケーションです。
技術スタックの基礎力強化を目的とした学習プロジェクトであり、インフラ・バックエンド・フロントエンドの実践的な設計を重視しています。

## 技術スタック

### フロントエンド
- **Svelte 5** + **TypeScript 5.9**
- **Vite v7** (ビルドツール)
- **pnpm** (パッケージマネージャー)
- **Tailwind CSS v4** (スタイリング)
- **TipTap v3** (リッチテキストエディター)
- **Svelte 5 Runes** (状態管理)

### バックエンド
- **Go 1.25** (フレームワークなし)
- **PostgreSQL 18** (データベース)
- **JWT** + **Cookie** (認証)

### インフラ・DevOps
- **Docker & Docker Compose** (コンテナ管理・開発/本番環境分離)
- **GitHub Actions** (CI/CD)
- **Husky** (Git Hooks による品質管理)

## アーキテクチャ

### 設計方針
- **フロントエンド**: 関数型分離パターン（View ↔ Utils、Svelte 5 Runes による状態管理）
- **バックエンド**: Clean Architecture（Handler → Service → Repository）
- **リアルタイム自動保存**: 最適化された debounce 処理

### プロジェクト構造

```
simple_notion/
├── frontend/                # Svelte 5 + TypeScript（関数型分離設計）
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/  # View層（UIレンダリング専用）
│   │   │   ├── stores/      # 状態管理 (Svelte 5 Runes)
│   │   │   ├── utils/       # 純粋関数層
│   │   │   └── types/       # TypeScript 型定義
│   │   ├── tests/           # テストファイル
│   │   ├── App.svelte       # ルートコンポーネント
│   │   └── main.ts          # エントリーポイント
│   └── package.json
├── backend/                 # Go アプリケーション（Clean Architecture）
│   ├── cmd/server/          # エントリーポイント
│   ├── internal/
│   │   ├── app/             # アプリケーション設定・ライフサイクル
│   │   ├── handlers/        # HTTP ハンドラー
│   │   ├── services/        # ビジネスロジック層
│   │   ├── repository/      # データアクセス層
│   │   ├── models/          # データモデル
│   │   ├── middleware/      # ミドルウェア
│   │   └── config/          # 設定管理
│   ├── migrations/          # データベースマイグレーション
│   └── go.mod
├── .github/workflows/       # GitHub Actions CI/CD
├── .husky/                  # Git Hooks 設定
├── docker-compose.yml       # 本番環境設定
├── docker-compose.dev.yml   # 開発環境設定
└── Makefile                 # 開発用タスク
```

## 機能

### コア機能
- ユーザー認証（登録 / ログイン / ログアウト）
- ドキュメント管理（作成 / 編集 / 削除 / 復元）
- 階層構造（親子関係のツリー構造）
- ゴミ箱機能（論理削除・読み取り専用表示・復元）
- ドラッグ & ドロップでのドキュメント移動

### リッチテキストエディター
- **ブロックベース編集**: テキスト、見出し (H1-H3)、箇条書き、番号付きリスト、引用、コード、画像
- **キーボードショートカット**: `Enter`（新ブロック）、`Backspace`（削除）、`Cmd+↑/↓`（移動）、`/`（タイプ選択）
- **インライン装飾**: 太字、斜体、下線、取り消し線、テキスト色・背景色（10色パレット）
- **リンク機能**: テキスト選択からのリンク追加・編集、URL 自動検出、リンク解除
- **自動保存**: リアルタイムでの自動保存と安定したコンテンツ同期

### 画像ブロック
- ドラッグ & ドロップアップロード対応（JPEG / PNG / GIF / WebP、最大 5MB）
- リアルタイムプレビュー、キャプション編集、Alt 属性編集
- 画像情報表示（ファイル名、サイズ、寸法）

### ゴミ箱
- 論理削除による安全なドキュメント管理
- 完全削除前の確認ダイアログ、ワンクリック復元
- ゴミ箱内ドキュメントの読み取り専用プレビュー

## API エンドポイント

### 認証
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/auth/register` | ユーザー登録 |
| POST | `/api/auth/login` | ログイン |
| POST | `/api/auth/logout` | ログアウト |
| GET | `/api/auth/me` | 現在のユーザー情報取得 |

### ドキュメント
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/documents/tree` | ドキュメントツリー取得 |
| GET | `/api/documents/{id}` | ドキュメント詳細取得 |
| POST | `/api/documents` | ドキュメント作成 |
| PUT | `/api/documents/{id}` | ドキュメント更新 |
| DELETE | `/api/documents/{id}` | ドキュメント削除（論理削除） |
| PUT | `/api/documents/{id}/restore` | ドキュメント復元 |
| PUT | `/api/documents/{id}/move` | ドキュメント移動 |

### 画像・メディア
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/upload/image` | 画像アップロード（認証必須、最大 5MB） |
| GET | `/api/uploads/{filename}` | アップロード画像の配信 |

## 開発環境セットアップ

### 前提条件
- Node.js v24.12+
- pnpm v10.12.4+
- Go 1.25+
- Docker & Docker Compose

### 1. クローンと環境変数の設定

```bash
git clone <repository-url>
cd simple_notion

# 環境変数ファイルを作成
cp .env.example .env

# JWT秘密鍵を生成して .env に設定
make generate-jwt-secret
```

### 2. 起動

```bash
# 開発環境（ホットリロード有効）
make dev

# 本番環境（最適化ビルド）
make up
```

### 3. アクセス

| 環境 | フロントエンド | バックエンド API |
|------|--------------|-----------------|
| 開発 | http://localhost:5174 | http://localhost:8080 |
| 本番 | http://localhost:3000 | 内部通信 |

### 個別に開発する場合

```bash
# データベースのみ起動
docker-compose up -d db

# フロントエンド
cd frontend && pnpm install && pnpm dev

# バックエンド
cd backend && go mod tidy && go run cmd/server/main.go
```

### pnpm のインストール（初回のみ）

```bash
# macOS
brew install pnpm

# npm 経由
npm install -g pnpm

# Corepack 経由（Node.js v16.13+）
corepack enable && corepack prepare pnpm@latest --activate
```

> **注意**: このプロジェクトでは pnpm を採用しています。`npm install` は使用しないでください。

## 環境設定

| 項目 | 開発環境 | 本番環境 |
|------|----------|----------|
| 起動コマンド | `make dev` | `make up` |
| Docker 設定 | `docker-compose.dev.yml` | `docker-compose.yml` |
| フロントエンド | Vite 開発サーバー（HMR） | Nginx 静的配信 |
| バックエンド | Air ホットリロード | 最適化済みバイナリ |
| ポート | 5174（frontend）, 8080（backend） | 3000（frontend）, 8080（backend） |

## 開発コマンド

```bash
make dev             # 開発環境起動
make up              # 本番環境起動
make stop            # サービス停止
make restart         # サービス再起動
make logs            # ログ表示
make clean           # コンテナとイメージ削除
make fresh-dev       # クリーンな開発環境構築

make test            # テスト実行
make lint            # リント・フォーマット
make test-coverage   # カバレッジレポート
make ci              # 完全な CI/CD チェック

make generate-jwt-secret  # JWT秘密鍵の生成
make setup-env            # 環境変数ファイルのセットアップ
make security-check       # セキュリティ設定の確認
```

## 品質管理

### Git Hooks（自動実行）
- **コミット時**: ESLint、型チェック等の軽量チェック
- **プッシュ時**: 全テスト、カバレッジ等の包括チェック

```bash
# 緊急時のスキップ
git commit --no-verify
git push --no-verify
```

### テスト

```bash
# フロントエンド
cd frontend && pnpm test
cd frontend && pnpm test:ui  # UI付きテスト

# バックエンド
cd backend && go test ./...
```

## セキュリティ

### 実装済みの対策
- JWT 認証（24 時間有効）+ HttpOnly Cookie
- パスワードハッシュ化（bcrypt）
- CORS・XSS 対策

### セットアップ時の必須事項

1. **JWT 秘密鍵の設定**: デフォルト値は絶対に使用しない（`make generate-jwt-secret` で生成）
2. **データベースパスワード**: `POSTGRES_PASSWORD` に強力なパスワードを設定
3. **`.env` ファイル**: Git リポジトリにコミットしない（`.gitignore` に含まれています）
4. **本番環境**: `ENVIRONMENT=production`、`COOKIE_SECURE=true` に設定
5. **HTTPS**: 本番環境では必ず HTTPS を使用

## パフォーマンス
- 個人利用想定（100-500 ドキュメント規模）
- TipTap エディターの安定性最適化
- GPU 加速とメモリ効率化

## トラブルシューティング

### 502 Bad Gateway エラー
```bash
cat frontend/.env  # VITE_API_BASE_URL=http://localhost:8080 を確認
make restart       # サービス再起動
make clean && make dev  # 完全リセット
```

### 接続エラー
```bash
make ps                    # サービス状態確認
make logs                  # ログ確認
lsof -i :3000,8080,5432   # ポート競合確認
```

### フロントエンドがバックエンドに接続できない
- `VITE_API_BASE_URL` が正しく設定されているか確認
- CORS エラーの場合は、バックエンドの CORS 設定を確認

### 開発環境リセット
```bash
make fresh-dev  # クリーンな開発環境構築
```

## ロードマップ

### Phase 1: 品質基盤の強化
- [x] エラーハンドリングの統一（カスタムエラー型 `apierror.AppError`、`apierror.Write` による JSON レスポンス統一）
    - 基盤 `internal/apierror` パッケージ、repository 層の sentinel ラップ、`middleware/auth`、`handlers/upload`、`handlers/auth` まで統一済み
    - 後続 PR 推奨:
        - [ ] document 系 handler の移行（`handlers/document/*.go` に残る `http.Error` を `apierror.Write` に置換、409/403/404 の使い分け明確化）
        - [ ] service 層で repository の sentinel を `*AppError` に昇格（403 vs 404 の精度向上、業務ルール違反エラーの追加）
        - [ ] 構造化ログ（`slog`）への移行と `apierror.Write` 内部ロガーの差し替え
- [ ] テストカバレッジの強化（handler 層・service 層のユニットテスト）
- [ ] 構造化ログの導入（`slog` の活用）

### Phase 2: インフラ・運用力の強化
- [ ] Terraform / CDK による AWS リソースの IaC 化
- [ ] AWS 構成の設計（ECS Fargate + RDS + CloudFront + S3）
- [ ] GitHub Actions による CI/CD パイプラインの拡張（ビルド → テスト → ECR プッシュ → ECS デプロイ）
- [ ] 監視・アラートの導入（CloudWatch / Datadog）
- [ ] 画像アップロード先の S3 移行（署名付き URL）

### Phase 3: 機能拡張・AI 統合
- [ ] 全文検索の実装（PostgreSQL FTS: `to_tsvector` / `to_tsquery`）
- [ ] pgvector による類似ドキュメント検索
- [ ] メディアブロック Phase 2（PDF、Word、Excel 等のファイルブロック）
- [ ] メディアブロック Phase 3（動画ブロック：MP4、WebM）
- [ ] クイック検索（Cmd+K）

### 将来的な拡張
- [ ] テーブル・データベース（構造化データ管理）
- [ ] 高度なブロック（コールアウト、トグル、To-do リスト）
- [ ] エクスポート（PDF・Markdown 形式）
- [ ] ダークモード・テーマ機能
- [ ] モバイル対応（レスポンシブ・PWA）

## ライセンス

MIT License