import type { User } from '$lib/types'

/**
 * 認証状態を管理するストア
 * Svelte 5のRunesを使用
 */
class AuthStore {
  user = $state<User | null>(null)
  isLoading = $state(false)

  /**
   * loading プロパティ（isLoadingのエイリアス）
   */
  get loading() {
    return this.isLoading
  }

  /**
   * 認証状態をチェック
   */
  async checkAuth() {
    try {
      this.isLoading = true
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        this.user = data
      } else {
        this.user = null
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      this.user = null
    } finally {
      this.isLoading = false
    }
  }

  /**
   * ログイン処理
   */
  async login(email: string, password: string) {
    this.isLoading = true
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'ログインに失敗しました')
      }

      const data = await response.json()
      this.user = data.user
      return data
    } finally {
      this.isLoading = false
    }
  }

  /**
   * ログアウト処理
   */
  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      this.user = null
    }
  }

  /**
   * ユーザー登録処理
   */
  async register(email: string, password: string, name: string) {
    this.isLoading = true
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '登録に失敗しました')
      }

      const data = await response.json()
      this.user = data.user
      return data
    } finally {
      this.isLoading = false
    }
  }
}

export const authStore = new AuthStore()
