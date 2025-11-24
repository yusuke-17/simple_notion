package upload

import (
	"testing"
	"time"
)

// TestNewUploadHandler は UploadHandler の初期化テスト
func TestNewUploadHandler(t *testing.T) {
	handler := NewUploadHandler(nil, 100*1024*1024)

	if handler == nil {
		t.Fatal("Expected handler to be non-nil")
	}

	if handler.userStorageQuota != 100*1024*1024 {
		t.Errorf("Expected quota 100MB, got %d", handler.userStorageQuota)
	}

	if handler.urlCache == nil {
		t.Error("Expected urlCache to be initialized")
	}
}

// TestCacheOperations は キャッシュ操作のテスト
func TestCacheOperations(t *testing.T) {
	handler := NewUploadHandler(nil, 100*1024*1024)

	// キャッシュに保存
	testFileKey := "test-file-key"
	testURL := "https://example.com/test-url"
	handler.setCachedURL(testFileKey, testURL, 1*time.Hour) // 1時間

	// キャッシュから取得
	cachedURL, found := handler.getCachedURL(testFileKey)
	if !found {
		t.Error("Expected cached URL to be found")
	}

	if cachedURL != testURL {
		t.Errorf("Expected cached URL '%s', got '%s'", testURL, cachedURL)
	}

	// 存在しないキーの取得
	_, found = handler.getCachedURL("non-existent-key")
	if found {
		t.Error("Expected non-existent key to not be found")
	}
}
