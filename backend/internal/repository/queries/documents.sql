-- name: GetDocumentWithBlocks
SELECT id, user_id, parent_id, title, content, tree_path, level, sort_order, 
       is_deleted, created_at, updated_at
FROM documents 
WHERE id = $1 AND user_id = $2 AND is_deleted = false;

-- name: GetDocumentTree
SELECT id, user_id, parent_id, title, content, tree_path, level, sort_order, 
       is_deleted, created_at, updated_at
FROM documents 
WHERE user_id = $1 AND is_deleted = false
ORDER BY tree_path, sort_order;

-- name: CreateDocument
INSERT INTO documents (user_id, parent_id, title, created_at, updated_at)
VALUES ($1, $2, $3, NOW(), NOW())
RETURNING id, created_at, updated_at;

-- name: UpdateDocument
UPDATE documents 
SET title = $1, updated_at = NOW()
WHERE id = $2 AND user_id = $3;

-- name: SoftDeleteDocument
UPDATE documents 
SET is_deleted = true, updated_at = NOW()
WHERE id = $1 AND user_id = $2;

-- name: RestoreDocument
UPDATE documents 
SET is_deleted = false, updated_at = NOW()
WHERE id = $1 AND user_id = $2;

-- name: GetTrashedDocuments
SELECT id, user_id, parent_id, title, content, tree_path, level, sort_order, 
       is_deleted, created_at, updated_at
FROM documents 
WHERE user_id = $1 AND is_deleted = true
ORDER BY updated_at DESC;

-- name: PermanentDeleteDocument
DELETE FROM documents 
WHERE id = $1 AND user_id = $2 AND is_deleted = true;

-- name: MoveDocument
UPDATE documents 
SET parent_id = $1, updated_at = NOW()
WHERE id = $2 AND user_id = $3;

-- name: GetDocumentChildren
SELECT id, user_id, parent_id, title, content, tree_path, level, sort_order, 
       is_deleted, created_at, updated_at
FROM documents 
WHERE parent_id = $1 AND user_id = $2 AND is_deleted = false
ORDER BY sort_order;

-- name: UpdateDocumentSortOrder
UPDATE documents 
SET sort_order = $1, updated_at = NOW()
WHERE id = $2 AND user_id = $3;
