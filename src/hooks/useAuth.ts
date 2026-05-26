import { create } from 'zustand'
import { api } from '../lib/api'
import { authStorage } from '../lib/auth'
import { useAppStore } from '../lib/store'
import type { User } from '../types/user.types'

interface AuthState {
  user: User | null
  authLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (patch: Partial<User>) => void
  initAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authLoading: true,

  login: (token, user) => {
    authStorage.setToken(token)
    set({ user })
    if (user.theme) useAppStore.getState().setTheme(user.theme)
    void useAppStore.getState().syncFromCloud()
  },

  logout: () => {
    authStorage.clearToken()
    set({ user: null })
  },

  updateUser: (patch) => set(s => ({ user: s.user ? { ...s.user, ...patch } : null })),

  initAuth: async () => {
    if (!authStorage.getToken()) { set({ authLoading: false }); return }
    try {
      const data = await api.get<User & { token?: string }>('/auth/me')
      // Refresh stored token so DB role changes (e.g. admin promotion) take effect
      if (data.token) authStorage.setToken(data.token)
      if (data.theme) useAppStore.getState().setTheme(data.theme)
      set({ user: data, authLoading: false })
      void useAppStore.getState().syncFromCloud()
    } catch {
      authStorage.clearToken()
      set({ authLoading: false })
    }
  },
}))
