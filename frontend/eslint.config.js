import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import ts from 'typescript-eslint'
import globals from 'globals'

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    // ブラウザとNode.jsのグローバル変数を有効化
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    }
  },
  {
    // Svelte 5 Runes ファイル (.svelte.ts) の設定
    files: ['**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    }
  },
  {
    ignores: ['dist/', 'node_modules/', '.svelte-kit/', 'coverage/']
  },
  {
    rules: {
      // 未使用変数の警告（_で始まる変数は除外）
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      // any型の使用を警告
      '@typescript-eslint/no-explicit-any': 'warn',
      // Svelte固有ルールの調整
      'svelte/no-unused-svelte-ignore': 'off',
      'svelte/prefer-writable-derived': 'off',
      'svelte/require-each-key': 'warn'
    }
  }
]
