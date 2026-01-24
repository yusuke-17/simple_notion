---
name: debug
description: Simple Notionプロジェクトのデバッグを支援します。問題の切り分け、ログ確認、よくあるエラーの解決策を提示。
argument-hint: "[frontend|backend|db|storage|all|status|logs]"
allowed-tools: Bash(docker:*, docker-compose:*, curl:*, pnpm:*, go:*, psql:*, cat:*, tail:*, head:*, grep:*)
---

# デバッグ支援スキル

Simple Notionプロジェクトのデバッグを効率的に行うためのスキルです。

## 使用方法

| コマンド | 説明 |
|---------|------|
| `/debug` または `/debug status` | 全サービスの状態を一括チェック |
| `/debug frontend` または `/debug fe` | フロントエンドの問題を診断 |
| `/debug backend` または `/debug be` | バックエンドの問題を診断 |
| `/debug db` | データベース接続を診断 |
| `/debug storage` | RustFS/S3ストレージを診断 |
| `/debug logs [service]` | 指定サービスのログを表示 |
| `/debug all` | 全サービスの詳細診断 |

## サービス構成

| サービス | ポート | 用途 |
|---------|--------|------|
| **frontend** | 5174 | Svelte 5 + Vite フロントエンド |
| **backend** | 8080 | Go + Air バックエンドAPI |
| **db** | 5432 | PostgreSQL データベース |
| **rustfs** | 9000/9001 | RustFS S3互換ストレージ |

## 実行手順

### 1. 引数の解析

`$ARGUMENTS` から診断対象を判定:
- `status`: 全サービスの状態確認（デフォルト）
- `frontend` / `fe`: フロントエンド診断
- `backend` / `be`: バックエンド診断
- `db`: データベース診断
- `storage`: ストレージ診断
- `logs [service]`: ログ確認
- `all`: 全サービス詳細診断

---

## 2. サービス状態確認（status）

### 2.1 Dockerコンテナ状態確認

```bash
docker-compose -f docker-compose.dev.yml ps
```

**期待される出力**:
- 全サービスが `Up` または `running` 状態
- ヘルスチェックが `healthy` 状態

### 2.2 各サービスのヘルスチェック

**バックエンドAPI**:
```bash
curl -s http://localhost:8080/api/health
```
期待レスポンス: `{"status":"ok"}`

**RustFS/S3**:
```bash
curl -s http://localhost:9000/health/live
```

**PostgreSQL**:
```bash
docker exec -it simple_notion-db-1 pg_isready -U postgres
```

---

## 3. フロントエンド診断（frontend）

### 3.1 Vite開発サーバー確認

```bash
curl -s http://localhost:5174 | head -20
```

### 3.2 型チェック

```bash
cd frontend && pnpm check
```

### 3.3 よくあるフロントエンドエラー

| エラーパターン | 原因 | 解決策 |
|---------------|------|--------|
| `Failed to fetch` | バックエンドに接続できない | バックエンドが起動しているか確認。CORS設定を確認 |
| `ECONNREFUSED 127.0.0.1:8080` | APIプロキシエラー | `vite.config.ts`のプロキシ設定を確認 |
| HMR更新されない | Viteホットリロード問題 | `pnpm dev`を再起動、またはブラウザキャッシュクリア |
| `$state is not defined` | Svelte 5 Runes未対応 | `<script lang="ts">`を確認、Svelte 5構文を使用 |
| `Cannot find module '$lib/...'` | パスエイリアス問題 | `svelte.config.js`と`tsconfig.json`のエイリアス設定確認 |

### 3.4 API接続テスト

```bash
# フロントエンドからバックエンドへの接続確認
curl -s http://localhost:5174/api/health
```

---

## 4. バックエンド診断（backend）

### 4.1 サービス状態確認

```bash
docker logs simple_notion-backend-1 --tail 50
```

### 4.2 ビルドエラー確認

```bash
# Airのビルドログを確認
docker logs simple_notion-backend-1 2>&1 | grep -i "error\|failed\|panic"
```

### 4.3 テスト実行

```bash
cd backend && go test -v ./...
```

### 4.4 よくあるバックエンドエラー

| エラーパターン | 原因 | 解決策 |
|---------------|------|--------|
| `database connection refused` | DB接続失敗 | DBコンテナが起動しているか確認 |
| `pq: password authentication failed` | DB認証エラー | `.env`または`docker-compose.dev.yml`の認証情報確認 |
| `failed to create minio client` | S3接続失敗 | RustFSコンテナが起動しているか確認 |
| `JWT token is invalid` | 認証トークン問題 | クッキーをクリアして再ログイン |
| `syntax error` | Goコンパイルエラー | `go build ./...`でエラー箇所を特定 |

### 4.5 ログレベル確認

バックエンドは5段階のログレベルをサポート:
- `DEBUG`: 詳細デバッグ情報
- `INFO`: 一般的な情報
- `WARN`: 警告
- `ERROR`: エラー
- `FATAL`: 致命的エラー

環境変数`LOG_LEVEL`で制御可能。開発環境ではデフォルト`DEBUG`。

---

## 5. データベース診断（db）

### 5.1 接続確認

