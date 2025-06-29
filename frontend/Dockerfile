# フロントエンド用Dockerfile
FROM node:22-alpine

WORKDIR /app

# package.jsonをコピーして依存関係をインストール
COPY package*.json ./
RUN npm install

# ソースコードをコピー
COPY . .

# 開発サーバーを起動
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
