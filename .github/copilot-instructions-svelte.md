# GitHub Copilot Instructions for Simple Notion - Frontend (Svelte 5)

> **重要**: このファイルはフロントエンド（Svelte 5/TypeScript）専用の規約を定義しています。
> 
> **必ず [copilot-instructions-common.md](copilot-instructions-common.md) も併せて参照してください。**

## フロントエンド技術スタック

- **フレームワーク**: Svelte 5.43.8（Runes）
- **言語**: TypeScript 5.9.3
- **ビルドツール**: Vite 7.2.4
- **パッケージマネージャー**: pnpm
- **エディター**: TipTap 3.11.1（React依存排除、コアのみ使用）
- **UI/スタイリング**: Tailwind CSS 4.1.17, lucide-svelte 0.555.0
- **ドラッグ&ドロップ**: svelte-dnd-action 0.9.67
- **テスト**: Vitest 4.0.14, @testing-library/svelte 5.2.9

## Svelte 5基本規約

### ファイル構成とネーミング

- **Svelteコンポーネント**: PascalCase（例: `DocumentEditor.svelte`）
- **ユーティリティファイル**: camelCase（例: `editorUtils.ts`）
- **Svelte Runesストア**: camelCase + `.svelte.ts`拡張子（例: `auth.svelte.ts`）
- **テストファイル**: `*.test.ts`（`.tsx`ではない）

### .svelteファイルの構造

```svelte
<script lang="ts">
  // 1. インポート
  import { onMount, onDestroy } from 'svelte'
  import { Bold, Italic } from 'lucide-svelte'
  
  // 2. Props定義
  let { title, content, onUpdate } = $props<{
    title: string
    content: string
    onUpdate: (content: string) => void
  }>()
  
  // 3. ステート定義（$state使用）
  let isEditing = $state(false)
  let localContent = $state(content)
  
  // 4. 派生値（$derived使用）
  let wordCount = $derived(localContent.split(' ').length)
  
  // 5. 副作用（$effect使用）
  $effect(() => {
    console.log('Content changed:', localContent)
  })
  
  // 6. イベントハンドラー
  function handleSave() {
    onUpdate(localContent)
    isEditing = false
  }
  
  // 7. ライフサイクルフック
  onMount(() => {
    console.log('Component mounted')
  })
  
  onDestroy(() => {
    console.log('Component destroyed')
  })
</script>

<!-- 8. マークアップ -->
<div class="container">
  <h1>{title}</h1>
  <p>Word count: {wordCount}</p>
  {#if isEditing}
    <textarea bind:value={localContent} />
    <button onclick={handleSave}>Save</button>
  {:else}
    <p>{localContent}</p>
    <button onclick={() => isEditing = true}>Edit</button>
  {/if}
</div>

<!-- 9. スタイル（オプション） -->
<style>
  .container {
    padding: 1rem;
  }
</style>
```

### インポート順序

1. Svelteコアライブラリ（`svelte`, `svelte/store`等）
2. 外部ライブラリ（`lucide-svelte`, `@tiptap/core`等）
3. 内部ストア（`$lib/stores`）
4. 内部ユーティリティ（`$lib/utils`）
5. 型定義（`$lib/types`）
6. 内部コンポーネント（`$lib/components`）

## Svelte 5 Runes（完全必須）

### $state - リアクティブ変数

```typescript
// ✅ 正しい使い方
let count = $state(0)
let user = $state<User | null>(null)
let items = $state<Item[]>([])

// 更新は通常の代入で行う
count = count + 1
user = { id: 1, name: 'Alice' }
items.push(newItem) // 配列の直接変更もリアクティブ
```

### $derived - 派生値（computed）

```typescript
// ✅ 正しい使い方
let count = $state(0)
let doubled = $derived(count * 2)
let isEven = $derived(count % 2 === 0)

// 複雑な計算も可能
let filteredItems = $derived(
  items.filter(item => item.isActive)
)
```

### $effect - 副作用（useEffect相当）