```bash
docker exec -it simple_notion-db-1 pg_isready -U postgres
```

### 5.2 PostgreSQL接続

```bash
docker exec -it simple_notion-db-1 psql -U postgres -d notion_app -c "SELECT 1;"
```

### 5.3 テーブル確認

```bash
docker exec -it simple_notion-db-1 psql -U postgres -d notion_app -c "\dt"
```

### 5.4 よくあるDBエラー

| エラーパターン | 原因 | 解決策 |
|---------------|------|--------|
| `connection refused` | DBが起動していない | `docker-compose up -d db`で起動 |
| `database "notion_app" does not exist` | DB未作成 | マイグレーション実行: `cd backend && make migrate-up` |
| `relation "users" does not exist` | テーブル未作成 | マイグレーション実行 |
| `FATAL: password authentication failed` | 認証エラー | `POSTGRES_PASSWORD`環境変数を確認 |

---

## 6. ストレージ診断（storage）

### 6.1 RustFSヘルスチェック

```bash
curl -s http://localhost:9000/health/live
```

### 6.2 Web Console確認

RustFS Web Console: http://localhost:9001
- ユーザー名: `rustfsadmin`
- パスワード: `rustfsadmin`

### 6.3 バケット確認

```bash
# バックエンドのログでバケット作成を確認
docker logs simple_notion-backend-1 2>&1 | grep -i "bucket"
```

### 6.4 よくあるストレージエラー

| エラーパターン | 原因 | 解決策 |
|---------------|------|--------|
| `failed to ensure bucket` | バケット作成失敗 | RustFSが起動しているか確認 |
| `Access Denied` | 認証情報エラー | `S3_ACCESS_KEY`、`S3_SECRET_KEY`を確認 |
| `署名付きURL取得失敗` | 外部エンドポイント問題 | `S3_EXTERNAL_ENDPOINT`設定を確認 |
| `file upload failed` | アップロードエラー | ファイルサイズ制限(10MB)を確認 |

---

## 7. ログ確認（logs）

### 7.1 全サービスのログ

```bash
docker-compose -f docker-compose.dev.yml logs -f --tail 100
```

### 7.2 特定サービスのログ

```bash
# フロントエンド
docker-compose -f docker-compose.dev.yml logs -f frontend --tail 100

# バックエンド
docker-compose -f docker-compose.dev.yml logs -f backend --tail 100

# データベース
docker-compose -f docker-compose.dev.yml logs -f db --tail 100

# RustFS
docker-compose -f docker-compose.dev.yml logs -f rustfs --tail 100
```

### 7.3 エラーのみフィルタ

```bash
docker-compose -f docker-compose.dev.yml logs backend 2>&1 | grep -i "error\|warn\|fatal"
```

---

## 8. 全サービス詳細診断（all）

以下の順序で全サービスを診断:

1. **Dockerコンテナ状態確認**
2. **データベース接続確認**
3. **RustFS接続確認**
4. **バックエンドヘルスチェック**
5. **フロントエンドアクセス確認**
6. **API疎通確認**

---

## 9. トラブルシューティングチェックリスト

問題発生時は以下の順序で確認:

### Step 1: Docker環境確認
- [ ] `docker-compose -f docker-compose.dev.yml ps` で全コンテナが起動しているか
- [ ] コンテナのヘルスチェックが全て`healthy`か

### Step 2: ネットワーク確認
- [ ] `curl http://localhost:8080/api/health` でバックエンドに到達できるか
- [ ] `curl http://localhost:5174` でフロントエンドに到達できるか

### Step 3: ログ確認
- [ ] 各サービスのログにエラーがないか
- [ ] バックエンドの`ERROR`や`FATAL`ログを確認

### Step 4: 依存関係確認
- [ ] DBがバックエンドより先に起動しているか
- [ ] RustFSがバックエンドより先に起動しているか

---

## 10. 環境再構築コマンド

問題が解決しない場合の再構築手順:

```bash
# 1. 全コンテナ停止・削除
docker-compose -f docker-compose.dev.yml down

# 2. ボリューム含めて完全削除（データも消える）
docker-compose -f docker-compose.dev.yml down -v

# 3. 再ビルド＆起動
docker-compose -f docker-compose.dev.yml up -d --build

# 4. ログを確認しながら起動を待つ
docker-compose -f docker-compose.dev.yml logs -f
```

---

## 11. 診断結果のレポート形式

診断完了後、以下の形式で結果を報告:

1. **サービス状態サマリー**: 各サービスのUp/Down状態
2. **検出された問題**: エラーや警告のリスト
3. **推奨される対処**: 具体的な解決手順
4. **追加確認が必要な項目**: さらなる調査が必要な点

---

## 12. 関連ファイル

| ファイル | 用途 |
|---------|------|
| `docker-compose.dev.yml` | Docker開発環境設定 |
| `frontend/vite.config.ts` | Vite設定（プロキシ含む） |
| `backend/internal/app/logger.go` | バックエンドログ設定 |
| `backend/internal/config/config.go` | バックエンド環境設定 |
| `backend/internal/app/router.go` | APIルーティング（ヘルスチェック含む） |
