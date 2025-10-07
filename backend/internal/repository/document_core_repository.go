package repository

import (
	"database/sql"
	"fmt"

	"simple-notion-backend/internal/models"
)

// DocumentCoreRepository - 基本的な文書CRUD操作を担当
type DocumentCoreRepository struct {
	db      *sql.DB
	queries *SQLQueries
}

// NewDocumentCoreRepository - DocumentCoreRepositoryを初期化
func NewDocumentCoreRepository(db *sql.DB) (*DocumentCoreRepository, error) {
	queries, err := NewSQLQueries()
	if err != nil {
		return nil, fmt.Errorf("failed to load SQL queries: %w", err)
	}

	return &DocumentCoreRepository{
		db:      db,
		queries: queries,
	}, nil
}

// CreateDocument - 文書を新規作成
func (r *DocumentCoreRepository) CreateDocument(doc *models.Document) error {
	query, err := r.queries.Get("CreateDocument")
	if err != nil {
		return err
	}

	err = r.db.QueryRow(query, doc.UserID, doc.ParentID, doc.Title, doc.Content).Scan(
		&doc.ID, &doc.CreatedAt, &doc.UpdatedAt,
	)

	return err
}

// UpdateDocument - 文書のタイトルと内容を更新
func (r *DocumentCoreRepository) UpdateDocument(docID, userID int, title, content string) error {
	query, err := r.queries.Get("UpdateDocument")
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, title, content, docID, userID)
	return err
}

// GetDocument - 単一文書を取得（ブロック情報は含まない）
func (r *DocumentCoreRepository) GetDocument(docID, userID int) (*models.Document, error) {
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

	return &doc, nil
}

// GetAllDocuments - ユーザーの全文書を取得（非削除のみ）
func (r *DocumentCoreRepository) GetAllDocuments(userID int) ([]models.Document, error) {
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

	return documents, nil
}
