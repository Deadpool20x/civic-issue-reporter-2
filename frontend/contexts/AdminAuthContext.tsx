import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import backend from '~backend/client'
import type { User } from '~backend/users/get_profile'

interface AdminAuthContextType {
  adminUser: User | null
  isLoading: boolean
  loginAsAdmin: (phoneNumber: string, otp: string) => Promise<boolean>
  logout: () => void
  sendOtp: (phoneNumber: string) => Promise<boolean>
  refreshUser: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

interface AdminAuthProviderProps {
  children: ReactNode
}

export default function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [adminUser, setAdminUser] = useState<User | null>(null)
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

  const loginAsAdmin = async (phoneNumber: string, otp: string): Promise<boolean> => {
    try {
      const response = await backend.auth.verifyOtp({ phoneNumber, otp })
      if (response.success) {
        await refreshUser()
        
        if (adminUser?.role === 'admin' || adminUser?.role === 'department_head') {
          return true
        } else {
          setAdminUser(null)
          return false
        }
      }
      return false
    } catch (error) {
      console.error('Admin login failed:', error)
      return false
    }
  }

  const logout = () => {
    setAdminUser(null)
    localStorage.removeItem('admin-auth-token')
  }

  const refreshUser = async () => {
    try {
      const profile = await backend.users.getProfile()
      if (profile.role === 'admin' || profile.role === 'department_head') {
        setAdminUser(profile)
      } else {
        setAdminUser(null)
      }
    } catch (error) {
      console.error('Failed to refresh admin user:', error)
      setAdminUser(null)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        await refreshUser()
      } catch (error) {
        console.error('Admin auth initialization failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isLoading,
        loginAsAdmin,
        logout,
        sendOtp,
        refreshUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}