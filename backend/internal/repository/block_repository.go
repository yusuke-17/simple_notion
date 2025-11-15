package repository

import (
	"database/sql"
	"fmt"

	"simple-notion-backend/internal/models"
)

// BlockRepository - ブロック操作専用リポジトリ
type BlockRepository struct {
	db      *sql.DB
	queries *SQLQueries
}

// NewBlockRepository - BlockRepositoryを初期化
func NewBlockRepository(db *sql.DB) (*BlockRepository, error) {
	queries, err := NewSQLQueries()
	if err != nil {
		return nil, fmt.Errorf("failed to load SQL queries: %w", err)
	}

	return &BlockRepository{
		db:      db,
		queries: queries,
	}, nil
}

// GetBlocksByDocumentID - 指定された文書IDのブロック一覧を取得
func (r *BlockRepository) GetBlocksByDocumentID(docID int) ([]models.Block, error) {
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

		err := rows.Scan(&block.ID, &block.DocumentID, &block.Type,
			&block.Content, &block.Position, &block.CreatedAt)
		if err != nil {
			return nil, err
		}

		blocks = append(blocks, block)
	}

	return blocks, nil
}

// UpdateBlocks - 文書のブロック情報を一括更新（既存削除→新規挿入）
func (r *BlockRepository) UpdateBlocks(docID int, blocks []models.Block) error {
	// トランザクション開始
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 既存ブロックを削除
	deleteQuery, err := r.queries.Get("DeleteBlocksByDocumentID")
	if err != nil {
		return err
	}

	_, err = tx.Exec(deleteQuery, docID)
	if err != nil {
		return fmt.Errorf("failed to delete existing blocks: %w", err)
	}

	// 新しいブロックを挿入
	insertQuery, err := r.queries.Get("BulkInsertBlocks")
	if err != nil {
		return err
	}

	for _, block := range blocks {
		// json.RawMessageをそのままバイト列として使用
		_, err = tx.Exec(insertQuery, docID, block.Type, block.Content, block.Position)
		if err != nil {
			return fmt.Errorf("failed to insert block: %w", err)
		}
	}

	// トランザクションコミット
	return tx.Commit()
}

// CreateBlock - 単一ブロックを作成
func (r *BlockRepository) CreateBlock(block *models.Block) error {
	// json.RawMessageをそのままバイト列として使用
	insertQuery, err := r.queries.Get("BulkInsertBlocks")
	if err != nil {
		return err
	}

	_, err = r.db.Exec(insertQuery, block.DocumentID, block.Type, block.Content, block.Position)
	return err
}

// DeleteBlocksByDocumentID - 文書IDに紐づく全ブロックを削除
func (r *BlockRepository) DeleteBlocksByDocumentID(docID int) error {
	deleteQuery, err := r.queries.Get("DeleteBlocksByDocumentID")
	if err != nil {
		return err
	}

	_, err = r.db.Exec(deleteQuery, docID)
	return err
}
