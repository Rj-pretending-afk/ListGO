import { useState } from 'react'
import { Check, Trash2, Plus } from 'lucide-react'
import { generateItemId } from '../../lib/shortid'
import type { TodoModule as TodoModuleType, TodoItem } from '../../types/list.types'
import { IMEInput } from '../ui/IMEInput'
import { useT } from '../../hooks/useLang'
import { contentFontStyle } from '../../lib/contentFontStyle'
import type { ContentFontSettings } from '../../types/list.types'

interface TodoModuleProps {
  module: TodoModuleType
  onChange: (module: TodoModuleType) => void
  contentFontSettings?: ContentFontSettings
  canEdit?: boolean
}

export function TodoModule({ module, onChange, contentFontSettings, canEdit = true }: TodoModuleProps) {
  const t = useT()
  const [newText, setNewText] = useState('')
  const update = (patch: Partial<TodoModuleType>) => onChange({ ...module, ...patch })
  const cfStyle = contentFontStyle(contentFontSettings)

  const addItem = () => {
    const text = newText.trim()
    if (!text) return
    update({ items: [...module.items, { id: generateItemId(), text, done: false } as TodoItem] })
    setNewText('')
  }

  return (
    <div className="space-y-1">
      {module.items.map(item => (
        <div key={item.id} className="flex items-center gap-2 group py-0.5">
          {/* 44×44 touch target, visually 20×20 */}
          <button
            onClick={() => update({ items: module.items.map(it => it.id === item.id ? { ...it, done: !it.done } : it) })}
            className="flex-shrink-0 flex items-center justify-center"
            style={{ width: 44, height: 44, margin: -12 }}>
            <span
              className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
              style={{ borderColor: item.done ? 'var(--color-primary)' : 'var(--color-border)', backgroundColor: item.done ? 'var(--color-primary)' : 'transparent' }}>
              {item.done && <Check size={11} color="white" strokeWidth={3} />}
            </span>
          </button>
          <IMEInput value={item.text}
            onChange={canEdit ? (v => update({ items: module.items.map(it => it.id === item.id ? { ...it, text: v } : it) })) : (() => undefined)}
            onKeyDown={canEdit ? (e => !e.nativeEvent.isComposing && e.key === 'Enter' && addItem()) : undefined}
            readOnly={!canEdit}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ ...cfStyle, color: cfStyle.color ?? 'var(--color-text)', opacity: item.done ? 0.45 : 1, textDecoration: item.done ? 'line-through' : cfStyle.textDecoration }} />
          {canEdit && (
            <button onClick={() => update({ items: module.items.filter(it => it.id !== item.id) })}
              className="opacity-20 group-hover:opacity-100 [@media(hover:none)]:opacity-50 transition-opacity flex-shrink-0 p-2 -m-2"
              style={{ color: 'var(--color-text)' }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}

      {canEdit && (
        <div className="flex items-center gap-2 pt-1">
          <div className="w-5 h-5 flex-shrink-0" />
          <input value={newText} onChange={e => setNewText(e.target.value)}
            onKeyDown={e => !e.nativeEvent.isComposing && e.key === 'Enter' && addItem()}
            placeholder={t('todoNewItem')}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--color-text)', opacity: 0.4 }} />
          {newText.trim() && (
            <button onClick={addItem} className="flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
              <Plus size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
