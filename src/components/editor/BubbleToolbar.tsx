import { Bold, Italic, Underline, Strikethrough } from 'lucide-react'

interface BubbleToolbarProps {
  onFormat: (cmd: string, value?: string) => void
}

const ACTIONS = [
  { cmd: 'bold', icon: Bold, label: '粗体' },
  { cmd: 'italic', icon: Italic, label: '斜体' },
  { cmd: 'underline', icon: Underline, label: '下划线' },
  { cmd: 'strikeThrough', icon: Strikethrough, label: '删除线' },
] as const

const SIZES = [
  { label: '小', value: '1' },
  { label: '正', value: '3' },
  { label: '大', value: '5' },
]

export function BubbleToolbar({ onFormat }: BubbleToolbarProps) {
  return (
    <div
      className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-lg"
      style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      onMouseDown={e => e.preventDefault()} // 防止工具栏点击让 contenteditable 失焦
    >
      {ACTIONS.map(({ cmd, icon: Icon, label }) => (
        <button
          key={cmd}
          onClick={() => onFormat(cmd)}
          className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text)' }}
          title={label}
        >
          <Icon size={13} />
        </button>
      ))}

      <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

      {SIZES.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onFormat('fontSize', value)}
          className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70 transition-opacity text-xs font-medium"
          style={{ color: 'var(--color-text)' }}
          title={`字号：${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
