import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { Module } from '../../types/list.types'
import { useT } from '../../hooks/useLang'

interface AddModuleButtonProps {
  onAdd: (type: Module['type']) => void
}

export function AddModuleButton({ onAdd }: AddModuleButtonProps) {
  const t = useT()
  const [open, setOpen] = useState(false)

  const OPTIONS: { type: Module['type']; label: string; icon: string }[] = [
    { type: 'todo', label: t('moduleTypeTodo'), icon: '✅' },
    { type: 'vote', label: t('moduleTypeVote'), icon: '📊' },
    { type: 'text', label: t('moduleTypeText'), icon: '📝' },
  ]

  const handleAdd = (type: Module['type']) => { onAdd(type); setOpen(false) }

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm w-full justify-center transition-opacity hover:opacity-70"
        style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)', border: '1.5px dashed var(--color-border)', opacity: open ? 1 : 0.8 }}>
        {open ? <X size={15} /> : <Plus size={15} />}
        {open ? t('collapseMenu') : t('addModule')}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20 sm:hidden" onClick={() => setOpen(false)}
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
          <div className="fixed bottom-0 left-0 right-0 z-30 rounded-t-2xl pb-safe sm:static sm:rounded-xl sm:pb-0 sm:mt-1 sm:bottom-auto sm:left-auto sm:right-auto sm:z-auto overflow-hidden"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <div className="h-1 w-10 rounded-full mx-auto mt-3 mb-1 sm:hidden"
              style={{ backgroundColor: 'var(--color-border)' }} />
            {OPTIONS.map(({ type, label, icon }) => (
              <button key={type} onClick={() => handleAdd(type)}
                className="flex items-center gap-3 px-5 w-full text-sm text-left hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', minHeight: '52px' }}>
                <span>{icon}</span><span>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
