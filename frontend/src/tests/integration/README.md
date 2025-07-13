# インテグレーションテスト（結合テスト）

このディレクトリには、フロントエンドとバックエンドAPI間の結合テストが含まれています。

## セットアップ

### 前提条件

1. バックエンドサーバーが`http://localhost:8080`で稼働していること
2. PostgreSQLデータベースが稼働していること
3. 必要な依存関係がインストール済みであること

### バックエンドサーバーの起動

```bash
# プロジェクトルートから
docker-compose -f docker-compose.dev.yml up -d
```

### フロントエンド依存関係のインストール

```bash
cd frontend
npm install
```

## テストの実行

### 全ての結合テストを実行

```bash
npm run test:integration
```

### ウォッチモードで結合テストを実行

```bash
npm run test:integration:watch
```

### 特定のテストファイルのみ実行

```bash
# 認証フローのテストのみ
npm run test:integration -- auth-flow.test.tsx

# ドキュメント管理のテストのみ
npm run test:integration -- document-management.test.tsx

# ユーザーワークフローのテストのみ
npm run test:integration -- user-workflow.test.tsx
```

## テストファイル

### `auth-flow.test.tsx`
- ユーザー登録
- ログイン/ログアウト
- 認証状態の確認
- 無効な認証情報での失敗テスト

### `document-management.test.tsx`
- ドキュメントの作成、取得、更新、削除
- ドキュメント一覧の取得
- ドキュメントツリーの取得
- ドキュメントの移動

### `user-workflow.test.tsx`
- エンドツーエンドのユーザーワークフロー
- 階層構造のドキュメント管理
- セキュリティと権限のテスト
- 認証なしでのアクセス制限テスト

## テスト設定

### `setup.ts`
- テスト前後のクリーンアップ
- APIエンドポイントの定義
- テスト用ユーザーデータ
- APIリクエストヘルパー関数

### `vitest.config.integration.ts`
- 結合テスト専用の設定
- APIプロキシの設定
- テストタイムアウトの調整

## 注意事項

### データベースの状態
- 各テストは独立して実行されるように設計されています
- テスト実行前に、データベースの状態をクリーンにすることを推奨します

### テスト用データ
- テストでは一意のメールアドレスやタイトルを使用して、他のテストとの衝突を避けています
- 各テスト実行時にタイムスタンプを使用してユニークなデータを生成します

### パフォーマンス
- 結合テストは実際のAPIを呼び出すため、ユニットテストより時間がかかります
- CI/CDパイプラインでは適切なタイムアウト設定を行ってください

## トラブルシューティング

### バックエンドサーバーに接続できない場合
1. `docker-compose.dev.yml`でサービスが正常に起動しているか確認
2. ポート8080が他のプロセスに使用されていないか確認
3. `vitest.config.integration.ts`のAPIベースURLが正しいか確認

### データベース関連のエラー
1. PostgreSQLコンテナが起動しているか確認
2. マイグレーションが正常に実行されているか確認
3. データベース接続情報が正しいか確認

### CORS エラー
1. バックエンドのCORS設定で`http://localhost:5173`が許可されているか確認
2. `vitest.config.integration.ts`のプロキシ設定が正しいか確認

## CI/CD での実行

```yaml
# GitHub Actions の例
name: Integration Tests
on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_DB: notion_app
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Start Backend
        run: |
          cd backend
          go run cmd/server/main.go &
          sleep 10
          
      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm install
          
      - name: Run Integration Tests
        run: |
          cd frontend
          npm run test:integration
```
