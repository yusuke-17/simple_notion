#!/bin/bash

# 開発環境の起動スクリプト

echo "🚀 Simple Notion 開発環境を起動中..."

# 環境変数ファイルをコピー
if [ ! -f .env ]; then
    echo "📁 .env ファイルを作成中..."
    cp .env.example .env
fi

# 既存のコンテナを停止
echo "� 既存のコンテナを停止中..."
docker-compose -f docker-compose.dev.yml down

# Dockerコンテナをビルド・起動
echo "🐳 Dockerコンテナをビルド・起動中..."
docker-compose -f docker-compose.dev.yml up --build -d

echo "⏳ サービスの起動を待機中..."
sleep 15

echo "✅ 開発環境の準備が完了しました！"
echo ""
echo "アクセスURL："
echo "  🌐 フロントエンド: http://localhost:5173"
echo "  🔗 バックエンドAPI: http://localhost:8080"
echo "  🗄️ PostgreSQL: localhost:5432"
echo ""
echo "ログの確認："
echo "  docker-compose -f docker-compose.dev.yml logs -f [service]"
echo ""
echo "サービス停止："
echo "  docker-compose -f docker-compose.dev.yml down"
