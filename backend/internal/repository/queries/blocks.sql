-- name: GetBlocksByDocumentID
SELECT id, document_id, type, content, position, created_at
FROM blocks 
WHERE document_id = $1 
ORDER BY position;

-- name: CreateBlock
INSERT INTO blocks (document_id, type, content, position)
VALUES ($1, $2, $3, $4)
RETURNING id, created_at;

-- name: UpdateBlock
UPDATE blocks 
SET type = $1, content = $2, position = $3
WHERE id = $4 AND document_id = $5;

-- name: DeleteBlock
DELETE FROM blocks 
WHERE id = $1 AND document_id = $2;

-- name: DeleteBlocksByDocumentID
DELETE FROM blocks 
WHERE document_id = $1;

-- name: BulkInsertBlocks
INSERT INTO blocks (document_id, type, content, position)
VALUES ($1, $2, $3, $4);

-- name: GetBlockCount
SELECT COUNT(*) 
FROM blocks 
WHERE document_id = $1;

-- name: ReorderBlocks
UPDATE blocks 
SET position = $1 
WHERE id = $2 AND document_id = $3;
