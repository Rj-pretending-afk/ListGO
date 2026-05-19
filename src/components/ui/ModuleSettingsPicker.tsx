import { useState } from 'react'
import { Settings, X } from 'lucide-react'
import type { ModuleBackground, ModuleFontSettings } from '../../types/list.types'

const PRESET_COLORS = [
  { label: '无', value: '' },
  { label: '暖米', value: '#FDF6EC' },
  { label: '薄荷', value: '#ECFDF5' },
  { label: '天蓝', value: '#EFF6FF' },
  { label: '浅紫', value: '#F5F3FF' },
  { label: '蜜桃', value: '#FFF1F2' },
  { label: '浅灰', value: '#F9FAFB' },
  { label: '炭黑', value: '#1F2937' },
  { label: '深紫', value: '#1E1B4B' },
]

const FONT_SIZES = [
  { label: '小', value: '0.75rem' },
  { label: '中', value: '1rem' },
  { label: '大', value: '1.25rem' },
  { label: '特大', value: '1.5rem' },
]

const FONT_FAMILIES = [
  { label: '默认', value: '' },
  { label: '衬线', value: "Georgia, 'SimSun', serif" },
  { label: '等宽', value: "'Courier New', monospace" },
]

const DEFAULT_BG: ModuleBackground = { type: 'color', value: '', opacity: 0.85, size: 'cover', posX: 50, posY: 50 }

interface ModuleSettingsPickerProps {
  background?: ModuleBackground
  fontSettings?: ModuleFontSettings
  onBgChange: (bg: ModuleBackground | undefined) => void
  onFontChange: (font: ModuleFontSettings | undefined) => void
}

