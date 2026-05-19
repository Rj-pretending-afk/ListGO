import { Bold, Italic, Underline, Strikethrough } from 'lucide-react'
import { useT } from '../../hooks/useLang'

interface BubbleToolbarProps { onFormat: (cmd: string, value?: string) => void; compact?: boolean }

export function BubbleToolbar({ onFormat, compact = false }: BubbleToolbarProps) {
  const t = useT()

  const FORMAT_BTNS = [
    { cmd: 'bold',          icon: Bold,          label: t('fmtBold') },
    { cmd: 'italic',        icon: Italic,         label: t('fmtItalic') },
    { cmd: 'underline',     icon: Underline,      label: t('fmtUnderline') },
    { cmd: 'strikeThrough', icon: Strikethrough,  label: t('fmtStrike') },
  ] as const

  const SIZE_BTNS = [
    { label: t('fmtSizeSmall'),  value: '1' },
    { label: t('fmtSizeMedium'), value: '3' },
    { label: t('fmtSizeLarge'),  value: '5' },
  ]

  const btnCls = compact
    ? 'w-7 h-7 rounded flex items-center justify-center hover:opacity-70 transition-opacity'
    : 'w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity'

  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg"
      style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      onMouseDown={e => e.preventDefault()}>
      {FORMAT_BTNS.map(({ cmd, icon: Icon, label }) => (
        <button key={cmd} onClick={() => onFormat(cmd)} className={btnCls} style={{ color: 'var(--color-text)' }} title={label}>
          <Icon size={compact ? 12 : 14} />
        </button>
      ))}
      <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />
      {SIZE_BTNS.map(({ label, value }) => (
        <button key={value} onClick={() => onFormat('fontSize', value)}
          className={`${btnCls} text-xs font-medium`} style={{ color: 'var(--color-text)' }}>
          {label}
        </button>
      ))}
    </div>
  )
}
