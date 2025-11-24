#!/bin/bash

# MinIO設定スクリプト
# バケットの作成とCORS設定を行う

set -e

echo "Waiting for MinIO to be ready..."
sleep 5

# MinIO CLI設定
mc alias set myminio http://minio:9000 minioadmin minioadmin

# バケットが存在するか確認し、なければ作成
if ! mc ls myminio/simple-notion-files > /dev/null 2>&1; then
    echo "Creating bucket: simple-notion-files"
    mc mb myminio/simple-notion-files
else
    echo "Bucket already exists: simple-notion-files"
fi

# CORS設定を適用
echo "Applying CORS configuration..."
mc anonymous set-json /tmp/cors-config.json myminio/simple-notion-files || true

# バケットポリシーを設定（署名付きURLで読み取り可能にする）
echo "Setting bucket policy..."
cat > /tmp/policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::simple-notion-files/*"]
    }
  ]
}
EOF

mc anonymous set-json /tmp/policy.json myminio/simple-notion-files || true

echo "MinIO setup completed!"
