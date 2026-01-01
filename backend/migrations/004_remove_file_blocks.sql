-- Migration: 004_remove_file_blocks.sql
-- 説明: file タイプのブロックを削除（一般ファイルアップロード機能の廃止に伴う）
-- 作成日: 2025-12-31

-- 1. file タイプのブロックを削除
DELETE FROM blocks WHERE type = 'file';

-- 2. file タイプのファイルメタデータを削除済みにマーク（実際のファイルはクリーンアップジョブで削除）
UPDATE file_metadata 
SET status = 'deleted', deleted_at = NOW() 
WHERE file_type = 'file';

-- 注意: この変更は元に戻せません
-- ロールバックが必要な場合は、バックアップからの復元が必要です
