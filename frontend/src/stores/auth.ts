import { create } from 'zustand'
import type { AuthState } from '../types'

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  loading: false,

  setLoading: (loading: boolean) => set({ loading }),

  login: async (email: string, password: string) => {
    set({ loading: true })
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Login failed')
      }
      
      const data = await response.json()
      set({
        user: data.user,
        token: data.token,
        loading: false
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ loading: true })
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Registration failed')
      }
      
      const data = await response.json()
      set({
        user: data.user,
        token: data.token,
        loading: false
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  logout: async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    
    set({
      user: null,
      token: null,
      loading: false
    })
  },

  checkAuth: async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        set({
          user: data.user,
          token: data.token
        })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }
}))
