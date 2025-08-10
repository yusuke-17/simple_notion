.PHONY: build up-backend up-frontend up stop clean logs dev up-db ps restart health migrate shell-db shell-backend clean-containers test help

# GoとReactのビルド
build:
	docker-compose build

# backendの起動
up-backend:
	docker-compose up -d db backend

# frontendの起動  
up-frontend:
	docker-compose up -d frontend

# backendとfrontendの起動
up:
	docker-compose up -d

# dockerの停止
stop:
	docker-compose stop

# dockerのコンテナとイメージの削除
clean:
	docker-compose down --rmi all --volumes --remove-orphans
	docker system prune -f

# ログの確認
logs:
	docker-compose logs -f

# 開発用の起動（ログ表示）
dev:
	docker-compose up

# データベースのみ起動
up-db:
	docker-compose up -d db

# コンテナの状態確認
ps:
	docker-compose ps

# サービスの再起動
restart:
	docker-compose restart

# ヘルスチェック確認
health:
	docker-compose ps
	@echo "\nDatabase health check:"
	docker-compose exec db pg_isready -U postgres

# データベースマイグレーション実行
migrate:
	docker-compose exec backend sh -c "ls /app/migrations 2>/dev/null || echo 'No migrations found'"

# データベースシェルに接続
shell-db:
	docker-compose exec db psql -U postgres -d notion_app

# バックエンドコンテナのシェルに接続
shell-backend:
	docker-compose exec backend sh

# 軽量な削除（ボリュームは保持）
clean-light:
	docker-compose down
	docker-compose rm -f

# コンテナのみ削除（イメージとボリュームは保持）
clean-containers:
	docker-compose down --remove-orphans

# 強制リビルド
rebuild:
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# トラブルシューティング用コマンド
troubleshoot:
	@echo "=== 502 Bad Gateway トラブルシューティング ==="
	@echo "1. サービス状態の確認:"
	docker-compose ps
	@echo "\n2. バックエンドのヘルスチェック:"
	@curl -f http://localhost:8080/api/health || echo "❌ バックエンドに接続できません"
	@echo "\n3. 環境変数の確認:"
	@echo "VITE_API_BASE_URL=$(shell grep VITE_API_BASE_URL frontend/.env 2>/dev/null || echo '未設定')"
	@echo "\n4. ポートの使用状況:"
	@lsof -ti :3000,8080,5432 2>/dev/null && echo "ポート競合の可能性があります" || echo "ポートは空いています"

# ログの詳細確認
logs-detailed:
	@echo "=== フロントエンドログ ==="
	docker-compose logs --tail=20 frontend
	@echo "\n=== バックエンドログ ==="
	docker-compose logs --tail=20 backend
	@echo "\n=== データベースログ ==="
	docker-compose logs --tail=20 db

# 環境変数の確認
check-env:
	@echo "=== 環境変数の確認 ==="
	@echo "Frontend (.env):"
	@cat frontend/.env 2>/dev/null || echo "frontend/.envが見つかりません"
	@echo "\nRoot (.env):"
	@cat .env 2>/dev/null || echo "ルートの.envが見つかりません"

# ヘルプ
help:
	@echo "利用可能なコマンド:"
	@echo "  build        - GoとReactのビルド"
	@echo "  up-backend   - backendの起動"
	@echo "  up-frontend  - frontendの起動"
	@echo "  up           - backendとfrontendの起動"
	@echo "  stop         - dockerの停止"
	@echo "  clean        - dockerのコンテナとイメージの削除"
	@echo "  logs         - ログの確認"
	@echo "  dev          - 開発用の起動（ログ表示）"
	@echo "  up-db        - データベースのみ起動"
	@echo "  ps           - コンテナの状態確認"
	@echo "  restart      - サービスの再起動"
	@echo "  health       - ヘルスチェック確認"
	@echo "  migrate      - データベースマイグレーション実行"
	@echo "  shell-db     - データベースシェルに接続"
	@echo "  shell-backend - バックエンドコンテナのシェルに接続"
	@echo "  clean-light  - 軽量な削除（ボリュームは保持）"
	@echo "  clean-containers - コンテナのみ削除（イメージとボリュームは保持）"
	@echo "  rebuild      - 強制リビルド"
	@echo "  troubleshoot - 502エラーのトラブルシューティング"
	@echo "  logs-detailed - 詳細ログの確認"
	@echo "  check-env    - 環境変数の確認"
