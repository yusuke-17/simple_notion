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
- ✅ **Notionライクなブロックベースエディタ**
  - 🎯 複数ブロックタイプ：テキスト、見出し(H1-H3)、箇条書き、番号付きリスト、引用、コード
  - ⌨️ キーボードショートカット：`Enter`(新ブロック)、`Backspace`(削除)、`Cmd+↑/↓`(移動)、`/`(タイプ選択)
  - 🖱️ ホバーコントロール：追加、削除、ドラッグハンドルボタン
  - 🔄 リアルタイムブロック操作と移動
- ✅ 自動保存機能
- ✅ ゴミ箱機能（論理削除）
- ✅ ドラッグ&ドロップでの移動（ドキュメント）

## 📋 TODO: 不足機能（Notionとの機能比較）

### 🎯 優先度高（Core Features）

#### リッチテキスト編集
- [ ] **インライン装飾**: 太字、斜体、下線、取り消し線
- [ ] **テキスト色・背景色**: カラーパレット対応
- [ ] **リンク**: URL自動検出・インライン編集
- [ ] **メンション**: @ユーザー、@ページ参照
- [ ] **キーボードショートカット**: Cmd+B(太字)、Cmd+I(斜体)等

#### 画像・メディアブロック
- [ ] **画像ブロック**: アップロード、リサイズ、キャプション
- [ ] **ファイルブロック**: PDF、文書ファイル等のアップロード
- [ ] **動画ブロック**: 動画ファイルや埋め込み対応
- [ ] **音声ブロック**: 音声ファイル再生

#### データベース・テーブル機能
- [ ] **テーブルブロック**: セル編集、行列追加削除
- [ ] **データベースページ**: 構造化データ管理
- [ ] **プロパティ**: テキスト、数値、日付、選択肢等
- [ ] **フィルター・ソート**: データベース表示制御
- [ ] **ビュー**: テーブル、ボード、カレンダー、リスト

### 🔧 優先度中（Enhanced Features）

#### 高度なブロックタイプ
- [ ] **コールアウト**: 注意、警告、情報等のブロック
- [ ] **トグル**: 折りたたみ可能なブロック
- [ ] **区切り線**: 視覚的セパレーター
- [ ] **数式ブロック**: LaTeX、KaTeX対応
- [ ] **埋め込み**: YouTube、Twitter、GitHub等
- [ ] **To-doリスト**: チェックボックス付きタスク管理

#### ページカスタマイズ
- [ ] **ページアイコン**: 絵文字・画像アイコン設定
- [ ] **カバー画像**: ページ上部のヘッダー画像
- [ ] **ページ説明**: メタ情報・概要テキスト

#### 検索・ナビゲーション
- [ ] **全文検索**: ドキュメント・ブロック内容の横断検索
- [ ] **クイック検索**: Cmd+Kによる高速ナビゲーション
- [ ] **最近使用したページ**: アクセス履歴表示
- [ ] **お気に入り**: ブックマーク機能

### 📱 優先度中（User Experience）

#### エクスポート・インポート
- [ ] **エクスポート**: PDF、Markdown、HTML形式
- [ ] **インポート**: Markdown、CSV、Notionファイル
- [ ] **印刷対応**: ページレイアウト最適化

#### モバイル・レスポンシブ
- [ ] **スマートフォン対応**: タッチ操作最適化
- [ ] **タブレット対応**: 画面サイズ別レイアウト
- [ ] **PWA対応**: オフライン機能、インストール可能

### 🤝 優先度低（Collaboration）

#### コラボレーション機能
- [ ] **リアルタイム共同編集**: 複数ユーザー同時編集
- [ ] **コメント**: ブロック単位でのフィードバック
- [ ] **履歴・バージョン管理**: 変更履歴の確認・復元
- [ ] **権限管理**: 閲覧、編集、管理者権限

#### 通知・共有
- [ ] **ページ共有**: 外部リンク、埋め込み
- [ ] **通知システム**: 変更通知、メンション通知
- [ ] **ワークスペース**: チーム・組織単位管理

### ⚡ 優先度低（Advanced）

#### パフォーマンス・体験向上
- [ ] **オフライン対応**: ローカルキャッシュ、同期機能
- [ ] **キーボードナビゲーション**: 全機能キーボード操作
- [ ] **ショートカットカスタマイズ**: ユーザー定義ショートカット
- [ ] **テーマ**: ダークモード、カスタムカラー
- [ ] **多言語対応**: 国際化対応

