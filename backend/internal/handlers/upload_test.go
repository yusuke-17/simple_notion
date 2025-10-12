package handlers

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestUploadImageHandler(t *testing.T) {
	// テスト用のuploadsディレクトリを作成
	testUploadDir := "./test_uploads"
	defer func() {
		os.RemoveAll(testUploadDir)
	}()

	t.Run("有効な画像ファイルのアップロード", func(t *testing.T) {
		// テスト用の画像データを作成（より完全なJPEGヘッダー）
		imageData := []byte{
			0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
			0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
			0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
			0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
			0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
			0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xD9,
		}

		// multipart/form-dataを作成
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)

		// Content-Typeを明示的に設定
		h := make(map[string][]string)
		h["Content-Type"] = []string{"image/jpeg"}
		part, err := writer.CreatePart(map[string][]string{
			"Content-Disposition": {"form-data; name=\"image\"; filename=\"test.jpg\""},
			"Content-Type":        {"image/jpeg"},
		})
		if err != nil {
			t.Fatalf("Failed to create form file: %v", err)
		}

		_, err = part.Write(imageData)
		if err != nil {
			t.Fatalf("Failed to write image data: %v", err)
		}

		writer.Close()

		// リクエストを作成
		req := httptest.NewRequest("POST", "/api/upload/image", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())

		// レスポンスレコーダーを作成
		w := httptest.NewRecorder()

		// ハンドラーを実行
		UploadImageHandler(w, req)

		// レスポンスを検証
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code 200, got %d", w.Code)
		}

		// レスポンスボディにsuccessフィールドが含まれていることを確認
		responseBody := w.Body.String()
		if !bytes.Contains([]byte(responseBody), []byte(`"success":true`)) {
			t.Errorf("Response should contain success: true, got: %s", responseBody)
		}
	})

	t.Run("ファイルが添付されていない場合", func(t *testing.T) {
		// 空のmultipart/form-dataを作成
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)
		writer.Close()

		req := httptest.NewRequest("POST", "/api/upload/image", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())

		w := httptest.NewRecorder()
		UploadImageHandler(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status code 400, got %d", w.Code)
		}
	})

	t.Run("無効なHTTPメソッド", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/upload/image", nil)
		w := httptest.NewRecorder()

		UploadImageHandler(w, req)

		if w.Code != http.StatusMethodNotAllowed {
			t.Errorf("Expected status code 405, got %d", w.Code)
		}
	})

	t.Run("OPTIONSリクエスト", func(t *testing.T) {
		req := httptest.NewRequest("OPTIONS", "/api/upload/image", nil)
		w := httptest.NewRecorder()

		UploadImageHandler(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code 200 for OPTIONS, got %d", w.Code)
		}
	})
}

func TestServeUploadsHandler(t *testing.T) {
	// テスト用のファイルを作成
	testUploadDir := "/tmp/test_uploads"
	os.MkdirAll(testUploadDir, 0755)
	defer os.RemoveAll(testUploadDir)

	testFile := filepath.Join(testUploadDir, "test.jpg")
	testContent := []byte("test image content")
	err := os.WriteFile(testFile, testContent, 0644)
	if err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// 注意: ServeUploadsHandlerの完全なテストには、
	// gorilla/muxルーターが必要です。統合テストで実装することを推奨します。
}

// ヘルパー関数のテスト
func TestIsValidImageType(t *testing.T) {
	tests := []struct {
		contentType string
		expected    bool
	}{
		{"image/jpeg", true},
		{"image/jpg", true},
		{"image/png", true},
		{"image/webp", true},
		{"image/gif", true},
		{"image/bmp", false},
		{"text/plain", false},
		{"application/octet-stream", false},
	}

	for _, test := range tests {
		result := isValidImageType(test.contentType)
		if result != test.expected {
			t.Errorf("isValidImageType(%s) = %v, expected %v", test.contentType, result, test.expected)
		}
	}
}

func TestIsValidFilename(t *testing.T) {
	tests := []struct {
		filename string
		expected bool
	}{
		{"test.jpg", true},
		{"image_001.png", true},
		{"my-file.gif", true},
		{"../etc/passwd", false},
		{"file/with/slash.jpg", false},
		{"file\\with\\backslash.jpg", false},
		{"file:with:colon.jpg", false},
		{"file*with*asterisk.jpg", false},
	}

	for _, test := range tests {
		result := isValidFilename(test.filename)
		if result != test.expected {
			t.Errorf("isValidFilename(%s) = %v, expected %v", test.filename, result, test.expected)
		}
	}
}

func TestGenerateUniqueFilename(t *testing.T) {
	originalName := "test image.jpg"
	filename := generateUniqueFilename(originalName)

	// ファイル名にタイムスタンプが含まれていることを確認
	if len(filename) == 0 {
		t.Error("Generated filename should not be empty")
	}

	// 拡張子が保持されていることを確認
	if filepath.Ext(filename) != ".jpg" {
		t.Errorf("Extension should be preserved, got: %s", filepath.Ext(filename))
	}

	// 複数回生成して一意性を確認（わずかな時間間隔を置く）
	time.Sleep(1 * time.Millisecond) // ナノ秒レベルでの差を確保
	filename2 := generateUniqueFilename(originalName)
	if filename == filename2 {
		t.Error("Generated filenames should be unique")
	}
}
