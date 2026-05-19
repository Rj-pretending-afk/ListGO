import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { Module } from '../../types/list.types'

interface AddModuleButtonProps {
  onAdd: (type: Module['type']) => void
}

const OPTIONS: { type: Module['type']; label: string; icon: string }[] = [
  { type: 'todo', label: '待办列表', icon: '✅' },
  { type: 'vote', label: '投票', icon: '📊' },
  { type: 'text', label: '文本', icon: '📝' },
]

export function AddModuleButton({ onAdd }: AddModuleButtonProps) {
  const [open, setOpen] = useState(false)

  const handleAdd = (type: Module['type']) => {
    onAdd(type)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm w-full justify-center transition-opacity hover:opacity-70"
        style={{
          backgroundColor: 'var(--color-card)',
          color: 'var(--color-text)',
          border: '1.5px dashed var(--color-border)',
          opacity: open ? 1 : 0.8,
        }}
      >
        {open ? <X size={15} /> : <Plus size={15} />}
        {open ? '收起' : '+ 添加模块'}
      </button>

      {open && (
        <div
          className="mt-1 rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          {OPTIONS.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => handleAdd(type)}
              className="flex items-center gap-3 px-4 py-3 w-full text-sm text-left hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
