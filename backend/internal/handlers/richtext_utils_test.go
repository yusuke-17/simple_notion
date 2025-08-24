package handlers

import (
	"testing"
)

func TestIsRichTextContent(t *testing.T) {
	tests := []struct {
		name     string
		content  string
		expected bool
	}{
		{
			name:     "Valid TipTap JSON",
			content:  `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello world"}]}]}`,
			expected: true,
		},
		{
			name:     "Empty TipTap document",
			content:  `{"type":"doc","content":[]}`,
			expected: true,
		},
		{
			name:     "Plain text",
			content:  "This is plain text",
			expected: false,
		},
		{
			name:     "Empty string",
			content:  "",
			expected: false,
		},
		{
			name:     "Invalid JSON",
			content:  `{"type":"doc","content"`,
			expected: false,
		},
		{
			name:     "JSON but not TipTap",
			content:  `{"message":"hello"}`,
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsRichTextContent(tt.content)
			if result != tt.expected {
				t.Errorf("IsRichTextContent(%q) = %v, expected %v", tt.content, result, tt.expected)
			}
		})
	}
}

func TestConvertPlainTextToRichText(t *testing.T) {
	tests := []struct {
		name      string
		plainText string
		expected  string
	}{
		{
			name:      "Simple text",
			plainText: "Hello world",
			expected:  `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello world"}]}]}`,
		},
		{
			name:      "Empty string",
			plainText: "",
			expected:  `{"type":"doc","content":[]}`,
		},
		{
			name:      "Multi-line text",
			plainText: "Line 1\nLine 2",
			expected:  `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Line 1"}]},{"type":"paragraph","content":[{"type":"text","text":"Line 2"}]}]}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ConvertPlainTextToRichText(tt.plainText)
			if result != tt.expected {
				t.Errorf("ConvertPlainTextToRichText(%q) = %q, expected %q", tt.plainText, result, tt.expected)
			}
		})
	}
}

func TestExtractPlainTextFromRichText(t *testing.T) {
	tests := []struct {
		name         string
		richTextJSON string
		expected     string
	}{
		{
			name:         "Simple rich text",
			richTextJSON: `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello world"}]}]}`,
			expected:     "Hello world",
		},
		{
			name:         "Rich text with formatting",
			richTextJSON: `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello ","marks":[]},{"type":"text","text":"world","marks":[{"type":"bold"}]}]}]}`,
			expected:     "Hello world",
		},
		{
			name:         "Multi-paragraph",
			richTextJSON: `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Para 1"}]},{"type":"paragraph","content":[{"type":"text","text":"Para 2"}]}]}`,
			expected:     "Para 1\nPara 2",
		},
		{
			name:         "Plain text (fallback)",
			richTextJSON: "This is plain text",
			expected:     "This is plain text",
		},
		{
			name:         "Empty document",
			richTextJSON: `{"type":"doc","content":[]}`,
			expected:     "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ExtractPlainTextFromRichText(tt.richTextJSON)
			if result != tt.expected {
				t.Errorf("ExtractPlainTextFromRichText(%q) = %q, expected %q", tt.richTextJSON, result, tt.expected)
			}
		})
	}
}

func TestValidateRichTextJSON(t *testing.T) {
	tests := []struct {
		name        string
		content     string
		expectError bool
	}{
		{
			name:        "Valid TipTap JSON",
			content:     `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}`,
			expectError: false,
		},
		{
			name:        "Invalid JSON",
			content:     `{"type":"doc","content"`,
			expectError: true,
		},
		{
			name:        "Valid JSON but wrong root type",
			content:     `{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}`,
			expectError: true,
		},
		{
			name:        "Plain text (no validation)",
			content:     "Plain text",
			expectError: false,
		},
		{
			name:        "Empty string",
			content:     "",
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateRichTextJSON(tt.content)
			hasError := err != nil
			if hasError != tt.expectError {
				t.Errorf("ValidateRichTextJSON(%q) error = %v, expected error = %v", tt.content, hasError, tt.expectError)
				if err != nil {
					t.Errorf("Error was: %v", err)
				}
			}
		})
	}
}
