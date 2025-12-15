# GitHub Copilot Instructions for Simple Notion - Backend (Go/PostgreSQL)

> **重要**: このファイルはバックエンド（Go/PostgreSQL）専用の規約を定義しています。
> 
> **必ず [copilot-instructions-common.md](copilot-instructions-common.md) も併せて参照してください。**

## バックエンド技術スタック

- **言語**: Go
- **データベース**: PostgreSQL
- **開発ツール**: Air（ホットリロード）
- **テスト**: Go標準テスト、テーブル駆動テスト
- **アーキテクチャ**: Clean Architecture

## バックエンドのコードスタイルと構造

### Go基本規約

- パッケージ名は小文字で記述
- ファイル名はsnake_caseで記述
- 公開関数/構造体はPascalCase、非公開はcamelCase
- エラーハンドリングでは適切なHTTPステータスコードとJSON形式のレスポンスを返す
- テーブル駆動テストを使用
- Clean Architectureパターンに従った設計

### プロジェクト構造

```
backend/
├── cmd/
│   └── server/          # メインエントリーポイント
│       └── main.go
├── internal/
│   ├── app/             # アプリケーション初期化・設定
│   │   ├── app.go
│   │   ├── dependencies.go
│   │   ├── lifecycle.go
│   │   ├── logger.go
│   │   ├── metrics.go
│   │   ├── router.go
│   │   └── server.go
│   ├── config/          # 設定管理
│   │   └── config.go
│   ├── handlers/        # HTTPハンドラー
│   │   ├── auth.go
│   │   ├── document/
│   │   └── upload/
│   ├── middleware/      # ミドルウェア
│   │   └── auth.go
│   ├── models/          # データモデル
│   │   ├── user.go
│   │   ├── document.go
│   │   └── file_metadata.go
│   ├── repository/      # データベースアクセス層
│   │   ├── user_repository.go
│   │   ├── document_core_repository.go
│   │   ├── document_tree_repository.go
│   │   ├── document_trash_repository.go
│   │   ├── block_repository.go
│   │   ├── file_repository.go
│   │   ├── sql_loader.go
│   │   └── queries/     # SQLクエリファイル
│   ├── services/        # ビジネスロジック層
│   │   ├── document_service.go
│   │   └── file_service.go
│   └── storage/         # 外部ストレージ（S3等）
│       └── s3_client.go
├── migrations/          # データベースマイグレーション
│   ├── 001_init.sql
│   ├── 002_tree_structure.sql
│   └── 003_file_metadata.sql
└── tests/               # 統合テスト
    └── basic_test.go
```

### レイヤー責務

