.PHONY: build up-backend up-frontend up stop clean logs dev dev-up dev-stop prod-up prod-stop up-db ps restart health migrate clean-containers test help build-dev build-prod clean-light rebuild install test-verbose test-coverage lint format deps-update deps-check watch check setup start-dev start quick-start restart-dev restart-prod fresh-dev fresh full-clean dev-fresh-install deploy ci pre-commit stop-all

# GoとReactのビルド
build:
	docker compose build

# 開発環境用のビルド
build-dev:
	docker compose -f docker-compose.dev.yml build

# 本番環境用のビルド
build-prod:
	docker compose build

# 開発環境での起動
dev-up:
	docker compose -f docker-compose.dev.yml up -d

# 開発環境での停止
dev-stop:
	docker compose -f docker-compose.dev.yml stop

# 本番環境での起動
prod-up:
	docker compose up -d

# 本番環境での停止
prod-stop:
	docker compose stop

# backendの起動（本番環境）
up-backend:
	docker compose up -d db backend

# frontendの起動（本番環境）
up-frontend:
	docker compose up -d frontend

# backendとfrontendの起動（本番環境・デフォルト）
up:
	docker compose up -d

# dockerの停止
stop:
	docker compose stop

# dockerのコンテナとイメージの削除
clean:
	docker compose down --rmi all --volumes --remove-orphans
	docker system prune -f

# ログの確認
logs:
	docker compose logs -f

# 開発用の起動（ログ表示）
dev:
	docker compose -f docker-compose.dev.yml up

# 開発環境のログ確認
dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

# データベースのみ起動
up-db:
	docker compose up -d db

# コンテナの状態確認
ps:
	docker compose ps

# サービスの再起動
restart:
	docker compose restart

# ヘルスチェック確認
health:
	docker compose ps
	@echo "\nDatabase health check:"
	docker compose exec db pg_isready -U postgres

# データベースマイグレーション実行
migrate:
	docker compose exec backend sh -c "ls /app/migrations 2>/dev/null || echo 'No migrations found'"

# 軽量な削除（ボリュームは保持）
clean-light:
	docker compose down
	docker compose rm -f

# コンテナのみ削除（イメージとボリュームは保持）
clean-containers:
	docker compose down --remove-orphans

# 強制リビルド
rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

# 依存関係のインストール
install:
	@echo "Installing dependencies..."
	cd frontend && npm install
	cd backend && go mod download && go mod tidy

# テスト実行
test:
	@echo "Running tests..."
	@echo "Frontend tests:"
	cd frontend && npm test
	@echo "Backend tests:"
	cd backend && go test ./...

# テスト実行（詳細出力）
test-verbose:
	@echo "Running tests with verbose output..."
	@echo "Frontend tests:"
	cd frontend && npm test -- --reporter=verbose
	@echo "Backend tests:"
	cd backend && go test -v ./...

# テストカバレッジ
test-coverage:
	@echo "Running tests with coverage..."
	@echo "Frontend coverage:"
	cd frontend && npm run test:coverage
	@echo "Backend coverage:"
	cd backend && go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out -o coverage.html

# コード品質チェック（リンター）
lint:
	@echo "Running linters..."
	@echo "Frontend lint:"
	cd frontend && npm run lint
	@echo "Backend lint:"
	cd backend && go vet ./... && golangci-lint run || echo "golangci-lint not installed, using go vet only"

# コードフォーマット
format:
	@echo "Formatting code..."
	@echo "Frontend format:"
	cd frontend && npm run lint:fix || echo "No lint:fix script found"
	@echo "Backend format:"
	cd backend && go fmt ./...

# 依存関係の更新
deps-update:
	@echo "Updating dependencies..."
	cd frontend && npm update
	cd backend && go get -u ./... && go mod tidy

# 依存関係の確認
deps-check:
	@echo "Checking dependencies..."
	@echo "Frontend dependencies:"
	cd frontend && npm audit
	@echo "Backend dependencies:"
	cd backend && go mod verify

# ファイル監視（開発用）
watch:
	@echo "Starting file watch mode (development)..."
	docker compose -f docker-compose.dev.yml up

