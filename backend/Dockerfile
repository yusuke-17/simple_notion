# バックエンド用Dockerfile
# より安全なビルド環境
FROM golang:1.24-alpine AS builder

# セキュリティアップデートと最小限のツールを追加
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates git && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Go modulesをコピーして依存関係をダウンロード
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# ソースコードをコピー
COPY . .

# セキュリティ強化されたバイナリをビルド
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -trimpath \
    -o main ./cmd/server

# 最も安全な実行環境: distroless
FROM gcr.io/distroless/static-debian12:nonroot

# CA証明書をコピー（HTTPS通信用）
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# ビルドしたバイナリをコピー
COPY --from=builder /app/main /main

# distrolessイメージはデフォルトでnonrootユーザー（UID: 65532）を使用
EXPOSE 8080

# セキュリティ向上のためENTRYPOINTを使用
ENTRYPOINT ["/main"]
