package document

import (
	"encoding/json"
	"fmt"
	"strings"
)

// RichTextContent represents the TipTap JSON structure
type RichTextContent struct {
	Type    string                 `json:"type"`
	Content []RichTextNode         `json:"content,omitempty"`
	Attrs   map[string]interface{} `json:"attrs,omitempty"`
}

// RichTextNode represents a node in TipTap JSON structure
type RichTextNode struct {
	Type    string                 `json:"type"`
	Content []RichTextNode         `json:"content,omitempty"`
	Marks   []RichTextMark         `json:"marks,omitempty"`
	Text    string                 `json:"text,omitempty"`
	Attrs   map[string]interface{} `json:"attrs,omitempty"`
}

// RichTextMark represents inline formatting marks
type RichTextMark struct {
	Type  string                 `json:"type"`
	Attrs map[string]interface{} `json:"attrs,omitempty"`
}

// IsRichTextContent checks if the content string is in TipTap JSON format
func IsRichTextContent(content string) bool {
	if content == "" {
		return false
	}

	// Quick check: does it start with TipTap document structure?
	if !strings.HasPrefix(strings.TrimSpace(content), `{"type":"doc"`) {
		return false
	}

	// Try to parse as JSON to ensure it's valid TipTap format
	var richContent RichTextContent
	if err := json.Unmarshal([]byte(content), &richContent); err != nil {
		return false
	}

	// Validate that it has the expected TipTap structure
	return richContent.Type == "doc"
}

// ConvertPlainTextToRichText converts plain text to TipTap JSON format
func ConvertPlainTextToRichText(plainText string) string {
	if plainText == "" {
		return `{"type":"doc","content":[]}`
	}

	// Split by newlines and create paragraphs
	lines := strings.Split(plainText, "\n")
	var paragraphs []RichTextNode

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			// Empty paragraph
			paragraphs = append(paragraphs, RichTextNode{
				Type: "paragraph",
			})
		} else {
			// Paragraph with text
			paragraphs = append(paragraphs, RichTextNode{
				Type: "paragraph",
				Content: []RichTextNode{
					{
						Type: "text",
						Text: line,
					},
				},
			})
		}
	}

	richContent := RichTextContent{
		Type:    "doc",
		Content: paragraphs,
	}

	jsonBytes, _ := json.Marshal(richContent)
	return string(jsonBytes)
}

// ExtractPlainTextFromRichText extracts plain text from TipTap JSON format
func ExtractPlainTextFromRichText(richTextJSON string) string {
	if !IsRichTextContent(richTextJSON) {
		return richTextJSON
	}

	var richContent RichTextContent
	if err := json.Unmarshal([]byte(richTextJSON), &richContent); err != nil {
		return richTextJSON
	}

	var result strings.Builder
	extractTextFromNodes(richContent.Content, &result)
	return strings.TrimSpace(result.String())
}

// extractTextFromNodes recursively extracts text from TipTap nodes
func extractTextFromNodes(nodes []RichTextNode, result *strings.Builder) {
	for i, node := range nodes {
		if node.Text != "" {
			result.WriteString(node.Text)
		}

		if node.Content != nil {
			extractTextFromNodes(node.Content, result)
		}

		// Add line break between paragraphs (except for the last one)
		if node.Type == "paragraph" && i < len(nodes)-1 {
			result.WriteString("\n")
		}
	}
}

// ValidateRichTextJSON validates that the JSON is valid TipTap format
func ValidateRichTextJSON(content string) error {
	if content == "" {
		return nil // Empty content is valid
	}

	// If it doesn't look like JSON, it's probably plain text - no validation needed
	if !strings.HasPrefix(strings.TrimSpace(content), "{") {
		return nil
	}

	// Try to parse as JSON
	var richContent RichTextContent
	if err := json.Unmarshal([]byte(content), &richContent); err != nil {
		// If JSON parsing fails, assume it's intended as rich text but malformed
		return fmt.Errorf("invalid JSON format: %w", err)
	}

	// If it's valid JSON but not TipTap format (no "type" field or wrong type)
	if richContent.Type != "doc" {
		return fmt.Errorf("invalid TipTap format: root type must be 'doc', got '%s'", richContent.Type)
	}

	return nil
}
