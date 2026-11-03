import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'system' | 'light' | 'dark'
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({
  theme: 'system',
  setTheme: () => {},
})
const systemTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('opslens-theme')
      return saved === 'dark' || saved === 'light' ? saved : 'system'
    } catch {
      return 'system'
    }
  })
  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = theme === 'system' ? systemTheme() : theme
    }
    apply()
    try {
      localStorage.setItem('opslens-theme', theme)
    } catch {
      /* Theme still works when browser storage is unavailable. */
    }
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    media?.addEventListener('change', apply)
    return () => media?.removeEventListener('change', apply)
  }, [theme])
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function ThemeControl() {
  const { theme, setTheme } = useContext(ThemeContext)
  return (
    <label className="theme-control">
      <span>Appearance</span>
      <select
        aria-label="Appearance"
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  )
}
