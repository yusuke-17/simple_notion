# Simple Notion Clone

個人利用向けのシンプルなNotionクローンアプリケーションです。

## 技術スタック

### フロントエンド
- **React v19.1** + **TypeScript 5.8**
- **Vite v7** (ビルドツール)
- **pnpm v10.12.4+** (パッケージマネージャー)
- **Tailwind CSS v4.1** + **Radix UI** (スタイリング・UIコンポーネント)
- **TipTap v3.6** (リッチテキストエディター)
- **Zustand v5** (状態管理)
- **React Router v7** (ルーティング)

### バックエンド
- **Go 1.25** (フレームワークなし)
- **PostgreSQL 18** (データベース)
- **JWT** + **Cookie** (認証)

## 機能

### 🎯 コア機能
- ✅ ユーザー認証（登録/ログイン/ログアウト）
- ✅ ドキュメント管理（作成/編集/削除/復元）
- ✅ 階層構造（親子関係のツリー構造）
- ✅ ゴミ箱機能（論理削除）
- ✅ ドラッグ&ドロップでの移動

### 📝 リッチテキストエディター
- ✅ **Notionライクなブロックベースエディター**
  - 複数ブロックタイプ：テキスト、見出し(H1-H3)、箇条書き、番号付きリスト、引用、コード、**画像**
  - キーボードショートカット：`Enter`(新ブロック)、`Backspace`(削除)、`Cmd+↑/↓`(移動)、`/`(タイプ選択)
  - ホバーコントロール：追加、削除、ドラッグハンドルボタン
  - リアルタイムブロック操作と移動
- ✅ **インライン装飾機能**
  - 太字、斜体、下線、取り消し線
  - テキスト色・背景色（Notion風10色パレット対応）
  - キーボードショートカット（`Cmd+B`, `Cmd+I`等）
- ✅ **高度なエディター機能**
  - 自動保存（リアルタイム）
  - 安定したコンテンツ同期
  - 最適化されたUX/UI

### 🖼️ 画像ブロック機能
- ✅ **画像アップロード & 管理**
  - ドラッグ&ドロップアップロード対応
  - ファイル選択ダイアログ
  - 対応形式：JPEG、PNG、GIF、WebP（最大5MB）
  - セキュア認証付きアップロードAPI
- ✅ **リッチな画像編集機能**
  - リアルタイムプレビュー表示
  - キャプション編集（画像説明文）
  - Alt属性編集（アクセシビリティ対応）
  - 画像情報表示（ファイル名、サイズ、寸法）
- ✅ **ユーザビリティ**
  - エラーハンドリング（ファイル形式・サイズ制限）
  - ワンクリック画像削除
  - レスポンシブ表示（自動リサイズ）

## 今後の拡張予定

### 優先度高
- [x] **メディアブロック Phase 1**: ✅ 画像ブロック完了（ドラッグ&ドロップアップロード、プレビュー、キャプション編集）
- [ ] **メディアブロック Phase 2**: ファイルブロック対応（PDF、Word、Excel等）
- [ ] **メディアブロック Phase 3**: 動画ブロック対応（MP4、WebM等の動画アップロード・再生）
- [ ] **リンク機能**: URL自動検出・インライン編集
- [ ] **検索機能**: 全文検索・クイック検索（Cmd+K）

### 優先度中  
- [ ] **テーブル・データベース**: 構造化データ管理
- [ ] **高度なブロック**: コールアウト・トグル・To-doリスト
- [ ] **エクスポート**: PDF・Markdown形式対応

### 将来的な拡張
- [ ] **コラボレーション**: リアルタイム共同編集
- [ ] **モバイル対応**: レスポンシブ・PWA
- [ ] **テーマ機能**: ダークモード・カスタマイズ

## 🔒 セキュリティ設定

**重要**: このアプリケーションを使用する前に、必ずセキュリティ設定を適切に行ってください。

### JWT秘密鍵の設定
JWT秘密鍵はユーザー認証において極めて重要な要素です。デフォルト値のまま使用すると、セキュリティ上の深刻な脆弱性となります。

#### 1. 安全なJWT秘密鍵の生成
```bash
# 方法1: Makefileコマンドを使用（推奨）
make generate-jwt-secret

# 方法2: opensslを直接使用
openssl rand -base64 64
```

