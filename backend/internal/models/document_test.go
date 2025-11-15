package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestDocument(t *testing.T) {
	t.Run("Document struct creation", func(t *testing.T) {
		now := time.Now()
		parentID := 5
		document := Document{
			ID:        1,
			UserID:    10,
			ParentID:  &parentID,
			Title:     "Test Document",
			Content:   "Test content",
			TreePath:  "1.5",
			Level:     2,
			SortOrder: 1,
			IsDeleted: false,
			CreatedAt: now,
			UpdatedAt: now,
		}

		if document.ID != 1 {
			t.Errorf("Expected ID to be 1, got %d", document.ID)
		}
		if document.UserID != 10 {
			t.Errorf("Expected UserID to be 10, got %d", document.UserID)
		}
		if document.ParentID == nil || *document.ParentID != 5 {
			t.Errorf("Expected ParentID to be 5, got %v", document.ParentID)
		}
		if document.Title != "Test Document" {
			t.Errorf("Expected Title to be 'Test Document', got %s", document.Title)
		}
		if document.Content != "Test content" {
			t.Errorf("Expected Content to be 'Test content', got %s", document.Content)
		}
		if document.TreePath != "1.5" {
			t.Errorf("Expected TreePath to be '1.5', got %s", document.TreePath)
		}
		if document.Level != 2 {
			t.Errorf("Expected Level to be 2, got %d", document.Level)
		}
		if document.SortOrder != 1 {
			t.Errorf("Expected SortOrder to be 1, got %d", document.SortOrder)
		}
		if document.IsDeleted != false {
			t.Errorf("Expected IsDeleted to be false, got %t", document.IsDeleted)
		}
	})

	t.Run("Document with nil ParentID", func(t *testing.T) {
		now := time.Now()
		document := Document{
			ID:        2,
			UserID:    10,
			ParentID:  nil,
			Title:     "Root Document",
			Content:   "Root content",
			TreePath:  "2",
			Level:     1,
			SortOrder: 1,
			IsDeleted: false,
			CreatedAt: now,
			UpdatedAt: now,
		}

		if document.ParentID != nil {
			t.Errorf("Expected ParentID to be nil, got %v", document.ParentID)
		}
		if document.Level != 1 {
			t.Errorf("Expected Level to be 1 for root document, got %d", document.Level)
		}
	})
}

func TestBlock(t *testing.T) {
	t.Run("Block struct creation", func(t *testing.T) {
		now := time.Now()
		// JSONコンテンツをRawMessageとして作成
		content := json.RawMessage(`{"text":"Hello, World!","style":"bold"}`)

		block := Block{
			ID:         1,
			DocumentID: 10,
			Type:       "text",
			Content:    content,
			Position:   0,
			CreatedAt:  now,
		}

		if block.ID != 1 {
			t.Errorf("Expected ID to be 1, got %d", block.ID)
		}
		if block.DocumentID != 10 {
			t.Errorf("Expected DocumentID to be 10, got %d", block.DocumentID)
		}
		if block.Type != "text" {
			t.Errorf("Expected Type to be 'text', got %s", block.Type)
		}
		if block.Position != 0 {
			t.Errorf("Expected Position to be 0, got %d", block.Position)
		}

		// Content validation - RawMessageをパースして確認
		var contentMap map[string]interface{}
		if err := json.Unmarshal(block.Content, &contentMap); err != nil {
			t.Errorf("Failed to unmarshal Content: %v", err)
		} else {
			if contentMap["text"] != "Hello, World!" {
				t.Errorf("Expected Content text to be 'Hello, World!', got %v", contentMap["text"])
			}
			if contentMap["style"] != "bold" {
				t.Errorf("Expected Content style to be 'bold', got %v", contentMap["style"])
			}
		}
	})
}

