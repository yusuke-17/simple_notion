package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"simple-notion-backend/internal/models"
)

type DocumentRepository struct {
	db      *sql.DB
	queries *SQLQueries
}

func NewDocumentRepository(db *sql.DB) (*DocumentRepository, error) {
	queries, err := NewSQLQueries()
	if err != nil {
		return nil, fmt.Errorf("failed to load SQL queries: %w", err)
	}

	return &DocumentRepository{
		db:      db,
		queries: queries,
	}, nil
}

func (r *DocumentRepository) GetDocumentWithBlocks(docID, userID int) (*models.DocumentWithBlocks, error) {
	query, err := r.queries.Get("GetDocumentWithBlocks")
	if err != nil {
		return nil, err
	}

	var doc models.Document
	err = r.db.QueryRow(query, docID, userID).Scan(
		&doc.ID, &doc.UserID, &doc.ParentID, &doc.Title,
		&doc.Content, &doc.TreePath, &doc.Level, &doc.SortOrder,
		&doc.IsDeleted, &doc.CreatedAt, &doc.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	// ブロック取得
	blocks, err := r.GetBlocksByDocumentID(docID)
	if err != nil {
		return nil, err
	}

	return &models.DocumentWithBlocks{
		Document: doc,
		Blocks:   blocks,
	}, nil
}

func (r *DocumentRepository) GetDocumentTree(userID int) ([]models.DocumentTreeNode, error) {
	query, err := r.queries.Get("GetDocumentTree")
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []models.Document
	for rows.Next() {
		var doc models.Document
		err := rows.Scan(&doc.ID, &doc.UserID, &doc.ParentID, &doc.Title,
			&doc.Content, &doc.TreePath, &doc.Level, &doc.SortOrder,
			&doc.IsDeleted, &doc.CreatedAt, &doc.UpdatedAt)
		if err != nil {
			return nil, err
		}
		documents = append(documents, doc)
	}

	return r.buildTree(documents), nil
}

func (r *DocumentRepository) GetBlocksByDocumentID(docID int) ([]models.Block, error) {
	query, err := r.queries.Get("GetBlocksByDocumentID")
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(query, docID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blocks []models.Block
	for rows.Next() {
		var block models.Block
		var contentJSON []byte

		err := rows.Scan(&block.ID, &block.DocumentID, &block.Type,
			&contentJSON, &block.Position, &block.CreatedAt)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal(contentJSON, &block.Content); err != nil {
			return nil, err
		}

		blocks = append(blocks, block)
	}

	return blocks, nil
}

func (r *DocumentRepository) CreateDocument(doc *models.Document) error {
	query, err := r.queries.Get("CreateDocument")
	if err != nil {
		return err
	}

	err = r.db.QueryRow(query, doc.UserID, doc.ParentID, doc.Title, doc.Content).Scan(
		&doc.ID, &doc.CreatedAt, &doc.UpdatedAt,
	)

	return err
}

func (r *DocumentRepository) UpdateDocument(docID, userID int, title, content string) error {
	query, err := r.queries.Get("UpdateDocument")
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, title, content, docID, userID)
	return err
}

func (r *DocumentRepository) UpdateBlocks(docID int, blocks []models.Block) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 既存ブロックを削除
	deleteQuery, err := r.queries.Get("DeleteBlocksByDocumentID")
	if err != nil {
		return err
	}

	_, err = tx.Exec(deleteQuery, docID)
	if err != nil {
		return err
	}

	// 新しいブロックを挿入
	insertQuery, err := r.queries.Get("BulkInsertBlocks")
	if err != nil {
		return err
	}

	for _, block := range blocks {
		contentJSON, err := json.Marshal(block.Content)
		if err != nil {
			return err
		}

		_, err = tx.Exec(insertQuery, docID, block.Type, contentJSON, block.Position)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *DocumentRepository) SoftDeleteDocument(docID, userID int) error {
	query, err := r.queries.Get("SoftDeleteDocument")
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, docID, userID)
	return err
}

func (r *DocumentRepository) RestoreDocument(docID, userID int) error {
	query, err := r.queries.Get("RestoreDocument")
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, docID, userID)
	return err
}

func (r *DocumentRepository) GetTrashedDocuments(userID int) ([]models.Document, error) {
	query, err := r.queries.Get("GetTrashedDocuments")
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []models.Document
	for rows.Next() {
		var doc models.Document
		err := rows.Scan(&doc.ID, &doc.UserID, &doc.ParentID, &doc.Title,
			&doc.Content, &doc.TreePath, &doc.Level, &doc.SortOrder,
			&doc.IsDeleted, &doc.CreatedAt, &doc.UpdatedAt)
		if err != nil {
			return nil, err
		}
		documents = append(documents, doc)
	}

	return documents, nil
}

func (r *DocumentRepository) MoveDocument(docID int, newParentID *int, userID int) error {
	query, err := r.queries.Get("MoveDocument")
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, newParentID, docID, userID)
	return err
}

// ツリー構造を構築
func (r *DocumentRepository) buildTree(documents []models.Document) []models.DocumentTreeNode {
	// ルートドキュメント（parent_id = null）を特定
	roots := make([]models.DocumentTreeNode, 0)
	
	for _, doc := range documents {
		if doc.ParentID == nil {
			node := models.DocumentTreeNode{
				Document: doc,
				Children: r.buildChildren(doc.ID, documents),
			}
			roots = append(roots, node)
		}
	}

	return roots
}

func (r *DocumentRepository) buildChildren(parentID int, documents []models.Document) []models.DocumentTreeNode {
	children := make([]models.DocumentTreeNode, 0)
	
	for _, doc := range documents {
		if doc.ParentID != nil && *doc.ParentID == parentID {
			child := models.DocumentTreeNode{
				Document: doc,
				Children: r.buildChildren(doc.ID, documents),
			}
			children = append(children, child)
		}
	}
	
	return children
}