#### 2. 環境変数ファイルの作成
```bash
# .env.exampleから.envファイルを作成
make setup-env

# または手動でコピー
cp .env.example .env
```

#### 3. .envファイルの編集
生成したJWT秘密鍵を`.env`ファイルの`JWT_SECRET`に設定します：
```bash
JWT_SECRET=your_generated_secure_jwt_secret_here
```

#### 4. セキュリティチェック
```bash
# セキュリティ設定の確認
make security-check
```

### 📋 セキュリティチェックリスト
- [ ] JWT_SECRETに強力なランダム文字列（最低32文字）を設定
- [ ] POSTGRES_PASSWORDに強力なパスワードを設定
- [ ] .envファイルがGitにコミットされていないことを確認
- [ ] 本番環境では`ENVIRONMENT=production`に設定
- [ ] 本番環境では`COOKIE_SECURE=true`に設定

### ⚠️ セキュリティ注意事項
1. **JWT_SECRET**: デフォルト値は絶対に使用しない
2. **.envファイル**: Gitリポジトリにコミットしない（.gitignoreに含まれています）
3. **パスワード**: 本番環境では強力なパスワードを使用
4. **HTTPS**: 本番環境では必ずHTTPSを使用
5. **定期更新**: JWT秘密鍵とパスワードは定期的に更新

## 開発環境セットアップ

### 必要な環境
- **Node.js v24.12+**
- **pnpm v10.12.4+** (パッケージマネージャー)
- **Go 1.25+**  
- **Docker & Docker Compose**

### 1. プロジェクトクローン
```bash
git clone <repository-url>
cd simple_notion
```

### 1.1. pnpmのインストール (初回のみ)
```bash
# macOS (Homebrew)
brew install pnpm

# npm経由でインストール
npm install -g pnpm

# Corepack経由でインストール (Node.js v16.13+)
corepack enable
corepack prepare pnpm@latest --activate

# バージョン確認
pnpm --version
```

### 2. 開発環境のセットアップ

#### 環境変数の設定
```bash
# 開発環境用
cp .env.example .env

# 本番環境用
cp .env.production .env
# その後、適切なパスワードとJWT秘密鍵を設定
```

**重要:** 本番環境では必ず以下を変更してください：
- `POSTGRES_PASSWORD`: 強力なパスワードを設定
- `JWT_SECRET`: 長いランダムな文字列を設定

#### Docker Composeで起動

**開発環境（推奨）:**
```bash
# 開発環境で起動（ホットリロード、デバッグモード）
make dev

# または直接実行
docker-compose -f docker-compose.dev.yml up -d
```

**本番環境:**
```bash
# 本番環境で起動（最適化ビルド、セキュリティ強化）
make up

# 環境変数ファイルを指定する場合
cp .env.production .env && make up
```

**便利なコマンド:**
```bash
make dev           # 開発環境起動
make stop          # サービス停止
make restart       # サービス再起動
make logs          # ログ表示
make clean         # コンテナとイメージ削除
make fresh-dev     # クリーンな開発環境構築
```

## 🔍 開発品質管理

### Git Hooks（自動実行）
コミット・プッシュ時に自動でコード品質チェックが実行されます：

```bash
# コミット時: 軽量チェック（ESLint、型チェック等）
# プッシュ時: 包括チェック（全テスト、カバレッジ等）
```

### 手動チェックコマンド
```bash
make test          # テスト実行
make lint          # リント・フォーマット
make test-coverage # カバレッジレポート
make ci            # 完全なCI/CDチェック
```

### 緊急時のスキップ
```bash
git commit --no-verify  # Pre-commitスキップ
git push --no-verify    # Pre-pushスキップ
```

### 3. 個別に開発する場合

#### データベースのみDockerで起動
```bash
docker-compose up -d db
```

#### フロントエンド開発
```bash
cd frontend
pnpm install
pnpm dev
```

#### バックエンド開発
```bash
cd backend
go mod tidy
go run cmd/server/main.go
```

## アクセス

### 開発環境
- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:8080

### 本番環境
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: 内部通信

## 🌍 環境設定

