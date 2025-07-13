import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import { API_ENDPOINTS, apiRequest } from './setup'

// Zustandストアをリセットするヘルパー
const resetAuthStore = () => {
  useAuthStore.setState({
    user: null,
    token: null,
    loading: false
  })
}

describe('ユーザーワークフロー統合テスト', () => {
  beforeEach(() => {
    resetAuthStore()
  })

  describe('完全なユーザーワークフロー', () => {
    it('登録→ログイン→ドキュメント作成→編集→削除の一連の流れが正常に動作する', async () => {
      // 1. ユーザー登録
      const uniqueEmail = `workflow-test-${Date.now()}@example.com`
      const testUser = {
        email: uniqueEmail,
        password: 'password123',
        name: 'ワークフローテストユーザー'
      }

      // ストアのregisterメソッドを使用
      await useAuthStore.getState().register(testUser.email, testUser.password, testUser.name)

      // 2. ログイン状態の確認
      const authState = useAuthStore.getState()
      expect(authState.user?.email).toBe(uniqueEmail)

      // 3. ドキュメント作成
      const newDocument = {
        title: `ワークフローテストドキュメント ${Date.now()}`,
        content: '初期コンテンツ',
        parent_id: null
      }

      const createdDoc = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify(newDocument)
      })

      expect(createdDoc.title).toBe(newDocument.title)
      expect(createdDoc.content).toBe(newDocument.content)

      // 4. ドキュメント編集
      const updatedContent = {
        title: `更新されたタイトル ${Date.now()}`,
        content: '更新されたコンテンツ'
      }

      const updatedDoc = await apiRequest(API_ENDPOINTS.documents.update(createdDoc.id), {
        method: 'PUT',
        body: JSON.stringify(updatedContent)
      })

      expect(updatedDoc.title).toBe(updatedContent.title)
      expect(updatedDoc.content).toBe(updatedContent.content)

      // 5. ドキュメント一覧に反映されていることを確認
      const documentsList = await apiRequest(API_ENDPOINTS.documents.list, {
        method: 'GET'
      })

      const foundDoc = documentsList.find((doc: { id: number }) => doc.id === createdDoc.id)
      expect(foundDoc).toBeTruthy()

      // 6. ドキュメント削除
      await apiRequest(API_ENDPOINTS.documents.delete(createdDoc.id), {
        method: 'DELETE'
      })

      // 7. 削除後に取得できないことを確認
      await expect(
        apiRequest(API_ENDPOINTS.documents.get(createdDoc.id), {
          method: 'GET'
        })
      ).rejects.toThrow()

      // 8. ログアウト
      await useAuthStore.getState().logout()
      
      const finalAuthState = useAuthStore.getState()
      expect(finalAuthState.user).toBeNull()
      expect(finalAuthState.token).toBeNull()
    })

    it('複数ドキュメントの階層構造作成ワークフロー', async () => {
      // ログイン
      const uniqueEmail = `hierarchy-test-${Date.now()}@example.com`
      const testUser = {
        email: uniqueEmail,
        password: 'password123',
        name: '階層テストユーザー'
      }

      // ストアのregisterメソッドを使用
      await useAuthStore.getState().register(testUser.email, testUser.password, testUser.name)

      // プロジェクトルートドキュメント作成
      const projectDoc = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify({
          title: 'プロジェクト',
          content: 'プロジェクトの概要',
          parent_id: null
        })
      })

      // チャプター1作成
      const chapter1 = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify({
          title: 'チャプター1',
          content: 'チャプター1の内容',
          parent_id: projectDoc.id
        })
      })

      // チャプター2作成
      const chapter2 = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify({
          title: 'チャプター2',
          content: 'チャプター2の内容',
          parent_id: projectDoc.id
        })
      })

      // チャプター1のサブセクション作成
      const subsection = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify({
          title: 'サブセクション1.1',
          content: 'サブセクションの内容',
          parent_id: chapter1.id
        })
      })

      // ドキュメントツリーを取得して構造を確認
      const tree = await apiRequest(API_ENDPOINTS.documents.tree, {
        method: 'GET'
      })

      // プロジェクトドキュメントがルートに存在することを確認
      const projectInTree = tree.find((doc: { id: number }) => doc.id === projectDoc.id)
      expect(projectInTree).toBeTruthy()

      // チャプターが子として存在することを確認
      expect(projectInTree?.children).toBeTruthy()
      expect(Array.isArray(projectInTree?.children)).toBe(true)
      expect(projectInTree?.children?.length).toBe(2)

      // サブセクションがチャプター1の子として存在することを確認
      const chapter1InTree = projectInTree?.children?.find((child: { id: number }) => child.id === chapter1.id)
      expect(chapter1InTree?.children).toBeTruthy()
      expect(Array.isArray(chapter1InTree?.children)).toBe(true)
      expect(chapter1InTree?.children?.length).toBe(1)

      const subsectionInTree = chapter1InTree?.children?.find((child: { id: number }) => child.id === subsection.id)
      expect(subsectionInTree).toBeTruthy()

      // ドキュメント移動テスト（サブセクションをチャプター2に移動）
      await apiRequest(API_ENDPOINTS.documents.move(subsection.id), {
        method: 'PUT',
        body: JSON.stringify({
          parent_id: chapter2.id
        })
      })

      // 移動後のツリーを確認
      const updatedTree = await apiRequest(API_ENDPOINTS.documents.tree, {
        method: 'GET'
      })

      const updatedProjectInTree = updatedTree.find((doc: { id: number }) => doc.id === projectDoc.id)
      const updatedChapter2InTree = updatedProjectInTree?.children?.find((child: { id: number }) => child.id === chapter2.id)
      const movedSubsectionInTree = updatedChapter2InTree?.children?.find((child: { id: number }) => child.id === subsection.id)
      
      expect(movedSubsectionInTree).toBeTruthy()
    })

    it('権限とセキュリティのワークフロー', async () => {
      // ユーザー1でドキュメント作成
      const user1Email = `security-test-1-${Date.now()}@example.com`
      const user1 = {
        email: user1Email,
        password: 'password123',
        name: 'セキュリティテストユーザー1'
      }

      // ストアのregisterメソッドを使用
      await useAuthStore.getState().register(user1.email, user1.password, user1.name)

      const user1Doc = await apiRequest(API_ENDPOINTS.documents.create, {
        method: 'POST',
        body: JSON.stringify({
          title: 'ユーザー1のドキュメント',
          content: 'プライベートコンテンツ',
          parent_id: null
        })
      })

      // ログアウト
      await useAuthStore.getState().logout()

      // ユーザー2で登録・ログイン
      const user2Email = `security-test-2-${Date.now()}@example.com`
      const user2 = {
        email: user2Email,
        password: 'password123',
        name: 'セキュリティテストユーザー2'
      }

      // ストアのregisterメソッドを使用
      await useAuthStore.getState().register(user2.email, user2.password, user2.name)

      // ユーザー2がユーザー1のドキュメントにアクセスできないことを確認
      await expect(
        apiRequest(API_ENDPOINTS.documents.get(user1Doc.id), {
          method: 'GET'
        })
      ).rejects.toThrow()

      // ユーザー2のドキュメント一覧にユーザー1のドキュメントが含まれないことを確認
      const user2Documents = await apiRequest(API_ENDPOINTS.documents.list, {
        method: 'GET'
      })

      // 新しいユーザーなので空の配列が返されることを期待
      expect(Array.isArray(user2Documents)).toBe(true)
      
      // ユーザー1のドキュメントが含まれていないことを確認
      if (user2Documents.length > 0) {
        const user1DocInList = user2Documents.find((doc: { id: number }) => doc.id === user1Doc.id)
        expect(user1DocInList).toBeFalsy()
      }
    })

    it('認証なしでのAPIアクセス制限', async () => {
      // 認証なしでドキュメント一覧取得を試行
      await expect(
        fetch(`http://localhost:8080${API_ENDPOINTS.documents.list}`, {
          method: 'GET'
        }).then(response => {
          if (!response.ok) throw new Error(`${response.status}`)
          return response.json()
        })
      ).rejects.toThrow()

      // 認証なしでドキュメント作成を試行
      await expect(
        fetch(`http://localhost:8080${API_ENDPOINTS.documents.create}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Unauthorized Document',
            content: 'This should not be created',
            parent_id: null
          })
        }).then(response => {
          if (!response.ok) throw new Error(`${response.status}`)
          return response.json()
        })
      ).rejects.toThrow()
    })
  })
})
