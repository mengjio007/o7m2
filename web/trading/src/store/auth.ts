import { create } from 'zustand'
import { authApi } from '@/services/api'

interface User {
  id: string
  username: string
  email: string
  avatar: string
  role: string
}

interface Account {
  id: string
  user_id: string
  balance: number
  frozen: number
}

interface AuthState {
  user: User | null
  account: Account | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
  setAccount: (account: Account) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  account: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const res = await authApi.login({ email, password })
      const { token, user } = res as any
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      set({ user, token, isAuthenticated: true, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ loading: true })
    try {
      const res = await authApi.register({ username, email, password })
      const { token, user } = res as any
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      set({ user, token, isAuthenticated: true, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  logout: () => {
    authApi.logout()
    set({ user: null, account: null, token: null, isAuthenticated: false })
  },

  loadUser: async () => {
    try {
      const res = await authApi.getMe()
      set({ user: (res as any).user })
    } catch (error) {
      set({ user: null, isAuthenticated: false })
    }
  },

  setAccount: (account: Account) => {
    set({ account })
  },
}))
