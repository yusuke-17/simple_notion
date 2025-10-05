import { describe, it, expect } from 'vitest'
import type { Document } from '@/types'
import {
  formatDocumentDate,
  validateDocumentArray,
  createDocumentApiOptions,
} from '../sidebarUtils'

describe('sidebarUtils', () => {
  describe('formatDocumentDate', () => {
    it('有効な日付を正しくフォーマットする', () => {
      const result = formatDocumentDate('2023-01-01T00:00:00Z')
      expect(result).toBe('1/1/2023')
    })

    it('空の日付に対してNo dateを返す', () => {
      const result = formatDocumentDate('')
      expect(result).toBe('No date')
    })

    it('無効な日付に対してInvalid dateを返す', () => {
      const result = formatDocumentDate('invalid-date')
      expect(result).toBe('Invalid date')
    })
  })

  describe('validateDocumentArray', () => {
    it('有効な配列をそのまま返す', () => {
      const docs: Document[] = [
        {
          id: 1,
          title: 'Test',
          content: 'Content',
          userId: 1,
          parentId: null,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ]

      const result = validateDocumentArray(docs)
      expect(result).toEqual(docs)
    })

    it('無効なデータに対して空配列を返す', () => {
      expect(validateDocumentArray(null)).toEqual([])
      expect(validateDocumentArray(undefined)).toEqual([])
      expect(validateDocumentArray('not an array')).toEqual([])
      expect(validateDocumentArray({})).toEqual([])
    })
  })

  describe('createDocumentApiOptions', () => {
    it('GETリクエストのオプションを作成する', () => {
      const result = createDocumentApiOptions('GET')

      expect(result.method).toBe('GET')
      expect(result.credentials).toBe('include')
      expect(result.headers).toBeUndefined()
      expect(result.body).toBeUndefined()
    })

    it('POSTリクエストのオプションを作成する', () => {
      const body = { title: 'Test' }
      const result = createDocumentApiOptions('POST', body)

      expect(result.method).toBe('POST')
      expect(result.credentials).toBe('include')
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(result.body).toBe(JSON.stringify(body))
    })
  })
})