```typescript
// ✅ 正しい使い方
$effect(() => {
  console.log('Count changed:', count)
  // クリーンアップ関数を返すことも可能
  return () => {
    console.log('Cleanup')
  }
})

// 条件付き実行
$effect(() => {
  if (user) {
    fetchUserData(user.id)
  }
})
```

### $props - Props受け取り

```typescript
// ✅ 正しい使い方（型付き）
let { title, content, onUpdate } = $props<{
  title: string
  content: string
  onUpdate: (content: string) => void
}>()

// デフォルト値を設定
let { title = 'Untitled', content = '' } = $props<{
  title?: string
  content?: string
}>()
```

### $bindable - 双方向バインディング

```typescript
// 親コンポーネントから値を受け取り、変更を通知
let { value = $bindable('') } = $props<{
  value?: string
}>()

// 使用例（子コンポーネント）
<input bind:value />

// 親コンポーネント
<ChildComponent bind:value={myValue} />
```

## レガシーAPI - 完全禁止

### ❌ 新規コードで絶対に使用しないこと

```typescript
// ❌ 禁止: writable, readable, derived
import { writable, readable, derived } from 'svelte/store'
const count = writable(0)
const doubled = derived(count, $count => $count * 2)

// ✅ 代わりにこうする
let count = $state(0)
let doubled = $derived(count * 2)
```

```svelte
<!-- ❌ 禁止: $: reactive statements -->
<script>
  let count = 0
  $: doubled = count * 2
  $: {
    console.log('Count:', count)
  }
</script>

<!-- ✅ 代わりにこうする -->
<script lang="ts">
  let count = $state(0)
  let doubled = $derived(count * 2)
  
  $effect(() => {
    console.log('Count:', count)
  })
</script>
```

### 既存コードのレガシーAPI

既存のコードでレガシーAPIを見つけた場合:
1. **新規機能**: Svelte 5 Runesのみ使用
2. **既存コード修正**: 可能な限りRunesに移行
3. **大規模リファクタリング**: ユーザーに確認してから実施

## プロジェクト構造

```
frontend-svelte/
├── src/
│   ├── lib/
│   │   ├── components/          # Svelteコンポーネント
│   │   │   ├── DocumentEditor.svelte
│   │   │   ├── RichTextEditor.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   ├── BlockEditor.svelte
│   │   │   └── ui/             # 共通UIコンポーネント
│   │   │       ├── button.svelte
│   │   │       └── input.svelte
│   │   ├── stores/             # Svelte Runesストア
│   │   │   ├── auth.svelte.ts
│   │   │   └── useReadOnlyDocumentViewer.svelte.ts
│   │   ├── utils/              # 純粋関数ユーティリティ
│   │   │   ├── blockUtils.ts
│   │   │   ├── editorUtils.ts
│   │   │   ├── documentUtils.ts
│   │   │   ├── sidebarUtils.ts
│   │   │   ├── fileUploadUtils.ts
│   │   │   └── __tests__/
│   │   └── types/              # TypeScript型定義
│   │       └── index.ts
│   ├── tests/                  # テストファイル
│   ├── App.svelte              # ルートコンポーネント
│   ├── app.css                 # グローバルスタイル
│   └── main.ts                 # エントリーポイント
├── public/                     # 静的ファイル
└── (設定ファイル群)
```

### ディレクトリの役割

- **`src/lib/components/`**: UIレンダリング専用のSvelteコンポーネント
- **`src/lib/stores/`**: Svelte Runesベースの状態管理（`.svelte.ts`ファイル）
- **`src/lib/utils/`**: 純粋関数ユーティリティ（複数箇所で使用される処理）
- **`src/lib/types/`**: TypeScript型定義の集約

## TipTap統合パターン（必須）

### 初期化と破棄

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Editor } from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  
  // Props
  let { content, onUpdate } = $props<{
    content: string
    onUpdate: (content: string) => void
  }>()
  
  // DOM参照
  let editorElement: HTMLDivElement
  let editor: Editor | undefined
  
  // 初期化
  onMount(() => {
    editor = new Editor({
      element: editorElement,
      extensions: [StarterKit],
      content: content,
      onUpdate: ({ editor }) => {
        const json = editor.getJSON()
        onUpdate(JSON.stringify(json))
      }
    })
  })
  
  // 破棄
  onDestroy(() => {
    editor?.destroy()
  })
