import { create } from 'zustand'
import type { AuthState } from '../types'

// API base URL（テスト環境では環境変数から、そうでなければ相対パス）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>(set => ({
  user: null,
  token: null,
  loading: false,

  setLoading: (loading: boolean) => set({ loading }),

  login: async (email: string, password: string) => {
    set({ loading: true })

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || `Login failed (${response.status})`)
      }

      const data = await response.json()
      set({
        user: data.user,
        token: data.token,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ loading: true })

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || `Registration failed (${response.status})`)
      }

      const data = await response.json()
      set({
        user: data.user,
        token: data.token,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  logout: async () => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })

    set({
      user: null,
      token: null,
      loading: false,
    })
  },

  checkAuth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        set({
          user: data.user,
          token: data.token,
        })
      } else {
        // 認証失敗時は明示的にuser/tokenをnullに設定
        set({
          user: null,
          token: null,
        })
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Auth check failed:', error)
      }
      // エラー時も明示的にuser/tokenをnullに設定
      set({
        user: null,
        token: null,
      })
    }
  },
}))
