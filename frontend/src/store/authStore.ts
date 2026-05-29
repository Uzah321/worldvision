import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        localStorage.setItem('token', token)
        set({ token, user })
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null })
      },
    }),
    { name: 'wv-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)

/** Returns true if the current user has ANY of the supplied roles. Pass no args to match all authenticated users. */
export function useHasRole(...roles: string[]): boolean {
  return useAuthStore((s) => {
    if (!roles.length) return !!s.token
    const userRoles = s.user?.roles?.map((r) => r.name) ?? []
    return roles.some((r) => userRoles.includes(r))
  })
}

/** Non-hook version for use outside React components (e.g. in route guards). */
export function hasRole(user: User | null, ...roles: string[]): boolean {
  if (!roles.length) return true
  const userRoles = user?.roles?.map((r) => r.name) ?? []
  return roles.some((r) => userRoles.includes(r))
}
