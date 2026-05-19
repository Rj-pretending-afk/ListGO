import { useTheme, THEME_ICONS } from '../../hooks/useTheme'

export function ThemeSwitcher() {
  const { theme, cycleTheme } = useTheme()
  return (
    <button
      onClick={cycleTheme}
      className="w-9 h-9 rounded-lg text-lg flex items-center justify-center hover:opacity-70 transition-opacity"
      title="切换主题"
      aria-label="切换主题"
    >
      {THEME_ICONS[theme]}
    </button>
  )
}
