import { Bold, Italic, Underline, Strikethrough } from 'lucide-react'

interface BubbleToolbarProps {
  onFormat: (cmd: string, value?: string) => void
  compact?: boolean
}

const FORMAT_BTNS = [
  { cmd: 'bold', icon: Bold, label: '粗体' },
  { cmd: 'italic', icon: Italic, label: '斜体' },
  { cmd: 'underline', icon: Underline, label: '下划线' },
  { cmd: 'strikeThrough', icon: Strikethrough, label: '删除线' },
] as const

const SIZE_BTNS = [
  { label: '小', value: '1' },
  { label: '中', value: '3' },
  { label: '大', value: '5' },
]

export function BubbleToolbar({ onFormat, compact = false }: BubbleToolbarProps) {
  const btnClass = compact
    ? 'w-7 h-7 rounded flex items-center justify-center hover:opacity-70 transition-opacity'
    : 'w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity'

  return (
    <div
      className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg"
      style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      onMouseDown={e => e.preventDefault()} // 防止失焦，保留 contenteditable 选区
    >
      {FORMAT_BTNS.map(({ cmd, icon: Icon, label }) => (
        <button
          key={cmd}
          onClick={() => onFormat(cmd)}
          className={btnClass}
          style={{ color: 'var(--color-text)' }}
          title={label}
        >
          <Icon size={compact ? 12 : 14} />
        </button>
      ))}

      <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

      {SIZE_BTNS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onFormat('fontSize', value)}
          className={`${btnClass} text-xs font-medium`}
          style={{ color: 'var(--color-text)' }}
          title={`字号：${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
