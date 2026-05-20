import { useState } from 'react'

interface ListTitleProps {
  title: string
  onSave: (title: string) => void
}

export function ListTitle({ title, onSave }: ListTitleProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)

  const save = () => {
    const trimmed = value.trim()
    if (trimmed) onSave(trimmed)
    else setValue(title)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          // 输入法组合期间忽略所有快捷键，避免截获确认候选字的 Enter/Space
          if (e.nativeEvent.isComposing || e.keyCode === 229) return
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') { setValue(title); setEditing(false) }
        }}
        className="text-xl font-bold bg-transparent outline-none flex-1 min-w-0"
        style={{ color: 'var(--color-text)' }}
      />
    )
  }

  return (
    <h1
      onClick={() => { setValue(title); setEditing(true) }}
      className="text-xl font-bold cursor-text truncate flex-1 min-w-0 hover:opacity-80 transition-opacity"
      style={{ color: 'var(--color-text)' }}
      title="点击编辑标题"
    >
      {title || '无标题'}
    </h1>
  )
}