#### 統合・API
- [ ] **外部サービス連携**: Google Drive、Slack等
- [ ] **Webhook**: 外部システムとの連携
- [ ] **公開API**: サードパーティ開発支援
- [ ] **プラグインシステム**: 機能拡張可能なアーキテクチャ

---

**実装推奨順序**: リッチテキスト編集 → 画像ブロック → 高度なブロックタイプ → 検索機能 → データベース機能

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

**ローカル開発環境:**
```bash
# 開発環境で起動（ホットリロード、デバッグモード）
docker-compose -f docker-compose.dev.yml up -d

# または
make dev  # Makefileにコマンドが定義されている場合
```

**本番環境:**
```bash
# 本番環境で起動（最適化ビルド、セキュリティ強化）
docker-compose up -d

# 環境変数ファイルを指定する場合
cp .env.production .env
docker-compose up -d
```

**その他の便利なコマンド:**
```bash
# 全サービスを一括起動
make up

# サービス停止
make stop          # サービス停止
make restart       # サービス再起動
make logs          # ログ表示
make ps            # コンテナ状況確認
make clean         # コンテナとイメージの削除

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

### 開発環境
- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:8080
- **PostgreSQL**: localhost:5432

### 本番環境
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8080（内部通信）
- **PostgreSQL**: Docker内部ネットワーク

## 環境の違い

| 項目 | 開発環境 | 本番環境 |
|------|----------|----------|
| **Docker Compose** | `docker-compose.dev.yml` | `docker-compose.yml` |
| **フロントエンド** | Vite開発サーバー（HMR対応）| Nginx静的配信 |
| **バックエンド** | Airホットリロード | 最適化済みバイナリ |
| **セキュリティ** | 開発重視 | 強化（read-only, no-new-privileges） |
| **ポート** | 5173（frontend）, 8080（backend） | 3000（frontend）, 8080（backend） |
| **環境変数** | `.env` | `.env.production` |
| **GIN_MODE** | debug | release |

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
├── frontend/                # React + TypeScript アプリケーション
│   ├── src/
│   │   ├── components/     # React コンポーネント
│   │   ├── stores/         # 状態管理 (Zustand)
│   │   ├── types/          # TypeScript 型定義
│   │   └── tests/          # テストファイル
│   └── package.json
├── backend/                # Go アプリケーション
│   ├── cmd/server/         # エントリーポイント
│   ├── internal/
│   │   ├── handlers/       # HTTP ハンドラー
│   │   ├── models/         # データモデル
│   │   ├── repository/     # データアクセス層
│   │   ├── middleware/     # ミドルウェア
│   │   └── config/         # 設定管理
│   ├── migrations/         # データベースマイグレーション
│   └── go.mod
├── docker-compose.yml      # 本番環境設定
├── docker-compose.dev.yml  # 開発環境設定
└── Makefile               # 開発用タスク
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

## トラブルシューティング

### 502 Bad Gateway エラー
ログイン画面で502エラーが発生する場合：

#### 1. 環境変数の確認
```bash
# フロントエンド/.envファイルの確認
cat frontend/.env
# VITE_API_BASE_URL=http://localhost:8080 が設定されているか確認
```

#### 2. バックエンドの稼働確認
```bash
# バックエンドのヘルスチェック
curl http://localhost:8080/api/health

# Docker環境での確認
docker compose logs backend
```

#### 3. サービス間通信の確認
```bash
# 全サービスの状態確認
docker compose ps

# nginxログの確認
docker compose logs frontend
```

#### 4. 一般的な解決方法
1. **Docker環境の再起動**
   ```bash
   docker compose down
   docker compose up --build -d
   ```

2. **ポート競合の確認**
   ```bash
   lsof -i :3000,8080,5432
   ```

3. **ブラウザのキャッシュクリア**
   - 開発者ツール > Network > Disable cache

### 開発時のよくある問題

#### フロントエンドがバックエンドに接続できない
- `VITE_API_BASE_URL`が正しく設定されているか確認
- CORSエラーの場合は、バックエンドのCORS設定を確認

#### データベース接続エラー
- PostgreSQLが起動しているか確認
- `DATABASE_URL`の設定が正しいか確認

## ライセンス

MIT License
