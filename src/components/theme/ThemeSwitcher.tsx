import { Sun, Moon } from 'lucide-react'
import { useTheme, getMode, getStyle } from '../../hooks/useTheme'
import { useAuthStore } from '../../hooks/useAuth'
import { api } from '../../lib/api'

export function ThemeSwitcher() {
  const { theme, toggleMode } = useTheme()
  const user = useAuthStore(s => s.user)
  const updateUser = useAuthStore(s => s.updateUser)
  const mode = getMode(theme)

  const handleToggle = async () => {
    toggleMode()
    if (user) {
      const newMode = mode === 'light' ? 'dark' : 'light'
      const newTheme = `${getStyle(theme)}-${newMode}`
      updateUser({ theme: newTheme })
      try { await api.put('/auth/profile', { theme: newTheme }) } catch { /* ignore */ }
    }
  }

  return (
    <button
      onClick={handleToggle}
      className="w-9 h-9 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
      title={mode === 'light' ? '切换深色' : '切换浅色'}
      aria-label={mode === 'light' ? '切换深色' : '切换浅色'}
      style={{ color: 'var(--color-text)' }}
    >
      {mode === 'light' ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  )
}
