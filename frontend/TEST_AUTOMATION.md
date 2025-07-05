# フロントエンドテスト自動化

Simple Notionアプリケーション向けに、PlaywrightとReact Testing Library + Vitestを使用したテスト自動化環境を構築しました。

## 🚀 テスト環境の構成

### ユニットテスト（React Testing Library + Vitest）
- **テストフレームワーク**: Vitest
- **テストライブラリ**: @testing-library/react
- **テスト実行環境**: jsdom
- **対象**: Reactコンポーネントの単体テスト

### E2Eテスト（Playwright）
- **テストフレームワーク**: Playwright
- **対象ブラウザ**: Chromium, Firefox, WebKit
- **対象**: アプリケーション全体のエンドツーエンドテスト

## 📁 ディレクトリ構造

```
frontend/
├── src/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── Login.test.tsx
│   │   │   └── DocumentEditor.test.tsx
│   │   ├── Login.tsx
│   │   └── DocumentEditor.tsx
│   └── tests/
│       ├── setup.ts         # テストセットアップ
│       └── helpers.ts       # テストヘルパー関数
├── tests/
│   └── e2e/
│       ├── auth.spec.ts     # 認証関連のE2Eテスト
│       └── documents.spec.ts # ドキュメント関連のE2Eテスト
├── vitest.config.ts         # Vitestの設定
├── playwright.config.ts     # Playwrightの設定
└── package.json
```

## 🛠️ セットアップ手順

### 1. 依存関係のインストール

```bash
# ユニットテスト用
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# E2Eテスト用
npm install --save-dev @playwright/test

# Playwrightブラウザのインストール
npx playwright install
```

### 2. 設定ファイルの作成

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

#### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

## 🧪 テストの実行

### ユニットテスト

```bash
# テストを一度実行
npm run test

# ウォッチモードで実行
npm run test:watch

# カバレッジ付きで実行
npm run test:coverage

# UIモードで実行
npm run test:ui
```

### E2Eテスト

```bash
# E2Eテストを実行
npm run test:e2e

# E2EテストをUIモードで実行
npm run test:e2e:ui
```

## 📝 テストの書き方

### ユニットテストの例

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import { Login } from '../Login'

// Storeのモック
const mockLogin = vi.fn()
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    loading: false,
  }),
}))

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ログインフォームが正しくレンダリングされる', () => {
    render(<Login />)
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('ログインフォームの送信が正しく動作する', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce(undefined)
    
    render(<Login />)
    
    await user.type(screen.getByLabelText('Email address'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })
})
```

### E2Eテストの例

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('ログイン画面が正しく表示される', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('フォームの入力が正しく動作する', async ({ page }) => {
    await page.goto('/');
    
    await page.getByLabel('Email address').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    await expect(page.getByLabel('Email address')).toHaveValue('test@example.com');
    await expect(page.getByLabel('Password')).toHaveValue('password123');
  });
});
```

## 🔧 テストヘルパー関数

```typescript
// src/tests/helpers.ts
import { vi } from 'vitest'

// Store用のモックヘルパー
export const createMockAuthStore = (overrides = {}) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
})

// API レスポンス用のモック
export const createMockDocument = (overrides = {}) => ({
  id: 1,
  title: 'Test Document',
  content: 'Test content',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
})

// Fetch APIのモック
export const mockFetch = (response: unknown, ok = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(response),
  })
}
```

## 🚀 CI/CDでの自動実行

GitHub Actionsワークフローが設定されており、以下のタイミングでテストが自動実行されます：

- プッシュ時（main、developブランチ）
- プルリクエスト作成時（mainブランチ向け）

### ワークフロー内容

1. **ユニットテスト**
   - Node.js 18の環境でテスト実行
   - リンティング
   - ビルド確認

2. **E2Eテスト**
   - Playwrightブラウザのインストール
   - 開発サーバーの起動
   - 複数ブラウザでのテスト実行
   - テストレポートの生成・保存

## 📊 テスト結果の確認

### ユニットテスト
- コンソールで結果を確認
- `npm run test:coverage`でカバレッジレポート生成

### E2Eテスト
- HTMLレポートが`playwright-report/`に生成
- CIでは結果がArtifactとして保存される

## 🎯 ベストプラクティス

### ユニットテスト
1. **コンポーネントの振る舞いをテスト**: UI要素やユーザーインタラクションに焦点
2. **モックを活用**: 外部依存（API、Store）はモック
3. **テストの独立性**: 各テストは独立して実行可能
4. **わかりやすいテスト名**: 何をテストしているかが明確

### E2Eテスト
1. **ユーザーシナリオ**: 実際のユーザーの操作フローをテスト
2. **ページオブジェクト**: 複雑なページ操作は再利用可能に
3. **待機戦略**: 適切な待機でテストの安定性を確保
4. **最小限のテスト**: 重要なユーザーフローに絞る

## 🔍 トラブルシューティング

### よくある問題と解決方法

1. **テストがタイムアウトする**
   - `waitFor`を使用して適切な待機
   - テストのタイムアウト時間を調整

2. **モックが効かない**
   - モックの設定順序を確認
   - `vi.clearAllMocks()`でクリーンアップ

3. **E2Eテストが不安定**
   - 適切なセレクタを使用
   - `data-testid`属性の活用

## 📚 参考資料

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## ✅ 現在のテスト状況

- **ユニットテスト**: ✅ 11件のテストが成功
  - Login コンポーネント: 6件
  - DocumentEditor コンポーネント: 5件

- **E2Eテスト**: ⚠️ 基本設定完了（アプリケーション実装完了後に有効化）

テスト自動化環境が整い、今後の開発でテスト駆動開発（TDD）やCI/CDでの品質担保が可能になりました。
