import { Bold, Italic, Underline, Strikethrough } from 'lucide-react'
import { useT } from '../../hooks/useLang'
import { FONT_SIZES, FONT_FAMILIES } from '../../lib/i18n'
import type { ContentFontSettings } from '../../types/list.types'

interface ContentFormattingBarProps {
  settings?: ContentFontSettings
  onChange: (s: ContentFontSettings | undefined) => void
}

export function ContentFormattingBar({ settings, onChange }: ContentFormattingBarProps) {
  const t = useT()
  const s = settings ?? {}

  const toggle = (key: keyof ContentFontSettings, value?: unknown) => {
    const next = { ...s }
    if (typeof s[key] === 'boolean') {
      if (s[key]) delete next[key as 'bold' | 'italic' | 'underline' | 'strike']
      else (next as Record<string, unknown>)[key] = true
    } else {
      if (s[key] === value) delete (next as Record<string, unknown>)[key]
      else (next as Record<string, unknown>)[key] = value
    }
    const empty = !Object.values(next).some(v => v !== undefined && v !== false)
    onChange(empty ? undefined : next as ContentFontSettings)
  }

  const set = (key: keyof ContentFontSettings, value: string | undefined) => {
    const next = { ...s, [key]: value || undefined }
    const empty = !Object.values(next).some(v => v !== undefined && v !== false)
    onChange(empty ? undefined : next as ContentFontSettings)
  }

  const btnBase = 'w-7 h-7 rounded flex items-center justify-center transition-colors text-xs font-medium'
  const active  = { backgroundColor: 'var(--color-primary)', color: 'white' }
  const inactive = { color: 'var(--color-text)', opacity: 0.55 }

  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 scrollbar-none"
      style={{
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        borderBottom: '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--color-card) 70%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      // hide webkit scrollbar
      onTouchStart={e => e.stopPropagation()}  // prevent drag-to-reorder triggering on bar scroll
    >

      {/* Bold */}
      <button className={btnBase} onClick={() => toggle('bold')} title={t('fmtBold')}
        style={s.bold ? active : inactive}><Bold size={12} /></button>
      {/* Italic */}
      <button className={btnBase} onClick={() => toggle('italic')} title={t('fmtItalic')}
        style={s.italic ? active : inactive}><Italic size={12} /></button>
      {/* Underline */}
      <button className={btnBase} onClick={() => toggle('underline')} title={t('fmtUnderline')}
        style={s.underline ? active : inactive}><Underline size={12} /></button>
      {/* Strike */}
      <button className={btnBase} onClick={() => toggle('strike')} title={t('fmtStrike')}
        style={s.strike ? active : inactive}><Strikethrough size={12} /></button>

      <div className="w-px h-4 mx-0.5" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Color */}
      <label className={`${btnBase} cursor-pointer relative overflow-hidden`} title="颜色"
        style={s.color ? { ...active, backgroundColor: s.color } : inactive}>
        <span className="text-xs font-bold select-none" style={{ color: s.color ? 'white' : undefined }}>A</span>
        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          value={s.color ?? '#ffffff'} onChange={e => set('color', e.target.value)} />
      </label>
      {s.color && (
        <button className="text-xs hover:opacity-70" style={{ color: '#ef4444' }}
          onClick={() => set('color', undefined)}>✕</button>
      )}

      <div className="w-px h-4 mx-0.5" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Font family */}
      <select value={s.family ?? ''} onChange={e => set('family', e.target.value || undefined)}
        className="text-xs rounded outline-none px-1 py-0.5 h-7"
        style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)', border: 'none', maxWidth: '80px' }}>
        {FONT_FAMILIES.map(({ key, value }) => (
          <option key={key} value={value}>{t(key)}</option>
        ))}
      </select>

      <div className="w-px h-4 mx-0.5" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Font sizes */}
      {FONT_SIZES.map(({ key, value }) => (
        <button key={key} className={`${btnBase}`}
          style={s.size === value ? active : inactive}
          onClick={() => set('size', s.size === value ? undefined : value)}>
          {t(key)}
        </button>
      ))}
    </div>
  )
}

/** Convert ContentFontSettings to React.CSSProperties */
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
