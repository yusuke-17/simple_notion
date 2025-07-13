import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Login } from '@/components/Login'
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

describe('認証フロー結合テスト', () => {
  beforeEach(() => {
    resetAuthStore()
  })

  describe('ユーザー登録', () => {
    it('新規ユーザーが正常に登録できる', async () => {
      const user = userEvent.setup()
      render(<Login />)

      // 登録モードに切り替え
      const toggleButton = screen.getByText("Don't have an account? Register")
      await user.click(toggleButton)

      // 登録モードになったことを確認
      await screen.findByText('Create your account')

      // フォームに入力
      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      await user.type(nameInput, TEST_USERS.valid.name)
      await user.type(emailInput, `test-${Date.now()}@example.com`) // ユニークなメール
      await user.type(passwordInput, TEST_USERS.valid.password)

      // 登録ボタンをクリック
      const submitButton = screen.getByRole('button', { name: /sign up|register|create/i })
      await user.click(submitButton)

      // ストアの状態を確認
      await waitFor(() => {
        const authState = useAuthStore.getState()
        expect(authState.loading).toBe(false)
        expect(authState.user).toBeTruthy()
        expect(authState.token).toBeTruthy()
      }, { timeout: 5000 })
    })

    it('無効なパスワードで登録に失敗する', async () => {
      const user = userEvent.setup()
      render(<Login />)

      // 登録モードに切り替え
      const toggleButton = screen.getByText("Don't have an account? Register")
      await user.click(toggleButton)

      // 登録モードになったことを確認
      await screen.findByText('Create your account')

      // 短いパスワードでフォームに入力
      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      await user.type(nameInput, TEST_USERS.valid.name)
      await user.type(emailInput, `test-${Date.now()}@example.com`)
      await user.type(passwordInput, '123') // 短いパスワード

      // 登録ボタンをクリック
      const submitButton = screen.getByRole('button', { name: /sign up|register|create/i })
      await user.click(submitButton)

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })
  })

  describe('ユーザーログイン', () => {
    it('有効な認証情報でログインできる', async () => {
      // まず、テストユーザーを登録（事前条件）
      const uniqueEmail = `test-${Date.now()}@example.com`
      const testUser = {
        name: TEST_USERS.valid.name,
        email: uniqueEmail,
        password: TEST_USERS.valid.password
      }
      
      try {
        await apiRequest(API_ENDPOINTS.auth.register, {
          method: 'POST',
          body: JSON.stringify(testUser)
        })
      } catch {
        // ユーザーが既に存在する場合は無視
      }

      const user = userEvent.setup()
      render(<Login />)

      // ログインフォームに入力
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      await user.type(emailInput, testUser.email)
      await user.type(passwordInput, testUser.password)

      // ログインボタンをクリック
      const submitButton = screen.getByRole('button', { name: /sign in|login/i })
      await user.click(submitButton)

      // ストアの状態を確認
      await waitFor(() => {
        const authState = useAuthStore.getState()
        expect(authState.loading).toBe(false)
        expect(authState.user).toBeTruthy()
        expect(authState.token).toBeTruthy()
        expect(authState.user?.email).toBe(testUser.email)
      }, { timeout: 5000 })
    })

    it('無効な認証情報でログインに失敗する', async () => {
      const user = userEvent.setup()
      render(<Login />)

      // 無効な認証情報でフォームに入力
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      await user.type(emailInput, 'invalid@example.com')
      await user.type(passwordInput, 'wrongpassword')

      // ログインボタンをクリック
      const submitButton = screen.getByRole('button', { name: /sign in|login/i })
      await user.click(submitButton)

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })

      // ストアの状態を確認（ログインしていない）
      const authState = useAuthStore.getState()
      expect(authState.user).toBeNull()
      expect(authState.token).toBeNull()
    })
  })

  describe('ログアウト', () => {
    it('ログイン後に正常にログアウトできる', async () => {
      // 事前にテストユーザーを登録
      const uniqueEmail = `logout-test-${Date.now()}@example.com`
      const testUser = {
        name: TEST_USERS.valid.name,
        email: uniqueEmail,
        password: TEST_USERS.valid.password
      }
      
      // ストアのregisterメソッドを使用
      await useAuthStore.getState().register(testUser.email, testUser.password, testUser.name)
      
      // ログイン状態を確認
      const authState = useAuthStore.getState()
      expect(authState.user).toBeTruthy()
      expect(authState.token).toBeTruthy()
      
      // ログアウト実行
      await useAuthStore.getState().logout()

      // ストアの状態を確認
      await waitFor(() => {
        const authState = useAuthStore.getState()
        expect(authState.user).toBeNull()
        expect(authState.token).toBeNull()
      })
    })
  })

  describe('認証状態の確認', () => {
    it('有効なトークンで認証状態を確認できる', async () => {
      // 事前にテストユーザーを登録してログイン
      const uniqueEmail = `auth-check-${Date.now()}@example.com`
      const testUser = {
        name: TEST_USERS.valid.name,
        email: uniqueEmail,
        password: TEST_USERS.valid.password
      }
      
      // ストアのregisterメソッドを使用
      await useAuthStore.getState().register(testUser.email, testUser.password, testUser.name)
      
      // ログイン状態を確認
      let authState = useAuthStore.getState()
      expect(authState.user).toBeTruthy()
      expect(authState.user?.email).toBe(testUser.email)
      
      // 認証状態を再確認
      await useAuthStore.getState().checkAuth()

      authState = useAuthStore.getState()
      expect(authState.user).toBeTruthy()
      expect(authState.user?.email).toBe(testUser.email)
    })
  })
})
