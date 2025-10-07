package document

import (
	"simple-notion-backend/internal/services"
)

type DocumentHandler struct {
	DocumentService *services.DocumentService
}

func NewDocumentHandler(documentService *services.DocumentService) *DocumentHandler {
	return &DocumentHandler{
		DocumentService: documentService,
	}
}
