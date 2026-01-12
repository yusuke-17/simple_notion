# バックエンド開発規約（Go + PostgreSQL）

> Go/PostgreSQL専用の開発規約です。共通ルールは `common.md` も併せて参照してください。

## 技術スタック

- **言語**: Go
- **データベース**: PostgreSQL
- **開発ツール**: Air（ホットリロード）
- **テスト**: Go標準テスト、テーブル駆動テスト
- **アーキテクチャ**: Clean Architecture

## Go基本規約

### 命名規則

- **パッケージ名**: 小文字で記述（例: `handlers`, `repository`）
- **ファイル名**: snake_case（例: `user_repository.go`, `document_service.go`）
- **公開関数/構造体**: PascalCase（例: `CreateUser`, `DocumentService`）
- **非公開関数/変数**: camelCase（例: `validateEmail`, `userRepo`）

### ファイル構成

- テストファイルは`*_test.go`
- テスト関数名は`Test{FunctionName}`
- サブテストには`t.Run()`を使用

## プロジェクト構造

```
backend/
├── cmd/
│   └── server/              # メインエントリーポイント
│       └── main.go
├── internal/
│   ├── app/                 # アプリケーション初期化・設定
│   │   ├── app.go
│   │   ├── dependencies.go
│   │   ├── router.go
│   │   └── server.go
│   ├── config/              # 設定管理
│   │   └── config.go
│   ├── handlers/            # HTTPハンドラー
│   │   ├── auth.go
│   │   └── document/
│   ├── middleware/          # ミドルウェア
│   │   └── auth.go
│   ├── models/              # データモデル
│   │   ├── user.go
│   │   ├── document.go
│   │   └── file_metadata.go
│   ├── repository/          # データベースアクセス層
│   │   ├── user_repository.go
│   │   ├── document_core_repository.go
│   │   ├── sql_loader.go
│   │   └── queries/         # SQLクエリファイル
│   ├── services/            # ビジネスロジック層
│   │   ├── document_service.go
│   │   └── file_service.go
│   └── storage/             # 外部ストレージ（S3等）
│       └── s3_client.go
├── migrations/              # データベースマイグレーション
│   ├── 001_init.sql
│   ├── 002_tree_structure.sql
│   └── 003_file_metadata.sql
└── tests/                   # 統合テスト
    └── basic_test.go
```

## レイヤー責務（Clean Architecture）

### handlers/ - HTTPハンドラー層

- HTTPリクエスト/レスポンス処理
- バリデーション
- 認証チェック
- サービス層への委譲

```go
// ✅ 良い例
func (h *DocumentHandler) Create(c *gin.Context) {
    // 1. リクエストのパース
    var req CreateDocumentRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, ErrorResponse{
            Error:   "Bad Request",
            Message: "リクエストが不正です",
        })
        return
    }
    
    // 2. 認証情報の取得
    userID := c.GetString("user_id")
    
    // 3. サービス層への委譲
    doc, err := h.service.CreateDocument(userID, req.Title, req.ParentID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, ErrorResponse{
            Error:   "Internal Server Error",
            Message: "文書の作成に失敗しました",
        })
        return
    }
    
    c.JSON(http.StatusCreated, doc)
}
```

### services/ - ビジネスロジック層

- ビジネスロジックの実装
- トランザクション管理
- 複数リポジトリの調整

```go
// ✅ 良い例
func (s *DocumentService) CreateDocument(userID, title, parentID string) (*models.Document, error) {
    // 1. ビジネスルールの検証
    if parentID != "" {
        parent, err := s.repo.GetByID(parentID)
        if err != nil {
            return nil, fmt.Errorf("親文書の取得に失敗: %w", err)
        }
        if parent.UserID != userID {
            return nil, fmt.Errorf("親文書へのアクセス権限がありません")
        }
    }
    
    // 2. トランザクション開始
    tx, err := s.db.Begin()
    if err != nil {
        return nil, fmt.Errorf("トランザクション開始失敗: %w", err)
    }
    defer tx.Rollback()
    
    // 3. データ作成
    doc := &models.Document{
        ID:       uuid.New().String(),
        UserID:   userID,
        Title:    title,
        ParentID: parentID,
    }
    
    if err := s.repo.Create(tx, doc); err != nil {
        return nil, fmt.Errorf("文書作成失敗: %w", err)
    }
    
    // 4. コミット
    if err := tx.Commit(); err != nil {
        return nil, fmt.Errorf("コミット失敗: %w", err)
    }
    
    return doc, nil
}
```

### repository/ - データベースアクセス層

- CRUD操作
- クエリ実行
- データマッピング

