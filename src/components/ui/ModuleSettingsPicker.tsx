import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Settings, X } from 'lucide-react'
import { resizeDataUrl } from '../../lib/imageUtils'
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
  { label: '系统默认', value: '' },
  { label: '黑体', value: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif" },
  { label: '宋体', value: "'SimSun', 'STSong', Georgia, serif" },
  { label: '楷体', value: "'KaiTi', 'STKaiti', cursive" },
  { label: '等宽', value: "'Courier New', Consolas, monospace" },
  { label: '圆体', value: "'PingFang SC', 'Hiragino Sans GB', 'Segoe UI', sans-serif" },
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
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 })
  const [urlInput, setUrlInput] = useState('')
  const btnRef = useRef<HTMLButtonElement>(null)

  const bg = background ?? DEFAULT_BG
  const font = fontSettings ?? {}

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      // Panel max-height is 82vh; if too close to bottom, cap top so it stays visible
      const maxTop = window.innerHeight - Math.min(window.innerHeight * 0.82, 600) - 8
      setPanelPos({
        top: Math.min(r.bottom + 4, Math.max(8, maxTop)),
        right: Math.max(4, window.innerWidth - r.right),
      })
    }
    setOpen(v => !v)
  }

  const updateBg = (patch: Partial<ModuleBackground>) => onBgChange({ ...bg, ...patch })
  const updateFont = (patch: Partial<ModuleFontSettings>) => {
    const next = { ...font, ...patch }
    onFontChange(!next.size && !next.family && !next.color ? undefined : next)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      if (!ev.target?.result) return
      const resized = await resizeDataUrl(ev.target.result as string)
      updateBg({ type: 'image', imageData: resized })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const hasBg = background && (background.imageData || (background.type === 'color' && background.value))
  const hasFont = fontSettings && (fontSettings.size || fontSettings.family || fontSettings.color)

  const panel = (
    <>
      <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />
      <div
        className="fixed z-[201] rounded-xl shadow-2xl overflow-y-auto"
        style={{
          top: panelPos.top,
          right: panelPos.right,
          width: '18rem',
          maxHeight: '82vh',
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>模块设置</span>
            <button onClick={() => setOpen(false)} style={{ color: 'var(--color-text)', opacity: 0.4 }}>
              <X size={14} />
            </button>
          </div>

          {/* ── 字体 ── */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text)', opacity: 0.55 }}>字体</p>

            {/* Size */}
            <div className="flex gap-1 mb-2">
              {FONT_SIZES.map(({ label, value }) => (
                <button key={label} onClick={() => updateFont({ size: font.size === value ? undefined : value })}
                  className="flex-1 py-1 rounded text-xs transition-colors"
                  style={{
                    backgroundColor: font.size === value ? 'var(--color-primary)' : 'var(--color-border)',
                    color: font.size === value ? 'white' : 'var(--color-text)',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Family — scrollable select */}
            <select
              value={font.family || ''}
              onChange={e => updateFont({ family: e.target.value })}
              className="w-full text-xs rounded-lg outline-none px-2 py-1.5 mb-2"
              style={{
                backgroundColor: 'var(--color-border)',
                color: 'var(--color-text)',
                border: 'none',
              }}
            >
              {FONT_FAMILIES.map(({ label, value }) => (
                <option key={label} value={value} style={{ fontFamily: value || undefined }}>
                  {label}
                </option>
              ))}
            </select>

            {/* Color */}
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.5 }}>文字颜色</span>
              <label className="w-7 h-7 rounded overflow-hidden cursor-pointer border-2 relative flex-shrink-0"
                style={{ borderColor: 'var(--color-border)', backgroundColor: font.color || 'transparent' }}>
                <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  value={font.color || '#ffffff'}
                  onChange={e => updateFont({ color: e.target.value })} />
              </label>
              {font.color && (
                <button className="text-xs hover:opacity-70" style={{ color: '#ef4444' }}
                  onClick={() => updateFont({ color: undefined })}>清除</button>
              )}
              {hasFont && (
                <button className="text-xs hover:opacity-70 ml-auto" style={{ color: '#ef4444' }}
                  onClick={() => onFontChange(undefined)}>重置字体</button>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)' }} />

          {/* ── 背景 ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: 'var(--color-text)', opacity: 0.55 }}>背景</p>
              {hasBg && (
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
                  }} />
              ))}
              <label className="w-10 h-10 rounded-lg border-2 flex items-center justify-center cursor-pointer hover:scale-110 transition-all relative overflow-hidden"
                style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs select-none" style={{ color: 'var(--color-text)', opacity: 0.5 }}>自</span>
                <input type="color" className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => updateBg({ type: 'color', value: e.target.value })} />
              </label>
            </div>

            <label className="block text-xs px-2 py-1.5 rounded-lg text-center cursor-pointer hover:opacity-80 mb-2"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
              上传背景图
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>

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

              {bg.type === 'image' && bg.imageData && (
                <>
                  {/* Image size slider — overrides cover/contain/auto */}
                  <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                    图片大小 <span style={{ color: 'var(--color-primary)' }}>{bg.sizePercent ?? 100}%</span>
                    <input type="range" min={10} max={300} step={5} value={bg.sizePercent ?? 100}
                      onChange={e => updateBg({ sizePercent: Number(e.target.value) })}
                      className="flex-1 accent-[var(--color-primary)]" />
                  </label>
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

              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                <span>填充</span>
                {(['cover', 'contain', 'auto'] as const).map(s => (
                  /* Selecting a preset clears the sizePercent override */
                  <button key={s} onClick={() => updateBg({ size: s, sizePercent: undefined })}
                    className="px-2 py-0.5 rounded text-xs transition-colors"
                    style={{
                      backgroundColor: bg.size === s && !bg.sizePercent ? 'var(--color-primary)' : 'var(--color-border)',
                      color: bg.size === s && !bg.sizePercent ? 'white' : 'var(--color-text)',
                    }}>
                    {s === 'cover' ? '铺满' : s === 'contain' ? '适应' : '原始'}
                  </button>
                ))}
              </div>
            </div>
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
        className="p-1 rounded hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text)', opacity: (hasBg || hasFont) ? 0.8 : 0.3 }}
        title="模块设置"
      >
        <Settings size={14} />
      </button>

      {open && createPortal(panel, document.body)}
    </div>
  )
}
