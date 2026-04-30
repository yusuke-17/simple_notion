package services

import (
	"fmt"

	"simple-notion-backend/internal/apierror"
	"simple-notion-backend/internal/models"
)

// DocumentService - 文書操作の統合サービス
// 複数のRepositoryを組み合わせて、高レベルなビジネスロジックを提供
type DocumentService struct {
	documentRepo DocumentCoreRepositoryInterface
	blockRepo    BlockRepositoryInterface
	treeRepo     DocumentTreeRepositoryInterface
	trashRepo    DocumentTrashRepositoryInterface
}

// NewDocumentService - DocumentServiceを初期化
func NewDocumentService(
	documentRepo DocumentCoreRepositoryInterface,
	blockRepo BlockRepositoryInterface,
	treeRepo DocumentTreeRepositoryInterface,
	trashRepo DocumentTrashRepositoryInterface,
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

// GetDocumentWithBlocksIncludingDeleted - 削除されたドキュメントも含めて文書とブロック情報を統合取得
func (s *DocumentService) GetDocumentWithBlocksIncludingDeleted(docID, userID int) (*models.DocumentWithBlocks, error) {
	// 削除されたドキュメントも含めて文書基本情報を取得
	doc, err := s.documentRepo.GetDocumentIncludingDeleted(docID, userID)
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
	// 親ドキュメント指定がある場合は所有権・存在を確認（404 防止と権限漏洩対策）
	if doc.ParentID != nil {
		if _, err := s.documentRepo.GetDocument(*doc.ParentID, doc.UserID); err != nil {
			// 親が存在しない／他ユーザーのものは ErrNotFound として伝搬
			return fmt.Errorf("parent document id=%d: %w", *doc.ParentID, err)
		}
	}
	return s.documentRepo.CreateDocument(doc)
}

// UpdateDocument - 文書の基本情報のみを更新
// 既存のDocumentRepository.UpdateDocumentと同等の機能
func (s *DocumentService) UpdateDocument(docID, userID int, title, content string) error {
	// 存在確認 + ゴミ箱チェックを兼ねる
	if _, err := s.documentRepo.GetDocument(docID, userID); err != nil {
		return err
	}
	return s.documentRepo.UpdateDocument(docID, userID, title, content)
}

// UpdateDocumentWithBlocks - 文書とブロック情報を統合更新
// 文書の基本情報とブロック情報を一度に更新する高レベルな操作
func (s *DocumentService) UpdateDocumentWithBlocks(docID, userID int, title, content string, blocks []models.Block) error {
	// 存在確認（削除済みドキュメントへの編集は ErrNotFound として 404 を返す）
	if _, err := s.documentRepo.GetDocument(docID, userID); err != nil {
		return fmt.Errorf("failed to update document: %w", err)
	}

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
// 自身/子孫を親に設定する循環参照は ErrForbidden として 403 を返す
func (s *DocumentService) MoveDocument(docID int, newParentID *int, userID int) error {
	// 移動対象の存在 + 所有権確認
	if _, err := s.documentRepo.GetDocument(docID, userID); err != nil {
		return err
	}

	// ルート移動（newParentID == nil）はループの心配なし
	if newParentID != nil {
		// 自身を親に設定するのは禁止
		if *newParentID == docID {
			return fmt.Errorf("cannot move document into itself: %w", apierror.ErrForbidden)
		}

		// 親候補の存在 + 所有権確認
		if _, err := s.documentRepo.GetDocument(*newParentID, userID); err != nil {
			return fmt.Errorf("parent document id=%d: %w", *newParentID, err)
		}

		// 子孫を親に設定するのは禁止（循環参照）
		isDescendant, err := s.isDescendantOf(*newParentID, docID, userID)
		if err != nil {
			return fmt.Errorf("failed to check descendants: %w", err)
		}
		if isDescendant {
			return fmt.Errorf("cannot move document into its descendant: %w", apierror.ErrForbidden)
		}
	}

	return s.treeRepo.MoveDocument(docID, newParentID, userID)
}

// isDescendantOf - candidateID が ancestorID の子孫かどうかを判定
// ユーザーの全文書をロードして親リンクを辿る
func (s *DocumentService) isDescendantOf(candidateID, ancestorID, userID int) (bool, error) {
	docs, err := s.documentRepo.GetAllDocuments(userID)
	if err != nil {
		return false, err
	}

	parentMap := make(map[int]*int, len(docs))
	for _, d := range docs {
		parentMap[d.ID] = d.ParentID
	}

	// candidateID から親をたどって ancestorID に行き着けば子孫
	current := candidateID
	visited := make(map[int]bool)
	for {
		parent, ok := parentMap[current]
		if !ok || parent == nil {
			return false, nil
		}
		if *parent == ancestorID {
			return true, nil
		}
		// 想定外の循環をガード
		if visited[*parent] {
			return false, nil
		}
		visited[*parent] = true
		current = *parent
	}
}

// SoftDeleteDocument - 文書を論理削除（ごみ箱に移動）
// 既にゴミ箱に入っている文書への操作は ErrConflict として 409 を返す
func (s *DocumentService) SoftDeleteDocument(docID, userID int) error {
	doc, err := s.documentRepo.GetDocumentIncludingDeleted(docID, userID)
	if err != nil {
		return err
	}
	if doc.IsDeleted {
		return fmt.Errorf("document id=%d is already in trash: %w", docID, apierror.ErrConflict)
	}
	return s.trashRepo.SoftDeleteDocument(docID, userID)
}

// RestoreDocument - ごみ箱から文書を復元
// ゴミ箱に入っていない文書への操作は ErrConflict として 409 を返す
func (s *DocumentService) RestoreDocument(docID, userID int) error {
	doc, err := s.documentRepo.GetDocumentIncludingDeleted(docID, userID)
	if err != nil {
		return err
	}
	if !doc.IsDeleted {
		return fmt.Errorf("document id=%d is not in trash: %w", docID, apierror.ErrConflict)
	}
	return s.trashRepo.RestoreDocument(docID, userID)
}

// PermanentDeleteDocument - 文書を完全削除
// ゴミ箱に入っていない文書への完全削除は ErrConflict として 409 を返す
func (s *DocumentService) PermanentDeleteDocument(docID, userID int) error {
	doc, err := s.documentRepo.GetDocumentIncludingDeleted(docID, userID)
	if err != nil {
		return err
	}
	if !doc.IsDeleted {
		return fmt.Errorf("document id=%d must be in trash before permanent delete: %w", docID, apierror.ErrConflict)
	}
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