```go
// ✅ 良い例
func (r *DocumentRepository) Create(tx *sql.Tx, doc *models.Document) error {
    query := `
        INSERT INTO documents (id, user_id, title, parent_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
    `
    
    now := time.Now()
    _, err := tx.Exec(query, doc.ID, doc.UserID, doc.Title, doc.ParentID, now, now)
    if err != nil {
        return fmt.Errorf("文書の挿入に失敗: %w", err)
    }
    
    doc.CreatedAt = now
    doc.UpdatedAt = now
    return nil
}
```

## エラーハンドリング

### ガード句とアーリーリターン

```go
// ✅ 良い例
func (s *UserService) GetUser(id string) (*models.User, error) {
    // ガード句: 前提条件の検証
    if id == "" {
        return nil, errors.New("ユーザーIDが必要です")
    }
    
    // 処理
    user, err := s.repo.GetByID(id)
    if err != nil {
        return nil, fmt.Errorf("ユーザー取得失敗: %w", err)
    }
    
    // ガード句: 結果の検証
    if user == nil {
        return nil, errors.New("ユーザーが見つかりません")
    }
    
    return user, nil
}

// ❌ 悪い例（ネストが深い）
func (s *UserService) GetUser(id string) (*models.User, error) {
    if id != "" {
        user, err := s.repo.GetByID(id)
        if err == nil {
            if user != nil {
                return user, nil
            } else {
                return nil, errors.New("ユーザーが見つかりません")
            }
        } else {
            return nil, fmt.Errorf("ユーザー取得失敗: %w", err)
        }
    } else {
        return nil, errors.New("ユーザーIDが必要です")
    }
}
```

### エラーレスポンスの形式

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

## データベース規約

### テーブル命名規則

- テーブル名: 複数形のsnake_case（例: `users`, `documents`, `blocks`）
- カラム名: snake_case
- IDカラム: `id`
- 外部キー: `{table}_id`（例: `user_id`, `document_id`）
- タイムスタンプ: `created_at`, `updated_at`

### マイグレーション規約

ファイル名: `{連番}_{説明}.sql`（例: `001_init.sql`）

```sql
-- 001_init.sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### クエリパターン

#### プリペアドステートメント（必須）

```go
// ❌ 悪い例（SQLインジェクションリスク）
query := fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", email)

// ✅ 良い例（プリペアドステートメント）
query := "SELECT * FROM users WHERE email = $1"
row := db.QueryRow(query, email)
```

#### N+1問題の回避

```go
// ❌ 悪い例（N+1問題）
documents, _ := repo.GetAllDocuments()
for _, doc := range documents {
    blocks, _ := repo.GetBlocksByDocumentID(doc.ID) // N回のクエリ
    doc.Blocks = blocks
}

// ✅ 良い例（JOIN使用）
query := `
    SELECT 
        d.id, d.title,
        b.id, b.content, b.type
    FROM documents d
    LEFT JOIN blocks b ON d.id = b.document_id
    WHERE d.user_id = $1
`
rows, err := db.Query(query, userID)
```

## テスト（テーブル駆動テスト）

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
        {
            name: "パスワードが短い",
            input: User{
                Email:    "test@example.com",
                Name:     "Test User",
                Password: "123",
            },
            wantErr: true,
            errMsg:  "password must be at least 8 characters",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := tt.input.Validate()
            
            // エラーの有無を検証
            if (err != nil) != tt.wantErr {
                t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
            }
            
            // エラーメッセージを検証
            if err != nil && tt.errMsg != "" && err.Error() != tt.errMsg {
                t.Errorf("Validate() error message = %v, want %v", err.Error(), tt.errMsg)
            }
        })
    }
}
```

### モックとスタブ

```go
// モックリポジトリの例
type MockUserRepository struct {
    CreateFunc  func(user *User) error
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

- **適切なインデックス**: 頻繁に検索されるカラムにインデックスを作成
- **N+1問題の回避**: JOINまたはバッチ取得を使用
- **ページネーション**: `LIMIT`と`OFFSET`を使用
- **接続プールの最適化**: 適切な接続数設定

### パフォーマンスベストプラクティス

- Goルーチンの適切な使用（並行処理）
- メモリアロケーションの最小化
- 適切なキャッシュ戦略の実装
- プロファイリングツールの活用（pprof）

## 禁止事項（バックエンド特化）

- ❌ SQLクエリの文字列連結（SQLインジェクションリスク）
- ❌ エラーの無視（`err`を`_`で捨てる行為）
- ❌ グローバル変数の過度な使用
- ❌ インデックスなしでの大量データ検索
- ❌ トランザクション未使用での複数テーブル更新

## ファイルパターン

- **Goハンドラー**: `internal/handlers/{feature}.go`
- **Goテスト**: `internal/handlers/{feature}_test.go`
- **Goモデル**: `internal/models/{model}.go`
- **Goリポジトリ**: `internal/repository/{entity}_repository.go`
- **Goサービス**: `internal/services/{entity}_service.go`
- **SQLマイグレーション**: `migrations/{number}_{description}.sql`
- **SQLクエリ**: `internal/repository/queries/{entity}_{action}.sql`
