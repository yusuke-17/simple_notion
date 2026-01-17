package services

import (
	"encoding/json"
	"errors"
	"testing"
	"time"

	"simple-notion-backend/internal/models"
)

// =======================================
// モックリポジトリ定義
// =======================================

// MockDocumentCoreRepository - DocumentCoreRepositoryのモック
type MockDocumentCoreRepository struct {
	GetDocumentFunc                 func(docID, userID int) (*models.Document, error)
	GetDocumentIncludingDeletedFunc func(docID, userID int) (*models.Document, error)
	CreateDocumentFunc              func(doc *models.Document) error
	UpdateDocumentFunc              func(docID, userID int, title, content string) error
	GetAllDocumentsFunc             func(userID int) ([]models.Document, error)
}

func (m *MockDocumentCoreRepository) GetDocument(docID, userID int) (*models.Document, error) {
	if m.GetDocumentFunc != nil {
		return m.GetDocumentFunc(docID, userID)
	}
	return nil, errors.New("not implemented")
}

func (m *MockDocumentCoreRepository) GetDocumentIncludingDeleted(docID, userID int) (*models.Document, error) {
	if m.GetDocumentIncludingDeletedFunc != nil {
		return m.GetDocumentIncludingDeletedFunc(docID, userID)
	}
	return nil, errors.New("not implemented")
}

func (m *MockDocumentCoreRepository) CreateDocument(doc *models.Document) error {
	if m.CreateDocumentFunc != nil {
		return m.CreateDocumentFunc(doc)
	}
	return errors.New("not implemented")
}

func (m *MockDocumentCoreRepository) UpdateDocument(docID, userID int, title, content string) error {
	if m.UpdateDocumentFunc != nil {
		return m.UpdateDocumentFunc(docID, userID, title, content)
	}
	return errors.New("not implemented")
}

func (m *MockDocumentCoreRepository) GetAllDocuments(userID int) ([]models.Document, error) {
	if m.GetAllDocumentsFunc != nil {
		return m.GetAllDocumentsFunc(userID)
	}
	return nil, errors.New("not implemented")
}

// MockBlockRepository - BlockRepositoryのモック
type MockBlockRepository struct {
	GetBlocksByDocumentIDFunc func(docID int) ([]models.Block, error)
	UpdateBlocksFunc          func(docID int, blocks []models.Block) error
}

func (m *MockBlockRepository) GetBlocksByDocumentID(docID int) ([]models.Block, error) {
	if m.GetBlocksByDocumentIDFunc != nil {
		return m.GetBlocksByDocumentIDFunc(docID)
	}
	return nil, errors.New("not implemented")
}

func (m *MockBlockRepository) UpdateBlocks(docID int, blocks []models.Block) error {
	if m.UpdateBlocksFunc != nil {
		return m.UpdateBlocksFunc(docID, blocks)
	}
	return errors.New("not implemented")
}

// MockDocumentTreeRepository - DocumentTreeRepositoryのモック
type MockDocumentTreeRepository struct {
	GetDocumentTreeFunc func(userID int) ([]models.DocumentTreeNode, error)
	MoveDocumentFunc    func(docID int, newParentID *int, userID int) error
}

func (m *MockDocumentTreeRepository) GetDocumentTree(userID int) ([]models.DocumentTreeNode, error) {
	if m.GetDocumentTreeFunc != nil {
		return m.GetDocumentTreeFunc(userID)
	}
	return nil, errors.New("not implemented")
}

func (m *MockDocumentTreeRepository) MoveDocument(docID int, newParentID *int, userID int) error {
	if m.MoveDocumentFunc != nil {
		return m.MoveDocumentFunc(docID, newParentID, userID)
	}
	return errors.New("not implemented")
}

// MockDocumentTrashRepository - DocumentTrashRepositoryのモック
type MockDocumentTrashRepository struct {
	SoftDeleteDocumentFunc      func(docID, userID int) error
	RestoreDocumentFunc         func(docID, userID int) error
	PermanentDeleteDocumentFunc func(docID, userID int) error
	GetTrashedDocumentsFunc     func(userID int) ([]models.Document, error)
	EmptyTrashFunc              func(userID int) error
}

