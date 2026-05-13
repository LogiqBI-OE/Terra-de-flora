import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type LoginPayload, type Role } from './api'

interface AuthUser {
  email: string
  full_name: string | null
  role: Role
  level: number
  level_label: string
  permissions: string[]
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<AuthUser>
  logout: () => void
  /** ¿El usuario tiene este permiso (efectivo)? */
  can: (perm: string) => boolean
}

const AuthCtx = createContext<AuthState | null>(null)

const STORAGE_KEY = 'oleolab.session'

interface PersistedSession {
  token: string
  user: AuthUser
}

function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedSession) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadSession()
  const [token, setToken] = useState<string | null>(initial?.token ?? null)
  const [user, setUser] = useState<AuthUser | null>(initial?.user ?? null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (token && user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [token, user])

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true)
    try {
      const res = await authApi.login(payload)
      const u: AuthUser = {
        email: res.email,
        full_name: res.full_name,
        role: res.role,
        level: res.level,
        level_label: res.level_label,
        permissions: res.permissions ?? [],
      }
      setToken(res.access_token)
      setUser(u)
      return u
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const can = useCallback(
    (perm: string) => Boolean(user?.permissions.includes(perm)),
    [user],
  )

  const value = useMemo<AuthState>(
    () => ({ user, token, loading, login, logout, can }),
    [user, token, loading, login, logout, can],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
