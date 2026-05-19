import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ModuleFontSettings } from '../../types/list.types'

const FONT_SIZES = [
  { label: '小', value: '0.75rem' },
  { label: '中', value: '1rem' },
  { label: '大', value: '1.25rem' },
  { label: '特大', value: '1.5rem' },
]

const FONT_FAMILIES = [
  { label: '系统默认', value: '' },
  { label: '黑体', value: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif" },
  { label: '宋体', value: "'SimSun', 'STSong', Georgia, serif" },
  { label: '楷体', value: "'KaiTi', 'STKaiti', cursive" },
  { label: '等宽', value: "'Courier New', Consolas, monospace" },
  { label: '圆体', value: "'PingFang SC', 'Hiragino Sans GB', 'Segoe UI', sans-serif" },
]

interface FontSettingsPickerProps {
  fontSettings?: ModuleFontSettings
  onFontChange: (font: ModuleFontSettings | undefined) => void
}

export function FontSettingsPicker({ fontSettings, onFontChange }: FontSettingsPickerProps) {
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const font = fontSettings ?? {}
  const hasFont = !!(fontSettings?.size || fontSettings?.family || fontSettings?.color)

  const updateFont = (patch: Partial<ModuleFontSettings>) => {
    const next = { ...font, ...patch }
    onFontChange(!next.size && !next.family && !next.color ? undefined : next)
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const panelW = 224 + 32
      const top = Math.max(8, Math.min(r.bottom + 4, window.innerHeight - 280 - 8))
      const left = Math.max(4, Math.min(r.left, window.innerWidth - panelW - 4))
      setPanelPos({ top, left })
    }
    setOpen(v => !v)
  }

  const panel = (
    <>
      <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />
      <div
        className="fixed z-[201] rounded-xl shadow-2xl"
        style={{
          top: panelPos.top,
          left: panelPos.left,
          width: '14rem',
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>标题字体</span>
            {hasFont && (
              <button className="text-xs hover:opacity-70" style={{ color: '#ef4444' }}
                onClick={() => onFontChange(undefined)}>重置</button>
            )}
          </div>

          <div className="flex gap-1">
            {FONT_SIZES.map(({ label, value }) => (
              <button key={label}
                onClick={() => updateFont({ size: font.size === value ? undefined : value })}
                className="flex-1 py-1 rounded text-xs transition-colors"
                style={{
                  backgroundColor: font.size === value ? 'var(--color-primary)' : 'var(--color-border)',
                  color: font.size === value ? 'white' : 'var(--color-text)',
                }}>
                {label}
              </button>
            ))}
          </div>

          <select
            value={font.family || ''}
            onChange={e => updateFont({ family: e.target.value })}
            className="w-full text-xs rounded-lg outline-none px-2 py-1.5"
            style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)', border: 'none' }}
          >
            {FONT_FAMILIES.map(({ label, value }) => (
              <option key={label} value={value}>{label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.5 }}>颜色</span>
            <label className="w-6 h-6 rounded overflow-hidden cursor-pointer border-2 relative flex-shrink-0"
              style={{ borderColor: 'var(--color-border)', backgroundColor: font.color || 'transparent' }}>
              <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                value={font.color || '#ffffff'}
                onChange={e => updateFont({ color: e.target.value })} />
            </label>
            {font.color && (
              <button className="text-xs hover:opacity-70" style={{ color: '#ef4444' }}
                onClick={() => updateFont({ color: undefined })}>清除</button>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="px-1 py-0.5 rounded text-xs font-bold hover:opacity-70 transition-opacity select-none"
        style={{
          color: hasFont ? (fontSettings?.color || 'var(--color-primary)') : 'var(--color-text)',
          opacity: hasFont ? 1 : 0.3,
          fontFamily: fontSettings?.family || undefined,
        }}
        title="标题字体"
      >
        A
      </button>
      {open && createPortal(panel, document.body)}
    </div>
  )
}
