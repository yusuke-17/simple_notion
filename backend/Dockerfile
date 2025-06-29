# バックエンド用Dockerfile
FROM golang:1.23.3-alpine AS builder

WORKDIR /app

# Go modulesをコピーして依存関係をダウンロード
COPY go.mod go.sum ./
RUN go mod download

# ソースコードをコピー
COPY . .

# バイナリをビルド
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server

# 実行用の軽量イメージ
FROM alpine:latest

RUN apk --no-cache add ca-certificates
WORKDIR /root/

# ビルドしたバイナリをコピー
COPY --from=builder /app/main .

EXPOSE 8080
CMD ["./main"]
