import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import { TEST_USERS, API_ENDPOINTS, apiRequest } from './setup'

// Zustandストアをリセットするヘルパー
const resetAuthStore = () => {
  useAuthStore.setState({
    user: null,
    token: null,
    loading: false
  })
}

describe('ドキュメント管理API結合テスト', () => {
  let testUser: { name: string; email: string; password: string }

  beforeEach(async () => {
    resetAuthStore()
    
    // 一意のテストユーザーを作成
    testUser = {
      name: TEST_USERS.valid.name,
      email: `doc-test-${Date.now()}@example.com`,
      password: TEST_USERS.valid.password
    }
    
    // ストアのregisterメソッドを使用してテストユーザーを登録
    await useAuthStore.getState().register(testUser.email, testUser.password, testUser.name)
  })

  describe('ドキュメント作成', () => {
    it('新しいドキュメントを作成できる', async () => {
      const testDoc = {
        title: `テストドキュメント ${Date.now()}`,
        content: 'テストコンテンツ',
        parent_id: null
      }

      const response = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(testDoc)
      })

      expect(response).toBeTruthy()
      expect(response.title).toBe(testDoc.title)
      expect(response.content).toBe(testDoc.content)
      expect(response.id).toBeTypeOf('number')
    })

    it('空のタイトルでドキュメント作成に失敗する', async () => {
      const testDoc = {
        title: '',
        content: 'テストコンテンツ',
        parent_id: null
      }

      await expect(
        apiRequest(API_ENDPOINTS.documents.create, {
          method: 'POST',
          body: JSON.stringify(testDoc)
        })
      ).rejects.toThrow()
    })
  })

  describe('ドキュメント一覧取得', () => {
    it('ユーザーのドキュメント一覧を取得できる', async () => {
      // 事前にテストドキュメントを作成
      const testDoc = {
        title: `リストテスト ${Date.now()}`,
        content: 'テストコンテンツ',
        parent_id: null
      }

      await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(testDoc)
      })

      const documents = await apiRequest(API_ENDPOINTS.documents.list, {
        method: 'GET'
      })

      expect(Array.isArray(documents)).toBe(true)
      expect(documents.length).toBeGreaterThan(0)
      
      const createdDoc = documents.find((doc: { title: string; id: number }) => doc.title === testDoc.title)
      expect(createdDoc).toBeTruthy()
    })
  })

  describe('ドキュメント取得', () => {
    it('IDで特定のドキュメントを取得できる', async () => {
      // 事前にテストドキュメントを作成
      const testDoc = {
        title: `取得テスト ${Date.now()}`,
        content: 'テストコンテンツ',
        parent_id: null
      }

      const createdDoc = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(testDoc)
      })

      const retrievedDoc = await apiRequest(API_ENDPOINTS.documents.get(createdDoc.id), {
        method: 'GET'
      })

      expect(retrievedDoc.id).toBe(createdDoc.id)
      expect(retrievedDoc.title).toBe(testDoc.title)
      expect(retrievedDoc.content).toBe(testDoc.content)
    })

    it('存在しないIDでドキュメント取得に失敗する', async () => {
      await expect(
        apiRequest(API_ENDPOINTS.documents.get(99999), {
          method: 'GET'
        })
      ).rejects.toThrow()
    })
  })

  describe('ドキュメント更新', () => {
    it('既存のドキュメントを更新できる', async () => {
      // 事前にテストドキュメントを作成
      const testDoc = {
        title: `更新テスト ${Date.now()}`,
        content: '元のコンテンツ',
        parent_id: null
      }

      const createdDoc = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(testDoc)
      })

      // ドキュメントを更新
      const updatedData = {
        title: `更新済み ${Date.now()}`,
        content: '更新されたコンテンツ'
      }

      const updatedDoc = await apiRequest(API_ENDPOINTS.documents.update(createdDoc.id), {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      })

      expect(updatedDoc.id).toBe(createdDoc.id)
      expect(updatedDoc.title).toBe(updatedData.title)
      expect(updatedDoc.content).toBe(updatedData.content)
    })
  })

  describe('ドキュメント削除', () => {
    it('ドキュメントを削除できる', async () => {
      // 事前にテストドキュメントを作成
      const testDoc = {
        title: `削除テスト ${Date.now()}`,
        content: 'テストコンテンツ',
        parent_id: null
      }

      const createdDoc = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(testDoc)
      })

      // ドキュメントを削除
      await apiRequest(API_ENDPOINTS.documents.delete(createdDoc.id), {
        method: 'DELETE'
      })

      // 削除されたドキュメントを取得しようとして失敗することを確認
      await expect(
        apiRequest(API_ENDPOINTS.documents.get(createdDoc.id), {
          method: 'GET'
        })
      ).rejects.toThrow()
    })
  })

  describe('ドキュメントツリー取得', () => {
    it('階層構造のドキュメントツリーを取得できる', async () => {
      // 親ドキュメントを作成
      const parentDoc = {
        title: `親ドキュメント ${Date.now()}`,
        content: '親コンテンツ',
        parent_id: null
      }

      const createdParent = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(parentDoc)
      })

      // 子ドキュメントを作成
      const childDoc = {
        title: `子ドキュメント ${Date.now()}`,
        content: '子コンテンツ',
        parent_id: createdParent.id
      }

      const createdChild = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(childDoc)
      })

      // ドキュメントツリーを取得
      const tree = await apiRequest(API_ENDPOINTS.documents.tree, {
        method: 'GET'
      })

      expect(Array.isArray(tree)).toBe(true)
      
      // 親ドキュメントがツリーに含まれていることを確認
      const parentInTree = tree.find((doc: { id: number; children?: unknown[] }) => doc.id === createdParent.id)
      expect(parentInTree).toBeTruthy()
      
      // 子ドキュメントが親の子として含まれていることを確認
      expect(parentInTree?.children).toBeTruthy()
      const childInTree = parentInTree?.children?.find((child: { id: number }) => child.id === createdChild.id)
      expect(childInTree).toBeTruthy()
    })
  })

  describe('ドキュメント移動', () => {
    it('ドキュメントを別の親に移動できる', async () => {
      // 親ドキュメント1を作成
      const parent1 = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify({
          title: `親1 ${Date.now()}`,
          content: '親1コンテンツ',
          parent_id: null
        })
      })

      // 親ドキュメント2を作成
      const parent2 = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify({
          title: `親2 ${Date.now()}`,
          content: '親2コンテンツ',
          parent_id: null
        })
      })

      // 子ドキュメントを親1の下に作成
      const child = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify({
          title: `移動テスト ${Date.now()}`,
          content: '子コンテンツ',
          parent_id: parent1.id
        })
      })

      // 子ドキュメントを親2に移動
      const movedDoc = await apiRequest(API_ENDPOINTS.documents.move(child.id), {
        method: 'PUT',
        body: JSON.stringify({
          parent_id: parent2.id
        })
      })

      expect(movedDoc.parent_id).toBe(parent2.id)
    })
  })
})