func (m *MockDocumentTrashRepository) SoftDeleteDocument(docID, userID int) error {
	if m.SoftDeleteDocumentFunc != nil {
		return m.SoftDeleteDocumentFunc(docID, userID)
	}
	return errors.New("not implemented")
}

func (m *MockDocumentTrashRepository) RestoreDocument(docID, userID int) error {
	if m.RestoreDocumentFunc != nil {
		return m.RestoreDocumentFunc(docID, userID)
	}
	return errors.New("not implemented")
}

func (m *MockDocumentTrashRepository) PermanentDeleteDocument(docID, userID int) error {
	if m.PermanentDeleteDocumentFunc != nil {
		return m.PermanentDeleteDocumentFunc(docID, userID)
	}
	return errors.New("not implemented")
}

func (m *MockDocumentTrashRepository) GetTrashedDocuments(userID int) ([]models.Document, error) {
	if m.GetTrashedDocumentsFunc != nil {
		return m.GetTrashedDocumentsFunc(userID)
	}
	return nil, errors.New("not implemented")
}

func (m *MockDocumentTrashRepository) EmptyTrash(userID int) error {
	if m.EmptyTrashFunc != nil {
		return m.EmptyTrashFunc(userID)
	}
	return errors.New("not implemented")
}

// =======================================
// テストケース
// =======================================

// TestGetDocumentWithBlocks - 文書とブロック情報の統合取得のテスト
func TestGetDocumentWithBlocks(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name           string
		docID          int
		userID         int
		setupMocks     func(*MockDocumentCoreRepository, *MockBlockRepository)
		expectedDoc    *models.Document
		expectedBlocks []models.Block
		wantErr        bool
		errMsg         string
	}{
		{
			name:   "正常系：文書とブロックを正常に取得",
			docID:  1,
			userID: 10,
			setupMocks: func(docRepo *MockDocumentCoreRepository, blockRepo *MockBlockRepository) {
				docRepo.GetDocumentFunc = func(docID, userID int) (*models.Document, error) {
					return &models.Document{
						ID:        1,
						UserID:    10,
						Title:     "テスト文書",
						Content:   "テスト内容",
						CreatedAt: now,
						UpdatedAt: now,
					}, nil
				}
				blockRepo.GetBlocksByDocumentIDFunc = func(docID int) ([]models.Block, error) {
					return []models.Block{
						{
							ID:         1,
							DocumentID: 1,
							Type:       "paragraph",
							Content:    json.RawMessage(`{"text":"ブロック1"}`),
							Position:   0,
							CreatedAt:  now,
						},
					}, nil
				}
			},
			expectedDoc: &models.Document{
				ID:        1,
				UserID:    10,
				Title:     "テスト文書",
				Content:   "テスト内容",
				CreatedAt: now,
				UpdatedAt: now,
			},
			expectedBlocks: []models.Block{
				{
					ID:         1,
					DocumentID: 1,
					Type:       "paragraph",
					Content:    json.RawMessage(`{"text":"ブロック1"}`),
					Position:   0,
					CreatedAt:  now,
				},
			},
			wantErr: false,
		},
		{
			name:   "異常系：文書取得失敗",
			docID:  999,
			userID: 10,
			setupMocks: func(docRepo *MockDocumentCoreRepository, blockRepo *MockBlockRepository) {
				docRepo.GetDocumentFunc = func(docID, userID int) (*models.Document, error) {
					return nil, errors.New("document not found")
				}
			},
			wantErr: true,
			errMsg:  "failed to get document",
		},
		{
			name:   "異常系：ブロック取得失敗",
			docID:  1,
			userID: 10,
			setupMocks: func(docRepo *MockDocumentCoreRepository, blockRepo *MockBlockRepository) {
				docRepo.GetDocumentFunc = func(docID, userID int) (*models.Document, error) {
					return &models.Document{
						ID:        1,
						UserID:    10,
						Title:     "テスト文書",
						CreatedAt: now,
						UpdatedAt: now,
					}, nil
				}
				blockRepo.GetBlocksByDocumentIDFunc = func(docID int) ([]models.Block, error) {
					return nil, errors.New("blocks not found")
				}
			},
			wantErr: true,
			errMsg:  "failed to get blocks",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// モックリポジトリのセットアップ
			docRepo := &MockDocumentCoreRepository{}
			blockRepo := &MockBlockRepository{}
			treeRepo := &MockDocumentTreeRepository{}
			trashRepo := &MockDocumentTrashRepository{}

			tt.setupMocks(docRepo, blockRepo)

			// サービスの初期化
			service := NewDocumentService(docRepo, blockRepo, treeRepo, trashRepo)

			// テスト実行
			result, err := service.GetDocumentWithBlocks(tt.docID, tt.userID)

			// エラーの検証
			if (err != nil) != tt.wantErr {
				t.Errorf("GetDocumentWithBlocks() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if tt.wantErr {
				if err == nil {
					t.Errorf("Expected error containing '%s', but got no error", tt.errMsg)
				}
				return
			}

			// 正常系の検証
			if result == nil {
				t.Error("Expected result, but got nil")
				return
			}

			if result.Document.ID != tt.expectedDoc.ID {
				t.Errorf("Document ID = %d, want %d", result.Document.ID, tt.expectedDoc.ID)
			}

			if result.Document.Title != tt.expectedDoc.Title {
				t.Errorf("Document Title = %s, want %s", result.Document.Title, tt.expectedDoc.Title)
			}

			if len(result.Blocks) != len(tt.expectedBlocks) {
				t.Errorf("Blocks count = %d, want %d", len(result.Blocks), len(tt.expectedBlocks))
			}
		})
	}
}

