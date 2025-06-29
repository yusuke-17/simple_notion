#!/bin/bash

# 開発環境の起動スクリプト

echo "🚀 Simple Notion 開発環境を起動中..."

# 環境変数ファイルをコピー
if [ ! -f .env ]; then
    echo "📁 .env ファイルを作成中..."
    cp .env.example .env
fi

# Dockerコンテナの起動
echo "🐳 Dockerコンテナを起動中..."
docker-compose up -d db

# データベースの起動待機
echo "⏳ データベースの起動を待機中..."
sleep 10

# フロントエンドの依存関係インストール（まだ未完了の場合）
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 フロントエンド依存関係をインストール中..."
    cd frontend && npm install --legacy-peer-deps && cd ..
fi

echo "✅ 開発環境の準備が完了しました！"
echo ""
echo "次のコマンドで各サービスを起動してください："
echo "  フロントエンド: cd frontend && npm run dev"
echo "  バックエンド: cd backend && go run cmd/server/main.go"
echo ""
echo "アクセスURL："
echo "  フロントエンド: http://localhost:5173"
echo "  バックエンドAPI: http://localhost:8080"
echo "  PostgreSQL: localhost:5432"
