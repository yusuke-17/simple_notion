package models

import (
	"encoding/json"
	"time"
)

type Document struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"userId" db:"user_id"`
	ParentID  *int      `json:"parentId" db:"parent_id"`
	Title     string    `json:"title" db:"title"`
	Content   string    `json:"content" db:"content"`
	TreePath  string    `json:"treePath" db:"tree_path"`
	Level     int       `json:"level" db:"level"`
	SortOrder int       `json:"sortOrder" db:"sort_order"`
	IsDeleted bool      `json:"isDeleted" db:"is_deleted"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

type DocumentTreeNode struct {
	Document
	Children []DocumentTreeNode `json:"children"`
}

type DocumentWithBlocks struct {
	Document
	Blocks []Block `json:"blocks"`
}

type Block struct {
	ID         int             `json:"id" db:"id"`
	DocumentID int             `json:"document_id" db:"document_id"`
	Type       string          `json:"type" db:"type"`
	Content    json.RawMessage `json:"content" db:"content"`
	Position   int             `json:"position" db:"position"`
	CreatedAt  time.Time       `json:"created_at" db:"created_at"`
}
