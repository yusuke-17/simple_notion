package repository

import (
	"database/sql"
	"fmt"

	"simple-notion-backend/internal/models"
)

// DocumentTrashRepository - ごみ箱操作専用リポジトリ
type DocumentTrashRepository struct {
	db      *sql.DB
	queries *SQLQueries
}

// NewDocumentTrashRepository - DocumentTrashRepositoryを初期化
func NewDocumentTrashRepository(db *sql.DB) (*DocumentTrashRepository, error) {
	queries, err := NewSQLQueries()
	if err != nil {
		return nil, fmt.Errorf("failed to load SQL queries: %w", err)
	}

	return &DocumentTrashRepository{
		db:      db,
		queries: queries,
	}, nil
}

// SoftDeleteDocument - 文書を論理削除（ごみ箱に移動）
func (r *DocumentTrashRepository) SoftDeleteDocument(docID, userID int) error {
	query, err := r.queries.Get("SoftDeleteDocument")
	if err != nil {
		return err
	}

	result, err := r.db.Exec(query, docID, userID)
	if err != nil {
		return fmt.Errorf("failed to soft delete document: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("document not found or access denied")
	}

	return nil
}

// RestoreDocument - ごみ箱から文書を復元
func (r *DocumentTrashRepository) RestoreDocument(docID, userID int) error {
	query, err := r.queries.Get("RestoreDocument")
	if err != nil {
		return err
	}

	result, err := r.db.Exec(query, docID, userID)
	if err != nil {
		return fmt.Errorf("failed to restore document: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("document not found in trash or access denied")
	}

	return nil
}

// PermanentDeleteDocument - 文書を完全削除
func (r *DocumentTrashRepository) PermanentDeleteDocument(docID, userID int) error {
	// トランザクション開始（ブロックも同時削除）
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 関連ブロックを先に削除
	deleteBlocksQuery, err := r.queries.Get("DeleteBlocksByDocumentID")
	if err != nil {
		return err
	}

	_, err = tx.Exec(deleteBlocksQuery, docID)
	if err != nil {
		return fmt.Errorf("failed to delete related blocks: %w", err)
	}

	// 文書を完全削除
	deleteDocQuery, err := r.queries.Get("PermanentDeleteDocument")
	if err != nil {
		return err
	}

	result, err := tx.Exec(deleteDocQuery, docID, userID)
	if err != nil {
		return fmt.Errorf("failed to permanently delete document: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("document not found or access denied")
	}

	return tx.Commit()
}

// GetTrashedDocuments - ごみ箱内の文書一覧を取得
func (r *DocumentTrashRepository) GetTrashedDocuments(userID int) ([]models.Document, error) {
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

// EmptyTrash - ユーザーのごみ箱を完全に空にする
func (r *DocumentTrashRepository) EmptyTrash(userID int) error {
	// トランザクション開始
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// ごみ箱内の文書一覧を取得
	trashedDocs, err := r.GetTrashedDocuments(userID)
	if err != nil {
		return fmt.Errorf("failed to get trashed documents: %w", err)
	}

	// 各文書に関連するブロックを削除
	deleteBlocksQuery, err := r.queries.Get("DeleteBlocksByDocumentID")
	if err != nil {
		return err
	}

	for _, doc := range trashedDocs {
		_, err = tx.Exec(deleteBlocksQuery, doc.ID)
		if err != nil {
			return fmt.Errorf("failed to delete blocks for document %d: %w", doc.ID, err)
		}
	}

	// ごみ箱内の全文書を完全削除
	deleteDocsQuery := "DELETE FROM documents WHERE user_id = $1 AND is_deleted = true"
	_, err = tx.Exec(deleteDocsQuery, userID)
	if err != nil {
		return fmt.Errorf("failed to empty trash: %w", err)
	}

	return tx.Commit()
}
