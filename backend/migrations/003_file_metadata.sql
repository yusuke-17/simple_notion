-- ファイルメタデータテーブルの作成
CREATE TABLE IF NOT EXISTS file_metadata (
    -- 主キー
    id SERIAL PRIMARY KEY,
    
    -- 所有者情報
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    block_id INTEGER REFERENCES blocks(id) ON DELETE SET NULL,
    
    -- MinIO/S3ファイル情報
    file_key VARCHAR(500) NOT NULL UNIQUE,
    bucket_name VARCHAR(100) NOT NULL DEFAULT 'simple-notion-files',
    
    -- ファイル基本情報
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    
    -- 画像固有情報 (file_type='image'の場合のみ)
    width INTEGER,
    height INTEGER,
    
    -- アップロード情報
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 状態管理
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    deleted_at TIMESTAMP,
    
    -- メタデータ (JSON)
    metadata JSONB,
    
    -- 制約
    CONSTRAINT chk_file_type CHECK (file_type IN ('image', 'file')),
    CONSTRAINT chk_status CHECK (status IN ('active', 'deleted', 'orphaned'))
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_document_id ON file_metadata(document_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_block_id ON file_metadata(block_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_status ON file_metadata(status);
CREATE INDEX IF NOT EXISTS idx_file_metadata_file_key ON file_metadata(file_key);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_at ON file_metadata(uploaded_at);

-- blocksテーブルにfile_metadata_idカラムを追加
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS file_metadata_id INTEGER REFERENCES file_metadata(id) ON DELETE SET NULL;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_blocks_file_metadata_id ON blocks(file_metadata_id);

-- 孤立ファイル検出用ビュー
CREATE OR REPLACE VIEW orphaned_files AS
SELECT fm.*
FROM file_metadata fm
LEFT JOIN blocks b ON fm.block_id = b.id
WHERE fm.status = 'active'
  AND (fm.block_id IS NOT NULL AND b.id IS NULL)
  AND fm.uploaded_at < NOW() - INTERVAL '24 hours';

-- ユーザーごとのストレージ使用量ビュー
CREATE OR REPLACE VIEW user_storage_usage AS
SELECT 
    user_id,
    COUNT(*) as file_count,
    SUM(file_size) as total_bytes,
    ROUND(SUM(file_size)::numeric / 1024 / 1024, 2) as total_mb
FROM file_metadata
WHERE status = 'active'
GROUP BY user_id;

-- コメント追加
COMMENT ON TABLE file_metadata IS 'MinIO/S3に保存されたファイルのメタデータ';
COMMENT ON COLUMN file_metadata.file_key IS 'MinIO/S3のオブジェクトキー (例: images/1/uuid_filename.jpg)';
COMMENT ON COLUMN file_metadata.file_type IS 'ファイルの種類 (image or file)';
COMMENT ON COLUMN file_metadata.status IS 'ファイルの状態 (active, deleted, orphaned)';
COMMENT ON VIEW orphaned_files IS '24時間以上前にアップロードされ、ブロックが削除された孤立ファイル';
COMMENT ON VIEW user_storage_usage IS 'ユーザーごとのストレージ使用量';
