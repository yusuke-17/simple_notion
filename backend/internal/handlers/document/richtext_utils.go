package document

import (
	"encoding/json"
	"fmt"
	"strings"
)

// RichTextContent は TipTap JSON構造を表します
type RichTextContent struct {
	Type    string                 `json:"type"`
	Content []RichTextNode         `json:"content,omitempty"`
	Attrs   map[string]interface{} `json:"attrs,omitempty"`
}

// RichTextNode は TipTap JSON構造内のノードを表します
type RichTextNode struct {
	Type    string                 `json:"type"`
	Content []RichTextNode         `json:"content,omitempty"`
	Marks   []RichTextMark         `json:"marks,omitempty"`
	Text    string                 `json:"text,omitempty"`
	Attrs   map[string]interface{} `json:"attrs,omitempty"`
}

// RichTextMark は インライン書式マークを表します
type RichTextMark struct {
	Type  string                 `json:"type"`
	Attrs map[string]interface{} `json:"attrs,omitempty"`
}

// IsRichTextContent は コンテンツ文字列がTipTap JSON形式かどうかを確認します
func IsRichTextContent(content string) bool {
	if content == "" {
		return false
	}

	// クイックチェック: TipTapドキュメント構造で始まるかどうか
	if !strings.HasPrefix(strings.TrimSpace(content), `{"type":"doc"`) {
		return false
	}

	// 有効なTipTap形式であることを確認するためにJSONとして解析を試行
	var richContent RichTextContent
	if err := json.Unmarshal([]byte(content), &richContent); err != nil {
		return false
	}

	// 期待されるTipTap構造を持っていることを検証
	return richContent.Type == "doc"
}

// ConvertPlainTextToRichText は プレーンテキストをTipTap JSON形式に変換します
func ConvertPlainTextToRichText(plainText string) string {
	if plainText == "" {
		return `{"type":"doc","content":[]}`
	}

	// 改行で分割して段落を作成
	lines := strings.Split(plainText, "\n")
	var paragraphs []RichTextNode

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			// 空の段落
			paragraphs = append(paragraphs, RichTextNode{
				Type: "paragraph",
			})
		} else {
			// テキスト付き段落
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

// ExtractPlainTextFromRichText は TipTap JSON形式からプレーンテキストを抽出します
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

// extractTextFromNodes は TipTapノードから再帰的にテキストを抽出します
func extractTextFromNodes(nodes []RichTextNode, result *strings.Builder) {
	for i, node := range nodes {
		if node.Text != "" {
			result.WriteString(node.Text)
		}

		if node.Content != nil {
			extractTextFromNodes(node.Content, result)
		}

		// 段落間に改行を追加（最後のもの以外）
		if node.Type == "paragraph" && i < len(nodes)-1 {
			result.WriteString("\n")
		}
	}
}

// ValidateRichTextJSON は JSONが有効なTipTap形式かどうかを検証します
func ValidateRichTextJSON(content string) error {
	if content == "" {
		return nil // 空のコンテンツは有効
	}

	// JSONのように見えない場合は、おそらくプレーンテキスト - 検証不要
	if !strings.HasPrefix(strings.TrimSpace(content), "{") {
		return nil
	}

	// JSONとして解析を試行
	var richContent RichTextContent
	if err := json.Unmarshal([]byte(content), &richContent); err != nil {
		// JSON解析が失敗した場合、リッチテキストを意図しているが形式が不正と仮定
		return fmt.Errorf("invalid JSON format: %w", err)
	}

	// 有効なJSONだがTipTap形式でない場合（"type"フィールドがないか間違ったtype）
	if richContent.Type != "doc" {
		return fmt.Errorf("invalid TipTap format: root type must be 'doc', got '%s'", richContent.Type)
	}

	return nil
}
