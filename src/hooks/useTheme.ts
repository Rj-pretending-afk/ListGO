import { useShallow } from 'zustand/react/shallow'
import { useAppStore, type Theme } from '../lib/store'

export type { Theme }

export const THEME_ICONS: Record<Theme, string> = {
  day: '☀',
  dark: '🌙',
  'light-pink': '🌸',
  'dark-pink': '🌹',
}

export function useTheme() {
  return useAppStore(useShallow(s => ({ theme: s.theme, cycleTheme: s.cycleTheme })))
}
