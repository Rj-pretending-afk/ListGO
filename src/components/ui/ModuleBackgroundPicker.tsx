import { useState } from 'react'
import { ImageIcon, X } from 'lucide-react'
import type { ModuleBackground } from '../../types/list.types'

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

const DEFAULT_BG: ModuleBackground = { type: 'color', value: '', opacity: 0.85, size: 'cover' }

interface ModuleBackgroundPickerProps {
  background?: ModuleBackground
  onChange: (bg: ModuleBackground | undefined) => void
}

export function ModuleBackgroundPicker({ background, onChange }: ModuleBackgroundPickerProps) {
  const [open, setOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const bg = background ?? DEFAULT_BG

  const update = (patch: Partial<ModuleBackground>) =>
    onChange({ ...bg, ...patch })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      if (ev.target?.result) onChange({ ...bg, type: 'image', imageData: ev.target.result as string })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="p-1 rounded hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text)', opacity: background ? 0.8 : 0.3 }}
        title="模块背景"
      >
        <ImageIcon size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-8 z-30 rounded-xl p-4 w-72 shadow-xl"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>模块背景</span>
              <div className="flex items-center gap-2">
                {background && (
                  <button
                    onClick={() => { onChange(undefined); setOpen(false) }}
                    className="text-xs hover:opacity-70"
                    style={{ color: '#ef4444' }}
                  >
                    清除
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Color presets */}
            <p className="text-xs mb-2" style={{ color: 'var(--color-text)', opacity: 0.5 }}>颜色</p>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_COLORS.map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => update({ type: 'color', value })}
                  title={label}
                  className="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: value || undefined,
                    borderColor: bg.type === 'color' && bg.value === value ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundImage: !value
                      ? 'linear-gradient(135deg,#ccc 25%,transparent 25%),linear-gradient(225deg,#ccc 25%,transparent 25%),linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(315deg,#ccc 25%,transparent 25%)'
                      : undefined,
                    backgroundSize: !value ? '8px 8px' : undefined,
                    backgroundPosition: !value ? '0 0,0 4px,4px -4px,-4px 0' : undefined,
                  }}
                />
              ))}
              <label
                className="w-10 h-10 rounded-lg border-2 flex items-center justify-center cursor-pointer hover:scale-110 transition-all relative overflow-hidden"
                style={{ borderColor: 'var(--color-border)' }}
                title="自定义"
              >
                <span className="text-xs select-none" style={{ color: 'var(--color-text)', opacity: 0.5 }}>自</span>
                <input type="color" className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => update({ type: 'color', value: e.target.value })} />
              </label>
            </div>

            {/* Image upload + URL */}
            <p className="text-xs mb-2" style={{ color: 'var(--color-text)', opacity: 0.5 }}>背景图</p>
            <div className="flex gap-2 mb-3">
              <label className="flex-1 text-xs px-2 py-1.5 rounded-lg text-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                上传图片
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="或粘贴图片 URL…"
                className="flex-1 text-xs bg-transparent outline-none px-2 py-1.5 rounded-lg"
                style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              />
              <button
                onClick={() => { if (urlInput.trim()) update({ type: 'image', imageData: urlInput.trim() }) }}
                className="px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                套用
              </button>
            </div>

            {/* Opacity + size */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                透明度 <span style={{ color: 'var(--color-primary)' }}>{Math.round(bg.opacity * 100)}%</span>
                <input type="range" min={0.05} max={1} step={0.05} value={bg.opacity}
                  onChange={e => update({ opacity: Number(e.target.value) })}
                  className="flex-1 accent-[var(--color-primary)]" />
              </label>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                <span>尺寸</span>
                {(['cover', 'contain', 'auto'] as const).map(s => (
                  <button key={s} onClick={() => update({ size: s })}
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