# 総合的なコード品質チェック
check: lint test
	@echo "All checks passed! ✅"

# Pre-commit checks (can be run manually)
pre-commit:
	@echo "🔍 Running pre-commit checks..."
	@echo "This simulates what happens during git commit"
	@echo ""
	
	@echo "1. Frontend lint and format check..."
	@if [ -d "frontend" ]; then \
		cd frontend && \
		npm run lint && \
		npx tsc --noEmit && \
		echo "✅ Frontend checks passed"; \
	else \
		echo "⚠️  Frontend directory not found"; \
	fi
	@echo ""
	
	@echo "2. Backend format and vet check..."
	@if [ -d "backend" ]; then \
		cd backend && \
		if [ -n "$$(gofmt -l . | grep -v vendor)" ]; then \
			echo "❌ Go code is not formatted. Run 'make format' to fix."; \
			gofmt -l . | grep -v vendor; \
			exit 1; \
		fi && \
		go vet ./... && \
		go test -short ./... && \
		echo "✅ Backend checks passed"; \
	else \
		echo "⚠️  Backend directory not found"; \
	fi
	@echo ""
	
	@echo "3. Docker configuration check..."
	@if [ -f "docker-compose.yml" ]; then \
		docker compose -f docker-compose.yml config > /dev/null && \
		echo "✅ docker-compose.yml is valid"; \
	fi
	@if [ -f "docker-compose.dev.yml" ]; then \
		docker compose -f docker-compose.dev.yml config > /dev/null && \
		echo "✅ docker-compose.dev.yml is valid"; \
	fi
	@echo ""
	
	@echo "🎉 Pre-commit checks completed successfully!"
	@echo "Your changes are ready to commit! 🚀"

# Pre-push checks (comprehensive CI/CD simulation)
pre-push:
	@echo "🚀 Running comprehensive pre-push checks..."
	@echo "This simulates what happens in CI/CD pipeline"
	@echo ""
	
	@echo "1. Frontend comprehensive tests..."
	@if [ -d "frontend" ]; then \
		cd frontend && \
		npm ci > /dev/null 2>&1 && \
		npm run lint && \
		npx tsc --noEmit && \
		npm run test:coverage && \
		npm run build && \
		echo "✅ Frontend comprehensive tests passed"; \
	fi
	@echo ""
	
	@echo "2. Backend comprehensive tests..."
	@if [ -d "backend" ]; then \
		cd backend && \
		go mod download > /dev/null 2>&1 && \
		go fmt ./... && \
		go vet ./... && \
		go test -v -race -coverprofile=coverage.out ./... && \
		echo "✅ Backend comprehensive tests passed"; \
	fi
	@echo ""
	
	@echo "3. Security checks..."
	@echo "Checking for potential secrets in recent commits..."
	@if git log --oneline -n 5 | grep -i -E "(password|secret|key|token)" | grep -v -E "(SECRET_KEY|API_KEY)" > /dev/null; then \
		echo "⚠️  Potential secret information detected in recent commits"; \
	else \
		echo "✅ No obvious secrets detected"; \
	fi
	@echo ""
	
	@echo "4. GitHub Actions simulation (if act is available)..."
	@if command -v act > /dev/null 2>&1; then \
		echo "Running GitHub Actions dry-run..."; \
		act --list > /dev/null 2>&1 && \
		act --job frontend-tests -n > /dev/null 2>&1 && \
		act --job backend-tests -n > /dev/null 2>&1 && \
		echo "✅ GitHub Actions simulation passed"; \
	else \
		echo "ℹ️  act not installed, skipping GitHub Actions simulation"; \
		echo "   Install with: brew install act"; \
	fi
	@echo ""
	
	@echo "🎉 All pre-push checks completed successfully!"
	@echo "Your changes are ready to push! 🚀🚀🚀"

# CI/CD simulation (full pipeline)
ci:
	@echo "🎭 Running full CI/CD pipeline simulation..."
	@$(MAKE) pre-commit
	@echo ""
	@$(MAKE) pre-push
	@echo ""
	@echo "🏆 Full CI/CD simulation completed successfully!"
	@echo "This code is production ready! ✨"

