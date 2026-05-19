import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useT } from '../../hooks/useLang'

interface ModuleMenuProps { onDelete: () => void }

export function ModuleMenu({ onDelete }: ModuleMenuProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen(v => !v)}
        className="p-1 rounded hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text)', opacity: 0.45 }}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-20 rounded-xl py-1 min-w-[120px] shadow-lg"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <button onClick={() => { onDelete(); setOpen(false) }}
            className="flex items-center gap-2 px-3 py-2 w-full text-sm hover:opacity-70 transition-opacity text-left"
            style={{ color: '#ef4444' }}>
            <Trash2 size={13} />{t('deleteModule')}
          </button>
        </div>
      )}
    </div>
  )
}
