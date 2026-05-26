import { useState } from 'react'
import { createPortal } from 'react-dom'
import { claimApi } from '../../lib/api'
import { useAppStore } from '../../lib/store'
import { getOwnerToken } from '../../lib/ownerToken'
import { useT } from '../../hooks/useLang'
import type { List } from '../../types/list.types'

interface ClaimDialogProps {
  userId: string
  anonymousLists: List[]
  onDone: () => void
}

export function ClaimDialog({ userId, anonymousLists, onDone }: ClaimDialogProps) {
  const t = useT()
  const claimLists = useAppStore(s => s.claimLists)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(anonymousLists.map(l => l.id))
  )
  const [loading, setLoading] = useState(false)

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleClaim = async () => {
    const ids = [...selected]
    if (ids.length === 0) { onDone(); return }
    setLoading(true)
    try {
      const ownerToken = getOwnerToken()
      await claimApi.claim(ownerToken, ids)
      await claimLists(ids, userId)
    } catch { /* cloud claim failed — local state still updated */ }
    finally { setLoading(false); onDone() }
  }

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <div>
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            {t('claimTitle')}
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
            {t('claimSubtitle')}
          </p>
        </div>

        {anonymousLists.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
            {t('claimEmpty')}
          </p>
        ) : (
          <ul className="space-y-2 max-h-52 overflow-y-auto">
            {anonymousLists.map(list => (
              <li key={list.id}>
                <label className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: 'var(--color-border)' }}>
                  <input
                    type="checkbox"
                    checked={selected.has(list.id)}
                    onChange={() => toggle(list.id)}
                    className="accent-[var(--color-primary)] w-4 h-4 flex-shrink-0"
                  />
                  <span className="text-sm truncate" style={{ color: 'var(--color-text)' }}>
                    {list.title}
                  </span>
                  <span className="text-xs ml-auto flex-shrink-0" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                    {list.modules.length}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onDone} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm hover:opacity-70 disabled:opacity-30"
            style={{ color: 'var(--color-text)', opacity: 0.6 }}>
            {t('claimSkip')}
          </button>
          <button onClick={handleClaim} disabled={loading || selected.size === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium btn-primary hover:opacity-80 disabled:opacity-35"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            {loading ? t('claimLoading') : t('claimConfirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
