package services

import (
	"fmt"

	"simple-notion-backend/internal/models"
	"simple-notion-backend/internal/repository"
)

// DocumentService - 文書操作の統合サービス
// 複数のRepositoryを組み合わせて、高レベルなビジネスロジックを提供
type DocumentService struct {
	documentRepo *repository.DocumentCoreRepository
	blockRepo    *repository.BlockRepository
	treeRepo     *repository.DocumentTreeRepository
	trashRepo    *repository.DocumentTrashRepository
}

// NewDocumentService - DocumentServiceを初期化
func NewDocumentService(
	documentRepo *repository.DocumentCoreRepository,
	blockRepo *repository.BlockRepository,
	treeRepo *repository.DocumentTreeRepository,
	trashRepo *repository.DocumentTrashRepository,
) *DocumentService {
	return &DocumentService{
		documentRepo: documentRepo,
		blockRepo:    blockRepo,
		treeRepo:     treeRepo,
		trashRepo:    trashRepo,
	}
}

// GetDocumentWithBlocks - 文書とブロック情報の統合取得
// 既存のDocumentRepository.GetDocumentWithBlocksと同等の機能
func (s *DocumentService) GetDocumentWithBlocks(docID, userID int) (*models.DocumentWithBlocks, error) {
	// 文書基本情報を取得
	doc, err := s.documentRepo.GetDocument(docID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get document: %w", err)
	}

	// ブロック情報を取得
	blocks, err := s.blockRepo.GetBlocksByDocumentID(docID)
	if err != nil {
		return nil, fmt.Errorf("failed to get blocks: %w", err)
	}

	return &models.DocumentWithBlocks{
		Document: *doc,
		Blocks:   blocks,
	}, nil
}

// GetDocumentTree - 文書ツリー構造を取得
// 既存のDocumentRepository.GetDocumentTreeと同等の機能
func (s *DocumentService) GetDocumentTree(userID int) ([]models.DocumentTreeNode, error) {
	return s.treeRepo.GetDocumentTree(userID)
}

// CreateDocument - 新しい文書を作成
// 既存のDocumentRepository.CreateDocumentと同等の機能
func (s *DocumentService) CreateDocument(doc *models.Document) error {
	return s.documentRepo.CreateDocument(doc)
}

// UpdateDocument - 文書の基本情報のみを更新
// 既存のDocumentRepository.UpdateDocumentと同等の機能
func (s *DocumentService) UpdateDocument(docID, userID int, title, content string) error {
	return s.documentRepo.UpdateDocument(docID, userID, title, content)
}

// UpdateDocumentWithBlocks - 文書とブロック情報を統合更新
// 文書の基本情報とブロック情報を一度に更新する高レベルな操作
func (s *DocumentService) UpdateDocumentWithBlocks(docID, userID int, title, content string, blocks []models.Block) error {
	// 文書基本情報を更新
	if err := s.documentRepo.UpdateDocument(docID, userID, title, content); err != nil {
		return fmt.Errorf("failed to update document: %w", err)
	}

	// ブロック情報を更新
	if err := s.blockRepo.UpdateBlocks(docID, blocks); err != nil {
		return fmt.Errorf("failed to update blocks: %w", err)
	}

	return nil
}

// UpdateBlocks - ブロック情報のみを更新
// 既存のDocumentRepository.UpdateBlocksと同等の機能
func (s *DocumentService) UpdateBlocks(docID int, blocks []models.Block) error {
	return s.blockRepo.UpdateBlocks(docID, blocks)
}

// MoveDocument - 文書を別の親文書の下に移動
// 既存のDocumentRepository.MoveDocumentと同等の機能
func (s *DocumentService) MoveDocument(docID int, newParentID *int, userID int) error {
	return s.treeRepo.MoveDocument(docID, newParentID, userID)
}

// SoftDeleteDocument - 文書を論理削除（ごみ箱に移動）
// 既存のDocumentRepository.SoftDeleteDocumentと同等の機能
func (s *DocumentService) SoftDeleteDocument(docID, userID int) error {
	return s.trashRepo.SoftDeleteDocument(docID, userID)
}

// RestoreDocument - ごみ箱から文書を復元
// 既存のDocumentRepository.RestoreDocumentと同等の機能
func (s *DocumentService) RestoreDocument(docID, userID int) error {
	return s.trashRepo.RestoreDocument(docID, userID)
}

// PermanentDeleteDocument - 文書を完全削除
// 既存のDocumentRepository.PermanentDeleteDocumentと同等の機能
func (s *DocumentService) PermanentDeleteDocument(docID, userID int) error {
	return s.trashRepo.PermanentDeleteDocument(docID, userID)
}

// GetTrashedDocuments - ごみ箱内の文書一覧を取得
// 既存のDocumentRepository.GetTrashedDocumentsと同等の機能
func (s *DocumentService) GetTrashedDocuments(userID int) ([]models.Document, error) {
	return s.trashRepo.GetTrashedDocuments(userID)
}

// EmptyTrash - ユーザーのごみ箱を完全に空にする
// 新機能：ごみ箱内の全文書を一括削除
func (s *DocumentService) EmptyTrash(userID int) error {
	return s.trashRepo.EmptyTrash(userID)
}

// GetAllDocuments - ユーザーの全文書を取得（非削除のみ）
// 新機能：フラットなリスト形式での文書一覧取得
func (s *DocumentService) GetAllDocuments(userID int) ([]models.Document, error) {
	return s.documentRepo.GetAllDocuments(userID)
}
