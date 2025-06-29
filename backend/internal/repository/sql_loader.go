package repository

import (
	"embed"
	"fmt"
	"path/filepath"
	"strings"
)

//go:embed queries/*.sql
var queryFiles embed.FS

type SQLQueries struct {
	queries map[string]string
}

func NewSQLQueries() (*SQLQueries, error) {
	queries := make(map[string]string)

	files, err := queryFiles.ReadDir("queries")
	if err != nil {
		return nil, fmt.Errorf("failed to read queries directory: %w", err)
	}

	for _, file := range files {
		if !strings.HasSuffix(file.Name(), ".sql") {
			continue
		}

		content, err := queryFiles.ReadFile(filepath.Join("queries", file.Name()))
		if err != nil {
			return nil, fmt.Errorf("failed to read query file %s: %w", file.Name(), err)
		}

		// ファイル内の個別クエリを解析
		fileQueries := parseQueriesFromFile(string(content))
		for name, query := range fileQueries {
			queries[name] = query
		}
	}

	return &SQLQueries{queries: queries}, nil
}

func (sq *SQLQueries) Get(name string) (string, error) {
	query, exists := sq.queries[name]
	if !exists {
		return "", fmt.Errorf("query '%s' not found", name)
	}
	return query, nil
}

// SQLファイル内のクエリを解析する
// -- name: クエリ名
// の形式でクエリを定義
func parseQueriesFromFile(content string) map[string]string {
	queries := make(map[string]string)
	lines := strings.Split(content, "\n")

	var currentQuery strings.Builder
	var currentName string

	for _, line := range lines {
		line = strings.TrimSpace(line)

		// クエリ名の定義行
		if strings.HasPrefix(line, "-- name: ") {
			// 前のクエリを保存
			if currentName != "" {
				queries[currentName] = strings.TrimSpace(currentQuery.String())
			}

			// 新しいクエリ開始
			currentName = strings.TrimSpace(strings.TrimPrefix(line, "-- name: "))
			currentQuery.Reset()
			continue
		}

		// コメント行をスキップ
		if strings.HasPrefix(line, "--") && !strings.HasPrefix(line, "-- name: ") {
			continue
		}

		// 空行をスキップ
		if line == "" {
			continue
		}

		// クエリ本体
		if currentName != "" {
			if currentQuery.Len() > 0 {
				currentQuery.WriteString(" ")
			}
			currentQuery.WriteString(line)
		}
	}

	// 最後のクエリを保存
	if currentName != "" {
		queries[currentName] = strings.TrimSpace(currentQuery.String())
	}

	return queries
}
