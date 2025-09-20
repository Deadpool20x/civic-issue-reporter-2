import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import backend from '~backend/client'
import type { User } from '~backend/users/get_profile'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (phoneNumber: string, otp: string) => Promise<boolean>
  logout: () => void
  sendOtp: (phoneNumber: string) => Promise<boolean>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const sendOtp = async (phoneNumber: string): Promise<boolean> => {
    try {
      await backend.auth.sendOtp({ phoneNumber })
      return true
    } catch (error) {
      console.error('Failed to send OTP:', error)
      return false
    }
  }

  const login = async (phoneNumber: string, otp: string): Promise<boolean> => {
    try {
      const response = await backend.auth.verifyOtp({ phoneNumber, otp })
      if (response.success) {
        await refreshUser()
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth-token')
  }

  const refreshUser = async () => {
    try {
      const profile = await backend.users.getProfile()
      setUser(profile)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        await refreshUser()
      } catch (error) {
        console.error('Auth initialization failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        sendOtp,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}