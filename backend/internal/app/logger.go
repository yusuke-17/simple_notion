package app

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"runtime"
	"strings"
	"time"

	"simple-notion-backend/internal/config"
)

// LogLevel は、ログレベルの定義です
type LogLevel int

const (
	LogLevelDebug LogLevel = iota
	LogLevelInfo
	LogLevelWarn
	LogLevelError
	LogLevelFatal
)

// String は、LogLevelを文字列に変換します
func (l LogLevel) String() string {
	switch l {
	case LogLevelDebug:
		return "DEBUG"
	case LogLevelInfo:
		return "INFO"
	case LogLevelWarn:
		return "WARN"
	case LogLevelError:
		return "ERROR"
	case LogLevelFatal:
		return "FATAL"
	default:
		return "UNKNOWN"
	}
}

// LogEntry は、構造化ログエントリの定義です
type LogEntry struct {
	Timestamp string                 `json:"timestamp"`
	Level     string                 `json:"level"`
	Component string                 `json:"component"`
	Message   string                 `json:"message"`
	Fields    map[string]interface{} `json:"fields,omitempty"`
	File      string                 `json:"file,omitempty"`
	Line      int                    `json:"line,omitempty"`
	Function  string                 `json:"function,omitempty"`
}

// Logger は、高度なログ機能を提供する構造体です
type Logger struct {
	component string
	level     LogLevel
	output    io.Writer
	jsonMode  bool
	stdLogger *log.Logger
	metrics   *Metrics // メトリクス連携用
}

// NewLogger は、新しいLoggerインスタンスを作成します
func NewLogger(component string, cfg *config.Config, metrics *Metrics) *Logger {
	// ログレベルを環境変数またはデフォルト値から取得
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		if cfg.Environment == "production" {
			logLevel = "INFO"
		} else {
			logLevel = "DEBUG"
		}
	}

	logger := &Logger{
		component: component,
		level:     parseLogLevel(logLevel),
		output:    os.Stdout,
		jsonMode:  cfg.Environment == "production",
		metrics:   metrics,
	}

	// 標準ログgerも初期化
	prefix := fmt.Sprintf("[%s] ", strings.ToUpper(component))
	logger.stdLogger = log.New(logger.output, prefix, log.LstdFlags)

	return logger
}

// parseLogLevel は、文字列からLogLevelを解析します
func parseLogLevel(level string) LogLevel {
	switch strings.ToUpper(level) {
	case "DEBUG":
		return LogLevelDebug
	case "INFO":
		return LogLevelInfo
	case "WARN", "WARNING":
		return LogLevelWarn
	case "ERROR":
		return LogLevelError
	case "FATAL":
		return LogLevelFatal
	default:
		return LogLevelInfo
	}
}

// shouldLog は、指定されたレベルのログを出力すべきかチェックします
func (l *Logger) shouldLog(level LogLevel) bool {
	return level >= l.level
}

// log は、構造化ログを出力します
func (l *Logger) log(level LogLevel, message string, fields map[string]interface{}) {
	if !l.shouldLog(level) {
		return
	}

	// メトリクス更新
	if l.metrics != nil {
		l.metrics.IncrementLogCount(level.String())
		if level >= LogLevelError {
			l.metrics.IncrementErrorCount(l.component)
		}
	}

	if l.jsonMode {
		l.logJSON(level, message, fields)
	} else {
		l.logText(level, message, fields)
	}
}

// logJSON は、JSON形式でログを出力します
func (l *Logger) logJSON(level LogLevel, message string, fields map[string]interface{}) {
	entry := LogEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Level:     level.String(),
		Component: l.component,
		Message:   message,
		Fields:    fields,
	}

	// コール元の情報を追加（開発環境や詳細ログ時）
	if level >= LogLevelError {
		if pc, file, line, ok := runtime.Caller(3); ok {
			entry.File = file
			entry.Line = line
			if fn := runtime.FuncForPC(pc); fn != nil {
				entry.Function = fn.Name()
			}
		}
	}

	if data, err := json.Marshal(entry); err == nil {
		fmt.Fprintln(l.output, string(data))
	}
}

// logText は、テキスト形式でログを出力します
func (l *Logger) logText(level LogLevel, message string, fields map[string]interface{}) {
	timestamp := time.Now().Format("2006/01/02 15:04:05")
	levelStr := fmt.Sprintf("%-5s", level.String())

	logLine := fmt.Sprintf("%s [%s] [%s] %s", timestamp, levelStr, l.component, message)

	if len(fields) > 0 {
		fieldStrs := make([]string, 0, len(fields))
		for k, v := range fields {
			fieldStrs = append(fieldStrs, fmt.Sprintf("%s=%v", k, v))
		}
		logLine += fmt.Sprintf(" | %s", strings.Join(fieldStrs, " "))
	}

	fmt.Fprintln(l.output, logLine)
}

// Debug は、デバッグレベルのログを出力します
func (l *Logger) Debug(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(LogLevelDebug, message, f)
}

// Info は、情報レベルのログを出力します
func (l *Logger) Info(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(LogLevelInfo, message, f)
}

// Warn は、警告レベルのログを出力します
func (l *Logger) Warn(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(LogLevelWarn, message, f)
}

// Error は、エラーレベルのログを出力します
func (l *Logger) Error(message string, err error, fields ...map[string]interface{}) {
	f := make(map[string]interface{})
	if len(fields) > 0 {
		f = fields[0]
	}
	if err != nil {
		f["error"] = err.Error()
	}
	l.log(LogLevelError, message, f)
}

// Fatal は、致命的エラーレベルのログを出力し、プログラムを終了します
func (l *Logger) Fatal(message string, err error, fields ...map[string]interface{}) {
	f := make(map[string]interface{})
	if len(fields) > 0 {
		f = fields[0]
	}
	if err != nil {
		f["error"] = err.Error()
	}
	l.log(LogLevelFatal, message, f)
	os.Exit(1)
}

// Printf は、標準ログの互換性のための形式でログを出力します
func (l *Logger) Printf(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	l.Info(message)
}

// Println は、標準ログの互換性のための形式でログを出力します
func (l *Logger) Println(args ...interface{}) {
	message := fmt.Sprint(args...)
	l.Info(message)
}

// WithFields は、追加フィールド付きのログコンテキストを作成します
func (l *Logger) WithFields(fields map[string]interface{}) *LogContext {
	return &LogContext{
		logger: l,
		fields: fields,
	}
}

// LogContext は、フィールド付きのログコンテキストです
type LogContext struct {
	logger *Logger
	fields map[string]interface{}
}

// Info は、コンテキストの情報レベルのログを出力します
func (c *LogContext) Info(message string) {
	c.logger.log(LogLevelInfo, message, c.fields)
}

// Error は、コンテキストのエラーレベルのログを出力します
func (c *LogContext) Error(message string, err error) {
	fields := make(map[string]interface{})
	for k, v := range c.fields {
		fields[k] = v
	}
	if err != nil {
		fields["error"] = err.Error()
	}
	c.logger.log(LogLevelError, message, fields)
}

// GetStandardLogger は、標準のlog.Loggerインターフェース互換のロガーを返します
func (l *Logger) GetStandardLogger() *log.Logger {
	return l.stdLogger
}
