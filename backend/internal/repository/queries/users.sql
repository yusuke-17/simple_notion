-- name: GetUserByEmail
SELECT id, email, password_hash, name, created_at, updated_at
FROM users 
WHERE email = $1;

-- name: GetUserByID
SELECT id, email, password_hash, name, created_at, updated_at
FROM users 
WHERE id = $1;

-- name: CreateUser
INSERT INTO users (email, password_hash, name, created_at, updated_at)
VALUES ($1, $2, $3, NOW(), NOW())
RETURNING id, created_at, updated_at;

-- name: UpdateUser
UPDATE users 
SET email = $1, name = $2, updated_at = NOW()
WHERE id = $3;

-- name: UpdateUserPassword
UPDATE users 
SET password_hash = $1, updated_at = NOW()
WHERE id = $2;

-- name: DeleteUser
DELETE FROM users 
WHERE id = $1;

-- name: GetUserDocumentCount
SELECT COUNT(*) 
FROM documents 
WHERE user_id = $1 AND is_deleted = false;
