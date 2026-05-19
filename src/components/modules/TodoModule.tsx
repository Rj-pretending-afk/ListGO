import { useState } from 'react'
import { Check, Trash2, Plus } from 'lucide-react'
import { generateItemId } from '../../lib/shortid'
import type { TodoModule as TodoModuleType, TodoItem } from '../../types/list.types'

interface TodoModuleProps {
  module: TodoModuleType
  onChange: (module: TodoModuleType) => void
}

export function TodoModule({ module, onChange }: TodoModuleProps) {
  const [newText, setNewText] = useState('')

  const update = (patch: Partial<TodoModuleType>) => onChange({ ...module, ...patch })

  const addItem = () => {
    const text = newText.trim()
    if (!text) return
    const item: TodoItem = { id: generateItemId(), text, done: false }
    update({ items: [...module.items, item] })
    setNewText('')
  }

  const toggleItem = (id: string) =>
    update({ items: module.items.map(it => it.id === id ? { ...it, done: !it.done } : it) })

  const deleteItem = (id: string) =>
    update({ items: module.items.filter(it => it.id !== id) })

  const updateText = (id: string, text: string) =>
    update({ items: module.items.map(it => it.id === id ? { ...it, text } : it) })

  return (
    <div className="space-y-1">
      {/* Optional subtitle */}
      <input
        value={module.subtitle ?? ''}
        onChange={e => update({ subtitle: e.target.value })}
        placeholder="小标题（可选）"
        className="w-full bg-transparent outline-none text-xs font-medium mb-2"
        style={{ color: 'var(--color-text)', opacity: 0.5 }}
      />

      {module.items.map(item => (
        <div key={item.id} className="flex items-center gap-2 group py-0.5">
          <button
            onClick={() => toggleItem(item.id)}
            className="w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors"
            style={{
              borderColor: item.done ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: item.done ? 'var(--color-primary)' : 'transparent',
            }}
          >
            {item.done && <Check size={11} color="white" strokeWidth={3} />}
          </button>
          <input
            value={item.text}
            onChange={e => updateText(item.id, e.target.value)}
            onKeyDown={e => !e.nativeEvent.isComposing && e.key === 'Enter' && addItem()}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{
              color: 'var(--color-text)',
              opacity: item.done ? 0.45 : 1,
              textDecoration: item.done ? 'line-through' : 'none',
            }}
          />
          <button
            onClick={() => deleteItem(item.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            style={{ color: 'var(--color-text)' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      {/* Add row */}
      <div className="flex items-center gap-2 pt-1">
        <div className="w-5 h-5 flex-shrink-0" />
        <input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => !e.nativeEvent.isComposing && e.key === 'Enter' && addItem()}
          placeholder="添加条目…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--color-text)', opacity: 0.4 }}
        />
        {newText.trim() && (
          <button onClick={addItem} className="flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
            <Plus size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
