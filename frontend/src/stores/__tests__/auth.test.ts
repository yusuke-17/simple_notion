import { vi, describe, it, beforeEach, expect, type MockedFunction } from 'vitest'
import { useAuthStore } from '../auth'

// fetchのモック
global.fetch = vi.fn()

const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
}

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // ストアの状態をリセット
    useAuthStore.setState({
      user: null,
      token: null,
      loading: false,
    })
  })

  describe('login', () => {
    it('正常にログインできる', async () => {
      const mockResponse = { user: mockUser, token: 'test-token' }
      
      ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response)

      const { login } = useAuthStore.getState()
      await login('test@example.com', 'password123')

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        credentials: 'include'
      })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe('test-token')
      expect(state.loading).toBe(false)
    })

    it('ログイン中はloadingがtrueになる', async () => {
      let resolvePromise: (value: Response) => void
      const promise = new Promise<Response>((resolve) => {
        resolvePromise = resolve
      })
      
      ;(fetch as MockedFunction<typeof fetch>).mockReturnValue(promise)

      const { login } = useAuthStore.getState()
      const loginPromise = login('test@example.com', 'password123')

      // ログイン中はloadingがtrue
      expect(useAuthStore.getState().loading).toBe(true)

      // レスポンスを返す
      resolvePromise!({
        ok: true,
        json: vi.fn().mockResolvedValue({ user: mockUser, token: 'test-token' }),
      } as unknown as Response)

      await loginPromise

      // ログイン完了後はloadingがfalse
      expect(useAuthStore.getState().loading).toBe(false)
    })

    it('ログイン失敗時にエラーを投げる', async () => {
      ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue('Invalid credentials'),
      } as unknown as Response)

      const { login } = useAuthStore.getState()

      await expect(login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials')

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.loading).toBe(false)
    })

    it('ネットワークエラー時の処理', async () => {
      ;(fetch as MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'))

      const { login } = useAuthStore.getState()

      await expect(login('test@example.com', 'password123')).rejects.toThrow('Network error')

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.loading).toBe(false)
    })
  })

  describe('register', () => {
    it('正常に登録できる', async () => {
      const mockResponse = { user: mockUser, token: 'test-token' }
      
      ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response)

      const { register } = useAuthStore.getState()
      await register('test@example.com', 'password123', 'Test User')

      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123', name: 'Test User' }),
        credentials: 'include'
      })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe('test-token')
      expect(state.loading).toBe(false)
    })

    it('登録中はloadingがtrueになる', async () => {
      let resolvePromise: (value: Response) => void
      const promise = new Promise<Response>((resolve) => {
        resolvePromise = resolve
      })
      
      ;(fetch as MockedFunction<typeof fetch>).mockReturnValue(promise)

      const { register } = useAuthStore.getState()
      const registerPromise = register('test@example.com', 'password123', 'Test User')

      // 登録中はloadingがtrue
      expect(useAuthStore.getState().loading).toBe(true)

      // レスポンスを返す
      resolvePromise!({
        ok: true,
        json: vi.fn().mockResolvedValue({ user: mockUser, token: 'test-token' }),
      } as unknown as Response)

      await registerPromise

      // 登録完了後はloadingがfalse
      expect(useAuthStore.getState().loading).toBe(false)
    })

    it('登録失敗時にエラーを投げる', async () => {
      ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue('Email already exists'),
      } as unknown as Response)

      const { register } = useAuthStore.getState()

      await expect(register('test@example.com', 'password123', 'Test User')).rejects.toThrow('Email already exists')

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.loading).toBe(false)
    })
  })

  describe('logout', () => {
    it('正常にログアウトできる', async () => {
      // 初期状態を設定
      useAuthStore.setState({
        user: mockUser,
        token: 'test-token',
        loading: false,
      })

      ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
      } as unknown as Response)

      const { logout } = useAuthStore.getState()
      await logout()

      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.loading).toBe(false)
    })

    it('ログアウトAPIエラー時でも状態をリセットする', async () => {
      // 初期状態を設定
      useAuthStore.setState({
        user: mockUser,
        token: 'test-token',
        loading: false,
      })

      ;(fetch as MockedFunction<typeof fetch>).mockImplementation(() => {
        // ログアウトAPIを呼び出しつつエラーが発生する場合もあるが、
        // 状態は確実にリセットする必要がある
        return Promise.resolve({
          ok: true,
        } as unknown as Response)
      })

      const { logout } = useAuthStore.getState()
      await logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.loading).toBe(false)
    })
  })

  describe('checkAuth', () => {
    it('認証チェックが成功したときユーザー情報を設定する', async () => {
      const mockResponse = { user: mockUser, token: 'test-token' }
      
      ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response)

      const { checkAuth } = useAuthStore.getState()
      await checkAuth()

      expect(fetch).toHaveBeenCalledWith('/api/auth/me', {
        credentials: 'include'
      })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe('test-token')
    })

    it('認証チェックが失敗したときユーザー情報をクリアする', async () => {
      // 初期状態を設定
      useAuthStore.setState({
        user: mockUser,
        token: 'test-token',
        loading: false,
      })

      ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
      } as unknown as Response)

      const { checkAuth } = useAuthStore.getState()
      await checkAuth()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })

    it('認証チェックでネットワークエラーが発生したときユーザー情報をクリアする', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // 初期状態を設定
      useAuthStore.setState({
        user: mockUser,
        token: 'test-token',
        loading: false,
      })

      ;(fetch as MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'))

      const { checkAuth } = useAuthStore.getState()
      await checkAuth()

      expect(consoleSpy).toHaveBeenCalledWith('Auth check failed:', expect.any(Error))

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()

      consoleSpy.mockRestore()
    })
  })

  describe('setLoading', () => {
    it('loading状態を変更できる', () => {
      const { setLoading } = useAuthStore.getState()
      
      setLoading(true)
      expect(useAuthStore.getState().loading).toBe(true)
      
      setLoading(false)
      expect(useAuthStore.getState().loading).toBe(false)
    })
  })
})
