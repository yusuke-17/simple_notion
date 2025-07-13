import { describe, it, expect, beforeEach } from 'vitest'
import { API_BASE_URL, API_ENDPOINTS } from './setup'

// シンプルなAPIヘルパー
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  const text = await response.text()
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${text}`)
  }
  
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

describe('API結合テスト', () => {
  let authToken: string | null = null
  
  beforeEach(() => {
    authToken = null
  })

  describe('認証API', () => {
    it('新規ユーザーを登録できる', async () => {
      const uniqueEmail = `test-${Date.now()}@example.com`
      const userData = {
        email: uniqueEmail,
        password: 'password123',
        name: 'テストユーザー'
      }

      const response = await apiCall(API_ENDPOINTS.auth.register, {
        method: 'POST',
        body: JSON.stringify(userData)
      })

      expect(response).toBeTruthy()
      expect(response.user).toBeTruthy()
      expect(response.user.email).toBe(uniqueEmail)
      expect(response.token).toBeTruthy()
      
      authToken = response.token
    })

    it('登録済みユーザーでログインできる', async () => {
      // まず新規ユーザーを登録
      const uniqueEmail = `login-test-${Date.now()}@example.com`
      const userData = {
        email: uniqueEmail,
        password: 'password123',
        name: 'ログインテストユーザー'
      }

      await apiCall(API_ENDPOINTS.auth.register, {
        method: 'POST',
        body: JSON.stringify(userData)
      })

      // 次にログインを試行
      const loginData = {
        email: uniqueEmail,
        password: 'password123'
      }

      const response = await apiCall(API_ENDPOINTS.auth.login, {
        method: 'POST',
        body: JSON.stringify(loginData)
      })

      expect(response).toBeTruthy()
      expect(response.user).toBeTruthy()
      expect(response.user.email).toBe(uniqueEmail)
      expect(response.token).toBeTruthy()
    })

    it('無効な認証情報でログインに失敗する', async () => {
      const invalidData = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }

      await expect(
        apiCall(API_ENDPOINTS.auth.login, {
          method: 'POST',
          body: JSON.stringify(invalidData)
        })
      ).rejects.toThrow('401')
    })

    it('短いパスワードで登録に失敗する', async () => {
      const userData = {
        email: `short-pass-${Date.now()}@example.com`,
        password: '123', // 短いパスワード
        name: 'テストユーザー'
      }

      await expect(
        apiCall(API_ENDPOINTS.auth.register, {
          method: 'POST',
          body: JSON.stringify(userData)
        })
      ).rejects.toThrow('400')
    })
  })

  describe('ドキュメントAPI（認証あり）', () => {
    beforeEach(async () => {
      // 各テストの前にユーザーを登録してログイン
      const uniqueEmail = `doc-test-${Date.now()}@example.com`
      const userData = {
        email: uniqueEmail,
        password: 'password123',
        name: 'ドキュメントテストユーザー'
      }

      const response = await apiCall(API_ENDPOINTS.auth.register, {
        method: 'POST',
        body: JSON.stringify(userData)
      })
      
      authToken = response.token
    })

    it('ドキュメントを作成できる', async () => {
      const docData = {
        title: `テストドキュメント ${Date.now()}`,
        parent_id: null
      }

      const response = await apiCall(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(docData),
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response).toBeTruthy()
      expect(response.title).toBe(docData.title)
      expect(response.id).toBeTypeOf('number')
      expect(response.user_id).toBeTypeOf('number')
    })

    it('ドキュメント一覧を取得できる', async () => {
      // まずドキュメントを作成
      const docData = {
        title: `リストテスト ${Date.now()}`,
        parent_id: null
      }

      await apiCall(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(docData),
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      // ドキュメント一覧を取得
      const response = await apiCall(API_ENDPOINTS.documents.list, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(Array.isArray(response)).toBe(true)
      expect(response.length).toBeGreaterThan(0)
      
      const createdDoc = response.find((doc: { title: string; id: number }) => doc.title === docData.title)
      expect(createdDoc).toBeTruthy()
    })

    it('ドキュメントを更新できる', async () => {
      // まずドキュメントを作成
      const docData = {
        title: `更新テスト ${Date.now()}`,
        parent_id: null
      }

      const createdDoc = await apiCall(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(docData),
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      // ドキュメントを更新（バックエンドの仕様に合わせてblocksフィールドを使用）
      const updateData = {
        title: `更新済み ${Date.now()}`,
        blocks: [
          {
            type: 'text',
            content: '更新されたコンテンツ',
            order: 0
          }
        ]
      }

      // 更新APIはレスポンスボディを返さないので、ステータスコードのみ確認
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.documents.update(createdDoc.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updateData),
        credentials: 'include'
      })

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)

      // 更新されたドキュメントを取得して確認
      const updatedDoc = await apiCall(API_ENDPOINTS.documents.get(createdDoc.id), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(updatedDoc.title).toBe(updateData.title)
    })

    it('ドキュメントを削除できる', async () => {
      // まずドキュメントを作成
      const docData = {
        title: `削除テスト ${Date.now()}`,
        parent_id: null
      }

      const createdDoc = await apiCall(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(docData),
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      // ドキュメントを削除
      await apiCall(API_ENDPOINTS.documents.delete(createdDoc.id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      // 削除後に取得しようとして失敗することを確認
      await expect(
        apiCall(API_ENDPOINTS.documents.get(createdDoc.id), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('認証なしでのアクセス制限', () => {
    it('認証なしでドキュメント一覧取得に失敗する', async () => {
      await expect(
        apiCall(API_ENDPOINTS.documents.list, {
          method: 'GET'
        })
      ).rejects.toThrow('401')
    })

    it('認証なしでドキュメント作成に失敗する', async () => {
      const docData = {
        title: 'Unauthorized Document',
        parent_id: null
      }

      await expect(
        apiCall(API_ENDPOINTS.documents.create, {
          method: 'POST',
          body: JSON.stringify(docData)
        })
      ).rejects.toThrow('401')
    })
  })
})
