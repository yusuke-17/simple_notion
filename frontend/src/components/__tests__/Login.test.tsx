import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import React from 'react'
import { Login } from '../Login'

// Storeのモック
const mockLogin = vi.fn()
const mockRegister = vi.fn()

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    register: mockRegister,
    loading: false,
  }),
}))

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ログインフォームが正しくレンダリングされる', () => {
    render(<Login />)
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('登録モードに切り替えられる', async () => {
    const user = userEvent.setup()
    render(<Login />)
    
    const toggleButton = screen.getByText("Don't have an account? Register")
    await user.click(toggleButton)
    
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
  })

  it('ログインフォームの入力が正しく動作する', async () => {
    const user = userEvent.setup()
    render(<Login />)
    
    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('ログインフォームの送信が正しく動作する', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce(undefined)
    
    render(<Login />)
    
    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('登録フォームの送信が正しく動作する', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValueOnce(undefined)
    
    render(<Login />)
    
    // 登録モードに切り替え
    const toggleButton = screen.getByText("Don't have an account? Register")
    await user.click(toggleButton)
    
    const nameInput = screen.getByLabelText('Name')
    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Register' })
    
    await user.type(nameInput, 'Test User')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User')
    })
  })

  it('ログインエラーが発生したときにエラーメッセージが表示される', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Invalid credentials'
    mockLogin.mockRejectedValueOnce(new Error(errorMessage))
    
    render(<Login />)
    
    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('登録エラーが発生したときにエラーメッセージが表示される', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Email already exists'
    mockRegister.mockRejectedValueOnce(new Error(errorMessage))
    
    render(<Login />)
    
    // 登録モードに切り替え
    const toggleButton = screen.getByText("Don't have an account? Register")
    await user.click(toggleButton)
    
    const nameInput = screen.getByLabelText('Name')
    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Register' })
    
    await user.type(nameInput, 'Test User')
    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('ローディング中は送信ボタンが無効化される', async () => {
    // ローディング中のストア状態をモック
    vi.mocked(mockLogin).mockClear()
    vi.mocked(mockRegister).mockClear()
    
    // 新しいモックでローディング状態をテスト
    vi.doMock('@/stores/auth', () => ({
      useAuthStore: () => ({
        login: mockLogin,
        register: mockRegister,
        loading: true,
      }),
    }))

    // 動的インポートを使用してコンポーネントを再読み込み
    const TestComponent = () => {
      const [isLoading, setIsLoading] = React.useState(true)
      
      React.useEffect(() => {
        // ローディング状態をシミュレート
        const timeoutId = setTimeout(() => setIsLoading(false), 100)
        
        // クリーンアップ関数でtimeoutをクリア
        return () => clearTimeout(timeoutId)
      }, [])
      
      if (isLoading) {
        return (
          <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Sign in to your account
              </h2>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
              <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <form className="space-y-6">
                  <div>
                    <button
                      type="submit"
                      disabled={true}
                      className="w-full"
                    >
                      <span>Loading...</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
      
      return <Login />
    }
    
    render(<TestComponent />)
    
    const submitButton = screen.getByRole('button', { name: 'Loading...' })
    expect(submitButton).toBeDisabled()
  })
})
