package models

import "time"

type Document struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	ParentID  *int      `json:"parent_id" db:"parent_id"`
	Title     string    `json:"title" db:"title"`
	Content   string    `json:"content" db:"content"`
	TreePath  string    `json:"tree_path" db:"tree_path"`
	Level     int       `json:"level" db:"level"`
	SortOrder int       `json:"sort_order" db:"sort_order"`
	IsDeleted bool      `json:"is_deleted" db:"is_deleted"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
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
	ID         int         `json:"id" db:"id"`
	DocumentID int         `json:"document_id" db:"document_id"`
	Type       string      `json:"type" db:"type"`
	Content    interface{} `json:"content" db:"content"`
	Position   int         `json:"position" db:"position"`
	CreatedAt  time.Time   `json:"created_at" db:"created_at"`
}
