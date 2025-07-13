import { beforeAll, afterAll, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// グローバルなCookieストレージをシミュレート
let globalCookies: Record<string, string> = {}

// デバッグ用ログ関数
const debugLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'test') {
    console.log(`[TEST DEBUG] ${message}`, data || '')
  }
}

// Fetchをラップしてクッキーを自動処理
const originalFetch = global.fetch
global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers)
  
  // 既存のCookieを送信
  if (Object.keys(globalCookies).length > 0) {
    const cookieString = Object.entries(globalCookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
    headers.set('Cookie', cookieString)
    debugLog('Sending cookies:', cookieString)
  }
  
  const response = await originalFetch(input, {
    ...init,
    headers,
    credentials: 'include'
  })
  
  // レスポンスからSet-Cookieヘッダーを処理
  const setCookieHeader = response.headers.get('Set-Cookie')
  if (setCookieHeader) {
    debugLog('Received Set-Cookie:', setCookieHeader)
    const cookies = setCookieHeader.split(',').map(c => c.trim())
    cookies.forEach(cookie => {
      const [keyValue] = cookie.split(';')
      const [key, value] = keyValue.split('=')
      if (key && value) {
        globalCookies[key.trim()] = value.trim()
        debugLog('Stored cookie:', { key: key.trim(), value: value.trim() })
      }
    })
  }
  
  return response
}

// テストの前に実行される設定
beforeAll(() => {
  // バックエンドサーバーが起動していることを確認
  console.log('結合テスト開始: バックエンドAPI接続確認')
})

// 各テストの前に実行
beforeEach(() => {
  // DOM をクリーンアップ
  cleanup()
  
  // ローカルストレージやセッションストレージをクリア
  localStorage.clear()
  sessionStorage.clear()
  
  // グローバルクッキーをクリア
  globalCookies = {}
})

// テスト終了後のクリーンアップ
afterAll(() => {
  cleanup()
  console.log('結合テスト終了: クリーンアップ完了')
})

// テスト用のAPIベースURL
export const API_BASE_URL = 'http://localhost:8080'

// テスト用のユーザーデータ
export const TEST_USERS = {
  valid: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  },
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User'
  }
}

// APIエンドポイントの設定
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me'
  },
  documents: {
    list: '/api/documents',
    create: '/api/documents',
    tree: '/api/documents/tree',
    get: (id: number) => `/api/documents/${id}`,
    update: (id: number) => `/api/documents/${id}`,
    delete: (id: number) => `/api/documents/${id}`,
    restore: (id: number) => `/api/documents/${id}/restore`,
    move: (id: number) => `/api/documents/${id}/move`
  }
}

// API呼び出しのヘルパー関数
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}
