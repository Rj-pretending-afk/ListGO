import { Crop, Trash2 } from 'lucide-react'

interface ImageControlsProps {
  imgEl: HTMLImageElement
  rect: DOMRect
  onCrop: () => void
  onRemove: () => void
  onWidthChange: (w: number) => void
}

export function ImageControls({ imgEl, rect, onCrop, onRemove, onWidthChange }: ImageControlsProps) {
  const currentWidth = Math.round(imgEl.clientWidth)
  const maxWidth = Math.min(800, window.innerWidth - 80)

  return (
    <div
      className="fixed z-40 rounded-xl px-3 py-2 shadow-lg flex items-center gap-3 flex-wrap"
      style={{
        top: rect.bottom + 6,
        left: Math.max(4, Math.min(window.innerWidth - 320, rect.left)),
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
        宽度
        <input
          type="range"
          min={50}
          max={maxWidth}
          value={currentWidth}
          onChange={e => onWidthChange(Number(e.target.value))}
          className="w-24"
        />
        <span className="w-12 tabular-nums">{currentWidth}px</span>
      </label>
      <button
        onClick={onCrop}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text)' }}
      >
        <Crop size={12} /> 裁剪
      </button>
      <button
        onClick={onRemove}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-70 transition-opacity"
        style={{ color: '#ef4444' }}
      >
        <Trash2 size={12} /> 移除
      </button>
    </div>
  )
}