</script>

<div bind:this={editorElement} />
```

### コンテンツ同期

```svelte
<script lang="ts">
  // Props変更時にエディターを更新
  $effect(() => {
    if (editor && content !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(content)
    }
  })
</script>
```

### コマンド実行（ツールバーボタン等）

```svelte
<script lang="ts">
  function toggleBold() {
    editor?.chain().focus().toggleBold().run()
  }
  
  function toggleItalic() {
    editor?.chain().focus().toggleItalic().run()
  }
  
  let isBold = $derived(editor?.isActive('bold') ?? false)
</script>

<button
  onclick={toggleBold}
  class={isBold ? 'active' : ''}
>
  <Bold class="h-4 w-4" />
</button>
```

## Svelte Runesストア（状態管理パターン）

### Runesクラスパターン

```typescript
// src/lib/stores/auth.svelte.ts
import type { User } from '$lib/types'

class AuthStore {
  user = $state<User | null>(null)
  isLoading = $state(false)
  error = $state<string | null>(null)

  // 派生値
  isAuthenticated = $derived(this.user !== null)

  async login(email: string, password: string) {
    this.isLoading = true
    this.error = null
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (!response.ok) {
        throw new Error('Login failed')
      }
      
      const data = await response.json()
      this.user = data.user
      localStorage.setItem('token', data.token)
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      this.isLoading = false
    }
  }

  async logout() {
    this.user = null
    localStorage.removeItem('token')
  }
}

// シングルトンインスタンスをエクスポート
export const authStore = new AuthStore()
```

### 使用例

```svelte
<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte'
  
  let email = $state('')
  let password = $state('')
  
  async function handleLogin() {
    await authStore.login(email, password)
  }
</script>