- **handlers/**: HTTPリクエスト/レスポンス処理、バリデーション、認証チェック
- **services/**: ビジネスロジック、トランザクション管理、複数リポジトリの調整
- **repository/**: データベースアクセス、CRUD操作、クエリ実行
- **models/**: データ構造定義、バリデーションロジック
- **middleware/**: 横断的関心事（認証、ログ、CORS等）

### エラーハンドリング

- エラー処理とエッジケースを優先します
- エラー条件にはアーリーリターンを使用し、ガード句を実装して前提条件や無効な状態を早期に処理します
- 適切なエラーログとユーザーフレンドリーなエラーメッセージを実装します
- 予期しないエラーには適切なログ出力を実装します

**エラーレスポンスの形式**:
```go
// エラーレスポンス構造
type ErrorResponse struct {
    Error   string `json:"error"`
    Message string `json:"message,omitempty"`
}

// エラー処理パターン
if err != nil {
    log.Printf("Error: %v", err)
    c.JSON(http.StatusInternalServerError, ErrorResponse{
        Error:   "Internal Server Error",
        Message: "データの取得に失敗しました",
    })
    return
}
```

**HTTPステータスコードの使い分け**:
- `200 OK`: 成功（GET, PUT, PATCH）
- `201 Created`: リソース作成成功（POST）
- `204 No Content`: 成功でボディなし（DELETE）
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証失敗
- `403 Forbidden`: 権限不足
- `404 Not Found`: リソースが存在しない
- `500 Internal Server Error`: サーバー内部エラー

## データベース規約

### テーブル命名規則

- テーブル名は複数形のsnake_case（例: `users`, `documents`, `blocks`）
- カラム名はsnake_case
- IDカラムは`id`、外部キーは`{table}_id`（例: `user_id`, `document_id`）
- タイムスタンプは`created_at`, `updated_at`

### マイグレーション規約

- ファイル名: `{連番}_{説明}.sql`（例: `001_init.sql`, `002_tree_structure.sql`）
- 各マイグレーションには以下を含める:
  - テーブル作成
  - インデックス作成
  - 外部キー制約
  - 初期データ（必要に応じて）
- ロールバック用のコメントまたは別ファイルを用意

**マイグレーション例**: [examples/001_init.sql](examples/001_init.sql) を参照

### クエリパターン

- プリペアドステートメントを使用（SQLインジェクション対策）
- N+1問題の回避（JOIN、サブクエリ、バッチ取得）
- 適切なインデックスの使用
- トランザクション管理の適切な実装

**プリペアドステートメント例**:
```go
// ❌ 悪い例（SQLインジェクションリスク）
query := fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", email)

// ✅ 良い例（プリペアドステートメント）
query := "SELECT * FROM users WHERE email = $1"
row := db.QueryRow(query, email)
```

## バックエンドテスト

### テーブル駆動テスト

```go
func TestUserValidation(t *testing.T) {
    tests := []struct {
        name    string
        input   User
        wantErr bool
        errMsg  string
    }{
        {
            name: "正常なユーザー",
            input: User{
                Email:    "test@example.com",
                Name:     "Test User",
                Password: "password123",
            },
            wantErr: false,
        },
        {
            name: "メールアドレスが無効",
            input: User{
                Email:    "invalid-email",
                Name:     "Test User",
                Password: "password123",
            },
            wantErr: true,
            errMsg:  "invalid email format",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := tt.input.Validate()
            if (err != nil) != tt.wantErr {
                t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
            }
            if err != nil && tt.errMsg != "" && err.Error() != tt.errMsg {
                t.Errorf("Validate() error message = %v, want %v", err.Error(), tt.errMsg)
            }
        })
    }
}
```

### テストファイル構成

- テストファイルは`*_test.go`
- テスト関数名は`Test{FunctionName}`
- サブテストには`t.Run()`を使用
- モック使用時は適切な依存注入を実装

### モックとスタブ

```go
// モックリポジトリの例
type MockUserRepository struct {
    CreateFunc func(user *User) error
    GetByIDFunc func(id string) (*User, error)
}

func (m *MockUserRepository) Create(user *User) error {
    if m.CreateFunc != nil {
        return m.CreateFunc(user)
    }
    return nil
}

func (m *MockUserRepository) GetByID(id string) (*User, error) {
    if m.GetByIDFunc != nil {
        return m.GetByIDFunc(id)
    }
    return nil, nil
}
```

## バックエンド最適化

### データベースクエリの最適化

- **適切なインデックスの使用**: 頻繁に検索されるカラムにはインデックスを作成
- **N+1問題の回避**: JOINまたはバッチ取得を使用
- **ページネーション**: 大量データの取得時には`LIMIT`と`OFFSET`を使用
- **接続プールの最適化**: データベース接続数を適切に設定

**N+1問題の回避例**:
```go
// ❌ 悪い例（N+1問題）
documents, _ := repo.GetAllDocuments()
for _, doc := range documents {
    blocks, _ := repo.GetBlocksByDocumentID(doc.ID) // N回のクエリ
    doc.Blocks = blocks
}

// ✅ 良い例（JOIN使用）
// SQLファイル: internal/repository/queries/get_documents_with_blocks.sql
// または examples/query_with_join.sql を参照
rows, err := db.Query(getDocumentsWithBlocksQuery, userID)
```

### パフォーマンスベストプラクティス

- Goルーチンの適切な使用（並行処理）
- メモリアロケーションの最小化
- 適切なキャッシュ戦略の実装
- プロファイリングツールの活用（pprof）

## ファイルパターン（バックエンド）

- **Goハンドラー**: `internal/handlers/{feature}.go`
- **Goテスト**: `internal/handlers/{feature}_test.go`
- **Goモデル**: `internal/models/{model}.go`
- **Goリポジトリ**: `internal/repository/{entity}_repository.go`
- **Goサービス**: `internal/services/{entity}_service.go`
- **SQLマイグレーション**: `migrations/{number}_{description}.sql`
- **SQLクエリ**: `internal/repository/queries/{entity}_{action}.sql`

## コード生成時の推奨事項（バックエンド）

- APIハンドラー作成時は対応するテストケースも含める
- データベースマイグレーション追加時は適切なロールバック処理も記述
- 新規エンドポイント追加時は認証ミドルウェアの適用を検討
- リポジトリ層の関数にはSQLクエリのコメントを追加
- エラーハンドリングは必ず含める（ガード句を使用）
- 型定義は`models/`に集約

## 禁止事項（バックエンド特化）

- SQLクエリの文字列連結（SQLインジェクションリスク）
- エラーの無視（`err`を`_`で捨てる行為）
- グローバル変数の過度な使用
- インデックスなしでの大量データ検索
- トランザクション未使用での複数テーブル更新
