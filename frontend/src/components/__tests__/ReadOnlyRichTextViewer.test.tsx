import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReadOnlyRichTextViewer } from '../ReadOnlyRichTextViewer'

describe('ReadOnlyRichTextViewer', () => {
  it('空のコンテンツの場合、"Empty block"を表示する', () => {
    render(<ReadOnlyRichTextViewer content="" />)

    expect(screen.getByText('Empty block')).toBeInTheDocument()
  })

  it('空のJSONの場合、"Empty block"を表示する', () => {
    render(<ReadOnlyRichTextViewer content="{}" />)

    expect(screen.getByText('Empty block')).toBeInTheDocument()
  })

  it('プレーンテキストを適切に表示する', () => {
    const plainText = 'これはプレーンテキストです'
    render(<ReadOnlyRichTextViewer content={plainText} />)

    expect(screen.getByText(plainText)).toBeInTheDocument()
  })

  it('TipTap JSONコンテンツを適切にレンダリングする', () => {
    const tipTapJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'リッチテキストコンテンツ',
            },
          ],
        },
      ],
    })

    render(<ReadOnlyRichTextViewer content={tipTapJson} />)

    // TipTapエディターがレンダリングされることを確認
    const editorElement = document.querySelector('.readonly-rich-text-viewer')
    expect(editorElement).toBeInTheDocument()
  })

  it('複数行のプレーンテキストを適切に表示する', () => {
    const multilineText = '行1\n行2\n行3'
    render(<ReadOnlyRichTextViewer content={multilineText} />)

    // whitespace-pre-wrapスタイルが適用されたコンテナを確認
    const container = document.querySelector('.whitespace-pre-wrap')
    expect(container).toBeInTheDocument()
    expect(container?.textContent).toBe(multilineText)
  })

  it('特殊文字を含むテキストを適切に表示する', () => {
    const specialText = '特殊文字: <>&"\''
    render(<ReadOnlyRichTextViewer content={specialText} />)

    expect(screen.getByText(specialText)).toBeInTheDocument()
  })
})
