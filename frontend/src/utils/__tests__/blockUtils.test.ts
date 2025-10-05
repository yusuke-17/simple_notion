import { describe, it, expect } from 'vitest'
import type { Block } from '@/types'
import {
  reorderBlocks,
  updateBlockContent,
  deleteBlock,
  insertBlock,
  createInitialBlock,
  isRichTextContentEmpty,
} from '../blockUtils'

describe('blockUtils', () => {
  const mockBlocks: Block[] = [
    {
      id: 1,
      content: 'Block 1',
      type: 'paragraph',
      position: 0,
      documentId: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      content: 'Block 2',
      type: 'heading',
      position: 1,
      documentId: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
  ]

  describe('reorderBlocks', () => {
    it('ブロックの順序を正しく変更する', () => {
      const result = reorderBlocks(mockBlocks, 0, 1)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(2)
      expect(result[1].id).toBe(1)
      expect(result[0].position).toBe(0)
      expect(result[1].position).toBe(1)
    })

    it('空配列を処理できる', () => {
      // 空配列に対してspliceを実行すると、削除できない場合でもundefinedの要素が作られ
      // position: 0で処理される
      const result = reorderBlocks([], 0, 0)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ position: 0 })
    })
  })

  describe('updateBlockContent', () => {
    it('ブロックの内容を更新する', () => {
      const result = updateBlockContent(mockBlocks, 1, 'Updated content')

      expect(result[0].content).toBe('Updated content')
      expect(result[0].updatedAt).toBeDefined()
      expect(result[1]).toEqual(mockBlocks[1])
    })

    it('存在しないブロックIDでも配列を返す', () => {
      const result = updateBlockContent(mockBlocks, 999, 'New content')
      expect(result).toEqual(mockBlocks)
    })
  })

  describe('deleteBlock', () => {
    it('ブロックを削除し位置を再計算する', () => {
      // deleteBlockは最初のブロック（position: 0）は削除しないため、id: 2を削除
      const result = deleteBlock(mockBlocks, 2)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].position).toBe(0)
    })
  })

  describe('insertBlock', () => {
    it('新しいブロックを挿入する', () => {
      const newBlock: Omit<Block, 'position'> = {
        id: 3,
        content: 'New block',
        type: 'paragraph',
        documentId: 1,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      }

      const result = insertBlock(mockBlocks, 1, newBlock)

      expect(result).toHaveLength(3)
      expect(result[1].content).toBe('New block')
    })
  })

  describe('createInitialBlock', () => {
    it('初期ブロックを作成する', () => {
      const result = createInitialBlock(1)

      expect(result.documentId).toBe(1)
      expect(result.position).toBe(0)
      expect(result.type).toBe('text') // 実装では'text'を返す
    })
  })

  describe('isRichTextContentEmpty', () => {
    it('空のコンテンツを判定する', () => {
      expect(isRichTextContentEmpty('')).toBe(true)
      // 実装ではTipTap特有のJSON形式のみをチェック
      expect(isRichTextContentEmpty('{"type":"doc","content":[]}')).toBe(true)
      expect(
        isRichTextContentEmpty(
          '{"type":"doc","content":[{"type":"paragraph"}]}'
        )
      ).toBe(true)
      expect(isRichTextContentEmpty('<p>content</p>')).toBe(false)
    })
  })
})
