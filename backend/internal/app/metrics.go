package app

import (
	"fmt"
	"net/http"
	"runtime"
	"sync"
	"sync/atomic"
	"time"

	"simple-notion-backend/internal/config"
)

// Metrics は、アプリケーションのメトリクス管理を行う構造体です
type Metrics struct {
	// HTTP関連メトリクス
	httpRequestsTotal   int64
	httpRequestDuration int64 // ナノ秒単位
	httpErrorsTotal     int64
	httpActiveRequests  int64

	// アプリケーション関連メトリクス
	databaseConnections int64
	logCounters         map[string]int64
	errorCounters       map[string]int64

	// システム関連メトリクス
	startTime time.Time

	// 並行安全性のためのミューテックス
	logMutex   sync.RWMutex
	errorMutex sync.RWMutex

	config *config.Config
}

// MetricsSnapshot は、メトリクスのスナップショットです
type MetricsSnapshot struct {
	Timestamp           time.Time        `json:"timestamp"`
	Uptime              string           `json:"uptime"`
	HTTPRequestsTotal   int64            `json:"http_requests_total"`
	HTTPErrorsTotal     int64            `json:"http_errors_total"`
	HTTPActiveRequests  int64            `json:"http_active_requests"`
	DatabaseConnections int64            `json:"database_connections"`
	LogCounters         map[string]int64 `json:"log_counters"`
	ErrorCounters       map[string]int64 `json:"error_counters"`
	SystemInfo          SystemInfo       `json:"system_info"`
}

// SystemInfo は、システム情報です
type SystemInfo struct {
	GoVersion       string `json:"go_version"`
	Goroutines      int    `json:"goroutines"`
	MemoryAllocated uint64 `json:"memory_allocated"`
	MemoryTotal     uint64 `json:"memory_total"`
	CPUCount        int    `json:"cpu_count"`
}

// NewMetrics は、新しいMetricsインスタンスを作成します
func NewMetrics(cfg *config.Config) *Metrics {
	return &Metrics{
		logCounters:   make(map[string]int64),
		errorCounters: make(map[string]int64),
		startTime:     time.Now(),
		config:        cfg,
	}
}

// HTTPMiddleware は、HTTP メトリクス収集用のミドルウェアを返します
func (m *Metrics) HTTPMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()

		// アクティブリクエスト数を増加
		atomic.AddInt64(&m.httpActiveRequests, 1)
		defer atomic.AddInt64(&m.httpActiveRequests, -1)

		// レスポンスライターをラップしてステータスコードを取得
		wrapper := &responseWrapper{ResponseWriter: w, statusCode: 200}

		// 次のハンドラーを実行
		next.ServeHTTP(wrapper, r)

		// メトリクスを更新
		duration := time.Since(startTime)
		atomic.AddInt64(&m.httpRequestsTotal, 1)
		atomic.AddInt64(&m.httpRequestDuration, duration.Nanoseconds())

		// エラーステータスコードの場合はエラーカウントを増加
		if wrapper.statusCode >= 400 {
			atomic.AddInt64(&m.httpErrorsTotal, 1)
		}
	})
}

// responseWrapper は、HTTPレスポンスをラップしてステータスコードを取得します
type responseWrapper struct {
	http.ResponseWriter
	statusCode int
}

func (w *responseWrapper) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *responseWrapper) Write(data []byte) (int, error) {
	return w.ResponseWriter.Write(data)
}

// IncrementLogCount は、ログレベル別のカウントを増加します
func (m *Metrics) IncrementLogCount(level string) {
	m.logMutex.Lock()
	defer m.logMutex.Unlock()
	m.logCounters[level]++
}

// IncrementErrorCount は、コンポーネント別のエラーカウントを増加します
func (m *Metrics) IncrementErrorCount(component string) {
	m.errorMutex.Lock()
	defer m.errorMutex.Unlock()
	m.errorCounters[component]++
}

// SetDatabaseConnections は、データベース接続数を設定します
func (m *Metrics) SetDatabaseConnections(count int64) {
	atomic.StoreInt64(&m.databaseConnections, count)
}