export function ModuleSettingsPicker({ background, fontSettings, onBgChange, onFontChange }: ModuleSettingsPickerProps) {
  const [open, setOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const bg = background ?? DEFAULT_BG
  const font = fontSettings ?? {}

  const updateBg = (patch: Partial<ModuleBackground>) => onBgChange({ ...bg, ...patch })
  const updateFont = (patch: Partial<ModuleFontSettings>) => {
    const next = { ...font, ...patch }
    const isEmpty = !next.size && !next.family && !next.color
    onFontChange(isEmpty ? undefined : next)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      if (ev.target?.result) updateBg({ type: 'image', imageData: ev.target.result as string })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const hasBackground = background && (background.imageData || (background.type === 'color' && background.value))
  const hasFontSettings = fontSettings && (fontSettings.size || fontSettings.family || fontSettings.color)

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="p-1 rounded hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text)', opacity: (hasBackground || hasFontSettings) ? 0.8 : 0.3 }}
        title="模块设置"
      >
        <Settings size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-8 z-30 rounded-xl p-4 w-80 shadow-xl overflow-y-auto"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>模块设置</span>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                <X size={14} />
              </button>
            </div>

            {/* ── 字体设置 ── */}
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text)', opacity: 0.6 }}>字体</p>

            <div className="flex gap-1 mb-2 flex-wrap">
              {FONT_SIZES.map(({ label, value }) => (
                <button key={label} onClick={() => updateFont({ size: value })}
                  className="px-2 py-0.5 rounded text-xs transition-colors"
                  style={{
                    backgroundColor: font.size === value ? 'var(--color-primary)' : 'var(--color-border)',
                    color: font.size === value ? 'white' : 'var(--color-text)',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-1 mb-2 flex-wrap">
              {FONT_FAMILIES.map(({ label, value }) => (
                <button key={label} onClick={() => updateFont({ family: value })}
                  className="px-2 py-0.5 rounded text-xs transition-colors"
                  style={{
                    fontFamily: value || undefined,
                    backgroundColor: font.family === value ? 'var(--color-primary)' : 'var(--color-border)',
                    color: font.family === value ? 'white' : 'var(--color-text)',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.5 }}>文字颜色</span>
              <label className="w-7 h-7 rounded overflow-hidden cursor-pointer border-2 relative"
                style={{ borderColor: 'var(--color-border)', backgroundColor: font.color || 'transparent' }}>
                <input type="color" className="absolute inset-0 opacity-0 cursor-pointer"
                  value={font.color || '#ffffff'}
                  onChange={e => updateFont({ color: e.target.value })} />
              </label>
              {font.color && (
                <button className="text-xs hover:opacity-70" style={{ color: '#ef4444' }}
                  onClick={() => updateFont({ color: undefined })}>清除</button>
              )}
            </div>

            <div className="mb-4" style={{ borderTop: '1px solid var(--color-border)' }} />

            {/* ── 背景设置 ── */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: 'var(--color-text)', opacity: 0.6 }}>背景</p>
              {background && (
                <button onClick={() => onBgChange(undefined)} className="text-xs hover:opacity-70" style={{ color: '#ef4444' }}>
                  清除背景
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_COLORS.map(({ label, value }) => (
                <button key={label} onClick={() => updateBg({ type: 'color', value })} title={label}
                  className="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: value || undefined,
                    borderColor: bg.type === 'color' && bg.value === value ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundImage: !value ? 'linear-gradient(135deg,#ccc 25%,transparent 25%),linear-gradient(225deg,#ccc 25%,transparent 25%),linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(315deg,#ccc 25%,transparent 25%)' : undefined,
                    backgroundSize: !value ? '8px 8px' : undefined,
                    backgroundPosition: !value ? '0 0,0 4px,4px -4px,-4px 0' : undefined,
                  }} />
              ))}
              <label className="w-10 h-10 rounded-lg border-2 flex items-center justify-center cursor-pointer hover:scale-110 transition-all relative overflow-hidden"
                style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs select-none" style={{ color: 'var(--color-text)', opacity: 0.5 }}>自</span>
                <input type="color" className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => updateBg({ type: 'color', value: e.target.value })} />
              </label>
            </div>

            <div className="flex gap-2 mb-2">
              <label className="flex-1 text-xs px-2 py-1.5 rounded-lg text-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                上传图片
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <div className="flex gap-2 mb-3">
              <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="或粘贴图片 URL…"
                className="flex-1 text-xs bg-transparent outline-none px-2 py-1.5 rounded-lg"
                style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
              <button onClick={() => { if (urlInput.trim()) updateBg({ type: 'image', imageData: urlInput.trim() }) }}
                className="px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>套用</button>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                透明度 <span style={{ color: 'var(--color-primary)' }}>{Math.round(bg.opacity * 100)}%</span>
                <input type="range" min={0.05} max={1} step={0.05} value={bg.opacity}
                  onChange={e => updateBg({ opacity: Number(e.target.value) })}
                  className="flex-1 accent-[var(--color-primary)]" />
              </label>

              {/* Image position sliders — only when image bg is active */}
              {bg.type === 'image' && bg.imageData && (
                <>
                  <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                    位置 X <span style={{ color: 'var(--color-primary)' }}>{bg.posX ?? 50}%</span>
                    <input type="range" min={0} max={100} step={1} value={bg.posX ?? 50}
                      onChange={e => updateBg({ posX: Number(e.target.value) })}
                      className="flex-1 accent-[var(--color-primary)]" />
                  </label>
                  <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                    位置 Y <span style={{ color: 'var(--color-primary)' }}>{bg.posY ?? 50}%</span>
                    <input type="range" min={0} max={100} step={1} value={bg.posY ?? 50}
                      onChange={e => updateBg({ posY: Number(e.target.value) })}
                      className="flex-1 accent-[var(--color-primary)]" />
                  </label>
                </>
              )}

              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                <span>尺寸</span>
                {(['cover', 'contain', 'auto'] as const).map(s => (
                  <button key={s} onClick={() => updateBg({ size: s })}
                    className="px-2 py-0.5 rounded text-xs transition-colors"
                    style={{
                      backgroundColor: bg.size === s ? 'var(--color-primary)' : 'var(--color-border)',
                      color: bg.size === s ? 'white' : 'var(--color-text)',
                    }}>
                    {s === 'cover' ? '铺满' : s === 'contain' ? '适应' : '原始'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
