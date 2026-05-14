// Theme provider: toggle dark/light + persistencia en localStorage.
// Aplica la clase `theme-dark` o `theme-light` al elemento <html>.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const STORAGE_KEY = 'terradeflora.theme'
const ThemeCtx = createContext<ThemeState | null>(null)

function detectInitial(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* ignore */ }
  // Default = dark (la app nace dark)
  return 'dark'
}

function applyToDom(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('theme-dark', 'theme-light')
  root.classList.add(`theme-${theme}`)
  root.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(detectInitial)

  useEffect(() => {
    applyToDom(theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const toggle = useCallback(() => setThemeState((p) => (p === 'dark' ? 'light' : 'dark')), [])

  const value = useMemo<ThemeState>(() => ({ theme, toggle, setTheme }), [theme, toggle, setTheme])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
