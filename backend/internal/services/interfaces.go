package services

import "simple-notion-backend/internal/models"

// DocumentCoreRepositoryInterface - DocumentCoreRepositoryのインターフェース
type DocumentCoreRepositoryInterface interface {
	GetDocument(docID, userID int) (*models.Document, error)
	GetDocumentIncludingDeleted(docID, userID int) (*models.Document, error)
	CreateDocument(doc *models.Document) error
	UpdateDocument(docID, userID int, title, content string) error
	GetAllDocuments(userID int) ([]models.Document, error)
}

// BlockRepositoryInterface - BlockRepositoryのインターフェース
type BlockRepositoryInterface interface {
	GetBlocksByDocumentID(docID int) ([]models.Block, error)
	UpdateBlocks(docID int, blocks []models.Block) error
}

// DocumentTreeRepositoryInterface - DocumentTreeRepositoryのインターフェース
type DocumentTreeRepositoryInterface interface {
	GetDocumentTree(userID int) ([]models.DocumentTreeNode, error)
	MoveDocument(docID int, newParentID *int, userID int) error
}

// DocumentTrashRepositoryInterface - DocumentTrashRepositoryのインターフェース
type DocumentTrashRepositoryInterface interface {
	SoftDeleteDocument(docID, userID int) error
	RestoreDocument(docID, userID int) error
	PermanentDeleteDocument(docID, userID int) error
	GetTrashedDocuments(userID int) ([]models.Document, error)
	EmptyTrash(userID int) error
}
