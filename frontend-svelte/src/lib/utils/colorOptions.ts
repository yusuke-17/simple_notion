export interface ColorOption {
  name: string
  textColor: string
  backgroundColor?: string
  value: string
  isDefault?: boolean
}

/**
 * Notion風のカラーパレット設定
 * テキスト色と背景色の組み合わせを定義
 */
export const COLOR_OPTIONS: ColorOption[] = [
  // デフォルト
  {
    name: 'デフォルト',
    textColor: '#374151',
    value: '',
    isDefault: true,
  },
  // テキスト色
  {
    name: 'グレー',
    textColor: '#6B7280',
    value: '#6B7280',
  },
  {
    name: 'ブラウン',
    textColor: '#92400E',
    value: '#92400E',
  },
  {
    name: 'レッド',
    textColor: '#DC2626',
    value: '#DC2626',
  },
  {
    name: 'オレンジ',
    textColor: '#EA580C',
    value: '#EA580C',
  },
  {
    name: 'イエロー',
    textColor: '#D97706',
    value: '#D97706',
  },
  {
    name: 'グリーン',
    textColor: '#059669',
    value: '#059669',
  },
  {
    name: 'ブルー',
    textColor: '#2563EB',
    value: '#2563EB',
  },
  {
    name: 'パープル',
    textColor: '#7C3AED',
    value: '#7C3AED',
  },
  {
    name: 'ピンク',
    textColor: '#DB2777',
    value: '#DB2777',
  },
]

/**
 * 背景色（ハイライト）オプション
 */
export const HIGHLIGHT_OPTIONS: ColorOption[] = [
  // デフォルト（背景色なし）
  {
    name: 'デフォルト',
    textColor: '#374151',
    value: '',
    isDefault: true,
  },
  // 背景色
  {
    name: 'グレー背景',
    textColor: '#1F2937',
    backgroundColor: '#F3F4F6',
    value: '#F3F4F6',
  },
  {
    name: 'ブラウン背景',
    textColor: '#451A03',
    backgroundColor: '#FEF3C7',
    value: '#FEF3C7',
  },
  {
    name: 'レッド背景',
    textColor: '#7F1D1D',
    backgroundColor: '#FEE2E2',
    value: '#FEE2E2',
  },
  {
    name: 'オレンジ背景',
    textColor: '#9A3412',
    backgroundColor: '#FED7AA',
    value: '#FED7AA',
  },
  {
    name: 'イエロー背景',
    textColor: '#92400E',
    backgroundColor: '#FEF3C7',
    value: '#FEF3C7',
  },
  {
    name: 'グリーン背景',
    textColor: '#064E3B',
    backgroundColor: '#D1FAE5',
    value: '#D1FAE5',
  },
  {
    name: 'ブルー背景',
    textColor: '#1E3A8A',
    backgroundColor: '#DBEAFE',
    value: '#DBEAFE',
  },
  {
    name: 'パープル背景',
    textColor: '#581C87',
    backgroundColor: '#E9D5FF',
    value: '#E9D5FF',
  },
  {
    name: 'ピンク背景',
    textColor: '#831843',
    backgroundColor: '#FCE7F3',
    value: '#FCE7F3',
  },
]
