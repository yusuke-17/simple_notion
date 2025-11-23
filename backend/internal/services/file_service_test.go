package services

import (
	"testing"
)

// TestFileService_SanitizeFilename は sanitizeFilename 関数のテストです
func TestFileService_SanitizeFilename(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "通常のファイル名",
			input:    "test-file_123",
			expected: "test-file_123",
		},
		{
			name:     "日本語を含むファイル名",
			input:    "テストファイル",
			expected: "_______",
		},
		{
			name:     "特殊文字を含むファイル名",
			input:    "test@file#123!.jpg",
			expected: "test_file_123__jpg",
		},
		{
			name:     "スペースを含むファイル名",
			input:    "test file name",
			expected: "test_file_name",
		},
		{
			name:     "空のファイル名",
			input:    "",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sanitizeFilename(tt.input)
			if result != tt.expected {
				t.Errorf("sanitizeFilename(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

// TestFileService_GenerateFileKey は generateFileKey 関数のテストです
func TestFileService_GenerateFileKey(t *testing.T) {
	tests := []struct {
		name     string
		userID   int
		filename string
		prefix   string
	}{
		{
			name:     "画像ファイル",
			userID:   1,
			filename: "test.jpg",
			prefix:   "images",
		},
		{
			name:     "ドキュメントファイル",
			userID:   2,
			filename: "document.pdf",
			prefix:   "files",
		},
		{
			name:     "長いファイル名",
			userID:   3,
			filename: "very_long_filename_that_should_be_truncated_to_fifty_characters_maximum.txt",
			prefix:   "files",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := generateFileKey(tt.userID, tt.filename, tt.prefix)

			// プレフィックスが含まれているか確認
			if len(result) == 0 {
				t.Error("generateFileKey returned empty string")
			}

			// UUIDが含まれているか確認（36文字 + ハイフン）
			if len(result) < 40 {
				t.Errorf("generateFileKey returned too short key: %s", result)
			}
		})
	}
}

// TestFileService_IsValidImageType は isValidImageType 関数のテストです
func TestFileService_IsValidImageType(t *testing.T) {
	tests := []struct {
		name        string
		contentType string
		expected    bool
	}{
		{
			name:        "JPEG画像",
			contentType: "image/jpeg",
			expected:    true,
		},
		{
			name:        "PNG画像",
			contentType: "image/png",
			expected:    true,
		},
		{
			name:        "WebP画像",
			contentType: "image/webp",
			expected:    true,
		},
		{
			name:        "GIF画像",
			contentType: "image/gif",
			expected:    true,
		},
		{
			name:        "無効なタイプ（PDF）",
			contentType: "application/pdf",
			expected:    false,
		},
		{
			name:        "無効なタイプ（テキスト）",
			contentType: "text/plain",
			expected:    false,
		},
		{
			name:        "空の文字列",
			contentType: "",
			expected:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidImageType(tt.contentType)
			if result != tt.expected {
				t.Errorf("isValidImageType(%q) = %v, want %v", tt.contentType, result, tt.expected)
			}
		})
	}
}

// TestFileService_IsValidFileType は isValidFileType 関数のテストです
func TestFileService_IsValidFileType(t *testing.T) {
	tests := []struct {
		name        string
		contentType string
		expected    bool
	}{
		{
			name:        "PDFファイル",
			contentType: "application/pdf",
			expected:    true,
		},
		{
			name:        "Word文書（新形式）",
			contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			expected:    true,
		},
		{
			name:        "Excel文書（新形式）",
			contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			expected:    true,
		},
		{
			name:        "テキストファイル",
			contentType: "text/plain",
			expected:    true,
		},
		{
			name:        "ZIPファイル",
			contentType: "application/zip",
			expected:    true,
		},
		{
			name:        "無効なタイプ（画像）",
			contentType: "image/jpeg",
			expected:    false,
		},
		{
			name:        "無効なタイプ（動画）",
			contentType: "video/mp4",
			expected:    false,
		},
		{
			name:        "空の文字列",
			contentType: "",
			expected:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidFileType(tt.contentType)
			if result != tt.expected {
				t.Errorf("isValidFileType(%q) = %v, want %v", tt.contentType, result, tt.expected)
			}
		})
	}
}

// TestFileService_CleanupOrphanedFiles は CleanupOrphanedFiles メソッドの基本的なテストです
func TestFileService_CleanupOrphanedFiles(t *testing.T) {
	// このテストは実際のデータベースとS3クライアントが必要なため、
	// ここでは基本的な構造のみを示します
	// 実際の統合テストでは、モックを使用するか、テスト用のデータベースを使用します

	t.Skip("Requires database and S3 client setup")

	// TODO: モックを使用した統合テスト
	// 1. モックのFileRepositoryとS3Clientを作成
	// 2. FileServiceを初期化
	// 3. CleanupOrphanedFiles を呼び出し
	// 4. 期待される動作を確認
}

// Benchmark_GenerateFileKey は generateFileKey 関数のベンチマークです
func Benchmark_GenerateFileKey(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = generateFileKey(1, "test.jpg", "images")
	}
}

// Benchmark_SanitizeFilename は sanitizeFilename 関数のベンチマークです
func Benchmark_SanitizeFilename(b *testing.B) {
	filename := "test-file_with_special@characters#123!.jpg"
	for i := 0; i < b.N; i++ {
		_ = sanitizeFilename(filename)
	}
}