func TestDocumentTreeNode(t *testing.T) {
	t.Run("DocumentTreeNode creation", func(t *testing.T) {
		now := time.Now()

		// Parent document
		parentDoc := Document{
			ID:        1,
			UserID:    10,
			ParentID:  nil,
			Title:     "Parent Document",
			Content:   "Parent content",
			TreePath:  "1",
			Level:     1,
			SortOrder: 1,
			IsDeleted: false,
			CreatedAt: now,
			UpdatedAt: now,
		}

		// Child documents
		parentIDForChild := 1
		childDoc1 := DocumentTreeNode{
			Document: Document{
				ID:        2,
				UserID:    10,
				ParentID:  &parentIDForChild,
				Title:     "Child Document 1",
				Content:   "Child content 1",
				TreePath:  "1.2",
				Level:     2,
				SortOrder: 1,
				IsDeleted: false,
				CreatedAt: now,
				UpdatedAt: now,
			},
			Children: []DocumentTreeNode{},
		}

		childDoc2 := DocumentTreeNode{
			Document: Document{
				ID:        3,
				UserID:    10,
				ParentID:  &parentIDForChild,
				Title:     "Child Document 2",
				Content:   "Child content 2",
				TreePath:  "1.3",
				Level:     2,
				SortOrder: 2,
				IsDeleted: false,
				CreatedAt: now,
				UpdatedAt: now,
			},
			Children: []DocumentTreeNode{},
		}

		parentTreeNode := DocumentTreeNode{
			Document: parentDoc,
			Children: []DocumentTreeNode{childDoc1, childDoc2},
		}

		if parentTreeNode.Document.ID != 1 {
			t.Errorf("Expected parent document ID to be 1, got %d", parentTreeNode.Document.ID)
		}
		if len(parentTreeNode.Children) != 2 {
			t.Errorf("Expected 2 children, got %d", len(parentTreeNode.Children))
		}
		if parentTreeNode.Children[0].Document.Title != "Child Document 1" {
			t.Errorf("Expected first child title to be 'Child Document 1', got %s", parentTreeNode.Children[0].Document.Title)
		}
		if parentTreeNode.Children[1].Document.Title != "Child Document 2" {
			t.Errorf("Expected second child title to be 'Child Document 2', got %s", parentTreeNode.Children[1].Document.Title)
		}
	})
}

func TestDocumentWithBlocks(t *testing.T) {
	t.Run("DocumentWithBlocks creation", func(t *testing.T) {
		now := time.Now()

		document := Document{
			ID:        1,
			UserID:    10,
			ParentID:  nil,
			Title:     "Document with Blocks",
			Content:   "Document content",
			TreePath:  "1",
			Level:     1,
			SortOrder: 1,
			IsDeleted: false,
			CreatedAt: now,
			UpdatedAt: now,
		}

		blocks := []Block{
			{
				ID:         1,
				DocumentID: 1,
				Type:       "text",
				Content:    json.RawMessage(`{"text":"First block"}`),
				Position:   0,
				CreatedAt:  now,
			},
			{
				ID:         2,
				DocumentID: 1,
				Type:       "heading",
				Content:    json.RawMessage(`{"text":"Heading","level":1}`),
				Position:   1,
				CreatedAt:  now,
			},
		}

		docWithBlocks := DocumentWithBlocks{
			Document: document,
			Blocks:   blocks,
		}

		if docWithBlocks.Document.ID != 1 {
			t.Errorf("Expected document ID to be 1, got %d", docWithBlocks.Document.ID)
		}
		if len(docWithBlocks.Blocks) != 2 {
			t.Errorf("Expected 2 blocks, got %d", len(docWithBlocks.Blocks))
		}
		if docWithBlocks.Blocks[0].Type != "text" {
			t.Errorf("Expected first block type to be 'text', got %s", docWithBlocks.Blocks[0].Type)
		}
		if docWithBlocks.Blocks[1].Type != "heading" {
			t.Errorf("Expected second block type to be 'heading', got %s", docWithBlocks.Blocks[1].Type)
		}
	})
}
