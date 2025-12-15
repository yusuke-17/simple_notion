-- N+1問題を回避するJOINクエリの例
SELECT 
    d.id as document_id,
    d.title,
    d.created_at,
    b.id as block_id,
    b.content,
    b.type,
    b.position
FROM documents d
LEFT JOIN blocks b ON d.id = b.document_id
WHERE d.user_id = $1
ORDER BY d.created_at DESC, b.position ASC;