// GetSnapshot は、現在のメトリクスのスナップショットを取得します
func (m *Metrics) GetSnapshot() MetricsSnapshot {
	m.logMutex.RLock()
	logCounters := make(map[string]int64)
	for k, v := range m.logCounters {
		logCounters[k] = v
	}
	m.logMutex.RUnlock()

	m.errorMutex.RLock()
	errorCounters := make(map[string]int64)
	for k, v := range m.errorCounters {
		errorCounters[k] = v
	}
	m.errorMutex.RUnlock()

	// システム情報を取得
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	return MetricsSnapshot{
		Timestamp:           time.Now(),
		Uptime:              time.Since(m.startTime).String(),
		HTTPRequestsTotal:   atomic.LoadInt64(&m.httpRequestsTotal),
		HTTPErrorsTotal:     atomic.LoadInt64(&m.httpErrorsTotal),
		HTTPActiveRequests:  atomic.LoadInt64(&m.httpActiveRequests),
		DatabaseConnections: atomic.LoadInt64(&m.databaseConnections),
		LogCounters:         logCounters,
		ErrorCounters:       errorCounters,
		SystemInfo: SystemInfo{
			GoVersion:       runtime.Version(),
			Goroutines:      runtime.NumGoroutine(),
			MemoryAllocated: memStats.Alloc,
			MemoryTotal:     memStats.TotalAlloc,
			CPUCount:        runtime.NumCPU(),
		},
	}
}

// GetHTTPRequestsTotal は、総HTTP リクエスト数を取得します
func (m *Metrics) GetHTTPRequestsTotal() int64 {
	return atomic.LoadInt64(&m.httpRequestsTotal)
}

// GetHTTPErrorsTotal は、総HTTP エラー数を取得します
func (m *Metrics) GetHTTPErrorsTotal() int64 {
	return atomic.LoadInt64(&m.httpErrorsTotal)
}

// GetHTTPActiveRequests は、現在のアクティブHTTP リクエスト数を取得します
func (m *Metrics) GetHTTPActiveRequests() int64 {
	return atomic.LoadInt64(&m.httpActiveRequests)
}

// GetAverageResponseTime は、平均レスポンス時間（ミリ秒）を取得します
func (m *Metrics) GetAverageResponseTime() float64 {
	totalRequests := atomic.LoadInt64(&m.httpRequestsTotal)
	if totalRequests == 0 {
		return 0
	}

	totalDuration := atomic.LoadInt64(&m.httpRequestDuration)
	avgNanos := float64(totalDuration) / float64(totalRequests)
	return avgNanos / 1000000 // ナノ秒をミリ秒に変換
}

// IsHealthy は、システムの健全性をチェックします
func (m *Metrics) IsHealthy() (bool, []string) {
	var issues []string

	// エラー率のチェック（10%を超える場合は不健全）
	totalRequests := atomic.LoadInt64(&m.httpRequestsTotal)
	totalErrors := atomic.LoadInt64(&m.httpErrorsTotal)
	if totalRequests > 10 && float64(totalErrors)/float64(totalRequests) > 0.1 {
		issues = append(issues, fmt.Sprintf("High error rate: %.2f%%",
			float64(totalErrors)/float64(totalRequests)*100))
	}

	// メモリ使用量のチェック
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	if memStats.Alloc > 1024*1024*1024 { // 1GB以上の場合
		issues = append(issues, fmt.Sprintf("High memory usage: %d MB",
			memStats.Alloc/1024/1024))
	}

	// Goroutine数のチェック
	if runtime.NumGoroutine() > 1000 {
		issues = append(issues, fmt.Sprintf("High goroutine count: %d",
			runtime.NumGoroutine()))
	}

	return len(issues) == 0, issues
}

// Reset は、メトリクスをリセットします（テスト用）
func (m *Metrics) Reset() {
	atomic.StoreInt64(&m.httpRequestsTotal, 0)
	atomic.StoreInt64(&m.httpRequestDuration, 0)
	atomic.StoreInt64(&m.httpErrorsTotal, 0)
	atomic.StoreInt64(&m.httpActiveRequests, 0)
	atomic.StoreInt64(&m.databaseConnections, 0)

	m.logMutex.Lock()
	m.logCounters = make(map[string]int64)
	m.logMutex.Unlock()

	m.errorMutex.Lock()
	m.errorCounters = make(map[string]int64)
	m.errorMutex.Unlock()

	m.startTime = time.Now()
}
