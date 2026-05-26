import { useShallow } from 'zustand/react/shallow'
import { useAppStore, type Theme, type StyleTheme, type ColorMode, getStyle, getMode } from '../lib/store'

export type { Theme, StyleTheme, ColorMode }
export { getStyle, getMode }

interface StyleMeta {
  name: string
  nameEn: string
  icon: string
  preview: { light: [string, string, string]; dark: [string, string, string] }
}

export const STYLE_META: Record<StyleTheme, StyleMeta> = {
  clay:     { name: '粘土拟态', nameEn: 'Claymorphism',  icon: '🪨', preview: { light: ['#E8EEF5','#FFFFFF','#10B981'],              dark: ['#18181B','#27272A','#34D399'] } },
  glass:    { name: '玻璃拟态', nameEn: 'Glassmorphism', icon: '🔮', preview: { light: ['#C7D2FE','rgba(255,255,255,0.3)','#7C3AED'], dark: ['#1a1040','rgba(255,255,255,0.08)','#A78BFA'] } },
  minimal:  { name: '极简主义', nameEn: 'Minimalism',    icon: '◻',  preview: { light: ['#FAFAFA','#FFFFFF','#10B981'],              dark: ['#0A0A0A','#141414','#10B981'] } },
  brutal:   { name: '新粗野',   nameEn: 'Neo-Brutalism', icon: '⬛', preview: { light: ['#FFFFFF','#FFFFFF','#10B981'],              dark: ['#111111','#1A1A1A','#FF3F3F'] } },
  material: { name: '质感设计', nameEn: 'Material',      icon: '💎', preview: { light: ['#FFFBFE','#FFFFFF','#6750A4'],              dark: ['#1C1B1F','#2B2930','#D0BCFF'] } },
  bauhaus:  { name: '包豪斯',   nameEn: 'Bauhaus',       icon: '◼',  preview: { light: ['#FFFFF8','#FFFFFF','#D62828'],              dark: ['#0F0F00','#1C1C08','#FF3333'] } },
  retro:    { name: '复古未来', nameEn: 'Retrofuturism', icon: '📺', preview: { light: ['#F0EAD6','#F5F0E4','#00BFFF'],              dark: ['#05050F','#0D0D1A','#00FFCC'] } },
}

export function useTheme() {
  return useAppStore(useShallow(s => ({
    theme: s.theme,
    setTheme: s.setTheme,
    setStyle: s.setStyle,
    toggleMode: s.toggleMode,
  })))
}
