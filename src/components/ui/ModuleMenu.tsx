import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Trash2, Users, Lock } from 'lucide-react'
import { useT } from '../../hooks/useLang'
import type { ModuleEditPermission } from '../../types/list.types'

interface ModuleMenuProps {
  editPermission?: ModuleEditPermission
  onEditPermChange: (perm: ModuleEditPermission) => void
  onDelete: () => void
}

export function ModuleMenu({ editPermission = 'owner_only', onEditPermChange, onDelete }: ModuleMenuProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) { setConfirming(false); return }
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) { setOpen(false); setConfirming(false) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const isPublic = editPermission === 'public'

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1 rounded hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text)', opacity: 0.45 }}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-7 z-20 rounded-xl py-1 min-w-[168px] shadow-lg"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          {/* Edit permission toggle */}
          <button
            onClick={() => onEditPermChange(isPublic ? 'owner_only' : 'public')}
            className="flex items-center gap-2 px-3 py-2 w-full text-xs hover:opacity-70 transition-opacity text-left"
            style={{ color: isPublic ? 'var(--color-primary)' : 'var(--color-text)', opacity: isPublic ? 1 : 0.6 }}
          >
            {isPublic ? <Users size={13} /> : <Lock size={13} />}
            {isPublic ? t('moduleEditPermPublic') : t('moduleEditPermOwner')}
          </button>

          <div className="my-1" style={{ borderTop: '1px solid var(--color-border)', opacity: 0.5 }} />

          {/* Delete with inline confirmation */}
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-2 px-3 py-2 w-full text-xs hover:opacity-70 transition-opacity text-left"
              style={{ color: '#ef4444' }}
            >
              <Trash2 size={13} /> {t('deleteModule')}
            </button>
          ) : (
            <div className="px-3 py-2 space-y-2">
              <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.55 }}>
                {t('confirmDelete')}？
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { onDelete(); setOpen(false) }}
                  className="text-xs font-medium hover:opacity-80"
                  style={{ color: '#ef4444' }}
                >
                  {t('confirmDelete')}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-xs hover:opacity-80"
                  style={{ color: 'var(--color-text)', opacity: 0.45 }}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