// TestCreateDocument - 文書作成のテスト
func TestCreateDocument(t *testing.T) {
	tests := []struct {
		name      string
		doc       *models.Document
		setupMock func(*MockDocumentCoreRepository)
		wantErr   bool
	}{
		{
			name: "正常系：文書作成成功",
			doc: &models.Document{
				UserID:  10,
				Title:   "新規文書",
				Content: "新規内容",
			},
			setupMock: func(docRepo *MockDocumentCoreRepository) {
				docRepo.CreateDocumentFunc = func(doc *models.Document) error {
					doc.ID = 1
					return nil
				}
			},
			wantErr: false,
		},
		{
			name: "異常系：文書作成失敗",
			doc: &models.Document{
				UserID:  10,
				Title:   "",
				Content: "",
			},
			setupMock: func(docRepo *MockDocumentCoreRepository) {
				docRepo.CreateDocumentFunc = func(doc *models.Document) error {
					return errors.New("title is required")
				}
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// モックリポジトリのセットアップ
			docRepo := &MockDocumentCoreRepository{}
			tt.setupMock(docRepo)

			service := NewDocumentService(docRepo, nil, nil, nil)

			// テスト実行
			err := service.CreateDocument(tt.doc)

			// エラーの検証
			if (err != nil) != tt.wantErr {
				t.Errorf("CreateDocument() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

// TestUpdateDocumentWithBlocks - 文書とブロック統合更新のテスト
func TestUpdateDocumentWithBlocks(t *testing.T) {
	tests := []struct {
		name       string
		docID      int
		userID     int
		title      string
		content    string
		blocks     []models.Block
		setupMocks func(*MockDocumentCoreRepository, *MockBlockRepository)
		wantErr    bool
		errMsg     string
	}{
		{
			name:    "正常系：文書とブロックの統合更新成功",
			docID:   1,
			userID:  10,
			title:   "更新後のタイトル",
			content: "更新後の内容",
			blocks: []models.Block{
				{
					ID:         1,
					DocumentID: 1,
					Type:       "paragraph",
					Content:    json.RawMessage(`{"text":"更新後ブロック"}`),
					Position:   0,
				},
			},
			setupMocks: func(docRepo *MockDocumentCoreRepository, blockRepo *MockBlockRepository) {
				docRepo.UpdateDocumentFunc = func(docID, userID int, title, content string) error {
					return nil
				}
				blockRepo.UpdateBlocksFunc = func(docID int, blocks []models.Block) error {
					return nil
				}
			},
			wantErr: false,
		},
		{
			name:    "異常系：文書更新失敗",
			docID:   1,
			userID:  10,
			title:   "更新後のタイトル",
			content: "更新後の内容",
			blocks:  []models.Block{},
			setupMocks: func(docRepo *MockDocumentCoreRepository, blockRepo *MockBlockRepository) {
				docRepo.UpdateDocumentFunc = func(docID, userID int, title, content string) error {
					return errors.New("update failed")
				}
			},
			wantErr: true,
			errMsg:  "failed to update document",
		},
		{
			name:    "異常系：ブロック更新失敗",
			docID:   1,
			userID:  10,
			title:   "更新後のタイトル",
			content: "更新後の内容",
			blocks:  []models.Block{},
			setupMocks: func(docRepo *MockDocumentCoreRepository, blockRepo *MockBlockRepository) {
				docRepo.UpdateDocumentFunc = func(docID, userID int, title, content string) error {
					return nil
				}
				blockRepo.UpdateBlocksFunc = func(docID int, blocks []models.Block) error {
					return errors.New("block update failed")
				}
			},
			wantErr: true,
			errMsg:  "failed to update blocks",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// モックリポジトリのセットアップ
			docRepo := &MockDocumentCoreRepository{}
			blockRepo := &MockBlockRepository{}
			tt.setupMocks(docRepo, blockRepo)

			service := NewDocumentService(docRepo, blockRepo, nil, nil)

			// テスト実行
			err := service.UpdateDocumentWithBlocks(tt.docID, tt.userID, tt.title, tt.content, tt.blocks)

			// エラーの検証
			if (err != nil) != tt.wantErr {
				t.Errorf("UpdateDocumentWithBlocks() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

// TestSoftDeleteDocument - 論理削除のテスト
func TestSoftDeleteDocument(t *testing.T) {
	tests := []struct {
		name      string
		docID     int
		userID    int
		setupMock func(*MockDocumentTrashRepository)
		wantErr   bool
	}{
		{
			name:   "正常系：論理削除成功",
			docID:  1,
			userID: 10,
			setupMock: func(trashRepo *MockDocumentTrashRepository) {
				trashRepo.SoftDeleteDocumentFunc = func(docID, userID int) error {
					return nil
				}
			},
			wantErr: false,
		},
		{
			name:   "異常系：論理削除失敗",
			docID:  999,
			userID: 10,
			setupMock: func(trashRepo *MockDocumentTrashRepository) {
				trashRepo.SoftDeleteDocumentFunc = func(docID, userID int) error {
					return errors.New("document not found")
				}
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// モックリポジトリのセットアップ
			trashRepo := &MockDocumentTrashRepository{}
			tt.setupMock(trashRepo)

			service := NewDocumentService(nil, nil, nil, trashRepo)

			// テスト実行
			err := service.SoftDeleteDocument(tt.docID, tt.userID)

			// エラーの検証
			if (err != nil) != tt.wantErr {
				t.Errorf("SoftDeleteDocument() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

// TestRestoreDocument - 復元のテスト
func TestRestoreDocument(t *testing.T) {
	tests := []struct {
		name      string
		docID     int
		userID    int
		setupMock func(*MockDocumentTrashRepository)
		wantErr   bool
	}{
		{
			name:   "正常系：復元成功",
			docID:  1,
			userID: 10,
			setupMock: func(trashRepo *MockDocumentTrashRepository) {
				trashRepo.RestoreDocumentFunc = func(docID, userID int) error {
					return nil
				}
			},
			wantErr: false,
		},
		{
			name:   "異常系：復元失敗",
			docID:  999,
			userID: 10,
			setupMock: func(trashRepo *MockDocumentTrashRepository) {
				trashRepo.RestoreDocumentFunc = func(docID, userID int) error {
					return errors.New("document not found in trash")
				}
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// モックリポジトリのセットアップ
			trashRepo := &MockDocumentTrashRepository{}
			tt.setupMock(trashRepo)

			service := NewDocumentService(nil, nil, nil, trashRepo)

			// テスト実行
			err := service.RestoreDocument(tt.docID, tt.userID)

			// エラーの検証
			if (err != nil) != tt.wantErr {
				t.Errorf("RestoreDocument() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
