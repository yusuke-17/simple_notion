.PHONY: all drop test

# デフォルト: ビルド→起動→ログ表示（一括）
all:
	@echo "🚀 開発環境をビルド・起動中..."
	@echo "  Frontend (Svelte): http://localhost:5174"
	@echo "  Backend API:       http://localhost:8080"
	@echo "  MinIO Console:     http://localhost:9001"
	@echo ""
	docker compose -f docker-compose.dev.yml up --build

# 完全クリーンアップ（このプロジェクトのみ）
drop:
	docker compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans
	@echo "🧹 完全にクリーンアップしました！"

# テスト実行（frontend-svelte + backend）
test:
	@echo "🧪 テストを実行中..."
	@echo ""
	@echo "=== Frontend (Svelte) ==="
	cd frontend-svelte && pnpm vitest run
	@echo ""
	@echo "=== Backend (Go) ==="
	cd backend && go test ./...
	@echo ""
	@echo "✅ 完了！"
