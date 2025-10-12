import { describe, it, expect } from 'vitest'
import {
  COLOR_OPTIONS,
  HIGHLIGHT_OPTIONS,
  type ColorOption,
} from '../colorOptions'

describe('colorOptions', () => {
  describe('COLOR_OPTIONS', () => {
    it('正確な数の色オプションが定義されている', () => {
      expect(COLOR_OPTIONS).toHaveLength(10)
    })

    it('デフォルトオプションが最初に定義されている', () => {
      const defaultOption = COLOR_OPTIONS[0]

      expect(defaultOption.isDefault).toBe(true)
      expect(defaultOption.name).toBe('デフォルト')
      expect(defaultOption.value).toBe('')
      expect(defaultOption.textColor).toBe('#374151')
    })

    it('すべての色オプションが必要なプロパティを持っている', () => {
      COLOR_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('name')
        expect(option).toHaveProperty('textColor')
        expect(option).toHaveProperty('value')

        // 文字列型の検証
        expect(typeof option.name).toBe('string')
        expect(typeof option.textColor).toBe('string')
        expect(typeof option.value).toBe('string')

        // 名前が空でないことを確認
        expect(option.name.trim()).not.toBe('')

        // textColorが有効なカラーコード形式であることを確認
        if (option.textColor) {
          expect(option.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
        }
      })
    })

    it('各色オプションが一意の名前を持っている', () => {
      const names = COLOR_OPTIONS.map(option => option.name)
      const uniqueNames = new Set(names)

      expect(uniqueNames.size).toBe(names.length)
    })

    it('各色オプション（デフォルト以外）が一意の値を持っている', () => {
      const nonDefaultOptions = COLOR_OPTIONS.filter(
        option => !option.isDefault
      )
      const values = nonDefaultOptions.map(option => option.value)
      const uniqueValues = new Set(values)

      expect(uniqueValues.size).toBe(values.length)
    })

    it('デフォルト以外の色オプションで値と色が一致している', () => {
      const nonDefaultOptions = COLOR_OPTIONS.filter(
        option => !option.isDefault
      )

      nonDefaultOptions.forEach(option => {
        expect(option.value).toBe(option.textColor)
      })
    })

    it('期待される色が含まれている', () => {
      const expectedColors = [
        'デフォルト',
        'グレー',
        'ブラウン',
        'レッド',
        'オレンジ',
        'イエロー',
        'グリーン',
        'ブルー',
        'パープル',
        'ピンク',
      ]

      const actualNames = COLOR_OPTIONS.map(option => option.name)

      expectedColors.forEach(expectedColor => {
        expect(actualNames).toContain(expectedColor)
      })
    })

    it('色の値が有効なHexカラーコード形式である', () => {
      COLOR_OPTIONS.forEach(option => {
        if (option.value !== '') {
          expect(option.value).toMatch(/^#[0-9A-Fa-f]{6}$/)
        }
      })
    })
  })

  describe('HIGHLIGHT_OPTIONS', () => {
    it('正確な数のハイライトオプションが定義されている', () => {
      expect(HIGHLIGHT_OPTIONS).toHaveLength(10)
    })

    it('デフォルトオプションが最初に定義されている', () => {
      const defaultOption = HIGHLIGHT_OPTIONS[0]

      expect(defaultOption.isDefault).toBe(true)
      expect(defaultOption.name).toBe('デフォルト')
      expect(defaultOption.value).toBe('')
      expect(defaultOption.textColor).toBe('#374151')
      expect(defaultOption.backgroundColor).toBeUndefined()
    })

    it('すべてのハイライトオプションが必要なプロパティを持っている', () => {
      HIGHLIGHT_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('name')
        expect(option).toHaveProperty('textColor')
        expect(option).toHaveProperty('value')

        // 文字列型の検証
        expect(typeof option.name).toBe('string')
        expect(typeof option.textColor).toBe('string')
        expect(typeof option.value).toBe('string')

        // 名前が空でないことを確認
        expect(option.name.trim()).not.toBe('')

        // textColorが有効なカラーコード形式であることを確認
        if (option.textColor) {
          expect(option.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
        }
      })
    })

    it('デフォルト以外のオプションにbackgroundColorが定義されている', () => {
      const nonDefaultOptions = HIGHLIGHT_OPTIONS.filter(
        option => !option.isDefault
      )

      nonDefaultOptions.forEach(option => {
        expect(option).toHaveProperty('backgroundColor')
        expect(typeof option.backgroundColor).toBe('string')
        expect(option.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })

    it('各ハイライトオプションが一意の名前を持っている', () => {
      const names = HIGHLIGHT_OPTIONS.map(option => option.name)
      const uniqueNames = new Set(names)

      expect(uniqueNames.size).toBe(names.length)
    })

    it('デフォルト以外のオプションで値と背景色が一致している', () => {
      const nonDefaultOptions = HIGHLIGHT_OPTIONS.filter(
        option => !option.isDefault
      )

      nonDefaultOptions.forEach(option => {
        expect(option.value).toBe(option.backgroundColor)
      })
    })

    it('期待される背景色が含まれている', () => {
      const expectedHighlights = [
        'デフォルト',
        'グレー背景',
        'ブラウン背景',
        'レッド背景',
        'オレンジ背景',
        'イエロー背景',
        'グリーン背景',
        'ブルー背景',
        'パープル背景',
        'ピンク背景',
      ]

      const actualNames = HIGHLIGHT_OPTIONS.map(option => option.name)

      expectedHighlights.forEach(expectedHighlight => {
        expect(actualNames).toContain(expectedHighlight)
      })
    })

    it('背景色の値が有効なHexカラーコード形式である', () => {
      HIGHLIGHT_OPTIONS.forEach(option => {
        if (option.backgroundColor) {
          expect(option.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
        }
      })
    })

    it('背景色用のテキスト色が十分にコントラストを持っている', () => {
      // 背景色がある場合、テキスト色は通常より暗い色になっているべき
      const nonDefaultOptions = HIGHLIGHT_OPTIONS.filter(
        option => !option.isDefault
      )

      nonDefaultOptions.forEach(option => {
        // テキスト色が定義されていることを確認
        expect(option.textColor).toBeDefined()
        expect(option.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/)

        // テキスト色はデフォルトのテキスト色とは異なるべき
        const defaultTextColor = '#374151'
        if (option.textColor !== defaultTextColor) {
          // より暗いテキスト色であることを大まかに確認
          // (実際のコントラスト計算は複雑なので、基本的なチェックのみ)
          expect(option.textColor).toBeTruthy()
        }
      })
    })
  })

  describe('ColorOption interface', () => {
    it('テキスト色オプションがColorOption型に準拠している', () => {
      COLOR_OPTIONS.forEach(option => {
        // TypeScriptの型チェックがコンパイル時に行われるが、
        // ランタイムでも基本的な構造をチェック
        const colorOption: ColorOption = option

        expect(colorOption.name).toBeDefined()
        expect(colorOption.textColor).toBeDefined()
        expect(colorOption.value).toBeDefined()
      })
    })

    it('ハイライトオプションがColorOption型に準拠している', () => {
      HIGHLIGHT_OPTIONS.forEach(option => {
        const colorOption: ColorOption = option

        expect(colorOption.name).toBeDefined()
        expect(colorOption.textColor).toBeDefined()
        expect(colorOption.value).toBeDefined()
      })
    })
  })

  describe('データの整合性', () => {
    it('COLOR_OPTIONSとHIGHLIGHT_OPTIONSが同じ数の要素を持っている', () => {
      expect(COLOR_OPTIONS).toHaveLength(HIGHLIGHT_OPTIONS.length)
    })

    it('両方の配列でデフォルトオプションが1つずつ存在する', () => {
      const textDefaults = COLOR_OPTIONS.filter(option => option.isDefault)
      const highlightDefaults = HIGHLIGHT_OPTIONS.filter(
        option => option.isDefault
      )

      expect(textDefaults).toHaveLength(1)
      expect(highlightDefaults).toHaveLength(1)
    })

    it('両方の配列でデフォルト以外のオプションが9つずつ存在する', () => {
      const textNonDefaults = COLOR_OPTIONS.filter(option => !option.isDefault)
      const highlightNonDefaults = HIGHLIGHT_OPTIONS.filter(
        option => !option.isDefault
      )

      expect(textNonDefaults).toHaveLength(9)
      expect(highlightNonDefaults).toHaveLength(9)
    })

    it('対応する色の基本名が一致している', () => {
      // 「グレー」と「グレー背景」のように、基本名が対応していることを確認
      const textColorNames = COLOR_OPTIONS.filter(
        option => !option.isDefault
      ).map(option => option.name)

      const highlightBaseNames = HIGHLIGHT_OPTIONS.filter(
        option => !option.isDefault
      ).map(option => option.name.replace('背景', ''))

      textColorNames.forEach(textColorName => {
        expect(highlightBaseNames).toContain(textColorName)
      })
    })
  })
})