# 開発環境のセットアップ（初回）
setup: install
	@echo "Setting up development environment..."
	docker compose -f docker-compose.dev.yml build
	@echo "Development environment setup complete! 🎉"

# ==============================
# 一括実行コマンド
# ==============================

# ビルド→起動（開発環境）
start-dev: build-dev dev-up
	@echo "Development environment started! 🚀"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:8080"

# ビルド→起動（本番環境）
start: build-prod prod-up
	@echo "Production environment started! 🚀"

# 最小限のセットアップで起動（開発環境）
quick-start:
	@echo "Quick starting development environment..."
	docker compose -f docker-compose.dev.yml up -d
	@echo "Quick start complete! ⚡"

# 停止→起動（開発環境）
restart-dev: dev-stop dev-up
	@echo "Development environment restarted! 🔄"

# 停止→起動（本番環境）
restart-prod: prod-stop prod-up
	@echo "Production environment restarted! 🔄"

# 完全リセット→ビルド→起動（開発環境）
fresh-dev: dev-stop clean-light build-dev dev-up
	@echo "Fresh development environment ready! ✨"

# 完全リセット→ビルド→起動（本番環境）
fresh: stop clean-light build-prod prod-up
	@echo "Fresh production environment ready! ✨"

# 完全停止→削除→クリーンアップ
full-clean: stop clean
	@echo "Complete cleanup finished! 🧹"

# 開発環境の完全リフレッシュ（依存関係も含む）
dev-fresh-install: dev-stop clean-light install build-dev dev-up
	@echo "Development environment completely refreshed! 🌟"

# 本番環境への一括デプロイ
deploy: test lint build-prod prod-up
	@echo "Deployment completed! 🚀"
	@echo "Running health check..."
	sleep 5
	$(MAKE) health

# CI/CD用の一括テスト・チェック
ci: install lint test
	@echo "CI checks completed successfully! ✅"

# ===== セキュリティ関連コマンド =====

# JWT秘密鍵を生成
generate-jwt-secret:
	@echo "Generating a secure JWT secret..."
	@JWT_SECRET=$$(openssl rand -base64 64); \
	echo "Generated JWT secret (copy this to your .env file):"; \
	echo "JWT_SECRET=$$JWT_SECRET"; \
	echo ""; \
	echo "You can also add this directly to your .env file by running:"; \
	echo "echo 'JWT_SECRET='$$JWT_SECRET >> .env"

# 環境変数設定のヘルプ
setup-env:
	@echo "Setting up environment variables..."
	@if [ ! -f .env ]; then \
		echo "Creating .env file from .env.example..."; \
		cp .env.example .env; \
		echo ".env file created! Please edit it to set your JWT_SECRET and other variables."; \
	else \
		echo ".env file already exists."; \
	fi
	@echo ""
	@echo "To generate a secure JWT secret, run: make generate-jwt-secret"
	@echo "Then copy the generated JWT_SECRET to your .env file."

# セキュリティチェック
security-check:
	@echo "Running security checks..."
	@if [ -f .env ]; then \
		if grep -q "CHANGE_THIS_TO_A_STRONG_RANDOM_KEY_IN_PRODUCTION" .env; then \
			echo "⚠️  WARNING: Default JWT_SECRET detected in .env file!"; \
			echo "Please run 'make generate-jwt-secret' and update your .env file."; \
			exit 1; \
		else \
			echo "✅ JWT_SECRET appears to be customized."; \
		fi; \
		if grep -q "password" .env; then \
			echo "⚠️  WARNING: Default passwords detected in .env file!"; \
			echo "Please update POSTGRES_PASSWORD to a strong password."; \
		fi; \
	else \
		echo "⚠️  WARNING: .env file not found!"; \
		echo "Please run 'make setup-env' to create your environment configuration."; \
		exit 1; \
	fi
	@echo "Security check completed! 🔒"

# 開発者向けの一括チェック（コミット前）
pre-commit: format lint test security-check
	@echo "Pre-commit checks completed! Ready to commit! 💫"

# 全ての環境を停止
stop-all:
	@echo "Stopping all environments..."
	docker compose -f docker-compose.dev.yml stop
	docker compose stop
	@echo "All environments stopped! 🛑"

