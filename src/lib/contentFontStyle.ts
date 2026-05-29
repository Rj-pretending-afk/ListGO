import type { ContentFontSettings } from '../types/list.types'
import type React from 'react'

export function contentFontStyle(s?: ContentFontSettings): React.CSSProperties {
  if (!s) return {}
  const deco = [s.underline && 'underline', s.strike && 'line-through'].filter(Boolean).join(' ')
  return {
    fontWeight:     s.bold      ? 'bold'   : undefined,
    fontStyle:      s.italic    ? 'italic' : undefined,
    textDecoration: deco || undefined,
    color:          s.color,
    fontFamily:     s.family,
    fontSize:       s.size,
  }
}
