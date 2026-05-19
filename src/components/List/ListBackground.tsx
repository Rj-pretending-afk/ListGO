import { useState } from 'react'
import { ImageIcon, X } from 'lucide-react'
import type { ListBackground as ListBackgroundType } from '../../types/list.types'

const PRESET_COLORS = [
  { label: '默认', value: '' },
  { label: '暖米', value: '#FDF6EC' },
  { label: '薄荷', value: '#ECFDF5' },
  { label: '天蓝', value: '#EFF6FF' },
  { label: '浅紫', value: '#F5F3FF' },
  { label: '蜜桃', value: '#FFF1F2' },
  { label: '浅灰', value: '#F9FAFB' },
  { label: '墨绿', value: '#ECFDF5' },
  { label: '深灰', value: '#1F2937' },
]

interface ListBackgroundProps {
  background: ListBackgroundType
  onChange: (bg: ListBackgroundType) => void
}

export function ListBackground({ background, onChange }: ListBackgroundProps) {
  const [open, setOpen] = useState(false)
  const [urlInput, setUrlInput] = useState(
    background.type === 'image' ? background.url : ''
  )

  const currentColor = background.type === 'color' ? background.value : ''

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:opacity-70 transition-opacity flex items-center gap-1 text-xs"
        style={{ color: 'var(--color-text)', opacity: 0.6 }}
        title="设置背景"
      >
        <ImageIcon size={14} />
        背景
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div
            className="absolute left-0 top-9 z-20 rounded-xl p-4 w-72 shadow-lg"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
                背景色
              </span>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                <X size={14} />
              </button>
            </div>

            {/* Color presets */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_COLORS.map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => onChange({ type: 'color', value })}
                  title={label}
                  className="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: value || 'transparent',
                    borderColor: currentColor === value ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundImage: !value
                      ? 'linear-gradient(135deg, #ccc 25%, transparent 25%), linear-gradient(225deg, #ccc 25%, transparent 25%), linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(315deg, #ccc 25%, transparent 25%)'
                      : undefined,
                    backgroundSize: !value ? '8px 8px' : undefined,
                  }}
                />
              ))}

              {/* Custom color picker */}
              <label
                className="w-10 h-10 rounded-lg border-2 overflow-hidden cursor-pointer hover:scale-110 transition-all flex items-center justify-center"
                style={{ borderColor: 'var(--color-border)' }}
                title="自定义颜色"
              >
                <span className="text-xs select-none" style={{ color: 'var(--color-text)', opacity: 0.5 }}>自</span>
                <input
                  type="color"
                  className="absolute opacity-0 w-0 h-0"
                  onChange={e => onChange({ type: 'color', value: e.target.value })}
                />
              </label>
            </div>

            {/* Image URL */}
            <p className="text-xs mb-2" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
              背景图 URL
            </p>
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 text-xs bg-transparent outline-none px-2 py-1.5 rounded-lg"
                style={{
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              />
              <button
                onClick={() => {
                  if (urlInput.trim()) onChange({ type: 'image', url: urlInput.trim() })
                  else onChange({ type: 'color', value: '' })
                }}
                className="px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                套用
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
