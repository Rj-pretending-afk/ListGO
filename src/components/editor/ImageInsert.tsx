import { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'

interface ImageInsertProps {
  onInsert: (url: string) => void
}

export function ImageInsert({ onInsert }: ImageInsertProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')

  const handleInsert = () => {
    const trimmed = url.trim()
    if (trimmed) { onInsert(trimmed); setUrl('') }
    setOpen(false)
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text)', opacity: 0.45 }}
        title="插入图片 URL"
      >
        <ImagePlus size={13} />
        插图
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-8 z-20 rounded-xl p-3 w-72 shadow-lg"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
                图片 URL
              </span>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                <X size={13} />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                autoFocus
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleInsert(); if (e.key === 'Escape') setOpen(false) }}
                placeholder="https://..."
                className="flex-1 text-xs bg-transparent outline-none px-2 py-1.5 rounded-lg"
                style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              />
              <button
                onClick={handleInsert}
                className="px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                插入
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
