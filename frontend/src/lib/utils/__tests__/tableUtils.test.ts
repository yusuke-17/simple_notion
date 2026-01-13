import { describe, it, expect, vi } from 'vitest'
import { getTableMenuPosition, isTableActive } from '../tableUtils'

describe('tableUtils', () => {
  describe('getTableMenuPosition', () => {
    it('テーブル要素の上部にメニュー位置を計算する', () => {
      const mockEditor = document.createElement('div')
      mockEditor.getBoundingClientRect = () => ({
        top: 100,
        left: 50,
        width: 800,
        height: 600,
        right: 850,
        bottom: 700,
        x: 50,
        y: 100,
        toJSON: () => {},
      })

      const mockTable = document.createElement('table')
      mockTable.getBoundingClientRect = () => ({
        top: 200,
        left: 100,
        width: 400,
        height: 200,
        right: 500,
        bottom: 400,
        x: 100,
        y: 200,
        toJSON: () => {},
      })

      // mockEditor.querySelectorをモック
      mockEditor.querySelector = vi.fn(() => mockTable)

      const position = getTableMenuPosition(mockEditor)

      expect(position).toBeDefined()
      expect(position!.top).toBeLessThan(200 - 100)
      expect(position!.left).toBeGreaterThanOrEqual(0)
    })

    it('テーブルが見つからない場合nullを返す', () => {
      const mockEditor = document.createElement('div')
      mockEditor.querySelector = vi.fn(() => null)

      const position = getTableMenuPosition(mockEditor)

      expect(position).toBeNull()
    })

    it('メニューが画面外に出ない位置を計算する', () => {
      const mockEditor = document.createElement('div')
      mockEditor.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        width: 500,
        height: 400,
        right: 500,
        bottom: 400,
        x: 0,
        y: 0,
        toJSON: () => {},
      })

      const mockTable = document.createElement('table')
      mockTable.getBoundingClientRect = () => ({
        top: 10,
        left: 10,
        width: 480,
        height: 100,
        right: 490,
        bottom: 110,
        x: 10,
        y: 10,
        toJSON: () => {},
      })

      mockEditor.querySelector = vi.fn(() => mockTable)

      const position = getTableMenuPosition(mockEditor)

      expect(position).toBeDefined()
      // 左端で見切れないことを確認
      expect(position!.left).toBeGreaterThanOrEqual(10)
    })
  })

  describe('isTableActive', () => {
    it('エディターがnullの場合falseを返す', () => {
      expect(isTableActive(null)).toBe(false)
    })
  })
})