| 項目 | 開発環境 | 本番環境 |
|------|----------|----------|
| **起動コマンド** | `make dev` | `make up` |
| **Docker設定** | `docker-compose.dev.yml` | `docker-compose.yml` |
| **フロントエンド** | Vite開発サーバー（HMR） | Nginx静的配信 |
| **バックエンド** | Airホットリロード | 最適化済みバイナリ |
| **ポート** | 5173（frontend）, 8080（backend） | 3000（frontend）, 8080（backend） |
| **環境変数** | `.env` | `.env.production` |

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

### 画像・メディア
- `POST /api/upload/image` - 画像ファイルアップロード（認証必須、最大5MB）
- `GET /api/uploads/{filename}` - アップロード画像の配信

## テスト実行

### フロントエンド
```bash
cd frontend
pnpm test
pnpm test:ui  # UI付きテスト
```

### バックエンド
```bash
cd backend
go test ./...
```

## プロジェクト構造

### 関数型分離アーキテクチャ

```
simple_notion/
├── frontend/                # React + TypeScript（関数型分離設計）
│   ├── src/
│   │   ├── components/     # View層（UIレンダリング専用）
│   │   ├── hooks/          # ビジネスロジック層
│   │   ├── utils/          # 純粋関数層
│   │   ├── stores/         # 状態管理 (Zustand)
│   │   ├── types/          # TypeScript 型定義
│   │   └── tests/          # テストファイル
│   └── package.json
├── backend/                # Go アプリケーション（Clean Architecture）
│   ├── cmd/server/         # エントリーポイント
│   ├── internal/
│   │   ├── app/           # アプリケーション設定・ライフサイクル
│   │   ├── handlers/      # HTTP ハンドラー
│   │   ├── services/      # ビジネスロジック層
│   │   ├── repository/    # データアクセス層
│   │   ├── models/        # データモデル
│   │   ├── middleware/    # ミドルウェア
│   │   └── config/        # 設定管理
│   ├── migrations/        # データベースマイグレーション
│   └── go.mod
├── .github/               # GitHub Actions CI/CD
├── .husky/               # Git Hooks設定
├── docker-compose.yml    # 本番環境設定
├── docker-compose.dev.yml # 開発環境設定
└── Makefile             # 開発用タスク
```

## ⚡ 開発のポイント

### アーキテクチャ
- **フロントエンド**: 関数型分離パターン（View↔Hook↔Utils）
- **バックエンド**: Clean Architecture（Handler→Service→Repository）
- **リアルタイム自動保存**: 最適化されたdebounce処理

### パフォーマンス
- 個人利用想定（100-500ドキュメント規模）
- TipTapエディターの安定性向上
- GPU加速とメモリ効率化

### セキュリティ
- JWT認証（24時間有効）+ Cookie
- パスワードハッシュ化（bcrypt）
- CORS・XSS対策

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 502 Bad Gateway エラー
```bash
# 環境変数の確認
cat frontend/.env  # VITE_API_BASE_URL=http://localhost:8080

# サービス再起動
make restart

# 完全リセット
make clean && make dev
```

#### 接続エラー
```bash
# サービス状態確認
make ps

# ログ確認
make logs

# ポート競合確認
lsof -i :3000,8080,5432
```

#### 開発環境リセット
```bash
make fresh-dev    # クリーンな開発環境構築
```

## 📦 パッケージ管理

このプロジェクトは**pnpm**を採用しています。

### 基本コマンド
```bash
# フロントエンド開発
cd frontend
pnpm install          # 依存関係インストール
pnpm dev             # 開発サーバー起動
pnpm build           # ビルド実行
pnpm test            # テスト実行

# バックエンド開発  
cd backend
go mod tidy          # 依存関係整理
go run cmd/server/main.go  # サーバー起動
go test ./...        # テスト実行
```

### 注意事項
- ❌ `npm install` は使用しない（pnpmを使用）
- ✅ 隠れた依存関係の防止により安全なビルド
- ✅ 高速インストール・ディスク容量削減

3. **ブラウザのキャッシュクリア**
   - 開発者ツール > Network > Disable cache

### 開発時のよくある問題

#### フロントエンドがバックエンドに接続できない
- `VITE_API_BASE_URL`が正しく設定されているか確認
- CORSエラーの場合は、バックエンドのCORS設定を確認

#### データベース接続エラー
- PostgreSQLが起動しているか確認
- データベース設定が正しいか確認

## ライセンス

MIT License