{#if authStore.isLoading}
  <p>Loading...</p>
{:else if authStore.error}
  <p class="error">{authStore.error}</p>
{:else if authStore.isAuthenticated}
  <p>Welcome, {authStore.user?.name}</p>
  <button onclick={() => authStore.logout()}>Logout</button>
{:else}
  <form onsubmit={handleLogin}>
    <input bind:value={email} type="email" placeholder="Email" />
    <input bind:value={password} type="password" placeholder="Password" />
    <button type="submit">Login</button>
  </form>
{/if}
```

## ドラッグ&ドロップ（svelte-dnd-action）

### 基本的な使い方

```svelte
<script lang="ts">
  import { dndzone } from 'svelte-dnd-action'
  import type { DndEvent } from 'svelte-dnd-action'
  
  type Item = { id: string; name: string }
  
  let items = $state<Item[]>([
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' }
  ])
  
  function handleDndConsider(e: CustomEvent<DndEvent<Item>>) {
    items = e.detail.items
  }
  
  function handleDndFinalize(e: CustomEvent<DndEvent<Item>>) {
    items = e.detail.items
    // ここでサーバーに位置更新を送信
    updateItemsOrder(items)
  }
</script>

<div
  use:dndzone={{ items, flipDurationMs: 200 }}
  on:consider={handleDndConsider}
  on:finalize={handleDndFinalize}
>
  {#each items as item (item.id)}
    <div class="item">{item.name}</div>
  {/each}
</div>
```

## UIとスタイリング

### Tailwind CSS使用

```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn'
  
  let { variant = 'default', isActive = false } = $props<{
    variant?: 'default' | 'primary' | 'danger'
    isActive?: boolean
  }>()
  
  const baseClasses = 'px-4 py-2 rounded'
  const variantClasses = {
    default: 'bg-gray-100 text-gray-900',
    primary: 'bg-blue-500 text-white',
    danger: 'bg-red-500 text-white'
  }
</script>

<button
  class={cn(
    baseClasses,
    variantClasses[variant],
    isActive && 'ring-2 ring-offset-2'
  )}
>
  <slot />
</button>
```

### Lucide-svelte アイコン

```svelte
<script lang="ts">
  import { Bold, Italic, Trash2, ChevronDown } from 'lucide-svelte'
</script>

<div class="toolbar">
  <button><Bold class="h-4 w-4" /></button>
  <button><Italic class="h-4 w-4" /></button>
  <button><Trash2 class="h-4 w-4 text-red-500" /></button>
</div>
```

## テスト（Testing Library + Vitest）

### コンポーネントテスト

```typescript
// src/lib/components/__tests__/Button.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import Button from '../Button.svelte'

describe('Button', () => {
  it('正常に表示される', () => {
    render(Button, { props: { children: 'Click me' } })
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('クリックイベントが発火する', async () => {
    const handleClick = vi.fn()
    render(Button, { props: { onclick: handleClick } })
    
    const button = screen.getByRole('button')
    await fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('disabled時はクリックできない', async () => {
    const handleClick = vi.fn()
    render(Button, {
      props: { onclick: handleClick, disabled: true }
    })
    
    const button = screen.getByRole('button')
    await fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

### ユーティリティ関数のテスト

```typescript
// src/lib/utils/__tests__/blockUtils.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyBlock, isEmptyBlock } from '../blockUtils'

describe('blockUtils', () => {
  describe('createEmptyBlock', () => {
    it('空のブロックを作成する', () => {
      const block = createEmptyBlock('paragraph')
      
      expect(block).toHaveProperty('id')
      expect(block.type).toBe('paragraph')
      expect(block.content).toBe('')
    })
  })
  
  describe('isEmptyBlock', () => {
    it('空のブロックを判定する', () => {
      const emptyBlock = { id: '1', type: 'paragraph', content: '' }
      const nonEmptyBlock = { id: '2', type: 'paragraph', content: 'Hello' }
      
      expect(isEmptyBlock(emptyBlock)).toBe(true)
      expect(isEmptyBlock(nonEmptyBlock)).toBe(false)
    })
  })
})
```

## ファイルパターン（フロントエンド）

- **Svelteコンポーネント**: `src/lib/components/{ComponentName}.svelte`
- **Svelte Runesストア**: `src/lib/stores/{storeName}.svelte.ts`
- **ユーティリティ関数**: `src/lib/utils/{featureName}Utils.ts`
- **型定義**: `src/lib/types/index.ts`
- **コンポーネントテスト**: `src/lib/components/__tests__/{ComponentName}.test.ts`
- **ユーティリティテスト**: `src/lib/utils/__tests__/{featureName}Utils.test.ts`

## コード生成時の推奨事項（フロントエンド）

- 新規コンポーネント作成時は必ずSvelte 5 Runesを使用
- TipTap統合は必ず`onMount`/`onDestroy`パターンに従う
- ビジネスロジックは純粋関数（`utils/`）に分離
- 複雑な状態管理はRunesクラスパターン（`stores/*.svelte.ts`）を使用
- テストファイルを同時に生成
- 型定義を`types/index.ts`に追加
- イベントハンドラーはコールバック関数をpropsで渡す（カスタムイベント不要）

## 禁止事項（Svelte特化）

### ❌ 絶対に使用しないこと

- **レガシーAPI**: `writable`, `readable`, `derived`, `$:` reactive statements
- **React Hooksパターンの直接移植**: `use{Name}`関数パターンは不要（Svelte Runesで実現）
- **`{#await}`ブロック内での複雑なロジック**: `utils/`関数に分離すること
- **グローバルスコープでの`$effect`**: コンポーネント内でのみ使用
- **`bind:this`の過度な使用**: Svelteのリアクティビティを優先
- **コンポーネント間のイベントバブリング**: コールバック関数をpropsで渡す

### ✅ 推奨パターン

- Svelte 5 Runesを最大限活用
- 純粋関数による処理の分離
- 型安全性の確保（TypeScript strict mode）
- テスト駆動開発
- Tailwind CSSによるスタイリング

## フロントエンド最適化

- Svelteは自動的に最適化を行うため、React.memo等は不要
- 大きなリストには仮想スクロールライブラリの使用を検討
- 画像は適切なフォーマットを使用し、遅延ロードを実装
- コード分割は動的インポート（`import()`）を使用
- バンドルサイズの監視（Viteのバンドルアナライザー活用）
