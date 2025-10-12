package app

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

// ShutdownHook は、シャットダウン時に実行される関数の型定義です
type ShutdownHook func(ctx context.Context) error

// LifecyclePhase は、アプリケーションのライフサイクルフェーズです
type LifecyclePhase int

const (
	PhaseInitializing LifecyclePhase = iota
	PhaseStarting
	PhaseRunning
	PhaseStopping
	PhaseStopped
)

// String は、LifecyclePhaseを文字列に変換します
func (p LifecyclePhase) String() string {
	switch p {
	case PhaseInitializing:
		return "INITIALIZING"
	case PhaseStarting:
		return "STARTING"
	case PhaseRunning:
		return "RUNNING"
	case PhaseStopping:
		return "STOPPING"
	case PhaseStopped:
		return "STOPPED"
	default:
		return "UNKNOWN"
	}
}

// LifecycleManager は、アプリケーションのライフサイクルを管理する構造体です
type LifecycleManager struct {
	currentPhase    LifecyclePhase
	phaseMutex      sync.RWMutex
	shutdownHooks   []ShutdownHook
	hooksMutex      sync.Mutex
	shutdownTimeout time.Duration
	signalChan      chan os.Signal
	doneChan        chan struct{}
	logger          *Logger
}

// NewLifecycleManager は、新しいLifecycleManagerインスタンスを作成します
func NewLifecycleManager(logger *Logger) *LifecycleManager {
	lm := &LifecycleManager{
		currentPhase:    PhaseInitializing,
		shutdownHooks:   make([]ShutdownHook, 0),
		shutdownTimeout: 30 * time.Second,
		signalChan:      make(chan os.Signal, 1),
		doneChan:        make(chan struct{}),
		logger:          logger,
	}

	// シグナルハンドリングの設定
	signal.Notify(lm.signalChan, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)

	return lm
}

// GetCurrentPhase は、現在のライフサイクルフェーズを取得します
func (lm *LifecycleManager) GetCurrentPhase() LifecyclePhase {
	lm.phaseMutex.RLock()
	defer lm.phaseMutex.RUnlock()
	return lm.currentPhase
}

// setPhase は、ライフサイクルフェーズを設定します
func (lm *LifecycleManager) setPhase(phase LifecyclePhase) {
	lm.phaseMutex.Lock()
	defer lm.phaseMutex.Unlock()

	if lm.currentPhase != phase {
		oldPhase := lm.currentPhase
		lm.currentPhase = phase
		lm.logger.Info("Lifecycle phase transition", map[string]interface{}{
			"from": oldPhase.String(),
			"to":   phase.String(),
		})
	}
}

// AddShutdownHook は、シャットダウン時に実行される関数を追加します
func (lm *LifecycleManager) AddShutdownHook(hook ShutdownHook) {
	lm.hooksMutex.Lock()
	defer lm.hooksMutex.Unlock()
	lm.shutdownHooks = append(lm.shutdownHooks, hook)
}

// SetShutdownTimeout は、シャットダウンのタイムアウト時間を設定します
func (lm *LifecycleManager) SetShutdownTimeout(timeout time.Duration) {
	lm.shutdownTimeout = timeout
}

// Start は、ライフサイクル管理を開始します
func (lm *LifecycleManager) Start() {
	lm.setPhase(PhaseStarting)

	go lm.watchSignals()

	lm.setPhase(PhaseRunning)
	lm.logger.Info("Lifecycle manager started", map[string]interface{}{
		"shutdown_timeout": lm.shutdownTimeout.String(),
	})
}

// watchSignals は、シグナルを監視してシャットダウンを実行します
func (lm *LifecycleManager) watchSignals() {
	for {
		select {
		case sig := <-lm.signalChan:
			lm.logger.Info("Received shutdown signal", map[string]interface{}{
				"signal": sig.String(),
			})

			if err := lm.Shutdown(); err != nil {
				lm.logger.Error("Shutdown failed", err)
				os.Exit(1)
			}
			return

		case <-lm.doneChan:
			return
		}
	}
}

