import { describe, it, expect } from 'vitest'
import type { Block } from '@/types'
import {
  hasDocumentChanged,
  prepareDocumentUpdatePayload,
  validateDocumentTitle,
  getDocumentApiEndpoint,
} from '../documentUtils'

describe('documentUtils', () => {
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
  ]

  describe('hasDocumentChanged', () => {
    it('タイトルが変更された場合trueを返す', () => {
      const result = hasDocumentChanged(
        'New Title',
        mockBlocks,
        'Old Title',
        mockBlocks
      )
      expect(result).toBe(true)
    })

    it('ブロックが変更された場合trueを返す', () => {
      const newBlocks = [{ ...mockBlocks[0], content: 'Changed' }]
      const result = hasDocumentChanged('Title', newBlocks, 'Title', mockBlocks)
      expect(result).toBe(true)
    })

    it('変更がない場合falseを返す', () => {
      const result = hasDocumentChanged(
        'Title',
        mockBlocks,
        'Title',
        mockBlocks
      )
      expect(result).toBe(false)
    })
  })

  describe('prepareDocumentUpdatePayload', () => {
    it('正しい更新ペイロードを作成する', () => {
      const result = prepareDocumentUpdatePayload('Test Title', mockBlocks, 1)

      expect(result.title).toBe('Test Title')
      expect(result.blocks).toHaveLength(1)
      expect(result.blocks[0].position).toBe(0)
      expect(result.blocks[0].documentId).toBe(1)
    })

    it('空のタイトルの場合Untitledを使用する', () => {
      const result = prepareDocumentUpdatePayload('', mockBlocks, 1)
      expect(result.title).toBe('Untitled')
    })
  })

  describe('validateDocumentTitle', () => {
    it('有効なタイトルの場合オブジェクトを返す', () => {
      const result = validateDocumentTitle('Valid Title')
      expect(result.isValid).toBe(true)
    })

    it('空のタイトルの場合エラーオブジェクトを返す', () => {
      const result = validateDocumentTitle('')
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Title cannot be empty')
    })
  })

  describe('getDocumentApiEndpoint', () => {
    it('正しいAPIエンドポイントを生成する', () => {
      const result = getDocumentApiEndpoint(1)
      expect(result).toBe('/api/documents/1')
    })
  })
})
