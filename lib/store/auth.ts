'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'guest' | 'customer'
  createdAt: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  hasHydrated: boolean
  setHasHydrated: () => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

import { authService } from '@/services/authService'

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      hasHydrated: false,

      setHasHydrated: () => set({ hasHydrated: true }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const { user } = await authService.login({ email, password })
          // Map backend User to frontend User if needed
          const userData: User = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role === 'admin' ? 'admin' : 'guest',
            createdAt: new Date().toISOString(),
          }
          set({ user: userData, isLoading: false })

          // Fetch cart after login
          const { fetchCart } = (await import('./cart')).useCart.getState()
          fetchCart()
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          })
          throw error
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null })
        try {
          await authService.register({ email, password, name })
          // Auto-login so the same flow runs as a normal sign-in
          // (sets user with backend-resolved role, fetches cart, etc.)
          await get().login(email, password)
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          })
          throw error
        }
      },

      logout: async () => {
        // Selalu clear state lokal terlebih dahulu
        set({ user: null, error: null })
        // Clear the previous user's cart so the badge doesn't show stale items
        // after logout. A fresh guest cart will accumulate from here.
        try {
          const { useCart } = await import('./cart')
          useCart.setState({ items: [], cartId: null })
        } catch (error) {
          console.error('Logout cart clear error:', error)
        }
        // Lalu hapus cookie di server (tidak perlu throw jika gagal)
        try {
          await authService.logout()
        } catch (error) {
          console.error('Logout cookie clear error:', error)
        }
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-store',
      // Only persist the user object — keep transient flags (hasHydrated,
      // isLoading, error) out of localStorage so they always start fresh.
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated()
      },
    }
  )
)
