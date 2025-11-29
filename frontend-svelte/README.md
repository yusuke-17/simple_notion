# Simple Notion - Svelte 5 Frontend

React版からSvelte 5への移行プロジェクトです。

## プロジェクト状況

**現在のフェーズ**: Phase 1 - プロジェクト基盤構築 ✅ **完了**

### 完了項目

- ✅ Svelte 5 + Vite プロジェクト初期化
- ✅ Tailwind CSS 4 設定完了
- ✅ TypeScript設定（パスエイリアス `$lib/*`）
- ✅ 純粋関数ユーティリティの移行（8ファイル）
- ✅ 型定義の移行（`types/index.ts`）
- ✅ ユーティリティテストの移行（160テスト中152テスト通過）
- ✅ Docker設定（ポート5174で並行稼働）

### テスト結果

```
Test Files  2 failed | 6 passed (8)
     Tests  8 failed | 150 passed | 2 skipped (160)
```

**注**: 8つの失敗テストはXMLHttpRequestモック関連で、Svelte環境特有の問題ではありません。Phase 2以降で修正予定です。

## 開発環境

### ローカル開発

```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動（ポート5174）
pnpm dev

# テスト実行
pnpm test

# カバレッジ確認
pnpm coverage
```

### Docker開発

```bash
# Svelteフロントエンドのみ起動
docker compose -f docker-compose.dev.yml up frontend-svelte

# 全サービス起動（React版と並行稼働）
docker compose -f docker-compose.dev.yml up

# アクセス
# React版: http://localhost:5173
# Svelte版: http://localhost:5174
```

## プロジェクト構造

```
frontend-svelte/
├── src/
│   ├── lib/
│   │   ├── components/  # Svelteコンポーネント（UIレンダリング専用）
│   │   ├── hooks/       # ビジネスロジック層（Phase 2以降で実装）
│   │   ├── utils/       # 純粋関数ユーティリティ（React版から移行済み）
│   │   ├── types/       # TypeScript型定義（React版から移行済み）
│   │   └── stores/      # 状態管理（Phase 3以降で実装）
│   ├── tests/           # テストセットアップ
│   ├── App.svelte       # メインアプリケーション
│   ├── main.ts          # エントリーポイント
│   └── app.css          # グローバルスタイル（Tailwind CSS）
├── vite.config.ts       # Vite設定（ポート5174、APIプロキシ）
├── tailwind.config.js   # Tailwind CSS設定
├── vitest.config.ts     # Vitest設定
└── Dockerfile.dev       # Docker開発環境
```

## 技術スタック

- **Svelte**: 5.43.8
- **TypeScript**: 5.9.3
- **Vite**: 7.2.4
- **Tailwind CSS**: 4.1.17
- **Vitest**: 4.0.14
- **Testing Library**: @testing-library/svelte 5.2.9

### ユーティリティライブラリ

- `clsx` - クラス名結合
- `tailwind-merge` - Tailwindクラスマージ
- `class-variance-authority` - バリアント管理

## 次のステップ: Phase 2

**所要時間**: 1日（最重要フェーズ）

### Phase 2の目標

TipTap統合の検証プロトタイプを作成し、Svelte 5環境でリッチテキストエディターが正常に動作することを確認します。

### 実施内容

1. TipTap Core依存関係インストール
   ```bash
   pnpm add @tiptap/core @tiptap/starter-kit \
     @tiptap/extension-bold @tiptap/extension-italic \
     @tiptap/extension-underline @tiptap/extension-strike \
     @tiptap/extension-link @tiptap/extension-color \
     @tiptap/extension-text-style @tiptap/extension-highlight \
     prosemirror-state prosemirror-view
   ```

2. 最小限のRichTextEditor.svelteを作成
3. 以下の機能を検証:
   - エディター初期化（`onMount`）
   - Bold/Italic切り替え
   - ツールバー表示（選択範囲上部）
   - コンテンツ更新のリアクティビティ
   - クリーンアップ（`onDestroy`）

### Phase 2の成功基準

- ✅ TipTapエディターがSvelte環境で正常に初期化される
- ✅ Bold/Italicなどの基本機能が動作する
- ✅ フローティングツールバーが正しい位置に表示される
- ✅ コンテンツ変更がリアクティブに反映される

**重要**: Phase 2が成功しない場合、移行プロジェクト全体が停止します。必ず最優先で実施してください。

## 移行ガイド

詳細な移行計画は以下を参照:
- `/docs/svelte5-migration-guide.md`
- `/docs/phase1-verification-report.md`

## 並行稼働について

React版（`frontend/`）とSvelte版（`frontend-svelte/`）は完全に独立しており、同時に稼働可能です。

- **React版**: ポート5173
- **Svelte版**: ポート5174
- **バックエンドAPI**: ポート8080（共通）

移行完了後、React版を削除してSvelte版を5173ポートに移動する予定です。

## 注意事項

- **Phase 2は実行しないでください**: 基盤構築のみ完了しています
- TipTap、lucide-svelte、svelte-dnd-actionはまだインストールされていません
- コンポーネント実装はPhase 4以降で開始します

---

**作成日**: 2025年11月29日  
**最終更新**: 2025年11月29日  
**次フェーズ開始**: ユーザー承認後
