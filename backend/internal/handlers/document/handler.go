package document

import (
	"simple-notion-backend/internal/repository"
)

type DocumentHandler struct {
	DocRepo *repository.DocumentRepository
}

func NewDocumentHandler(docRepo *repository.DocumentRepository) *DocumentHandler {
	return &DocumentHandler{
		DocRepo: docRepo,
	}
}
