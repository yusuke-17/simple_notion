---
name: test
description: フロントエンド（Vitest）とバックエンド（Go）のテストを実行します。テストの実行、カバレッジ計測が必要な時に使用。
argument-hint: "[frontend|backend|all|coverage]"
allowed-tools: Bash(pnpm:*, go:*, cd:*)
---

# テスト実行スキル

Simple Notionプロジェクトのテストを実行するスキルです。

## 使用方法

| コマンド | 説明 |
|---------|------|
| `/test` または `/test all` | フロントエンドとバックエンド両方のテストを実行 |
| `/test frontend` または `/test fe` | フロントエンドのテストのみ実行 |
| `/test backend` または `/test be` | バックエンドのテストのみ実行 |
| `/test coverage` | 両方のカバレッジ計測を実行 |
| `/test frontend coverage` | フロントエンドのカバレッジのみ |
| `/test backend coverage` | バックエンドのカバレッジのみ |

## 実行手順

### 1. 引数の解析

`$ARGUMENTS` から以下を判定:
- **対象**: `frontend`/`fe`、`backend`/`be`、`all`（デフォルト）、`coverage`
- **オプション**: `coverage`（カバレッジ計測）

### 2. フロントエンドテスト実行

ディレクトリ: `frontend/`

**通常実行**:
```bash
cd frontend && pnpm test run
```

**カバレッジ計測**:
```bash
cd frontend && pnpm test:coverage
```

注意: `pnpm test` はウォッチモードのため、スキルでは `pnpm test run` を使用してワンショット実行する。

### 3. バックエンドテスト実行

ディレクトリ: `backend/`

**通常実行**:
```bash
cd backend && go test ./...
```

**詳細出力**:
```bash
cd backend && go test -v ./...
```

**カバレッジ計測**:
```bash
cd backend && go test -cover ./...
```

### 4. 結果のサマリー表示

テスト完了後、以下の情報を日本語でまとめて報告:

1. **テスト結果**: 成功/失敗の数
2. **失敗したテスト**: 失敗がある場合は詳細を表示
3. **カバレッジ**: カバレッジ計測時は各パッケージ/ファイルのカバレッジ率
4. **改善提案**: TDD文化に沿った次のアクションを提案

## テストファイルの場所

### フロントエンド（9ファイル）
- `frontend/src/lib/utils/__tests__/blockUtils.test.ts`
- `frontend/src/lib/utils/__tests__/colorOptions.test.ts`
- `frontend/src/lib/utils/__tests__/documentUtils.test.ts`
- `frontend/src/lib/utils/__tests__/editorUtils.test.ts`
- `frontend/src/lib/utils/__tests__/minioUtils.test.ts`
- `frontend/src/lib/utils/__tests__/sidebarUtils.test.ts`
- `frontend/src/lib/utils/__tests__/tableUtils.test.ts`
- `frontend/src/lib/utils/__tests__/uploadUtils.test.ts`
- `frontend/src/lib/components/__tests__/TableFloatingMenu.test.ts`

### バックエンド（9ファイル）
- `backend/internal/models/user_test.go`
- `backend/internal/models/document_test.go`
- `backend/internal/handlers/auth_test.go`
- `backend/internal/handlers/document/richtext_utils_test.go`
- `backend/internal/handlers/upload/handler_test.go`
- `backend/internal/repository/repository_test.go`
- `backend/internal/services/document_service_test.go`
- `backend/internal/services/file_service_test.go`
- `backend/tests/basic_test.go`

## TDD文化への配慮

プロジェクトのTDD方針に従い、テスト実行後は以下を確認:

1. **新機能追加時**: 対応するテストが存在するか
2. **バグ修正時**: そのバグを再現するテストケースがあるか
3. **カバレッジ低下**: 重要なビジネスロジックがカバーされているか

テスト失敗時は、失敗の原因と修正方針を提案すること。