# ヘルプ
help:
	@echo "利用可能なコマンド:"
	@echo ""
	@echo "=== 🚀 一括実行コマンド（よく使用） ==="
	@echo "  start-dev    - ビルド→開発環境起動"
	@echo "  start        - ビルド→本番環境起動"
	@echo "  quick-start  - 最小限のセットアップで開発環境起動"
	@echo "  restart-dev  - 開発環境の再起動"
	@echo "  restart-prod - 本番環境の再起動"
	@echo "  fresh-dev    - 開発環境の完全リフレッシュ（停止→削除→ビルド→起動）"
	@echo "  fresh        - 本番環境の完全リフレッシュ"
	@echo "  deploy       - 本番環境への一括デプロイ（テスト→リント→ビルド→起動）"
	@echo "  stop-all     - 全ての環境を停止"
	@echo "  full-clean   - 完全停止→削除→クリーンアップ"
	@echo ""
	@echo "=== 🛠️ 開発者向け一括コマンド ==="
	@echo "  pre-commit   - コミット前チェック（フォーマット→リント→テスト）"
	@echo "  ci           - CI/CD用チェック（インストール→リント→テスト）"
	@echo "  dev-fresh-install - 開発環境の完全リフレッシュ（依存関係も含む）"
	@echo ""
	@echo "=== 初期セットアップ ==="
	@echo "  setup        - 開発環境の初期セットアップ（依存関係インストール + ビルド）"
	@echo "  install      - 依存関係のインストール"
	@echo ""
	@echo "=== 開発環境 ==="
	@echo "  dev-up       - 開発環境での起動（HMR対応）"
	@echo "  dev-stop     - 開発環境での停止"
	@echo "  dev          - 開発環境での起動（ログ表示）"
	@echo "  dev-logs     - 開発環境のログ確認"
	@echo "  build-dev    - 開発環境用のビルド"
	@echo "  watch        - ファイル監視モード（開発用）"
	@echo ""
	@echo "=== 本番環境 ==="
	@echo "  prod-up      - 本番環境での起動"
	@echo "  prod-stop    - 本番環境での停止"
	@echo "  build-prod   - 本番環境用のビルド"
	@echo ""
	@echo "=== テスト ==="
	@echo "  test         - フロントエンド・バックエンドのテスト実行"
	@echo "  test-verbose - テスト実行（詳細出力）"
	@echo "  test-coverage - テストカバレッジ付きでテスト実行"
	@echo ""
	@echo "=== コード品質 ==="
	@echo "  lint         - コード品質チェック（リンター実行）"
	@echo "  format       - コードフォーマット"
	@echo "  check        - 総合的なコード品質チェック（lint + test）"
	@echo ""
	@echo "=== セキュリティ ==="
	@echo "  generate-jwt-secret - 安全なJWT秘密鍵を生成"
	@echo "  setup-env    - 環境変数ファイル（.env）の初期設定"
	@echo "  security-check - セキュリティ設定の確認"
	@echo ""
	@echo "=== 依存関係管理 ==="
	@echo "  deps-update  - 依存関係の更新"
	@echo "  deps-check   - 依存関係の確認・監査"
	@echo ""
	@echo "=== 共通 ==="
	@echo "  build        - GoとReactのビルド（本番環境）"
	@echo "  up-backend   - backendの起動"
	@echo "  up-frontend  - frontendの起動"
	@echo "  up           - backendとfrontendの起動（本番環境・デフォルト）"
	@echo "  stop         - dockerの停止"
	@echo "  clean        - dockerのコンテナとイメージの削除"
	@echo "  logs         - ログの確認"
	@echo "  up-db        - データベースのみ起動"
	@echo "  ps           - コンテナの状態確認"
	@echo "  restart      - サービスの再起動"
	@echo "  health       - ヘルスチェック確認"
	@echo "  migrate      - データベースマイグレーション実行"
	@echo "  clean-light  - 軽量な削除（ボリュームは保持）"
	@echo "  clean-containers - コンテナのみ削除（イメージとボリュームは保持）"
	@echo "  rebuild      - 強制リビルド"
