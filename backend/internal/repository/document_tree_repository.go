package repository

import (
	"database/sql"
	"fmt"

	"simple-notion-backend/internal/models"
)

// DocumentTreeRepository - 文書ツリー構造操作専用リポジトリ
type DocumentTreeRepository struct {
	db      *sql.DB
	queries *SQLQueries
}

// NewDocumentTreeRepository - DocumentTreeRepositoryを初期化
func NewDocumentTreeRepository(db *sql.DB) (*DocumentTreeRepository, error) {
	queries, err := NewSQLQueries()
	if err != nil {
		return nil, fmt.Errorf("failed to load SQL queries: %w", err)
	}

	return &DocumentTreeRepository{
		db:      db,
		queries: queries,
	}, nil
}

// GetDocumentTree - ユーザーの文書ツリー構造を取得
func (r *DocumentTreeRepository) GetDocumentTree(userID int) ([]models.DocumentTreeNode, error) {
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

// MoveDocument - 文書を別の親文書の下に移動
func (r *DocumentTreeRepository) MoveDocument(docID int, newParentID *int, userID int) error {
	query, err := r.queries.Get("MoveDocument")
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, newParentID, docID, userID)
	if err != nil {
		return fmt.Errorf("failed to move document: %w", err)
	}

	return nil
}

// buildTree - フラットな文書リストから階層ツリー構造を構築
func (r *DocumentTreeRepository) buildTree(documents []models.Document) []models.DocumentTreeNode {
	// ルートドキュメント（parent_id = null）を特定して構築開始
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

// buildChildren - 指定された親IDの子要素を再帰的に構築
func (r *DocumentTreeRepository) buildChildren(parentID int, documents []models.Document) []models.DocumentTreeNode {
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

// GetDocumentPath - 文書のパス情報（ルートからの経路）を取得
func (r *DocumentTreeRepository) GetDocumentPath(docID, userID int) ([]models.Document, error) {
	// 実装は必要に応じて追加
	// 現在のツリーパス機能を活用する場合はこの関数で実装
	return nil, fmt.Errorf("GetDocumentPath not implemented yet")
}

// UpdateDocumentOrder - 同一階層内での文書順序を変更
func (r *DocumentTreeRepository) UpdateDocumentOrder(docID, newSortOrder, userID int) error {
	// 実装は必要に応じて追加
	// sort_orderカラムを更新するクエリを実装
	return fmt.Errorf("UpdateDocumentOrder not implemented yet")
}