// Shutdown は、グレースフルシャットダウンを実行します
func (lm *LifecycleManager) Shutdown() error {
	// 既にシャットダウン中または停止済みの場合はスキップ
	currentPhase := lm.GetCurrentPhase()
	if currentPhase == PhaseStopping || currentPhase == PhaseStopped {
		return nil
	}

	lm.setPhase(PhaseStopping)

	lm.logger.Info("Starting graceful shutdown", map[string]interface{}{
		"timeout": lm.shutdownTimeout.String(),
	})

	// シャットダウンのタイムアウトコンテキストを作成
	ctx, cancel := context.WithTimeout(context.Background(), lm.shutdownTimeout)
	defer cancel()

	// シャットダウンフックを並行実行
	lm.hooksMutex.Lock()
	hooks := make([]ShutdownHook, len(lm.shutdownHooks))
	copy(hooks, lm.shutdownHooks)
	lm.hooksMutex.Unlock()

	if len(hooks) > 0 {
		if err := lm.executeShutdownHooks(ctx, hooks); err != nil {
			lm.logger.Error("Shutdown hooks execution failed", err)
			lm.setPhase(PhaseStopped)
			return err
		}
	}

	// シグナル監視を停止
	signal.Stop(lm.signalChan)
	close(lm.doneChan)

	lm.setPhase(PhaseStopped)
	lm.logger.Info("Graceful shutdown completed")

	return nil
}

// executeShutdownHooks は、シャットダウンフックを実行します
func (lm *LifecycleManager) executeShutdownHooks(ctx context.Context, hooks []ShutdownHook) error {
	hookCount := len(hooks)
	errChan := make(chan error, hookCount)

	lm.logger.Info("Executing shutdown hooks", map[string]interface{}{
		"hook_count": hookCount,
	})

	// 各フックを並行実行
	for i, hook := range hooks {
		go func(index int, h ShutdownHook) {
			lm.logger.Debug("Starting shutdown hook", map[string]interface{}{
				"hook_index": index,
			})

			if err := h(ctx); err != nil {
				lm.logger.Error("Shutdown hook failed", err, map[string]interface{}{
					"hook_index": index,
				})
				errChan <- fmt.Errorf("shutdown hook %d failed: %w", index, err)
			} else {
				lm.logger.Debug("Shutdown hook completed", map[string]interface{}{
					"hook_index": index,
				})
				errChan <- nil
			}
		}(i, hook)
	}

	// すべてのフックの完了を待機
	var errors []error
	for i := 0; i < hookCount; i++ {
		select {
		case err := <-errChan:
			if err != nil {
				errors = append(errors, err)
			}
		case <-ctx.Done():
			return fmt.Errorf("shutdown hooks execution timed out: %w", ctx.Err())
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("shutdown hooks failed: %v", errors)
	}

	return nil
}

// Wait は、シャットダウンが完了するまで待機します
func (lm *LifecycleManager) Wait() {
	<-lm.doneChan
}

// IsRunning は、アプリケーションが実行中かどうかを確認します
func (lm *LifecycleManager) IsRunning() bool {
	return lm.GetCurrentPhase() == PhaseRunning
}

// IsShuttingDown は、アプリケーションがシャットダウン中かどうかを確認します
func (lm *LifecycleManager) IsShuttingDown() bool {
	phase := lm.GetCurrentPhase()
	return phase == PhaseStopping || phase == PhaseStopped
}

// GetUptime は、アプリケーションの稼働時間を取得します
func (lm *LifecycleManager) GetUptime() time.Duration {
	// 実装を簡単にするため、ここでは概算値を返します
	// 実際の実装では開始時刻を記録する必要があります
	return time.Since(time.Now().Add(-time.Hour)) // プレースホルダー
}
